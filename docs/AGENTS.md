# Antigravity Agent Guidelines for JusGovBR

## Automated Code Changes and Editor Non-Intrusiveness
- Never request manual approval or open file review tabs in the IDE for routine code modifications.
- Apply all changes directly and automatically to the workspace files.
- Keep the editor clean: do not trigger automatic opening of editor tabs on file updates.
- All code files, tests, scripts, and documentation must strictly adhere to standard UTF-8 encoding. Use direct accented characters (ç, ã, é, etc.) natively in code and templates; HTML entities (such as &ccedil;, &otilde;, &eacute;) are strictly prohibited in UI and source code, except strictly inside regex or HTML parsing masks.
- All deterministic tests in the headless test suite must pass 100% on every modification.
- All instructional markdown files (.md) must reside strictly within docs/ in the project root and must be loaded.
- All temporary files must be placed within tmp/ (excluded from backups). Any folder named 'outros' is also excluded from backups.

