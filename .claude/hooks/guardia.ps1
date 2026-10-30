# Guardia de agentes: hook PreToolUse de Claude Code.
# Lee por stdin el JSON de la llamada a la herramienta y decide:
#   exit 0 = permitir; exit 2 = BLOQUEAR (el mensaje de stderr vuelve al agente).
#
# Uso (en el frontmatter de cada agente):
#   powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/guardia.ps1 -Modo Escritura -Perfil docs
#   powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/guardia.ps1 -Modo Bash -Perfil ejecutor
#
# Limites: compara texto (rutas y comandos); no es una frontera de seguridad
# (no analiza `sh -c`, scripts ni variables). Es una barrera tecnica
# adicional a las reglas de conducta de cada agente.

param(
    [Parameter(Mandatory = $true)][ValidateSet('Escritura', 'Bash')][string]$Modo,
    [Parameter(Mandatory = $true)][string]$Perfil
)

$ErrorActionPreference = 'Stop'

function Bloquear([string]$Motivo) {
    [Console]::Error.WriteLine("BLOQUEADO por .claude/hooks/guardia.ps1 (perfil '$Perfil'): $Motivo")
    exit 2
}

# ---------------------------------------------------------------- perfiles
$PerfilesEscritura = @{
    'docs'    = @{ Permitir = @('^documents/'); Denegar = @() }
    'specs'   = @{ Permitir = @('^documents/specs/'); Denegar = @() }
    'd1'      = @{ Permitir = @('^api/migrations/', '^documents/specs/'); Denegar = @() }
    'api'     = @{ Permitir = @('^api/(src|test)/'); Denegar = @() }
    'cliente' = @{
        Permitir = @('^src/(repositories|api|config|services)/', '^src/screens/acceso/', '^src/navigation/AccesoNavigator\.js$')
        Denegar  = @('^src/repositories/.*\.sqlite\.js$')
    }
}

$LecturaGit = '^git\s+(diff|log|status|show|rev-parse|ls-files|blame|branch\s+--show-current)\b'

$PerfilesBash = @{
    'lectura-git' = @{ Modo = 'permitir'; Permitir = @($LecturaGit) }
    'ejecutor'    = @{ Modo = 'permitir'; Permitir = @('^npm\s+(run\s+(typecheck|test:integration)|test)\b', '^npx\s+(tsc|vitest)\b', $LecturaGit) }
    'impl-api'    = @{ Modo = 'permitir'; Permitir = @('^npm\s+(run\s+typecheck|test)\b', '^npx\s+(tsc|vitest)\b', $LecturaGit) }
    'cliente'     = @{ Modo = 'permitir'; Permitir = @('^(npx\s+)?esbuild\b', '^(\./)?api/node_modules/\.bin/esbuild\b', '^git\s+mv\s', $LecturaGit) }
    'movil'       = @{
        Modo     = 'permitir'
        Permitir = @('^adb(\.exe)?\s+(version|devices|get-state)\b', '^emulator(\.exe)?\s+(-list-avds|-version|-accel-check)\b', '^java\s+-version\b', '^(where|which)\s', '^command\s+-v\s', '^(node|npm)\s+-v\b', $LecturaGit)
    }
    'd1'          = @{
        Modo     = 'permitir'
        Permitir = @('^npx\s+wrangler\s+(--version|whoami)\b', '^npx\s+wrangler\s+d1\s+(execute|migrations\s+(list|apply)|info|list)\b', $LecturaGit)
    }
    'integracion' = @{ Modo = 'denegar'; Permitir = @() }
}

$ComandosAuxiliares = '^(cd\s+\S+|ls(\s.*)?|dir(\s.*)?|head(\s.*)?|tail(\s.*)?|wc(\s.*)?|sort(\s.*)?|grep(\s.*)?|rg(\s.*)?|echo(\s.*)?|pwd|true|sleep\s+\d+)$'

# Denegado para cualquier agente con Bash protegido.
$DenegarSiempre = @(
    @{ P = '--remote\b'; M = 'las acciones remotas de Cloudflare requieren la aprobacion expresa del usuario' },
    @{ P = 'wrangler\s+(deploy|delete|secret|publish|login|logout)\b'; M = 'deploy, delete y secretos de Cloudflare requieren la aprobacion del usuario' },
    @{ P = 'wrangler\s+d1\s+(create|delete)\b'; M = 'crear o borrar bases D1 requiere la aprobacion del usuario' },
    @{ P = '(^|[\s;&|])git\s+(push|commit|reset|clean|rebase|merge|stash|restore|tag|add|rm|switch|checkout)\b'; M = 'git de escritura lo hace solo el orquestador (push: solo con aprobacion del usuario)' },
    @{ P = 'git\s+branch\s+-[dD]\b'; M = 'no se borran ramas' },
    @{ P = '(^|[\s;&|])npm\s+(install|i|ci|uninstall|update)\b|npx\s+expo\s+install'; M = 'instalar o cambiar dependencias requiere la aprobacion del usuario' },
    @{ P = '\.dev\.vars(?!\.example)'; M = 'no se leen ni se tocan los secretos (api/.dev.vars)' },
    @{ P = '(^|[\s/\\])\.env(\.[A-Za-z]+)?(\s|$)'; M = 'no se leen ni se tocan archivos .env' },
    @{ P = '(^|[\s;&|])(sudo|chmod|chown|icacls|netsh|Set-ExecutionPolicy|New-NetFirewallRule)\b'; M = 'cambios de permisos o del sistema requieren la aprobacion del usuario' }
)

# ------------------------------------------------------------------ entrada
$entrada = [Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($entrada)) { Bloquear 'no llego informacion del hook (stdin vacio).' }

