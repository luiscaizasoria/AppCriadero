# Bitácora del proyecto

Registro de sesiones, la entrada más nueva ARRIBA. Reglas: una entrada por sesión (`## AAAA-MM-DD sesión N`, máximo 15 líneas: Hecho con hashes, Decisiones con su motivo, Pendiente y Próximo paso exacto); las entradas anteriores nunca se reescriben; sin URLs, ids de recursos, correos ni secretos (repositorio público). Al pasar de 300 líneas, las antiguas se mueven a `documents/historico/bitacora-AAAA-MM.md` y quedan las 5 últimas. El hook de inicio muestra las 3 más recientes (deben caber en unos 4.500 caracteres). Estado resumido: `documents/estado-actual.md`.

## 2026-11-05 sesión 3
- Hecho (sin commit; hashes por confirmar): fase 6, módulo Clientes. Spec `documents/specs/clientes.md`; API `api/src/clientes/` (3 GET bajo `/criaderos/:criaderoId/clientes`, solo lectura, 2 llamadas a D1 por endpoint, probado con pocos datos y con 2000 ventas); cliente `ClientesRepository.{js,sqlite.js,api.js}`; casos `14-clientes` y ampliación de `05-aislamiento`; flujo `completo/98-clientes.yaml` con aislamiento de dos cuentas (`# SEGUNDA-CUENTA`, `preparar.mjs --segunda-cuenta`). Worker de pruebas desplegado (`--env test`), sin migración.
- Resultado: revisión de arquitectura APROBADO; typecheck OK; 298 unitarias/HTTP y 130 de integración (Node por defecto, 24); paridad con el código real de V1: 45 comparaciones, 0 diferencias.
- Resultado: `/probar datos` VERDE 96/96 (173,9 s); `/probar smoke` VERDE (2,2 min); flujo `98` PASO en 204 s, con la segunda cuenta mostrando "No hay clientes para mostrar".
- Decisión del usuario: servidor para los cuatro módulos de la fase 6; ninguna excepción a pantallas V1; orden Clientes, Reportes, Alertas, Inicio, módulo por módulo, con push al cerrar cada uno si datos y smoke están en verde.
- Decisión: un criadero inexistente responde 403 (no 404), como el resto de módulos; motivo: coherencia con el ownership existente.
- Decisión: el celular viaja codificado en la ruta (`encodeURIComponent`); motivo: un `+` en la consulta se convertiría en espacio. Sin índice nuevo.
- Pendiente: foto del ave (R2); `DetalleClienteScreen` muestra "Cliente no encontrado." ante error de red (como V1); D-2 (UUID v7 monotónico) sin comprobar; teléfono físico; Reportes, Alertas e Inicio.
- Próximo paso exacto: módulo Reportes, empezando por su spec con `analista-codigo-v1`.

## 2026-11-05 sesión 2
- Hecho: defensas del ejecutor móvil (`3defe9f`): máximo 6 min por flujo (se termina el árbol de procesos y, aparte, el java de Maestro; se desinstalan los paquetes de Maestro y se comprueba que vuelve a conectar con un flujo mínimo), 60 min por ejecución (EJECUCIÓN ABORTADA POR TIEMPO), una recuperación del emulador tras dos FALLO DE ENTORNO seguidos, `resumen.md` reescrito tras cada flujo y registros incrementales (logcat, Metro, wrangler tail y eventos).
- Hecho (sin commit): prueba con flujos temporales ya borrados: flujo colgado marcado a los 45 s, dos colgados seguidos con una recuperación en 43 s, límite global de prueba de 120 s con resumen de lo ejecutado; sin procesos sueltos al terminar.
- Fallos reales hallados y corregidos en esa prueba: el java de Maestro sobrevivía al `taskkill`; el servidor de Maestro del emulador quedaba inservible tras matarlo; 20 procesos `wrangler tail` quedaban vivos por el orden de cierre.
- Resultado: `/probar completo` desde cero (`2026-11-05-103724-completo`): 19 PASO, 0 regresiones, 0 fallos de red o de entorno, 0 reintentos de red, 1 fallo esperado (dashboard), 32,0 min. Primer completo sin regresiones desde Finanzas; el veredicto "CON MODULOS PENDIENTES" se debe solo a Inicio (sigue en SQLite). Flujos `90`, `91`, `95` y `96` confirmados con sus esperas por condición.
- Decisión: límites de 6 min por flujo y 60 min por ejecución; motivo: el emulador colgado de hoy bloqueó el ejecutor más de 30 min.
- Decisión: la documentación de esta sesión queda sin push; motivo: el push requiere aprobación del usuario.
- Pendiente: teléfono (Bajas y Finanzas); fase 6 (plan pedido, sin código hasta "plan aprobado"); R2; Google Sign-In; commit de `3defe9f` y de la documentación, sin push. Límites conocidos: tras un flujo colgado, restaurar Maestro añade unos 35 s (el tiempo puede pasar el límite en ese margen); la recuperación del emulador no se probó con emulador realmente muerto.
- Próximo paso exacto: presentar el plan de la fase 6 y esperar "plan aprobado".

