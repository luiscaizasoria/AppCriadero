# Estado actual (resumen de sesión)

Se carga solo desde `CLAUDE.md` (import). Historial: `documents/bitacora.md`. Actualizar con `/cerrar-dia`. Fecha: 2026-11-16.

## Rama y reglas de trabajo

- Rama `trabajo/migracion-nube`; último push `c9ea633`; los commits del «paquete completo» (`742fcd4`, `70e0bcd`, `16ce103`, `8655cf6`, `e475139`, `86677b6`) son locales, sin push. Sin PR ni fusión a `main` sin orden. Cloudflare: solo `--env test` / base de pruebas, con aprobación; nunca `criadero-kikirikis-dev` ni `controlgastos-*`.
- Expo Go por túnel para el usuario; emulador, `/probar smoke` y `/probar completo` solo a petición. Se mantienen typecheck, unitarias y `/probar datos` (si toca API o dinero). Arrancar: `nvm use 22; npm run dev` en `api/`; Expo con `npx expo start --tunnel` (URL solo en variables de sesión).

## Fase UX: cerrada, pendiente la prueba final del usuario

- Tema «Pajarera tropical» (Fredoka y Nunito, mascota SVG); tokens en `src/theme/`; máximo 2 degradados por pantalla; toques >= 44; avisos de éxito no bloqueantes; los `Alert` de error y confirmación se mantienen.
- Último `/probar completo` válido `2026-11-10-163756-completo`: VERDE, 29 PASO, 0 regresiones, 73,1 min. Los de la mañana fueron ROJOS por el aviso de `navigate` (corregido en `BarraPestanas.js`, `5165b25`) y caídas del emulador.
- Correcciones tras la prueba del usuario (`80edd19`, `e1e8005`; empujado hasta `d363656`): guardado y doble envío, iconos, Salud vuelve a la ficha (`avisoSalud`), «Valor» numérico (la venta conserva «Valor inválido» de V1), acento verde/rojo, validación visual, «Cerrando.../Eliminando...», Alert al fallar el guardado, tarjetas de alertas y categorías propias en Ingreso y Egreso (excepción de paridad, decisión del usuario).
- Cierre documental: `154978e` y `c9ea633`. Sin verificar en el teléfono (`documents/ux/pendiente-en-telefono.md`, 25 puntos): gama baja, scroll al campo con error, foco bajo el Alert nativo, liberación del botón, aviso de Salud y su temporizador, tarjetas de alertas. Sin medir: aves con cientos de registros, degradados y arranque en frío (`documents/ux/rendimiento.md`).

## Paquete completo del 2026-11-16 (commits locales, sin push)

- `742fcd4` Inicio navegable: cada tarjeta o métrica de Inicio abre su destino dentro de la pila de Inicio; `validador-ux` APROBADO; flujo `100` (`documents/ux/inicio-navegable.md`).
- `70e0bcd` y `16ce103` Colores por estado en tarjetas de jaulas (Normal, Limpieza azul, Fumigación naranja, Quemadura naranja por decisión del usuario, Cuarentena rojo) y de aves activas (Sana, En tratamiento, Enferma); contraste AA calculado; leyenda colapsable NO hecha; `validador-ux` APROBADO; flujo `101` (`documents/ux/colores-estado.md`).
- `8655cf6` Alertas de Salud solo el día UTC en que `fecha_ultimo_control_salud` + 7 días = hoy (`DIAS_PLAZO_CONTROL_SALUD`, `modificadorPlazoSalud()` en `api/src/alertas/alertas.reglas.ts`; mensaje «lleva 7 días»). **Excepción aprobada a la paridad con V1, solo en Salud**; Jaulas, Producción y Finanzas sin cambio. Riesgo aceptado: un ave enferma sin control no se recuerda de nuevo. Desplegado en pruebas; revisor APROBADO (`documents/specs/alertas-del-dia.md`).
- `e475139` Verificación de cuenta por código: migración `0012_verificacion_cuenta.sql` (`email_verification_codes`, `rate_limits`; marca verificadas las cuentas existentes; aplicada en local, integración y base remota de pruebas); `/auth/verification/{verify,resend,change-email}`; login 403 `EMAIL_NOT_VERIFIED`; bandera `EMAIL_VERIFICATION_REQUIRED` (ausente = apagada, **no activada en ningún entorno**); cabeceras de bypass solo si existe `VERIFICATION_BYPASS_SECRET`; envío por interfaz `EnvioCorreo` (simulado y adaptador HTTP tipo Resend; proveedor SIN elegir); límites 5 envíos/h por correo, 5 registros/h por IP, 80 envíos/día global; cuentas sin verificar borradas a las 24 h con limpieza oportunista en `register` (sin Cron); pantallas `VerificarCorreoScreen` y `CambiarCorreoScreen`; revisor APROBADO.
- `86677b6` Login con Google: `POST /api/v1/auth/google` (RS256 con JWKS inyectable, `aud` en `GOOGLE_CLIENT_IDS`, `iss`, `exp`, `email_verified`; vinculación por correo; usuario nuevo verificado y sin contraseña; JWT propio) y botón «Continuar con Google» en Login y Registro (carga perezosa de `@react-native-google-signin/google-signin`, NO instalada; exige development build con EAS, no funciona en Expo Go). Revisor APROBADO con hallazgo IMPORTANTE abierto: con la bandera de verificación apagada, `register` marca verificadas las cuentas sin probar el correo, lo que permite pre-registro y toma de cuenta al vincular Google. **Requisito: no activar Google sin la bandera de verificación encendida** (decisión pendiente del usuario: exigir la bandera o anular la contraseña al vincular). Además, la cuenta vinculada queda sin contraseña y no hay recuperación de contraseña.
- Pruebas: `/probar datos` 122/122 VERDE (7 casos omitidos por falta del secreto), unitarias 413/413 e integración 226/226 (en las implementaciones), smoke VERDE. **`/probar completo` `2026-11-16-163400-completo`: ROJO, 27 PASO y 5 REGRESION en 65,7 min** (100, 20, 95 y 96 = fallos de flujo, sin regresión de la app; 102 = `esperado-fallar` sin cablear). El reintento de esos 4 (última ejecución permitida): 100 y 20 PASO; 95 y 96 siguen ROJOS por selector (saldo con prefijo «+», `+$16.75` y `+$23.35`), ya corregidos en los YAML pero **sin validar con una nueva ejecución. NO hay completo verde del paquete.**
- Base de pruebas tras el completo: 3 cuentas, 3 criaderos, 4 jaulas, 5 aves (una jaula y un ave más que antes, no son desechables), 0 cuentas `@kikirikis.test`, 0 sin verificar; la cuenta del usuario intacta. Smoke y completo exigieron reiniciar el AVD en frío (`-no-snapshot -gpu swiftshader_indirect`).

