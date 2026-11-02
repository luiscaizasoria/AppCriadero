---
name: probar
description: Ejecuta las pruebas automáticas del proyecto contra el Worker de pruebas y el emulador (datos, smoke o completo) y devuelve un resumen de máximo 15 líneas con la ruta del informe. Solo la invoca el usuario o el orquestador.
disable-model-invocation: true
argument-hint: datos | smoke | completo
allowed-tools: Bash(node pruebas/datos/ejecutar.mjs*) Bash(node pruebas/movil/ejecutar.mjs*) Bash(adb devices) Bash(git status*)
---

# /probar

Pruebas automáticas (detalle y cómo se instalaron las herramientas: `pruebas/README.md`).

| Argumento | Qué ejecuta | Duración típica |
|---|---|---|
| `datos` | `node pruebas/datos/ejecutar.mjs`: clientes REST reales de la app contra el Worker de pruebas (acceso, catálogos, jaulas, aves y aislamiento entre cuentas). | ~30 s |
| `smoke` | `node pruebas/movil/ejecutar.mjs smoke`: login, elegir criadero, crear una jaula, cerrar sesión, en el emulador. | ~2 min |
| `completo` | `node pruebas/movil/ejecutar.mjs completo`: flujos migrados (acceso, catálogos, jaulas, aves) y flujos «esperado fallar» de lo no migrado. | ~25 min |

## Pasos

1. La URL del Worker de pruebas la lee el ejecutor de `EXPO_PUBLIC_API_URL` o, si no existe, de `pruebas/.entorno.local` (ignorado por Git; ver `pruebas/README.md`). **Nunca** la escribas en archivos versionados, informes ni en el chat. Si el ejecutor avisa de que falta, detente y dile al usuario cómo crearla.
2. Ejecuta el comando de la tabla desde la raíz del repositorio. El ejecutor reutiliza lo que ya esté arrancado (emulador, Expo Go, Metro) y arranca lo que falte; las cuentas de prueba son desechables (`@kikirikis.test`) y se borran al terminar (nunca la cuenta del usuario).
3. Responde con **máximo 15 líneas**: si el resumen del informe empieza con `PENDIENTE DE MIGRAR: …`, esa va como **primera línea** y no presentes el resultado como verde; después veredicto, cuántos pasaron, regresiones (flujo y motivo en una línea), flujos «esperado fallar» (confirmados o «migrado, quitar etiqueta»), duración y la **ruta del informe** (`pruebas/informes/AAAA-MM-DD-HHMM-<modo>/`).
4. Si hay regresiones, no las corrijas aquí: devuélvelas al implementador del módulo con la ruta del informe.

## Reglas

- Solo `--env test` / `criadero-kikirikis-test`: el ejecutor ya lo respeta (borrado solo de `%@kikirikis.test`). Nada contra `criadero-kikirikis-dev`, `controlgastos-*` ni producción.
- No modifiques pantallas V1 ni añadas `testID`: los flujos identifican elementos por texto visible.
- No instales herramientas ni cambies `package.json`; si falta algo, indícalo.
