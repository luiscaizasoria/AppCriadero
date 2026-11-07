# Spec: inicio (DashboardRepository)

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).

## Estado

implementado (2026-11-07), con el `/probar completo` final de la fase SIN resultado válido (ver abajo)

### Lo implementado (real)

- **API** en `api/src/inicio/` (routes, factory, service, repository, types; **no** `api/src/dashboard/` ni `dashboardRouter`: el módulo real es `inicio/` con `inicioRouter`, inyectable en pruebas). `GET /api/v1/criaderos/:criaderoId/dashboard`; `data` = objeto del dashboard directamente, con las claves y el orden de V1. Criadero ajeno o inexistente: 403. Sin migración (la siguiente sigue siendo `0012`), sin `batch` ni bucles.
- **6 llamadas D1 fijas** (ownership + 5 SELECT; V1 hacía 12). Un único `ahora` ISO por petición. La consulta 1 fusiona aves+salud, finanzas del mes, jaulas total/ocupadas y huevos hoy/mes/promedio en una fila con tablas derivadas; la tabla derivada de jaulas se llama `jj` (no `j`) por el choque con el alias interior del `EXISTS`; orden de binds: CID, CID, AHORA, CID, AHORA, AHORA, AHORA, CID. `totalRazas` = filas de `avesPorRaza` (equivale al `COUNT(DISTINCT …)` de V1, confirmado por paridad).
- **Cliente REST** `src/repositories/DashboardRepository.{js,sqlite.js,api.js}`: `.sqlite.js` es V1 renombrado al 100 %; `.api.js` devuelve `data` tal cual. Sin cambios en pantallas.
- **Hipótesis decididas por la paridad con el código REAL de V1** sobre `better-sqlite3` (140 comparaciones, 122 con datos, 40 semillas, 10 relojes de medianoche/mes/año/bisiesto, 5 formatos de fecha, 8+2 patrones de empate de mejor ponedora y 8 de hora pico; 0 diferencias tras los cambios):
  - H-1 (mejor ponedora) **DESMENTIDA**: con empate V1 devuelve el ave de menor `codigo` (no el de menor `rowid`). SQL real: `ORDER BY cantidad DESC, a.codigo ASC`.
  - H-2 (hora pico) **DESMENTIDA**: con empate gana la hora MAYOR. SQL real: `ORDER BY cantidad DESC, hora DESC`.
  - H-3 (`dia`/`hora` `NULL` con fechas no interpretables): confirmada.
  - H-4 (`avesPorRaza` `cantidad DESC, raza ASC`, incluida la fusión de `'Sin raza'` literal y `' Sin raza '`): confirmada.
  - D-3 (redondeos y suma de `REAL`): sin diferencias en `better-sqlite3`, pero **no probado** en el SQLite de `expo-sqlite` ni en D1 real.
  - D-5 (fusión de la consulta 1): correcta en local; el `/probar datos` 115/115 contra el Worker de pruebas (D1 remoto real) la ejercita.
  - Los desempates de V1 dependen del plan de SQLite (índices `idx_aves_jaula`, `idx_aves_estado`, `idx_huevos_ave`, `idx_movimientos_fecha`): V2 elige uno determinista equivalente al V1 observado; otra versión de SQLite en el teléfono podría desempatar distinto.
- **Datos grandes** (60 jaulas, 300 aves de varias razas, 2000 huevos en varias semanas, 2000 movimientos; adaptador local): 6 llamadas D1 (igual que con pocos datos), respuesta 1007 B, 11 a 43 ms (510 B y 2 ms con pocos datos). CPU en D1 real sin medir.
- **Pruebas:** typecheck OK; 349 unitarias/HTTP y 196 de integración; revisión de arquitectura APROBADO sin hallazgos bloqueantes ni importantes.
  - `/probar datos` 115/115 casos en 265,3 s (informe `2026-11-07-163940-datos`; caso `17-inicio` con 5 pruebas y `GET /dashboard` añadido a `05-aislamiento`). La limpieza final falló una vez por un error transitorio de la API de Cloudflare (import de D1) y se repitió a mano con éxito: 0 cuentas desechables.
  - `/probar smoke` VERDE (flujo 156 s, 3,5 min; informe `2026-11-07-164916-smoke`).
  - Flujo `completo/94-inicio.yaml` (el viejo `esperado-fallar/inicio.yaml` se eliminó con `git rm`; la carpeta `esperado-fallar` ya no existe y el ejecutor la omite si falta): PASO en 207 s en ejecución aislada (informe `2026-11-07-164447-completo`; el primer intento falló por falta de scroll antes de «Sin bebida registrada»). Con datos comprueba aves activas, razas, producción (3 huevos, mejor ponedora AV-IA), alertas (Críticas 0, Advertencias 2, Total 2), ocupación y finanzas; con una segunda cuenta vacía comprueba ceros, «Sin datos» y que no se ve nada de la primera (aislamiento entre dos cuentas en el mismo teléfono).
- **`/probar completo` final de la fase: RESULTADO NO VÁLIDO** (2026-11-07, informe `2026-11-07-165323-completo`): ROJO, 18 PASO, 1 REGRESION, 1 FALLO DE ENTORNO, 0 de red; abortado por tiempo a los 61,5 min con 20 de 23 flujos ejecutados (tres sin lanzar).
  - La REGRESION fue `completo/94-inicio.yaml` (261 s): `assertVisible "Sin producción registrada"` con la segunda cuenta; la captura muestra Total 1 / Advertencias 1 y la tarjeta de la alerta justo debajo del borde visible, es decir, falta un `scrollUntilVisible` en el flujo (fallo del flujo, no de la API ni de la app).
  - El FALLO DE ENTORNO fue `96-finanzas-correccion-venta` por el tope de 60 min de la ejecución (el flujo se cortó a los 251 s al agotarse el tiempo).
  - Los flujos iban ~1,9 veces más lentos que el completo válido del 2026-11-05 (p. ej. `10-acceso` 193 s frente a 103 s; `90-baja-venta` 326 s frente a 175 s); causa no determinada.
  - **Pendiente:** corregir el scroll del flujo `94`, decidir el límite de tiempo y repetir el `/probar completo` UNA vez. El último `/probar completo` válido sigue siendo el del 2026-11-05.
- **Limitaciones heredadas:** `InicioScreen.js:173-180` `catch` solo con `console.error` (un fallo de red deja Inicio en ceros, como V1; decisión del usuario: sin excepciones a pantallas); `ProduccionBarChart.js:74` `key={item.dia}` con `dia` `null` solo con fechas no interpretables; teléfono físico sin probar.

> Lo que sigue es el análisis original de la spec; donde difiera de "Lo implementado (real)" (nombre del módulo, desempates H-1/H-2, alias `jj`), manda el bloque anterior.

Alcance: aves individuales, sin lotes, sin sincronización offline, D1 como fuente de verdad. Decisiones del usuario (fase 6, último módulo): **el dashboard se calcula en el SERVIDOR** replicando V1 tal cual; sin validaciones nuevas; **ninguna excepción a pantallas V1** (si una pantalla necesitara un cambio, no se resuelve aquí: queda como "DUDA PARA EL USUARIO" con `archivo:línea`). Las líneas son del árbol de V1 (v1.0.3). Inicio es **solo lectura** y **no tiene tabla propia**: se deriva de `aves`, `jaulas`, `huevos` y `movimientos_financieros`.

## Fuente V1