try { $datos = $entrada | ConvertFrom-Json } catch { Bloquear 'no se pudo interpretar el JSON del hook.' }

$herramienta = $datos.tool_input

function Buscar-Raiz {
    $inicio = $env:CLAUDE_PROJECT_DIR
    if (-not $inicio) { $inicio = $datos.cwd }
    if (-not $inicio) { $inicio = (Get-Location).Path }
    $dir = [IO.Path]::GetFullPath($inicio)
    while ($dir) {
        if ((Test-Path (Join-Path $dir '.claude')) -or (Test-Path (Join-Path $dir '.git'))) { return $dir }
        $padre = Split-Path $dir -Parent
        if (-not $padre -or $padre -eq $dir) { break }
        $dir = $padre
    }
    return [IO.Path]::GetFullPath($inicio)
}

# --------------------------------------------------------------- escritura
if ($Modo -eq 'Escritura') {

    if (-not $PerfilesEscritura.ContainsKey($Perfil)) { Bloquear "perfil de escritura desconocido '$Perfil'." }

    $ruta = $herramienta.file_path
    if (-not $ruta) { $ruta = $herramienta.notebook_path }
    if (-not $ruta) { Bloquear 'la llamada no incluye file_path.' }

    $raiz = (Buscar-Raiz).TrimEnd('\', '/')
    $completa = if ([IO.Path]::IsPathRooted($ruta)) { [IO.Path]::GetFullPath($ruta) } else { [IO.Path]::GetFullPath((Join-Path $raiz $ruta)) }

    if (-not $completa.StartsWith($raiz + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        Bloquear "la ruta queda fuera del proyecto: $completa"
    }

    $rel = $completa.Substring($raiz.Length + 1).Replace('\', '/')

    $siempre = @('^\.git/', '^\.claude/(settings.*\.json|hooks/)', '(^|/)node_modules/', '(^|/)\.wrangler/', '^api/\.dev\.vars$', '(^|/)\.env($|\.)', '^documents/traspaso/')
    foreach ($p in $siempre) { if ($rel -match $p) { Bloquear "ruta protegida: $rel" } }

    $cfg = $PerfilesEscritura[$Perfil]
    foreach ($p in $cfg.Denegar) { if ($rel -match $p) { Bloquear "este perfil no puede modificar $rel" } }

    foreach ($p in $cfg.Permitir) { if ($rel -match $p) { exit 0 } }

    Bloquear "este agente solo puede escribir en: $($cfg.Permitir -join ', '). Ruta pedida: $rel"
}

# ------------------------------------------------------------------- bash
if (-not $PerfilesBash.ContainsKey($Perfil)) { Bloquear "perfil de Bash desconocido '$Perfil'." }

$comando = [string]$herramienta.command
if ([string]::IsNullOrWhiteSpace($comando)) { Bloquear 'comando vacio.' }

foreach ($regla in $DenegarSiempre) {
    if ($comando -match $regla.P) { Bloquear $regla.M }
}

# borrado recursivo: solo en el perfil de integracion y solo sobre sus directorios temporales
if ($comando -match 'rm\s+-[a-zA-Z]*[rR]|Remove-Item[^|;&]*-Recurse') {
    if ($Perfil -ne 'integracion' -or $comando -notmatch 'kikirikis-it-') {
        Bloquear 'el borrado recursivo solo se permite sobre directorios temporales kikirikis-it-* del probador de integracion.'
    }
}

# comandos de wrangler: siempre locales
if ($comando -match 'wrangler\s+d1\s+(execute|migrations)') {
    if ($comando -notmatch '--local\b') { Bloquear 'wrangler d1 debe usar --local.' }
    if ($Perfil -eq 'integracion' -and $comando -notmatch '--persist-to\b') { Bloquear 'en pruebas de integracion usa --persist-to con un directorio temporal (no la base de desarrollo).' }
}
if ($comando -match 'wrangler\s+d1\s+migrations\s+apply' -and $comando -notmatch '--persist-to\b') {
    Bloquear 'migrations apply solo se permite con --persist-to <directorio temporal>: la base local de desarrollo la migra el orquestador o el usuario.'
}
if ($comando -match 'wrangler\s+d1\s+execute' -and $comando -match '\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|TRUNCATE|ATTACH|VACUUM)\b') {
    Bloquear 'wrangler d1 execute solo admite consultas de lectura (SELECT).'
}
if ($comando -match 'wrangler\s+dev\b') {
    if ($Perfil -ne 'integracion') { Bloquear 'este perfil no levanta el Worker.' }
    if ($comando -notmatch '--persist-to\b' -or $comando -notmatch '--port\b') { Bloquear 'wrangler dev debe llevar --persist-to <dir temporal> y --port <puerto de pruebas>.' }
}

$cfg = $PerfilesBash[$Perfil]

if ($cfg.Modo -eq 'denegar') { exit 0 }

# perfiles de lista permitida: sin sustitucion de comandos ni redirecciones
$limpio = ($comando -replace '2>&1', '') -replace '[0-9]?>\s*/dev/null', ''
if ($limpio -match '`|\$\(|>') { Bloquear 'no se permiten sustituciones de comandos ni redirecciones.' }

$limpio = $limpio -replace '&\s*$', ''
$segmentos = $limpio -split '\r?\n|&&|\|\||;|\|' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

foreach ($segmento in $segmentos) {
    $ok = $false
    if ($segmento -match $ComandosAuxiliares) { $ok = $true }
    else { foreach ($p in $cfg.Permitir) { if ($segmento -match $p) { $ok = $true; break } } }
    if (-not $ok) { Bloquear "comando no permitido para este agente: '$segmento'." }
}

exit 0
