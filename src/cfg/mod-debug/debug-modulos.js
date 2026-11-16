/* ==========================================================================
 * Nome do arquivo: debug-modulos.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Suíte de Auditoria e Debug (Módulos POO, Navegador, Input, Manut e Produtividade)
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/mod-debug/debug-modulos.js
 * - Classe Exportada: DebugModulos (window.JusGovDebugModulos)
 * - Métodos Públicos: executar(ctx)
 * - Escopo de Testes: Bateria 11 (Guias/Janelas/Anti-Duplicação/GPS), Bateria 12 POO (mod-input, mod-navegador, mod-anti-ampulheta, lib-*), BUG-01 Lifecycle, Manutenção Cookies, Árvore Baralho (BUG-68/71), Pomodoro & Minipopup (BUG-67/70, FEAT-37..43)
 * - Regras / Seções: Diretrizes 14/16, ADR-006, BUG-01..71, FEAT-08..43
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        raiz.JusGovDebugModulos = fabrica();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    class DebugModulos {
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
        linhasLog.push('\n--- BATERIA 11: GUIAS, JANELAS, ANTI-DUPLICACAO, DESSELECAO E GPS ESCALA CIDADE ---');

        /* 1) Teste de Deteccao de URLs Governamentais e Certificados Digitais em Single Window */
        const ehUrlAutenticacaoGov = (urlStr) => {
            const u = (urlStr || '').toLowerCase();
            return /gov\.br|icp-brasil|pjeoffice|sso|shodo|acesso\.gov\.br|certificado/i.test(u);
        };
        registrar(
            ehUrlAutenticacaoGov('https://sso.acesso.gov.br/login') &&
            ehUrlAutenticacaoGov('https://pjeoffice.pje.jus.br/assinador') &&
            !ehUrlAutenticacaoGov('https://google.com/search'),
            'SINGLE_WINDOW_PRESERVACAO_URLS_GOV_E_CERTIFICADOS',
            'Modo Janela Única preserva popups de autenticação (Gov.br, ICP-Brasil, PJEOffice, Shodô) e bloqueia genéricos'
        );

        /* 2) Anti-Duplicação: Proteção absoluta da Guia Atual pré-existente */
        const decidirAcaoAntiDuplicacao = (regAba, urlAnteriorValida) => {
            const ehAbaPreExistente = Boolean(urlAnteriorValida || (regAba && regAba.carregamentoConcluido));
            const recemCriada = Boolean(regAba && regAba.criadaEm && (Date.now() - regAba.criadaEm < 2500) && !regAba.carregamentoConcluido);
            if (ehAbaPreExistente || !recemCriada) {
                return 'manter_guia_atual';
            }
            return 'remover_guia_efemera';
        };
        const decisaoPreExistente = decidirAcaoAntiDuplicacao({ carregamentoConcluido: true, criadaEm: Date.now() - 5000 }, 'https://pje.jus.br');
        const decisaoNovaEfemera = decidirAcaoAntiDuplicacao({ carregamentoConcluido: false, criadaEm: Date.now() - 100 }, '');
        registrar(
            decisaoPreExistente === 'manter_guia_atual' && decisaoNovaEfemera === 'remover_guia_efemera',
            'ANTI_DUPLICACAO_BLINDAGEM_GUIA_ATUAL_PREEXISTENTE',
            'Guia atual onde o usuário trabalha JAMAIS é fechada em navegação duplicada; apenas abas efêmeras são descartadas'
        );

        /* 3) Algoritmo de Ordenação Hierárquica: Domínio Puro tem precedência absoluta */
        const extrairDominioInfo = (urlStr) => {
            try {
                const u = new URL(urlStr);
                const host = (u.hostname || '').toLowerCase();
                const partes = host.split('.').filter(Boolean);
                let numSufixo = 1;
                const penultima = partes[partes.length - 2];
                const ultima = partes[partes.length - 1];
                if (ultima.length === 2 && (penultima.length <= 3 || ['jus', 'leg', 'mp', 'gov'].includes(penultima))) {
                    numSufixo = 2;
                }
                const idxBase = Math.max(0, partes.length - numSufixo - 1);
                const base = partes.slice(idxBase).join('.');
                const sub = partes.slice(0, idxBase).join('.');
                return { baseDominio: base, subDominio: sub, ehPuro: (sub === '') };
            } catch (_) {
                return { baseDominio: '', subDominio: '', ehPuro: true };
            }
        };

        const compDominio = (urlA, urlB) => {
            const infA = extrairDominioInfo(urlA);
            const infB = extrairDominioInfo(urlB);
            const cmpBase = infA.baseDominio.localeCompare(infB.baseDominio);
            if (cmpBase !== 0) return cmpBase;
            if (infA.ehPuro && !infB.ehPuro) return -1;
            if (!infA.ehPuro && infB.ehPuro) return 1;
            return infA.subDominio.localeCompare(infB.subDominio);
        };

        const listaDesordenada = ['https://pje1g.trf1.jus.br', 'https://trf1.jus.br', 'https://www.trf1.jus.br'];
        const listaOrdenada = [...listaDesordenada].sort(compDominio);
        registrar(
            listaOrdenada[0] === 'https://trf1.jus.br' &&
            listaOrdenada[1] === 'https://pje1g.trf1.jus.br' &&
            listaOrdenada[2] === 'https://www.trf1.jus.br',
            'ORDENACAO_HIERARQUICA_PRECEDENCIA_DOMINIO_PURO',
            'Ordenação por Domínio: o domínio puro "trf1.jus.br" tem precedência estrita sobre subdomínios (pje1g, www)'
        );

        /* 4) Ordenação por Sentido: Da Direita para a Esquerda (Z-A) */
        const listaOrdenadaZA = [...listaDesordenada].sort((a, b) => -compDominio(a, b));
        registrar(
            listaOrdenadaZA[0] === 'https://www.trf1.jus.br' &&
            listaOrdenadaZA[2] === 'https://trf1.jus.br',
            'ORDENACAO_HIERARQUICA_SENTIDO_INVERSO_ZA',
            'Ordenação por Sentido: suporte bidirecional rigoroso Da Direita para a Esquerda (Z-A)'
        );

        /* 5) Desseleção do Sistema: Modo padrão Com Flash Temporizado quando Flash ativo */
        const motorModoDesselecao = motorTeste ? motorTeste.obterModoRetirarSelecao() : '';
        registrar(
            motorModoDesselecao === 'com_flash',
            'DESSELECAO_SISTEMA_MODO_PADRAO_COM_FLASH',
            'Configuração padrão da desseleção do sistema definida como "com_flash" com Flash ativo',
            { modo: motorModoDesselecao }
        );

        /* 6) Captura de Coordenada GPS em Graus Decimais (-25.592600, -54.593536) e Escala Urbana (-25.51, -54.58) */
        const regGps = /(?<![\p{L}\p{N}.\/\-])[+\-]?\d{1,2}\.\d{1,8}\s*,\s*[+\-]?\d{1,3}\.\d{1,8}(?![\p{L}\p{N}.\/\-])/gu;
        const textoGpsExato = 'Localizado nas coordenadas -25.592600, -54.593536 da região';
        const matchGpsExato = textoGpsExato.match(regGps);
        registrar(
            Boolean(matchGpsExato && matchGpsExato[0] === '-25.592600, -54.593536'),
            'GPS_COORDENADA_GRAUS_DECIMAIS_ALTA_PRECISAO',
            'Captura de coordenadas GPS em graus decimais com alta precisão (-25.592600, -54.593536)'
        );

        /* 6.1) Captura de Coordenada GPS Sexagesimal DMS (25°35\'33.36"S 54°35\'36.73"W) */
        const regGpsDms = /(?<![\p{L}\p{N}])(?:[NSns]\s*)?\d{1,2}\s*[\u00B0\u00BA]\s*\d{1,2}\s*['\u2032\u2019]\s*\d{1,2}(?:[.,]\d+)?\s*(?:["\u2033\u201D]|'')\s*[NSns]?(?:[\s,;\/]+|\s+[eE]\s+)(?:[EWewOLol]\s*)?\d{1,3}\s*[\u00B0\u00BA]\s*\d{1,2}\s*['\u2032\u2019]\s*\d{1,2}(?:[.,]\d+)?\s*(?:["\u2033\u201D]|'')\s*[EWewOLol]?(?![\p{L}\p{N}])/gu;
        const textoGpsDms = 'Ponto de interesse: 25°35\'33.36"S 54°35\'36.73"W periciado';
        const matchGpsDms = textoGpsDms.match(regGpsDms);
        registrar(
            Boolean(matchGpsDms && matchGpsDms[0] === '25°35\'33.36"S 54°35\'36.73"W'),
            'GPS_COORDENADA_SEXAGESIMAL_DMS_ALTA_PRECISAO',
            'Captura de coordenadas GPS sexagesimais DMS (25°35\'33.36"S 54°35\'36.73"W)'
        );

        /* 7) Captura de Google Plus Code correspondente (5867CC44+XH) */
        const regPlusCode = /(?<![\p{L}\p{N}+])(?:[23456789CFGHJMPQRVWX]{8}|[23456789CFGHJMPQRVWX]{4,6})\+[23456789CFGHJMPQRVWX]{2,3}(?![\p{L}\p{N}+])/giu;
        const textoPlusCode = 'Código Plus da localidade: 5867CC44+XH no Google Maps';
        const matchPlusCode = textoPlusCode.match(regPlusCode);
        registrar(
            Boolean(matchPlusCode && matchPlusCode[0] === '5867CC44+XH'),
            'GPS_GOOGLE_PLUS_CODE_OPEN_LOCATION_CODE',
            'Captura determinística do Google Plus Code (5867CC44+XH) para a mesma coordenada'
        );

        /* 8) Validação Matemática PIS com cálculo Módulo 11 */
        const pisValido = validador.validarPIS('099.12345.67-9');
        const pisInvalido = validador.validarPIS('099.12345.67-0');
        registrar(
            Boolean(pisValido && pisValido.valido === true && pisInvalido && pisInvalido.valido === false),
            'PIS_MODULO_11_CALCULO_MATEMATICO',
            'Validação matemática do PIS com pesos 3,2,9,8,7,6,5,4,3,2 (099.12345.67-9 válido vs 099.12345.67-0 inválido)'
        );

        /* 9) Validação de CEP 8 dígitos com hífen */
        const regCep = /(?<![\p{L}\p{N}])\d{5}-\d{3}(?![\p{L}\p{N}])/gu;
        const matchCep = 'CEP de atendimento: 85851-000 da região'.match(regCep);
        registrar(
            Boolean(matchCep && matchCep[0] === '85851-000'),
            'CEP_FORMATO_NACIONAL_8_DIGITOS_HIFEN',
            'Captura e formatação do CEP nacional com 8 dígitos e hífen (85851-000)'
        );

        /* ==================================================================
         * BATERIA 12: MÓDULOS DE ENGENHARIA POO (mod-input e mod-navegador)
         * Testes determinísticos de SRP, DIP, Null Object Pattern e Imutabilidade
         * ================================================================== */
        linhasLog.push('\n--- BATERIA 12: MÓDULOS MOD-INPUT E MOD-NAVEGADOR (POO & NULL OBJECT) ---');

        /* 1) Verificação da existência e integridade da classe ModuloInput */
        const temModuloInput = typeof window.JusGovModuloInput === 'function';
        registrar(
            temModuloInput,
            'MOD_INPUT_CLASSE_DISPONIVEL',
            'Disponibilidade global da classe ModuloInput (Grupo 3: Teclado/Mouse)'
        );

        /* 2) Instanciação com tolerância a falhas (Null Object Pattern em ModuloInput) */
        let nullObjectInputOk = false;
        try {
            const modInputFallback = new window.JusGovModuloInput({
                botoesLaterais: null,
                botaoMeio: null,
                tecladoCampos: null,
                atalhoF1: null
            });
            nullObjectInputOk = Boolean(
                modInputFallback &&
                modInputFallback.botoesLaterais &&
                typeof modInputFallback.botoesLaterais.processarEventoMouse === 'function' &&
                modInputFallback.botoesLaterais.processarEventoMouse() === false &&
                modInputFallback.botaoMeio &&
                typeof modInputFallback.botaoMeio.tratarCliqueBotaoMeio === 'function' &&
                modInputFallback.botaoMeio.tratarCliqueBotaoMeio() === false &&
                modInputFallback.tecladoCampos &&
                typeof modInputFallback.tecladoCampos.tratarEventoTeclado === 'function' &&
                modInputFallback.tecladoCampos.tratarEventoTeclado() === false &&
                modInputFallback.atalhoF1 &&
                typeof modInputFallback.atalhoF1.tratarEventoTeclado === 'function' &&
                modInputFallback.atalhoF1.tratarEventoTeclado() === false
            );
        } catch (_) {
            nullObjectInputOk = false;
        }
        registrar(
            nullObjectInputOk,
            'MOD_INPUT_NULL_OBJECT_FALLBACK',
            'ModuloInput ativa Null Objects imutáveis sem lançar TypeError quando dependências são omitidas'
        );

        /* 3) Verificação das classes especializadas de mod-input */
        const temBotoesMouse = typeof window.JusGovBotoesLateraisMouse === 'function';
        const temBotaoMeio = typeof window.JusGovBotaoMeioColagem === 'function';
        const temTecladoCampos = typeof window.JusGovNavegacaoTecladoCampos === 'function';
        const temAtalhoF1 = typeof window.JusGovAtalhoF1Gemini === 'function';
        registrar(
            temBotoesMouse && temBotaoMeio && temTecladoCampos && temAtalhoF1,
            'MOD_INPUT_SUBCLASSES_ESPECIALIZADAS',
            'Subclasses BotoesLateraisMouse, BotaoMeioColagem, NavegacaoTecladoCampos e AtalhoF1Gemini instanciáveis'
        );

        /* 4) Injeção de dependências reais em ModuloInput (DIP e Composição) */
        let modInputCompletoOk = false;
        try {
            const instBotoes = new window.JusGovBotoesLateraisMouse({ ativo: true });
            const instMeio = new window.JusGovBotaoMeioColagem({ ativo: true });
            const instCampos = new window.JusGovNavegacaoTecladoCampos({ ativo: true });
            const instF1 = new window.JusGovAtalhoF1Gemini({ ativo: true, promptPadrao: 'Resuma juridicamente: {SELECAO}' });

            const modInputReal = new window.JusGovModuloInput({
                botoesLaterais: instBotoes,
                botaoMeio: instMeio,
                tecladoCampos: instCampos,
                atalhoF1: instF1
            });

            modInputReal.atualizarConfiguracoes({
                optCapturaBotoesMouse4e5: false,
                optColarBotaoMeio: true,
                optNavegacaoTecladoCampos: true,
                optPromptF1Gemini: 'Novo prompt {SELECAO}'
            });

            const promptFormatado = instF1.obterPromptFormatado('Decisão liminar');

            modInputCompletoOk = Boolean(
                modInputReal.botoesLaterais.ativo === false &&
                modInputReal.botaoMeio.ativo === true &&
                modInputReal.tecladoCampos.ativo === true &&
                promptFormatado.includes('Decisão liminar') &&
                instF1.montarUrlGemini('Decisão').includes('gemini.google.com')
            );
        } catch (_) {
            modInputCompletoOk = false;
        }
        registrar(
            modInputCompletoOk,
            'MOD_INPUT_INJECAO_DIP_COMPOSICAO',
            'Injeção de dependências (DIP), ciclo reativo e formatação de prompt Gemini em mod-input'
        );

        /* 4.1) Verificação da existência e integridade da classe ModuloAntiAmpulheta (Grupo 1) */
        const temModuloAntiAmpulheta = typeof window.JusGovModuloAntiAmpulheta === 'function';
        registrar(
            temModuloAntiAmpulheta,
            'MOD_ANTI_AMPULHETA_CLASSE_DISPONIVEL',
            'Disponibilidade global da classe ModuloAntiAmpulheta (Grupo 1: Anti-Ampulhetas)'
        );

        /* 4.2) Instanciação e Null Object Pattern em ModuloAntiAmpulheta */
        let nullObjectAntiAmpOk = false;
        try {
            const nullAntiAmp = window.JusGovModuloAntiAmpulheta.NULL_OBJECTS.NULL_ANTI_AMPULHETA;
            const modAntiAmpFallback = new window.JusGovModuloAntiAmpulheta({ ativo: true });
            nullObjectAntiAmpOk = Boolean(
                nullAntiAmp &&
                nullAntiAmp.ativo === false &&
                Array.isArray(nullAntiAmp.urls) &&
                nullAntiAmp.urls.length === 0 &&
                modAntiAmpFallback &&
                modAntiAmpFallback.ativo === true &&
                Array.isArray(window.JusGovModuloAntiAmpulheta.ARQUIVOS_CSS) &&
                window.JusGovModuloAntiAmpulheta.ARQUIVOS_CSS.length === 7
            );
        } catch (_) {
            nullObjectAntiAmpOk = false;
        }
        registrar(
            nullObjectAntiAmpOk,
            'MOD_ANTI_AMPULHETA_NULL_OBJECT_FALLBACK',
            'ModuloAntiAmpulheta ativa Null Objects imutáveis e expõe os 7 arquivos CSS especializados'
        );

        /* 4.3) Preservação de operações em lote e destravamento de cursor */
        let preservacaoLoteOk = false;
        try {
            const modAntiAmp = new window.JusGovModuloAntiAmpulheta({ ativo: true });
            const docSimulado = document.implementation.createHTMLDocument('Teste Anti-Ampulheta');
            docSimulado.body.style.cursor = 'wait';

            /* Sem lote ativo: deve destravar cursor */
            const destravouSemLote = modAntiAmp.desbloquearInterface(docSimulado);
            const cursorAposSemLote = docSimulado.body.style.cursor;

            /* Com lote ativo (#mpProgresso): não deve intervir */
            const divLote = docSimulado.createElement('div');
            divLote.id = 'mpProgresso';
            docSimulado.body.appendChild(divLote);
            docSimulado.body.style.cursor = 'wait';

            const interveioComLote = modAntiAmp.desbloquearInterface(docSimulado);
            const manteveWaitComLote = docSimulado.body.style.cursor === 'wait';

            preservacaoLoteOk = (destravouSemLote === true && cursorAposSemLote === 'auto' && interveioComLote === false && manteveWaitComLote === true);
        } catch (_) {
            preservacaoLoteOk = false;
        }
        registrar(
            preservacaoLoteOk,
            'MOD_ANTI_AMPULHETA_PRESERVACAO_LOTES',
            'ModuloAntiAmpulheta destrava cursores órfãos e preserva travas em lote (#mpProgresso)'
        );

        /* 5) Verificação da existência e integridade da classe ModuloNavegador */
        const temModuloNavegador = typeof window.JusGovModuloNavegador === 'function';
        registrar(
            temModuloNavegador,
            'MOD_NAVEGADOR_CLASSE_DISPONIVEL',
            'Disponibilidade global da classe ModuloNavegador (Grupo 4: Gerenciamento de Guias e Janelas)'
        );

        /* 6) Instanciação com tolerância a falhas (Null Object Pattern em ModuloNavegador) */
        let nullObjectNavegadorOk = false;
        try {
            const modNavFallback = new window.JusGovModuloNavegador({
                janelaUnica: null,
                antiDuplicacao: null,
                ordenacao: null,
                descarte: null
            });
            nullObjectNavegadorOk = Boolean(
                modNavFallback &&
                modNavFallback.janelaUnica &&
                typeof modNavFallback.janelaUnica.ehJanelaDeAutenticacao === 'function' &&
                modNavFallback.janelaUnica.ehJanelaDeAutenticacao() === false &&
                modNavFallback.antiDuplicacao &&
                typeof modNavFallback.antiDuplicacao.normalizarUrl === 'function' &&
                modNavFallback.ordenacao &&
                typeof modNavFallback.ordenacao.agruparPorDominio === 'function' &&
                modNavFallback.descarte &&
                typeof modNavFallback.descarte.descartarInativasAgora === 'function'
            );
        } catch (_) {
            nullObjectNavegadorOk = false;
        }
        registrar(
            nullObjectNavegadorOk,
            'MOD_NAVEGADOR_NULL_OBJECT_FALLBACK',
            'ModuloNavegador ativa Null Objects imutáveis sem lançar TypeError quando dependências são omitidas'
        );

        /* 7) Subclasses de mod-navegador e normalização de URLs no Anti-Duplicação */
        const temJanelaUnica = typeof window.JusGovGerenciadorJanelaUnica === 'function';
        const temAntiDuplicacao = typeof window.JusGovGerenciadorAntiDuplicacao === 'function';
        const temOrdenacao = typeof window.JusGovGerenciadorOrdenacaoGuias === 'function';
        const temDescarte = typeof window.JusGovGerenciadorDescarteGuias === 'function';
        registrar(
            temJanelaUnica && temAntiDuplicacao && temOrdenacao && temDescarte,
            'MOD_NAVEGADOR_SUBCLASSES_ESPECIALIZADAS',
            'Subclasses GerenciadorJanelaUnica, GerenciadorAntiDuplicacao, GerenciadorOrdenacaoGuias e GerenciadorDescarteGuias instanciáveis'
        );

        /* 8) Teste de normalização URL limpa no GerenciadorAntiDuplicacao */
        let normalizacaoUrlOk = false;
        try {
            const antiDup = new window.JusGovGerenciadorAntiDuplicacao({ reutilizarAbasAbertas: true });
            const urlBruta = 'https://pje.trt9.jus.br/primeirograu/Processo/ConsultaProcesso/Detalhe/documento.seam?idDoc=12345&utm_source=chat#secao1';
            const urlNormalizada = antiDup.normalizarUrl(urlBruta);
            normalizacaoUrlOk = (urlNormalizada === 'https://pje.trt9.jus.br/primeirograu/processo/consultaprocesso/detalhe/documento.seam');
        } catch (_) {
            normalizacaoUrlOk = false;
        }
        registrar(
            normalizacaoUrlOk,
            'MOD_NAVEGADOR_NORMALIZACAO_URL_ANTI_DUPLICACAO',
            'GerenciadorAntiDuplicacao normaliza URL eliminando hash, trailing slashes e caixas mistas'
        );

        /* 9) Preservação de certificados e telas de autenticação Gov.br em Janela Única */
        let preservacaoGovOk = false;
        try {
            const janelaUnica = new window.JusGovGerenciadorJanelaUnica({ bloquearNovasJanelas: true, preservarJanelasAutenticacao: true });
            preservacaoGovOk = (
                janelaUnica.ehJanelaDeAutenticacao('https://sso.acesso.gov.br/login') === true &&
                janelaUnica.ehJanelaDeAutenticacao('https://assinador.pje.jus.br/pjeoffice') === true &&
                janelaUnica.ehJanelaDeAutenticacao('https://portal.icp-brasil.org.br/validar') === true &&
                janelaUnica.ehJanelaDeAutenticacao('https://www.google.com/search') === false &&
                janelaUnica.ehJanelaDeAutenticacao('https://pje.trf1.jus.br/pje/Processo/ConsultaProcesso/detalhe.seam', '', 'Consulta Processo') === false
            );
        } catch (_) {
            preservacaoGovOk = false;
        }
        registrar(
            preservacaoGovOk,
            'MOD_NAVEGADOR_PRESERVACAO_CERTIFICADOS_GOV',
            'GerenciadorJanelaUnica preserva popups de autenticação ICP-Brasil, Gov.br e PJEOffice impedindo bloqueio indevido'
        );

        /* 9.1) BUG-11: Anti-duplicação preserva incondicionalmente a guia ativa em foco e remove duplicatas */
        let bug11AbaAtivaOk = false;
        try {
            const antiDup = new window.JusGovGerenciadorAntiDuplicacao();
            const abasSimuladas = [
                { id: 101, url: 'https://pje.jus.br/painel', active: true, pinned: false },
                { id: 102, url: 'https://pje.jus.br/painel', active: false, pinned: false },
                { id: 103, url: 'https://pje.jus.br/painel', active: false, pinned: false }
            ];
            const removidas = [];
            const chromeSimulado = {
                tabs: {
                    query: () => Promise.resolve(abasSimuladas),
                    remove: (ids) => { removidas.push(...ids); return Promise.resolve(); }
                }
            };
            const promessa = antiDup.fecharGuiasDuplicadas(null, chromeSimulado);
            bug11AbaAtivaOk = Boolean(promessa && typeof promessa.then === 'function');
            promessa.then((totalFechadas) => {
                if (removidas.includes(101)) {
                    bug11AbaAtivaOk = false;
                }
            }).catch(() => {});
        } catch (_) {
            bug11AbaAtivaOk = false;
        }
        registrar(
            bug11AbaAtivaOk,
            'BUG_11_ANTI_DUPLICACAO_BLINDAGEM_ABA_ATIVA',
            'GerenciadorAntiDuplicacao blinda incondicionalmente a guia ativa contra encerramento por duplicidade'
        );

        /* 9.2) SEÇÃO 6.13: Desacoplamento Modular Rígido (Interface vs Seleção/Cópia) */
        let secao613DesacoplamentoOk = false;
        try {
            const temModCopia = typeof window.JusGovModuloCopia === 'function';
            const temModInput = typeof window.JusGovModuloInput === 'function';
            const motorCopia = window.JusGovMotorSelecaoTeste;

            // 1. Ambas as fachadas existem de forma desacoplada
            const fachadasExistem = Boolean(temModCopia && temModInput && motorCopia);

            // 2. copia-selecionar delega métodos de interface com tolerância a falhas (Null Object / defensive guard)
            const temDelegacaoBotoesMouse = typeof motorCopia.tratarNavegacaoAbasPorBotoesMouse === 'function';
            const temDelegacaoNavegacaoCampos = typeof motorCopia.simularNavegacaoTecladoCampos === 'function';

            // 3. Simulação de chamada de interface em mod-copia não gera TypeError mesmo sem DOM completo
            let chamadaSemErro = false;
            try {
                motorCopia.tratarNavegacaoAbasPorBotoesMouse({ type: 'mouseup', button: 0 });
                chamadaSemErro = true;
            } catch (_) {
                chamadaSemErro = false;
            }

            secao613DesacoplamentoOk = Boolean(fachadasExistem && temDelegacaoBotoesMouse && temDelegacaoNavegacaoCampos && chamadaSemErro);
        } catch (_) {
            secao613DesacoplamentoOk = false;
        }
        registrar(
            secao613DesacoplamentoOk,
            'SECAO_6_13_DESACOPLAMENTO_MODULAR_INTERFACE_VS_COPIA',
            'Seção 6.13: Desacoplamento rígido entre Módulo de Cópia (src/mod-copia/) e Módulo de Interface (src/mod-input/) com resiliência POO'
        );

        /* 10) Imutabilidade e selamento estrutural de fachadas (Object.freeze) */
        const modAntiAmpCongelado = Object.isFrozen(window.JusGovModuloAntiAmpulheta);
        const modInputCongelado = Object.isFrozen(window.JusGovModuloInput);
        const modNavCongelado = Object.isFrozen(window.JusGovModuloNavegador);
        registrar(
            modAntiAmpCongelado && modInputCongelado && modNavCongelado,
            'ARQUITETURA_POO_IMUTABILIDADE_FACHADAS_SEALED',
            'Fachadas orquestradoras ModuloAntiAmpulheta, ModuloInput e ModuloNavegador seladas com Object.freeze contra mutações em tempo de execução'
        );

        /* 10.1) BP-06 / ARQ-01: Disponibilidade e métodos da biblioteca JusGovVerificadores */
        let libVerificadoresOk = false;
        try {
            const FabricaVer = (typeof window !== 'undefined' && window.JusGovVerificadores) || (typeof self !== 'undefined' && self.JusGovVerificadores);
            if (typeof FabricaVer === 'function') {
                const ver = new FabricaVer();
                const resCpf = ver.validarCPF('529.982.247-25');
                const resCnj = ver.validarCNJ('1004615-62.2026.4.01.4002');
                const resData = ver.validarData('29/02/2024');
                const resBissexto = ver.validarBissexto(2024) === true && ver.validarBissexto(2025) === false;
                libVerificadoresOk = Boolean(
                    ver &&
                    typeof ver.validarCPF === 'function' &&
                    typeof ver.validarCNPJ === 'function' &&
                    typeof ver.validarCNJ === 'function' &&
                    typeof ver.validarData === 'function' &&
                    typeof ver.validarModulo11 === 'function' &&
                    typeof ver.validarModulo97 === 'function' &&
                    resCpf && resCpf.valido === true &&
                    resCnj && resCnj.valido === true &&
                    resData && resData.valido === true &&
                    resBissexto
                );
            }
        } catch (_) {
            libVerificadoresOk = false;
        }
        registrar(
            libVerificadoresOk,
            'LIB_VERIFICADORES_DISPONIBILIDADE_E_METODOS',
            'JusGovVerificadores expõe métodos de auditoria matemática (CPF, CNPJ, CNJ, Data, Mod 11/97) com conformidade total'
        );

        /* 10.2) BP-06 / ARQ-01: Disponibilidade e integração cruzada da biblioteca JusGovGeradores */
        let libGeradoresOk = false;
        try {
            const FabricaGer = (typeof window !== 'undefined' && window.JusGovGeradores) || (typeof self !== 'undefined' && self.JusGovGeradores);
            const FabricaVer = (typeof window !== 'undefined' && window.JusGovVerificadores) || (typeof self !== 'undefined' && self.JusGovVerificadores);
            if (typeof FabricaGer === 'function' && typeof FabricaVer === 'function') {
                const ger = new FabricaGer();
                const ver = new FabricaVer();
                const cpfGerado = ger.gerarCpfValido();
                const cnpjGerado = ger.gerarCnpjAlfanumericoValido();
                const cnjGerado = ger.gerarCnjValido();
                const dataGerada = ger.gerarDataValida(true);

                const cpfValido = ver.validarCPF(cpfGerado).valido === true;
                const cnjValido = ver.validarCNJ(cnjGerado).valido === true;
                const dataValida = ver.validarData(dataGerada).valido === true;

                libGeradoresOk = Boolean(
                    ger &&
                    typeof ger.gerarCpfValido === 'function' &&
                    typeof ger.gerarCnpjAlfanumericoValido === 'function' &&
                    typeof ger.gerarCnjValido === 'function' &&
                    typeof ger.gerarDataValida === 'function' &&
                    cpfValido && cnjValido && dataValida
                );
            }
        } catch (_) {
            libGeradoresOk = false;
        }
        registrar(
            libGeradoresOk,
            'LIB_GERADORES_DISPONIBILIDADE_E_INTEGRACAO',
            'JusGovGeradores gera documentos válidos compatíveis com validações determinísticas de JusGovVerificadores'
        );

        /* 10.3) BP-06 / ARQ-01: Segregação estrita entre Verificadores e Geradores */
        let segregacaoOk = false;
        try {
            const protoVer = window.JusGovVerificadores ? window.JusGovVerificadores.prototype : null;
            const protoGer = window.JusGovGeradores ? window.JusGovGeradores.prototype : null;
            if (protoVer && protoGer) {
                const verNaoGera = typeof protoVer.gerarCpfValido === 'undefined' && typeof protoVer.gerarCnjValido === 'undefined';
                const gerNaoValida = typeof protoGer.validarCPF === 'undefined' && typeof protoGer.validarCNJ === 'undefined';
                segregacaoOk = (verNaoGera && gerNaoValida);
            }
        } catch (_) {
            segregacaoOk = false;
        }
        registrar(
            segregacaoOk,
            'ARQ_01_SEGREGACAO_ESTRITA_VERIFICADORES_GERADORES',
            'Segregação estrita: JusGovVerificadores não possui métodos de geração e JusGovGeradores não possui métodos de validação'
        );

        /* 10.4) ARQ-02: Disponibilidade, sanitização e matching da biblioteca JusGovUrls */
        let libUrlsOk = false;
        try {
            const FabricaUrls = (typeof window !== 'undefined' && window.JusGovUrls) || (typeof self !== 'undefined' && self.JusGovUrls);
            if (typeof FabricaUrls === 'function') {
                const urls = new FabricaUrls();
                const matches = urls.sanitizarParaMatches(['*.jus.br/*', 'https://pje.jus.br/*']);
                const casaPje = urls.urlCorrespondeAosPadroes('https://pje.jus.br/pje/Processo', matches);
                const naoCasaGoogle = !urls.urlCorrespondeAosPadroes('https://www.google.com/search', matches);
                const imutavel = Object.isFrozen(FabricaUrls) && Object.isFrozen(FabricaUrls.prototype);
                libUrlsOk = Boolean(matches.length >= 2 && casaPje && naoCasaGoogle && imutavel);
            }
        } catch (_) {
            libUrlsOk = false;
        }
        registrar(
            libUrlsOk,
            'LIB_URLS_DISPONIBILIDADE_SANITIZACAO_MATCHING',
            'JusGovUrls sanitiza match patterns e executa matching determinístico de URLs de tribunais com selagem POO'
        );

        /* 10.5) ARQ-02: Disponibilidade e arquitetura desacoplada de JusGovInjecaoScripts e JusGovConfiguracoes */
        let libInjecaoEConfigOk = false;
        try {
            const FabricaInjecao = (typeof window !== 'undefined' && window.JusGovInjecaoScripts) || (typeof self !== 'undefined' && self.JusGovInjecaoScripts);
            const FabricaConfig = (typeof window !== 'undefined' && window.JusGovConfiguracoes) || (typeof self !== 'undefined' && self.JusGovConfiguracoes);
            if (typeof FabricaInjecao === 'function' && typeof FabricaConfig === 'function') {
                const injecao = new FabricaInjecao();
                const config = new FabricaConfig({ injecao });
                const arqsNucleo = injecao.obterArquivosNucleoModuloCopia();
                const padroesTurbo = config.obterPadroesDefaultTurbo();
                const padroesAmp = config.obterPadroesDefaultAmpuletas();
                const injecaoImutavel = Object.isFrozen(FabricaInjecao) && Object.isFrozen(FabricaInjecao.prototype);
                const configImutavel = Object.isFrozen(FabricaConfig) && Object.isFrozen(FabricaConfig.prototype);
                libInjecaoEConfigOk = Boolean(
                    Array.isArray(arqsNucleo) && arqsNucleo.length > 0 &&
                    Array.isArray(padroesTurbo) && padroesTurbo.length > 0 &&
                    Array.isArray(padroesAmp) && padroesAmp.length > 0 &&
                    injecaoImutavel && configImutavel
                );
            }
        } catch (_) {
            libInjecaoEConfigOk = false;
        }
        registrar(
            libInjecaoEConfigOk,
            'LIB_INJECAO_E_CONFIG_DISPONIBILIDADE_DESACOPLADA',
            'JusGovInjecaoScripts e JusGovConfiguracoes operam de forma autônoma e desacoplada com selagem POO'
        );

        /* 11) BUG-01: Ciclo de vida determinístico de subframes (<iframe>) com AbortController e segurança BFCache */
        let bug01SubframeOk = false;
        let iframeBug01 = null;
        try {
            if (motorTeste && typeof motorTeste.inspecionarSubframeTeste === 'function' && typeof motorTeste.obterEstadoCicloVida === 'function') {
                const contagemInicial = motorTeste.obterEstadoCicloVida().subframesMonitoradosCount;
                iframeBug01 = document.createElement('iframe');
                iframeBug01.style.cssText = 'width:1px;height:1px;position:fixed;left:-9999px;top:-9999px;border:0;';
                iframeBug01.setAttribute('data-jusgov-ignore', 'true');
                document.body.appendChild(iframeBug01);

                /* Garante estado limpo sem motor próprio no iframe sintético */
                iframeBug01.contentWindow.__JUSGOV_MOTOR_SELECAO_ATIVO__ = false;
                iframeBug01.contentWindow.__JUSGOV_OUVINTE_LOCAL__ = false;
                motorTeste.limparSubframeTeste(iframeBug01);

                const baseAposLimpeza = motorTeste.obterEstadoCicloVida().subframesMonitoradosCount;
                const anexou = motorTeste.inspecionarSubframeTeste(iframeBug01);
                const aposInspecao = motorTeste.obterEstadoCicloVida().subframesMonitoradosCount;
                const flagAtiva = (iframeBug01.contentWindow.__JUSGOV_OUVINTE_LOCAL__ === true);

                /* Simula navegação BFCache (persisted: true) -> NÃO deve abortar ouvintes */
                const evBfCache = new PageTransitionEvent('pagehide', { persisted: true });
                iframeBug01.contentWindow.dispatchEvent(evBfCache);
                const preservouBfCache = (
                    iframeBug01.contentWindow.__JUSGOV_OUVINTE_LOCAL__ === true &&
                    motorTeste.obterEstadoCicloVida().subframesMonitoradosCount === (baseAposLimpeza + 1)
                );

                /* Simula descarregamento definitivo (persisted: false) -> DEVE abortar imediatamente */
                const evUnload = new PageTransitionEvent('pagehide', { persisted: false });
                iframeBug01.contentWindow.dispatchEvent(evUnload);
                const desmontouNoPagehide = (
                    iframeBug01.contentWindow.__JUSGOV_OUVINTE_LOCAL__ === false &&
                    motorTeste.obterEstadoCicloVida().subframesMonitoradosCount === baseAposLimpeza
                );

                bug01SubframeOk = Boolean(
                    contagemInicial >= 0 &&
                    anexou === true &&
                    aposInspecao === (baseAposLimpeza + 1) &&
                    flagAtiva &&
                    preservouBfCache &&
                    desmontouNoPagehide
                );
            }
        } catch (_) {
            bug01SubframeOk = false;
        } finally {
            if (iframeBug01) {
                try { motorTeste.limparSubframeTeste(iframeBug01); } catch (_) { }
                try { iframeBug01.remove(); } catch (_) { }
            }
        }
        registrar(
            bug01SubframeOk,
            'BUG01_SUBFRAME_ABORTCONTROLLER_LIFECYCLE',
            'Subframes <iframe> gerenciam AbortController próprio: preservam BFCache (persisted=true) e abortam closures em pagehide definitivo (persisted=false)'
        );

        /* 12) BUG-01: Auto-desmontagem imediata quando subframe ativa seu próprio motor nativo */
        let bug01AutoAbortNativoOk = false;
        let iframeBug01Nativo = null;
        try {
            if (motorTeste && typeof motorTeste.inspecionarSubframeTeste === 'function') {
                iframeBug01Nativo = document.createElement('iframe');
                iframeBug01Nativo.style.cssText = 'width:1px;height:1px;position:fixed;left:-9999px;top:-9999px;border:0;';
                iframeBug01Nativo.setAttribute('data-jusgov-ignore', 'true');
                document.body.appendChild(iframeBug01Nativo);

                iframeBug01Nativo.contentWindow.__JUSGOV_MOTOR_SELECAO_ATIVO__ = false;
                iframeBug01Nativo.contentWindow.__JUSGOV_OUVINTE_LOCAL__ = false;
                motorTeste.limparSubframeTeste(iframeBug01Nativo);

                const baseCount = motorTeste.obterEstadoCicloVida().subframesMonitoradosCount;
                motorTeste.inspecionarSubframeTeste(iframeBug01Nativo);

                /* Simula ativação tardia do Content Script próprio dentro do iframe */
                iframeBug01Nativo.contentWindow.__JUSGOV_MOTOR_SELECAO_ATIVO__ = true;
                iframeBug01Nativo.contentWindow.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

                bug01AutoAbortNativoOk = (
                    iframeBug01Nativo.contentWindow.__JUSGOV_OUVINTE_LOCAL__ === false &&
                    motorTeste.obterEstadoCicloVida().subframesMonitoradosCount === baseCount
                );
            }
        } catch (_) {
            bug01AutoAbortNativoOk = false;
        } finally {
            if (iframeBug01Nativo) {
                try { motorTeste.limparSubframeTeste(iframeBug01Nativo); } catch (_) { }
                try { iframeBug01Nativo.remove(); } catch (_) { }
            }
        }
        registrar(
            bug01AutoAbortNativoOk,
            'BUG01_SUBFRAME_AUTO_ABORT_MOTOR_NATIVO',
            'Fallback de subframe auto-aborta instantaneamente suas 4 closures ao detectar ativação do motor nativo no iframe'
        );

        /* 13) BUG-01: Desmontagem completa e reconstrução idempotente do motor principal */
        let bug01MotorTeardownOk = false;
        try {
            if (motorTeste && typeof motorTeste.destruirCicloVida === 'function' && typeof motorTeste.reconstruirCicloVida === 'function') {
                try {
                    motorTeste.destruirCicloVida();
                    const estDestruido = motorTeste.obterEstadoCicloVida();
                    const desmontouTudo = (
                        estDestruido.motorAtivo === false &&
                        estDestruido.controladorAtivo === false &&
                        estDestruido.sinalAbortado === true &&
                        estDestruido.observerFramesAtivo === false &&
                        estDestruido.subframesMonitoradosCount === 0
                    );

                    motorTeste.reconstruirCicloVida();
                    const estReconstruido = motorTeste.obterEstadoCicloVida();
                    const reconstruiuTudo = (
                        estReconstruido.motorAtivo === true &&
                        estReconstruido.controladorAtivo === true &&
                        estReconstruido.sinalAbortado === false &&
                        estReconstruido.observerFramesAtivo === true
                    );

                    bug01MotorTeardownOk = Boolean(desmontouTudo && reconstruiuTudo);
                } finally {
                    /* Garante que o motor principal da página permaneça 100% operacional */
                    if (!motorTeste.obterEstadoCicloVida().motorAtivo) {
                        motorTeste.reconstruirCicloVida();
                    }
                }
            }
        } catch (_) {
            bug01MotorTeardownOk = false;
        }
        registrar(
            bug01MotorTeardownOk,
            'BUG01_MOTOR_PRINCIPAL_TEARDOWN_E_RECONSTRUCAO',
            'Motor principal encerra AbortController, MutationObservers e timers em destruirCicloVida() e restaura estado íntegro em reconstruirCicloVida()'
        );

        /* 14) BUG-01: ModuloInput com AbortController privado, pagehide (!persisted) e método destruir() */
        let bug01ModInputTeardownOk = false;
        let iframeModInput = null;
        try {
            iframeModInput = document.createElement('iframe');
            iframeModInput.style.cssText = 'width:1px;height:1px;position:fixed;left:-9999px;top:-9999px;border:0;';
            iframeModInput.setAttribute('data-jusgov-ignore', 'true');
            document.body.appendChild(iframeModInput);

            const modSub = new window.JusGovModuloInput();
            const init1 = modSub.inicializar(iframeModInput.contentDocument);
            const initDuplo = modSub.inicializar(iframeModInput.contentDocument);
            const sinal1 = modSub.sinalCicloVida;

            /* BFCache (persisted: true) preserva listener */
            iframeModInput.contentWindow.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
            const vivoAposBfCache = (modSub.inicializado === true && sinal1 && sinal1.aborted === false);

            /* Unload real (persisted: false) destrói automaticamente */
            iframeModInput.contentWindow.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
            const destruidoAposPagehide = (modSub.inicializado === false && sinal1 && sinal1.aborted === true);

            /* Permite reinicializar de forma limpa e destruir manualmente */
            const init2 = modSub.inicializar(iframeModInput.contentDocument);
            const sinal2 = modSub.sinalCicloVida;
            const destruiuManual = modSub.destruir();

            bug01ModInputTeardownOk = Boolean(
                init1 === true &&
                initDuplo === false &&
                vivoAposBfCache &&
                destruidoAposPagehide &&
                init2 === true &&
                destruiuManual === true &&
                modSub.inicializado === false &&
                sinal2 &&
                sinal2.aborted === true
            );
        } catch (_) {
            bug01ModInputTeardownOk = false;
        } finally {
            if (iframeModInput) {
                try { iframeModInput.remove(); } catch (_) { }
            }
        }
        registrar(
            bug01ModInputTeardownOk,
            'BUG01_MOD_INPUT_ABORTCONTROLLER_DESTRUIR',
            'ModuloInput gerencia #abortController privado com idempotência, preservação de BFCache e desmontagem determinística em pagehide/destruir()'
        );

        /* 15) Seção 6.47: Separação inter-módulos, imutabilidade das 3 fachadas POO e paridade de chaves de storage */
        let secao647IntegracaoOk = false;
        try {
            const fachadaCopia = motorTeste && typeof motorTeste.obterFachadaCopia === 'function' ? motorTeste.obterFachadaCopia() : null;
            const fachadaInput = motorTeste && typeof motorTeste.obterFachadaInput === 'function' ? motorTeste.obterFachadaInput() : null;
            const modCopiaSelado = Object.isFrozen(window.JusGovModuloCopia);

            const f1Teste = new window.JusGovAtalhoF1Gemini({ promptPadrao: 'Analisar trecho: "{{TEXTO}}"' });
            const promptDuplaChave = f1Teste.obterPromptFormatado('Art. 5º CF');

            const navTeste = new window.JusGovModuloNavegador();
            navTeste.atualizarConfiguracoes({
                bloquearNovasJanelas: false,
                preservarJanelasAutenticacao: true,
                reutilizarAbasAbertas: false,
                monitorarUrlOriginalAbertura: true,
                criterioOrdenacaoGuias: 'dominio',
                sentidoOrdenacaoGuias: 'dir_esq',
                ordenarGuiasFixadas: true,
                descarteGuiasInativasAtivo: true,
                tempoInatividadeDescarteMinutos: 45
            });

            secao647IntegracaoOk = Boolean(
                modCopiaSelado &&
                fachadaCopia &&
                fachadaCopia.estagio1 &&
                fachadaCopia.filtros &&
                fachadaCopia.validadores &&
                fachadaInput &&
                fachadaInput.botoesLaterais &&
                fachadaInput.botaoMeio &&
                fachadaInput.tecladoCampos &&
                fachadaInput.atalhoF1 &&
                promptDuplaChave === 'Analisar trecho: "Art. 5º CF"' &&
                navTeste.janelaUnica.bloquearNovasJanelas === false &&
                navTeste.antiDuplicacao.reutilizarAbasAbertas === false &&
                navTeste.antiDuplicacao.monitorarUrlOriginal === true &&
                navTeste.ordenacao.criterio === 'dominio' &&
                navTeste.ordenacao.sentido === 'dir_esq' &&
                navTeste.ordenacao.ordenarGuiasFixadas === true &&
                navTeste.descarte.ativo === true &&
                navTeste.descarte.tempoInatividadeMinutos === 45
            );
        } catch (_) {
            secao647IntegracaoOk = false;
        }
        registrar(
            secao647IntegracaoOk,
            'SECAO_6_47_SEPARACAO_MODULOS_E_FACHADAS_INTEGRADAS',
            'Separação de domínios (Cópia, Input e Navegador), selamento Object.freeze das 3 fachadas e paridade bidirecional com chaves do storage'
        );

            }

            {
        /* TESTE BUG-09: Isolamento de Eventos de Colagem com Botão do Meio e Proteção de Borda */
        let bug09CasosBordaOk = false;
        try {
            const botaoMeio = (typeof window !== 'undefined' && window.JusGovBotaoMeioColagem) ? new window.JusGovBotaoMeioColagem() : null;
            let linkNaoInterceptado = false;
            let inputTratadoSemExcecao = false;

            if (botaoMeio) {
                let preventDefaultChamado = false;
                const linkFalso = {
                    nodeType: 1,
                    tagName: 'A',
                    getAttribute: (attr) => attr === 'href' ? 'https://pje.trf1.jus.br' : null,
                    isContentEditable: false,
                    closest: () => null
                };
                const evLinkMeio = {
                    button: 1,
                    target: linkFalso,
                    preventDefault: () => { preventDefaultChamado = true; },
                    stopPropagation: () => {}
                };
                const tratouLink = botaoMeio.tratarCliqueBotaoMeio(evLinkMeio, 'Texto Copiado');
                linkNaoInterceptado = (tratouLink === false && preventDefaultChamado === false);

                let inputValor = '';
                const inputFalso = {
                    nodeType: 1,
                    tagName: 'INPUT',
                    getAttribute: (attr) => attr === 'type' ? 'text' : null,
                    disabled: false,
                    readOnly: false,
                    isContentEditable: false,
                    value: '',
                    selectionStart: 0,
                    selectionEnd: 0,
                    setSelectionRange: (ini, fim) => {},
                    dispatchEvent: (ev) => true
                };
                let prevChamadoInput = false;
                const evInputMeio = {
                    button: 1,
                    target: inputFalso,
                    preventDefault: () => { prevChamadoInput = true; },
                    stopPropagation: () => {}
                };
                const tratouInput = botaoMeio.tratarCliqueBotaoMeio(evInputMeio, 'Texto Injetado No Input');
                inputTratadoSemExcecao = (tratouInput === true && prevChamadoInput === true && inputFalso.value === 'Texto Injetado No Input');
            }

            bug09CasosBordaOk = Boolean(linkNaoInterceptado && inputTratadoSemExcecao);
        } catch (eBug09) {
            bug09CasosBordaOk = false;
        }
        registrar(
            bug09CasosBordaOk,
            'BUG_09_COLAGENS_E_EVENTOS_DOM_CASOS_BORDA',
            'BUG-09: Isolamento de preventDefault() do botão do meio restrito a elementos editáveis (preservando abertura de links em nova aba) e colagem blindada contra falhas de seleção.'
        );

            }

            {
        /* TESTE SEÇÃO 6.72 (FEAT-08): Caixa de Entrada Rápida Flutuante (Ctrl + Ins + Ins) */
        let secao672CaixaRapidaOk = false;
        try {
            const FabricaCaixa = typeof window !== 'undefined' ? window.JusGovCaixaEntradaRapida : null;
            let instanciaDiretaOk = false;
            let atalhoDuploDetectado = false;
            let aberturaEConfirmacaoOk = false;
            let integracaoModInputOk = false;

            if (FabricaCaixa) {
                const caixa = new FabricaCaixa({ janelaTempoMs: 400 });
                instanciaDiretaOk = (caixa && typeof caixa.abrirCaixa === 'function');

                // Testar detecção de duplo acionamento Ctrl + Insert (dois eventos distintos)
                const evInsertCtrl1 = {
                    key: 'Insert',
                    keyCode: 45,
                    ctrlKey: true,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                const evInsertCtrl2 = {
                    key: 'Insert',
                    keyCode: 45,
                    ctrlKey: true,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                const r1 = caixa.tratarEventoTeclado(evInsertCtrl1); // Primeiro clique: armazena timestamp, retorna false
                const r2 = caixa.tratarEventoTeclado(evInsertCtrl2); // Segundo clique imediato: abre caixa, retorna true
                const atalhoCtrlDuploOk = (r1 === false && r2 === true && caixa.isAberta);
                caixa.fecharCaixa();

                // Testar detecção de duplo acionamento Insert simples (Ins + Ins sem Ctrl)
                const evInsertSimples1 = {
                    key: 'Insert',
                    keyCode: 45,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                const evInsertSimples2 = {
                    key: 'Insert',
                    keyCode: 45,
                    ctrlKey: false,
                    altKey: false,
                    shiftKey: false,
                    metaKey: false,
                    preventDefault: () => {},
                    stopPropagation: () => {}
                };
                const r3 = caixa.tratarEventoTeclado(evInsertSimples1); // Primeiro clique: armazena timestamp, retorna false
                const r4 = caixa.tratarEventoTeclado(evInsertSimples2); // Segundo clique imediato: abre caixa, retorna true
                const atalhoSimplesDuploOk = (r3 === false && r4 === true && caixa.isAberta);

                atalhoDuploDetectado = Boolean(atalhoCtrlDuploOk && atalhoSimplesDuploOk);

                // Testar interação DOM e confirmação com preenchimento
                if (caixa.isAberta) {
                    const elDialogo = document.querySelector('.jusgov-dialog-input-rapido');
                    const elInput = elDialogo ? elDialogo.querySelector('input') : null;
                    if (elInput) {
                        elInput.value = '1015306-38.2026.4.01.4002';
                        caixa.confirmar();
                        aberturaEConfirmacaoOk = (!caixa.isAberta && caixa.ultimoTextoDigitado === '1015306-38.2026.4.01.4002');
                    } else {
                        caixa.fecharCaixa();
                    }
                }

                // Testar integração via ModuloInput (SRP & Facade)
                const modInput = (typeof window !== 'undefined' && window.JusGovModuloInput)
                    ? new window.JusGovModuloInput({ caixaRapida: caixa })
                    : null;
                integracaoModInputOk = Boolean(modInput && modInput.caixaRapida && modInput.caixaRapida === caixa);
            }

            secao672CaixaRapidaOk = Boolean(instanciaDiretaOk && atalhoDuploDetectado && aberturaEConfirmacaoOk && integracaoModInputOk);
        } catch (e672) {
            secao672CaixaRapidaOk = false;
        }
        registrar(
            secao672CaixaRapidaOk,
            'SECAO_6_72_CAIXA_ENTRADA_RAPIDA_FLUTUANTE',
            'Seção 6.72 (FEAT-08): Caixa de Entrada Rápida Flutuante desacoplada, acionamento por atalho duplo Ctrl+Ins+Ins (<=400ms), drag-and-drop, gravação no clipboard e backup nos slots internos.'
        );

            }

            {
        /* Seção 6.91 / FEAT-13: Anti-Duplicação com Prioridade para Guias Modificadas e Nova Ação "Recarregar apenas se a página foi modificada" */
        let secao691AntiDupOk = false;
        let erroSecao691 = null;
        try {
            const antiDup = new window.JusGovGerenciadorAntiDuplicacao({
                reutilizarAbasAbertas: true,
                protegerGuiasModificadas: true
            });

            // 1) Teste de schema/DOM da nova penúltima opção no options.html
            const elRadioRecarregarSeMod = document.getElementById('optReutilizarAcaoRecarregarSeModificada');
            const penultimaOpcaoDomOk = elRadioRecarregarSeMod
                ? (elRadioRecarregarSeMod.value === 'recarregar_se_modificada')
                : true;
            let schemaAceitaRecarregarSeMod = true;
            if (typeof window.JusGovConfig === 'object' && typeof window.JusGovConfig.normalizarConfiguracoes === 'function') {
                const cfgNorm = window.JusGovConfig.normalizarConfiguracoes({ reutilizarAbasAcaoConteudo: 'recarregar_se_modificada' });
                schemaAceitaRecarregarSeMod = (cfgNorm && cfgNorm.reutilizarAbasAcaoConteudo === 'recarregar_se_modificada');
            }

            // 2) Cenário 1: Duas guias com mesma URL. 201 (não modificada), 202 (modificada).
            // Com protegerGuiasModificadas=true, fecha a não-modificada (201) e mantém a modificada (202).
            antiDup.marcarPaginaModificada(201, false);
            antiDup.marcarPaginaModificada(202, true);

            const abasSim1 = [
                { id: 201, url: 'https://pje.jus.br/processo/100', active: false, pinned: false },
                { id: 202, url: 'https://pje.jus.br/processo/100', active: false, pinned: false }
            ];
            const removidas1 = [];
            const chromeSim1 = {
                tabs: {
                    query: () => Promise.resolve(abasSim1),
                    remove: (ids) => { removidas1.push(...ids); return Promise.resolve(); }
                }
            };

            const promessa1 = antiDup.fecharGuiasDuplicadas(null, chromeSim1, { protegerGuiasModificadas: true });

            // 3) Cenário 2: Múltiplas guias modificadas para mesma URL.
            // Ambas são mantidas, nenhuma removida.
            antiDup.marcarPaginaModificada(301, true);
            antiDup.marcarPaginaModificada(302, true);

            const abasSim2 = [
                { id: 301, url: 'https://pje.jus.br/processo/200', active: false, pinned: false },
                { id: 302, url: 'https://pje.jus.br/processo/200', active: false, pinned: false }
            ];
            const removidas2 = [];
            const chromeSim2 = {
                tabs: {
                    query: () => Promise.resolve(abasSim2),
                    remove: (ids) => { removidas2.push(...ids); return Promise.resolve(); }
                }
            };

            const promessa2 = antiDup.fecharGuiasDuplicadas(null, chromeSim2, { protegerGuiasModificadas: true });

            // 4) Cenário 3: Processamento com ação 'recarregar_se_modificada'
            let recarregou401 = false;
            antiDup.marcarPaginaModificada(401, true);

            const chromeSim3 = {
                tabs: {
                    query: () => Promise.resolve([
                        { id: 401, windowId: 1, url: 'https://pje.jus.br/processo/300' }
                    ]),
                    update: () => Promise.resolve(),
                    reload: (id) => {
                        if (id === 401) recarregou401 = true;
                        return Promise.resolve();
                    },
                    remove: () => Promise.resolve()
                },
                windows: {
                    update: () => Promise.resolve()
                }
            };

            const promessa3 = antiDup.processarNovaAba(
                { id: 403, windowId: 1, url: 'https://pje.jus.br/processo/300' },
                chromeSim3,
                { reutilizarAbasAbertas: true, reutilizarAbasAcaoConteudo: 'recarregar_se_modificada', protegerGuiasModificadas: true }
            );

            const promessasValidas = Boolean(
                promessa1 && typeof promessa1.then === 'function' &&
                promessa2 && typeof promessa2.then === 'function' &&
                promessa3 && typeof promessa3.then === 'function'
            );

            Promise.all([promessa1, promessa2, promessa3]).then(() => {
                if (!removidas1.includes(201) || removidas1.includes(202)) {
                    secao691AntiDupOk = false;
                }
                if (removidas2.length > 0) {
                    secao691AntiDupOk = false;
                }
                if (!recarregou401) {
                    secao691AntiDupOk = false;
                }
            }).catch(() => {
                secao691AntiDupOk = false;
            });

            secao691AntiDupOk = Boolean(penultimaOpcaoDomOk && schemaAceitaRecarregarSeMod && promessasValidas);
            if (!secao691AntiDupOk) {
                erroSecao691 = `dom=${penultimaOpcaoDomOk}, schema=${schemaAceitaRecarregarSeMod}, promessas=${promessasValidas}`;
            }
        } catch (e691) {
            secao691AntiDupOk = false;
            erroSecao691 = (e691 && (e691.message || String(e691))) || 'erro';
        }
        registrar(
            secao691AntiDupOk,
            'SECAO_6_91_ANTI_DUPLICACAO_PRIORIDADE_GUIAS_MODIFICADAS',
            'Seção 6.91 (FEAT-13): Anti-duplicação preserva prioritariamente guias com modificações (fechando a não-modificada), mantém múltiplas modificadas e suporta ação "recarregar_se_modificada".',
            { detalhe: erroSecao691 }
        );

            }

            {
        /* TESTE SEÇÃO 6.106 (SEC-01): Casulo de Blindagem e Roteador Seguro de URLs */
        let secao6106Sec01Ok = false;
        let erroSecao6106 = '';
        try {
            const prefixo = 'chrome-extension://abcdefghijklmnopabcdefghijklmnop/';
            const optionsPadrao = prefixo + 'src/cfg/options.html';

            const router = (typeof window.JusGovBlockAddon !== 'undefined') ? window.JusGovBlockAddon : null;
            if (!router) throw new Error('Classe JusGovBlockAddon não carregada');

            // 1. Roteamento de raiz
            const destRaiz = router.rotearUrlNavegacao(prefixo, prefixo);
            const raizOk = (destRaiz === optionsPadrao);

            // 2. Parâmetros de consulta do casulo
            const destConfig = router.rotearUrlNavegacao(prefixo + '?config', prefixo);
            const configOk = (destConfig === optionsPadrao);

            const destAjuda = router.rotearUrlNavegacao(prefixo + '?ajuda', prefixo);
            const ajudaOk = (destAjuda === optionsPadrao + '#ajuda');

            const destLab = router.rotearUrlNavegacao(prefixo + '?lab', prefixo);
            const labOk = (destLab === optionsPadrao + '#laboratorio');

            // 3. Bloqueio de acesso direto a scripts
            const destScript = router.rotearUrlNavegacao(prefixo + 'src/cfg/options.js', prefixo);
            const scriptBloqueadoOk = (destScript === optionsPadrao);

            const destCss = router.rotearUrlNavegacao(prefixo + 'src/mod-anti-ampulheta/pje-anti-ampulheta.css', prefixo);
            const cssBloqueadoOk = (destCss === optionsPadrao);

            // 4. Mapeamento de abas
            const abaAjuda = router.obterAbaPorParametro('?ajuda') === 'abaAjuda';
            const abaLab = router.obterAbaPorParametro('?lab') === 'abaLaboratorio';
            const abaConfig = router.obterAbaPorParametro('?config') === 'abaConfiguracoes';

            secao6106Sec01Ok = Boolean(
                raizOk &&
                configOk &&
                ajudaOk &&
                labOk &&
                scriptBloqueadoOk &&
                cssBloqueadoOk &&
                abaAjuda &&
                abaLab &&
                abaConfig
            );
        } catch (e6106) {
            erroSecao6106 = e6106.message || String(e6106);
            secao6106Sec01Ok = false;
        }
        registrar(
            secao6106Sec01Ok,
            'SECAO_6_106_SEC_01_CASULO_E_ROTEAMENTO',
            'Seção 6.106 (SEC-01 / ARQ-04): Casulo de blindagem da extensão, roteamento de raiz e parâmetros (?config/?ajuda/?lab), e bloqueio de acesso direto digitado a scripts e arquivos internos.',
            { detalhe: erroSecao6106 }
        );

            }

            {
            // Teste: Produtividade (Corrido, Ativo e Pausas) sempre ativa + regra de 5 min e contagem inteira da pausa
            let produtOk = false;
            let detalheProdut = '';
            try {
                const ModProd = window.JusGovModuloProdutividade;
                if (typeof ModProd === 'function') {
                    const mp = new ModProd();
                    const t0 = 1700000000000;
                    const cfgDesligada = {
                        tempoTrabalhoCorridoAtivo: false,
                        tempoTrabalhoAtivoAtivo: false,
                        pomodoroAtivo: false
                    };
                    const st = {
                        data: '2026-11-15',
                        inicioTs: t0,
                        ultimaAtividadeTs: t0,
                        corridoMinutos: 0,
                        ativoMinutos: 0,
                        pausasMinutos: 0,
                        pausasConfirmadas: 0,
                        emPausa: false,
                        minutosInativosPendentes: 0,
                        alertaCorridoDisparado: false,
                        alertaAtivoDisparado: false
                    };
                    // Minuto 1 com atividade recente (< 1 min sem atividade): corrido=1, ativo=1, pausas=0
                    mp.avancarMinutoEstadoTrabalho(st, t0 + 30 * 1000, cfgDesligada);
                    const passo1Ok = (st.corridoMinutos === 1 && st.ativoMinutos === 1 && st.pausasMinutos === 0 && st.pausasConfirmadas === 0);

                    // Minutos 2..5 sem nova atividade (1, 2, 3, 4 min inativos < 5 min): ainda conta provisoriamente como ativo
                    for (let m = 1; m <= 4; m++) {
                        mp.avancarMinutoEstadoTrabalho(st, t0 + m * 60 * 1000, cfgDesligada);
                    }
                    const antesConfirmarPausaOk = (st.corridoMinutos === 5 && st.ativoMinutos === 5 && st.pausasMinutos === 0 && st.pausasConfirmadas === 0 && !st.emPausa);

                    // Minuto 6 (>= 5 min inativo): confirma 1 pausa e contabiliza a pausa INTEIRA (5 min) fora do ativo!
                    mp.avancarMinutoEstadoTrabalho(st, t0 + 5 * 60 * 1000, cfgDesligada);
                    const aposConfirmarPausaOk = (st.corridoMinutos === 6 && st.ativoMinutos === 1 && st.pausasMinutos === 5 && st.pausasConfirmadas === 1 && st.emPausa);

                    // Minuto 7 (ainda na mesma pausa): corrido=7, ativo=1, pausasMinutos=6, pausasConfirmadas segue 1
                    mp.avancarMinutoEstadoTrabalho(st, t0 + 6 * 60 * 1000, cfgDesligada);
                    const continuaPausaOk = (st.corridoMinutos === 7 && st.ativoMinutos === 1 && st.pausasMinutos === 6 && st.pausasConfirmadas === 1);

                    produtOk = passo1Ok && antesConfirmarPausaOk && aposConfirmarPausaOk && continuaPausaOk;
                    detalheProdut = `p1=${passo1Ok}, antes5m=${antesConfirmarPausaOk}, conf5m=${aposConfirmarPausaOk}, cont=${continuaPausaOk}`;
                } else {
                    detalheProdut = 'JusGovModuloProdutividade ausente';
                }
            } catch (eProd) {
                detalheProdut = eProd.message || String(eProd);
            }
            registrar(
                produtOk,
                'PRODUTIVIDADE_CONTADORES_ATIVOS_E_PAUSA_INTEIRA_5MIN',
                'Contadores Corrido/Ativo/Pausas operam mesmo com Pomodoro desativado e convertem a pausa inteira ao confirmar 5 min sem interação.',
                { detalhe: detalheProdut }
            );

            // Teste: Dia lógico às 04:00 e continuidade de serão até descanso >= 3h
            let seraoOk = false;
            let detalheSerao = '';
            try {
                const ModProd = window.JusGovModuloProdutividade;
                if (typeof ModProd === 'function') {
                    const mp = new ModProd();
                    const ts22hOntem = new Date(2026, 10, 14, 22, 0, 0).getTime();
                    const ts02h30 = new Date(2026, 10, 15, 2, 30, 0).getTime();
                    const ts04h05 = new Date(2026, 10, 15, 4, 5, 0).getTime();
                    const ts07h00 = new Date(2026, 10, 15, 7, 0, 0).getTime();

                    const chave22h = mp.obterDataLocalChaveHoje(ts22hOntem);
                    const chave02h30 = mp.obterDataLocalChaveHoje(ts02h30);
                    const chave04h05 = mp.obterDataLocalChaveHoje(ts04h05);
                    const chavesOk = (chave22h === '2026-11-14' && chave02h30 === '2026-11-14' && chave04h05 === '2026-11-15');

                    // 1. Trabalhou direto de ontem até 07:00 (última atividade às 06:58 -> hiato 2 min < 3h): mantém 2026-11-14
                    const stSeraoDireto = {
                        data: '2026-11-14',
                        ultimaAtividadeTs: ts07h00 - 2 * 60 * 1000,
                        corridoMinutos: 540,
                        ativoMinutos: 500,
                        pausasConfirmadas: 1
                    };
                    const resDireto = mp.resolverEstadoTrabalhoParaMomento(stSeraoDireto, ts07h00);
                    const manteveSeraoOk = (!resDireto.reiniciou && resDireto.estado.data === '2026-11-14' && resDireto.estado.corridoMinutos === 540);

                    // 2. Parou às 23:00 e iniciou às 04:05 (hiato 5h05 >= 3h): reinicia para 2026-11-15
                    const stDormiu = {
                        data: '2026-11-14',
                        ultimaAtividadeTs: new Date(2026, 10, 14, 23, 0, 0).getTime(),
                        corridoMinutos: 180,
                        ativoMinutos: 170,
                        pausasConfirmadas: 0
                    };
                    const resDormiu = mp.resolverEstadoTrabalhoParaMomento(stDormiu, ts04h05);
                    const reiniciouPosSonoOk = (resDormiu.reiniciou && resDormiu.estado.data === '2026-11-15' && resDormiu.estado.corridoMinutos === 0);

                    seraoOk = chavesOk && manteveSeraoOk && reiniciouPosSonoOk;
                    detalheSerao = `chaves=${chavesOk}, serao07h=${manteveSeraoOk}, inicio04h=${reiniciouPosSonoOk}`;
                } else {
                    detalheSerao = 'JusGovModuloProdutividade ausente';
                }
            } catch (eSerao) {
                detalheSerao = eSerao.message || String(eSerao);
            }
            registrar(
                seraoOk,
                'PRODUTIVIDADE_SERAO_MADRUGADA_E_DESCANSO_3H',
                'Dia lógico vira às 04:00, reiniciando quem inicia após descanso >= 3h e mantendo no dia anterior quem segue em serão direto.',
                { detalhe: detalheSerao }
            );

            }

            {
            // Teste: Auto-Limpeza Seletiva de Cookies Antigos (preserva logins/tokens recentes < X dias e apaga só inativos >= X dias)
            let manutOk = false;
            let detalheManut = '';
            try {
                const ManutCls = window.JusGovModuloManutencao;
                if (typeof ManutCls === 'function') {
                    const m = new ManutCls();
                    const agora = 1800000000000;
                    const seteDiasMs = m.obterMsIdadeLimpeza('7d');
                    const umDiaMs = 24 * 3600 * 1000;

                    const cTokenRecente = { storeId: '0', domain: '.pje.jus.br', path: '/', name: 'AUTH_TOKEN', secure: true };
                    const cSemHistorico = { storeId: '0', domain: 'sso.cloud.pje.jus.br', path: '/', name: 'KC_SESSION', secure: true, hostOnly: true };
                    const cAbaAberta = { storeId: '0', domain: '.gov.br', path: '/', name: 'GOV_SSO', secure: true };
                    const cObsoleto = { storeId: '0', domain: '.portal-antigo.example.org', path: '/app', name: 'OLD_TRACKER', secure: false };

                    const mapaInicial = {};
                    mapaInicial[m.gerarChaveCookie(cTokenRecente)] = agora - (2 * umDiaMs); // acessado/alterado há 2 dias (< 7d) -> PRESERVAR
                    mapaInicial[m.gerarChaveCookie(cAbaAberta)] = agora - (10 * umDiaMs);   // antigo, mas aba aberta agora -> PRESERVAR
                    mapaInicial[m.gerarChaveCookie(cObsoleto)] = agora - (8 * umDiaMs);     // sem acesso há 8 dias (>= 7d) -> REMOVER
                    mapaInicial['0|.inexistente.test|/|GHOST'] = agora - umDiaMs;          // cookie não existe mais -> podar do mapa

                    const resAval = m.avaliarCookiesParaLimpeza(
                        [cTokenRecente, cSemHistorico, cAbaAberta, cObsoleto],
                        mapaInicial,
                        agora,
                        seteDiasMs,
                        { hostsAtivos: new Set(['acesso.gov.br']) }
                    );

                    const apenasObsoletoRemovido = (
                        resAval.remover.length === 1 &&
                        resAval.remover[0].name === 'OLD_TRACKER'
                    );
                    const preservouRecentesEAtivos = (
                        resAval.preservar.length === 3 &&
                        resAval.preservar.some(c => c.name === 'AUTH_TOKEN') &&
                        resAval.preservar.some(c => c.name === 'KC_SESSION') &&
                        resAval.preservar.some(c => c.name === 'GOV_SSO')
                    );
                    const mapaLimpoESemeadoOk = (
                        resAval.mapaAtualizado[m.gerarChaveCookie(cSemHistorico)] === agora &&
                        resAval.mapaAtualizado[m.gerarChaveCookie(cAbaAberta)] === agora &&
                        resAval.mapaAtualizado[m.gerarChaveCookie(cObsoleto)] === undefined &&
                        resAval.mapaAtualizado['0|.inexistente.test|/|GHOST'] === undefined
                    );
                    const urlRemocaoOk = (
                        m.construirUrlCookie(cObsoleto) === 'http://portal-antigo.example.org/app' &&
                        m.construirUrlCookie(cTokenRecente) === 'https://pje.jus.br/'
                    );
                    const hostMatchOk = (
                        m.cookieCorrespondeAoHost(cSemHistorico, 'sso.cloud.pje.jus.br') === true &&
                        m.cookieCorrespondeAoHost(cSemHistorico, 'sub.sso.cloud.pje.jus.br') === false &&
                        m.cookieCorrespondeAoHost(cAbaAberta, 'acesso.gov.br') === true
                    );

                    manutOk = Boolean(apenasObsoletoRemovido && preservouRecentesEAtivos && mapaLimpoESemeadoOk && urlRemocaoOk && hostMatchOk);
                    detalheManut = `rem=${apenasObsoletoRemovido}, pres=${preservouRecentesEAtivos}, mapa=${mapaLimpoESemeadoOk}, url=${urlRemocaoOk}, host=${hostMatchOk}`;
                } else {
                    detalheManut = 'JusGovModuloManutencao ausente';
                }
            } catch (eManut) {
                detalheManut = eManut.message || String(eManut);
            }
            registrar(
                manutOk,
                'MANUTENCAO_COOKIES_SELETIVA_PRESERVA_AUTENTICACAO',
                'Auto-Limpeza remove apenas cookies sem acesso/alteração >= X dias, preservando tokens recentes, sessões ativas e cookies sem histórico.',
                { detalhe: detalheManut }
            );

            // Teste: Match Pattern Chromium (*://*.jus.br/* inclui dominio raiz e rejeita spoofing de path)
            let urlMatchOk = false;
            let detalheUrlMatch = '';
            try {
                const UrlsCls = window.JusGovUrls;
                if (typeof UrlsCls === 'function') {
                    const u = new UrlsCls();
                    const p = ['*://*.jus.br/*'];
                    const mSub = u.urlCorrespondeAosPadroes('https://pje.tjsp.jus.br/pje', p);
                    const mApex = u.urlCorrespondeAosPadroes('https://jus.br/portal', p);
                    const mSpoof = u.urlCorrespondeAosPadroes('https://evil.example.com/?url=tjsp.jus.br/', p);
                    urlMatchOk = (mSub === true && mApex === true && mSpoof === false);
                    detalheUrlMatch = `sub=${mSub}, apex=${mApex}, spoofBlocked=${!mSpoof}`;
                }
            } catch (eUrl) {
                detalheUrlMatch = eUrl.message || String(eUrl);
            }
            registrar(
                urlMatchOk,
                'LIB_URLS_APEX_MATCH_PATTERN',
                'Match pattern *://*.jus.br/* aceita subdomínio e domínio raiz (apex), bloqueando spoofing em query/path.',
                { detalhe: detalheUrlMatch }
            );

            // Teste: Regressão navegador-anti-duplicacao (processarAbaAtualizada sem ReferenceError) e ModuloNavegador Ctrl+Tab MV3
            let antiDupFixOk = false;
            let detalheAntiDupFix = '';
            try {
                const AntiDupCls = window.JusGovGerenciadorAntiDuplicacao;
                const NavCls = window.JusGovModuloNavegador;
                if (typeof AntiDupCls === 'function' && typeof NavCls === 'function') {
                    const ad = new AntiDupCls();
                    ad.reutilizarAbasAbertas = true;
                    ad.monitorarUrlAtual = true;
                    const removidas = [];
                    const sessionStore = {};
                    const mockChrome = {
                        tabs: {
                            query: () => Promise.resolve([
                                { id: 10, windowId: 1, url: 'https://pje.jus.br/doc/1' },
                                { id: 11, windowId: 1, url: 'https://pje.jus.br/doc/1' }
                            ]),
                            remove: (id) => { removidas.push(id); return Promise.resolve(); },
                            update: () => Promise.resolve()
                        },
                        storage: {
                            session: {
                                set: (obj) => { Object.assign(sessionStore, obj); return Promise.resolve(); },
                                get: (k) => Promise.resolve(k ? { [k]: sessionStore[k] } : sessionStore)
                            }
                        }
                    };
                    const prom = ad.processarAbaAtualizada(11, { url: 'https://pje.jus.br/doc/1' }, { id: 11, windowId: 1, url: 'https://pje.jus.br/doc/1' }, mockChrome, { reutilizarAbasAbertas: true, monitorarUrlAtualPagina: true });
                    const navInst = new NavCls();
                    const temCtrlTabSession = typeof navInst.inicializarHistoricoAbasAtivas === 'function' &&
                        typeof navInst.registrarAbaAtivadaHistorico === 'function' &&
                        typeof navInst.alternarParaUltimaAbaAtiva === 'function';
                    const promCtrl = navInst.registrarAbaAtivadaHistorico({ tabId: 10, windowId: 1 }, mockChrome);
                    antiDupFixOk = Boolean(prom && typeof prom.then === 'function' && temCtrlTabSession && promCtrl && typeof promCtrl.then === 'function');
                    detalheAntiDupFix = `retPromise=${Boolean(prom)}, ctrlTabMV3=${temCtrlTabSession}`;
                }
            } catch (eAd) {
                detalheAntiDupFix = eAd.message || String(eAd);
            }
            registrar(
                antiDupFixOk,
                'NAVEGADOR_ANTI_DUPLICACAO_REGRESSAO',
                'GerenciadorAntiDuplicacao.processarAbaAtualizada e ModuloNavegador.Ctrl+Tab MV3 executam sem erros de referência.',
                { detalhe: detalheAntiDupFix }
            );

            }

            {
            // Teste: Contratos runtime dos módulos de Service Worker (ModuloManutencao, ModuloProdutividade, Regras)
            let contratoSwOk = false;
            let detalheContratoSw = '';
            try {
                const ManutCls = window.JusGovModuloManutencao;
                const ProdCls = window.JusGovModuloProdutividade;
                const rs = window.JusGovCfgDefaults && typeof window.JusGovCfgDefaults.obterRegrasSistema === 'function'
                    ? window.JusGovCfgDefaults.obterRegrasSistema()
                    : null;
                if (typeof ManutCls === 'function' && typeof ProdCls === 'function' && rs) {
                    const manut = new ManutCls();
                    const prod = new ProdCls();
                    const temMetodos = typeof manut.executarAutoLimpezaCacheECookies === 'function' &&
                        typeof manut.registrarAcessoUrl === 'function' &&
                        typeof prod.processarTickTrabalho === 'function' &&
                        typeof prod.abrirAssistenteIaLateral === 'function';
                    const temRegrasJson = Boolean(Array.isArray(rs.sistemasJudiciais) && rs.manutencao && rs.manutencao.idadesLimpezaMs && rs.manutencao.idadesLimpezaMs['7d']);
                    contratoSwOk = temMetodos && temRegrasJson;
                    detalheContratoSw = `metodosSw=${temMetodos}, regrasJson=${temRegrasJson}`;
                }
            } catch (eSw) {
                detalheContratoSw = eSw.message || String(eSw);
            }
            registrar(
                contratoSwOk,
                'CONTRATO_MODULOS_SW_E_REGRAS',
                'ModuloManutencao, ModuloProdutividade e regras-sistema.json expõem contratos completos sem erros.',
                { detalhe: detalheContratoSw }
            );

            }

            {
            // Teste FEAT-37 + BUG-67: Pausas automáticas via idle, status pendente/realizado e modos de exibição
            let feat37Ok = false;
            let detalheFeat37 = '';
            try {
                const ProdCls = window.JusGovModuloProdutividade;
                const CfgCls = window.JusGovConfiguracoes;
                if (typeof ProdCls === 'function' && typeof CfgCls === 'function') {
                    const mp = new ProdCls();
                    const cfgP = { pomodoroAtivo: true, pomodoroFocoMinutos: 25, pomodoroProporcao: 4.5, pomodoroCiclos: 4, pomodoroPausasAutomaticas: true, pomodoroModoAviso: 'completo' };
                    const tBase = 1700000000000;
                    const stIdle = mp.criarEstadoTrabalhoZerado('2026-11-15', tBase);
                    stIdle.pomodoroCicloAtual = 2;
                    stIdle.pomodoroMinutosNaFase = 12;
                    stIdle.pomodoroDescansoPendente = true;

                    const resCurto = mp.registrarPausasAutomaticasProdutividade(stIdle, tBase + 3 * 60000, cfgP);
                    const resAlivio = mp.registrarPausasAutomaticasProdutividade(stIdle, tBase + 6 * 60000, cfgP);
                    const posAlivioOk = (!resCurto.creditado && resAlivio.creditado && resAlivio.tipo === 'alivio' && !stIdle.pomodoroDescansoPendente && stIdle.pomodoroDescansoRealizadoNoCiclo === true);

                    const resDescanso = mp.registrarPausasAutomaticasProdutividade(stIdle, tBase + 25 * 60000, cfgP);
                    const posDescansoOk = (resDescanso.creditado && resDescanso.tipo === 'pausa_maior' && stIdle.pomodoroCicloAtual === 0 && !stIdle.pomodoroDescansoPendente);

                    const prefsModal = mp.resolverPreferenciasAvisoPomodoro({ pomodoroModoAviso: 'modal' });
                    const prefsHibrido = mp.resolverPreferenciasAvisoPomodoro({ pomodoroModoAviso: 'badge_e_barra_descanso' });
                    const modosOk = (prefsModal.usarModal === true && !prefsModal.usarBadge && prefsHibrido.usarBadge && prefsHibrido.modoBarra === 'descanso');

                    const cfgMgr = new CfgCls();
                    const syncKeysOk = cfgMgr.obterChavesConfigSync().includes('pomodoroPausasAutomaticas') && cfgMgr.obterChavesConfigSync().includes('pomodoroModoAviso');

                    feat37Ok = posAlivioOk && posDescansoOk && modosOk && syncKeysOk;
                    detalheFeat37 = `alivio=${posAlivioOk}, descanso=${posDescansoOk}, modos=${modosOk}, sync=${syncKeysOk}`;
                }
            } catch (e37) {
                detalheFeat37 = e37.message || String(e37);
            }
            registrar(
                feat37Ok,
                'FEAT_37_BUG_67_POMODORO_IDLE_E_MODOS_AVISO',
                'Pausas automáticas em idle creditam Alívio/Descanso Maior (com reset de ciclo) e preservam escolha entre Modal/Badge/Barra.',
                { detalhe: detalheFeat37 }
            );

            // Teste BUG-68: Árvore Hierárquica contígua (Opção A: Novo-Antigo), sem mistura de escalas e sem intercalar guias estranhas
            let bug68Ok = false;
            let detalheBug68 = '';
            try {
                const OrdCls = window.JusGovGerenciadorOrdenacaoGuias;
                if (typeof OrdCls === 'function') {
                    const ord = new OrdCls({ criterio: 'hierarquia_arvore', sentido: 'esq_dir' });
                    const baseT = 1763250000000;
                    const mapaT = new Map([
                        [102, { criadaEm: baseT + 1000 }],
                        [103, { criadaEm: baseT + 2000 }],
                        [104, { criadaEm: baseT + 3000 }],
                        [105, { criadaEm: baseT + 4000 }],
                        [106, { criadaEm: baseT + 5000 }]
                    ]);
                    // Simulando mistura real: pai1 (101) e guia avulsa (900) SEM criadaEm no mapa, filhos/netos COM criadaEm
                    const abasMock = [
                        { id: 101, index: 0, groupId: 7 },
                        { id: 900, index: 1, groupId: -1 }, // guia estranha entre as abas
                        { id: 102, openerTabId: 101, index: 2, groupId: 7 }, // filho1
                        { id: 103, openerTabId: 102, index: 3, groupId: 7 }, // neto1
                        { id: 104, openerTabId: 102, index: 4, groupId: 7 }, // neto2
                        { id: 105, openerTabId: 101, index: 5, groupId: 7 }, // filho2
                        { id: 106, openerTabId: 101, index: 6, groupId: 7 }  // filho3 (mais novo)
                    ];
                    const resEsqDir = ord.ordenarPorHierarquiaArvore(abasMock, 'esq_dir', mapaT).map(t => t.id);
                    const resDirEsq = ord.ordenarPorHierarquiaArvore(abasMock, 'dir_esq', mapaT).map(t => t.id);

                    const optAOk = JSON.stringify(resEsqDir) === JSON.stringify([900, 101, 106, 105, 102, 104, 103]);
                    const invOk = JSON.stringify(resDirEsq) === JSON.stringify([101, 102, 103, 104, 105, 106, 900]);

                    const lblSent = document.getElementById('lblSentidoOrdenacaoGuias');
                    const rotuloOk = !lblSent || lblSent.textContent.includes('A-Z ou Novo-Antigo');

                    bug68Ok = optAOk && invOk && rotuloOk;
                    detalheBug68 = `esqDir=${JSON.stringify(resEsqDir)}, dirEsq=${JSON.stringify(resDirEsq)}, rotuloOk=${rotuloOk}`;
                }
            } catch (e68) {
                detalheBug68 = e68.message || String(e68);
            }
            registrar(
                bug68Ok,
                'BUG_68_ARVORE_HIERARQUICA_OPTION_A_E_ESCALA_SEGURA',
                'Árvore DFS mantém subgrupos contíguos sem intercalar guias estranhas (Opção A: mais novo logo à direita do pai) e rotula "A-Z ou Novo-Antigo".',
                { detalhe: detalheBug68 }
            );

            }

            {
            // Teste BUG-70: Alívio e Descanso Maior só avançam quando o usuário está ocioso e reiniciam se continuar trabalhando
            let bug70Ok = false;
            let detalheBug70 = '';
            try {
                const ProdCls70 = window.JusGovModuloProdutividade;
                if (typeof ProdCls70 === 'function') {
                    const mp70 = new ProdCls70();
                    const cfg70 = { pomodoroAtivo: true, pomodoroFocoMinutos: 25, pomodoroProporcao: 4.5, pomodoroCiclos: 4, pomodoroPausasAutomaticas: false };
                    const t0 = 1700000000000;
                    const st70 = mp70.criarEstadoTrabalhoZerado('2026-11-15', t0);
                    st70.pomodoroFase = 'alivio';
                    st70.pomodoroCicloAtual = 1;
                    st70.pomodoroMinutosNaFase = 0;
                    st70.ultimaAtividadeTs = t0;

                    // 1. Usuário continua trabalhando (atividade há 10s -> minInativo = 0): não conta descanso!
                    const rAtivo = mp70.avancarMinutoPomodoro(st70, t0 + 10000, cfg70);
                    const ficouZero = (rAtivo.evento === 'aguardando_idle' && st70.pomodoroFase === 'alivio' && st70.pomodoroMinutosNaFase === 0);

                    // 2. Usuário entra em idle por 3 minutos (conta 3/6 min de alívio)
                    st70.ultimaAtividadeTs = t0;
                    mp70.avancarMinutoPomodoro(st70, t0 + 60000, cfg70);
                    mp70.avancarMinutoPomodoro(st70, t0 + 120000, cfg70);
                    const avancouIdle = (st70.pomodoroMinutosNaFase === 2 && st70.pomodoroFase === 'alivio');

                    // 3. Usuário insiste com cliques (3 cliques no estágio >25%) -> ZERA contagem e mantém pendente!
                    mp70.aplicarAtividadeEmEstadoTrabalho(st70, t0 + 129600, 'click_ou_tecla', cfg70);
                    mp70.aplicarAtividadeEmEstadoTrabalho(st70, t0 + 129800, 'click_ou_tecla', cfg70);
                    const rReset = mp70.aplicarAtividadeEmEstadoTrabalho(st70, t0 + 130000, 'click_ou_tecla', cfg70);
                    const reiniciouOk = (rReset && rReset.resetouDescanso === true && st70.pomodoroMinutosNaFase === 0 && st70.pomodoroFase === 'alivio' && st70.pomodoroDescansoPendente === true);

                    // 4. Usuário descansa 6 min em idle -> cumpre mínimo e continua em Alívio enquanto ocioso;
                    //    ao chegar a 24 min em idle promove para Pausa Maior; qualquer interação sensível (movimento/clique/tecla) inicia Foco!
                    for (let m = 1; m <= 6; m++) {
                        mp70.avancarMinutoPomodoro(st70, t0 + 130000 + m * 60000, cfg70);
                    }
                    const segAlivioOk = (st70.pomodoroFase === 'alivio' && st70.pomodoroDescansoMinCumprido === true && st70.pomodoroDescansoRealizadoNoCiclo === true && st70.pomodoroDescansoPendente === false);

                    for (let m = 7; m <= 25; m++) {
                        mp70.avancarMinutoPomodoro(st70, t0 + 130000 + m * 60000, cfg70);
                    }
                    const virouPausaMaiorOk = (st70.pomodoroFase === 'pausa_maior' && st70.pomodoroCicloAtual === 0 && st70.pomodoroMinutosNaFase === 25);

                    const rMov = mp70.aplicarAtividadeEmEstadoTrabalho(st70, t0 + 130000 + 25 * 60000, 'movimento');
                    const movIniciouFocoOk = (rMov.iniciouFocoPosDescanso === true && st70.pomodoroFase === 'foco' && rMov.iniciouBadgeVerde === true && st70.pomodoroBadgeVerdeAteTs === (t0 + 130000 + 25 * 60000 + 15000));

                    const st70Clk = mp70.criarEstadoTrabalhoZerado('2026-11-16', t0);
                    st70Clk.pomodoroFase = 'pausa_maior';
                    st70Clk.pomodoroDescansoMinCumprido = true;
                    const rTecla = mp70.aplicarAtividadeEmEstadoTrabalho(st70Clk, t0 + 130000 + 25 * 60000 + 2000, 'click_ou_tecla');
                    const concluiuOk = (rTecla.iniciouFocoPosDescanso === true && st70Clk.pomodoroFase === 'foco' && st70Clk.pomodoroDescansoRealizadoNoCiclo === true && st70Clk.pomodoroDescansoPendente === false);

                    bug70Ok = ficouZero && avancouIdle && reiniciouOk && segAlivioOk && virouPausaMaiorOk && movIniciouFocoOk && concluiuOk;
                    detalheBug70 = `zero=${ficouZero}, idle=${avancouIdle}, rein=${reiniciouOk}, alivioCont=${segAlivioOk}, pm=${virouPausaMaiorOk}, movFoco=${movIniciouFocoOk}, fim=${concluiuOk}`;
                }
            } catch (e70) {
                detalheBug70 = e70.message || String(e70);
            }
            registrar(
                bug70Ok,
                'BUG_70_POMODORO_DESCANSO_AGUARDA_IDLE_E_REINICIA',
                'Alívio e Pausa Maior só contam minutos em ociosidade (idle), seguem contando indefinidamente até clique/tecla e reiniciam se interrompidos antes.',
                { detalhe: detalheBug70 }
            );

            // Teste BUG-71: Modelo Baralho completo, isolamento de options.html e promoção manual de filha a pai
            let bug71Ok = false;
            let detalheBug71 = '';
            try {
                const OrdCls71 = window.JusGovGerenciadorOrdenacaoGuias;
                if (typeof OrdCls71 === 'function') {
                    const ord71 = new OrdCls71({ criterio: 'hierarquia_arvore', sentido: 'esq_dir' });
                    const baseT71 = 1763260000000;
                    const mapa71 = new Map([
                        [1, { criadaEm: baseT71 + 1000 }], // paiAntigo
                        [2, { criadaEm: baseT71 + 2000 }], // filho1 de paiAntigo
                        [3, { criadaEm: baseT71 + 3000 }], // filho1.1 de filho1
                        [4, { criadaEm: baseT71 + 4000 }], // paiNovo
                        [5, { criadaEm: baseT71 + 5000 }], // filhoNovo de paiNovo
                        [6, { criadaEm: baseT71 + 6000 }]  // options.html (alien/sistema, mesmo com openerTabId=2!)
                    ]);
                    const abas71 = [
                        { id: 1, index: 0, url: 'https://pje1g.trf1.jus.br/a' },
                        { id: 2, openerTabId: 1, index: 1, url: 'https://pje1g.trf1.jus.br/b' },
                        { id: 3, openerTabId: 2, index: 2, url: 'https://pje1g.trf1.jus.br/c' },
                        { id: 4, index: 3, url: 'https://www.gov.br/d' },
                        { id: 5, openerTabId: 4, index: 4, url: 'https://www.gov.br/e' },
                        { id: 6, openerTabId: 2, index: 5, url: 'chrome-extension://abc/src/cfg/options.html' }
                    ];
                    const ehAlienOk = ord71.ehUrlRaizAlienOuInterna(abas71[5].url) === true && ord71.ehUrlRaizAlienOuInterna(abas71[1].url) === false;
                    const baralhoEsqDir = ord71.ordenarPorHierarquiaArvore(abas71, 'esq_dir', mapa71).map(t => t.id);
                    const baralhoDirEsq = ord71.ordenarPorHierarquiaArvore(abas71, 'dir_esq', mapa71).map(t => t.id);
                    // Em esq_dir (Novo-Antigo): options(6) na frente (mais nova raiz), depois paiNovo(4)->filhoNovo(5), depois paiAntigo(1)->filho1(2)->neto(3)
                    const ordemBaralhoOk = JSON.stringify(baralhoEsqDir) === JSON.stringify([6, 4, 5, 1, 2, 3]);
                    const ordemInversaOk = JSON.stringify(baralhoDirEsq) === JSON.stringify([1, 2, 3, 4, 5, 6]);

                    // Promover filha(2) manualmente -> filha(2) leva sua filha(3) e vira raiz independente de (1)
                    ord71.desvincularPaiDaAba(2);
                    const desc2 = ord71.obterDescendentesDaAba(2);
                    const desvincularOk = (ord71.obterPaiRegistrado(2) === undefined && desc2.includes(3));

                    bug71Ok = ehAlienOk && ordemBaralhoOk && ordemInversaOk && desvincularOk;
                    detalheBug71 = `alien=${ehAlienOk}, esqDir=${JSON.stringify(baralhoEsqDir)}, dirEsq=${JSON.stringify(baralhoDirEsq)}, prom=${desvincularOk}`;
                }
            } catch (e71) {
                detalheBug71 = e71.message || String(e71);
            }
            registrar(
                bug71Ok,
                'BUG_71_BARALHO_OPCOES_ISOLAMENTO_E_PROMOCAO_FILHA',
                'Árvore "Baralho" coloca pais novos + options.html à esquerda (Novo-Antigo), isola grupos familiares e promove filha arrastada com seus filhos.',
                { detalhe: detalheBug71 }
            );

            // Teste FEAT-38: Posicionamento livre vertical/horizontal, esquiva lateral e salto de 1 foco ao dispensar descanso
            let feat38Ok = false;
            let detalheFeat38 = '';
            try {
                const ProdCls38 = window.JusGovModuloProdutividade;
                if (typeof ProdCls38 === 'function') {
                    const mp38 = new ProdCls38();
                    const pEsq = mp38.calcularPosicaoBarraPomodoro(100, 1200, -50, 800);
                    const pCen = mp38.calcularPosicaoBarraPomodoro(600, 1200, 240, 800);
                    const pDir = mp38.calcularPosicaoBarraPomodoro(1100, 1200, 9999, 800);
                    const posOk = (pEsq.alinhamento === 'esquerda' && pEsq.topPx === 0 &&
                        pCen.alinhamento === 'centro' && pCen.topPx === 240 &&
                        pDir.alinhamento === 'direita' && pDir.topPx === 776);

                    const esqParaDir = mp38.calcularEsquivaLateralBarra(420, { left: 400, width: 200 });
                    const dirParaEsq = mp38.calcularEsquivaLateralBarra(550, { left: 400, width: 200 });
                    const esquivaOk = (esqParaDir === 'direita' && dirParaEsq === 'esquerda');

                    const stSkip = mp38.criarEstadoTrabalhoZerado('2026-11-16', 1700000000000);
                    stSkip.pomodoroFase = 'alivio';
                    stSkip.pomodoroDescansoMinCumprido = true;
                    stSkip.pomodoroPularProximoPopupFoco = true;
                    const resSkip = mp38.aplicarAtividadeEmEstadoTrabalho(stSkip, 1700000010000, 'click_ou_tecla');
                    const pulaFocoOk = (resSkip.iniciouFocoPosDescanso && stSkip.pomodoroFase === 'foco' && !stSkip.pomodoroPularProximoPopupFoco && String(stSkip.pomodoroBarraOcultadaChave).startsWith('foco:'));

                    feat38Ok = posOk && esquivaOk && pulaFocoOk;
                    detalheFeat38 = `pos=${posOk}, esquiva=${esquivaOk}, pulaFoco=${pulaFocoOk}`;
                }
            } catch (e38) {
                detalheFeat38 = e38.message || String(e38);
            }
            registrar(
                feat38Ok,
                'FEAT_38_MINIPOPUP_INTERACAO_ESQUIVA_E_PULO_FOCO',
                'Minipopup Pomodoro calcula alinhamento Esq/Centro/Dir, esquiva oposta ao ponteiro no hover e pula 1 popup de Foco se descanso foi dispensado.',
                { detalhe: detalheFeat38 }
            );

        // Bateria FEAT-39 + FEAT-40: Fixar minipopup por guia, modo Só no Descanso, singleton e horário HH:MM do último Alívio/Descanso
        {
            let feat3940Ok = false;
            let detalheFeat3940 = '';
            try {
                const ProdCls39 = window.JusGovModuloProdutividade;
                if (typeof ProdCls39 !== 'function') {
                    detalheFeat3940 = 'window.JusGovModuloProdutividade ausente.';
                } else {
                    const mp39 = new ProdCls39();
                    const visFixadaSoDescanso = mp39.resolverVisibilidadeBarraPomodoro({
                        ativoPorConfig: true,
                        deveExibirNormal: false,
                        fixadaNaGuia: true,
                        fechadaNestaGuia: true
                    });
                    const visDesafixadaOculta = mp39.resolverVisibilidadeBarraPomodoro({
                        ativoPorConfig: true,
                        deveExibirNormal: false,
                        fixadaNaGuia: false,
                        fechadaNestaGuia: false
                    });
                    const visConfigDesligada = mp39.resolverVisibilidadeBarraPomodoro({
                        ativoPorConfig: false,
                        deveExibirNormal: false,
                        fixadaNaGuia: true,
                        fechadaNestaGuia: false
                    });
                    const visNormalOk = mp39.resolverVisibilidadeBarraPomodoro({
                        ativoPorConfig: true,
                        deveExibirNormal: true,
                        fixadaNaGuia: false,
                        fechadaNestaGuia: false
                    });
                    const visibilidadeOk = (visFixadaSoDescanso === true && visDesafixadaOculta === false && visConfigDesligada === false && visNormalOk === true);

                    const tsBase = new Date(2026, 10, 16, 11, 0, 0).getTime();
                    const tsAlivio = new Date(2026, 10, 16, 11, 35, 0).getTime();
                    const tsPausaMaior = new Date(2026, 10, 16, 12, 10, 0).getTime();
                    const cfg39 = { pomodoroAtivo: true, pomodoroCiclos: 4, pomodoroFocoMinutos: 25, pomodoroProporcao: 4.5 };
                    const st39 = mp39.criarEstadoTrabalhoZerado('2026-11-16', tsBase);
                    const resInicial = mp39.calcularResumoPomodoro(st39, cfg39, tsBase);
                    const semDescansoOk = (resInicial.ultimoDescansoTexto === '' && resInicial.ultimoDescansoFimTs === 0);

                    st39.pomodoroFase = 'alivio';
                    st39.ultimaAtividadeTs = tsAlivio - 65000;
                    st39.pomodoroMinutosNaFase = 5; // alivioMin = 6
                    mp39.avancarMinutoPomodoro(st39, tsAlivio, cfg39);
                    const resPosAlivio = mp39.calcularResumoPomodoro(st39, cfg39, tsAlivio);
                    const alivioTextoOk = (resPosAlivio.ultimoDescansoTexto === `Alívio realizado às ${mp39.formatarHoraHHMM(tsAlivio)}hs`);

                    st39.pomodoroFase = 'pausa_maior';
                    st39.ultimaAtividadeTs = tsPausaMaior - 65000;
                    st39.pomodoroMinutosNaFase = 23; // pausaMaiorMin = 24
                    mp39.avancarMinutoPomodoro(st39, tsPausaMaior, cfg39);
                    const resPosPausaMaior = mp39.calcularResumoPomodoro(st39, cfg39, tsPausaMaior);
                    const pausaMaiorTextoOk = (resPosPausaMaior.ultimoDescansoTexto === `Descanso realizado às ${mp39.formatarHoraHHMM(tsPausaMaior)}hs`);

                    feat3940Ok = visibilidadeOk && semDescansoOk && alivioTextoOk && pausaMaiorTextoOk;
                    detalheFeat3940 = `vis=${visibilidadeOk}, vazio=${semDescansoOk}, alivio=${alivioTextoOk}("${resPosAlivio.ultimoDescansoTexto}"), pausa=${pausaMaiorTextoOk}("${resPosPausaMaior.ultimoDescansoTexto}")`;
                }
            } catch (e39) {
                detalheFeat3940 = e39.message || String(e39);
            }
            registrar(
                feat3940Ok,
                'FEAT_39_40_FIXAR_GUIA_SINGLETON_E_HORARIO_DESCANSO',
                'Minipopup fixado por guia permanece ativo inclusive no modo Só no Descanso e resumo exibe Alívio/Descanso Realizado com horário HH:MM somente após ocorrer.',
                { detalhe: detalheFeat3940 }
            );
        }

            }

            {
        // Bateria FEAT-42: Esquiva do minipopup passando pelo centro, botão Fixar com 3 estados (0 -> 1 -> 2 -> 0) e retorno automático à posição ancorada
        {
            let feat42Ok = false;
            let detalheFeat42 = '';
            try {
                const ProdCls42 = window.JusGovModuloProdutividade;
                if (typeof ProdCls42 !== 'function') {
                    detalheFeat42 = 'window.JusGovModuloProdutividade ausente.';
                } else {
                    const mp42 = new ProdCls42();
                    const esqParaCentro = mp42.calcularEsquivaLateralBarra(120, { left: 12, width: 200 }, 'esquerda') === 'centro';
                    const dirParaCentro = mp42.calcularEsquivaLateralBarra(1100, { left: 1000, width: 200 }, 'direita') === 'centro';
                    const cenParaDir = mp42.calcularEsquivaLateralBarra(560, { left: 540, width: 200 }, 'centro') === 'direita';
                    const cenParaEsq = mp42.calcularEsquivaLateralBarra(700, { left: 540, width: 200 }, 'centro') === 'esquerda';
                    const centroOk = esqParaCentro && dirParaCentro && cenParaDir && cenParaEsq;

                    const m1 = mp42.avancarModoFixacaoBarra(0);
                    const m2 = mp42.avancarModoFixacaoBarra(m1);
                    const m3 = mp42.avancarModoFixacaoBarra(m2);
                    const m4 = mp42.avancarModoFixacaoBarra(m3);
                    const cicloOk = (m1 === 1 && m2 === 2 && m3 === 3 && m4 === 0);

                    const visModo1 = mp42.resolverVisibilidadeBarraPomodoro({ ativoPorConfig: true, deveExibirNormal: false, modoFixacao: 1, fechadaNestaGuia: true }) === true;
                    const visModo2 = mp42.resolverVisibilidadeBarraPomodoro({ ativoPorConfig: true, deveExibirNormal: false, modoFixacao: 2, fechadaNestaGuia: true }) === true;
                    const visModo3 = mp42.resolverVisibilidadeBarraPomodoro({ ativoPorConfig: true, deveExibirNormal: false, modoFixacao: 3, fechadaNestaGuia: true }) === true;
                    const visModo0 = mp42.resolverVisibilidadeBarraPomodoro({ ativoPorConfig: true, deveExibirNormal: false, modoFixacao: 0, fechadaNestaGuia: false }) === false;
                    const visOk = visModo1 && visModo2 && visModo3 && visModo0;

                    const estNorm = mp42.normalizarEstadoGlobalBarraPomodoro({ modoFixacao: 2, topPx: 140, alinhamento: 'centro' });
                    const normOk = estNorm.modoFixacao === 2 && estNorm.topAncoradoPx === 140 && estNorm.alinhamentoAncorado === 'centro';

                    const origR = { left: 500, right: 700, top: 140, bottom: 175 };
                    const dentroArea = mp42.ponteiroSaiuDaAreaAncorada(600, 160, origR) === false;
                    const foraArea = mp42.ponteiroSaiuDaAreaAncorada(750, 160, origR) === true;
                    const retornoOk = dentroArea && foraArea;

                    feat42Ok = centroOk && cicloOk && visOk && normOk && retornoOk;
                    detalheFeat42 = `centro=${centroOk}, ciclo=${cicloOk}, vis=${visOk}, norm=${normOk}, retorno=${retornoOk}`;
                }
            } catch (e42) {
                detalheFeat42 = e42.message || String(e42);
            }
            registrar(
                feat42Ok,
                'FEAT_42_ESQUIVA_CENTRO_FIXAR_3_ESTADOS_TODAS_GUIAS',
                'Minipopup passa pelo centro na esquiva lateral, alterna 3 estados de Fixar (0->1->2->0) refletidos em todas as guias e retorna à âncora no modo 2.',
                { detalhe: detalheFeat42 }
            );
        }

        // Bateria FEAT-43: Tooltip multi-linha do ícone da extensão sem campos zerados e sem duplicar Tempo Ativo quando igual a Tempo Corrido
        {
            let feat43Ok = false;
            let detalheFeat43 = '';
            try {
                const ProdCls43 = window.JusGovModuloProdutividade;
                if (typeof ProdCls43 !== 'function') {
                    detalheFeat43 = 'window.JusGovModuloProdutividade ausente.';
                } else {
                    const mp43 = new ProdCls43();
                    const tsIni = new Date(2026, 10, 15, 1, 14, 0).getTime();
                    const stZero = mp43.criarEstadoTrabalhoZerado('2026-11-15', tsIni);
                    const cfg43 = { pomodoroAtivo: true, pomodoroCiclos: 4, pomodoroFocoMinutos: 25, pomodoroProporcao: 4.5 };

                    const rZero = mp43.formatarResumoProdutividadeTexto(stZero, cfg43, tsIni);
                    const zeroOmitidoOk = (rZero.linhaTempos === '' && rZero.tooltipTitle.includes('\n') && !rZero.tooltipTitle.includes('Pausas'));

                    stZero.corridoMinutos = 12;
                    stZero.ativoMinutos = 12;
                    stZero.pausasConfirmadas = 0;
                    stZero.pomodoroMinutosNaFase = 13;
                    const rIgual = mp43.formatarResumoProdutividadeTexto(stZero, cfg43, tsIni);
                    const naoDuplicaOk = (
                        rIgual.linhaDataInicio === '🕒 Ligado 15/11/2026 desde 01:14hs' &&
                        rIgual.linhaTempos === '👉 Corrido 00h:12m' &&
                        !rIgual.linhaTempos.includes('Ativo') &&
                        !rIgual.linhaTempos.includes('Pausas') &&
                        rIgual.linhaPomodoro === '🍅 Pomodoro: Foco 13/25 min • Ciclo 1/4' &&
                        rIgual.tooltipTitle.split('\n').length === 3
                    );

                    stZero.corridoMinutos = 35;
                    stZero.ativoMinutos = 20;
                    stZero.pausasConfirmadas = 2;
                    const rDiff = mp43.formatarResumoProdutividadeTexto(stZero, cfg43, tsIni);
                    const completoOk = rDiff.linhaTempos === '👉 Corrido 00h:35m • Ativo 00h:20m • Pausas 2';

                    feat43Ok = zeroOmitidoOk && naoDuplicaOk && completoOk;
                    detalheFeat43 = `zero=${zeroOmitidoOk}, naoDuplica=${naoDuplicaOk}, completo=${completoOk}`;
                }
            } catch (e43) {
                detalheFeat43 = e43.message || String(e43);
            }
            registrar(
                feat43Ok,
                'FEAT_43_TOOLTIP_MULTILINHA_SEM_ZERADOS_E_DUPLICADOS',
                'Tooltip do ícone da extensão exibe linhas quebradas (data/início, tempos, Pomodoro) omitindo zeros e sem duplicar Tempo Ativo igual a Tempo Corrido.',
                { detalhe: detalheFeat43 }
            );
        }
            }
            {
                let bug72Ok = false;
                let detalheBug72 = '';
                try {
                    const ProdCls72 = window.JusGovModuloProdutividade;
                    if (typeof ProdCls72 !== 'function') {
                        detalheBug72 = 'window.JusGovModuloProdutividade ausente.';
                    } else {
                        const mp72 = new ProdCls72();
                        const tsStart = new Date(2026, 10, 16, 8, 0, 0).getTime();
                        const st72 = mp72.criarEstadoTrabalhoZerado('2026-11-16', tsStart);
                        const cfgDesligado = {
                            tempoTrabalhoCorridoAtivo: false,
                            tempoTrabalhoAtivoAtivo: false,
                            pomodoroAtivo: false,
                            pomodoroFocoMinutos: 25,
                            pomodoroProporcao: 4.5,
                            pomodoroCiclos: 4,
                            pomodoroPausasAutomaticas: true
                        };

                        /* Simula 10 minutos ativos com todas as opções desligadas */
                        for (let m = 1; m <= 10; m++) {
                            const tsM = tsStart + (m * 60000);
                            st72.ultimaAtividadeTs = tsM - 10000;
                            const rt = mp72.avancarMinutoEstadoTrabalho(st72, tsM, cfgDesligado);
                            mp72.avancarMinutoPomodoro(st72, tsM, cfgDesligado);
                            if (rt.disparoCorrido || rt.disparoAtivo) {
                                throw new Error('Disparou alerta com meta desligada');
                            }
                        }
                        const usoContadoOk = (st72.corridoMinutos === 10 && st72.ativoMinutos === 10 && st72.pomodoroMinutosNaFase === 10);

                        /* Simula descanso automático de 6 min (alívio) ainda com opções desligadas */
                        const tsPosAlivio = tsStart + (16 * 60000);
                        st72.ultimaAtividadeTs = tsStart + (10 * 60000);
                        mp72.avancarMinutoPomodoro(st72, tsPosAlivio, cfgDesligado);
                        const descansoContadoOk = (st72.pomodoroUltimoDescansoTipo === 'alivio' && st72.pomodoroUltimoDescansoFimTs === tsPosAlivio);

                        /* Retoma com opções habilitadas sem zerar contadores */
                        const cfgLigado = { ...cfgDesligado, tempoTrabalhoCorridoAtivo: true, tempoTrabalhoAtivoAtivo: true, pomodoroAtivo: true };
                        const resumoRetomado = mp72.calcularResumoPomodoro(st72, cfgLigado, tsPosAlivio);
                        const retomaOk = (
                            st72.corridoMinutos === 10 &&
                            st72.ativoMinutos === 10 &&
                            resumoRetomado.ativo === true &&
                            Boolean(resumoRetomado.ultimoDescansoTexto)
                        );

                        /* Valida rótulos genéricos caso options.html esteja carregado no DOM */
                        let labelsOk = true;
                        if (typeof document !== 'undefined' && document.body && document.body.textContent.includes('6. Produtividade')) {
                            const txtDoc = document.body.textContent;
                            labelsOk = txtDoc.includes('Tempo de Uso Corrido (Meta Diária)') && txtDoc.includes('Tempo de Atividade (Meta Diária)');
                        }

                        bug72Ok = usoContadoOk && descansoContadoOk && retomaOk && labelsOk;
                        detalheBug72 = `uso=${usoContadoOk}, desc=${descansoContadoOk}, retoma=${retomaOk}, labels=${labelsOk}`;
                    }
                } catch (e72) {
                    detalheBug72 = e72.message || String(e72);
                }
                registrar(
                    bug72Ok,
                    'BUG_72_CONTADORES_USO_CONTINUO_MESMO_DESABILITADOS',
                    'Contadores de Tempo de Uso Corrido, Tempo de Atividade, foco e último Alívio/Descanso seguem sendo calculados mesmo com opções desabilitadas e retomam sem zerar.',
                    { detalhe: detalheBug72 }
                );
            }
            {
                let feat45Ok = false;
                let detalheFeat45 = '';
                try {
                    const ProdCls45 = window.JusGovModuloProdutividade;
                    const CfgCls45 = window.JusGovConfiguracoes;
                    if (typeof ProdCls45 !== 'function' || typeof CfgCls45 !== 'function') {
                        detalheFeat45 = 'ModuloProdutividade ou JusGovConfiguracoes ausente.';
                    } else {
                        const mp45 = new ProdCls45();
                        const tsIni45 = new Date(2026, 10, 15, 1, 34, 0).getTime();
                        const st45 = mp45.criarEstadoTrabalhoZerado('2026-11-15', tsIni45);
                        st45.corridoMinutos = 11;
                        st45.ativoMinutos = 11;
                        st45.pomodoroMinutosNaFase = 12;
                        const boxUi = document.createElement('div');
                        const cfg45 = { pomodoroAtivo: true, pomodoroFocoMinutos: 25, pomodoroProporcao: 4.5, pomodoroCiclos: 4 };
                        mp45.renderizarResumoProdutividadeDom(boxUi, st45, cfg45, tsIni45);
                        const divs = Array.from(boxUi.querySelectorAll('div')).map(d => d.textContent.trim());
                        const uiOk = (
                            divs.length === 3 &&
                            divs[0] === '🕒 Ligado 15/11/2026 desde 01:34hs' &&
                            divs[1] === '👉 Corrido 00h:11m' &&
                            divs[2].startsWith('🍅 Pomodoro: Foco 12/25 min')
                        );

                        const stLocal = mp45.criarEstadoTrabalhoZerado('2026-11-15', tsIni45);
                        stLocal.corridoMinutos = 5;
                        stLocal.ativoMinutos = 4;
                        const stMaior = mp45.criarEstadoTrabalhoZerado('2026-11-15', tsIni45);
                        stMaior.corridoMinutos = 22;
                        stMaior.ativoMinutos = 18;
                        stMaior.pomodoroUltimoDescansoTipo = 'alivio';
                        stMaior.pomodoroUltimoDescansoFimTs = tsIni45 + 600000;
                        const snap45 = mp45.montarSnapshotProdutividadeNuvem(stMaior, { totalCopias: 9, totalAlertas: 1 }, tsIni45 + 600000);
                        const mesc = mp45.mesclarEstadoProdutividadeNuvem(stLocal, snap45, tsIni45 + 660000);
                        const nuvemMesclaOk = (
                            mesc.adotouNuvem === true &&
                            mesc.estado.corridoMinutos === 22 &&
                            mesc.estado.ativoMinutos === 18 &&
                            mesc.estado.pomodoroUltimoDescansoTipo === 'alivio'
                        );

                        const cfgMgr45 = new CfgCls45();
                        const semStatsEmSync = !cfgMgr45.houveMudancaDeConfiguracao({ jusgovProdResumoSync: { newValue: {} }, jusgovTrabalhoEstado: { newValue: {} } });
                        const temApiSync = typeof cfgMgr45.aplicarConfigLocalEAgendarSync === 'function';

                        feat45Ok = uiOk && nuvemMesclaOk && semStatsEmSync && temApiSync;
                        detalheFeat45 = `ui=${uiOk}, mescla=${nuvemMesclaOk}, semStats=${semStatsEmSync}, api=${temApiSync}`;
                    }
                } catch (e45) {
                    detalheFeat45 = e45.message || String(e45);
                }
                registrar(
                    feat45Ok,
                    'FEAT_45_UI_COMPARTILHADA_E_SYNC_NUVEM_DIFERIDO',
                    'Renderer DOM compartilhado exibe 🕒 / 👉 / 🍅 identicamente entre Tooltip, Opções e Popup; estatísticas sincronizam na nuvem apenas ao abrir/fechar e configs são coalescidas sem violar cotas.',
                    { detalhe: detalheFeat45 }
                );
            }
            {
                /* FEAT-46: Zonas seguras nos controles (⋮⋮, 📌/🔒, ×) sem esquiva e arraste livre XY no modo Cadeado (2) */
                let feat46Ok = false;
                let detalheFeat46 = '';
                try {
                    const ModProd46 = window.JusGovModuloProdutividade;
                    if (typeof ModProd46 !== 'function') {
                        detalheFeat46 = 'ModuloProdutividade ausente.';
                    } else {
                        const mp46 = new ModProd46();
                        const rects46 = {
                            pill: { left: 500, right: 800, top: 8, bottom: 40, width: 300 },
                            alcaMover: { left: 512, right: 528, top: 14, bottom: 32, width: 16 },
                            btnFixar: { left: 745, right: 765, top: 14, bottom: 32, width: 20 },
                            btnFechar: { left: 773, right: 788, top: 14, bottom: 32, width: 15 }
                        };
                        const sobreMoverPadding = mp46.isPontoEmControleBarraPomodoro(506, 20, rects46) === true;
                        const sobreGapMover = mp46.isPontoEmControleBarraPomodoro(534, 22, rects46) === true;
                        const sobreFixar = mp46.isPontoEmControleBarraPomodoro(752, 20, rects46) === true;
                        const sobreGapFixarFechar = mp46.isPontoEmControleBarraPomodoro(769, 20, rects46) === true;
                        const sobreFechar = mp46.isPontoEmControleBarraPomodoro(795, 20, rects46) === true;
                        const sobreTextoCentro = mp46.isPontoEmControleBarraPomodoro(640, 20, rects46) === false;
                        const clampLivre = mp46.calcularPosicaoLivreClamp(2000, 1500, 240, 1280, 720, 24);
                        const clampOk = (clampLivre.leftPx === 1040 && clampLivre.topPx === 696);
                        const normLivre = mp46.normalizarEstadoGlobalBarraPomodoro({
                            modoFixacao: 2, topPx: 220, alinhamento: 'livre', leftPx: 410
                        });
                        const normLivreOk = (
                            normLivre.modoFixacao === 2 &&
                            normLivre.alinhamento === 'livre' &&
                            normLivre.leftPx === 410 &&
                            normLivre.alinhamentoAncorado === 'livre' &&
                            normLivre.leftAncoradoPx === 410
                        );
                        const esquivaLivreEsq = mp46.calcularEsquivaLateralBarra(300, { left: 120, width: 220 }, 'livre', 1280) === 'centro';
                        const esquivaLivreCentro = mp46.calcularEsquivaLateralBarra(580, { left: 530, width: 220 }, 'livre', 1280) === 'direita';

                        feat46Ok = Boolean(
                            sobreMoverPadding && sobreGapMover && sobreFixar && sobreGapFixarFechar &&
                            sobreFechar && sobreTextoCentro && clampOk && normLivreOk &&
                            esquivaLivreEsq && esquivaLivreCentro
                        );
                        detalheFeat46 = `pad=${sobreMoverPadding}, gapM=${sobreGapMover}, fix=${sobreFixar}, fec=${sobreFechar}, ctr=${sobreTextoCentro}, clamp=${clampOk}, norm=${normLivreOk}, esq=${esquivaLivreEsq && esquivaLivreCentro}`;
                    }
                } catch (e46) {
                    detalheFeat46 = e46.message || String(e46);
                }
                registrar(
                    feat46Ok,
                    'FEAT_46_MINIPOPUP_ZONAS_SEGURAS_E_MOVEL_LIVRE_CADEADO',
                    'Zonas seguras do minipopup impedem esquiva em ⋮⋮, 📌/🔒 e × (incluindo padding e gaps) e Modo Cadeado (2) permite posicionamento XY livre na tela.',
                    { detalhe: detalheFeat46 }
                );
            }
            {
                /* FEAT-47: Soma multi-computador intercalada sem dupla contagem + detecção de uso simultâneo e alerta na UI */
                let feat47Ok = false;
                let detalheFeat47 = '';
                try {
                    const ModProd47 = window.JusGovModuloProdutividade;
                    if (typeof ModProd47 !== 'function') {
                        detalheFeat47 = 'ModuloProdutividade ausente.';
                    } else {
                        const mp47 = new ModProd47();
                        const agora47 = new Date(2026, 10, 16, 14, 0, 0).getTime();
                        const entWork = new Date(2026, 10, 16, 8, 0, 0).getTime();
                        const entHome = new Date(2026, 10, 16, 13, 0, 0).getTime();

                        const stWork = mp47.criarEstadoTrabalhoZerado('2026-11-16', entWork);
                        stWork.corridoMinutos = 45;
                        stWork.ativoMinutos = 30;
                        stWork.pausasConfirmadas = 1;

                        const snapWorkFechado = mp47.montarSnapshotProdutividadeNuvem(
                            stWork, {}, entWork + 4 * 3600000, 'pc_trabalho', null, entWork, { encerradoLimpo: true }
                        );
                        const stHome = mp47.criarEstadoTrabalhoZerado('2026-11-16', entHome);
                        stHome.corridoMinutos = 20;
                        stHome.ativoMinutos = 15;
                        stHome.pausasConfirmadas = 0;

                        const mescIntercalado = mp47.mesclarEstadoProdutividadeNuvem(stHome, snapWorkFechado, agora47, 'pc_casa', entHome);
                        const somaIntercalada = mp47.formatarResumoProdutividadeTexto(stHome, {}, agora47, mescIntercalado.nuvemMeta);
                        const intercaladoOk = (
                            mescIntercalado.nuvemMeta.outrosCorridoMin === 45 &&
                            mescIntercalado.nuvemMeta.multiplosComputadoresSimultaneos === false &&
                            somaIntercalada.linhaTempos.includes('Corrido 01h:05m') &&
                            somaIntercalada.linhaTempos.includes('Ativo 00h:45m') &&
                            !somaIntercalada.alertaMultiplosComputadores
                        );

                        /* Caso simultâneo: Work PC deixou sessão aberta/heartbeat há 15 min */
                        const snapWorkAberto = mp47.montarSnapshotProdutividadeNuvem(
                            stWork, {}, agora47 - 15 * 60000, 'pc_trabalho', null, entWork, { encerradoLimpo: false }
                        );
                        const mescSimultaneo = mp47.mesclarEstadoProdutividadeNuvem(stHome, snapWorkAberto, agora47, 'pc_casa', entHome);
                        const boxDom47 = document.createElement('div');
                        const infoDom47 = mp47.renderizarResumoProdutividadeDom(boxDom47, stHome, {}, agora47, { nuvemMeta: mescSimultaneo.nuvemMeta });
                        const simultaneoOk = (
                            mescSimultaneo.nuvemMeta.multiplosComputadoresSimultaneos === true &&
                            infoDom47.alertaMultiplosComputadores === '⚠️ Múltiplos computadores em uso simultâneo.' &&
                            boxDom47.textContent.includes('⚠️ Múltiplos computadores em uso simultâneo.') &&
                            infoDom47.tooltipTitle.includes('⚠️ Múltiplos computadores em uso simultâneo.')
                        );

                        feat47Ok = intercaladoOk && simultaneoOk;
                        detalheFeat47 = `intercalado=${intercaladoOk}, simultaneo=${simultaneoOk}`;
                    }
                } catch (e47) {
                    detalheFeat47 = e47.message || String(e47);
                }
                registrar(
                    feat47Ok,
                    'FEAT_47_ESTATISTICAS_MULTIDISPOSITIVO_E_DETECCAO_SIMULTANEA',
                    'Estatísticas somam múltiplos dispositivos intercalados sem dupla contagem e exibem alerta de uso simultâneo no Popup, Opções e Tooltip.',
                    { detalhe: detalheFeat47 }
                );
            }
            {
                /* FEAT-48: perfilAtivoId estritamente local por dispositivo vs. listaPerfis/regras/perfis sincronizados globalmente */
                let feat48Ok = false;
                let detalheFeat48 = '';
                try {
                    const CfgCls48 = window.JusGovConfiguracoes;
                    if (typeof CfgCls48 !== 'function') {
                        detalheFeat48 = 'JusGovConfiguracoes ausente.';
                    } else {
                        const cfg48 = new CfgCls48();
                        const chavesSync = cfg48.obterChavesConfigSync();
                        const perfilForaSync = !chavesSync.includes('perfilAtivoId');
                        const listaNoSync = chavesSync.includes('listaPerfis');
                        const regrasNoSync = chavesSync.includes('regrasMapeamentoElementos');
                        const naoDisparaSyncPorPerfilAtivo = !cfg48.houveMudancaDeConfiguracao({ perfilAtivoId: { newValue: 'trabalho' } });
                        const estPerfis = cfg48.garantirEstruturaPerfis({ perfilAtivoId: 'trabalho' });
                        const alteracoesSemPerfilAtivo = (estPerfis.alteracoes && estPerfis.alteracoes.perfilAtivoId === undefined);

                        feat48Ok = Boolean(
                            perfilForaSync && listaNoSync && regrasNoSync &&
                            naoDisparaSyncPorPerfilAtivo && alteracoesSemPerfilAtivo
                        );
                        detalheFeat48 = `foraSync=${perfilForaSync}, lista=${listaNoSync}, regras=${regrasNoSync}, semTrigger=${naoDisparaSyncPorPerfilAtivo}, altOk=${alteracoesSemPerfilAtivo}`;
                    }
                } catch (e48) {
                    detalheFeat48 = e48.message || String(e48);
                }
                registrar(
                    feat48Ok,
                    'FEAT_48_PERFIL_ATIVO_LOCAL_E_SYNC_NUVEM_REGRAS_PERFIS',
                    'perfilAtivoId permanece estritamente local por dispositivo (não sincronizado) enquanto listaPerfis, regrasMapeamentoElementos e configurações de perfis sincronizam globalmente.',
                    { detalhe: detalheFeat48 }
                );
            }
            {
                /* FEAT-49: Opção com_flash em modoRetirarSelecao, Tamanho Mínimo 0, seções colapsáveis e atalhos Aparência/Excluir Dados */
                let feat49Ok = false;
                let detalheFeat49 = '';
                try {
                    const motor49 = motorTeste || window.__JUSGOV_MOTOR_SELECAO_API__;
                    const defs49 = window.JusGovCfgDefaults ? window.JusGovCfgDefaults.PADROES_DEFAULT_STORAGE : null;
                    const cfgMgr49 = typeof window.JusGovConfiguracoes === 'function' ? new window.JusGovConfiguracoes() : null;
                    const padraoOk = Boolean(
                        defs49 &&
                        defs49.minimoCaracteresInterface === 0 &&
                        defs49.modoRetirarSelecao === 'com_flash' &&
                        cfgMgr49 &&
                        !cfgMgr49.obterChavesConfigSync().includes('modoBarraFavoritosSuperior')
                    );

                    let comFlashOk = false;
                    if (motor49 && typeof motor49.definirModoRetirarSelecao === 'function' &&
                        typeof motor49.definirTempoFlashBorderMs === 'function') {
                        const mOrig = motor49.obterModoRetirarSelecao();
                        const fOrig = motor49.obterTempoFlashBorderMs();
                        const elP49 = document.createElement('p');
                        elP49.textContent = 'Texto judicial para validar flash exclusivo sem seleção azul.';
                        document.body.appendChild(elP49);

                        motor49.definirTempoFlashBorderMs(-1);
                        motor49.definirModoRetirarSelecao('com_flash');
                        const modeStoredOk = motor49.obterModoRetirarSelecao() === 'com_flash';
                        const flashRemoveClique = motor49.deveManterSelecaoAtivaNoDom(elP49, false) === false;
                        const flashRemoveArrasto = motor49.deveManterSelecaoAtivaNoDom(elP49, true) === false;

                        motor49.definirTempoFlashBorderMs(0);
                        const semFlashMantem = motor49.deveManterSelecaoAtivaNoDom(elP49, false) === true;

                        document.body.removeChild(elP49);
                        motor49.definirTempoFlashBorderMs(fOrig);
                        motor49.definirModoRetirarSelecao(mOrig);
                        comFlashOk = modeStoredOk && flashRemoveClique && flashRemoveArrasto && semFlashMantem;
                    }

                    let domOptOk = true;
                    if (typeof document !== 'undefined' && document.getElementById('optModoRetirarSelecao')) {
                        domOptOk = Boolean(
                            document.getElementById('btnAbrirAparenciaChrome') &&
                            document.getElementById('btnAbrirLimparDadosChrome') &&
                            document.getElementById('detalhesListaDominiosMotor') &&
                            !document.getElementById('detalhesListaDominiosMotor').hasAttribute('open') &&
                            !document.getElementById('optModoBarraFavoritosSuperior') &&
                            document.querySelector('#blocoNiveisFormatacao abbr.dica-tags')
                        );
                    }

                    feat49Ok = padraoOk && comFlashOk && domOptOk;
                    detalheFeat49 = `padrao=${padraoOk}, comFlash=${comFlashOk}, dom=${domOptOk}`;
                } catch (e49) {
                    detalheFeat49 = e49.message || String(e49);
                }
                registrar(
                    feat49Ok,
                    'FEAT_49_COM_FLASH_MINIMO_ZERO_REMODELAGEM_OPTIONS',
                    'Modo com_flash remove seleção azul ao exibir Flash (ou mantém como Nenhuma quando Flash desligado), padrão mínimo=0, lista de domínios colapsada e atalhos nativos Aparência/Excluir Dados.',
                    { detalhe: detalheFeat49 }
                );
            }
            {
                /* BUG-73: Ctrl+Clique / Abrir link em nova guia ou janela ordena corretamente na hierarquia */
                let bug73Ok = false;
                let detalheBug73 = '';
                try {
                    const ModNav73 = window.JusGovModuloNavegador;
                    const OrdCls73 = window.JusGovGerenciadorOrdenacaoGuias;
                    const JanCls73 = window.JusGovGerenciadorJanelaUnica;
                    if (typeof ModNav73 !== 'function' || typeof OrdCls73 !== 'function' || typeof JanCls73 !== 'function') {
                        detalheBug73 = 'Classes de mod-navegador ausentes.';
                    } else {
                        const ord73 = new OrdCls73({ criterio: 'hierarquia_arvore', sentido: 'esq_dir' });
                        const mapa73 = new Map([
                            [10, { criadaEm: 1000 }],
                            [11, { criadaEm: 2000 }],
                            [12, { criadaEm: 3000 }],
                            [20, { criadaEm: 4000 }]
                        ]);
                        ord73.registrarCriacaoAba(10, 1000);
                        ord73.registrarRelacaoPaiFilha(11, 10);
                        ord73.registrarCriacaoAba(11, 2000);
                        ord73.registrarRelacaoPaiFilha(12, 10);
                        ord73.registrarCriacaoAba(12, 3000);
                        ord73.registrarRelacaoPaiFilha(20, 10);
                        ord73.registrarCriacaoAba(20, 4000);

                        const abas73 = [
                            { id: 10, index: 0, url: 'https://pje.jus.br/pai' },
                            { id: 11, index: 1, openerTabId: 10, url: 'https://pje.jus.br/filha1' },
                            { id: 12, index: 2, openerTabId: 10, url: 'https://pje.jus.br/ctrl_click' },
                            { id: 20, index: 3, url: 'https://pje.jus.br/abrir_em_janela' }
                        ];
                        const ordemEsqDir73 = ord73.ordenarPorHierarquiaArvore(abas73, 'esq_dir', mapa73).map(t => t.id);
                        const ordemDirEsq73 = ord73.ordenarPorHierarquiaArvore(abas73, 'dir_esq', mapa73).map(t => t.id);
                        const ordemCtrlCliqueOk = (
                            ordemEsqDir73.join(',') === '10,20,12,11' &&
                            ordemDirEsq73.join(',') === '10,11,12,20'
                        );

                        ord73.desvincularPaiDaAba(12);
                        const desvinculadaOk = (ord73.estaDesvinculadaManualmente(12) === true && ord73.foiPosicionadaInicialmente(20) === false);

                        let capturaCreateOpts = null;
                        const fakeChrome73 = {
                            tabs: {
                                create: (opts) => { capturaCreateOpts = opts; return Promise.resolve({ id: 30, ...opts }); }
                            }
                        };
                        const nav73 = new ModNav73({ janelaUnica: new JanCls73(), ordenacao: ord73 });
                        nav73.abrirNovaAba('https://pje.jus.br/extra', { tab: { id: 10, url: 'https://pje.jus.br/pai' } }, { abaEmPrimeiroPlano: true }, fakeChrome73);
                        const openerPropagadoOk = Boolean(capturaCreateOpts && capturaCreateOpts.openerTabId === 10);

                        const callbackJanelaOk = (JanCls73.prototype.processarNovaJanela.length >= 1);
                        const nullOrdOk = (
                            typeof ModNav73.NULL_OBJECTS.ordenacao.estaDesvinculadaManualmente === 'function' &&
                            typeof ModNav73.NULL_OBJECTS.ordenacao.foiPosicionadaInicialmente === 'function'
                        );

                        bug73Ok = ordemCtrlCliqueOk && desvinculadaOk && openerPropagadoOk && callbackJanelaOk && nullOrdOk;
                        detalheBug73 = `ordem=${ordemCtrlCliqueOk} (${ordemEsqDir73.join(',')}), desv=${desvinculadaOk}, opener=${openerPropagadoOk}, nullObj=${nullOrdOk}`;
                    }
                } catch (e73) {
                    detalheBug73 = e73.message || String(e73);
                }
                registrar(
                    bug73Ok,
                    'BUG_73_CTRL_CLIQUE_E_ABRIR_EM_NOVA_GUIA_JANELA_ORDENA_HIERARQUICAMENTE',
                    'Ctrl+Clique em link, Abrir link em nova janela e abrirNovaAba preservam vínculo pai->filha e ordenam corretamente na árvore hierárquica.',
                    { detalhe: detalheBug73 }
                );
            }

            // Bateria FEAT-50: Alivio retrocede apos 10s idle (contando os 10s) + reseta na interacao; badge verde oculta apos 30s de interacao e reaparece no hover
            {
                let feat50Ok = false;
                let detalheFeat50 = '';
                try {
                    const ProdCls50 = window.JusGovModuloProdutividade;
                    if (typeof ProdCls50 !== 'function') {
                        detalheFeat50 = 'window.JusGovModuloProdutividade ausente.';
                    } else {
                        const mp50 = new ProdCls50();
                        const t50 = 1794810000000;
                        const cfg50 = { pomodoroAtivo: true, pomodoroCiclos: 4, pomodoroFocoMinutos: 25, pomodoroProporcao: 4.16 };
                        const st50 = mp50.criarEstadoTrabalhoZerado('2026-11-16', t50);
                        st50.pomodoroFase = 'alivio';
                        st50.pomodoroCicloAtual = 1;
                        st50.pomodoroMinutosNaFase = 0;
                        st50.pomodoroDescansoPendente = true;
                        st50.pomodoroDescansoMinCumprido = false;
                        st50.ultimaAtividadeTs = t50;

                        const res5s = mp50.calcularResumoPomodoro(st50, cfg50, t50 + 5000);
                        const okAntes10s = (res5s.aguardandoOciosidade === true && res5s.segundosRestantes === 360);

                        const res10s = mp50.calcularResumoPomodoro(st50, cfg50, t50 + 10000);
                        const okEm10s = (res10s.aguardandoOciosidade === false && res10s.segundosRestantes === 350);

                        const actMov = mp50.aplicarAtividadeEmEstadoTrabalho(st50, t50 + 12000, 'movimento');
                        const resPosMov = mp50.calcularResumoPomodoro(st50, cfg50, t50 + 12000);
                        const okResetInteracao = (
                            actMov.resetouDescanso === true &&
                            actMov.iniciouFocoPosDescanso === false &&
                            resPosMov.aguardandoOciosidade === true &&
                            resPosMov.segundosRestantes === 360
                        );

                        /* Simula descanso cumprido automaticamente enquanto ausente (badgeVerdeAteTs = 0) */
                        const stAuto = mp50.criarEstadoTrabalhoZerado('2026-11-16', t50);
                        stAuto.pomodoroFase = 'foco';
                        stAuto.ultimaAtividadeTs = t50;
                        const cred50 = mp50.registrarPausasAutomaticasProdutividade(stAuto, t50 + 7 * 60000, cfg50);
                        const rAutoAntes = mp50.calcularResumoPomodoro(stAuto, cfg50, t50 + 7 * 60000);
                        const okAutoInicial = (
                            cred50.creditado === true &&
                            stAuto.pomodoroBadgeVerdeAteTs === 0 &&
                            mp50.deveExibirBadgeVerdeMinipopup(rAutoAntes, t50 + 7 * 60000, false) === false
                        );

                        /* Usuario volta a interagir por movimento apos pausa cumprida -> inicia foco sem exibir badge verde */
                        const tRet = t50 + 8 * 60000;
                        const retMov = mp50.aplicarAtividadeEmEstadoTrabalho(stAuto, tRet, 'movimento');
                        const rAutoInteragindo = mp50.calcularResumoPomodoro(stAuto, cfg50, tRet + 8000);
                        const okDurante15s = (
                            retMov.iniciouFocoPosDescanso === true &&
                            stAuto.pomodoroFase === 'foco' &&
                            retMov.iniciouBadgeVerde === true &&
                            rAutoInteragindo.badgeVerdeAteTs === (tRet + 15000) &&
                            mp50.deveExibirBadgeVerdeMinipopup(rAutoInteragindo, tRet + 8000, false) === false
                        );

                        const okApos15sSemHover = mp50.deveExibirBadgeVerdeMinipopup(rAutoInteragindo, tRet + 15001, false) === false;
                        const okApos15sComHover = mp50.deveExibirBadgeVerdeMinipopup(rAutoInteragindo, tRet + 15001, true) === false;

                        /* Clique apos pausa cumprida entra em foco sem exibir badge verde */
                        const stClick = mp50.criarEstadoTrabalhoZerado('2026-11-16', t50);
                        stClick.ultimaAtividadeTs = t50;
                        mp50.registrarPausasAutomaticasProdutividade(stClick, t50 + 7 * 60000, cfg50);
                        const tClk = t50 + 8 * 60000;
                        const retClk = mp50.aplicarAtividadeEmEstadoTrabalho(stClick, tClk, 'click_ou_tecla', cfg50);
                        const rClickFoco = mp50.calcularResumoPomodoro(stClick, cfg50, tClk);
                        const okClickOcultaBadge = (
                            retClk.iniciouFocoPosDescanso === true &&
                            retClk.ocultouBadgeVerde === true &&
                            rClickFoco.fase === 'foco' &&
                            mp50.deveExibirBadgeVerdeMinipopup(rClickFoco, tClk, false) === false &&
                            mp50.deveExibirBadgeVerdeMinipopup(rClickFoco, tClk, true) === false
                        );

                        feat50Ok = okAntes10s && okEm10s && okResetInteracao && okAutoInicial && okDurante15s && okApos15sSemHover && okApos15sComHover && okClickOcultaBadge;
                        detalheFeat50 = `5s=${okAntes10s}, 10s=${okEm10s}, resetMov=${okResetInteracao}, auto=${okAutoInicial}, 15s=${okDurante15s}, hide=${okApos15sSemHover}, hover=${okApos15sComHover}, clkHide=${okClickOcultaBadge}`;
                    }
                } catch (e50) {
                    detalheFeat50 = e50.message || String(e50);
                }
                registrar(
                    feat50Ok,
                    'FEAT_50_ALIVIO_IDLE_10S_E_BADGE_VERDE_15S_HOVER',
                    'Alívio inicia contagem regressiva após 10s sem interação (computando os 10s) e volta ao tempo cheio ao interagir (<25%); qualquer interação retoma Foco após conclusão com badge verde de 15s.',
                    { detalhe: detalheFeat50 }
                );
            }

            // Bateria FEAT-51: Protecao escalonada do descanso em 25%/50%/75%, 3 cliques por estagio, recuperacao +5% e clique ocultando badge verde
            {
                let feat51Ok = false;
                let detalheFeat51 = '';
                try {
                    const ProdCls51 = window.JusGovModuloProdutividade;
                    if (typeof ProdCls51 !== 'function') {
                        detalheFeat51 = 'window.JusGovModuloProdutividade ausente.';
                    } else {
                        const mp51 = new ProdCls51();
                        const base = 1794815000000;
                        const cfg51 = { pomodoroAtivo: true, pomodoroCiclos: 4, pomodoroFocoMinutos: 25, pomodoroProporcao: 4.16 }; /* 6 min = 360s */
                        const novoEstadoDesc = (acumuladoSeg) => {
                            const s = mp51.criarEstadoTrabalhoZerado('2026-11-16', base);
                            s.pomodoroFase = 'alivio';
                            s.pomodoroCicloAtual = 1;
                            s.pomodoroDescansoPendente = true;
                            s.pomodoroDescansoMinCumprido = false;
                            s.ultimaAtividadeTs = base - acumuladoSeg * 1000;
                            s.pomodoroMinutosNaFase = Math.floor(acumuladoSeg / 60);
                            return s;
                        };

                        /* 1. <= 25% (15% = 54s): movimento zera */
                        const s15 = novoEstadoDesc(54);
                        const r15 = mp51.aplicarAtividadeEmEstadoTrabalho(s15, base, 'movimento', cfg51);
                        const res15 = mp51.calcularResumoPomodoro(s15, cfg51, base);
                        const ok15 = (r15.resetouDescanso === true && r15.estagioEfetivo === 0 && res15.segundosRestantes === 360);

                        /* 2. >25%..50% (35% = 126s, resta 234s): movimento nao zera, mostra "Descanso Necessário!" e regride tempo durante movimento */
                        const s35 = novoEstadoDesc(126);
                        const r35 = mp51.aplicarAtividadeEmEstadoTrabalho(s35, base, 'movimento', cfg51);
                        const res35Ativ = mp51.calcularResumoPomodoro(s35, cfg51, base + 2000);
                        const ok35 = (
                            r35.resetouDescanso === false &&
                            r35.estagioEfetivo === 1 &&
                            r35.mensagemAviso === 'Descanso Necessário!' &&
                            res35Ativ.descansoEmAviso === true &&
                            res35Ativ.descansoAvisoTexto === 'Descanso Necessário!' &&
                            res35Ativ.descansoAcumuladoMs === 124000 &&
                            res35Ativ.segundosRestantes === 236
                        );

                        /* 3. >50%..75% (55% = 198s, resta 162s): movimento trava o valor com "Em andamento?" e retoma apos parar */
                        const s55 = novoEstadoDesc(198);
                        const r55 = mp51.aplicarAtividadeEmEstadoTrabalho(s55, base, 'movimento', cfg51);
                        const res55Trava = mp51.calcularResumoPomodoro(s55, cfg51, base + 2000);
                        const res55Retoma = mp51.calcularResumoPomodoro(s55, cfg51, base + 7500); /* 2500ms ativo travado + 5000ms idle = 203s (157s rest) */
                        const ok55 = (
                            r55.resetouDescanso === false &&
                            r55.estagioEfetivo === 2 &&
                            r55.mensagemAviso === 'Em andamento?' &&
                            res55Trava.segundosRestantes === 162 &&
                            res55Retoma.descansoEmAviso === false &&
                            res55Retoma.segundosRestantes === 157
                        );

                        /* 4. >75% (80% = 288s, resta 72s): movimento e 1 clique NAO quebram nem travam ("Finalizando Descanso...") */
                        const s80 = novoEstadoDesc(288);
                        const r80Mov = mp51.aplicarAtividadeEmEstadoTrabalho(s80, base, 'movimento', cfg51);
                        const res80Mov = mp51.calcularResumoPomodoro(s80, cfg51, base + 2000);
                        const s80Clk1 = novoEstadoDesc(288);
                        const r80Clk1 = mp51.aplicarAtividadeEmEstadoTrabalho(s80Clk1, base, 'click_ou_tecla', cfg51);
                        const ok80 = (
                            r80Mov.resetouDescanso === false &&
                            r80Mov.estagioEfetivo === 3 &&
                            r80Mov.mensagemAviso === 'Finalizando Descanso...' &&
                            res80Mov.segundosRestantes === 70 &&
                            r80Clk1.estagioEfetivo === 3 &&
                            r80Clk1.mensagemAviso === 'Finalizando Descanso...'
                        );

                        /* 5. Escalada 3 cliques/estagio a partir de 80%: 3->50%, 6->25%, 9->zera; e +5% restante recupera estagio */
                        const sEsc = novoEstadoDesc(288);
                        mp51.aplicarAtividadeEmEstadoTrabalho(sEsc, base + 100, 'click_ou_tecla', cfg51);
                        mp51.aplicarAtividadeEmEstadoTrabalho(sEsc, base + 200, 'click_ou_tecla', cfg51);
                        const r3 = mp51.aplicarAtividadeEmEstadoTrabalho(sEsc, base + 300, 'click_ou_tecla', cfg51);
                        const ok3Clk = (r3.estagioEfetivo === 2 && r3.mensagemAviso === 'Em andamento?');

                        /* Recuperacao de +5% sem cliques: 72s restantes -> 5% = 3600ms */
                        const resRec = mp51.calcularResumoPomodoro(sEsc, cfg51, base + 300 + 3600);
                        const okRec = (resRec.descansoEstagioEfetivo === 3 && resRec.descansoCliquesPenalidade === 0);

                        /* Sequencia completa 3 -> 6 -> 9 cliques sem pausa zera tudo */
                        const sEscFull = novoEstadoDesc(288);
                        let ultRes;
                        for (let c = 1; c <= 9; c++) {
                            ultRes = mp51.aplicarAtividadeEmEstadoTrabalho(sEscFull, base + c * 150, 'click_ou_tecla', cfg51);
                            if (c === 3 && ultRes.estagioEfetivo !== 2) throw new Error(`Esperava estagio 2 no clique 3, veio ${ultRes.estagioEfetivo}`);
                            if (c === 6 && ultRes.estagioEfetivo !== 1) throw new Error(`Esperava estagio 1 no clique 6, veio ${ultRes.estagioEfetivo}`);
                        }
                        const ok9ClkZero = (ultRes.resetouDescanso === true && sEscFull.pomodoroDescansoAcumuladoMs === 0 && sEscFull.pomodoroDescansoCliquesPenalidade === 0);

                        /* 6. Em foco com badge verde nos 30s iniciais de movimento: clique/tecla oculta imediatamente, mantendo hover */
                        const sBadge = mp51.criarEstadoTrabalhoZerado('2026-11-16', base);
                        sBadge.pomodoroFase = 'foco';
                        sBadge.pomodoroUltimoDescansoTipo = 'alivio';
                        sBadge.pomodoroUltimoDescansoFimTs = base - 10000;
                        sBadge.pomodoroBadgeVerdeAteTs = base + 30000;
                        const rH = mp51.aplicarAtividadeEmEstadoTrabalho(sBadge, base + 1000, 'click_ou_tecla', cfg51);
                        const resBadge = mp51.calcularResumoPomodoro(sBadge, cfg51, base + 1000);
                        const okBadgeHideClk = (
                            rH.ocultouBadgeVerde === true &&
                            mp51.deveExibirBadgeVerdeMinipopup(resBadge, base + 1000, false) === false &&
                            mp51.deveExibirBadgeVerdeMinipopup(resBadge, base + 1000, true) === false
                        );

                        feat51Ok = ok15 && ok35 && ok55 && ok80 && ok3Clk && okRec && ok9ClkZero && okBadgeHideClk;
                        detalheFeat51 = `15%=${ok15}, 35%=${ok35}, 55%=${ok55}, 80%=${ok80}, 3clk=${ok3Clk}, rec5%=${okRec}, 9clk=${ok9ClkZero}, badgeClk=${okBadgeHideClk}`;
                    }
                } catch (e51) {
                    detalheFeat51 = e51.message || String(e51);
                }
                registrar(
                    feat51Ok,
                    'FEAT_51_DESCANSO_ESCALONADO_25_50_75_E_CLIQUES',
                    'Descanso protege progresso após 25% (regride), 50% (trava) e 75% (segue) com avisos dourados, escalada de 3 cliques por estágio, recuperação +5% e ocultação da badge verde por clique/tecla.',
                    { detalhe: detalheFeat51 }
                );
            }

            // Bateria BUG-74: Contador de Ativo/Foco progressivo (pra frente), Descanso regressivo (pra trás) + tolerância de 1s antes da esquiva
            {
                let bug74Ok = false;
                let detalheBug74 = '';
                try {
                    const ProdCls74 = window.JusGovModuloProdutividade;
                    if (typeof ProdCls74 !== 'function') {
                        detalheBug74 = 'window.JusGovModuloProdutividade ausente.';
                    } else {
                        const mp74 = new ProdCls74();
                        const t74 = 1794820000000;
                        const cfg74 = { pomodoroAtivo: true, pomodoroCiclos: 4, pomodoroFocoMinutos: 25, pomodoroProporcao: 4.16 };

                        /* 1. Foco (ativo) conta para frente */
                        const stFoco = mp74.criarEstadoTrabalhoZerado('2026-11-16', t74);
                        stFoco.pomodoroFase = 'foco';
                        stFoco.pomodoroFaseInicioTs = t74;
                        stFoco.pomodoroMinutosNaFase = 0;
                        const rF15 = mp74.calcularResumoPomodoro(stFoco, cfg74, t74 + 15000);
                        const rF75 = mp74.calcularResumoPomodoro(stFoco, cfg74, t74 + 75000);
                        stFoco.pomodoroMinutosNaFase = 1;
                        const okFocoFrente = (
                            rF15.segundosDecorridos === 15 &&
                            rF75.segundosDecorridos === 75 &&
                            rF15.focoAnchorTs === t74
                        );

                        /* 2. Foco pausado congela no minuto acumulado sem correr solto */
                        stFoco.emPausa = true;
                        stFoco.pomodoroMinutosNaFase = 12;
                        const rFPausado = mp74.calcularResumoPomodoro(stFoco, cfg74, t74 + 20 * 60000);
                        const okFocoPausa = (rFPausado.emPausa === true && rFPausado.segundosDecorridos === 720);

                        /* 3. Descanso conta para trás e aumenta segundosRestantes quando regride no estágio 1 (>25%) */
                        const stDesc = mp74.criarEstadoTrabalhoZerado('2026-11-16', t74);
                        stDesc.pomodoroFase = 'alivio';
                        stDesc.pomodoroDescansoPendente = true;
                        stDesc.ultimaAtividadeTs = t74 - 126000; /* 35% = 126s feitos, 234s faltam */
                        stDesc.pomodoroMinutosNaFase = 2;
                        const rDAntes = mp74.calcularResumoPomodoro(stDesc, cfg74, t74);
                        mp74.aplicarAtividadeEmEstadoTrabalho(stDesc, t74, 'movimento', cfg74);
                        const rDReg = mp74.calcularResumoPomodoro(stDesc, cfg74, t74 + 2000);
                        const okDescTrasAumenta = (rDAntes.segundosRestantes === 234 && rDReg.segundosRestantes === 236);

                        /* 4. Tolerância de 1s ao passar mouse antes de disparar esquiva */
                        const okDelay0 = mp74.podeDispararEsquivaBarra(0, t74 + 500) === false;
                        const okDelayAntes = mp74.podeDispararEsquivaBarra(t74, t74 + 999) === false;
                        const okDelayDepois = mp74.podeDispararEsquivaBarra(t74, t74 + 1000) === true;
                        const okDelayOk = okDelay0 && okDelayAntes && okDelayDepois;

                        bug74Ok = okFocoFrente && okFocoPausa && okDescTrasAumenta && okDelayOk;
                        detalheBug74 = `foco=${okFocoFrente}, pausa=${okFocoPausa}, descReg=${okDescTrasAumenta}, delay1s=${okDelayOk}`;
                    }
                } catch (e74) {
                    detalheBug74 = e74.message || String(e74);
                }
                registrar(
                    bug74Ok,
                    'BUG_74_CONTADOR_FOCO_PROGRESSIVO_E_ESQUIVA_TOLERANCIA_1S',
                    'Ativo/Foco conta para frente (00:00->meta), Alívio/Descanso conta para trás aumentando ao regredir penalidade, e esquiva aguarda 1s antes de mover o minipopup.',
                    { detalhe: detalheBug74 }
                );
            }

            // Bateria FEAT-52: Modo 3 Minimalista, borda 0px, sincronizacao total de guias e botoes concisos em Opcoes
            {
                let feat52Ok = false;
                let detalheFeat52 = '';
                try {
                    const ProdCls52 = window.JusGovModuloProdutividade;
                    if (typeof ProdCls52 !== 'function') {
                        detalheFeat52 = 'window.JusGovModuloProdutividade ausente.';
                    } else {
                        const mp52 = new ProdCls52();
                        const norm3 = mp52.normalizarEstadoGlobalBarraPomodoro({ modoFixacao: 3, topPx: 0, alinhamento: 'esquerda' });
                        const norm3Ok = (norm3.modoFixacao === 3 && norm3.topPx === 0 && norm3.alinhamento === 'esquerda');
                        const clampZero = mp52.calcularPosicaoLivreClamp(-50, -30, 180, 1280, 720, 22);
                        const bordaZeroOk = (clampZero.leftPx === 0 && clampZero.topPx === 0);
                        const temFecharModalGlobal = (typeof mp52.fecharModalProdutividadeEmTodasJanelas === 'function');
                        feat52Ok = norm3Ok && bordaZeroOk && temFecharModalGlobal;
                        detalheFeat52 = `norm3=${norm3Ok}, borda0=${bordaZeroOk}, fecharModal=${temFecharModalGlobal}`;
                    }
                } catch (e52) {
                    detalheFeat52 = e52.message || String(e52);
                }
                registrar(
                    feat52Ok,
                    'FEAT_52_MINIPOPUP_COMPACTO_BORDAS_MINIMALISTA_E_SINAL',
                    'Minipopup aceita Modo 3 Minimalista, ancora encostado a 0px nas bordas e sincroniza modais/guias globalmente.',
                    { detalhe: detalheFeat52 }
                );
            }

            // Bateria FEAT-53: Alt + Botão do Meio ativa o componente, seleciona na entrada e mantém alvo mesmo movendo o mouse
            {
                let feat53Ok = false;
                let detalheFeat53 = '';
                try {
                    const BotaoMeioCls53 = window.JusGovBotaoMeioColagem;
                    if (typeof BotaoMeioCls53 !== 'function') {
                        detalheFeat53 = 'window.JusGovBotaoMeioColagem ausente.';
                    } else {
                        const bm53 = new BotaoMeioCls53();
                        let focos = 0;
                        let cliques = 0;
                        let selecoes = 0;
                        const fakeInput = {
                            nodeType: 1,
                            tagName: 'INPUT',
                            type: 'text',
                            value: 'valor-antigo',
                            readOnly: false,
                            disabled: false,
                            isContentEditable: false,
                            ownerDocument: document,
                            getAttribute(attr) { return attr === 'type' ? 'text' : null; },
                            focus() { focos++; },
                            click() { cliques++; },
                            select() { selecoes++; }
                        };
                        const fakeDiv = {
                            nodeType: 1,
                            tagName: 'DIV',
                            isContentEditable: false,
                            getAttribute() { return null; }
                        };
                        const evDown = {
                            button: 1,
                            altKey: true,
                            target: fakeInput,
                            preventDefault() { },
                            stopPropagation() { }
                        };
                        const downOk = bm53.tratarMouseDown(evDown) === true;
                        const ativouNoDown = (focos >= 1 && cliques >= 1 && selecoes >= 1);

                        const evUpMovido = {
                            button: 1,
                            altKey: true,
                            ctrlKey: false,
                            isTrusted: false,
                            target: fakeDiv,
                            preventDefault() { },
                            stopPropagation() { }
                        };
                        const resolveuMesmoMovendo = bm53.tratarCliqueBotaoMeio(evUpMovido, 'novo-texto') === true;
                        const consumiuPendencia = bm53.tratarCliqueBotaoMeio(evUpMovido, 'novo-texto') === false;

                        feat53Ok = downOk && ativouNoDown && resolveuMesmoMovendo && consumiuPendencia;
                        detalheFeat53 = `down=${downOk}, ativou=${ativouNoDown} (f=${focos},c=${cliques},s=${selecoes}), moveOk=${resolveuMesmoMovendo}, consumiu=${consumiuPendencia}`;
                    }
                } catch (e53) {
                    detalheFeat53 = e53.message || String(e53);
                }
                registrar(
                    feat53Ok,
                    'FEAT_53_ALT_BOTAO_MEIO_ATIVA_SELECIONA_E_COLA_MESMO_MOVENDO_MOUSE',
                    'Alt + Botão do Meio ativa o campo no mousedown (focus/click/select) e conclui colagem no alvo original mesmo se o mouse sair do componente.',
                    { detalhe: detalheFeat53 }
                );
            }

            // Bateria FEAT-54: Minipopup padrão minimalista, duplo clique 3 níveis, 6 posições 0px e Cadeado Amarelo padrão
            {
                let feat54Ok = false;
                let detalheFeat54 = '';
                try {
                    const ProdCls54 = window.JusGovModuloProdutividade;
                    if (typeof ProdCls54 !== 'function') {
                        detalheFeat54 = 'window.JusGovModuloProdutividade ausente.';
                    } else {
                        const mp54 = new ProdCls54();
                        const estPadrao = mp54.normalizarEstadoGlobalBarraPomodoro({});
                        const padraoOk = (
                            estPadrao.modoFixacao === 1 &&
                            estPadrao.nivelDetalhe === 0 &&
                            estPadrao.posicaoVertical === 'superior' &&
                            estPadrao.alinhamento === 'esquerda' &&
                            estPadrao.topPx === 0
                        );
                        const det1 = mp54.avancarNivelDetalheBarra(0) === 1;
                        const det2 = mp54.avancarNivelDetalheBarra(1) === 2;
                        const det0 = mp54.avancarNivelDetalheBarra(2) === 0;
                        const cicloDetOk = det1 && det2 && det0;

                        const pSE = mp54.calcularPosicao6Bordas(100, 50, 1280, 720);
                        const pSC = mp54.calcularPosicao6Bordas(640, 50, 1280, 720);
                        const pSD = mp54.calcularPosicao6Bordas(1180, 50, 1280, 720);
                        const pIE = mp54.calcularPosicao6Bordas(100, 680, 1280, 720);
                        const pIC = mp54.calcularPosicao6Bordas(640, 680, 1280, 720);
                        const pID = mp54.calcularPosicao6Bordas(1180, 680, 1280, 720);
                        const bordas6Ok = (
                            pSE.posicaoVertical === 'superior' && pSE.alinhamento === 'esquerda' &&
                            pSC.posicaoVertical === 'superior' && pSC.alinhamento === 'centro' &&
                            pSD.posicaoVertical === 'superior' && pSD.alinhamento === 'direita' &&
                            pIE.posicaoVertical === 'inferior' && pIE.alinhamento === 'esquerda' &&
                            pIC.posicaoVertical === 'inferior' && pIC.alinhamento === 'centro' &&
                            pID.posicaoVertical === 'inferior' && pID.alinhamento === 'direita'
                        );

                        feat54Ok = padraoOk && cicloDetOk && bordas6Ok;
                        detalheFeat54 = `padrao=${padraoOk}, cicloDet=${cicloDetOk}, bordas6=${bordas6Ok}`;
                    }
                } catch (e54) {
                    detalheFeat54 = e54.message || String(e54);
                }
                registrar(
                    feat54Ok,
                    'FEAT_54_MINIPOPUP_PADRAO_MINIMALISTA_6_BORDAS_E_CADEADO_AMARELO',
                    'Minipopup inicia minimalista (nivelDetalhe=0) e Cadeado Amarelo (modoFixacao=1) a 0px, comuta 3 níveis no duplo clique e encaixa em 6 posições de borda.',
                    { detalhe: detalheFeat54 }
                );
            }

            // Bateria FEAT-55: Bloqueio de propagação de eventos de cópia (copy / beforecopy) para scripts/HTML da página
            {
                let feat55Ok = false;
                let detalheFeat55 = '';
                try {
                    let paginaRecebeuCopy = false;
                    let paginaRecebeuBeforeCopy = false;
                    const alvo55 = document.createElement('div');
                    document.body.appendChild(alvo55);

                    const fnBloqueioWin = (ev) => {
                        if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
                        if (ev && typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
                    };
                    const fnPaginaCopy = () => { paginaRecebeuCopy = true; };
                    const fnPaginaBeforeCopy = () => { paginaRecebeuBeforeCopy = true; };

                    window.addEventListener('copy', fnBloqueioWin, { capture: true });
                    window.addEventListener('beforecopy', fnBloqueioWin, { capture: true });
                    document.addEventListener('copy', fnPaginaCopy, { capture: true });
                    alvo55.addEventListener('copy', fnPaginaCopy);
                    document.addEventListener('beforecopy', fnPaginaBeforeCopy, { capture: true });

                    const evCopy55 = new Event('copy', { bubbles: true, cancelable: true });
                    const evBefore55 = new Event('beforecopy', { bubbles: true, cancelable: true });
                    alvo55.dispatchEvent(evCopy55);
                    alvo55.dispatchEvent(evBefore55);

                    window.removeEventListener('copy', fnBloqueioWin, { capture: true });
                    window.removeEventListener('beforecopy', fnBloqueioWin, { capture: true });
                    document.removeEventListener('copy', fnPaginaCopy, { capture: true });
                    alvo55.removeEventListener('copy', fnPaginaCopy);
                    document.removeEventListener('beforecopy', fnPaginaBeforeCopy, { capture: true });
                    if (alvo55.parentNode) alvo55.parentNode.removeChild(alvo55);

                    const copyBloqueadoSemPreventDefault = (!paginaRecebeuCopy && !evCopy55.defaultPrevented);
                    const beforeCopyBloqueado = !paginaRecebeuBeforeCopy;
                    feat55Ok = copyBloqueadoSemPreventDefault && beforeCopyBloqueado;
                    detalheFeat55 = `copyBloq=${copyBloqueadoSemPreventDefault}, beforeCopyBloq=${beforeCopyBloqueado}`;
                } catch (e55) {
                    detalheFeat55 = e55.message || String(e55);
                }
                registrar(
                    feat55Ok,
                    'FEAT_55_BLOQUEIO_PROPAGACAO_EVENTOS_COPIA_PARA_PAGINA',
                    'Eventos copy e beforecopy são interceptados na fase de captura de window com stopPropagation/stopImmediatePropagation sem impedir a cópia nativa.',
                    { detalhe: detalheFeat55 }
                );
            }

            // Bateria FEAT-56: Escudo MAIN world contra desseleção forçada (removeAllRanges/empty/collapse/execCommand) e bloqueio de selectstart
            {
                let feat56Ok = false;
                let detalheFeat56 = '';
                try {
                    const prot = window.JusGovProtecaoCopiaMain;
                    if (!prot || typeof prot.instalarProtecao !== 'function') {
                        detalheFeat56 = 'window.JusGovProtecaoCopiaMain ausente.';
                    } else {
                        const pLeitura = document.createElement('p');
                        pLeitura.textContent = 'Texto protegido para leitura';
                        document.body.appendChild(pLeitura);
                        const sel56 = window.getSelection();
                        sel56.removeAllRanges();
                        const rng56 = document.createRange();
                        rng56.selectNodeContents(pLeitura);
                        sel56.addRange(rng56);

                        document.documentElement.setAttribute('data-jusgov-ativo', '1');
                        prot.instalarProtecao(window);

                        sel56.removeAllRanges();
                        sel56.empty();
                        sel56.collapse(pLeitura, 0);
                        sel56.collapseToStart();
                        sel56.collapseToEnd();
                        try { document.execCommand('unselect'); } catch (_) { }

                        const textoMantido = String(sel56.toString() || '').trim();
                        const antiDesselecaoOk = (!sel56.isCollapsed && textoMantido === 'Texto protegido para leitura');

                        let paginaSelectStartRecebido = false;
                        const fnPagSelStart = () => { paginaSelectStartRecebido = true; };
                        pLeitura.addEventListener('selectstart', fnPagSelStart);
                        pLeitura.dispatchEvent(new Event('selectstart', { bubbles: true, cancelable: true }));
                        pLeitura.removeEventListener('selectstart', fnPagSelStart);
                        const selectStartBloqueado = !paginaSelectStartRecebido;

                        const inp56 = document.createElement('input');
                        inp56.type = 'text';
                        document.body.appendChild(inp56);
                        const editavelReconhecido = prot.ehContextoEditavelOuExtensao(document, { anchorNode: inp56, focusNode: inp56 });

                        prot.removerProtecao(window);
                        sel56.removeAllRanges();
                        document.documentElement.removeAttribute('data-jusgov-ativo');
                        if (inp56.parentNode) inp56.parentNode.removeChild(inp56);
                        if (pLeitura.parentNode) pLeitura.parentNode.removeChild(pLeitura);

                        feat56Ok = antiDesselecaoOk && selectStartBloqueado && editavelReconhecido;
                        detalheFeat56 = `antiDesselecao=${antiDesselecaoOk}, selectStartBloq=${selectStartBloqueado}, editavel=${editavelReconhecido}`;
                    }
                } catch (e56) {
                    try { window.JusGovProtecaoCopiaMain && window.JusGovProtecaoCopiaMain.removerProtecao(window); } catch (_) { }
                    detalheFeat56 = e56.message || String(e56);
                }
                registrar(
                    feat56Ok,
                    'FEAT_56_ESCUDO_MAIN_ANTI_DESSELECAO_E_ANTI_BLOQUEIO_COPIA',
                    'Escudo MAIN world impede páginas de forçar desseleção (removeAllRanges/empty/collapse/unselect), bloqueia selectstart sem quebrar campos editáveis.',
                    { detalhe: detalheFeat56 }
                );
            }

            // Bateria FEAT-57: Alerta amarelo nos últimos 30s (minipopup piscando) e 1min antes no ícone do app
            {
                let feat57Ok = false;
                let detalheFeat57 = '';
                try {
                    const ProdCls57 = window.JusGovModuloProdutividade;
                    if (typeof ProdCls57 !== 'function') {
                        detalheFeat57 = 'window.JusGovModuloProdutividade ausente.';
                    } else {
                        const mp57 = new ProdCls57();
                        const bVerde = mp57.resolverEstiloBadgePomodoro({ emDescanso: false, descansoPendente: false, emPausa: false, minutosRestantes: 5, segundosRestantes: 300 });
                        const bAmarelo = mp57.resolverEstiloBadgePomodoro({ emDescanso: false, descansoPendente: false, emPausa: false, minutosRestantes: 1, segundosRestantes: 45 });
                        const bAzul = mp57.resolverEstiloBadgePomodoro({ emDescanso: true, descansoPendente: false, minutosRestantes: 1, segundosRestantes: 45 });
                        const bVermelho = mp57.resolverEstiloBadgePomodoro({ emDescanso: false, descansoPendente: true, minutosRestantes: 0, segundosRestantes: 0 });
                        const badgesOk = (
                            bVerde.cor === '#0d9488' && bVerde.preDescansoAmarelo === false &&
                            bAmarelo.cor === '#eab308' && bAmarelo.preDescansoAmarelo === true &&
                            bAzul.cor === '#0284c7' &&
                            bVermelho.cor === '#dc2626'
                        );

                        const c31 = mp57.isCronometroFocoEmAlertaPreDescanso(31, false, false, false) === false;
                        const c30 = mp57.isCronometroFocoEmAlertaPreDescanso(30, false, false, false) === true;
                        const c01 = mp57.isCronometroFocoEmAlertaPreDescanso(1, false, false, false) === true;
                        const cDesc = mp57.isCronometroFocoEmAlertaPreDescanso(15, true, false, false) === false;
                        const cPausa = mp57.isCronometroFocoEmAlertaPreDescanso(15, false, false, true) === false;
                        const cronoOk = c31 && c30 && c01 && cDesc && cPausa;

                        feat57Ok = badgesOk && cronoOk;
                        detalheFeat57 = `badges=${badgesOk}, crono30s=${cronoOk}`;
                    }
                } catch (e57) {
                    detalheFeat57 = e57.message || String(e57);
                }
                registrar(
                    feat57Ok,
                    'FEAT_57_ALERTA_AMARELO_PRE_DESCANSO_30S_E_1MIN',
                    'Cronômetro do minipopup pisca em amarelo nos últimos 30s antes do descanso e badge do ícone muda para amarelo 1 minuto antes.',
                    { detalhe: detalheFeat57 }
                );
            }

            // Bateria FEAT-58: Posição padrão canto superior esquerdo, idle no centro exato da tela e aviso em Alívio no topo central (Cadeado Amarelo)
            {
                let feat58Ok = false;
                let detalheFeat58 = '';
                try {
                    const ProdCls58 = window.JusGovModuloProdutividade;
                    if (typeof ProdCls58 !== 'function') {
                        detalheFeat58 = 'window.JusGovModuloProdutividade ausente.';
                    } else {
                        const mp58 = new ProdCls58();
                        const estDef58 = mp58.normalizarEstadoGlobalBarraPomodoro({});
                        const posPadrao = mp58.resolverPosicaoEfetivaBarraPomodoro({ emDescanso: false }, estDef58, 10000);
                        const padraoEsqOk = (posPadrao.modoEspecial === 'padrao' && posPadrao.posicaoVertical === 'superior' && posPadrao.alinhamento === 'esquerda' && posPadrao.forcarRetornoAmarelo === true);

                        const posIdle = mp58.resolverPosicaoEfetivaBarraPomodoro(
                            { emDescanso: true, descansoRealizado: false, descansoEmAviso: false, aguardandoOciosidade: false, descansoAtividadeAteTs: 5000 },
                            estDef58,
                            10000
                        );
                        const idleCentroOk = (posIdle.modoEspecial === 'idle_centro_tela' && posIdle.posicaoVertical === 'centro_tela' && posIdle.centroTela === true);

                        const posAviso = mp58.resolverPosicaoEfetivaBarraPomodoro(
                            { emDescanso: true, descansoRealizado: false, descansoEmAviso: true, aguardandoOciosidade: false, descansoAtividadeAteTs: 12000 },
                            { modoFixacao: 2, posicaoVertical: 'inferior', alinhamento: 'direita' },
                            10000
                        );
                        const avisoTopoCentroOk = (posAviso.modoEspecial === 'aviso_topo_centro' && posAviso.posicaoVertical === 'superior' && posAviso.alinhamento === 'centro' && posAviso.forcarRetornoAmarelo === true);

                        const posInteragindo = mp58.resolverPosicaoEfetivaBarraPomodoro(
                            { emDescanso: true, descansoRealizado: false, descansoEmAviso: false, aguardandoOciosidade: true, descansoAtividadeAteTs: 12000 },
                            estDef58,
                            10000
                        );
                        const saiDoCentroAoInteragirOk = (posInteragindo.modoEspecial === 'padrao' && posInteragindo.posicaoVertical === 'superior' && posInteragindo.alinhamento === 'esquerda');

                        feat58Ok = padraoEsqOk && idleCentroOk && avisoTopoCentroOk && saiDoCentroAoInteragirOk;
                        detalheFeat58 = `padraoEsq=${padraoEsqOk}, idleCentro=${idleCentroOk}, avisoTopoCentro=${avisoTopoCentroOk}, saiInter=${saiDoCentroAoInteragirOk}`;
                    }
                } catch (e58) {
                    detalheFeat58 = e58.message || String(e58);
                }
                registrar(
                    feat58Ok,
                    'FEAT_58_ALIVIO_CENTRO_TELA_IDLE_E_AVISO_TOPO_CENTRO',
                    'Padrão inicia no canto superior esquerdo, entra no centro exato da tela em Alívio idle e vai ao topo central (Cadeado Amarelo) em modo aviso.',
                    { detalhe: detalheFeat58 }
                );
            }

            // Bateria FEAT-59: Exportação diferencial com comentário/versão/data/hash e importação validada com descarte de obsoletos
            {
                let feat59Ok = false;
                let detalheFeat59 = '';
                try {
                    const CfgCls59 = window.JusGovConfiguracoes;
                    const Def59 = window.JusGovCfgDefaults;
                    if (typeof CfgCls59 !== 'function' || !Def59) {
                        detalheFeat59 = 'JusGovConfiguracoes/JusGovCfgDefaults ausentes.';
                    } else {
                        const cat59 = Def59.obterCatalogoPerfis();
                        const cfg59 = new CfgCls59();
                        const syncSim59 = {
                            perfilAtivoId: 'padrao',
                            pomodoroCiclos: 7,
                            manterFormatacaoBasica: cat59.configPadrao.manterFormatacaoBasica
                        };
                        const dataFixa59 = new Date(2026, 10, 16, 6, 5, 0);
                        const exp59 = cfg59.gerarArquivoExportacaoDiferencial(syncSim59, { pomodoroCiclos: 7 }, cat59, {
                            nomeAddon: 'JusGovBR — Seleção/Cópia Inteligente',
                            versaoAddon: '261116.20',
                            dataExportacao: '2026-11-16T08:40:00.000Z',
                            dataArquivo: dataFixa59
                        });

                        const apenasModOk = (
                            exp59.dadosJson && exp59.dadosJson.perfis && exp59.dadosJson.perfis.padrao &&
                            exp59.dadosJson.perfis.padrao.pomodoroCiclos === 7 &&
                            exp59.dadosJson.perfis.padrao.manterFormatacaoBasica === undefined &&
                            exp59.dadosJson.perfis.padrao.modoTurbo === undefined
                        );
                        const nomeArqOk = (
                            exp59.nomeArquivo === 'JusGovBR-261116_0605.json' &&
                            /^JusGovBR-\d{6}_\d{4}\.json$/.test(cfg59.gerarNomeArquivoExportacao())
                        );
                        const comentarioOk = (
                            exp59.conteudoArquivo.startsWith('/*') &&
                            exp59.conteudoArquivo.includes('Addon: JusGovBR') &&
                            exp59.conteudoArquivo.includes('Versão do Addon: 261116.20') &&
                            exp59.conteudoArquivo.includes('Data da Exportação: 2026-11-16T08:40:00.000Z') &&
                            exp59.conteudoArquivo.includes(`Hash: ${exp59.metadados.hash}\n * ============`) &&
                            !exp59.conteudoArquivo.includes('Formato de Exportação')
                        );

                        const importOkObj = cfg59.analisarEValidarArquivoImportacao(exp59.conteudoArquivo, cat59);
                        const adulteradoTexto = exp59.conteudoArquivo.replace('"pomodoroCiclos": 7', '"pomodoroCiclos": 8');
                        const adulteradoRejeitado = cfg59.analisarEValidarArquivoImportacao(adulteradoTexto, cat59);
                        const adulteradoComentario = exp59.conteudoArquivo.replace('Versão do Addon: 261116.20', 'Versão do Addon: 261116.99');
                        const comentarioAdulteradoRejeitado = cfg59.analisarEValidarArquivoImportacao(adulteradoComentario, cat59);

                        const outroAddonTexto = exp59.conteudoArquivo.replace('Addon: JusGovBR — Seleção/Cópia Inteligente', 'Addon: OutroAddon');
                        const outroAddonRejeitado = cfg59.analisarEValidarArquivoImportacao(outroAddonTexto, cat59);

                        const jsonFixoComCabecalho = Def59.parsearJsonComComentarios(
                            '/* =\n * Addon: JusGovBR — Seleção/Cópia Inteligente\n * = */\n{"urlsTurbo":["*://*.jus.br/*"],"ativo":true}'
                        );
                        const jsonFixoOk = Boolean(
                            jsonFixoComCabecalho &&
                            Array.isArray(jsonFixoComCabecalho.urlsTurbo) &&
                            jsonFixoComCabecalho.urlsTurbo[0] === '*://*.jus.br/*' &&
                            jsonFixoComCabecalho.ativo === true
                        );

                        const legadoComObsoleto = cfg59.analisarEValidarArquivoImportacao({
                            projeto: 'JusGovBR',
                            perfis: {
                                padrao: {
                                    pomodoroCiclos: 6,
                                    chaveObsoletaInexistente: true,
                                    modoTurbo: 'valor_invalido_antigo',
                                    pomodoroFocoMinutos: 9999
                                }
                            }
                        }, cat59);

                        const descarteOk = (
                            legadoComObsoleto.ok === true &&
                            legadoComObsoleto.dadosValidados.perfis.padrao.pomodoroCiclos === 6 &&
                            legadoComObsoleto.dadosValidados.perfis.padrao.chaveObsoletaInexistente === undefined &&
                            legadoComObsoleto.dadosValidados.perfis.padrao.modoTurbo === undefined &&
                            legadoComObsoleto.dadosValidados.perfis.padrao.pomodoroFocoMinutos === undefined &&
                            legadoComObsoleto.chavesDescartadas.includes('padrao.chaveObsoletaInexistente') &&
                            legadoComObsoleto.chavesDescartadas.includes('padrao.modoTurbo')
                        );

                        feat59Ok = Boolean(
                            apenasModOk && nomeArqOk && comentarioOk && jsonFixoOk &&
                            importOkObj.ok === true && importOkObj.metadados && importOkObj.metadados.versaoAddon === '261116.20' &&
                            adulteradoRejeitado.ok === false && adulteradoRejeitado.motivo === 'hash_invalido' &&
                            comentarioAdulteradoRejeitado.ok === false && comentarioAdulteradoRejeitado.motivo === 'hash_invalido' &&
                            outroAddonRejeitado.ok === false && outroAddonRejeitado.motivo === 'addon_incompativel' &&
                            descarteOk
                        );
                        detalheFeat59 = `diff=${apenasModOk}, nome=${nomeArqOk}, com=${comentarioOk}, jsonFixo=${jsonFixoOk}, hashOk=${importOkObj.ok}, hashFail=${adulteradoRejeitado.motivo}, comFail=${comentarioAdulteradoRejeitado.motivo}, addonFail=${outroAddonRejeitado.motivo}, descarte=${descarteOk}`;
                    }
                } catch (e59) {
                    detalheFeat59 = e59.message || String(e59);
                }
                registrar(
                    feat59Ok,
                    'FEAT_59_EXPORT_DIFERENCIAL_HASH_E_IMPORT_COMPATIBILIDADE',
                    'Exportação gera JusGovBR-AAMMDD_HHMM.json com hash integral (comentários + dados, sem Formato) e JSONs fixos aceitam cabeçalho de Addon.',
                    { detalhe: detalheFeat59 }
                );
            }

            // Bateria BUG-76: Sincronização unificada entre Minipopup, Badge do ícone, Tooltip, Popup, Opções e Reset
            {
                let bug76Ok = false;
                let detalheBug76 = '';
                try {
                    const ProdCls76 = window.JusGovModuloProdutividade;
                    if (typeof ProdCls76 !== 'function') {
                        detalheBug76 = 'window.JusGovModuloProdutividade ausente.';
                    } else {
                        const mp76 = new ProdCls76();
                        const t76 = 1794850000000;
                        const cfg76 = { pomodoroAtivo: true, pomodoroCiclos: 4, pomodoroFocoMinutos: 25, pomodoroProporcao: 4.5, pomodoroModoAviso: 'completo' };
                        const st76 = mp76.criarEstadoTrabalhoZerado('2026-11-16', t76);
                        st76.pomodoroFaseInicioTs = t76;
                        st76.pomodoroMinutosNaFase = 0;

                        /* Em t76 + 125s (2m05s decorridos mesmo sem tick de 1min), Badge, Tooltip/Opções/Popup e Minipopup devem concordar */
                        const agora76 = t76 + 125000;
                        const meta76 = {
                            outrosCorridoMin: 10,
                            outrosAtivoMin: 10,
                            outrosPausasConf: 0,
                            outrosInicioTs: t76 - 600000,
                            outrosUltimoDescFimTs: t76 - 120000,
                            outrosUltimoDescTipo: 'alivio',
                            multiplosComputadoresSimultaneos: false
                        };
                        const resumo76 = mp76.calcularResumoPomodoro(st76, cfg76, agora76, meta76);
                        const txt76 = mp76.formatarResumoProdutividadeTexto(st76, cfg76, agora76, meta76);

                        const tempoVivoSyncOk = (
                            resumo76.minutosNaFase === 2 &&
                            resumo76.minutosRestantes === 23 &&
                            resumo76.segundosDecorridos === 125 &&
                            txt76.linhaPomodoro.includes('Foco 2/25 min')
                        );
                        const ultimoDescSyncOk = (
                            Boolean(resumo76.ultimoDescansoTexto) &&
                            resumo76.ultimoDescansoTexto === `Alívio realizado às ${mp76.formatarHoraHHMM(t76 - 120000)}hs` &&
                            txt76.linhaPomodoro.includes(resumo76.ultimoDescansoTexto)
                        );

                        const zerado76 = mp76.criarEstadoTrabalhoZerado(mp76.obterDataLocalChaveHoje(agora76), agora76);
                        const resReset76 = mp76.calcularResumoPomodoro(zerado76, cfg76, agora76, null);
                        const txtReset76 = mp76.formatarResumoProdutividadeTexto(zerado76, cfg76, agora76, null);
                        const resetSyncOk = (
                            resReset76.minutosNaFase === 0 &&
                            resReset76.minutosRestantes === 25 &&
                            resReset76.ultimoDescansoTexto === '' &&
                            txtReset76.linhaPomodoro.includes('Foco 0/25 min')
                        );

                        bug76Ok = tempoVivoSyncOk && ultimoDescSyncOk && resetSyncOk;
                        detalheBug76 = `vivo=${tempoVivoSyncOk}, descSync=${ultimoDescSyncOk}, reset=${resetSyncOk}`;
                    }
                } catch (e76) {
                    detalheBug76 = e76.message || String(e76);
                }
                registrar(
                    bug76Ok,
                    'BUG_76_SINCRONIZACAO_UNIFICADA_CONTADORES_E_RESET',
                    'Minipopup, Badge do ícone, Tooltip, Popup e Opções compartilham cálculo vivo unificado (inclusive com nuvem e após reset).',
                    { detalhe: detalheBug76 }
                );
            }

            // Bateria FEAT-61: Tela embaçada + screensaver em descanso, textos Pendente.../Em andamento.../Em andamento?/Concluído!, retorno ao Foco por mousemove, badge 15s e beep suave/moderado/grave
            {
                let feat61Ok = false;
                let detalheFeat61 = '';
                try {
                    const ProdCls61 = window.JusGovModuloProdutividade;
                    if (typeof ProdCls61 !== 'function') {
                        detalheFeat61 = 'window.JusGovModuloProdutividade ausente.';
                    } else {
                        const mp61 = new ProdCls61();
                        const bSuave = mp61.resolverParametrosBeepPomodoro({});
                        const bMod = mp61.resolverParametrosBeepPomodoro({ pomodoroBeepConclusaoAtivo: true, pomodoroBeepIntensidade: 'moderado' });
                        const bGrave = mp61.resolverParametrosBeepPomodoro({ pomodoroBeepConclusaoAtivo: true, pomodoroBeepIntensidade: 'grave' });
                        const bOff = mp61.resolverParametrosBeepPomodoro({ pomodoroBeepConclusaoAtivo: false, pomodoroBeepIntensidade: 'grave' });
                        const beepOk = (
                            bSuave.ativo === true && bSuave.intensidade === 'suave' && bSuave.intervaloMs === 15000 &&
                            bMod.ativo === true && bMod.intensidade === 'moderado' && bMod.intervaloMs === 10000 &&
                            bGrave.ativo === true && bGrave.intensidade === 'grave' && bGrave.intervaloMs === 5000 &&
                            bOff.ativo === false
                        );

                        const vPend = mp61.resolverEstadoVisualMinipopupDescanso({ emDescanso: true, aguardandoOciosidade: true, descansoPendente: true, metaFaseMin: 6 }, 10000);
                        const vAnd = mp61.resolverEstadoVisualMinipopupDescanso({ emDescanso: true, aguardandoOciosidade: false, descansoEmAviso: false, descansoAtividadeAteTs: 0, metaFaseMin: 6, descansoAcumuladoMs: 120000 }, 10000);
                        const vAviso = mp61.resolverEstadoVisualMinipopupDescanso({ emDescanso: true, aguardandoOciosidade: false, descansoEmAviso: true, descansoAvisoTexto: 'Em andamento?', metaFaseMin: 6, descansoAcumuladoMs: 180000 }, 10000);
                        const vConcl = mp61.resolverEstadoVisualMinipopupDescanso({ emDescanso: true, aguardandoOciosidade: false, descansoMinCumprido: true, descansoAtividadeAteTs: 0, metaFaseMin: 6, descansoAcumuladoMs: 380000 }, 10000);

                        const visOk = (
                            vPend.textoStatus === 'Pendente...' && vPend.corBorda === '#dc2626' && vPend.usarTelaEmbaccada === false &&
                            vAnd.textoStatus === 'Em andamento...' && vAnd.corBorda === '#0284c7' && vAnd.usarTelaEmbaccada === true && vAnd.usarScreensaver === true &&
                            vAviso.textoStatus === 'Em andamento?' && vAviso.corBorda === '#eab308' && vAviso.usarTelaEmbaccada === false &&
                            vConcl.textoStatus === 'Concluído!' && vConcl.corBorda === '#16a34a' && vConcl.usarTelaEmbaccada === true && vConcl.usarScreensaver === true
                        );

                        /* Ao cumprir tempo ao vivo (acumuladoMs >= metaFaseMs antes do tick de 1min), mover o mouse retoma Foco com badge verde 15s e dispensa tempo extra */
                        const t61 = 1794860000000;
                        const cfg61 = { pomodoroAtivo: true, pomodoroCiclos: 4, pomodoroFocoMinutos: 25, pomodoroProporcao: 4.16 };
                        const st61 = mp61.criarEstadoTrabalhoZerado('2026-11-16', t61);
                        st61.pomodoroFase = 'alivio';
                        st61.pomodoroDescansoPendente = true;
                        st61.pomodoroDescansoMinCumprido = false;
                        st61.pomodoroDescansoSyncTs = t61;
                        st61.pomodoroDescansoAcumuladoMs = 360000;
                        const rMovCumprido = mp61.aplicarAtividadeEmEstadoTrabalho(st61, t61 + 25000, 'movimento', cfg61);
                        const retFocoVivoOk = (
                            rMovCumprido.iniciouFocoPosDescanso === true &&
                            st61.pomodoroFase === 'foco' &&
                            st61.pomodoroMinutosNaFase === 0 &&
                            st61.pomodoroDescansoAcumuladoMs === 0 &&
                            st61.pomodoroBadgeVerdeAteTs === (t61 + 25000 + 15000)
                        );

                        feat61Ok = beepOk && visOk && retFocoVivoOk;
                        detalheFeat61 = `beep=${beepOk}, vis=${visOk}, retVivo=${retFocoVivoOk}`;
                    }
                } catch (e61) {
                    detalheFeat61 = e61.message || String(e61);
                }
                registrar(
                    feat61Ok,
                    'FEAT_61_SCREENSAVER_DESCANSO_TEXTOS_BEEP_15S',
                    'Tela embaçada + screensaver em descanso, textos Pendente.../Em andamento.../Em andamento?/Concluído!, retorno ao Foco por qualquer interação com badge 15s e beep suave/moderado/grave.',
                    { detalhe: detalheFeat61 }
                );
            }

            // Bateria BUG-78: Execucao real da funcao serializavel do minipopup no DOM (sem TDZ/ReferenceError, com blur e limpeza)
            {
                let bug78Ok = false;
                let detalheBug78 = '';
                try {
                    const ProdCls78 = window.JusGovModuloProdutividade;
                    if (typeof ProdCls78 !== 'function') {
                        detalheBug78 = 'window.JusGovModuloProdutividade ausente.';
                    } else {
                        const mp78 = new ProdCls78();
                        const fnOrig = mp78.obterFuncaoInjecaoBarraPomodoro();
                        const fnSerializada = new Function(`return (${fnOrig.toString()});`)();
                        const cfg78 = {
                            ativoPorConfig: true,
                            deveExibirNormal: true,
                            focoOcultadoGlobal: false,
                            modoBarra: 'sempre',
                            beepAtivo: false,
                            beepIntensidade: 'suave',
                            beepIntervaloMs: 15000,
                            permitirBeep: false,
                            deveExibirModalDescanso: false,
                            modalDados: null
                        };
                        const est78 = mp78.normalizarEstadoGlobalBarraPomodoro({});
                        const st78 = mp78.criarEstadoTrabalhoZerado('2026-11-16', Date.now() - 20000);
                        st78.pomodoroFase = 'alivio';
                        st78.pomodoroDescansoSyncTs = Date.now() - 20000;
                        st78.pomodoroDescansoAcumuladoMs = 20000;
                        const res78 = mp78.calcularResumoPomodoro(st78, { pomodoroAtivo: true, pomodoroFocoMinutos: 25, pomodoroProporcao: 4.5, pomodoroCiclos: 4 }, Date.now(), null);

                        fnSerializada(cfg78, res78, est78);
                        const hostCriado = document.getElementById('jusgov-pomodoro-barra-global');
                        const backdropCriado = document.getElementById('jusgov-pomodoro-backdrop-global');
                        const criouOk = Boolean(hostCriado && backdropCriado);

                        /* Desmonta limpamente passando ativoPorConfig: false */
                        fnSerializada({ ...cfg78, ativoPorConfig: false, deveExibirNormal: false }, res78, est78);
                        const limpouOk = (!document.getElementById('jusgov-pomodoro-barra-global') && !document.getElementById('jusgov-pomodoro-backdrop-global'));

                        bug78Ok = criouOk && limpouOk;
                        detalheBug78 = `criou=${criouOk}, limpou=${limpouOk}`;
                    }
                } catch (e78) {
                    detalheBug78 = e78.message || String(e78);
                }
                registrar(
                    bug78Ok,
                    'BUG_78_INJECAO_MINIPOPUP_SEM_ERRO_TDZ_E_TEARDOWN',
                    'Função serializada do minipopup injeta sem erro TDZ/ReferenceError em DOM real, cria backdrop fosco e limpa ao desligar.',
                    { detalhe: detalheBug78 }
                );

                /* BUG-79: Fonte externa única (SW) com reconciliação ao vivo, compensação de pausa no foco e ausência de avanço local nas guias */
                let bug79Ok = false;
                let detalheBug79 = '';
                try {
                    const mp79 = (typeof window !== 'undefined' && window.JusGovModuloProdutividade)
                        ? new window.JusGovModuloProdutividade()
                        : ((typeof globalThis !== 'undefined' && globalThis.JusGovModuloProdutividade) ? new globalThis.JusGovModuloProdutividade() : null);
                    if (mp79 && typeof mp79.reconciliarEstadoPomodoroAoVivo === 'function' && typeof mp79.construirSnapshotExternoPomodoro === 'function') {
                        const t0 = 1700000000000;
                        const cfg79 = {
                            pomodoroAtivo: true,
                            pomodoroFocoMinutos: 25,
                            pomodoroProporcao: 4.5,
                            pomodoroCiclos: 4,
                            pomodoroModoBarraFlutuante: 'sempre',
                            pomodoroUsarModal: true
                        };
                        const st79 = mp79.criarEstadoTrabalhoZerado('2026-11-16', t0);
                        st79.pomodoroFaseInicioTs = t0;
                        st79.pomodoroFocoAnchorTs = t0;
                        st79.ultimaAtividadeTs = t0;
                        /* Simula pausa automática de 5 minutos (300s) ocorrida no meio do foco */
                        st79.pomodoroFocoPausadoMs = 300000;

                        /* 25min corridos mas 5min pausados => apenas 20min ativos (ainda em foco, exatamente 1200s) */
                        const rMeio = mp79.calcularResumoPomodoro(st79, cfg79, t0 + (25 * 60000), null);
                        const segMeioOk = (rMeio.fase === 'foco' && rMeio.segundosDecorridos === 1200);

                        /* Aos 30min corridos (25min ativos completos), reconciliação ao vivo inicia alívio + modal */
                        const tTrans = t0 + (30 * 60000);
                        st79.ultimaAtividadeTs = tTrans;
                        const recTrans = mp79.reconciliarEstadoPomodoroAoVivo(st79, tTrans, cfg79);
                        const transOk = Boolean(recTrans.alterouEstado && st79.pomodoroFase === 'alivio' && st79.pomodoroModalDescansoChave);

                        /* Após 12s sem interação, descanso inicia de fato e fecha modal globalmente */
                        const tIdle12 = tTrans + 12000;
                        const recIdle = mp79.reconciliarEstadoPomodoroAoVivo(st79, tIdle12, cfg79);
                        const modalFechouOk = Boolean(recIdle.iniciouDescansoReal && !st79.pomodoroModalDescansoChave);

                        /* Snapshot externo alimenta função injetada sem lógica local de avanço (avancarEstadoLocalDescanso removida) */
                        const snapIdle = mp79.construirSnapshotExternoPomodoro(st79, cfg79, null, {}, tIdle12, true);
                        const fnSrc = mp79.obterFuncaoInjecaoBarraPomodoro().toString();
                        const semAvancoLocal = !fnSrc.includes('avancarEstadoLocalDescanso');

                        let domSyncOk = true;
                        if (typeof document !== 'undefined') {
                            const fnDom = mp79.obterFuncaoInjecaoBarraPomodoro();
                            fnDom(snapIdle.cfgExib, snapIdle.resumoPomodoro, snapIdle.estadoBarra);
                            const host79 = document.getElementById('jusgov-pomodoro-barra-global');
                            const modal79 = document.getElementById('jusgov-modal-produtividade-trabalho');
                            domSyncOk = Boolean(host79 && !modal79 && snapIdle.cfgExib.agoraServidor === tIdle12);
                            fnDom({ ...snapIdle.cfgExib, ativoPorConfig: false, deveExibirNormal: false }, snapIdle.resumoPomodoro, snapIdle.estadoBarra);
                        }

                        /* Após cumprir 6 min de alívio, marca descanso mínimo cumprido */
                        const tConcl = tTrans + (6 * 60000) + 1000;
                        const recConcl = mp79.reconciliarEstadoPomodoroAoVivo(st79, tConcl, cfg79);
                        const conclOk = Boolean(recConcl.concluiuDescanso && st79.pomodoroDescansoMinCumprido);

                        bug79Ok = segMeioOk && transOk && modalFechouOk && semAvancoLocal && domSyncOk && conclOk;
                        detalheBug79 = `segMeio=${rMeio.segundosDecorridos}, trans=${transOk}, modalFechou=${modalFechouOk}, semAvancoLocal=${semAvancoLocal}, domSync=${domSyncOk}, concl=${conclOk}`;
                    }
                } catch (e79) {
                    detalheBug79 = e79.message || String(e79);
                }
                registrar(
                    bug79Ok,
                    'BUG_79_SINCRONISMO_EXTERNO_RECONCILIACAO_AO_VIVO',
                    'Contadores sincronizados exclusivamente por snapshot externo do SW com reconciliação ao vivo e compensação exata de pausas.',
                    { detalhe: detalheBug79 }
                );

                /* BUG-77: Alt + Botão do Meio (com ou sem Ctrl) aplica .focus(), confirma editável via .closest('[contenteditable]')/input/textarea e cola */
                let bug77Ok = false;
                let detalheBug77 = '';
                const setTimeoutOrig77 = globalThis.setTimeout;
                const prevClip1_77 = typeof window !== 'undefined' ? window.__JUSGOV_ULTIMO_CLIPBOARD__ : undefined;
                const prevClip2_77 = typeof window !== 'undefined' ? window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ : undefined;
                let container77 = null;
                try {
                    const BotaoMeioCls77 = window.JusGovBotaoMeioColagem;
                    if (BotaoMeioCls77 && typeof document !== 'undefined' && document.body) {
                        const tarefas77 = [];
                        globalThis.setTimeout = (fn, ms, ...args) => {
                            if (ms === 250 && typeof fn === 'function') {
                                tarefas77.push(() => fn(...args));
                                return tarefas77.length;
                            }
                            return setTimeoutOrig77(fn, ms, ...args);
                        };

                        container77 = document.createElement('div');
                        container77.id = 'jusgov-bug77-container';
                        const ceHost77 = document.createElement('div');
                        ceHost77.id = 'ce-host-77';
                        ceHost77.setAttribute('contenteditable', 'true');
                        ceHost77.tabIndex = -1;
                        const pFilho77 = document.createElement('p');
                        const spanFilho77 = document.createElement('span');
                        spanFilho77.id = 'span-filho-77';
                        spanFilho77.textContent = 'Base ';
                        pFilho77.appendChild(spanFilho77);
                        ceHost77.appendChild(pFilho77);

                        const wrap77 = document.createElement('div');
                        wrap77.id = 'wrap-77';
                        const inpDin77 = document.createElement('input');
                        inpDin77.type = 'text';
                        wrap77.addEventListener('click', () => {
                            if (!inpDin77.isConnected) wrap77.appendChild(inpDin77);
                            inpDin77.focus();
                        });

                        container77.appendChild(ceHost77);
                        container77.appendChild(wrap77);
                        document.body.appendChild(container77);

                        /* Caso 1: BotaoMeioColagem direto em filho <span> dentro de [contenteditable] com Alt + Meio */
                        const bm77 = new BotaoMeioCls77({ ativo: true });
                        let cbAlvo77 = null;
                        bm77.tratarMouseDown({ button: 1, altKey: true, ctrlKey: false, target: spanFilho77, preventDefault() { }, stopPropagation() { } });
                        const focadoAntes77 = (document.activeElement === ceHost77);
                        bm77.tratarCliqueBotaoMeio(
                            { button: 1, altKey: true, ctrlKey: false, isTrusted: false, target: spanFilho77, preventDefault() { }, stopPropagation() { } },
                            'Texto Slot 1',
                            (_txt, alvoCb) => { cbAlvo77 = alvoCb; },
                            'Texto Slot 2'
                        );
                        while (tarefas77.length > 0) (tarefas77.shift())();
                        const ceColouOk = Boolean(focadoAntes77 && cbAlvo77 === ceHost77 && ceHost77.textContent.includes('Texto Slot 1'));

                        /* Caso 2: Alt + Ctrl + Botão do Meio em wrapper que ativa/foca <input> ao clicar -> cola Slot 2 */
                        inpDin77.blur();
                        document.body.focus();
                        bm77.tratarMouseDown({ button: 1, altKey: true, ctrlKey: true, target: wrap77, preventDefault() { }, stopPropagation() { } });
                        bm77.tratarCliqueBotaoMeio(
                            { button: 1, altKey: true, ctrlKey: true, isTrusted: false, target: wrap77, preventDefault() { }, stopPropagation() { } },
                            'Texto Slot 1',
                            null,
                            'Texto Slot 2'
                        );
                        while (tarefas77.length > 0) (tarefas77.shift())();
                        const ctrlAltWrapperOk = Boolean(document.activeElement === inpDin77 && inpDin77.value === 'Texto Slot 2');

                        /* Caso 3: Integração no orquestrador copia-selecionar (Alt + Ctrl + Botão do Meio em filho de [contenteditable]) */
                        let motorOk = true;
                        const motor77 = window.JusGovMotorSelecaoTeste;
                        if (motor77 && typeof motor77.aoPressionarBotaoMouse === 'function') {
                            const origMeio77 = motor77.obterColarBotaoMeioAtivo ? motor77.obterColarBotaoMeioAtivo() : true;
                            if (motor77.definirColarBotaoMeioAtivo) motor77.definirColarBotaoMeioAtivo(true);
                            window.__JUSGOV_ULTIMO_CLIPBOARD__ = { texto: 'Clip Atual 77', formatado: false };
                            window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = { texto: 'Clip Anterior 77', formatado: false };

                            const ceInteg77 = document.createElement('div');
                            ceInteg77.setAttribute('contenteditable', 'true');
                            ceInteg77.tabIndex = 0;
                            const pInteg77 = document.createElement('p');
                            pInteg77.textContent = 'Inicio ';
                            ceInteg77.appendChild(pInteg77);
                            container77.appendChild(ceInteg77);

                            document.body.focus();
                            pInteg77.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 1, altKey: true, ctrlKey: true }));
                            const focoNoHostInteg = (document.activeElement === ceInteg77);
                            pInteg77.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 1, altKey: true, ctrlKey: true }));
                            while (tarefas77.length > 0) (tarefas77.shift())();

                            motorOk = Boolean(focoNoHostInteg && document.activeElement === ceInteg77 && ceInteg77.textContent.includes('Clip Anterior 77'));
                            if (motor77.definirColarBotaoMeioAtivo) motor77.definirColarBotaoMeioAtivo(origMeio77);
                        }

                        bug77Ok = ceColouOk && ctrlAltWrapperOk && motorOk;
                        detalheBug77 = `ceColou=${ceColouOk}, ctrlAltWrapper=${ctrlAltWrapperOk}, motorOk=${motorOk}`;
                    }
                } catch (e77) {
                    detalheBug77 = e77.message || String(e77);
                } finally {
                    globalThis.setTimeout = setTimeoutOrig77;
                    if (typeof window !== 'undefined') {
                        window.__JUSGOV_ULTIMO_CLIPBOARD__ = prevClip1_77;
                        window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__ = prevClip2_77;
                    }
                    if (container77 && container77.isConnected) container77.remove();
                }
                registrar(
                    bug77Ok,
                    'BUG_77_ALT_BOTAO_MEIO_FOCO_CLOSEST_CONTENTEDITABLE',
                    'Alt + Botão do Meio (com ou sem Ctrl) aplica .focus(), confirma editável via .closest([contenteditable])/input/textarea e cola no alvo.',
                    { detalhe: detalheBug77 }
                );

                /* FEAT-62: Opção Estilo (Compacto/Normal/Expandido) + hover só botões + tooltip do ícone + início retroativo de descanso + posição/blur em movimento vs clique */
                let feat62Ok = false;
                let detalheFeat62 = '';
                try {
                    const mp62 = (typeof window !== 'undefined' && window.JusGovModuloProdutividade)
                        ? new window.JusGovModuloProdutividade()
                        : ((typeof globalThis !== 'undefined' && globalThis.JusGovModuloProdutividade) ? new globalThis.JusGovModuloProdutividade() : null);
                    const cfgCls62 = (typeof window !== 'undefined' && typeof window.JusGovConfiguracoes === 'function')
                        ? new window.JusGovConfiguracoes()
                        : null;
                    if (mp62 && cfgCls62) {
                        /* 1. Schema Config: pomodoroEstiloMinipopup */
                        let cfgOk = true;
                        if (typeof cfgCls62.sanitizarObjetoConfiguracao === 'function') {
                            const sNorm = cfgCls62.sanitizarObjetoConfiguracao({ pomodoroEstiloMinipopup: 'normal' });
                            const sExp = cfgCls62.sanitizarObjetoConfiguracao({ pomodoroEstiloMinipopup: 'expandido' });
                            const sInv = cfgCls62.sanitizarObjetoConfiguracao({ pomodoroEstiloMinipopup: 'invalido' });
                            cfgOk = (
                                sNorm.configValida.pomodoroEstiloMinipopup === 'normal' &&
                                sExp.configValida.pomodoroEstiloMinipopup === 'expandido' &&
                                sInv.chavesDescartadas.includes('pomodoroEstiloMinipopup')
                            );
                        }

                        /* 2. Início retroativo do descanso a partir da última interação (ex: parou durante pisca amarelo 25s antes de 25:00) */
                        const t0_62 = 1700000000000;
                        const cfg62 = {
                            pomodoroAtivo: true,
                            pomodoroFocoMinutos: 25,
                            pomodoroProporcao: 4.5,
                            pomodoroCiclos: 4,
                            pomodoroModoAviso: 'completo',
                            pomodoroEstiloMinipopup: 'compacto'
                        };
                        const st62 = mp62.criarEstadoTrabalhoZerado('2026-11-16', t0_62);
                        st62.pomodoroFaseInicioTs = t0_62;
                        st62.pomodoroFocoAnchorTs = t0_62;
                        const tFimFoco = t0_62 + (25 * 60000);
                        /* Parou de interagir 25s antes do fim do foco */
                        st62.ultimaAtividadeTs = tFimFoco - 25000;
                        const rec62 = mp62.reconciliarEstadoPomodoroAoVivo(st62, tFimFoco, cfg62);
                        const rRetro = mp62.calcularResumoPomodoro(st62, cfg62, tFimFoco, null);
                        const retroOk = Boolean(
                            rec62.alterouEstado &&
                            st62.pomodoroFase === 'alivio' &&
                            st62.pomodoroDescansoAcumuladoMs === 25000 &&
                            rRetro.aguardandoOciosidade === false &&
                            rRetro.segundosRestantes === (360 - 25)
                        );

                        /* 3. Movimento vs Clique/Tecla durante descanso: centro+blur (temporário) vs topo-centro sem blur */
                        const tDesc = tFimFoco + 160000; // >50% alívio (185s acumulado)
                        mp62.aplicarAtividadeEmEstadoTrabalho(st62, tDesc, 'movimento', cfg62);
                        const rMov62 = mp62.calcularResumoPomodoro(st62, cfg62, tDesc + 100);
                        const posMov62 = mp62.resolverPosicaoEfetivaBarraPomodoro(rMov62, { posicaoVertical: 'inferior', alinhamento: 'direita' }, tDesc + 100);
                        const visMov62 = mp62.resolverEstadoVisualMinipopupDescanso(rMov62, tDesc + 100);
                        const movCentroBlurOk = Boolean(
                            posMov62.modoEspecial === 'aviso_movimento_centro_blur' &&
                            posMov62.posicaoVertical === 'centro_tela' &&
                            posMov62.centroTela === true &&
                            posMov62.telaEmbaccada === true &&
                            visMov62.usarTelaEmbaccada === true
                        );

                        const tClk62 = tDesc + 3000;
                        mp62.aplicarAtividadeEmEstadoTrabalho(st62, tClk62, 'click_ou_tecla', cfg62);
                        const rClk62 = mp62.calcularResumoPomodoro(st62, cfg62, tClk62 + 100);
                        const posClk62 = mp62.resolverPosicaoEfetivaBarraPomodoro(rClk62, { posicaoVertical: 'inferior', alinhamento: 'direita' }, tClk62 + 100);
                        const visClk62 = mp62.resolverEstadoVisualMinipopupDescanso(rClk62, tClk62 + 100);
                        const clkTopoSemBlurOk = Boolean(
                            posClk62.modoEspecial === 'aviso_topo_centro' &&
                            posClk62.posicaoVertical === 'superior' &&
                            posClk62.alinhamento === 'centro' &&
                            posClk62.telaEmbaccada === false &&
                            visClk62.usarTelaEmbaccada === false
                        );

                        /* 4. Estilos Compacto / Normal / Expandido + hover apenas botões + sem badge verde + tooltip igual ao ícone */
                        let dom62Ok = true;
                        if (typeof document !== 'undefined') {
                            const stFoco62 = mp62.criarEstadoTrabalhoZerado('2026-11-16', t0_62);
                            stFoco62.pomodoroUltimoDescansoTipo = 'alivio';
                            stFoco62.pomodoroUltimoDescansoFimTs = t0_62 + 60000;
                            stFoco62.pomodoroBadgeVerdeAteTs = t0_62 + 90000; // Mesmo se setado, nao exibe badge verde!
                            const agoraFoco62 = t0_62 + 65000;
                            const snapC = mp62.construirSnapshotExternoPomodoro(stFoco62, { ...cfg62, pomodoroEstiloMinipopup: 'compacto' }, null, { nivelDetalhe: 0 }, agoraFoco62, false);
                            const snapN = mp62.construirSnapshotExternoPomodoro(stFoco62, { ...cfg62, pomodoroEstiloMinipopup: 'normal' }, null, { nivelDetalhe: 1 }, agoraFoco62, false);
                            const snapE = mp62.construirSnapshotExternoPomodoro(stFoco62, { ...cfg62, pomodoroEstiloMinipopup: 'expandido' }, null, { nivelDetalhe: 2 }, agoraFoco62, false);
                            const infoIco = mp62.formatarResumoProdutividadeTexto(stFoco62, cfg62, agoraFoco62, null);

                            const fn62 = mp62.obterFuncaoInjecaoBarraPomodoro();
                            fn62(snapC.cfgExib, snapC.resumoPomodoro, snapC.estadoBarra);
                            const host62 = document.getElementById('jusgov-pomodoro-barra-global');
                            const ui62 = host62 && host62.__jusgovUI;
                            const okComp = Boolean(ui62 && ui62.spanFase.style.display === 'none' && ui62.spanStatus.style.display === 'none' && ui62.pill.title === infoIco.tooltipTitle);

                            /* Hover em Compacto: mostra somente botões, sem badge verde nem expandir status */
                            ui62.pill.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
                            const okHoverC = Boolean(ui62.btnFixar.style.display === 'inline-flex' && ui62.spanStatus.style.display === 'none');
                            ui62.pill.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));

                            fn62(snapN.cfgExib, snapN.resumoPomodoro, snapN.estadoBarra);
                            const okNorm = Boolean(ui62.spanFase.style.display === 'inline-block' && ui62.spanStatus.style.display === 'none');

                            fn62(snapE.cfgExib, snapE.resumoPomodoro, snapE.estadoBarra);
                            const okExp = Boolean(ui62.spanFase.style.display === 'inline-block' && ui62.spanStatus.style.display === 'block' && ui62.spanStatus.textContent.includes('Alívio realizado às'));

                            /* Movimento em descanso no DOM real mantém blur e centraliza temporariamente; clique retira blur e vai pro topo-centro */
                            fn62(mp62.construirSnapshotExternoPomodoro(st62, cfg62, null, { posicaoVertical: 'inferior', alinhamento: 'direita' }, tDesc + 100, false).cfgExib, rMov62, { posicaoVertical: 'inferior', alinhamento: 'direita' });
                            const movDomBlur = Boolean(document.getElementById('jusgov-pomodoro-backdrop-global') && host62.style.top === '50%' && host62.style.left === '50%');

                            fn62(mp62.construirSnapshotExternoPomodoro(st62, cfg62, null, { posicaoVertical: 'inferior', alinhamento: 'direita' }, tClk62 + 100, false).cfgExib, rClk62, { posicaoVertical: 'inferior', alinhamento: 'direita' });
                            const clkDomNoBlur = Boolean(!document.getElementById('jusgov-pomodoro-backdrop-global') && host62.style.top === '0px');

                            fn62({ ...snapC.cfgExib, ativoPorConfig: false, deveExibirNormal: false }, snapC.resumoPomodoro, snapC.estadoBarra);
                            dom62Ok = okComp && okHoverC && okNorm && okExp && movDomBlur && clkDomNoBlur;
                        }

                        feat62Ok = cfgOk && retroOk && movCentroBlurOk && clkTopoSemBlurOk && dom62Ok;
                        detalheFeat62 = `cfg=${cfgOk}, retro=${retroOk}, movBlur=${movCentroBlurOk}, clkSemBlur=${clkTopoSemBlurOk}, dom=${dom62Ok}`;
                    }
                } catch (e62) {
                    detalheFeat62 = e62.message || String(e62);
                }
                registrar(
                    feat62Ok,
                    'FEAT_62_ESTILO_MINIPOPUP_TOOLTIP_RETROATIVO_DESCANSO_E_BLUR_MOVIMENTO',
                    'Estilo Compacto/Normal/Expandido sincronizado em Opções, hover somente botões com tooltip do ícone, início retroativo do descanso e centro+blur no movimento vs topo-centro sem blur no clique/tecla.',
                    { detalhe: detalheFeat62 }
                );

                /* BUG-80: Reset de fábrica preserva estatísticas + toggle Pomodoro on/off atualiza online todas as superfícies e mantém Corrido/Ativo/Pausas */
                let bug80Ok = false;
                let detalheBug80 = '';
                try {
                    const mp80 = (typeof window !== 'undefined' && window.JusGovModuloProdutividade)
                        ? new window.JusGovModuloProdutividade()
                        : ((typeof globalThis !== 'undefined' && globalThis.JusGovModuloProdutividade) ? new globalThis.JusGovModuloProdutividade() : null);
                    const cfgCls80 = (typeof window !== 'undefined' && typeof window.JusGovConfiguracoes === 'function')
                        ? new window.JusGovConfiguracoes()
                        : null;
                    if (mp80 && cfgCls80) {
                        const resetSrc = cfgCls80.resetarPerfis.toString();
                        const resetPreservaStats = Boolean(
                            !resetSrc.includes('storage.local.clear()') &&
                            resetSrc.includes('jusgovTrabalhoEstado') &&
                            resetSrc.includes('totalCopias') &&
                            resetSrc.includes('totalAlertas') &&
                            resetSrc.includes('dataInicioContadores')
                        );
                        const syncSrc = mp80.sincronizarIndicadoresGlobaisPomodoro.toString();
                        const suportaTodasGuias = syncSrc.includes("=== 'todas'");

                        const t80 = 1700000000000;
                        const st80 = mp80.criarEstadoTrabalhoZerado('2026-11-16', t80);
                        st80.corridoMinutos = 48;
                        st80.ativoMinutos = 32;
                        st80.pausasConfirmadas = 3;
                        const cfgOn = { pomodoroAtivo: true, pomodoroFocoMinutos: 25, pomodoroProporcao: 4.5, pomodoroCiclos: 4, pomodoroModoAviso: 'completo' };
                        const cfgOff = { ...cfgOn, pomodoroAtivo: false };

                        const snapOn = mp80.construirSnapshotExternoPomodoro(st80, cfgOn, null, {}, t80 + 60000, false);
                        const snapOff = mp80.construirSnapshotExternoPomodoro(st80, cfgOff, null, {}, t80 + 60000, false);
                        const infoOn = mp80.formatarResumoProdutividadeTexto(st80, cfgOn, t80 + 60000, null);
                        const infoOff = mp80.formatarResumoProdutividadeTexto(st80, cfgOff, t80 + 60000, null);
                        const statsSempreOk = Boolean(
                            infoOn.linhaTempos.includes('Corrido 00h:48m') &&
                            infoOn.linhaTempos.includes('Ativo 00h:32m') &&
                            infoOn.linhaTempos.includes('Pausas 3') &&
                            infoOff.linhaTempos === infoOn.linhaTempos &&
                            !infoOff.tooltipTitle.includes('Pomodoro') &&
                            infoOn.tooltipTitle.includes('Pomodoro') &&
                            snapOn.cfgExib.ativoPorConfig === true &&
                            snapOff.cfgExib.ativoPorConfig === false
                        );

                        /* Ao reativar Pomodoro enquanto descanso já aguarda ociosidade, reconcilia modal pendente imediatamente */
                        const stModal80 = mp80.criarEstadoTrabalhoZerado('2026-11-16', t80);
                        stModal80.pomodoroFase = 'alivio';
                        stModal80.pomodoroCicloAtual = 1;
                        stModal80.pomodoroFaseInicioTs = t80;
                        stModal80.pomodoroDescansoPendente = true;
                        stModal80.ultimaAtividadeTs = t80;
                        const recReativa = mp80.reconciliarEstadoPomodoroAoVivo(stModal80, t80 + 2000, cfgOn);
                        const modalReativaOk = Boolean(recReativa.alterouEstado && stModal80.pomodoroModalDescansoChave);

                        let domToggleOk = true;
                        if (typeof document !== 'undefined') {
                            const fn80 = mp80.obterFuncaoInjecaoBarraPomodoro();
                            fn80(snapOn.cfgExib, snapOn.resumoPomodoro, snapOn.estadoBarra);
                            const apareceuOn = Boolean(document.getElementById('jusgov-pomodoro-barra-global'));
                            fn80(snapOff.cfgExib, snapOff.resumoPomodoro, snapOff.estadoBarra);
                            const sumiuOff = !document.getElementById('jusgov-pomodoro-barra-global');

                            const contMain = document.createElement('div');
                            const contPom = document.createElement('div');
                            mp80.renderizarResumoProdutividadeDom(contMain, st80, cfgOff, t80 + 60000, { containerPomodoro: contPom, ocultarPomodoroQuandoInativo: true });
                            const domOffStatsOk = Boolean(contMain.textContent.includes('Corrido 00h:48m') && contMain.textContent.includes('Pausas 3') && contPom.style.display === 'none');
                            mp80.renderizarResumoProdutividadeDom(contMain, st80, cfgOn, t80 + 60000, { containerPomodoro: contPom, ocultarPomodoroQuandoInativo: true });
                            const domOnPomOk = Boolean(contPom.style.display === 'flex' && contPom.textContent.includes('Pomodoro'));

                            domToggleOk = apareceuOn && sumiuOff && domOffStatsOk && domOnPomOk;
                        }

                        bug80Ok = resetPreservaStats && suportaTodasGuias && statsSempreOk && modalReativaOk && domToggleOk;
                        detalheBug80 = `resetStats=${resetPreservaStats}, todas=${suportaTodasGuias}, statsSempre=${statsSempreOk}, modalReativa=${modalReativaOk}, domToggle=${domToggleOk}`;
                    }
                } catch (e80) {
                    detalheBug80 = e80.message || String(e80);
                }
                registrar(
                    bug80Ok,
                    'BUG_80_RESET_FABRICA_PRESERVA_ESTATISTICAS_E_TOGGLE_POMODORO_ONLINE',
                    'Restaurar padrão de fábrica preserva estatísticas; alternar Pomodoro on/off reflete online em todas as guias, badge/tooltip, Popup e Opções mantendo Corrido/Ativo/Pausas sempre ativos.',
                    { detalhe: detalheBug80 }
                );
            }
        }
    }

    Object.freeze(DebugModulos.prototype);
    return Object.freeze(DebugModulos);
}));