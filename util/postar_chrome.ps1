<#
 ==============================================================================
 SCRIPT: util/postar_chrome.ps1
 PROJETO: JusGovBR — Seleção & Cópia Inteligente + PJe Turbo
 AUTOR/CONTATO: smarca@gmail.com
 
 ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE USO (BLUEPRINT):
 1) FINALIDADE PRIMÁRIA:
    Script oficial de deploy unidirecional (push-only / postagem) para o ambiente
    ativo da extensão carregada no Google Chrome ('Z:\AddonChrome-GovBR.chrome'),
    conforme formalizado na Diretriz Root 15 e na Seção 6.52 do Backlog.
 2) SOBERANIA ABSOLUTA DO AMBIENTE DE DESENVOLVIMENTO (FONTE ÚNICA DA VERDADE):
    - O workspace 'Z:\AddonChrome-GovBR' é a Fonte Única da Verdade (Master).
    - 'Z:\AddonChrome-GovBR.chrome' é estritamente o destino de publicação.
    - REGRAS INEGOCIÁVEIS:
      * NUNCA arquivos virão de 'Z:\AddonChrome-GovBR.chrome' para desenvolvimento.
      * NUNCA arquivos de desenvolvimento serão deletados por não existirem no destino.
      * Apenas os artefatos de produção ('manifest.json' e a pasta 'src/') são copiados.
        Pastas de suporte (docs/, util/, bkp/, tmp/) jamais são publicadas no Chrome.
 3) QUANDO UTILIZAR (GATILHOS OPERACIONAIS):
    - Sob demanda expressa do usuário (ex.: "postar no chrome", "sincronizar extensão online").
    - Sempre precedido da aprovação em 100% dos testes ('util/executar_auditoria.ps1')
      e verificação estrita de codificação ('util/verificar_codificacao.ps1').
 ==============================================================================
#>

$ErrorActionPreference = 'Stop'

$origem = "Z:\AddonChrome-GovBR"
$destino = "Z:\AddonChrome-GovBR.chrome"

Write-Host "=========================================================="
Write-Host "POSTAGEM UNIDIRECIONAL NO CHROME (DEPLOY Dev -> Online)"
Write-Host "Origem Mestra (Master):  $origem"
Write-Host "Destino Online (Target): $destino"
Write-Host "=========================================================="

if (-not (Test-Path $destino)) {
    Write-Host "Criando pasta de destino: $destino..."
    New-Item -ItemType Directory -Path $destino -Force | Out-Null
}

# 1. Copiar manifest.json (*) Indispensável
Write-Host "Copiando manifest.json (*) Indispensável para o Chrome..."
Copy-Item -Path "$origem\manifest.json" -Destination "$destino\manifest.json" -Force

# 2. Copiar árvore src/ (*) Indispensável
Write-Host "Sincronizando pasta src/ (*) Indispensável para o Chrome..."
$destinoSrc = "$destino\src"
if (-not (Test-Path $destinoSrc)) {
    New-Item -ItemType Directory -Path $destinoSrc -Force | Out-Null
}
Copy-Item -Path "$origem\src\*" -Destination $destinoSrc -Recurse -Force

# 3. Higienização: Garantir que apenas os arquivos indispensáveis permaneçam na pasta do Chrome
$itensDispensaveis = Get-ChildItem -Path $destino -Force | Where-Object {
    $nome = $_.Name
    $nome -ne "manifest.json" -and $nome -ne "src" -and $nome -ne ".git"
}
foreach ($item in $itensDispensaveis) {
    Remove-Item -Path $item.FullName -Recurse -Force
    Write-Host "Item dispensável removido do Chrome: $($item.Name)" -ForegroundColor Yellow
}

Write-Host "=========================================================="
Write-Host "SUCESSO: Postagem concluída com sucesso em $destino!"
Write-Host "Apenas os arquivos indispensáveis (manifest.json + src/) estão ativos."
Write-Host "O Chrome já pode recarregar a extensão em chrome://extensions."
Write-Host "=========================================================="

