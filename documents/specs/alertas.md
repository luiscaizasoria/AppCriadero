# Spec: alertas

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).

## Estado

implementado (2026-11-07)

### Lo implementado (real)

- **API** `api/src/alertas/`: un solo `GET /api/v1/criaderos/:criaderoId/alertas` → `data: { alertas }`. Cinco llamadas D1 fijas (ownership + salud, jaulas, huevos de hoy, totales del mes), sin `batch` ni bucles; las jaulas en UNA consulta con dos `NOT EXISTS` correlacionados. Un único `ahora` ISO por petición con `julianday(?)`/`date(?)`/`strftime(?)`. Orden `[...salud, ...jaulas (alimentación y luego bebida), ...producción, ...finanzas]`, con `ORDER BY rowid ASC` en salud y jaulas. Sin migración. Criadero ajeno o inexistente: 403.
- **Cliente REST** `AlertasRepository.{js,sqlite.js,api.js}`: `.sqlite.js` es V1 renombrado al 100 %. En modo API solo existen `obtenerTodasLasAlertas` y `obtenerResumenAlertas` (una petición por llamada, sin caché, resumen derivado con el código de V1). Las cuatro parciales (`obtenerAlertasSalud`, `obtenerAlertasJaulas`, `obtenerAlertasProduccion`, `obtenerAlertasFinanzas`) quedan omitidas porque ninguna pantalla las llama; en modo API lanzan `TypeError` «no es una función», como `obtenerIngresos`/`obtenerEgresos` en Finanzas.
- **Paridad con el código REAL de V1** sobre `better-sqlite3`: 324 comparaciones con `toStrictEqual`, 962 alertas, 12 semillas pseudoaleatorias, borde de 7 días con 8 relojes y 4 formatos de fecha, medianoche, cambio de mes, año y bisiesto, egresos = ingresos: 0 diferencias. La hipótesis `rowid ASC` (D-2) quedó confirmada en `better-sqlite3` (no se comprobó en el SQLite de `expo-sqlite` del teléfono). D-3 (punto flotante en los bordes frente al SQLite de D1 real y del teléfono) sigue abierta.
- **Datos grandes** (60 jaulas, 300 aves con 30 en tratamiento, 2000 huevos, 2000 movimientos, 2000 alimentaciones y 2000 bebidas; adaptador local): 5 llamadas D1 (igual que con pocos datos), 152 alertas de 31 475 bytes en 3 a 62 ms. CPU en D1 real sin medir. No se crea `0012` (D-1).
- **Pruebas:** typecheck OK; 333 unitarias/HTTP y 167 de integración (22 de alertas). Revisión de arquitectura: APROBADO sin hallazgos bloqueantes ni importantes. `/probar datos` VERDE 110/110 en 248,9 s (informe `2026-11-07-154240-datos`; caso `16-alertas` con 6 pruebas y `GET /alertas` añadido a `05-aislamiento`; no se puede crear un ave ENFERMA por API: solo diagnóstico, que deja EN_TRATAMIENTO). `/probar smoke` VERDE (107 s el flujo, 2,6 min; informe `2026-11-07-155305-smoke`). Flujo `completo/99-alertas.yaml` PASO en 140 s (informe `2026-11-07-154950-completo`; las dos primeras ejecuciones fallaron por errores del propio flujo): insignia «🔔 3» de Más; pantalla Alertas con Total 3 / Críticas 0 / Advertencias 3 y los textos exactos de alimentación, bebida y producción; la acción «Registrar alimentación →» abre `AlimentacionJaulaScreen`; con una segunda cuenta solo se ve «Sin producción registrada» (Total 1).
- **Hallazgos de comportamiento de la app (no se tocan):** tras la acción de alimentación, `back` lleva a la pestaña Inicio (la pila de Más queda en su raíz); el subtítulo «Estado y pendientes del criadero» aparece también en la tarjeta de Alertas dentro de Más.
- **No verificado:** Inicio y su resumen de alertas; navegación de la acción de bebida y de las alertas de salud/finanzas; el botón «Ver detalle →» de producción y finanzas (no navega); orden de las alertas en pantalla; medianoche UTC; teléfono físico.
- **Pendientes y limitaciones:** tres `catch` que solo hacen `console.error` (`AlertasScreen.js:155-166`, `InicioScreen.js:173-180`, `MasMenuScreen.js:80-90`): con error de red se ve «No existen alertas.» o la insignia vacía, como V1 (decisión del usuario: sin excepciones a pantallas). Inicio sigue en SQLite (siguiente y último módulo de la fase 6). `obtenerResumenAlertas` duplicado en `AlertasScreen.js:823-850` es código muerto de V1, intacto.

Alcance: aves individuales (sin lotes), sin sincronización offline, D1 como fuente de verdad. Decisiones del usuario (fase 6): **las alertas se calculan en el SERVIDOR** replicando V1 tal cual; sin validaciones nuevas; **ninguna excepción a pantallas V1** (si una pantalla necesitara un cambio, no se resuelve aquí: queda como "DUDA PARA EL USUARIO" con `archivo:línea`). Las líneas son del árbol de V1 (v1.0.3). Alertas es **solo lectura** y **no tiene tabla propia**: se deriva de `aves`, `jaulas`, `alimentacion_jaula`, `bebida_jaula`, `huevos` y `movimientos_financieros`.

## Fuente V1

