# Spec: reportes

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).

## Estado

implementado (2026-11-05)

### Lo implementado (real)

- **API** `api/src/reportes/` (routes, factory, service, repository, types): 10 `GET` bajo `/api/v1/criaderos/:criaderoId/reportes` (`aves`, `salud`, `produccion`, `finanzas` y `exportaciones/{aves,ventas,clientes,finanzas,huevos,jaulas}`). Solo lectura; reloj `ahora` inyectable; sin migración ni `db.batch`. Un criadero inexistente da 403 `FORBIDDEN` (como el resto de módulos).
- **Cliente REST** `src/repositories/ReportesRepository.{js,sqlite.js,api.js}`: el `.sqlite.js` es el V1 renombrado al 100% (sin cambios); el `.api.js` devuelve `data` (resúmenes) y `data.filas` (exportaciones) tal cual, sin `aSnake`. Ninguna pantalla modificada.
- **Corrección de desempates** (la paridad con el código REAL de V1 sobre `better-sqlite3` desmintió la propuesta inicial): top 5 de enfermedades `ORDER BY cantidad DESC, enfermedad DESC` (no ASC) y exportación de clientes `ORDER BY UltimaCompra DESC, b.celular DESC` (no ASC). Mejor ponedora `a.rowid ASC`, ventas `fecha DESC, rowid ASC`, finanzas y huevos `fecha DESC, rowid DESC` coinciden con V1, también con datos pseudoaleatorios masivos (semillas 1, 7, 42 y 2026).
- **Consultas D1** (medidas con el adaptador local; pocos datos = datos grandes: 60 jaulas, 300 aves, 2000 huevos, 2000 movimientos, 300 bajas, 100 diagnósticos): aves 2, finanzas 2, las 6 exportaciones 2, salud 3 y producción 3 llamadas (incluida la comprobación de propiedad). Tiempos locales en memoria: 1,3 a 11,8 ms. Tamaños de respuesta con datos grandes: exportaciones/huevos 252 KB, finanzas 290 KB, aves 79 KB, ventas 53 KB, clientes 12 KB, jaulas 11 KB. Prueba informativa con 20 000 huevos: exportación de huevos 2,4 MB en 189 ms (local). Riesgo de CPU/tamaño del Worker con decenas de miles de filas: sin medir en D1 real.
- **D-1**: no se crea `0012` (el índice de `diagnosticos_ave` no hace falta con estas cifras; falta medir en D1 real).
- **Pruebas**: typecheck OK; 317 unitarias/HTTP y 145 de integración (Node por defecto del entorno, 24). Paridad con el código real de V1: las 10 funciones con `toStrictEqual`, claves en orden y viaje JSON, empates, REAL difíciles, cambio de día y de mes con relojes fijos y 4 semillas; 0 diferencias tras ajustar los dos desempates. Revisión de arquitectura: APROBADO, sin hallazgos bloqueantes ni importantes.
- **`/probar datos`**: VERDE 104/104 en 255,3 s (informe `2026-11-05-155118-datos`; caso `15-reportes` con 8 pruebas y 10 rutas añadidas a `05-aislamiento`). El primer intento dio 102/104 por dos errores del propio caso (esperaba el desempate ASC de la spec y comparaba tipo number con un valor null), corregidos sin cambiar la API.
- **`/probar smoke`**: VERDE (flujo 110 s, 2,6 min; informe `2026-11-05-155945-smoke`).
- **Flujo `completo/97-reportes.yaml`**: PASO en 151 s (informe `2026-11-05-155617-completo`; la primera ejecución falló por el texto del botón del Alert en Android, «OK» y no «Aceptar»). Con datos comprueba activas, huevos de hoy y del mes, mejor ponedora e ingresos/egresos, y exporta Aves sin Alert de error. Con una segunda cuenta vacía (`# SEGUNDA-CUENTA`, como en el flujo de Clientes) comprueba ceros, «Sin datos» y el Alert «No hay información para exportar.» al exportar Ventas.
- **No verificado**: la hoja de compartir del sistema ni el contenido del CSV en el emulador (los cubren la paridad y `/probar datos`); los botones Clientes, Finanzas, Huevos y Jaulas ni la sección Salud en pantalla; modo avión y sesión caducada (teléfono); teléfono físico; el orden de empates en el SQLite de `expo-sqlite` del teléfono.
- **Pendientes y limitaciones**: `OrigenId` del CSV de finanzas sale como UUID v7 (diferencia exigida por el paso a online); `ReportesScreen.js:82-87` deja los resúmenes en cero sin aviso ante error de red (como V1; decisión del usuario: sin excepciones); Inicio y Alertas siguen en SQLite.

Lo que sigue es la spec original (contrato) con los desempates ya corregidos.

Alcance: aves individuales (sin lotes), sin sincronización offline, D1 como fuente de verdad. Decisiones del usuario (fase 6): **los reportes y las exportaciones se calculan en el SERVIDOR** replicando el SQL de V1; las filas de las exportaciones salen del servidor con las llaves EXACTAS de V1; sin validaciones nuevas; **ninguna excepción a pantallas V1** (si una pantalla necesitara un cambio, no se resuelve aquí: queda como "DUDA PARA EL USUARIO" con `archivo:línea`). Las líneas son del árbol de V1 (v1.0.3). Reportes es **solo lectura**: no hay migración de datos ni idempotencia.

## Fuente V1

