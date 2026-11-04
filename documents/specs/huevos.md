# Spec: huevos

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).

## Estado

implementada (2026-11-03, rama `trabajo/migracion-nube`). Pendiente: comprobación en el teléfono físico (registrar un huevo, pantalla Producción y modo avión). Alcance: huevos de aves individuales (sin lotes), sin sincronización offline, D1 como fuente de verdad. Las líneas de "Fuente V1" son del árbol de V1 (v1.0.3, `app.json:5`).

### Lo implementado

- Migración `api/migrations/0009_huevos.sql`: tabla `huevos` con los índices `ux_huevos_criadero_codigo` (UNIQUE `(criadero_id, codigo)`), `ix_huevos_ave_fecha` `(ave_id, fecha)`, `ix_huevos_criadero_fecha` `(criadero_id, fecha)` y `ix_huevos_jaula` `(jaula_id)`. Aplicada en local, en integración y en la base remota de pruebas.
- API en `api/src/huevos/`, bajo `/api/v1/criaderos/:criaderoId`: `POST` y `GET /aves/:aveId/huevos`, `GET /huevos/siguiente-codigo` y `GET /huevos/produccion/{resumen,ranking,por-dia,por-dia-historico,por-hora,por-jaula,por-ave,total}`. Se implementaron **todas** las funciones de V1, también las seis sin llamadores.
- Código `H` + 6 dígitos = `COUNT(*) + 1` **por criadero**, calculado en el mismo `db.batch` que el `INSERT` del huevo y el del evento `ave_historial` `POSTURA_HUEVO` (`detalle` `Registró huevo ${codigo}`, con `jaula_id`). El código se devuelve con un `SELECT` justo después del batch (el adaptador de pruebas no devuelve filas de `SELECT` dentro del batch).
- Periodos todo en UTC (`date('now')`, `strftime('%Y-%m')`, semana = `fecha >= date('now','-6 day')` por comparación de cadenas, sin límite superior ni `'localtime'`). En V2 el SQL usa el instante que inyecta el servicio; el reloj inyectable existe solo en tests, sin parámetro público. Dependen del reloj: `obtenerResumenProduccion`, `ProduccionRepository.obtenerProduccionPorDia`, `HuevoRepository.obtenerProduccionHuevos` y `registrarHuevo` sin `fecha`.
- Cliente de la app: `HuevoRepository.{js,sqlite.js,api.js}`, `ProduccionRepository.{js,sqlite.js,api.js}` y `src/api/huevosApi.js` (fachadas; el `.sqlite.js` conserva el código V1).
- Commits: API `07d203d`, clientes `c338b74`, pantalla `469b742`, pruebas `3436a62` (caso `09-huevos` y flujo `70-huevo`).
- Validación: typecheck OK; 222 pruebas unitarias/HTTP y 72 de integración; `/probar datos` 49/49 en 72,2 s (sin fuga entre cuentas); smoke verde (2,6 min); flujo `70-huevo` migrado en verde (111 s; la primera ejecución falló por un fallo del propio flujo, botón y título con el mismo texto, corregido con `index: 1`). `/probar completo` no se ejecutó al cerrar Huevos; se ejecutó al cerrar Genealogía y Ciclo de vida (2026-11-03, 27,6 min, 0 regresiones, solo `PENDIENTE DE MIGRAR: dashboard`). `revisor-arquitectura-v2`: APROBADO.
- **Cobertura nueva (2026-11-03):** caso `pruebas/datos/casos/09b-huevos-formas.mjs` (8 pruebas: claves, tipos y orden exactos de las 13 funciones de `HuevoRepository` y `ProduccionRepository`, con fechas fijas de 2020; sin hallazgos de no-paridad) y flujo del emulador `71-produccion-huevos`, que abre Producción con huevos de hoy y de días pasados (opción `--huevos=AVE:JAULA:DIAS_ATRAS` de `pruebas/movil/lib/preparar.mjs`). Con ello `ProduccionHuevosScreen` ya está cubierta por el emulador.
- Limitaciones conocidas: concurrencia real del contador no probada (el `UNIQUE` es el respaldo y D1 serializa las escrituras); `DetalleAveScreen` (catch de carga) y `RegistrarHuevoScreen.cargarAve` siguen sin aviso de error de red, como V1 (decisión del usuario); Alertas, Inicio y Reportes siguen en SQLite y no ven los huevos de la nube. El ciclo de vida del ave ya muestra los huevos (Ciclo de vida implementado, 2026-11-03).

## Fuente V1

- `src/repositories/HuevoRepository.js` (completo): `generarCodigoHuevo` 7-33, `registrarHuevo` 38-120, `obtenerHuevosAve` 125-160, `obtenerProduccionHuevos` 165-199, `obtenerTopPonedoras` 204-236, `obtenerProduccionPorDia` 241-273, `obtenerProduccionPorHora` 278-302, `obtenerProduccionPorJaula` 307-335.
- `src/repositories/ProduccionRepository.js` (completo): `obtenerResumenProduccion` 9-88, `obtenerRankingPonedoras` 96-149, `obtenerProduccionPorDia` 157-221, `obtenerProduccionPorJaula` 229-276, `obtenerProduccionPorAve` 284-333.
- Pantallas consumidoras:
  - `src/screens/RegistrarHuevoScreen.js`: importa `registrarHuevo` (24-26) y `obtenerAvePorId` (18-20); `cargarAve` 86-101; `guardar` 107-191.
  - `src/screens/ProduccionHuevosScreen.js`: importa 4 funciones de `ProduccionRepository` (22-27) y `obtenerProduccionPorHora` de `HuevoRepository` (31-33); `cargar` 118-209 (`Promise.all` 142-160); `useFocusEffect` 216-224.
  - `src/screens/DetalleAveScreen.js`: importa `obtenerHuevosAve` (34-36); `cargar` 84-151 (llamada 118-126); lista 708-791; botón "Registrar huevo" 927-959.
