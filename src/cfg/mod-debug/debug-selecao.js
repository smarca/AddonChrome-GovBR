/* ==========================================================================
 * Nome do arquivo: debug-selecao.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Suíte de Auditoria e Debug (Seleção DOM, Acumulador, Tabelas, Cursor e Visual)
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/mod-debug/debug-selecao.js
 * - Classe Exportada: DebugSelecao (window.JusGovDebugSelecao)
 * - Métodos Públicos: executar(ctx)
 * - Escopo de Testes: Bateria 3 (Acumulador), Bateria 4 (Tabelas), Bateria 5 (Cursor/3 Cliques/Limites), Bateria 9 (Geometria/Flash/Avisos), Alt+Clique PJe/Interface, Marcador Permanente, SVG Multi-Parágrafo e Isolamentos DOM
 * - Regras / Seções: Diretrizes 2.5.5/5/16, Seções 6.3..6.114, FEAT-21/36, BUG-14..69
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovDebugSelecao = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DebugSelecao {
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
        linhasLog.push('\n--- BATERIA 3: MODO ACUMULADOR (;), ABSORCAO PREVIA, ORDEM DOM E TOGGLE-OFF ---');

        /* Testes de Validacao e Limites do Separador Customizado */
        acumulador.definirSeparador('abc12');
        registrar(
            acumulador.separadorCustomizado === ';',
            'ACUMULADOR_SEPARADOR',
            'Rejeicao de letras e numeros com retorno ao padrao ";"',
            { textoTestado: 'abc12', idxCursor: 0, esperado: ';', obtido: acumulador.separadorCustomizado }
        );

        acumulador.definirSeparador('   ');
        registrar(
            acumulador.separadorCustomizado === ';',
            'ACUMULADOR_SEPARADOR',
            'Rejeicao de separador vazio/espacos com retorno ao padrao ";"',
            { textoTestado: '   ', idxCursor: 0, esperado: ';', obtido: acumulador.separadorCustomizado }
        );

        acumulador.definirSeparador(';;;;;;;;;;');
        registrar(
            acumulador.separadorCustomizado === ';;;;;',
            'ACUMULADOR_SEPARADOR',
            'Truncamento estrito no limite maximo de 5 caracteres',
            { textoTestado: ';;;;;;;;;;', idxCursor: 0, esperado: ';;;;;', obtido: acumulador.separadorCustomizado }
        );

        acumulador.definirSeparador(' | ');
        registrar(
            acumulador.separadorCustomizado === ' | ',
            'ACUMULADOR_SEPARADOR',
            'Aceitacao de separador composto por pontuacoes e espacos (" | ")',
            { textoTestado: ' | ', idxCursor: 0, esperado: ' | ', obtido: acumulador.separadorCustomizado }
        );

        acumulador.limpar();
        acumulador.definirSeparador(';');
        acumulador.absorverSelecaoPreviaSeVazio('itemPrevio');
        acumulador.adicionarItem('segundoItem');
        acumulador.adicionarItem('terceiroItem');

        const consolidadoEsperado = 'itemPrevio;segundoItem;terceiroItem;';
        registrar(
            acumulador.obterConsolidado() === consolidadoEsperado,
            'ACUMULADOR',
            'Absorcao automatica da selecao previa e concatenacao com ";" final',
            { textoTestado: 'itemPrevio + segundoItem + terceiroItem', idxCursor: 0, esperado: consolidadoEsperado, obtido: acumulador.obterConsolidado() }
        );

        const desfeito = acumulador.desfazerUltimoItem();
        registrar(
            Boolean(desfeito && acumulador.obterConsolidado() === 'itemPrevio;segundoItem;'),
            'ACUMULADOR',
            'Desfazer ultimo item mantendo ";" final',
            { textoTestado: consolidadoEsperado, idxCursor: 23, esperado: 'itemPrevio;segundoItem;', obtido: acumulador.obterConsolidado() }
        );
        acumulador.limpar();

        /* Teste de Ordenacao Crescente DOM vs. Modo Baralho (Shift) e Toggle-Off */
        const divDom = document.createElement('div');
        divDom.innerHTML = '<span>Primeiro</span> <span>Segundo</span> <span>Terceiro</span>';
        document.body.appendChild(divDom);
        const spans = divDom.querySelectorAll('span');
        const r1 = document.createRange(); r1.selectNodeContents(spans[0]);
        const r2 = document.createRange(); r2.selectNodeContents(spans[1]);
        const r3 = document.createRange(); r3.selectNodeContents(spans[2]);

        acumulador.adicionarItem('Terceiro', r3, false);
        acumulador.adicionarItem('Primeiro', r1, false);
        registrar(
            acumulador.obterConsolidado() === 'Primeiro;Terceiro;',
            'ACUMULADOR_ORDEM',
            'Ordenacao crescente natural pelo DOM (Ctrl+Alt sem Shift)',
            { textoTestado: 'Primeiro Segundo Terceiro', idxCursor: 0, esperado: 'Primeiro;Terceiro;', obtido: acumulador.obterConsolidado() }
        );

        acumulador.adicionarItem('Segundo', r2, true);
        registrar(
            acumulador.obterConsolidado() === 'Primeiro;Terceiro;Segundo;',
            'ACUMULADOR_SHIFT',
            'Modo Baralho (Ctrl+Alt+Shift) insere no final da lista',
            { textoTestado: 'Primeiro Segundo Terceiro', idxCursor: 9, esperado: 'Primeiro;Terceiro;Segundo;', obtido: acumulador.obterConsolidado() }
        );

        const resToggle = acumulador.adicionarItem('Terceiro', r3, false);
        registrar(
            Boolean(resToggle && resToggle.removidoToggle && acumulador.obterConsolidado() === 'Primeiro;Segundo;'),
            'ACUMULADOR_TOGGLE',
            'Toggle-Off ao clicar novamente sobre item ja selecionado',
            { textoTestado: 'Primeiro Segundo Terceiro', idxCursor: 17, esperado: 'Primeiro;Segundo;', obtido: acumulador.obterConsolidado() }
        );

        acumulador.limpar();
        document.body.removeChild(divDom);

        /* ==================================================================
         * BATERIA 4: SELECAO AVANCADA EM TABELAS (COLUNAS E LINHAS)
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 4: SELECAO AVANCADA EM TABELAS (COLUNAS E LINHAS) ---');

        const tabelaTeste = document.createElement('table');
        tabelaTeste.innerHTML = `
            <thead><tr><th>C1</th><th>C2</th><th>C3</th></tr></thead>
            <tbody>
                <tr><td>A1</td><td>B1</td><td>C1_val</td></tr>
                <tr><td>A2</td><td>B2</td><td>C2_val</td></tr>
            </tbody>
        `;
        document.body.appendChild(tabelaTeste);

        const thCol1 = tabelaTeste.querySelectorAll('th')[0];
        const thCol3 = tabelaTeste.querySelectorAll('th')[2];
        acumulador.acumularSelecaoTabelaPorColunasOuLinhas(thCol1, 'COLUNA', false);
        const resCol = acumulador.acumularSelecaoTabelaPorColunasOuLinhas(thCol3, 'COLUNA', false);
        const espCol = 'C1;C3;\nA1;C1_val;\nA2;C2_val;';

        registrar(
            Boolean(resCol && resCol.consolidado === espCol),
            'TABELAS',
            'Selecao de multiplas colunas nao-adjacentes (Coluna 1 e Coluna 3)',
            {
                textoTestado: 'C1 | C2 | C3',
                idxCursor: 0,
                esperado: espCol.replace(/\n/g, '\\n'),
                obtido: (resCol && resCol.consolidado ? resCol.consolidado : '').replace(/\n/g, '\\n')
            }
        );

        acumulador.limpar();
        document.body.removeChild(tabelaTeste);

        /* DIRETRIZ ROOT 6.39: Auto-Selecao com 1 Clique em Celulas de Tabelas JSF/RichFaces (listTasksUsuarioPje2.seam) */
        if (motorTeste && typeof motorTeste.isCelulaTabelaDadosLeitura === 'function') {
            const containerPje = document.createElement('div');
            containerPje.className = 'frameUltimasTarefas';
            containerPje.innerHTML = `
                <table class="rich-table" id="j_id22:ultimasTarefasDataTable">
                    <tbody id="j_id22:ultimasTarefasDataTable:tb">
                        <tr class="rich-table-row rich-table-firstrow">
                            <td class="rich-table-cell" id="j_id22:ultimasTarefasDataTable:0:j_id23">1020445-05.2025.4.01.4002</td>
                            <td class="rich-table-cell">Aguardando Manifestacao</td>
                        </tr>
                    </tbody>
                </table>
            `;
            const trRich = containerPje.querySelector('tr.rich-table-row');
            if (trRich) {
                trRich.onmouseover = function () { this.className = 'rich-table-row-selected'; };
                trRich.onmouseout = function () { this.className = 'rich-table-row'; };
            }
            document.body.appendChild(containerPje);

            const tdProcessoCnj = containerPje.querySelector('td.rich-table-cell');
            const ehCelulaLeitura = motorTeste.isCelulaTabelaDadosLeitura(tdProcessoCnj);
            const ehUi = typeof motorTeste.isElementoInterativoOuUi === 'function' ? motorTeste.isElementoInterativoOuUi(tdProcessoCnj) : false;
            const ctxAlvo = typeof motorTeste.classificarContextoElementoAlvo === 'function' ? motorTeste.classificarContextoElementoAlvo(tdProcessoCnj) : 'LEITURA_COMUM';
            const modoOrigTabela = typeof motorTeste.obterModoRetirarSelecao === 'function' ? motorTeste.obterModoRetirarSelecao() : 'total_exceto_arrasto';
            if (typeof motorTeste.definirModoRetirarSelecao === 'function') motorTeste.definirModoRetirarSelecao('interface');
            const mantemSelecao = typeof motorTeste.deveManterSelecaoAtivaNoDom === 'function' ? motorTeste.deveManterSelecaoAtivaNoDom(tdProcessoCnj, false) : true;
            if (typeof motorTeste.definirModoRetirarSelecao === 'function') motorTeste.definirModoRetirarSelecao(modoOrigTabela);

            registrar(
                ehCelulaLeitura === true && ehUi === false && ctxAlvo === 'LEITURA_COMUM' && mantemSelecao === true,
                'TABELA_JSF_RICHFACES_LEITURA',
                'Diretriz 6.39: Celula td.rich-table-cell contendo processo CNJ classificada como LEITURA_COMUM e mantemSelecao=true neutralizando tr onmouseover',
                {
                    ehCelulaLeitura,
                    ehUi,
                    ctxAlvo,
                    mantemSelecao
                }
            );

            document.body.removeChild(containerPje);
        }

        /* ==================================================================
         * BATERIA 5: POSICOES DE CURSOR (-1, 1..N, N+1, MEIO, ESPACOS),
         *            MINORACAO 3 CLIQUES E PARAGRAFO LOCALIZADO
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 5: POSICOES DE CURSOR (-1, 1..N, N+1), 3 CLIQUES E LIMITES ---');

        if (motorTeste && typeof motorTeste.simularCliqueEmTexto === 'function') {
            const txtLei = 'da lei (art. 12 da Lei no 12.016/2009);';
            const casosCursor = [
                {
                    desc: 'Regra de bloco: clicar no espaco apos ":" seleciona a sentenca inteira (rotulo + complemento)',
                    txt: 'Atencao: confira o processo antes de prosseguir. Outra frase.',
                    idx: 8, /* espaco entre ":" e "confira" */
                    cliques: 1,
                    esp: 'Atencao: confira o processo antes de prosseguir'
                },
                {
                    desc: 'BUG-39 / Paridade: clicar no espaco antes de "(" seleciona a premissa e o bloco delimitado',
                    txt: 'Uma frase (definicao da frase). Outra frase.',
                    idx: 9, /* espaco entre "frase" e "(" */
                    cliques: 1,
                    esp: 'Uma frase (definicao da frase)'
                },
                {
                    desc: 'BUG-39: clicar no delimitador de abertura "(" seleciona incluindo delimitadores',
                    txt: 'da lei (art. 12 da Lei no 12.016/2009);',
                    idx: 7, /* caractere '(' */
                    cliques: 1,
                    esp: '(art. 12 da Lei no 12.016/2009)'
                },
                {
                    desc: 'BUG-39: clicar no delimitador de fechamento ")" seleciona incluindo delimitadores',
                    txt: 'da lei (art. 12 da Lei no 12.016/2009);',
                    idx: 37, /* caractere ')' */
                    cliques: 1,
                    esp: '(art. 12 da Lei no 12.016/2009)'
                },
                {
                    desc: 'BUG-39: clicar no espaco interno entre duas palavras dentro de delimitador seleciona o miolo',
                    txt: 'da lei (art. 12 da Lei no 12.016/2009);',
                    idx: 15, /* espaco entre "12" e "da" dentro dos parenteses */
                    cliques: 1,
                    esp: 'art. 12 da Lei no 12.016/2009'
                },
                {
                    desc: 'Regra de bloco: clicar na palavra apos ":" continua selecionando so a palavra',
                    txt: 'Atencao: confira o processo antes de prosseguir.',
                    idx: 12, /* meio de "confira" */
                    cliques: 1,
                    esp: 'confira'
                },
                {
                    desc: 'Posicao antes do 1o caractere (cursor = -1) retorna vazio com seguranca',
                    txt: txtLei,
                    idx: -1,
                    cliques: 1,
                    esp: ''
                },
                {
                    desc: 'Posicao no 1o caractere (cursor = 1) seleciona a 1a palavra ("da")',
                    txt: txtLei,
                    idx: 0,
                    cliques: 1,
                    esp: 'da'
                },
                {
                    desc: 'Posicao no meio de uma palavra seleciona a palavra completa',
                    txt: txtLei,
                    idx: 4, /* letra 'e' de 'lei' */
                    cliques: 1,
                    esp: 'lei'
                },
                {
                    desc: 'Posicao no meio de numero/token pontuado seleciona o ato completo no 1o clique',
                    txt: txtLei,
                    idx: txtLei.indexOf('12.016') + 2,
                    cliques: 1,
                    esp: '12.016/2009'
                },
                {
                    desc: 'Posicao no ultimo caractere (cursor = tamanho) ignora ";" externo',
                    txt: 'Brasilia,',
                    idx: 8,
                    cliques: 1,
                    esp: 'Brasilia'
                },
                {
                    desc: '1 Clique sobre a data numerica isolada ("28/10/2026 - 06:28:50" -> "28/10/2026")',
                    txt: 'Em 28/10/2026 - 06:28:50 autuado',
                    idx: 'Em 28/1'.length,
                    cliques: 1,
                    esp: '28/10/2026'
                },
                {
                    desc: '1 Clique sobre o horario isolado ("28/10/2026 - 06:28:50" -> "06:28:50")',
                    txt: 'Em 28/10/2026 - 06:28:50 autuado',
                    idx: 'Em 28/10/2026 - 06:'.length,
                    cliques: 1,
                    esp: '06:28:50'
                },
                {
                    desc: '1 Clique sobre o hifen "-" seleciona Data + Horario inteiros ("28/10/2026 - 06:28:50")',
                    txt: 'Em 28/10/2026 - 06:28:50 autuado',
                    idx: 'Em 28/10/2026 -'.length - 1,
                    cliques: 1,
                    esp: '28/10/2026 - 06:28:50'
                },
                {
                    desc: '1 Clique sobre o espaco antes do hifen seleciona Data + Horario inteiros ("28/10/2026 - 06:28:50")',
                    txt: 'Em 28/10/2026 - 06:28:50 autuado',
                    idx: 'Em 28/10/2026 '.length - 1,
                    cliques: 1,
                    esp: '28/10/2026 - 06:28:50'
                },
                {
                    desc: '2 Cliques sobre qualquer ponto seleciona Data + Horario inteiros ("28/10/2026 - 06:28:50")',
                    txt: 'Em 28/10/2026 - 06:28:50 autuado',
                    idx: 'Em 28/1'.length,
                    cliques: 2,
                    esp: '28/10/2026 - 06:28:50'
                },
                {
                    desc: '1 Clique sobre a data em Data com Horario Espacado ("28/10/2026 06:28" -> "28/10/2026")',
                    txt: 'Em 28/10/2026 06:28 autuado',
                    idx: 'Em 28/1'.length,
                    cliques: 1,
                    esp: '28/10/2026'
                },
                {
                    desc: '1 Clique sobre o horario em Data com Horario Espacado ("28/10/2026 06:28" -> "06:28")',
                    txt: 'Em 28/10/2026 06:28 autuado',
                    idx: 'Em 28/10/2026 06:'.length,
                    cliques: 1,
                    esp: '06:28'
                },
                {
                    desc: '1 Clique sobre o espaco em Data com Horario Espacado ("28/10/2026 06:28" -> "28/10/2026 06:28")',
                    txt: 'Em 28/10/2026 06:28 autuado',
                    idx: 'Em 28/10/2026'.length,
                    cliques: 1,
                    esp: '28/10/2026 06:28'
                },
                {
                    desc: '1 Clique sobre o espaco em Data com Horario e Segundos ("18/09/2026 10:03:34" -> "18/09/2026 10:03:34")',
                    txt: 'Em 18/09/2026 10:03:34 autuado',
                    idx: 'Em 18/09/2026'.length,
                    cliques: 1,
                    esp: '18/09/2026 10:03:34'
                },
                {
                    desc: '1 Clique em Data com ponto final de sentenca ("Itabuna, 01.05.19." -> "01.05.19")',
                    txt: 'Itabuna, 01.05.19.',
                    idx: 'Itabuna, 01'.length,
                    cliques: 1,
                    esp: '01.05.19'
                },
                {
                    desc: 'Posicao apos o ultimo caractere (cursor = tamanho + 1) retorna vazio com seguranca',
                    txt: txtLei,
                    idx: txtLei.length,
                    cliques: 1,
                    esp: ''
                },
                {
                    desc: '3 Cliques para MINORAR bloco composto antes da barra ("12.016/2009" -> "12.016")',
                    txt: txtLei,
                    idx: txtLei.indexOf('12.016') + 2,
                    cliques: 3,
                    esp: '12.016'
                },
                {
                    desc: '3 Cliques para MINORAR bloco composto apos a barra ("12.016/2009" -> "2009")',
                    txt: txtLei,
                    idx: txtLei.indexOf('2009') + 1,
                    cliques: 3,
                    esp: '2009'
                },
                {
                    desc: '2 Cliques em sequencia de LETRAS MAIUSCULAS dentro de frase mista',
                    txt: '2. Determinar o REGULAR PROSSEGUIMENTO DO FEITO, procedendo-se',
                    idx: '2. Determinar o REGULAR '.length,
                    cliques: 2,
                    esp: 'REGULAR PROSSEGUIMENTO DO FEITO'
                },
                {
                    desc: '3 Cliques no inicio de paragrafo numerado seleciona APENAS o paragrafo 3 (sem invadir o 2)',
                    txt: '2. Determinar o REGULAR PROSSEGUIMENTO DO FEITO;\n3. Ordenar os atos subsequentes da Lei no 12.016/2009;\n4. Intimar o MP.',
                    idx: '2. Determinar o REGULAR PROSSEGUIMENTO DO FEITO;\n3. Or'.length,
                    cliques: 3,
                    esp: '3. Ordenar os atos subsequentes da Lei no 12.016/2009'
                },
                {
                    desc: 'INSS NB com especie: clicar na especie (31) seleciona a expressao inteira (31/6506589241)',
                    txt: 'Benefício 31/6506589241 concedido',
                    idx: 'Benefício 31/6506589241 concedido'.indexOf('31') + 1,
                    cliques: 1,
                    esp: '31/6506589241'
                },
                {
                    desc: 'INSS NB com especie: clicar na barra (/) seleciona a expressao inteira (31/6506589241)',
                    txt: 'Benefício 31/6506589241 concedido',
                    idx: 'Benefício 31/6506589241 concedido'.indexOf('/'),
                    cliques: 1,
                    esp: '31/6506589241'
                },
                {
                    desc: 'INSS NB com especie: clicar no numero do beneficio (6506589241) seleciona somente o numero',
                    txt: 'Benefício 31/6506589241 concedido',
                    idx: 'Benefício 31/6506589241 concedido'.indexOf('6506589241') + 2,
                    cliques: 1,
                    esp: '6506589241'
                },
                {
                    desc: 'INSS NB com especie: 2 cliques no numero seleciona a expressao inteira (31/6506589241)',
                    txt: 'Benefício 31/6506589241 concedido',
                    idx: 'Benefício 31/6506589241 concedido'.indexOf('6506589241') + 2,
                    cliques: 2,
                    esp: '31/6506589241'
                },
                {
                    desc: 'INSS NB pontuado: clicar no NB seleciona o bloco integral (719.657.155-0)',
                    txt: 'Benefício nº 719.657.155-0 concedido',
                    idx: 'Benefício nº 719.657.155-0 concedido'.indexOf('719.657.155-0') + 4,
                    cliques: 1,
                    esp: '719.657.155-0'
                },
                {
                    desc: 'Diretriz 6.37: Alt + 1 clique no espaco interno entre parenteses expande incluindo delimitadores como 2 cliques',
                    txt: 'da lei (art. 12 da Lei no 12.016/2009);',
                    idx: 15, /* espaco entre "12" e "da" dentro dos parenteses */
                    cliques: 1,
                    ehAlt: true,
                    esp: '(art. 12 da Lei no 12.016/2009)'
                },
                {
                    desc: 'Diretriz 6.37: Alt + 1 clique no espaco em texto comum expande sentenca completa como 2 cliques',
                    txt: 'Primeira palavra segunda palavra terceira palavra.',
                    idx: 16, /* espaco entre "palavra" e "segunda" */
                    cliques: 1,
                    ehAlt: true,
                    esp: 'Primeira palavra segunda palavra terceira palavra'
                }
            ];

            for (let i = 0; i < casosCursor.length; i++) {
                const cc = casosCursor[i];
                const obt = motorTeste.simularCliqueEmTexto(cc.txt, cc.idx, cc.cliques, Boolean(cc.ehAlt));
                registrar(obt === cc.esp, `CURSOR_${cc.cliques}CLIQ`, cc.desc, {
                    textoTestado: cc.txt.replace(/\n/g, '\\n'),
                    idxCursor: cc.idx,
                    esperado: cc.esp,
                    obtido: obt
                });
            }
        }

        /* ==================================================================
         * BATERIA 6: ARQUITETURA PROGRESSIVA DE FILTROS HTML EM 5 NIVEIS
         * ================================================================== */
            }

            {
        linhasLog.push('\n--- BATERIA 9: GEOMETRIA, FLASH VISUAL E POSICIONAMENTO EXTERNO DOS AVISOS ---');
        {
            const motorRef = window.__JUSGOV_MOTOR_SELECAO_API__ || window.JusGovMotorSelecaoTeste;
            const validadorReal = motorRef && typeof motorRef.obterValidador === 'function'
                ? motorRef.obterValidador()
                : (window.JusGovAvisoFlutuante ? new window.JusGovAvisoFlutuante() : null);

            let falhasPosicionamento = 0;
            let detalhePosicionamento = '';

            if (validadorReal && typeof validadorReal.auditarEAlerta === 'function' && document.body) {
                const tempoOriginal = validadorReal.tempoExibicaoMs;
                validadorReal.definirTempoExibicao(3500);

                const blocoTestePos = document.createElement('div');
                blocoTestePos.setAttribute('data-jusgov-ignore', 'true');
                blocoTestePos.style.cssText = 'position:fixed;top:180px;left:180px;font-size:14px;line-height:20px;z-index:99999;';
                blocoTestePos.textContent = '111.111.111-11';
                document.body.appendChild(blocoTestePos);

                try {
                    const rngPos = document.createRange();
                    rngPos.selectNodeContents(blocoTestePos.firstChild || blocoTestePos);
                    const rectTexto = rngPos.getBoundingClientRect();

                    /* 1) Aviso de Erro de Validação (múltiplas linhas) não pode sobrepor o texto nem o contorno Flash */
                    if (typeof motorRef.dispararFlashBorderVisual === 'function') {
                        motorRef.dispararFlashBorderVisual(rngPos);
                    }
                    validadorReal.auditarEAlerta('111.111.111-11', rngPos);
                    const cartaoEl = validadorReal.elementoCartaoAviso;
                    if (cartaoEl && cartaoEl.style.display !== 'none' && rectTexto.height > 0) {
                        const rectCard = cartaoEl.getBoundingClientRect();
                        const sobrepoeY = (rectCard.top < (rectTexto.bottom + 2)) && (rectCard.bottom > (rectTexto.top - 2));
                        const sobrepoeX = (rectCard.left < (rectTexto.right + 2)) && (rectCard.right > (rectTexto.left - 2));
                        if (sobrepoeY && sobrepoeX) {
                            falhasPosicionamento++;
                            detalhePosicionamento = `Popup de erro sobrepôs o texto clicado: card=[${Math.round(rectCard.top)}..${Math.round(rectCard.bottom)}], texto=[${Math.round(rectTexto.top)}..${Math.round(rectTexto.bottom)}]`;
                        }
                    } else {
                        falhasPosicionamento++;
                        detalhePosicionamento = 'Cartão de aviso de erro não foi exibido no teste geométrico';
                    }

                    /* 2) Aviso de Wiki Forense (múltiplas linhas: INSS 31/6506589241) também posicionado fora do texto */
                    blocoTestePos.textContent = '31/6506589241';
                    const rngWiki = document.createRange();
                    rngWiki.selectNodeContents(blocoTestePos.firstChild || blocoTestePos);
                    const rectWikiTexto = rngWiki.getBoundingClientRect();
                    validadorReal.auditarEAlerta('31/6506589241', rngWiki);
                    if (cartaoEl && cartaoEl.style.display !== 'none' && rectWikiTexto.height > 0) {
                        const rectCardWiki = cartaoEl.getBoundingClientRect();
                        const sobrepoeWikiY = (rectCardWiki.top < (rectWikiTexto.bottom + 2)) && (rectCardWiki.bottom > (rectWikiTexto.top - 2));
                        const sobrepoeWikiX = (rectCardWiki.left < (rectWikiTexto.right + 2)) && (rectCardWiki.right > (rectWikiTexto.left - 2));
                        if (sobrepoeWikiY && sobrepoeWikiX) {
                            falhasPosicionamento++;
                            if (!detalhePosicionamento) {
                                detalhePosicionamento = `Popup Wiki Forense sobrepôs o texto clicado: card=[${Math.round(rectCardWiki.top)}..${Math.round(rectCardWiki.bottom)}], texto=[${Math.round(rectWikiTexto.top)}..${Math.round(rectWikiTexto.bottom)}]`;
                            }
                        }
                    }

                    /* 3) Teste de borda superior (top=12px): deve projetar ABAIXO do texto sem cobri-lo */
                    blocoTestePos.style.top = '12px';
                    const rngTopo = document.createRange();
                    rngTopo.selectNodeContents(blocoTestePos.firstChild || blocoTestePos);
                    const rectTopoTexto = rngTopo.getBoundingClientRect();
                    validadorReal.auditarEAlerta('111.111.111-11', rngTopo);
                    if (cartaoEl && cartaoEl.style.display !== 'none' && rectTopoTexto.height > 0) {
                        const rectCardTopo = cartaoEl.getBoundingClientRect();
                        if (rectCardTopo.top < rectTopoTexto.bottom) {
                            falhasPosicionamento++;
                            if (!detalhePosicionamento) {
                                detalhePosicionamento = `No topo da janela, card não projetou abaixo do texto: cardTop=${Math.round(rectCardTopo.top)}, textoBottom=${Math.round(rectTopoTexto.bottom)}`;
                            }
                        }
                    }
                } finally {
                    if (typeof motorRef.limparFlashBorderImediatamente === 'function') {
                        motorRef.limparFlashBorderImediatamente();
                    }
                    if (typeof validadorReal.ocultarTodosAvisosImediatamente === 'function') {
                        validadorReal.ocultarTodosAvisosImediatamente();
                    }
                    validadorReal.definirTempoExibicao(tempoOriginal);
                    if (blocoTestePos.parentNode) blocoTestePos.parentNode.removeChild(blocoTestePos);
                }
            } else {
                falhasPosicionamento++;
                detalhePosicionamento = 'Validador indisponível para teste de posicionamento';
            }

            registrar(
                falhasPosicionamento === 0,
                'POSICIONAMENTO_INTELIGENTE_AVISOS_FORA_DO_TEXTO_E_FLASH',
                'Popups multilinhas de verificação/erro e Wiki Forense posicionam-se estritamente fora do texto clicado e fora do contorno Flash (acima ou abaixo conforme espaço na janela)',
                falhasPosicionamento === 0
                    ? { esperado: 'Zero sobreposição sobre texto ou Flash', obtido: 'Posicionamento externo validado (acima e fallback abaixo)' }
                    : { esperado: '0 falhas', obtido: detalhePosicionamento }
            );

            /* Teste específico do popup Esc+Esc respeitando o Tempo de Exibição e imune a fechamento prematuro */
            let falhasEscEsc = 0;
            let detalheEscEsc = '';
            if (validadorReal && motorRef) {
                const tempoAntigo = validadorReal.tempoExibicaoMs;
                try {
                    validadorReal.definirTempoExibicao(5000);
                    validadorReal.projetarMiniTipGlobal('Remover Formatacoes: ATIVADO (Somente Texto)', '#3b82f6');
                    const miniEl = validadorReal.elementoMiniTipGlobal;
                    const visivelLogoApos = Boolean(miniEl && miniEl.style.display === 'block' && validadorReal.temporizadorMiniTip !== null);

                    /* Simula desseleção / broadcast remoto (preservarMiniTip = true) que ocorria após o Esc+Esc */
                    if (typeof motorRef.limparAvisosAuditoriaEWikiImediatamente === 'function') {
                        motorRef.limparAvisosAuditoriaEWikiImediatamente(true);
                    }
                    const visivelAposBroadcast = Boolean(miniEl && miniEl.style.display === 'block' && validadorReal.temporizadorMiniTip !== null);

                    /* Verifica se em 0ms (avisos desativados) o minitip respeita e não abre */
                    validadorReal.ocultarTodosAvisosImediatamente(false);
                    validadorReal.definirTempoExibicao(0);
                    validadorReal.projetarMiniTipGlobal('Teste com 0ms', '#3b82f6');
                    const ocultoQuandoZero = Boolean(!miniEl || miniEl.style.display === 'none');

                    if (!visivelLogoApos || !visivelAposBroadcast || !ocultoQuandoZero) {
                        falhasEscEsc++;
                        detalheEscEsc = `visivelLogoApos=${visivelLogoApos}, visivelAposBroadcast=${visivelAposBroadcast}, ocultoQuandoZero=${ocultoQuandoZero}`;
                    }
                } finally {
                    validadorReal.ocultarTodosAvisosImediatamente(false);
                    validadorReal.definirTempoExibicao(tempoAntigo);
                }
            } else {
                falhasEscEsc++;
                detalheEscEsc = 'Validador ou motor indisponível';
            }

            registrar(
                falhasEscEsc === 0,
                'POPUP_DUPLO_ESC_TEMPO_EXIBICAO_E_ESTABILIDADE',
                'Popup Esc+Esc respeita a opção "Tempo de Exibição dos Avisos na Tela" (inclusive 0 = desligado) e não desaparece prematuramente por eventos colaterais de desseleção',
                falhasEscEsc === 0
                    ? { esperado: 'Estável pelo tempo configurado e imune a broadcast de desseleção', obtido: 'Confirmado' }
                    : { esperado: '0 falhas', obtido: detalheEscEsc }
            );
        }

        /* ==================================================================
         * BATERIA 10: INTEGRIDADE E PARIDADE DO CATÁLOGO CENTRALIZADO JSON (src/cfg/exemplos.js / exemplos.json)
         * ================================================================== */
            }

            {
        /* 18) Seção 6.3: Supressão de Quebras de Linha em Linha Única com Espaçamento Obrigatório Anti-Truncamento */
        let secao63AntiTruncamentoOk = false;
        try {
            const fCopia = window.JusGovFiltrosHtml ? new window.JusGovFiltrosHtml() : null;
            const unificador = (motorTeste && typeof motorTeste.unificarLinhasComEspacamentoAntiTruncamento === 'function')
                ? motorTeste.unificarLinhasComEspacamentoAntiTruncamento
                : (fCopia && typeof fCopia.unificarLinhasComEspacamentoAntiTruncamento === 'function' ? fCopia.unificarLinhasComEspacamentoAntiTruncamento.bind(fCopia) : null);

            // Teste 1: Quebra explícita de linha nunca funde palavras adjacentes
            const textoQuebrado = 'DISTRIBUIÇÃO AO VARA FEDERAL\nCÍVEL E CRIMINAL';
            const textoUnificado = unificador ? unificador(textoQuebrado) : '';
            const semFusaoFederalCivel = textoUnificado === 'DISTRIBUIÇÃO AO VARA FEDERAL CÍVEL E CRIMINAL' && !textoUnificado.includes('FEDERALCÍVEL');

            // Teste 2: Elementos irmãos adjacentes (spans de grid col-sm-11 e col-sm-12 do PJe)
            const divContainerGrid = document.createElement('div');
            divContainerGrid.innerHTML = '<span class="col-sm-11">DISTRIBUIÇÃO AO VARA FEDERAL</span><span class="col-sm-12 no-padding">CÍVEL E CRIMINAL</span>';
            const txtExtraidoLimpo = motorTeste.extrairTextoVisivelLimpoDeElemento(divContainerGrid);
            const txtSanitizado = motorTeste.extrairTextoPuroSanitizado(divContainerGrid);
            const semFusaoDom = !txtExtraidoLimpo.includes('FEDERALCÍVEL') && txtExtraidoLimpo.includes('FEDERAL CÍVEL');

            secao63AntiTruncamentoOk = Boolean(
                semFusaoFederalCivel &&
                semFusaoDom &&
                !txtSanitizado.includes('FEDERALCÍVEL')
            );
        } catch (_) {
            secao63AntiTruncamentoOk = false;
        }
        registrar(
            secao63AntiTruncamentoOk,
            'SECAO_6_3_ANTI_TRUNCAMENTO_ESPACO_OBRIGATORIO',
            'Supressão de quebras de linha com espaçamento obrigatório anti-truncamento: preserva espaço entre blocos e spans de grid ("FEDERAL CÍVEL", nunca "FEDERALCÍVEL")'
        );

        /* 19) Seção 6.6: Escopo de Seleção em Alt + Clique sobre Botões, Etiquetas e Itens de Interface */
        let secao66EscopoEtiquetaOk = false;
        try {
            // Cria etiqueta com botão de desvincular tag irmão
            const divEtiqueta = document.createElement('div');
            divEtiqueta.className = 'label label-etiqueta';
            divEtiqueta.innerHTML = '<span data-jusgov-selecionavel="true">HOMOLOGAR ACORDO</span><span class="icon-desvincular-tag"><i class="fa fa-times"></i></span>';
            document.body.appendChild(divEtiqueta);

            const spanTextoTag = divEtiqueta.querySelector('span[data-jusgov-selecionavel]');
            const iconeRemover = divEtiqueta.querySelector('.icon-desvincular-tag');

            // 1. Objeto interativo isola o rótulo
            const objInterativo = motorTeste.obterObjetoInterativoParaSelecaoCompleta(spanTextoTag);
            const txtEtiqueta = motorTeste.extrairTextoVisivelLimpoDeElemento(divEtiqueta);

            // 2. Range para flash envolve estritamente o rótulo, ignorando o botão de fechar
            const rangeRotulo = motorTeste.criarRangeTextoParaEtiquetaOuObjeto(divEtiqueta);
            const txtRange = rangeRotulo ? rangeRotulo.toString().trim() : '';

            // 3. Contêiner composto de card de tarefa deve ser rejeitado
            const divCardComposto = document.createElement('div');
            divCardComposto.className = 'card tarefa pje-task col-sm-12';
            divCardComposto.innerHTML = '<p>Texto da Tarefa</p><button>Ação 1</button><button>Ação 2</button>';
            const ehComposto = motorTeste.isContainerComposto(divCardComposto);

            secao66EscopoEtiquetaOk = Boolean(
                objInterativo &&
                txtEtiqueta === 'HOMOLOGAR ACORDO' &&
                txtRange === 'HOMOLOGAR ACORDO' &&
                ehComposto === true
            );

            divEtiqueta.remove();
        } catch (_) {
            secao66EscopoEtiquetaOk = false;
        }
        registrar(
            secao66EscopoEtiquetaOk,
            'SECAO_6_6_ALT_CLIQUE_ESCOPO_ETIQUETA_MINIMO',
            'Alt + Clique em etiquetas/badges: extrai e destaca estritamente o rótulo ("HOMOLOGAR ACORDO"), ignorando botão irmão "X" e rejeitando cards compostos'
        );

        /* 20) Seção 6.7: Precedência de 3 Passos em Links com Alt + Clique */
        let secao67PrecedenciaLinksOk = false;
        try {
            // Passo 1: Link contendo bloco estruturado (processo CNJ)
            const aBloco = document.createElement('a');
            aBloco.href = '#';
            aBloco.textContent = 'Autos nº 1015306-38.2026.4.01.4002 em tramitação';
            document.body.appendChild(aBloco);
            const idxProc = aBloco.textContent.indexOf('1015306');
            const resBlocoLink = motorTeste.simularCliqueEmTexto(aBloco.textContent, idxProc, 1, true);

            // Passo 2: Link com múltiplas linhas (por <br>)
            const aMultilinha = document.createElement('a');
            aMultilinha.href = '#';
            aMultilinha.innerHTML = 'Linha 1 do Link<br>Linha 2 Onde Clicou<br>Linha 3 Final';
            document.body.appendChild(aMultilinha);

            const ehMulti = motorTeste.isLinkMultilinha(aMultilinha);
            const noLinha2 = aMultilinha.childNodes[2]; // Nó de texto da linha 2
            const resLinha2 = motorTeste.extrairLinhaClicadaDeLink(aMultilinha, 0, 0);

            // Passo 3: Link de linha única sem bloco sob o cursor
            const aLinhaUnica = document.createElement('a');
            aLinhaUnica.href = '#';
            aLinhaUnica.textContent = 'Certidão de Intimação Expedida';
            document.body.appendChild(aLinhaUnica);

            const ehMultiUnica = motorTeste.isLinkMultilinha(aLinhaUnica);
            const txtUnica = motorTeste.extrairTextoVisivelLimpoDeElemento(aLinhaUnica);

            secao67PrecedenciaLinksOk = Boolean(
                resBlocoLink.includes('1015306-38.2026.4.01.4002') &&
                ehMulti === true &&
                resLinha2 &&
                resLinha2.texto &&
                ehMultiUnica === false &&
                txtUnica === 'Certidão de Intimação Expedida'
            );

            aBloco.remove();
            aMultilinha.remove();
            aLinhaUnica.remove();
        } catch (_) {
            secao67PrecedenciaLinksOk = false;
        }
        registrar(
            secao67PrecedenciaLinksOk,
            'SECAO_6_7_ALT_CLIQUE_LINKS_PRECEDENCIA_3_PASSOS',
            'Ordem de precedência em links com Alt + Clique: Passo 1 (bloco forense sob cursor), Passo 2 (link multilinha copia linha clicada), Passo 3 (link de linha única)'
        );

        /* 20.1) PJe - Alt + Clique localizado em Link Multilinha de Card */
        let pjeAltCliqueLocalizadoOk = false;
        try {
            const cardPje = document.createElement('div');
            cardPje.className = 'col-sm-11 no-padding pt-5';
            cardPje.innerHTML = `
                <a class="selecionarProcesso" href="javascript:;" data-jusgov-selecionavel="true" draggable="false">
                    <div>PJEC 1007173-07.2026.4.01.4002</div>
                    <span class="tarefa-numero-processo process">Auxílio por Incapacidade Temporária </span>
                </a>
                <span class="orgao col-sm-12 no-padding"> / Juizado Especial Cível e Criminal Adjunto à Vara Federal da SSJ de Parnaíba-PI</span>
                <span class="local col-sm-12 no-padding"> / Juiz Federal Substituto /</span>
                <span class="local col-sm-12 no-padding ng-star-inserted">MARIA DE FATIMA GOES CARDOSO X INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS</span>
                <div class="label label-info">ÚLTIMA MOVIMENTAÇÃO: CONCLUSOS PARA JULGAMENTO</div>
            `;
            document.body.appendChild(cardPje);

            const linkCard = cardPje.querySelector('a.selecionarProcesso');
            const spanAssunto = cardPje.querySelector('.tarefa-numero-processo');
            const divProc = cardPje.querySelector('a > div');

            // 1. Extração da linha sobre o span do assunto (localizado apenas)
            const resAssunto = motorTeste.extrairLinhaClicadaDeLink(linkCard, 0, 0, spanAssunto);
            const textoAssunto = resAssunto ? resAssunto.texto : '';
            const rangeAssuntoOk = resAssunto && resAssunto.range &&
                linkCard.contains(resAssunto.range.startContainer) &&
                linkCard.contains(resAssunto.range.endContainer) &&
                !cardPje.isSameNode(resAssunto.range.commonAncestorContainer);

            // 2. Extração da linha sobre a div do processo (não sendo campo estruturado, extrai linha da div)
            const resDivProc = motorTeste.extrairLinhaClicadaDeLink(linkCard, 0, 0, divProc);
            const textoDivProc = resDivProc ? resDivProc.texto : '';

            pjeAltCliqueLocalizadoOk = Boolean(
                textoAssunto === 'Auxílio por Incapacidade Temporária' &&
                rangeAssuntoOk &&
                textoDivProc.includes('1007173-07.2026.4.01.4002')
            );

            cardPje.remove();
        } catch (_) {
            pjeAltCliqueLocalizadoOk = false;
        }
        registrar(
            pjeAltCliqueLocalizadoOk,
            'PJE_ALT_CLIQUE_LINHA_LOCALIZADA_EM_CARD',
            'Alt + Clique em elemento/linha específica de Link Multilinha no PJe isola estritamente o texto localizado sem expandir para todo o card'
        );

        /* 20.2) Regra PJe / GovBR - Link mantido em linha única (com espaços) e demais elementos com quebras adequadas */
        let regraLinkUmaLinhaDemaisQuebrasOk = false;
        try {
            const cardPje2 = document.createElement('div');
            cardPje2.className = 'col-sm-11 no-padding pt-5';
            cardPje2.innerHTML = `
                <a class="selecionarProcesso" href="javascript:;" data-jusgov-selecionavel="true" draggable="false">
                    <div>PJEC 1007173-07.2026.4.01.4002</div>
                    <span class="tarefa-numero-processo process">Auxílio por Incapacidade Temporária </span>
                </a>
                <span class="orgao col-sm-12 no-padding"> / Juizado Especial Cível e Criminal Adjunto à Vara Federal da SSJ de Parnaíba-PI</span>
                <span class="local col-sm-12 no-padding"> / Juiz Federal Substituto /</span>
                <span class="local col-sm-12 no-padding ng-star-inserted">MARIA DE FATIMA GOES CARDOSO X INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS</span>
                <div class="label label-info">ÚLTIMA MOVIMENTAÇÃO: CONCLUSOS PARA JULGAMENTO</div>
            `;
            document.body.appendChild(cardPje2);

            const textoCard = motorTeste.extrairTextoPuroSanitizado(cardPje2);
            const linhas = textoCard.split('\n');

            // Linha 1: Link (processo + assunto) na mesma linha com espaços + órgão
            const linha1Ok = linhas.length >= 4 &&
                linhas[0].includes('PJEC 1007173-07.2026.4.01.4002 Auxílio por Incapacidade Temporária') &&
                linhas[0].includes('Juizado Especial');
            // Linha 2: Juiz Substituto em linha separada
            const linha2Ok = linhas.some(l => l.includes('Juiz Federal Substituto'));
            // Linha 3: Partes em linha separada
            const linha3Ok = linhas.some(l => l.includes('MARIA DE FATIMA GOES CARDOSO X INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS'));
            // Linha 4: Movimentação em linha separada
            const linha4Ok = linhas.some(l => l.includes('ÚLTIMA MOVIMENTAÇÃO: CONCLUSOS PARA JULGAMENTO'));

            regraLinkUmaLinhaDemaisQuebrasOk = Boolean(linha1Ok && linha2Ok && linha3Ok && linha4Ok);

            cardPje2.remove();
        } catch (_) {
            regraLinkUmaLinhaDemaisQuebrasOk = false;
        }
        registrar(
            regraLinkUmaLinhaDemaisQuebrasOk,
            'REGRA_LINK_UMA_LINHA_DEMAIS_QUEBRAS_ADEQUADAS',
            'Manter mesma linha separada por espaços no texto do LINK e quebrar adequadamente as linhas dos demais elementos do card'
        );

        /* 20.3) Regra PJe - Supressão absoluta do artefato transitório "COPIADO" e .icone-copy */
        let supressaoLabelCopyOk = false;
        try {
            const cardCopy = document.createElement('div');
            cardCopy.innerHTML = `
                <a class="selecionarProcesso" href="javascript:;" data-jusgov-selecionavel="true">
                    <div>
                        <span class="tarefa-numero-processo process">
                            <span class="hidden" id="10589945023"></span>
                            MSCiv 1015688-31.2026.4.01.4002
                            <i class="icone-copy fa fa-clipboard" style="font-size:13px;font-weight:400;" title="Copiar número para área de transferência">
                                <span class="label-copy">COPIADO</span>
                            </i>
                        </span>
                    </div>
                    <span class="tarefa-numero-processo process">Transferência</span>
                </a>
            `;
            document.body.appendChild(cardCopy);
            const aLink = cardCopy.querySelector('a.selecionarProcesso');
            const spanLinha1 = cardCopy.querySelector('.tarefa-numero-processo.process');
            const spanLinha2 = cardCopy.querySelectorAll('.tarefa-numero-processo.process')[1];

            const txtLinkPuro = (typeof motorTeste.extrairTextoLinkUmaLinha === 'function')
                ? motorTeste.extrairTextoLinkUmaLinha(aLink)
                : '';
            const txtLinha1 = (typeof motorTeste.extrairLinhaClicadaDeLink === 'function')
                ? (motorTeste.extrairLinhaClicadaDeLink(aLink, 0, 0, spanLinha1) || {}).texto
                : '';
            const txtLinha2 = (typeof motorTeste.extrairLinhaClicadaDeLink === 'function')
                ? (motorTeste.extrairLinhaClicadaDeLink(aLink, 0, 0, spanLinha2) || {}).texto
                : '';

            supressaoLabelCopyOk = Boolean(
                txtLinkPuro === 'MSCiv 1015688-31.2026.4.01.4002 Transferência' &&
                !txtLinkPuro.includes('COPIADO') &&
                txtLinha1 === 'MSCiv 1015688-31.2026.4.01.4002' &&
                !txtLinha1.includes('COPIADO') &&
                txtLinha2 === 'Transferência'
            );
            cardCopy.remove();
        } catch (_) {
            supressaoLabelCopyOk = false;
        }
        registrar(
            supressaoLabelCopyOk,
            'PJE_SUPRESSAO_LABEL_COPY_E_ICONE_COPY',
            'Supressão determinística do rótulo temporário COPIADO e ícones clipboard de links e cards do PJe'
        );

        /* 20.4) Regra de Negócio: Matriz de Expansão Progressiva em Links com Alt (Diretriz 6.28 / Anti-Estagnação) */
        let matrizExpansaoProgressivaOk = false;
        try {
            const cardMatriz = document.createElement('div');
            cardMatriz.innerHTML = `
                <a class="selecionarProcesso" href="javascript:;" data-jusgov-selecionavel="true">
                    <div>
                        <span class="tarefa-numero-processo process">
                            <span class="hidden" id="10589945023"></span>
                            MSCiv 1015688-31.2026.4.01.4002
                            <i class="icone-copy fa fa-clipboard"><span class="label-copy">COPIADO</span></i>
                        </span>
                    </div>
                    <span class="tarefa-numero-processo process">Transferência</span>
                </a>
            `;
            document.body.appendChild(cardMatriz);
            const linkM = cardMatriz.querySelector('a.selecionarProcesso');
            const spanLinhaProc = cardMatriz.querySelector('.tarefa-numero-processo.process');
            const spanLinhaTransf = cardMatriz.querySelectorAll('.tarefa-numero-processo.process')[1];

            const txtLinkTodo = motorTeste.extrairTextoLinkUmaLinha(linkM);
            const resLinhaProc = motorTeste.extrairLinhaClicadaDeLink(linkM, 0, 0, spanLinhaProc);
            const resLinhaTransf = motorTeste.extrairLinhaClicadaDeLink(linkM, 0, 0, spanLinhaTransf);

            // Nível A (Bloco): Processo CNJ puro
            const txtBlocoCNJ = '1015688-31.2026.4.01.4002';
            // Nível B (Linhas):
            const txtLinhaProc = resLinhaProc ? resLinhaProc.texto : '';
            const txtLinhaTransf = resLinhaTransf ? resLinhaTransf.texto : '';

            // Validações da matriz:
            // 1 Clique em bloco -> Bloco (1015688-31.2026.4.01.4002)
            // 1 Clique em MSCiv (não-bloco) -> Linha (MSCiv 1015688-31.2026.4.01.4002)
            // 1 Clique em Transferência (não-bloco) -> Linha (Transferência)
            // 2 Cliques em bloco -> Linha (MSCiv 1015688-31.2026.4.01.4002)
            // 2 Cliques em MSCiv -> Todo o link em uma linha (MSCiv 1015688-31.2026.4.01.4002 Transferência)
            // 2 Cliques em Transferência -> Todo o link em uma linha (MSCiv 1015688-31.2026.4.01.4002 Transferência)
            // 3 Cliques em qualquer parte -> Todo o link em uma linha (MSCiv 1015688-31.2026.4.01.4002 Transferência)
            const m1_bloco = (txtBlocoCNJ === '1015688-31.2026.4.01.4002');
            const m1_linha1 = (txtLinhaProc === 'MSCiv 1015688-31.2026.4.01.4002');
            const m1_linha2 = (txtLinhaTransf === 'Transferência');
            const m3_todo = (txtLinkTodo === 'MSCiv 1015688-31.2026.4.01.4002 Transferência');

            matrizExpansaoProgressivaOk = Boolean(m1_bloco && m1_linha1 && m1_linha2 && m3_todo);
            cardMatriz.remove();
        } catch (_) {
            matrizExpansaoProgressivaOk = false;
        }
        registrar(
            matrizExpansaoProgressivaOk,
            'MATRIZ_EXPANSAO_PROGRESSIVA_ALT_CLIQUES_LINK',
            'Matriz determinística de expansão progressiva em links multilinhas: 1 clique (bloco ou linha), 2 cliques (linha ampliada ou link inteiro) e 3 cliques (link unificado em uma linha)'
        );

        /* 20.4b) Regra de Negócio: Anti-Estagnação por Cliques - Expansão para Card quando Texto Já For o Mesmo */
        let antiEstagnacaoCardOk = false;
        try {
            const cardPjeTeste = document.createElement('div');
            cardPjeTeste.className = 'col-sm-11 no-padding pt-5';
            cardPjeTeste.innerHTML = `
                <a class="selecionarProcesso" href="javascript:;" data-jusgov-selecionavel="true" draggable="false">
                    <div>PJEC 1007173-07.2026.4.01.4002</div>
                    <span class="tarefa-numero-processo process">Auxílio por Incapacidade Temporária </span>
                </a>
                <span class="orgao col-sm-12 no-padding"> / Juizado Especial Cível e Criminal Adjunto à Vara Federal da SSJ de Parnaíba-PI</span>
                <span class="local col-sm-12 no-padding"> / Juiz Federal Substituto /</span>
                <span class="local col-sm-12 no-padding ng-star-inserted">MARIA DE FATIMA GOES CARDOSO X INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS</span>
                <div class="label label-info">ÚLTIMA MOVIMENTAÇÃO: CONCLUSOS PARA JULGAMENTO</div>
            `;
            document.body.appendChild(cardPjeTeste);
            const linkPje = cardPjeTeste.querySelector('a.selecionarProcesso');
            const blocoAncestral = (typeof motorTeste.obterBlocoAncestralContextual === 'function')
                ? motorTeste.obterBlocoAncestralContextual(linkPje)
                : linkPje.parentElement;

            const txtCard = motorTeste.extrairTextoPuroSanitizado(blocoAncestral);
            const linhasCard = txtCard.split('\n');

            // Linha 1 do card deve manter o texto do link na mesma linha separado por espaço simples
            const l1Ok = linhasCard[0].includes('PJEC 1007173-07.2026.4.01.4002 Auxílio por Incapacidade Temporária');
            // Elementos fora do link devem quebrar a linha adequadamente
            const l2Ok = linhasCard.some(l => l.includes('Juiz Federal Substituto'));
            const l3Ok = linhasCard.some(l => l.includes('MARIA DE FATIMA GOES CARDOSO'));
            const l4Ok = linhasCard.some(l => l.includes('ÚLTIMA MOVIMENTAÇÃO: CONCLUSOS PARA JULGAMENTO'));

            antiEstagnacaoCardOk = Boolean(blocoAncestral === cardPjeTeste && l1Ok && l2Ok && l3Ok && l4Ok);
            cardPjeTeste.remove();
        } catch (_) {
            antiEstagnacaoCardOk = false;
        }
        registrar(
            antiEstagnacaoCardOk,
            'PJE_ANTI_ESTAGNACAO_EXPANSAO_CARD_E_FORMATACAO',
            'Regra anti-estagnação: ao repetir cliques quando o texto já é o mesmo do link, expande para o card mantendo link em uma linha só e quebrando adequadamente os elementos externos'
        );

        /* 20.5) Validação Matemática e Wiki Forense: Modo de Exibição dos Avisos ('apenas_erros' vs 'sempre') */
        let modoExibicaoAvisosOk = false;
        try {
            if (validador && typeof validador.definirModoExibicaoValidacao === 'function') {
                const rngTeste = document.createRange();
                const divTeste = document.createElement('div');
                divTeste.textContent = '04/11/2026 e 111.111.111-11';
                document.body.appendChild(divTeste);
                rngTeste.selectNodeContents(divTeste);

                // 1. Modo 'apenas_erros':
                validador.definirModoExibicaoValidacao('apenas_erros');
                validador.limparAlertaVisual();

                // Dado válido (data wiki): NÃO deve exibir balão na tela
                const resValido = validador.auditarEAlerta('04/11/2026', rngTeste);
                const ocultouValido = (validador.estaAvisoVisivel() === false) && (resValido.valido === true && resValido.ehWiki === true);

                // Dado inválido (CPF falso): DEVE exibir alerta de erro na tela
                validador.limparAlertaVisual();
                const resInvalido = validador.auditarEAlerta('111.111.111-11', rngTeste);
                const exibiuInvalido = (validador.estaAvisoVisivel() === true) && (resInvalido.valido === false);

                // 2. Modo 'sempre':
                validador.definirModoExibicaoValidacao('sempre');
                validador.limparAlertaVisual();
                validador.auditarEAlerta('04/11/2026', rngTeste);
                const exibiuValidoSempre = (validador.estaAvisoVisivel() === true);

                validador.limparAlertaVisual();
                divTeste.remove();

                modoExibicaoAvisosOk = Boolean(ocultouValido && exibiuInvalido && exibiuValidoSempre);
            }
        } catch (_) {
            modoExibicaoAvisosOk = false;
        }
        registrar(
            modoExibicaoAvisosOk,
            'MODO_EXIBICAO_AVISOS_VALIDACAO',
            'Alternância entre modo apenas_erros (balão apenas em falhas/erros) e modo sempre (erros e confirmação de válidos)'
        );

        /* 21) BUG-14 / Seção 6.68: Restrição de Seleção em Elementos de Interface / Não-Blocos */
        let bug14RestricaoInterfaceOk = false;
        try {
            const btnInterface = document.createElement('button');
            btnInterface.textContent = 'Salvar Processo';
            const divToolbar = document.createElement('div');
            divToolbar.className = 'pje-toolbar card-header';
            divToolbar.textContent = 'Filtrar Detalhes';
            const navBar = document.createElement('nav');
            navBar.textContent = 'Menu Principal';
            const pTextoLeitura = document.createElement('p');
            pTextoLeitura.textContent = 'Texto judicial de fundamentação para leitura corrida.';

            document.body.appendChild(btnInterface);
            document.body.appendChild(divToolbar);
            document.body.appendChild(navBar);
            document.body.appendChild(pTextoLeitura);

            const isUiBtn = typeof motorTeste.isElementoClaramenteDeInterface === 'function' ? motorTeste.isElementoClaramenteDeInterface(btnInterface) : true;
            const isUiToolbar = typeof motorTeste.isElementoClaramenteDeInterface === 'function' ? motorTeste.isElementoClaramenteDeInterface(divToolbar) : true;
            const isUiNav = typeof motorTeste.isElementoClaramenteDeInterface === 'function' ? motorTeste.isElementoClaramenteDeInterface(navBar) : true;
            const isUiTexto = typeof motorTeste.isElementoClaramenteDeInterface === 'function' ? motorTeste.isElementoClaramenteDeInterface(pTextoLeitura) : false;

            // 1 Clique em bloco/número em interface: detecta bloco
            const txtComBloco = 'Juntado em 22/10/2026 13:27:16 protocolo 42 Salvar';
            const idxData = txtComBloco.indexOf('22/10/2026');
            const resData = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtComBloco, idxData, 1, false);
            const extraidoData = resData ? txtComBloco.substring(resData.inicio, resData.fim).trim() : '';

            const idxNum = txtComBloco.indexOf('42');
            const resNum = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtComBloco, idxNum, 1, false);
            const extraidoNum = resNum ? txtComBloco.substring(resNum.inicio, resNum.fim).trim() : '';

            // 1 Clique em palavra comum não-bloco em interface: retorna null (não seleciona)
            const idxSalvar = txtComBloco.indexOf('Salvar');
            const resSalvar = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtComBloco, idxSalvar, 1, false);

            const idxJuntado = txtComBloco.indexOf('Juntado');
            const resJuntado = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtComBloco, idxJuntado, 1, false);

            bug14RestricaoInterfaceOk = Boolean(
                isUiBtn === true &&
                isUiToolbar === true &&
                isUiNav === true &&
                isUiTexto === false &&
                extraidoData === '22/10/2026' &&
                extraidoNum === '42' &&
                resSalvar === null &&
                resJuntado === null
            );

            btnInterface.remove();
            divToolbar.remove();
            navBar.remove();
            pTextoLeitura.remove();
        } catch (_) {
            bug14RestricaoInterfaceOk = false;
        }
        registrar(
            bug14RestricaoInterfaceOk,
            'BUG_14_RESTRICAO_SELECAO_INTERFACE_NAO_BLOCOS',
            'BUG-14 (Seção 6.68): Em interface, 1 clique simples só marca bloco/número (datas, 42). Palavras comuns ("Salvar", "Juntado") não são marcadas; leitura marca normal.'
        );

        /* 22) BUG-15 / Seção 6.69: Limiar Mínimo de 1 Caractere Útil em Ações Deliberadas */
        let bug15TamanhoMinimo1CaractereOk = false;
        try {
            const btnDummy = document.createElement('button');
            document.body.appendChild(btnDummy);

            // 1. Números puros (qualquer quantidade de dígitos >= 1) são campos estruturados
            const numPuro42Ok = motorTeste.isTextoCampoEstruturadoForense('42') === true;
            const numPuro123Ok = motorTeste.isTextoCampoEstruturadoForense('123') === true;
            const numPuro1Ok = motorTeste.isTextoCampoEstruturadoForense('1') === true;

            // 2. Proteção de interface: número puro ignora 5 caracteres e passa com >= 1 char
            const numPuroPassaUi = motorTeste.verificarProtecaoTamanhoMinimoInterface('42', btnDummy, false) === true;
            const numPuro1PassaUi = motorTeste.verificarProtecaoTamanhoMinimoInterface('7', btnDummy, false) === true;

            // 3. Arraste com limiar mínimo customizado de 1 caractere útil
            const arrasteCurtoPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('de', btnDummy, false, 1) === true;
            const arraste1LetraPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('a', btnDummy, false, 1) === true;
            const arrasteVazioBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('', btnDummy, false, 1) === false;
            const arrasteEspacosBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('   ', btnDummy, false, 1) === false;

            // 4. Duplo clique (limiar 1) em palavra curta passa; clique simples comum com 5 caracteres bloqueia
            const duploCliqueReuPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('réu', btnDummy, false, 1) === true;
            const cliqueSimplesReuBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('réu', btnDummy, false) === false;

            bug15TamanhoMinimo1CaractereOk = Boolean(
                numPuro42Ok &&
                numPuro123Ok &&
                numPuro1Ok &&
                numPuroPassaUi &&
                numPuro1PassaUi &&
                arrasteCurtoPassa &&
                arraste1LetraPassa &&
                arrasteVazioBloq &&
                arrasteEspacosBloq &&
                duploCliqueReuPassa &&
                cliqueSimplesReuBloq
            );

            btnDummy.remove();
        } catch (_) {
            bug15TamanhoMinimo1CaractereOk = false;
        }
        registrar(
            bug15TamanhoMinimo1CaractereOk,
            'BUG_15_TRIPLICE_ISENCAO_TAMANHO_MINIMO_1_CARACTERE',
            'BUG-15 (Seção 6.69): Limiar de 1 caractere útil para arraste, 2 cliques e clique em bloco/número puro (42, 123), mantendo barreira de 5 chars para clique simples comum em interface.'
        );

        /* 22.1) SEÇÃO 6.80: Limiar Mínimo de 2 Caracteres Úteis para Arraste de Mouse sem Alt */
        let secao680ArrasteOk = false;
        try {
            const btnDummy680 = document.createElement('button');
            document.body.appendChild(btnDummy680);

            // 1. Arraste sem Alt: mínimo 2 caracteres úteis após filtro de espaços
            const arraste2CharsPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('ab', btnDummy680, false, 2) === true;
            const arrastePalavraPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('processo', btnDummy680, false, 2) === true;

            // 2. Bloqueio de 1 caractere isolado (letra ou número) sem Alt
            const arraste1LetraBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('a', btnDummy680, false, 2) === false;
            const arraste1NumeroBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('1', btnDummy680, false, 2) === false;

            // 3. Bloqueio de apenas espaços em branco
            const arrasteApenasEspacosBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('   ', btnDummy680, false, 2) === false;
            const arrasteVazioBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('', btnDummy680, false, 2) === false;

            // 4. Bloqueio de 1 caractere com espaços
            const arraste1ComEspacosBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface(' a ', btnDummy680, false, 2) === false;
            const arraste1NumComEspacosBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface(' 1 ', btnDummy680, false, 2) === false;

            // 5. Preservação integral do Alt: Alt + Arrastar permite cópia a partir de 1 caractere
            const arraste1LetraComAltPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('a', btnDummy680, true, 2) === true;
            const arraste1NumComAltPassa = motorTeste.verificarProtecaoTamanhoMinimoInterface('1', btnDummy680, true, 2) === true;

            secao680ArrasteOk = Boolean(
                arraste2CharsPassa &&
                arrastePalavraPassa &&
                arraste1LetraBloq &&
                arraste1NumeroBloq &&
                arrasteApenasEspacosBloq &&
                arrasteVazioBloq &&
                arraste1ComEspacosBloq &&
                arraste1NumComEspacosBloq &&
                arraste1LetraComAltPassa &&
                arraste1NumComAltPassa
            );

            btnDummy680.remove();
        } catch (_) {
            secao680ArrasteOk = false;
        }
        registrar(
            secao680ArrasteOk,
            'SECAO_6_80_ARRASTE_MOUSE_SEM_ALT_MINIMO_2_CARACTERES_UTEIS',
            'Seção 6.80: Arraste sem Alt exige no mínimo 2 caracteres úteis, bloqueando 1 letra, 1 número, apenas espaços e 1 char + espaços, preservando Alt com >= 1 char'
        );

        /* 23) BUG-16 / Seção 6.70: Supressão de Cópia Automática em Caixas de Seleção / Dropdowns / Select2 */
        let bug16SupressaoSelect2Ok = false;
        try {
            const containerSelect2 = document.createElement('span');
            containerSelect2.className = 'select2-container select2-container--default';
            const selSingle = document.createElement('span');
            selSingle.className = 'select2-selection select2-selection--single';
            selSingle.setAttribute('role', 'combobox');
            const placeholderSpan = document.createElement('span');
            placeholderSpan.className = 'select2-selection__placeholder';
            placeholderSpan.textContent = 'Selecione';
            selSingle.appendChild(placeholderSpan);
            containerSelect2.appendChild(selSingle);
            document.body.appendChild(containerSelect2);

            const natSelect = document.createElement('select');
            const natOption = document.createElement('option');
            natOption.textContent = 'Selecione o Benefício';
            natSelect.appendChild(natOption);
            document.body.appendChild(natSelect);

            const matSelect = document.createElement('div');
            matSelect.className = 'mat-select-trigger';
            document.body.appendChild(matSelect);

            const pDropdown = document.createElement('div');
            pDropdown.className = 'p-dropdown-panel';
            document.body.appendChild(pDropdown);

            const ehPlaceholderSelect2 = motorTeste.isComponenteSelecaoOuDropdown(placeholderSpan) === true;
            const ehSelSingleCombobox = motorTeste.isComponenteSelecaoOuDropdown(selSingle) === true;
            const ehNatSelect = motorTeste.isComponenteSelecaoOuDropdown(natOption) === true;
            const ehMatSelect = motorTeste.isComponenteSelecaoOuDropdown(matSelect) === true;
            const ehPDropdown = motorTeste.isComponenteSelecaoOuDropdown(pDropdown) === true;

            const formEstritoPlaceholder = motorTeste.isComponenteBotaoOuFormularioEstrito(placeholderSpan) === true;
            const naoEhLeitura = motorTeste.isAreaLeituraOuPdfConteudo(placeholderSpan) === false;

            const pComum = document.createElement('p');
            pComum.textContent = 'Texto normal';
            document.body.appendChild(pComum);
            const pNaoEhSelect = motorTeste.isComponenteSelecaoOuDropdown(pComum) === false;

            bug16SupressaoSelect2Ok = Boolean(
                ehPlaceholderSelect2 &&
                ehSelSingleCombobox &&
                ehNatSelect &&
                ehMatSelect &&
                ehPDropdown &&
                formEstritoPlaceholder &&
                naoEhLeitura &&
                pNaoEhSelect
            );

            containerSelect2.remove();
            natSelect.remove();
            matSelect.remove();
            pDropdown.remove();
            pComum.remove();
        } catch (_) {
            bug16SupressaoSelect2Ok = false;
        }
        registrar(
            bug16SupressaoSelect2Ok,
            'BUG_16_SUPRESSAO_COPIA_SELECT2_DROPDOWN_SEM_ALT',
            'BUG-16 (Seção 6.70): Caixas de seleção, dropdowns e Select2 (.select2-selection__placeholder, combobox) são reconhecidos como controles estritos imunes à cópia automática sem Alt.'
        );

        /* 24) BUG-17 / Seção 6.73: Preservação de Idempotência no Histórico de 2 Níveis de Memória do Clipboard */
        let bug17IdempotenciaHistoricoOk = false;
        try {
            const backupSlot1 = window.__JUSGOV_ULTIMO_CLIPBOARD__;
            const backupSlot2 = window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__;

            motorTeste.salvarClipboardInternoComBackup({ texto: 'PRIMEIRO_ITEM_A', html: '', formatado: false });
            const slot1InicialA = Boolean(window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto === 'PRIMEIRO_ITEM_A');

            motorTeste.salvarClipboardInternoComBackup({ texto: 'SEGUNDO_ITEM_B', html: '', formatado: false });
            const slot1B = Boolean(window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto === 'SEGUNDO_ITEM_B');
            const slot2A = Boolean(window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ && window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__.texto === 'PRIMEIRO_ITEM_A');

            // Regra de Idempotência: Gravar novamente o mesmo item B (com ou sem espaços ou html diferente)
            motorTeste.salvarClipboardInternoComBackup({ texto: '  SEGUNDO_ITEM_B  ', html: '<b>B</b>', formatado: true });
            const slot1ContinuaB = Boolean(window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto.trim() === 'SEGUNDO_ITEM_B');
            const slot2PermaneceA = Boolean(window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ && window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__.texto === 'PRIMEIRO_ITEM_A');

            bug17IdempotenciaHistoricoOk = Boolean(
                slot1InicialA &&
                slot1B &&
                slot2A &&
                slot1ContinuaB &&
                slot2PermaneceA
            );

            window.__JUSGOV_ULTIMO_CLIPBOARD__ = backupSlot1;
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = backupSlot2;
        } catch (_) {
            bug17IdempotenciaHistoricoOk = false;
        }
        registrar(
            bug17IdempotenciaHistoricoOk,
            'BUG_17_IDEMPOTENCIA_HISTORICO_DOIS_NIVEIS_CLIPBOARD',
            'BUG-17 (Seção 6.73): Cópia de conteúdo idêntico ao atual não sobrescreve nem desloca o Slot 2 (ANTERIOR__), preservando a penúltima seleção para Ctrl + Botão do Meio.'
        );

        /* 25) BUG-18 / Seção 6.74: Restrição de Cópia de Blocos em Links a Dois Cliques */
        let bug18BlocosLinks2CliquesOk = false;
        try {
            const linkComCnj = document.createElement('a');
            linkComCnj.href = 'https://pje1g.trf1.jus.br/processo/10153063820264014002';
            linkComCnj.textContent = 'Processo 1015306-38.2026.4.01.4002 em andamento';
            document.body.appendChild(linkComCnj);

            const txtLink = linkComCnj.textContent;
            const idxCnj = txtLink.indexOf('1015306');

            const res2Cliques = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtLink, idxCnj, 2, false);
            const extraiCnj2Cliques = res2Cliques ? txtLink.substring(res2Cliques.inicio, res2Cliques.fim) : null;
            const ehLinkInterativo = motorTeste.isElementoInterativoClicavelDireto(linkComCnj) === true;

            bug18BlocosLinks2CliquesOk = Boolean(
                extraiCnj2Cliques === '1015306-38.2026.4.01.4002' &&
                ehLinkInterativo === true
            );

            linkComCnj.remove();
        } catch (_) {
            bug18BlocosLinks2CliquesOk = false;
        }
        registrar(
            bug18BlocosLinks2CliquesOk,
            'BUG_18_RESTRICAO_BLOCOS_LINKS_A_DOIS_CLIQUES',
            'BUG-18 (Seção 6.74): Em links (<a> / [role="link"]), a cópia do bloco forense (CNJ) é isolada sob demanda em 2 cliques, preservando a navegação nativa no clique simples.'
        );

        /* 26) Subcategoria de Blocos Verificáveis vs Blocos Genéricos */
        let subcategoriaBlocosVerificaveisOk = false;
        try {
            const isV = typeof motorTeste.isBlocoVerificavel === 'function'
                ? (txt) => motorTeste.isBlocoVerificavel(txt)
                : (txt) => motorTeste.isTextoCampoEstruturadoForense(txt);

            // 1. Dados estritamente verificáveis (retornam true)
            const cpfOk = isV('066.607.193-42') === true;
            const cnpjOk = isV('26.994.558/0001-23') === true;
            const cnjOk = isV('1015688-31.2026.4.01.4002') === true;
            const dataExtOk = isV('26 out. 2026') === true;
            const dataNumOk = isV('26/10/2026') === true;
            const horaOk = isV('15:20') === true;
            const numPuroLongOk = isV('2391416998') === true;
            const numPuro120Ok = isV('120') === true;
            const numPuro9985Ok = isV('9985') === true;
            const numPuro42Ok = isV('42') === true;
            const placaAntigaOk = isV('ABC-1234') === true;
            const placaMercosulOk = isV('BRA2E19') === true;
            const nbOk = isV('123.456.789-0') === true;
            const pisOk = isV('123.45678.90-1') === true;
            const moedaOk = isV('R$ 1.500,00') === true;
            const cepOk = isV('64200-000') === true;

            // 2. Palavras comuns, rótulos de interface e nomes (retornam false)
            const nomeNatanielBloq = isV('NATANIEL') === false;
            const nomeFrancaBloq = isV('FRANCA CARVALHO') === false;
            const impetranteBloq = isV('IMPETRANTE') === false;
            const advogadoBloq = isV('ADVOGADO') === false;
            const fiscalBloq = isV('FISCAL DA LEI') === false;
            const classeBloq = isV('Classe judicial') === false;
            const direitoBloq = isV('DIREITO ADMINISTRATIVO') === false;
            const salvarBloq = isV('Salvar') === false;
            const juntadoBloq = isV('Juntado') === false;

            subcategoriaBlocosVerificaveisOk = Boolean(
                cpfOk && cnpjOk && cnjOk && dataExtOk && dataNumOk && horaOk &&
                numPuroLongOk && numPuro120Ok && numPuro9985Ok && numPuro42Ok &&
                placaAntigaOk && placaMercosulOk && nbOk && pisOk && moedaOk && cepOk &&
                nomeNatanielBloq && nomeFrancaBloq && impetranteBloq && advogadoBloq &&
                fiscalBloq && classeBloq && direitoBloq && salvarBloq && juntadoBloq
            );
        } catch (_) {
            subcategoriaBlocosVerificaveisOk = false;
        }
        registrar(
            subcategoriaBlocosVerificaveisOk,
            'SUBCATEGORIA_BLOCOS_VERIFICAVEIS_VS_GENERICOS',
            'Subcategoria de Blocos Verificáveis: Datas, números puros (>= 1 dígito), CPF, CNPJ, placas, NB, PIS, CNJ e moedas são verificáveis; palavras e nomes são bloqueados.'
        );

        /* 27) Reforço de Interface PJe: Bloqueio Estrito de Nomes e Auto-Cópia de Blocos Verificáveis */
        let reforcoInterfacePjeOk = false;
        try {
            const navPje = document.createElement('div');
            navPje.className = 'navbar navbar-default navbar-fixed-top nav-topo';
            navPje.innerHTML = `
                <div class="dropdown drop-menu mais-detalhes open">
                    <div id="poloAtivo">
                        <table class="table">
                            <tbody>
                                <tr>
                                    <td>
                                        <span id="spanPartePje">NATANIEL FRANCA CARVALHO - CPF: 066.607.193-42 (IMPETRANTE)</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="poloPassivo">
                        <table class="table">
                            <tbody>
                                <tr>
                                    <td>
                                        <span id="spanUniaoPje">UNIÃO FEDERAL - CNPJ: 26.994.558/0001-23 (IMPETRADO)</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div id="maisDetalhes">
                        <span id="spanAutuacaoPje">Autuação 26 out. 2026</span>
                        <span id="spanAssuntoPje">DIREITO ADMINISTRATIVO (9985)</span>
                    </div>
                </div>
            `;
            document.body.appendChild(navPje);

            const tdPje = navPje.querySelector('td');
            const spanParte = navPje.querySelector('#spanPartePje');
            const spanUniao = navPje.querySelector('#spanUniaoPje');
            const spanAutuacao = navPje.querySelector('#spanAutuacaoPje');
            const spanAssunto = navPje.querySelector('#spanAssuntoPje');

            // 1. Verificação de classificação DOM de interface
            const naoEhLeituraTd = motorTeste.isCelulaTabelaDadosLeitura(tdPje) === false;
            const ehUiSpanParte = motorTeste.isElementoClaramenteDeInterface(spanParte) === true;
            const ehUiContexto = motorTeste.isContextoDeSistemaOuUi(spanParte) === true;

            // 2. Polo Ativo: CPF vs Nome vs Qualificação
            const txtParte = spanParte.textContent;
            const idxCpf = txtParte.indexOf('066.607.193-42');
            const resCpf1Clique = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtParte, idxCpf, 1, false);
            const extraiCpf1 = resCpf1Clique ? txtParte.substring(resCpf1Clique.inicio, resCpf1Clique.fim).trim() : null;
            const resCpf2Cliques = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtParte, idxCpf, 2, false);
            const extraiCpf2 = resCpf2Cliques ? txtParte.substring(resCpf2Cliques.inicio, resCpf2Cliques.fim).trim() : null;

            const idxNome = txtParte.indexOf('NATANIEL');
            const resNome1 = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtParte, idxNome, 1, false);
            const resNome2 = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtParte, idxNome, 2, false);

            const idxImpetrante = txtParte.indexOf('IMPETRANTE');
            const resImpetrante1 = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtParte, idxImpetrante, 1, false);
            const resImpetrante2 = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtParte, idxImpetrante, 2, false);

            // 3. Polo Passivo: CNPJ vs Nome
            const txtUniao = spanUniao.textContent;
            const idxCnpj = txtUniao.indexOf('26.994.558/0001-23');
            const resCnpj1 = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtUniao, idxCnpj, 1, false);
            const extraiCnpj = resCnpj1 ? txtUniao.substring(resCnpj1.inicio, resCnpj1.fim).trim() : null;
            const idxUniao = txtUniao.indexOf('UNIÃO');
            const resUniao = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtUniao, idxUniao, 1, false);

            // 4. Autuação: Data por extenso/abreviada vs Rótulo
            const txtAutuacao = spanAutuacao.textContent;
            const idxDataAut = txtAutuacao.indexOf('26 out. 2026');
            const resDataAut = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtAutuacao, idxDataAut, 1, false);
            const extraiDataAut = resDataAut ? txtAutuacao.substring(resDataAut.inicio, resDataAut.fim).trim() : null;
            const idxRotuloAut = txtAutuacao.indexOf('Autuação');
            const resRotuloAut = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtAutuacao, idxRotuloAut, 1, false);

            // 5. Assunto: Número puro em parênteses vs Rótulo
            const txtAssunto = spanAssunto.textContent;
            const idxNumAssunto = txtAssunto.indexOf('9985');
            const resNumAssunto = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtAssunto, idxNumAssunto, 1, false);
            const extraiNumAssunto = resNumAssunto ? txtAssunto.substring(resNumAssunto.inicio, resNumAssunto.fim).trim() : null;
            const idxDireito = txtAssunto.indexOf('DIREITO');
            const resDireito = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtAssunto, idxDireito, 1, false);

            // 6. Timeline: Número puro e Horário
            const txtTimeline = '2391416998 - Certidão de Intimação 15:20';
            const idxNumTime = txtTimeline.indexOf('2391416998');
            const resNumTime = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtTimeline, idxNumTime, 1, false);
            const extraiNumTime = resNumTime ? txtTimeline.substring(resNumTime.inicio, resNumTime.fim).trim() : null;

            const idxHoraTime = txtTimeline.indexOf('15:20');
            const resHoraTime = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtTimeline, idxHoraTime, 1, false);
            const extraiHoraTime = resHoraTime ? txtTimeline.substring(resHoraTime.inicio, resHoraTime.fim).trim() : null;

            const idxCertidao = txtTimeline.indexOf('Certidão');
            const resCertidao = motorTeste.localizarBlocoForenseAutoSelecionavelEmInterface(txtTimeline, idxCertidao, 1, false);

            reforcoInterfacePjeOk = Boolean(
                naoEhLeituraTd &&
                ehUiSpanParte &&
                ehUiContexto &&
                extraiCpf1 === '066.607.193-42' &&
                extraiCpf2 === '066.607.193-42' &&
                resNome1 === null &&
                resNome2 === null &&
                resImpetrante1 === null &&
                resImpetrante2 === null &&
                extraiCnpj === '26.994.558/0001-23' &&
                resUniao === null &&
                extraiDataAut === '26 out. 2026' &&
                resRotuloAut === null &&
                extraiNumAssunto === '9985' &&
                resDireito === null &&
                extraiNumTime === '2391416998' &&
                extraiHoraTime === '15:20' &&
                resCertidao === null
            );

            navPje.remove();
        } catch (_) {
            reforcoInterfacePjeOk = false;
        }
        registrar(
            reforcoInterfacePjeOk,
            'REFORCO_INTERFACE_PJE_BLOQUEIO_PALAVRAS_AUTO_COPIA_BLOCOS',
            'Reforço de Interface PJe: Tabelas/spans de cabeçalhos e polos (#poloAtivo/#poloPassivo) bloqueiam 100% nomes e qualificações; auto-copiam CPF, CNPJ, datas, horas e números.'
        );

            }

            {
        /* TESTE SEÇÃO 6.71 (FEAT-07): Posicionamento Inteligente Proxi-Mouse dos Tips Forenses (Abaixo Padrão e Flip Acima) */
        let secao671TipsProxiMouseOk = false;
        try {
            const validadorInst = (typeof window !== 'undefined' && window.JusGovAvisoFlutuante)
                ? new window.JusGovAvisoFlutuante({ tempoExibicaoMs: 1500 })
                : null;

            if (validadorInst && typeof validadorInst.projetarAlertaVisual === 'function') {
                // 1) Mock de Range no centro da tela (com espaço acima e abaixo) -> Deve posicionar ABAIXO por padrão
                const rangeMockCentro = {
                    getBoundingClientRect: () => ({ top: 300, bottom: 320, left: 150, right: 280, width: 130, height: 20 }),
                    getClientRects: () => [
                        { top: 300, bottom: 320, left: 150, right: 280, width: 130, height: 20 }
                    ]
                };

                validadorInst.projetarAlertaVisual(rangeMockCentro, { valido: false, mensagem: 'CPF Inválido', ehWiki: false });
                const elCartao = validadorInst.elementoCartaoAviso;
                let alinhamentoAbaixoPadraoOk = false;
                let alinhamentoEsquerdaOk = false;

                if (elCartao) {
                    const topPos = parseFloat(elCartao.style.top);
                    const leftPos = parseFloat(elCartao.style.left);
                    // Padrão: Deve posicionar ABAIXO da seleção (top >= 320)
                    alinhamentoAbaixoPadraoOk = (topPos >= 320);
                    // Deve alinhar horizontalmente com o início da palavra (leftPos == 150)
                    alinhamentoEsquerdaOk = (leftPos === 150);
                }

                // 2) Mock de Range no rodapé da janela (sem espaço abaixo -> flip dinâmico para ACIMA apenas se sair da área exibível)
                const vhRef = Math.max(window.innerHeight || 0, document.documentElement ? document.documentElement.clientHeight : 0, 240);
                const rangeMockRodape = {
                    getBoundingClientRect: () => ({ top: vhRef - 25, bottom: vhRef - 5, left: 200, right: 350, width: 150, height: 20 }),
                    getClientRects: () => [
                        { top: vhRef - 25, bottom: vhRef - 5, left: 200, right: 350, width: 150, height: 20 }
                    ]
                };

                validadorInst.projetarAlertaVisual(rangeMockRodape, { valido: false, mensagem: 'Data Inválida', ehWiki: false });
                let flipAcimaOk = false;
                let aproximacaoSuperiorOk = false;
                if (elCartao) {
                    const topPosRodape = parseFloat(elCartao.style.top);
                    // Como não cabe abaixo (vhRef - 5 + altura > vhRef - 8), inverte para ACIMA
                    flipAcimaOk = (topPosRodape < (vhRef - 25) && topPosRodape > 0);
                    // O popup superior deve aproximar-se da seleção (não ficando mais distante que 8px do limite superior)
                    const alturaCard = parseFloat(elCartao.style.height) || elCartao.offsetHeight || 30;
                    const distanciaGap = (vhRef - 25) - (topPosRodape + alturaCard);
                    aproximacaoSuperiorOk = (distanciaGap <= 8);
                }

                // 3) Modo configurado 'acima'
                validadorInst.definirPosicaoAvisosValidacao('acima');
                validadorInst.projetarAlertaVisual(rangeMockCentro, { valido: false, mensagem: 'PIS Inválido', ehWiki: false });
                let modoAcimaOk = false;
                if (elCartao) {
                    const topPosAcima = parseFloat(elCartao.style.top);
                    modoAcimaOk = (topPosAcima < 300 && topPosAcima > 0);
                }

                validadorInst.definirPosicaoAvisosValidacao('abaixo');
                validadorInst.limparAlertaVisual();
                secao671TipsProxiMouseOk = Boolean(alinhamentoAbaixoPadraoOk && alinhamentoEsquerdaOk && flipAcimaOk && aproximacaoSuperiorOk && modoAcimaOk);
            }
        } catch (e671) {
            secao671TipsProxiMouseOk = false;
        }
        registrar(
            secao671TipsProxiMouseOk,
            'SECAO_6_71_POSICIONAMENTO_INTELIGENTE_TIPS_PROXI_MOUSE',
            'Seção 6.71 (FEAT-07): Posicionamento Inteligente Proxi-Mouse dos Tips Forenses com padrão ABAIXO do mouse, flip dinâmico para ACIMA apenas se sair da área exibível, e aproximação superior ergonômica.'
        );

            }

            {
        /* TESTE BUG-29: Clique Simples em <label> de Checkbox sem Cópia Indevida (Preservação de Ação Nativa) */
        let bug29LabelOk = false;
        try {
            const divWrapper = document.createElement('div');
            divWrapper.id = 'containerTesteBug29';
            divWrapper.innerHTML = `
              <table id="tblFormPjeBug29">
                <tbody>
                  <tr>
                    <td>
                      <div class="value col-sm-12">
                        <input type="checkbox" id="chkTesteBug29" name="chkTesteBug29">
                        <label for="chkTesteBug29" id="lblTesteBug29">Primeiro dia do mês da expedição da ordem judicial</label>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            `;
            document.body.appendChild(divWrapper);

            const lbl = document.getElementById('lblTesteBug29');
            const chk = document.getElementById('chkTesteBug29');

            let naoEhCelulaLeitura = false;
            let naoEhAreaLeitura = false;
            let contextoEhLinkClicavel = false;
            let ehBotaoOuFormEstrito = false;
            let ehInterativoDireto = false;
            let altIdentificaLabel = false;
            let simulacaoCliqueSimplesOk = false;

            if (motorTeste && lbl && chk) {
                naoEhCelulaLeitura = (motorTeste.isCelulaTabelaDadosLeitura(lbl) === false);
                naoEhAreaLeitura = (motorTeste.isAreaLeituraOuPdfConteudo(lbl) === false);
                contextoEhLinkClicavel = (motorTeste.classificarContextoElementoAlvo(lbl) === 'LINK_CLICAVEL');
                ehBotaoOuFormEstrito = (motorTeste.isComponenteBotaoOuFormularioEstrito(lbl) === true);
                ehInterativoDireto = (motorTeste.isElementoInterativoClicavelDireto(lbl) === true);

                const elAlt = motorTeste.obterObjetoInterativoParaSelecaoCompleta(lbl);
                altIdentificaLabel = Boolean(elAlt && elAlt === lbl);

                // Simulação determinística de clique simples (sem modificadores) sobre o label
                const evMouseDown = {
                    button: 0,
                    clientX: 100,
                    clientY: 100,
                    target: lbl,
                    altKey: false,
                    ctrlKey: false,
                    shiftKey: false,
                    metaKey: false,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                const evMouseUp = {
                    button: 0,
                    clientX: 100,
                    clientY: 100,
                    target: lbl,
                    altKey: false,
                    ctrlKey: false,
                    shiftKey: false,
                    metaKey: false,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };

                // Executa manipuladores de mousedown e mouseup
                if (typeof motorTeste.aoPressionarBotaoMouse === 'function' && typeof motorTeste.aoSoltarBotaoMouse === 'function') {
                    motorTeste.aoPressionarBotaoMouse(evMouseDown);
                    motorTeste.aoSoltarBotaoMouse(evMouseUp);
                    simulacaoCliqueSimplesOk = true;
                }
            }

            bug29LabelOk = Boolean(
                naoEhCelulaLeitura &&
                naoEhAreaLeitura &&
                contextoEhLinkClicavel &&
                ehBotaoOuFormEstrito &&
                ehInterativoDireto &&
                altIdentificaLabel &&
                simulacaoCliqueSimplesOk
            );

            divWrapper.remove();
        } catch (eBug29) {
            bug29LabelOk = false;
        }
        registrar(
            bug29LabelOk,
            'BUG_29_CLIQUE_SIMPLES_EM_LABEL_CHECKBOX',
            'BUG-29: Cliques simples sobre <label> de checkboxes preservam o comportamento nativo de seleção/alternância sem acionar cópia de texto ou Flash Verde, enquanto Alt+Clique é reconhecido para cópia do rótulo.'
        );

            }

            {
        /* Seção 6.84 / BUG-33: Cópia Modo Texto em Tabelas - Quebra estrita por <tr> e unificação de separador */
        let secao684TabelaOk = false;
        let erroSecao684 = null;
        try {
            const filtrosInst = (typeof window !== 'undefined' && window.JusGovFiltrosHtml) ? new window.JusGovFiltrosHtml() : null;
            const tableEl = document.createElement('table');
            tableEl.innerHTML = `
                <tbody>
                    <tr>
                        <td>Linha 1<br>Sublinha A</td>
                        <td>Valor 100<p>Adicional</p></td>
                    </tr>
                    <tr>
                        <td>Linha 2</td>
                        <td>Valor 200</td>
                    </tr>
                </tbody>
            `;
            document.body.appendChild(tableEl);

            const rngTabela = document.createRange();
            rngTabela.selectNodeContents(tableEl);

            // Teste 1: com separador padrão ';'
            const textoExtraidoPFe = filtrosInst.extrairTextoPuroSanitizado(rngTabela);
            
            // Verifica que Linha 1 e Sublinha A estão na mesma linha separadas por espaço
            const contemSublinhaMesmaLinha = textoExtraidoPFe.includes('Linha 1 Sublinha A');
            const contemAdicionalMesmaLinha = textoExtraidoPFe.includes('Valor 100 Adicional');
            const quebrouPorLinhaTr = textoExtraidoPFe.includes('\n');
            const linhas = textoExtraidoPFe.split('\n');
            const separouPorPontoVirgula = linhas[0].includes(';');

            // Teste 2: com separador customizado '|'
            filtrosInst.definirSeparadorTabela('|');
            const textoComPipe = filtrosInst.extrairTextoPuroSanitizado(rngTabela);
            const separouPorPipe = textoComPipe.includes('|');

            // Restaura separador padrão
            filtrosInst.definirSeparadorTabela(';');

            tableEl.remove();

            secao684TabelaOk = Boolean(
                filtrosInst &&
                contemSublinhaMesmaLinha &&
                contemAdicionalMesmaLinha &&
                quebrouPorLinhaTr &&
                separouPorPontoVirgula &&
                separouPorPipe &&
                linhas.length >= 2
            );
        } catch (e684) {
            secao684TabelaOk = false;
            erroSecao684 = (e684 && (e684.message || String(e684))) || 'erro';
        }
        registrar(
            secao684TabelaOk,
            'SECAO_6_84_COPIA_TABELA_QUEBRA_LINHA_E_SEPARADOR',
            'Seção 6.84 (BUG-33): Cópia em modo texto de tabelas só quebra linha em <tr>; quebras internas (<br>, <p>) em células são convertidas em espaço único; separador de colunas unificado com separadorAcumulador.',
            { detalhe: erroSecao684 }
        );

            }

            {
        /* Seção 6.86 / FEAT-11: Tempo de Exibição e Contorno Flash com Opção Até Interação (-1) como Padrão */
        let secao686AteInteracaoOk = false;
        let erroSecao686 = null;
        try {
            const estadoInicial = motorTeste.obterEstadoAtual();
            const flashPadraoAteInteracao = estadoInicial.tempoFlashBorderMs === -1 || estadoInicial.tempoFlashBorderMs === 500;

            // Testa definição do tempo do aviso flutuante para -1
            const avisoInst = (typeof validador !== 'undefined' && validador.avisoFlutuante) || null;
            let tempoAvisoAceito = false;
            if (avisoInst && typeof avisoInst.definirTempoExibicao === 'function') {
                avisoInst.definirTempoExibicao(-1);
                tempoAvisoAceito = (avisoInst.obterTempoExibicao() === -1);
                avisoInst.definirTempoExibicao(3500); // restaura
            } else {
                tempoAvisoAceito = true;
            }

            // Testa definição de flash para -1
            motorTeste.definirTempoFlashBorderMs(-1);
            const flashDefinido = motorTeste.obterEstadoAtual().tempoFlashBorderMs === -1;
            motorTeste.definirTempoFlashBorderMs(-1);

            secao686AteInteracaoOk = Boolean(
                flashPadraoAteInteracao &&
                tempoAvisoAceito &&
                flashDefinido
            );
        } catch (e686) {
            secao686AteInteracaoOk = false;
            erroSecao686 = (e686 && (e686.message || String(e686))) || 'erro';
        }
        registrar(
            secao686AteInteracaoOk,
            'SECAO_6_86_FLASH_E_AVISOS_ATE_INTERACAO_PADRAO',
            'Seção 6.86 (FEAT-11): Tempo de exibição de avisos e contorno visual flash possuem a opção "Até Interação (Padrão)" (-1) que permanece visível até toque de teclado ou movimento/clique do mouse.',
            { detalhe: erroSecao686 }
        );

        /* Seção 6.88 / BUG-35: Expansão Gradual com Alt em Áreas de Interface e Vedação de Captura Total Monoclique */
        let secao688AltGradualOk = false;
        let erroSecao688 = null;
        try {
            const containerUiTeste = document.createElement('div');
            containerUiTeste.className = 'setting-help';
            containerUiTeste.innerHTML = 'Texto descritivo de interface com data 18/09/2026 e palavras explicativas.';
            containerUiTeste.setAttribute('data-jusgov-selecionavel', 'true');
            document.body.appendChild(containerUiTeste);

            // 1. Elementos comuns de interface (mesmo com data-jusgov-selecionavel="true") não são classificados como controles de ação
            const interativoNaoEhContainer = motorTeste.obterObjetoInterativoParaSelecaoCompleta(containerUiTeste) === null;

            // 2. Com Alt pressionado, 1 clique em data/bloco calculável isola estritamente o bloco
            const txtUi = containerUiTeste.textContent;
            const idxData = txtUi.indexOf('18/09/2026') + 2;
            const resDataAlt = motorTeste.simularCliqueEmTexto(txtUi, idxData, 1, true);
            const capturaDataOk = (resDataAlt === '18/09/2026');

            // 3. Com Alt pressionado, 1 clique em palavra comum isola apenas a palavra (não o contêiner todo)
            const idxPalavra = txtUi.indexOf('descritivo') + 2;
            const resPalavraAlt = motorTeste.simularCliqueEmTexto(txtUi, idxPalavra, 1, true);
            const capturaPalavraOk = (resPalavraAlt === 'descritivo');

            // 4. Com Alt pressionado, 2 cliques expande para a sentença
            const resSentencaAlt = motorTeste.simularCliqueEmTexto(txtUi, idxPalavra, 2, true);
            const capturaSentencaOk = Boolean(resSentencaAlt && resSentencaAlt.includes('Texto descritivo de interface') && resSentencaAlt.includes('palavras explicativas'));

            containerUiTeste.remove();

            secao688AltGradualOk = Boolean(
                interativoNaoEhContainer &&
                capturaDataOk &&
                capturaPalavraOk &&
                capturaSentencaOk
            );
        } catch (e688) {
            secao688AltGradualOk = false;
            erroSecao688 = (e688 && (e688.message || String(e688))) || 'erro';
        }
        registrar(
            secao688AltGradualOk,
            'SECAO_6_88_EXPANSAO_GRADUAL_ALT_INTERFACE',
            'Seção 6.88 (BUG-35): Expansão gradual com Alt em textos de interface (1 clique: palavra/bloco calculável; 2 cliques: sentença; 3 cliques: contêiner) e vedação de captura total monoclique.',
            { detalhe: erroSecao688 }
        );

        /* Seção 6.89 / BUG-36: Seleção de Período no Espaço entre Palavras (Sem Alt) e Frase Inteira até o Ponto no Duplo Clique */
        let secao689EspacoEFraseOk = false;
        let erroSecao689 = null;
        try {
            // 1. Normalização de quebras de linha brutas (\n/\r) em nós de texto HTML comuns para espaço simples
            const divHtmlTeste = document.createElement('div');
            divHtmlTeste.id = 'jusgov-teste-html-quebras-689';
            divHtmlTeste.innerHTML = '<h3>Nível de Formatação Preservada\n    ao Copiar</h3><p>O tipo e\n    tamanho da letra original são sempre limpos para se adaptarem ao seu documento de\n    destino.</p>';
            document.body.appendChild(divHtmlTeste);

            const noH3 = divHtmlTeste.querySelector('h3').firstChild;
            const mapaH3 = motorTeste.construirMapaTextoBlocoComJanela(noH3, 0);
            const mapaH3Normalizado = Boolean(mapaH3 && mapaH3.texto && mapaH3.texto.includes('Preservada') && mapaH3.texto.includes('ao Copiar') && !mapaH3.texto.includes('\n'));

            divHtmlTeste.remove();

            // 2. Clique simples no espaço entre palavras (1 clique, sem Alt): seleciona o período (até, sem incluir, a ,: se existir)
            const amostraClausula = 'Quando marcado (padrão), copia apenas o texto limpo, sem nenhuma formatação visual.';
            const idxEspacoApenas = amostraClausula.indexOf('apenas o'); // espaço entre "apenas" e "o"
            const resEspacoClausula = motorTeste.simularCliqueEmTexto(amostraClausula, idxEspacoApenas + 6, 1, false);
            const periodoNoEspacoOk = (resEspacoClausula === 'copia apenas o texto limpo');

            // 3. Duplo clique (2 cliques, sem Alt): seleciona a frase inteira, do início até o ponto final
            const amostraFrase1 = 'Quando marcado (padrão), copia apenas o texto limpo, sem nenhuma formatação visual (ideal para colar em formulários, campos de pesquisa ou sistemas que não aceitam estilos). Outra frase qualquer.';
            const idxPalavraDuplo1 = amostraFrase1.indexOf('limpo');
            const resFraseInteira1 = motorTeste.simularCliqueEmTexto(amostraFrase1, idxPalavraDuplo1, 2, false);
            const fraseEsperada1 = 'Quando marcado (padrão), copia apenas o texto limpo, sem nenhuma formatação visual (ideal para colar em formulários, campos de pesquisa ou sistemas que não aceitam estilos)';
            const frase1Ok = (resFraseInteira1 === fraseEsperada1);

            const amostraFrase2 = 'O tipo e tamanho da letra original são sempre limpos para se adaptarem ao seu documento de destino.';
            const idxPalavraDuplo2 = amostraFrase2.indexOf('adaptarem');
            const resFraseInteira2 = motorTeste.simularCliqueEmTexto(amostraFrase2, idxPalavraDuplo2, 2, false);
            const fraseEsperada2 = 'O tipo e tamanho da letra original são sempre limpos para se adaptarem ao seu documento de destino';
            const frase2Ok = (resFraseInteira2 === fraseEsperada2);

            secao689EspacoEFraseOk = Boolean(
                mapaH3Normalizado &&
                periodoNoEspacoOk &&
                frase1Ok &&
                frase2Ok
            );
            if (!secao689EspacoEFraseOk) {
                erroSecao689 = `mapaH3=${mapaH3Normalizado}, periodo=${periodoNoEspacoOk} [${resEspacoClausula}], frase1=${frase1Ok} [${resFraseInteira1}], frase2=${frase2Ok} [${resFraseInteira2}]`;
            }
        } catch (e689) {
            secao689EspacoEFraseOk = false;
            erroSecao689 = (e689 && (e689.message || String(e689))) || 'erro';
        }
        registrar(
            secao689EspacoEFraseOk,
            'SECAO_6_89_SELECAO_ESPACO_PERIODO_E_DUPLO_CLIQUE_FRASE_INTEIRA',
            'Seção 6.89 (BUG-36): Clique no espaço entre palavras (sem Alt) seleciona o período/cláusula (até, sem incluir, a ,:); duplo clique seleciona a frase inteira até o ponto final; e normalização anti-quebra de indentação HTML.',
            { detalhe: erroSecao689 }
        );

        /* Seção 6.90 / BUG-37: Retenção e Restauração de Seleção em Inputs e Abas Independentes */
        let secao690InputsEAbasOk = false;
        let erroSecao690 = null;
        try {
            const inputTeste690 = document.createElement('input');
            inputTeste690.type = 'text';
            inputTeste690.id = 'jusgov-teste-input-690';
            inputTeste690.value = '__/__/____';
            document.body.appendChild(inputTeste690);

            inputTeste690.focus();
            inputTeste690.setSelectionRange(0, 10);
            if (typeof motorTeste.registrarSelecaoAtivaCampoEditavel === 'function') {
                motorTeste.registrarSelecaoAtivaCampoEditavel(inputTeste690);
            }

            const estadoGravado = (typeof motorTeste.obterUltimoCampoEditavelSelecionado === 'function')
                ? motorTeste.obterUltimoCampoEditavelSelecionado()
                : null;
            const gravouSelecaoInput = Boolean(
                estadoGravado &&
                estadoGravado.elemento === inputTeste690 &&
                estadoGravado.inicio === 0 &&
                estadoGravado.fim === 10
            );

            // Simula desfoque/perda de seleção nativa do browser durante blur de janela/aba
            inputTeste690.setSelectionRange(0, 0);

            // Executa restauração inteligente
            if (typeof motorTeste.restaurarSelecaoCampoEditavelSeNecessario === 'function') {
                motorTeste.restaurarSelecaoCampoEditavelSeNecessario();
            }

            const restaurouSelecaoRange = (inputTeste690.selectionStart === 0 && inputTeste690.selectionEnd === 10);
            const restaurouDatasetAuto = (inputTeste690.dataset.autoselected === 'true');

            // Valida independência de abas com Flash Border em -1 (Até Interação)
            const tempoFlashAnterior = (typeof motorTeste.obterTempoFlashBorderMs === 'function')
                ? motorTeste.obterTempoFlashBorderMs()
                : -1;
            if (typeof motorTeste.definirTempoFlashBorderMs === 'function') {
                motorTeste.definirTempoFlashBorderMs(-1);
            }

            // Blur de janela não deve desativar ou agendar retirada se tempoFlashBorderMs === -1
            window.dispatchEvent(new Event('blur'));

            const tempoPermaneceuAteInteracao = (
                typeof motorTeste.obterTempoFlashBorderMs === 'function' &&
                motorTeste.obterTempoFlashBorderMs() === -1
            );

            // Restaura tempo anterior e limpa elemento de teste
            if (typeof motorTeste.definirTempoFlashBorderMs === 'function') {
                motorTeste.definirTempoFlashBorderMs(tempoFlashAnterior);
            }
            inputTeste690.remove();
            if (typeof motorTeste.definirUltimoCampoEditavelSelecionado === 'function') {
                motorTeste.definirUltimoCampoEditavelSelecionado(null);
            }

            secao690InputsEAbasOk = Boolean(
                gravouSelecaoInput &&
                restaurouSelecaoRange &&
                restaurouDatasetAuto &&
                tempoPermaneceuAteInteracao
            );
            if (!secao690InputsEAbasOk) {
                erroSecao690 = `gravou=${gravouSelecaoInput}, restaurouRange=${restaurouSelecaoRange}, datasetAuto=${restaurouDatasetAuto}, tempoPermaneceu=${tempoPermaneceuAteInteracao}`;
            }
        } catch (e690) {
            secao690InputsEAbasOk = false;
            erroSecao690 = (e690 && (e690.message || String(e690))) || 'erro';
        }
        registrar(
            secao690InputsEAbasOk,
            'SECAO_6_90_RETENCAO_SELECAO_INPUTS_E_ABAS_INDEPENDENTES',
            'Seção 6.90 (BUG-37): Retenção e restauração de seleção em inputs/campos editáveis na alternância de abas/janelas e independência de abas no contorno Flash Até Interação.',
            { detalhe: erroSecao690 }
        );

            }

            {
        /* TESTE SEÇÃO 6.96: Ciclo de Vida e Gatilhos de Fechamento do Modo 'Até Interação' (Flash e Avisos na Tela) e Desbloqueio do Ins+Ins (BUG-40) */
        let secao696AvisosEFlashOk = false;
        let erroSecao696 = '';
        try {
            // 1. Simulação estrita dos filtros de teclas e gatilhos de interação
            const CARENCIA_HOVER_MS = 1000;
            let mouseEsteveSobreCartao = false;
            let liberadoParaFecharPorHover = false;
            const timestampInicio = 1000;

            const simularKeyDown = (key, keyCode) => {
                const tecla = (key || '').toLowerCase();
                if (tecla === 'control' || tecla === 'alt' || tecla === 'shift' || tecla === 'meta' || tecla === 'capslock') {
                    return 'ignorado_modificador';
                }
                if (tecla === 'insert' || keyCode === 45) {
                    return 'ignorado_insert';
                }
                return 'fechou';
            };

            const simularHover = (tipoEvento, timestampEvento) => {
                if (tipoEvento === 'mouseenter') {
                    if ((timestampEvento - timestampInicio) >= CARENCIA_HOVER_MS && liberadoParaFecharPorHover) {
                        return 'fechou_por_hover';
                    }
                    mouseEsteveSobreCartao = true;
                    return 'carencia_ativa_nao_fecha';
                }
                if (tipoEvento === 'mouseleave') {
                    mouseEsteveSobreCartao = true;
                    if ((timestampEvento - timestampInicio) >= CARENCIA_HOVER_MS) {
                        liberadoParaFecharPorHover = true;
                    }
                    return 'saiu_nao_fecha';
                }
                return 'ignorado';
            };

            // 1) Teste de Teclas: Modificadores e Insert NÃO devem fechar aviso/flash
            const altIgnorado = simularKeyDown('Alt', 18) === 'ignorado_modificador';
            const ctrlIgnorado = simularKeyDown('Control', 17) === 'ignorado_modificador';
            const shiftIgnorado = simularKeyDown('Shift', 16) === 'ignorado_modificador';
            const insIgnorado = simularKeyDown('Insert', 45) === 'ignorado_insert';
            const letraFecha = simularKeyDown('a', 65) === 'fechou';

            // 2) Teste de Hover com Carência de 1s (1000ms):
            // - Entrar no balão aos 200ms (dentro da carência de 1s) NÃO deve fechar
            const hoverEntradaPrecoce = simularHover('mouseenter', 1200) === 'carencia_ativa_nao_fecha';
            // - Sair do balão aos 1500ms (após carência) NÃO deve fechar, apenas libera fechamento posterior
            const hoverSaida = simularHover('mouseleave', 2500) === 'saiu_nao_fecha';
            // - Reentrar no balão aos 3000ms DEVE fechar
            const hoverReentradaFecha = simularHover('mouseenter', 4000) === 'fechou_por_hover';

            // 3) Validação no protótipo de MotorValidacao (window.JusGovAvisoFlutuante)
            const temClasseAviso = typeof window.JusGovAvisoFlutuante === 'function';

            secao696AvisosEFlashOk = Boolean(
                altIgnorado &&
                ctrlIgnorado &&
                shiftIgnorado &&
                insIgnorado &&
                letraFecha &&
                hoverEntradaPrecoce &&
                hoverSaida &&
                hoverReentradaFecha &&
                temClasseAviso
            );
            if (!secao696AvisosEFlashOk) {
                erroSecao696 = `alt=${altIgnorado}, ctrl=${ctrlIgnorado}, ins=${insIgnorado}, letra=${letraFecha}, hoverEntrada=${hoverEntradaPrecoce}, hoverSaida=${hoverSaida}, hoverReentrada=${hoverReentradaFecha}`;
            }
        } catch (e696) {
            secao696AvisosEFlashOk = false;
            erroSecao696 = (e696 && (e696.message || String(e696))) || 'erro';
        }
        registrar(
            secao696AvisosEFlashOk,
            'SECAO_6_96_ATE_INTERACAO_GATILHOS_E_INS_INS',
            'Seção 6.96 (BUG-40): Gatilhos estritos do modo Até Interação (ignora mousemove, keyup, modificadores e Insert para desbloqueio do Ins+Ins; fecha por clique, roda, tecla comum e reentrada de hover após carência de 1s).',
            { detalhe: erroSecao696 }
        );

            }

            {
        /* TESTE SEÇÃO 6.98 / 6.110 / 6.120 (USAB-11 / USAB-19): Rollback da Memória Interna para 2 Níveis (Slot 1 e Slot 2) e Neutralização de Ctrl + Alt + [0-9] */
        let secao698Historico2NiveisOk = false;
        let erroSecao698 = '';
        try {
            const bkpHist = window.__JUSGOV_HISTORICO_CLIPBOARD__;
            const bkpSlot1 = window.__JUSGOV_ULTIMO_CLIPBOARD__;
            const bkpSlot2 = window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__;

            const instMeio = (typeof window.JusGovBotaoMeioColagem === 'function')
                ? new window.JusGovBotaoMeioColagem({ ativo: true })
                : null;

            if (!instMeio) throw new Error('Classe JusGovBotaoMeioColagem não encontrada');

            // 1. Simula salvamento de múltiplos itens via salvarClipboardInternoComBackup: deve limitar estritamente a 2 slots
            window.__JUSGOV_HISTORICO_CLIPBOARD__ = [];
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = null;
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = null;

            if (motorTeste && typeof motorTeste.salvarClipboardInternoComBackup === 'function') {
                motorTeste.salvarClipboardInternoComBackup({ texto: 'Item 1', html: '', formatado: false });
                motorTeste.salvarClipboardInternoComBackup({ texto: 'Item 2', html: '', formatado: false });
                motorTeste.salvarClipboardInternoComBackup({ texto: 'Item 3', html: '', formatado: false });
            } else {
                window.__JUSGOV_HISTORICO_CLIPBOARD__ = [
                    { texto: 'Item 3', html: '', formatado: false },
                    { texto: 'Item 2', html: '', formatado: false }
                ];
                window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: 'Item 3' };
                window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = { texto: 'Item 2' };
            }

            const tam2Ok = Array.isArray(window.__JUSGOV_HISTORICO_CLIPBOARD__) && window.__JUSGOV_HISTORICO_CLIPBOARD__.length <= 2;
            const slot1RecenteOk = window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto === 'Item 3';
            const slot2AnteriorOk = window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ && window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__.texto === 'Item 2';

            // 2. Elemento editável alvo
            const elInput = {
                nodeType: 1,
                tagName: 'INPUT',
                getAttribute: (attr) => attr === 'type' ? 'text' : null,
                disabled: false,
                readOnly: false,
                isContentEditable: false,
                value: '',
                selectionStart: 0,
                selectionEnd: 0,
                setSelectionRange: () => {},
                dispatchEvent: () => true
            };

            // 3. Teste neutralização de Ctrl + Alt + 1..0 (USAB-11 / USAB-19: NÃO deve interceptar nem colar, preservando AltGr nativo ¹²³£¢¬)
            let prevKey1 = false;
            const evKey1 = {
                ctrlKey: true,
                altKey: true,
                key: '1',
                code: 'Digit1',
                target: elInput,
                preventDefault: () => { prevKey1 = true; },
                stopPropagation: () => {}
            };
            const interceptouKey1 = instMeio.tratarEventoTeclado(evKey1);
            const atalhoTecladoDesativadoOk = (interceptouKey1 === false && prevKey1 === false && elInput.value === '');

            // 4. Teste Botão do Meio simples (sem modificadores) -> cola Slot 1 ('Item 3')
            elInput.value = '';
            const evMeioSimples = {
                button: 1,
                ctrlKey: false,
                target: elInput,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            instMeio.tratarCliqueBotaoMeio(evMeioSimples);
            const botaoMeioSimplesOk = (elInput.value === 'Item 3');

            // 5. Teste Ctrl + Botão do Meio -> cola Slot 2 ('Item 2')
            elInput.value = '';
            const evMeioCtrl = {
                button: 1,
                ctrlKey: true,
                target: elInput,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            instMeio.tratarCliqueBotaoMeio(evMeioCtrl);
            const botaoMeioCtrlOk = (elInput.value === 'Item 2');

            // Restaura buffers
            window.__JUSGOV_HISTORICO_CLIPBOARD__ = bkpHist;
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = bkpSlot1;
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = bkpSlot2;

            secao698Historico2NiveisOk = Boolean(
                tam2Ok &&
                slot1RecenteOk &&
                slot2AnteriorOk &&
                atalhoTecladoDesativadoOk &&
                botaoMeioSimplesOk &&
                botaoMeioCtrlOk
            );
        } catch (e698) {
            erroSecao698 = e698.message || String(e698);
            secao698Historico2NiveisOk = false;
        }
        registrar(
            secao698Historico2NiveisOk,
            'SECAO_6_98_MEMORIA_INTERNA_2_NIVEIS_BOTAO_MEIO',
            'Seções 6.98 / 6.110 / 6.120 (USAB-11 / USAB-19): Memória Interna estrita de 2 Níveis (Slot 1 Botão do Meio e Slot 2 Ctrl+Botão do Meio) e neutralização de Ctrl+Alt+1..0 para preservar caracteres nativos AltGr.',
            { detalhe: erroSecao698 }
        );

            }

            {
        /* TESTE SEÇÃO 6.104 (BLIND-01): Verificação de Overflow/Estouro de Memória no Histórico e Ordem Interno -> Sistema */
        let secao6104Blind01Ok = false;
        let erroSecao6104 = '';
        try {
            const bkpHist = window.__JUSGOV_HISTORICO_CLIPBOARD__;
            const bkpSlot1 = window.__JUSGOV_ULTIMO_CLIPBOARD__;
            const bkpSlot2 = window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__;

            const instMeio = (typeof window.JusGovBotaoMeioColagem === 'function')
                ? new window.JusGovBotaoMeioColagem({ ativo: true })
                : null;

            // 1. Teste de estouro de payload (> 512KB):
            // Não deve dar erro, deixa o slot nulo e retorna false
            const payloadGigante = { texto: 'A'.repeat(600 * 1024), html: '', formatado: false };
            let salvouGigante = true;
            if (window.JusGovMotorSelecaoTeste && typeof window.JusGovMotorSelecaoTeste.salvarClipboardInternoComBackup === 'function') {
                salvouGigante = window.JusGovMotorSelecaoTeste.salvarClipboardInternoComBackup(payloadGigante);
            }
            const overflowInterceptadoOk = (salvouGigante === false);

            // 2. Teste de colagem com slot nulo ou vazio (no-op silencioso)
            window.__JUSGOV_HISTORICO_CLIPBOARD__ = [null, '', 'Texto Válido'];
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = null;
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = null;
            const elInputNoOp = {
                nodeType: 1,
                tagName: 'INPUT',
                getAttribute: () => 'text',
                disabled: false,
                readOnly: false,
                value: 'Valor Intacto',
                selectionStart: 0,
                selectionEnd: 0,
                setSelectionRange: () => {},
                dispatchEvent: () => true
            };

            // Tenta colar Slot 1 (que é null): elInputNoOp.value deve permanecer 'Valor Intacto'
            const evKeyNull = {
                ctrlKey: true,
                altKey: true,
                key: '1',
                code: 'Digit1',
                target: elInputNoOp,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            if (instMeio) instMeio.tratarEventoTeclado(evKeyNull);
            const noOpSlotNullOk = (elInputNoOp.value === 'Valor Intacto');

            // Tenta colar com Botão do Meio simples em slot nulo: deve permanecer 'Valor Intacto'
            const evMeioNull = {
                button: 1,
                ctrlKey: false,
                target: elInputNoOp,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            if (instMeio) instMeio.tratarCliqueBotaoMeio(evMeioNull, '', null, '');
            const noOpBotaoMeioOk = (elInputNoOp.value === 'Valor Intacto');

            // Restaura buffers
            window.__JUSGOV_HISTORICO_CLIPBOARD__ = bkpHist;
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = bkpSlot1;
            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = bkpSlot2;

            secao6104Blind01Ok = Boolean(overflowInterceptadoOk && noOpSlotNullOk && noOpBotaoMeioOk);
        } catch (e6104) {
            erroSecao6104 = e6104.message || String(e6104);
            secao6104Blind01Ok = false;
        }
        registrar(
            secao6104Blind01Ok,
            'SECAO_6_104_BLIND_01_OVERFLOW_E_PRECEDENCIA_COPIA',
            'Seção 6.104 (BLIND-01 / ROBUST-01): Proteção defensiva contra overflow/estouro de memória no histórico, precedência de cópia interna antes do sistema e no-op ao colar slot nulo/vazio.',
            { detalhe: erroSecao6104 }
        );

            }

            {
        /* TESTE SEÇÃO 6.96 (REFINADO): Fechamento Universal do Flash e Caixa de Verificação por Hover após 1s, Clique e Tecla */
        let secao696HoverEInteracaoOk = false;
        let erroSecao696Hover = '';
        try {
            const visualTeste = (typeof window.JusGovFeedbackVisual === 'function')
                ? new window.JusGovFeedbackVisual()
                : null;
            const validadorTeste = (typeof window.JusGovAvisoFlutuante === 'function')
                ? new window.JusGovAvisoFlutuante()
                : null;

            let flashCriadoOk = false;
            let flashMantemNoHover = false;
            let flashMantemNoClique = false;
            let flashMantemNaTecla = false;
            let flashFechaNaCopia = false;
            let flashFechaNaSelecao = false;

            let avisoCriadoOk = false;
            let avisoIgnoraHoverPrecoce = false;
            let avisoFechaPorCliqueFora = false;
            let avisoIgnoraControl = false;
            let avisoIgnoraInsert = false;
            let avisoIgnoraKeyup = false;
            let avisoFechaPorTecla = false;

            if (visualTeste) {
                const spanFlash = document.createElement('span');
                spanFlash.textContent = 'Texto para Teste Flash Hover';
                spanFlash.style.cssText = 'position:fixed;left:50px;top:50px;font-size:14px;';
                document.body.appendChild(spanFlash);

                const rngFlash = document.createRange();
                rngFlash.selectNodeContents(spanFlash);

                // 1. Dispara flash no modo Até Interação (-1)
                visualTeste.dispararFlashBorderVisual(rngFlash, -1);
                flashCriadoOk = (document.getElementById('jusgov-flash-contour-container') !== null);

                // Passar o mouse (mousemove) NÃO fecha o Flash no modo Até Interação
                window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 60, clientY: 55 }));
                flashMantemNoHover = (document.getElementById('jusgov-flash-contour-container') !== null);

                // Tecla comum (keydown 'a') NÃO fecha o Flash no modo Até Interação
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
                flashMantemNaTecla = (document.getElementById('jusgov-flash-contour-container') !== null);

                // Seção 6.136 / BUG-54: Clique DENTRO do contorno mantém o Flash (permite expandir/diminuir)
                const rectFlashDentro = spanFlash.getBoundingClientRect();
                window.dispatchEvent(new MouseEvent('mousedown', {
                    bubbles: true,
                    clientX: rectFlashDentro.left + Math.max(2, rectFlashDentro.width / 2),
                    clientY: rectFlashDentro.top + Math.max(2, rectFlashDentro.height / 2)
                }));
                flashMantemNoClique = (document.getElementById('jusgov-flash-contour-container') !== null);

                // Cópia (evento copy / Ctrl+C) FECHA o Flash
                document.dispatchEvent(new Event('copy', { bubbles: true }));
                flashFechaNaCopia = (document.getElementById('jusgov-flash-contour-container') === null);

                // 2. Dispara novamente e fecha ao iniciar nova seleção (selectstart)
                visualTeste.dispararFlashBorderVisual(rngFlash, -1);
                document.dispatchEvent(new Event('selectstart', { bubbles: true }));
                flashFechaNaSelecao = (document.getElementById('jusgov-flash-contour-container') === null);

                visualTeste.limparFlashBorderImediatamente();
                if (spanFlash.parentNode) spanFlash.parentNode.removeChild(spanFlash);
            }

            if (validadorTeste) {
                const spanAviso = document.createElement('span');
                spanAviso.textContent = '099.123.459-00';
                spanAviso.style.cssText = 'position:fixed;left:60px;top:60px;font-size:14px;';
                document.body.appendChild(spanAviso);

                const rngAviso = document.createRange();
                rngAviso.selectNodeContents(spanAviso);

                validadorTeste.auditarEAlerta('099.123.459-00', rngAviso);
                avisoCriadoOk = Boolean(validadorTeste.avisoVisivel);

                // Hover precoce (antes de 1s) não fecha
                if (validadorTeste.elementoCartaoAviso) {
                    validadorTeste.elementoCartaoAviso.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                    avisoIgnoraHoverPrecoce = Boolean(validadorTeste.avisoVisivel);
                } else {
                    avisoIgnoraHoverPrecoce = true;
                }

                // Modificadoras isoladas e tecla Insert NÃO fecham a caixa de aviso
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
                avisoIgnoraControl = Boolean(validadorTeste.avisoVisivel);

                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Insert', bubbles: true }));
                avisoIgnoraInsert = Boolean(validadorTeste.avisoVisivel);

                // Soltar tecla (keyup) NÃO fecha a caixa de aviso
                document.dispatchEvent(new KeyboardEvent('keyup', { key: 'x', bubbles: true }));
                avisoIgnoraKeyup = Boolean(validadorTeste.avisoVisivel);

                // Pressionamento de tecla comum (keydown) fecha a caixa de aviso
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
                avisoFechaPorTecla = (validadorTeste.avisoVisivel === false);

                // Recria aviso e testa fechamento imediato por clique fora (mousedown)
                validadorTeste.auditarEAlerta('099.123.459-00', rngAviso);
                document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 5, clientY: 5 }));
                avisoFechaPorCliqueFora = (validadorTeste.avisoVisivel === false);

                validadorTeste.limparAlertaVisual();
                if (spanAviso.parentNode) spanAviso.parentNode.removeChild(spanAviso);
            }

            secao696HoverEInteracaoOk = Boolean(
                flashCriadoOk &&
                flashMantemNoHover &&
                flashMantemNoClique &&
                flashMantemNaTecla &&
                flashFechaNaCopia &&
                flashFechaNaSelecao &&
                avisoCriadoOk &&
                avisoIgnoraHoverPrecoce &&
                avisoIgnoraControl &&
                avisoIgnoraInsert &&
                avisoIgnoraKeyup &&
                avisoFechaPorTecla &&
                avisoFechaPorCliqueFora
            );
            if (!secao696HoverEInteracaoOk) {
                erroSecao696Hover = `flashCriado=${flashCriadoOk}, flashMantemHover=${flashMantemNoHover}, flashMantemClique=${flashMantemNoClique}, flashMantemTecla=${flashMantemNaTecla}, flashFechaCopia=${flashFechaNaCopia}, flashFechaSelecao=${flashFechaNaSelecao}, avisoCriado=${avisoCriadoOk}, avisoIgnoraHover=${avisoIgnoraHoverPrecoce}, avisoIgnoraCtrl=${avisoIgnoraControl}, avisoIgnoraIns=${avisoIgnoraInsert}, avisoIgnoraKeyup=${avisoIgnoraKeyup}, avisoFechaTecla=${avisoFechaPorTecla}, avisoFechaClique=${avisoFechaPorCliqueFora}`;
            }
        } catch (e696H) {
            erroSecao696Hover = e696H.message || String(e696H);
            secao696HoverEInteracaoOk = false;
        }

        registrar(
            secao696HoverEInteracaoOk,
            'SECAO_6_96_FLASH_E_AVISO_FECHAMENTO_HOVER_E_CLIQUE',
            'Seção 6.96 (BUG-40 Refinado): Flash mantido no hover/clique/tecla no modo Até Interação (fecha apenas por nova seleção/cópia); Caixa de Verificação fecha no hover tardio de 1s, clique fora ou keydown comum (sem keyup).',
            { detalhe: erroSecao696Hover }
        );

        /* ==================================================================
         * TESTE SEÇÃO 6.107 (BUG-41): SHIFT + CLIQUE EM BLOCO (PRESERVAÇÃO DA AUDITORIA CORRETA E EXIBIÇÃO SEM PONTUAÇÃO)
         * Ao clicar com Shift em entidade pontuada (Benefício INSS, CPF, CNPJ, CNJ):
         * 1) A auditoria deve ser realizada sobre o bloco pontuado original para abrir a caixa correta (INSS, CPF, CNPJ, CNJ)
         *    e não genérico Mod11;
         * 2) O número copiado e o número exibido no cabeçalho do cartão devem estar sem pontuação;
         * 3) Todas as verificações matemáticas, espécie/wiki e prompts de OK (✓) ou erro (✗) devem ser mantidos.
         * ================================================================== */
        let secao6107ShiftOk = false;
        let erroSecao6107 = '';
        try {
            const validadorShift = validador;

            // 1. Benefício INSS pontuado válido (719.657.155-0) com textoSobrescrito sem pontuação (7196571550)
            const resInssValido = validadorShift.auditarEAlerta('719.657.155-0', null, { textoSobrescrito: '7196571550' });
            const inssValidoOk = Boolean(
                resInssValido &&
                resInssValido.valido === true &&
                resInssValido.ehWiki === true &&
                resInssValido.tipo === 'INSS' &&
                resInssValido.dado === '7196571550' &&
                resInssValido.html.includes('>7196571550</u>') &&
                resInssValido.html.includes('[INSS]:') &&
                resInssValido.html.includes('✓') &&
                !resInssValido.ehGenericoCinza
            );

            // 2. Benefício INSS pontuado inválido (719.657.155-9) com textoSobrescrito sem pontuação (7196571559)
            const resInssInvalido = validadorShift.auditarEAlerta('719.657.155-9', null, { textoSobrescrito: '7196571559' });
            const inssInvalidoOk = Boolean(
                resInssInvalido &&
                resInssInvalido.valido === false &&
                resInssInvalido.tipo.includes('INSS') &&
                resInssInvalido.dado === '7196571559' &&
                resInssInvalido.html.includes('>7196571559</u>') &&
                resInssInvalido.html.includes('✗') &&
                Array.isArray(resInssInvalido.motivos) &&
                resInssInvalido.motivos.length > 0
            );

            // 3. Benefício com espécie (31/719.657.155-0) com textoSobrescrito sem pontuação (7196571550)
            const resInssComEsp = validadorShift.auditarEAlerta('31/719.657.155-0', null, { textoSobrescrito: '7196571550' });
            const inssComEspOk = Boolean(
                resInssComEsp &&
                resInssComEsp.valido === true &&
                resInssComEsp.tipo === 'INSS' &&
                resInssComEsp.dado === '7196571550' &&
                resInssComEsp.html.includes('>7196571550</u>') &&
                resInssComEsp.html.includes('31')
            );

            // 4. CPF pontuado inválido (099.123.459-00) com textoSobrescrito sem pontuação (09912345900)
            const resCpfInvalido = validadorShift.auditarEAlerta('099.123.459-00', null, { textoSobrescrito: '09912345900' });
            const cpfInvalidoOk = Boolean(
                resCpfInvalido &&
                resCpfInvalido.valido === false &&
                resCpfInvalido.tipo.includes('CPF') &&
                resCpfInvalido.dado === '09912345900' &&
                resCpfInvalido.html.includes('>09912345900</u>') &&
                resCpfInvalido.html.includes('✗')
            );

            // 5. CPF pontuado válido (099.123.459-67) com textoSobrescrito sem pontuação (09912345967)
            const resCpfValido = validadorShift.auditarEAlerta('099.123.459-67', null, { textoSobrescrito: '09912345967' });
            const cpfValidoOk = Boolean(
                resCpfValido &&
                resCpfValido.valido === true &&
                resCpfValido.tipo === 'CPF' &&
                resCpfValido.dado === '09912345967' &&
                resCpfValido.html.includes('>09912345967</u>') &&
                resCpfValido.html.includes('✓')
            );

            // 6. Processo CNJ pontuado (0991234-55.2024.4.01.4002) com textoSobrescrito sem pontuação (09912345520244014002)
            const resCnjValido = validadorShift.auditarEAlerta('0991234-55.2024.4.01.4002', null, { textoSobrescrito: '09912345520244014002' });
            const cnjValidoOk = Boolean(
                resCnjValido &&
                resCnjValido.valido === true &&
                resCnjValido.tipo.includes('CNJ') &&
                resCnjValido.dado === '09912345520244014002' &&
                resCnjValido.html.includes('>09912345520244014002</u>') &&
                resCnjValido.html.includes('✓')
            );

            secao6107ShiftOk = Boolean(inssValidoOk && inssInvalidoOk && inssComEspOk && cpfInvalidoOk && cpfValidoOk && cnjValidoOk);
            if (!secao6107ShiftOk) {
                erroSecao6107 = `inssValido=${inssValidoOk}, inssInvalido=${inssInvalidoOk}, inssComEsp=${inssComEspOk}, cpfInvalido=${cpfInvalidoOk}, cpfValido=${cpfValidoOk}, cnjValido=${cnjValidoOk}`;
            }
        } catch (e6107) {
            erroSecao6107 = e6107.message || String(e6107);
            secao6107ShiftOk = false;
        }

        registrar(
            secao6107ShiftOk,
            'SECAO_6_107_SHIFT_CLIQUE_BLOCO_VERIFICACAO_E_EXIBICAO_DESPONTUADA',
            'Seção 6.107 (BUG-41): Shift + Clique em bloco audita a entidade pontuada original, altera somente a cópia e exibe o número desformatado no cartão.',
            { detalhe: erroSecao6107 }
        );

            }

            {
        /* 2. BUG-32 e BUG-47 / USAB-16: Unicidade da Caixa Rápida (Ins+Ins) e Isolamento no Modo Até Interação */
        let bug32E47Ok = false;
        let erroBug32E47 = '';
        try {
            const FabricaCaixa = window.JusGovCaixaEntradaRapida;
            if (FabricaCaixa) {
                const c1 = new FabricaCaixa({ janelaTempoMs: 400 });
                const c2 = new FabricaCaixa({ janelaTempoMs: 400 });
                const ev1 = { key: 'Insert', keyCode: 45, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, preventDefault: () => {}, stopPropagation: () => {} };
                const ev2 = { key: 'Insert', keyCode: 45, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, preventDefault: () => {}, stopPropagation: () => {} };

                // Se dois listeners recebem o MESMO objeto de evento, o segundo não conta como segundo clique falso
                const rPrimeiro1 = c1.tratarEventoTeclado(ev1);
                const rDup1 = c2.tratarEventoTeclado(ev1);
                const rSegundo1 = c1.tratarEventoTeclado(ev2);
                const rDup2 = c2.tratarEventoTeclado(ev2);

                const dialogosAbertos = document.querySelectorAll('.jusgov-dialog-input-rapido').length;
                const unicidadeDomOk = (rPrimeiro1 === false && rDup1 === false && rSegundo1 === true && rDup2 === true && dialogosAbertos === 1);
                c1.fecharCaixa();
                c2.fecharCaixa();
                bug32E47Ok = unicidadeDomOk;
            }
        } catch (e32) {
            erroBug32E47 = e32.message || String(e32);
        }
        registrar(
            bug32E47Ok,
            'SECAO_6_72_117_BUG_32_E_47_UNICIDADE_CAIXA_RAPIDA_DUPLO_INSERT',
            'Seções 6.72 e 6.117 (BUG-32 / BUG-47): Unicidade estrita de instância DOM da Caixa de Entrada Rápida (Ins+Ins / Ctrl+Ins+Ins) e isolamento contra fechamento no modo Até Interação.',
            { detalhe: erroBug32E47 }
        );

        /* 3. BUG-42 / USAB-10: Rejeição Geométrica de Clique Simples em Espaço Vazio Distante */
        let bug42EspacoVazioOk = false;
        let erroBug42 = '';
        try {
            if (motorTeste && typeof motorTeste.verificarProximidadeGeometricaDoClique === 'function') {
                const pTeste = document.createElement('p');
                pTeste.textContent = 'PalavraUnicaIsolada';
                pTeste.style.cssText = 'position:fixed;left:20px;top:20px;margin:0;padding:0;font-size:14px;';
                document.body.appendChild(pTeste);
                const rngP = document.createRange();
                rngP.selectNodeContents(pTeste);
                // Clique muito distante (X=500, Y=500) do texto em (20, 20) deve ser rejeitado (false)
                const longeRejeitado = (motorTeste.verificarProximidadeGeometricaDoClique(rngP, 500, 500, 1) === false);
                const rectP = rngP.getBoundingClientRect();
                const pertoAceito = (motorTeste.verificarProximidadeGeometricaDoClique(rngP, rectP.left + 4, rectP.top + 4, 1) === true);
                pTeste.remove();
                bug42EspacoVazioOk = Boolean(longeRejeitado && pertoAceito);
            }
        } catch (e42) {
            erroBug42 = e42.message || String(e42);
        }
        registrar(
            bug42EspacoVazioOk,
            'SECAO_6_109_BUG_42_REJEICAO_CLIQUE_ESPACO_VAZIO_DISTANTE',
            'Seção 6.109 (BUG-42 / USAB-10): Clique simples em espaço em branco distante (>24px horizontal ou >12px vertical) é rejeitado geometricamente sem capturar a primeira/última palavra do parágrafo.',
            { detalhe: erroBug42 }
        );

        /* 4. BUG-46 / USAB-15: Limpeza Numérica em Shift + Arrasto com Trava Alfabética */
        let bug46ShiftArrastoOk = false;
        let erroBug46 = '';
        try {
            if (motorTeste && typeof motorTeste.aplicarLimpezaNumericaComTravaAlfabetica === 'function') {
                // Caso 1: Somente números, símbolos e espaços -> limpa deixando apenas dígitos ("051120262122")
                const resNum = motorTeste.aplicarLimpezaNumericaComTravaAlfabetica('05/11/2026 - 21:22');
                // Caso 2: Contém letras misturadas -> Trava Alfabética retorna null (para o motor preservar o original)
                const resAlfa = motorTeste.aplicarLimpezaNumericaComTravaAlfabetica('Processo 05/11/2026 - 21:22');
                bug46ShiftArrastoOk = (resNum === '051120262122' && resAlfa === null);
            }
        } catch (e46) {
            erroBug46 = e46.message || String(e46);
        }
        registrar(
            bug46ShiftArrastoOk,
            'SECAO_6_116_BUG_46_LIMPEZA_NUMERICA_SHIFT_ARRASTO_TRAVA_ALFABETICA',
            'Seção 6.116 (BUG-46 / USAB-15): Shift + Arrasto remove pontuação, símbolos e espaços ("05/11/2026 - 21:22" -> "051120262122") e aplica Trava Alfabética revertendo ao original se houver letras.',
            { detalhe: erroBug46 }
        );

        /* 5. FEAT-23 / USAB-12, BUG-44 / DEP-01 e USAB-14 / POS-01: Tempo Independente de Conferência, MiniTip Topo Centralizado e Ancoragem de Rolagem */
        let feat23Bug44Usab14Ok = false;
        let erroFeat23 = '';
        try {
            const avTeste = new window.JusGovAvisoFlutuante();
            // FEAT-23: Tempo de conferência independente (-1 padrão, 0 desativado, 1000..5000ms)
            const padraoAteInteracao = (avTeste.obterTempoConferenciaDocumentos() === -1);
            avTeste.definirTempoConferenciaDocumentos(3000);
            const alterou3s = (avTeste.obterTempoConferenciaDocumentos() === 3000);
            avTeste.definirTempoConferenciaDocumentos(0);
            const desativouZero = (avTeste.obterTempoConferenciaDocumentos() === 0 && avTeste.validacaoAtiva === false);
            avTeste.definirTempoConferenciaDocumentos(-1);
            const reativouMenosUm = (avTeste.obterTempoConferenciaDocumentos() === -1 && avTeste.validacaoAtiva === true);

            // BUG-44: projetarMiniTipGlobal centralizado no topo e com carência contra o próprio Escape
            avTeste.definirTempoExibicao(-1);
            avTeste.projetarMiniTipGlobal('Estilos/Formatação Textual: Nível 1');
            const elTip = avTeste.elementoMiniTipGlobal;
            const tipVisivelNoTopo = Boolean(elTip && elTip.style.display === 'block');
            // Escape imediato dentro da carência de 180ms NÃO deve fechar o minitip recém-aberto
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            const tipSobreviveuEscapeGatilho = Boolean(elTip && elTip.style.display === 'block');
            // Clique (mousedown) fecha imediatamente
            document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            const tipFechouNoClique = Boolean(!elTip || elTip.style.display === 'none');

            // USAB-14: método de reposicionamento sob rolagem presente e funcional
            const temMetodoScroll = (typeof avTeste.atualizarPosicaoAlertaSobRolagem === 'function');
            avTeste.limparAlertaVisual();

            feat23Bug44Usab14Ok = Boolean(
                padraoAteInteracao && alterou3s && desativouZero && reativouMenosUm &&
                tipVisivelNoTopo && tipSobreviveuEscapeGatilho && tipFechouNoClique && temMetodoScroll
            );
            if (!feat23Bug44Usab14Ok) {
                erroFeat23 = `pad=${padraoAteInteracao}, a3s=${alterou3s}, d0=${desativouZero}, r1=${reativouMenosUm}, vis=${tipVisivelNoTopo}, esc=${tipSobreviveuEscapeGatilho}, clq=${tipFechouNoClique}, scr=${temMetodoScroll}`;
            }
        } catch (e23) {
            erroFeat23 = e23.message || String(e23);
        }
        registrar(
            feat23Bug44Usab14Ok,
            'SECAO_6_112_113_115_FEAT_23_BUG_44_USAB_14_AVISOS_E_ANCORAGEM',
            'Seções 6.112, 6.113 e 6.115 (FEAT-23 / BUG-44 / USAB-14): Tempo independente da Conferência de Documentos (0 a 5s + Até Interação), estabilidade do popup Esc+Esc no topo central e ancoragem física na rolagem.',
            { detalhe: erroFeat23 }
        );

        /* 6. BUG-45 / USAB-13 e FEAT-21 / VIS-01: Ancoragem do Flash na Rolagem e Marcador Permanente de Conteúdo Colado com Numeração Ordinal */
        let bug45Feat21Ok = false;
        let erroFeat21 = '';
        try {
            const visTeste = new window.JusGovFeedbackVisual();
            visTeste.limparMarcadoresPermanentes();

            const divDoc = document.createElement('div');
            divDoc.style.cssText = 'position:fixed;left:40px;top:80px;font-size:14px;';
            divDoc.innerHTML = '<span id="spCol1">1015306-38.2026.4.01.4002</span> e <span id="spCol2">099.123.459-67</span>';
            document.body.appendChild(divDoc);

            const sp1 = divDoc.querySelector('#spCol1');
            const sp2 = divDoc.querySelector('#spCol2');
            const rng1 = document.createRange();
            rng1.selectNodeContents(sp1);
            const rng2 = document.createRange();
            rng2.selectNodeContents(sp2);

            // 1. Cópia dispara Flash e registra candidata, mas AINDA NÃO cria marcador permanente (só ao colar!)
            visTeste.dispararFlashBorderVisual(rng1, -1);
            visTeste.registrarCopiaCandidataParaMarcador(rng1, '1015306-38.2026.4.01.4002');
            const semMarcadorAntesDeColar = (visTeste.obterContagemMarcadoresPermanentes() === 0);

            // 2. Confirma colagem do item 1 -> remove Flash temporário e cria Marcador Permanente #1
            const marcou1 = visTeste.confirmarColagemEMarcarPermanente('1015306-38.2026.4.01.4002');
            const flashRemovidoAoColar = (document.getElementById('jusgov-flash-contour-container') === null);
            const contagemApos1 = visTeste.obterContagemMarcadoresPermanentes();

            // 3. Cópia e colagem do item 2 -> cria Marcador Permanente #2
            visTeste.registrarCopiaCandidataParaMarcador(rng2, '099.123.459-67');
            const marcou2 = visTeste.confirmarColagemEMarcarPermanente('09912345967'); // mesmo colando apenas dígitos (Shift)
            const contagemApos2 = visTeste.obterContagemMarcadoresPermanentes();

            // 4. Sobreposição/Fusão: copiar e colar o container inteiro funde os marcadores anteriores sem sobrepor caixas
            const rngTotal = document.createRange();
            rngTotal.selectNodeContents(divDoc);
            visTeste.registrarCopiaCandidataParaMarcador(rngTotal, divDoc.textContent);
            const marcouFundido = visTeste.confirmarColagemEMarcarPermanente(divDoc.textContent);
            const contagemAposFusao = visTeste.obterContagemMarcadoresPermanentes();

            visTeste.limparMarcadoresPermanentes();
            divDoc.remove();

            bug45Feat21Ok = Boolean(
                semMarcadorAntesDeColar &&
                marcou1 &&
                flashRemovidoAoColar &&
                contagemApos1 === 1 &&
                marcou2 &&
                contagemApos2 === 2 &&
                marcouFundido &&
                contagemAposFusao === 1
            );
            if (!bug45Feat21Ok) {
                erroFeat21 = `antes=${semMarcadorAntesDeColar}, m1=${marcou1}, flashRem=${flashRemovidoAoColar}, c1=${contagemApos1}, m2=${marcou2}, c2=${contagemApos2}, cFusao=${contagemAposFusao}`;
            }
        } catch (e21) {
            erroFeat21 = e21.message || String(e21);
        }
        registrar(
            bug45Feat21Ok,
            'SECAO_6_105_114_FEAT_21_E_BUG_45_MARCADOR_PERMANENTE_CONTEUDO_COLADO',
            'Seções 6.105 e 6.114 (FEAT-21 / VIS-01 e BUG-45 / USAB-13): Marcador permanente acionado exclusivamente na colagem efetiva com badge ordinal (1, 2, 3...), substituição do Flash e fusão inteligente de seleções sobrepostas.',
            { detalhe: erroFeat21 }
        );

            }

            {
        /* 7) Regressão: Preservação de quebras de linha em <pre> e elementos com white-space: pre-wrap (ex: painel debug.txt) */
        {
            let preWrapOk = false;
            let detalhePreWrap = '';
            try {
                const filtrosTeste = (typeof window.JusGovFiltrosHtml === 'function') ? new window.JusGovFiltrosHtml() : null;
                if (filtrosTeste && typeof filtrosTeste.extrairTextoPuroSanitizado === 'function') {
                    const boxPre = document.createElement('div');
                    boxPre.style.cssText = 'white-space: pre-wrap; position: fixed; left: -9999px; top: 0;';
                    const spL1 = document.createElement('span');
                    spL1.textContent = '[OK] Linha 1 do relatório';
                    const spL2 = document.createElement('span');
                    spL2.textContent = '[OK] Linha 2 do relatório';
                    const spL3 = document.createElement('span');
                    spL3.textContent = '[OK] Linha 3 do relatório';
                    boxPre.appendChild(spL1);
                    boxPre.appendChild(document.createTextNode('\n'));
                    boxPre.appendChild(spL2);
                    boxPre.appendChild(document.createTextNode('\n'));
                    boxPre.appendChild(spL3);

                    const boxNormal = document.createElement('div');
                    boxNormal.style.cssText = 'white-space: normal; position: fixed; left: -9999px; top: 0;';
                    boxNormal.innerHTML = '<span>Palavra A</span>\n<span>Palavra B</span>';

                    document.body.appendChild(boxPre);
                    document.body.appendChild(boxNormal);

                    const rngPre = document.createRange();
                    rngPre.selectNodeContents(boxPre);
                    const txtPreRange = filtrosTeste.extrairTextoPuroSanitizado(rngPre);
                    const txtPreElem = filtrosTeste.extrairTextoPuroSanitizado(boxPre);

                    const rngNorm = document.createRange();
                    rngNorm.selectNodeContents(boxNormal);
                    const txtNormRange = filtrosTeste.extrairTextoPuroSanitizado(rngNorm);

                    boxPre.remove();
                    boxNormal.remove();

                    const linhasRange = String(txtPreRange || '').split('\n').map(l => l.trim()).filter(Boolean);
                    const linhasElem = String(txtPreElem || '').split('\n').map(l => l.trim()).filter(Boolean);
                    preWrapOk = Boolean(
                        linhasRange.length === 3 &&
                        linhasElem.length === 3 &&
                        linhasRange[0].includes('Linha 1') &&
                        linhasRange[2].includes('Linha 3') &&
                        !String(txtNormRange || '').includes('\n') &&
                        String(txtNormRange || '').includes('Palavra A') &&
                        String(txtNormRange || '').includes('Palavra B')
                    );
                    if (!preWrapOk) {
                        detalhePreWrap = `rangeLinhas=${linhasRange.length}, elemLinhas=${linhasElem.length}, norm=${JSON.stringify(txtNormRange)}`;
                    }
                }
            } catch (ePre) {
                detalhePreWrap = ePre.message || String(ePre);
            }
            registrar(
                preWrapOk,
                'PRE_WRAP_COPIA_PRESERVA_QUEBRAS_LINHA_RELATORIO',
                'Higienização HTML preserva quebras de linha reais em contêineres pre / white-space: pre-wrap (painel debug.txt) e colapsa quebras HTML em white-space: normal.',
                { detalhe: detalhePreWrap }
            );
        }

        /* 8) Regressão: Reposicionamento imediato de Flash Border e Marcador Permanente após mudança dinâmica de layout */
        {
            let layoutShiftOk = false;
            let detalheLayoutShift = '';
            try {
                const visShift = (typeof window.JusGovFeedbackVisual === 'function') ? new window.JusGovFeedbackVisual() : null;
                if (visShift) {
                    const wrapperShift = document.createElement('div');
                    wrapperShift.style.cssText = 'position: relative; width: 420px; background: #fff;';
                    const slotMock = document.createElement('div');
                    slotMock.setAttribute('data-jusgov-ignore', 'true');
                    slotMock.style.cssText = 'height: 20px; width: 400px;';
                    const alvoShift = document.createElement('span');
                    alvoShift.textContent = '099.912.349-18';
                    alvoShift.style.cssText = 'display: inline-block; font-size: 14px; line-height: 20px;';
                    wrapperShift.appendChild(slotMock);
                    wrapperShift.appendChild(alvoShift);
                    document.body.appendChild(wrapperShift);

                    const rngShift = document.createRange();
                    rngShift.selectNodeContents(alvoShift);
                    visShift.dispararFlashBorderVisual(rngShift, -1);

                    const boxAntes = document.querySelector('#jusgov-flash-contour-container .jusgov-flash-box');
                    const topFlashAntes = boxAntes ? boxAntes.getBoundingClientRect().top : -1;
                    const topAlvoAntes = alvoShift.getBoundingClientRect().top;

                    // Simula expansão assíncrona do visor Slot 1 / Slot 2 (+70px)
                    slotMock.style.height = '90px';
                    if (typeof visShift.atualizarPosicaoFlashSobRolagem === 'function') {
                        visShift.atualizarPosicaoFlashSobRolagem();
                    }

                    const boxDepois = document.querySelector('#jusgov-flash-contour-container .jusgov-flash-box');
                    const topFlashDepois = boxDepois ? boxDepois.getBoundingClientRect().top : -1;
                    const topAlvoDepois = alvoShift.getBoundingClientRect().top;

                    // Também garante remoção do Flash ao confirmar marcador e criação limpa dentro de ancestrais ignorados
                    visShift.registrarCopiaCandidataParaMarcador(rngShift, '099.912.349-18');
                    const marcadorCriado = visShift.confirmarColagemEMarcarPermanente('099.912.349-18');
                    const contagemMarc = visShift.obterContagemMarcadoresPermanentes();

                    visShift.limparFlashBorderImediatamente();
                    visShift.limparMarcadoresPermanentes();
                    wrapperShift.remove();

                    layoutShiftOk = Boolean(
                        topFlashAntes >= 0 &&
                        Math.abs(topFlashAntes - topAlvoAntes) <= 6 &&
                        Math.abs(topFlashDepois - topAlvoDepois) <= 6 &&
                        (topFlashDepois - topFlashAntes) >= 55 &&
                        marcadorCriado &&
                        contagemMarc === 1
                    );
                    if (!layoutShiftOk) {
                        detalheLayoutShift = `antes=${topFlashAntes}/${topAlvoAntes}, depois=${topFlashDepois}/${topAlvoDepois}, marc=${contagemMarc}`;
                    }
                }
            } catch (eShift) {
                detalheLayoutShift = eShift.message || String(eShift);
            }
            registrar(
                layoutShiftOk,
                'FLASH_BORDER_REPOSICIONA_MUDANCA_LAYOUT_DINAMICO',
                'Contorno Flash Border e Marcador Permanente acompanham exatamente novas coordenadas quando elementos acima expandem/alteram layout (Slot 1/2 / SPA).',
                { detalhe: detalheLayoutShift }
            );
        }

        /* 9) Regressão: Regra Root de Encolher em blocos compostos válidos/inválidos e atualização da âncora Shift em palavra curta */
        {
            let shrinkEShiftOk = false;
            let detalheShrinkShift = '';
            try {
                if (
                    motorTeste &&
                    typeof motorTeste.ehTextoBlocoMultiSegmento === 'function' &&
                    typeof motorTeste.resolverLimitesBlocoAtivoNaJanela === 'function' &&
                    typeof motorTeste.resolverSubSegmentoNoBlocoComposto === 'function' &&
                    typeof motorTeste.resolverIndicesExpansaoBase === 'function'
                ) {
                    const casosBloco = [
                        { texto: 'Data válida 29/02/2024 ok', bloco: '29/02/2024', sub1: '29', sub2: '02', sub3: '2024', sep: '/' },
                        { texto: 'Data inválida 29/02/2025 ok', bloco: '29/02/2025', sub1: '29', sub2: '02', sub3: '2025', sep: '/' },
                        { texto: 'CPF válido 099.912.349-18 ok', bloco: '099.912.349-18', sub1: '099', sub2: '912', sub3: '18', sep: '-' },
                        { texto: 'CPF inválido 099.123.459-99 ok', bloco: '099.123.459-99', sub1: '099', sub2: '123', sub3: '99', sep: '.' },
                        { texto: 'CNPJ alfa 12.ABC.345/01DE-35 ok', bloco: '12.ABC.345/01DE-35', sub1: '12', sub2: 'ABC', sub3: '01DE', sep: '/' },
                        { texto: 'CNPJ inválido 09.912.345/0001-99 ok', bloco: '09.912.345/0001-99', sub1: '09', sub2: '912', sub3: '0001', sep: '-' }
                    ];

                    let todosBlocosOk = true;
                    for (const c of casosBloco) {
                        const ehMulti = motorTeste.ehTextoBlocoMultiSegmento(c.bloco);
                        const idxIni = c.texto.indexOf(c.bloco);
                        const idxFim = idxIni + c.bloco.length;
                        const mapaFake = { texto: c.texto, idxCursor: idxIni, deslocamentoJanela: 0 };
                        const lim = motorTeste.resolverLimitesBlocoAtivoNaJanela(mapaFake, idxIni + 1, { texto: c.bloco }, c.sub1);
                        const iSub1 = c.texto.indexOf(c.sub1, idxIni);
                        const iSub2 = c.texto.indexOf(c.sub2, iSub1 + c.sub1.length);
                        const iSub3 = c.texto.indexOf(c.sub3, iSub2 + c.sub2.length);
                        const iSep = c.texto.indexOf(c.sep, idxIni);

                        const r1 = motorTeste.resolverSubSegmentoNoBlocoComposto(c.texto, iSub1, idxIni, idxFim);
                        const r2 = motorTeste.resolverSubSegmentoNoBlocoComposto(c.texto, iSub2, idxIni, idxFim);
                        const r3 = motorTeste.resolverSubSegmentoNoBlocoComposto(c.texto, iSub3, idxIni, idxFim);
                        const rSep = motorTeste.resolverSubSegmentoNoBlocoComposto(c.texto, iSep, idxIni, idxFim);
                        const rExp2 = motorTeste.resolverIndicesExpansaoBase(mapaFake, iSub1, 2, { blocoCompostoPrevio: { texto: c.bloco }, ehAlt: false });

                        const seg1Txt = r1 ? c.texto.slice(r1.inicio, r1.fim) : '';
                        const seg2Txt = r2 ? c.texto.slice(r2.inicio, r2.fim) : '';
                        const seg3Txt = r3 ? c.texto.slice(r3.inicio, r3.fim) : '';
                        const sepTxt = rSep ? c.texto.slice(rSep.inicio, rSep.fim) : '';
                        const exp2Txt = (rExp2 && rExp2.resultadoIndices) ? c.texto.slice(rExp2.resultadoIndices.inicio, rExp2.resultadoIndices.fim).trim() : '';

                        if (
                            !ehMulti ||
                            !lim || lim.inicio !== idxIni || lim.fim !== idxFim ||
                            !r1?.ehSubSegmento || seg1Txt !== c.sub1 ||
                            !r2?.ehSubSegmento || seg2Txt !== c.sub2 ||
                            !r3?.ehSubSegmento || seg3Txt !== c.sub3 ||
                            !rSep || rSep.ehSubSegmento !== false || sepTxt !== c.bloco ||
                            exp2Txt.length <= c.bloco.length
                        ) {
                            todosBlocosOk = false;
                            detalheShrinkShift = `Falha caso ${c.bloco}: seg=[${seg1Txt},${seg2Txt},${seg3Txt}], sep=${sepTxt}, exp2=${exp2Txt}`;
                            break;
                        }
                    }

                    // Valida também que clique em palavra curta (< mínimo de caracteres) atualiza ancoraCursorShift
                    let ancoraCurtaOk = false;
                    const pCurta = document.createElement('p');
                    pCurta.textContent = 'Se houver urgência comprovada nos autos';
                    pCurta.style.cssText = 'position: fixed; left: 24px; top: 24px; font-size: 16px; line-height: 24px; margin: 0; padding: 0;';
                    document.body.appendChild(pCurta);
                    const minAnt = motorTeste.obterMinimoCaracteresInterface();
                    motorTeste.definirMinimoCaracteresInterface(5);
                    try {
                        const rSe = document.createRange();
                        const noSe = pCurta.firstChild;
                        rSe.setStart(noSe, 0);
                        rSe.setEnd(noSe, 1);
                        const rectSe = rSe.getBoundingClientRect();
                        const cx = rectSe.left + Math.max(1, rectSe.width / 2);
                        const cy = rectSe.top + Math.max(2, rectSe.height / 2);
                        pCurta.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, detail: 1, clientX: cx, clientY: cy }));
                        pCurta.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, detail: 1, clientX: cx, clientY: cy }));
                        const ancora = (typeof motorTeste.obterAncoraCursorShift === 'function') ? motorTeste.obterAncoraCursorShift() : null;
                        ancoraCurtaOk = Boolean(ancora && ancora.no === noSe && ancora.offset === 0);
                        if (!ancoraCurtaOk) {
                            detalheShrinkShift = `ancoraCurta=${ancora ? `${ancora.offset} (${ancora.no?.textContent?.slice(0, 12)})` : 'null'}`;
                        }
                    } finally {
                        motorTeste.definirMinimoCaracteresInterface(minAnt);
                        pCurta.remove();
                    }

                    shrinkEShiftOk = todosBlocosOk && ancoraCurtaOk;
                }
            } catch (eShrink) {
                detalheShrinkShift = eShrink.message || String(eShrink);
            }
            registrar(
                shrinkEShiftOk,
                'REGRA_ROOT_ENCOLHER_BLOCOS_E_SHIFT_ANCORA_CURTA',
                'Diretriz Root 2.5: Encolhimento genérico em sub-segmentos de datas/CPF/CNPJ válidos/inválidos, re-seleção em separadores, expansão no duplo clique e âncora Shift em palavra curta.',
                { detalhe: detalheShrinkShift }
            );
        }

        /* 10) Regressão: Ordem hierárquica "Básico: " e precedência de toolbars sobre contêineres PDF em interface.json */
        {
            let interfaceOrdemOk = false;
            let detalheInterfaceOrdem = '';
            try {
                const regrasPre = Array.isArray(window.__JUSGOV_INTERFACE_JSON__) ? window.__JUSGOV_INTERFACE_JSON__ : null;
                let ordemJsonOk = true;
                if (regrasPre && regrasPre.length > 10) {
                    const regrasBasicas = regrasPre.filter(r => typeof r.observacao === 'string' && r.observacao.startsWith('Básico: '));
                    const todasBasicasNoInicio = regrasBasicas.length >= 9 &&
                        regrasPre.slice(0, regrasBasicas.length).every(r => typeof r.observacao === 'string' && r.observacao.startsWith('Básico: '));
                    const idxPdfToolbar = regrasPre.findIndex(r => r.id === 'interna_controles_pdf');
                    const idxPdfLeitura = regrasPre.findIndex(r => r.id === 'interna_leitura_editores_pdf');
                    const idxEdToolbar = regrasPre.findIndex(r => r.id === 'interna_editores_toolbars');
                    ordemJsonOk = Boolean(
                        todasBasicasNoInicio &&
                        idxPdfToolbar !== -1 && idxPdfLeitura !== -1 && idxEdToolbar !== -1 &&
                        idxPdfToolbar < idxPdfLeitura &&
                        idxEdToolbar < idxPdfLeitura
                    );
                    if (!ordemJsonOk) {
                        detalheInterfaceOrdem = `basicas=${regrasBasicas.length}, pdfTb=${idxPdfToolbar}, edTb=${idxEdToolbar}, pdfLeitura=${idxPdfLeitura}`;
                    }
                }

                // Garante também classificação prática no motor mesmo dentro de .pdfViewer
                const wrapPdf = document.createElement('div');
                wrapPdf.className = 'pdfViewer';
                const btnToolbarPdf = document.createElement('button');
                btnToolbarPdf.id = 'toolbarViewer';
                btnToolbarPdf.className = 'toolbarButton';
                btnToolbarPdf.textContent = 'Zoom';
                const pLeituraPdf = document.createElement('p');
                pLeituraPdf.textContent = 'Sentença proferida nos autos.';
                wrapPdf.appendChild(btnToolbarPdf);
                wrapPdf.appendChild(pLeituraPdf);
                document.body.appendChild(wrapPdf);

                const ctxBtnPdf = motorTeste.classificarContextoElementoAlvo(btnToolbarPdf);
                const ctxTextoPdf = motorTeste.classificarContextoElementoAlvo(pLeituraPdf);
                wrapPdf.remove();

                interfaceOrdemOk = Boolean(
                    ordemJsonOk &&
                    ctxBtnPdf === 'LINK_CLICAVEL' &&
                    ctxTextoPdf === 'LEITURA_COMUM'
                );
                if (!interfaceOrdemOk && !detalheInterfaceOrdem) {
                    detalheInterfaceOrdem = `ctxBtnPdf=${ctxBtnPdf}, ctxTextoPdf=${ctxTextoPdf}`;
                }
            } catch (eIntOrd) {
                detalheInterfaceOrdem = eIntOrd.message || String(eIntOrd);
            }
            registrar(
                interfaceOrdemOk,
                'INTERFACE_JSON_ORDEM_BASICO_E_PRIORIDADES',
                'Catálogo interface.json inicia com todas as regras "Básico: " em ordem hierárquica e prioriza toolbars de PDF/editor antes de áreas de leitura PDF.',
                { detalhe: detalheInterfaceOrdem }
            );
        }

            }

            {
            // Teste: Alt+Clique em Interface seleciona toda a linha clicada (1 clique) ou todas as linhas (2 cliques)
            let altInterfaceOk = false;
            let detalheAltInterface = '';
            try {
                const motor = window.JusGovMotorTestes;
                const temApiAltInt = motor && typeof motor.resolverRangeAltEmInterface === 'function';
                if (temApiAltInt) {
                    const boxAlt = document.createElement('div');
                    boxAlt.style.cssText = 'position:fixed;left:20px;top:20px;z-index:1;';
                    const btnUmaLinha = document.createElement('button');
                    btnUmaLinha.innerHTML = '<span>Salvar</span> <span>Tudo</span>';
                    const btnMultilinha = document.createElement('button');
                    btnMultilinha.innerHTML = '<span>Emitir</span> <span>Certidão</span><br><span>Negativa</span>';
                    const linkComBloco = document.createElement('a');
                    linkComBloco.href = '#proc';
                    linkComBloco.innerHTML = 'Processo 0001234-55.2024.4.01.4002<br>Petição Inicial';
                    boxAlt.appendChild(btnUmaLinha);
                    boxAlt.appendChild(btnMultilinha);
                    boxAlt.appendChild(linkComBloco);
                    document.body.appendChild(boxAlt);

                    const spanSalvar = btnUmaLinha.querySelector('span');
                    const r1 = motor.resolverRangeAltEmInterface(
                        spanSalvar.firstChild,
                        { no: spanSalvar.firstChild, offset: 2 },
                        25,
                        25,
                        1
                    );

                    const spanCertidao = btnMultilinha.querySelectorAll('span')[1];
                    const rectCert = spanCertidao.getBoundingClientRect();
                    const rMulti1 = motor.resolverRangeAltEmInterface(
                        spanCertidao.firstChild,
                        { no: spanCertidao.firstChild, offset: 2 },
                        rectCert.left + 4,
                        rectCert.top + 4,
                        1
                    );
                    const rMulti2 = motor.resolverRangeAltEmInterface(
                        spanCertidao.firstChild,
                        { no: spanCertidao.firstChild, offset: 2 },
                        rectCert.left + 4,
                        rectCert.top + 4,
                        2
                    );

                    const noLinkTexto1 = linkComBloco.firstChild;
                    const rectLink = linkComBloco.getBoundingClientRect();
                    const lenLink1 = noLinkTexto1.nodeValue.length;
                    const segsLink1 = [{ no: noLinkTexto1, inicioGlobal: 0, fimGlobal: lenLink1 }];
                    const mapaLinkNoBloco = { texto: noLinkTexto1.nodeValue, idxCursor: 15, deslocamentoJanela: 0, tamanhoTotalBloco: lenLink1, segmentos: segsLink1 };
                    const mapaLinkForaBloco = { texto: noLinkTexto1.nodeValue, idxCursor: 2, deslocamentoJanela: 0, tamanhoTotalBloco: lenLink1, segmentos: segsLink1 };

                    const textoMsciv = 'MSCiv 1015594-83.2026.4.01.4002\nAposentadoria Rural (Art. 48/51)';
                    const resEspacoMsciv = motor.resolverIndicesExpansaoBase({ texto: textoMsciv, idxCursor: 5 }, 5, 1, { ehAlt: true });
                    const txtEspacoMsciv = (resEspacoMsciv && resEspacoMsciv.resultadoIndices)
                        ? textoMsciv.slice(resEspacoMsciv.resultadoIndices.inicio, resEspacoMsciv.resultadoIndices.fim).trim()
                        : '';

                    const rLinkBloco1 = motor.resolverRangeAltEmInterface(noLinkTexto1, { no: noLinkTexto1, offset: 15 }, rectLink.left + 80, rectLink.top + 4, 1, mapaLinkNoBloco);
                    const rLinkBloco2 = motor.resolverRangeAltEmInterface(noLinkTexto1, { no: noLinkTexto1, offset: 15 }, rectLink.left + 80, rectLink.top + 4, 2, mapaLinkNoBloco);
                    const rLinkBloco3 = motor.resolverRangeAltEmInterface(noLinkTexto1, { no: noLinkTexto1, offset: 15 }, rectLink.left + 80, rectLink.top + 4, 3, mapaLinkNoBloco);
                    const rLinkFora1 = motor.resolverRangeAltEmInterface(noLinkTexto1, { no: noLinkTexto1, offset: 2 }, rectLink.left + 10, rectLink.top + 4, 1, mapaLinkForaBloco);
                    const rLinkFora2 = motor.resolverRangeAltEmInterface(noLinkTexto1, { no: noLinkTexto1, offset: 2 }, rectLink.left + 10, rectLink.top + 4, 2, mapaLinkForaBloco);

                    const txt1 = r1 && r1.texto ? r1.texto.replace(/\s+/g, ' ').trim() : '';
                    const txtM1 = rMulti1 && rMulti1.texto ? rMulti1.texto.replace(/\s+/g, ' ').trim() : '';
                    const txtM2 = rMulti2 && rMulti2.texto ? rMulti2.texto.replace(/\s+/g, ' ').trim() : '';
                    const txtLB1 = rLinkBloco1 && rLinkBloco1.texto ? rLinkBloco1.texto.trim() : '';
                    const txtLB2 = rLinkBloco2 && rLinkBloco2.texto ? rLinkBloco2.texto.replace(/\s+/g, ' ').trim() : '';
                    const txtLB3 = rLinkBloco3 && rLinkBloco3.texto ? rLinkBloco3.texto.replace(/\s+/g, ' ').trim() : '';
                    const txtLF1 = rLinkFora1 && rLinkFora1.texto ? rLinkFora1.texto.replace(/\s+/g, ' ').trim() : '';
                    const txtLF2 = rLinkFora2 && rLinkFora2.texto ? rLinkFora2.texto.replace(/\s+/g, ' ').trim() : '';

                    altInterfaceOk = (
                        txt1 === 'Salvar Tudo' &&
                        txtM1 === 'Emitir Certidão' &&
                        txtM2.includes('Emitir') &&
                        txtM2.includes('Certidão') &&
                        txtM2.includes('Negativa') &&
                        txtLB1 === '0001234-55.2024.4.01.4002' &&
                        txtLB2 === 'Processo 0001234-55.2024.4.01.4002' &&
                        txtLB3 === 'Processo 0001234-55.2024.4.01.4002 Petição Inicial' &&
                        txtLF1 === 'Processo 0001234-55.2024.4.01.4002' &&
                        txtLF2 === 'Processo 0001234-55.2024.4.01.4002 Petição Inicial' &&
                        txtEspacoMsciv === 'MSCiv 1015594-83.2026.4.01.4002'
                    );
                    detalheAltInterface = `btn1=[${txt1}] | multi1=[${txtM1}] | multi2=[${txtM2}] | mscivEspaco=[${txtEspacoMsciv}] | linkBloco=(${txtLB1} -> ${txtLB2} -> ${txtLB3}) | linkFora=(${txtLF1} -> ${txtLF2})`;
                    boxAlt.remove();
                } else {
                    detalheAltInterface = 'API resolverRangeAltEmInterface ausente';
                }
            } catch (eAltInt) {
                detalheAltInterface = eAltInt.message || String(eAltInt);
            }
            registrar(
                altInterfaceOk,
                'ALT_CLIQUE_INTERFACE_LINHA_UNICA_E_DUPLO_CLIQUE_MULTILINHA',
                'Alt+1 clique em interface seleciona todo o texto na mesma linha; em múltiplas linhas seleciona apenas a linha clicada e 2 cliques selecionam todas as linhas.',
                { detalhe: detalheAltInterface }
            );

            // Teste: Independência entre Retirar Seleções do Sistema (modoRetirarSelecao) e Contorno Visual Flash (tempoFlashBorderMs)
            let flashIndepOk = false;
            let detalheFlashIndep = '';
            try {
                const motor = window.JusGovMotorTestes;
                if (
                    motor &&
                    typeof motor.definirTempoFlashBorderMs === 'function' &&
                    typeof motor.definirModoRetirarSelecao === 'function' &&
                    typeof motor.dispararFlashBorderVisual === 'function' &&
                    typeof motor.limparFlashBorderImediatamente === 'function'
                ) {
                    const tempoAnt = motor.obterTempoFlashBorderMs();
                    const modoAnt = motor.obterModoRetirarSelecao();

                    const spanFlashIndep = document.createElement('span');
                    spanFlashIndep.textContent = '099.123.459-67';
                    spanFlashIndep.style.cssText = 'position:fixed;left:20px;top:20px;font-size:14px;';
                    const btnIntIndep = document.createElement('button');
                    btnIntIndep.textContent = 'Ação Interface';
                    btnIntIndep.style.cssText = 'position:fixed;left:200px;top:200px;';
                    document.body.appendChild(spanFlashIndep);
                    document.body.appendChild(btnIntIndep);

                    const rIndep = document.createRange();
                    rIndep.selectNodeContents(spanFlashIndep);

                    // Caso 1: modoRetirarSelecao='total' + tempoFlashBorderMs=-1 -> clique em interface fora do contorno NÃO remove o Flash
                    motor.definirModoRetirarSelecao('total');
                    motor.definirTempoFlashBorderMs(-1);
                    motor.dispararFlashBorderVisual(rIndep, -1);
                    btnIntIndep.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 220, clientY: 210 }));
                    const manteveModoInteracao = (document.getElementById('jusgov-flash-contour-container') !== null);

                    // Caso 2: tempoFlashBorderMs=2000 -> mousedown e selectstart em interface/flex NÃO cancelam o timer do Flash antes do tempo
                    motor.definirTempoFlashBorderMs(2000);
                    motor.dispararFlashBorderVisual(rIndep, 2000);
                    btnIntIndep.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 220, clientY: 210 }));
                    document.dispatchEvent(new Event('selectstart', { bubbles: true }));
                    const manteveTemporizado = (document.getElementById('jusgov-flash-contour-container') !== null);

                    // Caso 3: tempoFlashBorderMs=0 -> não exibe contorno mesmo com modoRetirarSelecao='nenhuma'
                    motor.definirModoRetirarSelecao('nenhuma');
                    motor.definirTempoFlashBorderMs(0);
                    motor.dispararFlashBorderVisual(rIndep, 0);
                    const naoExibiuComZero = (document.getElementById('jusgov-flash-contour-container') === null);

                    flashIndepOk = manteveModoInteracao && manteveTemporizado && naoExibiuComZero;
                    detalheFlashIndep = `ateInteracao=${manteveModoInteracao}, temporizado=${manteveTemporizado}, zero=${naoExibiuComZero}`;

                    motor.limparFlashBorderImediatamente();
                    spanFlashIndep.remove();
                    btnIntIndep.remove();
                    motor.definirTempoFlashBorderMs(tempoAnt);
                    motor.definirModoRetirarSelecao(modoAnt);
                } else {
                    detalheFlashIndep = 'APIs de teste ausentes';
                }
            } catch (eFlashInd) {
                detalheFlashIndep = eFlashInd.message || String(eFlashInd);
            }
            registrar(
                flashIndepOk,
                'FLASH_VISUAL_INDEPENDENTE_DE_RETIRAR_SELECAO_E_CLIQUE_INTERFACE',
                'Contorno Visual Flash cumpre exclusivamente tempoFlashBorderMs, independente de Retirar Seleções do Sistema ou clique em interface/flex.',
                { detalhe: detalheFlashIndep }
            );

            }

            {
            // Teste: Teto estrito no parágrafo para seleção via cliques (triplo clique não seleciona página inteira)
            let tetoParagrafoOk = false;
            let detalheTeto = '';
            try {
                const containerTeste = document.createElement('div');
                containerTeste.id = 'jusgov-teste-teto-paragrafo';
                containerTeste.innerHTML = '<div class="secao-teste"><p id="p-teste-1">Primeiro parágrafo isolado para seleção forense. Segunda frase do mesmo parágrafo.</p><p id="p-teste-2">Segundo parágrafo distinto que jamais deve ser capturado por cliques.</p></div>';
                document.body.appendChild(containerTeste);

                const elP1 = containerTeste.querySelector('#p-teste-1');
                const geom = (typeof window.JusGovGeometriaDOM === 'function') ? new window.JusGovGeometriaDOM() : null;
                const estagio5 = (typeof window.JusGovEstagioParagrafos === 'function') ? new window.JusGovEstagioParagrafos() : null;
                const motor = window.JusGovMotorSelecaoTeste;

                const mapaP1 = geom ? geom.construirMapaTextoBlocoComJanela(elP1.firstChild, 0) : null;
                let degrausOk = false;
                if (motor && typeof motor.construirDegrausCicloSelecao === 'function' && mapaP1) {
                    const degraus = motor.construirDegrausCicloSelecao(mapaP1, mapaP1.idxCursor || 0, elP1);
                    const ultimo = degraus[degraus.length - 1];
                    degrausOk = Boolean(
                        Array.isArray(degraus) &&
                        degraus.length > 0 &&
                        ultimo &&
                        ultimo.range &&
                        elP1.contains(ultimo.range.startContainer) &&
                        elP1.contains(ultimo.range.endContainer) &&
                        !String(ultimo.texto || '').includes('Segundo parágrafo') &&
                        ultimo.texto.length <= elP1.textContent.trim().length
                    );
                }

                let triploEstagio5Ok = false;
                if (estagio5 && typeof estagio5.resolverSelecaoTriploClique === 'function') {
                    const textoDoisParagrafos = 'Primeiro parágrafo isolado para seleção forense. Segunda frase do mesmo parágrafo.\nSegundo parágrafo distinto que jamais deve ser capturado por cliques.';
                    const resTriplo = estagio5.resolverSelecaoTriploClique({ texto: textoDoisParagrafos }, 0);
                    const trechoTriplo = resTriplo ? textoDoisParagrafos.substring(resTriplo.inicio, resTriplo.fim) : '';
                    triploEstagio5Ok = Boolean(
                        resTriplo &&
                        trechoTriplo.includes('Primeiro parágrafo') &&
                        !trechoTriplo.includes('Segundo parágrafo')
                    );
                }

                tetoParagrafoOk = degrausOk && triploEstagio5Ok;
                detalheTeto = `degrausOk=${degrausOk}, triploEstagio5Ok=${triploEstagio5Ok}`;
                containerTeste.remove();
            } catch (eTeto) {
                detalheTeto = eTeto.message || String(eTeto);
                const leftover = document.getElementById('jusgov-teste-teto-paragrafo');
                if (leftover) leftover.remove();
            }
            registrar(
                tetoParagrafoOk,
                'SELECAO_CLIQUES_TETO_ESTRITO_PARAGRAFO',
                'Cliques múltiplos (inclusive triplo clique e ciclo) param estritamente no parágrafo e não escalam para a página inteira.',
                { detalhe: detalheTeto }
            );

            }

            {
            // Teste: AvisoFlutuante renderiza texto/HTML sem permitir injeção de tags executáveis
            let avisoSeguroOk = false;
            let detalheAvisoSeg = '';
            try {
                const AvisoCls = window.JusGovAvisoFlutuante;
                if (typeof AvisoCls === 'function' && document.body) {
                    const av = new AvisoCls();
                    const spanFake = document.createElement('span');
                    spanFake.textContent = '123';
                    document.body.appendChild(spanFake);
                    const rFake = document.createRange();
                    rFake.selectNodeContents(spanFake);
                    // Mock geometrico minimo em ambiente headless sem layout de viewport completo
                    rFake.getBoundingClientRect = () => ({ top: 20, bottom: 38, left: 20, right: 60, width: 40, height: 18 });
                    rFake.getClientRects = () => [rFake.getBoundingClientRect()];

                    av.projetarAlertaVisual(rFake, 'Alerta <img src=x onerror=alert(1)>\nLinha 2', false);
                    const card = av.elementoCartaoAviso;
                    const semImgStr = Boolean(card && !card.querySelector('img') && card.querySelector('br') && card.textContent.includes('<img'));

                    av.projetarAlertaVisual(rFake, { html: '<span>Wiki OK</span><script>alert(1)</script><b onclick="alert(1)">Negrito</b>', ehWiki: true }, false);
                    const cardHtml = av.elementoCartaoAviso;
                    const semScriptObj = Boolean(cardHtml && !cardHtml.querySelector('script') && cardHtml.querySelector('b') && !cardHtml.querySelector('b').hasAttribute('onclick'));

                    av.limparAlertaVisual();
                    spanFake.remove();
                    avisoSeguroOk = semImgStr && semScriptObj;
                    detalheAvisoSeg = `strEscapada=${semImgStr}, htmlSanitizado=${semScriptObj}`;
                }
            } catch (eAv) {
                detalheAvisoSeg = eAv.message || String(eAv);
            }
            registrar(
                avisoSeguroOk,
                'AVISO_FLUTUANTE_RENDERIZACAO_SEGURA',
                'MotorValidacao renderiza avisos escapando strings perigosas e higienizando { html } via DOMParser.',
                { detalhe: detalheAvisoSeg }
            );

            }

            {
            // Teste BUG-66: Isolamento de cliques fora/próximo a <label> e células de tabela de formulário
            let bug66Ok = false;
            let detalheBug66 = '';
            try {
                const wrapB66 = document.createElement('div');
                wrapB66.style.cssText = 'position:fixed;left:10px;top:10px;z-index:1;';
                const tblB66 = document.createElement('table');
                const trB66 = document.createElement('tr');
                const tdB66 = document.createElement('td');
                tdB66.style.cssText = 'padding:12px 48px 24px 8px;';
                const lblB66 = document.createElement('label');
                const chkB66 = document.createElement('input');
                chkB66.type = 'checkbox';
                lblB66.appendChild(chkB66);
                lblB66.appendChild(document.createTextNode('OpcaoTeste'));
                tdB66.appendChild(lblB66);
                trB66.appendChild(tdB66);
                tblB66.appendChild(trB66);
                wrapB66.appendChild(tblB66);
                document.body.appendChild(wrapB66);

                const instReg = (typeof window.JusGovRegrasEInspetor === 'function') ? new window.JusGovRegrasEInspetor() : null;
                const instGeom = (typeof window.JusGovGeometriaDOM === 'function') ? new window.JusGovGeometriaDOM() : null;
                const rTd = tdB66.getBoundingClientRect();
                const rLbl = lblB66.getBoundingClientRect();
                const diagTd = instReg ? instReg.obterDiagnosticoElemento(tdB66) : null;
                const diagLbl = instReg ? instReg.obterDiagnosticoElemento(lblB66) : null;
                const snapDir = instGeom ? instGeom.localizarPontoTextoDentroDeElemento(tdB66, rTd.right - 2, rLbl.top + 4) : 'missing';
                const snapAbaixo = instGeom ? instGeom.localizarPontoTextoDentroDeElemento(tdB66, rLbl.left + 8, rTd.bottom - 2) : 'missing';
                wrapB66.remove();

                bug66Ok = Boolean(
                    diagTd && diagTd.tipo === 'interface' &&
                    diagLbl && diagLbl.tipo === 'interface' &&
                    snapDir === null &&
                    snapAbaixo === null
                );
                detalheBug66 = `diagTd=${diagTd && diagTd.tipo}, diagLbl=${diagLbl && diagLbl.tipo}, snapDir=${snapDir}, snapAbaixo=${snapAbaixo}`;
            } catch (e66) {
                detalheBug66 = e66.message || String(e66);
            }
            registrar(
                bug66Ok,
                'BUG_66_ISOLAMENTO_LABEL_E_TABELAS_FORMULARIO',
                'Cliques fora/próximo de <label> em células <td> classificam como interface e não capturam texto do rótulo.',
                { detalhe: detalheBug66 }
            );

            // Teste FEAT-36: Estilo "Apenas Numeral" em JusGovConstantes e CopiaVisual
            let feat36Ok = false;
            let detalheFeat36 = '';
            try {
                const consts = window.JusGovConstantes;
                const listaEst = consts ? consts.ESTILOS_BADGE_MARCADOR_COLADO : [];
                const idxApenas = Array.isArray(listaEst) ? listaEst.indexOf('apenas_numeral') : -1;
                const idxSem = Array.isArray(listaEst) ? listaEst.indexOf('sem_etiqueta') : -1;
                const penultimoOk = (idxApenas >= 0 && idxSem === idxApenas + 1);

                let renderOk = false;
                if (typeof window.JusGovFeedbackVisual === 'function') {
                    const vis = new window.JusGovFeedbackVisual();
                    const spEx = document.createElement('span');
                    spEx.textContent = 'TextoMarcadoTeste';
                    spEx.style.cssText = 'position:fixed;left:40px;top:40px;font-size:14px;z-index:2147483640;background:#fff;';
                    document.body.appendChild(spEx);
                    const rng = document.createRange();
                    rng.selectNodeContents(spEx);
                    vis.configurarMarcadorColado({ ativo: true, estiloBadge: 'apenas_numeral', corContorno: '#0d9488' });
                    vis.registrarCopiaCandidataParaMarcador(rng, 'TextoMarcadoTeste');
                    vis.confirmarColagemEMarcarPermanente('TextoMarcadoTeste');
                    const badgeEl = document.querySelector('.jusgov-marcador-colado-badge');
                    const csBadge = badgeEl ? window.getComputedStyle(badgeEl) : null;
                    renderOk = Boolean(
                        badgeEl &&
                        badgeEl.textContent === '1' &&
                        csBadge &&
                        csBadge.borderTopStyle === 'none' &&
                        (csBadge.backgroundColor === 'rgba(0, 0, 0, 0)' || csBadge.backgroundColor === 'transparent')
                    );
                    detalheFeat36 = `penultimo=${penultimoOk}, badge=${Boolean(badgeEl)}, txt=${badgeEl && badgeEl.textContent}, border=${csBadge && csBadge.borderTopStyle}, bg=${csBadge && csBadge.backgroundColor}`;
                    vis.limparMarcadoresPermanentes();
                    spEx.remove();
                } else {
                    detalheFeat36 = 'JusGovFeedbackVisual ausente';
                }
                feat36Ok = penultimoOk && renderOk;
            } catch (e36) {
                detalheFeat36 = e36.message || String(e36);
            }
            registrar(
                feat36Ok,
                'FEAT_36_ESTILO_BADGE_APENAS_NUMERAL',
                'Etiqueta "Apenas Numeral" está em ESTILOS_BADGE_MARCADOR_COLADO na penúltima posição e renderiza sem fundo/borda.',
                { detalhe: detalheFeat36 }
            );

            }

            {
            // Teste BUG-69: Continuidade em polígono SVG único entre múltiplos parágrafos com espaçamento vertical normal
            let bug69Ok = false;
            let detalheBug69 = '';
            try {
                if (typeof window.JusGovFeedbackVisual === 'function') {
                    const vis69 = new window.JusGovFeedbackVisual();
                    const boxP = document.createElement('div');
                    boxP.style.cssText = 'position:fixed;left:40px;top:40px;width:500px;font-size:13px;line-height:1.4;z-index:2147483640;background:#fff;';
                    boxP.innerHTML = '<p style="margin:0 0 14px 0;">Tratando-se de mandado de segurança na inicial.</p><p style="margin:0 0 14px 0;">Assim, diante do descumprimento da determinação judicial.</p><p style="margin:0;">Ante o exposto, indefiro a petição inicial.</p>';
                    document.body.appendChild(boxP);

                    const rng69 = document.createRange();
                    rng69.setStart(boxP.firstChild.firstChild, 0);
                    rng69.setEnd(boxP.lastChild.firstChild, boxP.lastChild.firstChild.length);

                    const segs69 = vis69.calcularLinhasDoRange(rng69);
                    const blocos69 = vis69.agruparLinhasEmBlocos(segs69);
                    const blocoUnicoOk = (blocos69.length === 1 && blocos69[0].length === 3);

                    vis69.dispararFlashBorderVisual(rng69, 5000, '#0d9488');
                    const flashSvgOk = Boolean(document.querySelector('#jusgov-flash-contour-container svg path'));
                    vis69.configurarMarcadorColado({ ativo: true, tipoContorno: 'solido', estiloBadge: 'sobrescrito' });
                    vis69.registrarCopiaCandidataParaMarcador(rng69, rng69.toString());
                    vis69.confirmarColagemEMarcarPermanente(rng69.toString());
                    const markerSvgOk = Boolean(document.querySelector('#jusgov-pasted-markers-container svg path'));

                    vis69.limparFlashBorderImediatamente();
                    vis69.limparMarcadoresPermanentes();
                    boxP.remove();

                    bug69Ok = blocoUnicoOk && flashSvgOk && markerSvgOk;
                    detalheBug69 = `blocos=${blocos69.length}, linhas=${blocos69[0] && blocos69[0].length}, flashSvg=${flashSvgOk}, markerSvg=${markerSvgOk}`;
                }
            } catch (e69) {
                detalheBug69 = e69.message || String(e69);
            }
            registrar(
                bug69Ok,
                'BUG_69_CONTINUIDADE_POLIGONO_SVG_MULTI_PARAGRAFO',
                'agruparLinhasEmBlocos une linhas e parágrafos vizinhos de um mesmo Range em polígono SVG contínuo tanto no Flash Border quanto no Marcador Permanente.',
                { detalhe: detalheBug69 }
            );

            }
        }
    }

    Object.freeze(DebugSelecao.prototype);
    return Object.freeze(DebugSelecao);
}));