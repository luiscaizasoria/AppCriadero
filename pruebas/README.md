# Pruebas automáticas

Dos capas, sin tocar `package.json` de la raíz ni de `api/`. Todo lo instalado vive **fuera del repositorio** (`C:\Android\kikirikis-tools`). Informes en `pruebas/informes/` y caché en `pruebas/.cache/` (ambos ignorados por Git).

## URL del Worker de pruebas (nunca en archivos versionados)

Los ejecutores la buscan en este orden:

1. Variable de entorno `EXPO_PUBLIC_API_URL`.
2. Archivo local **ignorado por Git** `pruebas/.entorno.local`.

Crear el archivo (PowerShell, desde la raíz; sustituye la URL):

```powershell
Copy-Item pruebas/.entorno.local.example pruebas/.entorno.local
Set-Content pruebas/.entorno.local 'EXPO_PUBLIC_API_URL=https://<tu-worker-de-pruebas>.workers.dev'
```

(`pruebas/.entorno.local.example` es solo una plantilla con un marcador.) Si no existe ninguna de las dos, los ejecutores terminan con un aviso.

## Comandos

| Atajo | Comando (desde la raíz) | Duración |
|---|---|---|
| `/probar datos` | `node pruebas/datos/ejecutar.mjs` | ~30 s |
| `/probar smoke` | `node pruebas/movil/ejecutar.mjs smoke` | ~2 min |
| `/probar completo` | `node pruebas/movil/ejecutar.mjs completo` | ~25 min |
| fallo de demostración | `FALLO_PROVOCADO=1 node pruebas/movil/ejecutar.mjs smoke` | ~1,5 min |

Opciones: `--solo=<grupo>` y `--sin-limpiar` (datos); `--flujo=<texto>` y `--sin-limpiar` (móvil). Solo limpiar: `node pruebas/datos/ejecutar.mjs --solo-limpiar`.

## Capa 1: datos (`pruebas/datos`)

Empaqueta con esbuild (el de `api/node_modules`) los clientes REST **reales** de la app (`src/api` y `src/repositories/*.api.js`), cambiando solo `expo-secure-store` por una memoria, y los ejecuta en Node contra el Worker de pruebas. Cubre acceso y sesión inválida, catálogos, jaulas, aves y el **aislamiento entre cuentas** (cuenta A con ids y `criaderoId` de la cuenta B en cada endpoint: 403/404 y sin datos ajenos). Cuentas `datos-*@kikirikis.test`, contraseñas aleatorias en memoria.

## Capa 2: flujos de pantalla (`pruebas/movil`)

- **Herramienta:** Maestro 2.12.1, que funciona de forma nativa en Windows (necesita Java 17+; **no exige WSL**).
- **Entorno (lo prepara solo el ejecutor si falta algo):** AVD `Medium_Phone_API_37.0`; Expo Go 57.0.9 por `adb install` (APK en `C:\Android\kikirikis-tools\expo-go`); Play Store desactivada en el emulador (`pm disable-user com.android.vending`) para que Expo Go no se actualice solo; aviso de pantalla completa confirmado; Metro en el puerto **8090** con `--offline` y `EXPO_PUBLIC_DATA_SOURCE=api`; `adb reverse tcp:8090 tcp:8090` y enlace profundo `exp://127.0.0.1:8090`. El emulador alcanza el Worker por Internet.
- **Maestro:** `C:\Android\kikirikis-tools\maestro\maestro\bin` (se añade al PATH solo dentro de `ejecutar-flujo.sh`, con `JAVA_TOOL_OPTIONS=-Dfile.encoding=UTF-8` para los acentos).
- **Flujos** (`pruebas/movil/flujos/`): `smoke/`, `completo/` (migrados: acceso, catálogos, jaulas, aves, cuidados, salud, huevos —`70-huevo` y `71-produccion-huevos`—, `80-genealogia` y `81-ciclo-vida`), `esperado-fallar/` (lo no migrado) y `lib/` (abrir app, iniciar sesión). Identifican elementos por **texto visible**; no hay `testID` ni cambios en pantallas V1. La primera línea `# SEMILLA:` indica los datos que `lib/preparar.mjs` crea **por API** (jaulas y aves) antes del flujo.
- **Aislamiento:** cada flujo usa una cuenta desechable nueva (`movil-*@kikirikis.test`), borra los datos de Expo Go (`clearState`) y al final se borran todas las cuentas `@kikirikis.test` de la base de pruebas. Nunca se usa la cuenta del usuario.
- **Opción de semilla `--huevos=AVE:JAULA:DIAS_ATRAS`** de `lib/preparar.mjs`: crea por API huevos del ave indicada con la fecha de hace N días (0 = hoy); la usa `71-produccion-huevos`.
- **Módulos pendientes:** los flujos `esperado-fallar/` llevan en su cabecera `# ESPERADO FALLAR (<módulo>)`. Si alguno confirma el fallo, el resumen empieza con `PENDIENTE DE MIGRAR: <módulos>` y el veredicto es «SIN REGRESIONES, CON MODULOS PENDIENTES (no es verde)». Si ninguno está pendiente, esa línea no aparece y el veredicto es VERDE.
- **Resultados:** `PASO`, `REGRESION` (flujo migrado que falla), `FALLO DE ENTORNO` (Maestro/adb; se reintenta una vez), `FALLO COMO SE ESPERABA` (flujo «esperado fallar» que sigue fallando) y `MIGRADO, QUITAR ETIQUETA` (un flujo «esperado fallar» que ya pasa: moverlo a `completo/`).
- **Informe** `pruebas/informes/AAAA-MM-DD-HHMM-<modo>/`: `resumen.md`, `resultados.json`, `wrangler-tail.log` (`wrangler tail --env test` de toda la ejecución) y, por flujo, las capturas de Maestro; si falla: `pantalla-final.png`, `logcat.txt` (filtrado), `metro.txt`, `intervalo.txt` (para cruzar con el tail) y `maestro.log`.