- `src/repositories/DashboardRepository.js`: **una sola función pública**, `obtenerDashboard()` (7-565), sin parámetros. Doce consultas secuenciales (`getFirstAsync` ×10, `getAllAsync` ×2). Cero escrituras (el archivo solo tiene `SELECT`). Partes: aves por estado 18-59; salud de las ACTIVAS 66-109; finanzas del mes 116-150; jaulas total y ocupadas 157-185; huevos hoy y mes 192-216; mejor ponedora 223-253; hora pico 260-283; producción por día de la semana 291-327; promedio 335-351; aves por raza 359-413; total de razas 421-442; ocupación de jaulas 450-474 (en JS); objeto devuelto 481-562.
- Llamador (búsqueda sin límite de `obtenerDashboard|DashboardRepository|InicioScreen` en todo el repo salvo `documents/`): **solo** `src/screens/InicioScreen.js:65-67` (import) y `:143` (llamada). `src/navigation/AppNavigator.js:11-12,211` monta la pantalla como tab raíz Inicio. Ninguna otra pantalla ni servicio usa el repositorio.
- Pantalla: `src/screens/InicioScreen.js` (1087 líneas); componentes `charts/ProgressBar.js`, `charts/ProduccionBarChart.js`, `charts/FinanzasBarChart.js`, `MetricCard`, `ProductionMetricCard`, `ProductionInfoCard`, `AlertCard`.
- Esquema V1: `aves(estado, estado_salud, raza, jaula_actual_id)`, `jaulas(activa)` (`src/database/migrations.js:36,69`), `huevos(ave_id, fecha)`, `movimientos_financieros(tipo, valor, fecha)`; índices `idx_aves_estado`, `idx_aves_jaula`, `idx_huevos_ave`, `idx_movimientos_fecha` (`migrations.js:346-364`). Tablas en D1: `0005_jaulas.sql` (`jaulas.activa`), `0006_aves.sql:16-63` (`aves`, `ix_aves_criadero_estado (criadero_id, estado)`, `ix_aves_jaula_actual`), `0009_huevos.sql:25-63` (`huevos`, `ix_huevos_criadero_fecha (criadero_id, fecha)`, `ix_huevos_ave_fecha`), `0010_bajas.sql:56-83` (`movimientos_financieros`, `ix_movimientos_criadero_fecha`). **No hay tabla nueva.**
- Patrones que se copian: `api/src/alertas/` (routes → factory → service → repository; `ahora: () => Date` inyectable en `alertas.factory.ts:13-16`; ownership con `D1CriaderoRepository.userOwnsCriadero`; `?` posicionales repitiendo el bind), `api/src/reportes/`, `api/src/finanzas/` (resumen mensual en UTC) y `api/src/huevos/` (producción). Cliente: `src/repositories/AlertasRepository.{js,sqlite.js,api.js}` y `src/api/huevosApi.js:15` (`rutaCriadero`). Ver `documents/specs/alertas.md`, `reportes.md` y `clientes.md`.

### Hallazgos de V1 (detalle que se replica tal cual)

1. **Todo en UTC** (`'now'` de SQLite). Las `fecha` las escribe la app con `new Date().toISOString()` (ISO UTC con milisegundos y `Z`). Un huevo registrado de noche en hora local puede caer en el día o mes UTC siguiente (misma diferencia ya aceptada en Huevos, Finanzas, Reportes y Alertas).
2. **Sin filtro por criadero ni por usuario** en V1 (una base por teléfono). En D1 cada consulta, subconsulta y JOIN lleva `criadero_id`.
3. **Aves** (18-59): cuenta **todas** las aves por `estado` (`ACTIVA`, `VENDIDA`, `FALLECIDA`; otro valor no suma). **Salud** (66-109): solo las `ACTIVA`, por `estado_salud` (`SANA`, `EN_TRATAMIENTO`, `ENFERMA`); un `estado_salud` `NULL` u otro valor no suma en ninguna (la suma de las tres puede ser menor que `activas`). Las aves no ACTIVAS no cuentan en salud.
4. **Finanzas del mes** (116-150): `SUM(valor)` por `tipo='INGRESO'` y `tipo='EGRESO'` con `strftime('%Y-%m', fecha) = strftime('%Y-%m','now')`; otros tipos no suman. La utilidad se calcula en JS (`Number(ingresos) - Number(egresos)`, 508-515), sin redondeo.
5. **Jaulas** (157-185): `total` = jaulas con `activa=1`; `ocupadas` = jaulas activas con al menos un ave `estado='ACTIVA'` y `jaula_actual_id = j.id` (`EXISTS`). Una jaula con solo aves VENDIDA/FALLECIDA no cuenta como ocupada; una jaula inactiva no cuenta ni en total ni en ocupadas.
6. **Ocupación** (450-474): `jaulas?.total > 0 ? Number(((Number(ocupadas) / Number(total)) * 100).toFixed(2)) : 0` **en JS** (`toFixed`, no `ROUND` de SQLite).
7. **Huevos hoy y mes** (192-216): `COUNT(CASE WHEN date(fecha)=date('now') THEN 1 END)` y `COUNT(CASE WHEN strftime('%Y-%m',fecha)=strftime('%Y-%m','now') THEN 1 END)` sobre **todos** los huevos (de cualquier ave y estado, incluidas aves vendidas o fallecidas). `date()` y `strftime()` se aplican al texto de `fecha` (convierten desplazamientos horarios a UTC; un texto no interpretable da `NULL` y no cuenta). "Mes" incluye fechas futuras del mismo mes.
8. **Mejor ponedora** (223-253): `huevos INNER JOIN aves` `GROUP BY a.id, a.codigo ORDER BY cantidad DESC LIMIT 1`, **sin desempate** y sin filtro de fecha ni de estado del ave: cuenta todos los huevos de la historia, también de aves VENDIDA o FALLECIDA. Sin huevos → `getFirstAsync` devuelve `null`.
9. **Hora pico** (260-283): `strftime('%H', fecha) AS hora` `GROUP BY strftime('%H',fecha) ORDER BY cantidad DESC LIMIT 1`, **sin desempate**, sobre todos los huevos, en UTC. `hora` es **texto de 2 dígitos** (`'00'`…`'23'`), o `null` si `fecha` no es interpretable. Sin huevos → `null`.
10. **Producción de la semana** (291-327): `WHERE fecha >= date('now','-6 day')` **sin cota superior**, `GROUP BY strftime('%w',fecha) ORDER BY strftime('%w',fecha)`; `dia` por `CASE strftime('%w',fecha)` (`'0'` Domingo … `'6'` Sábado, con tilde en `Miércoles` y `Sábado`, sin `ELSE`). Agrupa **por día de la semana**, no por fecha, y el orden es el del número de día: **Domingo primero, Sábado último**, no cronológico.
    - La comparación `fecha >= date('now','-6 day')` es de **texto**: `date()` devuelve `'YYYY-MM-DD'` y cualquier `fecha` `'YYYY-MM-DDT…'` o `'YYYY-MM-DD …'` de ese mismo día es mayor (más larga con el mismo prefijo), así que **entra todo el día −6** desde las 00:00. Es independiente de la hora de `now`. Un texto con desplazamiento (`2026-11-05T22:00:00-05:00`) se compara tal cual con el prefijo local, aunque `strftime('%w', …)` lo convierta a UTC: se replica porque la expresión es idéntica.
    - Como los 7 días de la ventana son 7 días de la semana distintos, sin huevos futuros **no se mezclan semanas**. **Pero la ventana no tiene cota superior:** un huevo con fecha futura (p. ej. +3 días) entra y se agrega al día de la semana que le corresponda, que puede coincidir con un día pasado de la ventana (mismo `%w`): V1 los suma en la misma fila. Se replica sin cota superior y se anota (caso INI-17).
    - Una `fecha` con texto no interpretable da `dia` `NULL` solo si pasa el filtro textual (p. ej. `2026-11-05 basura`): V1 devuelve una fila `{ dia: null, cantidad: n }` que el `ORDER BY` pone primero (hipótesis: `NULL` primero en `ASC`). Caso patológico, sin camino de la app que lo cree; se cubre por paridad.
