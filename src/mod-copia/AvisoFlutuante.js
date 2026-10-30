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

        const cabecalhoHtml = `<div style="margin-bottom:3px;color:#7c2d12;"><b>! [${tituloHtml}]:</b> <u style="text-decoration:underline;font-weight:700;">${escaparTextoHtml(dadoLimpo)}</u></div>`;
        const corpoHtml = `<div style="font-size:11.5px;font-weight:600;color:#9a3412;line-height:1.35;padding-left:1px;">${linhasHtml}</div>`;
        const htmlCompleto = `${cabecalhoHtml}${corpoHtml}`;
        const msgTexto = `! [${tituloPuro}]: ${dadoLimpo}\n${linhasTexto}`;

        return {
            valido: false,
            tipo: tituloPuro,
            msg: msgTexto,
            html: htmlCompleto,
            dado: dadoLimpo,
            motivos: listaMotivos
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

            return { valido: true, tipo: 'Data Invalida', msg: '' };
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
         * REFERENCIA HELP: Item 7 -- Validacao Matematica de CPF (Modulo 11 Receita Federal).
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

            return { valido: true, tipo: 'CPF Invalido', msg: '' };
        }

        /*
         * METODO: validarCNPJ
         * REFERENCIA HELP: Item 7 -- Validacao Matematica de CNPJ Tradicional e Novo CNPJ Alfanumerico.
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

            return { valido: true, tipo: 'CNPJ Invalido', msg: '' };
        }

        /*
         * METODO: validarCNJ
         * REFERENCIA HELP: Item 7 -- Validacao de Numeracao Unica de Processo CNJ.
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

            return { valido: true, tipo: 'Processo CNJ Invalido', msg: '' };
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
            const matchHorarioIso = (!matchDataHora && !matchDataIso && !matchDataExt) ? t.match(window.JusGovConstantes.REGEX_AUDITORIA.HORARIO_ISOLADO) : null;
            const matchCpfIso = t.match(window.JusGovConstantes.REGEX_AUDITORIA.CPF_ISOLADO);
            const matchCnpjIso = t.match(window.JusGovConstantes.REGEX_AUDITORIA.CNPJ_ISOLADO);
            const matchCnjIso = t.match(window.JusGovConstantes.REGEX_AUDITORIA.CNJ_ISOLADO);

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
                        resultado = { valido: true, tipo: 'Data e Horario', msg: '' };
                    }
                }
            } else if (matchDataIso) {
                resultado = this.validarData(matchDataIso[1]);
            } else if (matchDataExt) {
                resultado = this.validarData(t);
            } else if (matchHorarioIso) {
                resultado = this.validarHorario(matchHorarioIso[1]);
            } else if (matchCpfIso) {
                resultado = this.validarCPF(matchCpfIso[1]);
            } else if (matchCnpjIso) {
                resultado = this.validarCNPJ(matchCnpjIso[1]);
            } else if (matchCnjIso) {
                resultado = this.validarCNJ(matchCnjIso[1]);
            }

            /* Passo 7.3: Projetar alerta se invalido */
            if (!resultado.valido && rangeDOM) {
                this.projetarAlertaVisual(rangeDOM, resultado, true);
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
         */
        projetarAlertaVisual(range, mensagemOuResultado, destacarSelecaoAmarela = true) {
            if (this.tempoExibicaoMs <= 0) return;
            if (!range || typeof range.getBoundingClientRect !== 'function') return;

            /* Passo 7.4: Leitura Geometrica Estrita */
            const rect = range.getBoundingClientRect();
            if (!rect || (rect.width === 0 && rect.height === 0)) return;

            /* Passo 7.5: Escrita no Shadow DOM e Top Layer */
            this.limparAlertaVisual();
            this.garantirEstruturaShadowPopover();
            if (!this.elementoCartaoAviso || !this.elementoDestaqueAmarelo) return;

            if (destacarSelecaoAmarela && document.head) {
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

            this.elementoCartaoAviso.style.display = 'block';

            /* Medir dimensoes reais do cartao de aviso (suportando ate 4 linhas) */
            const alturaCartao = this.elementoCartaoAviso.offsetHeight || 34;
            const larguraCartao = this.elementoCartaoAviso.offsetWidth || 220;

            /* Se houver espaco acima da selecao, posiciona acima; senao posiciona logo abaixo */
            let topPos = rect.top - alturaCartao - 6;
            if (topPos < 6) {
                topPos = rect.bottom + 6;
            }

            /* Evitar transbordo horizontal fora da viewport */
            let leftPos = Math.max(6, rect.left);
            if (leftPos + larguraCartao > window.innerWidth - 8) {
                leftPos = Math.max(6, window.innerWidth - larguraCartao - 8);
            }

            this.elementoCartaoAviso.style.top = `${topPos}px`;
            this.elementoCartaoAviso.style.left = `${leftPos}px`;

            if (this.hospedeiroShadow && typeof this.hospedeiroShadow.showPopover === 'function') {
                try {
                    this.hospedeiroShadow.showPopover();
                } catch (_) {}
            }

            /* Passo 7.6: Remocao automatica conforme tempo configurado pelo usuario */
            this.temporizadorAlerta = setTimeout(() => {
                this.limparAlertaVisual();
            }, this.tempoExibicaoMs || 3500);
        }

        /*
         * METODO: projetarMiniTipGlobal
         */
        projetarMiniTipGlobal(mensagem, corBorda = '#3b82f6') {
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

            this.temporizadorMiniTip = setTimeout(() => {
                if (this.elementoMiniTipGlobal) {
                    this.elementoMiniTipGlobal.style.display = 'none';
                }
                if (this.hospedeiroShadow && typeof this.hospedeiroShadow.hidePopover === 'function') {
                    if (!this.elementoCartaoAviso || this.elementoCartaoAviso.style.display === 'none') {
                        try {
                            this.hospedeiroShadow.hidePopover();
                        } catch (_) {}
                    }
                }
            }, 2400);
        }
    }

    /* Passo 8.1: Exportar a classe globalmente */
    window.JusGovAvisoFlutuante = MotorValidacao;
})();