- Componentes que pintan los resultados: `src/components/charts/ProduccionBarChart.js` (usa `item.dia`, `item.cantidad`), `ProduccionJaulaBarChart.js` (usa `item.codigo`, `item.cantidad`), `src/components/RankingCard.js` (recibe `codigo`, `cantidad`).
- Esquema V1: `src/database/migrations.js:218-240` (`huevos`), `:358-359` (`idx_huevos_ave`), `:133-154` (`ave_historial`). `PRAGMA foreign_keys = ON` en `src/database/sqlite.js:63`.
- D1 ya existente que se reutiliza: `api/migrations/0006_aves.sql:16-54` (`aves`), `:90-112` (`ave_historial`: `jaula_id` nullable, FK `RESTRICT`); `jaulas` en `0005`. La migración de este módulo es `0009_huevos.sql` (`0008_salud.sql` ya existía); la siguiente libre es `0010`.
- Rutas/navegación: `RegistrarHuevo` en `AvesStackNavigator.js:72-73`, `ProduccionHuevos` en `MasStackNavigator.js:142-145`, entrada desde `MasMenuScreen.js:151-155`.

### Búsquedas sin límite hechas en `src/` (App.js y raíz sin más importadores)

- **Importadores de `HuevoRepository`**: solo `DetalleAveScreen.js:36`, `RegistrarHuevoScreen.js:26`, `ProduccionHuevosScreen.js:33`. **Importadores de `ProduccionRepository`**: solo `ProduccionHuevosScreen.js:27`.
- **Llamadores por función** (fuera de su propio archivo):
  - `registrarHuevo`: `RegistrarHuevoScreen.js:121`. `obtenerHuevosAve`: `DetalleAveScreen.js:119`. `obtenerProduccionPorHora`: `ProduccionHuevosScreen.js:154`.
  - `obtenerResumenProduccion`, `obtenerRankingPonedoras`, `obtenerProduccionPorDia` (**la de `ProduccionRepository`**) y `obtenerProduccionPorJaula` (**la de `ProduccionRepository`**): solo `ProduccionHuevosScreen.js:145-157`.
  - **Sin ningún llamador**: `generarCodigoHuevo` (solo la llama `registrarHuevo`, `HuevoRepository.js:51`), `HuevoRepository.obtenerProduccionHuevos`, `HuevoRepository.obtenerTopPonedoras`, `HuevoRepository.obtenerProduccionPorDia`, `HuevoRepository.obtenerProduccionPorJaula`, `ProduccionRepository.obtenerProduccionPorAve`. (Los nombres `obtenerProduccionPorDia/PorJaula` existen en los dos repositorios; la pantalla importa los de `ProduccionRepository`, `ProduccionHuevosScreen.js:22-27`.)
- No existe ningún `DELETE`/`UPDATE` sobre `huevos` en `src/` (todas las apariciones de la tabla son `INSERT`/`SELECT`; ver búsqueda de `huevos`). Los huevos solo se crean y se leen; esto sostiene que `COUNT(*)+1` no repite códigos en V1 (el respaldo `BackupRepository` restaura la base completa, no se analiza aquí).
- **Otros lectores de `huevos` (siguen en SQLite hasta su módulo; solo se anotan, fuera de alcance):**
  - `AlertasRepository.js:389-402` (`COUNT(*) ... WHERE date(fecha)=date('now')`; alerta "Sin producción registrada" / "No existen huevos registrados hoy." `:433-441`).
  - `DashboardRepository.js:192-216` (hoy/mes), `:223-253` (mejor ponedora), `:260-283` (hora pico), `:291-327` (producción semana), `:335-351` (promedio `ROUND(COUNT(*)/7.0, 2)` de los últimos 7 días); los consume `InicioScreen.js:525,538,603`.
  - `ReportesRepository.js:66-94` (hoy/mes con `COALESCE(SUM(...),0)` y mejor ponedora) y una consulta más sobre `huevos h` en `:257`; los consume `ReportesScreen.js:226-229`.
  - `CicloVidaRepository.sqlite.js:116-132` (huevos por día: `date(h.fecha) AS fecha_dia`, `MIN(h.fecha)`, `COUNT(*)`, `GROUP_CONCAT(h.codigo, ', ')`) y `:536-559` (evento `POSTURA_HUEVO` "Huevo registrado" / "N huevos registrados", `Códigos: ...`). `CicloVidaRepository.sqlite.js:207-221` **excluye** del historial los eventos `POSTURA_HUEVO` (se reconstruyen desde `huevos`). `CicloVidaRepository.api.js:6` y `CicloVidaRepository.js:7` ya anotan que el ciclo de vida depende de huevos.
- Estado de V1 en modo API hoy (hallazgo): `HuevoRepository.js` y `ProduccionRepository.js` **no tienen fachada**: en modo API siguen yendo a SQLite local. `registrarHuevo` con un `aveId` UUID de la nube falla por FK (el ave no existe en el SQLite local) y la pantalla muestra el Alert de error (`RegistrarHuevoScreen.js:166-179`); `obtenerHuevosAve` devuelve `[]` sin error (`DetalleAveScreen.js:741`); las pantallas de producción leen el SQLite local. Este módulo lo corrige.

## Contrato del repositorio

Fachada propuesta (como Salud y Cuidados): `HuevoRepository.js` y `ProduccionRepository.js` pasan a elegir entre `*.sqlite.js` (código V1 intacto) y `*.api.js`, con la misma bandera `EXPO_PUBLIC_DATA_SOURCE=api`. Los `.api.js` exportan las mismas funciones (ver DUDA PARA EL USUARIO 1 sobre las que no tienen llamadores).

### Resumen de periodos y zona horaria (aplica a todas las funciones de producción)

