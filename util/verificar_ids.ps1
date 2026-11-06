<#
 ==============================================================================
 SCRIPT: util/verificar_ids.ps1
 PROJETO: JusGovBR — Seleção & Cópia Inteligente + PJe Turbo
 AUTOR/CONTATO: smarca@gmail.com
 
 ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE USO (BLUEPRINT):
 1) FINALIDADE PRIMÁRIA:
    Auditor estático de integridade referencial da interface (UI Lint).
    Varre todos os identificadores capturados via 'document.getElementById(...)' em
    'src/cfg/options.js' e valida se cada ID correspondente existe fisicamente declarado
    no DOM de 'src/cfg/options.html'.
 2) BENEFÍCIO OPERACIONAL:
    Previne antecipadamente erros em tempo de execução causados por renomeações de tags,
    IDs órfãos ou seletores quebrados na interface de opções.
 3) QUANDO UTILIZAR (GATILHOS OPERACIONAIS):
    - Sempre que houver inclusão, alteração ou exclusão de campos na tela de opções.
 ==============================================================================
#>

$ErrorActionPreference = 'Stop'
$testesDir = $PSScriptRoot
$baseDir = (Get-Item $testesDir).Parent.FullName
$optJsPath = Join-Path $baseDir 'src\cfg\options.js'
$optHtmlPath = Join-Path $baseDir 'src\cfg\options.html'

$optJs = Get-Content $optJsPath -Raw -Encoding UTF8
$optHtml = Get-Content $optHtmlPath -Raw -Encoding UTF8

$re = [regex]'getElementById\([`''"]([^`''"]+)[`''"]\)'
$ids = @()
foreach ($m in $re.Matches($optJs)) {
    $ids += $m.Groups[1].Value
}
$ids = $ids | Select-Object -Unique

$faltando = @()
foreach ($id in $ids) {
    $padrao = 'id=["'']' + [regex]::Escape($id) + '["'']'
    if ($optHtml -notmatch $padrao) {
        $faltando += $id
    }
}

if ($faltando.Count -gt 0) {
    Write-Host "IDs em options.js que NAO existem em options.html:" -ForegroundColor Red
    $faltando | ForEach-Object { Write-Host " - $_" -ForegroundColor Yellow }
} else {
    Write-Host "SUCESSO: Todos os $($ids.Count) IDs referenciados em options.js existem em options.html!" -ForegroundColor Green
}