- `src/repositories/AlertasRepository.js` (6 funciones públicas, todas de lectura; búsqueda de `INSERT|UPDATE|DELETE` sin resultados): `obtenerAlertasSalud` 9-114, `obtenerAlertasJaulas` 124-363, `obtenerAlertasProduccion` 373-476, `obtenerAlertasFinanzas` 486-619, `obtenerTodasLasAlertas` 629-687, `obtenerResumenAlertas` 697-744.
- Llamadores (búsqueda sin límite de `AlertasRepository|obtenerResumenAlertas|obtenerTodasLasAlertas|obtenerAlertas(Salud|Jaulas|Produccion|Finanzas)` en todo el repo salvo `documents/`):
  - `src/screens/AlertasScreen.js:23-25` importa **solo** `obtenerTodasLasAlertas` (llamada 143-145, `cargar` 132-175, `useFocusEffect` 183-193). Ruta `Alertas` en `src/navigation/MasStackNavigator.js:232-241`.
  - `src/screens/InicioScreen.js:71-74` importa `obtenerTodasLasAlertas` y `obtenerResumenAlertas`; `Promise.all` con `obtenerDashboard()` en 131-151.
  - `src/screens/MasMenuScreen.js:30-32` importa `obtenerResumenAlertas` (llamada 66-68; insignia `AlertBadge` 238-242).
  - **Ninguna pantalla llama a `obtenerAlertasSalud`, `obtenerAlertasJaulas`, `obtenerAlertasProduccion` ni `obtenerAlertasFinanzas`**: solo las usa `obtenerTodasLasAlertas` dentro del repositorio (644-664).
  - `AlertasScreen.js:823-850` **define y exporta** otra `obtenerResumenAlertas` (copia exacta de la del repositorio) fuera del componente. **Código muerto**: nadie la importa (los dos importadores, `InicioScreen.js:73` y `MasMenuScreen.js:31`, la toman de `AlertasRepository`). No se toca.
- Componentes: `src/components/AlertCard.js` (props `nivel`, `tipo`, `titulo`, `mensaje`, `accionDestino`, `onPress`; 17-31) y `src/components/AlertBadge.js` (prop `cantidad`; oculta si `<= 0`, 26-32).
- Esquema V1: `aves.fecha_ultimo_control_salud` (`src/database/migrationV2.js:12`), `idx_aves_estado` y `idx_movimientos_fecha` (`migrations.js:349,364`). Tablas en D1: `0005_jaulas.sql` (`jaulas.activa`, 21), `0006_aves.sql` (`aves.estado`, `estado_salud`, `fecha_ultimo_control_salud`, 32-36), `0007_cuidados_jaula.sql` (`alimentacion_jaula`, `bebida_jaula`; índices `(jaula_id, fecha)`, 40-62), `0009_huevos.sql` (`huevos`; índice `(criadero_id, fecha)`, 58), `0010_bajas.sql` (`movimientos_financieros`; índice `(criadero_id, fecha)`, 78). **No hay tabla nueva.**
- Cómo se escribe `fecha` (todas las fechas las envía la app): `SaludAveScreen.js:309-311` (diagnóstico → `fecha_ultimo_control_salud` en `SaludRepository.sqlite.js:259-267` y `api/src/salud/salud.repository.ts:59-62`), `AlimentacionJaulaScreen.js:87-89` y `BebidaJaulaScreen.js:90`: todas `new Date().toISOString()` (ISO UTC con milisegundos y `Z`). Excepción en V1: `SaludRepository.sqlite.js:397-398` (`actualizarEstadoSaludAve`) escribe `CURRENT_TIMESTAMP` (`YYYY-MM-DD HH:MM:SS`); en D1 esa función se omitió del cliente (módulo Salud), por lo que D1 solo contiene fechas ISO con `Z`... salvo lo que mande `finalizarTratamiento` (`aves.repository.ts:760`, `fecha` que envía la app). Ambos formatos los entiende `julianday`/`date` de SQLite.
- Patrones que se copian: `api/src/reportes/` (routes → factory → service → repository; `ahora: () => Date` inyectable en `reportes.factory.ts:13-16`; `D1CriaderoRepository.userOwnsCriadero`; `?` posicionales repitiendo el bind) y el cliente `src/repositories/ReportesRepository.{js,sqlite.js,api.js}`. Ver `documents/specs/reportes.md`.

### Hallazgos

1. **Cero escrituras.** No hay migración de datos ni idempotencia.
2. **Orden del array** (`obtenerTodasLasAlertas` 670-685): `[...salud, ...jaulas, ...produccion, ...finanzas]`. `Promise.all` ejecuta las cuatro a la vez pero concatena en ese orden fijo.
3. **Salud** (9-114): `SELECT a.id, a.codigo, julianday('now') - julianday(COALESCE(a.fecha_ultimo_control_salud, CURRENT_TIMESTAMP)) AS dias FROM aves a WHERE a.estado='ACTIVA' AND a.estado_salud='EN_TRATAMIENTO'` **sin `ORDER BY`**; en JS `filter(Number(item.dias || 0) >= 7)` y `Math.floor(item.dias)` en el mensaje (58, 88). Sin `fecha_ultimo_control_salud` (`NULL`): `COALESCE` usa `CURRENT_TIMESTAMP`, así que `dias` ≈ 0 (fracción de segundo) → sin alerta. Fecha no interpretable (texto inválido): `julianday` da `NULL` → `dias` `NULL` → `Number(null || 0) = 0` → sin alerta. Fecha futura: `dias` negativo → sin alerta.
4. **Jaulas** (124-363): `SELECT id, codigo FROM jaulas WHERE activa = 1` **sin `ORDER BY`**; por cada jaula, en bucle secuencial, dos `COUNT(*)` (`alimentacion_jaula` y `bebida_jaula`) con `jaula_id = ? AND date(fecha)=date('now')` (186, 280); si el total es `0` se añade primero la alerta de alimentación y después la de bebida. V1 hace `1 + 2N` consultas.
5. **Producción** (373-476): `SELECT COUNT(*) FROM huevos WHERE date(fecha)=date('now')`; si `0`, una alerta con `entidadId`, `accion` y `accionDestino` en `null`. Cuenta huevos de **cualquier** ave y estado.
6. **Finanzas** (486-619): `SUM` de `valor` por `tipo='INGRESO'` y `tipo='EGRESO'` (otros tipos no suman) con `strftime('%Y-%m',fecha)=strftime('%Y-%m','now')`; alerta si `Number(egresos) > Number(ingresos)` (**estricto**: iguales, incluido `0 = 0`, no alertan).
7. **Todo en UTC**: `date('now')` y `strftime(..., 'now')` son UTC; las `fecha` son ISO UTC de la app. Un registro hecho de noche en hora local puede caer en el día o mes UTC siguiente (misma diferencia ya aceptada en Huevos, Finanzas y Reportes).
8. **Sin filtro por `criadero`** en V1 (una sola base por teléfono): en D1 cada consulta lleva `criadero_id`.
9. **`obtenerResumenAlertas`** (697-744) vuelve a ejecutar `obtenerTodasLasAlertas` y devuelve `{ total, criticas, advertencias }` con `nivel === 'ALTO'` y `nivel === 'MEDIO'`. `InicioScreen` lo llama junto a `obtenerTodasLasAlertas` (la lógica corre dos veces en V1).
10. **`accion` no la lee ninguna pantalla**: `AlertasScreen.js:566-678` e `InicioScreen.js:774-846` navegan solo por `accionDestino`; `accionDestino === 'DETALLE_JAULA'` nunca se produce (las alertas de jaula traen `ALIMENTACION_JAULA` o `BEBIDA_JAULA`; `DETALLE_JAULA` va en `accion`); la rama queda sin uso.