## Deshacer lo instalado

- Quitar Expo Go: `adb uninstall host.exp.exponent`; reactivar Play Store: `adb shell pm enable com.android.vending`.
- Borrar `C:\Android\kikirikis-tools` (Maestro ~334 MB descomprimido, APK 199 MB). No se instaló nada global ni se cambió el PATH del sistema.

## Límite del guardia

El guardia de agentes compara texto; no analiza el contenido de los scripts. Por eso `probador-movil` solo puede escribir en `pruebas/movil/flujos/` (no en `limpiar.mjs`, `lib/` ni los ejecutores) y `adb shell am start` solo admite enlaces `exp://`.

## Excepciones del puerto 8090

Los puertos 8081 y 8082 los suelen ocupar los Expo en túnel del usuario; las pruebas usan 8090 (cambiable con `PUERTO_METRO`).

## Comprobación previa del emulador y versión de Node

- Antes de lanzar Maestro, `ejecutar.mjs` verifica durante hasta 90 s: `sys.boot_completed`, que `pm list packages` responda, `adb reverse` y una petición HTTP a `/api/v1/health` hecha **desde el propio emulador** (`nc` por el puerto 80; el emulador no trae curl ni wget). Si falla, termina con `FALLO DE ENTORNO: <causa>` y no ejecuta flujos.
- Cada ejecución escribe en su propia carpeta `pruebas/informes/AAAA-MM-DD-HHMMSS-<modo>` (con sufijo `-2`, `-3`… si coincidiera); nunca sobrescribe otra.
- Node: el proyecto fija **Node 22** con `.nvmrc` en la raíz (sin `engines`, para no tocar los `package.json`). Las pruebas pasaron también con Node 24.
- **Defensas del ejecutor (2026-11-05):** máximo 6 min por flujo (si lo supera se termina todo el árbol de procesos, incluido el `java` de Maestro, que `taskkill /T` no alcanza, y se desinstala su servidor del emulador; el flujo queda `FALLO DE ENTORNO` con «flujo colgado» y la hora) y 90 min por ejecución (`EJECUCIÓN ABORTADA POR TIEMPO`, con el resumen de lo ejecutado). Con dos `FALLO DE ENTORNO` seguidos intenta UNA vez recuperar `emulator-5554` (`adb emu kill` y `Start-Process`); si vuelve a ocurrir, aborta con la causa. `resumen.md` se reescribe tras cada flujo y `logcat-continuo.txt`, `metro.txt`, `wrangler-tail.log` y `eventos.log` se guardan a medida que se generan. Solo para probar estas defensas: `FLUJO_MAX_MS` y `EJECUCION_MAX_MS` (milisegundos) junto con `FALLO_PROVOCADO=1` y flujos temporales con una espera larga en `flujos/demo/`.
- **Segunda cuenta en un flujo:** una línea `# SEGUNDA-CUENTA` junto a `# SEMILLA:` hace que `preparar.mjs --segunda-cuenta` cree otra cuenta desechable con un criadero vacío (`Criadero segundo`) y el flujo reciba `EMAIL2`, `PASSWORD2` y `CRIADERO2` (ejemplo: `completo/98-clientes.yaml`, aislamiento entre dos cuentas en el mismo teléfono).
- Emulador colgado (`pm list packages` con `Broken pipe`): `adb reboot` no basta; `adb -s emulator-5554 emu kill` y volver a arrancar el AVD lo resolvió.