## 2026-11-05 sesión 1
- Hecho: push aprobado y hecho de `52b9641` y `ae81dca`; último push `ae81dca`, sin pendientes de push.
- Hecho (sin commit): flujos `90` y `91` esperan por condición antes de tocar Vendidas o Fallecidas (dos sitios en `90`); flujo `96` espera ".*Vendidas.*" (20 s) tras "Aceptar", toca Finanzas con retry (3) hasta ver "Consolidado por categoría" y lo comprueba con assertVisible; `95` sin cambios (ya espera "Jaulas").
- Resultado: `/probar completo` `2026-11-04-190615-completo` (no válido como cierre): 18 PASO, 1 regresión en `96` por sincronía (inferencia a partir de la captura y el resumen; solo tenía resumen.md), 9 reintentos de red absorbidos y el fallo esperado de dashboard.
- Resultado: repetición solo del `96`, dos veces seguidas: PASO en 182 s (`2026-11-05-091332-completo`) y PASO en 175 s (`2026-11-05-091732-completo`). `90`, `91` y `95` no se repitieron hoy.
- Incidencia: el emulador quedó colgado (`adb getprop` sin respuesta, ejecutor bloqueado más de 30 min). Se resolvió cerrando el ejecutor y los adb, `adb emu kill` y arrancando el AVD otra vez con Start-Process desde PowerShell (no con `&` desde bash, que muere con la tarea).
- Decisión: espera por condición en lugar de toque fijo; motivo: el toque perdido tras la venta causó la regresión del `96`.
- Decisión: no dar por válido ningún `/probar completo` hasta uno limpio; motivo: la última ejecución completa tuvo una regresión.
- Pendiente: `/probar completo` sin regresiones al empezar el siguiente bloque; commit de los flujos `90`, `91` y `96` (sin confirmar); teléfono (Bajas y Finanzas); fase 6, R2 y Google Sign-In.
- Próximo paso exacto: empezar el siguiente bloque con un `/probar completo` y anotar su resultado en Finanzas.

