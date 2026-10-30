<#
.SYNOPSIS
    Aplica diffs/patches (formato unificado Git/GNU) diretamente nos arquivos do projeto.
.DESCRIPTION
    Resolve caminhos relativos automaticamente, faz backup prévio de segurança
    e aplica as alterações sem necessidade de consumir tokens de IA.
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$ArquivoPatch,
    [switch]$DoClipboard,
    [switch]$IgnorarEspacos,
    [switch]$SemBackup
)

$utilDir = $PSScriptRoot
$baseDir = (Get-Item $utilDir).Parent.FullName

# 1. Localizar git.exe
$gitExe = $null
$candidatosGit = @(
    "git.exe",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe",
    "C:\Program Files\Git\cmd\git.exe"
)
foreach ($cand in $candidatosGit) {
    if (Get-Command $cand -ErrorAction SilentlyContinue) {
        $gitExe = (Get-Command $cand).Source
        break
    } elseif (Test-Path $cand) {
        $gitExe = $cand
        break
    }
}

if (-not $gitExe) {
    Write-Host "[ERRO] git.exe / MinGit não encontrado no sistema." -ForegroundColor Red
    exit 1
}

# 2. Obter conteúdo do patch
$patchTexto = $null
$origemPatch = ""

if ($DoClipboard) {
    $clip = Get-Clipboard -Raw
    if ($clip -match "--- [ab]/" -or $clip -match "@@ -\d+") {
        $patchTexto = $clip
        $origemPatch = "Clipboard (Área de Transferência)"
    } else {
        Write-Host "[AVISO] O clipboard não contém um formato de diff válido." -ForegroundColor Yellow
    }
}

if (-not $patchTexto -and $ArquivoPatch) {
    if (Test-Path $ArquivoPatch) {
        $patchTexto = Get-Content $ArquivoPatch -Raw -Encoding UTF8
        $origemPatch = $ArquivoPatch
    } else {
        $tentativa = Join-Path $baseDir $ArquivoPatch
        if (Test-Path $tentativa) {
            $patchTexto = Get-Content $tentativa -Raw -Encoding UTF8
            $origemPatch = $tentativa
        }
    }
}

if (-not $patchTexto) {
    $padroes = @(
        (Join-Path $baseDir "patch.diff"),
        (Join-Path $baseDir "patch.txt"),
        (Join-Path $baseDir "patch.patch"),
        (Join-Path $utilDir "patch.diff"),
        (Join-Path $utilDir "patch.txt")
    )
    foreach ($p in $padroes) {
        if (Test-Path $p) {
            $patchTexto = Get-Content $p -Raw -Encoding UTF8
            $origemPatch = $p
            break
        }
    }
}

if (-not $patchTexto) {
    $clip = Get-Clipboard -Raw
    if ($clip -match "--- [ab]/" -or $clip -match "@@ -\d+") {
        $patchTexto = $clip
        $origemPatch = "Clipboard (Área de Transferência)"
    }
}

if (-not $patchTexto) {
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "                  APLICADOR DE PATCH / DIFF                      " -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "Nenhum arquivo de patch ou texto no clipboard foi detectado."
    Write-Host "Você pode:"
    Write-Host "  1. Copiar o diff (Ctrl+C) e rodar: .\util\aplicar_patch.bat"
    Write-Host "  2. Passar o arquivo: .\util\aplicar_patch.bat meu_arquivo.patch"
    Write-Host "  3. Colocar um arquivo 'patch.diff' na pasta do projeto e rodar."
    Write-Host ""
    exit 1
}

Write-Host "Origem do patch: $origemPatch" -ForegroundColor Cyan

# 3. Mapear e corrigir caminhos dos arquivos do patch
$linhas = $patchTexto -split "`r?`n"
$novasLinhas = [System.Collections.Generic.List[string]]::new()
$arquivosModificados = [System.Collections.Generic.List[string]]::new()
$caminhoAtual = $null

