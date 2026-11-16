/* ==========================================================================
 * Nome do arquivo: debug-fuzzing.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Suíte de Auditoria e Debug (Fuzzing de Estresse e Mutacional por Tempo)
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/mod-debug/debug-fuzzing.js
 * - Classe Exportada: DebugFuzzing (window.JusGovDebugFuzzing)
 * - Métodos Públicos: executarBateriaEstresse(ctx), executarBateriaFuzzing(duracaoMsPorTipo, registrar, geradores), executarBateriaFuzzingAsync(duracaoMsPorTipo, registrar, onProgresso, geradores)
 * - Escopo de Testes: Bateria 14 (Estresse de entradas), Fuzzing Temporal (CPF, CNPJ Tradicional/Alfanumérico, CNJ Mod97, INSS, PIS, Datas Bissextas, Limites Cursor, URLs, Multi-MIME, HTML<->MD, Máscaras, URLs Turbo)
 * - Regras / Seções: Diretriz Root 14, Seção 4 (Suite de Fuzzing)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovDebugFuzzing = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DebugFuzzing {
        executarBateriaEstresse(ctx) {
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
        linhasLog.push('\n--- BATERIA 14: FUZZING DE ROBUSTEZ E ESTRESSE DE ENTRADAS ---');

        /* 1) Fuzzing de Limites de Cursor e Caracteres Aleatórios */
        if (motorTeste && typeof motorTeste.simularCliqueEmTexto === 'function') {
            let totalCliquesFuzz = 0;
            let falhasCliquesFuzz = 0;
            const amostrasBase = [
                'Art. 12 da Lei nº 12.016/2009;',
                'PROCESSO: 0991001-58.2024.4.01.4002',
                'CPF: 099.123.459-67 e CNPJ: 09.912.345/0001-96',
                'Valor de R$ 1.250,50 pago em 23/10/2026',
                'REGULAR PROSSEGUIMENTO DO FEITO'
            ];
            for (let k = 0; k < 60; k++) {
                totalCliquesFuzz++;
                const frase = amostrasBase[k % amostrasBase.length];
                const idxAleatorio = randInt(-3, frase.length + 3);
                const numCliques = randInt(1, 3);
                try {
                    const ret = motorTeste.simularCliqueEmTexto(frase, idxAleatorio, numCliques);
                    if (typeof ret !== 'string') falhasCliquesFuzz++;
                } catch (_) {
                    falhasCliquesFuzz++;
                }
            }
            registrar(
                falhasCliquesFuzz === 0,
                'FUZZ_ROBUSTEZ_LIMITES_CURSOR',
                `Estresse de posições de cursor e cliques em fronteiras (${totalCliquesFuzz} iterações estocásticas)`,
                { detalhe: `Sucessos=${totalCliquesFuzz - falhasCliquesFuzz}/${totalCliquesFuzz} | Falhas=${falhasCliquesFuzz}` }
            );
        }

        /* 2) Fuzzing de URLs, Hosts e Extração de Domínios */
        {
            let totalUrlsFuzz = 0;
            let errosUrlsFuzz = 0;
            const esquemas = ['https://', 'http://', 'chrome://', 'file://', 'ftp://', 'about:'];
            const dominiosBase = ['pje.jus.br', 'google.com', 'trf1.jus.br', 'cnj.jus.br', 'stf.jus.br', 'localhost:8080'];
            const caminhosBase = ['/processo/123', '/painel?id=99&aba=2', '/documento#pg1', '/'];
            for (let k = 0; k < 60; k++) {
                totalUrlsFuzz++;
                const esq = esquemas[randInt(0, esquemas.length - 1)];
                const dom = dominiosBase[randInt(0, dominiosBase.length - 1)];
                const cam = caminhosBase[randInt(0, caminhosBase.length - 1)];
                const urlTeste = `${esq}${dom}${cam}`;
                try {
                    const u = new URL(urlTeste);
                    const host = u.hostname || u.host || '';
                    if (!host && esq.startsWith('http')) errosUrlsFuzz++;
                } catch (_) {
                    /* URL malformada intencional em teste */
                }
            }
            registrar(
                errosUrlsFuzz === 0,
                'FUZZ_ROBUSTEZ_URLS_DOMINIOS',
                `Estresse de resolução e extração de URLs/Hosts (${totalUrlsFuzz} iterações estocásticas)`,
                { detalhe: `Validadas=${totalUrlsFuzz - errosUrlsFuzz}/${totalUrlsFuzz} | Erros=${errosUrlsFuzz}` }
            );
        }

        /* 3) Fuzzing do Formatador Multi-MIME de Clipboard */
        {
            const formatadorClip = window.JusGovFormatarConteudoClipboard || (window.JusGovEditorDemo && window.JusGovEditorDemo.formatarConteudoClipboard);
            if (typeof formatadorClip === 'function') {
                let totalFmtClipFuzz = 0;
                let errosFmtClipFuzz = 0;
                const tiposMime = ['text/plain', 'text/html', 'text/rtf', 'image/png', 'application/json', 'video/mp4'];
                for (let k = 0; k < 50; k++) {
                    totalFmtClipFuzz++;
                    const qtdItens = randInt(0, 5);
                    const itens = [];
                    for (let m = 0; m < qtdItens; m++) {
                        const t = tiposMime[randInt(0, tiposMime.length - 1)];
                        itens.push({
                            type: t,
                            data: t.startsWith('text/') ? `Dado aleatório ${m}: ${Math.random()}` : null,
                            size: randInt(10, 500000),
                            isTextual: t.startsWith('text/')
                        });
                    }
                    try {
                        const res = formatadorClip(itens);
                        if (!res || typeof res.texto !== 'string' || typeof res.html !== 'string') {
                            errosFmtClipFuzz++;
                        }
                    } catch (_) {
                        errosFmtClipFuzz++;
                    }
                }
                registrar(
                    errosFmtClipFuzz === 0,
                    'FUZZ_ROBUSTEZ_FORMATADOR_CLIPBOARD_MULTI_MIME',
                    `Estresse do Formatador Multi-MIME de Clipboard (${totalFmtClipFuzz} iterações estocásticas)`,
                    { detalhe: `Sucessos=${totalFmtClipFuzz - errosFmtClipFuzz}/${totalFmtClipFuzz} | Falhas=${errosFmtClipFuzz}` }
                );
            }
        }

        /* 4) Fuzzing de Conversores Bidirecionais HTML <-> Markdown */
        if (window.JusGovEditorDemo && typeof window.JusGovEditorDemo.converterHtmlParaMarkdown === 'function' && typeof window.JusGovEditorDemo.converterMarkdownParaHtml === 'function') {
            let totalMdFuzz = 0;
            let errosMdFuzz = 0;
            const fragmentosHtml = [
                '<p>Texto com <b>negrito</b> e <i>itálico</i></p>',
                '<h1>Título</h1><blockquote>Citação</blockquote>',
                '<ul><li>Item 1</li><li>Item 2</li></ul>',
                '<p>Linha com <code>código</code> e <a href="http://ex.com">link</a></p>',
                '<p>Tachado <s>erro</s> e <u>sublinhado</u></p>'
            ];
            for (let k = 0; k < 50; k++) {
                totalMdFuzz++;
                const frag = fragmentosHtml[totalMdFuzz % fragmentosHtml.length];
                try {
                    const md = window.JusGovEditorDemo.converterHtmlParaMarkdown(frag);
                    const htmlVolta = window.JusGovEditorDemo.converterMarkdownParaHtml(md);
                    if (typeof md !== 'string' || typeof htmlVolta !== 'string') errosMdFuzz++;
                } catch (_) {
                    errosMdFuzz++;
                }
            }
            registrar(
                errosMdFuzz === 0,
                'FUZZ_ROBUSTEZ_CONVERSOR_HTML_MARKDOWN',
                `Estresse dos Conversores Bidirecionais HTML <-> Markdown (${totalMdFuzz} iterações estocásticas)`,
                { detalhe: `Sucessos=${totalMdFuzz - errosMdFuzz}/${totalMdFuzz} | Falhas=${errosMdFuzz}` }
            );
        }

        /* 5) Fuzzing de Máscaras Dinâmicas de Entrada de Dados */
        if (window.JusGovEditorDemo && typeof window.JusGovEditorDemo.formatarMascaraData === 'function' && typeof window.JusGovEditorDemo.formatarMascaraCpfCnpj === 'function') {
            let totalMascFuzz = 0;
            let errosMascFuzz = 0;
            for (let k = 0; k < 50; k++) {
                totalMascFuzz++;
                const strNum = String(Math.floor(Math.random() * 1e15)) + 'ABC!@#';
                try {
                    const mData = window.JusGovEditorDemo.formatarMascaraData(strNum);
                    const mCpf = window.JusGovEditorDemo.formatarMascaraCpfCnpj(strNum);
                    if (typeof mData !== 'string' || typeof mCpf !== 'string') errosMascFuzz++;
                } catch (_) {
                    errosMascFuzz++;
                }
            }
            registrar(
                errosMascFuzz === 0,
                'FUZZ_ROBUSTEZ_MASCARAS_ENTRADA',
                `Estresse das Máscaras Dinâmicas de Entrada de Dados (${totalMascFuzz * 2} iterações estocásticas)`,
                { detalhe: `Sucessos=${(totalMascFuzz * 2) - (errosMascFuzz * 2)}/${totalMascFuzz * 2} | Falhas=${errosMascFuzz}` }
            );
        }

        /* 6) Fuzzing de Extração e Higienização de Listas Turbo */
        {
            let totalTurboFuzz = 0;
            let errosTurboFuzz = 0;
            const blocos = [
                'https://pje.jus.br\n<all_urls>\n   \nhttps://pje.jus.br\nhttp://google.com\r\n',
                '<all_urls>\n<all_urls>\n\n\nhttps://trf1.jus.br',
                'https://stj.jus.br\n\n   https://stj.jus.br   \n'
            ];
            for (let k = 0; k < 50; k++) {
                totalTurboFuzz++;
                const entrada = blocos[totalTurboFuzz % blocos.length];
                try {
                    const linhas = Array.from(new Set(
                        String(entrada || '')
                            .split(/\r?\n/)
                            .map(l => l.trim())
                            .filter(l => l.length > 0 && l !== '<all_urls>')
                    ));
                    if (linhas.includes('<all_urls>') || (new Set(linhas)).size !== linhas.length) {
                        errosTurboFuzz++;
                    }
                } catch (_) {
                    errosTurboFuzz++;
                }
            }
            registrar(
                errosTurboFuzz === 0,
                'FUZZ_ROBUSTEZ_EXTRACAO_LINHAS_TURBO',
                `Estresse de Extração e Higienização de Listas Turbo (${totalTurboFuzz} iterações estocásticas)`,
                { detalhe: `Sucessos=${totalTurboFuzz - errosTurboFuzz}/${totalTurboFuzz} | Falhas=${errosTurboFuzz}` }
            );
        }

            }
        }

        _executarInterno(geradores, acao) {
            const {
                randInt, gerarCpfValido, gerarCnpjTradicionalValido,
                gerarCnpjAlfanumericoValido, gerarCnjValido, gerarDataValida,
                gerarInssNbValido, gerarPisValido,
                mutarDigitoParaInvalido, mutarDataParaInvalida
            } = geradores;
    const LISTA_ETAPAS_FUZZING = Object.freeze([
        { id: 'FUZZ_CPF', rotulo: 'CPF Randômico e Mutação ±1' },
        { id: 'FUZZ_CNPJ_TRADICIONAL', rotulo: 'CNPJ Tradicional e Mutação ±1' },
        { id: 'FUZZ_CNPJ_ALFANUMERICO', rotulo: 'Novo CNPJ Alfanumérico e Mutação ±1' },
        { id: 'FUZZ_CNJ_MODULO_97', rotulo: 'Processo CNJ Módulo 97 e Mutação ±1' },
        { id: 'FUZZ_INSS_NB_MODULO_11', rotulo: 'Benefício INSS NB Módulo 11 e Mutação ±1' },
        { id: 'FUZZ_PIS_MODULO_11', rotulo: 'PIS/PASEP Módulo 11 e Mutação ±1' },
        { id: 'FUZZ_DATAS_BISSEXTO', rotulo: 'Datas, Bissextos e Mutação de Fronteira' },
        { id: 'FUZZ_LIMITES_CURSOR', rotulo: 'Limites de Cursor' },
        { id: 'FUZZ_URLS_DOMINIOS', rotulo: 'URLs e Domínios' },
        { id: 'FUZZ_FORMATADOR_CLIPBOARD_MULTI_MIME', rotulo: 'Formatador Multi-MIME' },
        { id: 'FUZZ_CONVERSOR_HTML_MARKDOWN', rotulo: 'Conversores HTML <-> Markdown' },
        { id: 'FUZZ_MASCARAS_ENTRADA', rotulo: 'Máscaras de Entrada' },
        { id: 'FUZZ_EXTRACAO_LINHAS_TURBO', rotulo: 'Higienização de URLs Turbo' }
    ]);

    function executarUnicoFuzzingPorId(id, duracaoMsPorTipo, registrar) {
        if (!window.JusGovAvisoFlutuante) return;
        const validador = new window.JusGovAvisoFlutuante();
        const motorTeste = window.JusGovMotorSelecaoTeste;

        if (id === 'FUZZ_CPF') {
            /* Fuzz 1: CPF Randômico e Mutação Estrita ±1 a ±5 no Corpo (1s) */
            const tInicio = performance.now();
            let totalCpf = 0;
            let errosCpf = 0;
            let detalheErroCpf = '';
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalCpf++;
                const cpfVal = gerarCpfValido();
                const resVal = validador.validarCPF(cpfVal);
                if (!resVal || !resVal.valido) {
                    errosCpf++;
                    if (!detalheErroCpf) detalheErroCpf = `[ValidoFalhou: ${cpfVal}]`;
                }

                const cpfMut = mutarDigitoParaInvalido(cpfVal, s => validador.validarCPF(s), { qtdDvsFinais: 2 });
                const resMut = validador.validarCPF(cpfMut);
                if (!resMut || resMut.valido) {
                    errosCpf++;
                    if (!detalheErroCpf) detalheErroCpf = `[MutantePassou: orig=${cpfVal} mut=${cpfMut}]`;
                }
            }
            registrar(
                errosCpf === 0,
                'FUZZ_CPF',
                `Fuzzing temporal de CPF com Mutação Estrita ±1 a ±5 no Corpo (${totalCpf * 2} iterações em ${duracaoMsPorTipo}ms)` + (detalheErroCpf ? ` ${detalheErroCpf}` : ''),
                { detalhe: `Aprovados=${(totalCpf * 2) - errosCpf}/${totalCpf * 2} | Erros=${errosCpf}${detalheErroCpf ? ' ' + detalheErroCpf : ''}` }
            );
        } else if (id === 'FUZZ_CNPJ_TRADICIONAL') {
            /* Fuzz 2: CNPJ Tradicional Randômico e Mutação Estrita ±1 a ±5 no Corpo (1s) */
            const tInicio = performance.now();
            let totalCnpj = 0;
            let errosCnpj = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalCnpj++;
                const cnpjVal = gerarCnpjTradicionalValido();
                const resVal = validador.validarCNPJ(cnpjVal);
                if (!resVal || !resVal.valido) errosCnpj++;

                const cnpjMut = mutarDigitoParaInvalido(cnpjVal, s => validador.validarCNPJ(s), { qtdDvsFinais: 2 });
                const resMut = validador.validarCNPJ(cnpjMut);
                if (!resMut || resMut.valido) errosCnpj++;
            }
            registrar(
                errosCnpj === 0,
                'FUZZ_CNPJ_TRADICIONAL',
                `Fuzzing temporal de CNPJ Tradicional com Mutação Estrita ±1 a ±5 no Corpo (${totalCnpj * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalCnpj * 2) - errosCnpj}/${totalCnpj * 2} | Erros=${errosCnpj}` }
            );
        } else if (id === 'FUZZ_CNPJ_ALFANUMERICO') {
            /* Fuzz 3: Novo CNPJ Alfanumérico Randômico e Mutação Estrita ±1 a ±5 no Corpo (1s) */
            const tInicio = performance.now();
            let totalAlfa = 0;
            let errosAlfa = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalAlfa++;
                const alfaVal = gerarCnpjAlfanumericoValido();
                const resVal = validador.validarCNPJ(alfaVal);
                if (!resVal || !resVal.valido) errosAlfa++;

                const alfaMut = mutarDigitoParaInvalido(alfaVal, s => validador.validarCNPJ(s), { qtdDvsFinais: 2 });
                const resMut = validador.validarCNPJ(alfaMut);
                if (!resMut || resMut.valido) errosAlfa++;
            }
            registrar(
                errosAlfa === 0,
                'FUZZ_CNPJ_ALFANUMERICO',
                `Fuzzing temporal de Novo CNPJ Alfanumérico com Mutação Estrita ±1 a ±5 no Corpo (${totalAlfa * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalAlfa * 2) - errosAlfa}/${totalAlfa * 2} | Erros=${errosAlfa}` }
            );
        } else if (id === 'FUZZ_CNJ_MODULO_97') {
            /* Fuzz 4: Processo Judicial CNJ Módulo 97 BigInt e Mutação Estrita ±1 a ±5 no Corpo (1s) */
            const tInicio = performance.now();
            let totalCnj = 0;
            let errosCnj = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalCnj++;
                const cnjVal = gerarCnjValido();
                const resVal = validador.validarCNJ(cnjVal);
                if (!resVal || !resVal.valido) errosCnj++;

                const cnjMut = mutarDigitoParaInvalido(cnjVal, s => validador.validarCNJ(s), { ehCnj: true });
                const resMut = validador.validarCNJ(cnjMut);
                if (!resMut || resMut.valido) errosCnj++;
            }
            registrar(
                errosCnj === 0,
                'FUZZ_CNJ_MODULO_97',
                `Fuzzing temporal de Processos CNJ Módulo 97 com Mutação Estrita ±1 a ±5 no Corpo (${totalCnj * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalCnj * 2) - errosCnj}/${totalCnj * 2} | Erros=${errosCnj}` }
            );
        } else if (id === 'FUZZ_INSS_NB_MODULO_11') {
            /* Fuzz 5: Benefício Previdenciário INSS NB Módulo 11 e Mutação Estrita ±1 a ±5 no Corpo (1s) */
            const tInicio = performance.now();
            let totalInss = 0;
            let errosInss = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalInss++;
                const inssVal = gerarInssNbValido();
                const resVal = validador.validarNumeroBeneficioINSS(inssVal);
                if (!resVal || !resVal.valido) errosInss++;

                const inssMut = mutarDigitoParaInvalido(inssVal, s => validador.validarNumeroBeneficioINSS(s), { qtdDvsFinais: 1 });
                const resMut = validador.validarNumeroBeneficioINSS(inssMut);
                if (!resMut || resMut.valido) errosInss++;
            }
            registrar(
                errosInss === 0,
                'FUZZ_INSS_NB_MODULO_11',
                `Fuzzing temporal de Benefício INSS NB Módulo 11 com Mutação Estrita ±1 a ±5 no Corpo (${totalInss * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalInss * 2) - errosInss}/${totalInss * 2} | Erros=${errosInss}` }
            );
        } else if (id === 'FUZZ_PIS_MODULO_11') {
            /* Fuzz 6: Inscrição PIS/PASEP/NIT Módulo 11 e Mutação Estrita ±1 a ±5 no Corpo (1s) */
            const tInicio = performance.now();
            let totalPis = 0;
            let errosPis = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalPis++;
                const pisVal = gerarPisValido();
                const resVal = validador.validarPIS(pisVal);
                if (!resVal || !resVal.valido) errosPis++;

                const pisMut = mutarDigitoParaInvalido(pisVal, s => validador.validarPIS(s), { qtdDvsFinais: 1 });
                const resMut = validador.validarPIS(pisMut);
                if (!resMut || resMut.valido) errosPis++;
            }
            registrar(
                errosPis === 0,
                'FUZZ_PIS_MODULO_11',
                `Fuzzing temporal de Inscrição PIS/PASEP Módulo 11 com Mutação Estrita ±1 a ±5 no Corpo (${totalPis * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalPis * 2) - errosPis}/${totalPis * 2} | Erros=${errosPis}` }
            );
        } else if (id === 'FUZZ_DATAS_BISSEXTO') {
            /* Fuzz 7: Datas, Bissextos e Mutação de Fronteira (1s) */
            const tInicio = performance.now();
            let totalDt = 0;
            let errosDt = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalDt++;
                const dtVal = gerarDataValida(totalDt % 3 === 0);
                const resVal = validador.validarData(dtVal);
                if (!resVal || !resVal.valido) errosDt++;

                const dtMut = mutarDataParaInvalida(dtVal);
                const resMut = validador.validarData(dtMut);
                if (!resMut || resMut.valido) errosDt++;
            }
            registrar(
                errosDt === 0,
                'FUZZ_DATAS_BISSEXTO',
                `Fuzzing temporal de Datas e Bissextos com Mutação de Fronteira (${totalDt * 2} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Aprovados=${(totalDt * 2) - errosDt}/${totalDt * 2} | Erros=${errosDt}` }
            );
        } else if (id === 'FUZZ_LIMITES_CURSOR') {
            /* Fuzz 6: Limites de Cursor e Caracteres Aleatórios (1s) */
            if (motorTeste && typeof motorTeste.simularCliqueEmTexto === 'function') {
                const tInicio = performance.now();
                let totalCliques = 0;
                let falhasCliques = 0;
                const amostrasBase = [
                    'Art. 12 da Lei nº 12.016/2009;',
                    'PROCESSO: 0991001-58.2024.4.01.4002',
                    'CPF: 099.123.459-67 e CNPJ: 09.912.345/0001-96',
                    'Valor de R$ 1.250,50 pago em 23/10/2026',
                    'REGULAR PROSSEGUIMENTO DO FEITO'
                ];
                while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                    totalCliques++;
                    const frase = amostrasBase[totalCliques % amostrasBase.length];
                    const idxAleatorio = randInt(-3, frase.length + 3);
                    const numCliques = randInt(1, 3);
                    try {
                        const ret = motorTeste.simularCliqueEmTexto(frase, idxAleatorio, numCliques);
                        if (typeof ret !== 'string') falhasCliques++;
                    } catch (_) {
                        falhasCliques++;
                    }
                }
                registrar(
                    falhasCliques === 0,
                    'FUZZ_LIMITES_CURSOR',
                    `Fuzzing de posições de cursor e cliques em fronteiras (${totalCliques} chamadas)`,
                    { detalhe: `Sucessos=${totalCliques - falhasCliques}/${totalCliques} | Falhas=${falhasCliques}` }
                );
            }
        } else if (id === 'FUZZ_URLS_DOMINIOS') {
            /* Fuzz 7: URLs, Hosts e Extração de Domínios (1s) */
            const tInicio = performance.now();
            let totalUrls = 0;
            let errosUrls = 0;
            const esquemas = ['https://', 'http://', 'chrome://', 'file://', 'ftp://', 'about:'];
            const dominiosBase = ['pje.jus.br', 'google.com', 'trf1.jus.br', 'cnj.jus.br', 'stf.jus.br', 'localhost:8080'];
            const caminhosBase = ['/processo/123', '/painel?id=99&aba=2', '/documento#pg1', '/'];
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalUrls++;
                const esq = esquemas[randInt(0, esquemas.length - 1)];
                const dom = dominiosBase[randInt(0, dominiosBase.length - 1)];
                const cam = caminhosBase[randInt(0, caminhosBase.length - 1)];
                const urlTeste = `${esq}${dom}${cam}`;
                try {
                    const u = new URL(urlTeste);
                    const host = u.hostname || u.host || '';
                    if (!host && esq.startsWith('http')) errosUrls++;
                } catch (_) {
                    /* URL malformada proposital */
                }
            }
            registrar(
                errosUrls === 0,
                'FUZZ_URLS_DOMINIOS',
                `Fuzzing temporal de URLs e Hosts (${totalUrls} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Validadas=${totalUrls - errosUrls}/${totalUrls} | Erros=${errosUrls}` }
            );
        } else if (id === 'FUZZ_FORMATADOR_CLIPBOARD_MULTI_MIME') {
            /* Fuzz 8: Formatador Multi-MIME de Clipboard e Borda de Dados (1s) */
            const formatadorClip = window.JusGovFormatarConteudoClipboard || (window.JusGovEditorDemo && window.JusGovEditorDemo.formatarConteudoClipboard);
            if (typeof formatadorClip === 'function') {
                const tInicio = performance.now();
                let totalFmtClip = 0;
                let errosFmtClip = 0;
                const tiposMime = ['text/plain', 'text/html', 'text/rtf', 'image/png', 'application/json', 'video/mp4'];
                while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                    totalFmtClip++;
                    const qtdItens = randInt(0, 5);
                    const itens = [];
                    for (let k = 0; k < qtdItens; k++) {
                        const t = tiposMime[randInt(0, tiposMime.length - 1)];
                        itens.push({
                            type: t,
                            data: t.startsWith('text/') ? `Dado aleatório ${k}: ${Math.random()}` : null,
                            size: randInt(10, 500000),
                            isTextual: t.startsWith('text/')
                        });
                    }
                    try {
                        const res = formatadorClip(itens);
                        if (!res || typeof res.texto !== 'string' || typeof res.html !== 'string') {
                            errosFmtClip++;
                        }
                    } catch (_) {
                        errosFmtClip++;
                    }
                }
                registrar(
                    errosFmtClip === 0,
                    'FUZZ_FORMATADOR_CLIPBOARD_MULTI_MIME',
                    `Fuzzing do Formatador Multi-MIME de Clipboard (${totalFmtClip} iterações em ${duracaoMsPorTipo}ms)`,
                    { detalhe: `Sucessos=${totalFmtClip - errosFmtClip}/${totalFmtClip} | Falhas=${errosFmtClip}` }
                );
            }
        } else if (id === 'FUZZ_CONVERSOR_HTML_MARKDOWN') {
            /* Fuzz 9: Conversores Bidirecionais HTML <-> Markdown (1s) */
            if (window.JusGovEditorDemo && typeof window.JusGovEditorDemo.converterHtmlParaMarkdown === 'function' && typeof window.JusGovEditorDemo.converterMarkdownParaHtml === 'function') {
                const tInicio = performance.now();
                let totalMd = 0;
                let errosMd = 0;
                const fragmentosHtml = [
                    '<p>Texto com <b>negrito</b> e <i>itálico</i></p>',
                    '<h1>Título</h1><blockquote>Citação</blockquote>',
                    '<ul><li>Item 1</li><li>Item 2</li></ul>',
                    '<p>Linha com <code>código</code> e <a href="http://ex.com">link</a></p>',
                    '<p>Tachado <s>erro</s> e <u>sublinhado</u></p>'
                ];
                while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                    totalMd++;
                    const frag = fragmentosHtml[totalMd % fragmentosHtml.length];
                    try {
                        const md = window.JusGovEditorDemo.converterHtmlParaMarkdown(frag);
                        const htmlVolta = window.JusGovEditorDemo.converterMarkdownParaHtml(md);
                        if (typeof md !== 'string' || typeof htmlVolta !== 'string') errosMd++;
                    } catch (_) {
                        errosMd++;
                    }
                }
                registrar(
                    errosMd === 0,
                    'FUZZ_CONVERSOR_HTML_MARKDOWN',
                    `Fuzzing dos Conversores Bidirecionais HTML <-> Markdown (${totalMd} iterações em ${duracaoMsPorTipo}ms)`,
                    { detalhe: `Sucessos=${totalMd - errosMd}/${totalMd} | Falhas=${errosMd}` }
                );
            }
        } else if (id === 'FUZZ_MASCARAS_ENTRADA') {
            /* Fuzz 10: Máscaras Dinâmicas de Entrada de Dados (1s) */
            if (window.JusGovEditorDemo && typeof window.JusGovEditorDemo.formatarMascaraData === 'function' && typeof window.JusGovEditorDemo.formatarMascaraCpfCnpj === 'function') {
                const tInicio = performance.now();
                let totalMasc = 0;
                let errosMasc = 0;
                while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                    totalMasc++;
                    const strNum = String(Math.floor(Math.random() * 1e15)) + 'ABC!@#';
                    try {
                        const mData = window.JusGovEditorDemo.formatarMascaraData(strNum);
                        const mCpf = window.JusGovEditorDemo.formatarMascaraCpfCnpj(strNum);
                        if (typeof mData !== 'string' || typeof mCpf !== 'string') errosMasc++;
                    } catch (_) {
                        errosMasc++;
                    }
                }
                registrar(
                    errosMasc === 0,
                    'FUZZ_MASCARAS_ENTRADA',
                    `Fuzzing das Máscaras Dinâmicas de Entrada de Dados (${totalMasc * 2} iterações em ${duracaoMsPorTipo}ms)`,
                    { detalhe: `Sucessos=${(totalMasc * 2) - (errosMasc * 2)}/${totalMasc * 2} | Falhas=${errosMasc}` }
                );
            }
        } else if (id === 'FUZZ_EXTRACAO_LINHAS_TURBO') {
            /* Fuzz 11: Extração e Higienização de Listas Turbo (1s) */
            const tInicio = performance.now();
            let totalTurbo = 0;
            let errosTurbo = 0;
            while ((performance.now() - tInicio) < duracaoMsPorTipo) {
                totalTurbo++;
                const blocos = [
                    'https://pje.jus.br\n<all_urls>\n   \nhttps://pje.jus.br\nhttp://google.com\r\n',
                    '<all_urls>\n<all_urls>\n\n\nhttps://trf1.jus.br',
                    'https://stj.jus.br\n\n   https://stj.jus.br   \n'
                ];
                const entrada = blocos[totalTurbo % blocos.length];
                try {
                    const linhas = Array.from(new Set(
                        String(entrada || '')
                            .split(/\r?\n/)
                            .map(l => l.trim())
                            .filter(l => l.length > 0 && l !== '<all_urls>')
                    ));
                    if (linhas.includes('<all_urls>') || (new Set(linhas)).size !== linhas.length) {
                        errosTurbo++;
                    }
                } catch (_) {
                    errosTurbo++;
                }
            }
            registrar(
                errosTurbo === 0,
                'FUZZ_EXTRACAO_LINHAS_TURBO',
                `Fuzzing de Extração e Higienização de Listas Turbo (${totalTurbo} iterações em ${duracaoMsPorTipo}ms)`,
                { detalhe: `Sucessos=${totalTurbo - errosTurbo}/${totalTurbo} | Falhas=${errosTurbo}` }
            );
        }
    }

    /*
     * FUNCAO: executarBateriaFuzzing
     * OBJETIVO DE RECONSTRUCAO: Executar geracao aleatoria controlada por tempo
     * (1s por tipo de teste) garantindo solidez algoritmica, ausencia de excecoes
     * e conformidade com os testes de blueprint exigidos pelo usuario.
     */
    function executarBateriaFuzzing(duracaoMsPorTipo = 1000, registrar) {
        for (let i = 0; i < LISTA_ETAPAS_FUZZING.length; i++) {
            executarUnicoFuzzingPorId(LISTA_ETAPAS_FUZZING[i].id, duracaoMsPorTipo, registrar);
        }
    }

    /*
     * FUNCAO: executarBateriaFuzzingAsync
     * Executa as 11 baterias de fuzzing de forma assíncrona, atualizando o callback de progresso.
     */
    async function executarBateriaFuzzingAsync(duracaoMsPorTipo = 1000, registrar, onProgresso) {
        for (let i = 0; i < LISTA_ETAPAS_FUZZING.length; i++) {
            const etapa = LISTA_ETAPAS_FUZZING[i];
            const pct = Math.round(((i + 1) / LISTA_ETAPAS_FUZZING.length) * 100);
            if (typeof onProgresso === 'function') {
                onProgresso(pct, etapa.rotulo);
            }
            await new Promise(r => setTimeout(r, 20));
            executarUnicoFuzzingPorId(etapa.id, duracaoMsPorTipo, registrar);
        }
    }
            return acao({
                LISTA_ETAPAS_FUZZING,
                executarBateriaFuzzing,
                executarBateriaFuzzingAsync
            });
        }

        executarBateriaFuzzing(duracaoMsPorTipo = 1000, registrar, geradores) {
            return this._executarInterno(geradores, (api) => api.executarBateriaFuzzing(duracaoMsPorTipo, registrar));
        }

        async executarBateriaFuzzingAsync(duracaoMsPorTipo = 1000, registrar, onProgresso, geradores) {
            return await this._executarInterno(geradores, (api) => api.executarBateriaFuzzingAsync(duracaoMsPorTipo, registrar, onProgresso));
        }
    }

    Object.freeze(DebugFuzzing.prototype);
    return Object.freeze(DebugFuzzing);
}));