## Contrato del repositorio

Fachada como Reportes/Clientes: `src/repositories/AlertasRepository.js` pasa a elegir `AlertasRepository.sqlite.js` (el código actual de V1 **renombrado sin tocar su contenido**) o `AlertasRepository.api.js` según `src/config/dataSource.js`. Las pantallas no cambian el import (`AlertasScreen.js:23-25`, `InicioScreen.js:71-74`, `MasMenuScreen.js:30-32`).

### Funciones que usa alguna pantalla (se implementan en el cliente REST)

| Función (V1) | Firma | Devuelve (forma exacta) |
|---|---|---|
| `obtenerTodasLasAlertas()` (629-687) | sin parámetros | array de alertas (puede ser `[]`), en el orden de V1 |
| `obtenerResumenAlertas()` (697-744) | sin parámetros | `{ total, criticas, advertencias }`, tres enteros: `total = alertas.length`, `criticas` = `nivel === 'ALTO'`, `advertencias` = `nivel === 'MEDIO'` |

### Funciones omitidas en el cliente REST (ninguna pantalla las llama)

`obtenerAlertasSalud`, `obtenerAlertasJaulas`, `obtenerAlertasProduccion` y `obtenerAlertasFinanzas` quedan **omitidas** en `AlertasRepository.api.js` (como `obtenerIngresos`/`obtenerEgresos` en Finanzas). Siguen en `AlertasRepository.sqlite.js`. Si una pantalla futura las necesitara, el cliente puede derivarlas filtrando por `tipo` (`SALUD`, `JAULA`, `PRODUCCION`, `FINANZAS`): el orden del array garantiza el mismo resultado que cada función por separado.

### Forma exacta de cada alerta

Claves y orden de V1: `tipo, nivel, titulo, mensaje, entidadId, accion, accionDestino`. Todas las claves van siempre, con `null` real (no ausentes).

| Origen | `tipo` | `nivel` | `titulo` | `mensaje` | `entidadId` | `accion` | `accionDestino` |
|---|---|---|---|---|---|---|---|
| Salud (`:65-109`) | `SALUD` | `ALTO` | `Ave en tratamiento prolongado` | `El ave ${codigo} lleva ${Math.floor(dias)} días en tratamiento.` | id del ave | `DETALLE_AVE` | `DETALLE_AVE` |
| Jaula, alimentación (`:210-254`) | `JAULA` | `MEDIO` | `Sin alimentación registrada` | `La jaula ${codigo} no tiene alimentación registrada hoy.` | id de la jaula | `DETALLE_JAULA` | `ALIMENTACION_JAULA` |
| Jaula, bebida (`:304-348`) | `JAULA` | `MEDIO` | `Sin bebida registrada` | `La jaula ${codigo} no tiene bebida registrada hoy.` | id de la jaula | `DETALLE_JAULA` | `BEBIDA_JAULA` |
| Producción (`:418-462`) | `PRODUCCION` | `MEDIO` | `Sin producción registrada` | `No existen huevos registrados hoy.` | `null` | `null` | `null` |
| Finanzas (`:562-606`) | `FINANZAS` | `ALTO` | `Gastos superiores a ingresos` | `Los egresos del mes superan los ingresos registrados.` | `null` | `null` | `null` |

Textos con acentos exactos (`alimentación`, `días`, `producción`). `${codigo}` es el código tal cual de `aves.codigo` / `jaulas.codigo`.

Tipos: `entidadId` pasa de entero (V1) a `TEXT` UUID v7 (D1): excepción técnica E-1. Las pantallas lo pasan sin convertir como `aveId` / `jaulaId` (`AlertasScreen.js:584-585, 612-613, 640-641, 668-669`; `InicioScreen.js:785, 803, 821, 839`) y esas pantallas de destino ya trabajan con ids UUID en modo API (Aves y Jaulas migradas).

### Cálculo de los días de tratamiento y reloj `ahora`

