<#
 ==============================================================================
 SCRIPT: util/fazer_backup.ps1
 PROJETO: JusGovBR — Seleção & Cópia Inteligente + PJe Turbo
 AUTOR/CONTATO: smarca@gmail.com
 
 ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE USO (BLUEPRINT):
 1) FINALIDADE PRIMÁRIA:
    Script oficial de backup padronizado, versionamento ChronoSemVer e rotação inteligente
    de pacotes compactados .zip em 'bkp/' (Diretriz Root 8).
 2) FLUXO OPERACIONAL DETERMINÍSTICO:
    - Passo 1: Leitura e incremento automático de versão exclusivamente em 'manifest.json' (AAMMDD.VER[.FIX]).
    - Passo 2: Limpeza automática e higienização completa da pasta temporária 'tmp/'.
    - Passo 3: Cópia das configurações globais da IDE ('settings.json') para '.vscode/settings.json.global'.
    - Passo 4: Sincronização do 'docs/README.md' para 'README.md' na raiz do projeto.
    - Passo 5: Compactação atômica em .zip (excluindo .git, bkp, tmp, outros e arquivos leia-me).
    - Passo 6: Rotação GFS (Grandfather-Father-Son): raiz (último absoluto), diário (15 dias),
               semanal (3 meses), mensal (1 ano) e anual.
 3) QUANDO UTILIZAR: Início do dia, a cada 3h de trabalho, após baterias aprovadas ou sob demanda.
 ==============================================================================
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$Comentario,

    [switch]$Fix,
    [switch]$Patch,
    [switch]$Ver,
    [switch]$Feature
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$utilDir = $PSScriptRoot
$baseDir = (Get-Item $utilDir).Parent.FullName
$bkpDir = Join-Path $baseDir "bkp"

if (-not (Test-Path $bkpDir)) {
    New-Item -Path $bkpDir -ItemType Directory -Force | Out-Null
}

# --------------------------------------------------------------------------
# LEITURA E INCREMENTO AUTOMATICO DA VERSAO (EXCLUSIVAMENTE EM manifest.json)
# Formato: AAMMDD.VER[.FIX] (ex: 261105.0.1 ou 261105.1 ou 261105.1.2)
# Regras:
# 1. A versao do app reside unicamente em manifest.json.
# 2. AAMMDD sempre sera mudado para o Ano, Mes e Dia corrente (yyMMdd),
#    independentemente do tipo de alteracao realizada.
# 3. VER e incrementado a cada inclusao de qualquer funcionalidade
#    (mesmo as minimas: MAJOR + MINOR mudancas).
# 4. FIX so e incrementado quando existem correcoes (PATCH / BUGFIX).
# 5. Se nada de funcionalidade (MAJOR+MINOR) foi mudado no dia:
#    - VER sera 0
#    - Se houver correcao, FIX sera 1 (exemplo: 261105.0.1)
# 6. Regra de omissao: Se FIX=0, NAO colocar na string de versao (ex: 261105.1).
#    Se FIX>0, colocar: AAMMDD.VER.FIX (ex: 261105.0.1 ou 261105.1.1).
# --------------------------------------------------------------------------
$versaoTag = ""
$novaVersaoApp = ""
$manifestPath = Join-Path $baseDir "manifest.json"

