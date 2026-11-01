# Hook SessionStart: muestra las 3 ultimas entradas de documents/bitacora.md.
# Solo lectura, sin red; siempre termina con salida 0.
try {
    $raiz = $env:CLAUDE_PROJECT_DIR
    if (-not $raiz) { $raiz = (Get-Location).Path }
    $archivo = Join-Path $raiz 'documents/bitacora.md'
    if (-not (Test-Path -LiteralPath $archivo)) { exit 0 }

    $lineas = [System.IO.File]::ReadAllLines($archivo, [System.Text.Encoding]::UTF8)
    $entradas = 0
    $salida = New-Object System.Collections.Generic.List[string]
    foreach ($linea in $lineas) {
        if ($linea.StartsWith('## ')) {
            $entradas++
            if ($entradas -gt 3) { break }
        }
        if ($entradas -ge 1) {
            if ($linea -match 'http|workers\.dev|@') { continue }
            $salida.Add($linea)
        }
    }
    if ($salida.Count -eq 0) { exit 0 }

    $texto = ($salida -join "`n")
    if ($texto.Length -gt 3000) { $texto = $texto.Substring(0, 3000) }

    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Output ("Ultimas entradas de la bitacora (solo lectura):`n" + $texto)
}
catch {
    # Nunca bloquea el inicio de la sesion.
}
exit 0
