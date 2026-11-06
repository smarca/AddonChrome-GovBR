# BACKLOG DE TAREFAS, FEATURES E ANOTAÇÕES DE ENGENHARIA - JUSGOVBR
Projeto: JusGovBR - Cópia Inteligente & PJe Turbo
Finalidade: Planejamento estratégico, tarefas a fazer, histórico de sprints e especificações de features futuras.

> [!NOTE]
> ### 🧭 AUTO-DESCRIÇÃO E DIRETRIZ DE REÚSO PARA NOVOS PROJETOS
> - **Identificação do Arquivo:** `docs/03_BACKLOG_TAREFAS_E_FEATURES.md`
> - **Finalidade Primária:** Livro mestre de planejamento, fila compulsória de solicitações, especificações de features futuras e histórico de entregas.
> - **Papel na Governança e Inteligência da IA:** Canal de entrada obrigatório de qualquer solicitação. A IA registra propostas com prioridade técnica avaliada (Alta, Média, Baixa) e aguarda o gatilho expresso `"implementar"`.
> - **Reaproveitamento em Novos Projetos:**
>   - *Comando de Ativação:* Ao iniciar outro projeto, declare: `"vou iniciar um novo projeto do zero..."`.
>   - *Núcleo Perpétuo Reutilizável (DNA do Autor):* Estrutura de fila deliberativa (Diretriz Root 1 / Seção 6.50), critérios de priorização técnica, template de anotação de tarefas e distinção entre pendências e entregas.
>   - *Seções Específicas de Domínio (A Adaptar):* O histórico de sprints e itens específicos do produto anterior (são limpos ao iniciar o novo produto).

Documento Relacionado: [01_DIRETRIZES_E_REGRAS_ROOT.md](01_DIRETRIZES_E_REGRAS_ROOT.md)

---

## 6. BACKLOG DE TAREFAS FUTURAS E ANOTAÇÕES DE ENGENHARIA



> [!IMPORTANT]
> **GOVERNANÇA DO FLUXO DE TRABALHO E GESTÃO DE PRIORIDADES (DIRETRIZ ROOT 1):**
> 1. **Princípio Soberano da Fila de Pendências (Funil Único de Execução):** Tudo o que o usuário pedir vai compulsoriamente para a lista de pendências (Backlog). Nenhuma implementação ocorre fora dela: SÓ DA LISTA DE PENDÊNCIAS IREMOS IMPLEMENTAR, sob comando expresso do usuário.
> 2. **Proibição de Implementação Imediata:** NUNCA IMPLEMENTAR NA MESMA HORA. O agente deve exibir o entendimento com máxima clareza e salvar o registro diretamente nos arquivos (sem necessidade de confirmação prévia para salvar na documentação).
> 3. **Gatilhos e Sintaxe Universal de Execução ("implementar"):** Somente sob comando expresso o código é alterado:
>    - `implementar`: executa automaticamente a tarefa no topo das prioridades (`#1`);
>    - `implementar #X`: executa especificamente o item de índice `#X` da tabela de pendências;
>    - `implementar <ID/Seção/BUG>`: executa diretamente pelo identificador (ex.: `implementar BUG-06`, `implementar Seção 6.59`).
> 4. **Controle Técnico de Prioridades em 5 Níveis:** O agente avalia e atribui as prioridades técnicas nos 5 níveis canônicos (Alta `↑`, Média alta `↗`, Média `→`, Média baixa `↘`, Baixa `↓`) com base em melhores práticas (segurança, riscos, bloqueios e impacto). Caso o usuário solicite alteração, a prioridade solicitada prevalece e deve ser sinalizada com sublinhado (`<u>`), adicionando `!` se urgente. Na tabela de pendências, exibem-se 10 casos com os 2 últimos reservados para os mais antigos (`#2` e `#1`).
> 5. **Salvaguarda de Não-Baixa Prematura:** Jamais marcar itens como implementados antes da efetiva implementação no código, testes aprovados e commit.
> 6. **Persistência Compulsória de Perguntas Finalizadoras com Indexação:** Perguntas de fechamento de turno em aberto são mantidas na fila com link clicável de retorno para o diálogo original (`conversation://<conversation-id>`). Se não houver perguntas pendentes, a seção correspondente nas respostas do chat é 100% omitida (não mostrar nada).

### ❓ Fila de Perguntas Finalizadoras e Confirmações Pendentes de Resposta
> As perguntas e chamadas de decisão/confirmação feitas pelo agente ao final de cada turno que não forem respondidas de imediato pelo usuário são obrigatoriamente salvas nesta fila com link nativo navegável (`conversation://<conversation-id>`). Em cumprimento à **Regra de Auto-Aceite ("Accept All" Compulsório)**, implementações autorizadas não demandam perguntas de confirmação.

| # | Seção / Demanda | Pergunta / Pedido de Confirmação em Aberto | Link para Diálogo Original | Status |
|---|---|---|---|---|
| - | Nenhuma pendência de confirmação | *Nenhuma pergunta pendente no momento (implementações realizadas sob a regra de Auto-Aceite).* | - | **Concluído** |

---

### 6.1 Seleção com 1 Clique em Elementos de Interface Contendo Dados Estruturados / Máscaras Úteis
- **Contexto Operacional:** Em telas e cabeçalhos de sistema (como barras informativas do PJe, painéis superiores ou faixas informativas como `Informação de Prevenção` / metadados do tipo `"Juntado por ... em 30/10/2026 00:35:21"` ou `"30/10/2026"`), existem blocos de texto que, embora estejam estruturados no DOM dentro de áreas de interface (como `div#detalheDocumento`, contêineres de etiquetas, badges ou barras de ferramentas), contêm dados forenses de interesse direto do operador (datas completas com hora, números de processos, etc.).
- **Comportamento Previsto para Futura Implementação:**
  * Permitir que um clique simples (1 clique) sobre esses blocos de metadados/dados estruturados na interface consiga isolar e selecionar o dado/máscara útil correspondente (`30/10/2026`, `30/10/2026 00:35:21`, etc.) de forma inteligente e pontual.
  * Diferenciar claramente esses contêineres estáticos de texto/metadados da interface (mesmo que tenham classes de sistema ou filhos decorativos) de botões de ação e links clicáveis de navegação direta, garantindo que o 1 clique nesses dados copie/selecione a informação sem interferir nos controles interativos reais.

### 6.2 Auto Seleção Inteligente de Texto em Visualizadores de Documentos PDF Nativos / Incorporados (Ex.: PJe download.seam)
- **Contexto Operacional:** Em visualizadores de documentos PDF abertos diretamente pelo navegador ou incorporados no tribunal (ex.: `pje1g.trf1.jus.br/pje/download.seam?cid=...` exibindo certidões de juntada com `"O documento a seguir foi juntado aos autos do processo de nmero 1015306-38.2026.4.01.4002 em 19/10/2026 11:13:55..."` ou petições iniciais), os textos residem no visualizador interno de PDF do Chromium / PDF.js.
- **Comportamento Previsto para Futura Implementação:**
  * **Habilitar Seleção Completa de Textos em PDF:** Permitir a seleção e cópia de qualquer texto em documentos PDF (seja com 1 clique para palavras/números de processo/datas ou arrasto manual contínuo), garantindo que a suíte capture os eventos dentro do visualizador (`embed`, `object`, `#viewer`, `.textLayer` ou documento PDF direto).
  * **Reconhecimento de Entidades em PDF:** Assegurar que o motor reconheça processos (`1015306-38.2026.4.01.4002`), datas/horários (`19/10/2026 11:13:55`), nomes e parágrafos dentro de PDFs, aplicando contorno visual imediato e cópia formatada/texto puro para a Área de Transferência sem bloqueios do visualizador.
  * Garantir a reconstrução do mapa de texto contínuo mesmo com quebras virtuais de linhas geradas pela disposição CSS dos `<span>` posicionados da camada de texto (`textLayer`) do visualizador de PDF.


### 6.3 Supressão de Quebras de Linha em Linha Única com Espaçamento Obrigatório Anti-Truncamento
- **Contexto Operacional:** Em cards e painéis do PJe (ex.: listas de tarefas `col-sm-11`, cartões de processo com `dtPoloAtivo`, `dtPoloPassivo`, `ÚLTIMA MOVIMENTAÇÃO: REMETIDOS OS AUTOS...`, etiquetas e classes `col-sm-12 no-padding`), elementos irmãos ou `<span>`/`<div>` quebrados em múltiplas linhas visuais contêm trechos contíguos de texto.
- **Comportamento Previsto para Futura Implementação:**
  * Ao suprimir quebras de linha (`\n`, `<br>`) para condensar o conteúdo copiado em uma única linha (linha só), é **estritamente obrigatório** inserir um espaço em branco separador (`' '`) entre os blocos e linhas conectadas.
  * **Regra Anti-Truncamento:** Jamais colar ou fundir o final de uma linha com o início da linha seguinte sem espaço (ex.: evitar concatenar `"DISTRIBUIÇÃO AO VARA FEDERAL"` com `"CÍVEL E CRIMINAL"` gerando `"FEDERALCÍVEL"`). Toda unificação de linhas deve assegurar espaçamento limpo e normalizado sem truncamento de palavras.

### 6.4 Investigação de Seleção Dupla Cruzada / Efeito Fantasma Multi-Frame (Ex.: "Parnaíba-PI" e "Prevenção")
- **Comportamento Estranho Observado:**
  * Ao clicar no texto `"Parnaíba-PI"` (ou `"Distribuição"` dentro do documento PDF / área inferior), uma palavra distante no topo da tela (ex.: `"Prevenção"` ou `"ALMEIDA"` no cabeçalho `2297820154 - Informação de Prevenção`) também aparece destacada com contorno verde de seleção simultânea.
- **Diagnóstico Técnico Preliminar para Correção Futura:**
  * Ocorre quando a janela pai (`top window`) e o subframe do documento (iframe do PDF ou visualizador) mantêm seleções independentes no DOM simultaneamente, ou quando o evento de clique/mudança de foco não executa `sel.removeAllRanges()` na janela oposta antes de aplicar a nova seleção.
  * Além disso, se o contorno visual temporizado (Flash Verde / `CSS.highlights` ou divs de overlay) da seleção anterior no cabeçalho não tiver sido desarmado (`limparFlashBorderImediatamente()`), ele permanece visível na tela enquanto a nova seleção no corpo do documento é efetuada.
- **Diretriz de Correção Futura:**
  * Ao registrar uma nova seleção em qualquer frame (seja na página principal ou dentro de um subframe/PDF), garantir a limpeza imediata e mútua de ranges e de sobreposições de Flash visual em todos os contextos (`broadcastDeselecionarGeral` / `removeAllRanges()` cruzado entre pai e filhos), impedindo qualquer seleção dupla ou contorno residual fantasma na tela.

### 6.5 Garantia de Cópia e Seleção de Datas, Horários e Datas com Horário (Ex.: "23/10/2026 10:14:18")
- **Contexto Operacional:** Em cabeçalhos de juntada, certidões e linhas de metadados forenses do PJe (ex.: `"Juntado por FRANCISCO NOGUEIRA ALMEIDA JUNIOR - SUPERVISOR DA DISTRIBUIÇÃO em 23/10/2026 10:14:18"`), a seleção do bloco temporal pode ocorrer por clique no corpo da data, no horário ou por arrasto/seleção manual sobre a expressão completa.
- **Comportamento Previsto para Implementação/Ajuste Futuro:**
  * **Permissão de Cópia Completa:** Assegurar que tanto a seleção automatizada por clique quanto a seleção nativa/manual de datas isoladas (`23/10/2026`), horários isolados (`10:14:18`) e blocos contíguos de data com horário (`23/10/2026 10:14:18`) sejam sempre copiados fielmente para a Área de Transferência.
  * **Preservação de Formato:** Tratar a expressão combinada `DD/MM/AAAA HH:MM:SS` como entidade temporal forense de primeira classe no motor, garantindo que o clique simples, clique no espaço intermediário ou arrasto manual envie exatamente os dados limpos para a Área de Transferência com validação matemática e contorno visual verde imediato.

### 6.6 Escopo de Seleção em Alt + Clique sobre Botões, Etiquetas e Itens de Interface (Regra de Mínimo Possível)
- **Regra de Precedência em 3 Níveis Estritos:**
  1. **Nível 1 (Bloco/Registro Forense):** Se o clique incidir sobre um campo ou registro estruturado (Data, Hora, CPF, CNPJ, NB, RG, Processo CNJ, etc.), copia estritamente o bloco/máscara forense.
  2. **Nível 2 (Objeto Real de Interface):** Se for controle real de interface (botão `<button>`, link `<a>`, aba, switch, menu, ou etiqueta/badge/chip):
     * Em etiquetas/badges/chips com botão irmão de exclusão (ex.: `<div class="label label-etiqueta"><span data-jusgov-selecionavel="true">HOMOLOGAR ACORDO</span><span class="icon-desvincular-tag"><i class="fa fa-times"></i></span></div>`), o `Alt + Clique` seleciona e copia **exclusivamente o rótulo da etiqueta** (`HOMOLOGAR ACORDO`), ignorando o ícone "X" irmão e jamais capturando o contêiner externo (card de tarefa, linha da tabela ou painel).
     * O contorno visual do Flash e a cópia incidem estritamente sobre o texto visível do rótulo, sem envolver a estrutura física do contêiner externo.
     * Contêineres compostos (cards de tarefas do PJe, linhas com múltiplos controles, listas de processos) são expressamente rejeitados como objetos interativos únicos.
  3. **Nível 3 (Unidade Palavra):** Caso o clique não incida sobre um campo estruturado nem sobre um controle real de interface (ex.: parágrafo de texto ou texto comum dentro de um card), o `Alt + Clique` seleciona e copia pontualmente a **palavra sob o cursor**, mantendo a regra de mínima seleção e nunca capturando o contêiner por inteiro.

### 6.7 Prioridade de Bloco / Máscara Útil vs. Linha do Link vs. Texto Total em Alt + Clique
- **Regra de Negócio Estabelecida:**
  * Ao clicar em um link (`<a href>`) com a tecla `Alt` pressionada, o motor obedece a seguinte ordem estrita de precedência:
    1. **Passo 1 (Teste Prévio de Bloco sob o Cursor):** Primeiramente testa-se se a posição exata do clique corresponde a um bloco/padrão estruturado do catálogo forense ou máscara útil (ex.: ID, processo CNJ, CPF, CNPJ, data, valor em dinheiro, etc.). Havendo bloco sob o cursor, segue-se a regra geral de textos com base nas máscaras e regras tradicionais (clique no número isola o número; clique no hífen ou separador expande o bloco completo; clique no espaço segue o comportamento consolidado).
    2. **Passo 2 (Links Multilinhas -> Cópia da Linha Inteira Clicada):** Caso o clique NÃO tenha incidido sobre um bloco específico, mas o texto do link possua **múltiplas linhas** (seja por quebras explícitas `<br>`/`\n` ou por quebra visual de layout/bloco), o motor copia **apenas a linha inteira onde ocorreu o clique**, e não todo o texto das demais linhas do link.
    3. **Passo 3 (Link de Linha Única):** Caso o link seja composto por uma única linha e não contenha bloco específico sob o cursor, copia-se o texto visível integral do link.


### 6.8 Correção de Sobrescrita e Acúmulo de Retângulos / Cor do Flash Verde (Ex.: CNPJ com Múltiplas Bordas)
- **Comportamento Estranho Observado:**
  * Em números formatados como CNPJ (`41.522.194/0001-72`), ao selecionar partes ou o bloco, surgem múltiplos retângulos verdes sobrepostos (ex.: uma caixa para a base `41.522.194/0001` e duas ou mais caixas coladas/deslocadas sobre o dígito `-72`), gerando um efeito visual estranho de bordas duplicadas com tonalidade escurecida/acumulada e caixas sobrepostas.
- **Diagnóstico Técnico Preliminar:**
  * **Acúmulo de elementos de contorno (Overlays DOM / Highlights):** Ao re-executar seleções parciais ou ao calcular múltiplos `DOMRects` via `range.getClientRects()`, retângulos antigos de contorno do Flash não estão sendo removidos do DOM ou do mapa de highlights antes da injeção do novo contorno.
  * **Fragmentação indevida de nós/sub-ranges:** Quando o range divide nós de texto adjacentes ou cruza limites de pontuação, o despachador de contorno desenha caixas separadas para cada pedaço sem unir retângulos contíguos na mesma linha, gerando linhas duplas no encontro entre o corpo e o dígito verificador.
- **Diretriz de Ajuste Futuro:**
  * Garantir a limpeza atômica imediata (`limparFlashBorderImediatamente()`) antes de desenhar qualquer novo contorno.
  * Empregar fusão geométrica (coalescência) de `DOMRects` contíguos na mesma linha horizontal ou aplicar contorno por `range.getBoundingClientRect()` unificado quando se tratar de uma mesma entidade/bloco textual, prevenindo caixas sobrepostas e saturação de cor.

### 6.9 Ignorar Seleção / Cópia por Arrasto Curto (< 5 Caracteres) em Elementos de Interface sem Tecla Alt
- **Contexto Operacional:** Em locais que são claramente elementos de interface gráfica do sistema e não áreas de leitura de texto corrido (conforme a classificação e diferenciação de contexto de UI já existente no motor), o usuário pode acidentalmente clicar e arrastar o cursor ao interagir com componentes, abas, botões, cabeçalhos ou divisórias.
- **Regra de Negócio Estabelecida:**
  * Nos casos de clicar e arrastar o mouse em locais que correspondam categoricamente a elementos de interface (e não textos de leitura/conteúdo), ignorar completamente as seleções ou cópias caso a tecla `Alt` NÃO esteja pressionada e o texto selecionado resultante tenha menos de 5 caracteres (`selection.trim().length < 5`).
  * Caso o usuário queira expressamente selecionar ou copiar pequenos fragmentos ou labels curtos dentro de áreas de interface, ele deverá manter a tecla `Alt` pressionada durante a ação, ou a seleção por arrasto deverá possuir 5 ou mais caracteres para ser considerada intencional.