- `src/repositories/ReportesRepository.js` (10 funciones públicas, todas de lectura): `obtenerReporteAves` 6-21, `obtenerReporteSalud` 24-58, `obtenerReporteProduccion` 61-96, `obtenerReporteFinanzas` 99-123, `obtenerExportacionAves` 126-159, `obtenerExportacionVentas` 162-187, `obtenerExportacionClientes` 190-214, `obtenerExportacionFinanzas` 217-240, `obtenerExportacionHuevos` 243-266, `obtenerExportacionJaulas` 269-290.
- Único llamador: `src/screens/ReportesScreen.js` (import 20-31 y `ExportService` 33-35). Carga de resúmenes con `Promise.all` 58-92; exportación 105-148; botones 163-170 y 261-285. Entrada: `Más → Reportes`.
- Servicio de CSV (único llamador `ReportesScreen.js:129`): `src/services/ExportService.js` `exportarCsv` 8-92, `obtenerColumnas` 95-109, `normalizarValor` 112-122, `escaparCsv` 125-142. **No cambia** (es de la app y no toca datos).
- Tablas que lee: `aves`, `diagnosticos_ave`, `huevos`, `movimientos_financieros`, `bajas_ave`, `jaulas`. En D1: `api/migrations/0005_jaulas.sql`, `0006_aves.sql` (aves y `diagnosticos_ave`), `0009_huevos.sql`, `0010_bajas.sql` (`bajas_ave` y `movimientos_financieros`). No hay tabla nueva.
- Patrón de módulo ya implementado que se copia: `api/src/clientes/` (routes, factory, service, repository, types; solo lectura; ownership con `D1CriaderoRepository.userOwnsCriadero`), reloj inyectable `ahora: () => Date` de `api/src/finanzas/finanzas.factory.ts:12-18` y `finanzas.service.ts:67,346-347` / `huevos.factory.ts:12-18` y `huevos.service.ts:44,128-129` (el servicio pasa `ahora.toISOString()` al repositorio y el SQL usa `date(?)`/`strftime(..., ?)` en lugar de `'now'`: `finanzas.repository.ts:77-81`, `huevos.repository.ts:128-138,243-252`). Cliente que se copia: `src/repositories/ClientesRepository.{js,sqlite.js,api.js}` (`apiFetch`, `rutaCriadero` de `src/api/huevosApi.js:15`).
- No se reutilizan servicios ni consultas de otros módulos (el SQL de Reportes difiere: `COUNT`/`SUM` sin filtros de periodo propios, `Estado` de jaulas calculado, joins por código): se duplica a propósito el SQL de V1 con `criadero_id`; solo se reutiliza `userOwnsCriadero`.

### Hallazgos

1. **Cero escrituras**: ninguna de las 10 funciones escribe (sin `INSERT|UPDATE|DELETE` en `ReportesRepository.js`).
2. **Resúmenes con agregados sin `GROUP BY`** (`obtenerReporteAves`, `Salud.estado`, `Produccion.huevos`, `Finanzas`): `getFirstAsync` siempre devuelve una fila (los `COALESCE(SUM…, 0)` dan `0` con tablas vacías). Solo `Produccion.mejor` puede ser `null` (`INNER JOIN` sin filas: `getFirstAsync` → `null`, `ReportesRepository.js:76-89`). `enfermedades` es array (`[]` si no hay diagnósticos).
3. **Tipos**: `COUNT`/`SUM(CASE … 1 ELSE 0)` → enteros. `ingresos`/`egresos` pasan por `Number(resultado?.ingresos || 0)` (`:115-116`) y `utilidad` es la resta en JS (`:117-120`), igual que `FinanzasService.resumen` (`finanzas.service.ts:70-76`). `valor` es REAL: sin redondeo en el servidor (la pantalla usa `toFixed(2)`, `ReportesScreen.js:242-248`).
4. **Periodos en UTC y por texto**: `date(fecha)=date('now')` y `strftime('%Y-%m',fecha)=strftime('%Y-%m','now')` (`:70-71`). `fecha` es el ISO UTC que escribe la app (`HuevoRepository.sqlite.js:55-57`). Un huevo registrado de noche (hora local) puede caer en el día o mes UTC siguiente: se mantiene (misma diferencia ya aceptada en Huevos y Finanzas).
5. **Sin filtro por estado** en las demás consultas: `diagnosticos_ave` cuenta todos los diagnósticos (cualquier `estado` y cualquier ave, también `VENDIDA`/`FALLECIDA`, `:44-49`); `mejor` cuenta todos los huevos de cualquier ave (`:79-88`); la exportación de aves incluye `ACTIVA`, `VENDIDA` y `FALLECIDA` (sin `WHERE`, `:148-155`); la de jaulas, activas e inactivas (`:285-286`); las exportaciones de finanzas y huevos, todas las filas. Solo `obtenerReporteSalud.estado` filtra `estado='ACTIVA'` (`:36`).
6. **Sin paginación ni límite** en las seis exportaciones (V1 devuelve todo); solo `enfermedades` tiene `LIMIT 5` y `mejor` `LIMIT 1`.
7. **`obtenerExportacionClientes` no es lo mismo que el módulo Clientes**: aquí `Nombre = MAX(NULLIF(TRIM(b.comprador), ''))` y `Ciudad = MAX(NULLIF(TRIM(b.ciudad_destino), ''))` (el valor **recortado** y el máximo por **orden de texto**, no el de la última venta), con `Compras`, `TotalAves`, `TotalEnvios` y `UltimaCompra` (`:196-211`); sin `'Sin nombre'` ni `''` por defecto: devuelve `null` (en el CSV, celda vacía) si ninguna venta tiene valor. No se reutiliza `clientes.repository.ts`; se replica este SQL tal cual.
8. **`Estado` de jaulas calculado**: `CASE WHEN j.activa = 1 THEN 'ACTIVA' ELSE 'INACTIVA' END` (`:282`). En D1 `jaulas` conserva la columna `activa INTEGER` (`0005_jaulas.sql:21`; **no** hay `deleted_at` ni `estado`), por lo que la expresión se copia sin cambios.
9. **Aves exporta códigos, no ids**: `Padre`, `Madre` y `Jaula` son `p.codigo`, `m.codigo`, `j.codigo` por `LEFT JOIN` (`:143-154`); `Ave` en ventas, finanzas y huevos es `a.codigo` (y `Jaula` en huevos `j.codigo`). Ningún id sale en las exportaciones salvo `OrigenId` de finanzas (`mf.origen_id`, `:232`): entero en V1, `TEXT` UUID v7 en D1.
10. **El CSV es función de las claves del objeto**: `exportarCsv` toma las columnas de `Object.keys` de las filas (orden de inserción, `ExportService.js:95-109`), separa con `;`, escapa `;`, `"`, `\n`, `\r` entre comillas (125-142), `null`/`undefined` → `''` y **números con coma decimal** (`String(valor).replace('.', ',')`, 117-119); antepone BOM y une con `\r\n` (49-50). Por tanto la API debe devolver las filas con (a) las claves exactas y su orden, (b) `null` real en los vacíos y (c) números JSON (no cadenas) donde V1 daba números (`PesoGramos`, `AlturaCm`, `LargoCm`, `ValorAve`, `ValorEnvio`, `Compras`, `TotalAves`, `TotalEnvios`, `Valor`). `OrigenId` es texto en V2.

