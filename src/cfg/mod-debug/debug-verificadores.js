/* ==========================================================================
 * Nome do arquivo: debug-verificadores.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Suíte de Auditoria e Debug (Verificadores de Cálculos, DVs e Datas)
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/mod-debug/debug-verificadores.js
 * - Classe Exportada: DebugVerificadores (window.JusGovDebugVerificadores)
 * - Métodos Públicos: executar(ctx)
 * - Escopo de Testes: Bateria 1 (Datas/Bissextos/CPF/CNPJ/CNJ/Mod10/Mod11/Mod97), Tributos (DARF/GRU/IPTU), Boleto Mod11, INSS NB, Datas Limite e Bateria 13 (Mutação DV ±1..±5)
 * - Regras / Seções: Diretrizes 5/7/16, Seções 6.45, 6.60, 6.99, BUG-12
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovDebugVerificadores = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DebugVerificadores {
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
        linhasLog.push('\n--- BATERIA 1: VALIDACAO MATEMATICA DETERMINISTICA E CASOS DE BORDA ---');

        const casosMatematicos = [
            /* Datas Validas e Bissextos */
            { desc: 'Data numerica valida simples', amostra: '11/09/2026', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data bissexta valida (2024)', amostra: '29/02/2024', idx: 3, esp: 'valido=true', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data bissexta secular valida (2000)', amostra: '29/02/2000', idx: 3, esp: 'valido=true', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data abreviada valida (17 ago. 2026)', amostra: '17 ago. 2026', idx: 3, esp: 'valido=true', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data com ponto final de sentenca valida (01.05.19)', amostra: '01.05.19', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarData(s).valido}` },
            /* Datas Invalidas */
            { desc: 'Data bissexta invalida ano comum (2025)', amostra: '29/02/2025', idx: 3, esp: 'valido=false', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data secular nao-bissexta invalida (2100)', amostra: '29/02/2100', idx: 6, esp: 'valido=false', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data secular nao-bissexta invalida (1900)', amostra: '29/02/1900', idx: 6, esp: 'valido=false', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data com mes 30 dias invalida (31/04)', amostra: '31/04/2026', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data por extenso invalida (29 de fevereiro de 2025)', amostra: '29 de fevereiro de 2025', idx: 6, esp: 'valido=false', fn: (s) => `valido=${validador.validarData(s).valido}` },
            { desc: 'Data com mes e dia absurdos (31/31/1998)', amostra: '31/31/1998', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarData(s).valido}` },
            /* Data com Horario Espacado (DD/MM/AAAA HH:MM e DD/MM/AAAA HH:MM:SS) e Horarios Isolados */
            { desc: 'Data com Horario Espacado valida simples (DD/MM/AAAA HH:MM)', amostra: '28/10/2026 06:28', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Data com Horario Espacado valida com segundos (DD/MM/AAAA HH:MM:SS)', amostra: '28/10/2026 06:28:50', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Data com Horario e Hifen valida (DD/MM/AAAA - HH:MM:SS)', amostra: '28/10/2026 - 06:28:50', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Data com Horario Espacado invalida data bissexta (29/02/2025 06:28)', amostra: '29/02/2025 06:28', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Data com Horario Espacado invalida hora excedente (28/10/2026 25:10)', amostra: '28/10/2026 25:10', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Data com Horario Espacado invalida minuto excedente (28/10/2026 06:75)', amostra: '28/10/2026 06:75', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Data com Horario Espacado invalida segundo excedente (28/10/2026 06:28:88)', amostra: '28/10/2026 06:28:88', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Horario isolado valido (06:28)', amostra: '06:28', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Horario isolado invalido hora excedente (25:10)', amostra: '25:10', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            { desc: 'Horario isolado invalido minuto excedente (14:65)', amostra: '14:65', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarTrechoSelecionado(s) === null}` },
            /* CPF */
            { desc: 'CPF valido com calculo real de DV', amostra: '529.982.247-25', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF valido ficticio 0991234 Parana / 9a RF (099.123.459-67)', amostra: '099.123.459-67', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF valido ficticio 0991234 TRF1 / DF (099.123.451-00)', amostra: '099.123.451-00', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF valido serie 09991234 Parana (099.912.349-18)', amostra: '099.912.349-18', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF invalido sequencia repetida', amostra: '111.111.111-11', idx: 4, esp: 'valido=false', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF invalido DV incorreto', amostra: '529.982.247-99', idx: 12, esp: 'valido=false', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            { desc: 'CPF invalido ficticio 0991234 (099.123.459-99)', amostra: '099.123.459-99', idx: 12, esp: 'valido=false', fn: (s) => `valido=${validador.validarCPF(s).valido}` },
            /* CNPJ Tradicional */
            { desc: 'CNPJ tradicional valido com calculo de DV', amostra: '11.222.333/0001-81', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional valido ficticio matriz 0991234 (09.912.345/0001-96)', amostra: '09.912.345/0001-96', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional valido ficticio filial 0991234 (09.912.345/0002-77)', amostra: '09.912.345/0002-77', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional valido serie 09991234 matriz (09.991.234/0001-12)', amostra: '09.991.234/0001-12', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional valido serie 09991234 filial (09.991.234/0002-01)', amostra: '09.991.234/0002-01', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional invalido DV incorreto', amostra: '11.222.333/0001-99', idx: 16, esp: 'valido=false', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'CNPJ tradicional invalido ficticio 0991234 (09.912.345/0001-99)', amostra: '09.912.345/0001-99', idx: 16, esp: 'valido=false', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            /* Novo CNPJ Alfanumerico */
            { desc: 'Novo CNPJ Alfanumerico valido (12.ABC.345/01DE-35)', amostra: '12.ABC.345/01DE-35', idx: 3, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            { desc: 'Novo CNPJ Alfanumerico invalido DV incorreto', amostra: '12.ABC.345/01DE-99', idx: 11, esp: 'valido=false', fn: (s) => `valido=${validador.validarCNPJ(s).valido}` },
            /* Processo CNJ */
            { desc: 'Processo CNJ valido Modulo 97 BigInt (TRF1)', amostra: '0991234-55.2024.4.01.4002', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNJ(s).valido}` },
            { desc: 'Processo CNJ valido TRF1 (0991234-55.2024.4.01.4002)', amostra: '0991234-55.2024.4.01.4002', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNJ(s).valido}` },
            { desc: 'Processo CNJ valido TJPR (0991234-87.2024.8.16.0030)', amostra: '0991234-87.2024.8.16.0030', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNJ(s).valido}` },
            { desc: 'Processo CNJ valido Modulo 97 BigInt (TJPI)', amostra: '0001234-70.2024.8.18.0140', idx: 8, esp: 'valido=true', fn: (s) => `valido=${validador.validarCNJ(s).valido}` },
            { desc: 'Processo CNJ invalido DV incorreto', amostra: '0991234-65.2024.4.01.4002', idx: 8, esp: 'valido=false', fn: (s) => `valido=${validador.validarCNJ(s).valido}` },
            /* Beneficio INSS (NB) Modulo 11 */
            { desc: 'INSS NB valido com especie e calculo de DV', amostra: '31/6506589241', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB valido com especie ficticio 0991234 (31/0991234502)', amostra: '31/0991234502', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB valido isolado com calculo de DV (6464966891)', amostra: '6464966891', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB pontuado valido com calculo de DV (719.657.155-0)', amostra: '719.657.155-0', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB pontuado valido ficticio 0991234 (099.123.450-2)', amostra: '099.123.450-2', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB invalido DV incorreto', amostra: '31/6506589240', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB pontuado invalido DV incorreto (719.657.155-9)', amostra: '719.657.155-9', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB pontuado invalido ficticio 0991234 (099.123.450-9)', amostra: '099.123.450-9', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            { desc: 'INSS NB invalido sequencia repetida', amostra: '1111111111', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarNumeroBeneficioINSS(s).valido}` },
            /* PIS / PASEP / NIT (Modulo 11) */
            { desc: 'PIS/NIT valido com calculo real de DV (120.43256.72-8)', amostra: '120.43256.72-8', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarPIS(s).valido}` },
            { desc: 'PIS/NIT valido ficticio padrao 0991234 (099.12345.67-9)', amostra: '099.12345.67-9', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.validarPIS(s).valido}` },
            { desc: 'PIS/NIT invalido DV incorreto (120.43256.72-4)', amostra: '120.43256.72-4', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarPIS(s).valido}` },
            { desc: 'PIS/NIT invalido ficticio padrao 0991234 DV incorreto (099.12345.67-0)', amostra: '099.12345.67-0', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarPIS(s).valido}` },
            { desc: 'PIS/NIT invalido sequencia repetida', amostra: '000.00000.00-0', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.validarPIS(s).valido}` },
            { desc: 'PIS rotulado sem pontuacao valido (PIS: 12043256728)', amostra: 'PIS: 12043256728', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.auditarEAlerta(s, null).valido}` },
            { desc: 'NIT rotulado com pontuacao valido (NIT: 120.43256.72-8)', amostra: 'NIT: 120.43256.72-8', idx: 0, esp: 'valido=true', fn: (s) => `valido=${validador.auditarEAlerta(s, null).valido}` },
            { desc: 'PIS rotulado sem pontuacao invalido (PIS: 12043256724)', amostra: 'PIS: 12043256724', idx: 0, esp: 'valido=false', fn: (s) => `valido=${validador.auditarEAlerta(s, null).valido}` }
        ];

        for (let i = 0; i < casosMatematicos.length; i++) {
            const caso = casosMatematicos[i];
            let obt = 'erro_execucao';
            try { obt = String(caso.fn(caso.amostra)); } catch (e) { obt = `excecao:${e.message}`; }
            registrar(obt === caso.esp, 'MATEMATICA', caso.desc, {
                textoTestado: caso.amostra,
                idxCursor: caso.idx,
                esperado: caso.esp,
                obtido: obt
            });
        }

        /* Teste de estrutura do alerta: sem digito esperado calculado e com underline no dado incorreto */
        const auditoriaCpfDv = validador.validarCPF('529.982.247-99');
        const semDigitoEsperado = auditoriaCpfDv &&
            !auditoriaCpfDv.valido &&
            !auditoriaCpfDv.msg.toLowerCase().includes('esperado') &&
            !auditoriaCpfDv.msg.toLowerCase().includes('copiado normalmente') &&
            auditoriaCpfDv.html.includes('<u') &&
            auditoriaCpfDv.html.includes('529.982.247-99</u>') &&
            auditoriaCpfDv.html.includes('<b>[CPF Inválido]:</b>') && auditoriaCpfDv.html.includes('✗</span>');

        registrar(
            semDigitoEsperado,
            'MATEMATICA',
            'Alerta de validacao sem digito esperado, sem sufixo copiado e com dado sublinhado',
            {
                textoTestado: '529.982.247-99',
                esperado: 'sem_esperado_e_com_underline',
                obtido: auditoriaCpfDv ? auditoriaCpfDv.msg : 'falha'
            }
        );

        /* Testes da Wiki Forense (INSS, CNJ, CPF, CNPJ e Datas) */
        const wikiInss = validador.validarNumeroBeneficioINSS('31/6506589241');
        const aprovadoWikiInss = wikiInss &&
            wikiInss.valido &&
            wikiInss.ehWiki &&
            wikiInss.dado === '6506589241' &&
            !wikiInss.subtitulo.includes('Ativo') &&
            wikiInss.subtitulo.includes('Auxílio por Incapacidade Temporária') &&
            wikiInss.subtitulo.includes('(RGPS - Contributivo)') &&
            wikiInss.html.includes('<u') && wikiInss.html.includes('6506589241</u>') &&
            wikiInss.html.includes('✓</span>');
        registrar(aprovadoWikiInss, 'MATEMATICA', 'Wiki Forense INSS: decodificacao de especie 31, sem redundancia de "Ativo", pulando RGPS para 2a linha', {
            obtido: wikiInss ? wikiInss.subtitulo : 'falha'
        });

        const wikiInssExtinto = validador.validarNumeroBeneficioINSS('01/6506589241');
        const aprovadoWikiInssExtinto = wikiInssExtinto &&
            wikiInssExtinto.valido &&
            wikiInssExtinto.ehWiki &&
            wikiInssExtinto.subtitulo.includes('Tipo Extinto') &&
            wikiInssExtinto.subtitulo.includes('(Rural - Contributivo)');
        registrar(aprovadoWikiInssExtinto, 'MATEMATICA', 'Wiki Forense INSS: identificacao de "Tipo Extinto/Inativo" para especie nao-ativa', {
            obtido: wikiInssExtinto ? wikiInssExtinto.subtitulo : 'falha'
        });

        const wikiInssPontuado = validador.validarNumeroBeneficioINSS('719.657.155-0');
        const aprovadoWikiInssPontuado = wikiInssPontuado &&
            wikiInssPontuado.valido &&
            wikiInssPontuado.ehWiki &&
            wikiInssPontuado.dado === '719.657.155-0' &&
            !wikiInssPontuado.subtitulo.includes('Módulo 11 Válido') &&
            wikiInssPontuado.subtitulo.includes('Benefício da Previdência Social');
        registrar(aprovadoWikiInssPontuado, 'MATEMATICA', 'Wiki Forense INSS: reconhecimento de NB pontuado 719.657.155-0 sem tipo de calculo nos baloes', {
            obtido: wikiInssPontuado ? `${wikiInssPontuado.dado} | ${wikiInssPontuado.subtitulo}` : 'falha'
        });

        const alertaInssPontuado = validador.auditarEAlerta('719.657.155-0', null);
        const aprovadoAlertaInss = alertaInssPontuado &&
            alertaInssPontuado.valido &&
            alertaInssPontuado.ehWiki &&
            alertaInssPontuado.tipo === 'INSS';
        registrar(aprovadoAlertaInss, 'MATEMATICA', 'auditarEAlerta com NB pontuado 719.657.155-0 roteia para Wiki Forense INSS', {
            obtido: alertaInssPontuado ? `${alertaInssPontuado.tipo} (valido=${alertaInssPontuado.valido})` : 'falha'
        });

        const wikiCnj = validador.validarCNJ('1004615-62.2026.4.01.4002');
        const aprovadoWikiCnj = wikiCnj &&
            wikiCnj.valido &&
            wikiCnj.ehWiki &&
            wikiCnj.dado === '1004615-62.2026.4.01.4002' &&
            wikiCnj.subtitulo.includes('Justiça Federal') &&
            wikiCnj.subtitulo.includes('TRF da 1ª Região') &&
            wikiCnj.html.includes('<u') && wikiCnj.html.includes('1004615-62.2026.4.01.4002</u>') &&
            wikiCnj.html.includes('✓</span>');
        registrar(aprovadoWikiCnj, 'MATEMATICA', 'Wiki Forense CNJ: decodificacao de Ramo e Tribunal com dado sublinhado e vezinho sem sublinhado', {
            obtido: wikiCnj ? wikiCnj.subtitulo : 'falha'
        });

        const wikiCpf = validador.validarCPF('352.621.413-15');
        const aprovadoWikiCpf = wikiCpf &&
            wikiCpf.valido &&
            wikiCpf.ehWiki &&
            wikiCpf.dado === '352.621.413-15' &&
            wikiCpf.subtitulo.includes('3ª Região Fiscal da RFB (CE, MA, PI)') &&
            wikiCpf.html.includes('<u') && wikiCpf.html.includes('352.621.413-15</u>') &&
            wikiCpf.html.includes('✓</span>');
        registrar(aprovadoWikiCpf, 'MATEMATICA', 'Wiki Forense CPF: decodificacao da Regiao Fiscal da RFB a partir do 9º digito', {
            obtido: wikiCpf ? wikiCpf.subtitulo : 'falha'
        });

        const wikiCnpjMatriz = validador.validarCNPJ('29.979.036/0001-40');
        const wikiCnpjFilial = validador.validarCNPJ('00.000.000/0002-72');
        const aprovadoWikiCnpj = wikiCnpjMatriz &&
            wikiCnpjMatriz.ehMatriz &&
            wikiCnpjMatriz.dado === '29.979.036/0001-40' &&
            wikiCnpjFilial &&
            !wikiCnpjFilial.ehMatriz &&
            wikiCnpjFilial.dado === '00.000.000/0002-72' &&
            wikiCnpjFilial.matriz === '00.000.000/0001-91';
        registrar(aprovadoWikiCnpj, 'MATEMATICA', 'Wiki Forense CNPJ: identificacao de Matriz (0001) e calculo automatico de Matriz a partir de Filial', {
            matriz: wikiCnpjMatriz ? wikiCnpjMatriz.subtitulo : 'falha',
            filial: wikiCnpjFilial ? wikiCnpjFilial.subtitulo : 'falha'
        });

        const wikiDataDiaUtil = validador.validarData('11/09/2026'); // 11/09/2026 e Sexta-feira
        const aprovadoWikiDataDiaUtil = wikiDataDiaUtil &&
            wikiDataDiaUtil.valido &&
            wikiDataDiaUtil.ehWiki &&
            wikiDataDiaUtil.dado === '11/09/2026' &&
            wikiDataDiaUtil.diaSemana === 'Sexta-feira' &&
            wikiDataDiaUtil.tituloDoc === 'Sexta-feira' &&
            wikiDataDiaUtil.ehFimDeSemana === false &&
            wikiDataDiaUtil.ehDiaUtil === true &&
            wikiDataDiaUtil.subtitulo.includes('Sexta-feira (Dia Útil)') &&
            wikiDataDiaUtil.html.includes('Sexta-feira') &&
            wikiDataDiaUtil.html.includes('<u') && wikiDataDiaUtil.html.includes('11/09/2026</u>') &&
            wikiDataDiaUtil.html.includes('✓</span>');
        registrar(aprovadoWikiDataDiaUtil, 'MATEMATICA', 'Wiki Forense Data: decodificacao de Sexta-feira no titulo e Dia Util (cor verde padrao)', {
            obtido: wikiDataDiaUtil ? `${wikiDataDiaUtil.tituloDoc} | ${wikiDataDiaUtil.subtitulo}` : 'falha'
        });

        const wikiDataFimDeSemana = validador.validarData('12/09/2026'); // 12/09/2026 e Sabado
        const aprovadoWikiDataFimDeSemana = wikiDataFimDeSemana &&
            wikiDataFimDeSemana.valido &&
            wikiDataFimDeSemana.ehWiki &&
            wikiDataFimDeSemana.dado === '12/09/2026' &&
            wikiDataFimDeSemana.diaSemana === 'Sábado' &&
            wikiDataFimDeSemana.tituloDoc === 'Sábado' &&
            wikiDataFimDeSemana.ehFimDeSemana === true &&
            wikiDataFimDeSemana.ehDiaUtil === false &&
            wikiDataFimDeSemana.subtitulo.includes('Sábado (Final de Semana)') &&
            wikiDataFimDeSemana.html.includes('Sábado') &&
            wikiDataFimDeSemana.html.includes('<u') && wikiDataFimDeSemana.html.includes('12/09/2026</u>') &&
            wikiDataFimDeSemana.html.includes('✓</span>');
        registrar(aprovadoWikiDataFimDeSemana, 'MATEMATICA', 'Wiki Forense Data: decodificacao de Sabado no titulo e Final de Semana (cor azul ceu)', {
            obtido: wikiDataFimDeSemana ? `${wikiDataFimDeSemana.tituloDoc} | ${wikiDataFimDeSemana.subtitulo}` : 'falha'
        });

        const alertaDataHora = validador.auditarEAlerta('28/10/2026 06:28', null); // 28/10/2026 e Quarta-feira
        const aprovadoAlertaDataHora = alertaDataHora &&
            alertaDataHora.valido &&
            alertaDataHora.ehWiki &&
            alertaDataHora.dado === '28/10/2026 06:28' &&
            alertaDataHora.diaSemana === 'Quarta-feira' &&
            alertaDataHora.tituloDoc === 'Quarta-feira' &&
            alertaDataHora.subtitulo.includes('Quarta-feira (Dia Útil)') &&
            alertaDataHora.subtitulo.includes('06:28') &&
            alertaDataHora.html.includes('Quarta-feira') &&
            alertaDataHora.html.includes('<u') && alertaDataHora.html.includes('28/10/2026 06:28</u>') &&
            alertaDataHora.html.includes('✓</span>');
        registrar(aprovadoAlertaDataHora, 'MATEMATICA', 'Wiki Forense Data com Horario: composicao de Dia da Semana no titulo e Horario nos metadados', {
            obtido: alertaDataHora ? `${alertaDataHora.tituloDoc} | ${alertaDataHora.subtitulo}` : 'falha'
        });

        const wikiDataExtComposta = validador.validarData('23 de outubro de 2026 as 21:38:42 BRT'); // 23/10/2026 e Sexta-feira
        const aprovadoDataExtComposta = wikiDataExtComposta &&
            wikiDataExtComposta.valido &&
            wikiDataExtComposta.ehWiki &&
            wikiDataExtComposta.diaSemana === 'Sexta-feira' &&
            wikiDataExtComposta.tituloDoc === 'Sexta-feira' &&
            wikiDataExtComposta.ehFimDeSemana === false &&
            wikiDataExtComposta.subtitulo.includes('Sexta-feira (Dia Útil)') &&
            wikiDataExtComposta.subtitulo.includes('21:38:42') &&
            wikiDataExtComposta.html.includes('Sexta-feira') &&
            wikiDataExtComposta.html.includes('✓</span>');
        registrar(aprovadoDataExtComposta, 'MATEMATICA', 'Wiki Forense Data Extensa Composta com Horario: deteccao de dia da semana no titulo e horario integrado', {
            obtido: wikiDataExtComposta ? `${wikiDataExtComposta.tituloDoc} | ${wikiDataExtComposta.subtitulo}` : 'falha'
        });

        const wikiDataIso = validador.auditarEAlerta('2026-11-04', null); // 04/11/2026 e Quarta-feira
        const aprovadoDataIso = wikiDataIso &&
            wikiDataIso.valido &&
            wikiDataIso.ehWiki &&
            wikiDataIso.diaSemana === 'Quarta-feira' &&
            wikiDataIso.tituloDoc === 'Quarta-feira' &&
            wikiDataIso.ehFimDeSemana === false &&
            wikiDataIso.html.includes('Quarta-feira') &&
            wikiDataIso.html.includes('04/11/2026') &&
            wikiDataIso.html.includes('✓</span>');
        registrar(aprovadoDataIso, 'MATEMATICA', 'Wiki Forense Data Formato ISO (AAAA-MM-DD): decodificacao de Quarta-feira no titulo e Dia Util', {
            obtido: wikiDataIso ? `${wikiDataIso.tituloDoc} | ${wikiDataIso.subtitulo}` : 'falha'
        });

        /* Testes FEAT-03: Validacao Matematica Generica Fallback em Balao Cinza (Diretriz 6.42) */
        const genericoMod11 = validador.auditarEAlerta('1300802143', null);
        const aprovadoGenericoMod11 = Boolean(
            genericoMod11 &&
            genericoMod11.valido &&
            genericoMod11.ehWiki &&
            genericoMod11.ehGenericoCinza &&
            genericoMod11.html.includes('[Mod11]:') &&
            genericoMod11.html.includes('1300802143') &&
            genericoMod11.html.includes('✓</span>')
        );
        registrar(aprovadoGenericoMod11, 'MATEMATICA', 'Validacao Generica Fallback FEAT-03: numero puro sem contexto validado via Mod11 em cartao cinza neutro', {
            obtido: genericoMod11 ? genericoMod11.msg : 'falha'
        });

        const genericoInvalidoSilencioso = validador.auditarEAlerta('1300802149', null);
        const aprovadoGenericoSilencioso = Boolean(
            genericoInvalidoSilencioso &&
            genericoInvalidoSilencioso.valido &&
            !genericoInvalidoSilencioso.ehWiki &&
            !genericoInvalidoSilencioso.html
        );
        registrar(aprovadoGenericoSilencioso, 'MATEMATICA', 'Validacao Generica Fallback FEAT-03: numero nao-identificado invalido permanece 100% silencioso (zero popups)', {
            obtido: genericoInvalidoSilencioso ? `valido=${genericoInvalidoSilencioso.valido}, ehWiki=${Boolean(genericoInvalidoSilencioso.ehWiki)}` : 'falha'
        });

        const genericoMod97 = validador.auditarEAlerta('09912345520244014002', null);
        const aprovadoGenericoMod97 = Boolean(
            genericoMod97 &&
            genericoMod97.valido &&
            genericoMod97.ehWiki &&
            genericoMod97.ehGenericoCinza &&
            genericoMod97.html.includes('[Mod97]:') &&
            genericoMod97.html.includes('✓</span>')
        );
        registrar(aprovadoGenericoMod97, 'MATEMATICA', 'Validacao Generica Fallback FEAT-03: numero CNJ sem mascara validado via Mod97 em cartao cinza neutro', {
            obtido: genericoMod97 ? genericoMod97.msg : 'falha'
        });

        /* Testes Anti-Falso-Positivo BUG-05 (Rejeicao de Alfanumericos e Sequencias Curtas em Mod10) */
        const genericoAlfanumSilencioso = validador.auditarEAlerta('RTL2832U', null);
        const aprovadoAlfanumSilencioso = Boolean(
            genericoAlfanumSilencioso &&
            genericoAlfanumSilencioso.valido &&
            !genericoAlfanumSilencioso.ehWiki &&
            !genericoAlfanumSilencioso.html
        );
        registrar(aprovadoAlfanumSilencioso, 'MATEMATICA', 'Validacao Generica Anti-Falso-Positivo BUG-05: string alfanumerica com letras (ex: RTL2832U) permanece 100% silenciosa sem popup de Mod10', {
            obtido: genericoAlfanumSilencioso ? `valido=${genericoAlfanumSilencioso.valido}, ehWiki=${Boolean(genericoAlfanumSilencioso.ehWiki)}` : 'falha'
        });

        const genericoCurtoSilencioso = validador.auditarEAlerta('2832', null);
        const aprovadoCurtoSilencioso = Boolean(
            genericoCurtoSilencioso &&
            genericoCurtoSilencioso.valido &&
            !genericoCurtoSilencioso.ehWiki &&
            !genericoCurtoSilencioso.html
        );
        registrar(aprovadoCurtoSilencioso, 'MATEMATICA', 'Validacao Generica Anti-Falso-Positivo BUG-05: sequencia pura curta sem hifen (ex: 2832) permanece 100% silenciosa sem popup de Mod10', {
            obtido: genericoCurtoSilencioso ? `valido=${genericoCurtoSilencioso.valido}, ehWiki=${Boolean(genericoCurtoSilencioso.ehWiki)}` : 'falha'
        });

        const fraseAlfanumSilenciosa = validador.auditarEAlerta('Buy RTL-SDR Dongles (RTL2832U)', null);
        const aprovadoFraseSilenciosa = Boolean(
            fraseAlfanumSilenciosa &&
            fraseAlfanumSilenciosa.valido &&
            !fraseAlfanumSilenciosa.ehWiki &&
            !fraseAlfanumSilenciosa.html
        );
        registrar(aprovadoFraseSilenciosa, 'MATEMATICA', 'Validacao Generica Anti-Falso-Positivo BUG-05: frase/titulo completo com modelo (Buy RTL-SDR Dongles (RTL2832U)) permanece 100% silencioso', {
            obtido: fraseAlfanumSilenciosa ? `valido=${fraseAlfanumSilenciosa.valido}, ehWiki=${Boolean(fraseAlfanumSilenciosa.ehWiki)}` : 'falha'
        });

        /* ==================================================================
         * BATERIA 2: COBERTURA COMPLETA DE TODOS OS 13 GRUPOS ROOT DO CATALOGO
         * ================================================================== */
            }

            {
        /* 17) Seção 6.60: Validação de Guias e Tributos Governamentais (DARF, GRU, IPTU FEBRABAN) */
        let secao660TributosOk = false;
        let resDarfValida = null;
        let resDarfInvalida = null;
        let resGruCobranca = null;
        let erro660 = '';
        try {
            // Linha real de 48 dígitos (DARF/GRU Segmento 5, Mod 11)
            const linhaDarfGru = '85800000001-1 45470179261-7 10734260388-8 91040854216-5';
            resDarfValida = validador.validarLinhaArrecadacaoTributos(linhaDarfGru);

            // Linha com DV incorreto no Bloco 1 (esperado 1, informado 9)
            const linhaDarfInvalida = '85800000001-9 45470179261-7 10734260388-8 91040854216-5';
            resDarfInvalida = validador.validarLinhaArrecadacaoTributos(linhaDarfInvalida);

            // GRU Cobrança Bancária (Banco do Brasil - 47 dígitos iniciando em 0019, DV Geral 3)
            const gruCobrancaBB = '00190.00009 01234.567806 00000.000000 3 90000000000000';
            resGruCobranca = validador.validarBoletoBancario(gruCobrancaBB);
            const gruCobrancaDvInvalido = '00190.00009 01234.567806 00000.000000 7 90000000000000';
            const resGruDvInvalido = validador.validarBoletoBancario(gruCobrancaDvInvalido);

            secao660TributosOk = Boolean(
                resDarfValida &&
                resDarfValida.valido === true &&
                resDarfValida.ehWiki === true &&
                resDarfValida.tituloDoc.includes('Federal') &&
                resDarfInvalida &&
                resDarfInvalida.valido === false &&
                resDarfInvalida.motivos &&
                resDarfInvalida.motivos.length > 0 &&
                resGruCobranca &&
                resGruCobranca.valido === true &&
                resGruCobranca.ehWiki === true &&
                resGruCobranca.tituloDoc.includes('GRU Cobrança') &&
                resGruDvInvalido &&
                resGruDvInvalido.valido === false &&
                resGruDvInvalido.motivos &&
                resGruDvInvalido.motivos.some(m => m.includes('Campo 4'))
            );
        } catch (e660) {
            secao660TributosOk = false;
            erro660 = String(e660 && (e660.stack || e660.message || e660));
        }
        registrar(
            secao660TributosOk,
            'SECAO_6_60_VALIDACAO_TRIBUTOS_DARF_GRU_IPTU',
            'Validação algorítmica de linhas digitáveis de 48 dígitos (DARF/GRU/IPTU FEBRABAN) e GRU Cobrança BB de 47 dígitos',
            {
                detalhe: erro660 || `darfVal=${resDarfValida && resDarfValida.valido} (erros=${resDarfValida && resDarfValida.motivos && resDarfValida.motivos.join(';')}), darfInval=${resDarfInvalida && !resDarfInvalida.valido}, gruCobranca=${resGruCobranca && resGruCobranca.valido} (erros=${resGruCobranca && resGruCobranca.motivos && resGruCobranca.motivos.join(';')})`
            }
        );

            }

            {
        /* TESTE BUG-12: Validação Algorítmica do DV Geral Módulo 11 (Posição 33, Campo 4) em Boletos FEBRABAN */
        let bug12DvGeralBoletoOk = false;
        try {
            const boletoDvValido = '00190.00009 01234.567806 00000.000000 3 90000000000000';
            const resValido = validador.validarBoletoBancario(boletoDvValido);

            const boletoDvAdulterado = '00190.00009 01234.567806 00000.000000 8 90000000000000';
            const resInvalido = validador.validarBoletoBancario(boletoDvAdulterado);

            bug12DvGeralBoletoOk = Boolean(
                resValido &&
                resValido.valido === true &&
                resInvalido &&
                resInvalido.valido === false &&
                resInvalido.motivos &&
                resInvalido.motivos.some(m => m.includes('Campo 4'))
            );
        } catch (eBug12) {
            bug12DvGeralBoletoOk = false;
        }
        registrar(
            bug12DvGeralBoletoOk,
            'BUG_12_VALIDACAO_DV_GERAL_MODULO_11_BOLETO',
            'BUG-12 (Seção 6.60): Aferição matemática obrigatória do DV Geral Módulo 11 (Posição 33 / Campo 4) do código de barras de 44 posições reconstruído da linha digitável.'
        );

            }

            {
        /* TESTE SEÇÃO 6.45: Validação Matemática de Benefício INSS (NB) e Protocolo Administrativo (9 Dígitos) */
        let secao645NbEProtocoloOk = false;
        let detalheFalha645 = '';
        try {
            // 1. Validação Matemática Módulo 11 do NB 1300802143 (pesos 2 a 9 da direita para a esquerda: sum=96, resto=8, DV=3)
            const resNb = (validador && typeof validador.validarNumeroBeneficioINSS === 'function')
                ? validador.validarNumeroBeneficioINSS('1300802143')
                : null;
            const nbValido = Boolean(resNb && resNb.valido === true && !resNb.invalido);

            // 2. Reconhecimento de Protocolo Administrativo com 9 dígitos e rótulos
            const cExt = window.JusGovConstantes || {};
            const rxRotulo = (cExt.EXPRESSOES_REGULARES && cExt.EXPRESSOES_REGULARES.PALAVRA_ROTULO_INICIAL) || cExt.PALAVRA_ROTULO_INICIAL;
            const rotuloProtOk = Boolean(rxRotulo && rxRotulo.test('Protocolo') && rxRotulo.test('Prot'));

            const blocoNumero9Ok = motorTeste.isBlocoVerificavel('692364437') === true;
            const blocoRotuladoOk = motorTeste.isBlocoVerificavel('Protocolo Administrativo nº 692364437') === true;
            const blocoProtCurtoOk = motorTeste.isBlocoVerificavel('Prot. 692364437') === true;

            // 3. Expansão atômica de Protocolo Administrativo por clique no rótulo
            const textoAmostra = 'Protocolo Administrativo nº 692364437 / NB 1300802143';
            const idxProt = textoAmostra.indexOf('Protocolo');
            const resCliqueRotulo = motorTeste.simularCliqueEmTexto(textoAmostra, idxProt, 1);
            const expansaoProtOk = Boolean(resCliqueRotulo && resCliqueRotulo.includes('692364437'));

            secao645NbEProtocoloOk = Boolean(
                nbValido &&
                rotuloProtOk &&
                blocoNumero9Ok &&
                blocoRotuladoOk &&
                blocoProtCurtoOk &&
                expansaoProtOk
            );
        } catch (e645) {
            secao645NbEProtocoloOk = false;
        }
        registrar(
            secao645NbEProtocoloOk,
            'SECAO_6_45_VALIDACAO_NB_E_PROTOCOLO_ADMINISTRATIVO',
            'Seção 6.45: Validação matemática do Benefício INSS (NB) via Módulo 11 e reconhecimento estruturado de Protocolos Administrativos com 9 dígitos e rótulos.'
        );

            }

            {
        /* TESTE SEÇÃO 6.99: Validação de Datas de Bugs Técnicos (1869/1999/Epoch), Detecção de Data Futura com Sufixo e Ausência de JFPR */
        let secao699DatasBugsEFuturasOk = false;
        let erroSecao699 = '';
        try {
            // 1. Datas de bugs técnicos clássicos
            const res1869 = validador.validarData('31/12/1869'); // limite histórico pré-1870
            const res1999 = validador.validarData('31/12/1999'); // virada de milênio Y2K
            const resEpoch = validador.validarData('01/01/1970'); // Unix Epoch 0
            const res9999 = validador.validarData('09/09/1999'); // marco 9/9/99

            const bugsTecnicosOk = Boolean(
                res1869 && res1869.valido && res1869.ehDiaUtil && res1869.ehDataFutura === false && !res1869.subtitulo.includes('Data Futura') &&
                res1999 && res1999.valido && res1999.ehDiaUtil && res1999.ehDataFutura === false && !res1999.subtitulo.includes('Data Futura') &&
                resEpoch && resEpoch.valido && resEpoch.ehDiaUtil && resEpoch.ehDataFutura === false && !resEpoch.subtitulo.includes('Data Futura') &&
                res9999 && res9999.valido && res9999.ehDiaUtil && res9999.ehDataFutura === false && !res9999.subtitulo.includes('Data Futura')
            );

            // 2. Data Futura gerada dinamicamente (ano atual + 1)
            const anoFuturo = (new Date()).getFullYear() + 1;
            const dataFuturaDiaUtilStr = `18/06/${anoFuturo}`;
            const resFutura = validador.validarData(dataFuturaDiaUtilStr);

            const dataFuturaOk = Boolean(
                resFutura &&
                resFutura.valido &&
                resFutura.ehDataFutura === true &&
                resFutura.subtitulo.includes('(Dia Útil - Data Futura)')
            );

            // 3. Data Futura com horário
            const dataHoraFutura = validador.auditarEAlerta(`18/06/${anoFuturo} 14:30`, null);
            const dataHoraFuturaOk = Boolean(
                dataHoraFutura &&
                dataHoraFutura.valido &&
                dataHoraFutura.detalhes &&
                dataHoraFutura.detalhes.ehDataFutura === true &&
                dataHoraFutura.subtitulo.includes('(Dia Útil - Data Futura)')
            );

            // 4. Data no passado não deve conter o sufixo "Data Futura"
            const dataPassada = validador.validarData('11/09/2026');
            const dataPassadaOk = Boolean(
                dataPassada &&
                dataPassada.valido &&
                dataPassada.ehDataFutura === false &&
                !dataPassada.subtitulo.includes('Data Futura') &&
                dataPassada.subtitulo.includes('(Dia Útil)')
            );

            // 5. Exclusão categórica de "JFPR" no catálogo de exemplos homologados (apenas TRF1)
            let catalogoSemJfpr = true;
            if (typeof CATALOGO_EXEMPLOS_JUSGOVBR !== 'undefined' && CATALOGO_EXEMPLOS_JUSGOVBR.casosDeUso) {
                const strCatalogo = JSON.stringify(CATALOGO_EXEMPLOS_JUSGOVBR);
                catalogoSemJfpr = !strCatalogo.includes('JFPR') && !strCatalogo.includes('.4.04.7002');
            }

            secao699DatasBugsEFuturasOk = Boolean(
                bugsTecnicosOk &&
                dataFuturaOk &&
                dataHoraFuturaOk &&
                dataPassadaOk &&
                catalogoSemJfpr
            );
        } catch (e699) {
            erroSecao699 = e699.message || String(e699);
            secao699DatasBugsEFuturasOk = false;
        }
        registrar(
            secao699DatasBugsEFuturasOk,
            'SECAO_6_99_DATAS_BUGS_TECNICOS_E_FUTURAS_TRF1',
            'Seção 6.99 (PRIV-01 / LGPD): Homologação de datas de bugs técnicos (1869/1999/1970), marcação determinística de Data Futura com sufixo "(Dia Útil - Data Futura)" e eliminação estrita de referências a JFPR (paridade TRF1).',
            { detalhe: erroSecao699 }
        );

            }

            {
        /* ==================================================================
         * BATERIA 13: FUZZING MUTACIONAL E RESISTÊNCIA A MUTANTES DE DV (MUTATION TESTING +1/-1)
         * Diretriz de Verificação Dupla (Paridade Correto -> Mutado):
         * 1) Gera números matematicamente válidos (com DV real) e valida -> testando se o correto é correto (valido: true).
         * 2) Com o MESMO número validado, altera 1 caractere em posição aleatória (±1) -> testando se o mutado é incorreto (valido: false).
         * Total: 10 testes de números corretos + 10 testes de mutantes = 20 testes por categoria (140 testes no total da bateria).
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 13: FUZZING MUTACIONAL E RESISTÊNCIA A MUTANTES DE DV (MUTATION TESTING ±1 A ±5 NO CORPO) ---');

        const NUM_ITERACOES_MUTACAO = 10;

        /* 1) Mutação Estrita de CPF (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarCpfValido();
            const resOrig = validador.validarCPF(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_CPF',
                `CPF Correto Original #${i}: [${original}] deve ser VÁLIDO`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutado = mutarDigitoParaInvalido(original, s => validador.validarCPF(s), { qtdDvsFinais: 2 });
            const resMut = validador.validarCPF(mutado);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_CPF',
                `CPF Mutante ±1 a ±5 #${i}: [${mutado}] deve ser INVÁLIDO`,
                {
                    textoTestado: mutado,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* 2) Mutação Estrita de CNPJ Tradicional (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarCnpjTradicionalValido();
            const resOrig = validador.validarCNPJ(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_CNPJ_TRADICIONAL',
                `CNPJ Tradicional Correto Original #${i}: [${original}] deve ser VÁLIDO`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutado = mutarDigitoParaInvalido(original, s => validador.validarCNPJ(s), { qtdDvsFinais: 2 });
            const resMut = validador.validarCNPJ(mutado);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_CNPJ_TRADICIONAL',
                `CNPJ Tradicional Mutante ±1 a ±5 #${i}: [${mutado}] deve ser INVÁLIDO`,
                {
                    textoTestado: mutado,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* 3) Mutação Estrita de Novo CNPJ Alfanumérico (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarCnpjAlfanumericoValido();
            const resOrig = validador.validarCNPJ(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_CNPJ_ALFANUMERICO',
                `Novo CNPJ Alfanumérico Correto Original #${i}: [${original}] deve ser VÁLIDO`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutado = mutarDigitoParaInvalido(original, s => validador.validarCNPJ(s), { qtdDvsFinais: 2 });
            const resMut = validador.validarCNPJ(mutado);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_CNPJ_ALFANUMERICO',
                `Novo CNPJ Alfanumérico Mutante ±1 a ±5 #${i}: [${mutado}] deve ser INVÁLIDO`,
                {
                    textoTestado: mutado,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* 4) Mutação Estrita de Processo Judicial CNJ Módulo 97 (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarCnjValido();
            const resOrig = validador.validarCNJ(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_CNJ_MODULO_97',
                `Processo CNJ Módulo 97 Correto Original #${i}: [${original}] deve ser VÁLIDO`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutado = mutarDigitoParaInvalido(original, s => validador.validarCNJ(s), { ehCnj: true });
            const resMut = validador.validarCNJ(mutado);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_CNJ_MODULO_97',
                `Processo CNJ Módulo 97 Mutante ±1 a ±5 #${i}: [${mutado}] deve ser INVÁLIDO`,
                {
                    textoTestado: mutado,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* 5) Mutação Estrita de Benefício INSS NB Módulo 11 (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarInssNbValido();
            const resOrig = validador.validarNumeroBeneficioINSS(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_INSS_NB_MODULO_11',
                `Benefício INSS NB Correto Original #${i}: [${original}] deve ser VÁLIDO`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutado = mutarDigitoParaInvalido(original, s => validador.validarNumeroBeneficioINSS(s), { qtdDvsFinais: 1 });
            const resMut = validador.validarNumeroBeneficioINSS(mutado);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_INSS_NB_MODULO_11',
                `Benefício INSS NB Mutante ±1 a ±5 #${i}: [${mutado}] deve ser INVÁLIDO`,
                {
                    textoTestado: mutado,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* 6) Mutação Estrita de Inscrição PIS/PASEP/NIT Módulo 11 (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarPisValido();
            const resOrig = validador.validarPIS(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_PIS_MODULO_11',
                `PIS/PASEP Correto Original #${i}: [${original}] deve ser VÁLIDO`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutado = mutarDigitoParaInvalido(original, s => validador.validarPIS(s), { qtdDvsFinais: 1 });
            const resMut = validador.validarPIS(mutado);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_PIS_MODULO_11',
                `PIS/PASEP Mutante ±1 a ±5 #${i}: [${mutado}] deve ser INVÁLIDO`,
                {
                    textoTestado: mutado,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* 7) Mutação Estrita de Datas e Bissextos (10 originais válidos + 10 mutantes inválidos = 20 testes) */
        for (let i = 1; i <= NUM_ITERACOES_MUTACAO; i++) {
            const original = gerarDataValida(i % 3 === 0);
            const resOrig = validador.validarData(original);
            registrar(
                Boolean(resOrig && resOrig.valido === true),
                'ORIGINAL_DATAS_BISSEXTO',
                `Data Correta Original #${i}: [${original}] deve ser VÁLIDA`,
                {
                    textoTestado: original,
                    esperado: 'valido=true',
                    obtido: `valido=${resOrig ? resOrig.valido : false}`
                }
            );

            const mutada = mutarDataParaInvalida(original);
            const resMut = validador.validarData(mutada);
            registrar(
                Boolean(resMut && resMut.valido === false),
                'MUTACAO_DATAS_BISSEXTO',
                `Data Mutante de Fronteira #${i}: [${mutada}] deve ser INVÁLIDA`,
                {
                    textoTestado: mutada,
                    esperado: 'valido=false',
                    obtido: `valido=${resMut ? resMut.valido : true}`
                }
            );
        }

        /* ==================================================================
         * BATERIA 14: FUZZING DE ROBUSTEZ E ESTRESSE DE ENTRADAS
         * Executa testes estocásticos de robustez e estresse de fronteira:
         * Limites de cursor, URLs/domínios, formatador multi-MIME, conversores HTML<->MD,
         * máscaras de entrada e listas turbo.
         * ================================================================== */
            }
        }
    }

    Object.freeze(DebugVerificadores.prototype);
    return Object.freeze(DebugVerificadores);
}));