11. **Promedio** (335-351): `ROUND(COUNT(*) / 7.0, 2)` con la **misma ventana textual** `fecha >= date('now','-6 day')`; siempre divide entre 7 (no entre los días con datos). `Number(promedio?.promedio || 0)` en JS (559).
12. **Aves por raza** (359-413): solo `estado='ACTIVA'`; `raza` = `COALESCE(NULLIF(TRIM(raza),''),'Sin raza')` (`TRIM` solo quita espacios; una raza de solo tabuladores no se normaliza); `cantidad` = `COUNT(*)`; `porcentaje` = `ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM aves WHERE estado='ACTIVA'), 0), 2)`; orden `cantidad DESC, raza ASC` (en SQLite `raza` del `ORDER BY` resuelve al alias, no a la columna; comparación binaria por bytes UTF-8, distingue mayúsculas: `'Sin raza'` se ordena entre las demás como cualquier texto). Los porcentajes redondeados **pueden no sumar 100** (p. ej. tres razas con 33,33 + 33,33 + 33,33).
13. **Total de razas** (421-442): `COUNT(DISTINCT COALESCE(NULLIF(TRIM(raza),''),'Sin raza'))` sobre ACTIVAS, `Number(total?.total || 0)`. Es **igual al número de filas de `avesPorRaza`** (mismo conjunto, misma expresión).
14. **Forma del objeto** (481-562): las partes `aves`, `salud`, `jaulas`, `huevos`, `mejorPonedora`, `horaPico`, `produccionSemana` y `avesPorRaza` son las **filas tal cual salen de SQLite**; `finanzas`, `ocupacionJaulas`, `totalRazas` y `promedioHuevos` se construyen en JS con `Number()`.

## Contrato del repositorio

Fachada como Alertas, Reportes y Clientes: `src/repositories/DashboardRepository.js` pasa a elegir `DashboardRepository.sqlite.js` (el código actual de V1 **renombrado sin tocar su contenido**) o `DashboardRepository.api.js` según `src/config/dataSource.js`. `InicioScreen.js:65-67` no cambia el import.

| Función (V1) | Firma | Devuelve |
|---|---|---|
| `obtenerDashboard()` (7-565) | sin parámetros | el objeto de abajo, siempre con todas las claves, en este orden |

Errores: V1 no lanza errores propios (un fallo de SQLite se propaga). En modo API los errores de red y sesión se propagan como `ApiError`, igual que los demás clientes.

### Forma exacta del objeto (claves y orden de `return`, 481-562)

```
{
  aves:             { activas, vendidas, fallecidas },          // enteros
  salud:            { sanas, tratamiento, enfermas },           // enteros (solo ACTIVAS)
  finanzas:         { ingresos, egresos, utilidad },            // numbers (REAL sin redondeo)
  jaulas:           { total, ocupadas },                        // enteros
  ocupacionJaulas:  { porcentaje },                             // number, 2 decimales (toFixed) o 0
  huevos:           { hoy, mes },                               // enteros
  mejorPonedora:    { codigo, cantidad } | null,                // codigo string, cantidad entero
  horaPico:         { hora, cantidad } | null,                  // hora string '00'..'23' (o null si fecha inválida), cantidad entero
  produccionSemana: [ { dia, cantidad } ],                      // dia string en español; orden Domingo..Sábado; [] si no hay
  avesPorRaza:      [ { raza, cantidad, porcentaje } ],         // cantidad entero, porcentaje number (ROUND 2)
  totalRazas:       n,                                          // entero
  promedioHuevos:   n                                           // number (ROUND 2)
}
```

Todas las claves ya son camelCase o una palabra (confirmadas en el `return` 481-562 y en los alias SQL `activas, vendidas, fallecidas, sanas, tratamiento, enfermas, ingresos, egresos, total, ocupadas, hoy, mes, codigo, cantidad, hora, dia, raza, porcentaje, total, promedio`). **El cliente devuelve `data` tal cual (sin `aSnake` ni transformación)**: el servidor responde `data` con la misma forma. Claves siempre presentes; `mejorPonedora` y `horaPico` son `null` real (no ausentes) sin huevos.

Tipos: V1 devuelve enteros de SQLite en `aves`, `salud`, `jaulas`, `huevos` y `cantidad` (sin `Number()`); JSON no distingue `0` de `0.0`, así que `promedioHuevos`, `porcentaje` o `ingresos` valen igual. `utilidad` se calcula en JS (`ingresos - egresos`) igual que V1 (sin redondeo: `0.3 - 0.1` da `0.19999999999999998`, como en V1). `jaulas.total`/`ocupadas` y todos los conteos son enteros.

## Endpoints V2

Decisión: **un solo endpoint** (hay una sola función pública): `GET /api/v1/criaderos/:criaderoId/dashboard`, sin cuerpo ni query. `data` es **el objeto del dashboard directamente** (sin envoltorio), p. ej. `{ "success": true, "data": { "aves": { "activas": 2, … }, … } }`.

- Módulo `api/src/inicio/` (`inicio.routes.ts`, `.factory.ts`, `.service.ts`, `.repository.ts`, `.types.ts`), montado en `api/src/app.ts` como `/api/v1/criaderos/:criaderoId/dashboard` (opción `inicioRouter` inyectable en pruebas, como `alertasRouter`).
- Errores: 401 `UNAUTHORIZED`/`INVALID_TOKEN`, 403 `FORBIDDEN` (criadero ajeno **o inexistente**, como el resto), 500 `INTERNAL_ERROR`. V1 no lanza errores propios. Sin validaciones nuevas, sin `version`, sin parámetros.
- Reloj: `createDashboardDependencies(db, ahora: () => Date = () => new Date())` (patrón de `alertas.factory.ts:13-16`). **Un solo `ahora().toISOString()` por petición** (`AHORA`) sustituye a todos los `'now'`. En V1 cada `'now'` se evalúa por sentencia; la diferencia solo se nota si la petición cruza la medianoche UTC (como en Alertas).
- Cliente REST `DashboardRepository.api.js` (`apiFetch`, `rutaCriadero` de `src/api/huevosApi.js:15`): `obtenerDashboard()` → `GET /dashboard` y `return data` (sin `aSnake`).
- Costo desde la pantalla: `InicioScreen` hace en paralelo `obtenerDashboard()` + `obtenerTodasLasAlertas()` + `obtenerResumenAlertas()` (`InicioScreen.js:131-151`): tres peticiones HTTP (6 + 5 + 5 llamadas D1), cada una un invocación del Worker aparte (el límite de 50 subrequests es por invocación).

## Consultas D1 (número fijo, sin bucles)

**Objetivo y medida: 6 llamadas a D1 por petición** (ownership + 5 SELECT; sin `db.batch`), independientemente del número de aves, jaulas y huevos. V1 hacía 12. Los cinco SELECT pueden lanzarse con `Promise.all` o en serie (mismo número de llamadas). `?` posicionales repitiendo el bind (el adaptador `better-sqlite3` falló con `?1`/`?2`). `AHORA` = `ahora().toISOString()`, `CID` = `criaderoId`.

Los textos de abajo son el diseño original; **la paridad con V1 decidió** las diferencias (ver "Orden y desempates" y "Redondeos"). Cambios reales frente al texto: la tabla derivada de jaulas se llama `jj` (no `j`) y los `ORDER BY` de las llamadas 2 y 3 son los de V1 observados (abajo).

