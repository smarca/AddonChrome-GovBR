# DIRETRIZES PERPETUAS DE ENGENHARIA, LOGS E REGRAS RIGIDAS ROOT - JUSGOVBR
Projeto: JusGovBR - Copia Inteligente & PJe Turbo (Manifest V3 - Chromium 116+)
Autor / Contato: smarca@gmail.com
Finalidade: Fonte única da verdade (Single Source of Truth) para diretrizes arquiteturais, salvaguardas de governança e regras root inegociáveis.

> [!NOTE]
> ### 🧭 AUTO-DESCRIÇÃO E DIRETRIZ DE REÚSO PARA NOVOS PROJETOS
> - **Identificação do Arquivo:** `docs/01_DIRETRIZES_E_REGRAS_ROOT.md`
> - **Finalidade Primária:** Fonte única da verdade (Single Source of Truth) para as 16 Diretrizes de Engenharia e Regras Rígidas Root.
> - **Papel na Governança e Inteligência da IA:** Constituição inegociável do projeto. Define a conduta da IA: deliberação prévia em backlog, proibição de implementar na mesma hora, comentários exaustivos, UTF-8 sem BOM, proibição de entidades HTML, tabelas Markdown estritas e resiliência via Null Object Pattern.
> - **Reaproveitamento em Novos Projetos:**
>   - *Comando de Ativação:* Ao iniciar outro projeto, declare: `"vou iniciar um novo projeto do zero..."`.
>   - *Núcleo Perpétuo Reutilizável (DNA do Autor):* Toda a Seção 1 (Diretrizes 1 a 16), fluxo deliberativo, matriz de prioridades, convenções de código, backups e testes em V8.
>   - *Seções Específicas de Domínio (A Adaptar):* Seção 2 (Regras de Negócio específicas do produto anterior, como tribunais e fórmulas jurídicas).

Documentos Complementares:
- [02_ARQUITETURA_E_AS_BUILT.md](02_ARQUITETURA_E_AS_BUILT.md) (Especificação técnica do sistema construído)
- [03_BACKLOG_TAREFAS_E_FEATURES.md](03_BACKLOG_TAREFAS_E_FEATURES.md) (Planejamento, roadmap e pendências)
- [04_RADAR_BUGS_E_QUALIDADE.md](04_RADAR_BUGS_E_QUALIDADE.md) (Radar de bugs, boas práticas e melhorias)
- [05_DECISOES_ARQUITETURAIS_ADR.md](05_DECISOES_ARQUITETURAIS_ADR.md) (Registros de decisões de arquitetura)
- [06_PLANO_DE_TESTES_E_AUDITORIA.md](06_PLANO_DE_TESTES_E_AUDITORIA.md) (Suíte de 290 testes e fuzzing)
- [07_MANUAL_HOMOLOGACAO_SANDBOX.md](07_MANUAL_HOMOLOGACAO_SANDBOX.md) (Manual da Central de Ajuda e Sandbox)
- [CHANGELOG.md](CHANGELOG.md) (Histórico cronológico de versões)

---

## 1. DIRETRIZES ROOT DE ENGENHARIA DE CODIGO

1. Fluxo Obrigatório de Engenharia: Anotar Primeiro no Backlog -> Exibir Entendimento -> Implementar sob Comando Expresso:
   - **Princípio Soberano da Fila de Pendências como Única Origem de Implementação (Funil Único de Execução):**
     * **Tudo o que o Usuário Pedir vai Compulsoriamente para a Lista de Pendências:** Toda e qualquer solicitação, ideia, nova funcionalidade, relato de bug, melhoria ou alteração enviada pelo usuário no chat deve obrigatoriamente entrar na fila de coisas a fazer (Backlog de Tarefas em `docs/03_BACKLOG_TAREFAS_E_FEATURES.md`). Nenhuma demanda escapa desta anotação prévia.
     * **SÓ da Lista de Pendências Iremos "Implementar":** É terminantemente vedado implementar qualquer alteração fora da fila. O código de produção só é modificado a partir de itens formalmente cadastrados no Backlog de Pendências e mediante ordem inequívoca de execução.
   - **Proibição Inegociável de Implementação Imediata (Fila Compulsória de Pendências):** NUNCA IMPLEMENTAR NA MESMA HORA. Ao receber qualquer solicitação, relato de bug, ideia ou melhoria no prompt, a IA deve compulsoriamente **anotar nas pendências (salvando silenciosamente na documentação sem precisar pedir confirmação)** e deixar o item na fila. É terminantemente proibido alterar código de produção (`src/`, `manifest.json`, etc.) de imediato, exceto quando o comando do usuário explicitamente ordenar execução imediata (ex.: *"implementar"*, *"corrigir imediatamente"*, *"faça agora"*).
   - **Comportamento Imediato do Agente:** Ao receber uma solicitação, o agente deve:
     (a) Exibir no chat, com máxima clareza e objetividade, o que compreendeu que deve ser implementado, apresentando a proposta técnica, os impactos arquiteturais e o plano de ação;
     (b) Salvar imediatamente e de forma silenciosa (sem necessidade de confirmação prévia) a anotação nos devidos arquivos (`docs/03_BACKLOG_TAREFAS_E_FEATURES.md`, etc.), registrando a tarefa na fila com sua especificação completa;
     (c) Aguardar o direcionamento do usuário (caso ele queira alterar, ajustar ou complementar algo antes da implementação).
   - **Gatilho Único de Execução e Interpretação Flexível de Comandos:**
     * Apenas quando o usuário enviar expressamente a ordem de implementação (ou ordem expressa de correção imediata), aí sim as alterações de código e testes são executadas. Do resto, tudo permanece estritamente na fila de pendências. O fluxo permanente é rigorosamente: **Anotar primeiro silenciosamente para depois implementar**.
     * **Sintaxe Universal de Comandos de Execução:**
       - `implementar`: executa automaticamente a tarefa no topo das prioridades da tabela (o item `#1`);
       - `implementar #X` (ex.: `implementar #3`): executa especificamente o item de índice `#X` da tabela de pendências;
       - `implementar <ID/Seção/BUG>` (ex.: `implementar BUG-06`, `implementar Seção 6.59`, `implementar bug 33`): executa diretamente a tarefa pelo identificador de seção ou código do bug informado;
       - `implementar tudo` ou `implementar #1 e #2`: executa os itens indicados em lote.
   - **Proibição Inegociável de "Dar Baixa" Prematura em Pendências:**
     * É estritamente vedado marcar qualquer tarefa, recurso, pendência ou item do backlog como `[IMPLEMENTADO]`, `[RESOLVIDO]` ou `[CONCLUÍDO]` nos arquivos Markdown (`.md`) enquanto as alterações de código, templates, estilos e suíte de testes não tiverem sido **efetivamente praticadas, commitadas no Git e homologadas com 100% de sucesso**. Tarefas em fase de análise, anotação ou aguardando confirmação do usuário devem permanecer rigorosamente com status `[ANOTADO NO BACKLOG]` ou `[PENDENTE]`.
   - **Regra de Auto-Aceite ("Accept All" Compulsório Permanente) e Confirmação Automática de Arquivos:**
     * Sempre adotar "Accept All" tácito e automático nas edições: toda e qualquer alteração realizada pela IA em arquivos deve ser tacitamente confirmada e aceita, sendo **terminantemente vedado exigir ou pedir ao usuário confirmação para aceitar ou forçá-lo a clicar em "Accept all" na interface**. As diretivas da IDE (`antigravity.autoAcceptOnChat: true`, `antigravity.ai.autoAcceptChanges: true`, `antigravity.autoAcceptEdits: true`, `chat.editing.alwaysSaveWithGeneratedChanges: true`, `chat.editing.autoAcceptDelay: 0`) devem estar ativas permanentemente para garantir gravação e aceitação instantâneas.
     * **Não Abrir Arquivos "para Conferência":** O agente e os scripts não devem abrir abas no editor para mera conferência visual. Arquivos alterados em implementações devem ser dispensados da área de edição ativa através de limites rígidos de abas e modo preview (`enablePreview: true` e `workbench.editor.limit.value: 3`), prevenindo acúmulo e poluição da área de trabalho do IDE.
   - **Rastreamento e Persistência de Perguntas Finalizadoras Não Respondidas:**
     * Perguntas de alinhamento, chamadas de confirmação ou pedidos de aprovação formulados pelo agente no fechamento de turnos que não forem diretamente respondidos ou decididos pelo usuário (por exemplo, quando o usuário muda de tópico ou responde a outra questão) **devem ser compulsoriamente salvos e mantidos na fila de pendências** do backlog (`docs/03_BACKLOG_TAREFAS_E_FEATURES.md`).
     * Toda pergunta não respondida deve ser registrada e exibida nos relatórios parciais com: (a) Texto literal da pergunta formulada; (b) Contexto da funcionalidade ou seção correspondente; (c) Indexação de navegação direta ao diálogo original via link `[Ir para Pergunta Original](conversation://<conversation-id>)`.
     * **Omissão Estrita quando Vazio:** Se não houver perguntas pendentes, a seção correspondente nas respostas do chat é 100% omitida (não mostrar nada).
   - **Controle Dinâmico de Prioridades:**
     (a) O agente controla e classifica as prioridades de todas as tarefas pendentes na fila (Alta, Média, Baixa) com base nas melhores práticas de engenharia de software (mitigação de riscos, integridade arquitetural, bloqueios técnicos e ganho operacional);
     (b) O usuário pode, a qualquer tempo, solicitar a alteração da prioridade de qualquer tarefa;
     (c) Sempre que uma prioridade for alterada a pedido do usuário, o agente deve sinalizar expressamente tal fato ao exibir as pendências de tarefas (ex.: `[Prioridade Alterada pelo Usuário]`), assegurando total transparência na governança do backlog.
   - **Economia de Tokens em Anotações Simples e Estabilidade do Índice Mestre:**
     * **Concisão e Rapidez nas Anotações:** Em anotações simples de tarefas e relatos de bugs, ser rápido, objetivo e economizar tokens. Manter as tabelas de ações pendentes e implementadas, dispensando relatórios textuais prolixos ou redundantes no chat.
     * **Estabilidade do Índice Geral (`docs/00_INDICE_GERAL.md`):** O índice mestre mapeia arquivos e responsabilidades gerais e **só deve ser alterado quando arquivos forem criados, excluídos ou renomeados no repositório**. É estritamente vedado alterar o índice geral para registrar números de subseções ou anotações internas dentro dos arquivos `.md`.
     * **Auditoria Opcional e Parametrizada por Arquivo:** Não executar varreduras globais de auditoria em todos os arquivos durante simples anotações de backlog. Quando for indispensável auditar codificação de arquivos pontuais, executar o script informando apenas os arquivos modificados via parâmetro (ex.: `powershell -File util/verificar_codificacao.ps1 -Arquivos "docs/03_BACKLOG_TAREFAS_E_FEATURES.md"`).
