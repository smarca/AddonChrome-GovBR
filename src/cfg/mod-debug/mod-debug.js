/* ==========================================================================
 * Nome do arquivo: mod-debug.js
 * PROJETO: JusGovBR - Cópia Inteligente & PJe Turbo
 * MÓDULO: Suíte Modularizada de Auditoria, Regressão e Fuzzing
 * AUTOR/CONTATO: smarca@gmail.com
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/mod-debug/mod-debug.js
 * - Classe Exportada: ModuloDebug (window.JusGovModuloDebug)
 * - Funções Globais Exportadas: window.JusGovExecutarAuditoria, window.JusGovExecutarAuditoriaAsync, window.JusGovExecutarFuzzing, window.JusGovExecutarFuzzingAsync
 * - Submódulos Injetados (Null Objects ADR-006): DebugGeradores, DebugVerificadores, DebugMascaras, DebugSelecao, DebugInterface, DebugModulos, DebugFuzzing
 * - Regras / Seções: Diretrizes 5/7/14/16, ADR-006 (Null Object Pattern), Seção 6.165
 *
 * ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE MANUTENÇÃO (BLUEPRINT):
 * 1) FINALIDADE:
 *    Fachada Principal (Facade) da suíte automatizada de auditoria e fuzzing em Chrome Headless
 *    e na aba Laboratório de Opções. Orquestra os submódulos especializados:
 *    - debug-geradores.js    : Geradores determinísticos e aleatórios (CPF/CNPJ/CNJ/Data/INSS/PIS) + diagnóstico
 *    - debug-verificadores.js: Validadores de cálculo (Mod10/Mod11/Mod97, datas bissextas, mutantes de DV)
 *    - debug-mascaras.js     : Máscaras e 13 grupos forenses, filtros HTML (5 níveis), catálogo JSON e DOMParser XSS
 *    - debug-selecao.js      : Seleção DOM, acumulador, tabelas, cursor, limites, geometria, Flash Border e marcador
 *    - debug-interface.js    : HTMLs (options.html/editor_demo), preferências, perfis perfis.json, backup total, mapeamento
 *    - debug-modulos.js      : Módulos POO (mod-input, mod-navegador, mod-anti-ampulheta, mod-manut, mod-produt)
 *    - debug-fuzzing.js      : Fuzzing mutacional e estresse por tempo (1s/tipo)
 * 2) TOLERÂNCIA A FALHAS (ADR-006):
 *    Qualquer submódulo ausente é substituído automaticamente por um Null Object imutável seguro,
 *    impedindo ReferenceError ou TypeError durante execuções parciais ou em manutenção.
 * ========================================================================== */