## Contrato del repositorio

Fachada como Clientes/Finanzas: `src/repositories/ReportesRepository.js` pasa a elegir `ReportesRepository.sqlite.js` (el código actual de V1 **renombrado sin tocar su contenido**) o `ReportesRepository.api.js` según `src/config/dataSource.js`. La pantalla no cambia el import (`ReportesScreen.js:20-31`). Diez funciones, sin parámetros.

### Resúmenes (cuatro)

| Función (V1) | Devuelve (forma exacta) |
|---|---|
| `obtenerReporteAves()` (`:6-21`) | objeto `{ activas, vendidas, fallecidas }`, tres enteros (`0` si no hay aves) |
| `obtenerReporteSalud()` (`:24-58`) | `{ estado: { tratamiento, enfermas }, enfermedades: [ { enfermedad, cantidad } ] }`; `tratamiento`/`enfermas` enteros (`0` si vacío); `enfermedades` array de 0 a 5 elementos (`enfermedad` string, `cantidad` entero) |
| `obtenerReporteProduccion()` (`:61-96`) | `{ huevos: { hoy, mes }, mejor }`; `hoy`/`mes` enteros (`0` si vacío); `mejor` = `{ codigo, cantidad }` o **`null`** si ningún huevo tiene ave (tabla vacía) |
| `obtenerReporteFinanzas()` (`:99-123`) | `{ ingresos, egresos, utilidad }`, tres `number` (`0` si vacío; sin redondeo; `utilidad = ingresos - egresos`) |

- Consumo (`ReportesScreen.js:63-80, 188-250`): `Promise.all` de los cuatro; `data?.aves?.activas || 0`, `…salud?.estado?.tratamiento || 0`, `…enfermedades?.map(item => <Text key={item.enfermedad}>… {item.enfermedad} ({item.cantidad}))`, `data?.produccion?.huevos?.hoy || 0`, `data?.produccion?.mejor?.codigo || 'Sin datos'`, `Number(data?.finanzas?.ingresos || 0).toFixed(2)`. Todas las claves son de **una sola palabra** (sin conversión de mayúsculas).
- Errores: V1 no lanza ninguno propio.

### Exportaciones (seis): claves y orden de columnas EXACTOS

Cada una devuelve un **array de objetos** (puede ser `[]`); las claves van en este orden (el orden del `SELECT`):

| Función (V1) | Columnas, en orden |
|---|---|
| `obtenerExportacionAves()` (`:126-159`) | `Codigo, Raza, Sexo, Estado, EstadoSalud, FechaNacimiento, PesoGramos, AlturaCm, LargoCm, Padre, Madre, Jaula, Origen, Caracteristicas` |
| `obtenerExportacionVentas()` (`:162-187`) | `Ave, Fecha, Celular, Nombre, CiudadDestino, Cooperativa, ValorAve, ValorEnvio, Detalle` |
| `obtenerExportacionClientes()` (`:190-214`) | `Celular, Nombre, Ciudad, Compras, TotalAves, TotalEnvios, UltimaCompra` |
| `obtenerExportacionFinanzas()` (`:217-240`) | `Fecha, Tipo, Categoria, Valor, Detalle, Ave, Origen, OrigenId` |
| `obtenerExportacionHuevos()` (`:243-266`) | `Codigo, Fecha, Ave, Jaula, Estado, Observacion` |
| `obtenerExportacionJaulas()` (`:269-290`) | `Codigo, Nombre, Ubicacion, Tipo, EstadoSanitario, Estado, FechaCreacion, FechaDesactivacion` |

- Valores tal como salen de la columna (texto o `null`; REAL como number). Sin formateo de fechas en el servidor.
- Consumo (`ReportesScreen.js:105-148`): `setExportando(id)`; `filas = await obtener()`; si `!filas || filas.length === 0` → `Alert.alert('Sin datos', 'No hay información para exportar.')` y `return`; si no, `exportarCsv({nombre, filas})`; `catch` → `console.error('Error exportando:', …)` + `Alert.alert('Error', 'No fue posible generar la exportación.')`; `finally` `setExportando(null)`. Nombres de archivo: `Aves`, `Ventas`, `Clientes`, `Finanzas`, `Huevos`, `Jaulas` (`:164-169`).

