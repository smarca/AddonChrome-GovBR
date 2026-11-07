# SITEMAP E GUIA OPERACIONAL DA PASTA UTIL - JUSGOVBR

> [!NOTE]
> ### 🧭 AUTO-DESCRIÇÃO E DIRETRIZ DE REÚSO PARA NOVOS PROJETOS
> - **Identificação do Arquivo:** `util/AGENTS.md`
> - **Padrão Arquitetural Oficial:** Formato hierárquico nativo do Google Antigravity / Gemini CLI (`AGENTS.md`).
> - **Finalidade Primária:** Sitemap executivo e índice de descoberta instantânea de toda a caixa de ferramentas de scripts em `util/`, eliminando a necessidade de a IA ler o código interno de cada script para compreender como executá-los.
> - **Papel na Governança e Economia de Tokens da IA:**
>   - *Carga Rápida Contextual:* Ao navegar ou operar na pasta `util/`, o agente de IA consulta este índice conciso em $O(1)$, economizando tokens de contexto.
>   - *Prevenção de Duplicidade:* Impede a recriação inadvertida de utilitários já existentes.
> - **Reaproveitamento em Novos Projetos:**
>   - *Comando de Ativação:* Ao iniciar outro projeto, declare: `"vou iniciar um novo projeto do zero..."`.
>   - *Núcleo Perpétuo Reutilizável (DNA do Autor):* Scripts universais de backup (`fazer_backup.ps1`), validação de codificação (`verificar_codificacao.ps1`), auditoria headless (`executar_auditoria.ps1`) e configuração de ambiente (`configurar_ambiente.ps1`).

---

## 🛠️ CATÁLOGO EXECUTIVO DE FERRAMENTAS (`util/`)

A tabela abaixo relaciona os **18 scripts mantidos**, seus comandos de invocação em linha única, tempo médio de resposta e gatilhos de uso:

