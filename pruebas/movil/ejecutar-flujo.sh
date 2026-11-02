#!/usr/bin/env bash
# Ejecuta un flujo Maestro con una cuenta desechable preparada por API.
# Uso: pruebas/movil/ejecutar-flujo.sh <flujo.yaml> [--jaulas=..] [--aves=..]
# Requiere EXPO_PUBLIC_API_URL en el entorno. Salida: carpeta de depuracion en pruebas/.cache/maestro.
set -u
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
export PATH="$PATH:/c/Android/kikirikis-tools/maestro/maestro/bin"
export JAVA_TOOL_OPTIONS=-Dfile.encoding=UTF-8
FLUJO="$1"; shift
DATOS="$(node "$RAIZ/pruebas/movil/lib/preparar.mjs" "$@")" || exit 3
campo() { echo "$DATOS" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d)['$1']))"; }
maestro test -e "EMAIL=$(campo email)" -e "PASSWORD=$(campo password)" -e "CRIADERO=$(campo criadero)" \
  -e "PUERTO_METRO=${PUERTO_METRO:-8090}" --test-output-dir "${SALIDA_MAESTRO:-$RAIZ/pruebas/.cache/maestro}" "$FLUJO"
