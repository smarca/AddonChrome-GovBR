$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$testesDir = $PSScriptRoot
$htmlFile = Join-Path $testesDir 'executar_testes.html'
$htmlPath = 'file:///' + ($htmlFile -replace '\\', '/')
$txtOut = Join-Path $testesDir 'chrome_output.txt'

if (Test-Path $txtOut) {
    Remove-Item $txtOut -Force
}

Start-Process -FilePath $chromePath -ArgumentList '--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--dump-dom', $htmlPath -NoNewWindow -RedirectStandardOutput $txtOut -Wait

if (Test-Path $txtOut) {
    $conteudo = Get-Content $txtOut -Raw
    if ($conteudo -match 'RESUMO FINAL: (\d+) DE (\d+) TESTES APROVADOS') {
        $aprovados = $matches[1]
        $total = $matches[2]
        Write-Host "=========================================================="
        Write-Host "AUDITORIA COMPLETA JUSGOVBR NO CHROME HEADLESS:"
        Write-Host "Total de Testes: $total | Aprovados: $aprovados"
        Write-Host "=========================================================="
        if ($aprovados -eq $total) {
            Write-Host "SUCESSO: 100% DOS TESTES APROVADOS!"
            exit 0
        } else {
            Write-Host "FALHA: ALGUNS TESTES REPROVARAM!"
            exit 1
        }
    } else {
        Write-Host "Saida bruta:"
        Write-Host $conteudo
        exit 2
    }
} else {
    Write-Host "Arquivo de saida nao gerado."
    exit 3
}