- **Todo se calcula en UTC, no en hora local.** Ninguna consulta usa `'localtime'` (búsqueda de `localtime` y `timezone` en `src/`: sin resultados). `date('now')` y `strftime(..., 'now')` de SQLite son UTC.
- La `fecha` que se guarda es **siempre** `new Date().toISOString()` (`RegistrarHuevoScreen.js:128-130`), es decir `YYYY-MM-DDTHH:mm:ss.sssZ` en UTC. `date(fecha)`, `strftime('%Y-%m', fecha)`, `strftime('%w', fecha)` y `strftime('%H', fecha)` de SQLite interpretan el sufijo `Z` y trabajan en UTC (comportamiento documentado de SQLite; no se ejecutó aquí). Consecuencia visible: un huevo puesto a las 20:00 en Ecuador (UTC-5) queda registrado a las 01:00 UTC **del día siguiente**, y cuenta para "hoy" de mañana, para el día de la semana siguiente y para la hora `01` en el horario de postura. Se replica tal cual (ver DUDA PARA EL USUARIO 4, solo informativa).
- **Hoy**: `date(fecha) = date('now')` (día UTC actual).
- **Mes**: `strftime('%Y-%m', fecha) = strftime('%Y-%m','now')` (mes UTC actual). Sin límite superior: incluye fechas futuras del mismo mes.
- **Semana**: `fecha >= date('now','-6 day')`. Es una **comparación de cadenas** entre `YYYY-MM-DDTHH:mm:ss.sssZ` y `YYYY-MM-DD`: una cadena más larga con el mismo prefijo es mayor, así que incluye todo el día de hace 6 días desde las 00:00 UTC. Ventana = 7 días UTC (hoy y los 6 anteriores) **sin límite superior** (las fechas futuras entran). No es "semana calendario".
- **Dependen del reloj**: `obtenerResumenProduccion` (hoy, semana, mes), `ProduccionRepository.obtenerProduccionPorDia` (ventana de 7 días) y `HuevoRepository.obtenerProduccionHuevos` (hoy, mes); y `registrarHuevo` cuando no llega `fecha` (`HuevoRepository.js:55-57`). **No dependen del reloj**: `obtenerHuevosAve`, `obtenerTopPonedoras`, `obtenerRankingPonedoras`, `HuevoRepository.obtenerProduccionPorDia`, `obtenerProduccionPorHora`, ambas `obtenerProduccionPorJaula`, `obtenerProduccionPorAve`, `generarCodigoHuevo`.
- Los agregados no filtran por estado del ave ni de la jaula: incluyen aves `VENDIDA`/`FALLECIDA` y jaulas dadas de baja (solo `INNER JOIN` por id).
- Ningún agregado tiene desempate en el `ORDER BY`: con la misma `cantidad` el orden no está definido por V1 (ver Dudas técnicas 2).

### `generarCodigoHuevo()` (`HuevoRepository.js:7-33`)

- Firma: sin parámetros. Devuelve `string`.
- SQL literal: `SELECT COUNT(*) AS total FROM huevos` (`:15-19`), sin `WHERE`. Cálculo: `numero = Number(resultado?.total || 0) + 1` (`:23-24`); resultado `'H' + String(numero).padStart(6, '0')` (`:27-31`).
- **Formato exacto**: letra `H` mayúscula + número de **al menos 6 dígitos** con ceros a la izquierda: `H000001`, `H000002`, … `H000999`, `H999999`; a partir de 1.000.000 `padStart` no recorta y el código tiene 7 dígitos (`H1000000`). No lleva fecha, ave ni jaula.
- **Depende de un contador global**: el número total de filas de `huevos` (de **todas** las aves y jaulas) más uno. No usa `MAX(id)`, ni `id`, ni fecha ni reloj. Como no existe borrado de huevos en V1, es consecutivo sin huecos.
- No se ejecuta dentro de la transacción de `registrarHuevo` (se llama en `:51`, antes de `withTransactionAsync` en `:61`) ni bloquea; en V1 no hay concurrencia (un solo dispositivo y usuario). Si la transacción falla, el código no se "consume" (se recalcula en el siguiente intento).
- Sin errores propios; un error de base de datos se propaga.

### `registrarHuevo({ aveId, jaulaId, fecha, observacion })` (`HuevoRepository.js:38-120`)

Devuelve el `codigo` (`string`, p. ej. `'H000001'`) (`:118`). Orden exacto:

1. `codigo = await generarCodigoHuevo()` (`:51-52`), fuera de la transacción.
2. `fechaRegistro = fecha || new Date().toISOString()` (`:55-57`; `''`, `null` y `undefined` caen al reloj).
3. `db.withTransactionAsync` (`:61`), con dos escrituras en este orden:
   1. `INSERT INTO huevos (codigo, ave_id, jaula_id, fecha, estado, observacion) VALUES (?,?,?,?,?,?)` con `[codigo, aveId, jaulaId || null, fechaRegistro, 'REGISTRADO', observacion || null]` (`:66-87`).
   2. `INSERT INTO ave_historial (ave_id, jaula_id, tipo_evento, fecha, detalle) VALUES (?,?,?,?,?)` con `[aveId, jaulaId || null, 'POSTURA_HUEVO', fechaRegistro, `Registró huevo ${codigo}`]` (`:91-110`). `detalle` literal: `Registró huevo ` (con tilde) + código. Aquí `jaula_id` **sí** se guarda (a diferencia de Salud, que lo deja `NULL`).
4. Devuelve `codigo`.

- Nulos: `jaulaId || null`, `observacion || null` (cadena vacía → `NULL`); `aveId`, `fecha` y `codigo` tal cual. `estado` siempre `'REGISTRADO'` (único valor que V1 escribe).
- Transacción: ambas filas son atómicas; si falla cualquiera, no queda ninguna y la excepción se propaga (la pantalla la captura).
- **Ave inexistente**: `huevos.ave_id REFERENCES aves(id)` (`migrations.js:235-236`) con `foreign_keys = ON` (`sqlite.js:63`): el primer `INSERT` falla con `FOREIGN KEY constraint failed` y no queda nada. Sin error de dominio. **Jaula inexistente** (`jaulaId` distinto de null): falla igual (`migrations.js:238-239`; también el FK de `ave_historial.jaula_id`, `:152-153`).
- **Ave no `ACTIVA`** (vendida, fallecida…): el repositorio **no lo comprueba** (no hay `SELECT`); escribe igual. Solo la UI lo evita: el botón "Registrar huevo" aparece únicamente con `ave.estado === 'ACTIVA'` (`DetalleAveScreen.js:927-959`).
- Cómo lo consume `RegistrarHuevoScreen.guardar` (`:107-191`): `setGuardando(true)`; llama con `aveId` (de `route.params`, `:43-45`), `jaulaId: ave?.jaula_actual_id` (`:125-126`; `ave` viene de `obtenerAvePorId`, `:86-101`; si `ave` es `null` va `undefined` → `NULL`), `fecha: new Date().toISOString()` (`:128-130`), `observacion: observacion.trim()` (`:132-133`). Éxito: `Alert.alert('Huevo registrado', `Se generó el código ${codigo}`, [{ text: 'Aceptar', onPress: () => navigation.goBack() }])` (`:141-162`). Error: `console.error('Error registrando huevo:', error)` y `Alert.alert('Error', 'No fue posible registrar el huevo.')` (`:166-179`). El botón usa `disabled={guardando}` (`:299`) y muestra `'Guardando...'` / `'🥚 Registrar huevo'` (`:311-317`). Sin validación previa.
- Efecto en otras tablas: ninguno sobre `aves` (no cambia `estado_salud` ni `fecha_actualizacion`).

