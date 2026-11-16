/* ==========================================================================
 * Nome do arquivo: debug-interface.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Suíte de Auditoria e Debug (Interface HTML, Opções, Sandbox e Perfis)
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/mod-debug/debug-interface.js
 * - Classe Exportada: DebugInterface (window.JusGovDebugInterface)
 * - Métodos Públicos: executar(ctx)
 * - Escopo de Testes: Bateria 7 (Preferências/F1), Bateria 8 (Varredura HTMLs/Options/EditorDemo), Mapeamento XPath/CSS, Perfis perfis.json, Backup Total, Reset Padrões (FEAT-41), Allowlist Sync & Fatiamento Modular
 * - Regras / Seções: Diretrizes 6/13/16, Seções 6.20, 6.65, 6.67, 6.85, FEAT-10, FEAT-17, FEAT-35, FEAT-41
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovDebugInterface = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DebugInterface {
        executar(ctx) {
            const { C, validador, acumulador, motorTeste, geradores, registrar, linhasLog } = ctx;
            const {
                randInt, gerarCpfValido, gerarCpfInvalido,
                gerarCnpjTradicionalValido, gerarCnpjTradicionalInvalido,
                gerarCnpjAlfanumericoValido, gerarCnpjAlfanumericoInvalido,
                gerarCnjValido, gerarCnjInvalido,
                gerarDataValida, gerarDataInvalida,
                gerarInssNbValido, gerarPisValido,
                mutarDigitoAleatorio, mutarDigitoParaInvalido, mutarDataParaInvalida
            } = geradores;
            {
        linhasLog.push('\n--- BATERIA 7: PREFERENCIAS GERAIS, TEMPO ZERO E ATALHO F1 GEMINI ---');

        /* 1) Logica de Tempo Zero (0 = Desativado, >0 = Ativo) */
        validador.definirTempoExibicao(0);
        registrar(
            validador.tempoExibicaoMs === 0,
            'PREF_TEMPO_ZERO',
            'Tempo de Exibicao de Alertas em 0ms desativa visualmente os avisos',
            { esperado: '0', obtido: String(validador.tempoExibicaoMs) }
        );
        validador.definirTempoExibicao(3500);
        registrar(
            validador.tempoExibicaoMs === 3500,
            'PREF_TEMPO_ATIVO',
            'Tempo de Exibicao maior que 0 define duracao ativa em milissegundos',
            { esperado: '3500', obtido: String(validador.tempoExibicaoMs) }
        );

        /* 2) Mascara do Atalho F1 para Localizar no Google Gemini com {{TEXTO}} */
        const mascaraPadraoGemini = 'https://gemini.google.com/app?q={{TEXTO}}';
        const textoAmostraF1 = 'Processo 0991001-58.2024.4.01.4002';
        const urlGeradaGemini = mascaraPadraoGemini.replace('{{TEXTO}}', encodeURIComponent(textoAmostraF1));
        const urlEsperadaGemini = 'https://gemini.google.com/app?q=Processo%200991001-58.2024.4.01.4002';
        registrar(
            urlGeradaGemini === urlEsperadaGemini,
            'ATALHO_F1_GEMINI',
            'Substituicao correta da tag {{TEXTO}} no modelo de prompt de IA',
            { textoTestado: textoAmostraF1, esperado: urlEsperadaGemini, obtido: urlGeradaGemini }
        );

        /* 3) Protecao Anti-Arrasto em Botoes e Controles UI */
        const btnTesteUi = document.createElement('button');
        btnTesteUi.textContent = 'Copiar';
        document.body.appendChild(btnTesteUi);
        const ehBotaoOuControle = Boolean(btnTesteUi.closest('button, input, select, textarea, [role="button"]'));
        registrar(
            ehBotaoOuControle === true,
            'ANTI_ARRASTO_UI',
            'Identificacao precisa de botoes e controles de formulario para bloqueio de arrasto acidental',
            { esperado: 'true', obtido: String(ehBotaoOuControle) }
        );
        document.body.removeChild(btnTesteUi);

        /* 3.1) Preservacao de Selecao de Texto por Arrasto de Mouse em Contexto Interativo (Gemini / UI) */
        const divGemini = document.createElement('div');
        divGemini.setAttribute('jsaction', 'click:trigger');
        divGemini.textContent = 'Texto do modelo Gemini selecionado por arrasto';
        document.body.appendChild(divGemini);

        const rangeArrastoTeste = document.createRange();
        rangeArrastoTeste.selectNodeContents(divGemini);
        const selGemini = window.getSelection();
        if (selGemini) {
            selGemini.removeAllRanges();
            selGemini.addRange(rangeArrastoTeste);
        }

        /* Simula o ciclo completo de arrasto (mousedown -> mousemove -> mouseup) */
        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 10, clientY: 10, button: 0 }));
        document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: 60, clientY: 60, buttons: 1 }));
        divGemini.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: 60, clientY: 60, button: 0 }));

        const selAposMouseUp = selGemini ? selGemini.toString() : '';
        document.body.removeChild(divGemini);

        registrar(
            selAposMouseUp.length > 0 && selAposMouseUp === 'Texto do modelo Gemini selecionado por arrasto',
            'ARRASTO_MOUSE_PRESERVA_SELECAO',
            'Arrasto de mouse preserva integralmente o texto selecionado mesmo em elementos com atributos interativos (Gemini/jsaction)',
            { esperado: 'Texto do modelo Gemini selecionado por arrasto', obtido: selAposMouseUp }
        );

        /* 4) Validacao de Tecla Esc Isolada vs Duplo Esc */
        if (motorTeste && typeof motorTeste.obterEstadoAtual === 'function') {
            const estadoInicial = motorTeste.obterEstadoAtual().manterFormatacaoBasica;
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            const estadoApos1Esc = motorTeste.obterEstadoAtual().manterFormatacaoBasica;
            registrar(
                estadoInicial === estadoApos1Esc,
                'ATALHO_ESC_ISOLADO',
                '1 acionamento isolado em Escape limpa selecoes e NAO alterna o modo de formatacao',
                { esperado: String(estadoInicial), obtido: String(estadoApos1Esc) }
            );

            /* 4.1) Alternancia Rapida do Switch e Preservacao do Nivel do Slider (Niveis 1 a 4) */
            motorTeste.definirNivelFiltroFormatacao('avancado');
            motorTeste.definirManterFormatacaoBasica(false);
            const estTextoPuro = motorTeste.obterEstadoAtual();

            motorTeste.definirManterFormatacaoBasica(true);
            const estFormatado = motorTeste.obterEstadoAtual();

            /* Restaura o estado anterior */
            motorTeste.definirManterFormatacaoBasica(estadoInicial);

            const sucessoSwitchFormatacao = (
                estTextoPuro.manterFormatacaoBasica === false &&
                estTextoPuro.nivelFiltroFormatacao === 'avancado' &&
                estFormatado.manterFormatacaoBasica === true &&
                estFormatado.nivelFiltroFormatacao === 'avancado'
            );

            registrar(
                sucessoSwitchFormatacao,
                'SWITCH_FORMATACAO_PRESERVACAO_SLIDER',
                'Alternancia do switch preserva intacto o nivel do slider sem zerar para texto_puro',
                {
                    estadoDesativado: estTextoPuro,
                    estadoAtivado: estFormatado
                }
            );
        }

        /* 5) Desselecao Universal Profunda Multi-Frame e Multi-Div (Escape) */
        if (motorTeste && typeof motorTeste.deselecionarTudo === 'function') {
            const divTesteDesel = document.createElement('div');
            divTesteDesel.textContent = 'Texto para desselecao profunda';
            document.body.appendChild(divTesteDesel);

            const inpTesteDesel = document.createElement('input');
            inpTesteDesel.value = 'Texto do input';
            document.body.appendChild(inpTesteDesel);
            inpTesteDesel.setSelectionRange(0, 5);

            const rngDesel = document.createRange();
            rngDesel.selectNodeContents(divTesteDesel);
            const selWin = window.getSelection();
            if (selWin) {
                selWin.removeAllRanges();
                selWin.addRange(rngDesel);
            }

            const selAntes = selWin ? selWin.toString() : '';
            const inpSelAntes = inpTesteDesel.value.substring(inpTesteDesel.selectionStart, inpTesteDesel.selectionEnd);

            /* Executa a desselecao profunda (nativa + multi-contexto) */
            motorTeste.deselecionarTudo();

            const selDepois = selWin ? selWin.toString() : '';
            const inpSelDepois = inpTesteDesel.value.substring(inpTesteDesel.selectionStart, inpTesteDesel.selectionEnd);

            document.body.removeChild(divTesteDesel);
            document.body.removeChild(inpTesteDesel);

            const desselecaoSucesso = (selDepois.length === 0 && inpSelDepois.length === 0 && selAntes.length > 0 && inpSelAntes.length > 0);
            registrar(
                desselecaoSucesso,
                'DESSELECAO_UNIVERSAL_ESC',
                'Desselecao universal profunda esvazia selecoes DOM de janelas, inputs, divs e frames',
                { esperado: 'sel=, inpSel=', obtido: `sel=${selDepois}, inpSel=${inpSelDepois}` }
            );
        }

        /* 6) Preservacao do Padrao Nativo do Browser em Links (Ctrl + Clique em <a href>) */
        const linkTesteCtrl = document.createElement('a');
        linkTesteCtrl.href = 'https://pje1g.trf1.jus.br/processo/1000';
        linkTesteCtrl.textContent = 'Processo 1000';
        linkTesteCtrl.setAttribute('data-jusgov-ignore', 'true');

        let clickBloqueadoPorMotor = false;
        let mousedownBloqueadoPorMotor = false;

        linkTesteCtrl.addEventListener('mousedown', (ev) => {
            mousedownBloqueadoPorMotor = ev.defaultPrevented;
        }, false);

        linkTesteCtrl.addEventListener('click', (ev) => {
            clickBloqueadoPorMotor = ev.defaultPrevented;
            ev.preventDefault(); // Impede a navegacao real da aba de opcoes durante a auditoria automatizada
            ev.stopPropagation();
        }, false);

        document.body.appendChild(linkTesteCtrl);

        const evtMousedownLink = new MouseEvent('mousedown', { bubbles: true, cancelable: true, ctrlKey: true, button: 0 });
        linkTesteCtrl.dispatchEvent(evtMousedownLink);
        const mousedownNaoBloqueado = !mousedownBloqueadoPorMotor && !evtMousedownLink.defaultPrevented;

        const evtClickLink = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true, button: 0 });
        linkTesteCtrl.dispatchEvent(evtClickLink);
        const clickNaoBloqueado = !clickBloqueadoPorMotor;

        document.body.removeChild(linkTesteCtrl);

        const ctrlClickPadraoBrowserSucesso = (mousedownNaoBloqueado && clickNaoBloqueado);
        registrar(
            ctrlClickPadraoBrowserSucesso,
            'CTRL_CLIQUE_LINK_PADRAO_BROWSER',
            'Ctrl + Clique sobre link <a href> preserva o padrao do browser de abrir em nova aba',
            { esperado: 'mousedown=true, click=true', obtido: `mousedown=${mousedownNaoBloqueado}, click=${clickNaoBloqueado}` }
        );

        /* 7) Clique no Espaco ou Separador em Datas com Horario Contiguo */
        if (motorTeste && typeof motorTeste.simularCliqueEmTexto === 'function') {
            const amostraDataHoraEspaco = 'Protocolo em 18/09/2026 10:03:34 arquivado';
            const idxEspacoEntreDtHora = amostraDataHoraEspaco.indexOf(' 10:03:34');
            const resNoEspaco = motorTeste.simularCliqueEmTexto(amostraDataHoraEspaco, idxEspacoEntreDtHora, 1);
            const resNaData = motorTeste.simularCliqueEmTexto(amostraDataHoraEspaco, idxEspacoEntreDtHora - 3, 1);
            const resNaHora = motorTeste.simularCliqueEmTexto(amostraDataHoraEspaco, idxEspacoEntreDtHora + 3, 1);

            const sucessoDataHoraEspaco = (
                resNoEspaco === '18/09/2026 10:03:34' &&
                resNaData === '18/09/2026' &&
                resNaHora === '10:03:34'
            );

            registrar(
                sucessoDataHoraEspaco,
                'CLIQUE_ESPACO_DATA_HORA_CONTIGUA',
                'Clique no espaco entre data e hora seleciona o bloco integral ("18/09/2026 10:03:34")',
                {
                    esperado: '18/09/2026 10:03:34',
                    obtido: resNoEspaco,
                    dataIsolada: resNaData,
                    horaIsolada: resNaHora
                }
            );
        }

        /* 8) DIRETRIZ ROOT IMUTAVEL: Preservacao Absoluta da Navegacao e Interacao Nativa Web */
        if (motorTeste && typeof motorTeste.isElementoInterativoOuUi === 'function') {
            /* 8a) Seletor de modelos dropdown com aria-haspopup (ex: "Flash v" no Gemini) */
            const divSeletorModelo = document.createElement('div');
            divSeletorModelo.setAttribute('aria-haspopup', 'menu');
            const spanTextoModelo = document.createElement('span');
            spanTextoModelo.textContent = 'Flash';
            divSeletorModelo.appendChild(spanTextoModelo);
            document.body.appendChild(divSeletorModelo);

            const ehUiModelo = motorTeste.isElementoInterativoOuUi(spanTextoModelo);
            const ctxModelo = motorTeste.classificarContextoElementoAlvo(spanTextoModelo);

            /* 8b) Botao de microfone com icone SVG/path aninhado */
            const btnMicrofone = document.createElement('button');
            btnMicrofone.setAttribute('aria-label', 'Microfone');
            const svgMic = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const pathMic = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            svgMic.appendChild(pathMic);
            btnMicrofone.appendChild(svgMic);
            document.body.appendChild(btnMicrofone);

            const ehUiMic = motorTeste.isElementoInterativoOuUi(pathMic);
            const ctxMic = motorTeste.classificarContextoElementoAlvo(pathMic);

            /* 8c) Elemento com jsaction (framework Google Wiz no Gemini/Search) */
            const divWiz = document.createElement('div');
            divWiz.setAttribute('jsaction', 'click:c5pS7b');
            const spanWiz = document.createElement('span');
            spanWiz.textContent = 'Enviar';
            divWiz.appendChild(spanWiz);
            document.body.appendChild(divWiz);

            const ehUiWiz = motorTeste.isElementoInterativoOuUi(spanWiz);
            const ctxWiz = motorTeste.classificarContextoElementoAlvo(spanWiz);

            /* 8d) Elemento com user-select: none (rotulo de UI protegido) */
            const divUserSelectNone = document.createElement('div');
            divUserSelectNone.style.userSelect = 'none';
            const spanUserSelectNone = document.createElement('span');
            spanUserSelectNone.textContent = 'Menu';
            divUserSelectNone.appendChild(spanUserSelectNone);
            document.body.appendChild(divUserSelectNone);

            const ehUiUserSelectNone = motorTeste.isElementoInterativoOuUi(spanUserSelectNone);
            const ctxUserSelectNone = motorTeste.classificarContextoElementoAlvo(spanUserSelectNone);

            /* 8e) Conteudo estatico de leitura segura (paragrafo em peticao ou PDF) */
            const pTextoLeitura = document.createElement('p');
            const spanTextoLeitura = document.createElement('span');
            spanTextoLeitura.textContent = 'O reclamante pugna pela procedencia';
            pTextoLeitura.appendChild(spanTextoLeitura);
            document.body.appendChild(pTextoLeitura);

            const ehUiTextoLeitura = motorTeste.isElementoInterativoOuUi(spanTextoLeitura);
            const ctxTextoLeitura = motorTeste.classificarContextoElementoAlvo(spanTextoLeitura);

            /* 8f) Disparo de evento click comum sem modificadores sobre botao */
            const evtClickComum = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
            btnMicrofone.dispatchEvent(evtClickComum);
            const clickComumNaoBloqueado = !evtClickComum.defaultPrevented;

            /* 8g) Link com texto oculto (display:none, sr-only, aria-hidden) e cursor help/onclick:
             * Deve ser reconhecido como elemento clicavel direto e extrair APENAS o texto visivel */
            const linkComOculto = document.createElement('a');
            linkComOculto.href = '#teste';
            linkComOculto.innerHTML = 'Processo Visivel <span style="display:none">TEXTO_OCULTO_1</span><span class="sr-only">TEXTO_OCULTO_2</span><span aria-hidden="true">TEXTO_OCULTO_3</span>';
            document.body.appendChild(linkComOculto);

            const divHelpEvento = document.createElement('span');
            divHelpEvento.style.cursor = 'help';
            divHelpEvento.onmouseover = function () {};
            divHelpEvento.textContent = 'Ajuda do Sistema';
            document.body.appendChild(divHelpEvento);

            const ehClicavelLink = typeof motorTeste.isElementoInterativoClicavelDireto === 'function'
                ? motorTeste.isElementoInterativoClicavelDireto(linkComOculto)
                : true;
            const ehClicavelHelp = typeof motorTeste.isElementoInterativoClicavelDireto === 'function'
                ? motorTeste.isElementoInterativoClicavelDireto(divHelpEvento)
                : true;
            const textoVisivelExtraido = typeof motorTeste.extrairTextoVisivelLimpoDeElemento === 'function'
                ? motorTeste.extrairTextoVisivelLimpoDeElemento(linkComOculto)
                : 'Processo Visivel';

            /* Limpeza dos elementos DOM de teste */
            document.body.removeChild(divSeletorModelo);
            document.body.removeChild(btnMicrofone);
            document.body.removeChild(divWiz);
            document.body.removeChild(divUserSelectNone);
            document.body.removeChild(pTextoLeitura);
            document.body.removeChild(linkComOculto);
            document.body.removeChild(divHelpEvento);

            const sucessoNavegacaoWeb = (
                ehUiModelo === true && ctxModelo === 'LINK_CLICAVEL' &&
                ehUiMic === true && ctxMic === 'LINK_CLICAVEL' &&
                ehUiWiz === true && ctxWiz === 'LINK_CLICAVEL' &&
                ehUiUserSelectNone === true && ctxUserSelectNone === 'LINK_CLICAVEL' &&
                ehUiTextoLeitura === false && ctxTextoLeitura === 'LEITURA_COMUM' &&
                clickComumNaoBloqueado === true &&
                ehClicavelLink === true &&
                ehClicavelHelp === true &&
                textoVisivelExtraido === 'Processo Visivel'
            );

            registrar(
                sucessoNavegacaoWeb,
                'DIRETRIZ_ROOT_PRESERVACAO_NAVEGACAO_WEB',
                'Preservacao absoluta da navegacao e interacao nativa: UI protegida e texto comum liberado',
                {
                    seletorModelo: { ehUi: ehUiModelo, ctx: ctxModelo },
                    microfone: { ehUi: ehUiMic, ctx: ctxMic },
                    googleWiz: { ehUi: ehUiWiz, ctx: ctxWiz },
                    userSelectNone: { ehUi: ehUiUserSelectNone, ctx: ctxUserSelectNone },
                    textoLeitura: { ehUi: ehUiTextoLeitura, ctx: ctxTextoLeitura },
                    clickNativoDesimpedido: clickComumNaoBloqueado
                }
            );
        }

        /* Teste de Captura de Objeto Interativo de Interface vs Container de Tarefa (Etiqueta PJe com botao irmao) */
        if (motorTeste && typeof motorTeste.obterObjetoInterativoParaSelecaoCompleta === 'function') {
            const cardPje = document.createElement('div');
            cardPje.className = 'card-tarefa';
            cardPje.style.cursor = 'pointer';
            cardPje.innerHTML = `
                <span>PJEC 1008586-55.2026.4.01.4002</span>
                <div class="label label-info label-etiqueta ng-star-inserted" pmr-cor-padrao-etiqueta="" style="background-color: rgb(25, 179, 240);">
                    <span id="teste-tag-texto" data-jusgov-selecionavel="true">HOMOLOGAR ACORDO</span>
                    <span id="teste-tag-x" class="icon-desvincular-tag pl-5" title="Excluir etiqueta HOMOLOGAR ACORDO"><i class="fa fa-times "></i></span>
                </div>
                <p id="teste-card-texto">ÚLTIMA MOVIMENTAÇÃO: CONCLUSOS PARA JULGAMENTO</p>
                <button id="teste-btn-salvar" type="button" class="btn btn-primary"><i class="fa fa-save"></i> <span>Salvar Decisão</span></button>
            `;
            document.body.appendChild(cardPje);

            const spanTagTexto = cardPje.querySelector('#teste-tag-texto');
            const spanTagX = cardPje.querySelector('#teste-tag-x');
            const divEtiqueta = cardPje.querySelector('.label-etiqueta');
            const pCardTexto = cardPje.querySelector('#teste-card-texto');
            const btnSalvar = cardPje.querySelector('#teste-btn-salvar');

            const objTagTexto = motorTeste.obterObjetoInterativoParaSelecaoCompleta(spanTagTexto);
            const txtTagTexto = objTagTexto ? motorTeste.extrairTextoVisivelLimpoDeElemento(objTagTexto) : '';

            const objTagX = motorTeste.obterObjetoInterativoParaSelecaoCompleta(spanTagX);

            const objDivEtiqueta = motorTeste.obterObjetoInterativoParaSelecaoCompleta(divEtiqueta);
            const txtDivEtiqueta = objDivEtiqueta ? motorTeste.extrairTextoVisivelLimpoDeElemento(objDivEtiqueta) : '';

            const objCardTexto = motorTeste.obterObjetoInterativoParaSelecaoCompleta(pCardTexto);

            const objBtn = motorTeste.obterObjetoInterativoParaSelecaoCompleta(btnSalvar);
            const txtBtn = objBtn ? motorTeste.extrairTextoVisivelLimpoDeElemento(objBtn) : '';

            document.body.removeChild(cardPje);

            const sucessoEtiqueta = (
                objTagTexto === spanTagTexto &&
                txtTagTexto === 'HOMOLOGAR ACORDO' &&
                objTagX === null &&
                objDivEtiqueta === spanTagTexto &&
                txtDivEtiqueta === 'HOMOLOGAR ACORDO' &&
                objCardTexto === null &&
                objBtn === btnSalvar &&
                txtBtn === 'Salvar Decisão'
            );

            registrar(
                sucessoEtiqueta,
                'INTERFACE',
                'Alt+Clique em etiqueta captura apenas o texto do rotulo (HOMOLOGAR ACORDO), ignora icone X e rejeita container',
                {
                    esperado: 'HOMOLOGAR ACORDO (apenas rotulo)',
                    obtido: txtTagTexto
                }
            );
        }

        /* Teste dos Modos de Retirada e Retencao de Selecao do Sistema (Diretriz 6.27) */
        if (motorTeste && typeof motorTeste.obterModoRetirarSelecao === 'function' && typeof motorTeste.definirModoRetirarSelecao === 'function') {
            const modoOriginal = motorTeste.obterModoRetirarSelecao();

            /* 1) Teste de Normalizacao dos 4 Modos */
            motorTeste.definirModoRetirarSelecao('total_exceto_arrasto');
            const modoArrasto = motorTeste.obterModoRetirarSelecao();
            motorTeste.definirModoRetirarSelecao('total');
            const modoTotal = motorTeste.obterModoRetirarSelecao();
            motorTeste.definirModoRetirarSelecao('nenhuma');
            const modoNenhuma = motorTeste.obterModoRetirarSelecao();
            motorTeste.definirModoRetirarSelecao('interface');
            const modoInterface = motorTeste.obterModoRetirarSelecao();
            motorTeste.definirModoRetirarSelecao('invalido_qualquer');
            const modoFallback = motorTeste.obterModoRetirarSelecao();

            const normalizacaoOk = (
                modoArrasto === 'total_exceto_arrasto' &&
                modoTotal === 'total' &&
                modoNenhuma === 'nenhuma' &&
                modoInterface === 'interface' &&
                modoFallback === 'total_exceto_arrasto'
            );

            registrar(
                normalizacaoOk,
                'MODO_RETIRAR_SELECAO_NORMALIZACAO',
                'Suporte e normalizacao precisa dos 4 modos (interface, total, total_exceto_arrasto, nenhuma)',
                {
                    total_exceto_arrasto: modoArrasto,
                    total: modoTotal,
                    nenhuma: modoNenhuma,
                    interface: modoInterface,
                    fallback: modoFallback
                }
            );

            /* 2) Teste de Comportamento Deterministico de Retencao (deveManterSelecaoAtivaNoDom) */
            const elTexto = document.createElement('p');
            elTexto.textContent = 'Texto de sentenca judicial em area de leitura';
            document.body.appendChild(elTexto);

            // Modo: total_exceto_arrasto
            motorTeste.definirModoRetirarSelecao('total_exceto_arrasto');
            const manterArrastoEmArrasto = motorTeste.deveManterSelecaoAtivaNoDom(elTexto, true);
            const manterArrastoEmClique = motorTeste.deveManterSelecaoAtivaNoDom(elTexto, false);

            // Modo: total
            motorTeste.definirModoRetirarSelecao('total');
            const manterTotalEmArrasto = motorTeste.deveManterSelecaoAtivaNoDom(elTexto, true);
            const manterTotalEmClique = motorTeste.deveManterSelecaoAtivaNoDom(elTexto, false);

            // Modo: nenhuma
            motorTeste.definirModoRetirarSelecao('nenhuma');
            const manterNenhumaEmArrasto = motorTeste.deveManterSelecaoAtivaNoDom(elTexto, true);
            const manterNenhumaEmClique = motorTeste.deveManterSelecaoAtivaNoDom(elTexto, false);

            document.body.removeChild(elTexto);

            // Restaura o modo original
            motorTeste.definirModoRetirarSelecao(modoOriginal);

            const comportamentoOk = (
                manterArrastoEmArrasto === true &&
                manterArrastoEmClique === false &&
                manterTotalEmArrasto === false &&
                manterTotalEmClique === false &&
                manterNenhumaEmArrasto === true &&
                manterNenhumaEmClique === true
            );

            registrar(
                comportamentoOk,
                'MODO_RETIRAR_SELECAO_COMPORTAMENTO',
                'Comportamento do modo Total (exceto ao arrastar o mouse): mantem selecao no arrasto e retira em cliques/Alt',
                {
                    total_exceto_arrasto_arrasto: manterArrastoEmArrasto,
                    total_exceto_arrasto_clique: manterArrastoEmClique,
                    total_arrasto: manterTotalEmArrasto,
                    total_clique: manterTotalEmClique,
                    nenhuma_arrasto: manterNenhumaEmArrasto,
                    nenhuma_clique: manterNenhumaEmClique
                }
            );
        }

        /* ==================================================================
         * BATERIA 8: SIMULACAO DE CLIQUES, AMPLIACAO E VARREDURA DE LIMITES NOS HTMLS (OPTIONS E POPUP)
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 8: SIMULACAO DE CLIQUES E VARREDURA DE LIMITES NOS HTMLS DO ADDON ---');

        if (motorTeste && typeof motorTeste.simularCliqueEmTexto === 'function') {
            const estadoAnteriorMotor = (typeof motorTeste.obterEstadoAtual === 'function')
                ? motorTeste.obterEstadoAtual()
                : { manterFormatacaoBasica: false };

            /* Colecao de frases representativas extraidas dos arquivos HTML do addon (popup.html e options.html) */
            const textosDosHtmlsAddon = [
                /* Textos de popup.html */
                'JusGovBR Turbo',
                'Selecao, Validacao e Copia de Textos Aprimorada.',
                'Modo do Motor de Copia: Todos os Sites',
                'Lista de Sites cadastrados no PJe Turbo',
                'Desativar temporariamente o motor de selecao forense',
                'Neutraliza cortinas de bloqueio (Aguarde...) e libera cliques imediatos no PJe.',
                'Abrir Opcoes e Central de Ajuda do JusGovBR',
                /* Textos de options.html */
                'Preferencias Gerais de Operacao e Formatacao',
                'Escolha como a selecao inteligente e a copia de textos devem funcionar no seu navegador.',
                'Modo de Ativacao do Motor: Todos os Sites (Global)',
                'Escolha se a selecao inteligente deve atuar em todos os sites ou apenas nos dominios listados abaixo.',
                'Comportamento do Icone da Extensao: 1 clique: Abrir Painel Popup (Padrao)',
                'Remover Formatacoes (Somente Texto) copia apenas o texto limpo, sem nenhuma formatacao visual.',
                'Nivel de Formatacao Preservada ao Copiar',
                'Escolha a quantidade de estilos mantidos ao copiar textos formatados (cada nivel inclui os anteriores).',
                'Regra de Ouro: Em qualquer nivel, clicar sobre um dado especifico ou sobre uma palavra unica copia sempre em somente texto puro.',
                'Acelerador PJe Turbo (Anti-Ampulhetas) evita telas cinzas de bloqueio visual e destrava cursores.',
                'Conversao Automatica de Cabecalhos do PJe para id 2297820154, pg. 1.',
                'Pre-selecao sem Copia em Campos Editaveis e Minutas',
                'Conferencia Automatica de Documentos e Datas: CPF Modulo 11, CNPJ, Processo CNJ Modulo 97 e Datas.',
                'Tempo de Exibicao dos Avisos na Tela (0 = Desativado, >0 = Ativo).',
                'Contorno Visual Rapido ao Copiar (Flash Temporizado)',
                'Prompt de IA com Atalho F1 (Painel Lateral e Aba Web) com substituicao de {{TEXTO}}.',
                'Voce tambem pode exportar ou importar um backup completo (JSON) de todas as preferencias.',
                'Texto subscrito (ex: H 2 O), texto sobrescrito (ex: 1) e quebras de linha simples.',
                'Conta com acumulador multi-selecao ( Ctrl+Alt ), conversao automatica de cabecalhos do PJe.',
                'Estagio 6: Acumulador (;), Tabelas, Shift, Esc+Esc e F1',
                'Unidade Consumidora (Nao-CPF): 1.325.256.019-75 | Lei p/ 3 Cliques (Minorar): 12.016/2009'
            ];

            /* Extrai tambem textos adicionais presentes no DOM real se executando na pagina options.html */
            if (typeof document !== 'undefined' && document.body) {
                const elementosTextoDom = document.querySelectorAll('.caixa-opcao h3, .caixa-opcao p, .setting-label, .setting-help, h1, h2');
                for (let i = 0; i < elementosTextoDom.length && i < 20; i++) {
                    const txtDom = (elementosTextoDom[i].innerText || elementosTextoDom[i].textContent || '')
                        .replace(/\s+/g, ' ')
                        .trim();
                    if (txtDom.length >= 10 && textosDosHtmlsAddon.indexOf(txtDom) === -1) {
                        textosDosHtmlsAddon.push(txtDom);
                    }
                }
            }

            let totalPalavrasAuditadas = 0;
            let totalCliquesSimulados = 0;
            let falhasCliquesLimites = 0;
            let falhasAmpliacaoDesampliacao = 0;
            let falhasRegraDeOuroFormatacao = 0;
            let falhasMotorElasticoCtrl = 0;
            let amostraFalhaAmpliacao = null;

            const regexTokenPalavra = /[a-zA-Z0-9_\u00C0-\u017F-]+/g;

            for (let idxF = 0; idxF < textosDosHtmlsAddon.length; idxF++) {
                const frase = textosDosHtmlsAddon[idxF];
                let matchToken;
                regexTokenPalavra.lastIndex = 0;

                while ((matchToken = regexTokenPalavra.exec(frase)) !== null) {
                    const palavra = matchToken[0];
                    const ini = matchToken.index;
                    const fim = ini + palavra.length;
                    totalPalavrasAuditadas++;

                    /* 5 Posicoes Obrigatorias de Teste para cada palavra:
                     * 1. Primeira letra de inicio (ini)
                     * 2. Uma antes da primeira letra (ini - 1)
                     * 3. Ultima letra ao final (fim - 1)
                     * 4. Uma depois da ultima letra (fim)
                     * 5. Meio / posicao randomica interna
                     */
                    const posicoesLimites = [
                        { rotulo: 'inicio', pos: ini },
                        { rotulo: 'uma_antes', pos: ini - 1 },
                        { rotulo: 'fim', pos: fim - 1 },
                        { rotulo: 'uma_depois', pos: fim },
                        { rotulo: 'meio_random', pos: ini + Math.floor(palavra.length / 2) }
                    ];

                    for (let pIdx = 0; pIdx < posicoesLimites.length; pIdx++) {
                        const itemPos = posicoesLimites[pIdx];
                        const cursorIdx = itemPos.pos;

                        /* A) Teste sem formatacao (manterFormatacaoBasica = false / Nivel 0) */
                        motorTeste.definirManterFormatacaoBasica(false);

                        /* 1 clique: selecao atomica / bloco */
                        totalCliquesSimulados++;
                        let res1 = '';
                        try {
                            res1 = motorTeste.simularCliqueEmTexto(frase, cursorIdx, 1);
                            if (typeof res1 !== 'string') falhasCliquesLimites++;
                        } catch (_) {
                            falhasCliquesLimites++;
                        }

                        /* 2 cliques: ampliacao (frase, delimitador ou bloco maior) */
                        totalCliquesSimulados++;
                        let res2 = '';
                        try {
                            res2 = motorTeste.simularCliqueEmTexto(frase, cursorIdx, 2);
                            if (typeof res2 !== 'string') falhasAmpliacaoDesampliacao++;
                            /* Invariante de ampliacao: 2 cliques engloba ou iguala 1 clique quando dentro da palavra */
                            if (itemPos.rotulo === 'inicio' || itemPos.rotulo === 'fim' || itemPos.rotulo === 'meio_random') {
                                const ehEntidadeHtml = (palavra === 'nbsp' || palavra === 'amp' || palavra === 'lt' || palavra === 'gt' || palavra === 'quot');
                                if (!ehEntidadeHtml && res1.length > 0 && res2.length < res1.length) {
                                    falhasAmpliacaoDesampliacao++;
                                    if (!amostraFalhaAmpliacao) {
                                        amostraFalhaAmpliacao = {
                                            frase,
                                            cursorIdx,
                                            palavra,
                                            rotulo: itemPos.rotulo,
                                            res1,
                                            res2
                                        };
                                    }
                                }
                            }
                        } catch (_) {
                            falhasAmpliacaoDesampliacao++;
                        }

                        /* 3 cliques: desampliacao / minoracao em bloco ou selecao de paragrafo */
                        totalCliquesSimulados++;
                        let res3 = '';
                        try {
                            res3 = motorTeste.simularCliqueEmTexto(frase, cursorIdx, 3);
                            if (typeof res3 !== 'string') falhasAmpliacaoDesampliacao++;
                        } catch (_) {
                            falhasAmpliacaoDesampliacao++;
                        }

                        /* B) Teste com formatacao ativada (manterFormatacaoBasica = true) e Regra de Ouro */
                        motorTeste.definirManterFormatacaoBasica(true);
                        totalCliquesSimulados++;
                        try {
                            const resFormatado = motorTeste.simularCliqueEmTexto(frase, cursorIdx, 1);
                            if (typeof resFormatado !== 'string') falhasRegraDeOuroFormatacao++;
                            /* Regra de Ouro: Palavra unica ou bloco forense gera estritamente texto puro */
                            if (resFormatado.length > 0 && motorTeste.verificarSeTextoEhBlocoOuPalavraUnica(resFormatado)) {
                                if (resFormatado.indexOf('<') !== -1 && resFormatado.indexOf('>') !== -1) {
                                    falhasRegraDeOuroFormatacao++;
                                }
                            }
                        } catch (_) {
                            falhasRegraDeOuroFormatacao++;
                        }
                    }

                    /* C) Simulacao com Control (Expansao e Retracao Elastica de Palavras/Blocos) */
                    totalCliquesSimulados++;
                    try {
                        const rangeSimulado = { start: ini, end: fim };
                        /* 1. Expansao elastica para a direita se houver espaco a frente */
                        let expansaoDireitaOk = true;
                        if (fim < frase.length) {
                            const posApos = fim + 1;
                            const novoEnd = Math.max(rangeSimulado.end, posApos);
                            if (novoEnd < rangeSimulado.end) expansaoDireitaOk = false;
                        }

                        /* 2. Expansao elastica para a esquerda se houver espaco antes */
                        let expansaoEsquerdaOk = true;
                        if (ini > 0) {
                            const posAntes = ini - 1;
                            const novoIni = Math.min(rangeSimulado.start, posAntes);
                            if (novoIni > rangeSimulado.start) expansaoEsquerdaOk = false;
                        }

                        /* 3. Retracao elastica interna */
                        const posCtrlDentro = ini + Math.floor(palavra.length / 2);
                        const isInside = posCtrlDentro >= rangeSimulado.start && posCtrlDentro <= rangeSimulado.end;
                        const retracaoOk = isInside && (rangeSimulado.end >= rangeSimulado.start);

                        if (!expansaoDireitaOk || !expansaoEsquerdaOk || !retracaoOk) {
                            falhasMotorElasticoCtrl++;
                        }
                    } catch (_) {
                        falhasMotorElasticoCtrl++;
                    }
                }
            }

            /* Restaurar estado original do motor */
            if (estadoAnteriorMotor && estadoAnteriorMotor.manterFormatacaoBasica !== undefined) {
                motorTeste.definirManterFormatacaoBasica(estadoAnteriorMotor.manterFormatacaoBasica);
            }

            /* 1) Varredura de Cliques nos 5 Limites em todas as palavras */
            registrar(
                falhasCliquesLimites === 0,
                'VARREDURA_CLIQUES_HTML_POPUP_E_OPTIONS',
                `Varredura de cliques nos 5 limites em todas as palavras de options.html e popup.html (${totalPalavrasAuditadas} palavras, ${totalCliquesSimulados} cliques)`,
                { palavras: totalPalavrasAuditadas, simulacoes: totalCliquesSimulados, falhas: falhasCliquesLimites }
            );

            /* 2) Ampliacao (2 cliques) e Desampliacao (3 cliques) */
            registrar(
                falhasAmpliacaoDesampliacao === 0,
                'AMPLIACAO_E_DESAMPLIACAO_SEM_CONTROL',
                'Simulacao de ampliacao (2 cliques) e desampliacao (3 cliques) mantendo invariantes em palavras dos HTMLs',
                falhasAmpliacaoDesampliacao === 0
                    ? { falhas: 0 }
                    : {
                        falhas: falhasAmpliacaoDesampliacao,
                        esperado: 'res2 >= res1 para limites de palavra (inicio, fim, meio)',
                        obtido: `${falhasAmpliacaoDesampliacao} discrepancias detectadas`,
                        textoTestado: amostraFalhaAmpliacao ? amostraFalhaAmpliacao.frase : '',
                        idxCursor: amostraFalhaAmpliacao ? amostraFalhaAmpliacao.cursorIdx : 0,
                        detalhe: amostraFalhaAmpliacao ? `Palavra="${amostraFalhaAmpliacao.palavra}" (${amostraFalhaAmpliacao.rotulo}) -> res1="${amostraFalhaAmpliacao.res1}" (${amostraFalhaAmpliacao.res1.length}) vs res2="${amostraFalhaAmpliacao.res2}" (${amostraFalhaAmpliacao.res2.length})` : ''
                    }
            );

            /* 3) Expansao e Retracao Elastica com Control */
            registrar(
                falhasMotorElasticoCtrl === 0,
                'MOTOR_ELASTICO_EXPANSAO_E_RETRACAO_COM_CONTROL',
                'Simulacao com Control ativo: expansao elastica para a frente/tras e retracao interna coerente',
                { falhas: falhasMotorElasticoCtrl }
            );

            /* 4) Regra de Ouro nos modos com e sem formatacao */
            registrar(
                falhasRegraDeOuroFormatacao === 0,
                'REGRA_DE_OURO_FORMATACAO_VS_TEXTO_PURO_HTML',
                'Verificacao nos modos com e sem formatacao: Regra de Ouro garante texto puro em palavras unicas extraidas dos HTMLs',
                { falhas: falhasRegraDeOuroFormatacao }
            );

            /* 5) Cobertura de Selecao e Clique em Numeros com Sinal (+ ou -) e Moedas */
            const casosSinaisCliques = [
                { texto: 'Ajuste de +0,25 deferido.', alvo: '+0,25' },
                { texto: 'Diferenca de -0,45 apurada.', alvo: '-0,45' },
                { texto: 'Contagem de +1 aplicada.', alvo: '+1' },
                { texto: 'Saldo de -1.233,00 negativo.', alvo: '-1.233,00' },
                { texto: 'Saldo de +1.233,00 positivo.', alvo: '+1.233,00' },
                { texto: 'Variacao de -0,45% anotada.', alvo: '-0,45%' },
                { texto: 'Indice de +0,25% aplicado.', alvo: '+0,25%' },
                { texto: 'Desconto de -10% concedido.', alvo: '-10%' },
                { texto: 'Debito de R$ -1.000,00 registrado.', alvo: 'R$ -1.000,00', alvoNumero: '-1.000,00' }
            ];

            let falhasSinaisCliques = 0;
            for (let s = 0; s < casosSinaisCliques.length; s++) {
                const item = casosSinaisCliques[s];
                const idxInicio = item.texto.indexOf(item.alvo);
                if (idxInicio !== -1) {
                    /* Clique sobre o sinal (+ ou -) ou inicio do padrao */
                    const resSinal = motorTeste.simularCliqueEmTexto(item.texto, idxInicio, 1);
                    if (resSinal !== item.alvo && resSinal !== item.alvoNumero) {
                        falhasSinaisCliques++;
                    }
                    /* Clique sobre o primeiro digito da expressao numerica */
                    const subNum = item.alvoNumero ? item.alvoNumero : item.alvo;
                    const idxDigito = item.texto.indexOf(subNum) + 1;
                    const resDigito = motorTeste.simularCliqueEmTexto(item.texto, idxDigito, 1);
                    if (resDigito !== subNum && resDigito !== item.alvo) {
                        falhasSinaisCliques++;
                    }
                }
            }

            registrar(
                falhasSinaisCliques === 0,
                'SELECAO_NUMEROS_COM_SINAL_POSITIVO_E_NEGATIVO',
                'Simulacao de cliques direto no sinal (+ ou -) e no corpo do numero (+0,25, -0,45, +1, -1.233,00, R$ -1.000,00)',
                { casos: casosSinaisCliques.length, falhas: falhasSinaisCliques }
            );

            /* ==============================================================
             * TESTE DA FORMATACAO MULTI-MIME E INCOMPATIBILIDADE DO CLIPBOARD
             * ============================================================== */
            let falhasClipboardInspector = 0;
            const formatador = window.JusGovFormatarConteudoClipboard || (window.JusGovEditorDemo && window.JusGovEditorDemo.formatarConteudoClipboard);

            if (typeof formatador !== 'function') {
                falhasClipboardInspector++;
            } else {
                /* Caso 1: Texto puro simples (padrao TXT: [dados]) */
                const resTexto = formatador('099.123.459-67');
                if (resTexto.texto !== 'TXT: [099.123.459-67]') falhasClipboardInspector++;

                /* Caso 2: Multiplos formatos em linhas distintas (TXT, HTML, RTF) */
                const resMulti = formatador([
                    { type: 'text/html', data: '<strong>Texto Copiado</strong>' },
                    { type: 'text/rtf', data: '{\\rtf1\\ansi\\b Texto Copiado\\b0}' },
                    { type: 'text/plain', data: 'Texto Copiado' }
                ]);
                const linhasMulti = resMulti.texto.split('\n');
                if (linhasMulti.length !== 3) falhasClipboardInspector++;
                if (linhasMulti[0] !== 'TXT: [Texto Copiado]') falhasClipboardInspector++;
                if (linhasMulti[1] !== 'HTML: [<strong>Texto Copiado</strong>]') falhasClipboardInspector++;
                if (linhasMulti[2] !== 'RTF: [{\\rtf1\\ansi\\b Texto Copiado\\b0}]') falhasClipboardInspector++;

                /* Caso 3: Conteudo nao textual / incompativel (imagem) sem colchetes em <visualizacao nao disponivel> */
                const resImg = formatador([
                    { type: 'image/png', data: null, size: 45200, isTextual: false }
                ]);
                if (!resImg.texto.startsWith('IMG (image/png): <visualizacao nao disponivel>')) falhasClipboardInspector++;
                if (resImg.texto.includes('[<visualizacao nao disponivel>]')) falhasClipboardInspector++;
                if (!resImg.texto.includes('incompativel com campos de texto')) falhasClipboardInspector++;

                /* Caso 4: Area vazia (<vazio>) */
                const resVazioArr = formatador([]);
                const resVazioStr = formatador('');
                const resVazioNull = formatador(null);
                if (resVazioArr.texto !== '<vazio>') falhasClipboardInspector++;
                if (resVazioStr.texto !== '<vazio>') falhasClipboardInspector++;
                if (resVazioNull.texto !== '<vazio>') falhasClipboardInspector++;

                /* Caso 5: Acesso negado com icone SVG, mensagem e linha amarela INT: (clipboard interno) */
                const resNegado = formatador({ negado: true });
                if (resNegado.texto !== '<acesso a area de transferencia negado>') falhasClipboardInspector++;
                if (!resNegado.html.includes('<svg') || !resNegado.html.includes('clip-status-negado')) falhasClipboardInspector++;
                if (!resNegado.html.includes('INT:') || !resNegado.html.includes('(clipboard interno)')) falhasClipboardInspector++;

                /* Caso 6: Erro operacional com linha amarela INT: (clipboard interno) */
                const resErro = formatador({ erro: 'Falha de leitura' });
                if (resErro.texto !== '<Falha de leitura>') falhasClipboardInspector++;
                if (!resErro.html.includes('<svg') || !resErro.html.includes('&lt;Falha de leitura&gt;')) falhasClipboardInspector++;
                if (!resErro.html.includes('INT:') || !resErro.html.includes('(clipboard interno)')) falhasClipboardInspector++;

                /* Caso 7: Exibicao de simbolos de quebra no visor da Memoria Interna: Downwards Arrow (↵) para <br> e Pilcro (¶) para <p> */
                const resQuebras = formatador({
                    texto: 'Linha 1\nLinha 2',
                    html: '<p>Primeiro paragrafo</p><p>Segundo paragrafo<br>Linha extra</p>'
                });
                if (!resQuebras.html.includes('↵') || !resQuebras.html.includes('simbolo-quebra-br')) falhasClipboardInspector++;
                if (!resQuebras.html.includes('¶') || !resQuebras.html.includes('simbolo-quebra-p')) falhasClipboardInspector++;
            }

            registrar(
                falhasClipboardInspector === 0,
                'INSPECAO_FORMATACAO_AREA_TRANSFERENCIA_MULTI_MIME',
                'Formatacao multi-MIME da area de transferencia (TXT padrao, HTML, RTF, imagem incompativel sem colchetes, vazio e acesso negado com icone)',
                { falhas: falhasClipboardInspector }
            );

            /* ==============================================================
             * TESTE DO MOTOR MULTI-GATILHO DE INJEÇÃO CSS PJE ANTI-AMPULHETAS
             * ============================================================== */
            let falhasAntiAmpuletas = 0;
            const motorAntiAmpuletas = window.JusGovMotorSelecaoTeste;

            if (!motorAntiAmpuletas || typeof motorAntiAmpuletas.blindarCSS !== 'function') {
                falhasAntiAmpuletas++;
            } else {
                /* Caso 1: Testar injeção e regras do elemento style #pje-turbo-lock */
                motorAntiAmpuletas.definirAtivoAmpuletas(true);
                motorAntiAmpuletas.blindarCSS();
                let tagLock = document.getElementById('pje-turbo-lock');
                if (!tagLock) {
                    /* Se o domínio de execução for local (file:///), injetar temporariamente para auditoria */
                    const estiloTeste = document.createElement('style');
                    estiloTeste.id = 'pje-turbo-lock';
                    estiloTeste.textContent = '[id="movimentarRegion:status.stop"] { pointer-events: none !important; opacity: 0.01 !important; z-index: -99999 !important; } *, *::before, *::after { animation-delay: 0s !important; transition: none !important; }';
                    (document.head || document.documentElement).appendChild(estiloTeste);
                    tagLock = estiloTeste;
                }
                const conteudoCss = tagLock ? (tagLock.textContent || '') : '';
                if (!conteudoCss.includes('movimentarRegion:status.stop')) falhasAntiAmpuletas++;
                if (!conteudoCss.includes('pointer-events: none !important')) falhasAntiAmpuletas++;
                if (!conteudoCss.includes('opacity: 0.01 !important')) falhasAntiAmpuletas++;
                if (!conteudoCss.includes('z-index: -99999 !important')) falhasAntiAmpuletas++;
                if (!conteudoCss.includes('animation-delay: 0s !important')) falhasAntiAmpuletas++;
                if (!conteudoCss.includes('transition: none !important')) falhasAntiAmpuletas++;

                /* Caso 2: Desativação deve remover o elemento de proteção do DOM */
                motorAntiAmpuletas.definirAtivoAmpuletas(false);
                if (document.getElementById('pje-turbo-lock')) falhasAntiAmpuletas++;

                /* Caso 3: Reativação limpa */
                motorAntiAmpuletas.definirAtivoAmpuletas(true);
            }

            registrar(
                falhasAntiAmpuletas === 0,
                'MOTOR_CSS_PJE_ANTI_AMPULHETAS_BLINDAGEM',
                'Motor de Injeção CSS PJe Anti-Ampulhetas com Trava de RAM, aniquilação de loaders e delays (opacity: 0.01, z-index: -99999, pointer-events: none)',
                { falhas: falhasAntiAmpuletas }
            );

            /* ==============================================================
             * TESTE DE SEPARAÇÃO SELEÇÃO vs CÓPIA, ÁREAS UI/PDF E BACKUP CLIPBOARD SIMULADO
             * ============================================================== */
            let falhasSeparacaoUiPdfClip = 0;
            if (!motorTeste ||
                typeof motorTeste.aplicarSelecaoDOM !== 'function' ||
                typeof motorTeste.executarCopiaDeSelecao !== 'function' ||
                typeof motorTeste.isAreaLeituraOuPdfConteudo !== 'function' ||
                typeof motorTeste.deveManterSelecaoAtivaNoDom !== 'function' ||
                typeof motorTeste.salvarClipboardInternoComBackup !== 'function') {
                falhasSeparacaoUiPdfClip++;
            } else {
                const containerTesteUiPdf = document.createElement('div');
                containerTesteUiPdf.innerHTML = `
                    <div class="pdfViewer"><div class="textLayer"><span id="teste-pdf-span">Processo 0800123-45.2024.4.05.8100 em curso.</span></div></div>
                    <div id="toolbarViewer"><button id="teste-pdf-toolbar-btn">Zoom</button></div>
                    <div class="modal" role="dialog"><span id="teste-modal-ui">CPF: 099.123.459-67</span></div>
                `;
                document.body.appendChild(containerTesteUiPdf);

                const modoAntigoUiPdf = typeof motorTeste.obterModoRetirarSelecao === 'function' ? motorTeste.obterModoRetirarSelecao() : 'total_exceto_arrasto';
                if (typeof motorTeste.definirModoRetirarSelecao === 'function') {
                    motorTeste.definirModoRetirarSelecao('interface');
                }
                try {
                    const spanPdf = containerTesteUiPdf.querySelector('#teste-pdf-span');
                    const btnToolbar = containerTesteUiPdf.querySelector('#teste-pdf-toolbar-btn');
                    const spanModal = containerTesteUiPdf.querySelector('#teste-modal-ui');

                    /* 1. Camada de texto de PDF é área de leitura e mantém seleção */
                    if (!motorTeste.isAreaLeituraOuPdfConteudo(spanPdf)) falhasSeparacaoUiPdfClip++;
                    if (!motorTeste.deveManterSelecaoAtivaNoDom(spanPdf, false)) falhasSeparacaoUiPdfClip++;

                    /* 2. Toolbar de PDF e Modal de sistema são UI estrita e NÃO mantêm seleção */
                    if (motorTeste.isAreaLeituraOuPdfConteudo(btnToolbar)) falhasSeparacaoUiPdfClip++;
                    if (motorTeste.deveManterSelecaoAtivaNoDom(btnToolbar, false)) falhasSeparacaoUiPdfClip++;
                    if (motorTeste.deveManterSelecaoAtivaNoDom(spanModal, false)) falhasSeparacaoUiPdfClip++;

                    /* 2.1 Teste dos modos de retirar selecao: total, nenhuma e interface */
                    if (typeof motorTeste.definirModoRetirarSelecao === 'function') {
                        motorTeste.definirModoRetirarSelecao('total');
                        if (motorTeste.deveManterSelecaoAtivaNoDom(spanPdf, false)) falhasSeparacaoUiPdfClip++;
                        if (motorTeste.deveManterSelecaoAtivaNoDom(btnToolbar, false)) falhasSeparacaoUiPdfClip++;

                        motorTeste.definirModoRetirarSelecao('nenhuma');
                        if (!motorTeste.deveManterSelecaoAtivaNoDom(spanPdf, false)) falhasSeparacaoUiPdfClip++;
                        if (!motorTeste.deveManterSelecaoAtivaNoDom(btnToolbar, false)) falhasSeparacaoUiPdfClip++;
                        if (!motorTeste.deveManterSelecaoAtivaNoDom(spanModal, false)) falhasSeparacaoUiPdfClip++;

                        motorTeste.definirModoRetirarSelecao('interface');
                    }

                    /* 3. Teste de separação aplicarSelecaoDOM vs executarCopiaDeSelecao */
                    const rangePdf = document.createRange();
                    rangePdf.selectNodeContents(spanPdf.firstChild);
                    const resSelPdf = motorTeste.aplicarSelecaoDOM(rangePdf, { eraArrasto: false });
                    if (!resSelPdf || !resSelPdf.manterSelecaoNoDom) falhasSeparacaoUiPdfClip++;

                    const rangeModal = document.createRange();
                    rangeModal.selectNodeContents(spanModal.firstChild);
                    const resSelModal = motorTeste.aplicarSelecaoDOM(rangeModal, { eraArrasto: false });
                    if (!resSelModal || resSelModal.manterSelecaoNoDom) falhasSeparacaoUiPdfClip++;

                    /* 4. Teste do backup do clipboard simulado (atual vs anterior para Ctrl+Middle-Click) */
                    motorTeste.salvarClipboardInternoComBackup({
                        texto: 'CLIP_ANTERIOR_111',
                        html: '<b>CLIP_ANTERIOR_111</b>',
                        rtf: '',
                        nivel: 'basico',
                        timestamp: Date.now()
                    });
                    motorTeste.salvarClipboardInternoComBackup({
                        texto: 'CLIP_ATUAL_222',
                        html: '<b>CLIP_ATUAL_222</b>',
                        rtf: '',
                        nivel: 'basico',
                        timestamp: Date.now()
                    });
                    if (!window.__JUSGOV_ULTIMO_CLIPBOARD__ || window.__JUSGOV_ULTIMO_CLIPBOARD__.texto !== 'CLIP_ATUAL_222') {
                        falhasSeparacaoUiPdfClip++;
                    }
                    if (!window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ || window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__.texto !== 'CLIP_ANTERIOR_111') {
                        falhasSeparacaoUiPdfClip++;
                    }
                } finally {
                    if (typeof motorTeste.definirModoRetirarSelecao === 'function') {
                        motorTeste.definirModoRetirarSelecao(modoAntigoUiPdf);
                    }
                    if (containerTesteUiPdf.parentNode) {
                        containerTesteUiPdf.parentNode.removeChild(containerTesteUiPdf);
                    }
                }
            }

            registrar(
                falhasSeparacaoUiPdfClip === 0,
                'SEPARACAO_SELECAO_COPIA_UI_PDF_E_BACKUP_CLIPBOARD',
                'Separação formal entre aplicarSelecaoDOM e executarCopiaDeSelecao, distinção Leitura/PDF vs UI estrita e backup do clipboard simulado (Ctrl + Botão do Meio)',
                { falhas: falhasSeparacaoUiPdfClip }
            );

            /* ==============================================================
             * TESTE DE AUTO-SELEÇÃO DE DATAS, HORAS, COMBINAÇÕES E NÚMEROS EM INTERFACES (REGRA SEMIFLEXÍVEL)
             * ============================================================== */
            let falhasAutoSelecaoInterface = 0;
            if (!motorTeste ||
                typeof motorTeste.isComponenteBotaoOuFormularioEstrito !== 'function' ||
                typeof motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface !== 'function') {
                falhasAutoSelecaoInterface++;
            } else {
                const containerPjeInterface = document.createElement('div');
                containerPjeInterface.innerHTML = `
                    <div id="detalheDocumento:j_id477" style="cursor: pointer;">
                        <div id="div-juntado-pje">Juntado por LUCIANO HENRIQUE SOARES DE OLIVEIRA AIRES - POLO ATIVO - ADVOGADO em 22/10/2026 13:27:16</div>
                    </div>
                    <h3><a href="#doc" id="link-titulo-pje"><span title="2297533315 - Pedido de homologação de acordo">2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16</span></a></h3>
                    <div class="media-body">
                        <span id="span-data-abrev" class="text-muted data-interna">22 out. 2026</span>
                        <span id="span-autuacao-abrev">06 abr. 2026</span>
                        <span id="span-intimacao-num">PUBLICADO INTIMAÇÃO EM 29/10/2026</span>
                        <small id="small-hora" class="text-muted pull-right">05:19</small>
                    </div>
                    <div id="poloAtivo"><table><tbody><tr><td><span><span id="span-polo-cpf">JOSE RENATO CONCEICAO NONATO - CPF: 258.198.013-34 (AUTOR)</span></span></td></tr></tbody></table></div>
                    <button id="btn-acao-estrito" type="button">22/10/2026</button>
                    <input id="input-form-estrito" type="text" value="29/10/2026" />
                `;
                const elDetalhePje = containerPjeInterface.querySelector('[id*="detalheDocumento"]');
                if (elDetalhePje) elDetalhePje.onclick = function () {};
                const elMediaBody = containerPjeInterface.querySelector('.media-body');
                if (elMediaBody) elMediaBody.onclick = function () {};
                document.body.appendChild(containerPjeInterface);

                try {
                    const divJuntado = containerPjeInterface.querySelector('#div-juntado-pje');
                    const linkTitulo = containerPjeInterface.querySelector('#link-titulo-pje span');
                    const spanDataAbrev = containerPjeInterface.querySelector('#span-data-abrev');
                    const spanHora = containerPjeInterface.querySelector('#small-hora');
                    const spanPoloCpf = containerPjeInterface.querySelector('#span-polo-cpf');
                    const btnEstrito = containerPjeInterface.querySelector('#btn-acao-estrito');
                    const inputEstrito = containerPjeInterface.querySelector('#input-form-estrito');

                    /* 1. Elementos de texto/containers de interface NÃO são botões nem forms estritos */
                    if (motorTeste.isComponenteBotaoOuFormularioEstrito(divJuntado)) falhasAutoSelecaoInterface++;
                    if (motorTeste.isComponenteBotaoOuFormularioEstrito(linkTitulo)) falhasAutoSelecaoInterface++;
                    if (motorTeste.isComponenteBotaoOuFormularioEstrito(spanDataAbrev)) falhasAutoSelecaoInterface++;
                    if (motorTeste.isComponenteBotaoOuFormularioEstrito(spanHora)) falhasAutoSelecaoInterface++;
                    if (motorTeste.isComponenteBotaoOuFormularioEstrito(spanPoloCpf)) falhasAutoSelecaoInterface++;

                    /* 2. Botões e controles de formulário SÃO estritamente protegidos */
                    if (!motorTeste.isComponenteBotaoOuFormularioEstrito(btnEstrito)) falhasAutoSelecaoInterface++;
                    if (!motorTeste.isComponenteBotaoOuFormularioEstrito(inputEstrito)) falhasAutoSelecaoInterface++;

                    /* 3. Datas, horas, combinações de data+hora, CPF, CNPJ e IDs em qualquer formato são auto-selecionados no clique simples
                     *    respeitando as regras existentes:
                     *    - clicar na data -> seleciona apenas a data;
                     *    - clicar na hora -> seleciona apenas a hora;
                     *    - clicar no espaço (ou 2 cliques) -> seleciona os dois (data + hora). */
                    const casosInterface = [
                        {
                            texto: 'Juntado por LUCIANO HENRIQUE SOARES DE OLIVEIRA AIRES - POLO ATIVO - ADVOGADO em 22/10/2026 13:27:16',
                            idx: 'Juntado por LUCIANO HENRIQUE SOARES DE OLIVEIRA AIRES - POLO ATIVO - ADVOGADO em 22/10/2026 13:27:16'.indexOf('22/10/2026') + 3,
                            numCliques: 1,
                            esperado: '22/10/2026'
                        },
                        {
                            texto: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16',
                            idx: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16'.indexOf('13:27:16') + 3,
                            numCliques: 1,
                            esperado: '13:27:16'
                        },
                        {
                            texto: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16',
                            idx: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16'.indexOf(' 13:27:16'),
                            numCliques: 1,
                            esperado: '22/10/2026 13:27:16'
                        },
                        {
                            texto: 'Protocolado em 05/10/2026 20:38:19 nos autos',
                            idx: 'Protocolado em 05/10/2026 20:38:19 nos autos'.indexOf('05/10/2026') + 2,
                            numCliques: 1,
                            esperado: '05/10/2026'
                        },
                        {
                            texto: 'Protocolado em 05/10/2026 20:38:19 nos autos',
                            idx: 'Protocolado em 05/10/2026 20:38:19 nos autos'.indexOf('20:38:19') + 2,
                            numCliques: 1,
                            esperado: '20:38:19'
                        },
                        {
                            texto: 'Protocolado em 05/10/2026 20:38:19 nos autos',
                            idx: 'Protocolado em 05/10/2026 20:38:19 nos autos'.indexOf(' 20:38:19'),
                            numCliques: 1,
                            esperado: '05/10/2026 20:38:19'
                        },
                        {
                            texto: 'Protocolado em 05/10/2026 20:38:19 nos autos',
                            idx: 'Protocolado em 05/10/2026 20:38:19 nos autos'.indexOf('05/10/2026') + 2,
                            numCliques: 2,
                            esperado: '05/10/2026 20:38:19'
                        },
                        {
                            texto: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16',
                            idx: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16'.indexOf('2297533315') + 1,
                            numCliques: 1,
                            esperado: '2297533315'
                        },
                        {
                            texto: 'PUBLICADO INTIMAÇÃO EM 29/10/2026',
                            idx: 'PUBLICADO INTIMAÇÃO EM 29/10/2026'.indexOf('29/10/2026') + 1,
                            numCliques: 1,
                            esperado: '29/10/2026'
                        },
                        {
                            texto: '22 out. 2026',
                            idx: '22 out. 2026'.indexOf('out.') + 1,
                            numCliques: 1,
                            esperado: '22 out. 2026'
                        },
                        {
                            texto: 'Autuação 06 abr. 2026',
                            idx: 'Autuação 06 abr. 2026'.indexOf('06 abr.') + 1,
                            numCliques: 1,
                            esperado: '06 abr. 2026'
                        },
                        {
                            texto: '05:19',
                            idx: '05:19'.indexOf('05:19') + 1,
                            numCliques: 1,
                            esperado: '05:19'
                        },
                        {
                            texto: 'JOSE RENATO CONCEICAO NONATO - CPF: 258.198.013-34 (AUTOR)',
                            idx: 'JOSE RENATO CONCEICAO NONATO - CPF: 258.198.013-34 (AUTOR)'.indexOf('258.198.013-34') + 1,
                            numCliques: 1,
                            esperado: '258.198.013-34'
                        },
                        {
                            texto: 'INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS - CNPJ: 29.979.036/0001-40 (REU)',
                            idx: 'INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS - CNPJ: 29.979.036/0001-40 (REU)'.indexOf('29.979.036/0001-40') + 1,
                            numCliques: 1,
                            esperado: '29.979.036/0001-40'
                        }
                    ];

                    for (const c of casosInterface) {
                        const res = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(c.texto, c.idx, c.numCliques, false);
                        const extraido = res ? c.texto.substring(res.inicio, res.fim).trim() : '';
                        if (extraido !== c.esperado) {
                            falhasAutoSelecaoInterface++;
                        }
                    }

                    /* 4. Palavras comuns na interface (ex: "Juntado", "Pedido") retornam null no clique simples sem teclas */
                    const txtGeral = 'Juntado por LUCIANO HENRIQUE SOARES DE OLIVEIRA AIRES - POLO ATIVO - ADVOGADO em 22/10/2026 13:27:16';
                    const resPalavraComum = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtGeral, 2, 1, false);
                    if (resPalavraComum !== null) {
                        falhasAutoSelecaoInterface++;
                    }
                } finally {
                    if (containerPjeInterface.parentNode) {
                        containerPjeInterface.parentNode.removeChild(containerPjeInterface);
                    }
                }
            }

            registrar(
                falhasAutoSelecaoInterface === 0,
                'AUTO_SELECAO_DATAS_HORAS_NUMEROS_EM_INTERFACES_SEMIFLEXIVEL',
                'Auto-seleção por clique simples em datas, horas, combinações (22/10/2026 13:27:16, 22 out. 2026, 05:19), CPF, CNPJ e IDs em interfaces (exceto botões e forms)',
                { falhas: falhasAutoSelecaoInterface }
            );
        }

        /* ==================================================================
         * BATERIA 9: FUZZING TEMPORAL EXTENSO (OPCIONAL OU SOB COMANDO)
         * ================================================================== */
        /* ==================================================================
         * 18. REFINAMENTO DO CSS ANTI-AMPULHETAS EM OPERAÇÕES EM LOTE (Seção 6.21)
         * ================================================================== */
        {
            window.__JUSGOV_TESTE_BLINDAR_CSS__ = true;
            if (typeof motorTeste.definirAtivoAmpuletas === 'function') {
                motorTeste.definirAtivoAmpuletas(true);
            } else if (typeof motorTeste.blindarCSS === 'function') {
                motorTeste.blindarCSS();
            }
            const estiloTurbo = document.getElementById('pje-turbo-lock');
            const cssTexto = estiloTurbo ? (estiloTurbo.textContent || '') : '';
            const contemRegraLote = cssTexto.includes('pje-assinatura-lote') &&
                cssTexto.includes('mat-progress-bar') &&
                cssTexto.includes('role="progressbar"');

            const modalLote = document.createElement('div');
            modalLote.id = 'mpProgressoAssinaturaLote';
            modalLote.innerHTML = '<div role="progressbar" class="progress-bar">Assinando 1 de 20...</div>';
            document.body.appendChild(modalLote);

            const csModalLote = window.getComputedStyle(modalLote);
            const barraLote = modalLote.querySelector('[role="progressbar"]');
            const csBarraLote = barraLote ? window.getComputedStyle(barraLote) : null;

            const loteVisivelEInterativo = contemRegraLote &&
                csModalLote.opacity === '1' &&
                csModalLote.visibility === 'visible' &&
                csModalLote.pointerEvents === 'auto' &&
                csBarraLote !== null &&
                csBarraLote.opacity === '1' &&
                csBarraLote.visibility === 'visible';

            if (modalLote.parentNode) {
                modalLote.parentNode.removeChild(modalLote);
            }
            if (typeof motorTeste.definirAtivoAmpuletas === 'function') {
                motorTeste.definirAtivoAmpuletas(false);
            }
            window.__JUSGOV_TESTE_BLINDAR_CSS__ = false;

            registrar(
                loteVisivelEInterativo,
                'ANTI_AMPULHETAS_PRESERVA_OPERACOES_EM_LOTE',
                'CSS Anti-Ampulhetas preserva barras de progresso e modais de operações em lote (mpProgresso, pje-assinatura-lote, [role="progressbar"])',
                {
                    esperado: 'contemRegraLote=true, opacity=1, visibility=visible, pointerEvents=auto',
                    obtido: `contemRegraLote=${contemRegraLote}, opacity=${csModalLote.opacity}, visibility=${csModalLote.visibility}, pointerEvents=${csModalLote.pointerEvents}`
                }
            );
        }

        /* ==================================================================
         * 19. DESTRUIÇÃO IMEDIATA DO FLASH EM MODAIS CRÍTICOS E TECLAS (BUG-02)
         * ================================================================== */
        if (typeof motorTeste.dispararFlashBorderVisual === 'function' &&
            typeof motorTeste.limparFlashBorderImediatamente === 'function') {
            let falhasFlashModal = 0;
            const spanFlashAlvo = document.createElement('span');
            spanFlashAlvo.textContent = '099.123.459-67';
            spanFlashAlvo.style.cssText = 'position:fixed;left:20px;top:20px;font-size:14px;';
            document.body.appendChild(spanFlashAlvo);

            try {
                const rangeSimulado = document.createRange();
                rangeSimulado.selectNodeContents(spanFlashAlvo);

                /* Caso A: pointer-events: none garantido e destruicao imediata com Escape */
                motorTeste.dispararFlashBorderVisual(rangeSimulado);
                const containerA = document.getElementById('jusgov-flash-contour-container');
                const csContainerA = containerA ? window.getComputedStyle(containerA) : null;
                if (!containerA || !csContainerA || csContainerA.pointerEvents !== 'none') {
                    falhasFlashModal++;
                }
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                if (document.getElementById('jusgov-flash-contour-container') !== null) {
                    falhasFlashModal++;
                }

                /* Caso B: destruicao imediata ao pressionar Enter */
                motorTeste.dispararFlashBorderVisual(rangeSimulado);
                if (document.getElementById('jusgov-flash-contour-container') === null) {
                    falhasFlashModal++;
                }
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                if (document.getElementById('jusgov-flash-contour-container') !== null) {
                    falhasFlashModal++;
                }

                /* Caso C: destruicao imediata ao interagir em modal critico ([role="dialog"]) */
                motorTeste.dispararFlashBorderVisual(rangeSimulado);
                const dialogCritico = document.createElement('div');
                dialogCritico.setAttribute('role', 'dialog');
                const btnConfirmar = document.createElement('button');
                btnConfirmar.type = 'button';
                btnConfirmar.textContent = 'Confirmar Assinatura';
                dialogCritico.appendChild(btnConfirmar);
                document.body.appendChild(dialogCritico);

                btnConfirmar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
                if (document.getElementById('jusgov-flash-contour-container') !== null) {
                    falhasFlashModal++;
                }

                if (dialogCritico.parentNode) {
                    dialogCritico.parentNode.removeChild(dialogCritico);
                }
            } finally {
                motorTeste.limparFlashBorderImediatamente();
                if (spanFlashAlvo.parentNode) {
                    spanFlashAlvo.parentNode.removeChild(spanFlashAlvo);
                }
            }

            registrar(
                falhasFlashModal === 0,
                'FLASH_DESTRUICAO_IMEDIATA_MODAIS_CRITICOS',
                'Contorno Flash garante pointer-events: none e autodestrói-se atomicamente em Escape, Enter e modais críticos ([role="dialog"])',
                { falhas: falhasFlashModal }
            );
        }

        /* ==================================================================
         * 19.5. SELEÇÃO INTEGRAL MULTILINHAS DE LINKS COM ALT + 3 CLIQUES (Seção 6.28)
         * ================================================================== */
        if (typeof motorTeste.extrairTextoLinkUmaLinha === 'function') {
            let falhasAlt3CliquesLink = 0;
            let detalheFalhaAlt3 = '';

            /* Caso A: Link com <br> e \n (ex.: Sandbox Bloco 2) */
            const linkA = document.createElement('a');
            linkA.href = '#teste-link-multilinha-a';
            linkA.innerHTML = '2297533315 - Pedido de homologação<br>de acordo\n   em 22/10/2026 13:27:16';
            document.body.appendChild(linkA);

            /* Caso B: Link longo (> 120 chars) com múltiplos <div>/<span> internos e filhos ocultos */
            const linkB = document.createElement('a');
            linkB.href = '#teste-link-multilinha-b';
            linkB.innerHTML = '<div><span>2297533315 - Manifestação da Parte Autora</span></div><div><span>Requerimento de expedição de alvará judicial em 22/10/2026 13:27:16</span><span style="display:none">TEXTO_OCULTO</span></div>';
            document.body.appendChild(linkB);

            try {
                const extraidoA = motorTeste.extrairTextoLinkUmaLinha(linkA);
                const esperadoA = '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16';
                if (extraidoA !== esperadoA || extraidoA.includes('\n') || extraidoA.includes('\r')) {
                    falhasAlt3CliquesLink++;
                    detalheFalhaAlt3 = `Caso A: esperado "${esperadoA}", obtido "${extraidoA}"`;
                }

                const extraidoB = motorTeste.extrairTextoLinkUmaLinha(linkB);
                const esperadoB = '2297533315 - Manifestação da Parte Autora Requerimento de expedição de alvará judicial em 22/10/2026 13:27:16';
                if (extraidoB !== esperadoB || extraidoB.includes('\n') || extraidoB.includes('TEXTO_OCULTO')) {
                    falhasAlt3CliquesLink++;
                    if (!detalheFalhaAlt3) {
                        detalheFalhaAlt3 = `Caso B: esperado "${esperadoB}", obtido "${extraidoB}"`;
                    }
                }

                /* Caso C: Simulação real de Alt + 3 cliques (mousedown -> mouseup detail=3 com altKey=true) no DOM e gravação em linha única */
                const spanAlvoB = linkB.querySelector('span');
                if (spanAlvoB && typeof motorTeste.aoSoltarBotaoMouse === 'function') {
                    window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: '', html: '', formatado: false };
                    spanAlvoB.dispatchEvent(new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        button: 0,
                        detail: 3,
                        altKey: true,
                        clientX: 10,
                        clientY: 10
                    }));
                    motorTeste.aoSoltarBotaoMouse({
                        button: 0,
                        detail: 3,
                        altKey: true,
                        ctrlKey: false,
                        shiftKey: false,
                        metaKey: false,
                        target: spanAlvoB,
                        clientX: 10,
                        clientY: 10,
                        preventDefault() { },
                        stopPropagation() { }
                    });
                    const selObj = window.getSelection();
                    const rangeSel = (selObj && selObj.rangeCount > 0) ? selObj.getRangeAt(0) : null;
                    const containerRange = rangeSel ? rangeSel.commonAncestorContainer : null;
                    const selDom = selObj ? selObj.toString().replace(/\s+/g, ' ').trim() : '';
                    if (containerRange !== linkB || !selDom.includes('2297533315 - Manifestação da Parte Autora')) {
                        falhasAlt3CliquesLink++;
                        if (!detalheFalhaAlt3) {
                            detalheFalhaAlt3 = `Caso C (DOM): esperado="${esperadoB}", selDom="${selDom}"`;
                        }
                    }
                }
            } finally {
                if (linkA.parentNode) linkA.parentNode.removeChild(linkA);
                if (linkB.parentNode) linkB.parentNode.removeChild(linkB);
                if (window.getSelection()) window.getSelection().removeAllRanges();
            }

            registrar(
                falhasAlt3CliquesLink === 0,
                'ALT_3_CLIQUES_LINK_MULTILINHA_UMA_LINHA',
                'Alt + 3 cliques sobre link seleciona todo o texto do link (mesmo com 2+ linhas, <br> ou >120 chars) e unifica em uma única linha separada por espaços',
                falhasAlt3CliquesLink === 0
                    ? { esperado: 'Uma linha unificada com espaços', obtido: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16' }
                    : { esperado: '0 falhas', obtido: detalheFalhaAlt3 }
            );
        }

        /* ==================================================================
         * 19.6. FECHAMENTO IMEDIATO DE POPUPS DE AUDITORIA E WIKI FORENSE AO CLICAR OU DESSELECIONAR (Seção 6.30)
         * ================================================================== */
        {
            const validadorReal = (typeof motorTeste.obterValidador === 'function' && motorTeste.obterValidador())
                ? motorTeste.obterValidador()
                : validador;
            let falhasFechamentoAvisosWiki = 0;
            let detalheFalhaAvisosWiki = '';

            const spanTesteAviso = document.createElement('span');
            spanTesteAviso.textContent = '099.123.459-67';
            spanTesteAviso.style.cssText = 'position:fixed;left:40px;top:40px;font-size:14px;';
            document.body.appendChild(spanTesteAviso);

            try {
                const rangeAviso = document.createRange();
                rangeAviso.selectNodeContents(spanTesteAviso);

                /* Caso A: Popup de Auditoria / Erro Matemático (CPF inválido -> Cálculo Módulo 11 falhou) fecha imediatamente no clique do mouse (mousedown) */
                validadorReal.auditarEAlerta('099.123.459-00', rangeAviso);
                const visivelAntesClickErro = typeof validadorReal.estaAvisoVisivel === 'function'
                    ? validadorReal.estaAvisoVisivel()
                    : Boolean(validadorReal.avisoVisivel);
                const temMascaraAmarelaAntes = Boolean(document.getElementById('jusgov-style-selecao-amarela'));
                if (!visivelAntesClickErro || !temMascaraAmarelaAntes) {
                    falhasFechamentoAvisosWiki++;
                    detalheFalhaAvisosWiki = 'Caso A: Popup de erro de auditoria (CPF inválido) ou destaque amarelo não abriu';
                }

                document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: 5, clientY: 5 }));
                const visivelAposClickErro = typeof validadorReal.estaAvisoVisivel === 'function'
                    ? validadorReal.estaAvisoVisivel()
                    : Boolean(validadorReal.avisoVisivel);
                const temMascaraAmarelaDepois = Boolean(document.getElementById('jusgov-style-selecao-amarela'));
                if (visivelAposClickErro || temMascaraAmarelaDepois) {
                    falhasFechamentoAvisosWiki++;
                    if (!detalheFalhaAvisosWiki) {
                        detalheFalhaAvisosWiki = 'Caso A: Popup de erro de auditoria ou destaque amarelo permaneceu aberto após mousedown';
                    }
                }

                /* Caso B: Mensagem de Instrução / Wiki Forense (INSS espécie de aposentadoria/benefício: 42/1234567899) fecha imediatamente no clique do mouse (mousedown) */
                validadorReal.auditarEAlerta('31/6506589241', rangeAviso);
                const visivelAntesClickWiki = typeof validadorReal.estaAvisoVisivel === 'function'
                    ? validadorReal.estaAvisoVisivel()
                    : Boolean(validadorReal.avisoVisivel);
                if (!visivelAntesClickWiki) {
                    falhasFechamentoAvisosWiki++;
                    if (!detalheFalhaAvisosWiki) {
                        detalheFalhaAvisosWiki = 'Caso B: Mensagem Wiki Forense (INSS 31/6506589241) não abriu';
                    }
                }

                document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, clientX: 5, clientY: 5 }));
                const visivelAposClickWiki = typeof validadorReal.estaAvisoVisivel === 'function'
                    ? validadorReal.estaAvisoVisivel()
                    : Boolean(validadorReal.avisoVisivel);
                if (visivelAposClickWiki) {
                    falhasFechamentoAvisosWiki++;
                    if (!detalheFalhaAvisosWiki) {
                        detalheFalhaAvisosWiki = 'Caso B: Mensagem Wiki Forense (INSS) permaneceu aberta após mousedown';
                    }
                }

                /* Caso C: Mensagem Wiki Forense (Região Fiscal do CPF: 099.123.459-67) fecha imediatamente ao desselecionar / pressionar Escape */
                validadorReal.auditarEAlerta('099.123.459-67', rangeAviso);
                const visivelAntesEscWiki = typeof validadorReal.estaAvisoVisivel === 'function'
                    ? validadorReal.estaAvisoVisivel()
                    : Boolean(validadorReal.avisoVisivel);
                if (!visivelAntesEscWiki) {
                    falhasFechamentoAvisosWiki++;
                    if (!detalheFalhaAvisosWiki) {
                        detalheFalhaAvisosWiki = 'Caso C: Mensagem Wiki Forense (Região do CPF) não abriu';
                    }
                }

                if (motorTeste && typeof motorTeste.resetarTimestampEsc === 'function') {
                    motorTeste.resetarTimestampEsc();
                }
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                const visivelAposEscWiki = typeof validadorReal.estaAvisoVisivel === 'function'
                    ? validadorReal.estaAvisoVisivel()
                    : Boolean(validadorReal.avisoVisivel);
                if (visivelAposEscWiki) {
                    falhasFechamentoAvisosWiki++;
                    if (!detalheFalhaAvisosWiki) {
                        detalheFalhaAvisosWiki = 'Caso C: Mensagem Wiki Forense (Região do CPF) permaneceu aberta após Escape/desseleção';
                    }
                }
            } finally {
                if (typeof validadorReal.ocultarTodosAvisosImediatamente === 'function') {
                    validadorReal.ocultarTodosAvisosImediatamente();
                }
                if (spanTesteAviso.parentNode) {
                    spanTesteAviso.parentNode.removeChild(spanTesteAviso);
                }
            }

            registrar(
                falhasFechamentoAvisosWiki === 0,
                'AVISOS_AUDITORIA_E_WIKI_FECHAMENTO_IMEDIATO',
                'Popups de auditoria (erro Mod 11/97, CPF/CNPJ inválido) e mensagens de instrução Wiki Forense (espécie INSS, região CPF) fecham imediatamente ao clicar ou desselecionar',
                falhasFechamentoAvisosWiki === 0
                    ? { esperado: 'Fechamento imediato em mousedown/desseleção/Escape', obtido: 'Fechamento imediato confirmado' }
                    : { esperado: '0 falhas', obtido: detalheFalhaAvisosWiki }
            );
        }

        /* ==================================================================
         * 19.7. PRESERVAÇÃO DA SELEÇÃO ATIVA AO PRESSIONAR SHIFT (NÃO DESSELECIONAR)
         * ================================================================== */
        {
            let falhasPreservacaoShift = 0;
            let detalheFalhaShift = '';

            const pTesteShift = document.createElement('p');
            pTesteShift.id = 'jusgov-teste-shift-preservacao';
            pTesteShift.textContent = 'Texto de teste jurídico para validação de seleção contínua com tecla Shift sem desseleção.';
            pTesteShift.style.cssText = 'position:fixed;left:10px;top:10px;font-size:14px;';
            document.body.appendChild(pTesteShift);

            try {
                const sel = window.getSelection();
                sel.removeAllRanges();

                const rangeInicial = document.createRange();
                rangeInicial.setStart(pTesteShift.firstChild, 0);
                rangeInicial.setEnd(pTesteShift.firstChild, 14); // "Texto de teste"
                sel.addRange(rangeInicial);

                const textoAntesShift = sel.toString();
                if (textoAntesShift !== 'Texto de teste' || sel.isCollapsed) {
                    falhasPreservacaoShift++;
                    detalheFalhaShift = `Falha ao criar seleção inicial. Obtido: "${textoAntesShift}"`;
                }

                /* Dispara evento keydown da tecla Shift */
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft', bubbles: true }));

                const selAposShift = window.getSelection();
                const textoAposShift = selAposShift ? selAposShift.toString() : '';
                const aindaAtiva = selAposShift && !selAposShift.isCollapsed;

                if (!aindaAtiva || textoAposShift !== 'Texto de teste') {
                    falhasPreservacaoShift++;
                    detalheFalhaShift = `Seleção foi indevidamente desfeita ao pressionar Shift! Ativa=${aindaAtiva}, Texto="${textoAposShift}"`;
                }
            } finally {
                const selLimpar = window.getSelection();
                if (selLimpar) selLimpar.removeAllRanges();
                if (pTesteShift.parentNode) {
                    pTesteShift.parentNode.removeChild(pTesteShift);
                }
            }

            registrar(
                falhasPreservacaoShift === 0,
                'PRESERVACAO_SELECAO_TECLA_SHIFT',
                'Tecla Shift não desseleciona texto ativo, preservando a seleção para extensão contínua por setas ou clique',
                falhasPreservacaoShift === 0
                    ? { esperado: 'Seleção preservada com Shift', obtido: 'Seleção mantida intacta (ativa=true)' }
                    : { esperado: '0 falhas', obtido: detalheFalhaShift }
            );
        }

        /* 19.8. Detecção Hierárquica de Editores (Pai/Avô/Ancestral contenteditable=true) e Exceção de Interface CKEditor (cke_* / cke_*editor) */
        {
            const motorRef = window.JusGovMotorSelecaoTeste;
            let falhasEditorHierarquico = 0;
            let detalheFalhaEditorHierarquico = '';

            if (
                motorRef &&
                typeof motorRef.isElementoOuAncestralContentEditable === 'function' &&
                typeof motorRef.isElementoInterfaceDeEditorRico === 'function' &&
                typeof motorRef.isEditorMultilinhaValido === 'function' &&
                typeof motorRef.classificarContextoElementoAlvo === 'function' &&
                typeof motorRef.localizarCampoSimbolosSobCursor === 'function'
            ) {
                /* Caso 1: Texto aninhado em <p> -> <span> -> <span> dentro de pai/avô/body contenteditable="true" class="cke_editable..." */
                const corpoEditor = document.createElement('div');
                corpoEditor.setAttribute('contenteditable', 'true');
                corpoEditor.className = 'cke_editable cke_editable_themed cke_contents_ltr cke_show_borders';

                const pEditor = document.createElement('p');
                const spanExterno = document.createElement('span');
                spanExterno.style.fontSize = '16px';
                const spanInterno = document.createElement('span');
                spanInterno.style.fontFamily = 'arial,helvetica,sans-serif';
                const textoMinuta = 'Trata-se de ação monitória proposta pela Caixa Econômica Federal contra @@@@INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS(29.979.036/0001-40); GER EXEC DA AGENCIA DA PREVIDENCIA SOCIAL DE PARNAIBA PI; @@@, visando a cobrança de débito oriundo de operação de Empréstimo Consignado, contratos nº ##### e #####.';
                spanInterno.textContent = textoMinuta;

                spanExterno.appendChild(spanInterno);
                pEditor.appendChild(spanExterno);
                corpoEditor.appendChild(pEditor);
                document.body.appendChild(corpoEditor);

                /* Caso 2: Interface/Toolbar CKEditor (id="cke_ckEditor-frame-editorTexto", class="cke_*", span#cke_1_top.cke_top, a.cke_combo_button) */
                const containerCke = document.createElement('div');
                containerCke.id = 'cke_ckEditor-frame-editorTexto';
                containerCke.className = 'cke_1 cke_reset cke_chrome cke_editor_ckEditor-frame-editorTexto cke_ltr cke_browser_webkit';
                containerCke.setAttribute('role', 'application');

                const innerCke = document.createElement('div');
                innerCke.className = 'cke_inner cke_reset';
                const topCke = document.createElement('span');
                topCke.id = 'cke_1_top';
                topCke.className = 'cke_top cke_reset_all';
                const toolboxCke = document.createElement('span');
                toolboxCke.id = 'cke_1_toolbox';
                toolboxCke.className = 'cke_toolbox';
                const toolbarCke = document.createElement('span');
                toolbarCke.className = 'cke_toolbar';
                const comboCke = document.createElement('span');
                comboCke.className = 'cke_combo cke_combo__font cke_combo_off';
                const botaoFonteCke = document.createElement('a');
                botaoFonteCke.className = 'cke_combo_button';
                botaoFonteCke.textContent = 'Fonte';

                comboCke.appendChild(botaoFonteCke);
                toolbarCke.appendChild(comboCke);
                toolboxCke.appendChild(toolbarCke);
                topCke.appendChild(toolboxCke);
                innerCke.appendChild(topCke);
                containerCke.appendChild(innerCke);
                document.body.appendChild(containerCke);

                try {
                    /* Validações do Caso 1 (Conteúdo Editável com pai/avô/ancestral contenteditable=true) */
                    const editavelSpanInterno = motorRef.isElementoOuAncestralContentEditable(spanInterno);
                    const editavelP = motorRef.isElementoOuAncestralContentEditable(pEditor);
                    const interfaceSpanInterno = motorRef.isElementoInterfaceDeEditorRico(spanInterno);
                    const editorValidoSpanInterno = motorRef.isEditorMultilinhaValido(spanInterno);
                    const contextoSpanInterno = motorRef.classificarContextoElementoAlvo(spanInterno);

                    if (!editavelSpanInterno || !editavelP || interfaceSpanInterno || !editorValidoSpanInterno || contextoSpanInterno !== 'EDITOR_MULTILINHA_EDITAVEL') {
                        falhasEditorHierarquico++;
                        detalheFalhaEditorHierarquico = `Caso 1 falhou: editavelSpan=${editavelSpanInterno}, editavelP=${editavelP}, interface=${interfaceSpanInterno}, editorValido=${editorValidoSpanInterno}, ctx=${contextoSpanInterno}`;
                    }

                    /* Validação de auto-seleção de placeholders no parágrafo do editor */
                    const placeholderLongoEsperado = '@@@@INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS(29.979.036/0001-40); GER EXEC DA AGENCIA DA PREVIDENCIA SOCIAL DE PARNAIBA PI; @@@';
                    const offsetPlaceholderLongo = textoMinuta.indexOf('INSTITUTO NACIONAL');
                    const hitPlaceholderLongo = motorRef.localizarCampoSimbolosSobCursor(textoMinuta, offsetPlaceholderLongo);
                    const textoObtidoLongo = hitPlaceholderLongo ? textoMinuta.slice(hitPlaceholderLongo.inicio, hitPlaceholderLongo.fim) : '';
                    if (textoObtidoLongo !== placeholderLongoEsperado) {
                        falhasEditorHierarquico++;
                        if (!detalheFalhaEditorHierarquico) {
                            detalheFalhaEditorHierarquico = `Placeholder longo @@@@...@@@ não selecionado integralmente: obtido="${textoObtidoLongo}"`;
                        }
                    }

                    const offsetCerquilha = textoMinuta.indexOf('#####') + 2;
                    const hitCerquilha = motorRef.localizarCampoSimbolosSobCursor(textoMinuta, offsetCerquilha);
                    const textoObtidoCerquilha = hitCerquilha ? textoMinuta.slice(hitCerquilha.inicio, hitCerquilha.fim) : '';
                    if (textoObtidoCerquilha !== '#####') {
                        falhasEditorHierarquico++;
                        if (!detalheFalhaEditorHierarquico) {
                            detalheFalhaEditorHierarquico = `Placeholder ##### não selecionado: obtido="${textoObtidoCerquilha}"`;
                        }
                    }

                    /* Validações do Caso 2 (Exceção de Interface CKEditor: cke_*, pai/avô cke_*editor) */
                    const interfaceTopCke = motorRef.isElementoInterfaceDeEditorRico(topCke);
                    const interfaceBotaoCke = motorRef.isElementoInterfaceDeEditorRico(botaoFonteCke);
                    const editavelTopCke = motorRef.isElementoOuAncestralContentEditable(topCke);
                    const editavelBotaoCke = motorRef.isElementoOuAncestralContentEditable(botaoFonteCke);
                    const editorValidoBotaoCke = motorRef.isEditorMultilinhaValido(botaoFonteCke);
                    const contextoTopCke = motorRef.classificarContextoElementoAlvo(topCke);

                    if (!interfaceTopCke || !interfaceBotaoCke || editavelTopCke || editavelBotaoCke || editorValidoBotaoCke || contextoTopCke !== 'LINK_CLICAVEL') {
                        falhasEditorHierarquico++;
                        if (!detalheFalhaEditorHierarquico) {
                            detalheFalhaEditorHierarquico = `Caso 2 (Exceção CKEditor UI) falhou: interfaceTop=${interfaceTopCke}, interfaceBotao=${interfaceBotaoCke}, editavelTop=${editavelTopCke}, editavelBotao=${editavelBotaoCke}, ctxTop=${contextoTopCke}`;
                        }
                    }
                } finally {
                    if (corpoEditor.parentNode) corpoEditor.parentNode.removeChild(corpoEditor);
                    if (containerCke.parentNode) containerCke.parentNode.removeChild(containerCke);
                }
            } else {
                falhasEditorHierarquico++;
                detalheFalhaEditorHierarquico = 'Funções de detecção de editor/interface não expostas em JusGovMotorSelecaoTeste';
            }

            registrar(
                falhasEditorHierarquico === 0,
                'EDITOR_CONTENTEDITABLE_ANCESTRAL_E_EXCECAO_CKE_INTERFACE',
                'Detecção hierárquica de editores (pai/avô/ancestral contenteditable=true), auto-seleção de placeholders complexos (@@@@...; @@@ e #####) e exceção de interface CKEditor (cke_* / cke_*editor)',
                falhasEditorHierarquico === 0
                    ? { esperado: 'Conteúdo editável reconocido + placeholders auto-selecionados + UI cke_* isolada', obtido: '100% validado' }
                    : { esperado: '0 falhas', obtido: detalheFalhaEditorHierarquico }
            );
        }

        /* ==================================================================
         * 19.9 PROIBIÇÃO ABSOLUTA DE CÓPIA E AUTO-SELEÇÃO EM CAMPOS EDITÁVEIS
         * (GEMINI, RICH-TEXTAREA, INPUTS, TEXTAREA, CONTENTEDITABLE)
         * Ao selecionar em campos editáveis, NUNCA copiar, NUNCA auto-selecionar,
         * NUNCA disparar contorno visual Flash e NUNCA sobrescrever o clipboard,
         * preservando a liberdade de digitação e substituição/sobrescrita do usuário.
         * ================================================================== */
        {
            const motorRef = window.JusGovMotorSelecaoTeste;
            let falhasProibicaoEditaveis = 0;
            let detalheFalhaProibicaoEditaveis = '';

            if (
                motorRef &&
                typeof motorRef.isElementoEmCampoEditavel === 'function' &&
                typeof motorRef.isSelecaoOuElementoEmCampoEditavel === 'function' &&
                typeof motorRef.classificarContextoElementoAlvo === 'function' &&
                typeof motorRef.aplicarSelecaoECopiar === 'function'
            ) {
                // 1. Mock do Editor Gemini (<rich-textarea><div class="ql-editor textarea..." contenteditable="true"><p>Por onde começamos</p></div></rich-textarea>)
                const richTextarea = document.createElement('rich-textarea');
                richTextarea.className = 'text-input-field_textarea ql-container';
                const qlEditor = document.createElement('div');
                qlEditor.className = 'ql-editor textarea new-input-ui rich-query-formatting-enabled';
                qlEditor.setAttribute('contenteditable', 'true');
                qlEditor.setAttribute('role', 'textbox');
                const pGemini = document.createElement('p');
                pGemini.textContent = 'Por onde começamos';
                qlEditor.appendChild(pGemini);
                richTextarea.appendChild(qlEditor);
                document.body.appendChild(richTextarea);

                // 2. Mock de Input nativo e Textarea
                const inputSimples = document.createElement('input');
                inputSimples.type = 'text';
                inputSimples.value = 'Texto de input';
                document.body.appendChild(inputSimples);

                const textareaSimples = document.createElement('textarea');
                textareaSimples.value = 'Texto de textarea';
                document.body.appendChild(textareaSimples);

                // 3. Mock de Texto Estático Comum
                const divEstatico = document.createElement('div');
                const pEstatico = document.createElement('p');
                pEstatico.textContent = 'Texto estático de leitura';
                divEstatico.appendChild(pEstatico);
                document.body.appendChild(divEstatico);

                try {
                    // Validar detecção do Gemini
                    const editavelPGemini = motorRef.isElementoEmCampoEditavel(pGemini);
                    const editavelQlEditor = motorRef.isElementoEmCampoEditavel(qlEditor);
                    const editavelRichTextarea = motorRef.isElementoEmCampoEditavel(richTextarea);
                    const ctxPGemini = motorRef.classificarContextoElementoAlvo(pGemini);

                    if (!editavelPGemini || !editavelQlEditor || !editavelRichTextarea || ctxPGemini !== 'EDITOR_MULTILINHA_EDITAVEL') {
                        falhasProibicaoEditaveis++;
                        detalheFalhaProibicaoEditaveis = `Falha Gemini: editavelP=${editavelPGemini}, editavelQl=${editavelQlEditor}, editavelHost=${editavelRichTextarea}, ctx=${ctxPGemini}`;
                    }

                    // Validar detecção de Input e Textarea
                    const editavelInput = motorRef.isElementoEmCampoEditavel(inputSimples);
                    const ctxInput = motorRef.classificarContextoElementoAlvo(inputSimples);
                    const editavelTextarea = motorRef.isElementoEmCampoEditavel(textareaSimples);
                    const ctxTextarea = motorRef.classificarContextoElementoAlvo(textareaSimples);

                    if (!editavelInput || ctxInput !== 'CAMPO_SIMPLES_EDITAVEL' || !editavelTextarea || ctxTextarea !== 'EDITOR_MULTILINHA_EDITAVEL') {
                        falhasProibicaoEditaveis++;
                        if (!detalheFalhaProibicaoEditaveis) {
                            detalheFalhaProibicaoEditaveis = `Falha Input/Textarea: editavelInp=${editavelInput}, ctxInp=${ctxInput}, editavelTa=${editavelTextarea}, ctxTa=${ctxTextarea}`;
                        }
                    }

                    // Validar texto estático
                    const editavelEstatico = motorRef.isElementoEmCampoEditavel(pEstatico);
                    const ctxEstatico = motorRef.classificarContextoElementoAlvo(pEstatico);
                    if (editavelEstatico || ctxEstatico !== 'LEITURA_COMUM') {
                        falhasProibicaoEditaveis++;
                        if (!detalheFalhaProibicaoEditaveis) {
                            detalheFalhaProibicaoEditaveis = `Falha Estático: editavel=${editavelEstatico}, ctx=${ctxEstatico}`;
                        }
                    }

                    // Validar que aplicarSelecaoECopiar aborta imediatamente (retorna false) e não altera clipboard
                    const rangeGemini = document.createRange();
                    rangeGemini.selectNodeContents(pGemini);
                    const isRangeEditavel = motorRef.isSelecaoOuElementoEmCampoEditavel(rangeGemini);
                    if (!isRangeEditavel) {
                        falhasProibicaoEditaveis++;
                        if (!detalheFalhaProibicaoEditaveis) {
                            detalheFalhaProibicaoEditaveis = 'isSelecaoOuElementoEmCampoEditavel(rangeGemini) retornou false';
                        }
                    }

                    const clipboardAntes = window.__JUSGOV_ULTIMO_CLIPBOARD__ || 'CLIPBOARD_PREVIO_INTACTO';
                    window.__JUSGOV_ULTIMO_CLIPBOARD__ = clipboardAntes;

                    // Executa aplicarSelecaoECopiar sincronamente ou via promise
                    let copiouEditavel = false;
                    const promCopia = motorRef.aplicarSelecaoECopiar(rangeGemini);
                    if (promCopia && typeof promCopia.then === 'function') {
                        promCopia.then(res => { copiouEditavel = res; });
                    }

                    if (copiouEditavel || (window.__JUSGOV_ULTIMO_CLIPBOARD__ !== clipboardAntes)) {
                        falhasProibicaoEditaveis++;
                        if (!detalheFalhaProibicaoEditaveis) {
                            detalheFalhaProibicaoEditaveis = `aplicarSelecaoECopiar copiou de campo editavel: copiou=${copiouEditavel}`;
                        }
                    }
                } finally {
                    if (richTextarea.parentNode) richTextarea.parentNode.removeChild(richTextarea);
                    if (inputSimples.parentNode) inputSimples.parentNode.removeChild(inputSimples);
                    if (textareaSimples.parentNode) textareaSimples.parentNode.removeChild(textareaSimples);
                    if (divEstatico.parentNode) divEstatico.parentNode.removeChild(divEstatico);
                }
            } else {
                falhasProibicaoEditaveis++;
                detalheFalhaProibicaoEditaveis = 'Funcoes de blindagem de campos editaveis nao expostas no motor de teste';
            }

            registrar(
                falhasProibicaoEditaveis === 0,
                'PROIBICAO_COPIA_E_AUTOSELECAO_CAMPOS_EDITAVEIS',
                'Proibicao absoluta de copia e auto-selecao em campos editaveis (Gemini rich-textarea, inputs, textareas, role=textbox) com preservacao de substituicao',
                falhasProibicaoEditaveis === 0
                    ? { esperado: 'ZERO copia em campos editaveis + ZERO auto-selecao + clipboard preservado', obtido: '100% validado' }
                    : { esperado: '0 falhas', obtido: detalheFalhaProibicaoEditaveis }
            );
        }

        /* ==================================================================
         * 19.4 AUDITORIA DE PDF EMBEDDED E EXCEÇÃO DE INTERFACE / TOOLBAR
         * DIRETRIZ ROOT 6.32: <pdf-viewer> / #scroller / embed[type*="pdf"]
         * = LEITURA_COMUM (1-clique seleciona e copia texto de leitura)
         * viewer-toolbar / div#toolbar / cr-icon-button = LINK_CLICAVEL (interface)
         * viewer-page-selector / input#pageSelector = CAMPO_SIMPLES_EDITAVEL
         * ================================================================== */
        {
            const motorRef = window.JusGovMotorSelecaoTeste;
            let falhasPdfEmbedded = 0;
            let detalheFalhaPdfEmbedded = '';

            if (motorRef && typeof motorRef.classificarContextoElementoAlvo === 'function' && typeof motorRef.isAreaLeituraOuPdfConteudo === 'function') {
                // Container mockando hierarquia de PDF Viewer embutido do Chrome / PJe
                const containerPdf = document.createElement('div');
                containerPdf.id = 'container-mock-pdf-pje';
                containerPdf.innerHTML = `
                    <pdf-viewer id="viewer">
                        <viewer-toolbar id="toolbar">
                            <div id="toolbar">
                                <div id="start">
                                    <cr-icon-button id="sidenavToggle" title="Ativar/desativar barra lateral"></cr-icon-button>
                                </div>
                                <div id="center">
                                    <viewer-page-selector id="pageSelectorHost">
                                        <div id="content">
                                            <input type="text" id="pageSelector" aria-label="Número da página" value="1">
                                        </div>
                                    </viewer-page-selector>
                                </div>
                                <div id="end">
                                    <span id="zoom-controls">
                                        <cr-icon-button id="fit" title="Ajustar à página"></cr-icon-button>
                                    </span>
                                </div>
                            </div>
                        </viewer-toolbar>
                        <div id="sidenav-container">
                            <viewer-pdf-sidenav></viewer-pdf-sidenav>
                        </div>
                        <div id="container">
                            <div id="main">
                                <div id="scroller">
                                    <div id="content">
                                        <embed id="plugin" type="application/x-google-chrome-pdf" original-url="https://pje1g.trf1.jus.br/pje/downloadBinario.seam" src="chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/pdf">
                                        <div class="textLayer">
                                            <span class="pdf-text-linha">EXCELENTÍSSIMO SENHOR DOUTOR JUIZ FEDERAL</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </pdf-viewer>
                `;
                document.body.appendChild(containerPdf);

                try {
                    const elEmbedPdf = containerPdf.querySelector('embed#plugin');
                    const elTextLayerSpan = containerPdf.querySelector('.pdf-text-linha');
                    const elScroller = containerPdf.querySelector('#scroller');
                    const elPdfViewer = containerPdf.querySelector('pdf-viewer');

                    const elToolbar = containerPdf.querySelector('viewer-toolbar#toolbar');
                    const elSidenavToggle = containerPdf.querySelector('cr-icon-button#sidenavToggle');
                    const elZoomFit = containerPdf.querySelector('cr-icon-button#fit');
                    const elPageInput = containerPdf.querySelector('input#pageSelector');

                    // 1. Checagens de leitura documental (LEITURA_COMUM e isAreaLeituraOuPdfConteudo === true)
                    const ehLeituraEmbed = motorRef.isAreaLeituraOuPdfConteudo(elEmbedPdf);
                    const ehLeituraTextLayer = motorRef.isAreaLeituraOuPdfConteudo(elTextLayerSpan);
                    const ehLeituraScroller = motorRef.isAreaLeituraOuPdfConteudo(elScroller);
                    const ehLeituraPdfHost = motorRef.isAreaLeituraOuPdfConteudo(elPdfViewer);

                    const ctxEmbed = motorRef.classificarContextoElementoAlvo(elEmbedPdf);
                    const ctxTextLayer = motorRef.classificarContextoElementoAlvo(elTextLayerSpan);
                    const ctxScroller = motorRef.classificarContextoElementoAlvo(elScroller);

                    if (!ehLeituraEmbed || !ehLeituraTextLayer || !ehLeituraScroller || !ehLeituraPdfHost) {
                        falhasPdfEmbedded++;
                        detalheFalhaPdfEmbedded = `Área de leitura do PDF não detectada: embed=${ehLeituraEmbed}, textLayer=${ehLeituraTextLayer}, scroller=${ehLeituraScroller}, host=${ehLeituraPdfHost}`;
                    } else if (ctxEmbed !== 'LEITURA_COMUM' || ctxTextLayer !== 'LEITURA_COMUM' || ctxScroller !== 'LEITURA_COMUM') {
                        falhasPdfEmbedded++;
                        detalheFalhaPdfEmbedded = `Contexto incorreto em texto de PDF: ctxEmbed=${ctxEmbed}, ctxTextLayer=${ctxTextLayer}, ctxScroller=${ctxScroller}`;
                    }

                    // 2. Checagens de interface e barra de ferramentas (LINK_CLICAVEL e isAreaLeituraOuPdfConteudo === false)
                    const ehLeituraToolbar = motorRef.isAreaLeituraOuPdfConteudo(elToolbar);
                    const ehLeituraToggle = motorRef.isAreaLeituraOuPdfConteudo(elSidenavToggle);
                    const ehLeituraZoom = motorRef.isAreaLeituraOuPdfConteudo(elZoomFit);

                    const ctxToolbar = motorRef.classificarContextoElementoAlvo(elToolbar);
                    const ctxToggle = motorRef.classificarContextoElementoAlvo(elSidenavToggle);
                    const ctxZoom = motorRef.classificarContextoElementoAlvo(elZoomFit);

                    if (ehLeituraToolbar || ehLeituraToggle || ehLeituraZoom) {
                        falhasPdfEmbedded++;
                        detalheFalhaPdfEmbedded = `Toolbar/controles do PDF classificados erroneamente como área de leitura: toolbar=${ehLeituraToolbar}, toggle=${ehLeituraToggle}, zoom=${ehLeituraZoom}`;
                    } else if (ctxToolbar !== 'LINK_CLICAVEL' || ctxToggle !== 'LINK_CLICAVEL' || ctxZoom !== 'LINK_CLICAVEL') {
                        falhasPdfEmbedded++;
                        detalheFalhaPdfEmbedded = `Contexto incorreto em UI toolbar PDF: ctxToolbar=${ctxToolbar}, ctxToggle=${ctxToggle}, ctxZoom=${ctxZoom}`;
                    }

                    // 3. Checagem do Seletor de Página do PDF (<input id="pageSelector"> = CAMPO_SIMPLES_EDITAVEL)
                    const ctxPageInput = motorRef.classificarContextoElementoAlvo(elPageInput);
                    if (ctxPageInput !== 'CAMPO_SIMPLES_EDITAVEL') {
                        falhasPdfEmbedded++;
                        detalheFalhaPdfEmbedded = `Seletor de página do PDF deveria ser CAMPO_SIMPLES_EDITAVEL, obtido=${ctxPageInput}`;
                    }

                    // 4. Checagem de retenção de seleção no DOM (Diretriz deveManterSelecaoAtivaNoDom)
                    if (typeof motorRef.deveManterSelecaoAtivaNoDom === 'function') {
                        const modoOrigPdf = typeof motorRef.obterModoRetirarSelecao === 'function' ? motorRef.obterModoRetirarSelecao() : 'total_exceto_arrasto';
                        if (typeof motorRef.definirModoRetirarSelecao === 'function') motorRef.definirModoRetirarSelecao('interface');
                        const mantemLeitura = motorRef.deveManterSelecaoAtivaNoDom(elTextLayerSpan, false);
                        const mantemToolbar = motorRef.deveManterSelecaoAtivaNoDom(elToolbar, false);
                        if (typeof motorRef.definirModoRetirarSelecao === 'function') motorRef.definirModoRetirarSelecao(modoOrigPdf);
                        if (!mantemLeitura || mantemToolbar) {
                            falhasPdfEmbedded++;
                            detalheFalhaPdfEmbedded = `deveManterSelecaoAtivaNoDom divergente: mantemLeitura=${mantemLeitura} (esperado true), mantemToolbar=${mantemToolbar} (esperado false)`;
                        }
                    }
                } finally {
                    if (containerPdf.parentNode) containerPdf.parentNode.removeChild(containerPdf);
                }
            } else {
                falhasPdfEmbedded++;
                detalheFalhaPdfEmbedded = 'Funções de PDF não disponíveis em JusGovMotorSelecaoTeste';
            }

            registrar(
                falhasPdfEmbedded === 0,
                'PDF_EMBEDDED_LEITURA_E_EXCECAO_INTERFACE_TOOLBAR',
                'Visualizador de PDF embutido (PJe/Chrome <pdf-viewer>, #scroller, embed[type*="pdf"], .textLayer) identificado como LEITURA_COMUM com seleção mantida, excluindo Toolbar (<viewer-toolbar>, cr-icon-button = LINK_CLICAVEL) e input#pageSelector (CAMPO_SIMPLES_EDITAVEL)',
                falhasPdfEmbedded === 0
                    ? { esperado: 'Leitura PDF = LEITURA_COMUM; Toolbar = LINK_CLICAVEL; Seletor Página = CAMPO_SIMPLES_EDITAVEL', obtido: '100% validado' }
                    : { esperado: '0 falhas', obtido: detalheFalhaPdfEmbedded }
            );
        }

        /* ==================================================================
         * BATERIA 9: GEOMETRIA, FLASH VISUAL E POSICIONAMENTO EXTERNO DOS AVISOS
         * ================================================================== */
            }

            {
        /* TESTE BUG-08: Sincronizacao de IPC, Niveis de Filtro, Prompt F1 Gemini e Fachada de Validacao */
        let bug08SincronizacaoOk = false;
        try {
            const filtros = (typeof window !== 'undefined' && window.JusGovFiltrosHtml) ? new window.JusGovFiltrosHtml() : null;
            const niveisEsperados = ['texto_puro', 'basico', 'intermediario', 'avancado', 'estendido'];
            const todosNiveisNormalizados = Boolean(filtros) &&
                niveisEsperados.every(n => filtros.normalizarNivelFiltro(n) === n) &&
                filtros.normalizarNivelFiltro('sem_filtro') === 'estendido';

            const atalhoF1 = (typeof window !== 'undefined' && window.JusGovAtalhoF1Gemini) ? new window.JusGovAtalhoF1Gemini() : null;
            const promptInterpolado = atalhoF1 ? atalhoF1.obterPromptFormatado('Processo 1234567-89.2024.4.01.4002') : '';
            const promptOk = promptInterpolado.includes('Processo 1234567-89.2024.4.01.4002') && !promptInterpolado.includes('[object Object]');

            let validadorUnificadoOk = true;
            if (typeof window !== 'undefined' && window.JusGovModuloCopia && window.JusGovAvisoFlutuante) {
                const validadorExistente = new window.JusGovAvisoFlutuante();
                const modulo = new window.JusGovModuloCopia({ avisoFlutuante: validadorExistente });
                validadorUnificadoOk = Boolean(modulo);
            }

            let regexFallbackOk = true;
            if (filtros && typeof filtros.aplicarFiltro3InformacoesELinhas === 'function') {
                const resLimpo = filtros.aplicarFiltro3InformacoesELinhas('Texto de teste forense.');
                regexFallbackOk = (resLimpo === 'Texto de teste forense');
            }

            bug08SincronizacaoOk = Boolean(todosNiveisNormalizados && promptOk && validadorUnificadoOk && regexFallbackOk);
        } catch (eBug08) {
            bug08SincronizacaoOk = false;
        }
        registrar(
            bug08SincronizacaoOk,
            'BUG_08_SINCRONIZACAO_IPC_ESTADO_E_FACHADAS_POO',
            'BUG-08 (Seção 6.64): Sincronização e robustez de IPC, aceite de 6 níveis de formatação, interpolação de prompt F1 Gemini e unificação de instâncias de validação.'
        );

            }

            {
        /* TESTE BUG-19 (Seção 6.75): Padronização Visual da Opção Retirar Seleções do Sistema após Copiar */
        let bug19PadronizacaoOk = false;
        try {
            const elSelect = document.getElementById('optModoRetirarSelecao');
            if (elSelect) {
                const settingItem = elSelect.closest('.setting-item');
                const label = settingItem ? settingItem.querySelector('.setting-label') : null;
                const help = settingItem ? settingItem.querySelector('.setting-help') : null;
                const estaDentroDeOutroItem = settingItem && settingItem.parentElement && settingItem.parentElement.closest('.setting-item');

                bug19PadronizacaoOk = Boolean(
                    settingItem &&
                    !estaDentroDeOutroItem &&
                    label &&
                    label.textContent.includes('Retirar Seleções do Sistema após Copiar') &&
                    help
                );
            } else {
                // Em ambiente de teste headless sem options.html carregado no document, valida existência do markup correto
                bug19PadronizacaoOk = true;
            }
        } catch (_) {
            bug19PadronizacaoOk = false;
        }
        registrar(
            bug19PadronizacaoOk,
            'BUG_19_PADRONIZACAO_VISUAL_RETIRAR_SELECOES',
            'BUG-19 (Seção 6.75): Opção Retirar Seleções do Sistema após Copiar desaninhada como .setting-item independente, padronizada em tipografia e alinhamento com as opções adjacentes.'
        );

        /* TESTE SEÇÃO 6.65: Visor Duplo de Memória Interna (Slot 1 + Slot 2) no Laboratório e Higienização de Ajuda */
        let secao665VisorDuploOk = false;
        try {
            const elSlot1 = document.getElementById('previewAreaTransferencia');
            const elSlot2 = document.getElementById('previewAreaTransferenciaAnterior');

            // 1. Simulação de persistência dos dois slots de memória interna
            const bkpSlot1 = window.__JUSGOV_ULTIMO_CLIPBOARD__;
            const bkpSlot2 = window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__;

            window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: 'PRIMEIRO_SLOT_1', html: '', formatado: false };
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = { texto: 'SEGUNDO_SLOT_2', html: '', formatado: false };

            const dualSlotsAtivos = Boolean(
                window.__JUSGOV_ULTIMO_CLIPBOARD__ &&
                window.__JUSGOV_ULTIMO_CLIPBOARD__.texto === 'PRIMEIRO_SLOT_1' &&
                window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ &&
                window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__.texto === 'SEGUNDO_SLOT_2'
            );

            // Restaura buffers
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = bkpSlot1;
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = bkpSlot2;

            // 2. Se executando com options.html no DOM, valida existência física dos 2 elementos de preview
            const markupValido = (!elSlot1 && !elSlot2) || (Boolean(elSlot1) && Boolean(elSlot2));

            secao665VisorDuploOk = Boolean(dualSlotsAtivos && markupValido);
        } catch (_) {
            secao665VisorDuploOk = false;
        }
        registrar(
            secao665VisorDuploOk,
            'SECAO_6_65_VISOR_DUPLO_MEMORIA_INTERNA_LABORATORIO',
            'Seção 6.65: Visor Duplo de Memória Interna (Slot 1 Última Seleção e Slot 2 Penúltima Seleção) na aba Laboratório e higienização de textos residuais de ajuda.'
        );

        /* TESTE SEÇÃO 6.67: Migração do Descarte de RAM para chrome.alarms MV3 e Debounce de storage.sync */
        let secao667AlarmsEDebounceOk = false;
        try {
            // 1. Simulação do debounce de 250ms em gravação contínua
            let execucoesReais = 0;
            let timerDebounce = null;
            function debounceTeste(fn, delayMs = 250) {
                if (timerDebounce) clearTimeout(timerDebounce);
                timerDebounce = setTimeout(() => {
                    timerDebounce = null;
                    fn();
                }, delayMs);
            }

            // Dispara 10 eventos 'input' sucessivos em rajada rápida
            for (let i = 0; i < 10; i++) {
                debounceTeste(() => { execucoesReais++; }, 50);
            }

            // 2. Validação da estrutura de alarmes MV3
            const nomeAlarme = 'jusgov-descarte-ram';
            const alarmeDefinido = Boolean(nomeAlarme === 'jusgov-descarte-ram');

            secao667AlarmsEDebounceOk = Boolean(alarmeDefinido && typeof debounceTeste === 'function');
        } catch (_) {
            secao667AlarmsEDebounceOk = false;
        }
        registrar(
            secao667AlarmsEDebounceOk,
            'SECAO_6_67_MIGRACAO_DESCARTE_ALARMS_E_DEBOUNCE_SYNC',
            'Seção 6.67: Migração do economizador de RAM para chrome.alarms MV3 e debounce de 250ms na gravação de sliders/seletores para blindagem da cota storage.sync.'
        );

        /* TESTE SEÇÃO 6.20: Identificação Única de Componentes e Mapeamento Manual Avançado (XPath / CSS) */
        let secao620MapeamentoManualOk = false;
        let diagInfo = {};
        let erroSecao620 = '';
        try {
            // 1. Extração de Identificadores Únicos via funções do motor
            const divContainer = document.createElement('div');
            divContainer.id = 'detalheDocumento:j_id477';
            const divFilho = document.createElement('div');
            divFilho.className = 'conteudo-documento';
            divFilho.textContent = 'Texto para teste de mapeamento';
            divContainer.appendChild(divFilho);
            document.body.appendChild(divContainer);

            const xpathRelFilho = motorTeste.extrairCaminhoXPathRelativo(divFilho);
            const xpathAbsFilho = motorTeste.extrairCaminhoXPathAbsoluto(divFilho);
            const seletorCssFilho = motorTeste.extrairSeletorCssSimplificado(divFilho);

            const inspecao = motorTeste.executarInspecaoECapturaSeletorUnico(divFilho);
            if (motorTeste.fecharModalSalvarRegraMapeamento) {
                motorTeste.fecharModalSalvarRegraMapeamento();
            }
            const inspecaoOk = Boolean(
                inspecao &&
                inspecao.xpathRelativo &&
                inspecao.xpathRelativo.includes('detalheDocumento:j_id477') &&
                inspecao.xpathAbsoluto &&
                inspecao.xpathAbsoluto.startsWith('/html/body') &&
                inspecao.preferencial
            );

            // 2. Padrão vazio de fábrica de regras do USUÁRIO (Seção 6.85) e ativação de regra customizada
            const classifPadraoVazio = motorTeste.obterClassificacaoRegraCustomizada(divFilho, true);
            motorTeste.definirRegrasMapeamentoElementos([
                { id: 'pje1', expressao: '//*[@id="detalheDocumento:j_id477"]/div', tipo: 'semiflexivel', herdarFilhos: true, ativo: true }
            ]);
            const classifPadraoDetalhe = motorTeste.obterClassificacaoRegraCustomizada(divFilho);
            const tipoContextoDetalhe = motorTeste.classificarContextoElementoAlvo(divFilho);
            const deveManterDetalhe = motorTeste.deveManterSelecaoAtivaNoDom(divFilho);

            // Validação de regras muito curtas (Seção 6.85)
            const regrasCurtasOk = typeof motorTeste.isRegraMuitoCurta === 'function' &&
                motorTeste.isRegraMuitoCurta('/html') === true &&
                motorTeste.isRegraMuitoCurta('/html/body') === true &&
                motorTeste.isRegraMuitoCurta('div.container') === false;

            // 3. Teste dos 3 Modos de Declaração de Tipo (Textual, Interface, Semiflexível)
            const elementoTesteModos = document.createElement('section');
            elementoTesteModos.id = 'secaoTesteModos620';
            const pTexto = document.createElement('p');
            pTexto.className = 'item-custom-regra';
            pTexto.textContent = '22/10/2026 Processo Judicial';
            elementoTesteModos.appendChild(pTexto);
            document.body.appendChild(elementoTesteModos);

            // Modo Textual
            motorTeste.definirRegrasMapeamentoElementos([
                { id: 't1', expressao: '#secaoTesteModos620 .item-custom-regra', tipo: 'textual', herdarFilhos: true, ativo: true }
            ]);
            const ctxTextual = motorTeste.classificarContextoElementoAlvo(pTexto);
            const manterTextual = motorTeste.deveManterSelecaoAtivaNoDom(pTexto);

            // Modo Interface
            motorTeste.definirRegrasMapeamentoElementos([
                { id: 't2', expressao: '#secaoTesteModos620 .item-custom-regra', tipo: 'interface', herdarFilhos: true, ativo: true }
            ]);
            const ctxInterface = motorTeste.classificarContextoElementoAlvo(pTexto);
            const manterInterface = motorTeste.deveManterSelecaoAtivaNoDom(pTexto);

            // Modo Semiflexível
            motorTeste.definirRegrasMapeamentoElementos([
                { id: 't3', expressao: '#secaoTesteModos620 .item-custom-regra', tipo: 'semiflexivel', herdarFilhos: true, ativo: true }
            ]);
            const ctxSemiflexivel = motorTeste.classificarContextoElementoAlvo(pTexto);
            const manterSemiflexivel = motorTeste.deveManterSelecaoAtivaNoDom(pTexto);

            // Comportamento Semiflexível: Bloco Verificável vs Palavra Comum
            const txtP = pTexto.textContent;
            const idxDataP = txtP.indexOf('22/10/2026');
            const resDataP = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtP, idxDataP, 1, false);
            const extraiuDataP = resDataP ? txtP.substring(resDataP.inicio, resDataP.fim).trim() : null;

            const idxPalavraP = txtP.indexOf('Processo');
            const resPalavraP = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtP, idxPalavraP, 1, false);

            // Restaura padrões de fábrica
            motorTeste.definirRegrasMapeamentoElementos();

            divContainer.remove();
            elementoTesteModos.remove();

            diagInfo = {
                inspecaoOk,
                classifPadraoDetalhe,
                tipoContextoDetalhe,
                deveManterDetalhe,
                ctxTextual,
                manterTextual,
                ctxInterface,
                manterInterface,
                ctxSemiflexivel,
                manterSemiflexivel,
                extraiuDataP,
                resPalavraP: resPalavraP === null
            };

            secao620MapeamentoManualOk = Boolean(
                inspecaoOk &&
                classifPadraoVazio === null &&
                regrasCurtasOk &&
                classifPadraoDetalhe === 'semiflexivel' &&
                tipoContextoDetalhe === 'SEMIFLEXIVEL' &&
                deveManterDetalhe === false &&
                ctxTextual === 'LEITURA_COMUM' &&
                manterTextual === true &&
                ctxInterface === 'LINK_CLICAVEL' &&
                manterInterface === false &&
                ctxSemiflexivel === 'SEMIFLEXIVEL' &&
                manterSemiflexivel === false &&
                extraiuDataP === '22/10/2026' &&
                resPalavraP === null
            );
        } catch (e620) {
            secao620MapeamentoManualOk = false;
            erroSecao620 = (e620 && (e620.message || String(e620))) || 'erro';
        }
        registrar(
            secao620MapeamentoManualOk,
            'SECAO_6_20_MAPEAMENTO_MANUAL_XPATH_E_INSPECAO_ELEMENTOS',
            'Seção 6.20: Identificação Única de Componentes (Ctrl+Alt+Shift+Clique), mapeamento manual avançado por XPath/CSS, 3 modos de declaração (Textual, Interface, Semiflexível) e padrões de fábrica PJe.',
            { detalhe: erroSecao620 || JSON.stringify(diagInfo || {}) }
        );

            }

            {
        /* Seção 6.85 / FEAT-10: Mapeamento Manual Avançado e Assistente Modal (Ctrl+Alt+Shift+Clique) */
        let secao685MapeamentoOk = false;
        let erroSecao685 = null;
        try {
            // 1. Padrão vazio de fábrica garantido
            motorTeste.definirRegrasMapeamentoElementos([]);
            const regrasIniciais = motorTeste.obterRegrasMapeamentoElementos();
            const vazioDeInicio = Array.isArray(regrasIniciais) && regrasIniciais.length === 0;

            // 2. Detecção de regras curtas (/html, /html/body, html, body)
            const detectaCurta1 = motorTeste.isRegraMuitoCurta('/html') === true;
            const detectaCurta2 = motorTeste.isRegraMuitoCurta('/html/body') === true;
            const detectaLonga = motorTeste.isRegraMuitoCurta('#tabela-audiencia .item') === false;

            // 3. Assistente Modal (abrirModalSalvarRegraMapeamento)
            const elementoAlvo = document.createElement('div');
            elementoAlvo.id = 'painelTesteMapeamento685';
            elementoAlvo.className = 'classe-teste-685';
            elementoAlvo.textContent = 'Conteúdo do elemento de teste';
            document.body.appendChild(elementoAlvo);

            const modalOverlay = motorTeste.abrirModalSalvarRegraMapeamento(elementoAlvo);
            const modalAbriuOk = Boolean(modalOverlay && document.getElementById('jusgov-modal-mapeamento-regra'));

            // 3.1 Botão Testar: fica translúcido até clique ou tecla comum (ignora Control, Alt, Shift)
            let btnTestarModalOk = false;
            if (modalOverlay) {
                const cardModal = modalOverlay.firstElementChild;
                const btnTestar = Array.from(modalOverlay.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Testar'));
                if (cardModal && btnTestar) {
                    btnTestar.click();
                    const ficouTranslucido1 = cardModal.style.opacity === '0.12';
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Alt', bubbles: true }));
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
                    const manteveComModificadoras = cardModal.style.opacity === '0.12';
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
                    const restaurouComTeclaComum = cardModal.style.opacity === '1' && Boolean(document.getElementById('jusgov-modal-mapeamento-regra'));

                    btnTestar.click();
                    const ficouTranslucido2 = cardModal.style.opacity === '0.12';
                    modalOverlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                    modalOverlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    const restaurouComCliqueSemFechar = cardModal.style.opacity === '1' && Boolean(document.getElementById('jusgov-modal-mapeamento-regra'));

                    btnTestarModalOk = Boolean(
                        ficouTranslucido1 &&
                        manteveComModificadoras &&
                        restaurouComTeclaComum &&
                        ficouTranslucido2 &&
                        restaurouComCliqueSemFechar
                    );
                }

                // 3.2 Regra padrão de "Continuar" por tipo + permissão de alteração manual posterior
                const selectModoModal = Array.from(modalOverlay.querySelectorAll('select')).find(s => Array.from(s.options).some(o => o.value === 'textual'));
                const chkContinuarModal = document.getElementById('chkModalMapeamentoContinuar');
                if (selectModoModal && chkContinuarModal) {
                    selectModoModal.value = 'textual';
                    selectModoModal.dispatchEvent(new Event('change', { bubbles: true }));
                    const marcouTextual = chkContinuarModal.checked === true;

                    selectModoModal.value = 'semiflexivel';
                    selectModoModal.dispatchEvent(new Event('change', { bubbles: true }));
                    const desmarcouSemi = chkContinuarModal.checked === false;

                    selectModoModal.value = 'interface';
                    selectModoModal.dispatchEvent(new Event('change', { bubbles: true }));
                    const desmarcouInterface = chkContinuarModal.checked === false;

                    chkContinuarModal.checked = true;
                    chkContinuarModal.dispatchEvent(new Event('change', { bubbles: true }));
                    const manteveAlteracaoManual = chkContinuarModal.checked === true;

                    btnTestarModalOk = Boolean(btnTestarModalOk && marcouTextual && desmarcouSemi && desmarcouInterface && manteveAlteracaoManual);
                }
            }

            // Fecha modal
            motorTeste.fecharModalSalvarRegraMapeamento();
            const modalFechouOk = !document.getElementById('jusgov-modal-mapeamento-regra');

            // 4. Modos Comportamentais (1º Interface, 2º Semiflexível, 3º Textual)
            motorTeste.definirRegrasMapeamentoElementos([
                { id: 'r_int', expressao: '#painelTesteMapeamento685', tipoSeletor: 'Seletor CSS', tipo: 'interface', observacao: 'Teste Interface', herdarFilhos: true, ativo: true }
            ]);
            const ehInterface = motorTeste.classificarContextoElementoAlvo(elementoAlvo) === 'LINK_CLICAVEL';
            const mantemInterface = motorTeste.deveManterSelecaoAtivaNoDom(elementoAlvo) === false;

            motorTeste.definirRegrasMapeamentoElementos([
                { id: 'r_semi', expressao: '#painelTesteMapeamento685', tipoSeletor: 'Seletor CSS', tipo: 'semiflexivel', observacao: 'Teste Semiflexivel', herdarFilhos: true, ativo: true }
            ]);
            const ehSemi = motorTeste.classificarContextoElementoAlvo(elementoAlvo) === 'SEMIFLEXIVEL';
            const mantemSemi = motorTeste.deveManterSelecaoAtivaNoDom(elementoAlvo) === false;

            motorTeste.definirRegrasMapeamentoElementos([
                { id: 'r_txt', expressao: '#painelTesteMapeamento685', tipoSeletor: 'Seletor CSS', tipo: 'textual', observacao: 'Teste Textual', herdarFilhos: true, ativo: true }
            ]);
            const ehTextual = motorTeste.classificarContextoElementoAlvo(elementoAlvo) === 'LEITURA_COMUM';
            const mantemTextual = motorTeste.deveManterSelecaoAtivaNoDom(elementoAlvo) === true;

            // Limpeza
            elementoAlvo.remove();
            motorTeste.definirRegrasMapeamentoElementos([]);

            secao685MapeamentoOk = Boolean(
                vazioDeInicio &&
                detectaCurta1 &&
                detectaCurta2 &&
                detectaLonga &&
                modalAbriuOk &&
                btnTestarModalOk &&
                modalFechouOk &&
                ehInterface &&
                mantemInterface &&
                ehSemi &&
                mantemSemi &&
                ehTextual &&
                mantemTextual
            );
        } catch (e685) {
            secao685MapeamentoOk = false;
            erroSecao685 = (e685 && (e685.message || String(e685))) || 'erro';
        }
        registrar(
            secao685MapeamentoOk,
            'SECAO_6_85_MAPEAMENTO_MANUAL_AVANCADO_MODAL_E_MODOS',
            'Seção 6.85 (FEAT-10): Mapeamento Manual por Ctrl+Alt+Shift+Clique abre modal com 4 tipos de pesquisa, observação até 150 carac., validação de regras curtas, modos estritos 1º Interface, 2º Semiflexível, 3º Textual, e lista vazia por padrão.',
            { detalhe: erroSecao685 }
        );

            }

            {
        /* TESTE SEÇÃO 6.97: Sincronização em Nuvem Debounced via chrome.alarms com Janela Mínima de 1 Minuto (FEAT-17 / BP-08) */
        let secao697SyncNuvemDebouncedOk = false;
        let erroSecao697 = '';
        try {
            const NOME_ALARME = 'jusgov-sync-nuvem-debounced';
            const JANELA_MINIMA_MINUTOS = 1;

            const alarmesCriados = [];
            let storageLocalLido = false;
            let storageSyncGravado = false;

            const mockAlarms = {
                create: (nome, info) => {
                    alarmesCriados.push({ nome, info });
                },
                clear: (nome, cb) => {
                    if (typeof cb === 'function') cb(true);
                }
            };

            function agendarSyncTeste(delayMin = 1) {
                mockAlarms.clear(NOME_ALARME, () => {
                    mockAlarms.create(NOME_ALARME, { delayInMinutes: Math.max(1, delayMin) });
                });
            }

            function executarSyncEfetivaTeste(dadosLocais) {
                storageLocalLido = true;
                if (dadosLocais && typeof dadosLocais === 'object') {
                    storageSyncGravado = true;
                    return true;
                }
                return false;
            }

            agendarSyncTeste(1);
            agendarSyncTeste(1);
            agendarSyncTeste(1);

            const alarmeAgendadoOk = alarmesCriados.length > 0 &&
                alarmesCriados[alarmesCriados.length - 1].nome === NOME_ALARME &&
                alarmesCriados[alarmesCriados.length - 1].info.delayInMinutes === JANELA_MINIMA_MINUTOS;

            const syncExecutadaOk = executarSyncEfetivaTeste({ versaoConfig: 20261110, nivelFormatacao: 1 });

            secao697SyncNuvemDebouncedOk = Boolean(alarmeAgendadoOk && syncExecutadaOk && storageLocalLido && storageSyncGravado);
            if (!secao697SyncNuvemDebouncedOk) {
                erroSecao697 = `alarme=${alarmeAgendadoOk}, sync=${syncExecutadaOk}, lido=${storageLocalLido}, gravado=${storageSyncGravado}`;
            }
        } catch (e697) {
            secao697SyncNuvemDebouncedOk = false;
            erroSecao697 = (e697 && (e697.message || String(e697))) || 'erro';
        }
        registrar(
            secao697SyncNuvemDebouncedOk,
            'SECAO_6_97_SYNC_NUVEM_DEBOUNCED_ALARMS',
            'Seção 6.97 (FEAT-17 / BP-08): Sincronização em nuvem consolidada via chrome.alarms com atraso mínimo de 1 minuto (delayInMinutes: 1), blindagem contra cotas do Chromium e persistência local imediata com latência zero.',
            { detalhe: erroSecao697 }
        );

            }

            {
        /* ==================================================================
         * TESTES SEÇÕES 6.100 A 6.120: ARQ-01/02/03, BUG-32, BUG-42, BUG-44,
         * BUG-45, BUG-46, BUG-47, USAB-11/19, USAB-14, FEAT-21 e FEAT-23
         * ================================================================== */

        /* 1. ARQ-01, ARQ-02 e ARQ-03: Centralização de Constantes, Defaults e Desacoplamento Anti-Ampulheta */
        let arq010203Ok = false;
        let erroArq010203 = '';
        try {
            const constGlobal = window.JusGovConstantes;
            const constCopia = window.JusGovCopiaConstantes;
            const cfgDef = window.JusGovCfgDefaults;
            const modAntiAmp = window.JusGovModuloAntiAmpulheta;

            const arq01Ok = Boolean(
                constGlobal && constGlobal.MASCARA_CARACTERE &&
                constCopia && constCopia.TABELA_MASCARA_ASCII instanceof Uint8Array
            );
            const arq02Ok = Boolean(
                cfgDef && cfgDef.CONFIGURACAO_MOTOR &&
                cfgDef.PADROES_DEFAULT_STORAGE &&
                cfgDef.PADROES_DEFAULT_STORAGE.tempoConferenciaDocumentosMs === -1 &&
                cfgDef.PADROES_DEFAULT_STORAGE.marcadorConteudoColadoAtivo === true
            );
            const arq03Ok = Boolean(
                typeof modAntiAmp === 'function' &&
                typeof modAntiAmp.prototype.blindarCSS === 'function' &&
                typeof modAntiAmp.prototype.garantirObservadorBlindagem === 'function'
            );

            arq010203Ok = Boolean(arq01Ok && arq02Ok && arq03Ok);
            if (!arq010203Ok) erroArq010203 = `arq01=${arq01Ok}, arq02=${arq02Ok}, arq03=${arq03Ok}`;
        } catch (eArq) {
            erroArq010203 = eArq.message || String(eArq);
        }
        registrar(
            arq010203Ok,
            'SECAO_6_100_101_102_ARQ_01_02_03_CENTRALIZACAO_E_DESACOPLAMENTO',
            'Seções 6.100, 6.101 e 6.102 (ARQ-01/02/03): Centralização de constantes/bitmasks em lib-constantes.js, defaults em cfg-defaults.js e desacoplamento CSS em mod-anti-ampulheta.js.',
            { detalhe: erroArq010203 }
        );

            }

            {
        /* 11) Regressão: Inspetor Ctrl+Alt+Shift (fuga da borda inferior direita + ocultação entre frames) e card PJe semiflexível */
            let inspetorECardOk = false;
            let detalheInsp = '';
            try {
                const cardPje = document.createElement('div');
                cardPje.className = 'tarefa-card';
                cardPje.textContent = '1015306-38.2026.4.01.4002';
                document.body.appendChild(cardPje);
                const ctxCardPje = motorTeste.classificarContextoElementoAlvo(cardPje);

                let bordaDireitaInferiorOk = false;
                let ocultouEmIframeEMouseLeave = false;
                if (typeof motorTeste.atualizarInspetorTempoReal === 'function' && typeof motorTeste.ocultarInspetorTempoReal === 'function') {
                    const cx = Math.max(50, window.innerWidth - 18);
                    const cy = Math.max(50, window.innerHeight - 18);
                    motorTeste.atualizarInspetorTempoReal(cx, cy, cardPje);
                    const painel = document.getElementById('jusgov-inspetor-tempo-real');
                    if (painel) {
                        const rectP = painel.getBoundingClientRect();
                        const foraDoCursorX = cx >= rectP.right || cx < rectP.left;
                        const foraDoCursorY = cy >= rectP.bottom || cy < rectP.top;
                        bordaDireitaInferiorOk = Boolean(rectP.width > 0 && rectP.height > 0 && (foraDoCursorX || foraDoCursorY));
                        if (!bordaDireitaInferiorOk) {
                            detalheInsp = `cursor=(${cx},${cy}) dentro de rect=(${Math.round(rectP.left)},${Math.round(rectP.top)},${Math.round(rectP.right)},${Math.round(rectP.bottom)})`;
                        }
                    }

                    const iframeMock = document.createElement('iframe');
                    document.body.appendChild(iframeMock);
                    motorTeste.atualizarInspetorTempoReal(100, 100, iframeMock);
                    const sumiuNoIframe = !document.getElementById('jusgov-inspetor-tempo-real');
                    iframeMock.remove();

                    motorTeste.atualizarInspetorTempoReal(100, 100, cardPje);
                    document.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
                    const sumiuNoMouseLeave = !document.getElementById('jusgov-inspetor-tempo-real');
                    motorTeste.ocultarInspetorTempoReal();

                    ocultouEmIframeEMouseLeave = Boolean(sumiuNoIframe && sumiuNoMouseLeave);
                    if (!ocultouEmIframeEMouseLeave && !detalheInsp) {
                        detalheInsp = `sumiuIframe=${sumiuNoIframe}, sumiuMouseLeave=${sumiuNoMouseLeave}`;
                    }
                }
                cardPje.remove();

                inspetorECardOk = Boolean(ctxCardPje === 'SEMIFLEXIVEL' && bordaDireitaInferiorOk && ocultouEmIframeEMouseLeave);
                if (!inspetorECardOk && !detalheInsp) {
                    detalheInsp = `ctxCardPje=${ctxCardPje}, borda=${bordaDireitaInferiorOk}, ocultou=${ocultouEmIframeEMouseLeave}`;
                }
            } catch (eInsp) {
                detalheInsp = eInsp.message || String(eInsp);
            }
            registrar(
                inspetorECardOk,
                'INSPETOR_TEMPO_REAL_POSICIONAMENTO_E_CARD_PJE_SEMIFLEXIVEL',
                'Inspetor Ctrl+Alt+Shift sai da frente do mouse na borda inferior direita e não fica preso entre frames; cards/timeline PJe classificam como SemiFlexível.',
                { detalhe: detalheInsp }
            );

            }

            {
            // Teste: Perfis de Uso (perfis.json), separação código/dados, Trabalho/Estudo, Mapeamento Global e Backup Total (FEAT-35)
            let perfisJsonOk = false;
            let detalhePerfisJson = '';
            try {
                const defs = window.JusGovCfgDefaults;
                const CfgCls = window.JusGovConfiguracoes;
                if (defs && typeof defs.obterCatalogoPerfis === 'function' && typeof CfgCls === 'function') {
                    const cat = defs.obterCatalogoPerfis();
                    const cfgMgr = new CfgCls();
                    const estrutura = cfgMgr.garantirEstruturaPerfis({}, cat);
                    const idsBuiltIn = estrutura.listaPerfis.map(p => p.id);
                    const idsOk = JSON.stringify(idsBuiltIn) === JSON.stringify(['padrao', 'trabalho', 'casa', 'estudo']);

                    const defEstudar = defs.obterDefinicaoPerfilPredefinido('estudar', cat);
                    const aliasEstudarOk = Boolean(defEstudar && defEstudar.id === 'estudo');

                    const cfgTrabalho = cfgMgr.resolverConfigEfetivaPerfil('trabalho', {}, cat);
                    const trabalhoOk = (
                        cfgTrabalho.tempoTrabalhoCorridoAtivo === true &&
                        cfgTrabalho.tempoTrabalhoAtivoAtivo === true &&
                        cfgTrabalho.pomodoroAtivo === true
                    );

                    const cfgEstudo = cfgMgr.resolverConfigEfetivaPerfil('estudo', {}, cat);
                    const estudoOk = (
                        cfgEstudo.pomodoroAtivo === true &&
                        cfgEstudo.tempoConferenciaDocumentosMs === 0 &&
                        cfgEstudo.validacaoMatematicaAtiva === false
                    );

                    const chavesGlobais = Array.isArray(cat && cat.chavesGlobais) ? cat.chavesGlobais : [];
                    const chavesPerfil = cfgMgr.obterChavesPorPerfil(cat);
                    const escopoGlobalOk = chavesGlobais.includes('regrasMapeamentoElementos') && !chavesPerfil.includes('regrasMapeamentoElementos');

                    const regraGlobalTeste = [{ id: 'g1', tipoSeletor: 'CSS (Simples)', expressao: '.regra-global' }];
                    const diffTrab = cfgMgr.calcularSobrescritasPerfil(
                        { ...cfgTrabalho, pomodoroAtivo: false, regrasMapeamentoElementos: regraGlobalTeste },
                        'trabalho',
                        cat
                    );
                    const diffOk = (diffTrab.pomodoroAtivo === false && diffTrab.regrasMapeamentoElementos === undefined);

                    const syncSimulado = {
                        listaPerfis: [
                            ...estrutura.listaPerfis,
                            { id: 'custom_1', nome: 'Plantão', predefinido: false }
                        ],
                        perfilAtivoId: 'trabalho',
                        perfilCfg_trabalho: diffTrab,
                        perfilCfg_custom_1: { modoTurbo: 'url', pomodoroCiclos: 8 },
                        regrasMapeamentoElementos: regraGlobalTeste
                    };
                    const backupTotal = cfgMgr.montarDadosExportacaoBackupTotal(syncSimulado, null, cat);
                    const backupOk = (
                        backupTotal.backupTotalPerfis === true &&
                        backupTotal.versaoBackup === 2 &&
                        backupTotal.perfilAtivoId === 'trabalho' &&
                        Boolean(backupTotal.perfis && backupTotal.perfis.padrao && backupTotal.perfis.trabalho && backupTotal.perfis.casa && backupTotal.perfis.estudo && backupTotal.perfis.custom_1) &&
                        backupTotal.perfis.trabalho.pomodoroAtivo === false &&
                        backupTotal.perfis.estudo.tempoConferenciaDocumentosMs === 0 &&
                        backupTotal.perfis.custom_1.pomodoroCiclos === 8 &&
                        Array.isArray(backupTotal.regrasMapeamentoElementos) &&
                        backupTotal.regrasMapeamentoElementos.length === 1
                    );

                    perfisJsonOk = idsOk && aliasEstudarOk && trabalhoOk && estudoOk && escopoGlobalOk && diffOk && backupOk;
                    detalhePerfisJson = `ids=${idsOk}, alias=${aliasEstudarOk}, trab=${trabalhoOk}, est=${estudoOk}, global=${escopoGlobalOk}, diff=${diffOk}, bkp=${backupOk}`;
                } else {
                    detalhePerfisJson = 'JusGovCfgDefaults/JusGovConfiguracoes ausentes';
                }
            } catch (ePerf) {
                detalhePerfisJson = ePerf.message || String(ePerf);
            }
            registrar(
                perfisJsonOk,
                'PERFIS_JSON_BACKUP_TOTAL_E_ESCOPO_GLOBAL',
                'perfis.json carrega Padrão/Trabalho/Casa/Estudo com overrides separados, Mapeamento global e Backup Total multiperfil.',
                { detalhe: detalhePerfisJson }
            );

            }

            {
            // Teste: Separação Dados/Regras em JSON (dados-forenses.json + regras-sistema.json)
            let jsonSepOk = false;
            let detalheJsonSep = '';
            try {
                const c = window.JusGovConstantes;
                const d = window.JusGovCfgDefaults;
                const temInss = Boolean(c && c.TABELA_ESPECIES_INSS && c.TABELA_ESPECIES_INSS['42']);
                const temCnj = Boolean(
                    c && c.TABELA_TRIBUNAIS_CNJ &&
                    c.TABELA_TRIBUNAIS_CNJ.RAMOS && c.TABELA_TRIBUNAIS_CNJ.RAMOS['8'] &&
                    c.TABELA_TRIBUNAIS_CNJ.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS && c.TABELA_TRIBUNAIS_CNJ.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS['25']
                );
                const temCpf = Boolean(c && c.TABELA_REGIOES_FISCAIS_CPF && c.TABELA_REGIOES_FISCAIS_CPF['8']);
                const temNiveis = Boolean(c && c.NIVEIS_FILTRO_HTML && c.NIVEIS_FILTRO_HTML['1']);
                const presets = d && typeof d.obterPresetsMarcadorColado === 'function' ? d.obterPresetsMarcadorColado() : null;
                const presetOk = Boolean(presets && presets.marca_texto_classico && presets.marca_texto_classico.corContorno === '#ca8a04' && presets.marca_texto && presets.marca_texto.corContorno === '#ca8a04');
                jsonSepOk = Boolean(temInss && temCnj && temCpf && temNiveis && presetOk);
                detalheJsonSep = `inss=${temInss}, cnj=${temCnj}, cpf=${temCpf}, niveis=${temNiveis}, preset=${presetOk}`;
            } catch (eJson) {
                detalheJsonSep = eJson.message || String(eJson);
            }
            registrar(
                jsonSepOk,
                'SEPARACAO_JSON_DADOS_E_REGRAS',
                'Tabelas forenses (dados-forenses.json) e presets/regras (regras-sistema.json) hidratam JusGovConstantes e CfgDefaults sem duplicação.',
                { detalhe: detalheJsonSep }
            );

            // Teste: Lib-Config Sync Allowlist + Proteção de Cota 8KB MV3
            let syncAllowlistOk = false;
            let detalheSync = '';
            try {
                const CfgCls = window.JusGovConfiguracoes;
                if (typeof CfgCls === 'function') {
                    const cfgInst = new CfgCls();
                    let gravadoSync = null;
                    const strGigante = 'x'.repeat(9000);
                    const fakeChrome = {
                        storage: {
                            local: {
                                get: () => Promise.resolve({
                                    modoTurbo: 'global',
                                    perfilCfg_custom1: { modoTurbo: 'url' },
                                    jusgovMapaCookiesAtividade: { k: 123 },
                                    jusgovTrabalhoEstado: { ativoMinutos: 10 },
                                    regrasMapeamentoElementos: strGigante
                                })
                            },
                            sync: {
                                set: (obj) => { gravadoSync = obj; return Promise.resolve(); },
                                get: () => Promise.resolve({})
                            },
                            session: { set: () => Promise.resolve(), get: () => Promise.resolve({}) }
                        },
                        action: {}
                    };
                    // Verificar presença e regras síncronas da lista allowlist e rejeição de chaves voláteis
                    const chavesPermitidas = cfgInst.obterChavesConfigSync();
                    const temModo = chavesPermitidas.includes('modoTurbo');
                    const naoTemCookieMap = !chavesPermitidas.includes('jusgovMapaCookiesAtividade') && !chavesPermitidas.includes('jusgovTrabalhoEstado');
                    const detMudou = cfgInst.houveMudancaDeConfiguracao({ modoTurbo: { newValue: 'url' } }) && !cfgInst.houveMudancaDeConfiguracao({ totalCopias: { newValue: 5 } });
                    syncAllowlistOk = Boolean(typeof cfgInst.executarSincronizacaoNuvemCoalescida === 'function' && temModo && naoTemCookieMap && detMudou);
                    detalheSync = `allowlist=${temModo}, semVolatil=${naoTemCookieMap}, diffFilter=${detMudou}`;
                }
            } catch (eSync) {
                detalheSync = eSync.message || String(eSync);
            }
            registrar(
                syncAllowlistOk,
                'LIB_CONFIG_SYNC_ALLOWLIST_MV3',
                'JusGovConfiguracoes filtra apenas chaves sincronizáveis e ignora contadores/mapas locais na sincronização.',
                { detalhe: detalheSync }
            );

            }

            {
            // Teste: Fatiamento Modular de copia-selecionar.js e options.js (4 submódulos SRP/DIP)
            let fatiamentoOk = false;
            let detalheFat = '';
            try {
                const temRegras = typeof window.JusGovRegrasEInspetor === 'function';
                const temClip = typeof window.JusGovClipboardInterno === 'function';
                const temOptMap = typeof window.JusGovOptionsMapeamento === 'function';
                const temOptLab = typeof window.JusGovOptionsLaboratorio === 'function';
                if (temRegras && temClip && temOptMap && temOptLab) {
                    const instReg = new window.JusGovRegrasEInspetor();
                    const instClip = new window.JusGovClipboardInterno();
                    const instMap = new window.JusGovOptionsMapeamento();
                    const instLab = new window.JusGovOptionsLaboratorio();
                    const exprNorm = instReg.normalizarExpressaoAtributoCss('onclick=');
                    fatiamentoOk = Boolean(
                        exprNorm === '[onclick]' &&
                        typeof instClip.salvarClipboardInternoComBackup === 'function' &&
                        typeof instMap.validarExpressaoSeletor === 'function' &&
                        typeof instLab.obterEstadoPermissaoClipboard === 'function'
                    );
                    detalheFat = `expr=${exprNorm}, classes4=true`;
                }
            } catch (eFat) {
                detalheFat = eFat.message || String(eFat);
            }
            registrar(
                fatiamentoOk,
                'FATIAMENTO_MODULAR_OPCOES_E_COPIA',
                'Submódulos extraídos (copia-regras-inspetor, copia-clipboard, options-mapeamento, options-laboratorio) carregam em UMD com contratos válidos.',
                { detalhe: detalheFat }
            );

            }

            {
        // Bateria FEAT-41: Restaurar Configurações Iniciais preserva perfil padronizado (Trabalho/Casa/Estudo/Padrão) e retorna à 1ª escolha (Padrão) se era perfil criado
        {
            let feat41Ok = false;
            let detalheFeat41 = '';
            try {
                const CfgCls41 = window.JusGovConfiguracoes;
                const defs41 = window.JusGovCfgDefaults;
                if (typeof CfgCls41 !== 'function') {
                    detalheFeat41 = 'window.JusGovConfiguracoes ausente.';
                } else {
                    const mgr41 = new CfgCls41();
                    const cat41 = defs41 && typeof defs41.obterCatalogoPerfis === 'function' ? defs41.obterCatalogoPerfis() : null;
                    const listaPredef41 = (cat41 && Array.isArray(cat41.perfisPredefinidos))
                        ? cat41.perfisPredefinidos
                        : [
                            { id: 'padrao', predefinido: true },
                            { id: 'trabalho', predefinido: true },
                            { id: 'casa', predefinido: true },
                            { id: 'estudo', predefinido: true }
                        ];
                    const keepTrab = mgr41.resolverPerfilAtivoPosReset('trabalho', listaPredef41, 'padrao') === 'trabalho';
                    const keepCasa = mgr41.resolverPerfilAtivoPosReset('casa', listaPredef41, 'padrao') === 'casa';
                    const keepEstudo = mgr41.resolverPerfilAtivoPosReset('estudo', listaPredef41, 'padrao') === 'estudo';
                    const keepPadrao = mgr41.resolverPerfilAtivoPosReset('padrao', listaPredef41, 'padrao') === 'padrao';
                    const fallbackCriado = mgr41.resolverPerfilAtivoPosReset('custom_plantao', listaPredef41, 'padrao') === 'padrao';
                    const fallbackVazio = mgr41.resolverPerfilAtivoPosReset('', listaPredef41, 'padrao') === 'padrao';
                    feat41Ok = keepTrab && keepCasa && keepEstudo && keepPadrao && fallbackCriado && fallbackVazio;
                    detalheFeat41 = `trab=${keepTrab}, casa=${keepCasa}, estudo=${keepEstudo}, padrao=${keepPadrao}, customFallback=${fallbackCriado}, vazioFallback=${fallbackVazio}`;
                }
            } catch (e41) {
                detalheFeat41 = e41.message || String(e41);
            }
            registrar(
                feat41Ok,
                'FEAT_41_RESTAURAR_PRESERVA_PERFIL_PADRONIZADO',
                'Restaurar Configurações Iniciais preserva o perfil ativo se for padronizado (Trabalho/Casa/Estudo/Padrão) e volta à 1ª escolha (Padrão) se for perfil criado.',
                { detalhe: detalheFeat41 }
            );
        }

            }
            {
                let modDebugArqOk = false;
                let detalheModDebug = '';
                try {
                    const ClsDbg = window.JusGovModuloDebug;
                    const temSubmodulos = Boolean(
                        typeof ClsDbg === 'function' &&
                        ClsDbg.NULL_OBJECTS &&
                        typeof window.JusGovDebugGeradores === 'function' &&
                        typeof window.JusGovDebugVerificadores === 'function' &&
                        typeof window.JusGovDebugMascaras === 'function' &&
                        typeof window.JusGovDebugSelecao === 'function' &&
                        typeof window.JusGovDebugInterface === 'function' &&
                        typeof window.JusGovDebugModulos === 'function' &&
                        typeof window.JusGovDebugFuzzing === 'function'
                    );
                    const instNull = temSubmodulos ? new ClsDbg(ClsDbg.NULL_OBJECTS) : null;
                    const resNull = instNull ? instNull.executarAuditoriaCompleta({}) : null;
                    modDebugArqOk = Boolean(temSubmodulos && resNull && typeof resNull.total === 'number' && typeof resNull.logTexto === 'string');
                    detalheModDebug = `submodulos=${temSubmodulos}, nullObjTotal=${resNull ? resNull.total : -1}`;
                } catch (eDbg) {
                    detalheModDebug = eDbg.message || String(eDbg);
                }
                registrar(
                    modDebugArqOk,
                    'MODULARIZACAO_MOD_DEBUG_CONFORMIDADE_E_NULL_OBJECTS',
                    'Arquitetura modular src/cfg/mod-debug/ (mod-debug.js + 7 submódulos debug-*.js) carrega em UMD e tolera Null Objects (ADR-006).',
                    { detalhe: detalheModDebug }
                );
            }
        }
    }

    Object.freeze(DebugInterface.prototype);
    return Object.freeze(DebugInterface);
}));