- **Diretriz de Ajuste Futuro:**
  * No tratador global de evento de arrasto/mouseup e `selectionchange`, verificar se o alvo da seleção originou-se em área de interface do sistema (`isContextoDeSistemaOuUi` ou contexto interativo).
  * Se o modificador `Alt` estiver ausente (`!e.altKey`) e o comprimento do texto selecionado for inferior ao limiar mínimo (`textoLimpo.length < 5`), abortar o fluxo de cópia, desarmar a seleção ativa no DOM (`window.getSelection().removeAllRanges()`) e suprimir o contorno visual do Flash Verde.

### 6.10 Investigação de Lentidão / Percepção de Atraso no Carregamento de Páginas
- **Sintoma Relatado:** Percepção de lentidão aumentada durante a abertura e carregamento de páginas e abas.
- **Hipóteses Técnicas e Pontos de Verificação para Diagnóstico Futuro:**
  1. **Injeção Redundante e Múltiplos Listeners (`webNavigation` vs `content_scripts` vs `MutationObserver`):**
     * O monitoramento assíncrono em `background.js` (listeners de `onCommitted`, `onDOMContentLoaded`, `onCompleted`) combinando chamadas a `chrome.scripting.executeScript` com injeção estática declarada no `manifest.json` pode estar causando execuções repetidas dos scripts de conteúdo em cada frame/subframe.
  2. **Sobrecarga de `MutationObserver` de Subframes e Iframes:**
     * A observação ativa de mutações no DOM com `subtree: true` e checagem contínua de iframes recém-inseridos ou alteração de atributos `src`/`data` consome ciclos da thread principal do navegador logo nos momentos críticos de renderização inicial (fase de parsing do HTML).
  3. **Disparos em Massa de `content_start` e Retentativas Temporizadas (`setTimeout` de 250ms / 800ms):**
     * Múltiplos temporizadores concorrentes criados para subframes podem estar concorrendo com os scripts nativos pesados de páginas judiciais (PJe, Angular, RichFaces).
  4. **Comunicação IPC Excessiva com Service Worker via `chrome.runtime.sendMessage`:**
     * Verificações síncronas ou frequentes de configurações (`obterConfiguracoes`) no início do ciclo de vida de cada frame podem estar enfileirando mensagens no canal de runtime.
- **Diretrizes de Investigação e Otimização:**
  * **Profiling de Performance:** Medir o tempo de execução dos passos de inicialização (`performance.mark` / DevTools Performance panel) nos scripts de conteúdo.
  * **Guarda de Idempotência Precoce:** Garantir que se a flag `window.__JUSGOVBR_INICIALIZADO__` já estiver ativa, a execução seja interrompida imediatamente no primeiro milissegundo, antes de qualquer query no DOM ou attach de listeners.
  * **Otimização de Observers:** Ajustar o `MutationObserver` de subframes para ser disparado com debounce/throttling ou limitá-lo a contêineres específicos em vez de `document.documentElement` irrestrito durante o carregamento inicial.

### 6.11 Otimizações do PJe: Eliminação de Delays e Popups/Toasts Nativos (Eliminar "Lag" e Falta de Fluidez do Mouse)
- **Sintoma Observado e Contexto Operacional:**
  * Em operações habituais do PJe (ex.: movimentação em painéis de tarefas e modal/menu flutuante de etiquetas de processos com PJe+R / PDPJ), surgem sucessivos popups/toasts retangulares verdes empilhados no canto da tela (ex.: `"Tarefa - A tarefa foi executada!"`, `"Etiqueta - Etiqueta vinculada ao processo"`, `"Etiqueta - Etiqueta desvinculada do processo"`).
  * **Janela/Modal de Etiquetas é Estritamente Interface de Sistema:** A caixa de diálogo suspensa de etiquetas (`Últimas etiquetas usadas`, lista de seleção com checkboxes, botões de lixeira e badges coloridas no topo como `[A] Pedido de desistência`, `PREVENÇÃO PDPJ`, `CERTIFICAR TRANSITO`, etc.) é categoricamente **área de interface gráfica e controle interativo**, e NÃO área de leitura de texto judicial (conforme a diferenciação funcional já existente no addon).
  * O acúmulo desses toasts nativos, somado a scripts/observers do addon e de extensões adicionais como o PJe+R interagindo sobre cada clique de adição/remoção de tag, gera uma latência crítica ("lag"), tornando a seleção e remoção de etiquetas extremamente lenta e o movimento/arraste do mouse pesado e sem fluidez.
- **Diretriz de Engenharia e Comportamento Futuro Solicitado:**
  * **Classificação Estrita de Contexto:** Garantir que o modal/painel de etiquetas (`pje-etiquetas`, modais de seleção rápida de tags e checkboxes de triagem) seja classificado como `INTERFACE_SISTEMA` / não-textual, desabilitando rotinas de seleção textual desnecessárias sobre cliques ou arrastos casuais nesses botões e listas.
  * **No Módulo de Otimizações do PJe (`src/mod-pje/`):**
    1. **Eliminar Delays Artificiais e Animações:** Interceptar ou suprimir as animações, transições e esperas temporizadas de transição de estado que bloqueiam a thread visual do navegador durante a vinculação e desvinculação de etiquetas.
    2. **Suprimir / Neutralizar Popups e Toasts Nativos:** Ocultar e eliminar imediatamente a exibição desses toasts/popups repetitivos de feedback (como confirmações sucessivas de "Etiqueta vinculada", "Etiqueta desvinculada" e "Tarefa executada"), seja via injeção de CSS de alta prioridade (`display: none !important; opacity: 0 !important; pointer-events: none !important;`) nas classes correspondentes (ex.: `.toast`, `.toastr`, `.ui-growl`, `.snack-bar`, ou elementos de notificação flutuante do PJe), seja anulando o delay de fade/renderização.
    3. **Restaurar Fluidez Total do Mouse:** Ao remover esses nós flutuantes pesados e suas rotinas de animação JS/CSS, eliminar qualquer atraso de renderização gráfica que cause atrito ("lag") na interação com o ponteiro do mouse em modais de etiquetas e no uso com PJe+R.

### 6.12 Eliminação de Bloqueios de Interface / Telas Escuras (Overlays e Modais Residuais) no PJe
- **Sintoma Observado e Contexto Operacional:**
  * Na transição de tarefas ou carregamento de processos no painel PJe (conforme evidenciado na tela dividida em colunas), ocorre um bloqueio persistente onde a interface fica escura (efeito "backdrop" / máscara cinza translúcida travada).
  * O bloqueio visual pode incidir sobre a **tela total**, ou afetar **apenas o lado esquerdo** (coluna de processos/tarefas) ou **apenas o lado direito** (painel de detalhes/visualização do processo) separadamente.
  * Esse escurecimento bloqueia a interação do usuário com os elementos da tela, exigindo recarregamentos forçados ou gerando perda de tempo operacional.
- **Diagnóstico Técnico Preliminar:**
  * Os frameworks do PJe (Angular / RichFaces / Bootstrap / UI-Blocker) inserem elementos de sobreposição (`.modal-backdrop`, `.block-ui-overlay`, `.loading-overlay`, `.cdk-overlay-backdrop`, `.rf-st-mp`) que deveriam ser destruídos ao final de requisições AJAX ou conclusão da tarefa.
  * Quando há erro de script, resposta assíncrona fora de ordem ou interferência nos eventos de ciclo de vida, o elemento de overlay de backdrop não é removido do DOM ou mantém as propriedades `pointer-events: auto` e `opacity > 0`, travando o painel correspondente na escuridão.
- **Diretriz de Ajuste Futuro no Módulo Acelerador PJe Turbo (`src/mod-pje/`):**
  * **Neutralização Contínua de Overlays Zumbis:** No CSS Anti-Ampulhetas e no monitoramento de lifecycle, neutralizar qualquer camada de bloqueio/escurecimento residual que permaneça visível sem atividade de rede real (`opacity: 0 !important; pointer-events: none !important; display: none !important;`).
  * **Tratamento Específico por Coluna:** Mapear os seletores de bloqueio de painel divido (painel lateral esquerdo vs container de visualização direito) para desbloquear pontualmente a coluna afetada sem quebrar eventuais modais legítimos abertos pelo usuário (como janelas ativas de digitação de despachos/decisões).

### 6.13 Separação Modular Rígida dos Arquivos de Código-Fonte (Isolar Mudança de Interface vs. Selecionar/Copiar)
- **Constatação e Diagnóstico Arquitetural:**
  * Atualmente, rotinas de modificação e manipulação de interface (como comportamentos de mouse, teclado, atalhos de navegação e auto-seleção com foco em campos de formulários/inputs) encontram-se acopladas e misturadas dentro do mesmo fluxo e arquivos de código do módulo de seleção inteligente e cópia forense (`src/mod-copia/`).
- **Diretriz de Reorganização e Refatoração Futura:**
  1. **Desacoplamento Físico de Arquivos de Código:**
     * Isolar rigorosamente o código-fonte por domínios de responsabilidade única:
       - **Módulo de Seleção e Cópia Inteligente:** Responsável estritamente pelo ciclo de cópia, níveis de formatação, regex/máscaras, validações matemáticas (CPF/CNPJ/CNJ/Datas), contorno visual de Flash Verde e Área de Transferência.
       - **Módulo de Mudança de Interface (UI / Interação):** Responsável isoladamente pelas rotinas de mouse (botões laterais 4 e 5, gestos), teclado (atalhos de sistema), tratamento de foco, clique em controles e auto-seleção específica em campos de formulários (`<input>`, `<textarea>`, editores e forms).
     * O código de intervenção em formulários e interface não deve poluir a lógica de parsing e seleção de texto corrido.
  2. **Preservação Unificada das Telas de Opções e Ajuda:**
     * As páginas centrais de configuração ([options.html](../src/cfg/options.html)) e a Central de Ajuda ([ajuda.html](../src/cfg/ajuda.html)) devem **continuar centralizadas em arquivos únicos**, contendo todos os módulos integrados.
     * Manter a excelente organização já consolidada, onde as preferências e documentações são agrupadas de forma clara e intuitiva em seções/abas temáticas por módulo.
  3. **Aderência Obrigatória aos Princípios de Engenharia (Item 11 das Diretrizes Root):**
     * Estruturação de cada arquivo `.js` por Orientação a Objetos com encapsulamento de estado interno e guardas defensivas (`typeof ... === 'function'`) antes de qualquer chamada intermodular, garantindo que o desligamento de qualquer módulo de UI ou cópia jamais aborte ou quebre os demais módulos em execução.

### 6.14 Regra de Bloco: Conectivo de Dois-Pontos com Espaço Posterior Expandindo Sentença Completa
- **Contexto e Regra de Negócio Estabelecida:**
  * Em frases estruturadas com dois-pontos precedendo uma proposição ou instrução (exemplo canônico: `"Atenção: confira o processo antes de prosseguir."`, `"Importante: verifique os prazos."`, `"Despacho: cumpra-se imediatamente."`).
  * **Comportamento da Ação de Clique:**
    * Ao clicar no espaço em branco imediatamente posterior ao caractere dois-pontos `:` (isto é, o espaço entre `:` e `confira`), o motor deve identificar os dois-pontos antecedentes imediatos como um conectivo de sentença direta.
    * Em vez de isolar apenas a palavra subsequente ou apenas o rótulo anterior, esse clique no espaço conectado aos dois-pontos expande e seleciona imediatamente a **sentença inteira** (`"Atenção: confira o processo antes de prosseguir."`), integrando o prefixo enfático ao corpo da proposição de forma atômica e fluida.

### 6.15 Aperfeiçoamento do Flash Verde: Eliminação de Sobreposições Concorrentes e Redesenho em Múltiplas Linhas
- **Sintomas Observados e Exemplos Práticos:**
  1. **Sobreposição em Linha Única / Fragmentação Estranha:**
     * No cabeçalho do processo `MSCiv 1007676-28.2026.4.01.4002 - [Civ] Certificar trânsito em julgado - Definir data`, ao destacar o bloco, surgem três retângulos sobrepostos/colados: uma caixa para o número do processo, uma caixa aninhada sobre o colchete/hífen intermediário `[ - [Civ] C` e outra caixa para o restante da descrição.
     * Há colisão visual das bordas verticais gerando traços duplos e escurecimento na junção.
  2. **Estranheza e Fragmentação em Múltiplas Linhas / Parágrafos Complexos:**
     * Na seleção de parágrafos judiciais contendo rótulos e quebras de linha (`NÚMERO: 1007676...`, `PARTE(S): ...`, `UNIVERSIDADE FEDERAL... representada pelo membro da Advocacia-Geral da União... requer o que segue.`):
     * O motor desenha retângulos vazios compridos em linhas intermediárias, pequenas caixas pontuais flutuantes (traços verticais isolados nos espaços ou entrelinhas) e caixas separadas que englobam a linha inteira até a borda direita mesmo sem texto preenchido.
     * O aspecto visual fica desorganizado, excessivamente fragmentado e esteticamente poluído.
- **Diretriz de Refatoração e Solução Arquitetural:**
  * **Causa Raiz:** O motor utiliza `range.getClientRects()` iterando diretamente sobre fragmentos brutos de quebra de nó de texto (`TextNode`), nós invisíveis com quebras de linha (`\n` com altura de linha mas sem largura) e contêineres inline-block do DOM, desenhando uma `div` de overlay para cada `DOMRect` sem qualquer higienização geométrica.
  * **Algoritmo de Higienização e Coalescência Geométrica (Bounding Coalescer):**
    1. **Descarte de Caixas Vazias/Fantasmas:** Ignorar qualquer `DOMRect` com largura útil menor ou igual ao espaço em branco (`rect.width <= 4px` ou `rect.height <= 2px`) para eliminar traços verticais soltos e linhas vazias.
    2. **Fusão Horizontal de Retângulos na Mesma Linha (`mergeHorizontalRects`):** Retângulos adjacentes situados no mesmo alinhamento vertical (`Math.abs(r1.top - r2.top) < 3` e sobreposição ou proximidade horizontal `<= 6px`) devem ser fundidos em uma única caixa retangular unificada, eliminando completamente as bordas duplas internas.
    3. **Unificação Vertical Estética:** Em blocos contíguos de parágrafo, avaliar o uso de um contorno envolvente contíguo (`CSS Custom Highlight API` nativa onde suportada, ou uma máscara poligonal/envelope limpo) para evitar o aspecto de "gaiola de caixas empilhadas" com linhas desiguais.

### 6.16 Desacoplamento Arquitetural entre Seleção e Cópia (Listener Reativo de Cópia sobre Seleções Ativas e Retenção Condicional de Seleção)
- **Falha Observada no Comportamento Atual:**
  * Em certas situações, ao dar duplo clique sobre palavras longas ou blocos textuais, a seleção nativa/visual ocorre na tela, porém o texto **não é copiado para a Área de Transferência**, mesmo atendendo com folga ao requisito de comprimento mínimo de caracteres.
- **Validação Técnica da Lógica Proposta:**
  * A proposta é **100% válida, robusta e aderente às melhores práticas de arquitetura desacoplada**.
  * Atualmente, o fluxo de clique tenta realizar simultaneamente o cálculo geométrico do range, a injeção do Flash temporizado, a atualização da seleção do DOM e a cópia para a Área de Transferência em uma única função monolítica. Se qualquer etapa intermediária sofrer race condition ou bloqueio temporário de foco, a cópia falha silenciosamente.
- **Estruturação do Novo Modelo Desacoplado:**
  1. **Módulo de Seleção Autônoma (Geometria, Interação e Flash):**
     * Opera com base na posição do cursor, cliques (1, 2, 3 cliques, espaço), modificadores de teclado e regras de bloco.
     * Aplica o contorno visual rápido do Flash Verde temporizado (se ativo nas preferências).
     * **Regra de Retenção da Seleção do Sistema:**
       - Se o elemento clicado **não for elemento de interface** (isto é, pertencer à área de leitura/texto judicial, documento, petição, decisão, certidão ou **documento PDF aberto dentro do Chrome / visualizador de PDF**): **mantém a seleção ativa no sistema** que foi replicada ou criada. *(Ressalva explícita: não inclui a barra de ferramentas ou botões de interface de abertura/navegação do PDF, que continuam classificados estritamente como interface)*.
       - Se for elemento de interface gráfica/controle: **remove imediatamente a seleção do sistema** (`window.getSelection().removeAllRanges()`) logo após a finalização da ação, sem precisar aguardar o término do Flash temporizado visual.
  2. **Módulo de Cópia Reativo (Escuta e Disparo por Seleção):**
     * A funcionalidade de cópia atua como uma **escuta reativa (listener)** que monitora seleções ativas na tela (sejam disparadas pelo motor de seleção do próprio addon, pelo duplo clique nativo do navegador, por arraste de mouse ou por atalhos de teclado).
     * **Garantia de Entrega:** Ao detectar uma seleção válida na janela/frame, a rotina de cópia verifica: *"Este texto selecionado já foi copiado no ciclo atual?"*. Caso não tenha sido copiado ainda, **dispara a cópia para a Área de Transferência imediatamente**.
     * Isso assegura que **jamais ocorra seleção sem cópia correspondente**, tornando o sistema imune a falhas em duplo clique.

