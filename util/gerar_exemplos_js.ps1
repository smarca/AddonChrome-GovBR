<#
 ==============================================================================
 SCRIPT: util/gerar_exemplos_js.ps1
 PROJETO: JusGovBR — Seleção & Cópia Inteligente + PJe Turbo
 AUTOR/CONTATO: smarca@gmail.com
 
 ESPECIFICAÇÃO DE ENGENHARIA E DIRETRIZES DE USO (BLUEPRINT):
 1) FINALIDADE PRIMÁRIA:
    Compilador determinístico de código (Build Tool) que transforma o catálogo centralizado
    'src/cfg/exemplos.json' (Fonte Única da Verdade / ADR-005) no módulo JavaScript de alta
    performance 'src/cfg/exemplos.js'.
 2) GARANTIA DE IMUTABILIDADE E INTEGRIDADE V8:
    Gera o grafo completo com congelamento profundo ('Object.freeze' em todos os níveis:
    catálogo, casos de uso, máscaras, arrays de exemplos positivos e negativos), garantindo
    que o motor V8 do Chrome trate o catálogo como estrutura de dados estática imutável.
 3) QUANDO UTILIZAR (GATILHOS OPERACIONAIS):
    - Sempre que novas máscaras, regexes ou exemplos forenses forem adicionados em 'exemplos.json'.
    - Após a execução, rodar 'util/executar_auditoria.ps1' para validar os 300 testes.
 ==============================================================================
#>

$ErrorActionPreference = 'Stop'
$testesDir = $PSScriptRoot
$baseDir = (Get-Item $testesDir).Parent.FullName
$jsonPath = Join-Path $baseDir 'src\cfg\exemplos.json'
$jsPath = Join-Path $baseDir 'src\cfg\exemplos.js'

$json = Get-Content $jsonPath -Raw -Encoding UTF8 | ConvertFrom-Json

$sb = [System.Text.StringBuilder]::new()

$sb.AppendLine("/* ==========================================================================") | Out-Null
$sb.AppendLine(" * PROJETO: JusGovBR - Catalogo Estruturado de Exemplos Homologados") | Out-Null
$sb.AppendLine(" * ARQUIVO: exemplos.js") | Out-Null
$sb.AppendLine(" * GERADO AUTOMATICAMENTE a partir de exemplos.json") | Out-Null
$sb.AppendLine(" * Centralizado no padrao append-only: no minimo 5 positivos e 5 negativos por mascara.") | Out-Null
$sb.AppendLine(" * ========================================================================== */") | Out-Null
$sb.AppendLine("") | Out-Null
$sb.AppendLine("'use strict';") | Out-Null
$sb.AppendLine("") | Out-Null
$sb.AppendLine("const CATALOGO_EXEMPLOS_JUSGOVBR = Object.freeze({") | Out-Null
$sb.AppendLine("    politica: '$($json.politica)',") | Out-Null
$sb.AppendLine("    arquivoCentralizador: 'src/cfg/exemplos.json',") | Out-Null
$sb.AppendLine("    casosDeUso: Object.freeze([") | Out-Null