## Endpoints V2

Bajo `/api/v1/criaderos/:criaderoId/reportes`, módulo nuevo `api/src/reportes/` (routes → factory → service → repository), montado en `api/src/app.ts` (opción `reportesRouter` inyectable para pruebas HTTP, como `clientesRouter`). Solo `GET`, sin cuerpo ni query. Ownership por criadero: 401 `UNAUTHORIZED`/`INVALID_TOKEN`, 403 `FORBIDDEN` (también criadero inexistente), 500 `INTERNAL_ERROR`. Sin validaciones nuevas, sin `version`.

| Endpoint | Equivale a | `data` |
|---|---|---|
| `GET /reportes/aves` | `obtenerReporteAves` | `{ "activas": 0, "vendidas": 0, "fallecidas": 0 }` |
| `GET /reportes/salud` | `obtenerReporteSalud` | `{ "estado": { "tratamiento": 0, "enfermas": 0 }, "enfermedades": [ { "enfermedad": "…", "cantidad": 0 } ] }` |
| `GET /reportes/produccion` | `obtenerReporteProduccion` | `{ "huevos": { "hoy": 0, "mes": 0 }, "mejor": { "codigo": "…", "cantidad": 0 } }` o `"mejor": null` |
| `GET /reportes/finanzas` | `obtenerReporteFinanzas` | `{ "ingresos": 0, "egresos": 0, "utilidad": 0 }` |
| `GET /reportes/exportaciones/{aves,ventas,clientes,finanzas,huevos,jaulas}` | `obtenerExportacion*` | `{ "filas": [ … ] }` |

Cliente REST: resúmenes `return data` sin transformar; exportaciones `return data.filas` sin transformar (ni `aSnake` ni `Number()`).

### Cómo viajan las claves PascalCase (decisión del contrato)

**La API devuelve las filas ya con las claves exactas de V1 (PascalCase), en el orden de V1, dentro de `filas`.** El repositorio D1 usa los mismos alias `AS Codigo, AS Raza, …` del SQL de V1, el servicio no renombra ni reordena, y `JSON.stringify`/`JSON.parse` conservan el orden de inserción de claves no numéricas.

Motivo y excepción a la convención camelCase: esas claves son **las cabeceras del CSV** (`ExportService.js:95-109`). Se descartó "camelCase + mapeo inverso en el cliente" (6 mapeos y orden reconstruido en dos sitios) y `aSnake` (`src/api/avesApi.js:38-64`) no sirve para PascalCase. Excepción técnica E-5; se prueba con `toStrictEqual` + `Object.keys` contra el código real de V1 (REP-20).

Reglas de la fila: todas las filas llevan todas las claves (aunque sean `null`); `null` real donde V1 da `NULL`; números como number JSON; ningún campo extra.

### Consultas D1 por endpoint (fijo)

| Endpoint | Llamadas a D1 |
|---|---|
| `/reportes/aves`, `/reportes/finanzas` | 2 (propiedad + 1 SELECT) |
| `/reportes/salud`, `/reportes/produccion` | 3 (propiedad + 2 SELECT, como V1) |
| cada una de las 6 exportaciones | 2 (propiedad + 1 SELECT con sus JOIN) |

Sin `db.batch` (cuenta igual para el límite de 50; si el implementador lo usa, debe declararlo: 3 sentencias). Nunca ave por ave. Al abrir la pantalla: 4 peticiones en paralelo, 10 llamadas D1 en total.

Tamaño (V1 no pagina; **no se añade paginación**): fila de huevos ≈ 120-150 B (2000 ≈ 0,3 MB; 20 000 ≈ 3 MB); movimientos y aves 150-300 B. Riesgo anotado: CPU del Worker (plan gratuito) con decenas de miles de filas; medir en REP-24.

### SQL propuesto (V1 + `criadero_id`; `?` posicionales repitiendo el bind)

```sql
-- /reportes/aves
SELECT
  COALESCE(SUM(CASE WHEN estado='ACTIVA' THEN 1 ELSE 0 END), 0) AS activas,
  COALESCE(SUM(CASE WHEN estado='VENDIDA' THEN 1 ELSE 0 END), 0) AS vendidas,
  COALESCE(SUM(CASE WHEN estado='FALLECIDA' THEN 1 ELSE 0 END), 0) AS fallecidas
FROM aves WHERE criadero_id = ?

-- /reportes/salud (1)
SELECT
  COALESCE(SUM(CASE WHEN estado_salud='EN_TRATAMIENTO' THEN 1 ELSE 0 END), 0) AS tratamiento,
  COALESCE(SUM(CASE WHEN estado_salud='ENFERMA' THEN 1 ELSE 0 END), 0) AS enfermas
FROM aves WHERE criadero_id = ? AND estado='ACTIVA'

-- /reportes/salud (2)
SELECT enfermedad, COUNT(*) AS cantidad
FROM diagnosticos_ave WHERE criadero_id = ?
GROUP BY enfermedad
ORDER BY cantidad DESC, enfermedad DESC
LIMIT 5

-- /reportes/produccion (1): ahora = ISO UTC del servicio
SELECT
  COALESCE(SUM(CASE WHEN date(fecha)=date(?) THEN 1 ELSE 0 END), 0) AS hoy,
  COALESCE(SUM(CASE WHEN strftime('%Y-%m',fecha)=strftime('%Y-%m',?) THEN 1 ELSE 0 END), 0) AS mes
FROM huevos WHERE criadero_id = ?

-- /reportes/produccion (2)
SELECT a.codigo, COUNT(h.id) AS cantidad
FROM huevos h
INNER JOIN aves a ON a.id = h.ave_id AND a.criadero_id = h.criadero_id
WHERE h.criadero_id = ?
GROUP BY a.id, a.codigo
ORDER BY cantidad DESC, a.rowid ASC
LIMIT 1

-- /reportes/finanzas
SELECT
  COALESCE(SUM(CASE WHEN tipo='INGRESO' THEN valor ELSE 0 END), 0) AS ingresos,
  COALESCE(SUM(CASE WHEN tipo='EGRESO' THEN valor ELSE 0 END), 0) AS egresos
FROM movimientos_financieros WHERE criadero_id = ?
```