### 6.17 Redefinição do Botão do Meio (Scroll Click), Histórico Nativo Win+V e Extinção Total de Leitura do Clipboard
- **Contexto e Motivação Arquitetural:**
  * Políticas recentes de segurança de navegadores Chromium (Permissions-Policy / clipboard-read) bloqueiam ou exigem confirmações invasivas e restrições para a leitura assíncrona do Clipboard (`navigator.clipboard.readText()`).
  * Para simplificar radicalmente a experiência e conferir máxima confiabilidade sem atritos de permissão, o addon **extingue por completo qualquer dependência de releitura do clipboard do sistema**.
- **Novo Comportamento do Botão do Meio do Mouse (Scroll Click / Botão 2/3):**
  1. **Clique do Meio Simples (Scroll Click sem teclas):**
     * Simula as teclas de colagem nativas do sistema (`Ctrl + V`) no elemento em foco (ou invoca rotina própria de inserção via `document.execCommand('paste')` / despacho de evento de input/paste).
  2. **Ctrl + Clique do Meio (Scroll Click com tecla Ctrl):**
     * Envia/despacha para o sistema a combinação de teclas de chamada do histórico nativo da Área de Transferência do Windows: **`Win + V`** (ou aciona o atalho correspondente para abrir o menu flutuante nativo de histórico de área de transferência do SO, caso configurado no sistema operacional pelo usuário).
- **Simplificação das Telas de Opções, Ajuda e Configurações:**
  * **Configuração Única:** Mantém-se apenas a opção unificada: *"Colar com o botão do Meio (Scroll Click)"*.
  * **Remoção de Opções Obsoletas:** Ficam desnecessárias e devem ser eliminadas as opções *"Usar área de transferência (clipboard) do sistema"* e *"Histórico da Área de Transferência / Rollback (Ctrl + Botão do Meio do Mouse)"*, bem como quaisquer caixas de diálogo ou alertas sobre acesso impossibilitado ao clipboard.
  * **Migração do Texto de Ajuda:** A explicação que residia no help de rollback deve ser condensada e integrada de forma simples diretamente na descrição de *"Colar com o botão do Meio (Scroll Click)"*, informando o suporte ao atalho `Ctrl + Clique do Meio` para acionamento do histórico `Win + V`.
- **Eliminação Total da Releitura do Clipboard e Nova Tela "Última Seleção":**
  * **Retirada de Leitura:** Varrer e remover do código-fonte toda e qualquer rotina que tente ler ou requisitar o conteúdo da Área de Transferência do sistema operacional (`clipboard.read`, `readText`).
  * **Preservação Integral da Escrita:** As rotinas de gravação no clipboard (`writeText`, `write` com MIME types text/plain e text/html conforme o nível de formatação configurado) permanecem ativas exatamente como estão!
  * **Nova Área de Monitoramento "Última Seleção:":** No painel de controle e depuração, a seção anterior *"Conteúdo atual da Área de Transferência:"* será renomeada e ajustada para **"Última Seleção:"**, mantendo abas/formatos HTML e TXT. Essa área exibirá estritamente o payload exato que este addon enviou para a Área de Transferência no momento da cópia, dispensando 100% qualquer leitura física do clipboard do SO.

### 6.18 Generalização da Regra de Atos Administrativos (De "Ato INSS" para "Ato Adm: Órgão/Sigla")
- **Contexto da Regra:** Anteriormente mapeada para casos específicos (ex.: `"Ato INSS: Instrução Normativa PRES/INSS nº 128/2022"`).
- **Regra de Negócio Generalizada:**
  * Expandir a categorização e a máscara regex para **"Ato Adm:"** de forma universal, contemplando qualquer órgão, autarquia, tribunal ou ministério da administração pública.
  * O padrão deve suportar dinamicamente siglas e subdivisões fracionadas em barras de múltiplos níveis (ex.: `##`, `##/##`, `##/##/###/###`, como `PRES/INSS`, `DG/DPF`, `SAJ/SG/PR`, `SGP/SEGES/MGI`, etc.), reconhecendo número e ano (`nº 128/2022`) e capturando a menção do ato administrativo normativo de forma completa e íntegra.

### 6.20 Identificação Única de Componentes (`Ctrl + Alt + Shift + Clique`) e Mapeamento Manual Avançado de Elementos (Interface vs. Textual)
- **Contexto e Objetivo Operacional:**
  * Permitir que usuários avançados identifiquem elementos do DOM com unicidade cirúrgica (similar às opções de "Copiar" do DevTools F12 do Chrome) e possam cadastrar regras locais explícitas para forçar o comportamento do elemento como **Interface** ou **Textual**, corrigindo manualmente casos específicos de funcionamento da aplicação web.
- **1. Atalho de Inspeção e Captura de Identificador Único (`Ctrl + Alt + Shift + Clique`):**
  * Ao pressionar `Ctrl + Alt + Shift` e clicar com o mouse sobre qualquer componente de tela ou elemento de texto, o addon identifica o elemento em sua unicidade e extrai/copia seu caminho/seletor único (nos moldes do menu *Copy* do Chrome DevTools F12).
  * **Nota de Conciliação com Acumulador:** Verificar e harmonizar com o Modo Baralho atual do Acumulador (`Ctrl + Alt + Shift` em `SelecionarCopiar.js` / `AcumuladorCopia.js`), definindo se a captura de seletor atua quando não há fila de acumulação ativa, se abre um seletor/copia o caminho em formato configurável ou se substitui/complementa o gatilho.
- **2. Formatos de Identificação e Motores de Resolução no DOM:**
  * O sistema deve suportar os 4 estilos clássicos de identificação de elementos, resolvendo-os pelos motores nativos adequados do navegador:
    1. **Seletor Simplificado (CSS Selector):** ex.: `#detalheDocumento\:j_id477 > div`, `body`, `menu`. Resolvido via `document.querySelector()` / `document.querySelectorAll()` ou `element.matches()` / `element.closest()`.
    2. **Caminho JS (JS Path):** ex.: `document.querySelector("#detalheDocumento\\:j_id477 > div")`. Extraído/avaliado com segurança extraindo o seletor interno para `querySelector` (sem `eval` inseguro em páginas de terceiros, compatível com CSP do Manifest V3).
    3. **XPath Simplificado (XPath Relativo por ID):** ex.: `//*[@id="detalheDocumento:j_id477"]/div`, `//div[@id="menu"]`. Resolvido via **segundo motor nativo**: `document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)`.
    4. **XPath Completo (Full XPath Absoluto):** ex.: `/html/body/div[1]/div[2]/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/form[1]/form/div[3]/div[2]/div`, `/html/body`. Resolvido também via `document.evaluate(...)`.
  * **Caso Real Imediato de Uso (Pré-cadastrado / Homologação Obrigatória como Tipo Textual ou Semiflexível para Clique Simples):**
    * O motor deverá aceitar e categorizar imediatamente estes caminhos reais do PJe (permitindo seleção e cópia com 1 clique simples sobre dados/máscaras úteis ou palavras dentro deles e de seus filhos):
      - `//*[@id="detalheDocumento:j_id477"]/div` (XPath Simplificado — Detalhe do Documento)
      - `/html/body/div[1]/div[2]/div[2]/table/tbody/tr[2]/td/table/tbody/tr/td/form[1]/form/div[3]/div[2]/div` (XPath Completo — Detalhe do Documento)
      - `//*[@id="poloAtivo"]/table/tbody/tr/td/span/span` (XPath Simplificado — Polo Ativo / Partes e CPF)
      - `/html/body/div[1]/div[1]/div[1]/form[1]/ul/li/ul/li/div[3]/table/tbody/tr/td/span/span` (XPath Completo — Polo Ativo / Partes e CPF)
- **3. Grupo Recolhido para Usuários Experientes em Configurações Avançadas (`options.html`):**
  * Localizado dentro de **Configurações Avançadas**, posicionado **sempre como o último grupo**, **não numerado** e **sempre recolhido inicialmente** (mesmo ao expandir "Configurações Avançadas", este subgrupo permanece recolhido até que o usuário clique nele diretamente — idêntico ao comportamento da própria seção de Configurações Avançadas).
  * **Estrutura de Cada Regra Cadastrada (Suporte a Múltiplas Regras):**
    * **Campo de Expressão/Caminho:** Onde o usuário cola qualquer um dos 4 estilos (XPath Simplificado, XPath Completo, Caminho JS ou Seletor Simplificado), com detecção automática ou seleção do estilo.
    * **Declaração Explícita de Tipo (3 Modos — Textual, Interface ou Regra Semiflexível):**
      1. **Tipo Textual:** Aplicam-se rigorosamente todas as regras de conteúdo/leitura textual (1 clique seleciona/copia palavras ou blocos e mantém seleção ativa no DOM).
      2. **Tipo Interface:** Aplicam-se rigorosamente todas as regras de sistema/interface (1 clique não copia palavras comuns; exige `Alt + Clique` ou arrasto; zero retenção de seleção azul).
      3. **Regra Semiflexível (Restrita a Máscaras/Blocos Definidos):**
         - Não é tratada nem como interface pura nem como texto corrido comum, mas sim **de acordo com o conteúdo exato onde foi clicado, restrito às máscaras/blocos definidos no catálogo forense** (ex.: datas completas `"22/10/2026 13:27:16"`, datas abreviadas `"22 out. 2026"`, horários `"05:19"`, IDs `"2297533315"`, CPFs `"258.198.013-34"` ou `"CPF: 258.198.013-34"`, processos CNJ, CNPJ, moedas, etc.).
         - **Comportamento no 1 Clique Simples (sem teclas modificadoras):** O motor observa especificamente onde foi clicado (inclusive para qualquer `div`, `span`, `small` ou dentro de cabeçalhos/links `<a>`/`<h3>`). **Se o ponto clicado for um bloco/máscara definida**, **ele copia imediatamente para a Área de Transferência, exibe apenas o Flash Verde rápido e NÃO seleciona o texto via sistema (`removeAllRanges()`)**. **Se NÃO for bloco/máscara** (ex.: clicar em `"Juntado"`, `"LUCIANO"`, `"Pedido"`, `"Juntada"`), **não faz nada com clique único** (preservando 100% o clique nativo, copiando texto comum somente se `Alt` estiver pressionado).
         - **Exemplos HTML Reais de Homologação Obrigatória para Regra Semiflexível e Mapeamento XPath:**
           ```html
           <div>Juntado por LUCIANO HENRIQUE SOARES DE OLIVEIRA AIRES - POLO ATIVO - ADVOGADO em 22/10/2026 13:27:16</div>
           ```
           ```html
           <h3><a><span class="" title="2297533315 - Pedido de homologação de acordo">
               2297533315 - Pedido de homologação de acordo em 22/10/2026 13:27:16
           </span></a></h3>
           ```
           ```html
           <span class="text-upper texto-movimento">Juntada de Pedido de homologação de acordo</span>
           <span class="" title="">2297533315 - Pedido de homologação de acordo</span>
           <div class="media-body">
               <span class="text-muted data-interna">22 out. 2026</span>
           </div>
           <span class="text-muted data-interna">22 out. 2026</span>
           <small class="text-muted pull-right">05:19</small>
           <span class=""><span class="">JOSE RENATO CONCEICAO NONATO - CPF: 258.198.013-34 (AUTOR)</span></span>
           ```
    * **Escopo de Herança (Filhos):** Indicação (checkbox/switch) se a regra vale também para os **filhos** (objetos/elementos HTML descendentes do nó mapeado) ou estritamente para o elemento exato.
    * **Estado da Regra:** Indicação (checkbox/switch) se a regra está **Ativa** ou **Inativa**.
  * **Importação e Exportação em JSON:**
    * Botões **bem pequenos e discretos**, contendo **apenas os símbolos** de **Exportar** (ex.: `📤` / `⬇️`) e **Importar** (ex.: `📥` / `⬆️`) no cabeçalho/barra do grupo, permitindo salvar e carregar essas definições locais em arquivo `.json`.

### 6.21 Análise e Refinamento do CSS PJe Anti-Ampulhetas em Telas com Loop / Despachos em Lote
- **Necessidade e Contexto Operacional:**
  * Verificar e comparar minuciosamente com o CSS original do PJe.
  * O CSS atual (`src/mod-pje/PJE-anti_ampuletas.css`) neutraliza as cortinas e telas de carregamento do PJe (`movimentarRegion:status.stop`, `opacity: 0.01`, `pointer-events: none`). Contudo, essa intervenção indiscriminada retira partes essenciais da interface onde existe processamento em lote ou loops assíncronos em andamento, como na **tela de despachos em lote**.
  * Nestes cenários específicos com loop/processamento em lote (onde o sistema processa sequencialmente múltiplos expedientes), **é mandatório e interessante manter o bloqueio/cortina visual da interface**, impedindo que o usuário interaja concorrentemente ou clique em botões durante o processamento de segundo plano, o que causaria descompasso ou falha na rotina do backend.
- **Diretriz de Refinamento:**
  * Mapear os seletores, classes e contêineres específicos da tela de despachos em lote e loops de processamento coletivo do PJe (ex.: identificar classes de contêineres pais de lote ou atributos de tela de lote).
  * Garantir que a regra do CSS Anti-Ampulhetas não suprima o bloqueio da interface especificamente quando o contexto for de processamento em lote/loop.

### 6.22 Regra de Seleção em Lugares Não-Editáveis por Tempo de Flash/Box (0ms vs. >0ms)
- **Contexto e Motivação Operacional:**
  * Em áreas e elementos não editáveis (conteúdo de leitura jurídica, documentos, petições, despachos, páginas web e PDFs), o comportamento da seleção nativa do sistema operacional (seleção azul) deve ser condicionado ao tempo configurado para o contorno visual temporizado (Flash Verde / Box).
- **Regra de Negócio Estabelecida:**
  1. **Tempo de Flash igual a 0ms (Box Desativado):**
     * O motor deve **usar a seleção normal do sistema**.
     * Ao selecionar/copiar (1 clique ou atalhos), a seleção nativa azul do navegador permanece ativa e retida sobre o texto copiado (`window.getSelection()` preservado).
  2. **Tempo de Flash maior que 0ms (Box Ativado):**
     * O motor desenha o **box de destaque** (contorno poligonal do Flash Verde).
     * **Desabilitar a seleção do sistema** (de-selecionar quando selecionado via `window.getSelection().removeAllRanges()`).
     * Desta forma, o usuário visualiza unicamente o box temporizado, eliminando a concorrência estética ou sobreposição da seleção azul nativa com o contorno colorido do Flash.

### 6.23 Indicação do Dia da Semana em Seleções de Data na Wiki Forense
- **Contexto e Motivação Operacional:**
  * Assim como já ocorre para CNPJ (indicação de Matriz vs Filial), CPF (Região Fiscal da RFB), CNJ (Ramo e Tribunal) e INSS (Espécie de Benefício), seleções e cópias de Datas isoladas ou combinadas com horários exibem na Wiki Forense a decodificação do dia da semana correspondente.
