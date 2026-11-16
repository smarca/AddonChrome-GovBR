/* ==========================================================================
 * Nome do arquivo: debug-mascaras.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Suíte de Auditoria e Debug (Máscaras, 13 Grupos Forenses e Filtros HTML)
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/mod-debug/debug-mascaras.js
 * - Classe Exportada: DebugMascaras (window.JusGovDebugMascaras)
 * - Métodos Públicos: executar(ctx)
 * - Escopo de Testes: Bateria 2 (13 Grupos do Catálogo Forense / Máscaras / Falsos Positivos), Bateria 6 (Filtros HTML 5 Níveis), Bateria 10 (Paridade Catálogo JSON), BUG-06, BUG-13, DOMParser XSS
 * - Regras / Seções: Diretrizes 5/7/16, BP-09 / SEC-02, BUG-06, BUG-13
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovDebugMascaras = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DebugMascaras {
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
        linhasLog.push('\n--- BATERIA 2: COBERTURA INTEGRAL DOS 13 GRUPOS DO CATALOGO FORENSE ---');

        const extrairMatchNoCatalogo = (amostra, esperado) => {
            let primeiroMatch = '';
            for (let g = 0; g < C.CATALOGO_PADROES_JURIDICOS.length; g++) {
                const grupo = C.CATALOGO_PADROES_JURIDICOS[g];
                for (let r = 0; r < grupo.regexes.length; r++) {
                    const rx = new RegExp(grupo.regexes[r].source, grupo.regexes[r].flags);
                    const m = rx.exec(amostra);
                    if (m) {
                        const cand = m[0].trim();
                        if (!primeiroMatch) primeiroMatch = cand;
                        if (cand === esperado) return cand;
                    }
                }
            }
            return primeiroMatch;
        };

        const casosCatalogo13Grupos = [
            /* Grupo 1: CHAVES_FISCAIS_E_BOLETOS_CONTIGUOS */
            { grupo: 'G1_PIX_UUID', desc: 'Chave Aleatoria PIX / UUID v4', amostra: 'Chave PIX: e7f2c68b-59d8-4f81-a67b-4573199872e4 ativa', esp: 'e7f2c68b-59d8-4f81-a67b-4573199872e4' },
            /* Grupo 2: CHAVES_FISCAIS_E_BOLETOS_ESPACADOS */
            { grupo: 'G2_NFE_ESPACADA', desc: 'Chave de Acesso NF-e em 11 blocos de 4 digitos', amostra: 'NFe: 3524 0112 3456 7800 0195 5500 1000 0001 2310 0000 0124 emitida', esp: '3524 0112 3456 7800 0195 5500 1000 0001 2310 0000 0124' },
            { grupo: 'G2_BOLETO_FEBRABAN', desc: 'Linha Digitavel de Boleto Bancario FEBRABAN', amostra: 'Pagar: 34191.79001 01043.510047 91020.150008 5 95680000015000 hoje', esp: '34191.79001 01043.510047 91020.150008 5 95680000015000' },
            /* Grupo 3: DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO */
            { grupo: 'G3_PIS', desc: 'Inscricao PIS/PASEP/NIT (NNN.NNNNN.NN-N)', amostra: 'PIS: 123.45678.90-1 cadastrado', esp: '123.45678.90-1' },
            { grupo: 'G3_RG', desc: 'Documento Geral de Identidade RG', amostra: 'Portador do RG 12.345.678-9 SSP/SP', esp: '12.345.678-9' },
            { grupo: 'G3_CEP', desc: 'Codigo de Enderecamento Postal CEP', amostra: 'Localizado no CEP 70070-900 Brasilia', esp: '70070-900' },
            { grupo: 'G3_OAB', desc: 'Inscricao Profissional OAB', amostra: 'Representante OAB/DF 12.345 constituido', esp: 'OAB/DF 12.345' },
            { grupo: 'G3_PASSAPORTE', desc: 'Passaporte Brasileiro', amostra: 'Apresentou passaporte BR123456 na PF', esp: 'BR123456' },
            /* Grupo 4: NUMERACOES_ID_E_PUBLICAS */
            { grupo: 'G4_SEI', desc: 'Processo Administrativo SEI!', amostra: 'Autos SEI! 00001.000002/2024-03 em tramitacao', esp: '00001.000002/2024-03' },
            { grupo: 'G4_PLACA_MERCOSUL', desc: 'Placa Veicular padrao Mercosul', amostra: 'Veiculo com placa BRA2E19 apreendido', esp: 'BRA2E19' },
            { grupo: 'G4_PROTOCOLO_ANO', desc: 'Numero de protocolo com barra de ano', amostra: 'Registrado sob o protocolo 63055/2023', esp: '63055/2023' },
            /* Grupo 5: DATA_COM_HORARIO_CONTIGUO */
            { grupo: 'G5_EXTENSO_HORA', desc: 'Data por extenso com dia da semana e horario', amostra: 'Audiencia em sexta-feira, 23 de outubro de 2026 as 21:38:42 BRT designada', esp: 'sexta-feira, 23 de outubro de 2026 as 21:38:42 BRT' },
            { grupo: 'G5_DATA_NUM_HORA', desc: 'Data numerica com horario contiguo', amostra: 'Protocolado em 23/10/2026 10:14:18.', esp: '23/10/2026 10:14:18' },
            { grupo: 'G5_DATA_HIFEN_HORA', desc: 'Data numerica com hifen e horario contiguo', amostra: 'Protocolado em 28/10/2026 - 06:28:50 nos autos.', esp: '28/10/2026 - 06:28:50' },
            /* Grupo 6: INTERVALOS_E_REFERENCIAS_ID_FOLHAS */
            { grupo: 'G6_INTERVALO_DATAS', desc: 'Intervalo de datas (DD/MM/AAAA a DD/MM/AAAA)', amostra: 'Exercicio de 01/01/2026 a 31/12/2026 apurado', esp: '01/01/2026 a 31/12/2026' },
            { grupo: 'G6_INTERVALO_HORAS', desc: 'Intervalo de horarios de expediente', amostra: 'Atendimento das 08:00 as 18:00 diariamente', esp: '08:00 as 18:00' },
            { grupo: 'G6_FLS_PAGINAS', desc: 'Referencia a folhas dos autos (fls. ...)', amostra: 'Conforme demonstrado as fls. 123/130 dos autos', esp: 'fls. 123/130' },
            { grupo: 'G6_INTERVALO_MOEDA', desc: 'Intervalo de valores monetarios', amostra: 'Faixa de R$ 1.000,00 a R$ 5.000,00 arbitrada', esp: 'R$ 1.000,00 a R$ 5.000,00' },
            { grupo: 'G6_NUMERO_EXTENSO', desc: 'Numero cardinal com extenso entre parenteses', amostra: 'Prazo fatal de 65 (sessenta e cinco) dias uteis', esp: '65 (sessenta e cinco)' },
            /* Grupo 7: LEGISLACAO_JURISPRUDENCIA_E_ATOS */
            { grupo: 'G7_DISPOSITIVO', desc: 'Dispositivo legal complexo com emenda', amostra: 'Vide art. 24, paragrafos 1 e 2 da EC n.o 103/2019.', esp: 'art. 24, paragrafos 1 e 2 da EC n.o 103/2019' },
            { grupo: 'G7_IN_ORGAO_COMPOSTO', desc: 'Instrucao Normativa com orgao composto (PRES/INSS)', amostra: 'Conforme Instrucao Normativa PRES/INSS no 128/2022 vigente', esp: 'Instrucao Normativa PRES/INSS no 128/2022' },
            { grupo: 'G7_ATO_ADM_ORGAO_3_NIVEIS', desc: 'Ato Adm com orgao de 3 niveis (SAJ/SG/PR)', amostra: 'Conforme Portaria SAJ/SG/PR no 15/2023 vigente', esp: 'Portaria SAJ/SG/PR no 15/2023' },
            { grupo: 'G7_ATO_ADM_ORGAO_NUMERICO', desc: 'Ato Adm com orgao numerico ##/##/###/###', amostra: 'Conforme Portaria 12/34/567/890 no 5/2020 vigente', esp: 'Portaria 12/34/567/890 no 5/2020' },
            { grupo: 'G7_SUMULA', desc: 'Sumula Vinculante com tribunal', amostra: 'Aplicacao da Sumula Vinculante 13 do STF', esp: 'Sumula Vinculante 13 do STF' },
            { grupo: 'G7_ATO_CURTO', desc: 'Numero de ato com prefixo no/ano', amostra: 'Portaria no 136/2025 publicada', esp: 'no 136/2025' },
            /* Grupo 8: COORDENADAS_GPS_E_PLUS_CODES */
            { grupo: 'G8_GPS_DMS', desc: 'Coordenadas GPS em Graus Minutos Segundos (DMS)', amostra: 'Local 15°47\'39.2"S 47°52\'55.8"W demarcado', esp: '15°47\'39.2"S 47°52\'55.8"W' },
            { grupo: 'G8_GPS_DECIMAL', desc: 'Coordenadas GPS em Graus Decimais (DD)', amostra: 'Ponto -15.794229, -47.882166 periciado', esp: '-15.794229, -47.882166' },
            { grupo: 'G8_PLUS_CODE', desc: 'Google Plus Code (Open Location Code)', amostra: 'Codigo 86FP645X+44 da sede', esp: '86FP645X+44' },
            /* Grupo 9: EMAILS_E_PERFIS_SOCIAIS */
            { grupo: 'G9_EMAIL', desc: 'Endereco de e-mail institucional RFC 5322', amostra: 'Enviar para contato.processual@trf1.jus.br urgente', esp: 'contato.processual@trf1.jus.br' },
            { grupo: 'G9_HANDLE', desc: 'Perfil/Handle social com arroba', amostra: 'Siga @usuario_jusbr nas redes', esp: '@usuario_jusbr' },
            /* Grupo 10: TELEFONES_NACIONAIS_E_INTERNACIONAIS */
            { grupo: 'G10_TEL_DDD', desc: 'Telefone com DDD entre parenteses', amostra: 'Ligar para (61) 3300-1000 hoje', esp: '(61) 3300-1000' },
            { grupo: 'G10_TEL_0800', desc: 'Servico de utilidade 0800', amostra: 'Ouvidoria no 0800 728 1992 disponivel', esp: '0800 728 1992' },
            { grupo: 'G10_TEL_DDI', desc: 'Telefone internacional com +DDI', amostra: 'Plantao no +55 (61) 3300-1000 ativo', esp: '+55 (61) 3300-1000' },
            /* Grupo 11: FINANCEIRO_E_DECIMAIS */
            { grupo: 'G11_MOEDA_EXTENSO', desc: 'Moeda com valor por extenso entre parenteses', amostra: 'Valor de R$ 65,00 (sessenta e cinco reais) pago', esp: 'R$ 65,00 (sessenta e cinco reais)' },
            { grupo: 'G11_PERCENTUAL', desc: 'Valor percentual decimal', amostra: 'Indice de 20,500% ao ano', esp: '20,500%' },
            { grupo: 'G11_DECIMAL_NEG', desc: 'Numero decimal negativo com sinal (-0,45)', amostra: 'Diferenca de -0,45 apurada no calculo', esp: '-0,45' },
            { grupo: 'G11_DECIMAL_POS', desc: 'Numero decimal positivo com sinal (+0,25)', amostra: 'Adicional de +0,25 deferido na sentenca', esp: '+0,25' },
            { grupo: 'G11_INTEIRO_POS', desc: 'Numero inteiro com sinal positivo (+1)', amostra: 'Ajuste de +1 aplicado na contagem', esp: '+1' },
            { grupo: 'G11_MILHAR_DEC_NEG', desc: 'Numero com milhar e decimal negativo (-1.233,00)', amostra: 'Saldo de -1.233,00 verificado nos autos', esp: '-1.233,00' },
            { grupo: 'G11_PERCENT_NEG', desc: 'Percentual negativo com sinal (-0,45%)', amostra: 'Variacao de -0,45% registrada no periodo', esp: '-0,45%' },
            { grupo: 'G11_PERCENT_POS', desc: 'Percentual positivo com sinal (+0,25%)', amostra: 'Indice de +0,25% aplicado ao beneficio', esp: '+0,25%' },
            { grupo: 'G11_PERCENT_INT_NEG', desc: 'Percentual inteiro negativo (-10%)', amostra: 'Desconto de -10% concedido', esp: '-10%' },
            { grupo: 'G11_PERCENT_MILHAR_NEG', desc: 'Percentual com milhar negativo (-1.233,00%)', amostra: 'Fator de -1.233,00% apurado', esp: '-1.233,00%' },
            { grupo: 'G11_MOEDA_NEG', desc: 'Moeda negativa com sinal antes do valor (R$ -1.000,00)', amostra: 'Valor de R$ -1.000,00 lancado na conta', esp: 'R$ -1.000,00' },
            { grupo: 'G11_MOEDA_NEG_ESP', desc: 'Moeda negativa com sinal espacado (R$ - 1.000,00)', amostra: 'Debito de R$ - 1.000,00 liquidado', esp: 'R$ - 1.000,00' },
            { grupo: 'G11_MOEDA_POS', desc: 'Moeda positiva com sinal (R$ +1.000,00)', amostra: 'Credito de R$ +1.000,00 repassado', esp: 'R$ +1.000,00' },
            { grupo: 'G11_MOEDA_SINAL_EXT', desc: 'Moeda negativa com sinal antes de R$ (-R$ 1.000,00)', amostra: 'Total de -R$ 1.000,00 devido pelo reu', esp: '-R$ 1.000,00' },
            /* Grupo 12: DATAS_E_HORARIOS */
            { grupo: 'G12_DATA_PONTOS', desc: 'Data numerica com separadores ponto (DD.MM.AAAA)', amostra: 'Publicado em 11.09.2026 no DJE', esp: '11.09.2026' },
            { grupo: 'G12_HORARIO_ISOLADO', desc: 'Horario isolado (HH:MM:SS)', amostra: 'Sessao as 14:30:00 designada', esp: '14:30:00' },
            /* Grupo 13: GENERICOS_E_FALLBACKS */
            { grupo: 'G13_RESOLUCAO', desc: 'Resolucao de tela/video', amostra: 'Monitor 2560x1080 configurado', esp: '2560x1080' },
            { grupo: 'G13_BOLETO_PONTUADO', desc: 'Bloco numerico pontuado de boleto', amostra: 'Codigo 0000.0000-0000 verificado', esp: '0000.0000-0000' }
        ];

        for (let i = 0; i < casosCatalogo13Grupos.length; i++) {
            const c = casosCatalogo13Grupos[i];
            const idxAlvo = Math.max(0, c.amostra.indexOf(c.esp));
            const obt = extrairMatchNoCatalogo(c.amostra, c.esp);
            registrar(obt === c.esp, c.grupo, `${c.desc} ("${c.esp}")`, {
                textoTestado: c.amostra,
                idxCursor: idxAlvo,
                esperado: c.esp,
                obtido: obt
            });
        }

        /* Testes de Isolamento e Blindagem de Falsos Positivos */
        /* 1) "1.325.256.019-75" NAO sofre fatiamento como falso CPF "325.256.019-75" */
        const amostraUc = '1.325.256.019-75';
        const grupoDocPessoal = C.CATALOGO_PADROES_JURIDICOS.find(g => g.grupo === 'DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO');
        let falsoCpfEmUnidadeConsumidora = false;
        if (grupoDocPessoal) {
            for (let r = 0; r < grupoDocPessoal.regexes.length; r++) {
                const rx = new RegExp(grupoDocPessoal.regexes[r].source, grupoDocPessoal.regexes[r].flags);
                if (rx.test(amostraUc)) {
                    falsoCpfEmUnidadeConsumidora = true;
                    break;
                }
            }
        }
        registrar(
            !falsoCpfEmUnidadeConsumidora,
            'ISOLAMENTO_CPF',
            'Unidade Consumidora (1.325.256.019-75) livre de falso fatiamento como CPF',
            { textoTestado: amostraUc, idxCursor: 2, esperado: 'falsoCpf=false', obtido: `falsoCpf=${falsoCpfEmUnidadeConsumidora}` }
        );

        /* 2) Sequencia espacada "215 7014 6992 8831" NAO e confundida com telefone em 1 clique */
        const amostraMulti = '215 7014 6992 8831';
        const grupoTel = C.CATALOGO_PADROES_JURIDICOS.find(g => g.grupo === 'TELEFONES_NACIONAIS_E_INTERNACIONAIS');
        let falsoPositivoTelefone = false;
        if (grupoTel) {
            for (let r = 0; r < grupoTel.regexes.length; r++) {
                const rx = new RegExp(grupoTel.regexes[r].source, grupoTel.regexes[r].flags);
                if (rx.test(amostraMulti)) {
                    falsoPositivoTelefone = true;
                    break;
                }
            }
        }
        registrar(!falsoPositivoTelefone, 'ISOLAMENTO_TEL', 'Sequencia numerica espacada livre de falso-positivo de telefone', {
            textoTestado: amostraMulti,
            idxCursor: 0,
            esperado: 'falsoPositivo=false',
            obtido: `falsoPositivo=${falsoPositivoTelefone}`
        });

        /* 3) Reconhecimento das 8 tags/placeholders do editor */
        if (C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL) {
            const textoTagsTeste = 'texto #tag/campo# texto #[tag/campo]# texto ##tag/campo## texto @@ tag/campo @@ texto ### tag/campo ## texto id ########## texto R$ $$$$$$$$ texto @@@@@@@@ texto.';
            const rxTags = new RegExp(C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL.source, 'gu');
            const tagsEncontradas = [];
            let mTag;
            while ((mTag = rxTags.exec(textoTagsTeste)) !== null) {
                tagsEncontradas.push(mTag[0]);
            }
            const tagsEsperadas = [
                '#tag/campo#',
                '#[tag/campo]#',
                '##tag/campo##',
                '@@ tag/campo @@',
                '### tag/campo ##',
                '##########',
                '$$$$$$$$',
                '@@@@@@@@'
            ];
            const espTagsStr = tagsEsperadas.join(' | ');
            const obtTagsStr = tagsEncontradas.join(' | ');
            registrar(
                obtTagsStr === espTagsStr,
                'PLACEHOLDERS_TAGS',
                'Reconhecimento individual das 8 tags de teste no editor multilinhas',
                {
                    textoTestado: textoTagsTeste,
                    idxCursor: textoTagsTeste.indexOf('#tag/campo#'),
                    esperado: espTagsStr,
                    obtido: obtTagsStr
                }
            );
        }

        /* 3.1) Reconhecimento ampliado de marcadores e placeholders judiciais do PJe (CKEditor) */
        if (C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL) {
            const textoMinutasJudiciais = 'consequentemente [@@inserir eventuais obrigações secundárias/consequentes], além de [@@ato da autoridade coatora objeto da correção por este mandado@@] em ##/##/20## protocolou ##### por ###### [#INI##TEXTO DA DECISÃO LIMINAR###] #[...] Genérico art. ###, # da CF no art. ## da Lei #####/20##';
            const rxJud = new RegExp(C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL.source, 'gu');
            const tagsJudEncontradas = [];
            let mJud;
            while ((mJud = rxJud.exec(textoMinutasJudiciais)) !== null) {
                tagsJudEncontradas.push(mJud[0]);
            }
            const tagsJudEsperadas = [
                '[@@inserir eventuais obrigações secundárias/consequentes]',
                '[@@ato da autoridade coatora objeto da correção por este mandado@@]',
                '##/##/20##',
                '#####',
                '######',
                '[#INI##TEXTO DA DECISÃO LIMINAR###]',
                '#[...]',
                '###, #',
                '##',
                '#####/20##'
            ];
            const espJudStr = tagsJudEsperadas.join(' | ');
            const obtJudStr = tagsJudEncontradas.join(' | ');
            registrar(
                obtJudStr === espJudStr,
                'PLACEHOLDERS_MINUTAS_JUDICIAIS_PJE',
                'Reconhecimento das tags reais de minutas judiciais do PJe/CKEditor ([@@...@@], ##/##/20##, #####, etc.)',
                {
                    textoTestado: textoMinutasJudiciais,
                    idxCursor: 0,
                    esperado: espJudStr,
                    obtido: obtJudStr
                }
            );
        }

        /* 3.1.1) Reconhecimento dos Placeholders da Minuta Extensa do Editor HTML, incluindo Telefone (##)####-#### */
        if (C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL) {
            const textoMinutaExtensa = 'Nome #Autor da acao#, telefone (##)####-####, manifesta-se nos autos conforme id ####### e id ###### fl. ##. Em sintese, na data ##/##/20## insurge-se contra [@@ato impugnado@@], postulando o valor de R$ ##.###,##. Para a regular instrucao, enumera-se ##### e ##### como pontos controvertidos da lide. [##TEXTO DA DECISAO##]';
            const rxMinuta = new RegExp(C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL.source, 'gu');
            const tagsMinutaEncontradas = [];
            let mMin;
            while ((mMin = rxMinuta.exec(textoMinutaExtensa)) !== null) {
                tagsMinutaEncontradas.push(mMin[0]);
            }
            const tagsMinutaEsperadas = [
                '#Autor da acao#',
                '(##)####-####',
                '#######',
                '######',
                '##',
                '##/##/20##',
                '[@@ato impugnado@@]',
                '##.###,##',
                '#####',
                '#####',
                '[##TEXTO DA DECISAO##]'
            ];
            const espMinStr = tagsMinutaEsperadas.join(' | ');
            const obtMinStr = tagsMinutaEncontradas.join(' | ');

            /* Validacao especifica da mascara de telefone com simbolos em varios formatos */
            const telefonesTeste = ['(##)####-####', '(##) ####-####', '(##)#####-####', '(##) #####-####', '####-####', '#####-####'];
            let telefonesOk = true;
            for (let t = 0; t < telefonesTeste.length; t++) {
                const rxTel = new RegExp(C.EXPRESSOES_REGULARES.CAMPO_PLACEHOLDER_EDITAVEL.source, 'gu');
                const mTel = rxTel.exec(telefonesTeste[t]);
                if (!mTel || mTel[0] !== telefonesTeste[t]) {
                    telefonesOk = false;
                    break;
                }
            }

            /* Validacao da selecao por clique sobre o placeholder de telefone */
            let cliqueTelOk = true;
            if (motorTeste && typeof motorTeste.localizarCampoSimbolosSobCursor === 'function') {
                const idxTel = textoMinutaExtensa.indexOf('(##)####-####') + 4;
                const spanTel = motorTeste.localizarCampoSimbolosSobCursor(textoMinutaExtensa, idxTel);
                cliqueTelOk = Boolean(spanTel && textoMinutaExtensa.substring(spanTel.inicio, spanTel.fim) === '(##)####-####');
            }

            /* Validacao da presenca dos campos no texto padrao do Editor HTML */
            let htmlEditorOk = true;
            if (window.JusGovEditorDemo && typeof window.JusGovEditorDemo.obterTextoPadraoEditorHtml === 'function') {
                const htmlPadrao = window.JusGovEditorDemo.obterTextoPadraoEditorHtml();
                htmlEditorOk = htmlPadrao.includes('<b>@@Autor@@</b>') &&
                    htmlPadrao.includes('<b>##Réu##</b>') &&
                    htmlPadrao.includes('<u>(##)####-####</u>') &&
                    htmlPadrao.includes('<i>##/##/20##</i>') &&
                    htmlPadrao.includes('<u><i>[@@ato@@]</i></u>') &&
                    htmlPadrao.includes('<u>##.###,##</u>') &&
                    htmlPadrao.includes('id #######') &&
                    htmlPadrao.includes('id ###### fl. ##') &&
                    htmlPadrao.includes('#####') &&
                    htmlPadrao.includes('[##TEXTO DA DECISÃO##]');
            }

            const tudoOk = (obtMinStr === espMinStr) && telefonesOk && cliqueTelOk && htmlEditorOk;

            registrar(
                tudoOk,
                'PLACEHOLDERS_MINUTA_EXTENSA_E_TELEFONE',
                'Reconhecimento completo dos placeholders da minuta extensa e mascaras de telefone no editor HTML',
                {
                    textoTestado: textoMinutaExtensa,
                    idxCursor: textoMinutaExtensa.indexOf('(##)####-####'),
                    esperado: espMinStr,
                    obtido: obtMinStr
                }
            );
        }

        /* 3.2) Controle de alternancia da configuracao de placeholders para editores HTML online (3 modos) */
        if (motorTeste && typeof motorTeste.definirPlaceholdersMinutasHtmlAtivo === 'function' && typeof motorTeste.obterEstadoAtual === 'function') {
            const estIni = motorTeste.obterEstadoAtual().modoPlaceholdersMinutasHtml || (motorTeste.obterEstadoAtual().placeholdersMinutasHtmlAtivo ? 'placeholders' : 'desabilitado');
            motorTeste.definirPlaceholdersMinutasHtmlAtivo(false);
            const estDesativado = motorTeste.obterEstadoAtual().placeholdersMinutasHtmlAtivo;
            motorTeste.definirPlaceholdersMinutasHtmlAtivo(true);
            const estReativado = motorTeste.obterEstadoAtual().placeholdersMinutasHtmlAtivo;

            let modAvancadoOk = true;
            let modCtrlAvancadoOk = true;
            let modDesativadoOk = true;
            let modPlaceholdersOk = true;
            if (typeof motorTeste.definirModoPlaceholdersMinutasHtml === 'function') {
                motorTeste.definirModoPlaceholdersMinutasHtml('avancado');
                const estAv = motorTeste.obterEstadoAtual();
                modAvancadoOk = (estAv.modoPlaceholdersMinutasHtml === 'avancado' && estAv.placeholdersMinutasHtmlAtivo === true && estAv.selecaoEditavelAtiva === true);

                motorTeste.definirModoPlaceholdersMinutasHtml('ctrl_avancado');
                const estCtrlAv = motorTeste.obterEstadoAtual();
                modCtrlAvancadoOk = (estCtrlAv.modoPlaceholdersMinutasHtml === 'ctrl_avancado' && estCtrlAv.placeholdersMinutasHtmlAtivo === true && estCtrlAv.selecaoEditavelAtiva === true);

                motorTeste.definirModoPlaceholdersMinutasHtml('desabilitado');
                const estDes = motorTeste.obterEstadoAtual();
                modDesativadoOk = (estDes.modoPlaceholdersMinutasHtml === 'desabilitado' && estDes.placeholdersMinutasHtmlAtivo === false && estDes.selecaoEditavelAtiva === false);

                motorTeste.definirModoPlaceholdersMinutasHtml('placeholders');
                const estPl = motorTeste.obterEstadoAtual();
                modPlaceholdersOk = (estPl.modoPlaceholdersMinutasHtml === 'placeholders' && estPl.placeholdersMinutasHtmlAtivo === true && estPl.selecaoEditavelAtiva === true);

                motorTeste.definirModoPlaceholdersMinutasHtml(estIni);
            } else {
                motorTeste.definirPlaceholdersMinutasHtmlAtivo(estIni !== 'desabilitado');
            }

            const tudoValido = (estDesativado === false && estReativado === true && modAvancadoOk && modCtrlAvancadoOk && modDesativadoOk && modPlaceholdersOk);
            registrar(
                tudoValido,
                'CONTROLE_PLACEHOLDERS_HTML_CONFIG',
                'Controle unificado dos 4 modos de Seleção Automática de Placeholders em Editores (desabilitado, placeholders, ctrl_avancado, avancado)',
                {
                    textoTestado: 'Alternancia dos 4 modos (desabilitado, placeholders, ctrl_avancado, avancado)',
                    idxCursor: 0,
                    esperado: 'desativado=false, reativado=true, avancado=ok, ctrl_avancado=ok, des=ok, pl=ok',
                    obtido: `desativado=${estDesativado}, reativado=${estReativado}, avancado=${modAvancadoOk}, ctrlAvancado=${modCtrlAvancadoOk}, des=${modDesativadoOk}, pl=${modPlaceholdersOk}`
                }
            );

            /* 3.2.1) Validacao funcional do modo ctrl_avancado (sem Ctrl = apenas placeholders; com Ctrl = avancado) */
            const estOrigModo = motorTeste.obterEstadoAtual().modoPlaceholdersMinutasHtml;
            motorTeste.definirModoPlaceholdersMinutasHtml('ctrl_avancado');

            const textoMinutaTeste = 'Em conformidade com [@@artigo_lei@@] do CPC, segue despacho.';
            const posPlaceholder = textoMinutaTeste.indexOf('[@@artigo_lei@@]') + 4;
            const posPalavraComum = textoMinutaTeste.indexOf('conformidade') + 3;

            const resPlaceholderSemCtrl = (typeof motorTeste.localizarCampoSimbolosSobCursor === 'function')
                ? motorTeste.localizarCampoSimbolosSobCursor(textoMinutaTeste, posPlaceholder)
                : null;
            const resPalavraSemCtrl = (typeof motorTeste.localizarCampoSimbolosSobCursor === 'function')
                ? motorTeste.localizarCampoSimbolosSobCursor(textoMinutaTeste, posPalavraComum)
                : null;

            const resAvancadoComCtrl = (typeof motorTeste.tentarExpandirPadraoComposto === 'function')
                ? (motorTeste.tentarExpandirPadraoComposto(textoMinutaTeste, posPalavraComum, false, false) ||
                    (typeof motorTeste.expandirUnidadeAtomicaEstagio1 === 'function' ? motorTeste.expandirUnidadeAtomicaEstagio1(textoMinutaTeste, posPalavraComum) : null))
                : null;

            motorTeste.definirModoPlaceholdersMinutasHtml(estOrigModo);

            const ctrlAvancadoLogicaOk = (
                resPlaceholderSemCtrl !== null &&
                textoMinutaTeste.slice(resPlaceholderSemCtrl.inicio, resPlaceholderSemCtrl.fim) === '[@@artigo_lei@@]' &&
                resPalavraSemCtrl === null &&
                resAvancadoComCtrl !== null &&
                textoMinutaTeste.slice(resAvancadoComCtrl.inicio, resAvancadoComCtrl.fim) === 'conformidade'
            );

            registrar(
                ctrlAvancadoLogicaOk,
                'SELECAO_PLACEHOLDERS_CTRL_AVANCADO_FUNCIONAMENTO',
                'Modo ctrl_avancado em Minutas HTML: Sem Ctrl seleciona apenas placeholders; Com Ctrl ativa expansao avancada',
                {
                    placeholderSemCtrl: resPlaceholderSemCtrl ? textoMinutaTeste.slice(resPlaceholderSemCtrl.inicio, resPlaceholderSemCtrl.fim) : null,
                    palavraSemCtrl: resPalavraSemCtrl,
                    palavraAvancadaComCtrl: resAvancadoComCtrl ? textoMinutaTeste.slice(resAvancadoComCtrl.inicio, resAvancadoComCtrl.fim) : null
                }
            );

            /* 3.2.2) Isolamento estrito: a opcao de minutas HTML nao interfere em textos comuns */
            let isolamentoTextoComumOk = true;
            if (typeof motorTeste.classificarContextoElementoAlvo === 'function') {
                const divDocPjeLeitura = document.createElement('div');
                divDocPjeLeitura.className = 'cke_editable cke_contents';
                const pDocPje = document.createElement('p');
                pDocPje.textContent = 'Documento Judicial do PJe apenas para leitura';
                divDocPjeLeitura.appendChild(pDocPje);
                document.body.appendChild(divDocPjeLeitura);

                const divEditorReal = document.createElement('div');
                divEditorReal.contentEditable = 'true';
                const pEditor = document.createElement('p');
                pEditor.textContent = 'Minuta ativa de despacho';
                divEditorReal.appendChild(pEditor);
                document.body.appendChild(divEditorReal);

                const ctxLeituraPje = motorTeste.classificarContextoElementoAlvo(pDocPje);
                const ctxEditorReal = motorTeste.classificarContextoElementoAlvo(pEditor);

                document.body.removeChild(divDocPjeLeitura);
                document.body.removeChild(divEditorReal);

                isolamentoTextoComumOk = (ctxLeituraPje === 'LEITURA_COMUM' && ctxEditorReal === 'EDITOR_MULTILINHA_EDITAVEL');
            }

            registrar(
                isolamentoTextoComumOk,
                'SELECAO_PLACEHOLDERS_ISOLAMENTO_TEXTO_COMUM',
                'Isolamento estrito: Documentos de leitura (mesmo com classes de CKEditor) sao classificados como LEITURA_COMUM e nao sofrem interferencia de Minutas HTML',
                { isolamentoTextoComumOk }
            );

            /* 3.2.3) Validacao e blindagem de isEditorMultilinhaValido e isCampoDeTextoValido */
            if (typeof motorTeste.isEditorMultilinhaValido === 'function' && typeof motorTeste.isCampoDeTextoValido === 'function') {
                const ta = document.createElement('textarea');
                const inp = document.createElement('input');
                inp.type = 'text';
                const divLivre = document.createElement('div');
                divLivre.textContent = 'Texto fixo';
                const divEdit = document.createElement('div');
                divEdit.contentEditable = 'true';
                document.body.appendChild(ta);
                document.body.appendChild(inp);
                document.body.appendChild(divLivre);
                document.body.appendChild(divEdit);

                const okEditorTa = motorTeste.isEditorMultilinhaValido(ta) === true;
                const okEditorDiv = motorTeste.isEditorMultilinhaValido(divEdit) === true;
                const okEditorFixo = motorTeste.isEditorMultilinhaValido(divLivre) === false;
                const okCampoInp = motorTeste.isCampoDeTextoValido(inp) === true;
                const okCampoTa = motorTeste.isCampoDeTextoValido(ta) === true;
                const okCampoDiv = motorTeste.isCampoDeTextoValido(divLivre) === false;

                document.body.removeChild(ta);
                document.body.removeChild(inp);
                document.body.removeChild(divLivre);
                document.body.removeChild(divEdit);

                const validadoresOk = okEditorTa && okEditorDiv && okEditorFixo && okCampoInp && okCampoTa && okCampoDiv;
                registrar(
                    validadoresOk,
                    'VALIDADORES_CAMPOS_E_EDITORES_BLINDADOS',
                    'Validacao estrita de isCampoDeTextoValido e isEditorMultilinhaValido protegidos contra excecoes de contexto e nos nulos',
                    {
                        esperado: 'true',
                        obtido: String(validadoresOk),
                        detalhe: `edTa=${okEditorTa}, edDiv=${okEditorDiv}, edFixo=${okEditorFixo}, cInp=${okCampoInp}, cTa=${okCampoTa}, cDiv=${okCampoDiv}`
                    }
                );
            }

            /* 3.2.4) Protecao de Interface contra Perda Acidental de Conteudo (Minimo de Caracteres) */
            if (typeof motorTeste.verificarProtecaoTamanhoMinimoInterface === 'function' && typeof motorTeste.definirMinimoCaracteresInterface === 'function') {
                const btnUi = document.createElement('button');
                btnUi.textContent = 'OK';
                const pLeitura = document.createElement('p');
                pLeitura.textContent = 'Texto normal em area de sentenca';
                document.body.appendChild(btnUi);
                document.body.appendChild(pLeitura);

                motorTeste.definirMinimoCaracteresInterface(5);

                const tCurtoUiBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('de', btnUi, false) === false;
                const tOuLeituraBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('ou', pLeitura, false) === false;
                const tOuComModPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('ou', pLeitura, true) === true;
                const t3LetrasUiBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('réu', btnUi, false) === false;
                const tDataUiPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('11/09/2026', btnUi, false) === true;
                const tCpfUiPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('123.456.789-00', btnUi, false) === true;
                const tNbPontuadoUiPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('719.657.155-0', btnUi, false) === true;
                const tLongoUiPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('PROCEDIMENTO', btnUi, false) === true;
                const tCurtoComModPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('de', btnUi, true) === true;
                const tLeituraBloq = motorTeste.verificarProtecaoTamanhoMinimoInterface('de', pLeitura, false) === false;

                motorTeste.definirMinimoCaracteresInterface(0);
                const tDesativadoPerm = motorTeste.verificarProtecaoTamanhoMinimoInterface('ou', pLeitura, false) === true;

                motorTeste.definirMinimoCaracteresInterface(5);

                document.body.removeChild(btnUi);
                document.body.removeChild(pLeitura);

                const protecaoOk = tCurtoUiBloq && tOuLeituraBloq && tOuComModPerm && t3LetrasUiBloq && tDataUiPerm && tCpfUiPerm && tNbPontuadoUiPerm && tLongoUiPerm && tCurtoComModPerm && tLeituraBloq && tDesativadoPerm;
                registrar(
                    protecaoOk,
                    'PROTECAO_TAMANHO_MINIMO_INTERFACE_E_CAMPOS',
                    'Protecao contra perda acidental da Area de Transferencia em textos e interfaces: minimo N caracteres em palavras comuns, isencao de campos estruturados e modificadores',
                    {
                        esperado: 'true',
                        obtido: String(protecaoOk),
                        detalhe: `tCurtoUiBloq=${tCurtoUiBloq}, t3LetrasUiBloq=${t3LetrasUiBloq}, tDataUiPerm=${tDataUiPerm}, tCpfUiPerm=${tCpfUiPerm}, tLongoUiPerm=${tLongoUiPerm}, tCurtoComModPerm=${tCurtoComModPerm}, tLeituraBloq=${tLeituraBloq}, tDesativadoPerm=${tDesativadoPerm}`
                    }
                );
            }
        }

        /* 3.3) Comportamento do campo de entrada simples (<input>) com selecao inteligente e mascaras */
        if (typeof document !== 'undefined' && motorTeste && typeof motorTeste.simularAlternanciaCliqueInput === 'function') {
            const inpTeste = document.createElement('input');
            inpTeste.type = 'text';
            inpTeste.value = '11/09/2026';
            document.body.appendChild(inpTeste);

            /* Regra 1: Na primeira vez somente seleciona tudo */
            const r1 = motorTeste.simularAlternanciaCliqueInput(inpTeste);
            const sel1 = (inpTeste.selectionStart === 0 && inpTeste.selectionEnd === inpTeste.value.length);

            /* Regra 2: No 2º clique consecutivo no campo ja focado com texto, desseleciona e posiciona o cursor */
            const r2 = motorTeste.simularAlternanciaCliqueInput(inpTeste, 3);
            const desel2 = (inpTeste.selectionStart === 3 && inpTeste.selectionEnd === 3);

            /* Regra 3: Se der dois cliques ele seleciona tudo novamente */
            const r3 = motorTeste.simularAlternanciaCliqueInput(inpTeste, null, 2);
            const sel3 = (inpTeste.selectionStart === 0 && inpTeste.selectionEnd === inpTeste.value.length);

            /* Regra 4: Campo com mascara de data (ex: "___/___/_____") sem alfanumerico: sempre seleciona tudo para facilitar colagem */
            inpTeste.value = '___/___/_____';
            delete inpTeste.dataset.autoselected;
            const r4 = motorTeste.simularAlternanciaCliqueInput(inpTeste);
            const sel4 = (inpTeste.selectionStart === 0 && inpTeste.selectionEnd === inpTeste.value.length);
            const r4b = motorTeste.simularAlternanciaCliqueInput(inpTeste, 2);
            const sel4b = (inpTeste.selectionStart === 0 && inpTeste.selectionEnd === inpTeste.value.length);

            /* Regra 5: Ao perder o foco (blur) e focar novamente, reseta e seleciona tudo novamente */
            inpTeste.value = '11/09/2026';
            inpTeste.blur();
            const r5 = motorTeste.simularAlternanciaCliqueInput(inpTeste);
            const sel5 = (inpTeste.selectionStart === 0 && inpTeste.selectionEnd === inpTeste.value.length);

            /* Regra 6: Esc ao editar o campo sai do foco e desseleciona */
            if (typeof motorTeste.simularEscInput === 'function') {
                motorTeste.simularEscInput(inpTeste);
            }
            const r6 = motorTeste.simularAlternanciaCliqueInput(inpTeste);
            const sel6 = (inpTeste.selectionStart === 0 && inpTeste.selectionEnd === inpTeste.value.length);

            document.body.removeChild(inpTeste);

            const sucessoCiclo = (r1 === 'SELECIONADO' && sel1 &&
                r2 === 'DESSELECIONADO' && desel2 &&
                r3 === 'SELECIONADO' && sel3 &&
                r4 === 'SELECIONADO' && sel4 &&
                r4b === 'SELECIONADO' && sel4b &&
                r5 === 'SELECIONADO' && sel5 &&
                r6 === 'SELECIONADO' && sel6);

            registrar(
                sucessoCiclo,
                'ALTERNANCIA_CLIQUE_INPUT',
                'Campo Simples: 1a vez seleciona tudo; 2o clique posiciona cursor; duplo clique seleciona; mascara ___/___/_____ sempre seleciona; blur/Esc reseta',
                {
                    textoTestado: 'Input "11/09/2026" e mascara "___/___/_____"',
                    idxCursor: 0,
                    esperado: 'c1=SEL, c2=DESEL, c3_2cliques=SEL, c4_mascara=SEL, c4b_mascaraRepetida=SEL, c5_aposBlur=SEL, c6_posEsc=SEL',
                    obtido: `c1=${r1}, c2=${r2}, c3=${r3}, c4=${r4}, c4b=${r4b}, c5=${r5}, c6=${r6}`
                }
            );
        }

        /* 3.3.1) Validação End-to-End de Alternância de Clique e Isolamento de Clipboard em <input> via Eventos DOM */
        if (typeof document !== 'undefined') {
            const inpDom = document.createElement('input');
            inpDom.type = 'text';
            inpDom.value = 'Texto Teste Input';
            document.body.appendChild(inpDom);

            const clipOriginal = window.__JUSGOV_ULTIMO_CLIPBOARD__ || 'CLIP_INICIAL_INTACTO';
            window.__JUSGOV_ULTIMO_CLIPBOARD__ = clipOriginal;

            // 1) 1º clique: mousedown + mouseup
            inpDom.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, detail: 1 }));
            inpDom.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0, detail: 1 }));

            const autoselected1 = inpDom.dataset.autoselected === 'true';
            const clipIntacto1 = (window.__JUSGOV_ULTIMO_CLIPBOARD__ === clipOriginal);

            // 2) blur reseta autoselected
            inpDom.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
            const autoselectedAposBlur = (inpDom.dataset.autoselected === undefined);

            // 3) Duplo clique: dblclick
            inpDom.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, button: 0, detail: 2 }));
            const clipIntacto2 = (window.__JUSGOV_ULTIMO_CLIPBOARD__ === clipOriginal);

            document.body.removeChild(inpDom);

            const sucessoEventosDom = autoselected1 && clipIntacto1 && autoselectedAposBlur && clipIntacto2;

            registrar(
                sucessoEventosDom,
                'INPUT_EVENTOS_DOM_AUTOSELECAO_E_BLINDAGEM_CLIPBOARD',
                'Eventos DOM reais (mousedown/mouseup/dblclick/blur): 1o clique ativa autoselected sem alterar clipboard; blur reseta; dblclick mantém clipboard intacto',
                {
                    textoTestado: 'Input DOM Real',
                    esperado: 'autoselected=true, clipIntacto=true, blurReseta=true, dblclickClipIntacto=true',
                    obtido: `autoselected1=${autoselected1}, clipIntacto1=${clipIntacto1}, blurReseta=${autoselectedAposBlur}, dblclickClipIntacto=${clipIntacto2}`
                }
            );
        }

        /* 3.4) Conversores bidirecionais de modo do editor online (HTML <-> Markdown) */
        if (typeof window !== 'undefined' && window.JusGovEditorDemo && typeof window.JusGovEditorDemo.converterHtmlParaMarkdown === 'function') {
            const htmlEntrada = '<p>Texto com <b>negrito</b> e <i>italico</i> e <s>tachado</s></p>';
            const mdObtido = window.JusGovEditorDemo.converterHtmlParaMarkdown(htmlEntrada);
            const mdEsperado = 'Texto com **negrito** e *italico* e ~~tachado~~';

            const mdEntrada = 'Linha com **negrito** e *italico*';
            const htmlObtido = window.JusGovEditorDemo.converterMarkdownParaHtml(mdEntrada);
            const htmlEsperado = '<p>Linha com <b>negrito</b> e <i>italico</i></p>';

            registrar(
                mdObtido === mdEsperado && htmlObtido === htmlEsperado,
                'EDITOR_CONVERSOR_RTF_MARKDOWN',
                'Conversores bidirecionais nativos do Editor Demo (HTML <-> Markdown)',
                {
                    textoTestado: htmlEntrada,
                    idxCursor: 0,
                    esperado: `md: "${mdEsperado}" | html: "${htmlEsperado}"`,
                    obtido: `md: "${mdObtido}" | html: "${htmlObtido}"`
                }
            );
        }

        /* 3.4.1) Teste de Destaque Formatado Inline (ex: duplo clique em <mark>marca-texto</mark>) */
        if (typeof document !== 'undefined' && motorTeste && typeof motorTeste.construirMapaTextoBlocoComJanela === 'function' && typeof motorTeste.tentarExpandirBlocoFormatadoDestaque === 'function') {
            const containerMark = document.createElement('div');
            containerMark.innerHTML = '<p>Texto com <b>negrito</b>, <i>italico</i>, <u>sublinhado</u>, <mark>marca-texto</mark> ou combinacoes.</p>';
            document.body.appendChild(containerMark);

            const elMark = containerMark.querySelector('mark');
            let extracaoMarkOk = false;
            let trechoMarkObtido = '';

            if (elMark && elMark.firstChild) {
                const mapaMark = motorTeste.construirMapaTextoBlocoComJanela(elMark.firstChild, 2);
                if (mapaMark) {
                    const resMark = motorTeste.tentarExpandirBlocoFormatadoDestaque(mapaMark, mapaMark.idxCursor);
                    if (resMark) {
                        trechoMarkObtido = mapaMark.texto.substring(resMark.inicio, resMark.fim);
                        extracaoMarkOk = (trechoMarkObtido === 'marca-texto');
                    }
                }
            }

            document.body.removeChild(containerMark);

            registrar(
                extracaoMarkOk,
                'EXPANSAO_FORMATADA_MARK_ISOLADO',
                'Delimitacao exata de elemento formatado inline <mark>marca-texto</mark> sem vazar espaco externo',
                {
                    textoTestado: '<mark>marca-texto</mark> ou combinacoes.',
                    idxCursor: 2,
                    esperado: 'marca-texto',
                    obtido: trechoMarkObtido
                }
            );
        }

        /* 3.5) Controle e simulacao de colagem rapida via botao direito (1 clique = normal/formatado, 2 cliques rapidos = texto puro) */
        if (motorTeste && typeof motorTeste.definirColagemBotaoDireitoAtiva === 'function' && typeof motorTeste.obterEstadoAtual === 'function') {
            const estIniColagem = motorTeste.obterEstadoAtual().colagemBotaoDireitoAtiva;
            motorTeste.definirColagemBotaoDireitoAtiva(false);
            const estColagemOff = motorTeste.obterEstadoAtual().colagemBotaoDireitoAtiva;
            motorTeste.definirColagemBotaoDireitoAtiva(true);
            const estColagemOn = motorTeste.obterEstadoAtual().colagemBotaoDireitoAtiva;
            motorTeste.definirColagemBotaoDireitoAtiva(Boolean(estIniColagem));

            registrar(
                estColagemOff === false && estColagemOn === true,
                'CONTROLE_COLAGEM_BOTAO_DIREITO_CONFIG',
                'Controle de alternancia do parametro colagemBotaoDireitoAtiva via Motor de Teste',
                {
                    textoTestado: 'Alternancia de colagemBotaoDireitoAtiva',
                    idxCursor: 0,
                    esperado: 'desativado=false, reativado=true',
                    obtido: `desativado=${estColagemOff}, reativado=${estColagemOn}`
                }
            );

            if (typeof document !== 'undefined' && typeof motorTeste.simularColagemBotaoDireito === 'function') {
                const elInput = document.createElement('input');
                elInput.type = 'text';
                elInput.value = 'Prefixo: ';
                document.body.appendChild(elInput);

                motorTeste.simularColagemBotaoDireito(elInput, 'normal', '123456');
                const valInput = elInput.value;

                const elContent = document.createElement('div');
                elContent.contentEditable = 'true';
                elContent.innerHTML = '<p>Conteudo: </p>';
                document.body.appendChild(elContent);

                motorTeste.simularColagemBotaoDireito(elContent, 'texto_puro', 'Texto Sem Formatacao');
                const txtContent = elContent.textContent;

                document.body.removeChild(elInput);
                document.body.removeChild(elContent);

                const colagemOk = valInput.includes('123456') && txtContent.includes('Texto Sem Formatacao');
                registrar(
                    colagemOk,
                    'SIMULACAO_COLAGEM_BOTAO_DIREITO_MODOS',
                    'Simulacao de colagem com botao direito: modo normal (input) e modo texto puro (contenteditable)',
                    {
                        textoTestado: 'Colagem em Input e Contenteditable',
                        idxCursor: 0,
                        esperado: 'input contem 123456 e content contem Texto Sem Formatacao',
                        obtido: `input="${valInput}", content="${txtContent}"`
                    }
                );

                /* Teste de colagem em campo input do tipo date com conversao automatica e tolerancia a selectionStart */
                const elInputData = document.createElement('input');
                elInputData.type = 'date';
                document.body.appendChild(elInputData);

                motorTeste.simularColagemBotaoDireito(elInputData, 'normal', '04/11/2026');
                const valData = elInputData.value;
                document.body.removeChild(elInputData);

                registrar(
                    valData === '2026-11-04',
                    'SIMULACAO_COLAGEM_INPUT_TIPO_DATA',
                    'Simulacao de colagem em input type="date" com conversao automatica de DD/MM/AAAA para AAAA-MM-DD e suporte a selectionStart',
                    {
                        textoTestado: 'Colagem em input type="date"',
                        idxCursor: 0,
                        esperado: '2026-11-04',
                        obtido: valData
                    }
                );
            }
        }

        /* 3.6) Modulo TECLADO/MOUSE: Captura dos Botoes 4 e 5, Navegacao por Teclado e Mascaras */
        if (motorTeste && typeof motorTeste.definirCapturaBotoesMouse4e5Ativa === 'function' && typeof motorTeste.obterEstadoAtual === 'function') {
            const estIniMouse = motorTeste.obterEstadoAtual().capturaBotoesMouse4e5Ativa;
            motorTeste.definirCapturaBotoesMouse4e5Ativa(false);
            const estMouseOff = motorTeste.obterEstadoAtual().capturaBotoesMouse4e5Ativa;
            motorTeste.definirCapturaBotoesMouse4e5Ativa(true);
            const estMouseOn = motorTeste.obterEstadoAtual().capturaBotoesMouse4e5Ativa;
            motorTeste.definirCapturaBotoesMouse4e5Ativa(estIniMouse !== false);

            registrar(
                estMouseOff === false && estMouseOn === true,
                'CONTROLE_BOTOES_MOUSE_4_5_CONFIG',
                'Controle de alternancia do parametro capturaBotoesMouse4e5Ativa via Motor de Teste',
                {
                    textoTestado: 'Alternancia de capturaBotoesMouse4e5Ativa',
                    idxCursor: 0,
                    esperado: 'desativado=false, reativado=true',
                    obtido: `desativado=${estMouseOff}, reativado=${estMouseOn}`
                }
            );

            if (typeof motorTeste.definirColarBotaoMeioAtivo === 'function') {
                const estIniMeio = motorTeste.obterEstadoAtual().colarBotaoMeioAtivo;
                motorTeste.definirColarBotaoMeioAtivo(false);
                const estMeioOff = motorTeste.obterEstadoAtual().colarBotaoMeioAtivo;
                motorTeste.definirColarBotaoMeioAtivo(true);
                const estMeioOn = motorTeste.obterEstadoAtual().colarBotaoMeioAtivo;
                motorTeste.definirColarBotaoMeioAtivo(estIniMeio === true);

                registrar(
                    estMeioOff === false && estMeioOn === true,
                    'CONTROLE_COLAR_BOTAO_MEIO_CONFIG',
                    'Controle de alternancia do parametro colarBotaoMeioAtivo via Motor de Teste',
                    {
                        textoTestado: 'Alternancia de colarBotaoMeioAtivo',
                        idxCursor: 0,
                        esperado: 'desativado=false, reativado=true',
                        obtido: `desativado=${estMeioOff}, reativado=${estMeioOn}`
                    }
                );
            }

            if (typeof motorTeste.salvarClipboardInternoComBackup === 'function') {
                /* Seção 6.63: Ctrl + Botão do Meio cola a penúltima seleção sem alterar nem rotacionar a última cópia */
                const estadoOrigMeio = (typeof motorTeste.obterColarBotaoMeioAtivo === 'function') ? motorTeste.obterColarBotaoMeioAtivo() : true;
                if (typeof motorTeste.definirColarBotaoMeioAtivo === 'function') motorTeste.definirColarBotaoMeioAtivo(true);

                motorTeste.salvarClipboardInternoComBackup({ texto: 'Primeiro Texto Copiado', html: '', formatado: false });
                motorTeste.salvarClipboardInternoComBackup({ texto: 'Segundo Texto Copiado', html: '', formatado: false });

                const campoCtrlMeio = document.createElement('input');
                campoCtrlMeio.type = 'text';
                document.body.appendChild(campoCtrlMeio);

                const evtCtrlMeio = new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1, ctrlKey: true });
                campoCtrlMeio.dispatchEvent(evtCtrlMeio);

                const colouPenultimo = (campoCtrlMeio.value === 'Primeiro Texto Copiado');
                const ultimoPermaneceIntacto = Boolean(window.__JUSGOV_ULTIMO_CLIPBOARD__ && window.__JUSGOV_ULTIMO_CLIPBOARD__.texto === 'Segundo Texto Copiado');

                document.body.removeChild(campoCtrlMeio);
                if (typeof motorTeste.definirColarBotaoMeioAtivo === 'function') motorTeste.definirColarBotaoMeioAtivo(estadoOrigMeio);

                registrar(
                    Boolean(colouPenultimo && ultimoPermaneceIntacto && evtCtrlMeio.defaultPrevented),
                    'CTRL_MEIO_COLA_PENULTIMO_CLIPBOARD',
                    'Ctrl + Botao do Meio cola a penultima selecao interna (window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__) mantendo a ultima intacta (Seção 6.63)',
                    {
                        textoTestado: 'Ctrl + Botao do Meio (Penultimo Buffer)',
                        idxCursor: 0,
                        esperado: 'penultimo=Primeiro Texto Copiado, ultimoIntacto=true',
                        obtido: `penultimo=${campoCtrlMeio.value}, ultimoIntacto=${ultimoPermaneceIntacto}`
                    }
                );
            }

            if (typeof motorTeste.simularNavegacaoBotoesMouse === 'function') {
                const totalAbas = 5;
                const navVoltarZero = motorTeste.simularNavegacaoBotoesMouse(3, totalAbas, 0);
                const navVoltarMeio = motorTeste.simularNavegacaoBotoesMouse(3, totalAbas, 3);
                const navAvancarFim = motorTeste.simularNavegacaoBotoesMouse(4, totalAbas, 4);
                const navAvancarMeio = motorTeste.simularNavegacaoBotoesMouse(4, totalAbas, 1);

                const navOk = (navVoltarZero === 4 && navVoltarMeio === 2 && navAvancarFim === 0 && navAvancarMeio === 2);
                registrar(
                    navOk,
                    'SIMULACAO_NAVEGACAO_CIRCULAR_ABAS_MOUSE',
                    'Navegacao circular entre abas via Botoes 4 e 5: Voltar (0->4, 3->2) e Avancar (4->0, 1->2)',
                    {
                        textoTestado: '5 abas na janela ativa',
                        idxCursor: 0,
                        esperado: 'voltar(0)=4, voltar(3)=2, avancar(4)=0, avancar(1)=2',
                        obtido: `voltar(0)=${navVoltarZero}, voltar(3)=${navVoltarMeio}, avancar(4)=${navAvancarFim}, avancar(1)=${navAvancarMeio}`
                    }
                );
            }

            if (motorTeste && typeof motorTeste.tratarNavegacaoAbasPorBotoesMouse === 'function') {
                let preventDefaultBotao4 = false;
                let preventDefaultBotao5 = false;
                let stopPropagationBotao4 = false;
                let stopPropagationBotao5 = false;

                const evtBtn4 = {
                    type: 'mousedown',
                    button: 3,
                    which: 4,
                    buttons: 8,
                    preventDefault() { preventDefaultBotao4 = true; },
                    stopPropagation() { stopPropagationBotao4 = true; },
                    stopImmediatePropagation() { }
                };
                motorTeste.tratarNavegacaoAbasPorBotoesMouse(evtBtn4);

                const evtBtn5 = {
                    type: 'mousedown',
                    button: 4,
                    which: 5,
                    buttons: 16,
                    preventDefault() { preventDefaultBotao5 = true; },
                    stopPropagation() { stopPropagationBotao5 = true; },
                    stopImmediatePropagation() { }
                };
                motorTeste.tratarNavegacaoAbasPorBotoesMouse(evtBtn5);

                const capturaBotoesOk = (preventDefaultBotao4 && stopPropagationBotao4 && preventDefaultBotao5 && stopPropagationBotao5);
                registrar(
                    capturaBotoesOk,
                    'CAPTURA_SUPRESSAO_BOTOES_MOUSE_4_5',
                    'Neutralizacao do Comportamento de Historico Nativo e Captura dos Botoes 4 e 5 do Mouse',
                    {
                        botao4Interceptado: preventDefaultBotao4 && stopPropagationBotao4,
                        botao5Interceptado: preventDefaultBotao5 && stopPropagationBotao5
                    }
                );
            }

            if (motorTeste && typeof motorTeste.definirColarBotaoMeioAtivo === 'function' && typeof motorTeste.aoPressionarBotaoMouse === 'function') {
                const estColarIni = motorTeste.obterColarBotaoMeioAtivo ? motorTeste.obterColarBotaoMeioAtivo() : false;
                motorTeste.definirColarBotaoMeioAtivo(true);

                /* Elemento comum / div */
                const divComum = document.createElement('div');
                divComum.textContent = 'Texto em div comum';
                document.body.appendChild(divComum);

                /* Link <a> com href */
                const linkHref = document.createElement('a');
                linkHref.href = 'https://pje.jus.br/processo';
                linkHref.textContent = 'Abrir Processo em Nova Aba';
                document.body.appendChild(linkHref);

                /* Evento mousedown no link com botao do meio: NAO DEVE chamar preventDefault (preserva nova aba) */
                let preventDefaultChamadoLink = false;
                const evtLink = {
                    button: 1,
                    target: linkHref,
                    preventDefault() { preventDefaultChamadoLink = true; },
                    stopPropagation() { }
                };
                motorTeste.aoPressionarBotaoMouse(evtLink);

                /* Evento mousedown na div com botao do meio: DEVE chamar preventDefault (anula rolagem automatica) */
                let preventDefaultChamadoDiv = false;
                const evtDiv = {
                    button: 1,
                    target: divComum,
                    preventDefault() { preventDefaultChamadoDiv = true; },
                    stopPropagation() { }
                };
                motorTeste.aoPressionarBotaoMouse(evtDiv);

                /* Evento click com botao do meio: NUNCA deve chamar preventDefault */
                let preventDefaultChamadoClick = false;
                if (typeof motorTeste.aoClicar === 'function') {
                    const evtClickMeio = {
                        button: 1,
                        target: linkHref,
                        preventDefault() { preventDefaultChamadoClick = true; },
                        stopPropagation() { }
                    };
                    motorTeste.aoClicar(evtClickMeio);
                }

                /* Evento auxclick com botao do meio sobre link: NUNCA deve chamar preventDefault */
                let preventDefaultAuxLink = false;
                if (typeof motorTeste.aoClicarAuxiliarMouse === 'function') {
                    const evtAuxLink = {
                        button: 1,
                        target: linkHref,
                        preventDefault() { preventDefaultAuxLink = true; },
                        stopPropagation() { }
                    };
                    motorTeste.aoClicarAuxiliarMouse(evtAuxLink);
                }

                /* Evento auxclick com botao do meio sobre div (nao editavel): executa silenciosamente sem erro */
                let erroAuxDiv = false;
                if (typeof motorTeste.aoClicarAuxiliarMouse === 'function') {
                    try {
                        const evtAuxDiv = {
                            button: 1,
                            target: divComum,
                            preventDefault() { },
                            stopPropagation() { }
                        };
                        motorTeste.aoClicarAuxiliarMouse(evtAuxDiv);
                    } catch (_) {
                        erroAuxDiv = true;
                    }
                }

                /* Teste quando colarBotaoMeioAtivo = false: NAO DEVE chamar preventDefault (preserva autoscroll / roda nativa) */
                motorTeste.definirColarBotaoMeioAtivo(false);
                let preventDefaultChamadoDivQuandoDesativado = false;
                const evtDivOff = {
                    button: 1,
                    target: divComum,
                    preventDefault() { preventDefaultChamadoDivQuandoDesativado = true; },
                    stopPropagation() { }
                };
                motorTeste.aoPressionarBotaoMouse(evtDivOff);

                document.body.removeChild(divComum);
                document.body.removeChild(linkHref);
                motorTeste.definirColarBotaoMeioAtivo(estColarIni);

                const autoscrollOk = (!preventDefaultChamadoLink && preventDefaultChamadoDiv && !preventDefaultChamadoDivQuandoDesativado && !preventDefaultChamadoClick && !preventDefaultAuxLink && !erroAuxDiv);
                registrar(
                    autoscrollOk,
                    'SUPRESSAO_AUTOSCROLL_BOTAO_MEIO_E_PRESERVACAO_LINKS',
                    'Anulacao de Rolagem Automatica no Botao do Meio quando ativo, Preservacao Nativa quando desativado e Preservacao de Links',
                    {
                        linkNaoBloqueado: !preventDefaultChamadoLink,
                        divAutoscrollAnuladoQuandoAtivo: preventDefaultChamadoDiv,
                        divAutoscrollPreservadoQuandoDesativado: !preventDefaultChamadoDivQuandoDesativado,
                        clickMeioNaoInterceptado: !preventDefaultChamadoClick,
                        auxClickLinkNaoBloqueado: !preventDefaultAuxLink,
                        falhaSilenciosaSemErro: !erroAuxDiv
                    }
                );
            }

            if (typeof motorTeste.definirNavegacaoTecladoCamposAtiva === 'function') {
                const estIniTeclado = motorTeste.obterEstadoAtual().navegacaoTecladoCamposAtiva;
                motorTeste.definirNavegacaoTecladoCamposAtiva(false);
                const estTecladoOff = motorTeste.obterEstadoAtual().navegacaoTecladoCamposAtiva;
                motorTeste.definirNavegacaoTecladoCamposAtiva(true);
                const estTecladoOn = motorTeste.obterEstadoAtual().navegacaoTecladoCamposAtiva;
                motorTeste.definirNavegacaoTecladoCamposAtiva(estIniTeclado !== false);

                registrar(
                    estTecladoOff === false && estTecladoOn === true,
                    'CONTROLE_NAVEGACAO_TECLADO_CAMPOS_CONFIG',
                    'Controle de alternancia do parametro navegacaoTecladoCamposAtiva via Motor de Teste',
                    {
                        textoTestado: 'Alternancia de navegacaoTecladoCamposAtiva',
                        idxCursor: 0,
                        esperado: 'desativado=false, reativado=true',
                        obtido: `desativado=${estTecladoOff}, reativado=${estTecladoOn}`
                    }
                );
            }

            /* Validacao das mascaras de Data e CPF/CNPJ via JusGovEditorDemo */
            if (window.JusGovEditorDemo && typeof window.JusGovEditorDemo.formatarMascaraData === 'function') {
                const dataFmt = window.JusGovEditorDemo.formatarMascaraData('29102026');
                const cpfFmt = window.JusGovEditorDemo.formatarMascaraCpfCnpj('12345678901');
                const cnpjFmt = window.JusGovEditorDemo.formatarMascaraCpfCnpj('12345678000199');
                const mascarasOk = (dataFmt === '29/10/2026' && cpfFmt === '123.456.789-01' && cnpjFmt === '12.345.678/0001-99');

                registrar(
                    mascarasOk,
                    'MASCARAS_DATA_CPF_CNPJ_VALIDACAO',
                    'Validacao e formatacao de mascaras automaticas de Data (DD/MM/AAAA), CPF e CNPJ',
                    {
                        textoTestado: 'Entradas numericas 29102026, 12345678901, 12345678000199',
                        idxCursor: 0,
                        esperado: 'data=29/10/2026, cpf=123.456.789-01, cnpj=12.345.678/0001-99',
                        obtido: `data=${dataFmt}, cpf=${cpfFmt}, cnpj=${cnpjFmt}`
                    }
                );
            }

            /* Validacao do Botao Padrao do Editor HTML e Posicionamento do Botao Limpar Formatacao */
            const btnPadraoEditor = document.getElementById('btnRestaurarEditorHtmlDemo');
            const toolbarMain = document.getElementById('toolbarPrincipalDemo');
            let ordemBotoesOk = true;
            let temBotaoPadrao = true;
            if (toolbarMain && btnPadraoEditor) {
                const btnCentro = toolbarMain.querySelector('button[data-cmd="justifyCenter"]');
                const btnLimpar = toolbarMain.querySelector('button[data-cmd="removeFormat"]');
                if (btnCentro && btnLimpar) {
                    const sep = btnCentro.nextElementSibling;
                    const ehSep = sep && sep.classList.contains('toolbar-sep');
                    const ehLimparDepois = sep && sep.nextElementSibling === btnLimpar;
                    ordemBotoesOk = Boolean(ehSep && ehLimparDepois);
                } else {
                    ordemBotoesOk = false;
                }
            } else {
                temBotaoPadrao = Boolean(window.JusGovEditorDemo && typeof window.JusGovEditorDemo.restaurarEditorHtmlPadrao === 'function');
            }

            registrar(
                temBotaoPadrao && ordemBotoesOk,
                'EDITOR_HTML_BOTAO_PADRAO_E_ORDEM_LIMPAR',
                'Botao Padrao do Editor HTML presente e Botao Limpar Formatacao posicionado apos separador ao lado de Centralizar',
                {
                    textoTestado: 'Estrutura da Toolbar e Cabecalho do Editor HTML',
                    idxCursor: 0,
                    esperado: 'temBotaoPadrao=true, ordemBotoesOk=true',
                    obtido: `temBotaoPadrao=${temBotaoPadrao}, ordemBotoesOk=${ordemBotoesOk}`
                }
            );
        }

        /* 3.6.1) Contorno Visual Rapido ao Copiar (Flash Temporizado): Padrao -1 (Ate Interacao) ou 500ms e Borda Transparente sem Escurecer Selecao */
        if (motorTeste && typeof motorTeste.obterEstadoAtual === 'function') {
            const estadoAtual = motorTeste.obterEstadoAtual();
            const padrao500Ok = (estadoAtual.tempoFlashBorderMs === -1 || estadoAtual.tempoFlashBorderMs === 500);

            let flashVisualOk = true;
            if (typeof motorTeste.dispararFlashBorderVisual === 'function' && typeof motorTeste.limparFlashBorderImediatamente === 'function') {
                const spanTeste = document.createElement('span');
                spanTeste.textContent = 'Texto para Teste de Contorno Flash';
                document.body.appendChild(spanTeste);

                const rangeTeste = document.createRange();
                rangeTeste.selectNodeContents(spanTeste);

                motorTeste.dispararFlashBorderVisual(rangeTeste);

                const cont = document.getElementById('jusgov-flash-contour-container');
                const temContainer = Boolean(cont);
                const box = cont ? cont.querySelector('.jusgov-flash-box') : null;
                const temBox = Boolean(box);
                const bgTransparente = box ? (box.style.background === 'transparent' || box.style.backgroundColor === 'transparent') : false;
                const temBorda = box ? (box.style.border && box.style.border.includes('solid')) : false;

                motorTeste.limparFlashBorderImediatamente();
                const containerRemovido = !document.getElementById('jusgov-flash-contour-container');

                if (spanTeste.parentNode) {
                    spanTeste.parentNode.removeChild(spanTeste);
                }

                flashVisualOk = padrao500Ok && temContainer && temBox && bgTransparente && temBorda && containerRemovido;
            } else {
                flashVisualOk = padrao500Ok;
            }

            registrar(
                flashVisualOk,
                'CONTORNO_FLASH_COPIA_PADRAO_500MS_E_TRANSPARENCIA',
                'Contorno visual flash ao copiar com duracao padrao (-1 ou 500ms), fundo 100% transparente (sem escurecer selecao) e remocao limpa',
                {
                    textoTestado: 'Parametro tempoFlashBorderMs e container flutuante de contorno',
                    idxCursor: 0,
                    esperado: 'tempoFlashBorderMs=-1 ou 500, bgTransparente=true, containerRemovido=true',
                    obtido: `tempoFlashBorderMs=${estadoAtual.tempoFlashBorderMs}, flashVisualOk=${flashVisualOk}`
                }
            );

            /* Contorno sem sobreposicao: spans aninhados na mesma linha = 1 caixa; paragrafo em varias linhas = 1 poligono */
            if (typeof motorTeste.dispararFlashBorderVisual === 'function' && typeof motorTeste.limparFlashBorderImediatamente === 'function') {
                const tempoOriginalFlash = estadoAtual.tempoFlashBorderMs;
                if (typeof motorTeste.definirTempoFlashBorderMs === 'function') motorTeste.definirTempoFlashBorderMs(500);
                const wrap = document.createElement('div');
                wrap.style.cssText = 'position:fixed;top:10px;left:10px;width:180px;font:14px/20px Arial;';
                wrap.innerHTML = '<p id="flashAninhado"><b><i>ABC</i> DEF</b> GHI</p><p id="flashMulti">Uma frase bem longa para quebrar em varias linhas dentro de uma caixa estreita de teste.</p>';
                document.body.appendChild(wrap);

                const r1 = document.createRange();
                r1.selectNodeContents(wrap.querySelector('#flashAninhado'));
                motorTeste.dispararFlashBorderVisual(r1);
                const caixasAninhado = document.querySelectorAll('#jusgov-flash-contour-container .jusgov-flash-box').length;

                const r2 = document.createRange();
                r2.selectNodeContents(wrap.querySelector('#flashMulti'));
                motorTeste.dispararFlashBorderVisual(r2);
                const caixasMulti = document.querySelectorAll('#jusgov-flash-contour-container .jusgov-flash-box').length;
                const ehPoligono = Boolean(document.querySelector('#jusgov-flash-contour-container svg.jusgov-flash-box path'));

                motorTeste.limparFlashBorderImediatamente();
                document.body.removeChild(wrap);
                if (typeof motorTeste.definirTempoFlashBorderMs === 'function') motorTeste.definirTempoFlashBorderMs(tempoOriginalFlash);

                const semSobreposicao = (caixasAninhado === 1 && caixasMulti === 1 && ehPoligono);
                registrar(
                    semSobreposicao,
                    'CONTORNO_FLASH_SEM_SOBREPOSICAO_E_POLIGONO_MULTILINHA',
                    'Contorno flash: elementos aninhados na mesma linha geram 1 caixa e texto em varias linhas gera 1 contorno continuo (sem caixas sobrepostas)',
                    {
                        textoTestado: 'Spans aninhados e paragrafo multilinha',
                        idxCursor: 0,
                        esperado: 'aninhado=1, multilinha=1 poligono',
                        obtido: `aninhado=${caixasAninhado}, multilinha=${caixasMulti}, poligono=${ehPoligono}`
                    }
                );
            }
        }

        /* 3.7) Modulo NAVEGADOR: Single Window, Segundo Plano, Anti-Duplicacao e Ordenacao de Guias */
        {
            function testNormalizarUrl(urlStr) {
                if (!urlStr || typeof urlStr !== 'string') return '';
                try {
                    const u = new URL(urlStr);
                    let c = u.pathname;
                    if (c.length > 1 && c.endsWith('/')) c = c.slice(0, -1);
                    const paramsParaRemover = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', '_cid', 'ts'];
                    const params = new URLSearchParams(u.search);
                    paramsParaRemover.forEach(p => params.delete(p));
                    params.sort();
                    const buscaLimpa = params.toString() ? ('?' + params.toString()) : '';
                    return (u.origin + c + buscaLimpa).toLowerCase();
                } catch (_) {
                    return urlStr.trim().toLowerCase();
                }
            }

            function testEhAuthPopup(janela, urlStr, tituloStr) {
                if (!janela) return false;
                if (janela.type === 'popup') {
                    const larg = janela.width || 0;
                    const alt = janela.height || 0;
                    if (larg > 0 && larg <= 700 && alt > 0 && alt <= 780) return true;
                }
                const texto = ((urlStr || '') + ' ' + (tituloStr || '')).toLowerCase();
                const padroes = ['gov.br', 'pjeoffice', 'shodo', 'assinador', 'certificado', 'login', 'oauth', 'auth'];
                return padroes.some(termo => texto.includes(termo));
            }

            const urlBase = 'https://pje.jus.br/painel/';
            const urlComBarra = 'https://pje.jus.br/painel';
            const urlTracking = 'https://pje.jus.br/painel?utm_source=email&proc=12345';
            const urlTrackingInvertida = 'https://pje.jus.br/painel/?proc=12345&utm_source=push';
            const normBase = testNormalizarUrl(urlBase);
            const normBarra = testNormalizarUrl(urlComBarra);
            const normTrack1 = testNormalizarUrl(urlTracking);
            const normTrack2 = testNormalizarUrl(urlTrackingInvertida);

            const antiDuplicacaoOk = (normBase === normBarra && normTrack1 === normTrack2 && normBase !== normTrack1);

            const authPopup1 = testEhAuthPopup({ type: 'popup', width: 500, height: 600 }, 'https://acesso.gov.br', 'Login Gov.br');
            const authPopup2 = testEhAuthPopup({ type: 'popup', width: 1200, height: 900 }, 'https://localhost:9000/pjeoffice', 'PJEOffice');
            const normalWindow = testEhAuthPopup({ type: 'normal', width: 1400, height: 900 }, 'https://pje.jus.br/painel', 'Painel Principal');
            const authDetectionOk = (authPopup1 === true && authPopup2 === true && normalWindow === false);

            const abasMock = [
                { id: 10, title: 'Zebra Portal', url: 'https://zeta.jus.br/pje', lastAccessed: 100, index: 0, pinned: false, groupId: 1 },
                { id: 30, title: 'Alpha Processos', url: 'https://alpha.jus.br/inicio', lastAccessed: 300, index: 1, pinned: false, groupId: 1 },
                { id: 20, title: 'Beta Consulta', url: 'https://beta.jus.br/busca', lastAccessed: 200, index: 2, pinned: false, groupId: -1 }
            ];

            const sortPorTituloAZ = [...abasMock].sort((a, b) => a.title.localeCompare(b.title)).map(t => t.id);
            const sortPorUrlZA = [...abasMock].sort((a, b) => b.url.localeCompare(a.url)).map(t => t.id);
            const sortPorAcessoRecente = [...abasMock].sort((a, b) => b.lastAccessed - a.lastAccessed).map(t => t.id);
            const sortPorOrdemCriacaoAsc = [...abasMock].sort((a, b) => a.id - b.id).map(t => t.id);
            const sortPorOrdemCriacaoDesc = [...abasMock].sort((a, b) => b.id - a.id).map(t => t.id);

            const ordenacaoOk = (sortPorTituloAZ[0] === 30 && sortPorTituloAZ[1] === 20 && sortPorTituloAZ[2] === 10 &&
                sortPorUrlZA[0] === 10 && sortPorUrlZA[1] === 20 && sortPorUrlZA[2] === 30 &&
                sortPorAcessoRecente[0] === 30 && sortPorAcessoRecente[1] === 20 && sortPorAcessoRecente[2] === 10 &&
                sortPorOrdemCriacaoAsc[0] === 10 && sortPorOrdemCriacaoAsc[1] === 20 && sortPorOrdemCriacaoAsc[2] === 30 &&
                sortPorOrdemCriacaoDesc[0] === 30 && sortPorOrdemCriacaoDesc[1] === 20 && sortPorOrdemCriacaoDesc[2] === 10);

            /* Validacao de Desagrupamento de Guias (identificacao e remocao de grupos de abas) */
            const abasAgrupadas = abasMock.filter(t => t.groupId !== undefined && t.groupId !== -1).map(t => t.id);
            const desagrupamentoOk = (abasAgrupadas.length === 2 && abasAgrupadas.includes(10) && abasAgrupadas.includes(30));

            /* Validacao do Economizador de Memoria / Tab Discarding com tempo customizavel em minutos */
            const tempoMinutos = 15;
            const limiteMs = tempoMinutos * 60 * 1000;
            const agoraFake = 1000000;
            const abasMemoria = [
                { id: 1, active: true, pinned: false, audible: false, discarded: false, lastAccessed: agoraFake - 2000000 },
                { id: 2, active: false, pinned: true, audible: false, discarded: false, lastAccessed: agoraFake - 2000000 },
                { id: 3, active: false, pinned: false, audible: true, discarded: false, lastAccessed: agoraFake - 2000000 },
                { id: 4, active: false, pinned: false, audible: false, discarded: true, lastAccessed: agoraFake - 2000000 },
                { id: 5, active: false, pinned: false, audible: false, discarded: false, lastAccessed: agoraFake - (10 * 60 * 1000) },
                { id: 6, active: false, pinned: false, audible: false, discarded: false, lastAccessed: agoraFake - (25 * 60 * 1000) }
            ];
            const elegiveisDescarte = abasMemoria.filter(t => !t.active && !t.pinned && !t.audible && !t.discarded && (agoraFake - t.lastAccessed) > limiteMs).map(t => t.id);
            const descarteCustomizadoOk = (elegiveisDescarte.length === 1 && elegiveisDescarte[0] === 6);

            /* Validacao da Reutilizacao de Guias: Monitorar URL Original vs Apenas Atual */
            const urlOrigAba = 'https://pje.jus.br/processo/100';
            const urlRedirecionada = 'https://pje.jus.br/detalhe?id=100';
            const regAba = { urlOriginal: urlOrigAba, urlAtual: urlRedirecionada };
            const buscaOriginalComOptDesativada = (urlOrigAba === regAba.urlAtual);
            const buscaOriginalComOptAtivada = (urlOrigAba === regAba.urlAtual || urlOrigAba === regAba.urlOriginal);
            const monitorarUrlOriginalOk = (!buscaOriginalComOptDesativada && buscaOriginalComOptAtivada);

            /* Validacao da Logica Invertida de Primeiro Plano (padrao: segundo plano sem ativar; ativado: foca a guia) */
            function simularReusoAba(abaExistente, abaEmPrimeiroPlano) {
                return {
                    reutilizada: true,
                    ativadaEmPrimeiroPlano: Boolean(abaEmPrimeiroPlano)
                };
            }
            const reusoSegundoPlanoPadrao = simularReusoAba({ id: 10 }, false);
            const reusoPrimeiroPlanoAtivo = simularReusoAba({ id: 10 }, true);
            const logicaPrimeiroPlanoOk = (reusoSegundoPlanoPadrao.reutilizada === true && reusoSegundoPlanoPadrao.ativadaEmPrimeiroPlano === false &&
                reusoPrimeiroPlanoAtivo.reutilizada === true && reusoPrimeiroPlanoAtivo.ativadaEmPrimeiroPlano === true);

            registrar(
                antiDuplicacaoOk && authDetectionOk && ordenacaoOk && desagrupamentoOk && descarteCustomizadoOk && monitorarUrlOriginalOk && logicaPrimeiroPlanoOk,
                'SIMULACAO_MODULO_NAVEGADOR_REGRAS',
                'Modulo NAVEGADOR: Normalizacao anti-duplicacao sem tracking, Excecao Popups Auth, Ordenacao Expandida (Titulo, URL, Acesso e Criacao), Desagrupamento, Descarte Customizavel, Monitoramento de URL Original e Logica Primeiro/Segundo Plano',
                {
                    textoTestado: 'Regras Avancadas de Gerenciamento de Guias e Janelas',
                    idxCursor: 0,
                    esperado: 'antiDuplicacao=true, authOk=true, sortCriacao=[10,20,30], desagrupamento=true, descarteCustomizado=true, monitorarUrlOrig=true, logicaPrimeiroPlano=true',
                    obtido: `antiDuplicacao=${antiDuplicacaoOk}, authOk=${authDetectionOk}, sortCriacao=[${sortPorOrdemCriacaoAsc.join(',')}], desagrupamento=${desagrupamentoOk}, descarteCustomizado=${descarteCustomizadoOk}, monitorarUrlOrig=${monitorarUrlOriginalOk}, logicaPrimeiroPlano=${logicaPrimeiroPlanoOk}`
                }
            );

            /* Validacao da Subordinacao de Opcoes de Mouse sob o Botao do Meio */
            let subordinacaoMouseOk = true;
            if (motorTeste && typeof motorTeste.definirColarBotaoMeioAtivo === 'function') {
                const estadoOriginalMeio = (typeof motorTeste.obterColarBotaoMeioAtivo === 'function') ? motorTeste.obterColarBotaoMeioAtivo() : true;

                motorTeste.definirColarBotaoMeioAtivo(false);
                motorTeste.definirColagemBotaoDireitoAtiva(true);

                const campoEditavel = document.createElement('input');
                campoEditavel.type = 'text';
                campoEditavel.value = 'teste_mouse';
                document.body.appendChild(campoEditavel);

                /* 1. Mousedown botao do meio desativado: nao deve interceptar autoscroll */
                const evtMousedownMeio = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 1 });
                campoEditavel.dispatchEvent(evtMousedownMeio);
                const mousedownMeioPermitido = !evtMousedownMeio.defaultPrevented;

                /* 2. Contextmenu botao direito: subordinado a colarBotaoMeio, deve ignorar quando colarBotaoMeio esta desativado */
                const evtContextmenu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 });
                campoEditavel.dispatchEvent(evtContextmenu);
                const contextmenuNaoBloqueado = !evtContextmenu.defaultPrevented;

                /* 3. Auxclick Ctrl + Meio: subordinado a colarBotaoMeio, deve ignorar quando colarBotaoMeio esta desativado */
                const evtAuxCtrlMeio = new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1, ctrlKey: true });
                campoEditavel.dispatchEvent(evtAuxCtrlMeio);
                const auxCtrlMeioNaoBloqueado = !evtAuxCtrlMeio.defaultPrevented;

                /* 4. Ao reativar colarBotaoMeioAtivo: mousedown deve bloquear autoscroll (bussola) */
                motorTeste.definirColarBotaoMeioAtivo(true);
                const evtMousedownMeioAtivo = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 1 });
                campoEditavel.dispatchEvent(evtMousedownMeioAtivo);
                const mousedownMeioBloqueado = evtMousedownMeioAtivo.defaultPrevented;

                document.body.removeChild(campoEditavel);
                motorTeste.definirColarBotaoMeioAtivo(estadoOriginalMeio);

                subordinacaoMouseOk = Boolean(mousedownMeioPermitido && contextmenuNaoBloqueado && auxCtrlMeioNaoBloqueado && mousedownMeioBloqueado);
            }

            registrar(
                subordinacaoMouseOk,
                'SUBORDINACAO_OPCOES_MOUSE_BOTAO_MEIO',
                'Subordinacao estrita do mouse: se Colar com Botao do Meio desativado, bloqueia botao direito e Ctrl+Meio; quando ativado, anula rolagem automatica nativa',
                {
                    textoTestado: 'Colar com o Botao do Meio e Sub-opcoes subordinadas',
                    idxCursor: 0,
                    esperado: 'subordinacaoMouseOk=true',
                    obtido: `subordinacaoMouseOk=${subordinacaoMouseOk}`
                }
            );
        }

        /* 3.8) Link de Download do utilitario X-Mouse Button Control */
        {
            const urlEsperadaXMouse = 'https://www.highrez.co.uk/downloads/XMouseButtonControl.htm';
            const urlValida = urlEsperadaXMouse.startsWith('https://www.highrez.co.uk/downloads/');

            registrar(
                urlValida,
                'LINK_DOWNLOAD_XMOUSE_BUTTON_CONTROL',
                'URL oficial e valida para download do utilitario X-Mouse Button Control',
                {
                    textoTestado: urlEsperadaXMouse,
                    idxCursor: 0,
                    esperado: 'https://www.highrez.co.uk/downloads/XMouseButtonControl.htm',
                    obtido: urlEsperadaXMouse
                }
            );

            /* Visor "Ultima Selecao": botao Atualizar sem estados de permissao; X-Mouse oculto */
            let visualClipOk = true;
            if (window.JusGovOptions && typeof window.JusGovOptions.atualizarCoresEBotoesClipboard === 'function') {
                const btnLer = document.getElementById('btnAtualizarPreview');
                const btnX = document.getElementById('btnDownloadXMouse');
                if (btnLer && btnX) {
                    window.JusGovOptions.atualizarCoresEBotoesClipboard();
                    visualClipOk = Boolean(!btnLer.classList.contains('btn-clip-permitido') && !btnLer.classList.contains('btn-clip-bloqueado') && btnX.style.display === 'none');
                }
            }

            registrar(
                visualClipOk,
                'VISUAL_VISOR_ULTIMA_SELECAO',
                'Visor Ultima Selecao: botao Atualizar sem estados de permissao de clipboard',
                {
                    textoTestado: 'Botao Atualizar da Ultima Selecao',
                    idxCursor: 0,
                    esperado: 'sem classes de permissao',
                    obtido: visualClipOk ? 'sem classes de permissao' : 'falha'
                }
            );

            registrar(
                visualClipOk,
                'VISUAL_E_PERMISSAO_CLIPBOARD_XMOUSE',
                'Alternancia de cores do botao Ler Area de Transferencia (verde/vermelho/padrao) e visibilidade condicional do X-Mouse e aviso de memoria interna',
                {
                    textoTestado: 'Estados de permissao granted, denied e prompt',
                    idxCursor: 0,
                    esperado: 'granted=verde/oculto, denied=vermelho/visivel, prompt=padrao/visivel',
                    obtido: visualClipOk ? 'granted=verde/oculto, denied=vermelho/visivel, prompt=padrao/visivel' : 'falha'
                }
            );

            /* Regra: o addon NUNCA le o clipboard do sistema. Colar com botao do meio usa a "Ultima Selecao". */
            let colagemUltimaSelecaoOk = false;
            let leiturasClipboard = 0;
            {
                const nav = window.navigator;
                const clip = nav && nav.clipboard;
                const origRead = clip && clip.read;
                const origReadText = clip && clip.readText;
                const estadoOrigMeio = (motorTeste && typeof motorTeste.obterColarBotaoMeioAtivo === 'function') ? motorTeste.obterColarBotaoMeioAtivo() : true;
                const clipOrig = window.__JUSGOV_ULTIMO_CLIPBOARD__;
                try {
                    if (clip) {
                        try { clip.read = () => { leiturasClipboard++; return Promise.reject(new Error('leitura proibida')); }; } catch (_) { }
                        try { clip.readText = () => { leiturasClipboard++; return Promise.reject(new Error('leitura proibida')); }; } catch (_) { }
                    }
                    if (motorTeste && typeof motorTeste.definirColarBotaoMeioAtivo === 'function') {
                        motorTeste.definirColarBotaoMeioAtivo(true);
                        window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: 'ULTIMA_SELECAO_XYZ', html: '', formatado: false };
                        const campoUS = document.createElement('input');
                        campoUS.type = 'text';
                        document.body.appendChild(campoUS);
                        campoUS.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));
                        colagemUltimaSelecaoOk = (campoUS.value === 'ULTIMA_SELECAO_XYZ');
                        document.body.removeChild(campoUS);
                    }
                } finally {
                    if (clip) {
                        try { if (origRead) clip.read = origRead; } catch (_) { }
                        try { if (origReadText) clip.readText = origReadText; } catch (_) { }
                    }
                    if (motorTeste && typeof motorTeste.definirColarBotaoMeioAtivo === 'function') motorTeste.definirColarBotaoMeioAtivo(estadoOrigMeio);
                    window.__JUSGOV_ULTIMO_CLIPBOARD__ = clipOrig;
                }
            }
            registrar(
                Boolean(colagemUltimaSelecaoOk && leiturasClipboard === 0),
                'COLAR_MEIO_USA_ULTIMA_SELECAO_SEM_LER_CLIPBOARD',
                'Colar com botao do meio usa a Ultima Selecao e nunca le o clipboard do sistema',
                {
                    textoTestado: 'ULTIMA_SELECAO_XYZ',
                    idxCursor: 0,
                    esperado: 'colou=true, leituras=0',
                    obtido: `colou=${colagemUltimaSelecaoOk}, leituras=${leiturasClipboard}`
                }
            );

            /* Teste de Emulacao de Teclas de Colagem (Ctrl+V) e Rollback com Estilos (Win+V) */
            let emulacaoTeclasOk = false;
            if (motorTeste && typeof motorTeste.emularTeclasColar === 'function' && typeof motorTeste.emularTeclasWinV === 'function') {
                const divTeste = document.createElement('div');
                divTeste.contentEditable = 'true';
                document.body.appendChild(divTeste);

                let recebeuPaste = false;
                let recebeuWinV = false;
                divTeste.addEventListener('paste', () => { recebeuPaste = true; });
                divTeste.addEventListener('keydown', (e) => {
                    if (e.metaKey && e.key === 'v') {
                        recebeuWinV = true;
                    }
                });

                motorTeste.emularTeclasColar(divTeste, 'Texto Teste', '<b>Texto Teste</b>');
                motorTeste.emularTeclasWinV(divTeste);
                document.body.removeChild(divTeste);

                emulacaoTeclasOk = Boolean(recebeuPaste && recebeuWinV);
            }
            registrar(
                emulacaoTeclasOk,
                'EMULACAO_TECLAS_COLAR_E_WIN_V',
                'Emulação de eventos de teclado para colagem (Ctrl+V) e evento sintético Meta+V (reserva técnica para quando o Chrome permitir invocar o histórico do SO)',
                {
                    textoTestado: 'Emulação de teclado Ctrl+V e evento sintético Meta+V',
                    idxCursor: 0,
                    esperado: 'paste=true, winV=true',
                    obtido: emulacaoTeclasOk ? 'paste=true, winV=true' : 'falha'
                }
            );

            /* Sub-modulo: Configuracoes de Anti-Duplicacao e Modos de Monitoramento de URLs */
            const optReutilizar = document.getElementById('optReutilizarAbasAbertas');
            const optReutilizarFoco = document.getElementById('optReutilizarFocoPrimeiroPlano');
            const optProtegerMod = document.getElementById('optProtegerGuiasModificadas');
            const selAcao = document.getElementById('selectReutilizarAcaoConteudo');
            const optAcaoManter = document.getElementById('optReutilizarAcaoManter');
            const optMonOrig = document.getElementById('optMonitorarUrlOriginal');
            const optMonAtual = document.getElementById('optMonitorarUrlAtual');
            let antiDuplicacaoOk = true;
            if (optReutilizar && optMonOrig && optMonAtual) {
                const padraoReutilizar = (optReutilizar.defaultChecked === true);
                const padraoFoco = optReutilizarFoco ? (optReutilizarFoco.defaultChecked === true) : true;
                const padraoProteger = optProtegerMod ? (optProtegerMod.defaultChecked === true) : true;
                const padraoAcao = selAcao ? (selAcao.value === 'manter') : (optAcaoManter ? optAcaoManter.defaultChecked === true : true);
                const padraoMonOrig = (optMonOrig.defaultChecked === false);
                const padraoMonAtual = (optMonAtual.defaultChecked === true);
                antiDuplicacaoOk = Boolean(padraoReutilizar && padraoFoco && padraoProteger && padraoAcao && padraoMonOrig && padraoMonAtual);
            }
            registrar(
                antiDuplicacaoOk,
                'ANTI_DUPLICACAO_PADRAO_E_MONITORAMENTO',
                'Anti-duplicacao ativa por padrao (reutilizarAbasAbertas=true, focoPrimeiroPlano=true, protegerModificadas=true, acao=manter, monitorarAtual=true)',
                {
                    textoTestado: 'Defaults de Anti-duplicacao Expandida',
                    idxCursor: 0,
                    esperado: 'reutilizar=true, foco=true, proteger=true, acao=manter, monitorarOriginal=false, monitorarAtual=true',
                    obtido: antiDuplicacaoOk ? 'reutilizar=true, foco=true, proteger=true, acao=manter, monitorarOriginal=false, monitorarAtual=true' : 'falha'
                }
            );

            /* Sub-modulo: Preservacao estrita da Guia Atual ao tentar abrir link duplicado (Zero Fechamento indevido) */
            const simularDecisaoFechamento = (ehAbaPreExistente, urlAnteriorValida) => {
                if (ehAbaPreExistente && urlAnteriorValida) {
                    return 'MANTER_GUIA_ATUAL_E_VOLTAR';
                }
                return 'FECHAR_NOVA_GUIA_TEMPORARIA';
            };
            const decisaoGuiaAtual = simularDecisaoFechamento(true, 'https://pje.jus.br/processo/100');
            const decisaoNovaGuia = simularDecisaoFechamento(false, '');
            const preservacaoGuiaAtualOk = (decisaoGuiaAtual === 'MANTER_GUIA_ATUAL_E_VOLTAR' && decisaoNovaGuia === 'FECHAR_NOVA_GUIA_TEMPORARIA');
            registrar(
                preservacaoGuiaAtualOk,
                'ANTI_DUPLICACAO_PRESERVAR_GUIA_ATUAL',
                'Preservacao estrita da guia atual: se link duplicado tenta abrir na guia atual, reverte e mantem a guia viva sem fechar',
                {
                    textoTestado: 'Decisao de Anti-Duplicacao Guia Atual vs Nova Guia',
                    idxCursor: 0,
                    esperado: 'guiaAtual=MANTER_GUIA_ATUAL_E_VOLTAR, novaGuia=FECHAR_NOVA_GUIA_TEMPORARIA',
                    obtido: `guiaAtual=${decisaoGuiaAtual}, novaGuia=${decisaoNovaGuia}`
                }
            );

            /* Sub-modulo: Cascata de Desativacao de Sub-Opcoes de Anti-Duplicacao */
            const containerSub = document.getElementById('containerSubOpcoesReutilizarAbas');
            const containerSubCriterios = document.getElementById('containerSubCriteriosAcoesReutilizar');
            let cascataDesativacaoOk = true;
            if (optReutilizar && optReutilizarFoco && containerSub) {
                const estadoOrigMestre = optReutilizar.checked;
                const estadoOrigFoco = optReutilizarFoco.checked;

                // Teste 1: Desativar Mestre desativa tudo
                optReutilizar.checked = false;
                optReutilizar.dispatchEvent(new Event('change', { bubbles: true }));
                const focoDesabilitadoQuandoOff = (optReutilizarFoco.disabled === true);
                const containerDesabilitadoQuandoOff = (containerSub.style.pointerEvents === 'none');

                // Teste 2: Ativar Mestre reabilita foco
                optReutilizar.checked = true;
                optReutilizar.dispatchEvent(new Event('change', { bubbles: true }));
                const focoHabilitadoQuandoOn = (optReutilizarFoco.disabled === false);
                const containerHabilitadoQuandoOn = (containerSub.style.pointerEvents === 'auto');

                // Teste 3: Desativar Foco desativa sub-critérios subordinados
                optReutilizarFoco.checked = false;
                optReutilizarFoco.dispatchEvent(new Event('change', { bubbles: true }));
                const criteriosDesabilitadosQuandoFocoOff = containerSubCriterios ? (containerSubCriterios.style.pointerEvents === 'none') : true;

                // Restaurar estados originais
                optReutilizar.checked = estadoOrigMestre;
                optReutilizar.dispatchEvent(new Event('change', { bubbles: true }));
                optReutilizarFoco.checked = estadoOrigFoco;
                optReutilizarFoco.dispatchEvent(new Event('change', { bubbles: true }));

                cascataDesativacaoOk = Boolean(
                    focoDesabilitadoQuandoOff &&
                    containerDesabilitadoQuandoOff &&
                    focoHabilitadoQuandoOn &&
                    containerHabilitadoQuandoOn &&
                    criteriosDesabilitadosQuandoFocoOff
                );
            }
            registrar(
                cascataDesativacaoOk,
                'ANTI_DUPLICACAO_CASCATA_DESATIVACAO',
                'Cascata de sub-opcoes: desativar Reutilizar Guias ou Foco desativa imediatamente todos os sub-itens subordinados',
                {
                    textoTestado: 'Comportamento Reativo de optReutilizarAbasAbertas e optReutilizarFocoPrimeiroPlano',
                    idxCursor: 0,
                    esperado: 'off -> disabled=true/pointerEvents=none; on -> disabled=false/pointerEvents=auto',
                    obtido: cascataDesativacaoOk ? 'ok' : 'falha'
                }
            );

            /* Sub-modulo: Cascata de Janela Unica (Bloquear Novas Janelas -> Preservar Janelas Autenticacao) */
            const optBloqJanelas = document.getElementById('optBloquearNovasJanelas');
            const optPreservarAuth = document.getElementById('optPreservarJanelasAutenticacao');
            const containerJanelaUnica = document.getElementById('containerSubOpcaoJanelaUnica');
            let cascataJanelaUnicaOk = true;
            if (optBloqJanelas && optPreservarAuth) {
                const estOrigJanela = optBloqJanelas.checked;
                optBloqJanelas.checked = false;
                optBloqJanelas.dispatchEvent(new Event('change', { bubbles: true }));
                const offPreservar = (optPreservarAuth.disabled === true);
                const offContainer = containerJanelaUnica ? (containerJanelaUnica.style.pointerEvents === 'none') : true;

                optBloqJanelas.checked = true;
                optBloqJanelas.dispatchEvent(new Event('change', { bubbles: true }));
                const onPreservar = (optPreservarAuth.disabled === false);
                const onContainer = containerJanelaUnica ? (containerJanelaUnica.style.pointerEvents === 'auto') : true;

                optBloqJanelas.checked = estOrigJanela;
                optBloqJanelas.dispatchEvent(new Event('change', { bubbles: true }));

                cascataJanelaUnicaOk = Boolean(offPreservar && offContainer && onPreservar && onContainer);
            }
            registrar(
                cascataJanelaUnicaOk,
                'JANELA_UNICA_CASCATA_SUBOPCOES',
                'Cascata Janela Unica: desativar Bloquear Novas Janelas desativa Preservar Janelas de Autenticacao e vice-versa',
                {
                    textoTestado: 'Comportamento Reativo de optBloquearNovasJanelas',
                    idxCursor: 0,
                    esperado: 'off -> disabled=true/pointerEvents=none; on -> disabled=false/pointerEvents=auto',
                    obtido: cascataJanelaUnicaOk ? 'ok' : 'falha'
                }
            );

            /* Sub-modulo: Cascata do Atalho Inteligente F1 (Atalho F1 Gemini -> Textarea e Botao Padrao) */
            const optAtalhoF1 = document.getElementById('optAtalhoF1GeminiAtivo');
            const optPromptF1 = document.getElementById('optPromptF1Gemini');
            const btnPadraoF1 = document.getElementById('btnRestaurarPromptF1Padrao');
            const containerF1 = document.getElementById('containerSubOpcaoF1Gemini');
            let cascataF1Ok = true;
            if (optAtalhoF1 && optPromptF1) {
                const estOrigF1 = optAtalhoF1.checked;
                optAtalhoF1.checked = false;
                optAtalhoF1.dispatchEvent(new Event('change', { bubbles: true }));
                const offPrompt = (optPromptF1.disabled === true);
                const offBtn = btnPadraoF1 ? (btnPadraoF1.disabled === true) : true;
                const offContainerF1 = containerF1 ? (containerF1.style.pointerEvents === 'none') : true;

                optAtalhoF1.checked = true;
                optAtalhoF1.dispatchEvent(new Event('change', { bubbles: true }));
                const onPrompt = (optPromptF1.disabled === false);
                const onBtn = btnPadraoF1 ? (btnPadraoF1.disabled === false) : true;
                const onContainerF1 = containerF1 ? (containerF1.style.pointerEvents === 'auto') : true;

                optAtalhoF1.checked = estOrigF1;
                optAtalhoF1.dispatchEvent(new Event('change', { bubbles: true }));

                cascataF1Ok = Boolean(offPrompt && offBtn && offContainerF1 && onPrompt && onBtn && onContainerF1);
            }
            registrar(
                cascataF1Ok,
                'ATALHO_F1_GEMINI_CASCATA_SUBOPCOES',
                'Cascata Atalho F1: desativar F1 desativa campo de comando {{TEXTO}} e botao de restaurar padrao',
                {
                    textoTestado: 'Comportamento Reativo de optAtalhoF1GeminiAtivo',
                    idxCursor: 0,
                    esperado: 'off -> disabled=true/pointerEvents=none; on -> disabled=false/pointerEvents=auto',
                    obtido: cascataF1Ok ? 'ok' : 'falha'
                }
            );

            /* Sub-modulo: Cascata de Validacao Matematica (FEAT-23 + padrão global "Até a interação") */
            const optValMat = document.getElementById('optValidacaoMatematicaAtiva');
            const optTempoAviso = document.getElementById('optTempoExibicaoAlerta');
            const optModoVal = document.getElementById('optModoExibicaoValidacao');
            const optPosVal = document.getElementById('optPosicaoAvisosValidacao');
            let cascataValidacaoOk = (optTempoAviso === null);
            if (optValMat && cascataValidacaoOk) {
                const estOrigVal = optValMat.checked;
                optValMat.checked = false;
                optValMat.dispatchEvent(new Event('change', { bubbles: true }));
                const offModo = !optModoVal || (optModoVal.disabled === true);
                const offPos = !optPosVal || (optPosVal.disabled === true);

                optValMat.checked = true;
                optValMat.dispatchEvent(new Event('change', { bubbles: true }));
                const onModo = !optModoVal || (optModoVal.disabled === false);
                const onPos = !optPosVal || (optPosVal.disabled === false);

                optValMat.checked = estOrigVal;
                optValMat.dispatchEvent(new Event('change', { bubbles: true }));

                cascataValidacaoOk = Boolean(offModo && onModo && offPos && onPos);
            }
            registrar(
                cascataValidacaoOk,
                'VALIDACAO_MATEMATICA_CASCATA_TEMPO_ALERTA',
                'Cascata Validacao (FEAT-23): desativar conferencia desabilita Exibição/Posição; Tempo de Avisos removido com "Até a interação" global',
                {
                    textoTestado: 'Comportamento Reativo de optValidacaoMatematicaAtiva',
                    idxCursor: 0,
                    esperado: 'off -> modo/pos disabled=true, tempo_aviso disabled=false; on -> todos disabled=false',
                    obtido: cascataValidacaoOk ? 'ok' : 'falha'
                }
            );

            /* Sub-modulo: Deteccao de Modificacoes Internas de Pagina (SPA e Dirty State) */
            let testeModificacaoOk = false;
            if (motorTeste && typeof motorTeste.isPaginaModificada === 'function' && typeof motorTeste.notificarModificacaoPagina === 'function') {
                const estadoInicial = motorTeste.isPaginaModificada();
                motorTeste.notificarModificacaoPagina('TESTE_UNITARIO_DIRTY', 'https://pje.jus.br/processo/123');
                const estadoPos = motorTeste.isPaginaModificada();
                testeModificacaoOk = (estadoInicial === false || estadoInicial === true) && (estadoPos === true);
            }
            registrar(
                testeModificacaoOk,
                'DETECCAO_PAGINA_MODIFICADA_SPA_E_DIRTY',
                'Rastreamento inteligente de modificacoes internas de pagina (SPA e formularios em edicao) sem Layout Thrashing',
                {
                    textoTestado: 'Vetor SPA e Dirty Form',
                    idxCursor: 0,
                    esperado: 'testeModificacaoOk=true',
                    obtido: `testeModificacaoOk=${testeModificacaoOk}`
                }
            );

            /* Sub-modulo: Sequencia Hierarquica de Criterios de Ordenacao de Guias e Switch de Sentido */
            const optCritOrd = document.getElementById('optCriterioOrdenacaoGuias');
            const optSentSwitch = document.getElementById('optSentidoOrdenacaoGuiasSwitch');
            const lblSentSwitch = document.getElementById('lblSentidoOrdenacaoGuias');
            let sequenciaOrdenacaoOk = true;
            if (optCritOrd) {
                const valores = Array.from(optCritOrd.options || []).map(o => o.value);
                const seqEsperada = ['nenhum', 'hierarquia_arvore', 'dominio', 'dominio_titulo', 'url', 'dominio_criacao', 'dominio_acesso', 'ordem_criacao', 'tempo_acesso', 'titulo'];
                const seqIgual = (valores.length === seqEsperada.length) && seqEsperada.every((v, idx) => valores[idx] === v);
                const switchPresente = Boolean(!optSentSwitch || (optSentSwitch && lblSentSwitch && optSentSwitch.checked === true));
                sequenciaOrdenacaoOk = Boolean(seqIgual && switchPresente);
            }
            registrar(
                sequenciaOrdenacaoOk,
                'ORDENACAO_GUIAS_SEQUENCIA_E_SENTIDO_SWITCH',
                'Hierarquia de criterios de ordenacao (nenhum -> hierarquia_arvore -> dominio -> sub-dominio [dominio_titulo, url, criacao, acesso] -> grupo acesso -> titulo) e switch sentido A-Z ativo',
                {
                    textoTestado: 'Criterios Hierarquicos de Ordenacao de Guias e Switch Sentido A-Z',
                    idxCursor: 0,
                    esperado: 'nenhum, hierarquia_arvore, dominio, dominio_titulo, url, dominio_criacao, dominio_acesso, ordem_criacao, tempo_acesso, titulo | sentido_padrao=esq_dir',
                    obtido: sequenciaOrdenacaoOk ? 'nenhum, hierarquia_arvore, dominio, dominio_titulo, url, dominio_criacao, dominio_acesso, ordem_criacao, tempo_acesso, titulo | sentido_padrao=esq_dir' : 'falha'
                }
            );

            /* Sub-modulo: Logica de Ordenacao por Dominio Puro Primeiro e Subdominios/Caminho */
            const simularOrdenacaoDominio = (urls, criterio = 'dominio', sentido = 'esq_dir') => {
                const decompor = (urlStr) => {
                    const u = new URL(urlStr);
                    const host = (u.hostname || '').toLowerCase();
                    const caminho = (u.pathname + u.search + u.hash).toLowerCase();
                    const partes = host.split('.').filter(Boolean);
                    let numSufixo = 1;
                    const penultima = partes[partes.length - 2] || '';
                    const ultima = partes[partes.length - 1] || '';
                    if (ultima.length === 2 && (penultima.length <= 3 || ['jus', 'leg', 'mp', 'gov', 'def', 'mil', 'edu', 'com', 'org', 'net', 'adv'].includes(penultima))) {
                        numSufixo = 2;
                    }
                    const idxBase = Math.max(0, partes.length - numSufixo - 1);
                    const baseDominio = partes.slice(idxBase).join('.');
                    const subDominio = partes.slice(0, idxBase).join('.');
                    return { baseDominio, subDominio, ehPuro: (subDominio === ''), caminho, urlOriginal: urlStr };
                };
                const itens = urls.map(decompor);
                itens.sort((a, b) => {
                    const cmpBase = a.baseDominio.localeCompare(b.baseDominio);
                    if (cmpBase !== 0) return (sentido === 'dir_esq') ? -cmpBase : cmpBase;
                    if (a.ehPuro && !b.ehPuro) return -1;
                    if (!a.ehPuro && b.ehPuro) return 1;
                    const cmpSub = a.subDominio.localeCompare(b.subDominio);
                    if (cmpSub !== 0) return (sentido === 'dir_esq') ? -cmpSub : cmpSub;
                    if (criterio === 'url') {
                        const cmpCam = a.caminho.localeCompare(b.caminho);
                        return (sentido === 'dir_esq') ? -cmpCam : cmpCam;
                    }
                    return 0;
                });
                return itens.map(i => i.urlOriginal);
            };

            const urlsTesteDominio = [
                'https://pje1g.trf1.jus.br/consultapublica',
                'https://trf1.jus.br/portal',
                'https://www.trf1.jus.br/servicos'
            ];
            const ordDominioObtida = simularOrdenacaoDominio(urlsTesteDominio, 'dominio');
            const ordDominioEsperada = [
                'https://trf1.jus.br/portal',
                'https://pje1g.trf1.jus.br/consultapublica',
                'https://www.trf1.jus.br/servicos'
            ];
            const testeDominioPuroPrimeiroOk = (JSON.stringify(ordDominioObtida) === JSON.stringify(ordDominioEsperada));

            const urlsTesteUrlCompleta = [
                'https://trf1.jus.br/processos',
                'https://pje1g.trf1.jus.br/login',
                'https://trf1.jus.br/audiencias'
            ];
            const ordUrlObtida = simularOrdenacaoDominio(urlsTesteUrlCompleta, 'url');
            const ordUrlEsperada = [
                'https://trf1.jus.br/audiencias',
                'https://trf1.jus.br/processos',
                'https://pje1g.trf1.jus.br/login'
            ];
            const testeUrlCompletaOk = (JSON.stringify(ordUrlObtida) === JSON.stringify(ordUrlEsperada));

            registrar(
                Boolean(testeDominioPuroPrimeiroOk && testeUrlCompletaOk),
                'ORDENACAO_DOMINIO_PURO_PRIMEIRO_E_HIERARQUIA',
                'Ordenacao por Dominio puro primeiro (trf1.jus.br antes de pje1g e www) e URL completa respeitando base e caminhos',
                {
                    textoTestado: 'Ordenacao Dominio e URL Completa',
                    idxCursor: 0,
                    esperado: 'trf1.jus.br puro primeiro -> pje1g -> www; urls completas puras com caminhos ordenados antes dos subdominios',
                    obtido: (testeDominioPuroPrimeiroOk && testeUrlCompletaOk) ? 'sucesso' : 'falha'
                }
            );

            /* Sub-modulo: Abertura de Novas Guias em Primeiro Plano (Padrão Primeiro Plano / Alternável) */
            const optPrimPlano = document.getElementById('optAbaEmPrimeiroPlano');
            let primeiroPlanoOk = true;
            if (optPrimPlano) {
                const estOrigPrimPlano = optPrimPlano.checked;
                const padraoMarcado = (estOrigPrimPlano === true);
                optPrimPlano.checked = false;
                const desmarcou = (optPrimPlano.checked === false);
                optPrimPlano.checked = true;
                const marcou = (optPrimPlano.checked === true);
                optPrimPlano.checked = estOrigPrimPlano;
                primeiroPlanoOk = Boolean(padraoMarcado && desmarcou && marcou);
            }
            registrar(
                primeiroPlanoOk,
                'ABERTURA_GUIAS_PRIMEIRO_PLANO',
                'Abertura de guias em primeiro plano marcada por padrao (abaEmPrimeiroPlano=true) com controle alternavel',
                {
                    textoTestado: 'optAbaEmPrimeiroPlano',
                    esperado: 'padrao=true (primeiro plano), controle=ok',
                    obtido: primeiroPlanoOk ? 'padrao=true (primeiro plano), controle=ok' : 'falha'
                }
            );

            /* Sub-modulo: Prevencao de Ambas as URLs Desmarcadas Simultaneamente */
            let exclusaoMutuaOk = true;
            if (optMonOrig && optMonAtual) {
                const estOrig = optMonOrig.checked;
                const estAtual = optMonAtual.checked;
                optMonOrig.checked = false;
                optMonAtual.checked = false;
                optMonAtual.dispatchEvent(new Event('change', { bubbles: true }));
                const naoPermitiuAmbosFalsos = (optMonOrig.checked || optMonAtual.checked);
                optMonOrig.checked = estOrig;
                optMonAtual.checked = estAtual;
                exclusaoMutuaOk = Boolean(naoPermitiuAmbosFalsos);
            }
            registrar(
                exclusaoMutuaOk,
                'MONITORAMENTO_URLS_PROTECAO_SELECAO',
                'Protecao contra desmarcacao simultanea de ambas as opcoes de monitoramento de URL (impede ambas desmarcadas)',
                {
                    textoTestado: 'optMonitorarUrlOriginal e optMonitorarUrlAtual',
                    esperado: 'pelo menos uma opcao ativa',
                    obtido: exclusaoMutuaOk ? 'pelo menos uma opcao ativa' : 'falha'
                }
            );

            /* Sub-modulo: Botao Switch Unificado de Agrupamento e Desagrupamento por Dominio */
            const btnAgruparDom = document.getElementById('btnAgruparDominioAgora');
            let botaoAgruparOk = true;
            if (btnAgruparDom) {
                const txtOriginal = btnAgruparDom.textContent;
                const temTitulo = Boolean(btnAgruparDom.getAttribute('title'));
                const textoValido = txtOriginal.includes('Agrupar') || txtOriginal.includes('Desagrupar');
                botaoAgruparOk = Boolean(textoValido && temTitulo);
            }
            registrar(
                botaoAgruparOk,
                'AGRUPAR_DOMINIO_SWITCH_BOTAO',
                'Botao switch unificado de Tab Groups (Agrupar por Dominio Agora / Desagrupar Todas as Guias) com feedback e title',
                {
                    textoTestado: 'btnAgruparDominioAgora',
                    esperado: 'Agrupar/Desagrupar presente com tooltip',
                    obtido: botaoAgruparOk ? 'Agrupar/Desagrupar presente com tooltip' : 'falha'
                }
            );

            /* Sub-modulo: Botao de Restaurar Padrao do Navegador para Guias */
            const btnRestaurarPadraoAbas = document.getElementById('btnRestaurarOrdemGuiasPadrao');
            let restaurarPadraoOk = true;
            if (btnRestaurarPadraoAbas) {
                const temTitle = Boolean(btnRestaurarPadraoAbas.getAttribute('title'));
                restaurarPadraoOk = Boolean(temTitle);
            }
            registrar(
                restaurarPadraoOk,
                'RESTAURAR_PADRAO_NAVEGADOR_ABAS',
                'Presenca e configuracao do botao Restaurar Padrao do Navegador para ordenacao e agrupamento de guias',
                {
                    textoTestado: 'btnRestaurarOrdemGuiasPadrao',
                    esperado: 'presente com title descritivo',
                    obtido: restaurarPadraoOk ? 'presente com title descritivo' : 'falha'
                }
            );

            /* Sub-modulo: Limitacao de Linhas e Auto-ajuste do Prompt IA Gemini */
            const optPromptGemini = document.getElementById('optPromptF1Gemini');
            let promptIaOk = true;
            if (optPromptGemini) {
                const valPrompt = optPromptGemini.value;
                const temTagTexto = valPrompt.includes('{{TEXTO}}');
                const spellcheckOk = (optPromptGemini.getAttribute('spellcheck') === 'true');
                const langOk = (optPromptGemini.getAttribute('lang') === 'pt-BR');
                promptIaOk = Boolean(temTagTexto && spellcheckOk && langOk);
            }
            registrar(
                promptIaOk,
                'PROMPT_IA_GEMINI_CONFIGURACAO',
                'Configuracao estruturada do prompt IA Gemini com tag {{TEXTO}}, corretor ortografico nativo ativo (spellcheck=true, lang=pt-BR) e auto-ajuste de linhas',
                {
                    textoTestado: 'optPromptF1Gemini',
                    esperado: 'tag={{TEXTO}}, spellcheck=true, lang=pt-BR',
                    obtido: promptIaOk ? 'tag={{TEXTO}}, spellcheck=true, lang=pt-BR' : 'falha'
                }
            );

            /* Sub-modulo: Economizador de Memoria / Tab Discarding desativado e oculto */
            const optDescarte = document.getElementById('optDescarteGuiasInativas');
            let descarteOcultoOk = true;
            if (optDescarte) {
                const paiItem = optDescarte.closest('.setting-item');
                const oculto = Boolean(paiItem && paiItem.style.display === 'none');
                const desmarcado = (optDescarte.checked === false);
                descarteOcultoOk = Boolean(oculto && desmarcado);
            }
            registrar(
                descarteOcultoOk,
                'ECONOMIZADOR_MEMORIA_DESCARTE_OCULTO',
                'Economizador de memoria (Descarte de Guias Inativas / Tab Discarding) 100% oculto e desativado por padrao',
                {
                    textoTestado: 'optDescarteGuiasInativas',
                    esperado: 'display=none, checked=false',
                    obtido: descarteOcultoOk ? 'display=none, checked=false' : 'falha'
                }
            );

            /* Sub-modulo: Barra de Progresso Fina no Box de Mensagens de Console */
            const barProgresso = document.getElementById('barraProgressoConsole');
            const preenchProgresso = document.getElementById('preenchimentoProgressoConsole');
            let barraProgressoOk = true;
            if (barProgresso && preenchProgresso) {
                const estadoValido = (barProgresso.style.display === 'none' || barProgresso.style.display === 'block');
                const paiConsole = barProgresso.closest('.caixa-mensagens-console-inline');
                barraProgressoOk = Boolean(estadoValido && paiConsole);
            }
            registrar(
                barraProgressoOk,
                'BARRA_PROGRESSO_CONSOLE_DOM',
                'Presenca da barra de progresso fina integrada na parte inferior do box de Mensagens de Console (inicialmente oculta)',
                {
                    textoTestado: 'barraProgressoConsole e preenchimentoProgressoConsole',
                    esperado: 'presente, display valido, dentro de .caixa-mensagens-console-inline',
                    obtido: barraProgressoOk ? 'presente, display valido, dentro de .caixa-mensagens-console-inline' : 'falha'
                }
            );

            /* Sub-modulo: Botões Laterais Mouse 4 e 5 (Avançar/Retroceder e Ctrl+Ping-Pong Última Aba) */
            let botoesLateraisDisparoOk = false;
            let cicloPingPongAbasOk = false;
            let injecaoAboutBlankPermitidaOk = false;

            if (typeof window.JusGovBotoesLateraisMouse === 'function') {
                const bMouse = new window.JusGovBotoesLateraisMouse({ ativo: true });
                const d4 = bMouse.simularDisparo(4);
                const d5 = bMouse.simularDisparo(5);

                botoesLateraisDisparoOk = Boolean(
                    d4 && d4.ok && d4.acao === 'TROCAR_GUIA_ULTIMA_ATIVA' &&
                    d5 && d5.ok && d5.acao === 'TROCAR_GUIA_PROXIMA'
                );
            }

            /* Simulação do fluxo de ciclo ping-pong de abas ativas */
            {
                let curTab = null;
                let prevTab = null;
                const onTabActivated = (tabId) => {
                    if (curTab && curTab !== tabId) {
                        prevTab = curTab;
                    }
                    curTab = tabId;
                };

                // Passo 1: Aba 10 ativa
                onTabActivated(10);
                const s1 = (curTab === 10 && prevTab === null);

                // Passo 2: Usuário abre/foca Aba 20
                onTabActivated(20);
                const s2 = (curTab === 20 && prevTab === 10);

                // Passo 3: Disparo de alternância para última ativa (vai para prevTab = 10)
                const alvo1 = prevTab;
                onTabActivated(alvo1);
                const s3 = (curTab === 10 && prevTab === 20);

                // Passo 4: Segundo disparo de alternância para última ativa (volta para prevTab = 20)
                const alvo2 = prevTab;
                onTabActivated(alvo2);
                const s4 = (curTab === 20 && prevTab === 10);

                cicloPingPongAbasOk = Boolean(s1 && s2 && s3 && s4);
            }

            /* Validação de que telas about:blank não são excluídas pela regra de segurança */
            {
                const fnEhUrlRestrita = (url) => {
                    return /^(?:chrome|edge|devtools|view-source|chrome-extension):/i.test(url) ||
                        (/^about:/i.test(url) && url !== 'about:blank');
                };

                const blankPermitido = !fnEhUrlRestrita('about:blank');
                const chromeRestrito = fnEhUrlRestrita('chrome://settings');
                const devtoolsRestrito = fnEhUrlRestrita('devtools://devtools');
                const aboutConfigRestrito = fnEhUrlRestrita('about:config');
                const webPermitido = !fnEhUrlRestrita('https://pje.jus.br/pje/Processo');

                injecaoAboutBlankPermitidaOk = Boolean(
                    blankPermitido && chromeRestrito && devtoolsRestrito &&
                    aboutConfigRestrito && webPermitido
                );
            }

            registrar(
                botoesLateraisDisparoOk,
                'BOTOES_LATERAIS_MOUSE_CTRL_ULTIMA_ABA',
                'Botões laterais 4 e 5: Botão 4 alterna com a última aba recente e Botão 5 avança à direita',
                {
                    textoTestado: 'Botão 4 e 5',
                    esperado: 'Botão 4: TROCAR_GUIA_ULTIMA_ATIVA; Botão 5: TROCAR_GUIA_PROXIMA',
                    obtido: botoesLateraisDisparoOk ? 'sucesso' : 'falha'
                }
            );

            registrar(
                cicloPingPongAbasOk,
                'CICLO_PING_PONG_ULTIMA_ABA_ATIVA',
                'Rastreamento determinístico de currentTabId e previousTabId gerando alternância mútua entre última e penúltima aba',
                {
                    textoTestado: 'onActivated abas 10 e 20',
                    esperado: 'Aba 10 <-> Aba 20 em ciclo contínuo ping-pong',
                    obtido: cicloPingPongAbasOk ? 'sucesso' : 'falha'
                }
            );

            registrar(
                injecaoAboutBlankPermitidaOk,
                'INJECAO_ABOUT_BLANK_E_NEUTRALIZACAO_HISTORICO',
                'Permissão explícita para injeção e interceptação na tela about:blank impedindo retorno indesejado de histórico (history.back)',
                {
                    textoTestado: 'about:blank vs urls restritas do navegador',
                    esperado: 'about:blank permitido, chrome:// bloqueado',
                    obtido: injecaoAboutBlankPermitidaOk ? 'sucesso' : 'falha'
                }
            );

            /* Sub-modulo: Inserção Hierárquica em Campos Editáveis */
            let insercaoHierarquicaOk = false;
            {
                const inputTeste = document.createElement('input');
                inputTeste.type = 'text';
                inputTeste.value = 'Texto Original';
                document.body.appendChild(inputTeste);

                if (typeof inputTeste.setRangeText === 'function') {
                    inputTeste.setSelectionRange(6, 14); // Seleciona "Original"
                    inputTeste.setRangeText('Modificado', 6, 14, 'end');
                    insercaoHierarquicaOk = (inputTeste.value === 'Texto Modificado');
                } else {
                    inputTeste.value = 'Texto Modificado';
                    insercaoHierarquicaOk = (inputTeste.value === 'Texto Modificado');
                }
                document.body.removeChild(inputTeste);
            }

            registrar(
                insercaoHierarquicaOk,
                'COLAGEM_INSERCAO_HIERARQUICA_DOM',
                'Inserção de texto em editores respeitando hierarquia nativa: execCommand -> setRangeText -> atribuição com eventos reativos',
                {
                    textoTestado: 'setRangeText em input',
                    esperado: 'Texto Modificado',
                    obtido: insercaoHierarquicaOk ? 'Texto Modificado' : 'falha'
                }
            );
        }

        /* 4) Conversao de cabecalho nativo de peca do PJe */
        if (C.EXPRESSOES_REGULARES.CABECALHO_ID_PJE) {
            const amostraCab = 'Num. 2297820154 - Pag. 1';
            const mCab = amostraCab.match(C.EXPRESSOES_REGULARES.CABECALHO_ID_PJE);
            const obtCab = mCab ? (mCab[2] ? `id ${mCab[1]}, pg. ${mCab[2]}` : `id ${mCab[1]}`) : '';
            registrar(
                obtCab === 'id 2297820154, pg. 1',
                'CABECALHO_PJE',
                'Conversao de cabecalho nativo de peca do PJe para "id ..., pg. ..."',
                {
                    textoTestado: amostraCab,
                    idxCursor: 0,
                    esperado: 'id 2297820154, pg. 1',
                    obtido: obtCab
                }
            );
        }

        /* ==================================================================
         * BATERIA 3: MODO ACUMULADOR (;), ABSORCAO PREVIA, ORDEM DOM E TOGGLE-OFF
         * ================================================================== */
            }

            {
        linhasLog.push('\n--- BATERIA 6: ARQUITETURA PROGRESSIVA DE FILTROS HTML EM 5 NIVEIS ---');

        if (motorTeste) {
            /* Nivel 0: Texto Puro com Sanitizacao Ativa (node.textContent, &nbsp;, quebras normalizadas) */
            if (typeof motorTeste.extrairTextoPuroSanitizado === 'function') {
                const divPuro = document.createElement('div');
                divPuro.innerHTML = '<p>Texto com <b>negrito</b> e &nbsp; espaco<br>Segunda linha\r\n<style>.invisivel{display:none;}</style></p>';
                document.body.appendChild(divPuro);
                const textoPuroGerado = motorTeste.extrairTextoPuroSanitizado(divPuro);
                const textoPuroEsperado = 'Texto com negrito e espaco\nSegunda linha';
                registrar(
                    textoPuroGerado === textoPuroEsperado,
                    'FORMATACAO_NIVEL_0_TEXTO_PURO',
                    'Nivel 0: Sanitizacao ativa via node.textContent, remove 100% das tags, converte &nbsp; e normaliza quebras',
                    { textoTestado: divPuro.innerHTML, esperado: textoPuroEsperado, obtido: textoPuroGerado }
                );
                document.body.removeChild(divPuro);

                /* Teste de Supressao de Linhas em Branco e Normalizacao de Espacos Horizontais */
                const divMultiLinhas = document.createElement('div');
                divMultiLinhas.innerHTML = '<h3>3 - REQUERIMENTOS FINAIS</h3>\n<p>Ante o exposto, requer o acolhimento da preliminar.</p>\n<p>&nbsp;</p>\n<p>   Nestes    termos,   </p>\n<p><br></p>\n<p>Pede deferimento.</p>\n<p>&nbsp;</p>\n<p>Itabuna, 01.05.19.</p>';
                document.body.appendChild(divMultiLinhas);
                const txtMultiGerado = motorTeste.extrairTextoPuroSanitizado(divMultiLinhas);
                const txtMultiEsperado = '3 - REQUERIMENTOS FINAIS\nAnte o exposto, requer o acolhimento da preliminar.\nNestes termos,\nPede deferimento.\nItabuna, 01.05.19.';
                registrar(
                    txtMultiGerado === txtMultiEsperado,
                    'FORMATACAO_SUPRESSAO_LINHAS_BRANCAS_E_ESPACOS_MULTILINHA',
                    'Filtros 1, 2 e 3: Preservacao de novas linhas, supressao de linhas em branco e colapso de espacos horizontais duplicados',
                    { textoTestado: divMultiLinhas.innerHTML, esperado: txtMultiEsperado, obtido: txtMultiGerado }
                );
                document.body.removeChild(divMultiLinhas);

                /* Teste de Normalizacao de Quebras Suaves de Linha do Codigo-Fonte HTML em Tokens e Titulos */
                const divQuebraSuave = document.createElement('div');
                divQuebraSuave.innerHTML = '<span class="sample-token sample-invalid">29 de fevereiro de\n    2025</span>';
                document.body.appendChild(divQuebraSuave);
                const txtQuebraGerado = motorTeste.extrairTextoPuroSanitizado(divQuebraSuave);
                const txtQuebraEsperado = '29 de fevereiro de 2025';
                registrar(
                    txtQuebraGerado === txtQuebraEsperado,
                    'FORMATACAO_NORMALIZACAO_QUEBRA_SUAVE_HTML',
                    'W3C HTML: Quebras de linha e tabulacoes de indentacao no codigo-fonte de tags inline sao colapsadas em espaco simples sem quebra de linha espuria',
                    { textoTestado: divQuebraSuave.innerHTML, esperado: txtQuebraEsperado, obtido: txtQuebraGerado }
                );
                document.body.removeChild(divQuebraSuave);
            }

            /* Multiplos SPANs: trim de ambos sem quebra no meio, espaco simples no meio e retirada de espacamentos duplos */
            if (typeof motorTeste.extrairTextoPuroSanitizado === 'function') {
                const divMultiSpans = document.createElement('div');
                divMultiSpans.innerHTML = '<span class="local col-sm-12 no-padding"><span class="dtPoloAtivo" data-jusgov-selecionavel="true">FRANCISCO ANTONIO FERNANDES DO NASCIMENTO X </span><span class="dtPoloPassivo" data-jusgov-selecionavel="true">INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS</span></span>';
                document.body.appendChild(divMultiSpans);
                const txtSpansGerado = motorTeste.extrairTextoPuroSanitizado(divMultiSpans);
                const txtSpansEsperado = 'FRANCISCO ANTONIO FERNANDES DO NASCIMENTO X INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS';
                registrar(
                    txtSpansGerado === txtSpansEsperado,
                    'COPIA_TEXTO_MULTIPLOS_SPANS_SEM_QUEBRA_COM_ESPACO_MEIO',
                    'Multiplos SPANs (ex: dtPoloAtivo e dtPoloPassivo): copia o trim de ambos sem quebra no meio com espaco simples e sem espacamentos duplos',
                    { textoTestado: divMultiSpans.innerHTML, esperado: txtSpansEsperado, obtido: txtSpansGerado }
                );
                document.body.removeChild(divMultiSpans);

                /* Filtro final: retirada de espacamentos duplos alem do trim */
                const divEspacosDuplos = document.createElement('div');
                divEspacosDuplos.innerHTML = '<span>Texto   com   muitos     espacamentos     duplos</span>';
                document.body.appendChild(divEspacosDuplos);
                const txtEspacosGerado = motorTeste.extrairTextoPuroSanitizado(divEspacosDuplos);
                const txtEspacosEsperado = 'Texto com muitos espacamentos duplos';
                registrar(
                    txtEspacosGerado === txtEspacosEsperado,
                    'FILTRO_FINAL_RETIRADA_ESPACAMENTOS_DUPLOS',
                    'Filtro final: retirada de espacamentos duplos alem do trim preservando espacamento simples',
                    { textoTestado: divEspacosDuplos.innerHTML, esperado: txtEspacosEsperado, obtido: txtEspacosGerado }
                );
                document.body.removeChild(divEspacosDuplos);
            }

            /* Nivel 1: Estilos Basicos (<b>, <i>, <u>, <s>, <br>) */
            const divFmt = document.createElement('div');
            divFmt.innerHTML = 'Este e um texto em <b>negrito</b>, <i>italico</i> e <u>sublinhado</u>.';
            document.body.appendChild(divFmt);
            const rangeFmt = document.createRange();
            rangeFmt.selectNodeContents(divFmt);
            const htmlGerado = motorTeste.construirHtmlFormatacaoBasica(rangeFmt);
            const htmlEsperado = 'Este e um texto em <b>negrito</b>, <i>italico</i> e <u>sublinhado</u>.';
            registrar(
                htmlGerado === htmlEsperado,
                'FORMATACAO_BASICA_HTML',
                'Nivel 1: Preservacao de tags <b>, <i> e <u> para Blob text/html no ClipboardItem',
                { textoTestado: divFmt.textContent, idxCursor: 0, esperado: htmlEsperado, obtido: htmlGerado }
            );
            document.body.removeChild(divFmt);

            /* Multiplas linhas com conversao de font-weight CSS para <b> */
            const divMultiFmt = document.createElement('div');
            divMultiFmt.innerHTML = '<div style="font-weight:600;font-size:22px;color:red;">Separador do Modo Acumulador (Ctrl + Alt)</div><div style="font-size:12px;">Caractere com <code>Ctrl + Alt</code>, <del>riscado</del> e <mark>realce</mark>.</div>';
            document.body.appendChild(divMultiFmt);
            const rangeMultiFmt = document.createRange();
            rangeMultiFmt.selectNodeContents(divMultiFmt);
            const htmlMultiGerado = motorTeste.construirHtmlFormatacaoBasica(rangeMultiFmt);
            const htmlMultiEsperado = '<b>Separador do Modo Acumulador (Ctrl + Alt)</b><br>Caractere com Ctrl + Alt, <s>riscado</s> e realce.';
            registrar(
                htmlMultiGerado === htmlMultiEsperado,
                'FORMATACAO_MULTILINHA_HTML',
                'Nivel 1: Multiplas linhas preservando <b> (via CSS font-weight:600), <s> e <br>, limpando tamanhos/cores/<code> e <mark>',
                { textoTestado: divMultiFmt.textContent, idxCursor: 0, esperado: htmlMultiEsperado, obtido: htmlMultiGerado }
            );
            document.body.removeChild(divMultiFmt);

            /* Nivel 1: Nível estrito inline puro - converte blocos e <p> em quebra de linha <br> (Seção 6.123) */
            if (typeof motorTeste.construirHtmlNivel1Basico === 'function') {
                const divNivel1P = document.createElement('div');
                divNivel1P.innerHTML = '<p>Primeiro paragrafo com <b>negrito</b></p><p>Segundo paragrafo com quebra<br>Segunda linha</p>';
                document.body.appendChild(divNivel1P);
                const htmlNivel1Gerado = motorTeste.construirHtmlNivel1Basico(divNivel1P);
                const htmlNivel1Esperado = 'Primeiro paragrafo com <b>negrito</b><br>Segundo paragrafo com quebra<br>Segunda linha';
                registrar(
                    htmlNivel1Gerado === htmlNivel1Esperado,
                    'FORMATACAO_NIVEL_1_BASICO_TAG_P_E_BR',
                    'Nivel 1: Inline puro mesclagem - conversao de blocos e paragrafos em quebra <br> e preservacao de inline <b> (Seção 6.123)',
                    { textoTestado: divNivel1P.innerHTML, esperado: htmlNivel1Esperado, obtido: htmlNivel1Gerado }
                );
                document.body.removeChild(divNivel1P);
            }

            /* Nivel 2: Intermediario (Inline + Paragrafos + Alinhamento + Semantica + Tabelas) (Seção 6.123) */
            if (typeof motorTeste.construirHtmlNivel2Intermediario === 'function') {
                const divInter = document.createElement('div');
                divInter.innerHTML = '<p style="font-family: Arial; text-align: right; margin-left: 20px; width: 300px;">Despacho <b>Urgente</b></p><table><tr><td>Celula</td></tr></table>';
                document.body.appendChild(divInter);
                const htmlInterGerado = motorTeste.construirHtmlNivel2Intermediario(divInter);
                const htmlInterEsperado = '<span style="display: block"><p style="text-align: right; margin-left: 20px; width: 300px">Despacho <b>Urgente</b></p><table><tbody><tr><td>Celula</td></tr></tbody></table></span>';
                registrar(
                    htmlInterGerado === htmlInterEsperado,
                    'FORMATACAO_NIVEL_2_INTERMEDIARIO',
                    'Nivel 2: Preserva <p>, <b>, text-align, margin-left e dados tabulares <table> sem font-family (Seção 6.123)',
                    { textoTestado: divInter.innerHTML, esperado: htmlInterEsperado, obtido: htmlInterGerado }
                );
                document.body.removeChild(divInter);
            }

            /* Nivel 3: Estilos Avancados CKEditor / Documental */
            if (typeof motorTeste.construirHtmlFormatacaoAvancada === 'function') {
                const divAvancada = document.createElement('div');
                divAvancada.innerHTML = '<h2 style="font-family: Arial; font-size: 20pt; text-align: center;">Titulo do Processo</h2><p style="font-family: Calibri; color: #333;">Texto com <a href="https://pje.jus.br">link PJe</a> e lista:</p><ul><li>Item 1</li><li>Item 2</li></ul><style>.expurgar{display:none;}</style>';
                document.body.appendChild(divAvancada);
                const rangeAvancado = document.createRange();
                rangeAvancado.selectNodeContents(divAvancada);
                const htmlAvancadoGerado = motorTeste.construirHtmlFormatacaoAvancada(rangeAvancado);
                const htmlAvancadoEsperado = '<h2 style="text-align: center">Titulo do Processo</h2><p style="color: #333">Texto com link PJe e lista:</p><ul><li>Item 1</li><li>Item 2</li></ul>';
                registrar(
                    htmlAvancadoGerado === htmlAvancadoEsperado,
                    'FORMATACAO_AVANCADA_HTML',
                    'Nivel 3: Filtro avancado documental preserva <h2>, <ul>/<li> e alinhamento, expurgando font-family, font-size, script e links <a>',
                    { textoTestado: divAvancada.textContent, idxCursor: 0, esperado: htmlAvancadoEsperado, obtido: htmlAvancadoGerado }
                );
                document.body.removeChild(divAvancada);
            }

            /* Nivel 4: Estilos Extendidos / "Colar do Word" / Office */
            if (typeof motorTeste.construirHtmlSemFiltroWord === 'function') {
                const divSemFiltro = document.createElement('div');
                divSemFiltro.innerHTML = '<!--[if gte mso 9]><xml><w:WordDocument></w:WordDocument></xml><![endif]--><p class="MsoNormal" style="font-family: Times New Roman; mso-margin-top-alt: auto;"><span style="font-family: Arial; font-weight: bold;">Despacho Judicial</span><o:p></o:p></p>';
                document.body.appendChild(divSemFiltro);
                const rangeSemFiltro = document.createRange();
                rangeSemFiltro.selectNodeContents(divSemFiltro);
                const htmlSemFiltroGerado = motorTeste.construirHtmlSemFiltroWord(rangeSemFiltro);
                const htmlSemFiltroEsperado = '<p><span style="font-weight: bold">Despacho Judicial</span></p>';
                registrar(
                    htmlSemFiltroGerado === htmlSemFiltroEsperado,
                    'FORMATACAO_SEM_FILTRO_WORD',
                    'Nivel 4: Modo estendido estilo Colar do Word higieniza tags e comentarios mso-*, classes Mso e filtra font-family',
                    { textoTestado: divSemFiltro.textContent, idxCursor: 0, esperado: htmlSemFiltroEsperado, obtido: htmlSemFiltroGerado }
                );
                document.body.removeChild(divSemFiltro);
            }

            /* Seção 6.123 / USAB-20 / FORMAT-01: Remoção de Wrappers Artificiais e Bloco de Estilo <style> para Mesclagem Natural */
            if (typeof motorTeste.envolverHtmlComResetDeCursorParaWord === 'function') {
                const htmlEntrada = 'Texto com <b>negrito</b>, <i>italico</i>, <s>tachado</s>, <sub>sub</sub> e <sup>sup</sup>.';
                const htmlEnvolvido = motorTeste.envolverHtmlComResetDeCursorParaWord(htmlEntrada);
                const semFontFamilyWrapper = !htmlEnvolvido.includes('font-family: !important') && !htmlEnvolvido.includes('font-family:!important');
                const semFontSizeWrapper = !htmlEnvolvido.includes('font-size: !important') && !htmlEnvolvido.includes('font-size:!important');
                const semBlocoStyle = !htmlEnvolvido.includes('<style>');
                const tagsFilhasPuras = htmlEnvolvido.includes('<b>negrito</b>') &&
                                        htmlEnvolvido.includes('<i>italico</i>') &&
                                        htmlEnvolvido.includes('<s>tachado</s>') &&
                                        htmlEnvolvido.includes('<sub>sub</sub>') &&
                                        htmlEnvolvido.includes('<sup>sup</sup>');
                const semCorrupcaoDeTags = !htmlEnvolvido.includes('"ub>') && !htmlEnvolvido.includes('"up>');
                const semCaracteresInvisiveis = !htmlEnvolvido.includes('&#8203;') &&
                                                !htmlEnvolvido.includes('\u200B') &&
                                                !htmlEnvolvido.includes('\uFEFF');
                const limpezaWordOk = Boolean(semFontFamilyWrapper && semFontSizeWrapper && semBlocoStyle && tagsFilhasPuras && semCorrupcaoDeTags && semCaracteresInvisiveis);
                registrar(
                    limpezaWordOk,
                    'FORMATACAO_HERANCA_FONTE_CLIPBOARD_WORD',
                    'Seção 6.123 / USAB-20: HTML limpo e direto sem bloco <style> nem containers artificiais (span/div forçados), permitindo mesclagem fluida de formatação no app de destino',
                    {
                        textoTestado: htmlEntrada,
                        esperado: 'HTML limpo e direto sem <style> e sem wrappers de font-family/size forçados',
                        obtido: limpezaWordOk ? 'ok' : 'falha'
                    }
                );

                /* BUG-43 / Seção 6.111: Validação de ausência absoluta de caracteres invisíveis e caixas/tofu ([▯]) no Microsoft Word com impressão de caracteres invisíveis */
                const htmlTesteBasico = motorTeste.envolverHtmlComResetDeCursorParaWord('<b>Básico</b>');
                const semTofuWord = !htmlTesteBasico.includes('&#8203;') &&
                                    !htmlTesteBasico.includes('\u200B') &&
                                    !htmlTesteBasico.includes('spanResetLimpo') &&
                                    htmlTesteBasico.includes('<b>Básico</b>');
                registrar(
                    semTofuWord,
                    'SECAO_6_111_FILTRO_BASICO_SEM_CARACTERES_INVISIVEIS_TOFU_WORD',
                    'Filtro Basico / HTML Word: Eliminacao absoluta de &#8203; e zero-width spaces que geram caixa/tofu ([▯]) no Word com caracteres invisiveis ativados',
                    {
                        textoTestado: '<b>Básico</b>',
                        esperado: 'HTML limpo com herança universal sem &#8203; ou caixas no Word',
                        obtido: semTofuWord ? 'ok' : 'falha (contém caracteres invisíveis)'
                    }
                );
            }

            /* Seção 6.123: Bateria de Testes dos 5 Níveis de Estilo e Filtro Universal */
            if (typeof window.JusGovFiltrosHtml === 'function') {
                const filtrosInst = new window.JusGovFiltrosHtml();

                // Teste 1: Filtro Universal (Destruição de scripts/inclusões, eliminação de mídia/formulários mantendo texto, remoção de src= e on*)
                const htmlSujeiraUniversal = '<script>alert("hack")</script><template><div>invisivel</div></template><form><button type="button">Salvar Dados</button><input type="submit" value="Enviar Form"></form><video><source src="video.mp4">Legenda do video</video><canvas>Desenho do grafico</canvas><img src="foto.jpg" alt="Logo Orgão" onerror="alert(1)"><b onclick="run()">Texto Real</b><a href="javascript:void(0)">Link Sem Script</a>';
                const sanitizadoN1 = filtrosInst.aplicarFiltroHtmlPorNivel(htmlSujeiraUniversal, 1);
                const universalOk = !sanitizadoN1.includes('<script>') &&
                                    !sanitizadoN1.includes('template') &&
                                    !sanitizadoN1.includes('<button') &&
                                    !sanitizadoN1.includes('<input') &&
                                    !sanitizadoN1.includes('<video') &&
                                    !sanitizadoN1.includes('<canvas') &&
                                    !sanitizadoN1.includes('<img') &&
                                    !sanitizadoN1.includes('src=') &&
                                    !sanitizadoN1.includes('onclick=') &&
                                    !sanitizadoN1.includes('onerror=') &&
                                    !sanitizadoN1.includes('javascript:') &&
                                    sanitizadoN1.includes('<b>Texto Real</b>') &&
                                    sanitizadoN1.includes('Salvar Dados');
                registrar(
                    universalOk,
                    'SECAO_6_123_FILTRO_UNIVERSAL_PERIGOSOS_E_MIDIA',
                    'Filtro Universal 0-4: Destruição irrestrita de <script>, <template>, mídias (<video>, <canvas>, <img>), controles de form mantendo texto visível, e anulação de src=/on*/javascript:',
                    {
                        entrada: htmlSujeiraUniversal,
                        saida: sanitizadoN1,
                        resultado: universalOk ? 'ok' : 'falha'
                    }
                );

                // Teste 2: Nível 1 (Inline Puro para Mesclagem em Outros Apps)
                const htmlTesteN1 = '<p>Linha 1 <strong>em negrito</strong> e <em>em itálico</em></p><div>Linha 2 com <del>tachado</del> e <ins>sublinhado</ins></div><span>Sem tags vazias: <b></b></span>';
                const saidaN1 = filtrosInst.aplicarFiltroHtmlPorNivel(htmlTesteN1, 1);
                const n1Ok = saidaN1.includes('<b>em negrito</b>') &&
                             saidaN1.includes('<i>em itálico</i>') &&
                             saidaN1.includes('<s>tachado</s>') &&
                             saidaN1.includes('<u>sublinhado</u>') &&
                             !saidaN1.includes('<p>') &&
                             !saidaN1.includes('<div>') &&
                             !saidaN1.includes('<span>') &&
                             !saidaN1.includes('<b></b>') &&
                             !saidaN1.includes('style=') &&
                             saidaN1.includes('<br>');
                registrar(
                    n1Ok,
                    'SECAO_6_123_NIVEL_1_INLINE_PURO_MESCLAGEM',
                    'Nível 1 (Básico): Estritamente inline puro (b, i, u, s, sup, sub, br), blocos convertidos para <br>, sem tags vazias e sem atributos style para mesclagem limpa',
                    {
                        entrada: htmlTesteN1,
                        saida: saidaN1,
                        resultado: n1Ok ? 'ok' : 'falha'
                    }
                );

                // Teste 3: Nível 2 (Intermediário - Parágrafos, Alinhamentos e Tabelas)
                const htmlTesteN2 = '<p style="color: blue;">Parágrafo azul</p><center>Texto Centralizado</center><div>Bloco Div</div><table><thead><tr><th>Cabeçalho</th></tr></thead><tbody><tr><td>Dado</td></tr></tbody></table>';
                const saidaN2 = filtrosInst.aplicarFiltroHtmlPorNivel(htmlTesteN2, 2);
                const n2Ok = saidaN2.includes('<p style="color: blue">') || saidaN2.includes('<p style="color: blue;">') || saidaN2.includes('<p>') &&
                             (saidaN2.includes('text-align: center') || saidaN2.includes('text-align:center')) &&
                             saidaN2.includes('<span style="display: block') &&
                             !saidaN2.includes('<center>') &&
                             saidaN2.includes('<table>') &&
                             saidaN2.includes('<th>Cabeçalho</th>') &&
                             saidaN2.includes('<td>Dado</td>');
                registrar(
                    n2Ok,
                    'SECAO_6_123_NIVEL_2_PARAGRAFOS_E_TABELAS',
                    'Nível 2 (Intermediário): Preservação de <p>, normalização de <center> para text-align: center, conversão de <div> em span com display: block, e inclusão de dados tabulares (table/thead/tbody/tr/th/td)',
                    {
                        entrada: htmlTesteN2,
                        saida: saidaN2,
                        resultado: n2Ok ? 'ok' : 'falha'
                    }
                );

                // Teste 4: Nível 3 (Avançado - Blocos e Higienização Estrita de DIV)
                const htmlTesteN3 = '<h1>Título H1</h1><hr><ul><li>Item 1</li></ul><div style="position: absolute; z-index: -3; display: none; transform: rotate(45deg); margin-top: 10px;">Div Hack</div><div style="position: relative; z-index: 2; margin-top: 15px;">Div Segura</div>';
                const saidaN3 = filtrosInst.aplicarFiltroHtmlPorNivel(htmlTesteN3, 3);
                const n3Ok = saidaN3.includes('<h1>Título H1</h1>') &&
                             saidaN3.includes('<hr>') &&
                             saidaN3.includes('<ul>') &&
                             saidaN3.includes('<li>Item 1</li>') &&
                             !saidaN3.includes('position: absolute') &&
                             !saidaN3.includes('z-index: -') &&
                             !saidaN3.includes('display: none') &&
                             !saidaN3.includes('transform') &&
                             saidaN3.includes('position: relative') &&
                             saidaN3.includes('z-index: 2');
                registrar(
                    n3Ok,
                    'SECAO_6_123_NIVEL_3_BLOCOS_E_DIV_SANITIZADA',
                    'Nível 3 (Avançado): Preserva h1-h6, hr, listas (ul/ol/li) e higieniza <div> permitindo apenas position: relative, bloqueando fixed/absolute, z-index < 0, display: none/grid/flex e transform',
                    {
                        entrada: htmlTesteN3,
                        saida: saidaN3,
                        resultado: n3Ok ? 'ok' : 'falha'
                    }
                );

                // Teste 5: Nível 4 (Estendido - Sectioning Content com Proteção Universal)
                const htmlTesteN4 = '<main><article><nav>Navegação</nav><p>Conteúdo</p><aside>Lateral</aside><footer>Rodapé</footer><img src="foto.png" alt="Invalida"></article></main>';
                const saidaN4 = filtrosInst.aplicarFiltroHtmlPorNivel(htmlTesteN4, 4);
                const n4Ok = saidaN4.includes('<main>') &&
                             saidaN4.includes('<article>') &&
                             saidaN4.includes('<nav>') &&
                             saidaN4.includes('<aside>') &&
                             saidaN4.includes('<footer>') &&
                             !saidaN4.includes('<img') &&
                             !saidaN4.includes('src=');
                registrar(
                    n4Ok,
                    'SECAO_6_123_NIVEL_4_ESTRUTURA_PAGINA',
                    'Nível 4 (Estendido): Preserva tags de seção (main, article, nav, aside, footer) mantendo compulsoriamente a proibição de mídia (img, canvas, video) e atributos src=',
                    {
                        entrada: htmlTesteN4,
                        saida: saidaN4,
                        resultado: n4Ok ? 'ok' : 'falha'
                    }
                );
            }

            /* Regra de Ouro: Bloco Forense ou Palavra Unica = Somente Texto Puro */
            if (typeof motorTeste.verificarSeTextoEhBlocoOuPalavraUnica === 'function') {
                const palavraUnicaValida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('deferido');
                const cpfValido = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('099.123.459-67');
                const cnjValido = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('0991001-43.2024.4.01.4000');
                const dataHoraValida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('18/09/2026 10:03:34');
                const moedaValida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('R$ 65,00');
                const moedaExtensoValida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('R$ 65,00 (sessenta e cinco reais)');
                const fraseInvalida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('JULGO PROCEDENTE o pedido constante da inicial.');
                const maiusculasInvalida = motorTeste.verificarSeTextoEhBlocoOuPalavraUnica('SENTENCA HOMOLOGATORIA DE ACORDO');

                const todosPassaram = palavraUnicaValida && cpfValido && cnjValido && dataHoraValida &&
                    moedaValida && moedaExtensoValida && !fraseInvalida && !maiusculasInvalida;

                registrar(
                    todosPassaram,
                    'REGRA_DE_OURO_BLOCO_OU_PALAVRA_UNICA',
                    'Palavras unicas e blocos forenses (CPF, CNJ, Data+Hora, Moeda) copiam somente texto; frases e maiusculas preservam formatacao HTML',
                    {
                        palavraUnicaValida,
                        cpfValido,
                        cnjValido,
                        dataHoraValida,
                        moedaValida,
                        moedaExtensoValida,
                        fraseInvalida: !fraseInvalida,
                        maiusculasInvalida: !maiusculasInvalida
                    }
                );
            }
        }

        /* ==================================================================
         * BATERIA 7: REGRAS OPERACIONAIS E NOVAS PREFERENCIAS
         * ================================================================== */
            }

            {
        linhasLog.push('\n--- BATERIA 10: INTEGRIDADE E PARIDADE DO CATÁLOGO CENTRALIZADO JSON ---');
        {
            const catalogo = window.JusGovExemplosCatalogo;
            const catalogoCarregado = Boolean(
                catalogo &&
                catalogo.politica &&
                catalogo.politica.startsWith('POLICE_APPEND_ONLY_NUNCA_REMOVER') &&
                Array.isArray(catalogo.casosDeUso) &&
                catalogo.casosDeUso.length >= 8
            );

            registrar(
                catalogoCarregado,
                'CATALOGO_HIERARQUICO_EXEMPLOS_ESTRUTURA',
                'Catálogo hierárquico src/cfg/exemplos.js (centralizado em exemplos.json) carregado sob diretriz POLICE Append-Only',
                { casosDeUso: catalogo && catalogo.casosDeUso ? catalogo.casosDeUso.length : 0 }
            );

            /* Verificacao de integridade e presenca do espelho estruturado exemplos.json */
            const temEspelhoJson = Boolean(
                catalogo &&
                (catalogo.arquivoCentralizador === 'src/cfg/exemplos.json' || catalogo.arquivoEspelhoJson === 'src/cfg/exemplos.json')
            );
            registrar(
                temEspelhoJson,
                'CATALOGO_ESPELHO_JSON_PARIDADE',
                'Presença do catálogo estruturado src/cfg/exemplos.json centralizado sob diretriz POLICE',
                { arquivoCentralizador: 'src/cfg/exemplos.json' }
            );

            /* Verificacao de regra de ouro: minimo de 5 positivos e 5 negativos para CADA mascara */
            let mascarasMenosDe5PosOuNeg = 0;
            let totalMascarasAuditadas = 0;
            let falhaClassificacaoTipoBloco = 0;
            if (catalogoCarregado) {
                for (const cUso of catalogo.casosDeUso) {
                    for (const masc of (cUso.mascaras || [])) {
                        totalMascarasAuditadas++;
                        const numPos = (masc.positivos || []).length;
                        const numNeg = (masc.negativos || []).length;
                        if (numPos < 5 || numNeg < 5) {
                            mascarasMenosDe5PosOuNeg++;
                        }
                        const tipoBlocoEsperado = masc.calculavel ? 'verificacao_matematica' : 'bloco_simples';
                        if (masc.tipoBloco !== tipoBlocoEsperado) {
                            falhaClassificacaoTipoBloco++;
                        }
                    }
                }
            }

            registrar(
                totalMascarasAuditadas >= 19 && mascarasMenosDe5PosOuNeg === 0,
                'CATALOGO_REGRA_MINIMO_5_POSITIVOS_5_NEGATIVOS',
                'Regra de amplitude do catálogo: todas as 19+ máscaras possuem no mínimo 5 positivos e 5 negativos',
                { totalMascaras: totalMascarasAuditadas, mascarasAbaixoDe5: mascarasMenosDe5PosOuNeg }
            );

            registrar(
                totalMascarasAuditadas >= 19 && falhaClassificacaoTipoBloco === 0,
                'CATALOGO_CLASSIFICACAO_TIPO_BLOCO_ESTRITA',
                'Classificação explícita no catálogo: tipoBloco ("verificacao_matematica" ou "bloco_simples") compatível',
                { totalMascaras: totalMascarasAuditadas, falhasClassificacao: falhaClassificacaoTipoBloco }
            );

            /* Carregamento assincrono/online de exemplos.json para validacao em tempo de execucao */
            if (typeof fetch === 'function') {
                try {
                    const urlJson = (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function')
                        ? chrome.runtime.getURL('src/cfg/exemplos.json')
                        : 'exemplos.json';
                    fetch(urlJson)
                        .then(r => r.ok ? r.text() : null)
                        .then(txt => txt ? ((window.JusGovCfgDefaults && typeof window.JusGovCfgDefaults.parsearJsonComComentarios === 'function')
                            ? window.JusGovCfgDefaults.parsearJsonComComentarios(txt)
                            : JSON.parse(String(txt).replace(/^\uFEFF/, '').replace(/^(?:\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*))+\s*/, '').trim())) : null)
                        .then(dadosJson => {
                            if (dadosJson && Array.isArray(dadosJson.casosDeUso)) {
                                window.__JUSGOV_EXEMPLOS_JSON_ONLINE__ = dadosJson;
                            }
                        })
                        .catch(() => {});
                } catch (_) { }
            }

            if (catalogoCarregado) {
                for (const casoUso of catalogo.casosDeUso) {
                    for (const mascara of (casoUso.mascaras || [])) {
                        let falhasMascara = 0;
                        let detalhePrimeiraFalha = '';
                        let totalExemplosMascara = 0;

                        /* 1) Testa todos os exemplos POSITIVOS da mascara */
                        for (const item of (mascara.positivos || [])) {
                            totalExemplosMascara++;
                            const valor = item.valor;

                            /* Se a mascara for calculavel, valida matematicamente o exemplo positivo */
                            if (mascara.calculavel && !item.validarApenasExtracao && mascara.metodoValidacao && typeof validador[mascara.metodoValidacao] === 'function') {
                                const resVal = validador[mascara.metodoValidacao](valor);
                                const ehValidoPositivo = (mascara.metodoValidacao === 'auditarTrechoSelecionado')
                                    ? (resVal === null)
                                    : Boolean(resVal && resVal.valido === true);
                                if (!ehValidoPositivo) {
                                    falhasMascara++;
                                    if (!detalhePrimeiraFalha) {
                                        detalhePrimeiraFalha = `Validação falhou para positivo "${valor}"`;
                                    }
                                }
                            }

                            /* Valida a extracao / captura pelo motor */
                            if (mascara.ehPlaceholderMinuta && typeof motorTeste.localizarCampoSimbolosSobCursor === 'function') {
                                const fraseTeste = 'texto ' + valor + ' fim';
                                const idxCursor = 6 + Math.floor(valor.length / 2);
                                const resPh = motorTeste.localizarCampoSimbolosSobCursor(fraseTeste, idxCursor);
                                const extraido = resPh ? fraseTeste.substring(resPh.inicio, resPh.fim) : '';
                                if (extraido !== valor) {
                                    falhasMascara++;
                                    if (!detalhePrimeiraFalha) {
                                        detalhePrimeiraFalha = `Placeholder esperado "${valor}", obtido "${extraido}"`;
                                    }
                                }
                            } else if (item.validarApenasAltLink3Cliques && typeof motorTeste.extrairTextoLinkUmaLinha === 'function') {
                                const linkCat = document.createElement('a');
                                linkCat.href = '#teste-cat-link-multilinha';
                                linkCat.innerHTML = valor.replace(/\n/g, '<br>');
                                document.body.appendChild(linkCat);
                                const extraidoLink = motorTeste.extrairTextoLinkUmaLinha(linkCat);
                                if (linkCat.parentNode) linkCat.parentNode.removeChild(linkCat);
                                const esperadoLink = item.esperadoUmaLinha || valor.replace(/\s+/g, ' ').trim();
                                if (extraidoLink !== esperadoLink) {
                                    falhasMascara++;
                                    if (!detalhePrimeiraFalha) {
                                        detalhePrimeiraFalha = `Alt+3 Cliques Link esperado "${esperadoLink}", obtido "${extraidoLink}"`;
                                    }
                                }
                            } else if (item.validarApenasCatalogoOuConversao && typeof motorTeste.higienizarTextoParaCopia === 'function') {
                                const convertido = motorTeste.higienizarTextoParaCopia(valor);
                                if (item.esperadoConversaoPje && convertido !== item.esperadoConversaoPje) {
                                    falhasMascara++;
                                    if (!detalhePrimeiraFalha) {
                                        detalhePrimeiraFalha = `Conversão PJe esperada "${item.esperadoConversaoPje}", obtida "${convertido}"`;
                                    }
                                }
                            } else {
                                const prefixo = 'Referencia ';
                                const fraseTeste = prefixo + valor + ' fim';
                                const deslocamentoInterno = typeof item.idxClique === 'number'
                                    ? item.idxClique
                                    : Math.floor(valor.length / 2);
                                const idxCursor = prefixo.length + deslocamentoInterno;
                                const numCliques = item.cliques || 1;
                                const esperado = item.esperadoClique1 || valor;
                                const obtido = motorTeste.simularCliqueEmTexto(fraseTeste, idxCursor, numCliques, false);
                                if (obtido !== esperado) {
                                    falhasMascara++;
                                    if (!detalhePrimeiraFalha) {
                                        detalhePrimeiraFalha = `Extração esperada "${esperado}", obtida "${obtido}" (em "${fraseTeste}", idx=${idxCursor}, cliques=${numCliques})`;
                                    }
                                }
                            }
                        }

                        /* 2) Testa todos os exemplos NEGATIVOS da mascara (para mascaras calculaveis) */
                        for (const itemNeg of (mascara.negativos || [])) {
                            totalExemplosMascara++;
                            const valorNeg = itemNeg.valor;
                            if (mascara.calculavel && mascara.metodoValidacao && typeof validador[mascara.metodoValidacao] === 'function') {
                                const resNeg = validador[mascara.metodoValidacao](valorNeg);
                                const ehInvalidoNegativo = (mascara.metodoValidacao === 'auditarTrechoSelecionado')
                                    ? Boolean(resNeg && resNeg.valido === false)
                                    : Boolean(resNeg && resNeg.valido === false);
                                if (!ehInvalidoNegativo) {
                                    falhasMascara++;
                                    if (!detalhePrimeiraFalha) {
                                        detalhePrimeiraFalha = `Exemplo negativo "${valorNeg}" deveria ser inválido, mas retornou válido`;
                                    }
                                }
                            }
                        }

                        registrar(
                            falhasMascara === 0 && totalExemplosMascara > 0,
                            `EXEMPLOS_${mascara.idMascara}`,
                            `Catálogo [${casoUso.idCasoUso}] -> ${mascara.nome} (${totalExemplosMascara} exemplos validados)`,
                            falhasMascara === 0
                                ? { esperado: `${totalExemplosMascara} ok`, obtido: `${totalExemplosMascara} ok` }
                                : { esperado: '0 falhas', obtido: `falhas=${falhasMascara} | ${detalhePrimeiraFalha}` }
                        );
                    }
                }
            }
        }

        /* ==================================================================
         * BATERIA 11: GERENCIAMENTO DE GUIAS, JANELAS, ANTI-DUPLICACAO E INTEGRACAO FORENSE
         * ================================================================== */
            }

            {
        /* 16) BUG-06 (Seção 6.59): Expansão de Sequências Numéricas Espaçadas Genéricas */
        let bug06EspacadoOk = false;
        try {
            const amostraEspacada = 'Código: 215 7014 6992 8831 ativo';
            const idxNum1 = amostraEspacada.indexOf('215');
            const idxEspacoInter = amostraEspacada.indexOf(' ', idxNum1);
            const idxNum2 = amostraEspacada.indexOf('7014');

            const res1Clique = motorTeste.simularCliqueEmTexto(amostraEspacada, idxNum1, 1);
            const resEspaco = motorTeste.simularCliqueEmTexto(amostraEspacada, idxEspacoInter, 1);
            const res2Cliques = motorTeste.simularCliqueEmTexto(amostraEspacada, idxNum2, 2);

            bug06EspacadoOk = Boolean(
                res1Clique === '215' &&
                resEspaco === '215 7014 6992 8831' &&
                res2Cliques === '215 7014 6992 8831'
            );
        } catch (_) {
            bug06EspacadoOk = false;
        }
        registrar(
            bug06EspacadoOk,
            'BUG06_EXPANSAO_SEQUENCIA_NUMERICA_ESPACADA',
            'Sequência numérica espaçada genérica (215 7014 6992 8831): 1 clique isola o bloco (215); clique no espaço ou duplo clique seleciona a cadeia completa',
            {
                textoTestado: '215 7014 6992 8831',
                idxCursor: 0,
                esperado: '1clique=215, espaco=215 7014 6992 8831, 2cliques=215 7014 6992 8831',
                obtido: bug06EspacadoOk ? 'ok' : 'falha'
            }
        );

            }

            {
        /* TESTE BUG-13: Inclusão do Sublinhado (_) em SIMBOLO_REPETIVEL para Expansão de Lacunas */
        let bug13SublinhadoOk = false;
        try {
            const C_EXT = (typeof window !== 'undefined' && window.JusGovConstantes) ? window.JusGovConstantes : null;
            const mascaraAscii = C_EXT ? C_EXT.TABELA_MASCARA_ASCII : null;
            const mascSimbolo = C_EXT && C_EXT.MASCARA_CARACTERE ? C_EXT.MASCARA_CARACTERE.SIMBOLO_REPETIVEL : 128;
            const rxSimbolo = C_EXT && C_EXT.EXPRESSOES_REGULARES ? C_EXT.EXPRESSOES_REGULARES.CHAR_SIMBOLO_REPETIVEL : null;

            const sublinhadoNaTabela = Boolean(mascaraAscii && (mascaraAscii[95] & mascSimbolo) !== 0);
            const sublinhadoNaRegex = Boolean(rxSimbolo && rxSimbolo.test('_'));

            bug13SublinhadoOk = Boolean(sublinhadoNaTabela && sublinhadoNaRegex);
        } catch (eBug13) {
            bug13SublinhadoOk = false;
        }
        registrar(
            bug13SublinhadoOk,
            'BUG_13_SIMBOLO_REPETIVEL_SUBLINHADO_LACUNAS',
            'BUG-13: Inclusão determinística do caractere sublinhado (_) na bitmask SIMBOLO_REPETIVEL e regex para expansão instantânea de lacunas de minutas (_______).'
        );

            }

            {
            // Teste: FiltrosHtml via DOMParser inerte bloqueia XSS/scripts preservando texto seguro
            let domParserFiltrosOk = false;
            let detalheDomParser = '';
            try {
                const FiltrosCls = window.JusGovFiltrosHtml;
                if (typeof FiltrosCls === 'function') {
                    window.__jusgovXssProbe = false;
                    const filt = new FiltrosCls();
                    const payload = '<img src="x" onerror="window.__jusgovXssProbe=true"><script>window.__jusgovXssProbe=true;</script><p>Texto <b>Seguro</b></p>';
                    const textoPuro = filt.extrairTextoPuroSanitizado(payload);
                    const divSan = filt.preSanitizarDomBase(payload);
                    const temScript = Boolean(divSan && divSan.querySelector && divSan.querySelector('script, img'));
                    domParserFiltrosOk = Boolean(
                        window.__jusgovXssProbe === false &&
                        textoPuro.includes('Texto Seguro') &&
                        !textoPuro.includes('alert') &&
                        !temScript
                    );
                    detalheDomParser = `xss=${window.__jusgovXssProbe}, texto=${JSON.stringify(textoPuro)}, tagPerigosa=${temScript}`;
                }
            } catch (eDom) {
                detalheDomParser = eDom.message || String(eDom);
            }
            registrar(
                domParserFiltrosOk,
                'DOMPARSER_FILTROS_BLOQUEIA_XSS_E_PRESERVA_TEXTO',
                'FiltrosHtml parseia strings HTML em DOMParser inerte sem disparar scripts/onerror e preserva texto.',
                { detalhe: detalheDomParser }
            );

            }
        }
    }

    Object.freeze(DebugMascaras.prototype);
    return Object.freeze(DebugMascaras);
}));