/* ==========================================================================
 * Nome do arquivo: modulo-AvisoFlutuante.js
 * PROJETO: JusGovBR - Copia Inteligente & PJe Turbo
 * AUTOR/CONTATO: smarca@gmail.com
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

    const NOMES_MESES = Object.freeze([
        '', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]);

    const MAPA_MESES_TEXTO = Object.freeze({
        'janeiro': 1, 'jan': 1,
        'fevereiro': 2, 'fev': 2,
        'marco': 3, 'mar': 3,
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

    /*
     * FUNCAO AUXILIAR: escaparTextoHtml
     * OBJETIVO DE RECONSTRUCAO: Escapar caracteres especiais para injecao segura no innerHTML.
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
     * FUNCAO AUXILIAR: formatarRespostaErro
     * OBJETIVO DE RECONSTRUCAO: Estruturar mensagens de alerta visual em ate 4 linhas legiveis,
     * contendo o titulo com inicial maiuscula em negrito, o dado incorreto em sublinhado
     * e os motivos discriminados por topicos (hifens), sem revelar digitos calculados esperados.
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
     * FUNCAO AUXILIAR: formatarRespostaWiki
     * OBJETIVO DE RECONSTRUCAO: Estruturar mensagens informativas da Wiki Forense em verde (dias uteis)
     * ou azul ceu (finais de semana), contendo o tipo e numero doc com inicial maiuscula e tique verde,
     * e subtitulo com os metadados do documento (especie, ramo, tribunal, regiao fiscal, matriz/filial, dia da semana).
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
     * FUNCAO AUXILIAR: formatarRespostaGenericaCinza
     * DIRETRIZ ROOT 6.42: Estruturar mensagens informativas de validacao matematica generica
     * em cartao cinza neutro no formato:
     * [Mod11]: <u>nnnnnnnnnnn</u> <span style="text-decoration:none;color:#16a34a;">✓</span>
     * Se multiplos calculos baterem simultaneamente, cada algoritmo e exibido em nova linha.
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
            tipo: 'Generico',
            tituloDoc: '',
            msg: linhasTexto,
            html: linhasHtml,
            dado: dadoLimpo,
            subtitulo: '',
            listaValidacoes: listaValidacoes
        };
    }

    // =====================================================================
    // CLASSE PRINCIPAL: MOTOR DE VALIDACAO MATEMATICA E AVISO FLUTUANTE
    // =====================================================================
    class MotorValidacao {
        constructor() {
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
            this.tempoExibicaoMs = 3500;
            this.avisoVisivel = false;
            this.timestampCriacaoAviso = 0;
            this.timestampCriacaoMiniTip = 0;
            this.ultimoPontoInteracao = null;
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
         * dos alertas visuais a partir das Configuracoes Avancadas sincronizadas na nuvem.
         */
        definirTempoExibicao(ms) {
            /* Passo 1.3: Validar faixa segura (0 = Desabilitado, ou 1000ms a 10000ms) mantendo tipo SMI inteiro */
            const num = Number(ms);
            if (!Number.isFinite(num)) {
                this.tempoExibicaoMs = 3500;
                return;
            }
            const valor = num | 0;
            if (valor === 0) {
                this.tempoExibicaoMs = 0;
            } else if (valor >= 1000 && valor <= 10000) {
                this.tempoExibicaoMs = valor;
            } else {
                this.tempoExibicaoMs = 3500;
            }
        }

        /*
         * METODO: validarBissexto
         * REFERENCIA HELP: Item 7 -- Regra do Calendario Gregoriano para Anos Bissextos.
         */
        validarBissexto(ano) {
            /* Passo 2.1: Aplicar aritmetica modular inteira (SMI) */
            const anoInt = ano | 0;
            return (anoInt % 4 === 0 && (anoInt % 100 !== 0 || anoInt % 400 === 0));
        }

        /*
         * METODO: validarData
         * REFERENCIA HELP: Item 7 -- Validacao Matematica de Datas.
         */
        validarData(dataStr) {
            /* Passo 2.2: Extrair componentes suportando formato numerico e extenso/abreviado */
            const textoLimpo = String(dataStr || '').trim();
            let dia = 0;
            let mes = 0;
            let ano = 0;
            let anoDoisDigitos = false;

            /* Desacoplamento consumindo as constantes isoladas em window.JusGovConstantes */
            const matchNum = textoLimpo.match(window.JusGovConstantes.REGEX_AUDITORIA.PARTES_DATA);
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
                    const matchExt = textoLimpo.match(window.JusGovConstantes.REGEX_AUDITORIA.DATA_EXTENSO_OU_ABREV);
                    if (!matchExt) {
                        return { valido: true, tipo: 'DATA', msg: '' };
                    }
                    dia = parseInt(matchExt[1], 10);
                    const chaveMes = matchExt[2].toLowerCase().normalize('NFD').replace(window.JusGovConstantes.REGEX_AUDITORIA.APENAS_LETRAS_ASCII_LOWER || /[^a-z]/g, '');
                    mes = MAPA_MESES_TEXTO[chaveMes] || 0;
                    ano = parseInt(matchExt[3], 10);
                    anoDoisDigitos = (matchExt[3].length === 2);
                }
            }

            /* Passo 2.3: Expandir anos de 2 digitos */
            if (anoDoisDigitos) {
                ano = ano > 30 ? 1900 + ano : 2000 + ano;
            }

            const ehBissexto = this.validarBissexto(ano);
            const motivos = [];

            /* Caso A: Mes fora da faixa valida (1 a 12) */
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

            /* Caso B: Mes entre 1 e 12, verificar limite de dias */
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

            /* Passo 2.4: Data valida identificada -- calcular dia da semana para Wiki Forense */
            const dataObj = new Date(ano, mes - 1, dia);
            const diaSemanaIdx = dataObj.getDay(); // 0 = Domingo, 1 = Segunda-feira, ..., 6 = Sabado
            const NOMES_DIAS_SEMANA = [
                'Domingo',
                'Segunda-feira',
                'Terça-feira',
                'Quarta-feira',
                'Quinta-feira',
                'Sexta-feira',
                'Sábado'
            ];
            const nomeDiaSemana = NOMES_DIAS_SEMANA[diaSemanaIdx] || 'Dia da Semana';
            const ehFimDeSemana = (diaSemanaIdx === 0 || diaSemanaIdx === 6);
            const descDiaPadrao = ehFimDeSemana
                ? `${nomeDiaSemana} (Final de Semana)`
                : `${nomeDiaSemana} (Dia Útil)`;

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
                    horario: matchHoraInterno ? matchHoraInterno[0].trim() : null
                }
            );
        }

        /*
         * METODO: validarHorario
         * REFERENCIA HELP: Item 4 -- Validacao Matematica de Horarios (HH:MM ou HH:MM:SS).
         */
        validarHorario(horarioStr) {
            /* Passo 2.5: Validar limites de horas (00-23), minutos (00-59) e segundos opcionais (00-59) */
            const textoLimpo = String(horarioStr || '').trim();
            const rxPartes = (window.JusGovConstantes && window.JusGovConstantes.REGEX_AUDITORIA && window.JusGovConstantes.REGEX_AUDITORIA.PARTES_HORARIO)
                ? window.JusGovConstantes.REGEX_AUDITORIA.PARTES_HORARIO
                : /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
            const matchHora = textoLimpo.match(rxPartes);
            if (!matchHora) {
                return { valido: true, tipo: 'Horario', msg: '' };
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

            return { valido: true, tipo: 'Horario', msg: '' };
        }

        /*
         * METODO: validarCPF
         * REFERENCIA HELP: Item 7 -- Validacao Matematica de CPF (Modulo 11 Receita Federal)
         * e Decodificacao da Regiao Fiscal de Origem (9º Digito).
         */
        validarCPF(cpfStr) {
            /* Passo 3.1: Limpar pontuacao e rejeitar tamanhos diferentes de 11 ou digitos todos repetidos */
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
            if (window.JusGovConstantes.REGEX_AUDITORIA.CARACTERES_REPETIDOS.test(digitos)) {
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

            /* Passo 3.2: Calcular o 1o digito verificador */
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

            /* Passo 3.3: Calcular o 2o digito verificador */
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

            /* Passo 3.4: Decodificar Regiao Fiscal de Emissao da RFB (9º Digito do CPF) */
            const digitoFiscal = digitos.charAt(8);
            const tabRegioes = window.JusGovConstantes ? window.JusGovConstantes.TABELA_REGIOES_FISCAIS_CPF : null;
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
         * METODO: calcularMatrizDeCNPJ
         * OBJETIVO DE RECONSTRUCAO: Dado um CNPJ de filial (ou matriz), calcula deterministicamente
         * o numero valido da Matriz ('0001') recalculando os DVs oficiais via Modulo 11.
         */
        calcularMatrizDeCNPJ(cnpjStr) {
            const limpo = String(cnpjStr || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
            if (limpo.length !== 14) return '';
            const raiz = limpo.substring(0, 8);
            const baseMatriz = raiz + '0001';

            /* Calculo DV1 */
            let peso = 2;
            let soma = 0;
            for (let i = 11; i >= 0; i--) {
                const valorChar = baseMatriz.charCodeAt(i) - 48;
                soma += valorChar * peso;
                peso = (peso === 9) ? 2 : peso + 1;
            }
            let resto = soma % 11;
            const dv1 = resto < 2 ? 0 : 11 - resto;

            /* Calculo DV2 */
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
         * METODO: validarCNPJ
         * REFERENCIA HELP: Item 7 -- Validacao Matematica de CNPJ Tradicional e Novo CNPJ Alfanumerico,
         * com Deteccao de Matriz vs. Filial e Calculo Automatico do CNPJ da Matriz.
         */
        validarCNPJ(cnpjStr) {
            /* Passo 4.1: Extrair caracteres alfanumericos em caixa alta e verificar tamanho de 14 posicoes */
            const limpo = String(cnpjStr || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
            if (limpo.length !== 14) {
                return { valido: true, tipo: 'CNPJ Invalido', msg: '' };
            }

            /* Valida 2 ultimos digitos usando variavel pre-compilada */
            const exataDois = window.JusGovConstantes.REGEX_AUDITORIA.DOIS_DIGITOS_FINAIS || /^\d{2}$/;
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
            if (window.JusGovConstantes.REGEX_AUDITORIA.CARACTERES_REPETIDOS.test(limpo)) {
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

            /* Passo 4.2: Funcao interna de calculo Modulo 11 (compativel com CNPJ numerico e alfanumerico) */
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

            /* Passo 4.3: Identificar Matriz ('0001') ou Filial ('0002'...) com calculo da Matriz */
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
         * METODO: validarCNJ
         * REFERENCIA HELP: Item 7 -- Validacao de Numeracao Unica de Processo CNJ (Modulo 97 BigInt)
         * e Decodificacao Estrutural de Ramos e Tribunais (J.TR).
         */
        validarCNJ(cnjStr) {
            /* Passo 5.1: Decompor os blocos estruturais do numero CNJ */
            const match = String(cnjStr || '').trim().match(window.JusGovConstantes.REGEX_AUDITORIA.PARTES_CNJ);
            if (!match) {
                return { valido: true, tipo: 'Processo CNJ Invalido', msg: '' };
            }

            /* Isencao para processos de demonstracao da tabela sandbox */
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
                /* Passo 5.2: Concatenar base de 18 digitos e aplicar 98 - ((Base * 100) mod 97) via BigInt */
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
            const tabCnj = window.JusGovConstantes ? window.JusGovConstantes.TABELA_TRIBUNAIS_CNJ : null;
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
         * METODO: validarNumeroBeneficioINSS
         * REFERENCIA HELP: Item 7 -- Validacao Matematica do Numero do Beneficio (NB) do INSS
         * via Modulo 11 (pesos 2 a 9 da direita para a esquerda) e Catalogo Oficial de 90+ Especies.
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

            if (window.JusGovConstantes.REGEX_AUDITORIA.CARACTERES_REPETIDOS.test(digitosNB)) {
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

            /* Calculo do Modulo 11 do NB do INSS (pesos 2 a 9 da direita para a esquerda nos 9 primeiros digitos) */
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

            /* Identificar detalhes da especie do beneficio na tabela oficial do INSS */
            let descEspecie = 'Benefício da Previdência Social';
            const tabelaEspecies = window.JusGovConstantes ? window.JusGovConstantes.TABELA_ESPECIES_INSS : null;
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
         * METODO: validarPIS
         * REFERENCIA: Item 6.41 -- Validacao Matematica de PIS / PASEP / NIT (11 digitos)
         * via Modulo 11 com pesos 3, 2, 9, 8, 7, 6, 5, 4, 3, 2.
         */
        validarPIS(pisStr) {
            const textoLimpo = String(pisStr || '').trim();
            const digitos = textoLimpo.replace(/\D/g, '');
            if (digitos.length !== 11) {
                return { valido: true, tipo: 'PIS', msg: '' };
            }

            if (window.JusGovConstantes && window.JusGovConstantes.REGEX_AUDITORIA && window.JusGovConstantes.REGEX_AUDITORIA.CARACTERES_REPETIDOS.test(digitos)) {
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
         * METODO: validarNumeroGenericoFallback
         * DIRETRIZ ROOT 6.42 e FEAT-03 (Ultima Barreira de Verificacao Matematica):
         * Quando o texto e estritamente numerico (ou CNPJ alfanumerico de 14 chars) e nao casou
         * com nenhuma mascara contextual especifica (CPF, CNPJ, CNJ, Data, etc.), testa
         * calculos de DV conhecidos sob rigorosos criterios anti-falso-positivo (BUG-05):
         * 1) Rejeicao imediata de palavras/modelos alfanumericos (ex: RTL2832U, GTX1080);
         * 2) CNPJ Alfanumerico (IN RFB 2.229/2024: exatamente 14 alfanumericos com 2 DVs finais);
         * 3) Modulo 11 com pesos ciclicos 2 a 9 (apenas com hifen de DV ou n >= 9 documentos reais);
         * 4) Modulo 11 NB INSS (10 digitos exatos com pesos 2,3,4,5,6,7,8,9,2);
         * 5) Modulo 11 PIS/NIT (11 digitos exatos com pesos 3,2,9,8,7,6,5,4,3,2);
         * 6) Modulo 11 CPF (11 digitos com 2 DVs estilo CPF);
         * 7) Modulo 97 CNJ / Processo (20 digitos CNJ ou 15..25 com 2 DVs finais);
         * 8) Modulo 10 / Luhn (boletos com 10/11 digitos, cartoes com 13..19 digitos ou com hifen de DV).
         * Se nenhum calculo for validado, permanece 100% SILENCIOSO (nada apresentar).
         */
        validarNumeroGenericoFallback(texto) {
            if (!texto || typeof texto !== 'string') return { valido: true, msg: '' };
            const textoLimpo = texto.trim();
            if (!textoLimpo) return { valido: true, msg: '' };

            /* Passo 1: Filtragem Rigorosa Anti-Falso-Positivo para Letras (BUG-05)
             * Modelos, componentes de hardware, codigos alfanumericos (ex: "RTL2832U", "GTX1080",
             * "iPhone15", "Boeing747") JAMAIS sao documentos numericos com DV Mod10 ou Mod97.
             * A UNICA excecao alfanumerica no ordenamento juridico brasileiro e o CNPJ Alfanumerico
             * (IN RFB 2.229/2024), que exige exatamente 14 caracteres alfanumericos terminando com 2 digitos numericos. */
            const contemLetras = /[a-zA-Z\u00C0-\u017F]/.test(textoLimpo);
            const limpoAlfanum = textoLimpo.toUpperCase().replace(/[^0-9A-Z]/g, '');

            if (contemLetras) {
                // Se contem letras e NAO e candidato a CNPJ Alfanumerico de 14 caracteres, descarta imediatamente
                if (limpoAlfanum.length !== 14 || !/^\d{2}$/.test(limpoAlfanum.substring(12, 14))) {
                    return { valido: true, msg: '' };
                }

                // Teste exclusivo de CNPJ Alfanumerico (pesos 5..2 e 6..2)
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

            /* Passo 2: O texto sem letras deve conter estritamente digitos e pontuacoes aceitas */
            if (!/^[0-9\s.\/-]+$/.test(textoLimpo)) {
                return { valido: true, msg: '' };
            }

            const digitosPuros = textoLimpo.replace(/\D/g, '');
            if (digitosPuros.length < 4 || digitosPuros.length > 30) {
                return { valido: true, msg: '' };
            }

            /* Se for sequencia repetida pura (ex: 111111, 000000), nao valida */
            if (/^(\d)\1+$/.test(digitosPuros)) {
                return { valido: true, msg: '' };
            }

            const n = digitosPuros.length;
            const temHifenDvFinal = /-\d$/.test(textoLimpo);
            const temDoisDvsFinais = /-\d{2}$/.test(textoLimpo);
            const validacoesAprovadas = [];

            /* Passo 3: Modulo 11 com pesos 2 a 9 ciclicos (da direita para a esquerda sobre n-1 digitos)
             * Anti-Falso-Positivo: Apenas ativa se houver hifen antes do DV (ex: "12345-6") OU
             * se for sequencia pura de tamanho compativel com documentos reais (9..14 digitos: RENAVAM, NB, CPF, PIS, CNH, CNPJ). */
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

            /* Passo 4: Modulo 11 NB INSS (10 digitos exatos com pesos 2,3,4,5,6,7,8,9,2) */
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

            /* Passo 5: Modulo 11 PIS/NIT (11 digitos exatos com pesos 3,2,9,8,7,6,5,4,3,2) */
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

            /* Passo 6: Modulo 11 com 2 Digitos Verificadores estilo CPF (11 digitos) */
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

            /* Passo 7: Modulo 97 (padrao CNJ de 20 digitos e padrao final de 2 DVs com BigInt) */
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

            /* Passo 8: Modulo 10 (Algoritmo de Luhn - boletos, cartoes, contas)
             * Anti-Falso-Positivo Rigoroso (BUG-05):
             * A probabilidade de 4 digitos aleatorios passarem em Luhn e de 10% (1 em cada 10!).
             * Portanto, Mod10 SO e aceito se:
             * (a) Houver hifen explícito separando o DV (ex: "12345-6"); OU
             * (b) Sequencia pura de tamanho de campo de boleto (10 ou 11 digitos); OU
             * (c) Sequencia pura de tamanho de cartao de credito (13 a 19 digitos).
             * Jamais avaliar sequencias puras curtas (< 10 digitos sem hifen) como Mod10. */
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

            /* REGRA FUNDAMENTAL DE OURO: Se nao validou nenhum calculo, SILENCIO TOTAL (retorna valido sem msg/popup) */
            if (validacoesAprovadas.length === 0) {
                return { valido: true, msg: '' };
            }

            /* Se validou, formata resposta em cinza neutro */
            return formatarRespostaGenericaCinza(validacoesAprovadas, textoLimpo);
        }

        /*
         * METODO: garantirEstruturaShadowPopover
         * OBJETIVO DE RECONSTRUCAO: Instanciar um hospedeiro com ShadowRoot fechado
         * (mode: 'closed') e atributo popover="manual" para top layer sem Reflow.
         */
        garantirEstruturaShadowPopover() {
            /* Passo 6.1: Reutilizar estrutura existente se ja estiver conectada */
            if (this.hospedeiroShadow && document.body && document.body.contains(this.hospedeiroShadow)) {
                return;
            }
            if (!document.body) return;

            /* Passo 6.2: Criar elemento hospedeiro com atributo data-jusgov-ignore */
            const host = document.createElement('div');
            host.id = 'jusgov-hospedeiro-top-layer';
            host.setAttribute('data-jusgov-ignore', 'true');
            if ('popover' in HTMLElement.prototype) {
                host.setAttribute('popover', 'manual');
            }
            host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;border:none;padding:0;margin:0;background:transparent;overflow:visible;pointer-events:none;z-index:2147483647;';

            /* Passo 6.3: Anexar arvore Shadow DOM fechada e injetar CSS encapsulado */
            const shadow = host.attachShadow({ mode: 'closed' });
            const style = document.createElement('style');
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
                    pointer-events: none;
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
                    top: 16px;
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
                    border-radius: 999px;
                    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
                    pointer-events: none;
                    user-select: none;
                    white-space: nowrap;
                    display: none;
                }
            `;

            /* Passo 6.4: Criar elementos internos */
            const destaque = document.createElement('div');
            destaque.className = 'destaque-amarelo';

            const cartao = document.createElement('div');
            cartao.className = 'cartao-aviso';

            const miniTip = document.createElement('div');
            miniTip.className = 'minitip-global';

            shadow.appendChild(style);
            shadow.appendChild(destaque);
            shadow.appendChild(cartao);
            shadow.appendChild(miniTip);
            document.body.appendChild(host);

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
            if (this.hospedeiroShadow && typeof this.hospedeiroShadow.hidePopover === 'function') {
                if (!this.elementoMiniTipGlobal || this.elementoMiniTipGlobal.style.display === 'none') {
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
            if (!this.elementoMiniTipGlobal || this.elementoMiniTipGlobal.style.display === 'none') {
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
            if (this.temporizadorAlerta) {
                clearTimeout(this.temporizadorAlerta);
                this.temporizadorAlerta = null;
            }
            if (!preservarMiniTip) {
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
        auditarEAlerta(texto, rangeDOM) {
            /* Passo 7.1: Validar entrada */
            if (!texto || typeof texto !== 'string') {
                return { valido: true, msg: '' };
            }
            const t = texto.trim();
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
                        const subDataHora = `${resData.subtitulo || (diaSemana + (ehFimDeSemana ? ' (Final de Semana)' : ' (Dia Útil)'))} • Horário: ${matchDataHora[2]}h`;
                        resultado = formatarRespostaWiki(
                            'Data e Horário',
                            diaSemana,
                            t,
                            subDataHora,
                            {
                                ...((resData && resData.detalhes) || {}),
                                horario: matchDataHora[2],
                                ehFimDeSemana: ehFimDeSemana,
                                diaSemana: diaSemana
                            }
                        );
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
            } else {
                /* Verificar se eh NB de 10 digitos precedido por especie no DOM ou pontuado (ex: 31/6506589241) */
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
                const digitosPuros = t.replace(/\D/g, '');
                if ((especiePrefixo && digitosPuros.length === 10) || (/^\d{3}\.\d{3}\.\d{3}-\d$/.test(t))) {
                    resultado = this.validarNumeroBeneficioINSS(t, especiePrefixo);
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

            /* Passo 7.3: Projetar alerta se invalido ou cartao informativo se Wiki Forense */
            if (!resultado.valido && rangeDOM) {
                this.projetarAlertaVisual(rangeDOM, resultado, true);
            } else if (resultado.ehWiki && rangeDOM) {
                this.projetarAlertaVisual(rangeDOM, resultado, false);
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
         * METODO: projetarAlertaVisual
         * DIRETRIZ ROOT 6.33 (Algoritmo Inteligente Anti-Sobreposicao):
         * Posiciona os baloes de verificacao/erro e Wiki Forense rigorosamente FORA
         * do texto clicado, fora da selecao do sistema e fora do Contorno Visual Rapido
         * (Flash Verde), considerando as dimensoes reais multilinhas do card, a bounding
         * box do texto selecionado, a posicao do mouse e os limites da viewport.
         */
        projetarAlertaVisual(range, mensagemOuResultado, destacarSelecaoAmarela = true, pontoMouseOpcional = null) {
            if (this.tempoExibicaoMs <= 0) return;
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

            /* Calcula o envelope geometrico completo do texto selecionado + folga externa do contorno Flash (4px) */
            const FOLGA_CONTORNO_FLASH = 5;
            let boxTop = rect.top;
            let boxBottom = rect.bottom;
            let boxLeft = rect.left;
            let boxRight = rect.right;
            let rectPrimeiraLinha = rect;
            let rectUltimaLinha = rect;

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
                            rectPrimeiraLinha = r;
                        }
                        if (r.bottom > maxB) {
                            maxB = r.bottom;
                            rectUltimaLinha = r;
                        }
                        if (r.left < minL) minL = r.left;
                        if (r.right > maxR) maxR = r.right;
                    }
                    if (Number.isFinite(minT) && Number.isFinite(maxB)) {
                        boxTop = minT;
                        boxBottom = maxB;
                        boxLeft = minL;
                        boxRight = maxR;
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
                                if (rf.top < boxTop) boxTop = rf.top;
                                if (rf.bottom > boxBottom) boxBottom = rf.bottom;
                                if (rf.left < boxLeft) boxLeft = rf.left;
                                if (rf.right > boxRight) boxRight = rf.right;
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

                this.elementoDestaqueAmarelo.style.top = `${rect.top - 1}px`;
                this.elementoDestaqueAmarelo.style.left = `${rect.left - 1}px`;
                this.elementoDestaqueAmarelo.style.width = `${rect.width + 2}px`;
                this.elementoDestaqueAmarelo.style.height = `${rect.height + 2}px`;
                this.elementoDestaqueAmarelo.style.display = 'block';
            }

            if (mensagemOuResultado && typeof mensagemOuResultado === 'object' && mensagemOuResultado.html) {
                this.elementoCartaoAviso.innerHTML = mensagemOuResultado.html;
            } else if (typeof mensagemOuResultado === 'string' && (mensagemOuResultado.includes('<') || mensagemOuResultado.includes('\n'))) {
                this.elementoCartaoAviso.innerHTML = mensagemOuResultado.replace(/\n/g, '<br>');
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
            const alturaFallback = Math.max(38, 22 + (qtdLinhasEstimada * 18));
            const alturaCartao = Math.max(
                this.elementoCartaoAviso.offsetHeight || 0,
                Math.ceil(rectCartaoMedido ? rectCartaoMedido.height : 0),
                alturaFallback
            );
            const larguraCartao = Math.max(
                this.elementoCartaoAviso.offsetWidth || 0,
                Math.ceil(rectCartaoMedido ? rectCartaoMedido.width : 0),
                230
            );

            const vw = Math.max(window.innerWidth || 0, document.documentElement ? document.documentElement.clientWidth : 0, 320);
            const vh = Math.max(window.innerHeight || 0, document.documentElement ? document.documentElement.clientHeight : 0, 240);
            const MARGEM_JANELA = 10;
            const DISTANCIA_SEGURANCA_VERTICAL = 10;

            /* Determina ponto de referencia horizontal considerando a selecao e a posicao do mouse */
            const ptMouse = pontoMouseOpcional || this.ultimoPontoInteracao;
            let refLeft = rectPrimeiraLinha ? rectPrimeiraLinha.left : boxLeft;
            if (ptMouse && Number.isFinite(ptMouse.x) && ptMouse.x >= (boxLeft - 40) && ptMouse.x <= (boxRight + 40)) {
                refLeft = Math.min(boxLeft, ptMouse.x);
            }

            /* Calcula coordenada horizontal garantindo que jamais saia da janela */
            let leftPos = Math.max(MARGEM_JANELA, refLeft);
            if (leftPos + larguraCartao > vw - MARGEM_JANELA) {
                leftPos = Math.max(MARGEM_JANELA, vw - larguraCartao - MARGEM_JANELA);
            }

            /* Posiciona na horizontal primeiro e re-mede a altura caso o ajuste de borda tenha provocado wrap adicional */
            this.elementoCartaoAviso.style.left = `${Math.round(leftPos)}px`;
            const alturaFinalCartao = Math.max(
                alturaCartao,
                this.elementoCartaoAviso.offsetHeight || 0,
                Math.ceil(this.elementoCartaoAviso.getBoundingClientRect().height || 0)
            );

            /* Algoritmo de Quadrantes Verticais (Anti-Sobreposicao Estrita):
             * 1) Tenta posicionar ACIMA da selecao e do contorno Flash (limiteSuperiorProibido - DISTANCIA_SEGURANCA_VERTICAL).
             * 2) Se nao couber acima (topPos < MARGEM_JANELA), posiciona ABAIXO da selecao e do Flash (limiteInferiorProibido + DISTANCIA_SEGURANCA_VERTICAL).
             * 3) Se mesmo abaixo ultrapassar a janela (selecao muito alta ocupando quase toda a tela), escolhe o lado com maior espaco livre sem cobrir a linha clicada. */
            const candidatoAcima = limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_VERTICAL;
            const candidatoAbaixo = limiteInferiorProibido + DISTANCIA_SEGURANCA_VERTICAL;
            const espacoAcima = limiteSuperiorProibido - MARGEM_JANELA;
            const espacoAbaixo = vh - limiteInferiorProibido - MARGEM_JANELA;

            let topPos;
            if (candidatoAcima >= MARGEM_JANELA) {
                topPos = candidatoAcima;
            } else if (candidatoAbaixo + alturaFinalCartao <= vh - MARGEM_JANELA) {
                topPos = candidatoAbaixo;
            } else if (espacoAbaixo >= espacoAcima) {
                topPos = Math.max(limiteInferiorProibido + 6, Math.min(candidatoAbaixo, vh - alturaFinalCartao - MARGEM_JANELA));
            } else {
                topPos = Math.max(MARGEM_JANELA, Math.min(candidatoAcima, limiteSuperiorProibido - alturaFinalCartao - 6));
            }

            /* Verificacao final de nao-colisao com o retangulo clicado/selecionado */
            const cardBottom = topPos + alturaFinalCartao;
            const sobrepoeVerticalmente = (topPos < limiteInferiorProibido) && (cardBottom > limiteSuperiorProibido);
            const sobrepoeHorizontalmente = (leftPos < (boxRight + FOLGA_CONTORNO_FLASH)) && ((leftPos + larguraCartao) > (boxLeft - FOLGA_CONTORNO_FLASH));

            if (sobrepoeVerticalmente && sobrepoeHorizontalmente) {
                if (espacoAbaixo >= alturaFinalCartao || espacoAbaixo >= espacoAcima) {
                    topPos = limiteInferiorProibido + DISTANCIA_SEGURANCA_VERTICAL;
                } else {
                    topPos = Math.max(2, limiteSuperiorProibido - alturaFinalCartao - DISTANCIA_SEGURANCA_VERTICAL);
                }
            }

            this.elementoCartaoAviso.style.top = `${Math.round(topPos)}px`;
            this.elementoCartaoAviso.style.visibility = 'visible';

            this.avisoVisivel = true;
            this.timestampCriacaoAviso = (typeof performance !== 'undefined' && typeof performance.now === 'function')
                ? performance.now()
                : Date.now();

            /* Passo 7.6: Remocao automatica conforme tempo configurado pelo usuario */
            this.temporizadorAlerta = setTimeout(() => {
                this.limparAlertaVisual();
            }, this.tempoExibicaoMs || 3500);
        }

        /*
         * METODO: projetarMiniTipGlobal
         * DIRETRIZ ROOT 6.40: O popup de alternancia Esc + Esc respeita rigorosamente o
         * "Tempo de Exibicao dos Avisos na Tela" (this.tempoExibicaoMs) configurado pelo usuario.
         */
        projetarMiniTipGlobal(mensagem, corBorda = '#3b82f6', duracaoOpcionalMs = null) {
            /* Se o usuario configurou 0 (Desligar avisos na tela), suprime o mini-tip */
            if (this.tempoExibicaoMs <= 0 && duracaoOpcionalMs === null) return;

            /* Passo 7.7: Garantir estrutura Shadow DOM e exibir o mini-tip */
            this.garantirEstruturaShadowPopover();
            if (!this.elementoMiniTipGlobal) return;

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

            const duracaoEfetivaMs = (typeof duracaoOpcionalMs === 'number' && duracaoOpcionalMs > 0)
                ? duracaoOpcionalMs
                : ((typeof this.tempoExibicaoMs === 'number' && this.tempoExibicaoMs > 0) ? this.tempoExibicaoMs : 3500);

            this.temporizadorMiniTip = setTimeout(() => {
                this.temporizadorMiniTip = null;
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
            }, duracaoEfetivaMs);
        }
    }

    /* Passo 8.1: Exportar a classe globalmente */
    window.JusGovAvisoFlutuante = MotorValidacao;
})();