- **Se calcula en SQL con `julianday`, igual que V1**, no en TypeScript: `julianday(?) - julianday(COALESCE(a.fecha_ultimo_control_salud, ?))` con `ahora().toISOString()` en ambos `?`. Motivo: `julianday` convierte a milisegundos enteros y divide por `86400000.0`; la resta de dos dobles de ~2,46 millones no es exacta, y el umbral `>= 7` puede dar `6.999999999` (→ `Math.floor` = 6 y sin alerta) o `7.0000000001` según el instante. Calcular `(ahoraMs - fechaMs) / 86400000` en TS daría exactamente 7 y **diferiría de V1** en el borde. El servicio solo filtra `Number(dias || 0) >= 7` y aplica `Math.floor`, como V1.
- Formatos: `julianday` entiende ISO con milisegundos y `Z`, con `T` o espacio, y con desplazamiento (`-05:00`, que convierte a UTC). Un ISO con `Z` (lo que escribe la app) y el `CURRENT_TIMESTAMP` de V1 dan el mismo resultado para el mismo instante.
- `fecha_ultimo_control_salud NULL` → `COALESCE` usa `ahora` → `dias = 0` exacto → sin alerta (V1: fracción de segundo, también sin alerta). Texto inválido → `NULL` → `0` → sin alerta. Fecha futura → negativo → sin alerta.
- En V1, `julianday('now')` tiene milisegundos y `CURRENT_TIMESTAMP` solo segundos; con `NULL` no cambia el resultado (nunca llega a 7).
- Reloj: el servicio recibe `ahora: () => Date = () => new Date()` (inyectable en `createAlertasDependencies(db, ahora)` como `reportes.factory.ts:13-16`); un solo `ahora().toISOString()` por petición se usa en **todas** las consultas (en V1 cada `'now'` se evalúa por sentencia; la diferencia solo se nota si una petición cruza la medianoche UTC). `date('now')` → `date(?)`; `strftime('%Y-%m','now')` → `strftime('%Y-%m', ?)`.

## Endpoints V2

Decisión: **un solo endpoint**, `GET /api/v1/criaderos/:criaderoId/alertas`, sin cuerpo ni query. Motivo: las dos funciones que usan las pantallas (`obtenerTodasLasAlertas` y `obtenerResumenAlertas`) salen de la misma lista; el resumen se deriva en el cliente (`total`, `criticas`, `advertencias`) exactamente como V1. Las cuatro parciales no las llama ninguna pantalla y se omiten. No se cachea nada: `InicioScreen` llamará dos veces a la API (una por función), igual que V1 ejecuta la lógica dos veces; cada petición recalcula con el reloj del servidor.

- Módulo nuevo `api/src/alertas/` (`alertas.routes.ts`, `.factory.ts`, `.service.ts`, `.repository.ts`, `.types.ts`), montado en `api/src/app.ts` como `/api/v1/criaderos/:criaderoId/alertas` (opción `alertasRouter` inyectable en pruebas, como `reportesRouter`).
- Errores: 401 `UNAUTHORIZED`/`INVALID_TOKEN`, 403 `FORBIDDEN` (criadero ajeno **o inexistente**, como el resto de módulos), 500 `INTERNAL_ERROR`. V1 no lanza errores propios. Sin validaciones nuevas, sin `version`.
- Respuesta `200`:

```json
{ "success": true, "data": { "alertas": [
  { "tipo": "SALUD", "nivel": "ALTO", "titulo": "Ave en tratamiento prolongado",
    "mensaje": "El ave K001 lleva 8 días en tratamiento.",
    "entidadId": "<uuid-v7>", "accion": "DETALLE_AVE", "accionDestino": "DETALLE_AVE" },
  { "tipo": "PRODUCCION", "nivel": "MEDIO", "titulo": "Sin producción registrada",
    "mensaje": "No existen huevos registrados hoy.",
    "entidadId": null, "accion": null, "accionDestino": null }
] } }
```

  `data.alertas` es `[]` cuando no hay alertas. (Se usa objeto con `alertas`, como `filas` en Reportes, para no cambiar el formato si se añade algo; el implementador puede confirmar el patrón de los listados existentes, pero el cliente debe devolver siempre el **array**.)
- Cliente REST `AlertasRepository.api.js` (`apiFetch`, `rutaCriadero` de `src/api/huevosApi.js:15`; sin `aSnake`, sin transformar):
  - `obtenerTodasLasAlertas()` → `GET /alertas` y `return data.alertas`.
  - `obtenerResumenAlertas()` → llama a `obtenerTodasLasAlertas()` y devuelve `{ total: alertas.length, criticas: alertas.filter(x => x.nivel === 'ALTO').length, advertencias: alertas.filter(x => x.nivel === 'MEDIO').length }` (código idéntico al de V1 697-744; una petición por llamada).
  - Los errores de red/sesión se propagan (`ApiError`) como en los demás clientes.

## Consultas D1 y orden (fijo, sin bucles)

**Objetivo y medida: 5 llamadas a D1 por petición, independientes del número de jaulas y aves** (ownership + 4 SELECT; sin `db.batch`). Opcionalmente producción y finanzas pueden fundirse en un solo SELECT con dos subconsultas escalares (4 llamadas) sin cambiar el contrato. V1 hacía `1 + 2N + 3` consultas.

`?` posicionales repitiendo el bind (el adaptador `better-sqlite3` falló con `?1`/`?2`). `AHORA` = `ahora().toISOString()`.