## 2026-11-04 sesión 3
- Hecho: ejecutor móvil: aborto rápido por fallo al abrir la app, espera de 90 s, captura del error de Expo Go y log de Metro (`15d1e59`); resultado FALLO DE RED, comprobación previa de conectividad, reintentos solo al preparar y limpiar, aborto a dos fallos de red seguidos (`52b9641`); agente `mantenimiento-claude` con escritura solo en `.claude/agents`, skills y rules (`ae81dca`); CLAUDE.md y regla de migraciones con `0011` aplicada y `0012` siguiente, fechas del incidente 7403 (`b8a9fd9`).
- Hecho: tres `/probar completo` de Finanzas, ninguno válido como cierre: `2026-11-04-150506-completo` (19 regresiones por error de Expo Go al abrir, causa no determinada); `2026-11-04-183443-completo` (1 PASO y 18 regresiones por cortes de red hacia Cloudflare); `2026-11-04-190615-completo` (57,5 min, 18 PASO, 1 regresión en `96-finanzas-correccion-venta`, toque perdido en Finanzas tras la venta, y 1 fallo esperado de dashboard; 9 reintentos de red y conectividad previa 10/10).
- Verificación: con un host no válido, la comprobación previa aborta tras 4 comprobaciones; sin ella, 2 flujos FALLO DE RED; cuentas desechables a 0 tras limpiar. Node 22.23.4 (`npx node@22`): 285 unitarias/HTTP y 119 de integración en verde.
- Decisión: sin excepciones a pantallas V1 en Finanzas (siguen seis); motivo: replicar V1 tal cual.
- Decisión: `obtenerIngresos` y `obtenerEgresos` omitidas; motivo: sin llamadores en V1.
- Decisión: el `NaN` de `corregirVentaFinanciera` se valida en el cliente con `VALOR_INVALIDO`; motivo: V1 lanza ese mismo error.
- Decisión: `limpiar.mjs` y el guardia se editan desde la sesión principal; motivo: por confirmar.
- Pendiente: decidir si se arregla la espera del flujo `96` y se repite solo ese flujo; `/probar completo` válido de Finanzas (marcador pendiente); push de `52b9641` y `ae81dca` (aprobación); teléfono (Finanzas y Bajas: teclado numérico, modo avión, hora local frente a UTC, scroll); fase 6, R2 y Google Sign-In.
- Próximo paso exacto: arreglar la espera del flujo `96` si el usuario lo aprueba y lanzar un `/probar completo` limpio que anote su resultado.

## 2026-11-04 sesión 2
- Hecho: módulo Finanzas: avance de docs `e7198f3`; migración `0011` (`movimientos_financieros_historial`), API `api/src/finanzas/` (11 endpoints) y cliente `FinanzasRepository.{js,sqlite.js,api.js}` + `finanzasApi.js` (`7d6adbe`); casos de datos `13-finanzas`, limpieza del historial y guarda de `NaN` (`5ce9ac3`); flujos `95-finanzas-movimientos` y `96-finanzas-correccion-venta` (`ca9cd7b`). `0011` aplicada en local, integración y base remota de pruebas; Worker de pruebas desplegado.
- Resultado: 285 unitarias/HTTP y 119 de integración; paridad con el código real de V1 (`finanzas.paridad-v1.d1.test.ts`): 235 comparaciones, 0 diferencias; `/probar datos` 87/87 (157 s); smoke verde (110 s); flujos `95` y `96` PASO. Revisor de arquitectura: APROBADO (I-1 `NaN` guardado como 0, corregido con 400; M-1 corrección con `NaN`, resuelta en el cliente). Resultado de `/probar completo`: pendiente.
- Decisiones del usuario: ninguna excepción a pantallas V1 (siguen seis); replicar V1 tal cual; `obtenerIngresos` y `obtenerEgresos` omitidas.
- Incidencia recurrente: Cloudflare error 7403 al aplicar `0011` con `--remote`; el segundo intento funcionó sin renovar la sesión. Si persiste: `wrangler logout` y `login` (el usuario pulsa Allow).
- Pendiente: teléfono (teclado numérico con coma, modo avión, hora local frente a UTC a fin de mes, scroll con muchos movimientos); Inicio, Reportes, Clientes y Alertas siguen en SQLite y no ven finanzas ni ventas de la nube; push (requiere aprobación).
- Próximo paso exacto: añadir el resultado de `/probar completo`; después, indicación del usuario (teléfono, fase 6, R2 o Google Sign-In).