### Llamada 0: ownership

`D1CriaderoRepository.userOwnsCriadero(userId, criaderoId)`; si no, 403 (antes de cualquier consulta de datos).

### Llamada 1: resumen (aves, salud, finanzas, jaulas, huevos hoy/mes y promedio) en UNA fila

Cuatro tablas derivadas **agregadas sin `GROUP BY`** (cada una devuelve exactamente una fila, también sin datos), combinadas con `CROSS JOIN` implícito: sigue habiendo una sola fila, con los mismos números que las consultas separadas de V1. Justificación de cada fusión: aves+salud (V1 66-109 es `WHERE estado='ACTIVA'` y luego `CASE estado_salud`, equivalente a `CASE WHEN estado='ACTIVA' AND estado_salud=…`); finanzas, jaulas y huevos son independientes entre sí. Huevos: `hoy`, `mes` y el conteo de la ventana (`promedio`) comparten el barrido de `huevos` del criadero.

```sql
SELECT
  a.activas, a.vendidas, a.fallecidas,
  a.sanas, a.tratamiento, a.enfermas,
  f.ingresos, f.egresos,
  jj.total, jj.ocupadas,
  h.hoy, h.mes, h.promedio
FROM
  (SELECT
     COALESCE(SUM(CASE WHEN estado='ACTIVA'    THEN 1 ELSE 0 END), 0) AS activas,
     COALESCE(SUM(CASE WHEN estado='VENDIDA'   THEN 1 ELSE 0 END), 0) AS vendidas,
     COALESCE(SUM(CASE WHEN estado='FALLECIDA' THEN 1 ELSE 0 END), 0) AS fallecidas,
     COALESCE(SUM(CASE WHEN estado='ACTIVA' AND estado_salud='SANA'           THEN 1 ELSE 0 END), 0) AS sanas,
     COALESCE(SUM(CASE WHEN estado='ACTIVA' AND estado_salud='EN_TRATAMIENTO' THEN 1 ELSE 0 END), 0) AS tratamiento,
     COALESCE(SUM(CASE WHEN estado='ACTIVA' AND estado_salud='ENFERMA'        THEN 1 ELSE 0 END), 0) AS enfermas
   FROM aves WHERE criadero_id = ?) a,
  (SELECT
     COALESCE(SUM(CASE WHEN tipo='INGRESO' THEN valor ELSE 0 END), 0) AS ingresos,
     COALESCE(SUM(CASE WHEN tipo='EGRESO'  THEN valor ELSE 0 END), 0) AS egresos
   FROM movimientos_financieros
   WHERE criadero_id = ? AND strftime('%Y-%m', fecha) = strftime('%Y-%m', ?)) f,
  (SELECT
     COUNT(*) AS total,
     COALESCE(SUM(CASE WHEN EXISTS (SELECT 1 FROM aves x
                                    WHERE x.criadero_id = j.criadero_id
                                      AND x.jaula_actual_id = j.id AND x.estado = 'ACTIVA')
                       THEN 1 ELSE 0 END), 0) AS ocupadas
   FROM jaulas j WHERE j.criadero_id = ? AND j.activa = 1) jj,
  (SELECT
     COUNT(CASE WHEN date(fecha) = date(?) THEN 1 END) AS hoy,
     COUNT(CASE WHEN strftime('%Y-%m', fecha) = strftime('%Y-%m', ?) THEN 1 END) AS mes,
     ROUND(COUNT(CASE WHEN fecha >= date(?, '-6 day') THEN 1 END) / 7.0, 2) AS promedio
   FROM huevos WHERE criadero_id = ?) h
-- binds en orden textual: CID, CID, AHORA, CID, AHORA, AHORA, AHORA, CID
```

- `j.id` y `j.criadero_id` dentro del `EXISTS` se refieren a la tabla interna `jaulas j`; la derivada exterior se llama `jj` porque con `j` el alias chocaba (implementado así). Sin datos: aves y jaulas dan ceros por `COALESCE`; `ROUND(0/7.0,2)` da `0.0`.
- `COUNT(CASE … THEN 1 END)` con `WHERE criadero_id` equivale a `COUNT(*) … WHERE fecha >= …` de V1 (mismo conjunto de filas contadas), incluido `0.0` sin huevos en la ventana.
- Ventana de 7 días: `date(?, '-6 day')` con `AHORA` ISO (igual que `date('now','-6 day')`): comparación **textual** idéntica a V1 (hallazgo 10), sin cota superior.

### Llamada 2: mejor ponedora

```sql
SELECT a.codigo, COUNT(h.id) AS cantidad
FROM huevos h
INNER JOIN aves a ON a.id = h.ave_id AND a.criadero_id = h.criadero_id
WHERE h.criadero_id = ?
GROUP BY a.id, a.codigo
ORDER BY cantidad DESC, a.codigo ASC
LIMIT 1
-- binds: CID
```

`first()` devuelve `null` sin huevos. Sin filtro de fecha ni de estado del ave (V1). Desempate confirmado por paridad: con empate gana el ave de menor `codigo` (H-1 desmentida; no `rowid`).

### Llamada 3: hora pico

```sql
SELECT strftime('%H', fecha) AS hora, COUNT(*) AS cantidad
FROM huevos
WHERE criadero_id = ?
GROUP BY strftime('%H', fecha)
ORDER BY cantidad DESC, hora DESC
LIMIT 1
-- binds: CID
```

`hora` es texto de 2 dígitos. Sin huevos → `null`. Desempate confirmado por paridad: con empate gana la hora MAYOR (H-2 desmentida).

### Llamada 4: producción de la semana

```sql
SELECT
  CASE strftime('%w', fecha)
    WHEN '0' THEN 'Domingo' WHEN '1' THEN 'Lunes' WHEN '2' THEN 'Martes'
    WHEN '3' THEN 'Miércoles' WHEN '4' THEN 'Jueves' WHEN '5' THEN 'Viernes'
    WHEN '6' THEN 'Sábado'
  END AS dia,
  COUNT(*) AS cantidad
FROM huevos
WHERE criadero_id = ? AND fecha >= date(?, '-6 day')
GROUP BY strftime('%w', fecha)
ORDER BY strftime('%w', fecha)
-- binds: CID, AHORA
```

Misma expresión que V1, sin cota superior. Vacío → `[]`.

### Llamada 5: aves por raza (y total de razas)

```sql
SELECT
  COALESCE(NULLIF(TRIM(raza), ''), 'Sin raza') AS raza,
  COUNT(*) AS cantidad,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM aves WHERE criadero_id = ? AND estado = 'ACTIVA'), 0), 2) AS porcentaje
FROM aves
WHERE criadero_id = ? AND estado = 'ACTIVA'
GROUP BY COALESCE(NULLIF(TRIM(raza), ''), 'Sin raza')
ORDER BY cantidad DESC, raza ASC
-- binds: CID, CID
```

`totalRazas` = **número de filas** de esta consulta (V1 lo calcula con `COUNT(DISTINCT …)` sobre la misma expresión y el mismo conjunto de aves; fusión sin cambio de resultado, **confirmada por paridad**: no hizo falta la consulta 7).

### Ensamblado en el servicio (sin SQL)

