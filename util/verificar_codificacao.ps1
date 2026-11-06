param(
    [Alias('Arquivos', 'Arquivo', 'File', 'Files')]
    [string[]]$AlvoArquivos = @()
)

<#
 ==============================================================================
 SCRIPT: util/verificar_codificacao.ps1
 PROJETO: JusGovBR — Seleção & Cópia Inteligente + PJe Turbo
 AUTOR/CONTATO: smarca@gmail.com
 
 ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE USO (BLUEPRINT):
 1) FINALIDADE PRIMÁRIA:
    Guardião absoluto da integridade de codificação do projeto (Diretriz Root 4).
    Audita exaustivamente todos os arquivos do repositório (.js, .html, .css, .json, .md, .ps1, .txt)
    ou arquivos específicos passados por parâmetro (-Arquivos "docs/arquivo.md"), verificando:
    - Pilar 1: Ausência de Byte Order Mark UTF-8 (EF BB BF) — o projeto exige UTF-8 sem BOM.
    - Pilar 2: Leitura estrita em UTF-8 com decoder seguro (sem fallback para Windows-1252/Latin-1).
    - Pilar 3: Detecção de sequências corrompidas de Mojibake / Dupla Codificação.
    - Pilar 4: Proibição estrita de entidades HTML (&ccedil;, &otilde;, etc.) em arquivos de produção.
    - Pilar 5: Presença obrigatória da tag <meta charset="UTF-8"> em arquivos HTML.
    - Pilar 6: Presença obrigatória da diretiva @charset "UTF-8"; no início de arquivos CSS.
    - Pilar 7: Integridade de links relativos em arquivos Markdown (Docs-as-Code sem links quebrados).
 2) QUANDO UTILIZAR (GATILHOS OPERACIONAIS):
    - Imediatamente após criar ou editar arquivos de código ou documentação estrutural.
    - Pode receber caminhos relativos específicos (ex: -Arquivos "docs/03_BACKLOG_TAREFAS_E_FEATURES.md").
    - NÃO executar em anotações simples de backlog para economizar tempo e tokens.
    - Obrigatoriamente antes de gerar backups ('util/fazer_backup.ps1') ou efetuar commits de releases.
    - Antes de postar a versão em produção para o Chrome ('util/postar_chrome.ps1').
 3) CÓDIGOS DE SAÍDA (EXIT CODES):
    - 0: Sucesso total (todos os arquivos auditados em conformidade 100% nativa).
    - 1: Um ou mais arquivos apresentam violações de codificação, BOM ou links quebrados.
 ==============================================================================
#>

$ErrorActionPreference = 'Stop'
$testesDir = $PSScriptRoot
$baseDir = (Get-Item $testesDir).Parent.FullName

# 1. Coletar arquivos relevantes do projeto (.js, .html, .css, .json, .md, .ps1, .txt)
$extensoes = @('.js', '.html', '.css', '.json', '.md', '.ps1', '.txt')
$pastasExcluidas = @('.git', 'bkp', 'tmp', 'outros', '.vscode')

