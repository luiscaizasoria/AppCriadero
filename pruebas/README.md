# Pruebas automáticas

Dos capas, sin tocar `package.json` de la raíz ni de `api/`. Todo lo instalado vive **fuera del repositorio** (`C:\Android\kikirikis-tools`). Informes en `pruebas/informes/` y caché en `pruebas/.cache/` (ambos ignorados por Git).

La URL del Worker de pruebas va **solo** en la variable de entorno `EXPO_PUBLIC_API_URL` (nunca en archivos ni en informes versionados). Para que persista entre sesiones: `setx EXPO_PUBLIC_API_URL "<url>"` (y reabrir la terminal).

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
- **Flujos** (`pruebas/movil/flujos/`): `smoke/`, `completo/` (migrados: acceso, catálogos, jaulas, aves), `esperado-fallar/` (lo no migrado) y `lib/` (abrir app, iniciar sesión). Identifican elementos por **texto visible**; no hay `testID` ni cambios en pantallas V1. La primera línea `# SEMILLA:` indica los datos que `lib/preparar.mjs` crea **por API** (jaulas y aves) antes del flujo.
- **Aislamiento:** cada flujo usa una cuenta desechable nueva (`movil-*@kikirikis.test`), borra los datos de Expo Go (`clearState`) y al final se borran todas las cuentas `@kikirikis.test` de la base de pruebas. Nunca se usa la cuenta del usuario.
- **Resultados:** `PASO`, `REGRESION` (flujo migrado que falla), `FALLO DE ENTORNO` (Maestro/adb; se reintenta una vez), `FALLO COMO SE ESPERABA` (flujo «esperado fallar» que sigue fallando) y `MIGRADO, QUITAR ETIQUETA` (un flujo «esperado fallar» que ya pasa: moverlo a `completo/`).
- **Informe** `pruebas/informes/AAAA-MM-DD-HHMM-<modo>/`: `resumen.md`, `resultados.json`, `wrangler-tail.log` (`wrangler tail --env test` de toda la ejecución) y, por flujo, las capturas de Maestro; si falla: `pantalla-final.png`, `logcat.txt` (filtrado), `metro.txt`, `intervalo.txt` (para cruzar con el tail) y `maestro.log`.

## Deshacer lo instalado

- Quitar Expo Go: `adb uninstall host.exp.exponent`; reactivar Play Store: `adb shell pm enable com.android.vending`.
- Borrar `C:\Android\kikirikis-tools` (Maestro ~334 MB descomprimido, APK 199 MB). No se instaló nada global ni se cambió el PATH del sistema.

## Excepciones del puerto 8090

Los puertos 8081 y 8082 los suelen ocupar los Expo en túnel del usuario; las pruebas usan 8090 (cambiable con `PUERTO_METRO`).
