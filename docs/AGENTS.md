# Antigravity Agent Guidelines for JusGovBR

## Automated Code Changes and Editor Non-Intrusiveness
- Never request manual approval or open file review tabs in the IDE for routine code modifications.
- Apply all changes directly and automatically to the workspace files.
- Keep the editor clean: do not trigger automatic opening of editor tabs on file updates.
- All code files, tests, scripts, and documentation must strictly adhere to standard UTF-8 encoding. Use direct accented characters (ç, ã, é, etc.) natively in code and templates; HTML entities (such as &ccedil;, &otilde;, &eacute;) are strictly prohibited in UI and source code, except strictly inside regex or HTML parsing masks.
- All deterministic tests in the headless test suite must pass 100% on every modification.
- All instructional markdown files (.md) must reside strictly within docs/ in the project root and must be loaded.
- Whenever the global IDE `User\settings.json` (C:\Users\smarc\AppData\Roaming\Antigravity IDE\User\settings.json) is modified, immediately copy it to `.vscode/settings.json.global` in the project. `util/fazer_backup.ps1` also does this copy automatically on every backup.
- All essential helper scripts (audit runner, encoding verifier, backup, diff, patch) live strictly in `util/`; the old `testes/` folder no longer exists.
- All temporary/scratch/log files (including headless Chrome test outputs like `chrome_output.txt`) must be created strictly within `tmp/` (excluded from backups). Any folder named `outros` is also excluded from backups. Running `util/fazer_backup.ps1` automatically cleans `tmp/` and includes all dot-prefixed configuration files/folders (such as `.vscode/` and `.gitignore`, excluding only `.git/`).
- **Visual Format Standard for Pending & Implemented Actions:** Whenever presenting pending actions, implementation plans, or completed action summaries to the user, ALWAYS use the structured Markdown table format (`📋 Próximas ações pendentes` / `✅ Ações implementadas` with columns `# | Descrição | Área`) followed by a concise bulleted summary of key details.