- `ocupacionJaulas.porcentaje`: `Number(j.total) > 0 ? Number(((Number(ocupadas) / Number(total)) * 100).toFixed(2)) : 0` **en TypeScript, con `toFixed`** (no con `ROUND` de SQL; V1 466).
- `finanzas`: `ingresos = Number(f.ingresos || 0)`, `egresos = Number(f.egresos || 0)`, `utilidad = ingresos - egresos`.
- `totalRazas = filasRaza.length`; `promedioHuevos = Number(h.promedio || 0)`.
- `mejorPonedora`, `horaPico`: la fila o `null`. Objeto final con el orden de claves de V1 y claves internas en el orden del `SELECT` de V1 (`activas, vendidas, fallecidas`; `sanas, tratamiento, enfermas`; `total, ocupadas`; `hoy, mes`).

### Orden y desempates (resueltos por la paridad con el código real de V1)

Lección de Reportes y Alertas: la paridad desmintió desempates "obvios". Aquí también desmintió dos de los candidatos originales. V1 no ordena los empates de forma explícita: el resultado depende del plan de SQLite (índices `idx_aves_jaula`, `idx_aves_estado`, `idx_huevos_ave`, `idx_movimientos_fecha`). V2 fija un orden determinista equivalente al V1 observado; otra versión de SQLite en el teléfono podría desempatar distinto.

- **H-1 mejorPonedora: DESMENTIDA.** El candidato era el ave de menor `rowid`. Con empate V1 devuelve el ave de menor `codigo` → `ORDER BY cantidad DESC, a.codigo ASC` (no `rowid`).
- **H-2 horaPico: DESMENTIDA.** El candidato era la hora menor. Con empate gana la hora MAYOR → `ORDER BY cantidad DESC, hora DESC`.
- **H-3** (`produccionSemana` ordenado por `%w` numérico, Domingo primero, determinista; `dia`/`hora` `NULL` con fechas no interpretables): confirmada.
- **H-4 `avesPorRaza`** `cantidad DESC, raza ASC` (binario): confirmada; la raza `'Sin raza'` se ordena por su texto como las demás; una raza propia `'Sin raza'` (o `' Sin raza '` tras `TRIM`) se **fusiona** con las aves sin raza, como en V1.
- Cobertura de paridad: 8+2 patrones de empate de mejor ponedora y 8 de hora pico, con inserciones en distinto orden.

### Redondeos y punto flotante (D-3: sin diferencias en `better-sqlite3`; no probado en `expo-sqlite` ni en D1 real)

- `porcentaje` y `promedio` se redondean **en SQL** (`ROUND(…, 2)`) igual que V1: el mismo motor, aunque la versión de SQLite de D1 y la de `expo-sqlite` pueden diferir en casos de mitad exacta (p. ej. `x.xx5`); duda D-3.
- `ocupacionJaulas.porcentaje` se calcula en JS con `toFixed(2)`, que **no** coincide siempre con `ROUND` de SQLite en mitades (`1.005`); por eso se replica `toFixed` y no se cambia a SQL.
- `finanzas.ingresos`/`egresos`: suma `REAL` sin redondeo; con tres o más valores el orden de suma puede cambiar el último bit (V1 suma en su recorrido y D1 puede usar `ix_movimientos_criadero_fecha`); se cubre con REAL difíciles (`0.1 + 0.2`) en la paridad. `utilidad` hereda la diferencia.
- Porcentajes que no suman 100 (p. ej. 3 razas iguales) son comportamiento de V1, no un error.

## Tabla D1

**Sin tabla ni columna nuevas.** Lee tablas de 0005, 0006, 0009 y 0010. Mapeo V1 → D1:

| Dato | V1 | D1 | Diferencia |
|---|---|---|---|
| `aves.estado`, `estado_salud`, `raza`, `codigo` | TEXT | TEXT (`0006:19,26,32,35`) | ninguna |
| `aves.jaula_actual_id`, `jaulas.id`, `huevos.ave_id`, `aves.id` | INTEGER | TEXT UUID v7 | solo en JOIN; la respuesta no devuelve ids |
| `jaulas.activa` | INTEGER | INTEGER (`0005`) | ninguna |
| `huevos.fecha`, `movimientos_financieros.fecha` | TEXT ISO UTC | TEXT | ninguna |
| `movimientos_financieros.tipo`, `valor` | TEXT / REAL | igual | ninguna; sin redondeo |
| Todas | sin `criadero_id` | `criadero_id` | en cada consulta, subconsulta y JOIN |

La respuesta **no contiene ningún id**: por eso no hay cambio de tipo visible en la pantalla.

### Índices y migración

- **No hace falta migración** con las cifras previstas (la siguiente libre sigue siendo `0012`). Ya existen: `ix_aves_criadero_estado (criadero_id, estado)`, `ix_jaulas_criadero_activa (criadero_id, activa)`, `ix_aves_jaula_actual (jaula_actual_id)` (para el `EXISTS` de ocupadas), `ix_huevos_criadero_fecha (criadero_id, fecha)`, `ix_huevos_ave_fecha (ave_id, fecha)` y `ix_movimientos_criadero_fecha (criadero_id, fecha)`.
- Las consultas de huevos (hoy, mes, hora pico, mejor ponedora, semana) recorren todas las filas del criadero (como Reportes y Alertas) porque `date(fecha)`, `strftime` y la comparación textual no son un rango sargable; solo la ventana de 7 días y las agregaciones de aves usan índice parcialmente. Riesgo de CPU con decenas de miles de huevos sin medir en D1 real. Si la medición con datos grandes lo pide, se evaluaría `0012` (p. ej. índice sobre `aves(criadero_id, estado, jaula_actual_id)`), **no se crea por defecto**.

## Excepciones técnicas por pasar a online

- **E-1 `criadero_id`** en la ruta y en cada consulta, subconsulta y JOIN; ownership 403 (criadero ajeno o inexistente).
- **E-2 Cálculo en el servidor** (decisión del usuario) con reloj inyectable `ahora` (un único instante por petición) en lugar de `'now'`.
- **E-3 Autenticación y errores de red:** el cliente propaga el `ApiError`.
- **E-4 UUID v7:** solo en los JOIN internos (la respuesta no devuelve ids); los desempates usan `codigo` y `hora`, no el UUID ni `rowid`.
- **E-5 Fusión de consultas** (12 → 6 llamadas D1) y `totalRazas` = filas de `avesPorRaza`: mismo resultado y orden de claves (confirmado por la paridad).
- Sin imágenes (R2 no aplica). Sin validaciones ni límites nuevos.
- **Ninguna excepción a pantallas V1** (decisión del usuario).

## Qué ve InicioScreen y si hay que modificarla

**Conclusión: no hace falta modificar ninguna pantalla** (`git diff -- src/screens src/components` debe quedar vacío). La única pieza de la app que cambia es el cliente (`DashboardRepository.js` pasa a fachada y se añaden `.sqlite.js` y `.api.js`).

`InicioScreen.js` (tab raíz Inicio, `AppNavigator.js:211`):

