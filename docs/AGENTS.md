# Protocolos Operacionais do Agente Antigravity - JusGovBR
Projeto: JusGovBR - Cópia Inteligente & PJe Turbo
Finalidade: Regras de automação, conduta e carregamento de contexto para o agente de IA neste workspace.

> [!NOTE]
> ### 🧭 AUTO-DESCRIÇÃO E DIRETRIZ DE REÚSO PARA NOVOS PROJETOS
> - **Identificação do Arquivo:** `docs/AGENTS.md`
> - **Finalidade Primária:** Espelho canônico e portável de governança da IA dentro do diretório `docs/`, garantindo sobrevivência das instruções fora de IDEs específicas.
> - **Papel na Governança e Inteligência da IA:** Permite que subagentes, revisores externos ou LLMs em linha de comando carreguem exatamente as mesmas diretrizes de workspace.
> - **Reaproveitamento em Novos Projetos:**
>   - *Comando de Ativação:* Copie para `docs/AGENTS.md` no novo projeto.
>   - *Núcleo Perpétuo Reutilizável (DNA do Autor):* 100% reutilizável de imediato em paridade com `.agents/rules/REGRAS_WORKSPACE.md`.
>   - *Seções Específicas de Domínio (A Adaptar):* Apenas o nome do projeto no cabeçalho.


## 1. Carregamento Obrigatório de Contexto (Onde Ler Primeiro)
- Ao iniciar uma nova sessão ou receber qualquer comando, consulte imediatamente o índice central em:
  [`00_INDICE_GERAL.md`](00_INDICE_GERAL.md)
- Este índice é o **roteador semântico** do projeto. Ele indica o arquivo exato para cada objetivo, economizando tokens e evitando a leitura desnecessária de múltiplos arquivos.

## 2. Governança do Fluxo de Trabalho: Fila Obrigatória de Backlog e Deliberação Prévia (Diretriz Root 1)
- **Fila Obrigatória de Backlog:** Toda e qualquer solicitação, nova funcionalidade, alteração comportamental, refatoração ou reporte de bug enviado pelo usuário no chat deve obrigatoriamente entrar na fila de coisas a fazer em [`03_BACKLOG_TAREFAS_E_FEATURES.md`](03_BACKLOG_TAREFAS_E_FEATURES.md).
- **Proibição Inegociável de Implementação Imediata:** NUNCA IMPLEMENTAR NA MESMA HORA. É expressamente proibido ao agente alterar arquivos de código de produção (`src/`, `manifest.json`, etc.) imediatamente ao receber a mensagem de solicitação.
- **Comportamento Imediato do Agente:**
  1. Exibir com clareza o entendimento técnico da solicitação, especificando o escopo, impacto arquitetural e plano de ação;
  2. Salvar imediatamente (sem confirmação prévia para salvar na documentação) a proposta nos arquivos competentes de documentação e backlog;
  3. Aguardar o direcionamento do usuário (caso ele queira alterar ou ajustar algo antes de codificar).
- **Gatilho de Execução:** Apenas quando o usuário enviar expressamente o comando "implementar" (ou gatilho inequívoco de codificação), o código de produção é alterado e os testes são executados.
- **Controle Dinâmico de Prioridades:** O agente atribui a prioridade técnica das tarefas (Alta, Média, Baixa) no Backlog com base nas melhores práticas de engenharia de software. Caso o usuário solicite a mudança de prioridade, a solicitação prevalece e o agente deve sinalizar expressamente na tabela de pendências: `[Prioridade Alterada pelo Usuário]`.