## Módulos hechos

| Módulo | API | Cliente app | Probado (Worker de pruebas) | Teléfono |
|---|---|---|---|---|
| Auth, criaderos, onboarding (+ verificación por código `0012` y `/auth/google`, bandera apagada; Google sin librería instalada) | sí | sí (pantallas de acceso nuevas) | sí (datos 122/122) | email y contraseña sí; verificación y Google no |
| Jaulas (`0005`) | sí | `JaulaRepository.api.js` | sí | sí (sin historial) |
| Catálogos (42 ítems por criadero) | sí | `ConfiguracionRepository.api.js` | sí | sí |
| Aves (`0006`) | sí | `AveRepository.api.js` y fachadas | sí | no |
| Cuidados de jaula (`0007`) | sí | `Alimentacion/Bebida/SanidadJaula/Historial` | sí | no |
| Salud (`0008`) | sí | `SaludRepository` (sin `actualizarEstadoSaludAve`) | sí | no |
| Huevos (`0009`) | sí | `HuevoRepository`, `ProduccionRepository` | sí | no |
| Genealogía (sin migración) | usa `GET /aves` | `GenealogiaRepository` | sí (flujo `80`) | no |
| Ciclo de vida (sin migración) | `GET /aves/:aveId/evolucion` | `CicloVidaRepository` | sí (flujo `81`) | no |
| Bajas (`0010`) | sí (`api/src/aves/`) | `BajaAveRepository` (sin `obtenerBajasAve`) | sí (flujos `90`, `91`) | no |
| Finanzas (`0011`) | sí (`api/src/finanzas/`) | `FinanzasRepository`, `finanzasApi.js` (sin `obtenerIngresos`/`obtenerEgresos`) | sí (87/87; flujos `95` y `96`) | no |
| Clientes (sin migración) | sí (`api/src/clientes/`, solo lectura) | `ClientesRepository` | sí (datos 96/96; flujo `98`) | no |
| Reportes (sin migración) | sí (`api/src/reportes/`, 10 `GET` de solo lectura) | `ReportesRepository` | sí (datos 104/104; flujo `97`) | no |
| Alertas (sin migración) | sí (`api/src/alertas/`, un `GET /alertas`, solo lectura) | `AlertasRepository` (sin las cuatro parciales) | sí (datos 110/110; flujo `99`) | no |
| Inicio (sin migración) | sí (`api/src/inicio/`, `GET /dashboard`, solo lectura, 6 llamadas D1) | `DashboardRepository` | sí (datos 115/115; flujo `94`) | no |

- Migraciones `0001`–`0012` aplicadas en local, integración y base remota de pruebas (siguiente: `0013`). Última medición (2026-11-16): 413 unitarias/HTTP y 226 de integración (en las implementaciones); `/probar datos` 122/122. Paridad con V1 sin diferencias salvo la excepción de alertas de Salud.

## Próximos pasos (en este orden)