- Carga (`cargar` 120-188, en cada foco `useFocusEffect` 196-204): `setLoading(true)` → `Promise.all([obtenerDashboard(), obtenerTodasLasAlertas(), obtenerResumenAlertas()])` (131-151) → `setData`, `setAlertas`, `setResumenAlertas`; `ActivityIndicator` mientras `loading` (212-232).
- **Aves** (270-351): `MetricCard` "Activas", "Vendidas", "Fallecidas" con `String(data?.aves?.X || 0)` y "Tratamiento" con `String(data?.salud?.tratamiento || 0)`. Solo lee `salud.tratamiento`; `salud.sanas` y `salud.enfermas` no se muestran pero se devuelven (forma exacta de V1).
- **Distribución por raza** (364-494): "Razas presentes: {data?.totalRazas || 0}", "Aves activas: {data?.aves?.activas || 0}" (texto que el flujo busca como `Aves activas: N`); por cada `item` de `avesPorRaza` (en el orden recibido): `key={item.raza}`, nombre, `"{cantidad} ave|aves"` (`Number(item.cantidad) === 1`) y `ProgressBar value={Number(item.porcentaje || 0)} suffix="%"` (el valor se pinta crudo: `66.67%`); si no hay filas o no es array: "Sin información de razas.".
- **Producción** (506-581): `ProductionMetricCard` "Hoy" (`data?.huevos?.hoy || 0`) y "Este mes"; `ProductionInfoCard` "Mejor ponedora" con `data?.mejorPonedora?.codigo || 'Sin datos'` (`null` → "Sin datos"; no usa `cantidad`) y "Mayor postura" con `data?.horaPico?.hora ? \`${hora}:00\` : 'Sin datos'` (`null` → "Sin datos"; **`hora` `'00'` es un string no vacío, truthy: se muestra `00:00`**; solo `null` o `''` dan "Sin datos"). No usa `horaPico.cantidad`.
- **Indicadores** (593-631): "Promedio huevos diarios" con `data?.promedioHuevos || 0` (número crudo: `0.43`, `3`, `0`) y `ProgressBar` "Ocupación de jaulas" con `data?.ocupacionJaulas?.porcentaje || 0`.
- **Producción últimos días** (643-675): `ProduccionBarChart data={produccionSemana}` si `length > 0` (en el orden recibido, Domingo primero; `key={item.dia}`; `"{dia}"` y `"{cantidad} huevos"`; barra relativa al máximo), si no "Sin información de producción.".
- **Alertas** (687-858): tarjeta Críticas/Advertencias/Total (módulo Alertas ya migrado) y lista de `AlertCard`, o "✅ No existen alertas pendientes.".
- **Finanzas del mes** (870-900): `FinanzasBarChart` con `ingresos`, `egresos`, `utilidad`; pinta `$` + `valor.toFixed(2)` (**exige `number`**: el servidor y el cliente devuelven números, no texto).
- **Jaulas** (912-960): "🏠 Total: {data?.jaulas?.total || 0}", "🐔 Ocupadas: {data?.jaulas?.ocupadas || 0}" y `ProgressBar` "Ocupación".

### Observaciones (V1, no se resuelven; sin excepciones a pantallas)

- **DUDA PARA EL USUARIO (errores de red, sin aviso):** `InicioScreen.js:173-180` tiene un `catch` que solo hace `console.error('Error dashboard:', error)`. Como `Promise.all` rechaza entero (143-151), si **cualquiera** de las tres peticiones falla (red, sesión caducada 401, o el módulo de alertas), `data` queda `null`, `alertas` `[]` y `resumenAlertas` en ceros, y la pantalla muestra todo en 0, "Sin información de razas.", "Sin datos", "Sin información de producción." y "✅ No existen alertas pendientes.": indistinguible de un criadero vacío, igual que Alertas/Reportes/Clientes en V1. Si se quiere un aviso, exige un cambio de pantalla; **no se hace** sin autorización. En el modo API, con la sesión caducada (token de 60 min sin refresh), la pantalla de Inicio (la primera que se abre) mostraría ceros en lugar de volver al inicio de sesión si el manejo del 401 no lo redirige antes (confirmar en `apiFetch`).
- **DUDA PARA EL USUARIO (clave duplicada, no reproducible desde la app):** `ProduccionBarChart.js:74` usa `key={item.dia}`; con una `fecha` no interpretable que pase el filtro textual, `dia` sería `null` (a lo sumo una fila). Sin camino de la app que lo cree (la app escribe ISO válido). Sin acción.
- `FinanzasBarChart.js:87` llama a `valor.toFixed(2)`: el cliente **no** debe convertir a texto (`aSnake` no se usa).
- `ids` en la respuesta: ninguno; no hay `Number()` sobre ids en Inicio (las únicas navegaciones usan `item.entidadId` de Alertas, ya UUID: `InicioScreen.js:785,803,821,839`).
- Tres peticiones por foco (dashboard + alertas ×2); las dos de alertas ya son así en modo API desde el módulo Alertas.

### Flujo de pantalla actual y destino

(Histórico: describe el estado previo a la migración; hoy el flujo es `completo/94-inicio.yaml` y `esperado-fallar/` ya no existe.)

`pruebas/movil/flujos/esperado-fallar/inicio.yaml` (hoy): semilla `--aves=AV-P:MACHO,AV-M:HEMBRA` (dos aves ACTIVAS de raza `Kikiris`, sin jaulas ni huevos, creadas por la API); tags `esperado-fallar` y `dashboard`; `entrar.yaml`, toca la pestaña Inicio (`point: 10%,96%`) y espera `".*Aves activas: 2.*"` durante 15 s. **Falla hoy** porque `obtenerDashboard()` lee el SQLite local (sin aves) y la pantalla muestra "Aves activas: 0". Al migrar, el informe avisa "migrado, quitar etiqueta": se mueve a `completo/` (nombre propuesto `99b-inicio.yaml`; el orden alfabético lo deja después de `99-alertas.yaml`), con tags `completo`, `migrado`, `inicio` y semilla ampliada (ver plan de pruebas).

## Casos de paridad

Convenciones: reloj fijo `AHORA = 2026-11-05T15:00:00.000Z` en D1 y, en la copia de V1, el mismo valor entre comillas en lugar de `'now'` en el SQL que recibe el adaptador; `id` creciente por inserción; códigos `K001…`, `J01…`; criadero A salvo que se diga otro. Hoy UTC = `2026-11-05`; mes = `2026-11`; ventana = desde `2026-10-30` (00:00, texto `>= '2026-10-30'`).

