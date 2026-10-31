# Despachador del guardia: hook PreToolUse registrado en .claude/settings.json.
# Lee el JSON del hook por stdin, identifica el subagente por `agent_type` y
# delega en guardia.ps1 con el perfil de ese agente.
#   - Subagente conocido: aplica su perfil (exit 2 = bloquear).
#   - Cualquier otro origen (usuario, orquestador, subagentes no listados): PERMITE.
# Para desactivarlo: quitar la entrada PreToolUse de .claude/settings.json.

$ErrorActionPreference = 'Stop'

$PerfilesPorAgente = @{
    'redactor-documentacion'     = @{ Escritura = 'docs' }
    'analista-codigo-v1'         = @{ Escritura = 'specs' }
    'especialista-base-datos-d1' = @{ Escritura = 'd1'; Bash = 'd1' }
    'implementador-api'          = @{ Escritura = 'api'; Bash = 'impl-api' }
    'implementador-cliente-app'  = @{ Escritura = 'cliente'; Bash = 'cliente' }
    'revisor-de-cambios'         = @{ Bash = 'lectura-git' }
    'revisor-arquitectura-v2'    = @{ Bash = 'lectura-git' }
    'ejecutor-de-pruebas'        = @{ Bash = 'ejecutor' }
    'probador-integracion-api'   = @{ Bash = 'integracion' }
    'probador-movil'             = @{ Bash = 'movil' }
}

$entrada = [Console]::In.ReadToEnd()
$agente = ''
$herr = ''
try {
    $datos = $entrada | ConvertFrom-Json
    $agente = [string]$datos.agent_type
    $herr = [string]$datos.tool_name
} catch {
    exit 0
}

if (-not $PerfilesPorAgente.ContainsKey($agente)) {
    exit 0
}

$modo = if ($herr -eq 'Bash') { 'Bash' } elseif ($herr -in @('Write', 'Edit', 'MultiEdit', 'NotebookEdit')) { 'Escritura' } else { '' }
if (-not $modo -or -not $PerfilesPorAgente[$agente].ContainsKey($modo)) {
    exit 0
}
$perfil = $PerfilesPorAgente[$agente][$modo]

$guardia = Join-Path $PSScriptRoot 'guardia.ps1'
try {
    $ErrorActionPreference = 'Continue'
    $salida = $entrada | & powershell -NoProfile -ExecutionPolicy Bypass -File $guardia -Modo $modo -Perfil $perfil 2>&1
    $codigo = $LASTEXITCODE
} catch {
    [Console]::Error.WriteLine("BLOQUEADO: fallo del guardia ($($_.Exception.Message)).")
    exit 2
}

if ($codigo -eq 0) { exit 0 }
if ($salida) { [Console]::Error.WriteLine(($salida | Out-String).Trim()) }
exit 2