$arquivosParaAuditar = @()
if ($AlvoArquivos -and $AlvoArquivos.Count -gt 0) {
    foreach ($item in $AlvoArquivos) {
        $caminhoCompleto = if ([System.IO.Path]::IsPathRooted($item)) { $item } else { Join-Path $baseDir $item }
        if (Test-Path $caminhoCompleto -PathType Leaf) {
            $arquivosParaAuditar += (Get-Item $caminhoCompleto).FullName
        } elseif (Test-Path $caminhoCompleto -PathType Container) {
            $arquivosParaAuditar += Get-ChildItem -Path $caminhoCompleto -Recurse -File | Where-Object {
                $extensoes -contains $_.Extension.ToLower()
            } | Select-Object -ExpandProperty FullName
        } else {
            Write-Warning "Arquivo informado nao encontrado: $item"
        }
    }
} else {
    $arquivosParaAuditar = Get-ChildItem -Path $baseDir -Recurse -File | Where-Object {
        $caminhoRelativo = $_.FullName.Substring($baseDir.Length).TrimStart('\', '/')
        $primeiraPasta = $caminhoRelativo.Split('\/')[0]
        
        if ($pastasExcluidas -contains $primeiraPasta) {
            return $false
        }
        if ($_.Name -eq 'testar_mojibake.ps1') {
            return $false
        }
        return $extensoes -contains $_.Extension.ToLower()
    } | Select-Object -ExpandProperty FullName
}

$regexEntidadesProibidas = '&(ccedil|Ccedil|atilde|Atilde|otilde|Otilde|aacute|Aacute|eacute|Eacute|iacute|Iacute|oacute|Oacute|uacute|Uacute|acirc|Acirc|ecirc|Ecirc|ocirc|Ocirc|agrave|Agrave|uuml|Uuml|ordm|ordf|bull|ldquo|rdquo|lsquo|rsquo|ndash|mdash|hellip|rarr|larr|uarr|darr);'

# Padroes tipicos de Mojibake decorrentes de decodificacao incorreta (ex: UTF-8 lido como Windows-1252/Latin-1)
$regexMojibake = '[\u00C3][\u0080-\u00BF]|[\u00C2][\u00A0-\u00BF]|â€|\uFFFD|Ãƒ'

$totalErros = 0
$totalArquivos = 0

Write-Host "Iniciando verificacao de codificacao em $($arquivosParaAuditar.Count) arquivos..." -ForegroundColor Cyan

foreach ($arq in $arquivosParaAuditar) {
    $totalArquivos++
    $rel = $arq.Substring($baseDir.Length).TrimStart('\', '/')
    $errosNoArquivo = 0

    # 1. Checagem de Byte Order Mark (BOM) UTF-8 (EF BB BF)
    $bytes = [System.IO.File]::ReadAllBytes($arq)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        Write-Host "  [FALHA BOM] $rel : Contem UTF-8 Byte Order Mark (BOM)! O projeto exige UTF-8 sem BOM." -ForegroundColor Red
        $errosNoArquivo++
    }

    # 2. Leitura do conteudo em UTF-8 estrito
    $conteudo = $null
    try {
        $utf8SemBomStrict = New-Object System.Text.UTF8Encoding($false, $true)
        $conteudo = [System.IO.File]::ReadAllText($arq, $utf8SemBomStrict)
    } catch {
        Write-Host "  [FALHA UTF-8] $rel : Nao eh um arquivo UTF-8 valido!" -ForegroundColor Red
        $errosNoArquivo++
        $totalErros += $errosNoArquivo
        continue
    }

    $linhas = $conteudo -split "`r?`n"

    # 3. Deteccao de Mojibake / Dupla Codificacao
    # Se o proprio arquivo contiver definicoes de scripts de deteccao de mojibake, ignora as linhas da regex
    for ($i = 0; $i -lt $linhas.Length; $i++) {
        $linha = $linhas[$i]
        if ($linha -match 'regexMojibake' -or $linha -match '[\u00C3]\[\\u0080') {
            continue
        }
        if ($linha -match $regexMojibake) {
            Write-Host "  [FALHA MOJIBAKE] $rel (Linha $($i+1)): $linha" -ForegroundColor Red
            $errosNoArquivo++
        }
    }

    # 4. Validacao de Proibicao Estrita de Entidades HTML
    if ($rel -notlike 'util\*') {
        for ($i = 0; $i -lt $linhas.Length; $i++) {
            $linha = $linhas[$i]
            # Permite apenas em documentacoes que citam expressamente a regra de proibicao
            if ($linha -match 'PROIBIDO' -or $linha -match 'proibicao' -or $linha -match 'proibição' -or $linha -match 'prohibited' -or $linha -match 'terminantemente') {
                continue
            }
            $matches = [regex]::Matches($linha, $regexEntidadesProibidas)
            if ($matches.Count -gt 0) {
                Write-Host "  [FALHA ENTIDADE] $rel (Linha $($i+1)): $linha" -ForegroundColor Red
                $errosNoArquivo++
            }
        }
    }

    # 5. Validar header em HTML
    if ($arq.EndsWith('.html')) {
        if ($conteudo -notmatch '<meta\s+charset=["'']UTF-8["'']' -and $conteudo -notmatch '<meta\s+charset=["'']utf-8["'']') {
            Write-Host "  [FALHA HEADER] $rel : Tag <meta charset=""UTF-8""> ausente no cabecalho!" -ForegroundColor Red
            $errosNoArquivo++
        }
    }

    # 6. Validar header em CSS
    if ($arq.EndsWith('.css')) {
        if (-not $conteudo.StartsWith('@charset "UTF-8";')) {
            Write-Host "  [FALHA HEADER] $rel : Declaracao @charset ""UTF-8""; ausente no inicio!" -ForegroundColor Red
            $errosNoArquivo++
        }
    }

    # 7. Validar links Markdown relativos em arquivos .md (Docs-as-Code)
    if ($arq.EndsWith('.md')) {
        $dirArq = Split-Path $arq -Parent
        $padraoLinkMd = '\[[^\]]+\]\(([^)]+\.md)(?:#[^)]*)?\)'
        $matchesLinks = [regex]::Matches($conteudo, $padraoLinkMd)
        foreach ($m in $matchesLinks) {
            $caminhoAlvoRel = $m.Groups[1].Value
            # Se for link externo (http/https), ignora
            if ($caminhoAlvoRel -match '^(?:https?|file):') { continue }
            $alvoFisico = Join-Path $dirArq $caminhoAlvoRel
            if (-not (Test-Path $alvoFisico)) {
                Write-Host "  [FALHA LINK MD] $rel : Link quebrado apontando para '$caminhoAlvoRel' (nao encontrado em disco)!" -ForegroundColor Red
                $errosNoArquivo++
            }
        }
    }

    if ($errosNoArquivo -gt 0) {
        $totalErros += $errosNoArquivo
    } else {
        # Arquivo 100% integro
    }
}

if ($totalErros -gt 0) {
    Write-Host "`nTOTAL DE ERROS DE CODIFICACAO: $totalErros em $totalArquivos arquivos verificados." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nSUCESSO: Todos os $totalArquivos arquivos auditados estao em conformidade UTF-8 nativa, sem BOM, sem Mojibake e sem entidades HTML!" -ForegroundColor Green
    exit 0
}