| Script / Arquivo | Comando em 1 Linha | Tempo Médio | Finalidade Operacional e Gatilhos de Uso |
| :--- | :--- | :---: | :--- |
| [`executar_auditoria.ps1`](file:///z:/AddonChrome-GovBR/util/executar_auditoria.ps1) | `powershell -ExecutionPolicy Bypass -File util/executar_auditoria.ps1` | ~4s | **Auditoria Headless V8:** Valida a sintaxe estrita dos 32 arquivos JS e executa os 460 testes funcionais. Rodar antes de commits, backups e deploys. |
| [`verificar_codificacao.ps1`](file:///z:/AddonChrome-GovBR/util/verificar_codificacao.ps1) | `powershell -ExecutionPolicy Bypass -File util/verificar_codificacao.ps1 [-Arquivos "path"]` | ~0.1s a ~1.5s | **Auditor de Codificação:** Garante UTF-8 sem BOM, sem Mojibake, sem entidades HTML e sem links MD quebrados. Suporta parâmetro `-Arquivos` para validar apenas arquivos modificados pontualmente. |
| [`fazer_backup.ps1`](file:///z:/AddonChrome-GovBR/util/fazer_backup.ps1) | `powershell -ExecutionPolicy Bypass -File util/fazer_backup.ps1` | ~3s | **Backup com Rotação GFS:** Incrementa versão no `manifest.json`, limpa `tmp/`, sincroniza `settings.json` e compacta o repositório em `bkp/`. |
| [`backup.bat`](file:///z:/AddonChrome-GovBR/util/backup.bat) | `util\backup.bat` | ~3s | **Atalho Rápido CLI:** Invoca `fazer_backup.ps1` diretamente no terminal CMD com repasse de parâmetros opcionais (`/Fix`, `/Patch`, etc.). |
| [`fazer_backup.bat`](file:///z:/AddonChrome-GovBR/util/fazer_backup.bat) | `util\fazer_backup.bat` | ~3s | **Atalho Interativo:** Executa o backup com comando `pause` ao final para visualização no Windows Explorer. |
| [`postar_chrome.ps1`](file:///z:/AddonChrome-GovBR/util/postar_chrome.ps1) | `powershell -ExecutionPolicy Bypass -File util/postar_chrome.ps1` | ~1s | **Deploy Unidirecional (Push-Only):** Copia exclusivamente `manifest.json` e a pasta `src/` para a extensão online ativa em `Z:\AddonChrome-GovBR.chrome`. |
| [`limpar_git.ps1`](file:///z:/AddonChrome-GovBR/util/limpar_git.ps1) | `powershell -ExecutionPolicy Bypass -File util/limpar_git.ps1` | ~4s | **Reset Limpo do Git:** Consolida o repositório em 1 commit inicial limpo (`v<versao>`), força push ao GitHub e sincroniza `Z:\AddonChrome-GovBR.chrome` sob comando expresso (`"limpar git"`). |
| [`configurar_ambiente.ps1`](file:///z:/AddonChrome-GovBR/util/configurar_ambiente.ps1) | `powershell -ExecutionPolicy Bypass -File util/configurar_ambiente.ps1` | ~2s | **Setup Idempotente de PC:** Configura Git global, variáveis de ambiente e restaura settings da IDE ao abrir o projeto em novo computador. |
| [`configurar_ambiente.bat`](file:///z:/AddonChrome-GovBR/util/configurar_ambiente.bat) | `util\configurar_ambiente.bat` | ~2s | **Atalho Interativo:** Invoca `configurar_ambiente.ps1` com pausa ao final para duplo clique no Explorer. |
| [`gerar_exemplos_js.ps1`](file:///z:/AddonChrome-GovBR/util/gerar_exemplos_js.ps1) | `powershell -ExecutionPolicy Bypass -File util/gerar_exemplos_js.ps1` | ~1s | **Compilador do Catálogo (Build):** Compila o centralizador `src/cfg/exemplos.json` (ADR-005) gerando `src/cfg/exemplos.js` com `Object.freeze` profundo. |
| [`verificar_ids.ps1`](file:///z:/AddonChrome-GovBR/util/verificar_ids.ps1) | `powershell -ExecutionPolicy Bypass -File util/verificar_ids.ps1` | ~1s | **Linter Estático de UI:** Valida se todos os IDs capturados via `getElementById` em `options.js` existem fisicamente declarados em `options.html`. |
| [`gerar_diff.ps1`](file:///z:/AddonChrome-GovBR/util/gerar_diff.ps1) | `powershell -ExecutionPolicy Bypass -File util/gerar_diff.ps1` | ~2s | **Gerador de Diff Unificado:** Compara o workspace contra o último `.zip` de `bkp/` ou entre dois arquivos específicos. |
| [`gerar_diff.bat`](file:///z:/AddonChrome-GovBR/util/gerar_diff.bat) | `util\gerar_diff.bat` | ~2s | **Atalho Interativo:** Invoca `gerar_diff.ps1` com pausa. |
| [`diff.bat`](file:///z:/AddonChrome-GovBR/util/diff.bat) | `util\diff.bat arq1 arq2` | ~1s | **Wrapper de Diff:** Chama diretamente o binário `diff.exe` do MinGit para comparação rápida. |
| [`aplicar_patch.ps1`](file:///z:/AddonChrome-GovBR/util/aplicar_patch.ps1) | `powershell -ExecutionPolicy Bypass -File util/aplicar_patch.ps1 arq.patch` | ~2s | **Motor de Patch:** Aplica patches em formato Git/GNU com resolução automática de caminhos e backup prévio em `tmp/`. |
| [`aplicar_patch.bat`](file:///z:/AddonChrome-GovBR/util/aplicar_patch.bat) | `util\aplicar_patch.bat arq.patch` | ~2s | **Atalho Interativo:** Invoca `aplicar_patch.ps1` com pausa. |
| [`validar_sintaxe_v8.html`](file:///z:/AddonChrome-GovBR/util/validar_sintaxe_v8.html) | *(Usado por `executar_auditoria.ps1`)* | N/A | **Runner de Sintaxe V8:** Página HTML carregada em modo headless para auditar dinamicamente a compilação dos 32 scripts JS de `src/`. |
| [`executar_testes.html`](file:///z:/AddonChrome-GovBR/util/executar_testes.html) | *(Usado por `executar_auditoria.ps1`)* | N/A | **Runner de Testes Funcionais:** Página HTML que instancia o ambiente, carrega os 4 módulos e dispara `JusGovExecutarAuditoria()`. |

---

## 🚫 REGRA DE HIGIENE E ARQUIVOS TEMPORÁRIOS (`tmp/` vs `util/`)

Em cumprimento à **Diretriz Root 8**:
1. **É TERMINANTEMENTE PROIBIDO CRIAR ARQUIVOS RASCUNHO OU TEMPORÁRIOS EM `util/`:**
   - Scripts de teste descartável (como checagens pontuais de strings, diagnósticos ad-hoc ou conversores de uso único) devem ser criados exclusivamente na pasta [`tmp/`](file:///z:/AddonChrome-GovBR/tmp/).
   - A pasta `tmp/` é excluída do controle de versão e do backup, e é limpa automaticamente a cada execução de [`fazer_backup.ps1`](file:///z:/AddonChrome-GovBR/util/fazer_backup.ps1).
2. **Critério para Permanência em `util/`:**
   - Apenas scripts com finalidade operacional recorrente, documentados neste índice e com cabeçalho explicativo completo podem residir em `util/`.

