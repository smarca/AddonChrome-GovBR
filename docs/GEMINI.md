# Protocolos Operacionais do Agente Antigravity - JusGovBR
Projeto: JusGovBR - Cópia Inteligente & PJe Turbo
Finalidade: Regras de automação, conduta e carregamento de contexto para o agente de IA neste workspace.

> [!NOTE]
> ### 🧭 AUTO-DESCRIÇÃO E DIRETRIZ DE REÚSO PARA NOVOS PROJETOS
> - **Identificação do Arquivo:** `docs/GEMINI.md`
> - **Finalidade Primária:** Documento satélite de compatibilidade contendo protocolos operacionais e regras de carregamento de contexto da IA.
> - **Papel na Governança e Inteligência da IA:** Garantia de descoberta e conformidade operacional para agentes ou ferramentas que utilizem o padrão GEMINI.md.
> - **Reaproveitamento em Novos Projetos:**
>   - *Comando de Ativação:* Mantido como espelho de governança de `docs/AGENTS.md`.
>   - *Núcleo Perpétuo Reutilizável (DNA do Autor):* 100% reutilizável como cópia de governança.


## 1. Carregamento Obrigatório de Contexto (Onde Ler Primeiro)
- Ao iniciar uma nova sessão ou receber qualquer comando, consulte imediatamente o índice central em:
  [`00_INDICE_GERAL.md`](00_INDICE_GERAL.md)
- Este índice é o **roteador semântico** do projeto. Ele indica o arquivo exato para cada objetivo, economizando tokens e evitando a leitura desnecessária de múltiplos arquivos.

## 2. Padrão Visual Obrigatório de Resposta (Diretriz Root 13)
- Todas as respostas com planos, relatórios parciais ou conclusões devem utilizar o formato estruturado em tabelas Markdown:
  - Tabela `📋 Próximas ações pendentes` (com colunas `# | ID / Seção | Tipo | Descrição da Pendência | Próximo Passo`);
  - Tabela `✅ Ações implementadas` (com colunas `Item / Arquivo | Tipo de Ação | Detalhamento da Solução`);
  - Seguidas de tópicos objetivos e hierárquicos com links clicáveis para os arquivos.

## 3. Reúso Estrito dos Utilitários em `util/` (Economia Máxima de Tokens)
- Sempre utilize os scripts prontos de terminal em `util/` em vez de reescrever lógica no chat ou inventar comandos alternativos:
  - `powershell -ExecutionPolicy Bypass -File util/verificar_codificacao.ps1` (Valida UTF-8, entidades e links MD);
  - `powershell -ExecutionPolicy Bypass -File util/executar_auditoria.ps1` (Executa os 290 testes headless V8);
  - `powershell -ExecutionPolicy Bypass -File util/fazer_backup.ps1` (Gera backup versionado e sincroniza o README.md);
  - `powershell -ExecutionPolicy Bypass -File util/gerar_exemplos_js.ps1` (Compila `exemplos.json` para `exemplos.js`).

## 4. Portabilidade entre Máquinas (Novo Computador)
- Ao abrir este repositório em um computador novo pela primeira vez:
  1. Execute `powershell -ExecutionPolicy Bypass -File util/configurar_ambiente.ps1` (ou `.bat`) para restaurar preferências de máquina, Git e extensões da IDE de forma idempotente.
  2. As configurações locais do workspace já estão gravadas em `.vscode/settings.json`, e as preferências globais da IDE estão espelhadas em `.vscode/settings.json.global`.

## 5. Escopo Canônico de Empacotamento do Chrome (Diretriz Root 15)
- O código final do addon é composto **EXCLUSIVAMENTE** por `manifest.json` na raiz e pela pasta `src/`.
- As pastas `docs/`, `util/`, `bkp/`, `tmp/` e arquivos `.md` são de governança interna e nunca devem ser referenciados dentro do `manifest.json`.

## 6. Integridade de Codificação e Preservação de Comentários
- Codificação: Estritamente UTF-8 nativo sem BOM em todos os arquivos. Entidades HTML são proibidas.
- Comentários: É terminantemente proibido apagar, resumir ou reduzir comentários técnicos. Todo método deve conter a explicação do *porquê* e os passos de reconstrução do zero (Diretriz Root 14).