2. Preservacao Documental Absoluta: E terminantemente proibido apagar, resumir, ocultar ou encurtar comentarios no codigo-fonte. Todo comentario explica exaustivamente o *porque* (regras de negocio, falhas do framework alvo PJe/RichFaces/Angular, otimizacoes V8/Blink, isolamento Shadow DOM/Top Layer e protecoes de Regex Unicode) e nao apenas o *o que*.
3. Intra-Comentarios de Reconstrucao (Passos X.Y Intercalados): O fluxo de dados ("Passos") deve estar obrigatoriamente intercalado dentro do corpo de cada metodo e funcao, permitindo recriar 100% do sistema do zero caso o codigo deixasse de existir.
4. Codificação Padrão UTF-8 Nativa Direta e Proibição Estrita de Entidades HTML:
   - Todos os arquivos do projeto (.html, .js, .css, .json, .md) devem utilizar estritamente a codificação UTF-8 sem BOM.
   - É obrigatório o uso direto de acentos e caracteres do Português do Brasil (ç, ã, õ, é, í, ó, ú, â, ê, ô, à, etc.) diretamente no código-fonte, templates HTML, estilos e documentação.
   - É TERMINANTEMENTE PROIBIDO o uso de entidades HTML (como &ccedil;, &otilde;, &eacute;, &aacute;, etc.) no código-fonte, nos arquivos HTML ou em strings injetadas em interface visual. Entidades HTML devem ser extirpadas do código, sendo admitidas exclusivamente dentro de máscaras regex ou em rotinas de higienização de HTML bruto quando estritamente indispensável.
   - Arquivos HTML devem declarar explicitamente <meta charset="UTF-8"> e <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> logo no início de <head>. Arquivos CSS devem iniciar com @charset "UTF-8";.
5. Integridade Funcional e Copia Silenciosa:
   - Base de 6 estagios mantida integralmente; proibido remover suporte a Ctrl/Alt/Shift.
   - Jamais exibir popups ou baloes de "Copiado!" em copias validas comuns.
   - O aviso flutuante e restrito a 3 hipoteses: (1) Alerta Ambar de erro matematico/calendario (CPF, CNPJ, CNJ ou Data invalidos); (2) Estatisticas do Modo Acumulador / Tabelas (Ctrl + Alt); (3) Mini-Tip global temporario ao alternar modo via Duplo Esc ou F1.
6. Sincronizacao Obrigatoria de Blue Print e SandBox: Central de Ajuda, [options.html](../src/cfg/options.html), area de testes interativos e bateria automatizada em [debug.js](../src/cfg/debug.js) permanentemente sincronizados. Consultar [BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md](BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md) para detalhamento dos modulos.
7. Fluxo Autonomo na IDE: Gravacao direta em disco sem exigir intervencao de "Accept All" do usuario e sem forcar a abertura de abas no editor.
8. Backup Padronizado Obrigatorio (Politica Inteligente de Cadencia Operacional):
   - Destino estrito: bkp/ (relativo a raiz do projeto).
   - Nomenclatura: bkp_AAAA-MM-DD_HH-MM.zip
   - Conteudo: Todos os arquivos e subdiretorios da raiz (incluindo arquivos e pastas iniciados por `.`, como `.vscode` e `.gitignore`), aplicando apenas os filtros de exclusao:
     (a) Exclui a propria pasta `bkp`;
     (b) Exclui o repositorio interno `.git`;
     (c) Exclui arquivos e pastas iniciados por `leia-me` (case-insensitive);
     (d) Exclui a pasta `tmp` (arquivos temporarios nao sujeitos a backup);
     (e) Exclui a pasta `outros` (pasta auxiliar fora do backup).
   - Limpeza Automatica no Backup: Ao executar `util/fazer_backup.ps1`, todos os arquivos temporarios em `tmp/` sao limpos automaticamente antes de gerar o pacote.
   - Settings Global da IDE: Toda modificacao do `settings.json` global (pasta User da IDE) deve ser copiada imediatamente para `.vscode/settings.json.global`; `util/fazer_backup.ps1` repete essa copia automaticamente a cada backup.
   - Portabilidade entre Computadores: todas as preferencias (IDE, Git e projeto) devem funcionar ao abrir a pasta em outro computador. Preferencias de nivel de maquina (config global do Git com sincronizacao preferindo arquivos locais via `merge=ours`/`.gitattributes`, sem editor externo, variaveis de ambiente do usuario e `settings.json` global da IDE) sao restauradas por `util/configurar_ambiente.ps1` (ou `.bat`), executado uma vez em cada PC novo (idempotente). Toda nova preferencia de maquina deve ser incluida nesse script. Nunca gravar caminhos absolutos especificos da maquina em `.vscode/settings.json` sem alternativas (fallbacks).
   - Scripts Essenciais em `util/`: Todos os scripts essenciais de apoio (`executar_auditoria.ps1`, `executar_testes.html`, `verificar_codificacao.ps1`, `backup.bat`, `fazer_backup.bat`, `fazer_backup.ps1`, diff e patch) residem exclusivamente dentro da pasta `util/`. É terminantemente proibido criar arquivos `.bat`, `.ps1`, `.cmd` ou scripts utilitários na raiz do projeto (como `backup.bat` na raiz). Qualquer utilitário ou comando operacional novo deve ser alocado obrigatoriamente em `util/`, mantendo a raiz do repositório estritamente limpa. A antiga pasta `testes/` foi extinta.
   - Regra de Criacao de Arquivos Temporarios/Lixo: Qualquer arquivo temporario, log de saida de teste (como `chrome_output.txt`), rascunho de diagnostico ou arquivo diff intermediario deve ser criado exclusivamente dentro de `tmp/`.
   - Gatilhos de Execucao (Media de ~5 backups/dia em trabalho intenso):
     (a) Inicio do dia de trabalho / primeira sessao;
     (b) Periodico a cada 3 horas de trabalho ativo continuo;
     (c) Virada de data ("rodar o dia" apos 00:00 meia-noite);
     (d) Imediatamente antes de alteracoes estruturais, mudancas radicais ou grandes refatoracoes;
     (e) Apos compilacoes ou baterias de testes aprovadas com alto volume de modificacoes;
     (f) Sob demanda, sempre que solicitado pelo usuario no prompt ("backup", "fazer backup").
   - Scripts oficiais relativos: util/fazer_backup.ps1 e util/fazer_backup.bat.
   - **Política de Cadência do Git Remoto (Push para o GitHub Apenas de Tempos em Tempos):**
     * **Git Local Sempre Atualizado:** O repositório Git local permanece rigorosamente atualizado a cada alteração real de arquivos (`git commit` local).
     * **Push Remoto com a Mesma Cadência do Backup:** O envio de commits para o GitHub remoto (`git push origin main`) é executado estritamente de tempos em tempos para liberar o prompt do desenvolvedor imediatamente, sem atrasos de rede ou overhead de sincronização remota em pequenas anotações.
     * **Gatilhos de Push ao GitHub:**
       (a) No início de cada dia de trabalho / primeira sessão diária;
       (b) Virada de data ("rodar o dia" após 00:00 meia-noite);
       (c) Imediatamente após conclusão de tarefas com grande volume de mudanças no código ou após longas sessões de processamento/homologação de suíte;
       (d) Imediatamente após a geração de cada backup versionado (`util/fazer_backup.ps1`);
       (e) Sob comando manual expresso do usuário no prompt (*"push"*, *"enviar github"*, *"subir git"*).
9. Particionamento Modular Estrito (4 Módulos Temáticos em Subdiretórios Exclusivos):
   - **Paridade Estrutural 1:1 com os 4 Grupos de Opções do Addon:** Para cada um dos 4 grandes grupos de configuração do usuário em `options.html`, existe exatamente um subdiretório físico exclusivo em `src/`, garantindo coesão absoluta e separação física de responsabilidades:
     1. **Módulo 1: Cópia Inteligente & Forense (`src/mod-copia/`):** 12 classes POO especializadas (`copia-geometria.js`, `copia-filtros.js`, `copia-validadores.js`, `copia-minutas.js`, `copia-visual.js`, `copia-estagio1.js` a `copia-estagio6.js` e orquestrador imutável `mod-copia.js`), cobrindo o motor de 6 estágios, ciclo circular de 5 degraus (ida e volta), regra "espaço = 2 cliques", regra da vírgula, acumulador (;), auditoria matemática de documentos/calendários e Colagem Rápida via Botão Direito.
     2. **Módulo 2: Acelerador PJe Turbo (`src/mod-pje/`):** Folhas de estilo (`PJE-anti_ampuletas.css`) injetadas precocemente em `document_start` para desbloqueio visual de elementos e conversão de cabeçalhos nativos do PJe ("Num. ... - Pág. ...").
     3. **Módulo 3: TECLADO/MOUSE (`src/mod-input/`):** 5 classes POO especializadas (`input-botoes-laterais.js`, `input-botao-meio.js`, `input-teclado-campos.js`, `input-atalho-f1.js` e fachada orquestradora `mod-input.js`), cobrindo captura de botões laterais 4 e 5 do mouse para troca circular de guias, colagem no cursor via botão do meio (scroll click) e Win+V via Ctrl+Botão do Meio, navegação rápida por setas ↑ / ↓ entre campos `<input>` e atalho F1 Google Gemini.
     4. **Módulo 4: NAVEGADOR (`src/mod-navegador/`):** 5 classes POO especializadas (`navegador-janela-unica.js`, `navegador-anti-duplicacao.js`, `navegador-ordenacao.js`, `navegador-descarte.js` e fachada orquestradora `mod-navegador.js`), cobrindo Single Window com preservação de certificados Gov.br/ICP/PJEOffice, reuso e anti-duplicação de abas, ordenação hierárquica e agrupamento colorido via Tab Groups API e descarte automático de guias inativas (economia de memória RAM).
   - **Módulos Futuros:** O ecossistema em `src/` é concebido de forma desacoplada para suportar a integração de novos módulos temáticos (ex: `mod-eproc/`, `mod-projudi/`, `mod-assinador/`) com isolamento total de responsabilidade.