## 3. Padrão Visual Obrigatório de Resposta (Diretriz Root 13)
- Todas as respostas com planos, relatórios parciais ou conclusões devem utilizar o formato estruturado em tabelas Markdown:
  - Tabela `📋 Próximas ações pendentes` (com colunas `# | ID / Seção | Tipo | Prioridade | Descrição da Pendência | Próximo Passo`), onde a coluna `Prioridade` exibe o nível técnico avaliado (Alta, Média, Baixa) e, quando alterada pelo usuário, a tag explícita `[Prioridade Alterada pelo Usuário]`;
  - Tabela `✅ Ações implementadas` (com colunas `Item / Arquivo | Tipo de Ação | Detalhamento da Solução`);
  - Seguidas de tópicos objetivos e hierárquicos com links clicáveis para os arquivos.

## 4. Reúso Estrito dos Utilitários em `util/` (Economia Máxima de Tokens)
- Sempre utilize os scripts prontos de terminal em `util/` em vez de reescrever lógica no chat ou inventar comandos alternativos:
  - `powershell -ExecutionPolicy Bypass -File util/verificar_codificacao.ps1` (Valida UTF-8, entidades e links MD);
  - `powershell -ExecutionPolicy Bypass -File util/executar_auditoria.ps1` (Executa os 290 testes headless V8);
  - `powershell -ExecutionPolicy Bypass -File util/fazer_backup.ps1` (Gera backup versionado e sincroniza o README.md);
  - `powershell -ExecutionPolicy Bypass -File util/gerar_exemplos_js.ps1` (Compila `exemplos.json` para `exemplos.js`).

## 5. Portabilidade entre Máquinas (Novo Computador)
- Ao abrir este repositório em um computador novo pela primeira vez:
  1. Execute `powershell -ExecutionPolicy Bypass -File util/configurar_ambiente.ps1` (ou `.bat`) para restaurar preferências de máquina, Git e extensões da IDE de forma idempotente.
  2. As configurações locais do workspace já estão gravadas em `.vscode/settings.json`, e as preferências globais da IDE estão espelhadas em `.vscode/settings.json.global`.

## 6. Escopo Canônico de Empacotamento do Chrome (Diretriz Root 15)
- **Cópia Online no Chrome (`Z:\AddonChrome-GovBR.chrome`) e Soberania de Dev:** O workspace atual (`Z:\AddonChrome-GovBR`) é a **Fonte Única da Verdade** (`manifest.json` + `src/`) e manda de forma absoluta. "Sincronizar" é estritamente postar/publicar arquivos de Dev ➔ `Z:\AddonChrome-GovBR.chrome`. NUNCA arquivos virão de lá para cá, e NUNCA arquivos locais serão deletados por não existirem lá. Reversões ("voltar o que era antes") ocorrem via Git/backups locais de `bkp/`.
- O código final do addon é composto **EXCLUSIVAMENTE** por `manifest.json` na raiz e pela pasta `src/`.
- As pastas `docs/`, `util/`, `bkp/`, `tmp/` e arquivos `.md` são de governança interna e nunca devem ser referenciados dentro do `manifest.json`.

## 7. Integridade de Codificação e Preservação de Comentários
- Codificação: Estritamente UTF-8 nativo sem BOM em todos os arquivos. Entidades HTML são proibidas.
- Comentários: É terminantemente proibido apagar, resumir ou reduzir comentários técnicos. Todo método deve conter a explicação do *porquê* e os passos de reconstrução do zero (Diretriz Root 14).

## 8. Boas Práticas em POO e Resiliência JavaScript (Diretriz Root 16)
- **Pilares de POO:** Responsabilidade Única (SRP), Composição sobre Herança, Inversão de Dependência (DIP) e Economia de Tokens em Diretório Plano Único (`src/mod-copia/` sem subpastas).
- **Tolerância a Falhas e Padrão Null Object:** Injeção de dependência opcional com blindagem preventiva: caso qualquer arquivo, módulo ou classe filha seja excluído fisicamente ou desabilitado, o JavaScript jamais pode lançar `TypeError: Cannot read properties of undefined/null`. A classe principal deve usar fallbacks seguros (Null Object Pattern com métodos no-op estáveis).