| id | dado | cuando | entonces |
|---|---|---|---|
| INI-01 | Criadero vacío (sin aves, jaulas, huevos ni movimientos) | `obtenerDashboard` | todos los conteos 0, `finanzas {0,0,0}`, `jaulas {0,0}`, `ocupacionJaulas {porcentaje: 0}`, `huevos {0,0}`, `mejorPonedora: null`, `horaPico: null`, `produccionSemana: []`, `avesPorRaza: []`, `totalRazas: 0`, `promedioHuevos: 0`; claves y orden de V1 |
| INI-02 | Aves ACTIVA, VENDIDA y FALLECIDA de varias razas | `aves` y `salud` | `activas/vendidas/fallecidas` cuentan todas; `salud` solo las ACTIVAS; VENDIDA/FALLECIDA en tratamiento no suman |
| INI-03 | ACTIVA con `estado_salud` `NULL`, vacío u otro valor | `salud` | no suma en ninguna columna; `sanas+tratamiento+enfermas < activas` |
| INI-04 | Jaula activa con aves ACTIVA; jaula activa con solo VENDIDA/FALLECIDA; jaula activa sin aves; jaula inactiva con aves | `jaulas` y ocupación | `total` = jaulas activas; `ocupadas` solo la primera; la inactiva no cuenta; porcentaje `Number(((ocupadas/total)*100).toFixed(2))` (p. ej. 1 de 3 = `33.33`, 2 de 3 = `66.67`) |
| INI-05 | 0 jaulas activas | ocupación | `porcentaje: 0` (no `NaN`) |
| INI-06 | Aves de otro criadero en jaulas y razas | todas | no cuentan (`criadero_id` en JOIN y subconsultas) |
| INI-07 | Movimientos INGRESO/EGRESO de `2026-10-31T23:59:59.999Z`, `2026-11-01T00:00:00.000Z`, `2026-11-30T23:59:59.999Z`, `2026-12-01T00:00:00.000Z` y tipo distinto | `finanzas` | solo los de `2026-11` y solo `INGRESO`/`EGRESO`; `utilidad = ingresos - egresos` en JS |
| INI-08 | Solo egresos; solo ingresos; sin movimientos del mes | `finanzas` | utilidad negativa, positiva y 0 |
| INI-09 | REAL difíciles (`0.1`, `0.2`, `0.3`, sumas de 3+ y muchos movimientos) | `finanzas` | igual que V1 con `toStrictEqual` (D-3) |
| INI-10 | Huevos de hoy a `00:00:00.000Z`, `23:59:59.999Z`; ayer `23:59:59.999Z`; mañana `00:00:00.000Z` | `huevos.hoy` | cuentan solo los dos primeros; con relojes `23:59:59.999` y `00:00:00.000` el resultado coincide con V1 |
| INI-11 | Huevos de otro mes (`2026-10-31T23:59:59.999Z`, `2026-12-01T00:00:00.000Z`) y de otro año | `huevos.mes` | no cuentan; los futuros del mismo mes sí cuentan |
| INI-12 | Huevos de aves VENDIDA y FALLECIDA y de cualquier fecha | `mejorPonedora` | cuentan (sin filtro de estado ni de fecha) |
| INI-13 | Empates de cantidad entre dos o más aves, insertadas en distinto orden que sus huevos; con códigos que ordenan distinto que sus ids | `mejorPonedora` | H-1 desmentida: gana el ave de **menor `codigo`** (`ORDER BY cantidad DESC, a.codigo ASC`), no el de menor `rowid` |
| INI-14 | Empates entre horas (p. ej. 2 huevos a `08` y 2 a `14`), insertados en distinto orden | `horaPico` | H-2 desmentida: gana la hora **mayor** (`'14'`; `ORDER BY cantidad DESC, hora DESC`); `hora` es texto de 2 dígitos (`'08'`, no `8`) |
| INI-15 | Huevos en cada día de la ventana de 7 días (hoy −6 a hoy) y uno en el −7 | `produccionSemana` y `promedioHuevos` | el −7 no cuenta; el −6 cuenta desde las `00:00:00.000Z` (ventana textual); filas en orden `%w` (Domingo primero, no cronológico); `promedio = ROUND(total_ventana/7.0, 2)` |
| INI-16 | Formatos de fecha: ISO con `Z`, `YYYY-MM-DD HH:MM:SS`, `YYYY-MM-DD` solo, ISO con desplazamiento (`2026-11-05T22:00:00-05:00`) | hoy/mes/ventana/semana/hora | cada función con el mismo resultado que V1 (la ventana es comparación textual; `date`/`strftime` convierten a UTC) |
| INI-17 | Huevo con fecha futura (hoy +3 días) cuyo `%w` coincide con el de un día pasado de la ventana | `produccionSemana` | misma fila sumada, como V1 (la ventana no tiene cota superior); `promedio` lo incluye |
| INI-18 | Ventana con huevos en el día −6, −5 y semana siguiente (pasada la medianoche con el reloj en `00:00:00.000Z` y `23:59:59.999Z`) | semana | coincide con V1 en ambos relojes |
| INI-19 | Texto de `fecha` no interpretable que pase el filtro textual (`2026-11-05 basura`) | semana, hora | coincide con V1 (`dia` `null`, `hora` `null`; posición: H-3 confirmada) |
| INI-20 | Razas `Kikiris`, `kikiris`, `' Kikiris '`, `''`, `'   '`, `NULL` y `'Sin raza'` | `avesPorRaza` y `totalRazas` | `TRIM` solo espacios (sensible a mayúsculas); `''`, espacios, `NULL` y `'Sin raza'` se fusionan en `'Sin raza'`; orden `cantidad DESC, raza ASC`; `totalRazas` = filas |
| INI-21 | 3 razas con 1 ave cada una (33,33 × 3), 2/3 y 1/3, 1/7… | `porcentaje` | `ROUND(…,2)` de SQLite idéntico a V1 (`33.33`, `66.67`, `14.29`); la suma puede no ser 100 (**hipótesis de redondeo D-3**); cantidad 1 → la pantalla pinta "ave" |
| INI-22 | Aves VENDIDA/FALLECIDA con raza | `avesPorRaza` | no cuentan (ni en el porcentaje, que usa el total de ACTIVAS) |
| INI-23 | Aves y huevos de otro criadero con mismos códigos y razas | todas | cada criadero ve solo lo suyo; criadero ajeno o inexistente → 403 |
| INI-24 | Objeto completo | `toStrictEqual` | `Object.keys` de cada parte y de la raíz en el orden de V1; `null` real (no ausente) en `mejorPonedora` y `horaPico`; tipos (`hora` string, `dia` string) |
| INI-25 | Datos pseudoaleatorios (varias semillas y relojes: `15:00`, `23:59:59.999`, `00:00:00.000`, cambio de mes y de año, bisiesto) | todas | objeto idéntico a V1 (0 diferencias en 40 semillas y 10 relojes) |
| INI-26 | 60 jaulas, 300 aves, 2000 huevos, 2000 movimientos | `GET /dashboard` | mismo resultado que V1; **6 llamadas a D1** (igual que con pocos datos); tiempo y tamaño anotados |
| INI-27 | Petición que cruza la medianoche UTC | `GET /dashboard` | un solo `ahora` por petición: todas las consultas usan el mismo día y mes |
| INI-28 | Fallo de red/sesión | `InicioScreen` | `console.error` y pantalla en ceros (V1, ver observaciones) |

## Plan de pruebas

