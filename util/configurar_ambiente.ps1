# SCRIPT DE CONFIGURACAO DO AMBIENTE EM UM NOVO COMPUTADOR - JUSGOVBR
# Aplica as preferencias do projeto e da IDE que nao viajam junto com a pasta:
# (1) settings.json global da IDE (a partir de .vscode/settings.json.global);
# (2) configuracoes globais do Git (sincronizacao preferindo arquivos locais, sem editor externo);
# (3) variaveis de ambiente do usuario;
# (4) git.path do MinGit, quando o git nao estiver no PATH.
# Idempotente: pode ser executado quantas vezes for necessario.
[CmdletBinding()]
param()

$utilDir = $PSScriptRoot
$baseDir = (Get-Item $utilDir).Parent.FullName
$vscodeDir = Join-Path $baseDir ".vscode"

# 1. Localizar git.exe
$gitExe = $null
$cmd = Get-Command git.exe -ErrorAction SilentlyContinue
if ($cmd) { $gitExe = $cmd.Source }
if (-not $gitExe) {
    $minGit = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter "git.exe" -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match '\\cmd\\git\.exe$' } | Select-Object -First 1
    if ($minGit) { $gitExe = $minGit.FullName }
}
if (-not $gitExe) {
    Write-Warning "git.exe nao encontrado. Instale o Git (winget install Git.MinGit) e execute novamente."
    exit 1
}
Write-Host "Git: $gitExe"

# 2. Configuracoes globais do Git
& $gitExe config --global pull.rebase false
& $gitExe config --global pull.ff false
& $gitExe config --global merge.ours.driver true
& $gitExe config --global merge.autoEdit false
& $gitExe config --global core.mergeoptions "--no-edit"
& $gitExe config --global push.autoSetupRemote true
& $gitExe config --global user.name "Silmar A. Marca"
& $gitExe config --global user.email "smarca@gmail.com"
& $gitExe config --global --add safe.directory $baseDir.Replace('\', '/')
Write-Host "Configuracoes globais do Git aplicadas."

# 3. Variaveis de ambiente do usuario
[Environment]::SetEnvironmentVariable("GIT_MERGE_AUTOEDIT", "no", "User")
[Environment]::SetEnvironmentVariable("GIT_EDITOR", "true", "User")

# 4. settings.json global da IDE (restaurado a partir de .vscode/settings.json.global)
$origemGlobal = Join-Path $vscodeDir "settings.json.global"
$destinoGlobal = Join-Path $env:APPDATA "Antigravity IDE\User\settings.json"
if (Test-Path $origemGlobal) {
    $destinoDir = Split-Path $destinoGlobal -Parent
    if (-not (Test-Path $destinoDir)) { New-Item -Path $destinoDir -ItemType Directory -Force | Out-Null }
    if (Test-Path $destinoGlobal) {
        Copy-Item $destinoGlobal "$destinoGlobal.bak" -Force
    }
    Copy-Item $origemGlobal $destinoGlobal -Force
    Write-Host "settings.json global restaurado em: $destinoGlobal (backup .bak do anterior)"
} else {
    Write-Warning ".vscode\settings.json.global nao encontrado; configuracoes globais da IDE nao restauradas."
}

Write-Host "Ambiente configurado. Reinicie a IDE (Reload Window) para aplicar." -ForegroundColor Green

