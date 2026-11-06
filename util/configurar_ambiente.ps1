<#
 ==============================================================================
 SCRIPT: util/configurar_ambiente.ps1
 PROJETO: JusGovBR — Seleção & Cópia Inteligente + PJe Turbo
 AUTOR/CONTATO: smarca@gmail.com
 
 ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE USO (BLUEPRINT):
 1) FINALIDADE PRIMÁRIA:
    Script idempotente de restauração e configuração do ambiente de desenvolvimento
    em novas máquinas (portabilidade e onboarding imediato / Diretriz Root 8).
 2) ESCOPO OPERACIONAL:
    - (1) Copia '.vscode/settings.json.global' para o settings.json da IDE do usuário.
    - (2) Ajusta configurações globais do Git (merge preferindo local, sem editor externo).
    - (3) Configura variáveis de ambiente do usuário.
    - (4) Configura o caminho 'git.path' do MinGit caso o Git não esteja no PATH global.
 3) QUANDO UTILIZAR:
    - Uma única vez ao abrir o repositório em um novo computador ou após reinstalação da IDE.
 ==============================================================================
#>

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

# 5. Extensoes da IDE (restauradas a partir do catalogo do projeto)
$extensoes = @(
    "ms-ceintl.vscode-language-pack-pt-br",
    "ms-vscode.powershell"
)
$ideCmd = Get-Command antigravity-ide.cmd, code.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
if ($ideCmd) {
    foreach ($ext in $extensoes) {
        Write-Host "Garantindo extensao instalada: $ext ..."
        & $ideCmd.Source --install-extension $ext --force
    }
} else {
    Write-Host "Comando da IDE nao encontrado no PATH para instalacao automatica de extensoes. Elas constam em .vscode/extensions.json." -ForegroundColor Yellow
}

Write-Host "Ambiente configurado. Reinicie a IDE (Reload Window) para aplicar." -ForegroundColor Green