### `obtenerHuevosAve(aveId)` (`HuevoRepository.js:125-160`)

```sql
SELECT h.id, h.codigo, h.fecha, h.estado, h.observacion, j.codigo AS jaula_codigo
FROM huevos h
LEFT JOIN jaulas j ON j.id = h.jaula_id
WHERE h.ave_id = ?
ORDER BY h.fecha DESC, h.id DESC
```

- Devuelve arreglo de `{ id, codigo, fecha, estado, observacion, jaula_codigo }` (`id` entero en V1; V2 texto UUID; `observacion` y `jaula_codigo` `null` si no hay). Sin `LIMIT`. Ave inexistente o sin huevos → `[]`, sin error.
- Desempate: `h.id DESC` = orden inverso de inserción en V1 (autoincremento).
- Consumo (`DetalleAveScreen.js:118-126, 708-791`): contador `huevos.length` (`:723`); vacío → `'No existen huevos registrados.'` (`:741`); por fila `item.codigo` y `new Date(item.fecha).toLocaleDateString()` (`:771-784`), `key = item.id`. `estado`, `observacion` y `jaula_codigo` se leen pero **no se muestran**.

### `ProduccionRepository.obtenerResumenProduccion()` (`:9-88`)

```sql
SELECT
  COUNT(CASE WHEN date(fecha)=date('now') THEN 1 END) AS hoy,
  COUNT(CASE WHEN fecha >= date('now','-6 day') THEN 1 END) AS semana,
  COUNT(CASE WHEN strftime('%Y-%m',fecha)=strftime('%Y-%m','now') THEN 1 END) AS mes
FROM huevos
```

Devuelve `{ hoy: number, semana: number, mes: number }` con `Number(resultado?.x || 0)` (`:67-86`). Tabla vacía: `{ hoy: 0, semana: 0, mes: 0 }`. Consumo: `resumen?.hoy || 0`, `?.semana`, `?.mes` (`ProduccionHuevosScreen.js:311, 327, 343`).

### `ProduccionRepository.obtenerRankingPonedoras()` (`:96-149`)

```sql
SELECT a.id, a.codigo, a.raza, COUNT(h.id) AS cantidad
FROM huevos h INNER JOIN aves a ON a.id = h.ave_id
GROUP BY a.id, a.codigo, a.raza
ORDER BY cantidad DESC
LIMIT 10
```

Devuelve `[{ id, codigo, raza, cantidad }]` (`cantidad` entero, `raza` puede ser `null`). Máximo 10. Vacío → `[]`. Consumo: `RankingCard` con `key = item.id`, `posicion = index + 1`, `codigo`, `cantidad` (`ProduccionHuevosScreen.js:399-432`). `HuevoRepository.obtenerTopPonedoras` (`:204-236`) tiene **el mismo SQL** (sin llamadores).

### `ProduccionRepository.obtenerProduccionPorDia()` (`:157-221`)

```sql
SELECT CASE strftime('%w',fecha)
         WHEN '0' THEN 'Domingo' WHEN '1' THEN 'Lunes' WHEN '2' THEN 'Martes'
         WHEN '3' THEN 'Miércoles' WHEN '4' THEN 'Jueves' WHEN '5' THEN 'Viernes'
         WHEN '6' THEN 'Sábado' END AS dia,
       COUNT(*) AS cantidad
FROM huevos
WHERE fecha >= date('now','-6 day')
GROUP BY strftime('%w',fecha)
ORDER BY strftime('%w',fecha)
```

Devuelve `[{ dia: string, cantidad: number }]`, solo los días de la semana con huevos en la ventana de 7 días UTC, **ordenados de Domingo a Sábado** (por número de día, no cronológico). Vacío → `[]`. Consumo: `ProduccionBarChart` (`key = item.dia`, barra relativa al máximo, `{cantidad} huevos`) (`ProduccionHuevosScreen.js:369`; `ProduccionBarChart.js:25-37, 100-121`). `dia` lleva tildes (`Miércoles`, `Sábado`).

### `HuevoRepository.obtenerProduccionPorDia()` (`:241-273`) — sin llamadores

Mismo `CASE` de nombres y `COUNT(*) AS cantidad`, pero **sin `WHERE`** (todo el histórico) y `GROUP BY strftime('%w', fecha) ORDER BY cantidad DESC`. Devuelve `[{ dia, cantidad }]`.

### `HuevoRepository.obtenerProduccionPorHora()` (`:278-302`)

```sql
SELECT strftime('%H', fecha) AS hora, COUNT(*) AS cantidad
FROM huevos GROUP BY strftime('%H', fecha) ORDER BY cantidad DESC
```

Devuelve `[{ hora: string '00'..'23' (UTC), cantidad: number }]`, histórico completo, sin `LIMIT`, orden por `cantidad` descendente (no por hora). Vacío → `[]`. Consumo: `ProduccionHuevosScreen.js:455-490` (`key = item.hora`, texto `{hora}:00 - {cantidad} huevos`). `hora` es **texto** de dos dígitos.

### `ProduccionRepository.obtenerProduccionPorJaula()` (`:229-276`)

```sql
SELECT j.id, j.codigo, COUNT(h.id) AS cantidad
FROM huevos h INNER JOIN jaulas j ON j.id = h.jaula_id
GROUP BY j.id, j.codigo
ORDER BY cantidad DESC
```

Devuelve `[{ id, codigo, cantidad }]`, sin `LIMIT`. Los huevos con `jaula_id NULL` no cuentan (inner join). Vacío → `[]`. Consumo: `ProduccionJaulaBarChart` (`key = item.codigo`) (`ProduccionHuevosScreen.js:513`; `ProduccionJaulaBarChart.js:25-40, 76-78`). `HuevoRepository.obtenerProduccionPorJaula` (`:307-335`) es igual pero **sin `j.id`** (`[{ codigo, cantidad }]`; sin llamadores).

### `ProduccionRepository.obtenerProduccionPorAve()` (`:284-333`) — sin llamadores

```sql
SELECT a.id, a.codigo, COUNT(h.id) AS cantidad
FROM huevos h INNER JOIN aves a ON a.id = h.ave_id
GROUP BY a.id, a.codigo ORDER BY cantidad DESC LIMIT 20
```

Devuelve `[{ id, codigo, cantidad }]`, máximo 20.

### `HuevoRepository.obtenerProduccionHuevos()` (`:165-199`) — sin llamadores