10. Centralização de Documentos Instrutivos em docs/, Soberania do Berço Documental e Replicação Unidirecional para a Raiz:
   - **Princípio da Soberania Documental em docs/ (Single Source of Truth para Markdown):**
     * Todos os arquivos do tipo `.md` que instruem o projeto e sua governança são rigorosamente gerados, editados e mantidos primeiramente dentro da pasta `docs/` (ex.: `docs/README.md`, `docs/01_DIRETRIZES_E_REGRAS_ROOT.md`, `docs/BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md`, `docs/AGENTS.md`). Qualquer arquivo `.md` em `docs/` é carregado e considerado soberano no contexto.
     * **Geração Inicial em docs/ com Replicação Posterior para a Raiz:** Quando um arquivo Markdown precisar residir fora da pasta `docs/` (como o `README.md` na raiz do repositório para exibição pública na página do GitHub), a lógica de geração é estritamente unidirecional de dentro para fora: o arquivo é **gerado e atualizado primeiramente dentro de `docs/` (`docs/README.md`) e em seguida replicado/sincronizado para a raiz (`README.md`)**.
     * **Salvaguarda Contra Exclusão Acidental:** Esta inversão de fluxo garante que, se por qualquer razão arquivos fora de `docs/` forem excluídos, sobrescritos ou corrompidos acidentalmente na raiz, a fonte primária e todo o patrimônio intelectual em `docs/` permaneçam 100% íntegros e possam ser imediatamente restaurados e replicados.
   - Todos os arquivos temporários de trabalho, testes ou intermediários devem estar estritamente contidos na pasta `tmp/`, a qual não é sujeita a backup. A pasta `outros/`, se existente, também permanece estritamente fora do backup.
11. Diretiva Arquitetural Fundamental de Engenharia de Software: Modularidade, Coesão, Baixo Acoplamento e Independência Funcional:
   - **Encapsulamento Orientado a Objetos por Módulo e Arquivo:** Todo arquivo `.js` e todo módulo do sistema deve obrigatoriamente encapsular suas variáveis, estado interno e métodos por meio de Orientação a Objetos (classes, closures blindadas ou namespaces estritos), sendo terminantemente vedado expor variáveis globais soltas no escopo da janela (`window`).
   - **Tolerância a Falhas e Desativação Modular (Guardas Pré-Chamada):** Se um arquivo ou módulo necessitar de funções ou serviços de outro módulo/arquivo externo por qualquer razão, é **estritamente obrigatório testar a existência prévia do método/serviço antes de sua invocação** (ex.: `typeof moduloX?.metodoY === 'function'`). O código jamais pode sofrer interrupção ("crash" ou "abort") por `TypeError: ... is not a function` ou `ReferenceError` caso um módulo externo venha a ser desativado, falhe ao carregar ou seja modularmente desligado nas opções.
   - **Casamento de Alta Coesão e Baixo Acoplamento:** Cada módulo deve possuir independência funcional estrita, operando de modo autônomo, robusto e previsível, mantendo suas responsabilidades delimitadas ao seu domínio primário.
12. Idempotência Universal no Código de Produção (com Exceção Especial para Baterias de Auditoria, Testes e Fuzzing):
   - **Idempotência Obrigatória em Produção:** Todo o código-fonte de produção (injeção de scripts, inicialização de módulos, observers, manipuladores de eventos, formatação e aplicação de efeitos visuais) deve ser estritamente idempotente. Invocar uma função, inicializar um componente ou processar um mesmo evento múltiplas vezes consecutivas deve produzir exatamente o mesmo resultado estável e seguro, sem duplicar listeners, sem empilhar nós no DOM e sem causar efeitos colaterais indesejados (`f(f(x)) === f(x)`).
   - **Exceção Estrita para Geradores de Dados de Testes, Auditoria e Fuzzing:** A única exceção admitida à regra de idempotência reside nas baterias de auto-testes, testes de regressão e motores de fuzzing (como `debug.js` e suítes de teste). Nestes contextos específicos, os geradores de carga de teste devem deliberadamente variar seus dados para atingir os objetivos de validação ampla, mesclando:
     (a) Testes Randômicos (geração estocástica/pseudoaleatória de strings mutadas, caracteres de borda e sequências truncadas para estresse de robustez);
     (b) Testes Pré-definidos (conjuntos fixos de regressão forense com casos canônicos de sucesso e insucesso);
     (c) Testes Obrigatórios de Conformidade (auditorias determinísticas de validação matemática de CPF, CNPJ, CNJ e calendário gregoriano).
13. Padrão Visual Obrigatório para Listagem e Implementação de Ações (Formato Canônico em Tabela Markdown Compacta):
   - **Formato Estrito de Resposta:** Todas as respostas da IA devem adotar obrigatoriamente a apresentação estruturada em tabelas com tipografia compacta perfeitamente integrada ao corpo do texto e seções claramente delimitadas:
      - Tabela `📋 Quadro de Pendências Priorizadas` (com 5 colunas canônicas ultra-otimizadas: `# | ID / Seção | Tipo | P | Descrição da Pendência`):
        * **Quantidade Estrita de Linhas e Ordenação Topológica:** Exibir sempre **10 casos** (se existirem no backlog/radar), organizados rigorosamente pela seguinte ordem estrutural:
          1. **Início da Lista (Topo Prioritário):** Itens marcados com o modificador de urgência `!` ("Assim que possível", "Urgente", "Pra agora");
          2. **Corpo Intermediário:** Itens normais numerados sequencialmente (`1`, `2`, `3`...), ordenados pela taxonomia de prioridade (`↑`, `↗`, `→`, `↘`, `↓`), incluindo itens marcados com o modificador de revisão `?` ("Revisar / Reavaliar e reverificar a necessidade");
          3. **Final da Lista (Últimos Slots):** Os itens mais antigos do histórico do projeto ocupam compulsoriamente as últimas posições, identificados com os símbolos `#2` e `#1`, sendo `#1` o mais antigo absoluto do histórico e `#2` o segundo mais antigo (caso já não estejam exibidos nas posições anteriores);
        * **Coluna `#` e Tooltips para IDs Não-Padrão e Modificadores:** Numeração sequencial alinhada ao centro. Quando o identificador for não padrão (`#1`, `#2` para itens mais antigos, `!` para urgentes ou `?` para revisão), é obrigatório incluir tooltip descritivo nativo via `<span title="...">`:
          - `!` = `<span title="Urgente / Assim que possível">!</span>` (topo prioritário);
          - `?` = `<span title="Revisar: Reavaliar e reverificar a necessidade">?</span>` (marcado para reavaliação técnica);
          - `#` = `<span title="ID não padrão: Tarefa antiga residual do histórico">#1</span>` (final da lista);
        * **Coluna `ID / Seção`:** Texto puro sem link de arquivo (para evitar quebra ou ícones M+ poluindo a visão), formatado com `<nobr>` / `white-space:nowrap` para caber estritamente em uma única linha e ajustar sua largura automaticamente;
        * **Coluna `Tipo`:** Dividido em duas linhas via `<br>` sem barra `/` (ex: `Correção<br>Expansão`, `Feature<br>Máscaras`), ajustando sua largura de forma estreita e compacta;
        * **Coluna `P` (Prioridade em 5 Níveis com Setas de 1 Caractere e Tooltips):** Cabeçalho minimalista de 1 letra (`P`). Adota a taxonomia de 5 níveis técnicos:
          - **Alta:** `↑` (seta vertical para cima);
          - **Média alta:** `↗` (seta diagonal inclinada para cima);
          - **Média:** `→` (seta horizontal para a direita);
          - **Média baixa:** `↘` (seta diagonal inclinada para baixo);
          - **Baixa:** `↓` (seta vertical para baixo).
          - **Prioridade Ajustada Manualmente:** Se a prioridade foi ajustada ou definida manualmente pelo usuário, formatar a setinha obrigatoriamente com sublinhado (`<u>`), ex: `<u>↑</u>`, `<u>↗</u>`, `<u>→</u>`, `<u>↘</u>`, `<u>↓</u>`;
          - **Modificador de Urgência (`!`):** Se o usuário marcar qualquer item como "Urgente", "pra agora", "no mínimo tempo possível" ou "assim que possível", o item sobe para o início da lista e recebe o prefixo `<span title="Urgente / Assim que possível">!</span>` imediatamente ao lado esquerdo da setinha;
          - **Tooltip Nativo Compulsório:** Cada indicador de prioridade e de urgência deve conter tooltip ao passar o mouse via `<span title="...">...</span>`;
        * **Coluna `Descrição da Pendência`:** Detalhamento técnico da tarefa, aproveitando a largura otimizada pelas colunas anteriores;
        * **Coluna `Próximo Passo` e Supressão de Legendas Textuais:** A coluna "Próximo Passo" é dispensada por padrão. É **terminantemente proibido incluir blocos de texto ou notas de legenda de prioridades** antes ou depois da tabela, pois os tooltips (`title="..."`) já explicam todos os símbolos de forma elegante e contextual ao passar o mouse;
     - Tabela `❓ Perguntas e Confirmações Pendentes de Resposta` (com colunas `# | ID / Seção | Pergunta / Pedido de Confirmação em Aberto | Link para Diálogo Original`), exibindo chamadas de decisão não respondidas com link nativo navegável (`conversation://<conversation-id>`). **Regra de Omissão Absoluta:** Se NÃO houver perguntas ou confirmações pendentes de resposta, esta seção/tabela DEVE SER TOTALMENTE OMITIDA das respostas (NÃO MOSTRAR NADA, eliminando ruído visual);
     - Tabela `✅ Ações Implementadas (v<versao>)` (com colunas `Item / Arquivo | Tipo de Ação | Detalhamento da Solução`):
       * **Exibição da Versão Atual do Addon:** O cabeçalho desta seção deve compulsoriamente estampar a versão oficial atual da extensão (ex.: `### Ações Implementadas (v261106.4.15)`);
       * **Foco em Alterações Reais de Código:** Focada estritamente nas alterações reais de arquivos e código. Metadados operacionais de rotina (como commits no repositório Git e hashes) continuam sendo executados nos bastidores de forma rigorosa, mas **NÃO precisam ser informados na tabela**, reduzindo ruído e economizando tokens;
     - **Extinção Total do Bloco "Procedimento para Recarregar no Chrome":** É expressamente proibido anexar a seção repetitiva com instruções de recarregar em `chrome://extensions` e `Ctrl+F5` ao final das respostas da IA. O desenvolvedor já conhece o procedimento de recarga, sendo desnecessário poluir o diálogo com instruções operacionais redundantes;
     - Tópicos objetivos e hierárquicos detalhando as decisões de engenharia, sem prolixidade e com links clicáveis para os arquivos.
   - **Padronização Visual:** Esse formato visual é obrigatório para fechamento de turnos, relatórios parciais, propostas de planejamento e entregas de código, maximizando a legibilidade humana, a densidade de informação e a rastreabilidade da conversa.