```sql
-- 1) salud: ordenado por rowid (HIPÓTESIS del orden de V1, ver abajo)
SELECT a.id, a.codigo,
  julianday(?) - julianday(COALESCE(a.fecha_ultimo_control_salud, ?)) AS dias
FROM aves a
WHERE a.criadero_id = ? AND a.estado = 'ACTIVA' AND a.estado_salud = 'EN_TRATAMIENTO'
ORDER BY a.rowid ASC
-- binds: AHORA, AHORA, criaderoId

-- 2) jaulas activas con sus dos banderas en UNA consulta (sin bucle)
SELECT j.id, j.codigo,
  NOT EXISTS (SELECT 1 FROM alimentacion_jaula x
              WHERE x.criadero_id = j.criadero_id AND x.jaula_id = j.id
                AND date(x.fecha) = date(?)) AS sin_alimentacion,
  NOT EXISTS (SELECT 1 FROM bebida_jaula x
              WHERE x.criadero_id = j.criadero_id AND x.jaula_id = j.id
                AND date(x.fecha) = date(?)) AS sin_bebida
FROM jaulas j
WHERE j.criadero_id = ? AND j.activa = 1
ORDER BY j.rowid ASC
-- binds: AHORA, AHORA, criaderoId

-- 3) producción
SELECT COUNT(*) AS total FROM huevos WHERE criadero_id = ? AND date(fecha) = date(?)
-- binds: criaderoId, AHORA

-- 4) finanzas del mes UTC
SELECT
  COALESCE(SUM(CASE WHEN tipo='INGRESO' THEN valor ELSE 0 END), 0) AS ingresos,
  COALESCE(SUM(CASE WHEN tipo='EGRESO'  THEN valor ELSE 0 END), 0) AS egresos
FROM movimientos_financieros
WHERE criadero_id = ? AND strftime('%Y-%m', fecha) = strftime('%Y-%m', ?)
-- binds: criaderoId, AHORA
```

Ensamblado en el servicio (sin SQL): `salud` (filas con `Number(dias || 0) >= 7`, mensaje con `Math.floor(dias)`); por cada fila de jaulas en el orden recibido, primero la alerta de alimentación si `sin_alimentacion` y luego la de bebida si `sin_bebida`; producción si `total` es 0 (`Number(total || 0) === 0`); finanzas si `Number(egresos || 0) > Number(ingresos || 0)`. Resultado: `[...salud, ...jaulas, ...produccion, ...finanzas]`.

- **`NOT EXISTS` equivale a `COUNT(*) = 0`** de V1 (misma condición `date(fecha)=date(ahora)`); se mantiene `date(x.fecha)` sobre el texto (no un rango `fecha >= 'AAAA-MM-DD'`): `date()` convierte desplazamientos horarios a UTC y un rango de texto no lo haría. El índice `(jaula_id, fecha)` solo sirve para localizar las filas de la jaula; `date()` se evalúa sobre ellas.
- `criadero_id` en cada consulta y en las subconsultas (`x.criadero_id = j.criadero_id`).
- Jaulas inactivas (`activa = 0`) no generan alertas; D1 conserva `activa` (sin `deleted_at`), igual que V1.

### Orden (HIPÓTESIS verificable por la paridad; que el test decida)

- V1 no tiene `ORDER BY` en salud ni en jaulas. En la práctica SQLite devuelve las filas en orden de `rowid`/`id` (en V1, id creciente = orden de inserción), tanto con recorrido de tabla como con `idx_aves_estado(estado)` (las entradas de un mismo valor del índice van por `rowid`). Réplica propuesta: `ORDER BY a.rowid ASC` y `ORDER BY j.rowid ASC` (como `finanzas.repository.ts:126` y `reportes`). No se usa el UUID v7 (no es monótono dentro del mismo milisegundo).
- Dentro de cada jaula: alimentación y luego bebida (determinista en V1).
- **La lección de Reportes** (la paridad con el código real desmintió dos desempates "obvios") aplica aquí: el orden `rowid ASC` es una hipótesis. Si la paridad con `AlertasRepository.js` real sobre `better-sqlite3` muestra otro orden (p. ej. por código o por el índice usado en V1), el test manda y se corrige el `ORDER BY`. El orden en el SQLite de `expo-sqlite` del teléfono no se comprobó.
- Suma de dinero: V1 suma en el orden de su recorrido (sin índice de periodo) y D1 puede usar `ix_movimientos_criadero_fecha`; con tres o más `REAL` el orden de suma puede cambiar el último bit (riesgo solo en el borde `egresos = ingresos`, p. ej. `0.1 + 0.2` frente a `0.3`). Se cubre con casos de REAL difíciles en la paridad; las versiones de SQLite de D1 y de `expo-sqlite` pueden además sumar con distinto algoritmo (duda técnica D-3).

## Tabla D1

**Sin tabla ni columna nuevas.** Lee tablas de 0005, 0006, 0007, 0009 y 0010. Mapeo V1 → D1:

| Dato | V1 | D1 | Diferencia |
|---|---|---|---|
| `aves.estado`, `estado_salud`, `codigo`, `fecha_ultimo_control_salud` | TEXT | TEXT (`0006:19,32,35,36`) | ninguna |
| `aves.id`, `jaulas.id` (→ `entidadId`) | INTEGER | TEXT UUID v7 | E-1 |
| `jaulas.activa`, `jaulas.codigo` | INTEGER / TEXT | igual (`0005:16,21`) | ninguna |
| `alimentacion_jaula.fecha`, `bebida_jaula.fecha`, `huevos.fecha`, `movimientos_financieros.fecha` | TEXT ISO UTC | TEXT | ninguna |
| `movimientos_financieros.tipo`, `valor` | TEXT / REAL | igual | ninguna; sin redondeo |
| Todas | sin `criadero_id` | `criadero_id` | en cada consulta |

### Índices y migración

- **No hace falta migración** con las cifras previstas (la siguiente libre sigue siendo `0012`). Ya existen: `ix_jaulas_criadero_activa (criadero_id, activa)`, `ix_aves_criadero_estado (criadero_id, estado)`, `ix_alimentacion_jaula_jaula_fecha (jaula_id, fecha)`, `ix_bebida_jaula_jaula_fecha (jaula_id, fecha)`, `ix_huevos_criadero_fecha (criadero_id, fecha)` y `ix_movimientos_criadero_fecha (criadero_id, fecha)`.
- **Opcional (D-1)**: `0012` con `alimentacion_jaula(criadero_id, jaula_id, fecha)` y `bebida_jaula(criadero_id, jaula_id, fecha)`. Solo cambia el plan (evita el filtro por `criadero_id` tras localizar por `jaula_id`, redundante porque cada jaula pertenece a un solo criadero). No se crea salvo que la medición con datos grandes lo pida. Las consultas de huevos y movimientos recorren todas las filas del criadero (como Reportes) porque `date(fecha)`/`strftime` no permiten rango; riesgo de CPU con decenas de miles de filas sin medir en D1 real.