```sql
SELECT COUNT(*) AS total,
  SUM(CASE WHEN date(fecha)=date('now') THEN 1 ELSE 0 END) AS hoy,
  SUM(CASE WHEN strftime('%Y-%m', fecha)=strftime('%Y-%m','now') THEN 1 ELSE 0 END) AS mes
FROM huevos
```

Devuelve **una fila** `{ total, hoy, mes }` sin `Number(...)`. **Tabla vacía: `{ total: 0, hoy: null, mes: null }`** (`SUM` de cero filas es `NULL`; a diferencia de `obtenerResumenProduccion`, que devuelve `0`). En V2 el cliente debe devolver `null` en ese caso, igual que V1.

### Cómo consume `ProduccionHuevosScreen` el conjunto

`cargar` (`:118-209`): `setLoading(true)`, `Promise.all([obtenerResumenProduccion(), obtenerRankingPonedoras(), obtenerProduccionPorDia(), obtenerProduccionPorHora(), obtenerProduccionPorJaula()])` (`:142-160`), guarda cada resultado en estado (`:164-190`). `catch`: solo `console.error('Error cargando producción:', error)` (`:194-200`), **sin Alert**; `finally`: `setLoading(false)`. Se recarga en cada foco (`:216-224`). Spinner mientras `loading` (`:232-255`). Si falla, quedan `resumen = null` y listas `[]`: la pantalla muestra ceros y listas vacías como si no hubiera producción (ver DUDA PARA EL USUARIO 2).

## Endpoints V2

Bajo `/api/v1/criaderos/:criaderoId/...`; ownership por criadero como el resto (401 `UNAUTHORIZED`, 403 `FORBIDDEN`, 404 `CRIADERO_NOT_FOUND`). Respuestas `{ success: true, data }`. Las rutas por ave se montan como Salud (`app.ts:87-89`: `/criaderos/:criaderoId/aves/:aveId`); el resto bajo `/huevos/produccion`. `userId` nunca en el body. Los resultados mantienen los nombres de campo de V1 (una palabra, salvo `jaulaCodigo` → `jaula_codigo` por `aSnake`).

### POST `/aves/:aveId/huevos`  (equivale a `registrarHuevo`)

- Request: `{ jaulaId?, fecha?, observacion? }` (`aveId` en la ruta). Sin validaciones nuevas: `fecha` opcional con el mismo respaldo de V1 (`fecha || new Date().toISOString()` en el servicio); `jaulaId || null`; `observacion || null`.
- Efectos en **un solo `db.batch`** (equivale a `withTransactionAsync`), en el mismo orden que V1. Los UUID v7 los genera el servidor antes del batch:
  1. `INSERT INTO huevos` con el código generado **en la misma sentencia** (ver "Código por criadero" abajo), `estado = 'REGISTRADO'`.
  2. `INSERT INTO ave_historial` (`tipo_evento = 'POSTURA_HUEVO'`, `jaula_id` = el mismo `jaulaId || null`, `fecha` = misma `fechaRegistro`, `detalle = 'Registró huevo ' || codigo`), tomando `codigo`, `fecha`, `jaula_id` y `criadero_id` de la fila recién insertada.
  3. `SELECT codigo FROM huevos WHERE id = ?` (el resultado de esta sentencia del batch es el código devuelto).
- Respuesta 201 `{ success: true, data: { id, codigo } }`. El cliente `registrarHuevo` devuelve el string `data.codigo` (como V1 devuelve `codigo`).
- Errores (diferencias técnicas respecto de las FK de SQLite): ave inexistente en el criadero → `404 AVE_NO_ENCONTRADA`; `jaulaId` truthy que no existe en el criadero → `404 JAULA_NO_ENCONTRADA` (mismo código y mensaje `FOREIGN KEY constraint failed` que ya usa Aves, `aves.service.ts:40-43`; Cuidados usa el mismo patrón). Se comprueban antes del batch (como `existeAve` en Salud, `salud.repository.ts:17-24`) para que una FK no dé 500 y para no enlazar con otro criadero. **No** se rechaza por estado del ave (V1 no lo hacía). Cuerpo no JSON → `400 VALIDATION_ERROR` (igual que Salud) y tipos del cuerpo solo para el binding a D1.

#### Código por criadero y sin colisión dentro del batch

V1: `'H' + padStart(COUNT(*) global + 1, 6)`. V2: el mismo cálculo pero **por criadero** (`COUNT` filtrado por `criadero_id`), resuelto en el `INSERT` para no depender de una lectura previa:

```sql
INSERT INTO huevos (id, criadero_id, codigo, ave_id, jaula_id, fecha, estado, observacion)
SELECT :id, :criaderoId,
       'H' || printf('%06d', COUNT(*) + 1),
       :aveId, :jaulaId, :fecha, 'REGISTRADO', :observacion
FROM huevos
WHERE criadero_id = :criaderoId;
```

- Un `SELECT` con `COUNT(*)` y sin `GROUP BY` devuelve siempre una fila (también con 0 huevos), así que el primer huevo de cada criadero es `H000001`. `printf('%06d')` iguala a `padStart(6,'0')`: rellena a 6 y a partir de 1.000.000 imprime todos los dígitos (7), igual que V1.
- Dentro de un `db.batch` las sentencias se ejecutan en orden y en una misma transacción de D1; la segunda sentencia (historial) lee el `codigo` de la fila ya insertada por la primera, así el código del historial y el del huevo son el mismo sin calcularlo dos veces en JS. Dos batch simultáneos del mismo criadero no pueden ver el mismo `COUNT` si D1 los serializa (una sola escritura a la vez por base; comportamiento de D1, a confirmar: Dudas técnicas 3).
- Red de seguridad: `UNIQUE (criadero_id, codigo)`. Si por cualquier motivo hubiera colisión, el batch entero se revierte y el servidor responde 500 `INTERNAL_ERROR` (V1 no tenía reintento; no se añade uno).
- `generarCodigoHuevo` (sin llamadores, ver DUDA PARA EL USUARIO 1): si se implementa, `GET /huevos/siguiente-codigo` → `{ codigo }` con `SELECT 'H' || printf('%06d', COUNT(*) + 1) AS codigo FROM huevos WHERE criadero_id = ?`. Solo informativo (no reserva el código, igual que V1).

### GET `/aves/:aveId/huevos`  (equivale a `obtenerHuevosAve`)

