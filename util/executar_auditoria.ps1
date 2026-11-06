<#
 ==============================================================================
 SCRIPT: util/executar_auditoria.ps1
 PROJETO: JusGovBR — Seleção & Cópia Inteligente + PJe Turbo
 AUTOR/CONTATO: smarca@gmail.com
 
 ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE USO (BLUEPRINT):
 1) FINALIDADE PRIMÁRIA:
    Runner oficial de auditoria automatizada em Chromium Headless puro (sem Node.js/NPM),
    conforme formalizado na ADR-001. Executa duas etapas críticas e determinísticas:
    - ETAPA 1: Validação estrita de sintaxe V8 de todos os 32 arquivos JavaScript do projeto
               via 'util/validar_sintaxe_v8.html'.
    - ETAPA 2: Execução da suíte completa de 300 testes unitários, matemáticos e de regras
               de negócio forenses via 'util/executar_testes.html' e 'src/cfg/debug.js'.
 2) QUANDO UTILIZAR (GATILHOS OPERACIONAIS):
    - Imediatamente após qualquer alteração em arquivos de código (.js, .html, .css).
    - Obrigatoriamente antes de gerar backups ('util/fazer_backup.ps1') ou efetuar commits.
    - Antes de postar a versão em produção para o Chrome ('util/postar_chrome.ps1').
 3) CÓDIGOS DE SAÍDA (EXIT CODES):
    - 0: Sucesso absoluto (100% de sintaxe válida e 300/300 testes aprovados).
    - 1: Falha crítica de sintaxe JS no motor V8 ou reprovação em teste unitário.
    - 2: Erro inesperado na extração da saída bruta do Chrome Headless.
    - 3: Falha de I/O (arquivo de saída não foi gerado pelo processo Chromium).
 4) PASSOS DE RECONSTRUÇÃO DO ZERO (PSEUDOCÓDIGO INTERCALADO):
    Passo 1.1: Localização do binário do Google Chrome e diretório temporário 'tmp/'.
    Passo 1.2: Disparo do Chrome Headless com '--dump-dom' para 'validar_sintaxe_v8.html'.
    Passo 1.3: Análise regex do DOM retornado buscando token 'SUCESSO_TOTAL_TODOS_32_ARQUIVOS'.
    Passo 1.4: Disparo do Chrome Headless para 'executar_testes.html'.
    Passo 1.5: Avaliação do sumário 'RESUMO FINAL: 300 DE 300 TESTES APROVADOS'.
 ==============================================================================
#>

$chromePath = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$testesDir = $PSScriptRoot
$baseDir = (Get-Item $testesDir).Parent.FullName
$tmpDir = Join-Path $baseDir 'tmp'
if (-not (Test-Path $tmpDir)) {
    New-Item -Path $tmpDir -ItemType Directory -Force | Out-Null
}
# Etapa 1: Validacao Estrita de Sintaxe V8 de todos os arquivos JS do projeto
$sintaxeHtml = Join-Path $testesDir 'validar_sintaxe_v8.html'
$sintaxePath = 'file:///' + ($sintaxeHtml -replace '\\', '/')
$sintaxeOut = Join-Path $tmpDir 'sintaxe_v8_output.txt'

if (Test-Path $sintaxeOut) { Remove-Item $sintaxeOut -Force }

Start-Process -FilePath $chromePath -ArgumentList '--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--dump-dom', $sintaxePath -NoNewWindow -RedirectStandardOutput $sintaxeOut -Wait

if (Test-Path $sintaxeOut) {
    $conteudoSintaxe = Get-Content $sintaxeOut -Raw
    if ($conteudoSintaxe -notmatch 'SUCESSO_TOTAL_TODOS_(\d+)_ARQUIVOS_JS_SINTAXE_VALIDA') {
        Write-Host "==========================================================" -ForegroundColor Red
        Write-Host "FALHA CRITICA DE SINTAXE JS DETECTADA NO MOTOR V8:" -ForegroundColor Red
        Write-Host $conteudoSintaxe -ForegroundColor Yellow
        Write-Host "==========================================================" -ForegroundColor Red
        exit 1
    }
    $totalArqs = $matches[1]
    Write-Host "[OK] Todos os $totalArqs arquivos JS passaram na analise de sintaxe V8 sem nenhum erro!" -ForegroundColor Green
}

# Etapa 2: Execucao da suite de testes funcionais e regras de negocio
$htmlFile = Join-Path $testesDir 'executar_testes.html'
$htmlPath = 'file:///' + ($htmlFile -replace '\\', '/')
$txtOut = Join-Path $tmpDir 'chrome_output.txt'

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

