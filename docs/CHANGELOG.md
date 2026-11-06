# REGISTRO DE ALTERAÇÕES (CHANGELOG) - JUSGOVBR

> [!NOTE]
> ### 🧭 AUTO-DESCRIÇÃO E DIRETRIZ DE REÚSO PARA NOVOS PROJETOS
> - **Identificação do Arquivo:** `docs/CHANGELOG.md`
> - **Finalidade Primária:** Histórico auditável e cronológico de alterações e lançamentos baseado no padrão internacional *Keep a Changelog*.
> - **Papel na Governança e Inteligência da IA:** Mantém a linha do tempo estritamente documentada, relacionando cada versão à sua tag de backup e commit correspondente.
> - **Reaproveitamento em Novos Projetos:**
>   - *Comando de Ativação:* Ao iniciar outro projeto, declare: `"vou iniciar um novo projeto do zero..."`.
>   - *Núcleo Perpétuo Reutilizável (DNA do Autor):* Formato padronizado de seções (*Adicionado*, *Modificado*, *Corrigido*, *Removido*) e versionamento ChronoSemVer.
>   - *Seções Específicas de Domínio (A Adaptar):* Limpar versões anteriores iniciando o registro na versão `[v1.0]`.


Todas as alterações notáveis deste projeto são registradas de forma cronológica e auditável neste arquivo.
O formato baseia-se no padrão [*Keep a Changelog*](https://keepachangelog.com/pt-BR/1.0.0/) e respeita o versionamento integrado do Manifest V3.

---

## [v4.14] (261106.4.14) - 2026-11-06

### Adicionado
- **Princípio Soberano da Fila de Pendências como Única Origem de Implementação (Seção 6.58 / Diretriz Root 1):** Formalizada a diretiva perpétua de que toda demanda do usuário entra compulsoriamente na Fila de Pendências (Backlog) e que implementações ocorrem exclusivamente a partir de itens da fila sob comando expresso de execução ("implementar").

### Corrigido
- **Correção de Falso Positivo em `validarNumeroGenericoFallback` (BUG-05 / Seção 6.57):**
  - **Eliminação de Falso Mod10 em Alfanuméricos:** Rejeição estrita no Passo 1 de qualquer string contendo caracteres alfabéticos (como o modelo `RTL2832U`), exceto quando atender às 14 posições do CNPJ Alfanumérico da RFB.
  - **Blindagem Anti-Falso-Positivo para Mod10 (Luhn):** Vedado o teste de Mod10 em sequências curtas sem hífen (como `2832`, anos ou ramais), onde 10% dos números aleatórios colidiam indevidamente. O Mod10 passa a exigir hífen explícito indicando DV (`-X`) ou comprimentos compatíveis com boletos (10/11 dígitos) e cartões de crédito (13 a 19 dígitos).
  - **Blindagem do Mod11 com Pesos 2..9:** Sequências puras sem hífen restritas aos tamanhos de documentos reais (9 a 14 dígitos).
  - **Cobertura de Testes:** 2 novos testes determinísticos em `src/cfg/debug.js` validando o silêncio absoluto para `RTL2832U` e sequências curtas como `2832`, totalizando **302/302 testes aprovados** no Chromium Headless V8.

---

## [v4.13] (261106.4.13) - 2026-11-06

### Adicionado
- **Backup e Auditoria Periódica:** Empacotamento de segurança com 300 testes aprovados e limpeza de `tmp/`.

---

## [v4.11] (261106.4.11) - 2026-11-06

### Adicionado
- **Seção 6.55 — Otimização Tipográfica e Novo Texto Padrão do Editor HTML Online:**
  - Padronização completa da tipografia (fonte e tamanho unificados) em `src/cfg/options.html`, eliminando tags de inline styles fragmentadas (`<span>`).
  - Implementação do novo texto padrão estruturado com 4 parágrafos e marcadores forenses: `<b>@@Autor@@</b>`, `<b>##Réu##</b>`, `<u>(##)####-####</u>`, `<i>##/##/20##</i>`, `<u><i>[@@ato@@]</i></u>`, `<u>##.###,##</u>`, `#####` e `[##TEXTO DA DECISÃO##]`.
  - Sincronização da constante `TEXTO_PADRAO_EDITOR_HTML` em `src/cfg/editor_demo.js` para restauração idêntica.
  - Sincronização da Bateria 6 em `src/cfg/debug.js` (`PLACEHOLDERS_MINUTA_EXTENSA_E_TELEFONE`) mantendo 300/300 testes aprovados no Chromium Headless V8.
- **Governança de Auto-Aceite e Otimização do Ambiente IDE:**
  - Instituição da **Regra de Auto-Aceite ("Accept All" Compulsório)** na Diretriz Root 1, eliminando pedidos redundantes de aceite ao usuário ("Não me peça mais pra aceitar").
  - Configuração do IDE (`.vscode/settings.json` e configurações globais do usuário) com `workbench.editor.limit.value: 3`, `workbench.editor.enablePreview: true` e `antigravity.autoAcceptOnChat: true` para dispensar automaticamente abas de conferência e evitar acúmulo de arquivos abertos.

---

## [v4.10] (261106.4.10) - 2026-11-06

### Adicionado
- **Governança de Não-Baixa Prematura e Persistência de Perguntas:**
  - Inclusão formal na Diretriz Root 1 e 13 da salvaguarda contra baixa prematura de pendências em `.md` e persistência compulsória de chamadas de decisão com links de navegação nativos (`conversation://<conversation-id>`).

---

## [v4.9] (261106.4.9) - 2026-11-06

### Adicionado
- **Seção 6.54 — Saneamento de `util/` e Criação do Índice `util/AGENTS.md` (Padrão Oficial Antigravity):**
  - Criação de `util/AGENTS.md` com bloco de auto-descrição de reúso e tabela executiva dos 17 scripts mantidos (comando em 1 linha, tempo de resposta, finalidade e gatilhos de uso).
  - Enriquecimento com cabeçalhos exaustivos de engenharia e intra-comentários de passos em todos os 17 scripts PowerShell, Batch e HTML da pasta `util/`.

### Removido
- Exclusão definitiva de 6 scripts obsoletos/temporários de `util/` (`ver_erros.ps1`, `ajustar_propriedades.ps1`, `converter_entidades_utf8.ps1`, `enriquecer_catalogo.ps1`, `auditar_catalogo.ps1` e `gerar_exemplos_json.ps1`), mantendo a raiz de ferramentas 100% limpa e sem redundâncias.

---

## [v4.8] (261106.4.8) - 2026-11-06

### Adicionado
- **Conclusão da Arquitetura Modular de 4 Grupos em Subdiretórios Exclusivos (Paridade 1:1 com `options.html`):**
  - **Módulo 3: TECLADO/MOUSE (`src/mod-input/`):**
    - `input-botoes-laterais.js` (`class BotoesLateraisMouse`): Captura dos botões 4 e 5 para troca circular entre abas.
    - `input-botao-meio.js` (`class BotaoMeioColagem`): Colagem no cursor via scroll click e invocação de Win+V com `Ctrl + Botão do Meio`.
    - `input-teclado-campos.js` (`class NavegacaoTecladoCampos`): Alternância por setas verticais (↑ e ↓) entre campos `<input>`.
    - `input-atalho-f1.js` (`class AtalhoF1Gemini`): Interceptação de F1, supressão da ajuda nativa e envio seguro para o Google Gemini.
    - `mod-input.js` (`class ModuloInput`): Fachada orquestradora selada com `Object.freeze` e Padrão Null Object imutável.
  - **Módulo 4: NAVEGADOR (`src/mod-navegador/`):**
    - `navegador-janela-unica.js` (`class GerenciadorJanelaUnica`): Single Window e preservação de janelas de autenticação Gov.br, ICP-Brasil, PJEOffice e Shodô.
    - `navegador-anti-duplicacao.js` (`class GerenciadorAntiDuplicacao`): Reuso de abas abertas, normalização limpa de URL e descarte de duplicatas com blindagem da guia atual.
    - `navegador-ordenacao.js` (`class GerenciadorOrdenacaoGuias`): Ordenação hierárquica e agrupamento via Tab Groups API.
    - `navegador-descarte.js` (`class GerenciadorDescarteGuias`): Tab Discarding automático para economia de memória RAM via `chrome.tabs.discard`.
    - `mod-navegador.js` (`class ModuloNavegador`): Fachada orquestradora selada com `Object.freeze` e Padrão Null Object imutável.
- **Auditoria de Qualidade e Testes:**
  - Injeção da Bateria 11 em `src/cfg/debug.js` cobrindo SRP, DIP, composição, Null Object Pattern e imutabilidade das novas fachadas.
  - Total de 300 testes determinísticos 100% aprovados e 32 arquivos JS validados na engine V8 do Chromium Headless.
- **Formalização de Decisões e Governança:**
  - Registro da ADR-008 (Paridade Estrutural dos 4 Grupos de Opções).
  - Atualização dos scripts de teste (`util/validar_sintaxe_v8.html`, `util/executar_testes.html`, `util/postar_chrome.ps1`).

---

## [v4.0] (261106.4) - 2026-11-06

### Adicionado
- **Seção 6.49 — Modularização POO em Diretório Plano Único (`src/mod-copia/`):**
  - Implementação e extração de 11 classes POO especializadas com campos privados (`#`), alta coesão e responsabilidade única:
    - `copia-geometria.js` -> `class GeometriaDOM` (caret, coordenadas de clique, nós de texto e `Range`).
    - `copia-filtros.js` -> `class FiltrosHtml` (Arquitetura Progressiva de Filtros HTML em 5 Níveis e sanitização RTF/Word).
    - `copia-visual.js` -> `class FeedbackVisual` (Flash Border SVG contíguo multilinhas, eliminação de sobreposição e MiniTips).
    - `copia-validadores.js` -> `class ValidadoresForenses` (Auditoria matemática de Módulo 11/97 e proteção em UI).
    - `copia-minutas.js` -> `class PlaceholdersMinutas` (4 modos de seleção de placeholders sem cópia no clipboard).
    - `copia-estagio1.js` -> `class EstagioUnidadeAtomica` (Estágio 1 — Tokens alfanuméricos e pontuações internas).
    - `copia-estagio2.js` -> `class EstagioExpressoes` (Estágio 2 — Catálogo de entidades jurídicas, caixa alta e `<mark>`).
    - `copia-estagio3.js` -> `class EstagioSentencas` (Estágio 3 — Frases, pontuação terminativa e regra dos dois-pontos `:`).
    - `copia-estagio4.js` -> `class EstagioDelimitadores` (Estágio 4 — Delimitadores simétricos e aspas com 1 vs 2 cliques).
    - `copia-estagio5.js` -> `class EstagioParagrafos` (Estágio 5 — Parágrafo em 3 cliques com minoração contextual).
    - `copia-estagio6.js` -> `class EstagioTabelas` (Estágio 6 — Linhas e células de tabelas integradas ao Acumulador).
    - `mod-copia.js` -> `class ModuloCopia` (Fachada Principal / Orquestradora de eventos e dependências).
  - Atualização dos manifestos, service worker (`background.js`), sandbox (`options.html`) e suíte V8 (`validar_sintaxe_v8.html`, `executar_testes.html`, `executar_auditoria.ps1`) com 22 arquivos JS validados em sintaxe V8 e 290/290 testes aprovados (100%).

---

## [v3.18] - 2026-11-06

### Adicionado
- Reestruturação completa da documentação em 9 arquivos especializados em `docs/` (Diretrizes, As-Built, Backlog, Radar de Bugs, ADRs, Testes, Sandbox, Changelog e Agents).
- Formalização da **Diretriz Root 14** sobre a obrigatoriedade de comentários exaustivos capazes de recriar o código do zero e economia estratégica de tokens de IA.
- Especificação da arquitetura em 12 classes POO em diretório plano único (`copia-*.js`) sob orquestração de `mod-copia.js`.

### Corrigido
- Ajustada a delimitação do duplo clique em termos com formatação inline ou marca-texto (`<mark>marca-texto</mark>`), impedindo vazamento para espaços externos e eliminando contorno estendido do flash.
- Atualização das amostras de coordenadas GPS na Central de Ajuda e suíte de testes para graus decimais de alta precisão (`-25.592600, -54.593536`), DMS sexagesimal (`25°35'33.36"S 54°35'36.73"W`) e Google Plus Code (`5867CC44+XH`).

---

## [v3.10] - 2026-11-06

### Corrigido
- Correção de erro de sintaxe do Service Worker (`background.js:1547`) e adição da permissão `windows` no `manifest.json`.
- Blindagem de fechamento indevido da guia ativa em rotinas de fechamento em lote.

---

## [v3.0] - 2026-11-05

### Adicionado
- Centralização do catálogo append-only em `src/cfg/exemplos.json`.
- Ampliação das baterias determinísticas de testes para 288 casos no Chrome Headless.
- Unificação das opções de placeholders em editores de minutas com 4 modos operacionais.

---

## [v2.0] - 2026-10-30

### Adicionado
- Implementação da Idempotência O(1) e debounce de injeção segura de scripts via `agendarInjecaoSeguraNaAba`.
- Separação formal entre `aplicarSelecaoDOM` (motor visual) e `executarCopiaDeSelecao` (área de transferência).
- Simulação interna de clipboard com histórico anterior (`Botão do Meio` e `Ctrl + Botão do Meio`).
- Validação matemática de PIS/PASEP/NIT pelo algoritmo Módulo 11 com pesos oficiais.

