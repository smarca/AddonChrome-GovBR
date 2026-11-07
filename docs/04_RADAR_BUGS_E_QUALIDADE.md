# RADAR DE BUGS, BOAS PRÁTICAS E QUALIDADE DE SOFTWARE - JUSGOVBR
Projeto: JusGovBR - Cópia Inteligente & PJe Turbo
Finalidade: Rastreamento contínuo de bugs identificados, corrigidos, falhas potenciais e boas práticas arquiteturais identificadas pela análise de engenharia.

> [!NOTE]
> ### 🧭 AUTO-DESCRIÇÃO E DIRETRIZ DE REÚSO PARA NOVOS PROJETOS
> - **Identificação do Arquivo:** `docs/04_RADAR_BUGS_E_QUALIDADE.md`
> - **Finalidade Primária:** Rastreamento autônomo de bugs identificados, falhas potenciais, oportunidades de boas práticas (BP) e qualidade de código.
> - **Papel na Governança e Inteligência da IA:** Registra o que a IA identifica autonomamente em inspeções estáticas, mantendo diagnósticos técnicos separados das demandas diretas do usuário.
> - **Reaproveitamento em Novos Projetos:**
>   - *Comando de Ativação:* Ao iniciar outro projeto, declare: `"vou iniciar um novo projeto do zero..."`.
>   - *Núcleo Perpétuo Reutilizável (DNA do Autor):* Taxonomia de bugs (BUG-XX), catálogo de boas práticas arquiteturais (BP-XX), registro de causa-raiz e soluções preventivas.
>   - *Seções Específicas de Domínio (A Adaptar):* Bugs específicos já resolvidos do produto anterior.

Documento Relacionado: [01_DIRETRIZES_E_REGRAS_ROOT.md](01_DIRETRIZES_E_REGRAS_ROOT.md)

---

## 7. RADAR AUTÔNOMO DE ANÁLISE DE ENGENHARIA (BUGS, BOAS PRÁTICAS E NOVAS FUNCIONALIDADES IDENTIFICADAS)

> [!NOTE]
> Esta seção é mantida em separado do backlog de demandas diretas do usuário (Seção 6). Ela registra ativamente e continuamente tudo o que for identificado de forma autônoma pela análise de engenharia durante o ciclo de inspeções, diagnósticos, logs e leitura de código.
> Quando o usuário solicitar um levantamento de pendências de mudanças, correções/bugs ou previsibilidade de novas funcionalidades, esta seção somada à Seção 6 fornecerá a resposta estruturada completa e exaustiva.

### 7.1 Bugs e Falhas Potenciais Identificados pela Análise de Engenharia
- **BUG-01: Vazamento de Handlers Globais em Subframes Descarregados [IMPLEMENTADO E COBERTO POR TESTES]:**
  * *Reavaliação Técnica:* Confirmada a necessidade técnica real em 4 vetores de retenção de memória V8/Blink: (1) closures cross-frame em `inspecionarIframeLocal` (`SelecionarCopiar.js`) anexadas sem `AbortController`; (2) ausência de gatilho `pagehide` (`!event.persisted`) e limpeza incompleta de timers/`observadorBlindagem`/listeners IPC no teardown do frame; (3) listeners de bootstrap `DOMContentLoaded` e `load` sem `{ once: true }`; e (4) ausência de `#abortController` e método `destruir()` em `ModuloInput` (`src/mod-input/mod-input.js`).
  * *Solução Implementada:*
    1. Cada `<iframe>` same-origin monitorado em `SelecionarCopiar.js` passou a ser governado por um `AbortController` dedicado (`conjuntoControladoresSubframes` + `WeakMap`), desmontando deterministicamente as 4 closures (`selectionchange`, `mousedown`, `mousemove`, `mouseup`) em 4 gatilhos: ativação do motor nativo no subframe, `pagehide` definitivo (`!ev.persisted`), remoção física em `MutationObserver` (`removedNodes`) ou troca de atributo `src`, e abort do frame pai — preservando 100% do Back-Forward Cache (`persisted === true`);
    2. Implementadas `destruirCicloVidaFrame()` e `reconstruirCicloVida()` em `SelecionarCopiar.js` limpando `controladorCicloVida`, `observerFrames`, `observadorBlindagem`, todos os timers pendentes e ouvintes IPC (`chrome.storage.onChanged` / `chrome.runtime.onMessage`), além de `{ once: true }` nos gatilhos iniciais `DOMContentLoaded`/`load`;
    3. Adicionado `#abortController` privado, auto-teardown em `pagehide` (`!ev.persisted`) e método público `destruir()` em `ModuloInput` (`src/mod-input/mod-input.js`);
    4. Adicionados 4 testes determinísticos na Bateria 12 de `src/cfg/debug.js` (`BUG01_SUBFRAME_ABORTCONTROLLER_LIFECYCLE`, `BUG01_SUBFRAME_AUTO_ABORT_MOTOR_NATIVO`, `BUG01_MOTOR_PRINCIPAL_TEARDOWN_E_RECONSTRUCAO` e `BUG01_MOD_INPUT_ABORTCONTROLLER_DESTRUIR`), elevando a suíte para 455/455 testes 100% aprovados.