## 2026-11-04 sesión 1
- Hecho: módulo Bajas: specs de bajas y finanzas (`9ac55e4`), migración `0010` (`bajas_ave`, `movimientos_financieros`), API en `api/src/aves/` (`muerte`, `venta`, `bajas`; `listarBajas` con INNER JOIN) y cliente `BajaAveRepository.{js,sqlite.js,api.js}` (`d75d030`); casos de datos `12-bajas` y limpieza (`a97771a`); flujos `90-baja-venta` y `91-baja-muerte` (`55e5337`). Aparte: `8ff491b` (guardia: `probador-movil` escribe en `pruebas/datos/`, salvo `lib/limpiar.mjs`) y `6f5c9a8` (comprobación de red del emulador, carpetas de informe con segundos, `.nvmrc` con Node 22). `0010` aplicada en local, integración y base remota de pruebas; Worker de pruebas desplegado.
- Resultado: 248 unitarias/HTTP y 84 de integración; `/probar datos` 75/75 (108 s); smoke verde (103 s); flujos `90` y `91` PASO; no se ejecutó `/probar completo` entero. Revisor de arquitectura: APROBADO sin hallazgos bloqueantes. Sin excepciones nuevas a pantallas V1 (siguen seis).
- Decisiones del usuario: `ENVIO_AVE` siempre con 2 filas por venta (valor 0 si no hay envío); `detalle` de los movimientos con el id del ave; `movimientos_financieros` en `0010` y `movimientos_financieros_historial` en `0011` (Finanzas).
- Incidente: emulador con `pm list packages` en `Broken pipe`; `adb reboot` no sirvió y `adb emu kill` más arrancar lo resolvió (anotado en `pruebas/README.md`).
- Pendiente: teléfono (venta con coma decimal, muerte, listas Vendidas y Fallecidas, Detalle, Ciclo de vida, modo avión en "Confirmar baja"); las ventas de la nube no se ven en Finanzas, Inicio, Reportes ni Clientes hasta migrar Finanzas; Ciudad destino y Cooperativa sin automatizar; push por verificar (requiere aprobación).
- Próximo paso exacto: Finanzas (`0011`) y comprobación de Bajas en el teléfono, según indique el usuario.

## 2026-11-03 sesión 3
- Hecho: push aprobado y hecho de 6 commits (`062261f..2b110c5`: `7b6dd2c`, `ecc41cf`, `010a223`, `906510e`, `706837c`, `2b110c5`).
- Hecho: inicio de Bajas y Finanzas por orden del usuario (Bajas primero): specs en borrador sin commit, `documents/specs/bajas.md` y `documents/specs/finanzas.md`.
- Hallazgos: `obtenerBajasAve`, `obtenerIngresos` y `obtenerEgresos` no tienen llamadores; V1 inserta siempre la fila `ENVIO_AVE`, también con valor 0 (`BajaAveRepository.js:325-353`), distinto de lo previsto; V1 no libera la jaula ni escribe `jaula_historial` al dar de baja; `obtenerConsolidadoMensual` no es una ventana de 12 meses (solo meses con movimientos).
- Decisión propuesta, pendiente de aprobación: opción A para movimientos. Migración `0010` = `bajas_ave` + `movimientos_financieros`; `0011` (Finanzas) = `movimientos_financieros_historial`. Motivo: Bajas solo escribe 2 filas por venta y Finanzas tiene 13 funciones y 3 pantallas. Coste: las ventas de la nube no se ven en Finanzas, Inicio ni Reportes hasta migrar Finanzas.
- Pendiente del usuario: `ENVIO_AVE` con valor 0 (A: replicar V1 siempre, recomendada; B: solo si es mayor que 0, filtro que solo existe en el relleno histórico de `migrationV6.js:98`) y `detalle` de los movimientos con el id del ave (A, recomendada) o con el código (B).
- Resultado: `/probar completo` desde cero, 27,6 min, 15 flujos PASO, 0 regresiones; solo `PENDIENTE DE MIGRAR: dashboard`.
- Pendiente: aprobación del plan de Bajas; implementar Bajas (`0010`, API, cliente, quitar `bajas = []` del ciclo de vida, listas con INNER JOIN a `bajas_ave`); luego Finanzas; commit de las specs; teléfono (Salud, Huevos, Genealogía, Ciclo de vida, Producción, modo avión).
- Próximo paso exacto: el usuario responde "plan aprobado" con sus dos elecciones (sin ellas se aplican A y A) y se lanzan en paralelo la migración, la API y el cliente de Bajas.

