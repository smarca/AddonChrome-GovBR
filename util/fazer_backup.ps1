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

# Seleciona todos os itens da raiz, aplicando os filtros estritos:
# - Exclui a pasta bkp
# - Exclui arquivos e pastas iniciados por '.'
# - Exclui arquivos e pastas iniciados por 'leia-me' (case-insensitive)
# - Exclui arquivos temporarios e pastas 'tmp' (nao sujeitos a backup)
# - Exclui pastas 'outros' (fora do backup)
$itens = Get-ChildItem -Path $baseDir | Where-Object {
    $nome = $_.Name
    if ($nome -ieq "bkp") { return $false }
    if ($nome.StartsWith(".")) { return $false }
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
