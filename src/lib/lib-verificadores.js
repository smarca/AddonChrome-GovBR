/* ==========================================================================
 * ARQUIVO: src/lib/lib-verificadores.js
 * PROJETO: JusGovBR - Seleção/Cópia Inteligente
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * BIBLIOTECA: JusGovBR Libs - Biblioteca Matemática de Verificação de Documentos e Datas
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

            const dataPadronizada = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${String(ano).padStart(4, '0')}`;
            const valorWikiPadronizado = matchHoraInterno
                ? `${dataPadronizada} ${String(matchHoraInterno[1]).padStart(2, '0')}:${matchHoraInterno[2]}${matchHoraInterno[3] ? ':' + matchHoraInterno[3] : ''}`
                : dataPadronizada;

            return formatarRespostaWiki(
                tipoFinal,
                nomeDiaSemana,
                valorWikiPadronizado,
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

    }

        const _ext_JusGovVerificadores = [
        { g: 'JusGovLibVerificadoresDocs', p: './lib-verificadores-docs.js' },
        { g: 'JusGovLibVerificadoresBoletos', p: './lib-verificadores-boletos.js' }
    ];
    for (let i = 0; i < _ext_JusGovVerificadores.length; i++) {
        const it = _ext_JusGovVerificadores[i];
        const Cls = (typeof self !== 'undefined' && typeof self[it.g] === 'function')
            ? self[it.g]
            : ((typeof require === 'function') ? (() => { try { return require(it.p); } catch (_) { return null; } })() : null);
        if (Cls && typeof Cls.instalarEm === 'function') {
            Cls.instalarEm(JusGovVerificadores.prototype);
        }
    }

    Object.freeze(JusGovVerificadores.prototype);
    return Object.freeze(JusGovVerificadores);
}));