1. Prueba final en el teléfono: `documents/ux/pendiente-en-telefono.md` y la fase 6 (Bajas, Finanzas, Clientes, Reportes, Alertas, Inicio: teclado numérico, modo avión, hora local frente a UTC, scroll).
2. Fotos en R2 (`criaderos/{criaderoId}/aves/{aveId}/{evolucionId}.jpg`).
3. Cerrar Google y verificación: elegir proveedor de correo, decidir el hallazgo IMPORTANTE (bandera obligatoria o anular contraseña al vincular), development build con EAS, `/auth/me` y refresh token. Pasos manuales en `documents/specs/auth-verificacion-google.md`.
4. Ambientes de pruebas y producción con tokens y configuración: `api/wrangler.jsonc` sin `vars` de `env.test` (`EMAIL_VERIFICATION_REQUIRED`, `EMAIL_FROM`, `GOOGLE_CLIENT_IDS`); secretos `RESEND_API_KEY` y `VERIFICATION_BYPASS_SECRET` por stdin con orden expresa; notas de las variables nuevas en `api/.dev.vars.example`, `pruebas/.entorno.local.example` y `pruebas/README.md` (los agentes no pudieron editarlos).
5. Retiro de SQLite con respaldo.
6. Zona horaria local: las alertas del día y los periodos usan UTC (en Ecuador el día cambia a las 19:00 hora local).
7. Pruebas: validar `95` y `96` con la selección corregida (saldo con «+») y cablear `--sin-verificar` en `pruebas/movil/lib/preparar.mjs`, `ejecutar.mjs` y `ejecutar-flujo.sh` para mover `102-verificar-correo` fuera de `esperado-fallar/` (fuera del alcance de los agentes).

## Incidencias recurrentes

- Cloudflare error 7403 en `wrangler d1 migrations apply ... --remote`: reintentar; si persiste, `wrangler logout` y `wrangler login` (el usuario pulsa Allow). `/probar completo`: Expo Go "Something went wrong", cortes de red, emulador colgado, `adb` en `Broken pipe`, `device not found` (2026-11-10). El ejecutor reintenta y aborta según sus límites. Si no basta: cerrar el ejecutor y los adb, `adb emu kill`, arrancar el AVD con Start-Process desde PowerShell (no con `&` desde bash) y `-dns-server 8.8.8.8,1.1.1.1` (sin snapshot se pierde el DNS). Ver `pruebas/README.md`.
- Limpieza: el ejecutor dejó 33 cuentas desechables tras el completo largo del 2026-11-10 (borradas a mano). Causa por confirmar; verificar la limpieza final en el próximo completo.

## Limitaciones conocidas

- Inicio: sin lector de negocio en SQLite en modo API salvo fotos (R2) y `obtenerEvolucionAve`; desempates y redondeos dependen de SQLite en el teléfono; CPU en D1 real sin medir. Fallo de red: Inicio, Alertas, Finanzas, Reportes, Catálogo, DetalleCliente, DetalleAve y Editar movimiento muestran error con «Reintentar» (cambio visual aprobado; V1 dejaba ceros o vacío). Genealogía muestra texto, no `Alert`.
- Bajas: V1 no libera la jaula al dar de baja (replicado). Finanzas: periodos en UTC como V1; `CREACION_POR_CORRECCION` solo cubierto por integración.
- Salud: "Guardar diagnóstico" sin `disabled`; finalizar tratamiento en API no escribe `RECUPERACION`. Huevos: concurrencia sin probar. Aves: `obtenerEvolucionAve` en SQLite; `NuevaAveScreen` usa `Number(item.id)`. Reportes: `OrigenId` del CSV sale como UUID; exportaciones sin paginación. Alertas: D-2 y D-3 abiertas. Fotos: R2 sin hacer; `foto_r2_key` guarda la ruta local. Google Sign-In: endpoint hecho, librería sin instalar y sin probar en dispositivo; sin recuperación de contraseña; proveedor de correo sin elegir; bandera de verificación apagada; `/auth/me` pendiente; token de 60 min sin refresh; PBKDF2 a 100000 iteraciones: 13–20 ms de CPU.

## Excepciones aprobadas a pantallas V1 (seis)

1. `MasMenuScreen`: "Cerrar sesión" (solo modo API). 2. `AlimentacionJaulaScreen` y `BebidaJaulaScreen`: `try/catch` con `Alert`. 3. `SaludAveScreen`: `Alert` en `catch` y guarda `if (!ave)`. 4. `ProduccionHuevosScreen`: `Alert` en el `catch` de carga. 5. `GenealogiaAveScreen`: ids `String` (UUID v7), sin `Alert`. 6. Detalle en cada spec de `documents/specs/`.

Otras excepciones a V1 vigentes: categorías propias en Ingreso y Egreso; alertas de Salud solo el día del plazo (2026-11-16); pantallas de acceso nuevas (verificación de correo y Google, solo modo API).