1. **Unitarias de service** con fake de repositorio: ensamblado y orden de claves, `ocupacionJaulas` con `toFixed` y `0` sin jaulas, `utilidad` en JS, `totalRazas = filas`, `mejorPonedora`/`horaPico` `null`, `ahora` inyectado y usado en todas las consultas, `Number(x || 0)`.
2. **HTTP ligero** (`app.request()`): 401/403 (inexistente = 403), forma `{ success, data }` con `data` = objeto del dashboard, claves y orden, `null` presentes.
3. **Integración D1** (`LocalD1Adapter`): SQL real con INI-01 a INI-27; **conteo de llamadas = 6** con el volumen de INI-26 y con pocos datos; aislamiento (INI-23); reloj fijo.
4. **Paridad con el código REAL de V1** (`api/test/integration/dashboard.paridad-v1.d1.test.ts`, como `alertas.paridad-v1.d1.test.ts`, `reportes.paridad-v1.d1.test.ts` y `clientes.paridad-v1.d1.test.ts`): cargar `src/repositories/DashboardRepository.sqlite.js` **sin modificar** sobre `better-sqlite3` en memoria con el esquema de V1 (sin FK ni UNIQUE que estorben); un adaptador mínimo imita `getFirstAsync`/`getAllAsync` de expo-sqlite y **sustituye `'now'` por el reloj fijo** en el SQL que recibe; mismos datos en D1 local (más un segundo criadero); `toStrictEqual` del objeto completo y `Object.keys` en orden de cada parte; ids no se devuelven (sin normalización de ids). Detalle: `getFirstAsync` de expo-sqlite devuelve `null` sin fila; `better-sqlite3` devuelve `undefined`: el adaptador del test debe convertir a `null` como lo hace expo-sqlite, para que `mejorPonedora`/`horaPico` sean `null` (ver cómo lo resuelve `alertas.paridad-v1.d1.test.ts:99`). Incluir empates, relojes en bordes, formatos de fecha, REAL difíciles y semillas pseudoaleatorias. **El test decide cada desempate y cada redondeo** (H-1 a H-4, D-3).
5. **Datos grandes** (60 jaulas, 300 aves, 2000 huevos, 2000 movimientos): llamadas D1 (esperado 6, constante), tiempo y tamaño de respuesta con el adaptador local; CPU en D1 real sin medir.
6. **`/probar datos`**: caso nuevo `pruebas/datos/casos/17-inicio.mjs` (patrón de `16-alertas.mjs`): en un criadero **nuevo** de la cuenta A, con los clientes REST reales, crear jaulas (una con aves ACTIVA, una vacía, una desactivada), aves de varias razas (incluida una sin raza) y de estados distintos (una vendida y una fallecida por la API de bajas), huevos con fechas **relativas a "ahora"** (hoy = ahora − 1 h con aborto con aviso si cruza la medianoche UTC entre el inicio y el fin, ayer = ahora − 24 h, hace 3 días, hace 10 días; **nunca en el borde** de la ventana de 7 días ni del mes: el esperado se calcula en JS con el algoritmo de V1 aplicando las mismas reglas de texto/mes UTC, no con cifras fijas), movimientos del mes UTC en curso y del anterior; llamar a `obtenerDashboard` de `DashboardRepository.api.js`; comparar el objeto completo (claves y orden, tipos) contra el modelo en JS (mejorPonedora/horaPico solo con datos **sin empate** para no fijar el desempate). Segunda cuenta desechable para aislamiento y añadir `GET /dashboard` a `05-aislamiento.mjs` y, si procede, a `06-aislamiento-ids.mjs`. No ejecutar los casos de "hoy" entre las 23:55 y las 00:05 UTC.
7. **Pantalla (emulador, `/probar completo`)** (hecho: el flujo real es `completo/94-inicio.yaml` y `esperado-fallar/inicio.yaml` se eliminó; el nombre `99b` de abajo era la propuesta original): mover `esperado-fallar/inicio.yaml` a `completo/99b-inicio.yaml` (quitar `esperado-fallar` y `dashboard`; añadir `completo`, `migrado`, `inicio`), con semilla del flujo y `# SEGUNDA-CUENTA` (patrón de `99-alertas.yaml`):
   - Semilla propuesta (usa solo opciones de `pruebas/movil/lib/preparar.mjs`): `# SEMILLA: --jaulas=JX-1 --aves=AV-P:MACHO:JX-1,AV-M:HEMBRA --huevos=AV-P:JX-1:0,AV-P:JX-1:0,AV-M::0` (dos aves de raza `Kikiris`, una en JX-1, tres huevos de hoy; el instante lo calcula `preparar.mjs` como ahora − 0 días).
   - Textos esperados con esa semilla (cuenta con datos): `.*Aves activas: 2.*`, `.*Razas presentes: 1.*`, `Kikiris` y `.*2 aves.*` (cantidad 2), `.*100%.*` en la barra de raza, `Mejor ponedora` con `AV-P` (2 huevos frente a 1, sin empate), `🏠 Total: 1`, `🐔 Ocupadas: 1`, `Producción últimos días` con una fila del día de hoy (el nombre del día depende de la fecha: no se afirma el texto, solo `.*3 huevos.*`), promedio `0.43` (3/7 = `0.43`), `$0.00` en Ingresos/Egresos/Utilidad, y alertas: `Total: 2`, `Advertencias: 2`, `Críticas: 0` (JX-1 sin alimentación ni bebida; hay huevos hoy, así que no hay alerta de producción). `Mayor postura` muestra `HH:00` de la hora UTC actual: no afirmar el valor, solo que no es "Sin datos".
   - Verificar al escribir el flujo el texto exacto de `ProductionMetricCard`, `ProductionInfoCard` y `MetricCard` (no leídos en esta spec).
   - Segunda cuenta (criadero vacío): `Aves activas: 0`, `Razas presentes: 0`, "Sin información de razas.", "Sin datos" en Mejor ponedora y Mayor postura, "Sin información de producción.", `🏠 Total: 0`, alertas `Total: 1` (solo producción) y no se ve `AV-P`, `Kikiris` ni `JX-1`.
   - Esperas solo por condición; abrir Inicio tocando la pestaña (`10%,96%`) como en el flujo actual; si el flujo cruza la medianoche UTC, repetir. Riesgo documentado: los huevos "de hoy" se crean al preparar; no ejecutar entre las 23:55 y las 00:05 UTC.
   - Modo avión y sesión caducada: solo en teléfono.

## Implementación (realizada; ver "Lo implementado (real)")

- API: `api/src/inicio/` (routes, factory con `ahora` inyectable, service, repository con 5 consultas + ownership, types), montado en `app.ts`; sin migración.
- Cliente: `DashboardRepository.js` (fachada), `DashboardRepository.sqlite.js` (V1 renombrado sin cambios) y `DashboardRepository.api.js` (`obtenerDashboard`).
- Nada de `src/screens/` ni `src/components/`.
- Documentación: estado, mapa (`documents/README.md`), roadmap y modelo de datos actualizados el 2026-11-07; Inicio es el último módulo de la fase 6.

## Pendientes y limitaciones

- "Hoy", "mes", hora pico y día de la semana en UTC, como V1 (un huevo nocturno en hora local puede caer en el día o mes UTC siguiente; la hora pico y el día se desplazan igual).
- Con Inicio migrado ya no quedan lectores de SQLite de la fase 6 para Inicio; **quedan en SQLite** lo que no se haya migrado a la fecha de implementación (comprobar `src/repositories/`); las pantallas de Inicio ya no comparten contadores entre dos cuentas del mismo teléfono.
- Riesgo de CPU con decenas de miles de huevos o movimientos (sin medir en D1 real).
- Fotos/R2: no aplica a este módulo (la respuesta no incluye imágenes).
- El aviso de red de `InicioScreen` no existe (V1).

## Dudas

- **DUDA PARA EL USUARIO:** errores de red y sesión caducada sin aviso en `src/screens/InicioScreen.js:173-180` (`catch` que solo hace `console.error`; `Promise.all` 143-151 falla entero: un fallo de cualquiera de las tres peticiones deja el dashboard en ceros). Se replica V1; un aviso exigiría una excepción de pantalla. Extra: en modo API, con 401 no hay redirección propia en Inicio.
- **DUDA PARA EL USUARIO (menor):** `src/components/charts/ProduccionBarChart.js:74` (`key={item.dia}`) con `dia` `null` solo con fechas no interpretables; sin acción.
- D-1 (resuelta): desempate de `mejorPonedora` = menor `codigo` (H-1 desmentida; no `rowid`).
- D-2 (resuelta): desempate de `horaPico` = hora mayor (H-2 desmentida); `dia`/`hora` `NULL` con fechas no interpretables confirmado (H-3). Abierta: otra versión de SQLite (teléfono) podría desempatar distinto.
- D-3 (abierta): redondeo `ROUND(…,2)` y suma de `REAL` sin diferencias en `better-sqlite3`; no probado en `expo-sqlite` ni en D1 real.
- D-4 (resuelta): `totalRazas` = filas de `avesPorRaza`, equivale al `COUNT(DISTINCT …)` de V1.
- D-5 (resuelta en lo comprobado): la fusión de la llamada 1 (alias `jj`, orden de binds `CID, CID, AHORA, CID, AHORA, AHORA, AHORA, CID`) es correcta en local y la ejercita el `/probar datos` 115/115 contra D1 remoto de pruebas.
- D-6 (técnica): índice opcional `0012` solo si la medición lo pide (con datos grandes locales: 11 a 43 ms); no se crea; CPU en D1 real sin medir.
- Pendiente de cierre: `/probar completo` válido (ver "Lo implementado (real)").
