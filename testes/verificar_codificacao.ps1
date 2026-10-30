# Script de verificacao de Codificacao UTF-8 Nativa e Proibicao Estrita de Entidades HTML
# Projeto: JusGovBR - Copia Inteligente & PJe Turbo

$arquivosBase = @(
    'z:\AddonChrome\src\mod-copia\ConstantesPadroes.js',
    'z:\AddonChrome\src\mod-copia\AvisoFlutuante.js',
    'z:\AddonChrome\src\mod-copia\AcumuladorCopia.js',
    'z:\AddonChrome\src\mod-copia\SelecionarCopiar.js',
    'z:\AddonChrome\src\cfg\background.js',
    'z:\AddonChrome\src\cfg\options.js',
    'z:\AddonChrome\src\cfg\options.html',
    'z:\AddonChrome\src\cfg\popup.html',
    'z:\AddonChrome\src\cfg\popup.js',
    'z:\AddonChrome\src\cfg\debug.js',
    'z:\AddonChrome\src\cfg\editor_demo.js',
    'z:\AddonChrome\src\mod-pje\PJE-anti_ampuletas.css',
    'z:\AddonChrome\manifest.json'
)

$docsMd = Get-ChildItem -Path "z:\AddonChrome\docs" -Filter "*.md" -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName }
$arquivos = $arquivosBase + $docsMd

$regexEntidadesProibidas = '&(ccedil|Ccedil|atilde|Atilde|otilde|Otilde|aacute|Aacute|eacute|Eacute|iacute|Iacute|oacute|Oacute|uacute|Uacute|acirc|Acirc|ecirc|Ecirc|ocirc|Ocirc|agrave|Agrave|uuml|Uuml|ordm|ordf|bull|ldquo|rdquo|lsquo|rsquo|ndash|mdash|hellip|rarr|larr|uarr|darr);'

$totalErros = 0

foreach ($arq in $arquivos) {
    if (-not (Test-Path $arq)) {
        Write-Host "Arquivo nao encontrado: $arq"
        $totalErros++
        continue
    }

    # 1. Validar leitura UTF-8 estrita
    try {
        $conteudo = [System.IO.File]::ReadAllText($arq, [System.Text.Encoding]::UTF8)
    } catch {
        Write-Host "[FALHA] $arq : Erro ao decodificar arquivo em UTF-8!"
        $totalErros++
        continue
    }

    # 2. Validar que nao contem entidades HTML proibidas (exceto em comentarios de regra)
    $linhas = $conteudo -split "`r?`n"
    $infratoresEntidades = 0
    for ($i = 0; $i -lt $linhas.Length; $i++) {
        $linha = $linhas[$i]
        # Ignora linhas de comentario ou documentacao que citam explicitamente a regra de proibicao
        if ($linha -match 'PROIBIDO' -or $linha -match 'proibicao' -or $linha -match 'prohibited' -or $linha -match 'terminantemente') {
            continue
        }
        $matches = [regex]::Matches($linha, $regexEntidadesProibidas)
        if ($matches.Count -gt 0) {
            $infratoresEntidades += $matches.Count
            Write-Host "  Linha $($i+1): $linha"
        }
    }

    if ($infratoresEntidades -gt 0) {
        Write-Host "[FALHA] $arq : $infratoresEntidades entidades HTML proibidas encontradas!"
        $totalErros++
        continue
    }

    # 3. Validar headers em HTML
    if ($arq.EndsWith('.html')) {
        if ($conteudo -notmatch '<meta\s+charset=["'']UTF-8["'']' -and $conteudo -notmatch '<meta\s+charset=["'']utf-8["'']') {
            Write-Host "[FALHA] $arq : Header <meta charset=""UTF-8""> ausente!"
            $totalErros++
            continue
        }
    }

    # 4. Validar headers em CSS
    if ($arq.EndsWith('.css')) {
        if (-not $conteudo.StartsWith('@charset "UTF-8";')) {
            Write-Host "[FALHA] $arq : Header @charset ""UTF-8""; ausente no inicio do arquivo!"
            $totalErros++
            continue
        }
    }

    Write-Host "[OK] $arq : UTF-8 nativo valido, headers corretos e zero entidades proibidas."
}

if ($totalErros -gt 0) {
    Write-Host "`nTOTAL DE ERROS DE CODIFICACAO: $totalErros"
    exit 1
} else {
    Write-Host "`nSUCESSO: Todos os arquivos estao em conformidade com UTF-8 nativo e sem entidades HTML!"
    exit 0
}
