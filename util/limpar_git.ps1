<#
 ==============================================================================
 SCRIPT: util/limpar_git.ps1
 PROJETO: JusGovBR — Seleção & Cópia Inteligente + PJe Turbo
 AUTOR/CONTATO: smarca@gmail.com
 
 ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE USO (BLUEPRINT):
 1) FINALIDADE PRIMÁRIA:
    Script oficial disparado pelos comandos "limpar git" ou "limpar github" para
    eliminar completamente o histórico de commits do repositório local e remoto
    (GitHub), iniciando uma nova linha do tempo limpa a partir do zero com
    exatamente 1 único commit inicial consolidado.
 2) GARANTIAS INEGOCIÁVEIS:
    - Todos os arquivos existentes no workspace (código, testes, documentação em
      docs/, anotações de bugs, features pendentes no backlog e utilitários) são
      preservados integralmente no novo commit inicial.
    - O repositório remoto no GitHub ('origin/main') e o repositório local
      ('Z:\AddonChrome-GovBR') ficam sincronizados com 1 único commit raiz.
    - A pasta de extensão online ('Z:\AddonChrome-GovBR.chrome') é sincronizada
      para o mesmo commit inicial, garantindo limpeza em todos os repositórios.
 3) GATILHOS OPERACIONAIS:
    - Disparado sob os comandos expressos: "limpar git", "limpar github".
 ==============================================================================
#>

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$scriptDir = $PSScriptRoot
$repoDev = (Get-Item $scriptDir).Parent.FullName
$repoChrome = "Z:\AddonChrome-GovBR.chrome"
$manifestPath = Join-Path $repoDev "manifest.json"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "JUSGOVBR — REINICIALIZAÇÃO COMPLETA DO HISTÓRICO GIT" -ForegroundColor Cyan
Write-Host "Comando: 'limpar git' / 'limpar github'" -ForegroundColor Cyan
Write-Host "Ambiente Mestre (Dev) : $repoDev" -ForegroundColor Yellow
Write-Host "Ambiente Online Chrome: $repoChrome" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Passo 1: Obter versao atual em manifest.json
$versao = "261106.4.14"
if (Test-Path $manifestPath) {
    $conteudoManifest = Get-Content $manifestPath -Raw
    if ($conteudoManifest -match '"version":\s*"([^"]+)"') {
        $versao = $matches[1]
    }
}
$msgCommit = "feat: initial commit - JusGovBR v$versao"

# Passo 2: Executar auditoria de integridade antes do reset
$scriptAuditoria = Join-Path $scriptDir "executar_auditoria.ps1"
if (Test-Path $scriptAuditoria) {
    Write-Host "[1/6] Executando auditoria automatizada Chromium Headless..." -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File $scriptAuditoria
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO CRÍTICO] A auditoria falhou. Abortando reinicialização do Git!" -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Auditoria 100% aprovada." -ForegroundColor Green
}

# Passo 3: Reiniciar historico na Fonte Mestra (Z:\AddonChrome-GovBR)
Set-Location $repoDev
Write-Host "[2/6] Criando branch orfa 'temp_limpar_git' no repositorio mestre..." -ForegroundColor Cyan
git checkout --orphan temp_limpar_git

Write-Host "[3/6] Adicionando todos os arquivos de codigo, testes, bugs e backlog..." -ForegroundColor Cyan
git add -A

Write-Host "[4/6] Criando commit inicial unico: '$msgCommit'..." -ForegroundColor Cyan
git commit -m $msgCommit

Write-Host "[5/6] Substituindo branch 'main' e forçando sincronização com GitHub..." -ForegroundColor Cyan
git branch -D main
git branch -m main
git push -f origin main

Write-Host "[OK] Repositorio remoto no GitHub reiniciado com 1 unico commit!" -ForegroundColor Green

# Passo 4: Coleta de lixo agressiva no Git local para expurgar commits antigos
Write-Host "[6/6] Executando limpeza agressiva de lixo (git gc --prune=now)..." -ForegroundColor Cyan
git gc --prune=now --aggressive

# Passo 5: Sincronizar Z:\AddonChrome-GovBR.chrome se possuir .git
if (Test-Path (Join-Path $repoChrome ".git")) {
    Write-Host "Sincronizando historico limpo em $repoChrome..." -ForegroundColor Cyan
    git -C $repoChrome fetch origin
    git -C $repoChrome reset --hard origin/main
    git -C $repoChrome gc --prune=now --aggressive
    Write-Host "[OK] Repositorio $repoChrome sincronizado com o mesmo commit raiz." -ForegroundColor Green
}

# Passo 6: Publicar arquivos de producao em Z:\AddonChrome-GovBR.chrome
$scriptPostar = Join-Path $scriptDir "postar_chrome.ps1"
if (Test-Path $scriptPostar) {
    & powershell -ExecutionPolicy Bypass -File $scriptPostar
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "SUCESSO: Historico do Git limpo em ambos os ambientes e no GitHub!" -ForegroundColor Green
Write-Host "Novo commit unico inicial: $msgCommit" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