if (Test-Path $manifestPath) {
    try {
        $mfContent = [System.IO.File]::ReadAllText($manifestPath, [System.Text.Encoding]::UTF8)
        $hojeAAMMDD = Get-Date -Format "yyMMdd"

        # Captura versoes no formato AAMMDD.VER[.FIX] ou legadas
        if ($mfContent -match '"version_name"\s*:\s*"(\d{6,8})\.([0-9]+)(?:\.([0-9]+))?(?:\.([0-9]+))?"' -or
            $mfContent -match '"version"\s*:\s*"(\d{6,8})\.([0-9]+)(?:\.([0-9]+))?(?:\.([0-9]+))?"') {

            $dataGravada = $matches[1]
            if ($dataGravada.Length -eq 8) {
                $dataGravada = $dataGravada.Substring(2)
            }
            $verGravado = [int]$matches[2]
            $fixGravado = if ($matches[3]) { [int]$matches[3] } else { 0 }

            $textoComentarioBruto = if ($Comentario -and $Comentario.Count -gt 0) { ($Comentario -join " ").Trim() } else { "" }

            # 1. Verifica se ha especificacao de versao manual no comentario (ex: 261105.0.1, v1, v1.1, v0.1)
            $versaoManualDefinida = $false
            if ($textoComentarioBruto -match '^v?([0-9]{6})\.([0-9]+)(?:\.([0-9]+))?') {
                $dataGravada = $matches[1]
                $verAtual = [int]$matches[2]
                $fixAtual = if ($matches[3]) { [int]$matches[3] } else { 0 }
                $versaoManualDefinida = $true
            } elseif ($textoComentarioBruto -match '^v([0-9]+)(?:\.([0-9]+))?') {
                $dataGravada = $hojeAAMMDD
                $verAtual = [int]$matches[1]
                $fixAtual = if ($matches[2]) { [int]$matches[2] } else { 0 }
                $versaoManualDefinida = $true
            }

            if (-not $versaoManualDefinida) {
                # 2. Identifica se o tipo de mudanca e FEATURE (VER) ou CORRECAO (FIX)
                $tipoMudanca = $null
                if ($Ver -or $Feature) {
                    $tipoMudanca = 'VER'
                } elseif ($Fix -or $Patch) {
                    $tipoMudanca = 'FIX'
                } else {
                    $ehFix = ($textoComentarioBruto -match '(?i)\b(fix|patch|hotfix|bug|correcao|corrigir|ajuste|conserto|reparo)\b')
                    $ehVer = ($textoComentarioBruto -match '(?i)\b(feat|feature|nova|novo|funcionalidade|inclusao|add|major|minor|implementar|criacao|modulo)\b')
                    if ($ehVer -and -not $ehFix) {
                        $tipoMudanca = 'VER'
                    } elseif ($ehFix) {
                        $tipoMudanca = 'FIX'
                    } else {
                        # Padrao quando nao especificado: correcao (FIX)
                        $tipoMudanca = 'FIX'
                    }
                }

                # 3. Aplica a virada de dia e os incrementos
                if ($dataGravada -ne $hojeAAMMDD) {
                    # Novo dia: AAMMDD sempre sera mudado para o Ano, Mes e Dia corrente
                    $dataGravada = $hojeAAMMDD
                    if ($tipoMudanca -eq 'VER') {
                        $verAtual = 1
                        $fixAtual = 0
                    } else {
                        # Se nada de MAJOR+MINOR for mudado no dia, VER sera 0 e FIX sera 1 (ex: 261105.0.1)
                        $verAtual = 0
                        $fixAtual = 1
                    }
                } else {
                    # Mesmo dia:
                    if ($tipoMudanca -eq 'VER') {
                        $verAtual = if ($verGravado -gt 0) { $verGravado + 1 } else { 1 }
                        $fixAtual = 0
                    } else {
                        $verAtual = $verGravado
                        $fixAtual = if ($fixGravado -gt 0) { $fixGravado + 1 } else { 1 }
                    }
                }
            }

            # 4. Formatacao da versao segundo a regra de omissao: Se FIX=0, nao colocar
            if ($fixAtual -gt 0) {
                $novaVersaoApp = "${dataGravada}.${verAtual}.${fixAtual}"
                $versaoTag = "v${verAtual}.${fixAtual}"
            } else {
                $novaVersaoApp = "${dataGravada}.${verAtual}"
                $versaoTag = "v${verAtual}"
            }

            # Atualiza manifest.json com a nova versao antes de compactar
            $mfContentAtualizado = $mfContent -replace '"version"\s*:\s*"[^"]+"', "`"version`": `"$novaVersaoApp`""
            $mfContentAtualizado = $mfContentAtualizado -replace '"version_name"\s*:\s*"[^"]+"', "`"version_name`": `"$novaVersaoApp`""

            $utf8SemBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($manifestPath, $mfContentAtualizado, $utf8SemBom)
            Write-Host "Versao atualizada em manifest.json: $novaVersaoApp (Tag: $versaoTag)" -ForegroundColor Cyan
        }
    } catch {
        Write-Warning "Nao foi possivel atualizar a versao em manifest.json: $_"
    }
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$sufixo = ""
if ($Comentario -and $Comentario.Count -gt 0) {
    $textoComentario = ($Comentario -join " ").Trim()
    if ($textoComentario.Length -gt 0) {
        $textoComentario = ($textoComentario -replace '[\\/:*?"<>|]', '').Trim()
        if ($textoComentario.Length -gt 0) {
            if ($textoComentario -match '^v\d+(\.\d+)*\s*(-\s*)?(.*)$') {
                $resto = $matches[3].Trim()
                if ($resto.Length -gt 0) {
                    $sufixo = " $versaoTag - $resto"
                } else {
                    $sufixo = " $versaoTag"
                }
            } elseif ($versaoTag) {
                $sufixo = " $versaoTag - $textoComentario"
            } else {
                $sufixo = " - $textoComentario"
            }
        }
    }
} elseif ($versaoTag) {
    $sufixo = " $versaoTag"
}
$zipNome = "bkp_${timestamp}${sufixo}.zip"
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
$settingsGlobal = Join-Path $env:APPDATA "Antigravity IDE\User\settings.json"
$vscodeDir = Join-Path $baseDir ".vscode"
if (Test-Path $settingsGlobal) {
    if (-not (Test-Path $vscodeDir)) { New-Item -Path $vscodeDir -ItemType Directory -Force | Out-Null }
    Copy-Item -Path $settingsGlobal -Destination (Join-Path $vscodeDir "settings.json.global") -Force
    Write-Host "settings.json global copiado para .vscode\settings.json.global" -ForegroundColor DarkGray
}

# 1.2 Sincronizacao automatica do README.md de docs/ para a raiz do projeto (Docs-as-Code)
$docsReadme = Join-Path $baseDir "docs\README.md"
$rootReadme = Join-Path $baseDir "README.md"
if (Test-Path $docsReadme) {
    Copy-Item -Path $docsReadme -Destination $rootReadme -Force
    Write-Host "docs/README.md sincronizado para README.md na raiz" -ForegroundColor DarkGray
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

# 3. Cria o arquivo ZIP blindado com FileShare.ReadWrite para evitar bloqueios concorrentes
if (Test-Path $zipDestino) {
    Remove-Item -Path $zipDestino -Force
}

$zipStream = [System.IO.File]::Open($zipDestino, [System.IO.FileMode]::Create)
$archive = [System.IO.Compression.ZipArchive]::new($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($itemPath in $itens) {
        $item = Get-Item $itemPath -Force
        if ($item.PSIsContainer) {
            $arquivos = Get-ChildItem -Path $item.FullName -Recurse -File -Force
            foreach ($arq in $arquivos) {
                $rel = $arq.FullName.Substring($baseDir.Length).TrimStart('\', '/')
                $relZip = $rel.Replace('\', '/')
                $entry = $archive.CreateEntry($relZip, [System.IO.Compression.CompressionLevel]::Optimal)
                $entryStream = $entry.Open()
                $fileStream = [System.IO.File]::Open($arq.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
                try {
                    $fileStream.CopyTo($entryStream)
                } finally {
                    $fileStream.Dispose()
                    $entryStream.Dispose()
                }
            }
        } else {
            $rel = $item.FullName.Substring($baseDir.Length).TrimStart('\', '/')
            $relZip = $rel.Replace('\', '/')
            $entry = $archive.CreateEntry($relZip, [System.IO.Compression.CompressionLevel]::Optimal)
            $entryStream = $entry.Open()
            $fileStream = [System.IO.File]::Open($item.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
            try {
                $fileStream.CopyTo($entryStream)
            } finally {
                $fileStream.Dispose()
                $entryStream.Dispose()
            }
        }
    }
} finally {
    $archive.Dispose()
    $zipStream.Dispose()
}

if (-not (Test-Path $zipDestino)) {
    Write-Error "Falha ao gerar o arquivo de backup."
    exit 1
}

$info = Get-Item $zipDestino
$tamanhoKB = [math]::Round($info.Length / 1KB, 2)
Write-Host "Backup concluido com sucesso!" -ForegroundColor Green
Write-Host "Arquivo: $($info.Name)"
Write-Host "Tamanho: $tamanhoKB KB"
Write-Host "Caminho: $($info.FullName)"

# 4. Esquema de Rotacao de Backups (GFS: Diario, Semanal, Mensal, Anual)
function Executar-RotacaoBackups {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$PastaBkp
    )

    Write-Host "`n--- Iniciando Esquema de Rotacao de Backups ---" -ForegroundColor Cyan

    $regex = '^bkp_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})(?:.*)?\.zip$'
    $todosZips = Get-ChildItem -Path $PastaBkp -Filter "bkp_*.zip" -Recurse -File | Where-Object {
        $_.Name -match $regex
    }

    if ($todosZips.Count -eq 0) {
        Write-Host "Nenhum backup encontrado para rotacao." -ForegroundColor DarkGray
        return
    }

    $cal = [System.Globalization.CultureInfo]::InvariantCulture.Calendar

    $lista = @()
    foreach ($z in $todosZips) {
        if ($z.Name -match $regex) {
            $ano = [int]$matches[1]
            $mes = [int]$matches[2]
            $dia = [int]$matches[3]
            $hor = [int]$matches[4]
            $min = [int]$matches[5]
            $dt = [datetime]::new($ano, $mes, $dia, $hor, $min, 0)
            $semanaNum = $cal.GetWeekOfYear($dt, [System.Globalization.CalendarWeekRule]::FirstFourDayWeek, [DayOfWeek]::Monday)
            $chaveSemana = "{0}-W{1:D2}" -f $ano, $semanaNum
            $chaveMes = "{0}-{1:D2}" -f $ano, $mes
            $chaveDia = "{0:yyyy-MM-dd}" -f $dt.Date

            $lista += [PSCustomObject]@{
                Item        = $z
                Path        = $z.FullName
                Name        = $z.Name
                DateTime    = $dt
                Date        = $dt.Date
                DayKey      = $chaveDia
                WeekKey     = $chaveSemana
                MonthKey    = $chaveMes
                Year        = $ano
                Destino     = $null   # 'root', 'diario', 'semanal', 'mensal', 'anual'
                Remover     = $false
            }
        }
    }

    # Ordenar do mais recente para o mais antigo
    $lista = $lista | Sort-Object -Property DateTime -Descending

    $latest = $lista[0]
    $dataReferencia = $latest.Date # Data do ultimo dia de backups

    # 4.1 O ultimo backup absoluto reside obrigatoriamente na raiz de bkp
    $latest.Destino = "root"

    # 4.2 Limites temporais da politica de retencao
    $limite15Dias = $dataReferencia.AddDays(-15)
    $limite3Meses = $dataReferencia.AddDays(-90)
    $limite1Ano   = $dataReferencia.AddDays(-365)

    $dias15Mantidos   = @{}
    $semanasMantidas  = @{}
    $mesesMantidos    = @{}
    $anosMantidos     = @{}

    for ($i = 1; $i -lt $lista.Count; $i++) {
        $b = $lista[$i]

        # Regra A: "Manter todos os backups do ultimo dia."
        if ($b.Date -eq $dataReferencia) {
            $b.Destino = "diario"
            continue
        }

        # Regra B: "Manter o ultimo backup apenas por dia dos ultimos 15 dias."
        if ($b.Date -ge $limite15Dias) {
            if (-not $dias15Mantidos.ContainsKey($b.DayKey)) {
                $dias15Mantidos[$b.DayKey] = $b
                $b.Destino = "diario"
            } else {
                $b.Remover = $true
            }
            continue
        }

        # Regra C: "Manter um backup por semana dos ultimos 3 meses."
        if ($b.Date -ge $limite3Meses) {
            if (-not $semanasMantidas.ContainsKey($b.WeekKey)) {
                $semanasMantidas[$b.WeekKey] = $b
                $b.Destino = "semanal"
            } else {
                $b.Remover = $true
            }
            continue
        }

        # Regra D: "Manter um backup por mes."
        if ($b.Date -ge $limite1Ano) {
            if (-not $mesesMantidos.ContainsKey($b.MonthKey)) {
                $mesesMantidos[$b.MonthKey] = $b
                $b.Destino = "mensal"
            } else {
                $b.Remover = $true
            }
            continue
        }

        # Regra E: "Manter um backup por ano."
        if (-not $anosMantidos.ContainsKey($b.Year)) {
            $anosMantidos[$b.Year] = $b
            $b.Destino = "anual"
        } else {
            $b.Remover = $true
        }
    }

    # 4.3 Remover backups descartados pela politica
    $removidos = 0
    foreach ($b in ($lista | Where-Object { $_.Remover })) {
        Write-Host " [REMOVER] $($b.Name) (fora da politica de retencao)" -ForegroundColor DarkGray
        Remove-Item -Path $b.Path -Force -ErrorAction SilentlyContinue
        $removidos++
    }

    # 4.4 Alocar backups mantidos em suas pastas correspondentes
    $pastasAlvo = @{
        'root'    = $PastaBkp
        'diario'  = Join-Path $PastaBkp "diario"
        'semanal' = Join-Path $PastaBkp "semanal"
        'mensal'  = Join-Path $PastaBkp "mensal"
        'anual'   = Join-Path $PastaBkp "anual"
    }

    foreach ($b in ($lista | Where-Object { -not $_.Remover })) {
        $pastaDestino = $pastasAlvo[$b.Destino]
        if (-not (Test-Path $pastaDestino)) {
            New-Item -Path $pastaDestino -ItemType Directory -Force | Out-Null
        }

        $caminhoAlvo = Join-Path $pastaDestino $b.Name
        if ($b.Path -ne $caminhoAlvo) {
            Write-Host " [ROTACIONAR] $($b.Name) -> $($b.Destino)\$($b.Name)" -ForegroundColor Yellow
            Move-Item -Path $b.Path -Destination $caminhoAlvo -Force
            $b.Path = $caminhoAlvo
        } else {
            Write-Host " [MANTER] $($b.Destino)\$($b.Name)" -ForegroundColor Green
        }
    }

    # 4.5 Deletar diretorios vazios (Apenas subpastas oficiais do ciclo de vida GFS)
    # Salvaguarda: NUNCA remover ou tocar em outras subpastas avulsas (como bkp\oldapp e correlatas)
    $pastasPermitidasLimpeza = @('diario', 'semanal', 'mensal', 'anual')
    $subpastas = Get-ChildItem -Path $PastaBkp -Directory -Recurse | Sort-Object { $_.FullName.Length } -Descending
    foreach ($sp in $subpastas) {
        if ($pastasPermitidasLimpeza -contains $sp.Name.ToLower()) {
            $itensSp = Get-ChildItem -Path $sp.FullName -Force
            if ($itensSp.Count -eq 0) {
                Write-Host " [LIMPEZA GFS] Removido diretorio vazio do ciclo: $($sp.Name)" -ForegroundColor DarkGray
                Remove-Item -Path $sp.FullName -Force -Recurse -ErrorAction SilentlyContinue
            }
        }
    }

    Write-Host "--- Rotacao Concluida: $removidos backup(s) removido(s) ---`n" -ForegroundColor Cyan
}

# Executa o rodizio
Executar-RotacaoBackups -PastaBkp $bkpDir