## Excepciones técnicas por pasar a online

- **E-1 IDs `TEXT` UUID v7**: `entidadId` pasa de entero a texto en las alertas de salud y de jaula; `null` en producción y finanzas (como V1).
- **E-2 `criadero_id`** en la ruta y en cada consulta y subconsulta; ownership 403.
- **E-3 Autenticación y errores de red**: el cliente propaga el `ApiError`.
- **E-4 Cálculo en el servidor** (decisión del usuario); reloj inyectable `ahora` (un solo instante por petición) en lugar de `'now'`/`CURRENT_TIMESTAMP`.
- **E-5 Orden explícito** (`rowid ASC` en salud y jaulas) que reproduce el orden observable de V1 (hipótesis a confirmar por la paridad) y una sola consulta de jaulas en lugar de `2N` (mismas alertas, mismo orden).
- Sin imágenes (R2 no aplica). Sin validaciones ni límites nuevos.

## Qué ve cada pantalla y si hay que modificarla

**Conclusión: no hay que modificar ninguna pantalla** (`git diff -- src/screens src/components` debe quedar vacío). La única pieza de la app que cambia es el cliente (`AlertasRepository.js` pasa a fachada y se añaden `.sqlite.js` y `.api.js`).

- `AlertasScreen.js` (Más → Alertas): `setLoading(true)` y `obtenerTodasLasAlertas()` en cada foco (183-193); `ActivityIndicator` mientras carga (259-281); filtros `TODAS/SALUD/JAULA/PRODUCCION/FINANZAS` en cliente por `item.tipo` (54-81, 203-219); resumen Críticas/Advertencias/Total del filtro actual (227-250, 431-478); lista de `AlertCard` con `key={index}` y texto "✅ No existen alertas." si está vacía (504-518). Navegación por `accionDestino` (566-678): `DETALLE_AVE` → `Aves/DetalleAve {aveId}`; `BEBIDA_JAULA` → `Jaulas/BebidaJaula {jaulaId}`; `ALIMENTACION_JAULA` → `Jaulas/AlimentacionJaula {jaulaId}`; `DETALLE_JAULA` → `Jaulas/DetalleJaula {jaulaId}` (rama inalcanzable, hallazgo 10).
- `AlertCard.js:55-86`: texto de acción según `accionDestino`: `BEBIDA_JAULA` "💧 Registrar bebida →", `ALIMENTACION_JAULA` "🍚 Registrar alimentación →", `DETALLE_AVE` "🐔 Revisar ave →", cualquier otro (incluido `null`, producción y finanzas) "Ver detalle →" (se pinta siempre porque la pantalla pasa `onPress`, 140-150); en producción y finanzas pulsar no navega (ninguna rama coincide). Color y ícono por `nivel` (`ALTO` rojo, resto amarillo).
- `InicioScreen.js:120-188`: `Promise.all([obtenerDashboard(), obtenerTodasLasAlertas(), obtenerResumenAlertas()])`; tarjeta "🔔 Alertas" con `resumenAlertas.criticas/advertencias/total` (687-718) y la lista de `AlertCard` con la misma navegación (737-853), o "✅ No existen alertas pendientes." (726-732).
- `MasMenuScreen.js:59-109, 238-242`: `obtenerResumenAlertas()` en cada foco; `AlertBadge` con `resumenAlertas.total` (no pinta nada con 0).

### Observaciones (V1, no se resuelven; decisión del usuario: sin excepciones a pantallas)

- **DUDA PARA EL USUARIO (errores de red, sin aviso):** `AlertasScreen.js:155-166`, `InicioScreen.js:173-180` y `MasMenuScreen.js:80-90` tienen un `catch` que solo hace `console.error`. En modo API, con error de red o sesión caducada: Alertas muestra "✅ No existen alertas." con contadores en 0 (`alertas` queda `[]`); Más muestra la insignia vacía; Inicio no actualiza `data`, `alertas` ni `resumenAlertas` (`Promise.all` rechaza entero, 143-151: tampoco se muestra el dashboard) y enseña "No existen alertas pendientes." y ceros. Es indistinguible de "no hay alertas", igual que Reportes/Clientes. Si se quiere un aviso, exige un cambio de pantalla; **no se hace** sin autorización.
- **Inicio sigue en SQLite** hasta su módulo: en modo API `obtenerDashboard()` lee el SQLite local mientras las alertas vienen de la API (misma mezcla ya existente en otros módulos); `Promise.all` falla entero si la API de alertas falla.
- `entidadId` UUID: ninguna pantalla lo convierte con `Number()`/`parseInt` (búsqueda en `AlertasScreen.js`, `InicioScreen.js:785-839` y las pantallas de destino `DetalleAveScreen`, `DetalleJaulaScreen`, `AlimentacionJaulaScreen`, `BebidaJaulaScreen`: los únicos `Number(` son `DetalleAveScreen.js:1185,1225` (valor numérico de un campo) y `DetalleJaulaScreen.js:546` (`cantidadAvesLiberadas`), no ids). Sin duda técnica para el id.

## Casos de paridad

Convenciones: reloj fijo `AHORA = 2026-11-05T15:00:00.000Z` en D1 y, en la copia de V1, el mismo valor entre comillas en lugar de `'now'` y de `CURRENT_TIMESTAMP` en el SQL que recibe el adaptador; `id` creciente por inserción; códigos `K001…`, `J01…`; criadero A salvo que se diga otro.