```sql
-- exportaciones/aves
SELECT a.codigo AS Codigo, a.raza AS Raza, a.sexo AS Sexo, a.estado AS Estado,
  a.estado_salud AS EstadoSalud, a.fecha_nacimiento AS FechaNacimiento,
  a.peso_gramos AS PesoGramos, a.altura_cm AS AlturaCm, a.largo_cm AS LargoCm,
  p.codigo AS Padre, m.codigo AS Madre, j.codigo AS Jaula,
  a.origen AS Origen, a.caracteristicas AS Caracteristicas
FROM aves a
LEFT JOIN aves p ON p.id = a.padre_id AND p.criadero_id = a.criadero_id
LEFT JOIN aves m ON m.id = a.madre_id AND m.criadero_id = a.criadero_id
LEFT JOIN jaulas j ON j.id = a.jaula_actual_id AND j.criadero_id = a.criadero_id
WHERE a.criadero_id = ?
ORDER BY a.codigo

-- exportaciones/ventas
SELECT a.codigo AS Ave, b.fecha AS Fecha, b.celular AS Celular, b.comprador AS Nombre,
  b.ciudad_destino AS CiudadDestino, b.cooperativa_envio AS Cooperativa,
  b.valor_venta AS ValorAve, b.valor_envio AS ValorEnvio, b.detalle AS Detalle
FROM bajas_ave b
INNER JOIN aves a ON a.id = b.ave_id AND a.criadero_id = b.criadero_id
WHERE b.criadero_id = ? AND b.tipo = 'VENTA'
ORDER BY b.fecha DESC, b.rowid ASC

-- exportaciones/clientes
SELECT b.celular AS Celular,
  MAX(NULLIF(TRIM(b.comprador), '')) AS Nombre,
  MAX(NULLIF(TRIM(b.ciudad_destino), '')) AS Ciudad,
  COUNT(*) AS Compras,
  COALESCE(SUM(b.valor_venta), 0) AS TotalAves,
  COALESCE(SUM(b.valor_envio), 0) AS TotalEnvios,
  MAX(b.fecha) AS UltimaCompra
FROM bajas_ave b
WHERE b.criadero_id = ? AND b.tipo = 'VENTA' AND b.celular IS NOT NULL AND TRIM(b.celular) <> ''
GROUP BY b.celular
ORDER BY UltimaCompra DESC, b.celular DESC

-- exportaciones/finanzas
SELECT mf.fecha AS Fecha, mf.tipo AS Tipo, mf.categoria AS Categoria, mf.valor AS Valor,
  mf.detalle AS Detalle, a.codigo AS Ave, mf.origen_tipo AS Origen, mf.origen_id AS OrigenId
FROM movimientos_financieros mf
LEFT JOIN aves a ON a.id = mf.ave_id AND a.criadero_id = mf.criadero_id
WHERE mf.criadero_id = ?
ORDER BY mf.fecha DESC, mf.rowid DESC

-- exportaciones/huevos
SELECT h.codigo AS Codigo, h.fecha AS Fecha, a.codigo AS Ave, j.codigo AS Jaula,
  h.estado AS Estado, h.observacion AS Observacion
FROM huevos h
LEFT JOIN aves a ON a.id = h.ave_id AND a.criadero_id = h.criadero_id
LEFT JOIN jaulas j ON j.id = h.jaula_id AND j.criadero_id = h.criadero_id
WHERE h.criadero_id = ?
ORDER BY h.fecha DESC, h.rowid DESC

-- exportaciones/jaulas
SELECT j.codigo AS Codigo, j.nombre AS Nombre, j.ubicacion AS Ubicacion, j.tipo AS Tipo,
  j.estado_sanitario AS EstadoSanitario,
  CASE WHEN j.activa = 1 THEN 'ACTIVA' ELSE 'INACTIVA' END AS Estado,
  j.fecha_creacion AS FechaCreacion, j.fecha_desactivacion AS FechaDesactivacion
FROM jaulas j
WHERE j.criadero_id = ?
ORDER BY j.codigo
```

Usar `?` posicionales (el adaptador `better-sqlite3` falló con `?1`/`?2`, ver `clientes.md`).

### Reloj y UTC

El servicio recibe `ahora: () => Date = () => new Date()` (inyectable en `createReportesDependencies(db, ahora)`, como finanzas y huevos) y pasa `ahora().toISOString()` al repositorio solo en `/reportes/produccion` (`date(?)` y `strftime('%Y-%m', ?)` sustituyen a `'now'`). En las pruebas se fija con una fecha constante; en la copia de V1 de la paridad se sustituye `'now'` por esa fecha.

### Orden y desempates