## 2026-11-03 sesión 2
- Hecho: Genealogía (sin endpoint ni migración; `GenealogiaRepository.{js,sqlite.js,api.js}`, `010a223`; pantalla `906510e`) y Ciclo de vida (`GET /aves/:aveId/evolucion` `ecc41cf`; `CicloVidaRepository.api.js` reúne historial, evolución, salud y huevos en el cliente). Pruebas: casos `09b`, `10`, `11` y flujos `71`, `80`, `81` (`706837c`).
- Resultado: typecheck OK, 228 unitarias/HTTP y 75 de integración; `/probar datos` 65/65 (86,7 s, sin fuga); `/probar completo` desde cero 27,6 min, 15 flujos PASO, 0 regresiones, solo `PENDIENTE DE MIGRAR: dashboard`. Revisor de arquitectura: APROBADO.
- Decisión: opción A para Genealogía (3 lecturas por estado en el cliente, `String(id)` por UUID); evolución como único endpoint nuevo; bajas vacías en el ciclo de vida hasta Bajas.
- Decisión: sexta excepción a pantallas V1 (`GenealogiaAveScreen`, ids `String`); sin `Alert` en su `catch` (un fallo de red muestra "No fue posible encontrar el ave.").
- Limitación: la rama circular de `relacionesInvalidas` no se puede provocar por la API; solo revisión de código, sin prueba automática.
- Pendiente: teléfono (Genealogía, Ciclo de vida, Producción, modo avión); Inicio/Alertas/Reportes (SQLite); Bajas; R2; Google Sign-In; push (requiere aprobación).
- Próximo paso exacto: esperar indicación del usuario (candidatos: Bajas, Finanzas, R2, Google, fase 6).

## 2026-11-03 sesión 1
- Hecho: módulo Huevos: migración `0009` y API `api/src/huevos/` (`07d203d`), clientes `HuevoRepository` y `ProduccionRepository` con fachadas (`c338b74`), aviso de carga en `ProduccionHuevosScreen` (`469b742`), pruebas y flujo `70-huevo` (`3436a62`); cuarta excepción de Salud, guarda de `ave` nula en `SaludAveScreen` (`17ea040`). `0009` aplicada en local, integración y base remota de pruebas.
- Resultado: typecheck OK, 222 unitarias/HTTP y 72 de integración; `/probar datos` 49/49 (72,2 s, sin fuga), smoke verde (2,6 min), flujo `70-huevo` verde (111 s). Revisor de arquitectura: APROBADO. No se ejecutó `/probar completo`.
- Decisión: código `H`+6 dígitos por criadero dentro del mismo batch del `INSERT`; periodos en UTC como V1; se implementaron las 6 funciones sin llamadores.
- Decisión: quinta excepción a pantallas V1 (`Alert` en `ProduccionHuevosScreen`); `DetalleAveScreen` y `RegistrarHuevoScreen.cargarAve` no se tocan (sin aviso de red, como V1).
- Pendiente: teléfono (registrar huevo, Producción, modo avión); `ProduccionHuevosScreen` sin flujo del emulador; concurrencia real del código no probada; `/probar completo` al cerrar Genealogía; push (requiere aprobación).
- Próximo paso exacto: esperar indicación del usuario para Genealogía y Ciclo de vida.

## 2026-11-02 sesión 3
- Hecho: módulo Salud: migración `0008` (`tratamientos_ave`) y API `api/src/salud/` (`7e02ccd`), cliente `SaludRepository.{js,sqlite.js,api.js}` (`e5805e6`), excepción aprobada a `SaludAveScreen` (`31b823c`), pruebas y flujo `60-salud-enfermedad` (`b9001bb`). `0008` aplicada en local, integración y base remota de pruebas.
- Resultado: typecheck OK, 203 unitarias/HTTP y 54 de integración; `/probar datos` 44/44 (58 s, sin fuga), smoke verde (1,7 min), completo 25,2 min sin regresiones (`PENDIENTE DE MIGRAR: genealogia, huevos, dashboard`). Revisor de arquitectura: APROBADO.
- Decisión: `actualizarEstadoSaludAve` se omite en la API (sin llamadores, decisión del usuario).
- Decisión: tercera excepción a pantallas V1: solo dos `Alert.alert` en los `catch` de `SaludAveScreen`; sin `disabled` en el botón ni guard de `ave` null (si falla la carga el render puede dar `TypeError`; limitación conocida).
- Pendiente: probar Salud en el teléfono (modo avión: `Alert` de error); la ficha de ave sigue sin bajas ni huevos; push (requiere aprobación).
- Próximo paso exacto: módulo Huevos, esperando indicación del usuario.

