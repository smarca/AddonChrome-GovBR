# SCRIPT OFICIAL DE BACKUP PADRONIZADO - JUSGOVBR
# Formato: bkp/bkp_AAAA-MM-DD_HH-MM.zip
[CmdletBinding()]
param()

$utilDir = $PSScriptRoot
$baseDir = (Get-Item $utilDir).Parent.FullName
$bkpDir = Join-Path $baseDir "bkp"

if (-not (Test-Path $bkpDir)) {
    New-Item -Path $bkpDir -ItemType Directory -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$zipNome = "bkp_${timestamp}.zip"
$zipDestino = Join-Path $bkpDir $zipNome

Write-Host "Iniciando backup em: $zipDestino"

# 1. Limpeza automatica de arquivos temporarios (pasta tmp)
$tmpDir = Join-Path $baseDir "tmp"
if (Test-Path $tmpDir) {
    Write-Host "Limpando arquivos temporarios em: $tmpDir" -ForegroundColor DarkGray
    Get-ChildItem -Path $tmpDir -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
} else {
    New-Item -Path $tmpDir -ItemType Directory -Force | Out-Null
}

# 1.1 Copia do settings.json global da IDE (pasta User) para .vscode/settings.json.global
# (garante que as configuracoes globais entrem no backup e no Git)
$settingsGlobal = Join-Path $env:APPDATA "Antigravity IDE\User\settings.json"
$vscodeDir = Join-Path $baseDir ".vscode"
if (Test-Path $settingsGlobal) {
    if (-not (Test-Path $vscodeDir)) { New-Item -Path $vscodeDir -ItemType Directory -Force | Out-Null }
    Copy-Item -Path $settingsGlobal -Destination (Join-Path $vscodeDir "settings.json.global") -Force
    Write-Host "settings.json global copiado para .vscode\settings.json.global" -ForegroundColor DarkGray
}

# 2. Seleciona todos os itens da raiz, aplicando os filtros estritos:
# - Inclui arquivos e pastas de configuracao iniciados por '.' (ex: .vscode, .gitignore, etc.)
# - Exclui apenas a pasta interna de controle do Git (.git)
# - Exclui a pasta bkp
# - Exclui arquivos e pastas iniciados por 'leia-me' (case-insensitive)
# - Exclui arquivos temporarios e pastas 'tmp' (nao sujeitos a backup)
# - Exclui pastas 'outros' (fora do backup)
$itens = Get-ChildItem -Path $baseDir -Force | Where-Object {
    $nome = $_.Name
    if ($nome -ieq "bkp") { return $false }
    if ($nome -ieq ".git") { return $false }
    if ($nome -ilike "leia-me*") { return $false }
    if ($nome -ieq "tmp") { return $false }
    if ($nome -ieq "outros") { return $false }
    return $true
} | ForEach-Object { $_.FullName }

if ($itens.Count -eq 0) {
    Write-Warning "Nenhum arquivo encontrado para backup."
    exit 1
}

# Cria o arquivo ZIP
Compress-Archive -Path $itens -DestinationPath $zipDestino -Force

if (Test-Path $zipDestino) {
    $info = Get-Item $zipDestino
    $tamanhoKB = [math]::Round($info.Length / 1KB, 2)
    Write-Host "Backup concluido com sucesso!" -ForegroundColor Green
    Write-Host "Arquivo: $($info.Name)"
    Write-Host "Tamanho: $tamanhoKB KB"
    Write-Host "Caminho: $($info.FullName)"
} else {
    Write-Error "Falha ao gerar o arquivo de backup."
    exit 1
}