| id | dado | cuando | entonces |
|---|---|---|---|
| ALE-01 | Criadero sin datos | `obtenerTodasLasAlertas` | `[PRODUCCION]` (sin huevos hoy) y no `FINANZAS` (0 = 0, la comparación es estricta); resumen `{ total: 1, criticas: 0, advertencias: 1 }` |
| ALE-02 | Sin jaulas activas | todas | ninguna alerta `JAULA` |
| ALE-03 | Jaula activa sin alimentación ni bebida hoy | todas | dos alertas `JAULA`: primero `ALIMENTACION_JAULA`, luego `BEBIDA_JAULA`, `entidadId` = id de la jaula, `accion` `DETALLE_JAULA` |
| ALE-04 | Jaula activa con alimentación hoy pero sin bebida | todas | solo la alerta de bebida |
| ALE-05 | Jaula activa con alimentación y bebida hoy | todas | ninguna alerta de esa jaula |
| ALE-06 | Jaula inactiva (`activa = 0`) sin registros | todas | sin alertas de esa jaula |
| ALE-07 | Registros de alimentación/bebida de ayer UTC, de mañana, de otra jaula y de otro criadero | todas | no cuentan; la jaula sigue alertada |
| ALE-08 | Registro `2026-11-05T00:00:00.000Z`, `2026-11-05T23:59:59.999Z`, `2026-11-06T00:00:00.000Z` y `2026-11-04T23:59:59.999Z` | jaulas | los dos primeros cuentan como hoy; los otros no |
| ALE-09 | Registro con desplazamiento (`2026-11-05T22:00:00-05:00`) | jaulas | `date()` lo convierte a UTC (06-nov): no cuenta como hoy; igual que V1 |
| ALE-10 | Ave `ACTIVA` `EN_TRATAMIENTO` con control hace 8 días | salud | una alerta `SALUD`/`ALTO`, mensaje `El ave K001 lleva 8 días en tratamiento.`, `entidadId` = id del ave |
| ALE-11 | Control hace 7 días exactos a la misma hora, a otras horas del día y con milisegundos | salud | el resultado (alerta o no, y el número del mensaje) **coincide con V1**, porque ambos usan `julianday`; documentar el comportamiento con `6.999…` frente a `7.0…` |
| ALE-12 | Control hace 6 días 23 h 59 min 59 s | salud | sin alerta |
| ALE-13 | Control hace 7,9 días | salud | mensaje con `7` (`Math.floor`) |
| ALE-14 | `fecha_ultimo_control_salud NULL`; texto no interpretable; fecha futura | salud | sin alerta en los tres |
| ALE-15 | Fecha en formato V1 `YYYY-MM-DD HH:MM:SS` (de `CURRENT_TIMESTAMP`), ISO con `Z`, ISO con desplazamiento | salud | `dias` igual al de V1 en cada formato |
| ALE-16 | Ave `VENDIDA`/`FALLECIDA` en tratamiento prolongado | salud | sin alerta |
| ALE-17 | Ave `ACTIVA` con `ENFERMA`, `SANA`, `NULL` o `EN_TRATAMIENTO` reciente | salud | sin alerta |
| ALE-18 | Huevos hoy UTC de cualquier ave y estado | producción | sin alerta `PRODUCCION` |
| ALE-19 | Huevos solo de ayer o de otro criadero | producción | alerta `PRODUCCION`/`MEDIO`, `entidadId`, `accion` y `accionDestino` `null` (claves presentes) |
| ALE-20 | Egresos del mes > ingresos | finanzas | alerta `FINANZAS`/`ALTO`, textos exactos |
| ALE-21 | Egresos = ingresos (incluido `0 = 0`); egresos < ingresos | finanzas | sin alerta |
| ALE-22 | Solo egresos; solo ingresos; tipo distinto de `INGRESO`/`EGRESO` | finanzas | solo egresos → alerta; solo ingresos y otro tipo no suman |
| ALE-23 | Movimientos de otro mes UTC (`2026-10-31T23:59:59.999Z`, `2026-12-01T00:00:00.000Z`) y del `2026-11-01T00:00:00.000Z` | finanzas | solo cuenta el mes `2026-11` |
| ALE-24 | REAL difíciles (`0.1 + 0.2` frente a `0.3`, sumas de 3 o más valores, muchos movimientos) | finanzas | mismo resultado que V1 (D-3) |
| ALE-25 | Datos de las cuatro categorías a la vez, varias aves y jaulas insertadas en distinto orden | todas | array idéntico a V1 con `toStrictEqual`: salud, luego por jaula (alimentación y bebida), producción, finanzas; el `ORDER BY rowid` se confirma o se corrige aquí |
| ALE-26 | Aves en tratamiento y jaulas creadas intercaladas, con ids no consecutivos | todas | el orden coincide con V1 (id creciente en V1 = `rowid` en D1) |
| ALE-27 | Cualquier resultado | claves | `Object.keys` de cada alerta = `tipo, nivel, titulo, mensaje, entidadId, accion, accionDestino`; `entidadId` único campo que difiere (entero ↔ UUID, se normaliza por posición/tipo) |
| ALE-28 | Alertas de los tres niveles | `obtenerResumenAlertas` | `{ total, criticas (ALTO), advertencias (MEDIO) }` igual que V1 |
| ALE-29 | Dos criaderos/cuentas con datos y códigos repetidos | `GET /alertas` | cada uno ve solo lo suyo; criadero ajeno o inexistente → 403 |
| ALE-30 | 60 jaulas, 300 aves (30 en tratamiento), 2000 huevos, 2000 movimientos, 10 000 registros de alimentación y bebida | `GET /alertas` | mismo resultado que V1; **5 llamadas a D1** por petición (medidas con el adaptador) con pocos o muchos datos; tiempo y tamaño anotados |
| ALE-31 | Fallo de red/sesión | `AlertasScreen`, `InicioScreen`, `MasMenuScreen` | `console.error` y pantalla sin alertas, ceros y sin insignia (V1, ver observaciones) |
| ALE-32 | Petición que cruza la medianoche UTC | `GET /alertas` | un solo `ahora` por petición: las cuatro consultas usan el mismo día |

