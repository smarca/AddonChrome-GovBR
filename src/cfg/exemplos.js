/* ==========================================================================
 * PROJETO: JusGovBR - Catalogo Estruturado de Exemplos Homologados
 * ARQUIVO: src/cfg/exemplos.js
 *
 * @MAPA-IA:
 * - Arquivo: src/cfg/exemplos.js
 * - Objeto Exportado: CATALOGO_EXEMPLOS_JUSGOVBR (window.CATALOGO_EXEMPLOS_JUSGOVBR)
 * - Origem Fonte da Verdade: src/cfg/exemplos.json (compilado por util/gerar_exemplos_js.ps1)
 * - Regras / Decisões: ADR-005 (Fonte Única), Imutabilidade Profunda Object.freeze
 * ========================================================================== */

'use strict';

const CATALOGO_EXEMPLOS_JUSGOVBR = Object.freeze({
    politica: 'POLICE_APPEND_ONLY_NUNCA_REMOVER_CENTRALIZADO_JSON',
    arquivoCentralizador: 'src/cfg/exemplos.json',
    casosDeUso: Object.freeze([
        Object.freeze({
            idCasoUso: '01_DOCUMENTOS_AUDITAVEIS_MODULO_11_E_97',
            titulo: 'Documentos Oficiais Auditáveis (Módulo 11, ASCII-48 e Módulo 97 BigInt)',
            descricao: 'Documentos fiscais, pessoais, previdenciários e judiciais com cálculo determinístico de Dígito Verificador e decodificação na Wiki Forense.',
            comoUsar: '1 clique em qualquer parte seleciona o documento inteiro e valida silenciosamente (ou exibe alerta âmbar se inválido); Shift + 1 clique copia apenas os dígitos/letras sem pontuação.',
            mascaras: Object.freeze([
                Object.freeze({
                    idMascara: '01.01_CPF_RECEITA_FEDERAL',
                    nome: 'CPF — Cadastro de Pessoas Físicas (RFB)',
                    mascara: 'NNN.NNN.NNN-DD',
                    grupoMotor: 'DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO',
                    tipoBloco: 'verificacao_matematica',
                    metodoValidacao: 'validarCPF',
                    calculavel: true,
                    comoUsar: '1 clique copia o CPF inteiro e identifica a Região Fiscal pelo 9º dígito; Shift + 1 clique copia os 11 dígitos puros.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '099.123.459-67', comentario: 'Fictício padrão 0991234 (Paraná - 9ª Região Fiscal RFB) — Sandbox Options' }),
                        Object.freeze({ valor: '099.123.451-00', comentario: 'Fictício padrão 0991234 (1ª Região Fiscal RFB: DF, GO, TO, MT / TRF1) — Sandbox Options' }),
                        Object.freeze({ valor: '099.912.349-18', comentario: 'Fictício série 09991234 (Paraná - 9ª Região Fiscal RFB) — Sandbox Options' }),
                        Object.freeze({ valor: '099.912.341-60', comentario: 'Fictício série 09991234 (1ª Região Fiscal RFB: DF, GO, TO, MT / TRF1)' }),
                        Object.freeze({ valor: '529.982.247-25', comentario: 'CPF válido clássico (7ª Região Fiscal RFB: ES, RJ) — Tabela Sandbox Options' }),
                        Object.freeze({ valor: '352.621.413-15', comentario: 'CPF válido (3ª Região Fiscal RFB: CE, MA, PI) — Auditoria Wiki' }),
                        Object.freeze({ valor: '258.198.013-34', comentario: 'CPF válido em interface PJe — Auditoria Interface' }),
                        Object.freeze({ valor: '099.123.409-06', comentario: 'CPF válido adicional série 0991234 (9ª Região Fiscal RFB: PR, SC)' }),
                        Object.freeze({ valor: '099.123.450-29', comentario: 'CPF válido adicional série 0991234 (0ª Região Fiscal RFB: RS) — Sandbox Options' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '099.123.459-99', comentario: 'CPF com dígito verificador incorreto — Sandbox Options' }),
                        Object.freeze({ valor: '099.123.459-00', comentario: 'CPF com dígito verificador incorreto — Central de Ajuda Options' }),
                        Object.freeze({ valor: '099.912.349-99', comentario: 'CPF série 09991234 com DV incorreto' }),
                        Object.freeze({ valor: '111.111.111-11', comentario: 'CPF inválido por sequência repetida — Sandbox Options' }),
                        Object.freeze({ valor: '529.982.247-99', comentario: 'CPF com DV incorreto — Auditoria Debug' })
                    ])
                }),
                Object.freeze({
                    idMascara: '01.02_CNPJ_CLASSICO_NUMERICO',
                    nome: 'CNPJ Clássico Numérico (RFB)',
                    mascara: 'NN.NNN.NNN/NNNN-DD',
                    grupoMotor: 'DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO',
                    tipoBloco: 'verificacao_matematica',
                    metodoValidacao: 'validarCNPJ',
                    calculavel: true,
                    comoUsar: '1 clique copia o CNPJ inteiro, identifica Matriz (/0001) ou Filial e calcula automaticamente o CNPJ da Matriz; Shift + 1 clique copia os 14 dígitos puros.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '09.912.345/0001-96', comentario: 'CNPJ Matriz fictício padrão 0991234 — Sandbox Options' }),
                        Object.freeze({ valor: '09.912.345/0002-77', comentario: 'CNPJ Filial fictício padrão 0991234 (calcula Matriz 09.912.345/0001-96)' }),
                        Object.freeze({ valor: '09.991.234/0001-12', comentario: 'CNPJ Matriz fictício série 09991234 — Sandbox Options' }),
                        Object.freeze({ valor: '09.991.234/0002-01', comentario: 'CNPJ Filial fictício série 09991234' }),
                        Object.freeze({ valor: '11.222.333/0001-81', comentario: 'CNPJ Matriz clássico — Tabela Sandbox Options' }),
                        Object.freeze({ valor: '29.979.036/0001-40', comentario: 'CNPJ Matriz institucional INSS — Auditoria Wiki' }),
                        Object.freeze({ valor: '00.000.000/0002-72', comentario: 'CNPJ Filial Banco do Brasil (calcula Matriz 00.000.000/0001-91)' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '09.912.345/0001-99', comentario: 'CNPJ Clássico com DV incorreto — Sandbox Options' }),
                        Object.freeze({ valor: '09.991.234/0001-99', comentario: 'CNPJ Clássico série 09991234 com DV incorreto' }),
                        Object.freeze({ valor: '11.222.333/0001-99', comentario: 'CNPJ Clássico com DV incorreto — Auditoria Debug' }),
                        Object.freeze({ valor: '00.000.000/0000-00', comentario: 'CNPJ com todos dígitos repetidos' }),
                        Object.freeze({ valor: '09.912.345/0001-00', comentario: 'CNPJ com DV Módulo 11 zerado incorreto' }),
                        Object.freeze({ valor: '11.111.111/1111-11', comentario: 'CNPJ com todos dígitos iguais a 1' })
                    ])
                }),
                Object.freeze({
                    idMascara: '01.03_NOVO_CNPJ_ALFANUMERICO_RFB',
                    nome: 'Novo CNPJ Alfanumérico (IN RFB 2.229/2024)',
                    mascara: 'AA.AAA.AAA/AAAA-DD ([0-9A-Z], ASCII - 48)',
                    grupoMotor: 'DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO',
                    tipoBloco: 'verificacao_matematica',
                    metodoValidacao: 'validarCNPJ',
                    calculavel: true,
                    comoUsar: '1 clique copia o CNPJ Alfanumérico inteiro; Shift + 1 clique copia os 14 caracteres alfanuméricos sem pontuação.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '12.ABC.345/01DE-35', comentario: 'Novo CNPJ Alfanumérico oficial RFB — Sandbox e Tabela Options' }),
                        Object.freeze({ valor: '09.912.ABC/0001-15', comentario: 'Novo CNPJ Alfanumérico série 0991234 Matriz' }),
                        Object.freeze({ valor: '09.9AB.345/0001-93', comentario: 'Novo CNPJ Alfanumérico série 0991234 - Matriz' }),
                        Object.freeze({ valor: '09.9AB.345/0002-74', comentario: 'Novo CNPJ Alfanumérico série 0991234 - Filial 02' }),
                        Object.freeze({ valor: '99.XYZ.999/0001-67', comentario: 'Novo CNPJ Alfanumérico limite alfabético' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '12.ABC.345/01DE-99', comentario: 'Novo CNPJ Alfanumérico com DV incorreto — Sandbox Options' }),
                        Object.freeze({ valor: '09.912.ABC/0001-99', comentario: 'Novo CNPJ Alfanumérico série 0991234 com DV incorreto' }),
                        Object.freeze({ valor: '12.ABC.345/01DE-11', comentario: 'Novo CNPJ Alfanumérico com DV incorreto' }),
                        Object.freeze({ valor: '09.9AB.345/0001-99', comentario: 'Novo CNPJ Alfanumérico série 0991234 com DV incorreto' }),
                        Object.freeze({ valor: '12.ABC.345/01DE-XX', comentario: 'Novo CNPJ com DV não-numérico inválido' })
                    ])
                }),
                Object.freeze({
                    idMascara: '01.04_PROCESSO_JUDICIAL_CNJ',
                    nome: 'Processo Judicial Padrão CNJ (Resolução CNJ 65/2008)',
                    mascara: 'NNNNNNN-DD.AAAA.J.TR.OOOO',
                    grupoMotor: 'NUMERACOES_ID_E_PUBLICAS',
                    tipoBloco: 'verificacao_matematica',
                    metodoValidacao: 'validarCNJ',
                    calculavel: true,
                    comoUsar: '1 clique copia o processo CNJ inteiro e decodifica Ramo/Tribunal na Wiki Forense; Shift + 1 clique copia os 20 dígitos puros com preenchimento de zeros à esquerda (zero-pad).',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '0991234-55.2024.4.01.4002', comentario: 'Processo CNJ TRF1 (Justiça Federal 1ª Região - DF / Brasília) — Sandbox Options' }),
                        Object.freeze({ valor: '991234-55.2024.4.01.4002', comentario: 'Processo CNJ curto (6 dígitos iniciais p/ teste Shift Zero-Pad) — Sandbox Options' }),
                        Object.freeze({ valor: '0991234-55.2024.4.01.4002', comentario: 'Processo CNJ TRF1 (Justiça Federal 1ª Região 2024) — Tabela Sandbox Options' }),
                        Object.freeze({ valor: '0991234-21.2025.4.01.4002', comentario: 'Processo CNJ TRF1 (Justiça Federal 1ª Região 2025)' }),
                        Object.freeze({ valor: '0991234-84.2026.4.01.4002', comentario: 'Processo CNJ TRF1 (Justiça Federal 1ª Região 2026)' }),
                        Object.freeze({ valor: '0991234-87.2024.8.16.0030', comentario: 'Processo CNJ TJPR (Justiça Estadual Paraná 2024) — Tabela Sandbox Options' }),
                        Object.freeze({ valor: '0991234-53.2025.8.16.0030', comentario: 'Processo CNJ TJPR (Justiça Estadual Paraná 2025)' }),
                        Object.freeze({ valor: '0991234-19.2026.8.16.0030', comentario: 'Processo CNJ TJPR (Justiça Estadual Paraná 2026)' }),
                        Object.freeze({ valor: '0991234-43.2025.8.16.0001', comentario: 'Processo CNJ TJPR Curitiba (Justiça Estadual Paraná — Curitiba)' }),
                        Object.freeze({ valor: '0991001-43.2024.4.01.4000', comentario: 'Processo CNJ TRF1 — Tabela Sandbox Linha 01' }),
                        Object.freeze({ valor: '0991002-28.2024.4.01.4000', comentario: 'Processo CNJ TRF1 — Tabela Sandbox Linha 02' }),
                        Object.freeze({ valor: '0991003-13.2024.4.01.4000', comentario: 'Processo CNJ TRF1 — Tabela Sandbox Linha 03' }),
                        Object.freeze({ valor: '0991001-58.2024.4.01.4002', comentario: 'Processo CNJ TRF1 — Teste Atalho F1 / Fuzzing' }),
                        Object.freeze({ valor: '0999123-60.2024.4.01.4002', comentario: 'Processo CNJ série 0999123 TRF1' }),
                        Object.freeze({ valor: '0999123-89.2026.4.01.4002', comentario: 'Processo CNJ série 0999123 TRF1 (Justiça Federal 1ª Região)' }),
                        Object.freeze({ valor: '0999123-24.2026.8.16.0030', comentario: 'Processo CNJ série 0999123 TJPR (Justiça Estadual Paraná)' }),
                        Object.freeze({ valor: '1004615-62.2026.4.01.4002', comentario: 'Processo CNJ TRF1 — Auditoria Wiki CNJ' }),
                        Object.freeze({ valor: '0001234-70.2024.8.18.0140', comentario: 'Processo CNJ Estadual — Auditoria Debug' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '0991234-65.2024.4.01.4002', comentario: 'Processo CNJ com DV Módulo 97 incorreto — Sandbox Options' }),
                        Object.freeze({ valor: '0991234-99.2024.4.01.4002', comentario: 'Processo CNJ TRF1 (Justiça Federal 1ª Região) com DV incorreto' }),
                        Object.freeze({ valor: '0991234-99.2024.8.16.0030', comentario: 'Processo CNJ TJPR (Justiça Estadual Paraná) com DV incorreto' }),
                        Object.freeze({ valor: '0991234-99.2025.8.16.0001', comentario: 'Processo CNJ TJPR com DV Módulo 97 incorreto' }),
                        Object.freeze({ valor: '0991234-00.2024.4.01.4002', comentario: 'Processo CNJ com DV zerado inválido' }),
                        Object.freeze({ valor: '0999123-99.2026.4.01.4002', comentario: 'Processo CNJ série 0999123 TRF1 com DV Módulo 97 incorreto' })
                    ])
                }),
                Object.freeze({
                    idMascara: '01.05_BENEFICIO_PREVIDENCIARIO_INSS_NB',
                    nome: 'Benefício Previdenciário INSS / Dataprev (NB)',
                    mascara: 'EE/NNNNNNNNND, NNN.NNN.NNN-D ou 10 dígitos',
                    grupoMotor: 'DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO',
                    tipoBloco: 'verificacao_matematica',
                    metodoValidacao: 'validarNumeroBeneficioINSS',
                    calculavel: true,
                    comoUsar: 'Em NB com espécie (31/0991234502), 1 clique na espécie ou na barra "/" seleciona tudo; 1 clique no número seleciona apenas o NB; 2 cliques seleciona tudo. Em NB pontuado (099.123.450-2), 1 clique seleciona tudo.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '31/0991234502', idxClique: 1, esperadoClique1: '31/0991234502', comentario: 'NB com espécie 31 (Auxílio por Incapacidade Temporária) série 0991234 — Sandbox Options' }),
                        Object.freeze({ valor: '099.123.450-2', comentario: 'NB pontuado válido série 0991234 — Sandbox Options' }),
                        Object.freeze({ valor: '31/6506589241', idxClique: 1, esperadoClique1: '31/6506589241', comentario: 'NB com espécie 31 válido — Auditoria Wiki INSS' }),
                        Object.freeze({ valor: '01/6506589241', idxClique: 1, esperadoClique1: '01/6506589241', comentario: 'NB com espécie 01 extinta (Pensão por Morte Rural — Tipo Extinto)' }),
                        Object.freeze({ valor: '719.657.155-0', comentario: 'NB pontuado válido — Auditoria Wiki INSS' }),
                        Object.freeze({ valor: '6464966891', comentario: 'NB de 10 dígitos puros válido — Auditoria Debug' }),
                        Object.freeze({ valor: '42/099.123.450-2', idxClique: 1, esperadoClique1: '42/099.123.450-2', comentario: 'NB com espécie 42 (Aposentadoria por Tempo de Contribuição) e máscara pontuada' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '099.123.450-9', comentario: 'NB pontuado com DV Módulo 11 incorreto — Sandbox Options' }),
                        Object.freeze({ valor: '31/6506589240', comentario: 'NB com espécie e DV incorreto — Auditoria Debug' }),
                        Object.freeze({ valor: '719.657.155-9', comentario: 'NB pontuado com DV incorreto — Auditoria Debug' }),
                        Object.freeze({ valor: '1111111111', comentario: 'NB inválido por sequência repetida — Auditoria Debug' }),
                        Object.freeze({ valor: '099.123.450-0', comentario: 'NB pontuado com DV Módulo 11 incorreto' }),
                        Object.freeze({ valor: '31/0991234509', comentario: 'NB com espécie e DV incorreto' })
                    ])
                })
            ])
        }),
        Object.freeze({
            idCasoUso: '02_DATAS_CALENDARIO_BISSEXTOS_E_HORARIOS',
            titulo: 'Datas Numéricas, Abreviadas, Extensas, ISO e Data + Horário Contíguo',
            descricao: 'Validação determinística de calendário gregoriano, regra secular de anos bissextos, dia da semana (Dia Útil vs. Final de Semana) e limites de hora/minuto/segundo.',
            comoUsar: 'Datas isoladas, abreviadas e competências saem inteiras com 1 clique. Em Data + Horário, 1 clique na data copia só a data; 1 clique no horário copia só o horário; 1 clique no espaço/conector ou 2 cliques copia Data + Horário inteiros.',
            mascaras: Object.freeze([
                Object.freeze({
                    idMascara: '02.01_DATAS_NUMERICAS_E_BISSEXTOS',
                    nome: 'Datas Numéricas (DD/MM/AAAA, DD.MM.AAAA, ISO AAAA-MM-DD)',
                    mascara: 'DD/MM/AAAA | DD.MM.AAAA | AAAA-MM-DD',
                    grupoMotor: 'DATAS_E_HORARIOS',
                    tipoBloco: 'verificacao_matematica',
                    metodoValidacao: 'validarData',
                    calculavel: true,
                    comoUsar: '1 clique seleciona a data inteira e decodifica o Dia da Semana na Wiki Forense.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '29/02/2024', comentario: 'Data bissexta válida (2024) — Sandbox Options' }),
                        Object.freeze({ valor: '29/02/2000', comentario: 'Data bissexta secular válida (2000) — Auditoria Debug' }),
                        Object.freeze({ valor: '11/09/2026', comentario: 'Data válida em Dia Útil (Sexta-feira) — Sandbox Options' }),
                        Object.freeze({ valor: '12/09/2026', comentario: 'Data válida em Final de Semana (Sábado) — Sandbox Options' }),
                        Object.freeze({ valor: '23/10/2026', comentario: 'Data válida — Central de Ajuda Options' }),
                        Object.freeze({ valor: '10/01/2026', comentario: 'Data válida — Tabela Sandbox Linha 01' }),
                        Object.freeze({ valor: '15/02/2026', comentario: 'Data válida — Tabela Sandbox Linha 02' }),
                        Object.freeze({ valor: '11.09.2026', comentario: 'Data numérica com separadores ponto — Auditoria Grupo 12' }),
                        Object.freeze({ valor: '01.05.19', comentario: 'Data curta com ponto final de sentença — Auditoria Debug' }),
                        Object.freeze({ valor: '2026-11-04', comentario: 'Data em formato ISO AAAA-MM-DD (Quarta-feira) — Auditoria Wiki' }),
                        Object.freeze({ valor: '31/12/1869', comentario: 'Data de bug técnico limite pré-1870 válida — Sandbox Options' }),
                        Object.freeze({ valor: '31/12/1999', comentario: 'Data de bug técnico virada de milênio Y2K válida — Sandbox Options' }),
                        Object.freeze({ valor: '01/01/1970', comentario: 'Data de bug técnico início da Era Unix (Epoch 0) válida — Sandbox Options' }),
                        Object.freeze({ valor: '09/09/1999', comentario: 'Data de bug técnico marco histórico 9/9/99 válida — Sandbox Options' }),
                        Object.freeze({ valor: '18/06/2027', comentario: 'Data Futura válida em Dia Útil (Sexta-feira - Data Futura) — Sandbox Options' }),
                        Object.freeze({ valor: '15/05/2027', comentario: 'Data Futura válida em Final de Semana (Sábado - Data Futura) — Sandbox Options' }),
                        Object.freeze({ valor: '20/11/2027', comentario: 'Data Futura válida em Final de Semana (Sábado - Data Futura) — Sandbox Options' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '29/02/2025', comentario: 'Data inexistente em ano comum não-bissexto — Sandbox Options' }),
                        Object.freeze({ valor: '2025-02-29', comentario: 'Data ISO inexistente em ano comum não-bissexto — Sandbox Options' }),
                        Object.freeze({ valor: '29/02/2100', comentario: 'Data inexistente em ano secular não-bissexto — Auditoria Debug' }),
                        Object.freeze({ valor: '29/02/1900', comentario: 'Data inexistente em ano secular não-bissexto — Auditoria Debug' }),
                        Object.freeze({ valor: '31/04/2026', comentario: 'Dia 31 inexistente em mês de 30 dias (Abril) — Sandbox Options' }),
                        Object.freeze({ valor: '31/31/1998', comentario: 'Mês e dia inválidos — Sandbox Options' })
                    ])
                }),
                Object.freeze({
                    idMascara: '02.02_DATAS_ABREVIADAS_EXTENSO_E_COMPETENCIA',
                    nome: 'Datas Abreviadas, Por Extenso e Competências Mês/Ano',
                    mascara: 'DD mes. AAAA | DD de mes de AAAA | mes. AA/AAAA',
                    grupoMotor: 'DATA_COM_HORARIO_CONTIGUO',
                    tipoBloco: 'verificacao_matematica',
                    metodoValidacao: 'validarData',
                    calculavel: true,
                    comoUsar: '1 clique em qualquer parte da data abreviada, extensa ou competência seleciona o bloco completo.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '17 ago. 2026', comentario: 'Data abreviada válida — Sandbox Options' }),
                        Object.freeze({ valor: '15 de março de 2024', comentario: 'Data por extenso válida — Sandbox Options' }),
                        Object.freeze({ valor: '22 out. 2026', comentario: 'Data abreviada em timeline do PJe — Auditoria Interface' }),
                        Object.freeze({ valor: '06 abr. 2026', comentario: 'Data abreviada de autuação — Auditoria Interface' }),
                        Object.freeze({ valor: 'out. 26', validarApenasExtracao: true, comentario: 'Competência Mês/Ano abreviada — Sandbox Options' }),
                        Object.freeze({ valor: 'ago. 2026', validarApenasExtracao: true, comentario: 'Competência Mês/Ano com 4 dígitos' }),
                        Object.freeze({ valor: 'sexta-feira, 23 de outubro de 2026 as 21:38:42 BRT', validarApenasExtracao: true, comentario: 'Data extensa completa com dia da semana e horário — Auditoria Grupo 5' }),
                        Object.freeze({ valor: '23 de outubro de 2026 as 21:38:42 BRT', comentario: 'Data extensa com horário e fuso — Auditoria Wiki' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '29 de fevereiro de 2025', comentario: 'Data por extenso inválida em ano não-bissexto — Sandbox Options' }),
                        Object.freeze({ valor: '31 de novembro de 2026', comentario: 'Data por extenso inválida em mês de 30 dias' }),
                        Object.freeze({ valor: '31 de abril de 2026', comentario: 'Mês de abril possui apenas 30 dias' }),
                        Object.freeze({ valor: '30 de fevereiro de 2024', comentario: 'Fevereiro bissexto possui 29 dias (nunca 30)' }),
                        Object.freeze({ valor: '31 de junho de 2025', comentario: 'Junho possui 30 dias' })
                    ])
                }),
                Object.freeze({
                    idMascara: '02.03_DATA_COM_HORARIO_CONTIGUO_E_HORARIOS_ISOLADOS',
                    nome: 'Data com Horário Espaçado/Composto e Horários Isolados',
                    mascara: 'DD/MM/AAAA HH:MM(:SS) | DD/MM/AAAA - HH:MM:SS | HH:MM(:SS)',
                    grupoMotor: 'DATA_COM_HORARIO_CONTIGUO',
                    tipoBloco: 'verificacao_matematica',
                    metodoValidacao: 'auditarTrechoSelecionado',
                    calculavel: true,
                    comoUsar: '1 clique na data copia só a data; 1 clique na hora copia só a hora; 1 clique no espaço/hífen/conector ou 2 cliques copia Data + Horário inteiros.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '28/10/2026 06:28', cliques: 2, comentario: 'Data c/ Horário HH:MM — Sandbox Bloco 1 e Bloco 5' }),
                        Object.freeze({ valor: '28/10/2026 06:28:50', cliques: 2, comentario: 'Data c/ Horário HH:MM:SS — Sandbox Bloco 1' }),
                        Object.freeze({ valor: '18/09/2026 10:03:34', cliques: 2, comentario: 'Data c/ Horário HH:MM:SS — Sandbox Bloco 5 e Bloco 7' }),
                        Object.freeze({ valor: '28/10/2026 - 06:28:50', cliques: 2, comentario: 'Data c/ Horário e Hífen — Sandbox Bloco 5' }),
                        Object.freeze({ valor: '28/10/2026 – 14:30:00', cliques: 2, comentario: 'Data c/ Horário e Traço En-Dash — Sandbox Bloco 5' }),
                        Object.freeze({ valor: '28/10/2026 às 09:15:20', cliques: 2, comentario: 'Data com conector "às" e horário — Sandbox Bloco 5' }),
                        Object.freeze({ valor: '23/10/2026 10:14:18', cliques: 2, comentario: 'Data numérica com horário contíguo — Auditoria Grupo 5' }),
                        Object.freeze({ valor: '22/10/2026 13:27:16', cliques: 2, comentario: 'Data com horário em juntada PJe — Auditoria Interface' }),
                        Object.freeze({ valor: '06:28', comentario: 'Horário isolado HH:MM válido — Auditoria Debug' }),
                        Object.freeze({ valor: '14:30:00', comentario: 'Horário isolado HH:MM:SS válido — Auditoria Grupo 12' }),
                        Object.freeze({ valor: '05:19', comentario: 'Horário isolado em timeline PJe — Auditoria Interface' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '29/02/2025 06:28', comentario: 'Data inexistente c/ Horário — Sandbox Options' }),
                        Object.freeze({ valor: '28/10/2026 25:10', comentario: 'Hora excedente (>= 24h) — Sandbox Options' }),
                        Object.freeze({ valor: '28/10/2026 06:75', comentario: 'Minuto excedente (>= 60m) — Sandbox Options' }),
                        Object.freeze({ valor: '28/10/2026 06:28:88', comentario: 'Segundo excedente (>= 60s) — Auditoria Debug' }),
                        Object.freeze({ valor: '25:10', comentario: 'Horário isolado com hora excedente — Sandbox Options' }),
                        Object.freeze({ valor: '14:65', comentario: 'Horário isolado com minuto excedente — Auditoria Debug' })
                    ])
                })
            ])
        }),
        Object.freeze({
            idCasoUso: '03_CHAVES_FISCAIS_BOLETOS_E_DOCUMENTOS_CIDADAO',
            titulo: 'Chaves PIX/UUID, NF-e, Boletos FEBRABAN e Documentos Civis/Profissionais',
            descricao: 'Reconhecimento imediato de chaves fiscais contíguas ou espaçadas, linhas digitáveis de boletos e documentos civis/profissionais.',
            comoUsar: 'Em documentos contíguos, 1 clique seleciona tudo. Em sequências espaçadas/boletos, 1 clique seleciona o bloco e 1 clique no espaço ou 2 cliques seleciona toda a cadeia.',
            mascaras: Object.freeze([
                Object.freeze({
                    idMascara: '03.01_UUID_CHAVE_ALEATORIA_PIX',
                    nome: 'Chave Aleatória PIX / UUID v4',
                    mascara: '8-4-4-4-12 hexadecimal',
                    grupoMotor: 'CHAVES_FISCAIS_E_BOLETOS_CONTIGUOS',
                    tipoBloco: 'bloco_simples',
                    calculavel: false,
                    comoUsar: '1 clique seleciona os 36 caracteres da chave UUID.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: 'e7f2c68b-59d8-4f81-a67b-4573199872e4', comentario: 'Chave Aleatória PIX / UUID v4 — Auditoria Grupo 1' }),
                        Object.freeze({ valor: '0991234a-b5c6-4d7e-8f90-123456789abc', comentario: 'Chave Aleatória PIX série 0991234' }),
                        Object.freeze({ valor: '123e4567-e89b-12d3-a456-426614174000', comentario: 'UUID v1/v4 canônico padrão RFC 4122' }),
                        Object.freeze({ valor: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', comentario: 'Chave PIX UUID aleatória BACEN' }),
                        Object.freeze({ valor: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', comentario: 'UUID de namespace DNS' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '0991234a-b5c6-4d7e-8f90-123456789ab', comentario: 'UUID curto com 31 caracteres hexadecimais' }),
                        Object.freeze({ valor: '0991234a-b5c6-4d7e-8f90-123456789abcd', comentario: 'UUID longo com 33 caracteres hexadecimais' }),
                        Object.freeze({ valor: '0991234g-b5c6-4d7e-8f90-123456789abc', comentario: 'UUID com caractere não-hexadecimal \'g\'' }),
                        Object.freeze({ valor: '0991234a-b5c6-4d7e-8f90_123456789abc', comentario: 'UUID com sublinhado em vez de hífen' }),
                        Object.freeze({ valor: '0991234a_b5c6_4d7e_8f90_123456789abc', comentario: 'UUID sem separadores hifenizados' })
                    ])
                }),
                Object.freeze({
                    idMascara: '03.02_NFE_BOLETOS_E_SEQUENCIAS_ESPACADAS',
                    nome: 'Chaves NF-e, Boletos FEBRABAN e Sequências Numéricas Espaçadas',
                    mascara: '11 blocos de 4 dígitos | Linha Digitável FEBRABAN | Blocos espaçados',
                    grupoMotor: 'CHAVES_FISCAIS_E_BOLETOS_ESPACADOS',
                    tipoBloco: 'bloco_simples',
                    calculavel: false,
                    comoUsar: '1 clique em um bloco numérico copia apenas o bloco; 1 clique no espaço entre blocos ou 2 cliques copia a cadeia inteira.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '215 7014 6992 8831', idxClique: 0, cliques: 1, esperadoClique1: '215', comentario: 'Sequência numérica espaçada (1 clique copia o bloco; livre de falso positivo de telefone) — Sandbox Bloco 2' }),
                        Object.freeze({ valor: '3524 0112 3456 7800 0195 5500 1000 0001 2310 0000 0124', idxClique: 0, cliques: 2, comentario: 'Chave de Acesso NF-e 44 dígitos — Auditoria Grupo 2' }),
                        Object.freeze({ valor: '34191.79001 01043.510047 91020.150008 5 95680000015000', idxClique: 0, cliques: 2, comentario: 'Linha Digitável de Boleto FEBRABAN — Auditoria Grupo 2' }),
                        Object.freeze({ valor: '3524 0100 0000 0000 0000 5500 1000 0000 0110 0000 0000', idxClique: 0, cliques: 2, comentario: 'Chave NF-e 44 dígitos espaçada em quartetos' }),
                        Object.freeze({ valor: '84670000001 7 43590024020 9 02403173010 8 00010000000 0', idxClique: 0, cliques: 2, comentario: 'Linha Digitável Convênio Arrecadação 48 dígitos' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '23793.38128 60083.01234', comentario: 'Linha digitável incompleta apenas 2 campos' }),
                        Object.freeze({ valor: '1234 5678 9012', comentario: 'Sequência numérica curta inferior a 16 dígitos' }),
                        Object.freeze({ valor: '23793.38128 60083.012340 90006.333306 1 90000000', comentario: 'Boleto com campo corrompido' }),
                        Object.freeze({ valor: '0000 0000', comentario: 'Sequência curta com apenas 8 dígitos' }),
                        Object.freeze({ valor: '123 456 789', comentario: 'Sequência de trios não correspondente a boletos' })
                    ])
                }),
                Object.freeze({
                    idMascara: '03.03_PIS_RG_CEP_OAB_PASSAPORTE_SEI_PLACA_UC',
                    nome: 'PIS/PASEP/NIT, RG, CEP, OAB, Passaporte, SEI!, Placas e Unidade Consumidora',
                    mascara: 'PIS | RG | CEP | OAB/UF | Passaporte | SEI! | Placa Mercosul | UC',
                    grupoMotor: 'DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO',
                    tipoBloco: 'bloco_simples',
                    calculavel: false,
                    comoUsar: '1 clique copia o documento inteiro; protocolos simples com barra ("63055/2023") copiam tudo ao clicar na barra ou com 2 cliques.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '120.43256.72-8', comentario: 'PIS/PASEP/NIT válido com cálculo Módulo 11 — Sandbox Options' }),
                        Object.freeze({ valor: '099.12345.67-9', comentario: 'PIS/PASEP/NIT válido fictício padrão 0991234 — Sandbox e Central de Ajuda Options' }),
                        Object.freeze({ valor: '099.91234.56-5', comentario: 'PIS/PASEP/NIT válido fictício série 09991234' }),
                        Object.freeze({ valor: '120.43256.72-4', comentario: 'PIS/PASEP/NIT histórico Central de Ajuda Options (legado)' }),
                        Object.freeze({ valor: '123.45678.90-1', comentario: 'PIS/PASEP/NIT — Auditoria Grupo 3' }),
                        Object.freeze({ valor: '12.345.678-9', comentario: 'RG civil — Auditoria Grupo 3' }),
                        Object.freeze({ valor: '85851-000', comentario: 'CEP Paraná (Oeste Paranaense) — Sandbox Options' }),
                        Object.freeze({ valor: '85863-711', comentario: 'CEP Paraná (Justiça Federal PR)' }),
                        Object.freeze({ valor: '80010-000', comentario: 'CEP Curitiba/PR — Central de Ajuda e Sandbox Options' }),
                        Object.freeze({ valor: '70070-900', comentario: 'CEP Brasília/DF TRF1 — Auditoria Grupo 3' }),
                        Object.freeze({ valor: 'OAB/PR 099.123', comentario: 'Inscrição OAB Paraná série 0991234 — Central de Ajuda Options' }),
                        Object.freeze({ valor: 'OAB/DF 12.345', comentario: 'Inscrição OAB/DF — Auditoria Grupo 3' }),
                        Object.freeze({ valor: 'BR123456', comentario: 'Passaporte Brasileiro — Auditoria Grupo 3' }),
                        Object.freeze({ valor: '00000.000000/2025-00', comentario: 'Processo Administrativo SEI! — Central de Ajuda Options' }),
                        Object.freeze({ valor: '00001.000002/2024-03', comentario: 'Processo Administrativo SEI! — Auditoria Grupo 4' }),
                        Object.freeze({ valor: '09912.345678/2025-01', comentario: 'Processo Administrativo SEI! série 0991234' }),
                        Object.freeze({ valor: 'ABC-1D23', comentario: 'Placa Veicular Mercosul com hífen — Central de Ajuda Options' }),
                        Object.freeze({ valor: 'ABC-1234', comentario: 'Placa Veicular padrão antigo com hífen — Central de Ajuda Options' }),
                        Object.freeze({ valor: 'BRA2E19', comentario: 'Placa Veicular Mercosul contígua — Auditoria Grupo 4' }),
                        Object.freeze({ valor: '63055/2023', cliques: 2, comentario: 'Protocolo com barra de ano — Auditoria Grupo 4' }),
                        Object.freeze({ valor: '1.325.256.019-75', comentario: 'Unidade Consumidora (Não-CPF) — Sandbox Bloco 2' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '120.43256.72-4', comentario: 'PIS/PASEP/NIT com DV Módulo 11 incorreto — Sandbox Options' }),
                        Object.freeze({ valor: '099.12345.67-0', comentario: 'PIS/PASEP/NIT padrão 0991234 com DV Módulo 11 incorreto — Sandbox Options' }),
                        Object.freeze({ valor: '000.00000.00-0', comentario: 'PIS/PASEP/NIT inválido repetido — Sandbox Options' }),
                        Object.freeze({ valor: '00000-00', comentario: 'CEP incompleto com apenas 7 dígitos' }),
                        Object.freeze({ valor: 'OAB/ 12.345', comentario: 'Inscrição OAB sem sigla de UF da Seccional' })
                    ])
                })
            ])
        }),
        Object.freeze({
            idCasoUso: '04_INTERVALOS_REFERENCIAS_PJE_E_CABECALHOS',
            titulo: 'Intervalos, Cardinais com Extenso, Referências de Autos e Cabeçalhos PJe',
            descricao: 'Seleção de intervalos de datas/horas/moedas, números cardinais com extenso entre parênteses, referências de ID/folhas e conversão automática de cabeçalhos PJe.',
            comoUsar: '1 clique no conector/espaço ou 2 cliques seleciona o intervalo ou referência completa.',
            mascaras: Object.freeze([
                Object.freeze({
                    idMascara: '04.01_INTERVALOS_E_CARDINAIS_COM_EXTENSO',
                    nome: 'Intervalos de Datas, Horas, Moedas e Cardinais com Extenso',
                    mascara: 'DD/MM/AAAA a DD/MM/AAAA | HH:MM às HH:MM | R$ X a R$ Y | NN (extenso)',
                    grupoMotor: 'INTERVALOS_E_REFERENCIAS_ID_FOLHAS',
                    tipoBloco: 'bloco_simples',
                    calculavel: false,
                    comoUsar: '1 clique no conector/espaço ou 2 cliques seleciona todo o intervalo ou número com extenso.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '01/01/2026 a 31/12/2026', idxClique: 0, cliques: 2, comentario: 'Intervalo de datas — Central de Ajuda e Auditoria Grupo 6' }),
                        Object.freeze({ valor: '08:00 às 18:00', idxClique: 0, cliques: 2, comentario: 'Intervalo de horários — Central de Ajuda Options' }),
                        Object.freeze({ valor: 'R$ 1.000,00 a R$ 5.000,00', idxClique: 0, cliques: 2, comentario: 'Intervalo de valores monetários — Auditoria Grupo 6' }),
                        Object.freeze({ valor: '65 (sessenta e cinco)', idxClique: 0, cliques: 2, comentario: 'Cardinal com extenso entre parênteses — Sandbox Bloco 2' }),
                        Object.freeze({ valor: '100 (cem)', idxClique: 0, cliques: 2, comentario: 'Número cardinal simples com extenso entre parênteses' }),
                        Object.freeze({ valor: 'R$ 10,00 a R$ 50,00', idxClique: 0, cliques: 2, comentario: 'Intervalo de valores monetários' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '65 (sessenta e quatro)', comentario: 'Extenso divergente do numeral cardinal' }),
                        Object.freeze({ valor: '10 a', comentario: 'Intervalo incompleto sem termo final' }),
                        Object.freeze({ valor: 'a 20', comentario: 'Intervalo sem termo inicial' }),
                        Object.freeze({ valor: 'R$ (cem reais)', comentario: 'Extenso sem numeral cardinal correspondente' }),
                        Object.freeze({ valor: '(cinquenta)', comentario: 'Extenso isolado entre parênteses sem numeral' })
                    ])
                }),
                Object.freeze({
                    idMascara: '04.02_REFERENCIAS_AUTOS_E_CONVERSAO_CABECALHO_PJE',
                    nome: 'Referências de ID/Folhas e Cabeçalhos Nativos do PJe',
                    mascara: 'id NNNNNN pg NNV | fls. NN/NN | Num. NNNNNNNNNN - Pág. N',
                    grupoMotor: 'INTERVALOS_E_REFERENCIAS_ID_FOLHAS',
                    tipoBloco: 'bloco_simples',
                    calculavel: false,
                    comoUsar: '1 clique no rótulo ("id", "fls.") ou 2 cliques seleciona a referência completa.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: 'id 12345678 pg 55v', idxClique: 0, cliques: 2, comentario: 'Referência de ID e página do PJe — Central de Ajuda Options' }),
                        Object.freeze({ valor: 'fls. 10/25', idxClique: 0, cliques: 2, comentario: 'Referência de folhas dos autos — Central de Ajuda Options' }),
                        Object.freeze({ valor: 'fls. 123/130', idxClique: 0, cliques: 2, comentario: 'Referência de folhas dos autos — Auditoria Grupo 6' }),
                        Object.freeze({ valor: 'Num. 2297820154 - Pág. 1', validarApenasCatalogoOuConversao: true, esperadoConversaoPje: 'id 2297820154, pg. 1', comentario: 'Cabeçalho nativo PJe — Sandbox Bloco 2' }),
                        Object.freeze({ valor: 'Num. 0991234567 - Pág. 12', validarApenasCatalogoOuConversao: true, esperadoConversaoPje: 'id 0991234567, pg. 12', comentario: 'Cabeçalho nativo PJe série 0991234' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: 'Num. - Pág.', comentario: 'Cabeçalho PJe vazio sem número nem página' }),
                        Object.freeze({ valor: 'fls.', comentario: 'Termo folha abreviado sem número' }),
                        Object.freeze({ valor: 'id', comentario: 'Termo ID solto sem número identificador' }),
                        Object.freeze({ valor: 'Pág.', comentario: 'Termo página solto sem número' }),
                        Object.freeze({ valor: 'Num. abc - Pág. xyz', comentario: 'Cabeçalho PJe com caracteres alfabéticos inválidos' })
                    ])
                })
            ])
        }),
        Object.freeze({
            idCasoUso: '05_LEGISLACAO_JURISPRUDENCIA_E_ATOS_NORMATIVOS',
            titulo: 'Citações de Legislação, Jurisprudência e Atos Administrativos',
            descricao: 'Reconhecimento concentrado de artigos, parágrafos, incisos, emendas constitucionais, súmulas, temas e atos normativos com siglas de órgãos compostas.',
            comoUsar: '1 clique no rótulo inicial ("art.", "nº"), no espaço interno ou 2 cliques seleciona toda a citação normativa; 3 cliques em "12.016/2009" minora para "12.016" ou "2009".',
            mascaras: Object.freeze([
                Object.freeze({
                    idMascara: '05.01_DISPOSITIVOS_LEGAIS_SUMULAS_E_ATOS',
                    nome: 'Dispositivos Legais, Súmulas, Temas e Atos Administrativos',
                    mascara: 'art. X, inc. Y, da CF/88 | IN ÓRGÃO nº X/AAAA | Súmula Vinculante | nº X/AAAA',
                    grupoMotor: 'LEGISLACAO_JURISPRUDENCIA_E_ATOS',
                    tipoBloco: 'bloco_simples',
                    calculavel: false,
                    comoUsar: '1 clique no espaço interno ou 2 cliques seleciona a citação normativa completa.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: 'arts. 5º, LXXVIII e 37, caput, da CF/88, c/c art. 49 da Lei 9.784/99', cliques: 2, comentario: 'Dispositivo constitucional e administrativo p/ Teste F1 — Sandbox Bloco 6' }),
                        Object.freeze({ valor: 'Demora Excessiva no Processo Administrativo', validarApenasCatalogoOuConversao: true, comentario: 'Tese de citação jurídica destacada p/ Teste F1 — Sandbox Bloco 6' }),
                        Object.freeze({ valor: 'art. 5º, inciso LV, da CF/88', idxClique: 0, cliques: 2, comentario: 'Dispositivo constitucional — Sandbox Bloco 2' }),
                        Object.freeze({ valor: 'art. 5º, inciso LXXVIII, da Constituição Federal de 1988', validarApenasCatalogoOuConversao: true, comentario: 'Dispositivo constitucional histórico p/ Teste F1' }),
                        Object.freeze({ valor: 'art. 24, parágrafos 1º e 2º da EC n.º 103/2019', idxClique: 0, cliques: 2, comentario: 'Citação de Emenda Constitucional — Sandbox Bloco 2' }),
                        Object.freeze({ valor: 'Instrução Normativa PRES/INSS nº 128/2022', idxClique: 0, cliques: 2, comentario: 'Ato normativo com órgão composto — Sandbox Bloco 2' }),
                        Object.freeze({ valor: 'Portaria SAJ/SG/PR no 15/2023', idxClique: 0, cliques: 2, comentario: 'Ato administrativo com órgão de 3 níveis — Auditoria Grupo 7' }),
                        Object.freeze({ valor: 'Portaria 12/34/567/890 no 5/2020', idxClique: 0, cliques: 2, comentario: 'Ato administrativo com órgão numérico — Auditoria Grupo 7' }),
                        Object.freeze({ valor: 'Súmula Vinculante 13', idxClique: 0, cliques: 2, comentario: 'Súmula Vinculante do STF — Constantes e Auditoria Grupo 7' }),
                        Object.freeze({ valor: 'Tema 810 do STF', idxClique: 0, cliques: 2, comentario: 'Tema de Repercussão Geral do STF — Sandbox Bloco 2' }),
                        Object.freeze({ valor: 'Tema 1033 do STJ', idxClique: 0, cliques: 2, comentario: 'Tema de recursos repetitivos — Constantes' }),
                        Object.freeze({ valor: 'nº 136/2025', idxClique: 0, cliques: 2, comentario: 'Protocolo/Ato curto com prefixo nº — Sandbox Bloco 2' }),
                        Object.freeze({ valor: '12.016/2009', idxClique: 0, cliques: 2, comentario: 'Lei com barra de ano p/ minoração em 3 cliques — Sandbox Bloco 2' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: 'artigo', comentario: 'Termo legal solto sem número de artigo nem diploma' }),
                        Object.freeze({ valor: 'Súmula', comentario: 'Termo súmula isolado sem numeração de verbete' }),
                        Object.freeze({ valor: 'Lei Federal', comentario: 'Expressão genérica sem número nem ano' }),
                        Object.freeze({ valor: 'parágrafo', comentario: 'Termo parágrafo sem especificação numérica' }),
                        Object.freeze({ valor: 'inciso', comentario: 'Termo inciso sem numerais romanos' })
                    ])
                })
            ])
        }),
        Object.freeze({
            idCasoUso: '06_COORDENADAS_GPS_EMAILS_E_TELEFONES',
            titulo: 'Coordenadas Geográficas GPS/UTM/Plus Codes, E-mails e Telefones',
            descricao: 'Captura de coordenadas geográficas periciais, endereços de e-mail RFC 5322, handles sociais e telefones nacionais/internacionais.',
            comoUsar: '1 clique seleciona a coordenada GPS, e-mail, @handle ou telefone inteiro.',
            mascaras: Object.freeze([
                Object.freeze({
                    idMascara: '06.01_COORDENADAS_GEOGRAFICAS_E_PLUS_CODES',
                    nome: 'Coordenadas GPS (DMS, Graus Decimais, UTM SIRGAS 2000) e Plus Codes',
                    mascara: 'DMS | DD (-GG.DDDDDD, -GGG.DDDDDD) | UTM | Plus Code',
                    grupoMotor: 'COORDENADAS_GPS_E_PLUS_CODES',
                    tipoBloco: 'bloco_simples',
                    calculavel: false,
                    comoUsar: '1 clique seleciona o par completo de coordenadas ou Plus Code.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '-25.428954, -49.267137', comentario: 'Coordenada GPS Graus Decimais Paraná (Curitiba) — Sandbox Options' }),
                        Object.freeze({ valor: '25°25\'44.2"S 49°16\'01.7"W', comentario: 'Coordenada GPS Sexagesimal DMS Paraná (Curitiba)' }),
                        Object.freeze({ valor: '-25.428954, -49.267137', comentario: 'Coordenada GPS Graus Decimais Curitiba/PR (TRT9)' }),
                        Object.freeze({ valor: '-15.794229, -47.882166', comentario: 'Coordenada GPS Graus Decimais Brasília/DF TRF1 — Auditoria Grupo 8' }),
                        Object.freeze({ valor: '15°47\'39.2"S 47°52\'55.8"W', comentario: 'Coordenada GPS Sexagesimal DMS TRF1 Brasília — Auditoria Grupo 8' }),
                        Object.freeze({ valor: '23S 721450mE 8251340mS', comentario: 'Coordenada Plana UTM SIRGAS 2000 — Constantes Sub-tipo 8.4' }),
                        Object.freeze({ valor: '22K 674000 7185000', comentario: 'Coordenada Plana UTM Zona 22K Paraná — Central de Ajuda Options' }),
                        Object.freeze({ valor: '86FP645X+44', comentario: 'Google Plus Code — Auditoria Grupo 8' }),
                        Object.freeze({ valor: '-25.51, -54.58', comentario: 'Coordenada GPS Graus Decimais (Foz do Iguaçu - escala urbana) — Sandbox Options' }),
                        Object.freeze({ valor: '5867FC26+VQ', comentario: 'Google Plus Code (Open Location Code Foz do Iguaçu) — Sandbox Options' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '+95.1234, -45.1234', comentario: 'Latitude fora dos limites do globo terrestre (> +90°)' }),
                        Object.freeze({ valor: '-25.1234, -195.1234', comentario: 'Longitude fora dos limites do globo terrestre (< -180°)' }),
                        Object.freeze({ valor: '-25.428954', comentario: 'Grau decimal isolado sem par de longitude' }),
                        Object.freeze({ valor: '25°32\'S', comentario: 'Coordenada sexagesimal incompleta sem longitude' }),
                        Object.freeze({ valor: '58PJ645X', comentario: 'Google Plus Code sem o separador \'+\' e código de área' })
                    ])
                }),
                Object.freeze({
                    idMascara: '06.02_EMAILS_HANDLES_E_TELEFONES',
                    nome: 'E-mails Institucionais, Perfis @Handle e Telefones (DDD, 0800, +DDI)',
                    mascara: 'usuario@dominio.jus.br | @handle | (DDD) NNNNN-NNNN | 0800 | +DDI',
                    grupoMotor: 'TELEFONES_NACIONAIS_E_INTERNACIONAIS',
                    tipoBloco: 'bloco_simples',
                    calculavel: false,
                    comoUsar: '1 clique seleciona o e-mail, @handle ou telefone completo.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '(45) 99123-4567', comentario: 'Telefone celular Paraná (DDD 45) série 0991234 — Sandbox Options' }),
                        Object.freeze({ valor: '(45) 3521-1234', comentario: 'Telefone fixo Paraná (DDD 45) — Sandbox Options' }),
                        Object.freeze({ valor: '(61) 3300-1000', comentario: 'Telefone fixo TRF1 / Brasília (DDD 61) — Sandbox Options' }),
                        Object.freeze({ valor: '(61) 3410-1234', comentario: 'Telefone institucional TRF1 / Brasília' }),
                        Object.freeze({ valor: '(41) 99123-4567', comentario: 'Telefone móvel Paraná (DDD 41 - Curitiba) série 0991234' }),
                        Object.freeze({ valor: '+55 (45) 99123-4567', comentario: 'Telefone internacional DDI + DDD 45 Paraná' }),
                        Object.freeze({ valor: '+55 (61) 3300-1000', comentario: 'Telefone internacional com +DDI TRF1 — Auditoria Grupo 10' }),
                        Object.freeze({ valor: 'atendimento@trf1.jus.br', comentario: 'E-mail institucional TRF1 — Central de Ajuda e Sandbox Options' }),
                        Object.freeze({ valor: 'contato.processual@trf1.jus.br', comentario: 'E-mail institucional TRF1 — Auditoria Grupo 9' }),
                        Object.freeze({ valor: 'atendimento@trf1.jus.br', comentario: 'E-mail institucional TRF1' }),
                        Object.freeze({ valor: 'contato@tjpr.jus.br', comentario: 'E-mail institucional TJPR' }),
                        Object.freeze({ valor: '@usuario_jusbr', comentario: 'Perfil/Handle social — Auditoria Grupo 9' }),
                        Object.freeze({ valor: '0800 728 1992', comentario: 'Serviço de utilidade 0800 — Auditoria Grupo 10' }),
                        Object.freeze({ valor: '0800 725 0100', comentario: 'Serviço de utilidade 0800 — Central de Ajuda Options' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: 'usuario@', comentario: 'E-mail sem domínio após a arroba' }),
                        Object.freeze({ valor: '@dominio.jus.br', comentario: 'E-mail sem identificador de usuário antes da arroba' }),
                        Object.freeze({ valor: '(41) 1234-56', comentario: 'Telefone com quantidade insuficiente de dígitos' }),
                        Object.freeze({ valor: '(00) 99123-4567', comentario: 'Telefone com DDD zero inválido no Brasil' }),
                        Object.freeze({ valor: '0800', comentario: 'Prefixo de utilidade pública isolado sem número' })
                    ])
                })
            ])
        }),
        Object.freeze({
            idCasoUso: '07_FINANCEIRO_MOEDAS_PERCENTUAIS_E_DECIMAIS_COM_SINAL',
            titulo: 'Valores Monetários Incrementais, Percentuais e Números com Sinal (+ ou -)',
            descricao: 'Seleção incremental de moedas com extenso entre parênteses, percentuais e números inteiros/decimais positivos e negativos.',
            comoUsar: 'Em "R$ 65,00 (sessenta e cinco reais)", 1 clique no número copia "65,00", em "R$" copia "R$ 65,00" e no espaço antes de "(" ou com 2 cliques copia tudo. Em números com sinal, 1 clique copia com o sinal.',
            mascaras: Object.freeze([
                Object.freeze({
                    idMascara: '07.01_MOEDAS_PERCENTUAIS_E_SINAIS',
                    nome: 'Moedas em Reais, Percentuais e Decimais Positivos/Negativos',
                    mascara: 'R$ N.NNN,NN (extenso) | [+-]R$ N.NNN,NN | [+-]N,NN% | [+-]N.NNN,NN',
                    grupoMotor: 'FINANCEIRO_E_DECIMAIS',
                    tipoBloco: 'bloco_simples',
                    calculavel: false,
                    comoUsar: '1 clique seleciona o valor financeiro/percentual/decimal (2 cliques para incluir o extenso entre parênteses).',
                    positivos: Object.freeze([
                        Object.freeze({ valor: 'R$ 65,00 (sessenta e cinco reais)', idxClique: 0, cliques: 2, comentario: 'Moeda com valor por extenso incremental — Sandbox Bloco 2' }),
                        Object.freeze({ valor: 'R$ 1.000,00', idxClique: 0, comentario: 'Valor monetário simples — Tabela Sandbox Linha 01' }),
                        Object.freeze({ valor: 'R$ 2.000,00', idxClique: 0, comentario: 'Valor monetário simples — Tabela Sandbox Linha 02' }),
                        Object.freeze({ valor: 'R$ 3.500,00', idxClique: 0, comentario: 'Valor monetário simples — Tabela Sandbox Linha 03' }),
                        Object.freeze({ valor: 'R$ -1.000,00', idxClique: 0, comentario: 'Moeda negativa com sinal antes do valor — Auditoria Grupo 11' }),
                        Object.freeze({ valor: 'R$ - 1.000,00', idxClique: 0, comentario: 'Moeda negativa com sinal espaçado — Auditoria Grupo 11' }),
                        Object.freeze({ valor: 'R$ +1.000,00', idxClique: 0, comentario: 'Moeda positiva com sinal — Auditoria Grupo 11' }),
                        Object.freeze({ valor: '-R$ 1.000,00', idxClique: 0, comentario: 'Moeda negativa com sinal antes de R$ — Auditoria Grupo 11' }),
                        Object.freeze({ valor: '100%', idxClique: 0, comentario: 'Percentual inteiro — Sandbox Bloco 2' }),
                        Object.freeze({ valor: '20,500%', idxClique: 0, comentario: 'Percentual decimal — Sandbox Bloco 2' }),
                        Object.freeze({ valor: '+0,25%', idxClique: 0, comentario: 'Percentual positivo com sinal — Auditoria Grupo 11' }),
                        Object.freeze({ valor: '-0,45%', idxClique: 0, comentario: 'Percentual negativo com sinal — Auditoria Grupo 11' }),
                        Object.freeze({ valor: '-10%', idxClique: 0, comentario: 'Percentual inteiro negativo — Auditoria Grupo 11' }),
                        Object.freeze({ valor: '-1.233,00%', idxClique: 0, comentario: 'Percentual com milhar negativo — Auditoria Grupo 11' }),
                        Object.freeze({ valor: '+0,25', idxClique: 0, comentario: 'Decimal positivo com sinal — Auditoria Grupo 11' }),
                        Object.freeze({ valor: '-0,45', idxClique: 0, comentario: 'Decimal negativo com sinal — Auditoria Grupo 11' }),
                        Object.freeze({ valor: '+1', idxClique: 0, comentario: 'Inteiro positivo com sinal — Auditoria Grupo 11' }),
                        Object.freeze({ valor: '-1.233,00', idxClique: 0, comentario: 'Milhar e decimal negativo — Auditoria Grupo 11' }),
                        Object.freeze({ valor: '+1.233,00', idxClique: 0, comentario: 'Milhar e decimal positivo — Auditoria Bateria 8' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: 'R$', comentario: 'Símbolo de moeda isolado sem valor numérico' }),
                        Object.freeze({ valor: 'R$ abc', comentario: 'Símbolo monetário seguido de caracteres alfabéticos' }),
                        Object.freeze({ valor: '%', comentario: 'Símbolo de percentual isolado sem numeral' }),
                        Object.freeze({ valor: '+ %', comentario: 'Sinal e percentual sem valor cardinal' }),
                        Object.freeze({ valor: 'R$ --100,00', comentario: 'Moeda com sinal negativo duplo inválido' })
                    ])
                })
            ])
        }),
        Object.freeze({
            idCasoUso: '08_PLACEHOLDERS_DE_MINUTAS_BLOCOS_DESTACADOS_E_GENERICOS',
            titulo: 'Placeholders de Minutas, Blocos em CAIXA ALTA, Interface Alt+Clique e Genéricos',
            descricao: 'Pré-seleção sem cópia de placeholders de minutas judiciais, captura de sequências em MAIÚSCULAS, seleção de objetos de interface com Alt e padrões genéricos.',
            comoUsar: 'Em editores de minutas, 1 clique seleciona o placeholder sem alterar o Ctrl+C. Em CAIXA ALTA, 2 cliques seleciona toda a expressão.',
            mascaras: Object.freeze([
                Object.freeze({
                    idMascara: '08.01_PLACEHOLDERS_EDITORES_MINUTAS',
                    nome: 'Placeholders de Minutas Judiciais (Textarea e CKEditor/HTML)',
                    mascara: '#tag# | #[tag]# | ##tag## | @@ tag @@ | [@@...@@] | (##)####-#### | ##/##/20##',
                    grupoMotor: 'CAMPO_PLACEHOLDER_EDITAVEL',
                    tipoBloco: 'bloco_simples',
                    ehPlaceholderMinuta: true,
                    calculavel: false,
                    comoUsar: '1 clique seleciona o marcador inteiro no editor sem sobrescrever a Área de Transferência.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: '#tag/campo#', comentario: 'Placeholder simples entre cerquilhas — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '#[tag/campo]#', comentario: 'Placeholder com colchetes internos — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '##tag/campo##', comentario: 'Placeholder com cerquilhas duplas — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '@@ tag/campo @@', comentario: 'Placeholder delimitado por arrobas duplas — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '### tag/campo ##', comentario: 'Placeholder com cerquilhas assimétricas — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '##########', comentario: 'Sequência de cerquilhas — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '$$$$$$$$', comentario: 'Sequência de cifrões — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '@@@@@@@@', comentario: 'Sequência de arrobas — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '#Autor da ação#', comentario: 'Placeholder nominal do Editor HTML — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '(##)####-####', comentario: 'Placeholder de telefone no Editor HTML — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '##/##/20##', comentario: 'Placeholder de data no Editor HTML — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '[@@ato impugnado@@]', comentario: 'Placeholder CKEditor PJe — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '##.###,##', comentario: 'Placeholder de valor monetário — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '[##TEXTO DA DECISÃO##]', comentario: 'Placeholder de bloco decisório — Sandbox Bloco 3' }),
                        Object.freeze({ valor: '@@@@INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS(29.979.036/0001-40); GER EXEC DA AGENCIA DA PREVIDENCIA SOCIAL DE PARNAIBA PI; @@@', comentario: 'Placeholder extenso PJe/CKEditor delimitado por @@@@ e @@@ em elemento aninhado (pai/avô contenteditable) — Sandbox Bloco 3 (Seção 6.31)' }),
                        Object.freeze({ valor: '#####', comentario: 'Placeholder de número de contrato/certidão em minuta judicial — Sandbox Bloco 3 (Seção 6.31)' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: '#', comentario: 'Caractere cerquilha isolado sem tag fechada' }),
                        Object.freeze({ valor: '@@', comentario: 'Par de arrobas isolado sem delimitador de fechamento' }),
                        Object.freeze({ valor: '[@@campo]', comentario: 'Placeholder com colchetes e arrobas sem fechamento correspondente' }),
                        Object.freeze({ valor: 'tag/campo#', comentario: 'Texto com fechamento sem abertura correspondente' }),
                        Object.freeze({ valor: '##', comentario: 'Cerquilha dupla sem corpo de placeholder' })
                    ])
                }),
                Object.freeze({
                    idMascara: '08.02_BLOCOS_MAIUSCULAS_INTERFACE_ALT_E_FALLBACKS',
                    nome: 'Blocos em CAIXA ALTA, Links/Botões/Etiquetas Alt+Clique e Genéricos',
                    mascara: 'CAIXA ALTA | Alt+Clique | NNNNxNNNN | NNNN.NNNN-NNNN',
                    grupoMotor: 'GENERICOS_E_FALLBACKS',
                    tipoBloco: 'bloco_simples',
                    calculavel: false,
                    comoUsar: '2 cliques em CAIXA ALTA seleciona toda a expressão em maiúsculas; 1 clique em resolução ou código pontuado seleciona o bloco.',
                    positivos: Object.freeze([
                        Object.freeze({ valor: 'REGULAR PROSSEGUIMENTO DO FEITO', cliques: 2, comentario: 'Bloco contíguo em LETRAS MAIÚSCULAS — Sandbox Bloco 2' }),
                        Object.freeze({ valor: '2289376501', comentario: 'ID numérico em Link p/ Alt+Clique — Sandbox Bloco 2' }),
                        Object.freeze({ valor: '2297533315 - Pedido de homologação\nde acordo em 22/10/2026 13:27:16', validarApenasAltLink3Cliques: true, esperadoUmaLinha: '2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16', comentario: 'Link multilinhas p/ Alt+3 Cliques unificando em uma linha só — Sandbox Bloco 2 (Seção 6.28)' }),
                        Object.freeze({ valor: 'MARCAR TODOS COMO LIDOS', cliques: 2, comentario: 'Texto de Botão p/ Alt+Clique — Sandbox Bloco 2' }),
                        Object.freeze({ valor: 'HOMOLOGAR ACORDO', cliques: 2, comentario: 'Texto de Etiqueta/Span PJe p/ Alt+Clique — Sandbox Bloco 2' }),
                        Object.freeze({ valor: '2560x1080', comentario: 'Resolução de tela/vídeo — Auditoria Grupo 13' }),
                        Object.freeze({ valor: '0000.0000-0000', comentario: 'Bloco numérico pontuado de boleto — Auditoria Grupo 13' })
                    ]),
                    negativos: Object.freeze([
                        Object.freeze({ valor: 'a', comentario: 'Caractere minúsculo isolado' }),
                        Object.freeze({ valor: 'de', comentario: 'Preposição minúscula isolada' }),
                        Object.freeze({ valor: '1', comentario: 'Dígito isolado em texto comum' }),
                        Object.freeze({ valor: '.', comentario: 'Ponto final isolado' }),
                        Object.freeze({ valor: '---', comentario: 'Traços horizontais sem valor textual' })
                    ])
                })
            ])
        })
    ])
});

if (typeof window !== 'undefined') {
    window.JusGovExemplosCatalogo = CATALOGO_EXEMPLOS_JUSGOVBR;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CATALOGO_EXEMPLOS_JUSGOVBR;
}