- V1 no tiene desempate completo: se hace explícito el orden que SQLite da en la práctica (no es garantía documentada y no se comprobó sobre el SQLite de `expo-sqlite` del teléfono). No cambia resultados donde no hay empate.
- **Top 5 de enfermedades** (corregido tras la paridad con el código real de V1): entre empates de cantidad V1 deja las filas en orden **descendente** de `enfermedad`. Réplica: `cantidad DESC, enfermedad DESC`. Un empate en el puesto 5 elige la mayor `enfermedad`. (La propuesta inicial `ASC` fue desmentida por REP-06.)
- **Mejor ponedora**: empate → menor `a.id` (creada antes). Réplica: `a.rowid ASC` (como `finanzas.repository.ts:126`). No se usa el UUID v7 (no depende de monotonía en el mismo ms, D-2 de `clientes.md`).
- **Aves y jaulas**: `ORDER BY codigo`, único por criadero, sin empates; comparación binaria igual.
- **Ventas**: `b.fecha DESC, b.rowid ASC` (coincide con V1 en la paridad, también con datos pseudoaleatorios masivos).
- **Clientes** (corregido): `, b.celular DESC` (V1 ordena los empates de `UltimaCompra` en descendente; el `ASC` inicial fue desmentido).
- **Finanzas y huevos**: `fecha DESC, rowid DESC` (V1 `id DESC` autoincremental). Una venta escribe 2 movimientos con la misma `fecha`; `rowid DESC` pone primero el último insertado, igual que V1.

## Tabla D1

**Sin tabla ni columna nuevas.** Lee tablas de 0005, 0006, 0009 y 0010.

### Mapeo columna por columna (V1 → D1)

| Dato exportado | V1 | D1 | Diferencia |
|---|---|---|---|
| `aves.codigo/raza/sexo/estado/estado_salud/origen/caracteristicas` | TEXT | TEXT (`0006:19-37`) | ninguna |
| `aves.fecha_nacimiento` | TEXT | TEXT (`0006:21`) | ninguna; sin formateo |
| `aves.peso_gramos/altura_cm/largo_cm` | REAL | REAL (`0006:38-40`) | ninguna; JSON number; CSV con coma decimal |
| `aves.padre_id/madre_id/jaula_actual_id` | INTEGER | TEXT UUID v7 | solo JOIN; salida = **código** |
| `aves.foto_uri` | TEXT | `foto_r2_key` | **no se exporta**: sin efecto |
| `jaulas.codigo/nombre/ubicacion/tipo/estado_sanitario` | TEXT | TEXT (`0005:16-20`) | ninguna |
| `jaulas.activa` | INTEGER | INTEGER (`0005:21`) | ninguna (no hay `deleted_at`); mismo `CASE` |
| `jaulas.fecha_creacion/fecha_desactivacion` | TEXT | TEXT (`0005:22,24`) | ninguna; texto tal cual (puede ser `YYYY-MM-DD HH:MM:SS` o ISO); no se normaliza |
| `huevos.codigo/fecha/estado/observacion` | TEXT | TEXT (`0009:28-33`) | `codigo` único por criadero |
| `huevos.ave_id/jaula_id` | INTEGER | TEXT UUID v7 | solo JOIN; salida = códigos |
| `diagnosticos_ave.enfermedad` | TEXT | TEXT (`0006:144`) | ninguna |
| `bajas_ave.fecha/celular/comprador/ciudad_destino/cooperativa_envio/detalle` | TEXT | TEXT (`0010:29-37`) | ninguna |
| `bajas_ave.valor_venta/valor_envio` | REAL | REAL (`0010:35-36`) | ninguna; `NULL` se conserva |
| `movimientos_financieros.fecha/tipo/categoria/detalle/origen_tipo/valor` | TEXT/REAL | igual (`0010:59-65`) | ninguna |
| `movimientos_financieros.origen_id` | INTEGER | **TEXT** (UUID v7 en `VENTA_AVE`) | **`OrigenId` pasa de número a texto UUID** (E-1) |
| `movimientos_financieros.ave_id` | INTEGER | TEXT | solo JOIN; salida = código |
| Todas | sin `criadero_id` | `criadero_id` | en cada consulta y JOIN |

### Índices y migración

- **No hace falta migración** para la paridad. Ya existen `ix_aves_criadero_estado`, `ux_aves_criadero_codigo`, `ux_jaulas_criadero_codigo`, `ix_huevos_criadero_fecha` (`0009:58`) e `ix_movimientos_criadero_fecha` (`0010:78`); no se añaden `huevos(criadero_id, fecha)` ni `movimientos(criadero_id, fecha)`.
- **Opcional (D-1)**: `0012` con `CREATE INDEX ix_diagnosticos_ave_criadero_enfermedad ON diagnosticos_ave(criadero_id, enfermedad)`. Es la única consulta de Reportes sin índice por criadero. Solo cambia el plan. Decisión: no se crea salvo que la medición con datos grandes lo pida (la siguiente migración libre es `0012`).

## Excepciones técnicas por pasar a online

- **E-1 IDs `TEXT` UUID v7**: `OrigenId` del export de finanzas pasa de entero a texto. Es la única columna con id; el resto son códigos. La pantalla no usa ids.
- **E-2 `criadero_id`** en la ruta y en cada consulta y JOIN; ownership 403.
- **E-3 Autenticación y errores de red**: el cliente propaga el `ApiError`.
- **E-4 Cálculo en el servidor** (decisión del usuario); reloj inyectable `ahora` en lugar de `'now'`.
- **E-5 Claves PascalCase en el JSON de las exportaciones** (excepción a camelCase; son cabeceras del CSV).
- **E-6 Desempates explícitos** (`enfermedad DESC`, `rowid`, `celular DESC`) que reproducen el orden observable de V1.
- Sin imágenes (sin R2). Sin validaciones ni límites nuevos.

## Qué ve cada pantalla y si hay que modificarla

**Conclusión: no hay que modificar ninguna pantalla** (`git diff -- src/screens src/services` debe quedar vacío).