## 2026-11-02 sesión 2
- Hecho: módulo Cuidados de jaula: migración `0007` y API (`8ee3c59`), clientes con fachadas (`909ffc0`), excepción aprobada a `AlimentacionJaulaScreen` y `BebidaJaulaScreen` (`39ff632`), pruebas y flujos (`aa472b6`) y documentación (spec sin lo revocado, estado, roadmap; `8484fda`). `0007` aplicada y Worker de pruebas desplegado con `--env test`.
- Resultado: typecheck, 188 pruebas unitarias/HTTP y 47 de integración en verde; `/probar datos` 38/38 (51 s), smoke verde (1,7 min); completo 20,7 min sin regresiones: 10 migrados en verde y 4 esperados (`PENDIENTE DE MIGRAR: genealogia, huevos, dashboard, salud`). Revisor de arquitectura: APROBADO.
- Decisión: Alertas, Inicio y Reportes pasan a la fase 6 como pendientes; mientras Inicio no se migre, dos cuentas en el mismo teléfono ven los contadores del SQLite local compartido.
- Decisión: el ejecutor móvil reinicia su Metro en cada ejecución (modo CI no recarga y servía código desfasado); se corrigió una prueba de Aves que dependía del reloj real.
- Pendiente: probar Cuidados de jaula y Aves en el teléfono físico; push de los commits nuevos (requiere aprobación); `pruebas/.entorno.local` sin crear (la variable no estaba en la sesión).
- Próximo paso exacto: plan del módulo Salud (o el que decida el usuario).

## 2026-11-02 sesión 1
- Hecho: pruebas automáticas. Capa 1 `pruebas/datos` (26 casos, ~31 s, aislamiento entre cuentas sin fuga: `64f41ac`); capa 2 `pruebas/movil` con Maestro 2.12.1 (nativo en Windows) y Expo Go 57.0.9 (`795de4b`); skill `/probar`, perfil del guardia de `probador-movil` y regla en `CLAUDE.md` (`b996a83`).
- Resultado: smoke verde (~2 min); completo 22 min: acceso, catálogos, jaulas y aves en verde; confirmados como «esperado fallar»: Alimentación, Bebida, Sanidad, Salud, Huevos, Genealogía, Inicio e Historial de jaula (este último usa `HistorialRepository` en SQLite).
- Decisión: Metro de pruebas en el puerto 8090 y cuentas desechables `@kikirikis.test` borradas al terminar; motivo: 8081/8082 los usan los Expo en túnel del usuario y la cuenta del usuario no se toca.
- Pendiente: Inicio y Genealogía leen SQLite compartido entre cuentas; Historial de jaula sin migrar; `/probar` exige `EXPO_PUBLIC_API_URL` en el entorno.
- Próximo paso exacto: corregir los fallos de los módulos pendientes (cuidados de jaula primero) apoyándose en `/probar`.

## 2026-11-01 sesión 2
- Hecho: sistema de seguimiento: esta bitácora rellena hacia atrás, import del estado en `CLAUDE.md`, hook `SessionStart` (`.claude/hooks/sesion-inicio.ps1`), agente `seguimiento-proyecto` y skills `/cerrar-dia` y `/retomar`. Commit de esta sesión: ver `git log` (mensaje «chore: sistema de seguimiento»).
- Decisión: el estado se carga con import `@` y la bitácora con hook; motivo: el import siempre trae la versión actual y el hook permite recortar la bitácora.
- Decisión: sin hooks `Stop`, `SessionEnd`, `prompt` ni `agent`; motivo: `Stop` se dispara en cada turno y `SessionEnd` solo tiene 1,5 s y no puede lanzar agentes.
- Decisión: el registro al cerrar es manual (`/cerrar-dia`); motivo: ningún hook de cierre puede lanzar un agente.
- Pendiente: probar que `SessionStart` corre en la extensión de VS Code (no probado); error 7403 de Cloudflare al aplicar `0006` en la base de pruebas.
- Próximo paso exacto: reiniciar la sesión y comprobar que aparecen las entradas; luego resolver el acceso a Cloudflare y aplicar `0006` con `--env test`.

