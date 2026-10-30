<#
.SYNOPSIS
    Gera relatórios de diff unificado (GNU diff / Git diff) entre arquivos ou contra o último backup.
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Arquivo1,
    [Parameter(Position = 1)]
    [string]$Arquivo2,
    [switch]$SalvarEmArquivo,
    [switch]$ContraUltimoBackup
)

$utilDir = $PSScriptRoot
$baseDir = (Get-Item $utilDir).Parent.FullName

$diffExe = "C:\Users\smarc\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\usr\bin\diff.exe"
if (-not (Test-Path $diffExe)) {
    if (Get-Command diff.exe -ErrorAction SilentlyContinue) {
        $diffExe = (Get-Command diff.exe).Source
    }
}

if ($ContraUltimoBackup -or (-not $Arquivo1 -and -not $Arquivo2)) {
    # Obter ultimo backup zip
    $bkpDir = Join-Path $baseDir "bkp"
    $ultimoZip = Get-ChildItem -Path $bkpDir -Filter "bkp_*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

    if (-not $ultimoZip) {
        Write-Host "Nenhum backup em formato bkp_*.zip encontrado para comparação." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "Comparando projeto atual contra o backup: $($ultimoZip.Name)" -ForegroundColor Cyan
    # Extrai o zip temporariamente para comparacao
    $tmpExtracao = Join-Path $baseDir "tmp\bkp_diff_temp"
    if (Test-Path $tmpExtracao) { Remove-Item $tmpExtracao -Recurse -Force -ErrorAction SilentlyContinue }
    New-Item -Path $tmpExtracao -ItemType Directory -Force | Out-Null

    try {
        Expand-Archive -Path $ultimoZip.FullName -DestinationPath $tmpExtracao -Force
        
        Write-Host "Executando diff..." -ForegroundColor Cyan
        $argsDiff = @("-u", "-r", "-N", "--strip-trailing-cr", "-x", "*.zip", "-x", "tmp", "-x", "bkp", "-x", ".vscode", $tmpExtracao, $baseDir)
        $diffOutput = & $diffExe @argsDiff
        
        if ($diffOutput) {
            # Substitui os prefixos dos caminhos para ficarem relativos amigáveis
            $diffFormatado = $diffOutput -replace [regex]::Escape($tmpExtracao), 'a' -replace [regex]::Escape($baseDir), 'b'
            
            if ($SalvarEmArquivo) {
                $diffFile = Join-Path $baseDir "mudancas_projeto.diff"
                [System.IO.File]::WriteAllText($diffFile, ($diffFormatado -join "`n"), [System.Text.Encoding]::UTF8)
                Write-Host "Diff salvo em: $diffFile" -ForegroundColor Green
            } else {
                $diffFormatado | ForEach-Object {
                    if ($_ -match "^\+") { Write-Host $_ -ForegroundColor Green }
                    elseif ($_ -match "^-") { Write-Host $_ -ForegroundColor Red }
                    elseif ($_ -match "^@@") { Write-Host $_ -ForegroundColor Cyan }
                    else { Write-Host $_ }
                }
            }
        } else {
            Write-Host "Nenhuma diferenca encontrada em relacao ao backup $($ultimoZip.Name)!" -ForegroundColor Green
        }
    } finally {
        if (Test-Path $tmpExtracao) {
            Remove-Item $tmpExtracao -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    exit 0
}

if ($Arquivo1 -and $Arquivo2) {
    if (-not (Test-Path $Arquivo1) -or -not (Test-Path $Arquivo2)) {
        Write-Host "Um dos arquivos informados nao foi encontrado." -ForegroundColor Red
        exit 1
    }

    $diffOutput = & $diffExe -u --strip-trailing-cr $Arquivo1 $Arquivo2
    if ($diffOutput) {
        if ($SalvarEmArquivo) {
            $diffFile = Join-Path $baseDir "comparacao.diff"
            [System.IO.File]::WriteAllText($diffFile, ($diffOutput -join "`n"), [System.Text.Encoding]::UTF8)
            Write-Host "Diff salvo em: $diffFile" -ForegroundColor Green
        } else {
            $diffOutput | ForEach-Object {
                if ($_ -match "^\+") { Write-Host $_ -ForegroundColor Green }
                elseif ($_ -match "^-") { Write-Host $_ -ForegroundColor Red }
                elseif ($_ -match "^@@") { Write-Host $_ -ForegroundColor Cyan }
                else { Write-Host $_ }
            }
        }
    } else {
        Write-Host "Arquivos sao identicos." -ForegroundColor Green
    }
}
