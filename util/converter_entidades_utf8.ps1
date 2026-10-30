# Script utilitario para conversao de entidades HTML em UTF-8 direto
# Projeto: JusGovBR - Copia Inteligente & PJe Turbo

$mapaEntidades = New-Object 'System.Collections.Generic.Dictionary[string, string]' ([System.StringComparer]::Ordinal)

$listaPares = @(
    @('&ccedil;', [char]0x00E7),
    @('&Ccedil;', [char]0x00C7),
    @('&atilde;', [char]0x00E3),
    @('&Atilde;', [char]0x00C3),
    @('&otilde;', [char]0x00F5),
    @('&Otilde;', [char]0x00D5),
    @('&aacute;', [char]0x00E1),
    @('&Aacute;', [char]0x00C1),
    @('&eacute;', [char]0x00E9),
    @('&Eacute;', [char]0x00C9),
    @('&iacute;', [char]0x00ED),
    @('&Iacute;', [char]0x00CD),
    @('&oacute;', [char]0x00F3),
    @('&Oacute;', [char]0x00D3),
    @('&uacute;', [char]0x00FA),
    @('&Uacute;', [char]0x00DA),
    @('&acirc;',  [char]0x00E2),
    @('&Acirc;',  [char]0x00C2),
    @('&ecirc;',  [char]0x00EA),
    @('&Ecirc;',  [char]0x00CA),
    @('&ocirc;',  [char]0x00F4),
    @('&Ocirc;',  [char]0x00D4),
    @('&agrave;', [char]0x00E0),
    @('&Agrave;', [char]0x00C0),
    @('&uuml;',   [char]0x00FC),
    @('&Uuml;',   [char]0x00DC),
    @('&ordm;',   [char]0x00BA),
    @('&ordf;',   [char]0x00AA),
    @('&sect;',   [char]0x00A7),
    @('&bull;',   [char]0x2022),
    @('&ldquo;',  '"'),
    @('&rdquo;',  '"'),
    @('&lsquo;',  "'"),
    @('&rsquo;',  "'"),
    @('&ndash;',  [char]0x2013),
    @('&mdash;',  [char]0x2014),
    @('&hellip;', [char]0x2026),
    @('&rarr;',   [char]0x2192),
    @('&larr;',   [char]0x2190),
    @('&uarr;',   [char]0x2191),
    @('&darr;',   [char]0x2193)
)

foreach ($par in $listaPares) {
    $mapaEntidades.Add($par[0], $par[1].ToString())
}

$utf8SemBom = [System.Text.UTF8Encoding]::new($false)

$arquivos = @(
    'src\cfg\options.html',
    'src\cfg\options.js',
    'src\cfg\popup.html',
    'src\cfg\popup.js',
    'src\cfg\editor_demo.js',
    'src\mod-copia\AvisoFlutuante.js',
    'src\cfg\debug.js'
)

foreach ($relPath in $arquivos) {
    $fullPath = Join-Path "Z:\AddonChrome" $relPath
    if (-not (Test-Path $fullPath)) {
        Write-Host "Arquivo nao encontrado: $fullPath"
        continue
    }

    $conteudo = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
    $contagemAntes = 0
    foreach ($k in $mapaEntidades.Keys) {
        $matches = [regex]::Matches($conteudo, [regex]::Escape($k))
        $contagemAntes += $matches.Count
        if ($matches.Count -gt 0) {
            $conteudo = $conteudo.Replace($k, $mapaEntidades[$k])
        }
    }

    [System.IO.File]::WriteAllText($fullPath, $conteudo, $utf8SemBom)
    Write-Host "[CONVERTIDO] $relPath : $contagemAntes entidades substituidas por UTF-8 nativo."
}