## Plan de pruebas

1. **Unitarias de service** con fake de repositorio: ensamblado y orden (`salud`, jaulas con alimentación antes que bebida, producción, finanzas), `Math.floor`, umbral `>= 7` sobre `dias`, `dias` `null`/negativo, `egresos > ingresos` estricto, `ahora` inyectado usado en todas las consultas, `[]` sin alertas.
2. **HTTP ligero** (`app.request()`): 401/403 (inexistente = 403), forma `{ success, data: { alertas } }`, claves y orden, `null` presentes.
3. **Integración D1** (`LocalD1Adapter`): SQL real con ALE-01 a ALE-30; **conteo de llamadas = 5** con el volumen de ALE-30 y con pocos datos; aislamiento (ALE-29); reloj fijo.
4. **Paridad con el código REAL de V1** (`api/test/integration/alertas.paridad-v1.d1.test.ts`, como `reportes.paridad-v1.d1.test.ts` y `clientes.paridad-v1.d1.test.ts`): cargar `src/repositories/AlertasRepository.sqlite.js` sin modificar sobre `better-sqlite3` en memoria con el esquema de V1; reloj fijo reemplazando `'now'` y `CURRENT_TIMESTAMP` en el SQL que recibe el adaptador; mismos datos en D1 local (más un segundo criadero) y `toStrictEqual` de `obtenerTodasLasAlertas` y `obtenerResumenAlertas` (y de las cuatro parciales contra el filtro por `tipo`). Única normalización: `entidadId`. Incluir datos pseudoaleatorios con varias semillas, relojes fijos en bordes (23:59:59.999 UTC, cambio de mes, 7 días exactos a distintas horas) y REAL difíciles. **El test decide el orden y cualquier desempate.**
5. **`/probar datos`**: caso nuevo `pruebas/datos/casos/16-alertas.mjs`: con los clientes REST reales crear jaulas, aves, diagnósticos (`SALUD`), alimentación, bebida, huevos y movimientos; llamar a `obtenerTodasLasAlertas` y `obtenerResumenAlertas` de `AlertasRepository.api.js`; comprobar claves, textos y orden. Reloj real: usar fechas **relativas a "ahora"** con margen para no cruzar la medianoche UTC (no ejecutar los casos de "hoy" entre las 23:55 y las 00:05 UTC, o fijar el margen y abortar con aviso) y, para el umbral de 7 días, un ave con control hace ~10 días (el control de salud lo fija la app al diagnosticar: el caso necesita enviar `fecha` pasada al registrar el diagnóstico) y otra reciente; segunda cuenta desechable para aislamiento y añadir `GET /alertas` a `05-aislamiento.mjs`.
6. **Pantalla (emulador, `/probar completo`)**: flujo nuevo (p. ej. `completo/99-alertas.yaml`): cuenta con una jaula sin cuidados y sin huevos: Más → Alertas muestra las dos de jaula ("Sin alimentación registrada" y "Sin bebida registrada" con "La jaula J01 no tiene … registrada hoy.") y "Sin producción registrada"; el resumen Críticas/Advertencias/Total y los filtros; la insignia de Más; pulsar la de alimentación abre "AlimentacionJaula" y la de bebida "BebidaJaula" (navegación con id UUID), y tras registrar el cuidado la alerta desaparece al volver. Una alerta de `SALUD` (ave con tratamiento de más de 7 días) solo con datos de la prueba de datos. Inicio: tarjeta "🔔 Alertas" con los mismos contadores. Cuenta vacía: "✅ No existen alertas." solo si hay huevos de hoy; en cuenta nueva siempre sale al menos Producción. Modo avión y sesión caducada: solo en teléfono.

## Implementación (prevista)

- API: `api/src/alertas/` (routes, factory con `ahora` inyectable, service, repository, types), montado en `app.ts`; sin migración.
- Cliente: `AlertasRepository.js` (fachada), `.sqlite.js` (V1 renombrado sin cambios) y `.api.js` (`obtenerTodasLasAlertas`, `obtenerResumenAlertas`).
- Nada de `src/screens/` ni `src/components/`.

## Pendientes y limitaciones

- Inicio sigue en SQLite hasta su módulo (`obtenerDashboard`); el aviso de red de las tres pantallas no existe (V1).
- "Hoy" y "mes" en UTC, como V1.
- Dos cuentas en el mismo teléfono: en modo API las alertas ya no comparten datos; Inicio sí comparte los contadores del SQLite hasta su módulo.
- Riesgo de CPU con decenas de miles de huevos o movimientos (sin medir en D1 real).

## Dudas

- **DUDA PARA EL USUARIO:** errores de red sin aviso en `AlertasScreen.js:155-166`, `InicioScreen.js:173-180` y `MasMenuScreen.js:80-90` (ver Observaciones). Se replica V1; un aviso exigiría una excepción de pantalla.
- D-1 (técnica): índices opcionales `(criadero_id, jaula_id, fecha)` en `alimentacion_jaula` y `bebida_jaula`; decidir tras medir con datos grandes.
- D-2 (técnica): el orden de salud y jaulas (`rowid ASC`) es una hipótesis; V1 no define orden y no se comprobó en el SQLite de `expo-sqlite` del teléfono.
- D-3 (técnica): precisión de punto flotante en el umbral de 7 días (`julianday`) y en la comparación `egresos > ingresos` con sumas en distinto orden o con distinto algoritmo de suma entre las versiones de SQLite de D1 y de `expo-sqlite`; se cubre con ALE-11 y ALE-24.
- D-4 (técnica): `entidadId` de la alerta de salud depende de `aves.id` y no distingue aves `VENDIDA`/`FALLECIDA` (no generan alerta); sin acción.