## 2026-11-01 sesión 1
- Hecho: prueba en el teléfono: catálogos funcionan; fallan cuidados de jaula, asignar ave y finalizar tratamiento por la migración parcial.
- Hecho: el cliente vuelve a elegir criadero si el guardado ya no existe (`66c152c`); decisiones a-j del orquestador y regla de sesión (`bca6c57`).
- Hecho: módulo Aves implementado en local: API y migración `0006` (`4fc1831`), cliente y fachadas (`37df1fa`), documentación (`0a47957`). 137 pruebas unitarias/HTTP y 35 de integración en verde.
- Decisión: reemplazar `EstadoSaludRepository.js` por una fachada (opción A); motivo: era una copia muerta de una pantalla y la pantalla de finalizar tratamiento lo importa.
- Decisión: crear `diagnosticos_ave` en `0006`; motivo: finalizar tratamiento cierra diagnósticos activos y la tabla no existía en D1.
- Pendiente: `0006` sin aplicar en la base remota de pruebas (error 7403 de Cloudflare: cuenta no válida o sin autorización); Aves sin probar en el teléfono.
- Próximo paso exacto: resolver el acceso a Cloudflare, aplicar `0006` y redesplegar con `--env test`, probar Aves en el teléfono.

## 2026-10-31 sesión 1
- Hecho: guardia de rutas movida a `settings.json` porque los hooks del frontmatter de los agentes no se ejecutaban (`a16d4ca`).
- Hecho: entorno de pruebas en Cloudflare con migraciones `0001` a `0005` (`fb2b1b7`); PBKDF2 a 100.000 iteraciones (`65a2809`).
- Hecho: módulo Catálogos con 42 ítems por criadero (`39c77ca`, `12fc4b3`); Jaulas y Catálogos probados contra la nube (commit por confirmar); Expo por túnel con Expo Go para SDK 57 (por confirmar).
- Decisión: PBKDF2 en 100.000 iteraciones; motivo: es el máximo que admite Cloudflare; mide 13 a 20 ms de CPU en el plan gratuito, riesgo conocido que no se corta.
- Decisión: una sola rama de trabajo sin PR (`8f66787`); motivo: menos fusiones y revisiones.
- Pendiente: Cuidados de jaula, Salud, Bajas, Huevos, Finanzas, R2 y Google Sign-In.
- Próximo paso exacto: módulo Aves.

## 2026-10-30 sesión 1
- Hecho: módulo Jaulas con cliente REST piloto en la app (`39da3b5`); equipo de agentes y orquestador (`c4af622`, `ed9e261`); guardia de agentes endurecido (`e100705`, `8bf4c2c`).
- Decisión: el orquestador coordina y no escribe código; motivo: ahorrar contexto y repartir el trabajo entre especialistas.

## 2026-10-29 sesión 1
- Hecho: clonado del repositorio (por confirmar, sin commit propio) y estructura de Claude Code (`3ec2f31`); documentación V2 en online-first (`a6311c4`).
- Hecho: specs de Aves y Catálogos (`1d15bc6`); specs de Jaulas y Cuidados de jaula (`870e56a`); reorganización de carpetas (`c09c912`).
- Decisión: V2 empieza sin datos y reproduce V1; solo se admiten diferencias técnicas por pasar a online; motivo: la app conserva pantallas, lógica y comportamiento y solo cambia dónde guarda los datos.

## 2026-10-27 sesión 1
- Hecho: traspaso desde ChatGPT (por confirmar: no hay commit; el traspaso es local y no se versiona).

## 2026-10-08 sesión 1
- Hecho: autenticación JWT con pruebas (`0be50e8`, `8fbba03`), inyección de dependencias y pruebas HTTP (`03ad371`) e integración con D1 local (`9fa2dae`).

## 2026-09-28 a 2026-10-04 (resumen)
- Hecho: bootstrap del backend con Workers y Hono (`d1a6bd3`), esquema inicial D1 (`e3fbe8d`), catálogos base (`9ed8174`) y onboarding de criaderos (`9441b22`, `d170055`, `d7429ef`, `14ee3ec`); diseño del modelo de datos V2 (28 al 30-sep).

## 2026-09-22 a 2026-09-27 (resumen)
- Hecho: app V1 (releases 1.0.0 a 1.0.3, `4a8cc6c` a `248ced2`) y preparación del contexto de V2 (`6d4a76d`).