- **BUG-02: Sobrescrita de `z-index` de Overlays do PJe e PDPJ [IMPLEMENTADO]:**
  * *Descrição:* O contorno do Flash Verde possui `z-index: 2147483647`. Caso surja um diálogo nativo de confirmação ou modal crítico do tribunal que necessite de foco modal estrito, o contorno poderia sobrepor botões desse modal antes de seu timeout expirar.
  * *Solução Implementada:* Garantido `pointer-events: none !important;` e destruição atômica imediata ao detectar `keydown` (`Escape`/`Enter`), clique em modal ou surgimento de modal crítico no DOM.
- **BUG-03: Sincronização Duplicada de `turboCSS` vs `PJE-anti_ampuletas.css` [DESCARTADO PELO USUÁRIO]:**
  * *Status:* Descartado da fila de implementação por decisão do usuário em 06/11/2026.
  * *Descrição:* As regras CSS de desbloqueio do PJe existem tanto em `src/mod-pje/PJE-anti_ampuletas.css` quanto na string `turboCSS` em `src/mod-copia/SelecionarCopiar.js`.
  * *Ação Futura:* Dispensada pelo usuário.
- **BUG-04: Concentração Monolítica em `SelecionarCopiar.js` [IMPLEMENTADO EM 6.49]:**
  * *Status:* Resolvido pela arquitetura especializada em classes POO em diretório plano único (`src/mod-copia/`) implementada na Seção 6.49.
  * *Descrição:* `SelecionarCopiar.js` concentra atualmente motor geométrico de seleção, filtros HTML em 5 níveis, conversão de cabeçalhos PJe, gestos de mouse (botões 4/5 e botão do meio), navegação por teclado entre campos e injeção de CSS. Fatiamento em submódulos concluído na Seção 6.49.
- **BUG-05: Falso Positivo em `validarNumeroGenericoFallback` Disparando Mod10 em Textos Alfanuméricos e Sequências Numéricas Curtas [CORRIGIDO]:**
  * *Descrição:* O método `validarNumeroGenericoFallback` extraía apenas dígitos (`replace(/\D/g, '')`) e avaliava o algoritmo de Luhn (Mod10) em qualquer sequência com `n >= 4`. Isso causava disparos indevidos de `[Mod10]: <texto> ✓` em palavras alfanuméricas comuns (como modelos de hardware `RTL2832U`, `GTX1080`) e em números curtos casuais (anos, ramais, portas), onde 10% dos números de 4 dígitos satisfazem aleatoriamente a congruência de Luhn (`soma % 10 === 0`).
  * *Solução Implementada:*
    1. Rejeição imediata de qualquer texto contendo letras, exceto no formato oficial de CNPJ Alfanumérico (14 caracteres alfanuméricos terminando com 2 dígitos);
    2. Exigência de que textos puramente numéricos contenham apenas dígitos e separadores (`[0-9\s./-]`);
    3. Restrição rigorosa do Mod10 (Luhn): só é admitido se houver hífen explícito indicando DV (`-X`) ou para tamanhos compatíveis com boletos (10/11 dígitos) e cartões de crédito (13 a 19 dígitos), vedando testes em sequências curtas sem hífen;
    4. Adição de 2 testes determinísticos na Bateria 1 de `src/cfg/debug.js` cobrindo `RTL2832U` e sequências curtas como `2832`, totalizando 302 testes 100% aprovados.
- **BUG-06: Falha na Expansão de Sequências Numéricas Espaçadas Genéricas com Duplo Clique ou Clique no Espaço (ex: "215 7014 6992 8831") [PENDENTE]:**
  * *Descrição:* Ao dar duplo clique sobre um número de uma sequência numérica espaçada genérica (ex: `215 7014 6992 8831`) ou clicar sobre o espaço intermediário entre os blocos, o motor de seleção não expande para selecionar toda a sequência, contrariando a promessa de UX do Sandbox ("1 clique = bloco; espaço ou 2 cliques = tudo"). O mecanismo opera corretamente para máscaras específicas com padrão rígido (Chave NF-e, Boleto FEBRABAN e Boleto Concessionária), mas falha em blocos genéricos.
  * *Causa-Raiz:* O catálogo `CATALOGO_PADROES_JURIDICOS` (TIPO 2: `CHAVES_FISCAIS_E_BOLETOS_ESPACADOS`) em `src/mod-copia/ConstantesPadroes.js` inclui apenas padrões estruturados (NF-e de 44 dígitos e boletos com pontuação formal), sem contemplar como padrão composicional ativo com `exigeEspacoOuDuploClique: true` a expressão universal `MULTIPLOS_NUMEROS_ESPACADOS`.
  * *Ação de Correção:* Integrar `MULTIPLOS_NUMEROS_ESPACADOS` no catálogo composicional com flag `exigeEspacoOuDuploClique: true`, blindando contra falsos positivos com números de telefone e garantindo que 1 clique selecione apenas o bloco atômico e 2 cliques / espaço selecionem a cadeia numérica completa.