- Respuesta 200 `{ success: true, data: { huevos: [{ id, codigo, fecha, estado, observacion, jaulaCodigo }] } }`. El cliente devuelve el arreglo mapeado con `aSnake` (`jaula_codigo`).
- SQL: el de V1 con `AND h.criadero_id = ?`, `LEFT JOIN jaulas j ON j.id = h.jaula_id` y `ORDER BY h.fecha DESC, h.rowid DESC` (el `rowid` implícito de la tabla es el orden de inserción y reproduce el `h.id DESC` de V1; con un `id` UUID v7 el desempate por `id` solo sería equivalente si el generador es monótono dentro del mismo milisegundo).
- Ave inexistente → `200` con `huevos: []` (V1 no comprueba; no se añade 404). Sin paginación.

### Producción (`/huevos/produccion/...`, todos GET, siempre filtrados por `criadero_id`)

| Endpoint | Equivale a | `data` |
|---|---|---|
| `/huevos/produccion/resumen` | `ProduccionRepository.obtenerResumenProduccion` | `{ hoy, semana, mes }` (enteros; servidor aplica `Number(x \|\| 0)`) |
| `/huevos/produccion/ranking` | `obtenerRankingPonedoras` y también `HuevoRepository.obtenerTopPonedoras` (mismo SQL) | `{ ranking: [{ id, codigo, raza, cantidad }] }` (máx. 10) |
| `/huevos/produccion/por-dia` | `ProduccionRepository.obtenerProduccionPorDia` | `{ dias: [{ dia, cantidad }] }` (ventana 7 días, orden Domingo a Sábado) |
| `/huevos/produccion/por-dia-historico` | `HuevoRepository.obtenerProduccionPorDia` | `{ dias: [{ dia, cantidad }] }` (sin ventana, por `cantidad DESC`) |
| `/huevos/produccion/por-hora` | `HuevoRepository.obtenerProduccionPorHora` | `{ horas: [{ hora: "07", cantidad }] }` |
| `/huevos/produccion/por-jaula` | `ProduccionRepository.obtenerProduccionPorJaula`; `HuevoRepository.obtenerProduccionPorJaula` = misma respuesta sin la clave `id` | `{ jaulas: [{ id, codigo, cantidad }] }` |
| `/huevos/produccion/por-ave` | `obtenerProduccionPorAve` | `{ aves: [{ id, codigo, cantidad }] }` (máx. 20) |
| `/huevos/produccion/total` | `HuevoRepository.obtenerProduccionHuevos` | `{ total, hoy, mes }` con `hoy`/`mes` `null` si no hay huevos (como V1) |

- SQL: el literal de V1 de cada función con `WHERE h.criadero_id = :criaderoId` (o `WHERE criadero_id = ...` en `FROM huevos`) y, en los `INNER JOIN`, sin filtrar por estado ni `deleted_at` de ave/jaula (V1 no filtraba). Se mantienen `date(fecha)`, `strftime`, comparaciones de cadenas y `LIMIT` exactamente como V1 (UTC; mismo motor SQLite en D1).
- `hora` se devuelve como texto de dos dígitos y `dia` con las tildes de V1 (`Miércoles`, `Sábado`). Tablas vacías: `[]` (excepto el caso de `total`).
- Desempates: sin cambios en V1; ver Dudas técnicas 2 (propuesta de orden estable que no cambia el resultado cuando no hay empates).

### Cómo hacer deterministas los cálculos con reloj (propuesta, sin cambiar el comportamiento por defecto)

1. **Reloj inyectable en el servicio** (`factory` recibe `ahora: () => Date`, por defecto `() => new Date()`), igual que se inyectan los fakes. El repositorio D1 no usa `'now'`: recibe un parámetro `:ahora` calculado por el servicio y escribe `date(:ahora)`, `date(:ahora,'-6 day')`, `strftime('%Y-%m', :ahora)`, con `:ahora = ahora().toISOString()`. `date('2026-11-03T10:00:00.000Z')` es UTC igual que `date('now')`, de modo que el resultado en producción es idéntico y las pruebas unitarias/HTTP/de integración fijan el instante sin tocar la API pública.
2. **Pruebas contra el Worker real (`/probar datos`)**: sin parámetro público de reloj. Como `fecha` la envía el cliente al registrar, las pruebas crean huevos con fechas relativas al día UTC actual (p. ej. hoy, hace 3 días, hace 7 días, mes anterior) y comparan con ese día; solo es frágil en los segundos cercanos a las 00:00 UTC (se puede evitar saltando la comprobación en esa franja).
3. Alternativa **no recomendada**: un query `?ahora=` solo para tests; añadiría un parámetro público que V1 no tiene (ver DUDA PARA EL USUARIO 3).

## Tabla D1

Migración `0009_huevos.sql` (implementada y aplicada; no se edita). Replica `migrations.js:218-240` con las diferencias técnicas del paso a online; convención de `0006`: `fecha_creacion` como en V1, sin `created_at`/`updated_at`/`deleted_at`/`version`/CHECK.

| Columna | Tipo | Regla | Origen V1 |
|---|---|---|---|
| id | TEXT PRIMARY KEY NOT NULL | UUID v7 (lo genera el servidor) | `id` INTEGER AUTOINCREMENT |
| criadero_id | TEXT NOT NULL | FK criaderos(id) RESTRICT | nuevo |
| codigo | TEXT NOT NULL | `H` + 6 dígitos; **UNIQUE (criadero_id, codigo)** | `codigo TEXT NOT NULL UNIQUE` (global) |
| ave_id | TEXT NOT NULL | FK aves(id) ON DELETE RESTRICT ON UPDATE RESTRICT | `ave_id` |
| jaula_id | TEXT | nullable; FK jaulas(id) ON DELETE RESTRICT ON UPDATE RESTRICT | `jaula_id` |
| fecha | TEXT NOT NULL | ISO UTC enviada por la app | `fecha` |
| estado | TEXT NOT NULL DEFAULT 'REGISTRADO' | sin CHECK | `estado` |
| observacion | TEXT | nullable | `observacion` |
| fecha_creacion | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | | `fecha_creacion` |

Índices reales de `0009`: `CREATE UNIQUE INDEX ux_huevos_criadero_codigo ON huevos(criadero_id, codigo)` (respalda el `COUNT(*)` por criadero); `ix_huevos_ave_fecha ON huevos(ave_id, fecha)` (sustituye a `idx_huevos_ave` de V1, `migrations.js:358-359`, y cubre la FK a aves); `ix_huevos_criadero_fecha ON huevos(criadero_id, fecha)` (agregados de producción); `ix_huevos_jaula ON huevos(jaula_id)` (producción por jaula y FK a jaulas). Los tres últimos son solo de rendimiento y no cambian resultados. `ave_historial` (`0006`) no cambia: el tipo `POSTURA_HUEVO` no requiere columnas nuevas.