(function (raiz, fabrica) {
    if (typeof define === 'function' && define.amd) {
        define([], fabrica);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = fabrica();
    } else {
        const Modulo = fabrica();
        raiz.JusGovModuloDebug = Modulo;
        const instanciaPadrao = new Modulo();
        raiz.JusGovExecutarAuditoria = (opcoes = {}) => instanciaPadrao.executarAuditoriaCompleta(opcoes);
        raiz.JusGovExecutarAuditoriaAsync = (opcoes = {}, onProgresso) => instanciaPadrao.executarAuditoriaCompletaAsync(opcoes, onProgresso);
        raiz.JusGovExecutarFuzzing = (duracaoMsPorTipo = 1000) => instanciaPadrao.executarAuditoriaCompleta({ fuzz: true, duracaoMs: duracaoMsPorTipo });
        raiz.JusGovExecutarFuzzingAsync = async (duracaoMsPorTipo = 1000, onProgresso) => instanciaPadrao.executarAuditoriaCompletaAsync({ fuzz: true, duracaoMs: duracaoMsPorTipo }, onProgresso);
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const NULL_GERADORES = Object.freeze({
        randInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        gerarCpfValido: () => '',
        gerarCpfInvalido: () => '',
        gerarCnpjTradicionalValido: () => '',
        gerarCnpjTradicionalInvalido: () => '',
        gerarCnpjAlfanumericoValido: () => '',
        gerarCnpjAlfanumericoInvalido: () => '',
        gerarCnjValido: () => '',
        gerarCnjInvalido: () => '',
        gerarDataValida: () => '01/01/2026',
        gerarDataInvalida: () => '31/02/2026',
        gerarInssNbValido: () => '',
        gerarPisValido: () => '',
        mutarDigitoAleatorio: (s) => s,
        mutarDigitoParaInvalido: (s) => s,
        mutarDataParaInvalida: (s) => s,
        calcularPosicaoCursorHumana: () => ({ rotulo: '1..0', charAlvo: 'STRING_INTEIRA' }),
        obterCabecalhoAmbienteDiagnostico: () => ['RELATORIO DE AUDITORIA - JUSGOVBR']
    });

    const NULL_EXECUTOR = Object.freeze({
        executar: () => { }
    });

    const NULL_FUZZING = Object.freeze({
        executarBateriaEstresse: () => { },
        executarBateriaFuzzing: () => { },
        executarBateriaFuzzingAsync: async () => { }
    });

    function instanciarSubmodulo(globalNome, fallback) {
        const g = (typeof window !== 'undefined') ? window : ((typeof self !== 'undefined') ? self : null);
        const Ctor = g && g[globalNome];
        if (typeof Ctor === 'function') {
            try { return new Ctor(); } catch (_) { }
        }
        return fallback;
    }

    class ModuloDebug {
        #geradores;
        #verificadores;
        #mascaras;
        #selecao;
        #interfaceTests;
        #modulos;
        #fuzzing;

        constructor(opcoes = {}) {
            this.#geradores = opcoes.geradores || instanciarSubmodulo('JusGovDebugGeradores', NULL_GERADORES);
            this.#verificadores = opcoes.verificadores || instanciarSubmodulo('JusGovDebugVerificadores', NULL_EXECUTOR);
            this.#mascaras = opcoes.mascaras || instanciarSubmodulo('JusGovDebugMascaras', NULL_EXECUTOR);
            this.#selecao = opcoes.selecao || instanciarSubmodulo('JusGovDebugSelecao', NULL_EXECUTOR);
            this.#interfaceTests = opcoes.interfaceTests || instanciarSubmodulo('JusGovDebugInterface', NULL_EXECUTOR);
            this.#modulos = opcoes.modulos || instanciarSubmodulo('JusGovDebugModulos', NULL_EXECUTOR);
            this.#fuzzing = opcoes.fuzzing || instanciarSubmodulo('JusGovDebugFuzzing', NULL_FUZZING);
        }

        static get NULL_OBJECTS() {
            return Object.freeze({
                geradores: NULL_GERADORES,
                verificadores: NULL_EXECUTOR,
                mascaras: NULL_EXECUTOR,
                selecao: NULL_EXECUTOR,
                interfaceTests: NULL_EXECUTOR,
                modulos: NULL_EXECUTOR,
                fuzzing: NULL_FUZZING
            });
        }

        executarAuditoriaCompleta(opcoes = {}) {
            const g = (typeof window !== 'undefined') ? window : globalThis;
            g.__JUSGOV_AUDITORIA_EM_CURSO__ = true;
            const linhasLog = this.#geradores.obterCabecalhoAmbienteDiagnostico();
            let totalTestes = 0;
            let totalAprovados = 0;

            const registrar = (passou, categoria, descricao, info = {}) => {
                totalTestes++;
                if (passou) totalAprovados++;
                const status = passou ? '[OK]' : '[FALHA]';

                const infoObj = typeof info === 'string' ? { detalhe: info } : (info || {});
                const textoTestado = infoObj.textoTestado !== undefined ? String(infoObj.textoTestado) : '';
                const tam = textoTestado.length;
                const infoPos = this.#geradores.calcularPosicaoCursorHumana(textoTestado, infoObj.idxCursor);
                const posResumo = textoTestado
                    ? ` | Texto="${textoTestado}" (tam=${tam}) | Cursor=${infoPos.rotulo} (${infoPos.charAlvo})`
                    : '';
                const espObtResumo = (infoObj.esperado !== undefined || infoObj.obtido !== undefined)
                    ? ` | Esperado="${infoObj.esperado !== undefined ? infoObj.esperado : ''}" | Obtido="${infoObj.obtido !== undefined ? infoObj.obtido : ''}"`
                    : '';
                const complemento = infoObj.detalhe ? ` -> ${infoObj.detalhe}` : '';

                linhasLog.push(`${status} [${categoria}] ${descricao}${posResumo}${espObtResumo}${complemento}`);

                if (!passou) {
                    linhasLog.push(`   |-- DIAGNOSTICO DE ERRO:`);
                    linhasLog.push(`   |   * Texto testado            : "${textoTestado}" (tamanho=${tam})`);
                    linhasLog.push(`   |   * Posicao clique do cursor : ${infoPos.rotulo}`);
                    linhasLog.push(`   |   * Caractere no ponto       : ${infoPos.charAlvo}`);
                    if (infoObj.esperado !== undefined) {
                        linhasLog.push(`   |   * Esperado                 : "${infoObj.esperado}"`);
                    }
                    if (infoObj.obtido !== undefined) {
                        linhasLog.push(`   |   * Obtido                   : "${infoObj.obtido}"`);
                    }
                    if (infoObj.detalhe) {
                        linhasLog.push(`   |   * Detalhe adicional        : ${infoObj.detalhe}`);
                    }
                }
            };

            if (!g.JusGovConstantes || !g.JusGovAvisoFlutuante || !g.JusGovAcumulador) {
                linhasLog.push('[ERRO CRITICO] Modulos base nao encontrados no contexto atual.');
                g.__JUSGOV_AUDITORIA_EM_CURSO__ = false;
                return { total: 1, aprovados: 0, logTexto: linhasLog.join('\n') };
            }

            const ctx = {
                C: g.JusGovConstantes,
                validador: new g.JusGovAvisoFlutuante(),
                acumulador: new g.JusGovAcumulador(),
                motorTeste: g.JusGovMotorSelecaoTeste,
                geradores: this.#geradores,
                registrar,
                linhasLog
            };

            this.#verificadores.executar(ctx);
            this.#mascaras.executar(ctx);
            this.#selecao.executar(ctx);
            this.#interfaceTests.executar(ctx);
            this.#modulos.executar(ctx);
            this.#fuzzing.executarBateriaEstresse(ctx);

            if (opcoes && opcoes.fuzz) {
                linhasLog.push('\n--- BATERIA EXTENSIVA: FUZZING RANDÔMICO POR TEMPO (1s/T POR TIPO DE TESTE) ---');
                const duracao = typeof opcoes.duracaoMs === 'number' ? opcoes.duracaoMs : 1000;
                this.#fuzzing.executarBateriaFuzzing(duracao, registrar, this.#geradores);
            }

            linhasLog.push('\n======================================================================');
            linhasLog.push(`RESUMO FINAL: ${totalAprovados} DE ${totalTestes} TESTES APROVADOS.`);
            linhasLog.push('======================================================================');

            g.__JUSGOV_AUDITORIA_EM_CURSO__ = false;
            return {
                total: totalTestes,
                aprovados: totalAprovados,
                logTexto: linhasLog.join('\n')
            };
        }

        async executarAuditoriaCompletaAsync(opcoes = {}, onProgresso) {
            if (opcoes && opcoes.fuzz) {
                const linhasLog = this.#geradores.obterCabecalhoAmbienteDiagnostico();
                let totalTestes = 0;
                let totalAprovados = 0;
                const registrar = (passou, categoria, descricao, info = {}) => {
                    totalTestes++;
                    if (passou) totalAprovados++;
                    const status = passou ? '[OK]' : '[FALHA]';
                    const comp = (info && info.detalhe) ? ` | ${info.detalhe}` : '';
                    linhasLog.push(`${status} [${categoria}] ${descricao}${comp}`);
                };
                linhasLog.push('\n--- BATERIA EXTENSIVA: FUZZING RANDÔMICO POR TEMPO (1s/T POR TIPO DE TESTE) ---');
                const duracao = typeof opcoes.duracaoMs === 'number' ? opcoes.duracaoMs : 1000;
                await this.#fuzzing.executarBateriaFuzzingAsync(duracao, registrar, onProgresso, this.#geradores);
                linhasLog.push('\n======================================================================');
                linhasLog.push(`RESUMO FINAL DO FUZZING: ${totalAprovados} DE ${totalTestes} BATERIAS APROVADAS.`);
                linhasLog.push('======================================================================');
                return {
                    total: totalTestes,
                    aprovados: totalAprovados,
                    logTexto: linhasLog.join('\n')
                };
            }

            const etapasAuditoria = [
                { pct: 14, rotulo: 'debug-verificadores: Cálculos Mod10/Mod11/Mod97, Datas e Mutantes DV' },
                { pct: 28, rotulo: 'debug-mascaras: 13 Grupos Forenses, Filtros HTML 5 Níveis e Catálogo JSON' },
                { pct: 45, rotulo: 'debug-selecao: Seleção DOM, Acumulador, Tabelas, Cursor e Geometria Visual' },
                { pct: 64, rotulo: 'debug-interface: HTMLs (Options/EditorDemo), Perfis, Backup e Mapeamento' },
                { pct: 84, rotulo: 'debug-modulos: Input, Navegador, Ampulheta, Manutenção e Produtividade' },
                { pct: 100, rotulo: 'debug-fuzzing: Estresse de Entradas e Consolidação Final' }
            ];

            for (const etapa of etapasAuditoria) {
                if (typeof onProgresso === 'function') {
                    onProgresso(etapa.pct, etapa.rotulo);
                }
                await new Promise(r => setTimeout(r, 60));
            }

            return this.executarAuditoriaCompleta(opcoes);
        }
    }

    Object.freeze(ModuloDebug.prototype);
    return Object.freeze(ModuloDebug);
}));