14. Continuidade de Comentários Exaustivos e Paridade Bidirecional Código-Documentação (Economia de Tokens & Reconstrução do Zero):
   - **Obrigatoriedade de Comentários Exaustivos de Reconstrução:** Todo o código-fonte deve manter continuidade inegociável de comentários detalhados e exaustivos (tanto no cabeçalho inicial de cada arquivo quanto no corpo de cada classe, método e função). A densidade e precisão dos comentários devem ser suficientes para permitir que qualquer engenheiro ou IA recrie 100% do código do zero apenas lendo os comentários, sem qualquer perda de regra de negócio, otimização de motor ou detalhe operacional.
   - **Economia Estratégica de Tokens de IA:** A presença de comentários técnicos claros, autossuficientes e hierárquicos economiza maciçamente tokens em futuras manutenções, pois a IA e os desenvolvedores compreendem o propósito e as restrições de cada trecho em uma única leitura linear, eliminando a necessidade de reprocessar dependências externas ou inferir lógicas complexas por tentativa e erro.
   - **Centralização em .md com Réplica e Enriquecimento no Código:**
     - A documentação mestra é rigorosamente centralizada nos arquivos Markdown em docs/ (DIRETRIZES_DESENVOLVIMENTO_E_REGRAS_ROOT.md, BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md, etc.), cada qual com seu nível de abstração.
     - Tudo o que estiver especificado nos arquivos .md deve ter sua devida réplica correspondente refletida no código-fonte.
     - Os arquivos de código conterão nível de detalhamento ainda maior que os documentos .md: cada arquivo de código terá em seus comentários iniciais o resumo executivo de sua responsabilidade e o link para a seção correspondente do documento .md, e cada função/método detalhará as regras de negócio aplicadas, casos de borda e comportamentos vinculados à funcionalidade descrita na documentação.
