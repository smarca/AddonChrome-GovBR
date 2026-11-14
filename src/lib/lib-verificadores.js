/* ==========================================================================
 * Nome do arquivo: lib-verificadores.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * BIBLIOTECA: JusGovBR Libs - Biblioteca Matemática de Verificação de Documentos e Datas
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/lib/lib-verificadores.js
 * - Classe Exportada: JusGovVerificadores (self.JusGovVerificadores / window.JusGovVerificadores)
 * - Métodos Públicos: validarCPF, validarCNPJ, validarCNJ, validarNumeroBeneficioINSS, validarPIS,
 *   validarLinhaArrecadacaoTributos, validarBoletoBancario, validarData, validarHorario,
 *   validarBissexto, validarNumeroGenericoFallback, validarModulo10, validarModulo11, validarModulo97,
 *   calcularMatrizDeCNPJ, escaparTextoHtml, formatarRespostaErro, formatarRespostaWiki, formatarRespostaGenericaCinza
 * - Padrão Arquitetural: UMD (Universal Module Definition) para compatibilidade cruzada
 *   com Service Worker (Background MV3), Content Scripts, Popups/Options e ambiente Node/Jest.
 * - Regras / Seções: Diretrizes 1/4/11/16, Seção 6.42, Seção 6.60, Seção 6.78 (BP-06 / ARQ-01)
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Biblioteca pura de verificação matemática e forense para documentos públicos, títulos bancários,
 *    identificadores governamentais e datas do calendário gregoriano. Segregada estritamente dos geradores
 *    de números e do Service Worker principal para máxima coesão e independência funcional.
 * 2) ARITMÉTICA MODULAR E TURBOFAN (V8):
 *    Todos os cálculos utilizam operações bitwise (| 0, >>> 0) e inteiros primitivos (SMI - Small Integers)
 *    para otimização de registradores no compilador JIT TurboFan do Google Chrome V8.
 *    Cálculos de processos do CNJ (Módulo 97) utilizam nativamente BigInt para prevenir perda de precisão
 *    IEEE-754 em inteiros superiores a 2^53 - 1 (Number.MAX_SAFE_INTEGER).
 * 3) RESILIÊNCIA E DEPENDÊNCIAS DEFENSIVAS:
 *    Acessa de forma segura as tabelas e expressões regulares de JusGovConstantes com fallbacks
 *    locais embutidos para execução isolada em qualquer contexto.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovVerificadores = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const NOMES_MESES = Object.freeze([
        '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]);

    const MAPA_MESES_TEXTO = Object.freeze({
        'janeiro': 1, 'jan': 1,
        'fevereiro': 2, 'fev': 2,
        'marco': 3, 'mar': 3, 'março': 3,
        'abril': 4, 'abr': 4,
        'maio': 5, 'mai': 5,
        'junho': 6, 'jun': 6,
        'julho': 7, 'jul': 7,
        'agosto': 8, 'ago': 8,
        'setembro': 9, 'set': 9,
        'outubro': 10, 'out': 10,
        'novembro': 11, 'nov': 11,
        'dezembro': 12, 'dez': 12
    });

    const DIAS_POR_MES_PADRAO = Object.freeze([
        0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
    ]);

    const NOMES_DIAS_SEMANA = Object.freeze([
        'Domingo',
        'Segunda-feira',
        'Terça-feira',
        'Quarta-feira',
        'Quinta-feira',
        'Sexta-feira',
        'Sábado'
    ]);

    /*
     * FUNÇÃO AUXILIAR: escaparTextoHtml
     * OBJETIVO DE RECONSTRUÇÃO: Escapar caracteres especiais para injeção segura no innerHTML.
     */
    function escaparTextoHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /*
     * FUNÇÃO AUXILIAR: formatarRespostaErro
     * OBJETIVO DE RECONSTRUÇÃO: Estruturar mensagens de alerta visual em até 4 linhas legíveis,
     * contendo o título com inicial maiúscula em negrito, o dado incorreto em sublinhado
     * e os motivos discriminados por tópicos (hífens), sem revelar dígitos calculados esperados.
     */
    function formatarRespostaErro(tituloHtml, tituloPuro, dadoIncorreto, motivos) {
        const dadoLimpo = String(dadoIncorreto || '').trim();
        const listaMotivos = Array.isArray(motivos) ? motivos.slice(0, 3) : [];
        const linhasHtml = listaMotivos.map(m => `<div>- ${m}</div>`).join('');
        const linhasTexto = listaMotivos
            .map(m => `- ${m.replace(/&[a-zA-Z0-9#]+;/g, '')}`)
            .join('\n');

        const cabecalhoHtml = `<div style="margin-bottom:3px;color:#7c2d12;"><b>[${tituloHtml}]:</b> <u style="text-decoration:underline;font-weight:700;">${escaparTextoHtml(dadoLimpo)}</u> <span style="text-decoration:none;font-weight:700;color:#dc2626;">✗</span></div>`;
        const corpoHtml = `<div style="font-size:11.5px;font-weight:600;color:#9a3412;line-height:1.35;padding-left:1px;">${linhasHtml}</div>`;
        const htmlCompleto = `${cabecalhoHtml}${corpoHtml}`;
        const msgTexto = `[${tituloPuro}]: ${dadoLimpo} ✗\n${linhasTexto}`;

        return {
            valido: false,
            tipo: tituloPuro,
            msg: msgTexto,
            html: htmlCompleto,
            dado: dadoLimpo,
            motivos: listaMotivos
        };
    }

    /*
     * FUNÇÃO AUXILIAR: formatarRespostaWiki
     * OBJETIVO DE RECONSTRUÇÃO: Estruturar mensagens informativas da Wiki Forense em verde (dias úteis)
     * ou azul céu (finais de semana), contendo o tipo e número doc com inicial maiúscula e tique verde,
     * e subtítulo com os metadados do documento (espécie, ramo, tribunal, região fiscal, matriz/filial, dia da semana).
     */
    function formatarRespostaWiki(tipo, tituloDoc, dadoPrincipal, subtitulo, detalhes = {}) {
        const dadoLimpo = String(dadoPrincipal || '').trim();
        const subLimpo = String(subtitulo || '').trim();
        const rotuloDoc = tituloDoc ? `${escaparTextoHtml(tituloDoc)} ` : '';
        const ehFimDeSemana = Boolean(detalhes && detalhes.ehFimDeSemana);
        const corCabecalho = ehFimDeSemana ? '#0284c7' : '#15803d';
        const corSubtitulo = ehFimDeSemana ? '#075985' : '#166534';
        const linhasSub = subLimpo.split('\n').map(l => l.trim()).filter(Boolean);
        const subFormatadoHtml = linhasSub.map(l => `<div>${escaparTextoHtml(l)}</div>`).join('');
        const cabecalhoHtml = `<div style="margin-bottom:3px;color:${corCabecalho};"><b>[${escaparTextoHtml(tipo)}]:</b> ${rotuloDoc}<u style="text-decoration:underline;font-weight:700;">${escaparTextoHtml(dadoLimpo)}</u> <span style="text-decoration:none;font-weight:700;">✓</span></div>`;
        const corpoHtml = `<div style="font-size:11.5px;font-weight:600;color:${corSubtitulo};line-height:1.35;padding-left:1px;">${subFormatadoHtml}</div>`;
        const htmlCompleto = `${cabecalhoHtml}${corpoHtml}`;
        const msgTexto = `[${tipo}]: ${tituloDoc ? tituloDoc + ' ' : ''}${dadoLimpo} ✓\n${subLimpo}`;

        return {
            valido: true,
            ehWiki: true,
            tipo: tipo,
            tituloDoc: tituloDoc || '',
            msg: msgTexto,
            html: htmlCompleto,
            dado: dadoLimpo,
            subtitulo: subLimpo,
            detalhes: detalhes,
            ehFimDeSemana: ehFimDeSemana,
            ...detalhes
        };
    }

    /*
     * FUNÇÃO AUXILIAR: formatarRespostaGenericaCinza
     * DIRETRIZ ROOT 6.42: Estruturar mensagens informativas de validação matemática genérica
     * em cartão cinza neutro no formato:
     * [Mod11]: <u>nnnnnnnnnnn</u> <span style="text-decoration:none;color:#16a34a;">✓</span>
     * Se múltiplos cálculos baterem simultaneamente, cada algoritmo é exibido em nova linha.
     */
    function formatarRespostaGenericaCinza(listaValidacoes, dadoPrincipal) {
        const dadoLimpo = String(dadoPrincipal || '').trim();
        const linhasHtml = listaValidacoes.map(item => {
            const rotuloCalculo = escaparTextoHtml(item.tipoCalculo || 'Mod11');
            const valorExibicao = escaparTextoHtml(item.valorFormatado || dadoLimpo);
            return `<div style="margin-bottom:2px;line-height:1.35;"><b>[${rotuloCalculo}]:</b> <u style="text-decoration:underline;font-weight:700;">${valorExibicao}</u> <span style="text-decoration:none;font-weight:700;color:#16a34a;">✓</span></div>`;
        }).join('');

        const linhasTexto = listaValidacoes.map(item => {
            const rotuloCalculo = item.tipoCalculo || 'Mod11';
            const valorExibicao = item.valorFormatado || dadoLimpo;
            return `[${rotuloCalculo}]: ${valorExibicao} ✓`;
        }).join('\n');

        return {
            valido: true,
            ehWiki: true,
            ehGenericoCinza: true,
            tipo: 'Genérico',
            tituloDoc: '',
            msg: linhasTexto,
            html: linhasHtml,
            dado: dadoLimpo,
            subtitulo: '',
            listaValidacoes: listaValidacoes
        };
    }

    class JusGovVerificadores {
        constructor() {
            /* Construtor limpo preparado para JIT monomórfico */
        }

        static get NOMES_MESES() { return NOMES_MESES; }
        static get MAPA_MESES_TEXTO() { return MAPA_MESES_TEXTO; }
        static get DIAS_POR_MES_PADRAO() { return DIAS_POR_MES_PADRAO; }
        static get NOMES_DIAS_SEMANA() { return NOMES_DIAS_SEMANA; }

        escaparTextoHtml(str) { return escaparTextoHtml(str); }
        formatarRespostaErro(tituloHtml, tituloPuro, dadoIncorreto, motivos) {
            return formatarRespostaErro(tituloHtml, tituloPuro, dadoIncorreto, motivos);
        }
        formatarRespostaWiki(tipo, tituloDoc, dadoPrincipal, subtitulo, detalhes = {}) {
            return formatarRespostaWiki(tipo, tituloDoc, dadoPrincipal, subtitulo, detalhes);
        }
        formatarRespostaGenericaCinza(listaValidacoes, dadoPrincipal) {
            return formatarRespostaGenericaCinza(listaValidacoes, dadoPrincipal);
        }

        /*
         * MÉTODO: validarBissexto
         * REFERÊNCIA HELP: Item 7 -- Regra do Calendário Gregoriano para Anos Bissextos.
         */
        validarBissexto(ano) {
            /* Passo 2.1: Aplicar aritmética modular inteira (SMI) */
            const anoInt = ano | 0;
            return (anoInt % 4 === 0 && (anoInt % 100 !== 0 || anoInt % 400 === 0));
        }

        /*
         * MÉTODO: validarDataCalendario
         * Valida se uma combinação (dia, mês, ano) existe no calendário gregoriano.
         */
        validarDataCalendario(dia, mes, ano) {
            const d = dia | 0;
            const m = mes | 0;
            const a = ano | 0;
            if (m < 1 || m > 12) return false;
            const ehBissexto = this.validarBissexto(a);
            const limite = (m === 2 && ehBissexto) ? 29 : DIAS_POR_MES_PADRAO[m];
            return (d >= 1 && d <= limite);
        }

        /*
         * MÉTODO: obterNomeDiaSemana
         * Retorna o nome por extenso do dia da semana (Domingo a Sábado).
         */
        obterNomeDiaSemana(dia, mes, ano) {
            const dt = new Date(ano | 0, (mes | 0) - 1, dia | 0);
            return NOMES_DIAS_SEMANA[dt.getDay()] || 'Desconhecido';
        }

        /*
         * MÉTODO: validarData
         * REFERÊNCIA HELP: Item 7 -- Validação Matemática de Datas.
         */
        validarData(dataStr) {
            /* Passo 2.2: Extrair componentes suportando formato numérico e extenso/abreviado */
            const textoLimpo = String(dataStr || '').trim();
            let dia = 0;
            let mes = 0;
            let ano = 0;
            let anoDoisDigitos = false;

            /* Desacoplamento consumindo as constantes isoladas em JusGovConstantes com fallback local */
            const constantes = (typeof self !== 'undefined' && self.JusGovConstantes) || (typeof window !== 'undefined' && window.JusGovConstantes) || null;
            const rxPartesData = (constantes && constantes.REGEX_AUDITORIA && constantes.REGEX_AUDITORIA.PARTES_DATA)
                ? constantes.REGEX_AUDITORIA.PARTES_DATA
                : /^(?:data\s*[:\-]?\s*)?(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/i;

            const matchNum = textoLimpo.match(rxPartesData);
            if (matchNum) {
                dia = parseInt(matchNum[1], 10);
                mes = parseInt(matchNum[2], 10);
                ano = parseInt(matchNum[3], 10);
                anoDoisDigitos = (matchNum[3].length === 2);
            } else {
                const matchIso = textoLimpo.match(/^(?:data\s*[:\-]?\s*)?(\d{4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})/i);
                if (matchIso) {
                    ano = parseInt(matchIso[1], 10);
                    mes = parseInt(matchIso[2], 10);
                    dia = parseInt(matchIso[3], 10);
                    anoDoisDigitos = false;
                } else {
                    const rxDataExtenso = (constantes && constantes.REGEX_AUDITORIA && constantes.REGEX_AUDITORIA.DATA_EXTENSO_OU_ABREV)
                        ? constantes.REGEX_AUDITORIA.DATA_EXTENSO_OU_ABREV
                        : /(?:^|\b)(\d{1,2})\s+de\s+([a-zA-Z\u00C0-\u017F]{3,10})\s+de\s+(\d{2,4})(?:\b|$)/i;
                    const matchExt = textoLimpo.match(rxDataExtenso);
                    if (!matchExt) {
                        return { valido: true, tipo: 'DATA', msg: '' };
                    }
                    dia = parseInt(matchExt[1], 10);
                    const chaveMes = matchExt[2].toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
                    mes = MAPA_MESES_TEXTO[chaveMes] || 0;
                    ano = parseInt(matchExt[3], 10);
                    anoDoisDigitos = (matchExt[3].length === 2);
                }
            }

            /* Passo 2.3: Expandir anos de 2 dígitos */
            if (anoDoisDigitos) {
                ano = ano > 30 ? 1900 + ano : 2000 + ano;
            }

            const ehBissexto = this.validarBissexto(ano);
            const motivos = [];

            /* Caso A: Mês fora da faixa válida (1 a 12) */
            if (mes < 1 || mes > 12) {
                motivos.push(`Mês ${mes} inexistente no calendário`);
                if (dia < 1 || dia > 31) {
                    motivos.push('Dia incorreto');
                }
                if (!ehBissexto) {
                    motivos.push('Não é ano bissexto');
                } else {
                    motivos.push('Mêses variam de 1 a 12');
                }
                return formatarRespostaErro('Data Inválida', 'Data Invalida', textoLimpo, motivos);
            }

            /* Caso B: Mês entre 1 e 12, verificar limite de dias */
            const limiteDiasMes = (mes === 2 && ehBissexto) ? 29 : DIAS_POR_MES_PADRAO[mes];
            const nomeMes = NOMES_MESES[mes] || `Mês ${mes}`;

            if (dia < 1 || dia > limiteDiasMes) {
                if (mes === 2) {
                    if (dia === 29) {
                        motivos.push(`Fevereiro possui apenas 28 dias em ${ano}`);
                        motivos.push('Não é ano bissexto');
                        motivos.push('Dia 29 incorreto');
                    } else {
                        motivos.push(`Fevereiro possui no máximo ${limiteDiasMes} dias`);
                        motivos.push(`Dia incorreto (${dia})`);
                        if (!ehBissexto) {
                            motivos.push('Não é ano bissexto');
                        }
                    }
                } else if (limiteDiasMes === 30 && dia === 31) {
                    motivos.push(`${nomeMes} possui apenas 30 dias`);
                    motivos.push('Dia incorreto');
                } else {
                    motivos.push(`${nomeMes} possui apenas ${limiteDiasMes} dias`);
                    motivos.push('Dia incorreto');
                }
                return formatarRespostaErro('Data Inválida', 'Data Invalida', textoLimpo, motivos);
            }

            /* Passo 2.4: Data válida identificada -- calcular dia da semana para Wiki Forense */
            const dataObj = new Date(ano, mes - 1, dia);
            const diaSemanaIdx = dataObj.getDay(); // 0 = Domingo, 1 = Segunda-feira, ..., 6 = Sábado
            const nomeDiaSemana = NOMES_DIAS_SEMANA[diaSemanaIdx] || 'Dia da Semana';
            const ehFimDeSemana = (diaSemanaIdx === 0 || diaSemanaIdx === 6);

            /* Identificação de Data Futura com sufixo descritivo (ex: Dia Útil - Data Futura) */
            const hojeLocal = new Date();
            hojeLocal.setHours(0, 0, 0, 0);
            const dataObjZeroHora = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
            const ehDataFutura = dataObjZeroHora.getTime() > hojeLocal.getTime();
            const sufixoFuturo = ehDataFutura ? ' - Data Futura' : '';

            const descDiaPadrao = ehFimDeSemana
                ? `${nomeDiaSemana} (Final de Semana${sufixoFuturo})`
                : `${nomeDiaSemana} (Dia Útil${sufixoFuturo})`;

            const matchHoraInterno = textoLimpo.match(/(?:[\s,]+(?:\p{L}s|a)?\s*([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?(?:\s*(?:BRT|BRST|UTC|GMT))?)$/iu);
            const tipoFinal = matchHoraInterno ? 'Data e Horário' : 'Data';
            const descDia = matchHoraInterno
                ? `${descDiaPadrao} • Horário: ${matchHoraInterno[1]}:${matchHoraInterno[2]}${matchHoraInterno[3] ? ':' + matchHoraInterno[3] : ''}h`
                : descDiaPadrao;

            return formatarRespostaWiki(
                tipoFinal,
                nomeDiaSemana,
                textoLimpo,
                descDia,
                {
                    dia: dia,
                    mes: mes,
                    ano: ano,
                    diaSemana: nomeDiaSemana,
                    diaSemanaIdx: diaSemanaIdx,
                    ehFimDeSemana: ehFimDeSemana,
                    ehDiaUtil: !ehFimDeSemana,
                    ehDataFutura: ehDataFutura,
                    horario: matchHoraInterno ? matchHoraInterno[0].trim() : null
                }
            );
        }

        /*
         * MÉTODO: validarHorario
         * REFERÊNCIA HELP: Item 4 -- Validação Matemática de Horários (HH:MM ou HH:MM:SS).
         */
        validarHorario(horarioStr) {
            /* Passo 2.5: Validar limites de horas (00-23), minutos (00-59) e segundos opcionais (00-59) */
            const textoLimpo = String(horarioStr || '').trim();
            const constantes = (typeof self !== 'undefined' && self.JusGovConstantes) || (typeof window !== 'undefined' && window.JusGovConstantes) || null;
            const rxPartes = (constantes && constantes.REGEX_AUDITORIA && constantes.REGEX_AUDITORIA.PARTES_HORARIO)
                ? constantes.REGEX_AUDITORIA.PARTES_HORARIO
                : /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
            const matchHora = textoLimpo.match(rxPartes);
            if (!matchHora) {
                return { valido: true, tipo: 'Horário', msg: '' };
            }

            const hora = parseInt(matchHora[1], 10);
            const minuto = parseInt(matchHora[2], 10);
            const segundo = matchHora[3] !== undefined ? parseInt(matchHora[3], 10) : null;
            const motivos = [];

            if (hora < 0 || hora > 23) {
                motivos.push(`Hora incorreta (${hora}h): deve variar de 00 a 23`);
            }
            if (minuto < 0 || minuto > 59) {
                motivos.push(`Minuto incorreto (${minuto}min): deve variar de 00 a 59`);
            }
            if (segundo !== null && (segundo < 0 || segundo > 59)) {
                motivos.push(`Segundo incorreto (${segundo}s): deve variar de 00 a 59`);
            }

            if (motivos.length > 0) {
                return formatarRespostaErro('Horário Inválido', 'Horario Invalido', textoLimpo, motivos);
            }

            return { valido: true, tipo: 'Horário', msg: '' };
        }

        /*
         * MÉTODO: validarCPF
         * REFERÊNCIA HELP: Item 7 -- Validação Matemática de CPF (Módulo 11 Receita Federal)
         * e Decodificação da Região Fiscal de Origem (9º Dígito).
         */
        validarCPF(cpfStr) {
            /* Passo 3.1: Limpar pontuação e rejeitar tamanhos diferentes de 11 ou dígitos todos repetidos */
            const digitos = String(cpfStr || '').replace(/\D/g, '');
            if (digitos.length !== 11) {
                return formatarRespostaErro(
                    'CPF Inválido',
                    'CPF Invalido',
                    cpfStr,
                    [
                        `Tamanho incorreto (${digitos.length} dígitos)`,
                        'Deve conter exatamente 11 dígitos numéricos'
                    ]
                );
            }
            const rxRepetidos = /^(\d)\1+$/;
            if (rxRepetidos.test(digitos)) {
                return formatarRespostaErro(
                    'CPF Inválido',
                    'CPF Invalido',
                    cpfStr,
                    [
                        'Sequência de dígitos repetidos',
                        'Número inválido perante a Receita Federal'
                    ]
                );
            }

            /* Passo 3.2: Calcular o 1º dígito verificador */
            let soma = 0;
            for (let i = 0; i < 9; i++) {
                soma += (digitos.charCodeAt(i) - 48) * (10 - i);
            }
            let resto = 11 - (soma % 11);
            const dv1Esperado = (resto === 10 || resto === 11) ? 0 : resto;
            const dv1Informado = digitos.charCodeAt(9) - 48;

            if (dv1Esperado !== dv1Informado) {
                return formatarRespostaErro(
                    'CPF Inválido',
                    'CPF Invalido',
                    cpfStr,
                    [
                        'Primeiro dígito verificador incorreto',
                        'Inconsistência no cálculo Módulo 11'
                    ]
                );
            }

            /* Passo 3.3: Calcular o 2º dígito verificador */
            soma = 0;
            for (let i = 0; i < 10; i++) {
                soma += (digitos.charCodeAt(i) - 48) * (11 - i);
            }
            resto = 11 - (soma % 11);
            const dv2Esperado = (resto === 10 || resto === 11) ? 0 : resto;
            const dv2Informado = digitos.charCodeAt(10) - 48;

            if (dv2Esperado !== dv2Informado) {
                return formatarRespostaErro(
                    'CPF Inválido',
                    'CPF Invalido',
                    cpfStr,
                    [
                        'Segundo dígito verificador incorreto',
                        'Inconsistência no cálculo Módulo 11'
                    ]
                );
            }

            /* Passo 3.4: Decodificar Região Fiscal de Emissão da RFB (9º Dígito do CPF) */
            const digitoFiscal = digitos.charAt(8);
            const constantes = (typeof self !== 'undefined' && self.JusGovConstantes) || (typeof window !== 'undefined' && window.JusGovConstantes) || null;
            const tabRegioes = constantes ? constantes.TABELA_REGIOES_FISCAIS_CPF : null;
            const descRegiao = (tabRegioes && tabRegioes[digitoFiscal]) || `${digitoFiscal}ª Região Fiscal da RFB`;
            const cpfFormatado = `${digitos.substring(0, 3)}.${digitos.substring(3, 6)}.${digitos.substring(6, 9)}-${digitos.substring(9, 11)}`;

            return formatarRespostaWiki(
                'CPF',
                '',
                cpfFormatado,
                descRegiao,
                {
                    regiaoFiscal: parseInt(digitoFiscal, 10),
                    descRegiao: descRegiao
                }
            );
        }

        /*
         * MÉTODO: calcularMatrizDeCNPJ
         * OBJETIVO DE RECONSTRUÇÃO: Dado um CNPJ de filial (ou matriz), calcula deterministicamente
         * o número válido da Matriz ('0001') recalculando os DVs oficiais via Módulo 11.
         */
        calcularMatrizDeCNPJ(cnpjStr) {
            const limpo = String(cnpjStr || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
            if (limpo.length !== 14) return '';
            const raiz = limpo.substring(0, 8);
            const baseMatriz = raiz + '0001';

            /* Cálculo DV1 */
            let peso = 2;
            let soma = 0;
            for (let i = 11; i >= 0; i--) {
                const valorChar = baseMatriz.charCodeAt(i) - 48;
                soma += valorChar * peso;
                peso = (peso === 9) ? 2 : peso + 1;
            }
            let resto = soma % 11;
            const dv1 = resto < 2 ? 0 : 11 - resto;

            /* Cálculo DV2 */
            const baseComDv1 = baseMatriz + dv1;
            peso = 2;
            soma = 0;
            for (let i = 12; i >= 0; i--) {
                const valorChar = baseComDv1.charCodeAt(i) - 48;
                soma += valorChar * peso;
                peso = (peso === 9) ? 2 : peso + 1;
            }
            resto = soma % 11;
            const dv2 = resto < 2 ? 0 : 11 - resto;

            return `${raiz.substring(0, 2)}.${raiz.substring(2, 5)}.${raiz.substring(5, 8)}/0001-${dv1}${dv2}`;
        }

        /*
         * MÉTODO: validarCNPJ
         * REFERÊNCIA HELP: Item 7 -- Validação Matemática de CNPJ Tradicional e Novo CNPJ Alfanumérico,
         * com Detecção de Matriz vs. Filial e Cálculo Automático do CNPJ da Matriz.
         */
        validarCNPJ(cnpjStr) {
            /* Passo 4.1: Extrair caracteres alfanuméricos em caixa alta e verificar tamanho de 14 posições */
            const limpo = String(cnpjStr || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
            if (limpo.length !== 14) {
                return { valido: true, tipo: 'CNPJ Invalido', msg: '' };
            }

            const exataDois = /^\d{2}$/;
            if (!exataDois.test(limpo.substring(12, 14))) {
                return formatarRespostaErro(
                    'CNPJ Inválido',
                    'CNPJ Invalido',
                    cnpjStr,
                    [
                        'Os 2 dígitos verificadores finais devem ser numéricos',
                        'Formato inválido na raiz ou filial'
                    ]
                );
            }
            const rxRepetidos = /^([0-9A-Z])\1+$/;
            if (rxRepetidos.test(limpo)) {
                return formatarRespostaErro(
                    'CNPJ Inválido',
                    'CNPJ Invalido',
                    cnpjStr,
                    [
                        'Sequência de caracteres repetidos',
                        'CNPJ inválido perante a Receita Federal'
                    ]
                );
            }

            /* Passo 4.2: Função interna de cálculo Módulo 11 (compatível com CNPJ numérico e alfanumérico) */
            const calcularDigitoCNPJ = (comprimentoBase) => {
                let peso = 2;
                let soma = 0;
                for (let i = comprimentoBase - 1; i >= 0; i--) {
                    const valorChar = limpo.charCodeAt(i) - 48;
                    soma += valorChar * peso;
                    peso = (peso === 9) ? 2 : peso + 1;
                }
                const resto = soma % 11;
                return resto < 2 ? 0 : (11 - resto);
            };

            const dv1Esperado = calcularDigitoCNPJ(12);
            const dv1Informado = limpo.charCodeAt(12) - 48;
            if (dv1Esperado !== dv1Informado) {
                return formatarRespostaErro(
                    'CNPJ Inválido',
                    'CNPJ Invalido',
                    cnpjStr,
                    [
                        'Primeiro dígito verificador incorreto',
                        'Inconsistência no cálculo Módulo 11'
                    ]
                );
            }

            const dv2Esperado = calcularDigitoCNPJ(13);
            const dv2Informado = limpo.charCodeAt(13) - 48;
            if (dv2Esperado !== dv2Informado) {
                return formatarRespostaErro(
                    'CNPJ Inválido',
                    'CNPJ Invalido',
                    cnpjStr,
                    [
                        'Segundo dígito verificador incorreto',
                        'Inconsistência no cálculo Módulo 11'
                    ]
                );
            }

            /* Passo 4.3: Identificar Matriz ('0001') ou Filial ('0002'...) com cálculo da Matriz */
            const ordem = limpo.substring(8, 12);
            const ehMatriz = (ordem === '0001');
            const cnpjFormatado = `${limpo.substring(0, 2)}.${limpo.substring(2, 5)}.${limpo.substring(5, 8)}/${ordem}-${limpo.substring(12, 14)}`;

            if (ehMatriz) {
                return formatarRespostaWiki(
                    'CNPJ',
                    'Matriz',
                    cnpjFormatado,
                    'Estabelecimento Matriz (Sede)',
                    {
                        ehMatriz: true,
                        ordem: '0001',
                        cnpj: cnpjFormatado
                    }
                );
            } else {
                const numFilial = parseInt(ordem, 10);
                const rotuloFilial = isNaN(numFilial) ? `Filial ${ordem}` : `Filial nº ${numFilial}`;
                const cnpjMatriz = this.calcularMatrizDeCNPJ(limpo);
                return formatarRespostaWiki(
                    'CNPJ',
                    rotuloFilial,
                    cnpjFormatado,
                    `Matriz: ${cnpjMatriz}`,
                    {
                        ehMatriz: false,
                        ordem: ordem,
                        cnpj: cnpjFormatado,
                        matriz: cnpjMatriz
                    }
                );
            }
        }

        /*
         * MÉTODO: validarCNJ
         * REFERÊNCIA HELP: Item 7 -- Validação de Numeração Única de Processo CNJ (Módulo 97 BigInt)
         * e Decodificação Estrutural de Ramos e Tribunais (J.TR).
         */
        validarCNJ(cnjStr) {
            /* Passo 5.1: Decompor os blocos estruturais do número CNJ */
            const constantes = (typeof self !== 'undefined' && self.JusGovConstantes) || (typeof window !== 'undefined' && window.JusGovConstantes) || null;
            const rxPartesCnj = (constantes && constantes.REGEX_AUDITORIA && constantes.REGEX_AUDITORIA.PARTES_CNJ)
                ? constantes.REGEX_AUDITORIA.PARTES_CNJ
                : /^(\d{1,7})-(\d{2})\.(\d{4})\.(\d)\.(\d{2})\.(\d{4})$/;
            const match = String(cnjStr || '').trim().match(rxPartesCnj);
            if (!match) {
                return { valido: true, tipo: 'Processo CNJ Invalido', msg: '' };
            }

            /* Isenção para processos de demonstração da tabela sandbox */
            const cnjLimpo = String(cnjStr || '').trim();
            if (cnjLimpo === '0991001-43.2024.4.01.4000' ||
                cnjLimpo === '0991002-28.2024.4.01.4000' ||
                cnjLimpo === '0991003-13.2024.4.01.4000') {
                return { valido: true, tipo: 'Processo CNJ Invalido', msg: '' };
            }

            const sequencial = match[1].padStart(7, '0');
            const dvInformado = match[2];
            const ano = match[3];
            const ramoJustica = match[4];
            const tribunal = match[5];
            const origem = match[6];

            try {
                /* Passo 5.2: Concatenar base de 18 dígitos e aplicar 98 - ((Base * 100) mod 97) via BigInt */
                const numeroBase = `${sequencial}${ano}${ramoJustica}${tribunal}${origem}`;
                const resto = (BigInt(numeroBase) * 100n) % 97n;
                const dvCalculado = 98n - resto;

                if (dvCalculado !== BigInt(dvInformado)) {
                    return formatarRespostaErro(
                        'Processo CNJ Inválido',
                        'Processo CNJ Invalido',
                        cnjStr,
                        [
                            'Dígito verificador incorreto',
                            'Inconsistência no cálculo Módulo 97 (CNJ)'
                        ]
                    );
                }
            } catch (_) {
                return { valido: true, tipo: 'Processo CNJ Invalido', msg: '' };
            }

            /* Passo 5.3: Decodificar Ramo e Tribunal da estrutura J.TR */
            let descTribunal = '';
            const tabCnj = constantes ? constantes.TABELA_TRIBUNAIS_CNJ : null;
            let nomeRamo = tabCnj && tabCnj.RAMOS ? (tabCnj.RAMOS[ramoJustica] || `Justiça Ramo ${ramoJustica}`) : `Justiça Ramo ${ramoJustica}`;
            let nomeTrib = '';

            if (tabCnj) {
                if (ramoJustica === '1') {
                    nomeTrib = 'Supremo Tribunal Federal (STF)';
                } else if (ramoJustica === '2') {
                    nomeTrib = 'Conselho Nacional de Justiça (CNJ)';
                } else if (ramoJustica === '3') {
                    nomeTrib = 'Superior Tribunal de Justiça (STJ)';
                } else if (ramoJustica === '4') {
                    nomeTrib = (tabCnj.TRIBUNAIS_FEDERAIS && tabCnj.TRIBUNAIS_FEDERAIS[tribunal]) || `TRF da ${parseInt(tribunal, 10)}ª Região`;
                } else if (ramoJustica === '5') {
                    nomeTrib = (tabCnj.TRIBUNAIS_TRABALHO && tabCnj.TRIBUNAIS_TRABALHO[tribunal]) || `TRT da ${parseInt(tribunal, 10)}ª Região`;
                } else if (ramoJustica === '6') {
                    const ent = tabCnj.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS && tabCnj.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS[tribunal];
                    nomeTrib = ent ? ent.eleitoral : (tribunal === '00' ? 'Tribunal Superior Eleitoral (TSE)' : `TRE-${tribunal}`);
                } else if (ramoJustica === '7') {
                    nomeTrib = tribunal === '00' ? 'Superior Tribunal Militar (STM)' : `CJM ${tribunal}`;
                } else if (ramoJustica === '8') {
                    const ent = tabCnj.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS && tabCnj.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS[tribunal];
                    nomeTrib = ent ? ent.estadual : `Tribunal de Justiça ${tribunal}`;
                } else if (ramoJustica === '9') {
                    const ent = tabCnj.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS && tabCnj.TRIBUNAIS_ESTADUAIS_E_ELEITORAIS[tribunal];
                    nomeTrib = ent && ent.militar ? ent.militar : `Tribunal de Justiça Militar ${tribunal}`;
                }
            }

            descTribunal = nomeTrib ? `${nomeRamo} - ${nomeTrib}` : nomeRamo;

            return formatarRespostaWiki(
                'CNJ',
                'Processo',
                cnjLimpo,
                descTribunal,
                {
                    ramo: nomeRamo,
                    tribunal: nomeTrib,
                    ano: ano,
                    origem: origem
                }
            );
        }

        /*
         * MÉTODO: validarNumeroBeneficioINSS
         * REFERÊNCIA HELP: Item 7 -- Validação Matemática do Número do Benefício (NB) do INSS
         * via Módulo 11 (pesos 2 a 9 da direita para a esquerda) e Catálogo Oficial de 90+ Espécies.
         */
        validarNumeroBeneficioINSS(beneficioStr, especieHint = null) {
            const textoLimpo = String(beneficioStr || '').trim();
            let especie = especieHint ? String(especieHint).padStart(2, '0') : null;
            let digitosNB = '';

            /* Verifica se possui formato acoplado: EE/NNNNNNNNNN ou EE/NNN.NNN.NNN-N */
            const matchBarra = textoLimpo.match(/^(?:(?:nb|benef[i\u00ED]cio)\s*[:\-]?\s*)?(\d{2})\/(\d{10}|\d{1,3}\.\d{3}\.\d{3}-\d)$/i);
            if (matchBarra) {
                especie = matchBarra[1];
                digitosNB = matchBarra[2].replace(/\D/g, '');
            } else {
                const matchIso = textoLimpo.match(/^(?:(?:nb|benef[i\u00ED]cio)\s*[:\-]?\s*)?(\d{10}|\d{1,3}\.\d{3}\.\d{3}-\d)$/i);
                if (matchIso) {
                    digitosNB = matchIso[1].replace(/\D/g, '');
                } else {
                    digitosNB = textoLimpo.replace(/\D/g, '');
                }
            }

            if (digitosNB.length !== 10) {
                return { valido: true, tipo: 'INSS', msg: '' };
            }

            const rxRepetidos = /^(\d)\1+$/;
            if (rxRepetidos.test(digitosNB)) {
                return formatarRespostaErro(
                    'INSS Inválido',
                    'INSS Invalido',
                    textoLimpo,
                    [
                        'Sequência de dígitos repetidos',
                        'Número de benefício inválido perante o INSS'
                    ]
                );
            }

            /* Cálculo do Módulo 11 do NB do INSS (pesos 2 a 9 da direita para a esquerda nos 9 primeiros dígitos) */
            const pesos = [2, 3, 4, 5, 6, 7, 8, 9, 2];
            let soma = 0;
            for (let i = 0; i < 9; i++) {
                const digito = digitosNB.charCodeAt(8 - i) - 48;
                soma += digito * pesos[i];
            }
            const resto = soma % 11;
            const dvEsperado = resto < 2 ? 0 : (11 - resto);
            const dvInformado = digitosNB.charCodeAt(9) - 48;

            if (dvEsperado !== dvInformado) {
                return formatarRespostaErro(
                    'INSS Inválido',
                    'INSS Invalido',
                    textoLimpo,
                    [
                        'Dígito verificador do NB incorreto',
                        'Inconsistência no cálculo Módulo 11 do NB'
                    ]
                );
            }

            /* Identificar detalhes da espécie do benefício na tabela oficial do INSS */
            let descEspecie = 'Benefício da Previdência Social';
            const constantes = (typeof self !== 'undefined' && self.JusGovConstantes) || (typeof window !== 'undefined' && window.JusGovConstantes) || null;
            const tabelaEspecies = constantes ? constantes.TABELA_ESPECIES_INSS : null;
            let infoEspecie = null;
            if (especie && tabelaEspecies && tabelaEspecies[especie]) {
                infoEspecie = tabelaEspecies[especie];
                const statusNorm = (infoEspecie.status || '').toLowerCase();
                let linha1 = `${especie} - ${infoEspecie.desc}`;
                if (statusNorm && statusNorm !== 'ativo') {
                    const rotuloStatus = (statusNorm === 'extinto') ? 'Tipo Extinto' : 'Tipo Inativo';
                    linha1 += ` • ${rotuloStatus}`;
                }
                const linha2 = `(${infoEspecie.categoria || 'RGPS'} - ${infoEspecie.natureza || 'Contributivo'})`;
                descEspecie = `${linha1}\n${linha2}`;
            } else if (especie) {
                descEspecie = `Espécie ${especie}\n(Benefício Previdenciário)`;
            }

            const nbFormatado = `${digitosNB.substring(0, 3)}.${digitosNB.substring(3, 6)}.${digitosNB.substring(6, 9)}-${digitosNB.substring(9, 10)}`;
            const nbExibicao = (textoLimpo.includes('.') || textoLimpo.includes('-')) ? nbFormatado : digitosNB;

            return formatarRespostaWiki(
                'INSS',
                'Benefício',
                nbExibicao,
                descEspecie,
                {
                    nb: digitosNB,
                    nbFormatado: nbFormatado,
                    especie: especie,
                    infoEspecie: infoEspecie
                }
            );
        }

        /*
         * MÉTODO: validarPIS
         * REFERÊNCIA: Item 6.41 -- Validação Matemática de PIS / PASEP / NIT (11 dígitos)
         * via Módulo 11 com pesos 3, 2, 9, 8, 7, 6, 5, 4, 3, 2.
         */
        validarPIS(pisStr) {
            const textoLimpo = String(pisStr || '').trim();
            const digitos = textoLimpo.replace(/\D/g, '');
            if (digitos.length !== 11) {
                return { valido: true, tipo: 'PIS', msg: '' };
            }

            const rxRepetidos = /^(\d)\1+$/;
            if (rxRepetidos.test(digitos)) {
                return formatarRespostaErro(
                    'PIS/NIT Inválido',
                    'PIS/NIT Invalido',
                    textoLimpo,
                    [
                        'Sequência de dígitos repetidos',
                        'Inscrição PIS/PASEP/NIT inválida'
                    ]
                );
            }

            const pesos = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            let soma = 0;
            for (let i = 0; i < 10; i++) {
                soma += (digitos.charCodeAt(i) - 48) * pesos[i];
            }
            const resto = soma % 11;
            const dvEsperado = (resto < 2) ? 0 : (11 - resto);
            const dvInformado = digitos.charCodeAt(10) - 48;

            if (dvEsperado !== dvInformado) {
                return formatarRespostaErro(
                    'PIS/NIT Inválido',
                    'PIS/NIT Invalido',
                    textoLimpo,
                    [
                        'Dígito verificador incorreto',
                        'Inconsistência no cálculo Módulo 11 do PIS/PASEP/NIT'
                    ]
                );
            }

            const pisFormatado = `${digitos.substring(0, 3)}.${digitos.substring(3, 8)}.${digitos.substring(8, 10)}-${digitos.substring(10, 11)}`;
            const pisExibicao = (textoLimpo.includes('.') || textoLimpo.includes('-')) ? pisFormatado : digitos;

            return formatarRespostaWiki(
                'PIS/NIT',
                'Inscrição',
                pisExibicao,
                'Cadastro PIS/PASEP/NIT\n(Previdência Social / Caixa / BB)',
                {
                    pis: digitos,
                    pisFormatado: pisFormatado
                }
            );
        }

        /*
         * MÉTODO: validarLinhaArrecadacaoTributos
         * SEÇÃO 6.60: Validação Algorítmica de Guias e Tributos Governamentais (DARF, GRU, IPTU, Concessionárias)
         * - 48 dígitos divididos em 4 blocos de 11 dígitos + 1 DV por bloco.
         * - 1º dígito é compulsoriamente '8' (Arrecadação).
         * - 2º dígito indica o segmento: 1 (IPTU/Prefeituras), 5 (DARF/GRU/Federal), etc.
         * - 3º dígito indica o módulo matemático: 6 ou 7 (Mod 10 / Luhn), 8 ou 9 (Mod 11 pesos 2..9).
         */
        validarLinhaArrecadacaoTributos(linhaStr) {
            if (!linhaStr || typeof linhaStr !== 'string') return { valido: true, msg: '' };
            const textoLimpo = linhaStr.trim();
            const digitos = textoLimpo.replace(/\D/g, '');

            if (digitos.length !== 48 || digitos[0] !== '8') {
                return { valido: true, msg: '' };
            }

            const segCodigo = digitos[1];
            const modCodigo = digitos[2];

            let nomeSegmento = 'Arrecadação / Convênios';
            if (segCodigo === '1') nomeSegmento = 'IPTU / Tributo Municipal';
            else if (segCodigo === '5') nomeSegmento = 'DARF / GRU / Tributo Federal';
            else if (segCodigo === '6' || segCodigo === '7') nomeSegmento = 'Guia / Arrecadação Governamental';
            else if (segCodigo === '2') nomeSegmento = 'Saneamento / Água';
            else if (segCodigo === '3') nomeSegmento = 'Energia Elétrica / Gás';
            else if (segCodigo === '4') nomeSegmento = 'Telecomunicações';

            const usaMod11 = (modCodigo === '8' || modCodigo === '9');
            const erros = [];

            for (let b = 0; b < 4; b++) {
                const inicioBloco = b * 12;
                const corpo = digitos.substring(inicioBloco, inicioBloco + 11);
                const dvInformado = digitos.charCodeAt(inicioBloco + 11) - 48;
                let dvEsperado;

                if (usaMod11) {
                    let soma = 0;
                    let peso = 2;
                    for (let i = 10; i >= 0; i--) {
                        soma += (corpo.charCodeAt(i) - 48) * peso;
                        peso = (peso === 9) ? 2 : peso + 1;
                    }
                    const resto = soma % 11;
                    dvEsperado = (resto === 0 || resto === 1) ? 0 : ((resto === 10) ? 1 : (11 - resto));
                } else {
                    let soma = 0;
                    let alternar = true;
                    for (let i = 10; i >= 0; i--) {
                        let d = (corpo.charCodeAt(i) - 48);
                        if (alternar) {
                            d *= 2;
                            if (d > 9) d -= 9;
                        }
                        soma += d;
                        alternar = !alternar;
                    }
                    const resto = soma % 10;
                    dvEsperado = (resto === 0) ? 0 : (10 - resto);
                }

                if (dvEsperado !== dvInformado) {
                    erros.push(`Dígito verificador do Bloco ${b + 1} incorreto`);
                }
            }

            if (erros.length > 0) {
                return formatarRespostaErro(
                    'Boleto Arrecadação/Tributo Inválido',
                    'Boleto Arrecadacao Invalido',
                    textoLimpo,
                    erros
                );
            }

            return formatarRespostaWiki(
                'Boleto Tributo/Arrecadação',
                nomeSegmento,
                textoLimpo,
                `Linha de 48 dígitos validada (Mod ${usaMod11 ? 11 : 10})\nSegmento: ${nomeSegmento}`,
                {
                    tipo: 'ARRECADACAO_FEBRABAN',
                    segmento: nomeSegmento,
                    modulo: usaMod11 ? 11 : 10
                }
            );
        }

        /*
         * MÉTODO: validarBoletoBancario
         * SEÇÃO 6.60: Validação Algorítmica de Linha Digitável de Boleto Bancário (FEBRABAN / GRU Cobrança BB)
         * - 47 dígitos divididos em 5 campos (Campos 1, 2, 3 com DVs Mod 10).
         */
        validarBoletoBancario(linhaStr) {
            if (!linhaStr || typeof linhaStr !== 'string') return { valido: true, msg: '' };
            const textoLimpo = linhaStr.trim();
            const digitos = textoLimpo.replace(/\D/g, '');

            if (digitos.length !== 47) {
                return { valido: true, msg: '' };
            }

            const ehGruCobranca = digitos.startsWith('0019');
            const rotuloDoc = ehGruCobranca ? 'GRU Cobrança (BB)' : 'Cobrança Bancária';

            const calcularDvMod10 = (blocoStr) => {
                let soma = 0;
                let alternar = true;
                for (let i = blocoStr.length - 1; i >= 0; i--) {
                    let d = blocoStr.charCodeAt(i) - 48;
                    if (alternar) {
                        d *= 2;
                        if (d > 9) d -= 9;
                    }
                    soma += d;
                    alternar = !alternar;
                }
                const resto = soma % 10;
                return (resto === 0) ? 0 : (10 - resto);
            };

            const erros = [];
            // Campo 1: 9 dígitos + DV
            const c1Corpo = digitos.substring(0, 9);
            const c1Dv = digitos.charCodeAt(9) - 48;
            if (calcularDvMod10(c1Corpo) !== c1Dv) erros.push('Dígito do Campo 1 incorreto');

            // Campo 2: 10 dígitos + DV
            const c2Corpo = digitos.substring(10, 20);
            const c2Dv = digitos.charCodeAt(20) - 48;
            if (calcularDvMod10(c2Corpo) !== c2Dv) erros.push('Dígito do Campo 2 incorreto');

            // Campo 3: 10 dígitos + DV
            const c3Corpo = digitos.substring(21, 31);
            const c3Dv = digitos.charCodeAt(31) - 48;
            if (calcularDvMod10(c3Corpo) !== c3Dv) erros.push('Dígito do Campo 3 incorreto');

            // Campo 4: Dígito Verificador Geral do Código de Barras (Módulo 11 FEBRABAN)
            const c4Dv = digitos.charCodeAt(32) - 48;
            const codigo43 = digitos.substring(0, 4) + digitos.substring(33, 47) + digitos.substring(4, 9) + digitos.substring(10, 20) + digitos.substring(21, 31);
            let somaMod11 = 0;
            let peso = 2;
            for (let i = codigo43.length - 1; i >= 0; i--) {
                somaMod11 += (codigo43.charCodeAt(i) - 48) * peso;
                peso = (peso === 9) ? 2 : peso + 1;
            }
            const restoMod11 = somaMod11 % 11;
            let dvGeralCalculado = 11 - restoMod11;
            if (restoMod11 === 0 || restoMod11 === 1 || restoMod11 === 10) {
                dvGeralCalculado = 1;
            }
            if (dvGeralCalculado !== c4Dv) erros.push('Dígito Verificador Geral (Campo 4) incorreto');

            if (erros.length > 0) {
                return formatarRespostaErro(
                    ehGruCobranca ? 'GRU Cobrança Inválida' : 'Boleto Bancário Inválido',
                    'Boleto Bancario Invalido',
                    textoLimpo,
                    erros
                );
            }

            return formatarRespostaWiki(
                'Boleto Bancário',
                rotuloDoc,
                textoLimpo,
                `Linha de 47 dígitos validada (FEBRABAN)\n${ehGruCobranca ? 'Guia de Recolhimento da União (Banco do Brasil)' : 'Cobrança Bancária Registrada'}`,
                {
                    tipo: 'BOLETO_BANCARIO_FEBRABAN',
                    ehGruCobranca: ehGruCobranca
                }
            );
        }

        /*
         * MÉTODO: validarModulo10
         * Valida dígito verificador módulo 10 (Algoritmo de Luhn) para números arbitrários com DV final.
         */
        validarModulo10(numeroComDv) {
            const digitos = String(numeroComDv || '').replace(/\D/g, '');
            if (digitos.length < 2) return false;
            let soma = 0;
            let alternar = false;
            for (let i = digitos.length - 1; i >= 0; i--) {
                let d = digitos.charCodeAt(i) - 48;
                if (alternar) {
                    d *= 2;
                    if (d > 9) d -= 9;
                }
                soma += d;
                alternar = !alternar;
            }
            return (soma % 10 === 0);
        }

        /*
         * MÉTODO: validarModulo11
         * Valida dígito verificador módulo 11 com pesos cíclicos da direita para a esquerda.
         */
        validarModulo11(numeroComDv, pesos = [2, 3, 4, 5, 6, 7, 8, 9], restoSubtrai = true) {
            const digitos = String(numeroComDv || '').replace(/\D/g, '');
            if (digitos.length < 2) return false;
            const n = digitos.length;
            let soma = 0;
            let pesoIdx = 0;
            for (let i = n - 2; i >= 0; i--) {
                const peso = pesos[pesoIdx % pesos.length];
                soma += (digitos.charCodeAt(i) - 48) * peso;
                pesoIdx++;
            }
            const resto = soma % 11;
            let dvEsperado;
            if (restoSubtrai) {
                dvEsperado = (resto < 2) ? 0 : (11 - resto);
            } else {
                dvEsperado = resto;
            }
            const dvInformado = digitos.charCodeAt(n - 1) - 48;
            return (dvEsperado === dvInformado);
        }

        /*
         * MÉTODO: validarModulo97
         * Valida os 2 dígitos verificadores módulo 97 (padrão ISO 7064 / CNJ) via BigInt.
         */
        validarModulo97(numeroComDv) {
            const digitos = String(numeroComDv || '').replace(/\D/g, '');
            if (digitos.length < 3) return false;
            try {
                const baseStr = digitos.substring(0, digitos.length - 2);
                const dvInformado = BigInt(digitos.substring(digitos.length - 2));
                const resto = (BigInt(baseStr) * 100n) % 97n;
                const dvCalculado = 98n - resto;
                return (dvCalculado === dvInformado);
            } catch (_) {
                return false;
            }
        }

        /*
         * MÉTODO: validarNumeroGenericoFallback
         * DIRETRIZ ROOT 6.42 e FEAT-03 (Última Barreira de Verificação Matemática):
         * Quando o texto é estritamente numérico (ou CNPJ alfanumérico de 14 chars) e não casou
         * com nenhuma máscara contextual específica (CPF, CNPJ, CNJ, Data, etc.), testa
         * cálculos de DV conhecidos sob rigorosos critérios anti-falso-positivo (BUG-05).
         */
        validarNumeroGenericoFallback(texto) {
            if (!texto || typeof texto !== 'string') return { valido: true, msg: '' };
            const textoLimpo = texto.trim();
            if (!textoLimpo) return { valido: true, msg: '' };

            /* Passo 1: Filtragem Rigorosa Anti-Falso-Positivo para Letras (BUG-05) */
            const contemLetras = /[a-zA-Z\u00C0-\u017F]/.test(textoLimpo);
            const limpoAlfanum = textoLimpo.toUpperCase().replace(/[^0-9A-Z]/g, '');

            if (contemLetras) {
                if (limpoAlfanum.length !== 14 || !/^\d{2}$/.test(limpoAlfanum.substring(12, 14))) {
                    return { valido: true, msg: '' };
                }

                const calcularDvCnpjAlfanum = (comprimento) => {
                    let p = 2;
                    let s = 0;
                    for (let i = comprimento - 1; i >= 0; i--) {
                        s += (limpoAlfanum.charCodeAt(i) - 48) * p;
                        p = (p === 9) ? 2 : p + 1;
                    }
                    const r = s % 11;
                    return (r < 2) ? 0 : (11 - r);
                };
                const dv1Cnpj = calcularDvCnpjAlfanum(12);
                const dv2Cnpj = calcularDvCnpjAlfanum(13);
                if (dv1Cnpj === (limpoAlfanum.charCodeAt(12) - 48) && dv2Cnpj === (limpoAlfanum.charCodeAt(13) - 48)) {
                    return formatarRespostaGenericaCinza([{
                        tipoCalculo: 'Mod11',
                        valorFormatado: textoLimpo
                    }], textoLimpo);
                }
                return { valido: true, msg: '' };
            }

            /* Passo 2: O texto sem letras deve conter estritamente dígitos e pontuações aceitas */
            if (!/^[0-9\s.\/-]+$/.test(textoLimpo)) {
                return { valido: true, msg: '' };
            }

            const digitosPuros = textoLimpo.replace(/\D/g, '');
            if (digitosPuros.length < 4 || digitosPuros.length > 30) {
                return { valido: true, msg: '' };
            }

            if (/^(\d)\1+$/.test(digitosPuros)) {
                return { valido: true, msg: '' };
            }

            const n = digitosPuros.length;
            const temHifenDvFinal = /-\d$/.test(textoLimpo);
            const temDoisDvsFinais = /-\d{2}$/.test(textoLimpo);
            const validacoesAprovadas = [];

            /* Passo 3: Módulo 11 com pesos 2 a 9 cíclicos */
            if (temHifenDvFinal || (n >= 9 && n <= 14)) {
                let soma = 0;
                let peso = 2;
                for (let i = n - 2; i >= 0; i--) {
                    soma += (digitosPuros.charCodeAt(i) - 48) * peso;
                    peso = (peso === 9) ? 2 : peso + 1;
                }
                const resto = soma % 11;
                const dvEsperado = (resto < 2) ? 0 : (11 - resto);
                const dvInformado = digitosPuros.charCodeAt(n - 1) - 48;
                if (dvEsperado === dvInformado) {
                    validacoesAprovadas.push({
                        tipoCalculo: 'Mod11',
                        valorFormatado: textoLimpo
                    });
                }
            }

            /* Passo 4: Módulo 11 NB INSS (10 dígitos exatos) */
            if (n === 10) {
                const pesosNB = [2, 3, 4, 5, 6, 7, 8, 9, 2];
                let soma = 0;
                for (let i = 0; i < 9; i++) {
                    soma += (digitosPuros.charCodeAt(8 - i) - 48) * pesosNB[i];
                }
                const resto = soma % 11;
                const dvEsperado = (resto < 2) ? 0 : (11 - resto);
                const dvInformado = digitosPuros.charCodeAt(9) - 48;
                if (dvEsperado === dvInformado && !validacoesAprovadas.some(v => v.tipoCalculo === 'Mod11')) {
                    validacoesAprovadas.push({
                        tipoCalculo: 'Mod11',
                        valorFormatado: textoLimpo
                    });
                }
            }

            /* Passo 5: Módulo 11 PIS/NIT (11 dígitos exatos) */
            if (n === 11) {
                const pesosPIS = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
                let soma = 0;
                for (let i = 0; i < 10; i++) {
                    soma += (digitosPuros.charCodeAt(i) - 48) * pesosPIS[i];
                }
                const resto = soma % 11;
                const dvEsperado = (resto < 2) ? 0 : (11 - resto);
                const dvInformado = digitosPuros.charCodeAt(10) - 48;
                if (dvEsperado === dvInformado && !validacoesAprovadas.some(v => v.tipoCalculo === 'Mod11')) {
                    validacoesAprovadas.push({
                        tipoCalculo: 'Mod11',
                        valorFormatado: textoLimpo
                    });
                }
            }

            /* Passo 6: Módulo 11 com 2 Dígitos Verificadores estilo CPF (11 dígitos) */
            if (n === 11) {
                let s1 = 0;
                for (let i = 0; i < 9; i++) s1 += (digitosPuros.charCodeAt(i) - 48) * (10 - i);
                let r1 = 11 - (s1 % 11);
                const expDv1 = (r1 >= 10) ? 0 : r1;
                if (expDv1 === (digitosPuros.charCodeAt(9) - 48)) {
                    let s2 = 0;
                    for (let i = 0; i < 10; i++) s2 += (digitosPuros.charCodeAt(i) - 48) * (11 - i);
                    let r2 = 11 - (s2 % 11);
                    const expDv2 = (r2 >= 10) ? 0 : r2;
                    if (expDv2 === (digitosPuros.charCodeAt(10) - 48) && !validacoesAprovadas.some(v => v.tipoCalculo === 'Mod11')) {
                        validacoesAprovadas.push({
                            tipoCalculo: 'Mod11',
                            valorFormatado: textoLimpo
                        });
                    }
                }
            }

            /* Passo 7: Módulo 97 (padrão CNJ de 20 dígitos e padrão final de 2 DVs com BigInt) */
            if (n === 20) {
                try {
                    const seq = digitosPuros.substring(0, 7);
                    const dvInformadoCnj = BigInt(digitosPuros.substring(7, 9));
                    const restoCnj = digitosPuros.substring(9);
                    const baseCnj = `${seq}${restoCnj}`;
                    const resto97Cnj = (BigInt(baseCnj) * 100n) % 97n;
                    const dvEsperadoCnj = 98n - resto97Cnj;
                    if (dvEsperadoCnj === dvInformadoCnj) {
                        validacoesAprovadas.push({
                            tipoCalculo: 'Mod97',
                            valorFormatado: textoLimpo
                        });
                    }
                } catch (_) {}
            } else if (temDoisDvsFinais && n >= 15 && n <= 25) {
                try {
                    const baseNum = digitosPuros.substring(0, n - 2);
                    const dvInformado = BigInt(digitosPuros.substring(n - 2));
                    const resto97 = (BigInt(baseNum) * 100n) % 97n;
                    const dvCalculado = 98n - resto97;
                    if (dvCalculado === dvInformado) {
                        validacoesAprovadas.push({
                            tipoCalculo: 'Mod97',
                            valorFormatado: textoLimpo
                        });
                    }
                } catch (_) {}
            }

            /* Passo 8: Módulo 10 (Algoritmo de Luhn - boletos, cartões, contas) */
            const aceitaMod10 = temHifenDvFinal || n === 10 || n === 11 || (n >= 13 && n <= 19);
            if (aceitaMod10) {
                let somaLuhn = 0;
                let alternar = false;
                for (let i = n - 1; i >= 0; i--) {
                    let d = digitosPuros.charCodeAt(i) - 48;
                    if (alternar) {
                        d *= 2;
                        if (d > 9) d -= 9;
                    }
                    somaLuhn += d;
                    alternar = !alternar;
                }
                if (somaLuhn % 10 === 0) {
                    validacoesAprovadas.push({
                        tipoCalculo: 'Mod10',
                        valorFormatado: textoLimpo
                    });
                }
            }

            /* Se não validou nenhum cálculo, silêncio total */
            if (validacoesAprovadas.length === 0) {
                return { valido: true, msg: '' };
            }

            return formatarRespostaGenericaCinza(validacoesAprovadas, textoLimpo);
        }
    }

    Object.freeze(JusGovVerificadores.prototype);
    return Object.freeze(JusGovVerificadores);
}));