## Excepciones técnicas por pasar a online

- **IDs TEXT UUID v7** en `huevos.id` y `ave_historial.id`. `registrarHuevo` ya no puede apoyarse en `lastInsertRowId`; el servidor devuelve `{ id, codigo }` y el cliente devuelve solo `codigo`. Las listas devuelven `id` texto (la pantalla solo lo usa como `key`).
- **`criadero_id`** en la tabla, en todas las escrituras y consultas; el contador del código pasa de global a **por criadero** (`UNIQUE (criadero_id, codigo)`). Cada criadero nuevo parte de `H000001` (V2 empieza sin datos).
- **FK `RESTRICT`** en lugar de las FK sin acción de V1 (equivalente: V1 no tiene `ON DELETE` en `huevos`; no hay hard delete de aves).
- **Transacción → `db.batch`** con el código generado en el propio `INSERT` (`COUNT` por criadero) y `ave_historial` leído de la fila insertada.
- **Ave o jaula inexistente → `404 AVE_NO_ENCONTRADA` / `404 JAULA_NO_ENCONTRADA`** (V1: error de FK de SQLite; la pantalla solo muestra `'No fue posible registrar el huevo.'`, `RegistrarHuevoScreen.js:175-178`). Comprobación previa para no lanzar 500 y para impedir enlazar con otro criadero.
- **Desempate por `rowid`** en `obtenerHuevosAve` para reproducir `h.id DESC` (el `id` deja de ser autoincremental).
- **Errores de red y autenticación** (401, 403, `CRIADERO_NOT_FOUND`, caída de red): los propaga el cliente REST (`ApiError`, `traducirErrorAve`).
- **Reloj inyectable** (solo en el servidor, para pruebas); el comportamiento por defecto no cambia. El SQL de V2 usa el instante que inyecta el servicio en lugar de `'now'`; el resultado en producción es el mismo (UTC).
- **`400 VALIDATION_ERROR` por tipos del cuerpo** de `POST /aves/:aveId/huevos` (cuerpo no JSON o campos con tipo incorrecto): solo para poder enlazar a D1 sin error 500; V1 no validaba. Lo pidió el revisor que se anotara aquí.
- **`UNIQUE (criadero_id, codigo)`** en lugar de `UNIQUE` global (el contador es por criadero).
- **Desempate `rowid DESC`** después de `fecha DESC` en `obtenerHuevosAve`, para reproducir el `h.id DESC` de V1 (el `id` UUID deja de ser autoincremental).
- **Código leído con un `SELECT` posterior al batch** (no es una regla de negocio: el adaptador de pruebas no devuelve filas de `SELECT` dentro de un batch).
- Sin R2 ni imágenes en este módulo.
- **Excepción aprobada a una pantalla V1 (quinta en total): `ProduccionHuevosScreen.js`** (commit `469b742`). Solo se añadió el import de `Alert` y un `Alert.alert('Error', 'No fue posible cargar la producción de huevos.')` en el `catch` de `cargar` (antes solo `console.error`; con la red caída mostraba ceros y listas vacías, HUE-25). Nada más cambió en la pantalla.

## Casos de paridad