$casosCount = $json.casosDeUso.Count
for ($i = 0; $i -lt $casosCount; $i++) {
    $c = $json.casosDeUso[$i]
    $sb.AppendLine("        Object.freeze({") | Out-Null
    $sb.AppendLine("            idCasoUso: '$($c.idCasoUso)',") | Out-Null
    $sb.AppendLine("            titulo: '$($c.titulo -replace "'", "\'")',") | Out-Null
    $sb.AppendLine("            descricao: '$($c.descricao -replace "'", "\'")',") | Out-Null
    $sb.AppendLine("            comoUsar: '$($c.comoUsar -replace "'", "\'")',") | Out-Null
    $sb.AppendLine("            mascaras: Object.freeze([") | Out-Null

    $mascCount = $c.mascaras.Count
    for ($j = 0; $j -lt $mascCount; $j++) {
        $m = $c.mascaras[$j]
        $sb.AppendLine("                Object.freeze({") | Out-Null
        $sb.AppendLine("                    idMascara: '$($m.idMascara)',") | Out-Null
        $sb.AppendLine("                    nome: '$($m.nome -replace "'", "\'")',") | Out-Null
        $sb.AppendLine("                    mascara: '$($m.mascara -replace "'", "\'")',") | Out-Null
        $sb.AppendLine("                    grupoMotor: '$($m.grupoMotor)',") | Out-Null
        $sb.AppendLine("                    tipoBloco: '$($m.tipoBloco)',") | Out-Null
        if ($m.metodoValidacao) {
            $sb.AppendLine("                    metodoValidacao: '$($m.metodoValidacao)',") | Out-Null
        }
        if ($m.PSObject.Properties['ehPlaceholderMinuta'] -and $m.ehPlaceholderMinuta) {
            $sb.AppendLine("                    ehPlaceholderMinuta: true,") | Out-Null
        }
        $sb.AppendLine("                    calculavel: $(if ($m.calculavel) { 'true' } else { 'false' }),") | Out-Null
        $sb.AppendLine("                    comoUsar: '$($m.comoUsar -replace "'", "\'")',") | Out-Null

        # Positivos
        $sb.AppendLine("                    positivos: Object.freeze([") | Out-Null
        $posCount = $m.positivos.Count
        for ($k = 0; $k -lt $posCount; $k++) {
            $p = $m.positivos[$k]
            $val = $p.valor.Replace("\", "\\").Replace("'", "\'").Replace("`r", "").Replace("`n", "\n")
            $com = $p.comentario.Replace("\", "\\").Replace("'", "\'").Replace("`r", "").Replace("`n", "\n")
            $propsExtras = ""
            if ($p.PSObject.Properties['idxClique']) { $propsExtras += ", idxClique: $($p.idxClique)" }
            if ($p.PSObject.Properties['cliques']) { $propsExtras += ", cliques: $($p.cliques)" }
            if ($p.PSObject.Properties['esperadoClique1']) { $propsExtras += ", esperadoClique1: '$($p.esperadoClique1)'" }
            if ($p.PSObject.Properties['validarApenasExtracao']) { $propsExtras += ", validarApenasExtracao: true" }
            if ($p.PSObject.Properties['validarApenasCatalogoOuConversao']) { $propsExtras += ", validarApenasCatalogoOuConversao: true" }
            if ($p.PSObject.Properties['validarApenasAltLink3Cliques']) { $propsExtras += ", validarApenasAltLink3Cliques: true" }
            if ($p.PSObject.Properties['esperadoConversaoPje']) { $propsExtras += ", esperadoConversaoPje: '$($p.esperadoConversaoPje)'" }
            if ($p.PSObject.Properties['esperadoUmaLinha']) { $propsExtras += ", esperadoUmaLinha: '$($p.esperadoUmaLinha)'" }
            $virgula = if ($k -lt $posCount - 1) { "," } else { "" }
            $sb.AppendLine("                        Object.freeze({ valor: '$val'$propsExtras, comentario: '$com' })$virgula") | Out-Null
        }
        $sb.AppendLine("                    ]),") | Out-Null

        # Negativos
        $sb.AppendLine("                    negativos: Object.freeze([") | Out-Null
        $negCount = $m.negativos.Count
        for ($k = 0; $k -lt $negCount; $k++) {
            $n = $m.negativos[$k]
            $val = $n.valor.Replace("\", "\\").Replace("'", "\'").Replace("`r", "").Replace("`n", "\n")
            $com = $n.comentario.Replace("\", "\\").Replace("'", "\'").Replace("`r", "").Replace("`n", "\n")
            $virgula = if ($k -lt $negCount - 1) { "," } else { "" }
            $sb.AppendLine("                        Object.freeze({ valor: '$val', comentario: '$com' })$virgula") | Out-Null
        }
        $sb.AppendLine("                    ])") | Out-Null

        $virgulaMasc = if ($j -lt $mascCount - 1) { "," } else { "" }
        $sb.AppendLine("                })$virgulaMasc") | Out-Null
    }
    $sb.AppendLine("            ])") | Out-Null

    $virgulaCaso = if ($i -lt $casosCount - 1) { "," } else { "" }
    $sb.AppendLine("        })$virgulaCaso") | Out-Null
}

$sb.AppendLine("    ])") | Out-Null
$sb.AppendLine("});") | Out-Null
$sb.AppendLine("") | Out-Null
$sb.AppendLine("if (typeof window !== 'undefined') {") | Out-Null
$sb.AppendLine("    window.JusGovExemplosCatalogo = CATALOGO_EXEMPLOS_JUSGOVBR;") | Out-Null
$sb.AppendLine("}") | Out-Null
$sb.AppendLine("if (typeof module !== 'undefined' && module.exports) {") | Out-Null
$sb.AppendLine("    module.exports = CATALOGO_EXEMPLOS_JUSGOVBR;") | Out-Null
$sb.AppendLine("}") | Out-Null

[System.IO.File]::WriteAllText((Resolve-Path $jsPath).Path, $sb.ToString(), [System.Text.UTF8Encoding]::new($false))
Write-Host "src/cfg/exemplos.js gerado e sincronizado com sucesso!"