- `ReportesScreen.js:58-92` `cargar`: `setLoading(true)`; `Promise.all` de los 4 resúmenes; `setData(...)`; `catch` solo `console.error('Error cargando reportes:', error)` (82-87); `finally` `setLoading(false)`. Mientras carga, `ActivityIndicator` (151-160).
- Con 0 datos: `data` con ceros → "Activas: 0", "Mejor ponedora: Sin datos", "Ingresos: $0.00"; `enfermedades: []` no pinta líneas.
- Exportación: con `[]` → `Alert` "Sin datos / No hay información para exportar." (`:117-127`); error → `Alert` "Error / No fue posible generar la exportación." (`:134-143`); con filas → `exportarCsv` y hoja de compartir (`ExportService.js:62-88`). Botones deshabilitados mientras exporta (267) y "Generando..." (276-281).

Observación (V1, no se resuelve; decisión del usuario: sin excepciones a pantallas): `ReportesScreen.js:82-87` (`catch` solo con `console.error`): con error de red/sesión o fallo de cualquiera de los 4 resúmenes (`Promise.all` rechaza entero) `data` queda `null` y la pantalla muestra todo en cero sin aviso, indistinguible de una cuenta vacía.

## Casos de paridad

Convenciones: reloj fijo `AHORA = 2026-11-05T15:00:00.000Z` en D1 y, en la copia de V1, el mismo valor en lugar de `'now'`; `id` creciente por inserción; códigos `K001…`, `H000001…`, `J01…`; criadero A salvo que se diga otro.

| id | dado | cuando | entonces |
|---|---|---|---|
| REP-01 | Sin datos | los 4 resúmenes | `{0,0,0}`; salud `{estado:{0,0}, enfermedades:[]}`; producción `{huevos:{0,0}, mejor:null}`; finanzas `{0,0,0}` |
| REP-02 | 3 `ACTIVA`, 2 `VENDIDA`, 1 `FALLECIDA` | `obtenerReporteAves` | `3/2/1` |
| REP-03 | Aves `ACTIVA` con `EN_TRATAMIENTO`, `ENFERMA`, `SANA`; una `VENDIDA` `ENFERMA` | `salud.estado` | solo las `ACTIVA` |
| REP-04 | Diagnósticos de aves de cualquier estado y con `estado` distinto de `ACTIVO` | `enfermedades` | cuenta todos |
| REP-05 | 7 enfermedades con cantidades distintas | `enfermedades` | 5 mayores, descendente |
| REP-06 | Empates de cantidad (incluido el puesto 5) | `enfermedades` | orden = V1 (`enfermedad` desc entre empates; la paridad desmintió el `asc` inicial) |
| REP-07 | Huevos hoy UTC, ayer del mes, otro mes | `produccion.huevos` | `hoy` y `mes` por texto UTC; `2026-11-05T23:59` cuenta hoy; `2026-11-01T00:00:00.000Z` cuenta en el mes |
| REP-08 | Huevos de dos aves | `mejor` | `{codigo, cantidad}` del ave con más huevos |
| REP-09 | Empate de huevos entre dos aves | `mejor` | gana la creada antes |
| REP-10 | Huevos de ave `VENDIDA`/`FALLECIDA` | `mejor` | también cuenta |
| REP-11 | Movimientos `INGRESO`, `EGRESO`, otro tipo; REAL 0.1+0.2 | `obtenerReporteFinanzas` | `utilidad = ingresos - egresos`; otro tipo no suma; sin redondeo |
| REP-12 | Solo egresos | `obtenerReporteFinanzas` | `ingresos 0`, utilidad negativa |
| REP-13 | Aves con padre, madre, jaula; sin ellos; `VENDIDA` y `FALLECIDA` | export aves | 14 claves en orden; `Padre/Madre/Jaula` = código o `null`; todos los estados; orden `Codigo` |
| REP-14 | Ave con peso/altura/largo `NULL` y con `0` | export aves | `null` y `0` number; `FechaNacimiento` texto tal cual |
| REP-15 | Ventas con y sin valores, comprador, ciudad, cooperativa; una `MUERTE` | export ventas | solo `VENTA`; 9 claves; valores `null` o number; `Fecha DESC`; empate por registro |
| REP-16 | Ventas al mismo celular con textos con espacios y vacíos; celular `NULL` y `' '` | export clientes | 7 claves; `Nombre`/`Ciudad` = `MAX` recortado no vacío o `null`; totales `0` si todo `NULL`; orden `UltimaCompra DESC`, `celular DESC` |
| REP-17 | Movimientos manuales, de venta, de otra ave | export finanzas | 8 claves; `Ave` código o `null`; `Origen`, `OrigenId`; `Fecha DESC`, empate último insertado; en D1 `OrigenId` es texto UUID (se compara por posición y tipo) |
| REP-18 | Huevos con ave y jaula; con `jaula_id` `NULL`; observación `NULL` | export huevos | 6 claves; `Jaula` `null`; `Estado` `REGISTRADO`; `Fecha DESC`, empate último insertado |
| REP-19 | Jaulas activas, inactivas (con `fecha_desactivacion`) | export jaulas | 8 claves; `Estado` `ACTIVA`/`INACTIVA`; orden `Codigo`; incluye inactivas |
| REP-20 | Cualquier export con filas | las 6 | `Object.keys` idéntico y en el mismo orden que V1 en todas las filas; `toStrictEqual` salvo ids |
| REP-21 | Export sin filas | las 6 | `filas: []` con 200; la pantalla muestra `Alert` "Sin datos / No hay información para exportar." |
| REP-22 | Dos criaderos/cuentas con datos y códigos repetidos | los 10 endpoints | cada uno ve solo lo suyo; criadero ajeno o inexistente → 403 |
| REP-23 | Padre/madre/jaula/ave con el mismo código en otro criadero | exports aves, finanzas, huevos | el JOIN solo resuelve dentro del criadero |
| REP-24 | 60 jaulas, 300 aves, 2000 huevos, 2000 movimientos, 300 ventas, 100 diagnósticos | los 10 endpoints | mismo resultado que V1; D1 recibe 2 llamadas (aves, finanzas, exports) o 3 (salud, producción) por petición, medidas con el adaptador; tiempo y tamaño anotados |
| REP-25 | Fallo de red/sesión | `ReportesScreen` | resúmenes: `console.error` y pantalla en cero (V1); export: `Alert` "Error / No fue posible generar la exportación." |
| REP-26 | `;`, `"` y salto de línea en `Detalle`/`Observacion`/`Caracteristicas` | export + `exportarCsv` | las filas llegan intactas (escapado de la app, sin cambios) |