for ($i = 0; $i -lt $linhas.Count; $i++) {
    $linha = $linhas[$i]
    if ($linha -match '^---\s+[ab]/(.+?)(?:\t.*)?$') {
        $caminhoOrig = $matches[1].Trim()
        $caminhoReal = $caminhoOrig
        if (-not (Test-Path (Join-Path $baseDir $caminhoOrig))) {
            $nomeArquivo = Split-Path $caminhoOrig -Leaf
            $encontrado = Get-ChildItem -Path $baseDir -Recurse -Filter $nomeArquivo -File |
                Where-Object { $_.FullName -notmatch '\\bkp\\' -and $_.FullName -notmatch '\\\.git\\' } |
                Select-Object -First 1
            if ($encontrado) {
                $caminhoReal = ($encontrado.FullName.Substring($baseDir.Length)).TrimStart('\', '/') -replace '\\', '/'
            }
        }
        $caminhoAtual = $caminhoReal

        # Insere diff --git para garantir reconhecimento pelo git apply
        if ($novasLinhas.Count -eq 0 -or $novasLinhas[$novasLinhas.Count - 1] -notmatch '^diff --git') {
            $novasLinhas.Add("diff --git a/$caminhoReal b/$caminhoReal")
        }
        $novasLinhas.Add("--- a/$caminhoReal")
        if (-not $arquivosModificados.Contains($caminhoReal)) {
            $arquivosModificados.Add($caminhoReal)
        }
    } elseif ($linha -match '^\+\+\+\s+[ab]/(.+?)(?:\t.*)?$') {
        $caminhoDest = if ($caminhoAtual) { $caminhoAtual } else { $matches[1].Trim() }
        $novasLinhas.Add("+++ b/$caminhoDest")
    } elseif ($linha -match '^diff --git\s+[ab]/(.+?)\s+[ab]/(.+)$') {
        $caminhoOrig = $matches[1].Trim()
        $caminhoReal = $caminhoOrig
        if (-not (Test-Path (Join-Path $baseDir $caminhoOrig))) {
            $nomeArquivo = Split-Path $caminhoOrig -Leaf
            $encontrado = Get-ChildItem -Path $baseDir -Recurse -Filter $nomeArquivo -File |
                Where-Object { $_.FullName -notmatch '\\bkp\\' -and $_.FullName -notmatch '\\\.git\\' } |
                Select-Object -First 1
            if ($encontrado) {
                $caminhoReal = ($encontrado.FullName.Substring($baseDir.Length)).TrimStart('\', '/') -replace '\\', '/'
            }
        }
        $caminhoAtual = $caminhoReal
        $novasLinhas.Add("diff --git a/$caminhoReal b/$caminhoReal")
    } else {
        $novasLinhas.Add($linha)
    }
}

$patchNormalizado = ($novasLinhas -join "`n") + "`n"

# 4. Fazer backup preventivo automático
if (-not $SemBackup) {
    Write-Host "Executando backup de seguranca automatico..." -ForegroundColor DarkYellow
    & (Join-Path $utilDir "fazer_backup.ps1") | Out-Null
}

# 5. Salvar arquivo temporário do patch na pasta tmp
$tmpDir = Join-Path $baseDir "tmp"
if (-not (Test-Path $tmpDir)) { New-Item -Path $tmpDir -ItemType Directory -Force | Out-Null }
$patchTmpPath = Join-Path $tmpDir "patch_execucao_temp.patch"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($patchTmpPath, $patchNormalizado, $utf8NoBom)

# 6. Executar aplicação com git apply via processo independente para controle limpo de I/O
Push-Location $baseDir
try {
    Write-Host "Aplicando alteracoes nos arquivos..." -ForegroundColor Cyan

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $gitExe
    $psi.WorkingDirectory = $baseDir
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true

    $argLista = "apply --unsafe-paths -v"
    if ($IgnorarEspacos) {
        $argLista += " --ignore-whitespace --ignore-space-change"
    }
    $argLista += " `"$patchTmpPath`""
    $psi.Arguments = $argLista

    $proc = [System.Diagnostics.Process]::Start($psi)
    $stdout = $proc.StandardOutput.ReadToEnd()
    $stderr = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()
    $codigoSaida = $proc.ExitCode

    if ($codigoSaida -ne 0 -and -not $IgnorarEspacos) {
        Write-Host "Tentando com tolerancia de espacos e recount..." -ForegroundColor Yellow
        $psi.Arguments = "apply --unsafe-paths -v --ignore-whitespace --ignore-space-change --recount `"$patchTmpPath`""
        $proc2 = [System.Diagnostics.Process]::Start($psi)
        $stdout = $proc2.StandardOutput.ReadToEnd()
        $stderr = $proc2.StandardError.ReadToEnd()
        $proc2.WaitForExit()
        $codigoSaida = $proc2.ExitCode
    }

    if ($codigoSaida -eq 0) {
        Write-Host ""
        Write-Host "=================================================================" -ForegroundColor Green
        Write-Host "PATCH APLICADO COM SUCESSO!" -ForegroundColor Green
        Write-Host "=================================================================" -ForegroundColor Green
        Write-Host "Arquivos afetados:"
        foreach ($arq in $arquivosModificados) {
            Write-Host "  -> $arq" -ForegroundColor Green
        }
    } else {
        Write-Host ""
        Write-Host "=================================================================" -ForegroundColor Red
        Write-Host "FALHA AO APLICAR O PATCH!" -ForegroundColor Red
        Write-Host "=================================================================" -ForegroundColor Red
        if ($stderr) { Write-Host $stderr -ForegroundColor Red }
        if ($stdout) { Write-Host $stdout }
        Write-Host ""
        Write-Host "Dica: verifique se o arquivo alvo ja possui as alteracoes ou se as linhas de contexto coincidem." -ForegroundColor Yellow
        exit 1
    }
} finally {
    Pop-Location
    if (Test-Path $patchTmpPath) {
        Remove-Item $patchTmpPath -Force -ErrorAction SilentlyContinue
    }
}