15. Estrutura Canônica de Empacotamento para Distribuição no Chrome (manifest.json + src/):
   - **Escopo Estrito de Distribuição:** O pacote final de distribuição do addon para a Chrome Web Store / carregamento descompactado no Chromium é composto EXCLUSIVAMENTE pelo arquivo manifest.json (na raiz do repositório) e pela pasta src/ (com seus arquivos e subdiretórios de código de produção).
   - **Isolamento de Pastas de Suporte e Governança:** Todas as pastas auxiliares (docs/, util/, kp/, 	mp/, .vscode/, README.md) existem estritamente para governança, testes, documentação e automação local do desenvolvedor/IA, sendo terminantemente proibido colocar código de execução de produção fora de src/ ou referenciar arquivos externos a src/ dentro do manifest.json.
   - **Organização Impecável em src/:** Todo e qualquer arquivo pertencente ao runtime da extensão deve estar estritamente contido em seu subdiretório de domínio dentro de src/ (src/cfg/, src/mod-copia/, src/mod-pje/, src/icones/, etc.), sem dispersão de arquivos soltos ou lixo de compilação.
   - **Mapeamento da Cópia Online no Chrome (`Z:\AddonChrome-GovBR.chrome`): Postagem Unidirecional e Soberania de Dev:**
     - O diretório de desenvolvimento atual (`Z:\AddonChrome-GovBR`) é a **FONTE ÚNICA DA VERDADE (Master / Single Source of Truth)**. Ele manda de forma absoluta e soberana sobre os arquivos de produção (`manifest.json` e a pasta `src/`).
     - A pasta física `Z:\AddonChrome-GovBR.chrome` hospeda a extensão online/ativa carregada no Chrome do desenvolvedor e atua estritamente como **ambiente de destino de publicação (Deploy / Postagem)**.
     - **Regras Estritas de Sincronização Unidirecional (Push Only):**
       1. "Sincronizar" significa exclusivamente **postar/copiar os arquivos de produção deste repositório para `Z:\AddonChrome-GovBR.chrome`**;
       2. **NUNCA arquivos virão de `Z:\AddonChrome-GovBR.chrome` para o diretório de desenvolvimento**;
       3. **NUNCA arquivos do diretório de desenvolvimento serão deletados por não existirem em `Z:\AddonChrome-GovBR.chrome`**;
       4. Qualquer reversão ("voltar o que era antes") é realizada internamente via histórico do Git ou pacotes de backup em `bkp/`, mantendo a integridade absoluta do ambiente de desenvolvimento.
      - **Comando "limpar git" ou "limpar github" (Reinicialização a partir do Zero):**
        * Sempre que solicitado pelo usuário através dos comandos expressos `"limpar git"` ou `"limpar github"`, a IA deve executar o script [`util/limpar_git.ps1`](file:///z:/AddonChrome-GovBR/util/limpar_git.ps1).
        * Esse script consolida todo o código de produção, documentação (`docs/`), backlog, anotações de bugs e utilitários em exatamente **1 único commit inicial limpo** (`feat: initial commit - JusGovBR v<versao>`), eliminando 100% do histórico prévio no repositório local e forçando a sincronização no GitHub (`git push -f origin main`).
        * Em seguida, sincroniza o repositório local auxiliar (`Z:\AddonChrome-GovBR.chrome`) e executa a postagem dos arquivos de produção via [`util/postar_chrome.ps1`](file:///z:/AddonChrome-GovBR/util/postar_chrome.ps1), garantindo que todos os ambientes fiquem perfeitamente limpos e sincronizados a partir do zero.
16. Índice de Boas Práticas em POO, Injeção Opcional e Tolerância a Falhas via Null Object Pattern:
   - **Índice de Boas Práticas em POO:**
     • **1. Princípio da Responsabilidade Única (SRP):**
       - Divisão do monolito `SelecionarCopiar.js` em responsabilidades exclusivas.
       - Isolamento completo da lógica de cópia, geometria de nós, filtros, feedback visual, validadores forenses, placeholders de minutas, 6 estágios de expansão, gestão de abas e captura de inputs.
     • **2. Favoreça a Composição sobre a Herança:**
       - Criação de classes menores, coesas e altamente especializadas.
       - Injeção de dependências em construtores em vez do uso excessivo e frágil de `extends`.
     • **3. Princípio da Inversão de Dependência (DIP):**
       - Desacoplamento físico de módulos de baixo nível (Teclado, Mouse e Navegador).
       - Dependência mútua de abstrações e interfaces contratuais limpas.
     • **4. Economia de Tokens e Modularidade (Diretório Plano Dedicado por Módulo):**
       - Criação de classes enxutas em arquivos curtos em 4 subdiretórios planos dedicados (`src/mod-copia/`, `src/mod-pje/`, `src/mod-input/`, `src/mod-navegador/`) sem aninhamentos excessivos ou subpastas artificiais, refletindo com paridade 1:1 os 4 grupos de opções do addon.
       - Nomenclatura concisa (`copia-*.js`, `input-*.js`, `navegador-*.js`) com fachadas orquestradoras unificadas (`mod-copia.js`, `mod-input.js`, `mod-navegador.js`) seladas via `Object.freeze` para maximizar a velocidade de indexação e economizar contexto em diálogos com a IA.
   - **Resiliência e Tolerância a Falhas no Ecossistema JavaScript:**
     • Se algum arquivo, módulo ou classe filha for excluído fisicamente, desabilitado nas opções ou falhar durante o carregamento, a extensão **JAMAIS pode quebrar ou abortar com `TypeError: Cannot read properties of undefined/null`**.
     • Duas estratégias obrigatórias e combinadas devem ser aplicadas:
       1. **Injeção de Dependência Opcional / Carregamento com Tolerância (try/catch):** A classe orquestradora pai recebe instâncias opcionais e realiza checagens seguras, tolerando a ausência física de arquivos ou classes externas no ambiente.
       2. **Padrão Null Object (Fallback Seguro):** Cada classe e dependência possui um objeto ou classe base segura (Null Object com métodos no-op que retornam valores neutros estáveis como `null`, `false`, `""` ou `{ ok: false }`). Exemplo arquitetural: `this.acaoCopia = acaoCopia || new CopiaBase()` ou `this.geometria = opcoes.geometria || (window.JusGovGeometriaDOM ? new window.JusGovGeometriaDOM() : NULL_GEOMETRIA)`. Isso assegura que o objeto principal sempre terá os métodos contratuais disponíveis para invocação por teclado ou mouse, eliminando definitivamente erros em tempo de execução.

---

## 2. REGRAS RIGIDAS ROOT, PRIORITARIAS ROOT E IMUTAVEIS DE NEGOCIO

> [!IMPORTANT]
> AVISO DE SALVAGUARDA ABSOLUTA: As regras desta secao sao REGRAS ROOT, PRIORITARIAS ROOT E IMUTAVEIS.
> Elas definem o cerne filosofico, matematico e operacional inegociavel do ecossistema JusGovBR.
> E terminantemente proibido flexibilizar, alterar, contornar, atalhar, subordinar ou remover qualquer uma dessas regras sob pretexto de refatoracao ou sob a justificativa de pedidos pontuais da interface.
> ESTAS REGRAS SO PODEM SER MODIFICADAS COM ORDEM EXPLICITA E CONFIRMACAO INEQUIVOCA DO USUARIO!

### 2.1 Tipo Base de Selecao (Unidade Atomica O(1))
- Ao clicar em texto comum com 1 clique unico, o motor isola a Unidade Atomica Base (micro: palavra simples ou token pontuado contiguo).
- A tabela tipada Uint8Array(128) classifica instantaneamente caracteres ASCII em tempo O(1) (~2ns por caractere), delimitando inicio e fim sem sobrecarregar a engine de expressoes regulares desnecessariamente.

### 2.2 Prefixos e Rotulos de Selecao (PALAVRA_ROTULO_INICIAL e Conectores)
- Regra de Captura Antecipada: Quando o usuario da 1 clique direto sobre uma palavra que atua como rotulo/prefixo designador ("id", "fls.", "pag.", "art.", "Lei", "no", "cpf", "cnpj", "processo", "sumula", "portaria", etc.):
  - O motor NAO seleciona apenas a palavra do rotulo.
  - O motor engloba e captura imediatamente o IDENTIFICADOR SUBSEQUENTE!
  - Exemplo: 1 clique sobre "id" em "id 2297820154" seleciona e copia "id 2297820154"; 1 clique em "art." em "art. 5o, LXXVIII" captura a referencia legal.
- Excecao Estrita de Negocio: As palavras "inciso", "alinea" e "paragrafo" NAO sao rotulos capturadores; 1 clique direto sobre elas seleciona apenas a palavra em si.
- Conectores de Intervalo ("a", "ate", "as", "c/c"): 1 clique direto sobre o conector expande automaticamente a expressao conectada (ex: clicar no conector "a" em "01/01/2026 a 31/12/2026" captura o intervalo completo de datas).

### 2.3 Regra Inegociavel da Virgula (,) e Ponto e Virgula (;)
- A virgula `,` e o ponto-e-virgula `;` atuam estritamente como fronteiras intermediarias de clausula e JAMAIS colam na palavra clicada.
- Exemplo: Clicar sobre a palavra em "Brasilia," ou "processo;" seleciona e copia estritamente "Brasilia" ou "processo", ignorando a pontuacao externa.

### 2.4 A Grande Regra Root: "Espaco" = Dois Cliques
- Clicar sobre o espaco em branco interno entre duas palavras ou blocos de uma expressao composta equivale funcionalmente a dar DOIS CLIQUES na expressao!
- O motor forca a expansao de compostos (forcarCompostos = true), ativando imediatamente:
  - Multiplos Numeros Espacados / Boletos ("215 7014 6992 8831"): 1 clique em um numero isolado captura o numero; 1 clique no espaco interno OU 2 cliques seleciona a cadeia inteira de 16 digitos!
  - Valores com Extenso ("R$ 65,00 (sessenta e cinco reais)"): 1 clique em 65,00 seleciona 65,00; 1 clique no espaco entre 65,00 e "(" OU 2 cliques seleciona a expressao completa com extenso!
  - Numeros com Extenso ("65 (sessenta e cinco)"): 1 clique em 65 seleciona 65; 1 clique no espaco antes de "(" OU 2 cliques seleciona "65 (sessenta e cinco)"!
  - Moeda ("R$ 65,00"): 1 clique em 65,00 pega 65,00; 1 clique no espaco entre "R$" e 65,00 OU 2 cliques pega "R$ 65,00"!
  - Delimitadores Simetricos ("( algo )"): 1 clique no espaco colado a borda pega o miolo "algo"; 2 cliques pega o bloco incluindo os delimitadores "( algo )"!
  - Sequencia em Caixa Alta ("REGULAR PROSSEGUIMENTO DO FEITO"): 1 clique no espaco interno OU 2 cliques seleciona todo o conjunto contiguo de palavras em maiusculas (inclusive com quebras suaves <br>)!
  - Sequencia Formatada em Destaque (negrito, italico, sublinhado, mark): 1 clique no espaco interno OU 2 cliques seleciona o bloco continuo com a mesma formatacao!
  - Conectivo de Dois-Pontos e Sentença Completa ("Atenção: confira o processo antes de prosseguir."): 1 clique sobre o espaço em branco imediatamente posterior aos dois-pontos `:` (ex.: espaço entre `:` e `confira`) atua como conectivo sintático entre a chamada anterior e a proposição seguinte, selecionando imediatamente a sentença/proposição inteira!


### 2.5 O Switch de Ida e Volta: Expansao, Minoracao e Ciclo Circular Continuo
O motor opera um ciclo deterministico de transicao dinamica de estados baseado no principio de zoom concentrico circular:

```
        +-------------------------------------------------------------+
        |                                                             |
        v                                                             |
  [MINIMO ATOMICO] ---> [COMPOSTOS / DESTAQUES] ---> [FRASE]          | (Ciclo
         ^                               |              |             |  Circular
         |                               v              v             |  Continuo)
         +--------------------- [PARAGRAFO] <--- [MAXIMO CONTEXTUAL] -+
```

1. Movimento de Expansao Progressiva (Do Minimo ao Maximo):
   - Se a selecao esta minimizada (ou inexistente), acoes e cliques subsequentes vao promovendo a selecao sucessivamente para degraus mais amplos:
     - Degrau 1 (Minimo): 1 clique na palavra isolada -> Unidade Atomica Base O(1).
     - Degrau 2 (Composto / Bloco): 1 clique no espaco ou 2 cliques -> Expressao Composta, Citacao de Lei, Sequencia em Caixa Alta, Bloco Formatado ou Delimitadores Simetricos.
     - Degrau 3 (Clausula / Frase): Frase delimitada por pontuacao forte.
     - Degrau 4 (Paragrafo Localizado): Paragrafo circunscrito sem transbordamento para paragrafos vizinhos.
     - Degrau 5 (Maximo): Bloco Ancestral Contextual (container do bloco).

2. Movimento de Minoracao / Reducao Progressiva (Do Maximo ao Minimo):
   - Se a selecao ja esta maximizada (ou se o usuario clica com intencao redutora):
     - Degrau 5 para 4: Reduz do container para o Paragrafo Localizado em questao.
     - Degrau 4 para 3/2: Reduz do paragrafo para a Frase ou Expressao Composta relevante.
     - Degrau 2 para 1: Reduz da expressao composta para a sub-parte pontuada ou palavra isolada.
     - Degrau 1: Retorna a Unidade Atomica Minima.

3. Dinamica do Ciclo Circular Continuo:
   - Se ja minimizado, novas interacoes expandem a selecao circularmente rumo ao topo.
   - Se ja maximizado, novas interacoes diminuem a selecao circularmente ate a base atomica.
   - Ao atingir o minimo, o ciclo recomeca expandindo; ao atingir o maximo, o ciclo recomeca diminuindo.
   - O usuario jamais fica bloqueado nem no teto nem na base: a navegacao contextual e fluida e ciclica.

4. Minoracao Estrita de 3 Cliques (e.detail >= 3):
   - Em blocos compostos pontuados ("12.016/2009", "136/2025", "10/01/2026", "11.222.333/0001-81"): 3 cliques opera a TENDENCIA A MINORAR imediata, capturando a sub-parte clicada ("12.016" antes da barra ou "2009" apos a barra).
   - No inicio do paragrafo ("3. Ordenar..."): 3 cliques delimita com precisao cirurgica o paragrafo localizado, sem transbordar para paragrafos anteriores ou posteriores.

### 2.6 Filtro Shift com Zero-Padding CNJ (Shift + Clique)
- Em entidades pontuadas (CPF, CNPJ Classico, Novo CNPJ Alfanumerico, Processo CNJ, SEI!, CEP, Data, Telefone):
  - Shift + Clique extrai exclusivamente os caracteres alfanumericos puros, eliminando pontos, tracos, barras e parenteses.
  - No Processo CNJ, aplica preenchimento automatico com zeros a esquerda (padStart(7, '0')) no sequencial de 7 digitos ("0991234-65.2024.4.01.4002" -> "09912346520244014002").
- Em texto comum: O 1o Shift + Clique define a ancora colapsada e o 2o Shift + Clique seleciona e copia o intervalo exato entre os dois pontos.

### 2.7 Modo Elastico (Ctrl Isolado ou Alt Isolado) e Links Nativos
- Ctrl (isolado em texto comum): Permite expandir ou encolher a selecao atual clicando ou arrastando por palavras/blocos inteiros.
- Ctrl + Clique sobre Link (<a href>): Preserva integralmente o padrao nativo do navegador, permitindo abrir o link em nova aba em segundo plano sem qualquer interferencia ou bloqueio da extensao.
- Alt (isolado): Inicia sempre uma nova selecao sobre objetos interativos (botoes, links, menus, abas), selecionando o texto todo do objeto com 1 clique unico ou permitindo Alt + Arrastar sobre partes do elemento.
- Alt + Shift + Clique sobre link: Forca download ou abertura direta.
- Ctrl + Duplo Clique ou Alt + Duplo Clique sobre linha de tabela (<tr>): Copia todas as celulas visiveis separadas por "|".

### 2.8 Modo Acumulador Completo (Ctrl + Alt)
- Concatenacao Padronizada: Concatena selecoes sucessivas separadas pelo caractere configurado e encerradas obrigatoriamente por ele no final ("item1;item2;item3;").
- Absorcao Previa Automatica: Se ja havia uma selecao ativa na tela antes de acionar Ctrl + Alt, ela e absorvida imediatamente como o 1o item da fila.
- Ordenacao Crescente Natural no DOM (Ctrl + Alt sem Shift): Posiciona o novo item na ordem cronologica/estrutural progressiva do documento HTML, antes de eventuais itens desordenados inseridos via Shift.
- Modo Baralho (Ctrl + Alt + Shift): Insere o novo item estritamente no final da fila de acumulacao.
- Toggle-Off e Proibicao de Duplicatas: Clicar novamente sobre um item ja acumulado desmarca-o, remove-o da lista e apaga o destaque visual nativo (::highlight(jusgov-acumulador)).
- Desfazer Ultima Carta (Ctrl + Alt + Clique Direito): Remove o ultimo item adicionado a pilha historica, independentemente de sua posicao no DOM.
- Aviso Flutuante de Estatisticas: Exibe estritamente metricas operacionais ("ACUMULADOR: X intervalos | Y palavras | Z caracteres"), jamais expondo o texto acumulado.
- Validacao do Separador: Maximo de 5 caracteres; proibicao absoluta de letras e numeros (somente simbolos e pontuacoes); se vazio ou invalido, reverte automaticamente para o padrao ";".

### 2.9 Regra Rigida de Tempo Zero (0 = Desativado, >0 = Ativo)
- Se o tempo configurado for igual a 0, o recurso esta rigorosamente DESATIVADO.
- Se for maior que 0 (ex: 250ms, 3500ms), esta ATIVO.
- Aplica-se a:
  - tempoAvisoMs: Tempo de exibicao dos alertas visuais (0 = desativado).
  - tempoFlashBorderMs: Contorno visual rapido ao copiar (0 = desativado).

### 2.10 DIRETRIZ ROOT IMUTAVEL: PRESERVACAO ABSOLUTA DA NAVEGACAO E INTERACAO NATIVA EM INTERFACES WEB (SEM MODIFICADORES)
- O ecossistema JusGovBR tem como diretriz root inegociavel JAMAIS atrapalhar, atrasar, interceptar ou bloquear a navegacao comum e a manipulacao nativa do usuario em interfaces web (sites, sistemas em nuvem, web apps como Google Gemini, Gmail, PJe, etc.).
- A copia automatica em 1 clique (e demais interacoes padrao sem teclas modificadoras) atua estritamente em **conteudo estatico de leitura segura** (artigos, sentencas, decisoes, despachos, peticoes, visualizadores de PDF e textos comuns exibidos ou selecionaveis pelo navegador).
- Em qualquer **elemento de interface interativa do navegador ou da aplicacao web** (botoes, dropdowns, seletores de modelos como "Flash v", icones de microfone/audio, menus, abas, links, caixas de selecao, controles customizados de frameworks como Wiz, Angular, Lit, Web Components com Shadow DOM):
  - Cliques comuns (1 clique, duplo clique, com ou sem pequeno arrasto, sem modificadores) passam 100% livres, diretos e nativos para a pagina web.
  - Zero `e.preventDefault()`, zero `e.stopPropagation()`, zero `ignorarProximoClick = true`, zero modificacao da selecao do DOM (`window.getSelection()`), zero copia espuria.
  - Preservacao Soberana do Arrasto de Selecao: Se nativamente, sem o addon, o usuario conseguiria selecionar um texto (seja no Google Gemini, em paginas web, conteudos mistos ou interfaces ricas), o texto selecionado por arrasto de mouse DEVE ser integralmente preservado e copiado pelo addon. Jamais deve haver remocao forcada da selecao nativa do usuario ('removeAllRanges') quando houver texto efetivamente selecionado. Cliques e pequenos desvios sem selecao de texto continuam passando 100% livres aos controles nativos da pagina.
- **Papel Soberano das Teclas Modificadoras (`Alt`, `Ctrl`, `Shift`, `Ctrl+Alt`)**:
  - As teclas modificadoras sao o gatilho exclusivo de intencao deliberada do usuario de manipular o addon / copiar texto sobre qualquer elemento.
  - Somente com modificador mantido (ex: `Alt + Clique` em botao/link) o addon sobrepoe a acao padrao para selecionar e copiar o rotulo do controle.
  - Cliques comuns (1, duplo, triplo clique), sem teclas modificadoras, com ou sem arrasto continuam selecionando e copiando palavras/blocos com total agilidade exclusivamente em textos comuns de leitura e arquivos PDF.

### 2.11 Atalho F1 para Prompt de IA / Assistente (Painel Lateral ou Nova Aba)
- Tratamento Generico de IA: O recurso e apresentado genericamente como "Prompt de IA" / "Assistente de IA", compativel com qualquer assistente de inteligencia artificial.
- Motor de Alta Performance e Painel Lateral: Nos bastidores, o addon mantem a integracao com o Painel Lateral nativo e com a aba web do assistente.
- Modelo de Prompt com Fonte Condensada Tahoma: Na Central de Opcoes, a caixa do modelo generico de prompt utiliza fonte condensada da familia Tahoma e alinhamento a esquerda para alta legibilidade e densidade textual.
- Bloqueia o evento nativo window.addEventListener('help') e F1 padrao do navegador no Windows.
- Gravacao no Clipboard e Painel Lateral Nativo do Navegador:
  - Como o Painel Lateral nativo do navegador e uma interface interna isolada pelo sandbox de seguranca contra injecoes de scripts externos, o motor formata o prompt completo e o grava imediatamente na Area de Transferencia (clipboard).
  - Exibe um Mini-Tip de confirmacao na tela: "Prompt de IA copiado! Cole com Ctrl+V no painel lateral ou utilize a aba aberta".
  - O usuario pode simplesmente pressionar Ctrl+V dentro do campo de prompt ("Digite / para usar as habilidades") do Painel Lateral ja aberto na tela.
  - Simultaneamente, o Service Worker localiza ou abre a aba web dedicada do assistente e preenche automaticamente o campo de texto via chrome.scripting.executeScript apos a conclusao do carregamento.

### 2.12 Atalho Duplo Esc (com debounce de 60ms a 420ms) e Desselecao Universal Profunda
- 1 Esc isolado: Executa a Desselecao Universal Profunda e Nativa:
  - Invoca as funcoes nativas do Blink/V8: window.getSelection().empty(), window.getSelection().removeAllRanges(), collapseToStart() e a instrucao nativa document.execCommand('unselect').
  - Reseta elementos de formulario: document.activeElement.setSelectionRange(0, 0), activeElement.blur() e varre todos os <input> e <textarea> ativos com selecao residual.
  - Varre recursivamente toda a arvore de iframes e frames acessiveis, window.parent, window.top, window.frames e shadowRoots no DOM.
  - Propaga a ordem de desselecao via Service Worker (broadcastDeselecionarGeral) para todas as janelas e frames isolados da mesma aba (cross-origin iframes).
  - Limpa o acumulador (;), ancoras de cursor, bordas luminosas (flash border) e alertas visuais sem jamais alterar o conteudo atual do clipboard.
- 2 Escs sequenciais rapidos (entre 60ms e 420ms): Alterna instantaneamente o interruptor "Remover Formatacoes (Somente Texto)":
  - Se "Remover Formatacoes" estiver ativado (modo Texto Puro): o 2o Esc desativa o switch e ativa a copia formatada no nivel de estilos previamente escolhido no slider (Niveis 1 a 4).
  - Se "Remover Formatacoes" estiver desativado (modo Formato Ativo): o 2o Esc ativa o switch e reverte a copia imediatamente para Somente Texto Puro (Nivel 0).
  - Projeta Mini-Tip global temporario no topo da pagina informando o modo ativo e preserva rigorosamente a posicao do slider de estilos.

### 2.13 Arquitetura Progressiva de Filtros HTML em 5 Niveis e Regra de Ouro
1. Dinamica do Switch e do Slider de Estilos:
   - O controle "Remover Formatacoes (Somente Texto)" e o interruptor principal (switch). Quando ativado (checked), a copia atua exclusivamente em Texto Puro (Nivel 0 com extracao node.textContent).
   - O botao que corre (slider) "Nivel de Filtro de Estilos" possui 4 posicoes (1: Basico, 2: Intermediario, 3: Avancado, 4: Estendido). O slider NAO possui a posicao "0 - Texto Puro", pois Texto Puro e a funcao desempenhada pelo switch "Remover Formatacoes".
   - Quando "Remover Formatacoes" estiver selecionado (checked), o slider de estilos e automaticamente desativado (disabled e com opacidade reduzida), preservando intacto o nivel previamente configurado pelo usuario.
   - Quando "Remover Formatacoes" for desmarcado (unchecked) ou alternado via Esc+Esc, o slider e reativado imediatamente e a copia passa a usar o nivel de estilo ativo.
   - A intencao de negocio e permitir alternar instantaneamente entre Texto Puro e o nivel de estilos preferido sem perder a configuracao do slider.
2. Regra de Ouro da Implementacao:
   - Direcao Unidirecional Ascendente: Cada nivel herda rigorosamente as regras do nivel anterior e adiciona sua camada de permissao (allowlist). Tipografia de origem (font-family e font-size) e sujeiras MSO/Word sao sempre eliminadas.
   - Sanitizacao Ativa no Nivel 0: O nivel inicial extrai o conteudo exclusivamente via no de texto DOM (node.textContent), evitando injecao de tags orfas ou caracteres invisiveis.
3. Pipeline Estruturado em 3 Estagios de Filtragem:
   - Filtro 1 (Dados): Higienizacao inicial de caracteres incorretos, lixo de PDF, zero-width (\u200B-\u200D, \uFEFF, \u2060), soft-hyphens (\u00AD), caracteres de controle estranhos (< 32 exceto \r, \n, \t) e normalizacao de espacos nao-quebraveis (\u00A0, &nbsp;) para espaco comum ' '.
   - Filtro 2 (Estruturas de Documento): Conversao semantica de estilos nos niveis corretos (Niveis 1 a 4) ou extracao de Texto Puro estruturado (Nivel 0 ou Regra de Ouro), convertendo quebras <br>/<hr> e elementos de bloco (<p>, <div>, <li>, <tr>, <h1>-<h6>, etc.) em quebras de linha reais (\n).
   - Filtro 3 (Informacoes e Normalizacao Tipografica): Processamento de conteudo executado estritamente apos os estilos:
     - Preservacao estrita de novas linhas reais (\n) entre linhas de conteudo util.
     - Supressao total de linhas em branco vazias (seja geradas por paragrafos vazios, tags <br> repetidas ou espacos).
     - Remocao de espacos/tabs nas bordas inicial e final de cada linha (trim por linha).
     - Reducao de espacos horizontais duplicados indefinidamente no interior da linha para um unico espaco, corrigindo tabulacoes manuais incorretas.
3. Tabela Sintetica dos 5 Niveis Progressivos de Filtragem:

| Nivel | Denominacao | Escopo Semantico & Sanitizacao | Alvo / Destino |
|:---:|:---|:---|:---|
| **0** | **Texto Puro** | Remove 100% das tags HTML/XML, converte entidades (`&nbsp;` -> espaco, `&amp;` -> `&`, `&lt;` -> `<`, `&gt;` -> `>`), normaliza quebras de linha (`\r\n` -> `\n`). Sanitizacao ativa extraindo o conteudo exclusivamente via no de texto DOM (`node.textContent`) para evitar injecao de tags orfas ou caracteres invisiveis. | `input`, `textarea`, logs, variaveis de busca, campos de sistema legados sem suporte a markup. |
| **1** | **Basico (Inline)** | Apenas formatacao de caracteres: `b`, `strong`, `i`, `em`, `u`, `s`, `sub`, `sup`, `span`, `br`. Proibido qualquer atributo CSS de bloco ou quebras estruturais. | Caixas de comentario simples, notas rapidas de processo, chats institucionais e campos restritos. |
| **2** | **Intermediario (Paragrafo/Fluxo)** | Permite Nivel 1 + `p`, `blockquote`, `ul`, `ol`, `li`, `hr`. CSS restrito a alinhamento (`text-align: left\|right\|center\|justify`) e recuo simples (`margin-left`, `text-indent`). Sem tabelas ou quebras de layout complexas. | Editores de texto web padrao (CKEditor / TinyMCE basicos), despachos simples, certidoes. |
| **3** | **Avancado (Documental / RTF classico)** | Permite Nivel 2 + titulos (`h1`-`h6`), blocos pre-formatados (`pre`, `code`), tabelas estruturadas (`table`, `thead`, `tbody`, `tfoot`, `tr`, `th`, `td`). CSS inline restrito a bordas basicas, preenchimento (`padding`) e larguras de coluna (`width`). | Editores RTF completos, relatorios formatados, minutas de sentenca com tabelas de calculo e jurisprudencias. |
| **4** | **Estendido (Suites Office / Canvas)** | Permite Nivel 3 + imagens (`img`), atributos de celula (`colspan`, `rowspan`), metadados de quebra de pagina/secao, listas multinivel aninhadas e containers controlados (`div`). Mantem compatibilidade com schemas complexos sem executar scripts. | Suites de escritorio em nuvem (Google Docs, LibreOffice Online, Microsoft 365), sistemas de diagramacao e exportacao para DOCX/ODT. |

3. Regra de Ouro da Formatacao (Bloco Forense ou Palavra Unica = Somente Texto Puro):
   - Mesmo quando a manutencao de formatacao estiver ativa (em qualquer dos niveis 1 a 4), caso o usuario clique sobre um "bloco forense/estruturado" (CNPJ, CPF, CNJ, Data isolada, Data+Hora, Moeda, Telefone, Boletos, etc.) ou sobre uma "palavra unica isolada", a gravacao na area de transferencia DEVE ser estritamente SOMENTE TEXTO PURO (text/plain).
   - Frases compostas, paragrafos, sequencias maiusculas, tabelas e arrastos manuais cumprem normalmente a formatacao do nivel de estilo ativo.

### 2.14 Acelerador PJe Turbo (Anti-Ampulhetas)
- Injetado em document_start nos dominios do PJe (*pje*.jus.br).
- Neutraliza cortinas de bloqueio JSF/RichFaces (modalDiv, waitPopup) e Angular/PrimeNG (p-blockui, ui-blockui): pointer-events: none !important; opacity: 0 !important; contain: strict !important; content-visibility: hidden !important;.
- Destrava cursores wait e progress para default !important e zera tempos de transicao.

### 2.15 Otimizacoes Estruturais para o Motor Chrome V8 / Blink
- Tabela O(1) de Classificacao Instantanea: Uint8Array(128) pre-computada para consulta de classes de caracteres em ~2ns sem chamadas a engine Irregexp.
- Janela Deslizante Dobrada: Horizonte fixo de +-1.000 caracteres (~2.000 caracteres no total) ao redor do cursor.
- Desacoplamento de Sliced Strings no V8 Heap: Uso obrigatorio de ((' ' + str).slice(1)) antes de reter textos no acumulador, evitando vazamento de memoria de buffers pais de grande porte.
- Zero Layout Thrashing: Leituras geometricas (getBoundingClientRect) executadas estritamente ANTES de qualquer escrita no DOM.

### 2.16 Regra Cirurgica de Data Numerica com Horario Contiguo e Conectores ("18/09/2026 10:03:34" e "28/10/2026 - 06:28:50")
- Em datas numericas contiguas a horarios com separadores intermediarios (espaco unico " ", hifen "-", tracos en/em-dash, "as", virgula):
  - 1 clique sobre a data numerica: seleciona estritamente a data isolada ("18/09/2026").
  - 1 clique sobre o horario: seleciona estritamente o horario isolado ("10:03:34").
  - 1 clique sobre o espaco intermediario ou separador ("-", espacos ou conector): seleciona Data + Horario por inteiro ("18/09/2026 10:03:34").
  - 2 cliques em qualquer ponto da expressao (ou clique no espaco interno via "Espaco = 2 Cliques"): forca a captura composta imediata ("18/09/2026 10:03:34").
  - Precedencia Forense Rigorosa: O catalogo de padroes juridicos e avaliado prioritariamente antes de qualquer fallback generico (como MULTIPLOS_NUMEROS_ESPACADOS), impedindo truncamentos indevidos (ex: "18/09/2026 10").
  - Blindagem de Timezone: Reconhece estritamente siglas de fuso oficiais ("BRT", "BRST", "UTC", "GMT") evitando falso englobamento de palavras em portugues (ex: "nos", "em", "de").
  - Ja datas abreviadas ("17 ago. 2026"), por extenso ("29 de fevereiro de 2025") e competencias Mes/Ano ("out. 26") sao sempre selecionadas inteiras imediatamente no 1o clique.

### 2.17 DIRETRIZ ROOT: DIFERENCIACAO E COMPORTAMENTO ESTRITO ENTRE TELAS DE TEXTO/LEITURA E TELAS DE SISTEMA/INTERFACE/CONTROLES
- **Dicotomia Soberana de Ambientes:**
  - **Telas/Areas de Texto e Leitura Comum:** (documentos judiciais, peticoes, despachos, sentencas, acordaos, artigos, paginas de conteudo informativo e visualizadores de PDF):
    - O motor de selecao opera de forma ampla e confortavel: 1 clique seleciona e copia palavras/entidades atomicas; 2 cliques expandem frases ou delimitadores simetricos; arrasto seleciona e mantem texto selecionado; `Alt + Ctrl` atua como Modo Acumulador.
  - **Telas/Areas de Sistema, Interface e Controles (Modais, Dialogos, Dropdowns, Menus e Formularios):**
    - Exemplos tipicos: Modais popup (ex: "Tipo - Modelo de Documento"), menus de contexto suspensos (ex: "Encaminhar para assinatura..."), seletores e listas de opcoes (ex: "Sentenca Tipo D"), barras de ferramentas, botoes, inputs e abas.
    - **Regra de Ouro da Interface:** **JAMAIS FORCAR OU MANTER SELECAO VISUAL** (evitando poluir a tela com fundos azuis residuais em botoes, menus ou caixas de dialogo). O unico feedback de sucesso permitido e o **Contorno Visual Rapido ao Copiar (Flash Temporizado Verde)**.
- **Regras Operacionais Estritas para Telas de Sistema / Interface:**
  1. **1 Clique simples sem teclas modificadoras:**
     - Palavra avulsa comum: **Nao faz nada** (nem seleciona, nem copia; preserva totalmente a interacao e navegacao nativa da pagina/sistema).
     - Mascara util ou Bloco Estruturado (ex: data completa "17/09/2026 13:28:25", processo CNJ, CPF, CNPJ): **Copia para a Area de Transferencia** e exibe estritamente o **contorno verde temporizado (flash)**, **SEM selecionar o texto e SEM manter selecao ativa na tela**.
  2. **2 Cliques (duplo clique):**
     - Seleciona a palavra normalmente para o usuario que desejar intencionalmente a selecao nativa no elemento.
  3. **Arrasto de Mouse (Drag to Select):**
     - O usuario pode arrastar o mouse para capturar um trecho especifico.
     - Ao soltar o mouse (`mouseup`): copia o texto arrastado, dispara o contorno verde (flash) e **remove imediatamente a selecao da tela (`window.getSelection().removeAllRanges()`)**, garantindo que a tela de sistema permaneca limpa sem retangulos azuis residuais.
     - Ao segurar `Alt + Arrastar` sobre links, menus ou botoes: **JAMAIS selecionar o elemento inteiro**. O arrasto deve permitir selecionar estritamente os caracteres percorridos pelo cursor.
  4. **Alt + Clique Unico (sem arrasto):**
     - Copia o texto completo do controle, menu, botao ou item de lista (ex: "Sentenca Tipo D").
     - Dispara o contorno verde temporizado (flash) ao redor do elemento.
     - **Nao cria selecao visual** (ou desseleciona se criada).
     - Bloqueia a acao padrao (`preventDefault()`, `stopPropagation()`) para que o clique com Alt copie o texto sem navegar para links nem acionar submissoes de formularios.
  5. **Modo Acumulador (`Alt + Ctrl`):**
     - **Estritamente desabilitado** em qualquer tipo de controle, formulario ou elemento de interface (inputs, caixas, botoes, menus, modais).
     - Reservado com exclusividade para textos comuns de leitura.

---

## 3. SISTEMA DE LOGS E PRIORIDADES DO CONSOLE

### 3.1 Escala Hierarquica de Severidade
- TRACE (Nivel 10): Rastreamento detalhado de fluxo interno e micro-passos.
- DEBUG (Nivel 20): Diagnostico de desenvolvimento, inspecao de selecoes e ranges.
- INFO (Nivel 30): Mensagens operacionais informativas (copias formatadas, switches de modo).
- WARN (Nivel 40): Alertas nao bloqueantes, inconsistencias menores, fallbacks acionados.
- ERROR (Nivel 50): Falhas de execucao, excecoes capturadas, erros em chamadas de API.
- FATAL (Nivel 60): Rejeicoes criticas de promises nao tratadas, corrupcao irrecuperavel.

### 3.2 Regra de Exibicao em Producao
- No painel visual de Opcoes (options.html), apenas mensagens com prioridade >= WARN (WARN, ERROR, FATAL) sao gravadas e exibidas.
- Mensagens do tipo "[INFO] Texto formatado copiado! HTML: ..." sao tratadas como INFO e nao poluem o console visual.
- Nivel configuravel para testes e IDE via window.JusGovConfigurarNivelLog(nivel) ou window.__JUSGOV_LOG_LEVEL__.

### 3.3 Formato Estrito da Linha de Log
```text
DD/MM/AAAA HH:MM:SS.S [prio] mensagem
```
Exemplo:
```text
28/10/2026 08:34:31.2 [error] Falha de teste simulada no addon
```

---

## 4. REQUISITOS DA SUITE DE TESTES E FUZZING (debug.js)

Consultar [BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md](BLUEPRINT_ARQUITETURA_E_RECONSTRUCAO.md) para a integracao com a arquitetura dos modulos.

### 4.1 Bateria de Testes Blueprint Deterministicos (125 Testes)
1. CHAVES_FISCAIS_E_BOLETOS_CONTIGUOS: UUID v4 e Chave PIX.
2. CHAVES_FISCAIS_E_BOLETOS_ESPACADOS: Chave NF-e (11 blocos de 4) e Boleto FEBRABAN.
3. DOCUMENTOS_PESSOAIS_FISCAIS_E_CIDADAO: PIS/PASEP, CPF, CNPJ Classico e Alfanumerico, RG, CEP, OAB, Passaporte.
4. NUMERACOES_ID_E_PUBLICAS: Processo SEI!, Processo CNJ, Placas veiculares, Protocolo/Ano ("136/2025").
5. DATA_COM_HORARIO_CONTIGUO: Datas por extenso com horario, datas abreviadas, competencias mes/ano, data numerica com horario espacado ("DD/MM/AAAA HH:MM" e "DD/MM/AAAA HH:MM:SS") e conector hifen. Valida rigorosamente calendario e horas. Permite selecao de data com ponto final de sentenca ("Itabuna, 01.05.19.").
6. INTERVALOS_E_REFERENCIAS_ID_FOLHAS: Intervalos de datas, horarios, moedas, folhas/IDs do PJe ("fls. 123/130", "id 2297820154 pg 1"), numeros com extenso.
7. LEGISLACAO_JURISPRUDENCIA_E_ATOS: Dispositivos legais complexos, Instrucoes Normativas com orgaos compostos ("PRES/INSS no 128/2022"), Sumula Vinculante 13 do STF e atos com prefixo no.
8. COORDENADAS_GPS_E_PLUS_CODES: Graus Minutos Segundos (DMS), Graus Decimais (DD), UTM SIRGAS e Google Plus Codes.
9. EMAILS_E_PERFIS_SOCIAIS: E-mails RFC 5322 e perfis sociais iniciados por @.
10. TELEFONES_NACIONAIS_E_INTERNACIONAIS: Fixos com DDD, celulares 9 digitos, 0800, DDI internacional e blindagem contra sequencias numericas puras.
11. FINANCEIRO_E_DECIMAIS: Moedas com extenso, moedas simples e percentuais decimais.
12. DATAS_E_HORARIOS: Datas numericas pontuadas e horarios isolados.
13. GENERICOS_E_FALLBACKS: Resolucoes de tela e blocos pontuados de boletos.
14. REGRAS_COMPLEMENTARES: Tempo zero, anti-arrasto de UI, atalho F1 Gemini, atalho duplo Esc e duplo clique em espaco.
15. FORMATACAO_E_FILTROS_HTML: 5 niveis progressivos de higienizacao (Texto Puro, Basico Inline, Intermediario Fluxo, Avancado RTF e Estendido Office) e Regra de Ouro (bloco estruturado ou palavra unica copia estritamente somente texto puro).
16. DATA_E_HORA_AVANCADA: Data com horario contiguo e espacado em formatos "DD/MM/AAAA HH:MM" e "DD/MM/AAAA HH:MM:SS", conectores com hifen, clique no espaco intermediario e testes de auditoria de inconsistencia de horas/minutos/segundos e calendario bissexto.
17. SUPRESSAO_LINHAS_BRANCAS_E_ESPACOS_MULTILINHA: Preservacao estrita de novas linhas reais entre linhas de conteudo util, com supressao de linhas em branco vazias e colapso de espacos horizontais repetidos.
18. PRESERVACAO_NAVEGACAO_E_SEM_REDIRECIONAMENTO: Neutralizacao absoluta de navegacao indevida da aba durante a execucao da suite de testes e do fuzzing.
19. VARREDURA_CLIQUES_HTMLS_ADDON: Varredura automatizada nos 5 limites (inicio, -1 antes, fim, +1 depois, meio randomico) em todas as palavras de popup.html e options.html, ampliacao (2 cliques), desampliacao (3 cliques), expansao/retracao com Control e comprovacao da Regra de Ouro em modos formatado e texto puro.

### 4.2 Fuzzing Randomico por Tempo (1s/T por Categoria)
- Disponivel via funcao window.JusGovExecutarFuzzing(duracaoMsPorTipo) e botao "Fuzzing (1s/T)" na interface de Opcoes.
- Executa lacos temporais continuos gerando centenas de milhares de entidades randomicas para cada categoria:
  - Fuzzing de CPF (Modulo 11)
  - Fuzzing de CNPJ Tradicional
  - Fuzzing de Novo CNPJ Alfanumerico (ASCII - 48)
  - Fuzzing de Processo CNJ (Modulo 97 BigInt)
  - Fuzzing de Datas e Calendario Bissexto
  - Fuzzing de Posicoes de Cursor e Cliques em Fronteiras (-3 a len+3)

### 4.3 Ambiente de Desenvolvimento e IDE Silenciosa (Auto-Apply sem Abas Espurias)
- O ambiente do Antigravity IDE esta configurado com `antigravity.autoOpenFiles: false`, `antigravity.autoAcceptOnChat: true` e `chat.editing.autoAcceptDelay: 1`.
- Mudancas de codigo geradas pelo agente devem ser aplicadas de forma automatica e direta nos arquivos, sem provocar a abertura automatica de abas de revisao de diff ou editores na tela do usuario.

---

## 5. DIRETRIZES DE INTERFACE DO USUARIO (UI/UX FORENSE)

### 5.1 Proibicao Estrita de Jargoes Tecnicos de Desenvolvimento
- As interfaces visuais voltadas ao usuario (`options.html` e `popup.html`) destinam-se a operadores do direito (juizes, assessores, advogados e servidores).
- E expressamente proibido exibir jargoes de engenharia de software ou desenvolvimento interno, tais como `injecao precoce`, `document_start`, `Motor JS`, `Estilos CSS`, nomes de scripts `.js`/`.css` ou caminhos internos como `src/mod-pje/` e `src/mod-copia/`. Toda a comunicacao deve ser estritamente funcional e focada nos beneficios de produtividade forense.

### 5.2 Apontamento Informativo de Criterios Matematicos
- Nas mensagens de alerta flutuante de digitacao e na Central de Ajuda, manter exclusivamente a indicacao do criterio matematico objetivo (`Modulo 11` para CPF/CNPJ/NB-INSS, `Modulo 97` para CNJ, `Ano bissexto / dias validos` para datas), permitindo que o usuario compreenda a causa da inconsistencia sem sobrecarga tecnica.

### 5.2.1 Sistema Contextual Wiki Forense (Cartoes Verdes Informativos)
- Quando documentos forenses validos forem copiados, o motor visual projeta cartao informativo verde (`#f0fdf4`, borda `#22c55e`, texto `#166534`), sem destacar a selecao em amarelo:
  * **INSS (NB):** Valida digito verificador pelo Modulo 11 (pesos 2 a 9 da direita para a esquerda nos 9 primeiros digitos) tanto no formato pontuado `719.657.155-0` (`NNN.NNN.NNN-N` de 10 digitos) quanto no acoplado `31/6506589241`. Identifica a especie no Catalogo Oficial de 90+ especies (ex: `31 - Auxilio por Incapacidade Temporaria (RGPS - Contributivo - Ativo)`). Na mascara `31/6506589241`, 1 clique em `31` ou `/` seleciona o bloco integral; 1 clique no numero do beneficio seleciona somente ele (`6506589241`); 2 cliques selecionam o bloco integral. No formato pontuado `719.657.155-0`, 1 clique seleciona o bloco integral e exibe card Wiki com o Modulo 11 validado.
  * **CNJ (Processo Judicial):** Valida Modulo 97 (BigInt) e decodifica a estrutura `J.TR` identificando o ramo da justica (Federal, Trabalho, Estadual, etc.) e o tribunal/regiao correspondente (ex: `Justica Federal - TRF da 1ª Regiao`).
  * **CPF:** Valida Modulo 11 e decodifica a Regiao Fiscal da Receita Federal a partir do 9º digito (ex: `3ª Regiao Fiscal da RFB (CE, MA, PI)`).
  * **CNPJ:** Valida Modulo 11, identifica se e Matriz (`0001`) ou Filial e, no caso de filial, calcula e exibe deterministicamente o CNPJ da Matriz correspondente.

### 5.3 Padronizacao de Processos Judiciais Exemplo
- Todos os numeros de processo judicial de demonstracao na interface visual, no sandbox e nos testes devem obrigatoriamente iniciar com prefixo `099` e tribunal `.4.01.4002` (ou `.4.01.4000` na tabela comparativa), garantindo coerencia e clareza pedagogica.

### 5.4 Preservacao de Navegacao Nativa em Hiperlinks (`Ctrl + Clique`)
- Ao clicar segurando `Ctrl` sobre links nativos (`<a>`), o navegador preserva a abertura do hiperlink em segundo plano ou aciona o fluxo padrao sem ser interceptado pelo manipulador de selecao forense, garantindo compatibilidade universal com fluxos de navegacao web.

### 5.5 Ergonomia de Mascaras de IA (Atalho `F1`) e Restauracao Instantanea
- O campo de mascara customizada para o atalho `F1` possui alinhamento a esquerda (`text-align: left`) para facilitar a leitura e edicao de prompts juridicos complexos, acompanhado de botao de restauracao instantanea (icone de voltar no canto superior direito) para restabelecer a mascara padrao de fabrica sem necessidade de restaurar todas as demais configuracoes da extensao.

### 5.6 Ocultacao de Modulos Futuros Ate Disponibilidade Efetiva
- Secoes relativas a modulos futuros e arquitetura extensivel permanecem ocultadas da interface grafica ate sua efetiva disponibilizacao funcional, mantendo o painel despoluido e centrado nas ferramentas em producao.

### 5.7 Estabilidade Dimensional de Controles e Prevencao de Deslocamento de Texto
- O controle deslizante (slider) de "Nivel de Filtro de Estilos" possui container com dimensao estrita (380px), trilho de 130px e badge com largura fixa padronizada (210px), e o texto descritivo de ajuda posiciona-se integralmente abaixo da linha de controle, garantindo 100% de largura horizontal e prevenindo qualquer quebra de linha dinamica ou deslocamento vertical da interface ao mover o botao de correr.
- Os cartoes de selecao (<select>) na grade superior adotam empilhamento vertical balanceado com largura total (100%), impedindo que os menus transbordem alem da borda direita e conferindo espaco natural para a leitura do texto explicativo.

### 5.8 Captura e Expansao Cirurgica de Numeros com Sinal (+ ou -), Moedas e Percentuais
- Ao clicar sobre valores numericos contendo sinal unario explicito (+ ou -), sejam decimais (+0,25, -0,45), inteiros (+1, -50), pontuados (-1.233,00), percentuais (+0,25%, -10%) ou valores monetarios (R$ -1.000,00, R$ - 1.000,00, -R$ 1.000,00), o sistema captura o numero completo incluindo seu sinal de forma cirurgica.
- O clique direto sobre o sinal (+ ou -) antecedendo digito expande o bloco completo.
- O clique sobre o valor em quantias monetarias prefixadas por R$ extrai o numero assinado (-1.000,00) sem o prefixo R$, facilitando a colagem imediata em calculadoras e planilhas, enquanto 2 cliques ou clique sobre o R$ selecionam a expressao monetaria integral.

### 5.9 Nivel de Acessibilidade Textual: Configuracoes Leigas vs. Ajuda Tecnica com Tooltips
- Na aba 'Configuracoes e Listas de Sites', o texto deve ser o mais leigo possivel, traduzindo termos de desenvolvimento para linguagem acessivel ao usuario forense comum. Codigos HTML sao substituidos por sua expressao visual direta: negrito (em negrito), italico (em italico), sublinhado, tachado, subscrito, sobrescrito, paragrafos, citacoes e tabelas.
- Na aba 'Central de Ajuda', preserva-se a especificacao tecnica completa das tags ('b' (<b>), 'p' (<p>), 'table', etc.) e inclui-se obrigatoriamente tooltips multilinhas com cursor de ajuda em cada codigo para esclarecer detalhadamente a funcao de cada elemento.

### 5.10 Isolamento Estrito de Delimitadores Simetricos Adjacentes (2 Cliques)
- Ao simular ou executar cliques duplos em palavras comuns antecedendo expressoes delimitadas (como "completo (JSON)" ou "sobrescrito (ex: 1)"), o cursor sobre o corpo da palavra possui busca de borda restrita a zero (raioBusca = 0), prevenindo que o algoritmo de delimitadores salte sobre o espaco em branco e capture indevidamente blocos externos menores que a palavra alvo.
- A expansao de delimitadores simetricos para o escopo externo ocorre apenas quando o clique incide diretamente sobre o caractere delimitador ou sobre o espaco adjacente imediato (delta <= 1), ou quando a palavra esta estritamente aninhada dentro dos delimitadores.

### 5.11 Injecao Universal em Subframes, Documentos PDF e Deteccao Global de Selecao
- Subframes e Visualizadores de PDF (PDF.js, PJe, eproc, iframes, embeds):
  * Durante a navegacao web ou abertura de processos e documentos judiciais, o motor e injetado universalmente em todos os frames (`allFrames: true`), combinando declaracao nativa (`content_scripts`), monitoramento ativo de ciclo de vida (`webNavigation`), MutationObserver com deteccao de insercao e mutacao de atributos (`src`/`data`), inspecao local em iframes same-origin e captura de eventos `load` em subframes com retentativas temporizadas assincronas (250ms e 800ms).
  * Camadas de texto de documentos PDF (`.textLayer`, `.pdfViewer`, `.page`, `[data-page-number]`, `embed[type*="pdf"]`, etc.) pertencem estritamente ao dominio de `LEITURA_COMUM`, sendo vedado classifica-las como controles de sistema ou des-seleciona-las arbitrariamente.
  * Deteccao Global de Selecao: Qualquer selecao ativa de texto na tela (seja gerada por arrasto de mouse, atalhos de teclado como Shift+Setas ou selecoes nativas de visualizadores) e identificada globalmente via `selectionchange` (com debounce de 120ms) e imediatamente processada pelo motor (higienizacao, formatacao no nivel configurado, copia para a Area de Transferencia, validacao matematica com alerta e contorno visual com Flash Verde), sem interferir em campos de digitacao protegidos pela Regra de Ouro.

---