- **BUG-07: Desseleção Indevida ao Pressionar a Tecla Shift em Texto Selecionado [CORRIGIDO]:**
  * *Descrição:* Ao ter qualquer texto selecionado na página e pressionar a tecla `Shift` (com o intuito de estender a seleção com as setas do teclado `Shift + ↑` / `Shift + ↓` ou clicar com Shift), a seleção ativa era compulsoriamente destruída pelo listener `keydown` e pelo listener `mousedown`.
  * *Causa-Raiz:* Presença de chamadas legadas a `sel.removeAllRanges()` em `aoPressionarTecla` (`e.key === 'Shift'`) e em `tratarMouseDownGlobal` (`e.shiftKey && !ancoraCursorShift`).
  * *Solução Implementada:*
    1. Removida a chamada a `removeAllRanges()` no evento `keydown` da tecla `Shift`;
    2. Se houver seleção ativa no momento em que `Shift` é pressionado ou clicado, o motor captura a âncora da seleção (`sel.anchorNode`, `sel.anchorOffset`) em `ancoraCursorShift`, preservando a seleção 100% intacta;
    3. Usuário pode livremente continuar e estender a seleção para cima ou para baixo via teclado (`Shift + Setas`) ou via mouse (`Shift + Clique`);
    4. Adicionado teste determinístico na Bateria 19 de `src/cfg/debug.js` (`PRESERVACAO_SELECAO_TECLA_SHIFT`), elevando a suíte para 450/450 testes 100% aprovados no Chromium Headless.

### 7.2 Oportunidades de Boas Práticas e Refatoração Arquitetural (Futura Otimização)
- **BP-04: Resiliência em POO JavaScript via Injeção Opcional e Padrão Null Object (Diretriz Root 16 / ADR-006) [IMPLEMENTADO]:**
- **BP-05: Governança do Fluxo de Trabalho e Controle Técnico de Prioridades (Diretriz Root 1 / ADR-007) [IMPLEMENTADO]:**
  * *Descrição:* Fila compulsória para toda solicitação recebida, proibição inegociável de implementação imediata, anotação preliminar transparente na documentação e execução em código exclusivamente mediante o comando expresso "implementar".
  * *Solução Implementada:* Matriz de priorização técnica (Alta, Média, Baixa) controlada pelo agente segundo as melhores práticas de engenharia de software, com identificação visual explícita `[Prioridade Alterada pelo Usuário]` quando ajustada a pedido do usuário.
  * *Descrição:* Eliminação definitiva do risco de `TypeError: Cannot read properties of undefined/null` quando qualquer arquivo ou submódulo for excluído, desabilitado ou falhar ao carregar.
  * *Solução Implementada:* Todas as classes orquestradoras (`ModuloCopia`) adotam Null Objects com implementações neutras seguras (`null`, `false`, `""`, `{ ok: false }`), garantindo que qualquer chamada do teclado, mouse ou API execute de forma tolerante a falhas sem jamais interromper a extensão.
- **BP-01: Desacoplamento Físico em 4 Módulos e POO Blindada (`src/mod-copia/`, `src/mod-pje/`, `src/mod-input/`, `src/mod-navegador/`) [IMPLEMENTADO]:**
  * *Descrição:* Em cumprimento às Diretrizes Root 9, 11 e 16, criação de classes especializadas em subdiretórios físicos dedicados para cada um dos 4 grupos de opções do addon, com classes seladas via `Object.freeze` e campos privados (`#propriedade`).
- **BP-02: Barramento de Eventos e Padrão Null Object Intermodular [IMPLEMENTADO]:**
  * *Descrição:* Comunicação intermodular desacoplada via mensagens e injeção de dependências (DIP) com suporte a Null Objects em todos os orquestradores (`ModuloCopia`, `ModuloInput`, `ModuloNavegador`), garantindo ausência total de falhas caso arquivos sejam removidos.
- **BP-03: Pré-Compilação de Expressões Regulares Ancoradas em `ConstantesPadroes.js` [IMPLEMENTADO]:**
  * *Descrição:* Eliminação de `new RegExp('^(?:' + rx.source + ')$')` em tempo de execução, pré-compilando-as estaticamente no dicionário do catálogo forense.

### 7.3 Previsibilidade de Novas Funcionalidades e Evolução do Sistema
- **FEAT-03: Validação Matemática Genérica Fallback para Números Não-Identificados em Balão Cinza (Seção 6.42) [IMPLEMENTADO]:**
  * Mecanismo de última barreira que testa algoritmos de dígitos verificadores (Mod 11 múltiplos pesos, Mod 97, Mod 10, CPF, CNPJ, etc.) em números puros, pontuados incompletos ou alfanuméricos.
  * Se aprovado, exibe balão em cinza neutro no formato `[Mod11]: <u>nnnnnnnn</u> ✓`; se não aprovado, permanece 100% silencioso.
- **Alt + 3 Cliques em Links (Seção 6.28) [IMPLEMENTADO]:** Seleção integral multilinhas de links unificando o texto em linha única separada por espaços.
- *(FEAT-01 e FEAT-02 dispensadas pelo usuário).*




