- **Diferenciação Visual por Tipo de Dia:**
  * **Segunda a Sexta-feira (Dia Útil):** Card com cor verde padrão da Wiki Forense (fundo #f0fdf4, borda #22c55e, texto #166534, subtítulo [Nome do Dia] (Dia Útil)).
  * **Sábado e Domingo (Final de Semana):** Card com tom diferenciado em azul céu / ciano suave (fundo #f0f9ff, borda #0284c7, texto #075985, subtítulo [Nome do Dia] (Final de Semana)).
  * **Integração com Horários:** Em expressões contíguas (DD/MM/AAAA HH:MM ou HH:MM:SS), os metadados do dia da semana e horário integram-se no subtítulo (Quarta-feira (Dia Útil) • Horário: 06:28h).

### 6.24 Padronização de Nomenclatura de Backups sem Duplicação
- **Padrão de Nome do Arquivo ZIP:**
  * Os arquivos de backup gerados via `util/backup.bat` (`util/fazer_backup.ps1`) adotam o formato: `bkp_AAAA-MM-DD_HH-mm v<MAJOR>.<MINOR>.zip` (para backups automáticos sem comentário) ou `bkp_AAAA-MM-DD_HH-mm v<MAJOR>.<MINOR> - Comentario.zip` (quando requisitado comentário manual pelo usuário).
  * Backups automáticos do sistema/assistente NUNCA devem incluir comentário automático gerado pela IA. Comentários só são incluídos quando expressamente informados pelo usuário.
  * Elimina a redundância de duplicar mensagens longas do Git no nome do arquivo compactado.

### 6.25 Padrão de Versionamento AAMMDD.MAJOR.MINOR[.PATCH]
- **Regras do Versionamento do Addon:**
  * O identificador de versão adota estritamente o formato: `AAMMDD.MAJOR.MINOR[.PATCH]` (ex.: `261104.1.5`).
  * **Ano com 2 Dígitos (AA):** Utiliza apenas os dois últimos dígitos do ano (ex.: 26 para 2026), seguido de MM e DD (`261104`).
  * **Omissão / Supressão do .0:** O sufixo .0 de patch é dispensável e deve ser omitido da versão quando for zero (ex.: `261104.1.5.0` torna-se `261104.1.5`). Caso haja patch numérico superior a zero, é anexado pontualmente (ex.: `261104.1.5.1`).
  * **Regra Diária do MAJOR:** A cada novo dia (avanço de `AAMMDD`), o número `MAJOR` sempre é reiniciado em `1` (ex.: `261105.1.0`). Lançamentos ou features maiores subsequentes no mesmo dia incrementam o `MAJOR` (ex.: `2`, `3`).
  * **Subversões no Mesmo Dia:** Melhorias e correções no mesmo dia incrementam `MINOR` (ex.: `261104.1.1`, `261104.1.2`, `261104.1.3`, `261104.1.5`), enquanto patches pontuais incrementam `PATCH` (`261104.1.5.1`).
  * **Reflexo nos Backups e no Manifesto:** No `manifest.json`, reflete as propriedades `"version"` e `"version_name"`, enquanto os backups gerados via `util/backup.bat` (`util/fazer_backup.ps1`) integram a tag correspondente `v<MAJOR>.<MINOR>` (ex.: `bkp_2026-11-04_12-11 v1.5.zip`).

### 6.26 Refinamento de Balões da Wiki Forense e Erros de Auditoria (Regra de Concisão e Limpeza Visual)
- **Eliminação de Tipos de Cálculo em Balões Válidos:**
  * Quando a validação matemática for bem-sucedida, não exibir menções ao tipo de cálculo nos balões informativos (ex.: banir expressões redundantes como (Módulo 11 Válido) em NB pontuado).
- **Supressão de "Ativo" e Exibição de "Tipo Inativo / Tipo Extinto":**
  * Para benefícios e cadastros ativos, dispensar a indicação redundante de Ativo.
  * Caso o tipo seja extinto ou inativo, exibir com o prefixo explicativo Tipo Extinto ou Tipo Inativo, prevenindo que o operador confunda a vigência jurídica da espécie com o status cadastral individual no INSS.
- **Quebra de Linha em Textos Auxiliares:**
  * Informações acessórias (ex.: (RGPS - Contributivo)) devem ser posicionadas na linha seguinte do subtítulo (\n), promovendo máxima clareza e escaneabilidade visual.
- **Ícones de Validação (✓ e ✗) sem Sublinhado após o Dado:**
  * Dispensar o texto redundante (Válido ✓) ou (Válida ✓).
  * O dado principal permanece com sublinhado (<u>), seguido diretamente pelo ícone correspondente fora do sublinhado (<span style="text-decoration:none;">✓</span> para dados válidos da Wiki Forense, ou ✗ em vermelho para erros de auditoria).

### 6.27 Opção de Retirada e Retenção de Seleções do Sistema após Copiar
- **Contexto e Motivação Operacional:**
  * Define explicitamente o comportamento da seleção azul nativa do navegador após a captura automática com Flash Verde temporizado.
- **Modos Suportados (`modoRetirarSelecao`):**
  1. **Das partes com interface (`interface` - Padrão / Recomendado):**
     * Mantém as seleções nativas ativas sobre textos de leitura judicial, despachos, páginas web e documentos PDF.
     * Retira a seleção visual do sistema unicamente quando a cópia incidir sobre elementos de interface gráfica (botões, menus, diálogos, modais, toolbar e etiquetas), evitando sobreposição e caixas de seleção residuais em controles do sistema.
  2. **Total (`total` - Interface web e texto de leitura):**
     * Desseleciona do sistema em todas as áreas após a cópia (`removeAllRanges()`), tanto em interfaces quanto em textos de leitura/PDFs. O operador conta exclusivamente com a sinalização do Flash temporizado.
  3. **Total (exceto ao arrastar o mouse) (`total_exceto_arrasto`):**
     * Mantém a seleção nativa intacta caso a ação tenha ocorrido por arrasto manual do mouse (`eraArrasto === true`).
     * Desseleciona do sistema em todas as outras ações (clique simples, duplo clique, triplo clique, Alt+clique, Shift+clique) após soltar o mouse e antes do flash sumir.
  4. **Nenhuma (`nenhuma` - Manter selecionado):**
     * Jamais retira automaticamente seleções do sistema, preservando a seleção azul nativa visível em todas as situações (tanto em textos de leitura quanto em interfaces web).

### 6.28 Seleção Integral Multilinhas de Links com `Alt + 3 Cliques` (Unificação em Linha Única) [IMPLEMENTADO]
- **Contexto e Progressão de Cliques com `Alt` sobre Links (`<a>` / `[role="link"]`):**
  * **`Alt + 1 clique` em um link:** Comportamento aprovado (seleciona o campo forense/palavra sob o cursor ou o rótulo direto).
  * **`Alt + 2 cliques` em um link:** Comportamento aprovado (expande para o bloco/expressão ou objeto na linha).
  * **`Alt + 3 cliques` em um link (`extrairTextoLinkUmaLinha`):** Seleciona obrigatoriamente **TODO O TEXTO DO LINK** (mesmo que o link ocupe duas ou mais linhas visuais, contenha `<br>`, múltiplos `<span>`/`<div>` internos ou mais de 120 caracteres), fazendo com que o texto copiado fique **tudo em uma linha só**, contendo a integralidade do texto visível do link devidamente separado por espaços simples (normalizando quebras de linha `\r\n`/`\n` e espaços múltiplos em um único espaço `' '`).

### 6.29 Diretriz POLICE — Catálogo Hierárquico Append-Only (`exemplos.txt`, `exemplos.js` e `options.html`) [IMPLEMENTADO]
- **Regra Inviolável POLICE (Nunca Remover Exemplos):**
  1. É terminantemente **PROIBIDO** remover exemplos, tipos de exemplos, máscaras ou casos de uso de `src/cfg/options.html`, `src/cfg/exemplos.txt` e `src/cfg/exemplos.js`.
  2. Qualquer remoção só pode ocorrer quando uma funcionalidade for explicitamente desabilitada e mediante pergunta prévia e autorização expressa do usuário.
  3. Toda evolução do catálogo deve ser estritamente **aditiva (append)**: novos exemplos fixos são agregados dentro de uma máscara existente, ou novas máscaras dentro de um caso de uso, mantendo estrutura estritamente **HIERÁRQUICA** (`Caso de Uso -> Máscara -> Exemplos Fixos Positivos e Negativos`).
  4. `src/cfg/exemplos.js` e `src/cfg/exemplos.txt` documentam cada exemplo com tipo, máscara, comportamento de uso e origem, e **100% dos exemplos catalogados** (todos os de `options.html` + adicionais + gerados) são obrigatoriamente testados e validados por `src/cfg/debug.js`.

### 6.30 Fechamento Imediato de Popups de Auditoria e Mensagens Wiki Forense ao Clicar ou Desselecionar [IMPLEMENTADO]
- **Comportamento Sincronizado com o Flash Temporizado e a Desseleção:**
  1. Assim como ocorre quando se clica com o mouse (onde o texto é desselecionado e o Flash Temporizado desaparece imediatamente), todos os **popups de checagem/auditoria** (ex.: cálculo Módulo 11/97 falhou, CPF/CNPJ/CNJ/NB/Data inválido e máscara amarela de alerta) e todas as **mensagens de instrução / Wiki Forense** (ex.: tipo de aposentadoria/benefício do INSS, região fiscal do CPF, Matriz/Filial do CNPJ, ramo/tribunal do CNJ, dia da semana da data e minitips globais) devem ser **fechados imediatamente** (`ocultarTodosAvisosImediatamente()`).
  2. Gatilhos de fechamento imediato: clique com o mouse (`mousedown`), desseleção do texto (`selectionchange` quando a seleção colapsa fora da janela de graça de `40ms` e fora da desseleção automática do próprio addon), teclas `Escape` ou `Enter`, rolagem (`scroll`), perda de foco da janela (`blur`) e surgimento de modais/diálogos críticos.

### 6.31 Detecção Hierárquica de Editores (`pai`/`avô`/`ancestral` `contenteditable="true"`) e Exceção de Interface CKEditor (`cke_*` / `cke_*editor`) [IMPLEMENTADO]
- **Verificação Hierárquica de Editabilidade (`isElementoOuAncestralContentEditable`):**
  1. Em editores ricos reais (como o CKEditor do PJe em `<body contenteditable="true" class="cke_editable cke_editable_themed cke_contents_ltr cke_show_borders">`), o elemento diretamente clicado costuma ser um nó descendente (`<p> -> <span> -> <span>`) cujo pai, avô ou ancestral (`<body>`) possui `contenteditable="true"`.
  2. O motor verifica explicitamente o elemento clicado, o seu **pai** (`parentElement`), o seu **avô** (`parentElement.parentElement`) e toda a cadeia ancestral até o `ownerDocument.body` (incluindo classes `.cke_editable`, `.ql-editor`, `.ProseMirror`, `.mce-content-body`), garantindo que todas as checagens e automações de editor (como auto-seleção de *placeholders* complexos `@@@@INSTITUTO NACIONAL DO SEGURO SOCIAL - INSS(29.979.036/0001-40); GER EXEC DA AGENCIA DA PREVIDENCIA SOCIAL DE PARNAIBA PI; @@@` e `#####`) funcionem com 100% de precisão mesmo em subframes (`iframe`) do PJe.
- **Exceção Estrita para a Interface dos Editores (`isElementoInterfaceDeEditorRico`):**
  1. Ficam estritamente **excluídos** do tratamento de conteúdo editável todos os elementos pertencentes à interface/barra de ferramentas do editor: elementos com `id` ou `class` iniciados por `cke_*` (`cke_top`, `cke_toolbox`, `cke_toolbar`, `cke_combo`, `cke_button`, `cke_reset`, `cke_chrome`, `cke_inner`, `cke_voice_label`) ou cujo pai/avô/ancestral seja o contêiner de interface `cke_*editor` (ex.: `id="cke_ckEditor-frame-editorTexto"` / `class="cke_editor_..."`), bem como barras `.ql-toolbar`, `.tox-toolbar`, `.mce-toolbar` e `.editor-toolbar-main`.
  2. A única exceção dentro do prefixo `cke_` que representa documento editável é `.cke_editable` (ou elemento com `contenteditable="true"` explícito).

### 6.32 Seleção de Texto de Leitura em PDF Embedded (`pdf-viewer` / `<embed type="application/x-google-chrome-pdf">` / PDF.js) e Exceção da Interface do PDF (`viewer-toolbar` / `#toolbar` / `input#pageSelector`) [ANOTADO — PENDENTE DE AUTORIZAÇÃO]
- **Estrutura Identificada nas Imagens (PDF Embedded no PJe):**
  1. **Conteúdo de Leitura do PDF Embedded (Imagem 1):**
     * Host customizado `<pdf-viewer id="viewer">` com `#shadow-root (open)` contendo `<div id="container">` -> `<div id="main">` -> `<div id="scroller">` -> `<div id="content">` -> `<embed id="plugin" type="application/x-google-chrome-pdf" original-url="https://pje1g.trf1.jus.br/pje/downloadBinario.seam" src="chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/...">` (ou camada textual PDF.js `.textLayer` / `.pdfViewer` / `.page`).
     * No documento/área de leitura do PDF embedded, o clique simples (1 clique) deve selecionar e copiar o texto/bloco forense da mesma forma que ocorre fora desse caso, mantendo a regra de leitura documental (`LEITURA_COMUM` / `isAreaLeituraOuPdfConteudo === true`).
     * *Nota técnica:* Na função `isElementoInterativoOuUi`, a tag `EMBED` e `OBJECT` estava incluída indiscriminadamente em `TAGS_INTERATIVAS`, e eventos dentro de `#shadow-root (open)` do `<pdf-viewer>` precisam ser resolvidos via `e.composedPath()[0]` para distinguir se o clique ocorreu em `#content` / `#scroller` / `<embed type="application/x-google-chrome-pdf">` (área de leitura do PDF) ou na barra de ferramentas. Além disso, no plugin nativo PDFium (`mhjfbmdgcfjbbpaeojofohoefgiehjai`), o texto selecionado dentro do plugin `<embed>` pode ser capturado via `postMessage({ type: 'getSelectedText' })` ou API de seleção quando em camada DOM/Shadow DOM.
  2. **Exceção Estrita para a Interface do Próprio PDF (Imagens 2 e 3):**
     * Barra de ferramentas superior e controles laterais dentro de `#shadow-root (open)`: `<viewer-toolbar id="toolbar">`, `<div id="toolbar">`, `<div id="start">`, `<cr-icon-button id="sidenavToggle">`, `<div id="center">`, `<viewer-page-selector>` -> `#shadow-root (open)` -> `<input part="input" type="text" id="pageSelector" aria-label="Número da página">`, `<span id="zoom-controls">`, `<cr-icon-button id="fit">`, `<div id="sidenav-container">` (`viewer-pdf-sidenav`, miniaturas de páginas).
     * Todos esses elementos permanecem estritamente classificados como **Interface** (`LINK_CLICAVEL` / `CAMPO_SIMPLES_EDITAVEL` no caso do `input#pageSelector`), obedecendo às regras de interface (auto-seleção do `input#pageSelector` sem cópia automática e preservação total dos botões de zoom/rotação/download/impressão).

---

### 6.33 Posicionamento Inteligente Fora da Seleção para Popups de Verificação e Erro (`AvisoFlutuante.js`) [IMPLEMENTADO]
- **Problema Relatado pelo Usuário:**
  * Atualmente, os popups e tooltips de verificação matemática, avisos de erro de auditoria (ex.: CPF, CNPJ, NB inválido, falha de Módulo 11/97) e cartões da Wiki Forense estão sendo renderizados diretamente **em cima do texto clicado**.
  * Eles cobrem a própria seleção de texto nativa do sistema (`window.getSelection()`) e também cobrem o "Contorno Visual Rápido ao Copiar" (o retângulo do Flash Verde temporizado), prejudicando a visibilidade imediata do usuário.
- **Diferença de Comportamento em Relação ao Acumulador:**
  * O quadrante do Acumulador de Cópia (`AcumuladorCopia.js`) segue lógica de quadrante inteligente e está se posicionando de forma excelente.
  * O fator determinante para o problema no `AvisoFlutuante.js` decorre de que os avisos e verificações possuem múltiplas linhas de texto/HTML dinâmico com altura e largura variáveis (que antes de renderizadas ou sem cálculo prévio de `offsetHeight` levam a cálculos incorretos de ancoragem), enquanto o acumulador é mais compacto e unilinear.
- **Diretriz Técnica do Algoritmo Inteligente Anti-Sobreposição:**
  1. **Ancoragem Externa:** O balão do aviso deve sempre nascer **fora** da área ocupada pelo texto selecionado (`range.getBoundingClientRect()`) e **fora** do contorno visual do Flash.
  2. **Cálculo Baseado em Posição do Mouse e Bounding Box do Texto:**
     * Utilizar simultaneamente o retângulo da seleção (`selRect = range.getBoundingClientRect()`) e a posição do cursor do mouse (`mouseX`, `mouseY`).
     * Preferencialmente projetar o aviso imediatamente **acima** da seleção (com margem de segurança de `8px` a `12px` acima do topo do Flash/seleção).
     * Caso o espaço superior até o topo do viewport seja insuficiente (`top - cardHeight < 10px`), projetar imediatamente **abaixo** do limite inferior da seleção/flash (`bottom + 10px`).
     * No eixo horizontal, alinhar pelo centro da seleção ou do clique, aplicando travamento estrito dentro das bordas do viewport (`left = Math.max(12, Math.min(window.innerWidth - cardWidth - 12, left))`) para evitar qualquer transbordamento da janela.
  3. **Medição Prévia e Aplicação dos Estilos:**
     * Antes de posicionar o balão, garantir a medição real das dimensões multilinhas do card (`offsetWidth`, `offsetHeight`) ou calcular com precisão as caixas delimitadoras, eliminando sobreposições acidentais sobre o texto que acabou de ser clicado/copiado.

### 6.34 Unificação da Opção "Seleção Automática de Placeholders em Editores", Reorganização de Categorias e Padronização Visual de Fontes (`options.html`) [IMPLEMENTADO]
- **Unificação das Opções de Editores:**
  * As antigas opções "Pré-seleção sem Cópia em Campos Editáveis e Minutas" (`optSelecaoAutomaticaTextoEditavel`) e "Seleção Automática de Placeholders em Editores HTML Online (Minutas)" (`selectModoPlaceholdersMinutasHtml`) foram unificadas em uma única opção clara e concisa: **"Seleção Automática de Placeholders em Editores"**.
  * **Comportamento unificado:**
    - Quando configurada como `"Desabilitado (sem seleção alguma)"` (`desabilitado`), desativa a pré-seleção automática tanto em campos simples de formulário (`<input>`, `<textarea>`) quanto em editores ricos/minutas HTML/CKEditor (`selecaoEditavelAtiva = false`, `placeholdersMinutasHtmlAtivo = false`).
    - Quando qualquer outro modo está selecionado (`placeholders`, `ctrl_avancado` ou `avancado`), os campos de input/textarea ativam sua pré-seleção rápida e os editores de texto seguem a regra operacional selecionada (`selecaoEditavelAtiva = true`, `placeholdersMinutasHtmlAtivo = true`).
- **Reorganização das Categorias Avançadas (`options.html`):**
  * "Separador do Modo Acumulador (Ctrl + Alt)" migrado para dentro de **"2. CÓPIA INTELIGENTE: Editores de Minutas e Validação"**, imediatamente antes do item "Tempo de Exibição dos Avisos na Tela".
  * "Atalho Inteligente F1 (Prompt de IA / Assistente)" migrado para **"3. TECLADO/MOUSE: Navegação por Teclado e Botões Laterais"**, imediatamente após "Permitir navegação em campos de entrada usando o teclado".
- **Padronização Visual da Fonte em `options.html`:**
  * O bloco da opção "Retirar Seleções do Sistema após Copiar" apresenta estilo visual de fonte divergente das demais seções.
  * Padronizar as tags, tamanhos de fonte, cores e margens para seguir rigorosamente o padrão visual consolidado das demais opções do painel de configurações.

### 6.35 Diagnóstico e Correção de Seleções em Editores CKEditor e em Visualizadores de PDF [ANOTADO — PENDENTE DE IMPLEMENTAÇÃO]
- **Diagnóstico Aprofundado via DevTools / Imagens Anexadas:**
  1. **Estrutura Real do CKEditor no PJe (Imagem `media_1793860964286_f8a38622.jpg`):**
     * O container externo é `<div id="taskInstanceForm:Minutar_ato-10552541588:editorTexto">` -> `<div class="col-sm-12">`.
     * O `<textarea id="ckEditor-frame-editorTexto">` tem `display: none; visibility: hidden;` (apenas para binding do formulário).
     * O editor visual real é instanciado em `<div id="cke_ckEditor-frame-editorTexto" class="cke_1 cke cke_reset cke_chrome cke_editor_ckEditor-frame-editorTexto ...">`.
     * A barra superior com botões de formatação fica em `<span id="cke_1_top" class="cke_top ...">` (interface pura).
     * A área real onde o texto da minuta reside é um **iframe**: `<iframe class="cke_wysiwyg_frame cke_reset" ...>` -> `#document` -> `<html ...>` -> `<body contenteditable="true" class="cke_editable cke_editable_themed ...">`.
     * **Comportamento exigido no CKEditor:** As seleções de texto comum não devem roubar o foco nem copiar texto espúrio com 1 clique (para permitir que o operador digite livremente sem interferências); o cursor de digitação nativo deve permanecer visível e apenas os *placeholders* (`@@@...@@@` ou `#####`) devem ser auto-selecionados ao serem clicados, sem cópia automática.
  2. **Estrutura Real do Visualizador de PDF (Imagem `media_1793860777507_fd8572ab.jpg`):**
     * O visualizador é encapsulado em `<pdf-viewer id="viewer">` -> `#shadow-root (open)` -> `<div id="container">` -> `<div id="main">` -> `<div id="scroller">` -> `<div id="content">` -> `<embed id="plugin" type="application/x-google-chrome-pdf" src="chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai/...">`.
     * Dentro do `#document` do embed há `<div id="sizer">` e outro `<embed type="application/x-google-chrome-pdf">`.
     * **Comportamento exigido no PDF:** Sendo um documento de leitura estritamente não editável, o clique simples sobre qualquer dado ou palavra deve executar o fluxo completo de cópia com sinalização do Flash Verde e retirada da seleção visual do sistema conforme a opção selecionada (`interface` ou `total`).

### 6.36 Migração de `exemplos.txt` para `exemplos.json` Integrado a `ConstantesPadroes.js` e `debug.js` [ANOTADO — PENDENTE DE IMPLEMENTAÇÃO]
- **Objetivo da Migração:**
  * Transformar o catálogo de exemplos atualmente em formato texto (`src/cfg/exemplos.txt`) em um arquivo JSON estruturado, tipado e hierárquico (`src/cfg/exemplos.json`).
  * Em vez de utilizar identificadores e códigos artificiais de máscara (como `01.05_BENEFICIO_PREVIDENCIARIO_INSS_NB`), correlacionar diretamente as chaves, nomes e regex com as constantes já definidas em `ConstantesPadroes.js` e com as opções de `options.html`.
- **Origem e Geração do Catálogo:**
  * O arquivo `exemplos.json` deve ser composto pela junção de:
    1. Constantes e expressões regulares catalogadas em `ConstantesPadroes.js`.
    2. Todos os exemplos de exibição e testes presentes em `options.html` (seja no help/ajuda contextual, seja nas telas explicativas).
- **Consumo Obrigatório por `debug.js` sob a Regra POLICE:**
  * O script `src/cfg/debug.js` deverá carregar e iterar sobre o `exemplos.json`, executando a bateria de testes de validação matemática e formatação contra 100% dos exemplos catalogados.
  * Fica estritamente mantida a regra incondicional **POLICE Append-Only** (nunca remover exemplos existentes, apenas enriquecer o catálogo com novos casos de teste).

### 6.37 Regra de Negócio Universal de `Alt + Clique` em Espaço em Branco (1 Clique Expande como 2 Cliques) [IMPLEMENTADO]
- **Diretriz Root Universal para Interações com Tecla `Alt`:**
  1. **Comportamento do Clique sobre Espaço em Branco:**
     * Ao pressionar a tecla `Alt` e clicar com o mouse sobre um **espaço em branco** contido dentro de um link (`<a>`), botão ou elemento de texto, o sistema deve seguir a regra de negócio consolidada:
       - **1 clique em cima do espaço em branco faz exatamente o que 2 cliques fazem na palavra** (expande imediatamente a seleção para a palavra, bloco ou expressão completa em que o espaço atua como conector).
       - `Alt + 2 cliques` expande para o bloco completo ou para o elemento/linha inteira.
       - `Alt + 3 cliques` em um link executa a extração integral unificada em uma única linha (`extrairTextoLinkUmaLinha`).
  2. **Universalidade da Regra:**
     * Esta regra possui caráter **root e universal**, aplicando-se a links, botões, etiquetas de interface e parágrafos de texto comum.
     * Preservação da lógica contínua de expansão sem quebras artificiais de contexto.

### 6.38 Proteção de Tamanho Mínimo em Texto de Leitura e Unificação de Desinências Isoladas entre Parênteses `(A)` [ANOTADO — PENDENTE DE IMPLEMENTAÇÃO]
- **Problema Relatado com Evidência Visual (`media_1793860297200_8eaaa2bb.png`):**
  * Na imagem anexada de cabeçalho de petição judicial (`"EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) FEDERAL..."`), ao clicar na desinência `(A)` de `"SENHOR(A)"`, o sistema selecionou e copiou exclusivamente a letra `"A"`.
  * **Inconformidades diagnosticadas:**
    1. **Violação do tamanho mínimo configurado:** A restrição de mínimo de caracteres (ex.: mínimo de 5 caracteres) não filtrou a cópia em texto de leitura documental.
    2. **Desmembramento incorreto de palavras flexionadas:** Em textos forenses, desinências entre parênteses como `(a)`, `(o)`, `(s)`, `(as)`, `(os)`, `(es)` integram a palavra que as antecede.
- **Diretriz de Correção:**
  * O motor de seleção atômica deve unir automaticamente a desinência entre parênteses ao vocábulo anterior (`"SENHOR(A)"`, `"DOUTOR(A)"`, `"JUIZ(A)"`), copiando o termo completo.
  * Respeitar estritamente o filtro de tamanho mínimo de letras configurado nas opções, impedindo a captura de letras soltas sem combinação explícita de tecla modificadora.

### 6.39 Auto-Seleção com 1 Clique e Reconhecimento de Seleção Manual em Tabelas JSF/RichFaces de Subframes (`listTasksUsuarioPje2.seam`) [IMPLEMENTADO]
- **Evidência Visual e Estrutura Identificada na Imagem (`media_1793861616606_50324c46.jpg`):**
  * **Contexto de Tela:** Lista de últimas tarefas executadas no PJe (`div.frameUltimasTarefas` contendo `<iframe id="frameUltimasTarefas" src="https://pje1g.trf1.jus.br/pje/Painel/painel_usuario/include/listTasksUsuarioPje2.seam?iframe=true">`).
  * **Elemento Específico sob Inspeção:** Célula de tabela contendo o Número do Processo CNJ (`1020445-05.2025.4.01.4002`):
    * Tag: `<td class="rich-table-cell" id="j_id22:ultimasTarefasDataTable:0:j_id23">1020445-05.2025.4.01.4002</td>`.
    * Tabela: `<table class="rich-table" id="j_id22:ultimasTarefasDataTable">` dentro de `<form id="j_id22" ...>`.
- **Problemas Relatados pelo Usuário:**
  1. **Falha de Auto-Seleção por 1 Clique Simples:** O número do processo na célula `td.rich-table-cell` não está sendo selecionado/copiado com 1 clique simples, apesar de ser um dado estruturado de processo CNJ legítimo.
  2. **Não Reconhecimento da Seleção Manual Feita pelo Usuário:** Ao arrastar o mouse e selecionar manualmente o texto do processo com a seleção azul nativa do sistema (sem uso de automação), o addon não detecta que houve uma seleção ativa e não executa a auto-cópia para a Área de Transferência.
- **Diretrizes Técnicas de Negócio e Engenharia:**
  1. **Mudança 1: Auto-Seleção com 1 Clique Simples em Células de Tabela RichFaces:**
     * As células `<td>` de tabelas de dados do PJe (`rich-table`, `dataTable`, `p-datatable`) que contenham texto puro ou nós de texto direto (como processos CNJ, datas, horários, nomes) são categorizadas como **conteúdo legível/leitura** (`LEITURA_COMUM`) e não como controles interativos opacos de UI.
     * O clique simples em `td.rich-table-cell` sobre um padrão estruturado (Processo CNJ) deve disparar a expansão atômica imediata do bloco do processo, com cópia limpa para a Área de Transferência e validação visual correspondente.
  2. **Mudança 2: Detecção Inteligente e Robusta de Seleções Genéricas / Manuais (`selectionchange` / `mouseup`):**
     * Quando o usuário seleciona um texto manualmente (arrastando o mouse ou usando teclado nativo), o motor do addon deve capturar a seleção via ouvinte de `mouseup` / `selectionchange`.
     * **Auto-Cópia com Salvaguardas:** Detectada a seleção manual válida de texto útil (respeitando o limite mínimo de caracteres e filtros de dados), o sistema deve copiar o texto automaticamente para o clipboard (mesmo dispensando o contorno visual de Flash para evitar atrito visual ou instabilidade durante arrasto manual).
     * **Blindagem Anti-Loop e Prevenção de Múltiplos Disparos:**
       - Criar trava por assinatura do texto selecionado (`ultimaSelecaoManualTexto` e timestamp `ultimoTimestampSelecaoManual`) para impedir que a mesma seleção seja processada múltiplas vezes em cascata.
       - Impedir loops de seleção: a auto-cópia disparada por seleção manual não deve re-disparar novos eventos sintéticos de seleção nem sobrepor seleções ativas do usuário.
       - Harmonizar múltiplos tipos de seleção por eventos concorrentes (`click` vs `mouseup` vs `selectionchange`), garantindo que uma seleção iniciada por clique único prevaleça e desative o handler de arrasto concorrente, e vice-versa.
       - Garantir que a injeção do motor ocorra corretamente dentro do subframe `listTasksUsuarioPje2.seam` (`all_frames: true`), permitindo a escuta atenta dos eventos de mouse na janela interna da tabela.

### 6.40 Correção do Popup de Duplo Esc (`Esc + Esc`): Duração Efêmera e Desrespeito ao "Tempo de Exibição dos Avisos na Tela" [IMPLEMENTADO]
- **Problema Relatado:**
  * O popup de alternância de modo acionado pelo atalho `Esc + Esc` (`Remover Formatacoes: DESATIVADO / ATIVADO`) está surgindo e desaparecendo quase instantaneamente na tela ("muito rápido").
  * Ele **não está respeitando** o valor configurado na opção `"Tempo de Exibição dos Avisos na Tela"` (`tempoExibicaoAlertaMs` configurado em `options.html`, padrão 3,5s).
- **Diagnóstico Técnico da Causa Raiz:**
  1. **Conflito de Fechamento por Tecla Esc:** No evento `keydown`, a tecla `Escape` dispara imediatamente `limparAvisosAuditoriaEWikiImediatamente()` e `executarDeselecaoUniversal(false)`. O segundo `Esc` que completa o duplo clique dispara a projeção do mini-tip via `validador.projetarMiniTipGlobal(msgModo, corBorda)`. Porém, ouvintes concorrentes de teclado ou o fechamento universal subsequente em `selectionchange` ou frames filhos capturam o evento residual do `Escape` e ocultam o popover de forma prematura.
  2. **Tempo Fixo Hardcoded em `AvisoFlutuante.js`:** O método `projetarMiniTipGlobal(mensagem, corBorda)` possui temporizador fixo hardcoded (`setTimeout(..., 2400)`), ignorando totalmente a propriedade dinâmica `this.tempoExibicaoMs` configurada pelo usuário via `validador.definirTempoExibicao(cfg.tempoExibicaoAlertaMs)`.
  3. **Auto-Destruição Indesejada:** Quando `tempoExibicaoAlertaMs > 0`, o mini-tip do duplo Esc deve permanecer em exibição exatamente pelo tempo configurado (`this.tempoExibicaoMs`), e o temporizador do mini-tip (`this.temporizadorMiniTip`) deve ser imune ao fechamento acidental pelo próprio evento de `Escape` que o invocou.
- **Diretriz de Correção Futura:**
  * Em `AvisoFlutuante.js`: fazer `projetarMiniTipGlobal` utilizar estritamente `const duracao = (typeof this.tempoExibicaoMs === 'number' && this.tempoExibicaoMs > 0) ? this.tempoExibicaoMs : 3500;`.
  * Em `SelecionarCopiar.js`: blindar a projeção do duplo Esc contra a limpeza atômica imediata provocada pela própria tecla de escape, garantindo que o badge permaneça visível e legível pelo período estipulado nas opções.

### 6.41 Verificação e Implementação do Cálculo de Validação Matemática para PIS/PASEP/NIT (`NNN.NNNNN.NN-N`) [IMPLEMENTADO]
- **Contexto e Demanda Relatada:**
  * Verificar e implementar o cálculo de validação matemática (Módulo 11 com pesos `3, 2, 9, 8, 7, 6, 5, 4, 3, 2`) para inscrições do tipo **PIS / PASEP / NIT** no formato `NNN.NNNNN.NN-N` (11 dígitos), como no exemplo da Central de Ajuda (`PIS/NIT: 120.43256.72-8`).
- **Implementação do Motor (`AvisoFlutuante.js` e `ConstantesPadroes.js`):**
  * Expressão centralizada `PIS_ISOLADO` adicionada a `REGEX_AUDITORIA` em `ConstantesPadroes.js`.
  * Método `validarPIS(pisStr)` implementado em `AvisoFlutuante.js`, validando sequência repetida, pesos Mod 11, resto e DV esperado, gerando aviso de erro amarelo quando inválido e Wiki Forense verde quando válido.
  * Auditado com 100% de sucesso em `debug.js`.

### 6.42 Validação Matemática Genérica Fallback para Números Não-Identificados, Não-Pontuados ou Incompletos [IMPLEMENTADO]
- **Contexto Operacional e Motivação:**
  * Permitir que números genéricos, números não-pontuados ou com pontuação incompleta (ex.: `099123450-2`, `0991234502`, `120.43256.72-4`, `12043256.72-4`, `1204325672-4`, `1300802143` ou alfanuméricos como novos CNPJs) passem por uma verificação matemática mesmo quando o padrão de máscara não for estritamente casado ou quando a frase contextual não permitir inferir explicitamente o tipo do documento (como NB, Benefício, INSS, CPF, etc.).
- **Regra de Negócio Estabelecida e Implementada (Última Barreira de Verificação):**
  1. **Mecanismo Fallback de Última Barreira (`validarNumeroGenericoFallback`):**
     * Caso o texto clicado/selecionado seja numérico (ou alfanumérico com números e letras) e **não** tenha sido identificado por nenhuma máscara específica com contexto, o motor aplica uma bateria de testes com todos os cálculos de dígitos verificadores conhecidos (Mod 11 com pesos cíclicos 2..9, Mod 11 NB INSS de 10 dígitos, Mod 11 PIS/NIT de 11 dígitos, Mod 11 estilo CPF com 2 DVs, Mod 11 Alfanumérico CNPJ, Mod 97 de processo CNJ / BigInt e Mod 10 / Luhn).
  2. **Exibição Exclusiva em Caso de Sucesso Matemático (Cartão em Cinza Neutro):**
     * Se um (ou mais) dos cálculos matemáticos der certo, o sistema projeta um **balão em cor cinza neutra** (`#f1f5f9`, borda `#94a3b8`, texto `#1e293b`) informando o **tipo de cálculo** aprovado (e não o tipo de documento, já que o tipo é desconhecido).
     * Formato visual:
       ```html
       [Mod11]: <u>1300802143</u> <span style="text-decoration:none;color:#16a34a;">✓</span>
       ```
     * Caso múltiplos cálculos batam, cada algoritmo é projetado em uma linha própria dentro do cartão cinza.
  3. **Silêncio Absoluto em Caso de Não-Validação (Nada Apresentar):**
     * **Regra Fundamental de Ouro:** Se o número genérico/não-identificado NÃO for validado por nenhum dos cálculos matemáticos testados, **NADA É APRESENTADO NA TELA** (zero popups, zero balões e zero alertas), permanecendo 100% silencioso para evitar falsos-positivos em números aleatórios da página.
  4. **Cobertura em Auditoria:** Validado com 252/252 testes automatizados aprovados no Chrome Headless.

### 6.43 Proteção Universal de Tamanho Mínimo de Texto para Cópia (Páginas e Interfaces) [IMPLEMENTADO]
- **Contexto e Solicitação do Usuário:**
  * O sistema estava permitindo a seleção, cópia e contorno em palavras minúsculas soltas (como `"ou"`, de 2 caracteres) em texto comum da página, mesmo com a opção de limite mínimo configurada (padrão de 5 caracteres).
  * O rótulo e o escopo da opção foram estendidos de `"Tamanho Mínimo de Texto para Cópia em Interfaces"` para `"Tamanho Mínimo de Texto para Cópia"`, passando a atuar universalmente tanto em textos da página quanto em elementos de interface.
- **Regra e Texto Oficial Atualizado em `options.html`:**
  * **Rótulo:** `Tamanho Mínimo de Texto para Cópia`
  * **Texto de Ajuda (`setting-help`):** `Em textos da página ou elementos de interface, caso não seja um campo estruturado, evita a perda acidental do conteúdo da Área de Transferência quando inexistem teclas modificadoras (clique único, duplo ou arrasto sem combinações das teclas Ctrl ou Alt). Assim, se não for campo estruturado (data, CPF, etc.), exige no mínimo esta quantidade de caracteres para confirmar a cópia e o contorno.`
- **Implementação do Motor (`SelecionarCopiar.js`):**
  * `verificarProtecaoTamanhoMinimoInterface`: Se não houver tecla modificadora (`Ctrl` ou `Alt`) e o texto limpo (sem espaços) não for um campo estruturado forense (`!isTextoCampoEstruturadoForense(texto)`), exige `textoSemEspacos.length >= minimoCaracteresInterface`. Se for inferior, a cópia e o contorno flash são cancelados, preservando o conteúdo anterior da Área de Transferência.
  * Coberto por auditoria automatizada em `debug.js` (246/246 testes aprovados).

### 6.44 Correção e Padrão de Fábrica do Botão de Sentido de Ordenação de Guias [IMPLEMENTADO]
- **Contexto e Solicitação do Usuário:**
  * O switch de alternância do Sentido de Ordenação de Guias apresentava inconsistências visuais e comportamentais de estado ativo/desativo em relação ao texto descritivo.
- **Padrão de Fábrica e Comportamento Estabelecido:**
  * **Padrão de Fábrica:** `"Da Esquerda para a Direita (A-Z)"`, com o botão switch em estado **azul, ativo** (`checked = true`, valor `'esq_dir'`).
  * **Ao clicar no botão azul ativo:** Transiciona para o estado **desativo** (cinza/desmarcado, `checked = false`, valor `'dir_esq'`) e o texto descritivo muda imediatamente para `"Da Direita para a Esquerda (Z-A)"`.
  * **Ao clicar novamente (e vice-versa):** Transiciona de volta para o estado **ativo** (azul, `checked = true`, valor `'esq_dir'`) e o texto descritivo retorna para `"Da Esquerda para a Direita (A-Z)"`.
  * Compatibilizados `options.html`, `options.js`, `background.js` (persistência e defaults) e a suíte de auditoria em `debug.js` (246/246 testes aprovados).

### 6.45 Validação Matemática de Benefício INSS (NB) e Protocolo Administrativo [ANOTADO — ANÁLISE TÉCNICA CONCLUÍDA]
- **Contexto e Exemplo Submetido:**
  * Exemplo avaliado: `"Protocolo Administrativo nº 692364437 / NB 1300802143"`.
- **Diagnóstico Matemático e Algoritmos:**
  1. **Número de Benefício (NB) — `1300802143` (10 dígitos):**
     * **Algoritmo Oficial:** Módulo 11 com pesos `2, 3, 4, 5, 6, 7, 8, 9, 2` aplicados da direita para a esquerda sobre os 9 primeiros dígitos (`130080214`):
       $$\text{Soma} = (4\times2) + (1\times3) + (2\times4) + (0\times5) + (8\times6) + (0\times7) + (0\times8) + (3\times9) + (1\times2) = 8 + 3 + 8 + 0 + 48 + 0 + 0 + 27 + 2 = 96$$
       $$\text{Resto} = 96 \pmod{11} = 8$$
       $$\text{Dígito Verificador (DV)} = 11 - 8 = \mathbf{3}$$
     * **Resultado:** O DV esperado é **3**, que coincide exatamente com o 10º dígito informado (`3`). Portanto, `1300802143` é **100% válido matematicamente** pelo Módulo 11 do NB do INSS.
     * **Situação Atual no Addon:** O método [`validarNumeroBeneficioINSS`](file:///z:/AddonChrome-GovBR/src/mod-copia/AvisoFlutuante.js#L775) já implementa esse cálculo exato. Quando precedido por `"NB "` ou pontuado (`130.080.214-3`), ele já valida e exibe a Wiki Forense. Com a feature FEAT-03 (Seção 6.42), ele também será validado se clicado isoladamente sem máscara.
  2. **Protocolo Administrativo — `692364437` (9 dígitos):**
     * Diferente do NB (que possui DV oficial padronizado pela Dataprev), protocolos do Meu INSS / SAG / PAP são sequenciais gerados pelos sistemas de triagem administrativa. Se submetido a teste genérico de Mod11 como última barreira (FEAT-03), o sistema testa múltiplos pesos; se não validar, mantém a Regra de Ouro (silêncio total, zero popups de erro para evitar falso-positivo).

### 6.46 Separação Arquitetural de "NAVEGADOR: Gerenciamento de Guias e Janelas" e "TECLADO/MOUSE: Navegação por Teclado e Botões Laterais" em Módulos Independentes [IMPLEMENTADO E COBERTO POR TESTES]
- **Escopo Concluído e Paridade Estrutural 1:1:**
  1. **Módulo 3: TECLADO/MOUSE (`src/mod-input/`):**
     * `input-botoes-laterais.js` (`class BotoesLateraisMouse`): Captura dos botões 4 e 5 para troca circular entre guias da janela com debounce de hardware (80ms).
     * `input-botao-meio.js` (`class BotaoMeioColagem`): Colagem rápida no cursor via scroll click e invocação de Win+V com `Ctrl + Botão do Meio`.
     * `input-teclado-campos.js` (`class NavegacaoTecladoCampos`): Alternância por setas verticais (↑ e ↓) em campos `<input>` com auto-seleção imediata.
     * `input-atalho-f1.js` (`class AtalhoF1Gemini`): Interceptação de F1, supressão da ajuda nativa e envio de contexto para o Google Gemini sem poluir a área de transferência.
     * `mod-input.js` (`class ModuloInput`): Fachada orquestradora selada com `Object.freeze` e grafo com Null Objects imutáveis.
  2. **Módulo 4: NAVEGADOR (`src/mod-navegador/`):**
     * `navegador-janela-unica.js` (`class GerenciadorJanelaUnica`): Single Window e preservação de janelas de autenticação Gov.br, ICP-Brasil, PJEOffice e Shodô.
     * `navegador-anti-duplicacao.js` (`class GerenciadorAntiDuplicacao`): Reutilização de guias abertas, normalização limpa de URL e descarte de duplicatas com blindagem da guia atual.
     * `navegador-ordenacao.js` (`class GerenciadorOrdenacaoGuias`): Ordenação hierárquica por URL/domínio/título e agrupamento colorido via Tab Groups API.
     * `navegador-descarte.js` (`class GerenciadorDescarteGuias`): Economizador de memória RAM (Tab Discarding) de guias inativas via `chrome.tabs.discard`.
     * `mod-navegador.js` (`class ModuloNavegador`): Fachada orquestradora selada com `Object.freeze` e grafo com Null Objects imutáveis para Service Worker.
- **Auditoria e Validação:** 10 testes unitários determinísticos injetados na Bateria 11 de `src/cfg/debug.js` (300/300 testes aprovados, 100% verde).

### 6.47 Varredura Completa do Código, Revisão Profunda de Comentários e Separação de Módulos [ANOTADO — PENDÊNCIA]
- **Escopo da Varredura e Documentação:**
  * Realizar varredura sistemática linha a linha no código-fonte de todos os módulos (`src/cfg/`, `src/mod-copia/`, `src/mod-pje/`), mapeando todos os pontos de acoplamento entre as rotinas de Cópia Inteligente, Navegação Web/Abas e Teclado/Mouse.
  * Revisar, expandir e enriquecer todos os comentários internos com detalhes exatos de funcionamento operacional, lógica de fronteiras, estruturas de dados manipuladas e regras de negócio.
  * Auditar continuamente o alinhamento com a Central de Ajuda (`options.html`), catálogo centralizado de regras (`exemplos.json`) e suíte de testes determinísticos de debug (`debug.js`).

### 6.48 Correção do Duplo Clique em Elementos Formatados Inline / Marca-Texto (`<mark>`) [RESOLVIDO E COBERTO POR TESTES]
- **Descrição do Bug:**
  * Ao dar duplo clique em um termo com formatação inline ou marca-texto isolado (ex: `<mark>marca-texto</mark>` em `options.html`), a rotina `tentarExpandirBlocoFormatadoDestaque` falhava por exigir prematuramente ao menos duas palavras com espaço interno (`/\S+\s+\S+/`).
  * Em consequência, o fluxo caía em fallback para expansão por pontuação, capturando o espaço em branco à direita (`marca-texto `) e estendendo a caixa do contorno flash verde além do fundo amarelo do marca-texto.
- **Solução Implementada:**
  * Modificada a rotina `tentarExpandirBlocoFormatadoDestaque` em `SelecionarCopiar.js`: quando o destaque decorre de tag inline explícita (`<mark>`, `<b>`, `<i>`, `<u>`, etc.) ou background CSS diferenciado (`usouTagInline`), a delimitação respeita estritamente o contêiner inline sem exigir multiplicidade de palavras e sem capturar espaços conectores externos.
  * Adicionado teste de homologação determinístico em `src/cfg/debug.js` (`EXPANSAO_FORMATADA_MARK_ISOLADO`), aprovando 289/289 testes com 100% de sucesso.

### 6.49 Arquitetura Especializada em Classes POO em Diretório Plano Único (`src/mod-copia/`) [IMPLEMENTADO]
- **Diretriz de Design:** Desacoplar o atual arquivo monolítico `SelecionarCopiar.js` em **arquivos `.js` especializados mantidos todos dentro do mesmo diretório plano (`src/mod-copia/`) sem criação de subpastas**, onde cada arquivo instancia e exporta uma classe coesa e dedicada, aplicando as melhores práticas de Programação Orientada a Objetos (SOLID, Single Responsibility, High Cohesion, Encapsulamento estrito com campos privados `#`, métodos imutáveis e objetos selados com `Object.freeze`).
- **Otimização de Nomenclatura para Busca Rápida e Economia de Tokens:**
  * Para evitar nomes excessivamente longos, maximizar a velocidade de busca/indexação do Chrome e minimizar o consumo de tokens de contexto da IA em leituras/prompts, adota-se nomes concisos, intuitivos e padronizados em kebab-case no mesmo diretório:
    * `src/mod-copia/mod-copia.js` -> `class ModuloCopia` (Main / Fachada Orquestradora)
    * `src/mod-copia/copia-estagio1.js` -> `class EstagioUnidadeAtomica` (Estágio 1 — Unidade atômica e tokens)
    * `src/mod-copia/copia-estagio2.js` -> `class EstagioExpressoes` (Estágio 2 — Padrões compostos, maiúsculas e marca-texto `<mark>`)
    * `src/mod-copia/copia-estagio3.js` -> `class EstagioSentencas` (Estágio 3 — Frases, cláusulas e conectivo `:`)
    * `src/mod-copia/copia-estagio4.js` -> `class EstagioDelimitadores` (Estágio 4 — Delimitadores simétricos e aspas)
    * `src/mod-copia/copia-estagio5.js` -> `class EstagioParagrafos` (Estágio 5 — Parágrafo em 3 cliques)
    * `src/mod-copia/copia-estagio6.js` -> `class EstagioTabelas` (Estágio 6 — Linhas/células e acumulador)
    * `src/mod-copia/copia-geometria.js` -> `class GeometriaDOM` (Caret, coordenadas de clique, nós de texto e `Range`)
    * `src/mod-copia/copia-filtros.js` -> `class FiltrosHtml` (5 Níveis Progressivos de Filtros HTML e sanitização)
    * `src/mod-copia/copia-validadores.js` -> `class ValidadoresForenses` (Cálculos de Mod 11/97/10 e Wiki Forense)
    * `src/mod-copia/copia-minutas.js` -> `class PlaceholdersMinutas` (4 modos de seleção de placeholders sem cópia)
    * `src/mod-copia/copia-visual.js` -> `class FeedbackVisual` (Flash verde, polígonos SVG e MiniTips)
- **Papel do Arquivo Main (`mod-copia.js`):**
  * Ponto de entrada único e isolado (`class ModuloCopia`).
  * Constrói o grafo de dependências via injeção nos construtores, escuta eventos nativos do navegador com guardas de unicidade e canaliza chamadas de ponta a ponta sem poluição de escopo global e sem overhead de tokens.

### 6.50 Governança do Fluxo de Trabalho: Fila de Tarefas Obrigatória, Anotar Primeiro e Controle de Prioridades [REGISTRADO EM DIRETRIZ ROOT]
- **Origem e Motivação:** Estabelecer uma salvaguarda inegociável de processo para que o desenvolvimento seja 100% deliberativo, transparente, previsível e seguro, eliminando o risco de implementações precipitadas ou não alinhadas com a arquitetura geral do sistema.
- **Regras do Fluxo Canônico:**
  1. **Entrada Obrigatória em Fila de Backlog:** Toda demanda enviada pelo usuário no chat (novas funcionalidades, alterações de comportamento, correções de bugs, refatorações ou ideias) ingressa compulsoriamente na fila de tarefas deste documento (`docs/03_BACKLOG_TAREFAS_E_FEATURES.md`).
  2. **Proibição Absoluta de Implementação Imediata:** NUNCA IMPLEMENTAR NA MESMA HORA. É estritamente vedado alterar arquivos de código de produção (`src/`, `manifest.json`, etc.) imediatamente ao receber a mensagem do usuário.
  3. **Comportamento Imediato do Agente de IA:**
     - Exibir claramente no chat o que foi compreendido da demanda, detalhando a proposta técnica, arquivos envolvidos, riscos e alternativas;
     - Salvar imediatamente (sem necessidade de confirmação prévia para salvar na documentação) as anotações nos arquivos correspondentes (`docs/03_BACKLOG_TAREFAS_E_FEATURES.md`, etc.), registrando a especificação formal e status de pendência;
     - Aguardar o direcionamento do usuário (caso ele queira alterar, ajustar ou complementar algo antes da implementação).
  4. **Gatilho de Implementação em Código:** Somente quando o usuário enviar expressamente o comando "implementar" (ou gatilho inequívoco de autorização de codificação), o agente executará as alterações no código de produção, testes e validações.
  5. **Controle Dinâmico de Prioridades:**
     - O agente controla e atribui a prioridade técnica de cada pendência (Alta, Média, Baixa) com base em critérios objetivos de engenharia de software (impacto de segurança, riscos de regressão, integridade arquitetural, bloqueios técnicos e ganho operacional);
     - O usuário possui prerrogativa total para solicitar a mudança de prioridade de qualquer tarefa;
     - Sempre que uma prioridade for alterada a pedido do usuário, o agente deve indicar expressamente na tabela de pendências: `[Prioridade Alterada pelo Usuário]`.


### 6.51 Auto-Descrição Padronizada em Arquivos .md para Reúso de Governança e Inteligência em Novos Projetos [IMPLEMENTADO]
- **Origem e Motivação:** Preservar de forma perene a inteligência artificial acumulada, o estilo técnico/organizacional do desenvolvedor, os padrões rigorosos de engenharia (POO, idempotência, silêncio operacional, ausência de dependências inúteis, testes em V8 e formatação tabular) e permitir o reaproveitamento imediato dessa infraestrutura documental em qualquer novo projeto do zero, sem perda de contexto ou retrabalho gerencial.
- **Comportamento Implementado:**
  * **Bloco Padronizado de Auto-Descrição no Topo de Cada `.md`:** Inserido em todos os 16 arquivos de documentação (`docs/*.md`, `README.md`, `.agents/rules/REGRAS_WORKSPACE.md`) um quadro executivo padronizado contendo:
    1. *Identificação e Finalidade Primária:* O que é o arquivo, qual seu escopo técnico e a quem se destina.
    2. *Papel no Ecossistema e Inteligência da IA:* Como a IA deve interpretá-lo para reproduzir o estilo do autor e respeitar as salvaguardas arquiteturais.
    3. *Diretriz de Reúso em Novo Projeto:*
       - *Comando de Ativação:* Ao iniciar um novo projeto, o usuário copia a pasta de documentação e emite comandos como `"vou iniciar um novo projeto do zero etc...".`
       - *Núcleo Perpétuo Reutilizável (DNA do Autor):* Lista das regras universais imutáveis de engenharia e governança (deliberação prévia no backlog, proibição de implementação imediata, tolerância a falhas via Null Object, padrão de testes e backups, comentários exaustivos e UTF-8 nativo).
       - *Seções Específicas de Domínio (A Substituir):* Indicação clara dos tópicos que pertencem exclusivamente ao negócio do sistema atual (ex.: regras do PJe, cálculos de CPF/CNPJ) e que devem ser redefinidos para o novo sistema.
- **Arquivos Cobertos pela Auto-Descrição (16 arquivos auditados):**
  1. `docs/00_INDICE_GERAL.md` (Roteador semântico de contexto)
  2. `docs/01_DIRETRIZES_E_REGRAS_ROOT.md` (Fonte única da verdade de governança)
  3. `docs/02_ARQUITETURA_E_AS_BUILT.md` (Blueprint de engenharia do sistema construído)
  4. `docs/03_BACKLOG_TAREFAS_E_FEATURES.md` (Planejamento, roadmap e sprints)
  5. `docs/04_RADAR_BUGS_E_QUALIDADE.md` (Rastreamento de bugs, boas práticas e melhorias)
  6. `docs/05_DECISOES_ARQUITETURAIS_ADR.md` (Registros formais de decisões de arquitetura)
  7. `docs/06_PLANO_DE_TESTES_E_AUDITORIA.md` (Especificação da suíte de testes e fuzzing)
  8. `docs/07_MANUAL_HOMOLOGACAO_SANDBOX.md` (Manual da Central de Ajuda e Sandbox interativo)
  9. `.agents/rules/REGRAS_WORKSPACE.md` e `docs/AGENTS.md` (Protocolos do agente na IDE)
  10. `docs/CHANGELOG.md` (Histórico cronológico de versões)
  11. `docs/README.md` e `README.md` (Apresentação pública do repositório)
  12. `docs/BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md` (Especificação estendida de reconstrução)
  13. `docs/GEMINI.md` e `docs/DIRETRIZES_DESENVOLVIMENTO_E_REGRAS_ROOT.md` (Documentos satélites de referência)

---


### 6.52 Mapeamento da Pasta Online do Chrome (`Z:\AddonChrome-GovBR.chrome`): Postagem Unidirecional e Soberania do Workspace Dev [REGISTRADO EM DIRETRIZ ROOT]
- **Definição de Papéis e Soberania Inegociável:**
  * O diretório atual de desenvolvimento (`Z:\AddonChrome-GovBR`) é a **FONTE ÚNICA DA VERDADE (Master / Single Source of Truth)**. Ele manda de forma absoluta e soberana.
  * Os arquivos de produção mandatórios são exclusivamente o `manifest.json` e a pasta `src/`.
  * A pasta `Z:\AddonChrome-GovBR.chrome` hospeda a extensão online/ativa carregada no Google Chrome do desenvolvedor e atua estritamente como **ambiente de destino de publicação (Deploy / Postagem)**.
- **Regras Estritas de Sincronização Unidirecional (Push Only):**
  1. *Sentido Único Obrigatório (Dev ➔ Chrome Online):* "Sincronizar" significa exclusivamente **postar/copiar os arquivos de produção deste repositório para `Z:\AddonChrome-GovBR.chrome`**.
  2. *Proibição Inegociável de Fluxo Reverso (Never Pull):* **NUNCA arquivos virão de `Z:\AddonChrome-GovBR.chrome` para o diretório de desenvolvimento**.
  3. *Proteção contra Exclusão Local:* **NUNCA arquivos do diretório de desenvolvimento serão deletados sob a justificativa de não existirem em `Z:\AddonChrome-GovBR.chrome`**. O ambiente de desenvolvimento nunca se subordina ao destino.
  4. *Rollback Local Autônomo:* Caso o usuário solicite "voltar o que era antes", a restauração é feita exclusivamente via repositório Git local ou pelos pacotes versionados de backup em `bkp/`, jamais importando arquivos da pasta do Chrome.
  5. *Gatilho Operacional:* A postagem para `Z:\AddonChrome-GovBR.chrome` ocorre sob comando expresso do usuário (ex.: `"postar no chrome"`, `"sincronizar extensão online"`), sempre com validação prévia de UTF-8 puro sem BOM e 100% de aprovação na suíte de testes.

---

### 6.53 Conclusão da Arquitetura Modular de 4 Grupos com Paridade 1:1 e Suíte V8 (300/300 Testes) [IMPLEMENTADO]
- **Entrega Realizada:**
  * Criação dos diretórios `src/mod-input/` (5 classes) e `src/mod-navegador/` (5 classes) refletindo 1:1 os 4 grupos de opções de `options.html`.
  * Implementação de Null Objects imutáveis para proteção total contra `TypeError`.
  * Injeção da Bateria 11 em `src/cfg/debug.js` e validação de todos os 32 arquivos JS em sintaxe V8.
  * 300 de 300 testes aprovados (100% verde).

---

### 6.54 Saneamento, Higienização e Documentação da Pasta `util/` + Criação de `util/AGENTS.md` (Padrão Oficial Antigravity) [IMPLEMENTADO]
- **Origem e Diagnóstico:**
  * A pasta `util/` acumulou scripts de migração histórica pontual (`ajustar_propriedades.ps1`, `converter_entidades_utf8.ps1`, `enriquecer_catalogo.ps1`, `gerar_exemplos_json.ps1`) e scripts rascunho de depuração (`ver_erros.ps1`). Conforme a Diretriz Root 8, scripts temporários ou de teste avulso devem ser criados em `tmp/` (pasta limpa automaticamente nos backups).
  * Scripts essenciais de rotina precisam ser preservados, fortemente comentados e organizados para economizar tokens de contexto da IA e evitar recriações desnecessárias.
- **Entregas Realizadas:**
  1. **Exclusão dos 6 Scripts Descartáveis / Temporários / Redundantes Concluída:**
     * `util/ver_erros.ps1`: Removido.
     * `util/ajustar_propriedades.ps1`: Removido.
     * `util/converter_entidades_utf8.ps1`: Removido.
     * `util/enriquecer_catalogo.ps1`: Removido.
     * `util/auditar_catalogo.ps1`: Removido.
     * `util/gerar_exemplos_json.ps1`: Removido.
  2. **Enriquecimento com Comentários Exaustivos nos 17 Scripts Mantidos:**
     * Todos os scripts PowerShell, Batch e HTML foram enriquecidos com cabeçalhos estruturados de engenharia (Finalidade, Papel Arquitetural, Quando Usar, Códigos de Saída e Passos de Reconstrução).
  3. **Criação do Índice `util/AGENTS.md` (Padrão Oficial do Google Antigravity):**
     * Índice executivo com bloco de auto-descrição de reúso, catálogo em tabela com comando de linha única, tempo de resposta e regras estritas de higiene de pasta temporária (`tmp/`).
- **Validação de Qualidade:** 65 arquivos auditados em UTF-8 nativo estrito sem BOM e 300/300 testes aprovados no Chromium Headless V8.

---

### 6.55 Otimização do Editor HTML Online no SandBox: Padronização Tipográfica e Novo Texto Padrão [IMPLEMENTADO]
- **Origem e Diagnóstico:**
  * No bloco "Editor HTML Online (contenteditable)" da aba Laboratório SandBox (`options.html`), o texto padrão anterior continha tags aninhadas `<span style="font-size:16px;"><span style="font-family:arial,helvetica,sans-serif;">` que causavam despadronização de tamanho (16px vs 13.5px) e quebra de tipografia com relação aos demais parágrafos.
  * O usuário solicitou a padronização integral da fonte e tamanho para 100% do conteúdo do editor, além da atualização para um novo texto padrão estruturado com marcadores forenses e estilos específicos.
- **Especificação Técnica do Novo Texto Padrão:**
  * **Parágrafo 1:** `Trata-se de ação monitória proposta pela Caixa Econômica Federal contra <b>@@Autor@@</b>, visando a cobrança de débito oriundo de operação de Empréstimo Consignado, contratos nº ##### e #####.`
  * **Parágrafo 2:** `Nome do réu <b>##Réu##</b>, telefone <u>(##)####-####</u>, manifesta-se nos autos conforme id ####### e id ###### fl. ##. Em síntese, na data <i>##/##/20##</i> manifesta-se que <u><i>[@@ato@@]</i></u>, postulando o valor de R$ <u>##.###,##</u>.`
  * **Parágrafo 3:** `operação de Empréstimo Consignado, contratos nº ##### e #####.`
  * **Parágrafo 4:** `[##TEXTO DA DECISÃO##]`
- **Mapeamento de Formatos Padrão Aplicados:**
  * `(##)####-####`: sublinhado (`<u>(##)####-####</u>`).
  * `@@Autor@@`: negrito (`<b>@@Autor@@</b>`).
  * `##Réu##`: negrito (`<b>##Réu##</b>`).
  * `##/##/20##`: itálico (`<i>##/##/20##</i>`).
  * `##.###,##`: sublinhado (`<u>##.###,##</u>`).
  * `[@@ato@@]`: itálico + sublinhado (`<u><i>[@@ato@@]</i></u>`).
- **Arquivos Implementados e Validados:**
  1. `src/cfg/options.html`: Conteúdo inicial de `id="editorHtmlOnlineDemo"` atualizado com os 4 novos parágrafos e remoção integral de spans com inline styles de fonte.
  2. `src/cfg/editor_demo.js`: Constante `TEXTO_PADRAO_EDITOR_HTML` sincronizada para restauração padrão idêntica via botão "Restaurar Texto Padrão".
  3. `src/cfg/debug.js`: Bateria 6 (`PLACEHOLDERS_MINUTA_EXTENSA_E_TELEFONE`) sincronizada com os novos marcadores forenses e aprovada com 300/300 testes no Chromium Headless V8.
- **Validação de Qualidade:** 100% dos testes aprovados e conformidade tipográfica restabelecida.

---

### 6.56 Salvaguarda de Não-Baixa Prematura de Pendências e Persistência de Perguntas Finalizadoras com Indexação [REGISTRADO EM DIRETRIZ ROOT]
- **Origem e Diagnóstico:**
  * Solicitação do usuário para blindar a governança de engenharia contra perdas de contexto ou marcação indevida/precoce de pendências como implementadas quando ainda estão em fase de proposta, planejamento ou anotação.
  * Necessidade de rastrear de forma persistente todas as perguntas finalizadoras (pedidos de confirmação ou decisões de escopo) que permaneçam sem resposta quando o usuário direciona a conversa para outros tópicos.
- **Especificações e Regras Instituídas:**
  1. **Proibição Inegociável de "Dar Baixa" Prematura (Diretriz Root 1):**
     * Nenhuma tarefa, recurso, pendência ou item do backlog pode ser marcado como `[IMPLEMENTADO]`, `[RESOLVIDO]` ou `[CONCLUÍDO]` nos arquivos Markdown (`.md`) enquanto as alterações de código, templates, estilos e testes não tiverem sido **efetivamente praticadas, commitadas no Git e homologadas**.
     * Tarefas em anotação ou aguardando resposta do usuário permanecem rigorosamente como `[ANOTADO NO BACKLOG]` ou `[PENDENTE]`.
  2. **Persistência Compulsória de Perguntas Finalizadoras com Indexação (Diretriz Root 1 e 13):**
     * Chamadas de confirmação não respondidas são salvas compulsória e imediatamente na subseção `### ❓ Fila de Perguntas Finalizadoras e Confirmações Pendentes de Resposta`.
     * Todas as respostas canônicas da IA devem exibir a tabela `❓ Perguntas e Confirmações Pendentes de Resposta`.
     * Cada item contém obrigatoriamente um link nativo clicável no formato `[Ir para Pergunta Original](conversation://<conversation-id>)`, permitindo navegação instantânea para o diálogo original no chat.
- **Arquivos Atualizados:**
  1. `docs/01_DIRETRIZES_E_REGRAS_ROOT.md`: Diretriz Root 1 (cláusulas de não-baixa prematura e rastreamento de perguntas) e Diretriz Root 13 (tabela canônica de perguntas no padrão visual de respostas).
  2. `docs/03_BACKLOG_TAREFAS_E_FEATURES.md`: Seção 6.56 e subseção de perguntas finalizadoras pendentes no topo do backlog.
- **Status:** **REGISTRADO EM DIRETRIZ ROOT E OPERACIONALIZADO**.

---

### 6.57 Correção de Falso Positivo em `validarNumeroGenericoFallback` (BUG-05: Rejeição de Alfanuméricos e Números Curtos em Mod10) [IMPLEMENTADO]
- **Origem e Diagnóstico:**
  * Relato de bug pelo usuário demonstrando o surgimento de popup `[Mod10]: RTL2832U ✓` ao clicar ou selecionar o modelo de dongle USB `RTL2832U`.
  * Causa-raiz: O método `validarNumeroGenericoFallback` limpava letras indiscriminadamente (`replace(/\D/g, '')`) e executava a congruência de Luhn (Mod10) em qualquer sequência com `n >= 4`. Como a sequência `2832` possui soma de Luhn = 20 (`20 % 10 === 0`), o motor aprovava a validação indevidamente e exibia a string com letras como um número Mod10 validado. Além disso, 10% de qualquer número aleatório de 4 dígitos passava falsamente no Mod10.
- **Solução Técnica Implementada (`src/mod-copia/AvisoFlutuante.js`):**
  1. **Rejeição Imediata de Letras:** Qualquer texto que contenha caracteres alfabéticos é descartado no Passo 1 com silêncio absoluto, exceto se atender estritamente aos requisitos do CNPJ Alfanumérico da RFB (14 caracteres alfanuméricos terminando com 2 dígitos numéricos).
  2. **Validação de Sintaxe Numérica:** Textos sem letras só são processados se compostos exclusivamente por dígitos e pontuação padrão (`[0-9\s./-]`).
  3. **Restrição Rigorosa do Mod10 (Luhn):**
     * Com hífen separador de DV (`-X`): permitido a partir de 4 dígitos (`12345-6`).
     * Sequências puras sem hífen: restritas estritamente a blocos de boletos (10 ou 11 dígitos) e cartões de crédito (13 a 19 dígitos). Números curtos como `2832`, anos (`2026`) ou ramais jamais são avaliados em Mod10.
  4. **Restrição do Mod11 com Pesos 2..9:** Sequências puras sem hífen só ativam para documentos reais brasileiros (9 a 14 dígitos: RENAVAM, NB, CPF, PIS, CNH, CNPJ).
- **Validação de Testes:** Inclusão de asserções determinísticas em `src/cfg/debug.js` cobrindo `RTL2832U` e `2832`, elevando a suíte para **302/302 testes 100% aprovados**.
- **Status:** **IMPLEMENTADO E TESTADO**.

---

### 6.58 Princípio Soberano da Fila de Pendências como Única Origem de Implementação [REGISTRADO EM DIRETRIZ ROOT]
- **Origem e Fundamentação:**
  * Determinação expressa do usuário: *"Lembre se de que tudo o que eu te pedir irá pra lista de pendências ok? E só da lista de pendências iremos "implementar". Salve este comportamento! Diretiva!"*
- **Regras Operacionais Vinculantes:**
  1. **Fila Compulsória de Entrada:** Toda e qualquer solicitação, nova funcionalidade, alteração técnica, ajuste visual ou relato de bug ingressa compulsoriamente como item de pendência no Backlog (`docs/03_BACKLOG_TAREFAS_E_FEATURES.md`).
  2. **Funil Único de Execução:** Nenhuma implementação em código-fonte de produção (`src/`, `manifest.json`, etc.) é realizada de forma direta ou imediata a partir de pedidos avulsos no chat. A implementação só é executada a partir de tarefas já cadastradas na lista de pendências e mediante comando expresso de execução ("implementar" ou "implementar item X").
  3. **Persistência Imediata de Diretrizes de Governança:** Diretrizes de governança, anotações de fluxo de trabalho e regras operacionais nos arquivos Markdown (`docs/`) são salvas e persistidas imediatamente, assegurando a blindagem de contexto do assistente e a perenidade das regras do autor.
- **Status:** **REGISTRADO EM DIRETRIZ ROOT (Diretriz Root 1)**.

---

### 6.59 Correção de Expansão de Sequências Numéricas Espaçadas Genéricas (BUG-06) [PENDENTE]
- **Origem e Diagnóstico:**
  * Solicitação do usuário acompanhada de evidência no Sandbox: dar dois cliques sobre a numeração `215 7014 6992 8831` ou clicar sobre o espaço intermediário não seleciona todo o bloco com números separados por espaço. O comportamento funciona para máscaras rígidas ("Chave NF-e", "Boleto FEBRABAN" e "Boleto Concessionária"), mas falha para blocos numéricos genéricos.
  * Causa-Raiz: A expressão `MULTIPLOS_NUMEROS_ESPACADOS` foi declarada em `ConstantesPadroes.js`, porém não foi associada ao array ativo `CATALOGO_PADROES_JURIDICOS` dentro do grupo `CHAVES_FISCAIS_E_BOLETOS_ESPACADOS` com a flag `exigeEspacoOuDuploClique: true`. Como resultado, os estágios de expansão contextual não reconhecem a cadeia numérica espaçada genérica como um padrão composto agregável.
- **Plano de Implementação Técnica (`src/mod-copia/ConstantesPadroes.js` e `SelecionarCopiar.js`):**
  1. Inserir a regra de múltiplos números espaçados em `CATALOGO_PADROES_JURIDICOS` com `exigeEspacoOuDuploClique: true` e `suportaFiltroShiftDigitos: true`.
  2. Blindar contra falsos positivos com números de telefone de formato padrão `(##) ####-####` ou `(##) #####-####` para assegurar que números telefônicos continuem sendo tratados com suas regras próprias.
  3. Validar nos métodos `simularCliqueEmTexto` e nos listeners do DOM (`click` e `dblclick`) para garantir que 1 clique isolado selecione apenas a palavra/bloco numérico sob o cursor (ex: `215`), enquanto o duplo clique ou clique em espaço capture a cadeia completa (`215 7014 6992 8831`).
  4. Adicionar asserções determinísticas de teste na Bateria 1 de `src/cfg/debug.js`.
- **Prioridade Técnica:** **Alta** (resolução de inconsistência funcional com a especificação explícita do Sandbox).
- **Status:** **PENDENTE (Aguardando comando expresso `implementar`)**.

---

### 6.60 Máscaras e Validação Algorítmica de Guias e Tributos Governamentais (DARF, GRU, IPTU / Arrecadação FEBRABAN Segmentos 1 e 5) [PENDENTE]
- **Origem e Requisitos:**
  * Solicitação do usuário: Adicionar máscaras de boletos de pagamentos para o governo, como **DARF** (Receita Federal), **GRU** (Guia de Recolhimento da União) e **IPTU** (Tributos Municipais), realizando se possível a validação algorítmica de seus números.
- **Especificação Técnica de Domínio:**
  1. **Linhas Digitáveis de Arrecadação e Tributos Governamentais (Padrão FEBRABAN):**
     * Estrutura de 48 dígitos dividida em 4 campos de 11 dígitos acompanhados de 1 dígito verificador (DV) por campo: `XXXXXXXXXXX-D XXXXXXXXXXX-D XXXXXXXXXXX-D XXXXXXXXXXX-D`.
     * Começam compulsoriamente com o dígito `8` (arrecadação).
     * O 2º dígito identifica o segmento favorecido:
       - `1` = Prefeituras / IPTU / ISS / Taxas Municipais;
       - `5` = Órgãos Governamentais Federais / Estaduais / DARF / GRU Simples;
       - `6` ou `7` = Demais arrecadações governamentais e carnês.
     * O 3º dígito determina o módulo matemático para cálculo do DV:
       - Se `6` ou `7`: Módulo 10 (Luhn);
       - Se `8` ou `9`: Módulo 11 (pesos 2..9).
  2. **Validação Algorítmica em `AvisoFlutuante.js`:**
     * Integrar no validador a verificação algorítmica dos 4 DVs de bloco e do DV geral da linha digitável de 48 dígitos.
     * Exibir balão informativo contextual: `[Boleto Tributo/IPTU/GRU/DARF]: 816... ✓` em caso de aprovação, ou alerta âmbar em caso de divergência matemática de DV.
  3. **GRU Cobrança Bancária (Banco do Brasil):**
     * Guias emitidas na modalidade cobrança bancária tradicional (iniciadas em `0019...`, 47 dígitos) continuam validadas pela regra de Boleto Bancário FEBRABAN, exibindo a identificação específica de `[GRU Cobrança]`.
  4. **Atualização no SandBox (`options.html` e `exemplos.js`):**
     * Incluir casos de teste e exemplos reais no Bloco 2 de amostras forenses do Sandbox.
- **Prioridade Técnica:** **Média** (expansão da capacidade de detecção fiscal/tributária para órgãos públicos e execuções fiscais).
- **Status:** **PENDENTE (Aguardando comando expresso `implementar`)**.

---

### 6.61 Princípio da Soberania Documental em docs/ e Replicação Unidirecional para a Raiz [REGISTRADO EM DIRETRIZ ROOT]
- **Origem da Demanda:** Usuário em 06/11/2026.
- **Descrição da Regra:**
  * Todos os arquivos Markdown (`.md`) de governança, apresentação e instrução são gerados, editados e mantidos primeiramente dentro da pasta `docs/` como fonte única da verdade (Single Source of Truth).
  * Qualquer arquivo `.md` que necessite residir fora de `docs/` (como `README.md` na raiz para o GitHub) deve seguir a lógica invertida: é gerado/atualizado primeiro em `docs/` (`docs/README.md`) e em seguida replicado/sincronizado unidirecionalmente para a raiz do repositório (`README.md`).
  * **Objetivo de Salvaguarda:** Garantir que, se arquivos forem acidentalmente apagados, sobrescritos ou corrompidos fora de `docs/`, o patrimônio documental e o conhecimento em `docs/` permaneçam 100% íntegros e possam ser imediatamente restaurados.
- **Status:** **REGISTRADO EM DIRETRIZ ROOT (Diretriz Root 10 / Docs-as-Code)**.

---

### 6.62 Correção da Desseleção ao Pressionar Shift (Preservação da Seleção para Extensão por Teclado e Clique) (BUG-07) [IMPLEMENTADO E COBERTO POR TESTES]
- **Origem da Demanda:** Usuário em 06/11/2026 ("corrigir imediatamente: ao pressionar shift a seleção é desfeita. Não de-selecionar com esta tecla, assim será permitido 'continuar ou extender' a seleção atual para cima ou para baixo").
- **Causa-Raiz:** Invocação legada de `sel.removeAllRanges()` em `aoPressionarTecla` (`e.key === 'Shift'`) e em `tratarMouseDownGlobal` (`e.shiftKey && !ancoraCursorShift`), destruindo qualquer seleção ativa assim que a tecla Shift era pressionada.
- **Solução Implementada:**
  1. Extinção da chamada a `sel.removeAllRanges()` no evento `keydown` do Shift;
  2. Preservação imediata da seleção ativa e armazenamento de sua âncora (`anchorNode`, `anchorOffset`) em `ancoraCursorShift`, viabilizando extensão fluida tanto via teclado (`Shift + Setas`) quanto via mouse (`Shift + Clique`);
  3. Adição de teste determinístico na Bateria 19 de `src/cfg/debug.js` (`PRESERVACAO_SELECAO_TECLA_SHIFT`), elevando a suíte para 450/450 testes 100% aprovados.
- **Status:** **IMPLEMENTADO E COBERTO POR TESTES (450/450 Aprovados)**.

---

### 6.63 Controle Interno do Histórico de Clipboard (Penúltimo Buffer via Ctrl + Clique e Substituição do Win+V) [PENDENTE]
- **Origem da Demanda:** Usuário em 06/11/2026: *"anotar: 'Com Ctrl + botão do meio, envia ao sistema as teclas Win+V para abrir o histórico da área de transferência do Windows (se habilitado no sistema).' não está funcinando, então preciso que controle 'por dentro' o clipboard. Assim como botão direito cola o clipboard interno, control+botão direito colaria o penultimo clipboard interno (mantendo o ultimo caso fosse clicado com o botão do meio novamente)."*
- **Diagnóstico Técnico:**
  1. *Limitação do Sandbox do Navegador:* As extensões Chrome/Chromium não possuem permissão de hardware/SO para sintetizar atalhos de teclado globais de sistema operacional (como a tecla `Windows` / `Meta` combinada com `V`). A tentativa legada de envio de mensagem de background para disparar `Win+V` é ineficaz na sandbox.
  2. *Texto de Ajuda / UI Obsoleto:* Em `src/cfg/options.html`, a descrição do botão do meio ainda promete a abertura do histórico nativo `Win+V`, o que gera expectativa inverídica de comportamento do SO.
- **Especificação da Solução Interna de 2 Níveis:**
  1. *Gestão de Pilha Interna em Memória / Storage:*
     * Manter dois slots de buffer interno:
       - Buffer 1 (Último): `window.__JUSGOV_ULTIMO_CLIPBOARD__` (conteúdo mais recente copiado).
       - Buffer 2 (Penúltimo): `window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__` (conteúdo imediatamente anterior).
     * Sincronização persistente via `chrome.storage.local` (`ultimoClipboardInterno` e `penultimoClipboardInterno`) para garantir paridade entre abas e janelas.
  2. *Regra de Inserção via Clique do Mouse:*
     * *Clique Simples (Botão do Meio ou Botão Direito se configurado para colar):* Insere no cursor o conteúdo do **Último Clipboard** (`window.__JUSGOV_ULTIMO_CLIPBOARD__`).
     * *Ctrl + Clique (Ctrl + Botão do Meio ou Ctrl + Botão Direito):* Insere no cursor o conteúdo do **Penúltimo Clipboard** (`window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__`).
     * *Regra de Preservação Imutável:* Ao colar o penúltimo conteúdo com `Ctrl + Clique`, o buffer do último conteúdo **NÃO** deve ser alterado nem rotacionado. Se o usuário clicar em seguida apenas com o botão simples (meio ou direito), o último conteúdo continua intacto e pronto para colagem sucessiva.
  3. *Atualização de UI e Textos:*
     * Atualizar a descrição em `src/cfg/options.html` (e tooltips associadas), substituindo a promessa de envio de `Win+V` pela explicação fidedigna: *"Clique do meio cola a última seleção copiada; Ctrl + clique do meio cola a penúltima seleção copiada, mantendo a última preservada na memória."*
- **Status:** **PENDENTE (Salvo silenciosamente na fila de pendências)**.

---

### 6.19 Status de Implementacao (2026-10-30) e Historico de Entregas
* **Implementado e coberto por auditoria (182/182 testes):**
  * **Performance e Eliminação de Lentidão (Idempotência O(1) e Debounce de Injeção):**
    * Guardas de idempotência imediatas (`__JUSGOV_*_CARREGADO__` / `__JUSGOV_MOTOR_SELECAO_ATIVO__`) em `ConstantesPadroes.js`, `AvisoFlutuante.js`, `AcumuladorCopia.js` e `SelecionarCopiar.js`, impedindo recompilação repetitiva de dezenas de Regex e recriação de listeners DOM.
    * Remoção do registro dinâmico redundante em `background.js` e substituição da tempestade tripla de `executeScript` (`0ms / 250ms / 800ms`) por `agendarInjecaoSeguraNaAba` com debounce de `350ms` por aba.
    * Otimização de hot-paths DOM: `getComputedStyle` limitado à profundidade máxima de 6 níveis após checagens rápidas de tags/atributos; `caretRangeFromPoint` em O(1) antes de varredura de caracteres; eliminação de `querySelectorAll('*')` no `Escape`; neutralização de toasts/backdrops órfãos do PJe em `PJE-anti_ampuletas.css`.
  * **Separação Formal entre Seleção e Cópia (`aplicarSelecaoDOM` vs `executarCopiaDeSelecao`):**
    * Módulo de Seleção (`aplicarSelecaoDOM`) aplica o range, calcula e desenha o Flash Verde e decide a retenção ou limpeza imediata da seleção no DOM.
    * Módulo de Cópia (`executarCopiaDeSelecao`) sanitiza, formata, grava no clipboard do sistema e atualiza o clipboard simulado interno com backup.
  * **Distinção Refinada entre Áreas de Interface (UI) e Áreas de Texto/Leitura/PDF (`isAreaLeituraOuPdfConteudo`, `isTelaSistemaEstritaParaDesselecao`, `deveManterSelecaoAtivaNoDom`):**
    * Áreas de Leitura e camadas de conteúdo de PDF (`.textLayer`, `.pdfViewer`, `.page[data-page-number]`, `#viewerContainer`, exceto barras de ferramentas `.toolbar`, `#toolbarViewer`, `#toolbarContainer`) mantêm a seleção ativa no DOM após a cópia.
    * Áreas de Interface/Sistema (modais, diálogos, botões, links, menus, `.pje-etiquetas`, toolbar de PDF) removem imediatamente a seleção (`removeAllRanges()`) após copiar, mantendo o Flash Verde; arrastes curtos acidentais (`< 5` caracteres) sem `Alt` em UI estrita são ignorados; `Alt + Clique` prioriza blocos forenses antes do texto integral do controle.
  * **Simulação de Clipboard com Backup Anterior (`Botão do Meio` e `Ctrl + Botão do Meio`):**
    * Após gravar no clipboard do sistema, `salvarClipboardInternoComBackup` salva com `try/catch` e trava de 512KB o item anterior em `window.__JUSGOV_ULTIMO_CLIPBOARD_ANTERIOR__` e o novo em `window.__JUSGOV_ULTIMO_CLIPBOARD__`.
    * Clique com o Botão do Meio cola o clipboard simulado atual; `Ctrl + Botão do Meio` cola diretamente o clipboard simulado anterior (sem alterar o clipboard principal).
  * Painel "Ultima Selecao" (substitui "Conteudo atual da Area de Transferencia"), sem leitura de clipboard e sem alertas de permissao.
  * "Ato INSS" generalizado para "Ato Adm" (testes com orgaos de 3 niveis e numericos ##/##/###/###).
  * Auto-copia de selecao ainda nao copiada (assinatura offsets+texto liberada ao desfazer a selecao, mesmo com mouse pressionado; rede de seguranca no mouseup).
  * Regra de bloco do ":" (clique no espaco apos ":" seleciona a sentenca inteira).
  * Contorno flash sem sobreposicao: so retangulos de texto, fusao por linha e um poligono unico em varias linhas.
  * **Guarda de Unicidade e Eliminação de Sobreposição Multi-Frame (Itens 1, 2 e 3):**
    * Isolamento estrito de subframes em `observarFramesDinamicos`: subframes com motor ativo (`__JUSGOV_MOTOR_SELECAO_ATIVO__`) não recebem listeners concorrentes do frame pai.
    * Mutex reativo global entre frames (`__JUSGOV_MUTEX_SELECAO_GLOBAL__`) e detecção de foco em `<iframe>` em `tratarMudancaSelecaoGlobal`.
    * Limpeza atômica profunda de contêineres de flash (`limparFlashBorderImediatamente`) em `document` e `window.top`, impedindo sobreposição e caixas fantasmas.
    * Ajuste de debounce e cancelamento de timers de `selectionchange` em cópias internas (`selecaoSendoAplicadaPeloAddon = true`).
  * **Condicionamento de Seleção em Não-Editáveis por Tempo de Flash/Box (Seção 6.22):**
    * Com Flash ativo (`tempoFlashBorderMs > 0`), aplica o Box visual e desseleciona do sistema (`removeAllRanges()`), eliminando concorrência visual com o destaque azul nativo.
    * Com Flash desativado (`tempoFlashBorderMs = 0`), preserva a seleção normal nativa do sistema.
* **Pendente (Salvo na fila para implementação futura):**
  * **Seleção de Texto de Leitura em PDF Embedded e Exceção da Interface do PDF (`viewer-toolbar` / `#toolbar` / `input#pageSelector`) (Seção 6.32):** Permitir seleção/cópia do texto de leitura em PDFs embarcados (`<pdf-viewer>`, `<embed type="application/x-google-chrome-pdf">`, `#content`/`#scroller`, `.textLayer`), mantendo toda a barra de ferramentas do PDF (`viewer-toolbar`, `div#toolbar`, `cr-icon-button`, `viewer-page-selector`, `input#pageSelector`, `#sidenav-container`) sob as regras estritas de interface/campo editável.
  * **Desacoplamento Físico em Módulos e POO Blindada (Seção 6.13 / Diretriz Root 11 / BP-01):** Isolar fisicamente em arquivos separados o Módulo de Seleção/Cópia Inteligente e o Módulo de Mudança de Interface/UI (Mouse 4/5, Scroll Click, Teclado, Auto-seleção de Inputs), aplicando encapsulamento POO com API pública congelada (`Object.freeze`).
  * **Barramento de Eventos Desacoplado (BP-02):** Comunicação intermodular via `CustomEvent` (`jusgovbr:*`) sem dependência direta entre arquivos.
  * **Identificação Única de Componentes (`Ctrl + Alt + Shift + Clique`) e Mapeamento Manual Avançado XPath/CSS (Seção 6.20):** Grupo recolhido em Configurações Avançadas para cadastrar regras locais (Textual, Interface ou Semiflexível) com exportação/importação JSON.
  * **Higienização de Handlers Globais em Subframes via `AbortController` (BUG-01):** Teardown determinístico no descarregamento de iframes dinâmicos.
* **Implementado no Ciclo Atual (243/243 testes aprovados):**
  * **Detecção Hierárquica de Editores (`pai`/`avô`/`ancestral` `contenteditable="true"`) e Exceção de Interface CKEditor (`cke_*` / `cke_*editor`) (Seção 6.31) [IMPLEMENTADO]:** Verificação do elemento clicado, pai, avô e cadeia ancestral até `ownerDocument.body` para `contenteditable="true"` / `.cke_editable`, auto-seleção de placeholders longos/complexos (`@@@@INSTITUTO...; @@@` e `#####`) e exclusão estrita da interface CKEditor (`cke_*`, `cke_*editor`).
  * **Fechamento Imediato de Popups de Auditoria e Mensagens Wiki Forense (Seção 6.30) [IMPLEMENTADO]:** Popups de checagem/auditoria (cálculo Mod 11/97 falhou, CPF/CNPJ/CNJ/NB/Data inválido e máscara amarela) e mensagens de instrução Wiki Forense (tipo de aposentadoria/benefício INSS, região fiscal do CPF, Matriz/Filial CNPJ, ramo CNJ, dia da semana) fecham imediatamente ao clicar com o mouse (`mousedown`), desselecionar o texto, pressionar `Escape`/`Enter`, rolar a página ou perder foco, acompanhando o comportamento do Flash Temporizado.
  * **Seleção Integral Multilinhas de Links com `Alt + 3 Cliques` (Seção 6.28) [IMPLEMENTADO]:** Ao dar `Alt + 3 cliques` sobre um link (`<a>` ou `[role="link"]`), seleciona todo o texto visível do link (mesmo que ocupe duas ou mais linhas, possua `<br>`, múltiplos blocos ou `> 120` caracteres), unificando tudo em uma única linha separada por espaços simples (`extrairTextoLinkUmaLinha`).
  * **Refinamento do CSS Anti-Ampulhetas em Operações em Lote (Seção 6.21) [IMPLEMENTADO]:** Preservação de barras de progresso e modais de assinatura/movimentação em lote (`mpProgresso`, `pje-assinatura-lote`, `mat-progress-bar`, `p-progressbar`, `.rich-progress-bar`, `[role="progressbar"]`).
  * **Destruição Imediata do Flash em Modais Críticos (BUG-02) [IMPLEMENTADO]:** Garantia de `pointer-events: none !important` e destruição atômica imediata em `Enter`, `Escape` e em modais/diálogos críticos (`[role="dialog"]`, `[role="alertdialog"]`, `.modal`, `.rich-modalpanel`).
  * **Catálogo Hierárquico Append-Only (`src/cfg/exemplos.txt` e `src/cfg/exemplos.js` — Seção 6.29) [IMPLEMENTADO]:** 8 casos de uso e 15 máscaras cobrindo todos os exemplos de `options.html` + adicionais positivos e negativos, validados em `src/cfg/debug.js`.
