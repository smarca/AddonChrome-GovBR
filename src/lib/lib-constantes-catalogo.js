/* ==========================================================================
 * ARQUIVO: src/lib/lib-constantes-catalogo.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * MÓDULO: Biblioteca Core — Catálogo de Padrões Jurídicos Forenses
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-constantes-catalogo.js
 * - Exportado: self.JusGovConstantesCatalogo (CATALOGO_PADROES_JURIDICOS)
 * - Regras / Seções: ENG-00, ARQ-10 (Seção 6.259)
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovConstantesCatalogo = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const CATALOGO_PADROES_JURIDICOS = Object.freeze([
        {
            /* TIPO 1: Identificadores Contiguos Fiscais/Bancarios (UUID/PIX) */
            grupo: 'CHAVES_FISCAIS_E_BOLETOS_CONTIGUOS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 1.1: Identificador UUID v4 / Chave Aleatoria PIX (8-4-4-4-12 hexadecimais contiguos) */
                /(?<![\p{L}\p{N}])[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?![\p{L}\p{N}])/giu
            ]
        },
        {
            /* TIPO 2: Chaves Fiscais e Boletos Espacados (exige espaco ou 2 cliques para preservar 1 clique no bloco) */
            grupo: 'CHAVES_FISCAIS_E_BOLETOS_ESPACADOS',
            exigeEspacoOuDuploClique: true,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 2.1: Chave de Acesso NF-e / CT-e em 11 blocos de 4 digitos separados por espaco */
                /(?<![\p{L}\p{N}])(?:\d{4}[\t \u00A0]+){10}\d{4}(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 2.2: Linha Digitavel de Boleto Bancario padrao FEBRABAN e variacoes */
                /(?<![\p{L}\p{N}])\d{4,6}\.\d{4,6}[\t \u00A0]+\d{4,6}\.\d{4,7}[\t \u00A0]+\d{4,6}\.\d{4,7}[\t \u00A0]+\d[\t \u00A0]+\d{10,14}(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 2.3: Linha Digitavel de Arrecadacao, Tributos e Concessionarias padrao FEBRABAN (4 campos de 11 digitos + DV de 1 digito com espacos ou hifens) */
                /(?<![\p{L}\p{N}])(?:\d{11}[\t \u00A0\-]*\d[\t \u00A0]+){3}\d{11}[\t \u00A0\-]*\d(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 2.4: Linha Digitavel de Tributos com Hifen (DARF / GRU / IPTU FEBRABAN 48 digitos: XXXXXXXXXXX-D XXXXXXXXXXX-D XXXXXXXXXXX-D XXXXXXXXXXX-D) */
                /(?<![\p{L}\p{N}])(?:\d{11}-\d[\t \u00A0]+){3}\d{11}-\d(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 2.5: Sequencias Numericas Espacadas Genericas (BUG-06: ex: "215 7014 6992 8831") */
                /(?<![\p{L}\p{N}\/.:])\d{1,8}(?:[\t \u00A0]+\d{1,8}){2,}(?![\p{L}\p{N}\/.:])/gu
            ]
        },
        {
            /* TIPO 3: Documentos Pessoais, Fiscais e Profissionais (CNPJ Tradicional e Novo Alfanumerico, CPF, PIS, RG, CEP, OAB)
             * O porque da posicao prioritaria: Avaliar CNPJ/CPF/PIS/RG antes de protocolos com barra ("136/2025")
             * garante que clicar em qualquer parte de um CNPJ ("00.000.000/0001-91" ou "12.ABC.345/01DE-35")
             * selecione 100% do CNPJ imediatamente no 1o clique! */
            grupo: 'DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 3.0: Beneficio INSS com Especie (EE/NNNNNNNNNN ou EE/NNN.NNN.NNN-N)
                 * Permite que 1 clique em '31' ou '/' selecione tudo ('31/6506589241')
                 * e 1 clique em '6506589241' selecione somente o numero do beneficio! */
                /(?<![\p{L}\p{N}\/.\-])\d{2}\/(?:\d{10}|\d{1,3}\.\d{3}\.\d{3}-\d)(?![\p{L}\p{N}\/\-]|\.\p{N})/gu,
                /* Sub-tipo 3.1: CNPJ Tradicional Numerico e Novo Modelo Alfanumerico (AA.AAA.AAA/AAAA-DD)
                 * Blindado nas bordas com (?<![\p{L}\p{N}\/.\-]) e (?![\p{L}\p{N}\/\-]|\.\p{N}) para jamais
                 * recortar sub-pedacos de numeros pontuados maiores (como "1.325.256.019-75"). */
                /(?<![\p{L}\p{N}\/.\-])[A-Z0-9]{2,3}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2}(?:\s*\((?:CNPJ|CPF)\))?(?![\p{L}\p{N}\/\-]|\.\p{N})/giu,
                /* Sub-tipo 3.2: PIS / PASEP / NIT (NNN.NNNNN.NN-N) */
                /(?<![\p{L}\p{N}\/.\-])\d{3}\.\d{5}\.\d{2}-\d{1}(?:\s*\((?:PIS|PASEP|NIT)\))?(?![\p{L}\p{N}\/\-]|\.\p{N})/giu,
                /* Sub-tipo 3.3: CPF (NNN.NNN.NNN-NN) -- Blindado contra falso positivo em Unidades Consumidoras ("1.325.256.019-75") */
                /(?<![\p{L}\p{N}\/.\-])\d{3}\.\d{3}\.\d{3}-\d{2}(?:\s*\((?:CPF)\))?(?![\p{L}\p{N}\/\-]|\.\p{N})/giu,
                /* Sub-tipo 3.4: RG e Beneficio INSS NB */
                /(?<![\p{L}\p{N}\/.\-])\d{1,3}\.\d{3}\.\d{3}-[0-9X](?:\s*\((?:RG|NB)\))?(?![\p{L}\p{N}\/\-]|\.\p{N})/giu,
                /* Sub-tipo 3.5: Codigo de Enderecamento Postal CEP (NN.NNN-NNN ou NNNNN-NNN) */
                /(?<![\p{L}\p{N}\/.\-])\d{2}\.?\d{3}-\d{3}(?![\p{L}\p{N}\/\-]|\.\p{N})/gu,
                /* Sub-tipo 3.6: Inscricao na OAB (ex: "OAB/PI 12345", "OAB-SP 123.456-A") */
                /(?<![\p{L}\p{N}])OAB[\/\-]?(?:[A-Z]{2})?[\/\- \t]?\d{2,7}(?:\.\d{3})?(?:-[A-Z])?(?![\p{L}\p{N}])/giu,
                /* Sub-tipo 3.7: Passaporte Brasileiro (2 letras + 6 digitos) */
                /(?<![\p{L}\p{N}])[A-Z]{2}\d{6}(?![\p{L}\p{N}])/gu
            ]
        },
        {
            /* TIPO 4: Processos Judiciais CNJ, Processos SEI!, Placas Veiculares e Protocolos/Ano */
            grupo: 'NUMERACOES_ID_E_PUBLICAS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 4.1: Processo Administrativo SEI! (NNNNN.NNNNNN/AAAA-DD) */
                /(?<![\p{L}\p{N}\/.\-])\d{5}\.\d{6}\/\d{4}-\d{2}(?![\p{L}\p{N}\/\-]|\.\p{N})/gu,
                /* Sub-tipo 4.2: Processo Judicial CNJ padrao (NNNNNNN-DD.AAAA.J.TR.OOOO) */
                /(?<![\p{L}\p{N}\/.\-])\d{1,7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}(?![\p{L}\p{N}\/\-]|\.\p{N})/gu,
                /* Sub-tipo 4.3: Placas Veiculares padrao Mercosul e antigo (Renajud) */
                /(?<![\p{L}\p{N}])[A-Z]{3}[\- ]?[0-9][A-Z0-9][0-9]{2}(?![\p{L}\p{N}])/giu,
                /* Sub-tipo 4.4: Numero de Ato/Registro/Protocolo com barra de ano (ex: "136/2025", "63055/2023")
                 * Blindado com (?<![\p{L}\p{N}\/.\-]) e (?![\p{L}\p{N}\/.\-]) para jamais capturar pedacos de CNPJ/Datas.
                 * Em 1 clique no numero antes da barra seleciona so o numero; na barra ou com 2 cliques seleciona tudo */
                /(?<![\p{L}\p{N}\/.\-])(\d{1,12})\/(\d{2,4})(?![\p{L}\p{N}\/.\-])/gu
            ]
        },
        {
            /* TIPO 5: Datas por Extenso, Abreviadas ("17 ago. 2026"), Competencia Mes/Ano ("out. 26") e Data + Horario Contiguo
             * O porque de exigeEspacoOuDuploClique: false: Datas abreviadas ("17 ago. 2026"), por extenso ("29 de fevereiro de 2025")
             * e competencias Mes/Ano ("out. 26", "ago. 2026") devem ser capturadas imediatamente no 1o clique em qualquer parte
             * da mascara (inclusive sobre o ponto "." ou espaco), acionando tambem a auditoria matematica de calendario.
             * Quando houver horario contiguo acoplado (ex: "23/10/2026 10:14:18"), o motor em copia-selecionar.js
             * isola a data no 1o clique e une Data + Horario ao clicar no espaco/conector ou com 2 cliques. */
            grupo: 'DATA_COM_HORARIO_CONTIGUO',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 5.1: Data por extenso ou abreviada com dia da semana opcional e horario opcional
                 * Ex: "17 ago. 2026", "29 de fevereiro de 2025", "sexta-feira, 23 de outubro de 2026 as 21:38:42 BRT" */
                /(?<![\p{L}\p{N}])(?:(?:segunda|ter\p{L}a|quarta|quinta|sexta)(?:-feira)?[,.\s]+|(?:s\p{L}bado|domingo)[,.\s]+)?\d{1,2}[\s\/\-]+(?:de\s+)?(?:janeiro|fevereiro|mar\p{L}o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan\.?|fev\.?|mar\.?|abr\.?|mai\.?|jun\.?|jul\.?|ago\.?|set\.?|out\.?|nov\.?|dez\.?)[\s\/\-]+(?:de\s+)?\d{2,4}(?:[\s,]+(?:\p{L}s|a)?\s*(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\s*(?:BRT|BRST|UTC|GMT))?)?(?![\p{L}\p{N}])/giu,
                /* Sub-tipo 5.2: Mes abreviado ou por extenso + Ano (ex: "out. 26", "ago. 2026", "out./2026", "out. de 2026") */
                /(?<![\p{L}\p{N}])(?:janeiro|fevereiro|mar\p{L}o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan\.?|fev\.?|mar\.?|abr\.?|mai\.?|jun\.?|jul\.?|ago\.?|set\.?|out\.?|nov\.?|dez\.?)(?:\.?\s+|[\s\/\-]+(?:de\s+)?)\d{2,4}(?![\p{L}\p{N}])/giu,
                /* Sub-tipo 5.3: Data numerica seguida de horario contiguo (ex: "28/10/2026 06:28", "23/10/2026 10:14:18", "28/10/2026 - 06:28:50") */
                /(?<![\p{L}\p{N}\/])\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}(?:\s*(?:[\-\u2013\u2014]|(?:\p{L}s|a)|,)\s*|\s+)\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:BRT|BRST|UTC|GMT))?(?![\p{L}\p{N}])/giu
            ]
        },
        {
            /* TIPO 6: Intervalos de Datas, Horarios, Moedas, Numeros com Extenso e Referencias de ID/Folhas */
            grupo: 'INTERVALOS_E_REFERENCIAS_ID_FOLHAS',
            exigeEspacoOuDuploClique: true,
            suportaFiltroShiftDigitos: false,
            regexes: [
                /* Sub-tipo 6.1: Intervalo de datas (ex: "01/01/2026 a 31/12/2026" ou "01/2024 ate 12/2025") */
                /(?<![\p{L}\p{N}\/])\d{1,2}[\/.\-](?:\d{1,2}[\/.\-]\d{2,4}|\d{2,4})\s*(?:a|at\p{L}|ao|[\-\u2013])\s*\d{1,2}[\/.\-](?:\d{1,2}[\/.\-]\d{2,4}|\d{2,4})(?![\p{L}\p{N}\/])/giu,
                /* Sub-tipo 6.2: Intervalo de horarios (ex: "08:00 as 18:00" ou "8h a 12h30min") */
                /(?<![\p{L}\p{N}:])(?:[01]?\d|2[0-3])(?::[0-5]\d(?::[0-5]\d)?|h(?:[0-5]\d(?:min)?)?)\s*(?:a|\p{L}s|at\p{L}|[\-\u2013])\s*(?:[01]?\d|2[0-3])(?::[0-5]\d(?::[0-5]\d)?|h(?:[0-5]\d(?:min)?)?)(?![\p{L}\p{N}])/giu,
                /* Sub-tipo 6.3: Referencias de ID do PJe, Folhas e Paginas (ex: "id 12345678 pg 55v", "fls. 10/25", "id ##########", "id ###### fl. ##") */
                /(?<![\p{L}\p{N}])(?:ids?\.?|fls?\.?|folhas?|p\p{L}gs?\.?|pgs?\.?|p\p{L}ginas?|pp\.?|num\.?)\s*[:\-]?\s*(?:[#*]{3,}(?:\s*,?\s*(?:-\s*)?(?:fls?\.?|folhas?|p\p{L}gs?\.?|pgs?\.?|pp\.?)\s*[#*]{1,6})?|\d+(?:\.\d+)*[vV]?(?:\s*(?:a|at\p{L}|ao|[\/\-])\s*\d+(?:\.\d+)*[vV]?|\s*,?\s*(?:-\s*)?(?:fls?\.?|folhas?|p\p{L}gs?\.?|pgs?\.?|pp\.?)\s*\d+(?:\.\d+)*[vV]?)*)(?![\p{L}\p{N}#*])/giu,
                /* Sub-tipo 6.4: Intervalo de valores monetarios (ex: "R$ 1.000,00 a R$ 5.000,00") */
                /(?<![\p{L}\p{N}])R\$\s?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}\s*(?:a|at\p{L}|ao|[\-\u2013])\s*R\$\s?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}(?![\p{L}\p{N}])/giu,
                /* Sub-tipo 6.5: Numero cardinal ou percentual seguido de extenso entre parenteses
                 * Ex: "65 (sessenta e cinco)" ou "100% (cem por cento)".
                 * Com exigeEspacoOuDuploClique: true, 1 clique em "65" seleciona so "65";
                 * 1 clique no espaco entre "65" e "(" ou 2 cliques em "65" seleciona "65 (sessenta e cinco)"!
                 * Blindado com (?<!R\$\s*)(?<![\p{L}\p{N}.,$]) para jamais capturar parcialmente valores
                 * monetarios precedidos por "R$" (como "R$ 65,00 (sessenta e cinco reais)"), garantindo
                 * que o Sub-tipo 10.1 capture o valor completo incluindo o prefixo "R$ "! */
                /(?<!R\$\s*)(?<![\p{L}\p{N}.,$])\d+(?:[.,]\d+)*%?\s+\([\p{L}\s,\-]+?\)(?![\p{L}\p{N}])/giu
            ]
        },
        {
            /* TIPO 7: Citacoes de Legislacao, Jurisprudencia e Atos Administrativos/Cartorarios
             * O porque da precisao concentrada: Cada etapa de continuacao exige obrigatoriamente um
             * complemento normativo final (numero, romano, sigla de diploma/tribunal ou alinea explicita),
             * jamais terminando em espaco em branco, preposicao ("de", "da"), conjuncao ("e") ou artigo ("a", "o"),
             * e jamais engolindo rotulos com dois-pontos antes da citacao (como "Emenda:"). */
            grupo: 'LEGISLACAO_JURISPRUDENCIA_E_ATOS',
            exigeEspacoOuDuploClique: true,
            suportaFiltroShiftDigitos: false,
            regexes: [
                /* Sub-tipo 7.1: Dispositivos legais e emendas constitucionais concentrados
                 * Ex: "art. 5o, inciso LV, da CF/88", "art. 24, paragrafos 1o e 2o da EC n.o 103/2019",
                 * "Sumula Vinculante 13", "Tema 1033 do STJ" */
                /(?<![\p{L}\p{N}])(?:arts?\.?|artigos?|\u00A7\u00A7?|par[a\u00E1]grafos?|incisos?|al[i\u00ED]neas?\s+(?:['"]?[a-zA-Z0-9]{1,3}['"]?)|leis?(?:\s+complementar(?:es)?|\s+federais?|\s+n\.?[\u00BA\u00B0\u00AAo.]?)?|emendas?\s+constituciona(?:l|is)|ec|lc|mp|decreto-lei|s[u\u00FA]mulas?(?:\s+vinculantes?)?|enunciados?|temas?|oj)(?![\p{L}:])(?:[\s,\-]+(?:(?:de|do|da|dos|das|e|ou|c\/c|n\.?[\u00BA\u00B0\u00AAo.]?(?![\p{L}:]))[\s,\-]+)*(?:al[i\u00ED]neas?\s+(?:['"]?[a-zA-Z0-9]{1,3}['"]?)(?![\p{L}:])|(?:arts?\.?|artigos?|\u00A7\u00A7?|par[a\u00E1]grafos?(?:\s+[u\u00FA]nico)?|incisos?|c[a\u00E1]put|leis?(?:\s+complementar(?:es)?|\s+federais?)?|emendas?\s+constituciona(?:l|is)|ec|lc|mp|decreto-lei|s[u\u00FA]mulas?(?:\s+vinculantes?)?|temas?|oj|cpc|cf|cc|clt|cpp|cp|ctn|cdc|eca|lep|stj|stf|tnu|tst|tse|trf\d?|tj[a-z]{2}|trt\d?)(?:\/(?:\d{4}|\d{2}))?(?![\p{L}\p{N}:])|\d+(?:\.\d+)*(?:[\-\/]\d{1,4})?[\u00BA\u00B0\u00AA]?|[IVXLCDM]+(?![\p{L}:])|['"][a-zA-Z0-9]{1,4}['"]))+/giu,
                /* Sub-tipo 7.2: Atos administrativos com suporte a siglas de orgaos compostas (ex: PRES/INSS, DIRBEN/INSS)
                 * Ex: "Instrucao Normativa PRES/INSS no 128/2022", "Portaria no 100/2026", "Livro B- 63055/2021" */
                /(?<![\p{L}\p{N}])(?:portarias?(?:\s+conjuntas?)?|decretos?|resolu[c\u00E7](?:[a\u00E3]o|[o\u00F5]es)|instru[c\u00E7](?:[a\u00E3]o|[o\u00F5]es)\s+normativas?|in|of[i\u00ED]cios?(?:\s+circulares)?|memorandos?|ac[o\u00F3]rd[a\u00E3]os?|parecer(?:es)?|inqu[e\u00E9]ritos?(?:\s+policia(?:l|is))?|ipl|pad|pa|protocolos?(?:\s+administrativos?)?|prot\.?|edita(?:l|is)|matr[i\u00ED]culas?(?:\s+n\.?[\u00BA\u00B0\u00AAo.]?)?|livros?(?:\s+n\.?[\u00BA\u00B0\u00AAo.]?)?|termos?(?:\s+n\.?[\u00BA\u00B0\u00AAo.]?)?|certid(?:[a\u00E3]o|[o\u00F5]es)(?:\s+n\.?[\u00BA\u00B0\u00AAo.]?)?|selos?(?:\s+digita(?:l|is))?|cda(?:\s+n\.?[\u00BA\u00B0\u00AAo.]?)?)(?![\p{L}:])(?:\s+[A-Z0-9]{1,15}(?:[\/\-][A-Z0-9]{1,15})*-?)*(?:\s+n\.?[\u00BA\u00B0\u00AAo.]?)?\s*\d[\d.\-\/A-Z]*[\dA-Z](?![\p{L}\p{N}])/giu,
                /* Sub-tipo 7.3: Numeracao curta de ato com prefixo "no" / "n.o"
                 * Ex: "no 136/2025", "n.o 103/2019", "no 1.234/2026" */
                /(?<![\p{L}\p{N}])n\.?[\u00BA\u00B0\u00AAo]\s*\d+(?:\.\d+)*(?:[\/\-]\d{2,4})?(?![\p{L}\p{N}])/giu
            ]
        },
        {
            /* TIPO 8: Coordenadas Geograficas GPS (DMS, DMM, Graus Decimais, UTM/SIRGAS) e Google Plus Codes */
            grupo: 'COORDENADAS_GPS_E_PLUS_CODES',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: false,
            regexes: [
                /* Sub-tipo 8.1: Graus, Minutos e Segundos Sexagesimais (DMS)
                 * Ex: "15o47'39.2\"S 47o52'55.8\"W", "15o 47' 39,2\" S, 47o 52' 55,8\" O", "S 15o47'39.2\" W 47o52'55.8\"" */
                /(?<![\p{L}\p{N}])(?:[NSns]\s*)?\d{1,2}\s*[\u00B0\u00BA]\s*\d{1,2}\s*['\u2032\u2019]\s*\d{1,2}(?:[.,]\d+)?\s*(?:["\u2033\u201D]|'')\s*[NSns]?(?:[\s,;\/]+|\s+[eE]\s+)(?:[EWewOLol]\s*)?\d{1,3}\s*[\u00B0\u00BA]\s*\d{1,2}\s*['\u2032\u2019]\s*\d{1,2}(?:[.,]\d+)?\s*(?:["\u2033\u201D]|'')\s*[EWewOLol]?(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 8.2: Graus e Minutos Decimais (DMM)
                 * Ex: "15o 47.653' S, 47o 52.930' W", "15o47.653'S 47o52.930'O" */
                /(?<![\p{L}\p{N}])(?:[NSns]\s*)?\d{1,2}\s*[\u00B0\u00BA]\s*\d{1,2}[.,]\d+\s*['\u2032\u2019]\s*[NSns]?(?:[\s,;\/]+)(?:[EWewOLol]\s*)?\d{1,3}\s*[\u00B0\u00BA]\s*\d{1,2}[.,]\d+\s*['\u2032\u2019]\s*[EWewOLol]?(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 8.3: Graus Decimais (DD -- estilo Google Maps, desde imprecisao de cidade ate alta precisao metrica)
                 * Ex: "-25.51, -54.58", "-15.794229, -47.882166", "-5.08921, -42.80160", "+23.550520, -46.633308" */
                /(?<![\p{L}\p{N}.\/\-])[+\-]?\d{1,2}\.\d{1,8}\s*,\s*[+\-]?\d{1,3}\.\d{1,8}(?![\p{L}\p{N}.\/\-])/gu,
                /* Sub-tipo 8.4: Coordenadas Planas UTM / SIRGAS 2000 (Pericias, INCRA, CAR, IBAMA)
                 * Ex: "23S 721450mE 8251340mS", "23K 333456 E 7394567 N", "UTM 23S E 721.450,00 N 8.251.340,00" */
                /(?<![\p{L}\p{N}])(?:UTM\s+)?\d{1,2}\s*[C-HJ-NP-Xc-hj-np-x]\s+(?:[Ee]\s*)?\d{3}(?:\.?\d{3})(?:,\d{1,3})?\s*(?:m\s*[Ee]|[Ee])?[\s,;\/]+(?:[NnSs]\s*)?\d{1}(?:\.?\d{3}){2}(?:,\d{1,3})?\s*(?:m\s*[NnSs]|[NnSs])?(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 8.5: Google Plus Codes (Open Location Code -- completo 8+2 ou curto 4/6+2)
                 * Ex: "58PJ645X+44", "6877656X+99", "645X+44" */
                /(?<![\p{L}\p{N}+])(?:[23456789CFGHJMPQRVWX]{8}|[23456789CFGHJMPQRVWX]{4,6})\+[23456789CFGHJMPQRVWX]{2,3}(?![\p{L}\p{N}+])/giu
            ]
        },
        {
            /* TIPO 8: Enderecos de E-mail e Perfis/Handles Sociais */
            grupo: 'EMAILS_E_PERFIS_SOCIAIS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: false,
            regexes: [
                /* Sub-tipo 8.1: E-mails padrao RFC 5322 */
                /(?<![\p{L}\p{N}_%+.\\-])[a-zA-Z0-9]+(?:[._%+\-][a-zA-Z0-9]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,15}(?![\p{L}\p{N}_%+.\\-])/gu,
                /* Sub-tipo 8.2: Handles e perfis sociais iniciados por '@' */
                /(?<![\p{L}\p{N}_.\-])@[a-zA-Z0-9_]+(?:[.\-][a-zA-Z0-9_]+)*(?![\p{L}\p{N}_])/gu
            ]
        },
        {
            /* TIPO 9: Telefones Nacionais e Internacionais (Blindado contra falso-positivo em blocos de 4 digitos)
             * O porque da correcao: Exige parenteses no DDD "(XX)", ou prefixo "+DDI", ou "0800", ou hifen "-"
             * entre os dois blocos finais do telefone. Assim, sequencias puras espacadas como "215 7014 6992 8831"
             * NUNCA sao confundidas com telefone em 1 clique! */
            grupo: 'TELEFONES_NACIONAIS_E_INTERNACIONAIS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 9.1: Telefone com DDD entre parenteses ou +DDI (ex: "(86) 99999-8888", "+55 (11) 98765-4321") */
                /(?<![\p{L}\p{N}\/.])(?:(?:\+\d{1,3}[\t \u00A0\-]?)?\(\d{2,3}\)[\t \u00A0\-]?(?:9[\t \u00A0\-]?\d{4}|\d{4})[\t \u00A0\-]\d{4}|0?\d{2}[\t \u00A0\-]?(?:9\d{4}|\d{4})-\d{4})(?![\p{L}\p{N}\/.])/gu,
                /* Sub-tipo 9.2: Servicos de utilidade 0800 / 0300 / 4004 (ex: "0800 728 1992", "0800 1234-5678", "4004-0104") */
                /(?<![\p{L}\p{N}])(?:0[3589]00[\t \u00A0\-]?\d{3,4}[\t \u00A0\-]?\d{4,5}|[34]00\d-\d{4})(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 9.3: Telefone Internacional com +DDI explicito (ex: "+1 800-555-0199", "+351 21 123 4567") */
                /(?<![\p{L}\p{N}])\+\d{1,3}[\t \u00A0\-.](?:\(\d{1,4}\)[\t \u00A0\-]?)?\d{2,5}(?:[\t \u00A0\-.]\d{2,5}){1,3}(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 9.4: Telefone local sem DDD com hifen obrigatorio (ex: "99999-8888", "3222-1111") */
                /(?<![\p{L}\p{N}\-\/.,])(?:9[\t \u00A0.]?\d{4}|\d{4})-\d{4}(?![\p{L}\p{N}\-\/.,])/gu
            ]
        },
        {
            /* TIPO 10: Valores Monetarios (com logica incremental para extenso), Percentuais e Numeros com Sinal (+ ou -) */
            grupo: 'FINANCEIRO_E_DECIMAIS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 10.1: Moeda em Reais (com ou sem R$, com ou sem sinal unario +/-) com extenso opcional entre parenteses
                 * Ex: "R$ 65,00 (sessenta e cinco reais)", "R$ -1.000,00", "R$ - 1.000,00", "-R$ 1.000,00", "R$ +1.000,00", "1.500,00", "+0,25", "-0,45" */
                /(?<![\p{L}\p{N}])(?:(?:[+\-\u2212\u2013]\s*)?R\$\s*[+\-\u2212\u2013]?\s*|R\$\s*[+\-\u2212\u2013]?\s*|[+\-\u2212\u2013])?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}(?:\s*\([\p{L}\p{N}\s,.\-]+\))?(?![\p{L}\p{N}%])/giu,
                /* Sub-tipo 10.2: Formato Percentual com ou sem sinal unario +/- (ex: "100%", "20,500%", "+0,25%", "-0,45%", "+1%", "-10%") */
                /(?<![\p{L}\p{N}])[+\-\u2212\u2013]?(?:\d{1,3}(?:\.\d{3})*|\d+)(?:[.,]\d+)?%(?![\p{L}\p{N}])/gu,
                /* Sub-tipo 10.3: Numeros inteiros ou decimais com sinal explicito (+ ou - sem espaco)
                 * Ex: "+1", "-1", "+100", "-50", "+1.233", "-1.233", "-1.233,00", "+1.233,00"
                 * Blindado com (?![\p{L}\p{N}%.,]) para jamais truncar antes de separador decimal ou milhar e evitar falsos-positivos em marcadores */
                /(?<![\p{L}\p{N}])[+\-\u2212\u2013](?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d+)?(?![\p{L}\p{N}%.,])/gu
            ]
        },
        {
            /* TIPO 11: Datas Isoladas (DD/MM/AAAA, DD.MM.AAAA, DD-MM-AAAA, MM/AAAA) e Horarios Isolados */
            grupo: 'DATAS_E_HORARIOS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 11.1: Datas numericas separadas por '/', '.' ou '-' (blindado com (?![\p{L}\p{N}\/\-]|\.\p{N}) permitindo ponto final de sentenca como "Itabuna, 01.05.19.") */
                /(?<![\p{L}\p{N}\/.\-])\d{1,2}[\/.\-](?:\d{1,2}[\/.\-]\d{2,4}|\d{2,4})(?![\p{L}\p{N}\/\-]|\.\p{N})/gu,
                /* Sub-tipo 11.2: Horarios isolados (HH:MM:SS, HH:MM, HHhMMmin) */
                /(?<![\p{L}\p{N}:])(?:\d{1,2}:\d{2}(?::\d{2})?|(?:[01]?\d|2[0-3])h(?:[0-5]\d(?:min)?)?)(?![\p{L}\p{N}])/giu
            ]
        },
        {
            /* TIPO 12: Padroes Genericos, Blocos de Boletos Pontuados ("0000.0000-0000") e Resolucoes ("2560x1080") */
            grupo: 'GENERICOS_E_FALLBACKS',
            exigeEspacoOuDuploClique: false,
            suportaFiltroShiftDigitos: true,
            regexes: [
                /* Sub-tipo 12.1: Resolucoes de tela/video (ex: "2560x1080") */
                /(?<![\p{L}\p{N}_\-])\d{3,5}x\d{3,5}(?![\p{L}\p{N}_\-])/giu,
                /* Sub-tipo 12.2: Blocos numericos contiguos com pontuacoes separadoras de boletos/codigos
                 * Ex: "0000.0000-0000", "12345.67890", "01.02.03-4" (qualquer quantidade de digitos sem espaco) */
                /(?<![\p{L}\p{N}_\-])(?:\d+[\/\-\.,])+\d+(?![\p{L}\p{N}_\-])/gu,
                /* Sub-tipo 12.3: Sequencia numerica pura de 3+ digitos */
                /(?<![\p{L}\p{N}_\-])\d{3,}(?![\p{L}\p{N}_\-])/gu
            ]
        }
    ]);

    return Object.freeze({ CATALOGO_PADROES_JURIDICOS });
}));