| id | dado | cuando | entonces | evidencia V1 |
|---|---|---|---|---|
| HUE-01 | Criadero sin huevos, ave ACTIVA con jaula J1 | `registrarHuevo({ aveId, jaulaId: J1, fecha, observacion: 'normal' })` | devuelve `'H000001'`; 1 fila `huevos` (`estado 'REGISTRADO'`, `jaula_id` J1, `observacion 'normal'`) y 1 fila `ave_historial` `POSTURA_HUEVO` con `jaula_id` J1, misma `fecha`, `detalle 'Registró huevo H000001'` | `HuevoRepository.js:51-118` |
| HUE-02 | 3 huevos ya registrados (de cualquier ave del criadero) | `registrarHuevo` | código `'H000004'` (contador del criadero, no por ave) | `:15-31` |
| HUE-03 | Un criadero con 5 huevos y otro vacío | `registrarHuevo` en el vacío | `'H000001'` en el segundo (diferencia técnica: V1 es global en un solo dispositivo) | `:15-31`; `migrations.js:221` |
| HUE-04 | Contador en 999999 | siguiente código | `'H1000000'` (7 dígitos; sin recorte) | `:27-31` |
| HUE-05 | `observacion ''`, `jaulaId undefined`/`null`/`''` | `registrarHuevo` | `observacion NULL`, `jaula_id NULL` en `huevos` **y** en `ave_historial` | `:82,85,105` |
| HUE-06 | `fecha` ausente o `''` | `registrarHuevo` | usa la hora actual ISO | `:55-57` |
| HUE-07 | Ave `VENDIDA` o `FALLECIDA` (llamada directa a la API) | `registrarHuevo` | se escribe igual; la UI no ofrece el botón | `:38-120`; `DetalleAveScreen.js:927-959` |
| HUE-08 | `aveId` inexistente | `registrarHuevo` | V1: `FOREIGN KEY constraint failed`, nada escrito; V2: `404 AVE_NO_ENCONTRADA`, nada escrito (excepción técnica); la pantalla muestra `Error` / `No fue posible registrar el huevo.` | `migrations.js:235-236`; `RegistrarHuevoScreen.js:175-178` |
| HUE-09 | `jaulaId` inexistente o de otro criadero | `registrarHuevo` | V1: FK falla; V2: `404 JAULA_NO_ENCONTRADA`; nada escrito | `migrations.js:238-239` |
| HUE-10 | Falla la segunda escritura | `registrarHuevo` | no queda ninguna fila (batch atómico) | `:61` |
| HUE-11 | Dos registros seguidos del mismo criadero | `registrarHuevo` x2 | códigos consecutivos distintos; el `detalle` de cada historial lleva su propio código | `:15-31,108` |
| HUE-12 | Ave con 3 huevos en fechas distintas y 2 con la misma fecha | `obtenerHuevosAve` | `[{ id, codigo, fecha, estado, observacion, jaula_codigo }]` por `fecha` descendente; empate: el insertado después primero; `jaula_codigo` `null` sin jaula | `:133-158` |
| HUE-13 | Ave sin huevos o inexistente | `obtenerHuevosAve` | `[]`, sin error | `:133-158` |
| HUE-14 | Tabla vacía | `obtenerResumenProduccion` | `{ hoy: 0, semana: 0, mes: 0 }` | `ProduccionRepository.js:67-86` |
| HUE-15 | Huevos con fecha de hoy, hace 6 días, hace 7 días y mes anterior (UTC) | `obtenerResumenProduccion` | `hoy` solo el de hoy; `semana` cuenta hoy y hace 6 días (no el de hace 7); `mes` solo los del mes UTC actual | `:25,37,49-51` |
| HUE-16 | Huevo con fecha `...T01:00:00.000Z` | `obtenerResumenProduccion` | cuenta para el día UTC `...`, aunque en hora local sea el día anterior | `:25`; `RegistrarHuevoScreen.js:128-130` |
| HUE-17 | Huevo con fecha futura (mismo mes) | `obtenerResumenProduccion` | entra en `semana` y `mes` (sin límite superior) | `:37,49` |
| HUE-18 | 12 aves con huevos | `obtenerRankingPonedoras` | solo 10 filas `{ id, codigo, raza, cantidad }`, `cantidad` descendente; `raza` puede ser `null` | `:104-145` |
| HUE-19 | Ave vendida con huevos | `obtenerRankingPonedoras` / `obtenerProduccionPorAve` | aparece (sin filtro de estado); `por-ave` máximo 20 | `:122-124, 308-310` |
| HUE-20 | Huevos de 3 días de la semana en la ventana | `obtenerProduccionPorDia` | solo esos 3 días, en orden Domingo a Sábado, nombres con tilde; huevos de hace más de 6 días no cuentan | `:169-216` |
| HUE-21 | Huevos a las 07, 07 y 14 UTC | `obtenerProduccionPorHora` | `[{ hora: '07', cantidad: 2 }, { hora: '14', cantidad: 1 }]` (orden por cantidad) | `HuevoRepository.js:288-298` |
| HUE-22 | Huevos con y sin jaula | `obtenerProduccionPorJaula` | solo los que tienen jaula; `[{ id, codigo, cantidad }]` por `cantidad` descendente; incluye jaulas dadas de baja | `ProduccionRepository.js:241-271` |
| HUE-23 | Sin huevos | `obtenerProduccionHuevos` | `{ total: 0, hoy: null, mes: null }` (no 0) | `HuevoRepository.js:175-193` |
| HUE-24 | Sin huevos | ranking, por día, por hora, por jaula, por ave | `[]` en todos | repositorios (`getAllAsync`) |
| HUE-25 | Fallo de red al abrir producción | `cargar` | solo `console.error`; spinner se apaga; la pantalla queda con ceros y listas vacías (V1 no mostraba Alert) | `ProduccionHuevosScreen.js:194-206` |
| HUE-26 | Registro correcto | `guardar` | Alert `Huevo registrado` / `Se generó el código H000001`; "Aceptar" vuelve atrás | `RegistrarHuevoScreen.js:141-162` |
| HUE-27 | Doble toque en "Registrar huevo" | `guardar` | el botón queda `disabled` mientras `guardando`; sin duplicado | `RegistrarHuevoScreen.js:299` |

## Dudas técnicas

1. Seis funciones de V1 no tienen ningún llamador (`generarCodigoHuevo`, `HuevoRepository.obtenerProduccionHuevos`, `obtenerTopPonedoras`, `obtenerProduccionPorDia`, `obtenerProduccionPorJaula`, `ProduccionRepository.obtenerProduccionPorAve`; búsqueda sin límite arriba). Se documentan completas. Propuesta: implementarlas en el `.api.js` para conservar la interfaz (cuestan un endpoint cada una; tres reutilizan SQL de otro), o bien omitirlas como se hizo con `actualizarEstadoSaludAve`. Ver DUDA PARA EL USUARIO 1.
2. Orden de empates en `ranking`, `por-hora`, `por-jaula`, `por-ave` y `por-dia-historico`: V1 solo ordena por `cantidad DESC`. SQLite suele devolver los empates en el orden del `GROUP BY` (clave de agrupación), pero V1 no lo garantiza y no se probó. Propuesta que no altera resultados sin empate: añadir un segundo criterio estable (`a.id`/`j.id`/`hora` ascendentes). Es un detalle de determinismo para las pruebas, no un comportamiento nuevo; a confirmar.
3. Atomicidad del contador por criadero bajo concurrencia real: se apoya en que D1 ejecuta cada `batch` como transacción y serializa las escrituras de una base. La prueba de integración local (`LocalD1Adapter` en memoria) puede verificar la secuencia pero no la concurrencia.
4. `printf('%06d', ...)` en D1: SQLite lo admite; se debe confirmar en la prueba de integración con el adaptador local y en el Worker de pruebas.
5. `RegistrarHuevoScreen.cargarAve` (`:86-101`) no tiene `try/catch` (llama a `obtenerAvePorId`, ya migrado con Aves). Si falla la red, la promesa rechazada queda sin manejar y el formulario aparece sin tarjeta de ave; no es del alcance del repositorio de huevos pero afecta a esta pantalla.

## Decisiones del usuario sobre pantallas y alcance (resueltas)

1. Se implementaron en la API las 6 funciones de V1 sin llamadores (Dudas técnicas 1).
2. Pantallas V1:
   - `ProduccionHuevosScreen.js`: aprobado un `Alert` de error en el `catch` de carga (quinta excepción, ver "Excepciones técnicas"; texto final `'No fue posible cargar la producción de huevos.'`).
   - `DetalleAveScreen.js` (catch de carga) y `RegistrarHuevoScreen.cargarAve`: el usuario decidió **no tocarlos**. Quedan sin aviso de error de red, como en V1 (limitación conocida: con la red caída la lista de huevos del ave aparece como "No existen huevos registrados." y la tarjeta del ave no se muestra). `RegistrarHuevoScreen.guardar` ya tenía `try/catch` con Alert y `disabled={guardando}`.
3. Reloj inyectable solo en el servidor (tests) y sin parámetro público `?ahora=`; `/probar datos` usa fechas relativas al día UTC actual.
4. Zona horaria (informativo): los periodos "hoy", "semana", "mes", "día de la semana" y "hora" son UTC, como V1; un huevo de la tarde-noche local cuenta para el día siguiente. Se replica tal cual.