## Plan de pruebas

1. **Unitarias de service** con fake de repositorio: `mejor: null`, `enfermedades: []`, `utilidad = ingresos - egresos`, `ahora` inyectado, `filas: []`.
2. **HTTP ligero** (`app.request()`): 401/403 (inexistente = 403) en los 10 endpoints, forma de las respuestas, claves PascalCase y orden en el JSON.
3. **Integración D1** (`LocalD1Adapter`): SQL real con REP-01 a REP-23; conteo de llamadas por endpoint (2 o 3) con el volumen de REP-24; aislamiento (REP-22, REP-23); reloj fijo.
4. **Paridad con el código REAL de V1** (`api/test/integration/reportes.paridad-v1.d1.test.ts`, como `finanzas.paridad-v1.d1.test.ts` y `clientes.paridad-v1.d1.test.ts`): cargar `src/repositories/ReportesRepository.sqlite.js` sin modificar sobre `better-sqlite3` en memoria con el esquema de V1; reloj fijo reemplazando `'now'` en el SQL que recibe el adaptador. Mismos datos en D1 local (más un segundo criadero) y `toStrictEqual` de las 10 funciones. Única normalización: `OrigenId` (entero ↔ TEXT con el mismo orden). Incluir empates de enfermedades, mejor ponedora, fecha en ventas/finanzas/huevos y REAL "difíciles".
5. **`/probar datos`**: caso nuevo `pruebas/datos/casos/15-reportes.mjs`: con clientes REST reales crear jaulas, aves, huevos, diagnósticos, una venta y movimientos; llamar a las 10 funciones de `ReportesRepository.api.js`; comprobar claves exactas y orden (`Object.keys`), tipos, totales, `mejor`, top 5 y `filas: []` en cuenta vacía; segunda cuenta desechable para aislamiento (ejemplos: `05-aislamiento.mjs` y el flujo con `# SEGUNDA-CUENTA`; y añadir los endpoints a `05-aislamiento.mjs`).
6. **Pantalla (emulador, `/probar completo`)**: flujo nuevo `completo/97-reportes.yaml`: Más → Reportes muestra "Aves", "Salud", "Producción", "Finanzas" con valores del flujo y los seis botones "Exportar …"; cuenta sin datos: ceros, "Sin datos" y `Alert` "No hay información para exportar."; con datos, "Exportar Aves" cambia a "Generando..." y abre la hoja de compartir (el flujo llega hasta ahí; el contenido del CSV se comprueba con `/probar datos` y la paridad). Modo avión y sesión caducada: solo en teléfono.

## Implementación (prevista)

- API: `api/src/reportes/` (`reportes.routes.ts`, `.factory.ts` con `ahora` inyectable, `.service.ts`, `.repository.ts`, `.types.ts`), montado en `app.ts` como `/api/v1/criaderos/:criaderoId/reportes` (opción `reportesRouter`). Sin migración para la paridad.
- Cliente: `ReportesRepository.js` (fachada), `.sqlite.js` (V1 renombrado sin cambios) y `.api.js` con `apiFetch` y `rutaCriadero` (`src/api/huevosApi.js:15`). Sin `aSnake`.
- Nada de `src/screens/` ni `src/services/ExportService.js`.

## Pendientes y limitaciones

- Inicio y Alertas siguen en SQLite hasta su módulo.
- Reportes no usa imágenes (R2 no aplica).
- Dos cuentas en el mismo teléfono ya no compartirán datos de reportes en modo API.
- "Hoy" y "mes" en UTC, como V1.
- Exportaciones sin paginación (replicar V1): riesgo de tamaño y CPU con decenas de miles de filas (REP-24).
- `OrigenId` del CSV de finanzas muestra un UUID en lugar de un número (E-1, diferencia exigida por UUID v7).
- Un error de red al cargar los resúmenes deja la pantalla en ceros sin aviso, como V1.

## Dudas

- D-1 (resuelta): no se crea `0012` (`diagnosticos_ave(criadero_id, enfermedad)` no hace falta con las cifras medidas); falta medir en D1 real.
- D-2 (técnica, resuelta): V1 ordena los empates del top 5 de enfermedades y de la exportación de clientes en descendente según el motor SQLite (`enfermedad DESC`, `celular DESC`). El orden no es una garantía documentada y no se comprobó sobre el SQLite de `expo-sqlite` del teléfono. Mejor ponedora `a.rowid ASC`, ventas `fecha DESC, rowid ASC`, finanzas y huevos `fecha DESC, rowid DESC` coinciden con V1 también con datos masivos (semillas 1, 7, 42 y 2026).
- D-3 (técnica): CPU del Worker con exportaciones de decenas de miles de filas; medir con REP-24.
- D-4 (técnica): `fecha_creacion`/`fecha_desactivacion` de jaulas pueden mezclar formatos; se exportan tal cual, como V1.
