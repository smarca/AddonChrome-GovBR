# PLANO DE TESTES, AUDITORIA DETERMINÍSTICA E FUZZING - JUSGOVBR
Projeto: JusGovBR - Cópia Inteligente & PJe Turbo
Finalidade: Especificação detalhada da suíte automatizada de testes, conformidade matemática e baterias de estresse V8.

> [!NOTE]
> ### 🧭 AUTO-DESCRIÇÃO E DIRETRIZ DE REÚSO PARA NOVOS PROJETOS
> - **Identificação do Arquivo:** `docs/06_PLANO_DE_TESTES_E_AUDITORIA.md`
> - **Finalidade Primária:** Especificação formal da suíte automatizada de testes determinísticos, fuzzing estocástico e auditoria contínua.
> - **Papel na Governança e Inteligência da IA:** Garante que toda refatoração ou nova feature seja homologada antes da entrega, mantendo 100% de aprovação e zero regressão.
> - **Reaproveitamento em Novos Projetos:**
>   - *Comando de Ativação:* Ao iniciar outro projeto, declare: `"vou iniciar um novo projeto do zero..."`.
>   - *Núcleo Perpétuo Reutilizável (DNA do Autor):* Metodologia de baterias determinísticas + fuzzing estocástico, execução Headless via PowerShell nativo em tempo real e protocolo de auditoria contínua.
>   - *Seções Específicas de Domínio (A Adaptar):* Casos e assertivas de teste específicos do produto anterior.

Documento Relacionado: [01_DIRETRIZES_E_REGRAS_ROOT.md](01_DIRETRIZES_E_REGRAS_ROOT.md)

---

## 1. VISÃO GERAL DA SUÍTE DE TESTES

A suíte de testes do JusGovBR é executada em ambiente autônomo sem servidor externo por meio do script `util/executar_auditoria.ps1`, acionando o Google Chrome em modo Headless com os flags `--headless --disable-gpu --no-sandbox --allow-file-access-from-files`.

- **Total de Testes Automatizados Atuais:** 460 testes determinísticos (32 arquivos JS auditados em V8)
- **Taxa de Aprovação Exigida em CI/CD:** 100% (zero tolerância a regressões)
- **Tempo de Execução Médio:** ~4,0 segundos

---

## 2. BATERIAS DE AUDITORIA HIERÁRQUICA (debug.js)

1. **Bateria 1: Unidades Atômicas e Padrões Contíguos:**
   * Alfanuméricos puros, tokens pontuados, termos hifenizados e identificadores com sublinhado.
2. **Bateria 2: Prefixos e Rótulos Designadores:**
   * Regra de captura antecipada em `id`, `fls.`, `art.`, `Lei`, `processo`, `portaria` e isolamento de `inciso`/`alinea`.
3. **Bateria 3: Regra da Vírgula e Pontuação de Sentença:**
   * Seleção antes da vírgula, conectivo de dois-pontos (`:`) e expansão até pontuação final sem capturar o ponto.
4. **Bateria 4: Delimitadores Simétricos e Aspas:**
   * Captura alternada entre conteúdo interno e delimitadores externos (`()`, `[]`, `{}`, `<>`, `""`, `''`, `«»`).
5. **Bateria 5: Auditoria Matemática Forense (Módulo 11, Módulo 97 e Módulo 10):**
   * Validação de CPF, CNPJ, PIS/PASEP/NIT (pesos 3,2,9,8,7,6,5,4,3,2), Processos CNJ (Módulo 97 base 100), Benefício INSS (NB) e guias DARF/GRU/IPTU FEBRABAN (Seção 6.60).
   * Verificação de calendário gregoriano (anos bissextos, meses de 30/31 dias, 29 de fevereiro) e blindagem anti-falso-positivo `BUG-05`.
6. **Bateria 6: Editores de Minutas e Placeholders:**
   * Auto-seleção nos 4 modos operacionais (`[campo]`, `<campo>`, `{campo}`, `#####`, `@@@@...@@@@`) sem cópia para o clipboard.
7. **Bateria 7: Filtros HTML Progressivos em 5 Níveis (0 a 4):**
   * Nível 0 (Texto Puro via switch Remover Formatações), Nível 1 (Básico Inline), Nível 2 (Intermediário Parágrafo/Fluxo), Nível 3 (Avançado Documental/Tabelas) e Nível 4 (Estendido Suítes Office).
8. **Bateria 8: Coordenadas GPS, E-mails, Telefones e Varredura dos HTMLs (`popup.html` / `options.html`):**
   * Graus Decimais (`-25.592600, -54.593536`), Sexagesimal DMS (`25°35'33.36"S 54°35'36.73"W`), Plus Codes (`5867CC44+XH`), telefones, e-mails RFC 5322 e varredura nos 5 limites de palavras.
9. **Bateria 9: Guias, Janelas, Anti-Duplicação e Desseleção:**
   * Precedência de Domínio Puro sobre subdomínios, ordenação hierárquica e preservação de guias protegidas.
10. **Bateria 10: Integridade do Catálogo Centralizado JSON (`exemplos.json` / `exemplos.js`):**
    * Validação exaustiva de todas as categorias forenses e máscaras estruturadas sob a regra POLICE Append-Only.
11. **Bateria 11: Módulos `mod-input` e `mod-navegador` (POO, DIP, SRP e Null Object):**
    * Instanciação resiliente com fallback para Null Objects imutáveis sem lançar `TypeError`; injeção de dependências (DIP); normalização de URLs; preservação de certificados Gov.br/ICP/PJe; selamento das fachadas com `Object.freeze`.
12. **Bateria 12: Regressões Forenses, Ciclo de Vida de Subframes e Separação Modular (`BUG-01`, `BUG-06`, `BUG-07`, `6.47`, `6.60`, `6.63`):**
    * `AbortController` determinístico em subframes (`BUG-01`), expansão de sequências espaçadas (`BUG-06`), preservação de seleção com `Shift` (`BUG-07`), fachadas integradas (`6.47`) e colagem do penúltimo clipboard interno via `Ctrl + Botão do Meio` (`6.63`).
13. **Bateria 13: Unificação Anti-Truncamento e Precedência `Alt + Clique` (`6.3`, `6.6`, `6.7`):**
    * Espaçamento obrigatório anti-truncamento em cards multilinhas do PJe (`6.3`), escopo mínimo em etiquetas ignorando ícone irmão de exclusão (`6.6`) e precedência bloco -> linha clicada -> texto integral em links (`6.7`).

---

## 3. FUZZING ESTOCÁSTICO E TESTES DE ESTRESSE

O motor de testes executa rotinas de mutação estocástica (1s por grupo) injetando:
- Caracteres Unicode corrompidos e sequências UTF-16 surrogate pairs desbalanceadas.
- Injeções de tags HTML malformadas para validar a blindagem de sanitização.
- Números gigantes e strings extensas para garantir que o motor de janela O(1) opere sem estouro de pilha.

