# Spec: finanzas

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).

## Estado

borrador (revisado 2026-11-04 contra el código V1, rama `trabajo/migracion-nube`). Alcance: movimientos financieros manuales y de venta de aves individuales (sin lotes), sin sincronización offline, D1 como fuente de verdad. Las líneas son del árbol de V1 (v1.0.3, `app.json:5`). Nada se ejecutó: es lectura de código; el comportamiento de SQLite que se cita es el documentado del motor y se marca donde hay que verificarlo en una prueba.

Estado de D1 al redactar: `movimientos_financieros` y `bajas_ave` **ya existen** (migración `0010`, `api/migrations/0010_bajas.sql:24-84`); Bajas ya escribe las dos filas de cada venta (`api/src/aves/aves.repository.ts:246-291`). **Falta** solo `movimientos_financieros_historial` (migración `0011`) y la API/cliente de Finanzas.

## Fuente V1

- `src/repositories/FinanzasRepository.js` (completo, 811 líneas, **13 funciones públicas** + 4 privadas): `obtenerResumenFinanciero` 6-67, `obtenerMovimientosFinancieros` 70-97, `obtenerIngresos` 100-127, `obtenerEgresos` 130-157, `registrarIngreso` 160-175, `registrarEgreso` 178-193, `registrarMovimientoManual` (privada) 196-233, `obtenerMovimientoPorId` 236-256, `obtenerVentaPorBajaId` 259-289, `actualizarMovimientoManual` 292-400, `corregirVentaFinanciera` 403-490, `sincronizarMovimientoVenta` (privada) 493-616, `registrarAuditoria` (privada) 619-668, `obtenerHistorialMovimiento` 671-688, `obtenerConsolidadoCategorias` 691-718, `obtenerConsolidadoMensual` 721-760, `construirFiltroPeriodo` (privada) 763-778, `numeroNoNegativo` (privada) 781-811.
- Esquema V1: `src/database/migrations.js:320-343` (`movimientos_financieros`), `:364-365` (`idx_movimientos_fecha`); `src/database/migrationV6.js:20-40` (`movimientos_financieros_historial`), `:43-45` (`idx_mov_fin_hist_movimiento`), `:48-50` (`idx_movimientos_financieros_origen`), `:53-73` (ítem `ENVIO_AVE` del catálogo), `:76-106` (relleno de ventas antiguas; no aplica a V2, que empieza sin datos). `PRAGMA foreign_keys = ON` en `src/database/sqlite.js:63`.
- Pantallas (búsqueda sin límite de los 13 nombres en todo el repo excluido `documents/`, `node_modules` y `pruebas/informes`: **solo tres importadores**; fuera de ellas solo aparece la definición):
  - `src/screens/FinanzasScreen.js:19-24` (importa 4 funciones; llamadas `:100,104,106,110`). Registrada en `src/navigation/FinanzasStackNavigator.js:42`.
  - `src/screens/NuevoMovimientoFinancieroScreen.js:17-20` (llamadas `:156,163`).
  - `src/screens/EditarMovimientoFinancieroScreen.js:22-28` (llamadas `:70,112,124,218,280`).
- **Llamadores por función** (13):

| Función | Llamador | Se migra |
|---|---|---|
| `obtenerResumenFinanciero` | `FinanzasScreen.js:100` | sí |
| `obtenerMovimientosFinancieros` | `FinanzasScreen.js:104` | sí |
| `obtenerIngresos` | **ninguno** (solo definición `:100`) | **omitida** |
| `obtenerEgresos` | **ninguno** (solo definición `:130`) | **omitida** |
| `registrarIngreso` | `NuevoMovimientoFinancieroScreen.js:156` | sí |
| `registrarEgreso` | `NuevoMovimientoFinancieroScreen.js:163` | sí |
| `obtenerMovimientoPorId` | `EditarMovimientoFinancieroScreen.js:70` | sí |
| `obtenerVentaPorBajaId` | `EditarMovimientoFinancieroScreen.js:124` | sí |
| `actualizarMovimientoManual` | `EditarMovimientoFinancieroScreen.js:218` | sí |
| `corregirVentaFinanciera` | `EditarMovimientoFinancieroScreen.js:280` | sí |
| `obtenerHistorialMovimiento` | `EditarMovimientoFinancieroScreen.js:112` | sí |
| `obtenerConsolidadoCategorias` | `FinanzasScreen.js:106` | sí |
| `obtenerConsolidadoMensual` | `FinanzasScreen.js:110` (siempre `12`) | sí |

  `obtenerIngresos` y `obtenerEgresos` se **omiten** (sin llamadores; mismo criterio que `actualizarEstadoSaludAve` en Salud). Si se omiten, la fachada no las exporta; como nadie las importa, no cambia ningún comportamiento.
- Catálogo `CATEGORIAS_FINANCIERAS`: `ConfiguracionRepository` (`obtenerCatalogoPorCodigo`, `obtenerItemsCatalogo`, ya con fachada API; `catalogos.md`). D1 ya trae la plantilla de 8 ítems (`api/src/catalogs/defaultCatalogItems.ts:187-235`).
- Escritura de los dos ingresos de una venta de ave: **pertenece a Bajas** (V1: `src/repositories/BajaAveRepository.sqlite.js:275-353`, `registrarVentaAve`; V2: `api/src/aves/aves.repository.ts:246-291`; spec `bajas.md`). Aquí solo se anota la relación.

### Hallazgos clave

1. **`obtenerConsolidadoMensual` no es una ventana de 12 meses calendario**: agrupa los meses que **tienen** movimientos y devuelve hasta `limite` (12) de los más recientes. Los meses sin datos no aparecen.
2. **Zona horaria: todo en UTC.** Ninguna consulta de Finanzas usa `'localtime'` (los únicos `strftime`/`'now'` del archivo son `:731,753,769,773`). La `fecha` guardada es `new Date().toISOString()` (UTC con `Z`, `NuevoMovimientoFinancieroScreen.js:147-149`).
3. **Importes `REAL`**; las sumas se hacen en SQL (`SUM`); solo `utilidad = ingresos - egresos` y el `balance` mensual de la pantalla se calculan en JS.
4. **El alta manual no escribe historial.** El historial solo lo escriben `actualizarMovimientoManual` (`EDICION_MANUAL`) y `corregirVentaFinanciera` (`CORRECCION_VENTA`, `CORRECCION_ENVIO`, `CREACION_POR_CORRECCION`). Son los **cuatro** textos de `accion` que existen (búsqueda de `accion` y de `registrarAuditoria` en `src/`: solo `FinanzasRepository.js:373,474,484,531,613`).
5. Los movimientos con `origen_tipo` distinto de `MANUAL`/vacío no se editan con `actualizarMovimientoManual` (`MOVIMIENTO_AUTOMATICO_NO_EDITABLE`); se corrigen con `corregirVentaFinanciera`, que **sí modifica `bajas_ave.valor_venta`/`valor_envio`** (no toca `aves` ni `ave_historial`).
6. `corregirVentaFinanciera` **pisa `detalle`** de ambos movimientos (`Venta de ave ${ave_id}` / `Envío asociado a venta de ave ${ave_id}`), perdiendo el `a ${comprador}` de `registrarVentaAve`, y pone `fecha = bajas_ave.fecha`.
7. `numeroNoNegativo` de Finanzas (`:781-811`) **no es igual** a la de Bajas (`BajaAveRepository.sqlite.js`): la de Finanzas convierte vacío/`null`/`undefined` en `0` y cambia `,` por `.`; la de Bajas devuelve `null` en vacío.
8. `NuevoMovimientoFinancieroScreen` valida `!valor || Number(valor) <= 0` (`:116-119`): un texto no numérico como `'1,5'` **pasa** (`NaN <= 0` es `false`) y el repositorio hace `Number(valor)` → `NaN` (`:225`). Aunque `Number(valor)` ya se calculó en la pantalla (`:141-142`). Resultado de insertar `NaN` en SQLite no confirmado (duda técnica 2). Editar sí convierte la coma (`:197-201`).
9. Tras una venta, el `valor` del movimiento `ENVIO_AVE` se guarda `0` si `valor_envio` es `NULL` (`valorEnvioGuardar ?? 0`, `BajaAveRepository.sqlite.js:345`) mientras `bajas_ave.valor_envio` puede ser `NULL`.

## Contrato del repositorio

Fachada propuesta (como Salud y Huevos): `FinanzasRepository.js` elige entre `FinanzasRepository.sqlite.js` (código V1 intacto) y `FinanzasRepository.api.js` con `EXPO_PUBLIC_DATA_SOURCE=api`. El `.api.js` exporta **11 funciones** (las 13 menos `obtenerIngresos` y `obtenerEgresos`). Las claves devueltas son las de SQLite (snake_case: `ave_id`, `origen_tipo`, `ave_codigo`, `valor_anterior`…); la API viaja en camelCase y el cliente las vuelve a snake_case con `aSnake` (`src/api/avesApi.js:38`), como el resto de módulos. Las funciones son `async` y no reciben `criaderoId` (lo resuelve el cliente como el resto de módulos).

### Periodos y reloj (aplica a resumen y consolidado por categoría)

**SQL exacto** de `construirFiltroPeriodo(periodo, 'fecha')` (`:763-778`), devuelve texto SQL que se concatena antes de `GROUP BY`:

- `'MES'` → `WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')` (`:769`).
- `'ANIO'` → `WHERE strftime('%Y', fecha) = strftime('%Y', 'now')` (`:773`).
- Cualquier otro valor (`'TODO'` por defecto, `undefined`, `null`, minúsculas `'mes'`, desconocido) → `''` (sin filtro) (`:776`). La comparación del argumento es estricta (`===`), distingue mayúsculas.

**Cómo se compara.** No es un rango de fechas: se calcula `strftime` sobre el texto `fecha` y se compara por **igualdad de texto** con el `strftime` de `'now'`. No hay `>=`, `<`, `BETWEEN` ni `date()`. `fecha` es texto ISO `YYYY-MM-DDTHH:mm:ss.sssZ` (UTC); SQLite lo interpreta como instante UTC (la `Z` y la fracción son formatos de hora admitidos por las funciones de fecha de SQLite; comportamiento documentado del motor, no ejecutado aquí) y `'now'` es la hora UTC actual. No existe `'localtime'`.

**Qué entra y qué no** (reloj `ahora` fijado; todo UTC):

| `fecha` del movimiento | `ahora` | MES | ANIO |
|---|---|---|---|
| `2026-10-31T23:59:59.999Z` | `2026-10-31T23:59:59.999Z` | entra (`2026-10` = `2026-10`) | entra |
| `2026-10-31T23:59:59.999Z` | `2026-11-01T00:00:00.000Z` | **no** (`2026-10` ≠ `2026-11`) | entra |
| `2026-11-01T00:00:00.000Z` | `2026-10-31T23:59:59.999Z` | **no** (fecha futura, otro mes) | entra |
| `2026-11-01T00:00:00.000Z` | `2026-11-01T00:00:00.000Z` | entra (medianoche UTC exacta pertenece al mes nuevo) | entra |
| `2026-12-31T23:59:59.999Z` | `2026-12-15T10:00:00.000Z` | entra | entra |
| `2027-01-01T00:00:00.000Z` | `2026-12-31T23:59:59.999Z` | **no** | **no** (`2027` ≠ `2026`) |
| `2026-12-31T23:59:59.999Z` | `2027-01-01T00:00:00.000Z` | **no** | **no** |
| `2028-02-29T12:00:00.000Z` (bisiesto) | `2028-02-01T00:00:00.000Z` | entra | entra |
| `2026-11-01T01:00:00.000Z` (= 20:00 del 31/oct en Ecuador, UTC-5) | `2026-10-31T23:00:00.000Z` | **no** (en UTC ya es noviembre) | entra |
| texto no interpretable (p. ej. `'abc'`) | cualquiera | **no** (`strftime` da `NULL`; `NULL = x` no es verdadero) | **no** |

- La pantalla **muestra** la fecha en hora local (`FinanzasScreen.js:768-772`, `new Date(item.fecha).toLocaleString()`) pero el filtro y los totales son UTC. Consecuencia visible que se replica: un movimiento creado a las 20:00 del último día del mes en Ecuador cuenta para "Este mes" del mes siguiente.
- **Dependen del reloj**: `obtenerResumenFinanciero` y `obtenerConsolidadoCategorias` con `'MES'`/`'ANIO'`; `registrarIngreso`/`registrarEgreso` cuando falta `fecha` (`:224`). **No dependen del reloj**: el resto, y ambos con `'TODO'`.
- La pantalla usa `'MES'` por defecto (`FinanzasScreen.js:69-72`) y recarga al cambiar de periodo (`:157-170`, dependencia `[periodo]`). El consolidado por categoría usa el mismo `periodo` que el resumen; **la lista de movimientos y "Últimos meses" no se filtran por periodo** (`:104,110-112`).
- **V2**: el servicio inyecta `ahora: () => Date` y el SQL usa `strftime('%Y-%m', ?)` / `strftime('%Y', ?)` con `ahora().toISOString()` en lugar de `'now'` (mismo resultado en UTC; permite fijar el reloj en pruebas, como `huevos.md`). Sin parámetro público de reloj.

### `obtenerResumenFinanciero(periodo = 'TODO')` (`:6-67`)

- SQL (`:21-47`; `${filtroFecha}` es la cláusula anterior, sin `GROUP BY`, por lo que **siempre devuelve una fila**):
  ```sql
  SELECT
    COALESCE(SUM(CASE WHEN tipo = 'INGRESO' THEN valor ELSE 0 END), 0) AS ingresos,
    COALESCE(SUM(CASE WHEN tipo = 'EGRESO'  THEN valor ELSE 0 END), 0) AS egresos
  FROM movimientos_financieros
  ${filtroFecha}
  ```
- Devuelve `{ ingresos: number, egresos: number, utilidad: number }`: `ingresos = Number(resultado?.ingresos || 0)`, `egresos = Number(resultado?.egresos || 0)`, `utilidad = ingresos - egresos` (resta en JS, `:50-65`). Sin redondeo. `valor` es `NOT NULL`, así que no hay `NULL` que sumar; un `tipo` distinto de `INGRESO`/`EGRESO` no suma a nada. Sin movimientos: `{ 0, 0, 0 }`. Los egresos van positivos (el signo lo da `tipo`). Sin errores propios.
- Consumo: `FinanzasScreen.js:100-102`; muestra `$` + `Number(value||0).toFixed(2)` (`:396-399,966-968`). Estado inicial `{0,0,0}` (`:35-42`).
- Sin JOIN con catálogos.

### `obtenerMovimientosFinancieros()` (`:70-97`)

- SQL: `SELECT mf.id, mf.tipo, mf.categoria, mf.fecha, mf.valor, mf.detalle, mf.ave_id, mf.origen_tipo, mf.origen_id, a.codigo AS ave_codigo FROM movimientos_financieros mf LEFT JOIN aves a ON a.id = mf.ave_id ORDER BY mf.fecha DESC, mf.id DESC`.
- Sin parámetros, **sin límite ni paginación**. Devuelve arreglo de `{ id, tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id, ave_codigo }`; `categoria`, `detalle`, `ave_id`, `origen_tipo`, `origen_id`, `ave_codigo` pueden ser `null`. `valor` número.
- Orden: `fecha` texto descendente y desempate `id DESC` (el insertado después primero; p. ej. `ENVIO_AVE` antes que `VENTA_AVE` de la misma venta, por insertarse después, `BajaAveRepository.sqlite.js:275-353`). En D1 el `id` es UUID v7: desempatar por `mf.rowid DESC`.
- Consumo: `FinanzasScreen.js:104`; el filtro Todos/Ingresos/Egresos se hace **en la pantalla** (`:213-221`). Cada fila navega con `movimientoId: item.id` (`:744-751`); badge `🔗 Venta` si `origen_tipo === 'VENTA_AVE'` (`:780`); `Ave: {ave_codigo}` si existe (`:832-841`); `item.detalle || 'Sin detalle'` (`:858-860`).

### `obtenerIngresos()` / `obtenerEgresos()` (`:100-127`, `:130-157`) — sin llamadores, omitidas

- Mismo SQL que el anterior con `WHERE mf.tipo = 'INGRESO'` / `'EGRESO'` y **sin** la columna `tipo` en el `SELECT`. Documentadas solo para dejar constancia; no tienen endpoint ni función en el cliente (ver Endpoints).

### `registrarIngreso({ categoria, valor, detalle, fecha })` / `registrarEgreso(...)` (`:160-193`)

- Delegan en `registrarMovimientoManual({ tipo: 'INGRESO' | 'EGRESO', categoria, valor, detalle, fecha })` (`:196-233`). **Sin validación y sin transacción** (una sola escritura).
- SQL: `INSERT INTO movimientos_financieros (tipo, categoria, fecha, valor, detalle, origen_tipo) VALUES (?, ?, ?, ?, ?, ?)` con `[tipo, categoria || 'OTRO', fecha || new Date().toISOString(), Number(valor), detalle || null, 'MANUAL']` (`:210-229`). `ave_id` y `origen_id` quedan `NULL`; `fecha_creacion` por defecto.
- Devuelve `result.lastInsertRowId` (número, `:231`). Las pantallas lo ignoran (`NuevoMovimientoFinancieroScreen.js:156-167`). **No escribe `movimientos_financieros_historial`.** Sin errores de dominio.
- Consumo (`guardar`, `NuevoMovimientoFinancieroScreen.js:100-198`):
  - Sin categoría → `Alert.alert('Categoría requerida', 'Seleccione una categoría.')` (`:104-113`).
  - `!valor || Number(valor) <= 0` → `Alert.alert('Valor inválido', 'Ingrese un valor mayor a cero.')` (`:116-128`).
  - Argumentos: `categoria: categoria.codigo`, `valor: Number(valor)`, `detalle: detalle.trim()`, `fecha: new Date().toISOString()` (`:136-151`; no envía `tipo`, la función elegida lo fija).
  - Éxito: `Alert.alert('Movimiento guardado', 'El movimiento financiero fue registrado correctamente.', [{ text: 'Aceptar', onPress: () => navigation.goBack() }])` (`:170-180`).
  - Error: **solo `console.error('Error guardando movimiento:', error)`** (`:184-191`), sin mensaje; `finally` apaga `guardando` (`:192-196`). El botón tiene `disabled={guardando}` (`:369`).
- Categorías ofrecidas (`:202-228`): INGRESO `['VENTA_AVE','VENTA_HUEVOS','OTRO']`, EGRESO `['ALIMENTO','MEDICAMENTO','INFRAESTRUCTURA','COMPRA_AVE','OTRO']`; al cambiar de tipo `categoria` vuelve a `null` (`:68-72`). `ENVIO_AVE` no se ofrece al crear.

### `obtenerMovimientoPorId(id)` (`:236-256`)

- SQL: `SELECT mf.*, a.codigo AS ave_codigo FROM movimientos_financieros mf LEFT JOIN aves a ON a.id = mf.ave_id WHERE mf.id = ?`. Fila (`getFirstAsync`) o `null`, sin error. Claves: `id, tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id, fecha_creacion, ave_codigo`.
- Consumo: `EditarMovimientoFinancieroScreen.js:69-77`; si `!mov` → `setMovimiento(null)` y `return` (el `finally` apaga `loading`) y la pantalla muestra `Movimiento no encontrado.` (`:324-332`).

### `obtenerVentaPorBajaId(bajaId)` (`:259-289`)

- SQL: `SELECT b.id, b.ave_id, b.fecha, b.celular, b.comprador, b.ciudad_destino, b.cooperativa_envio, b.valor_venta, b.valor_envio, b.detalle, a.codigo AS ave_codigo FROM bajas_ave b INNER JOIN aves a ON a.id = b.ave_id WHERE b.id = ? AND b.tipo = 'VENTA'`. Fila o `null` (sin error). `valor_venta`/`valor_envio` pueden ser `null`.
- Consumo: solo si `mov.origen_tipo === 'VENTA_AVE' && mov.origen_id` (`EditarMovimientoFinancieroScreen.js:118-139`) con `mov.origen_id` como `bajaId`. Rellena `valorVenta = String(venta?.valor_venta ?? 0)` y `valorEnvio = String(venta?.valor_envio ?? 0)` (`:129-137`). Muestra `Cliente`, `Celular`, `Destino` con `|| 'No registrado'` (`:422-428`) y el origen `Venta de ave ${venta?.ave_codigo || movimiento.ave_codigo || ''}` (`:380`).

### `obtenerHistorialMovimiento(movimientoId)` (`:671-688`)

- SQL: `SELECT * FROM movimientos_financieros_historial WHERE movimiento_id = ? ORDER BY fecha DESC, id DESC`. Arreglo (vacío si no hay historial o el movimiento no existe, sin error). Sin límite.
- Claves de cada fila (todas las columnas): `id, movimiento_id, fecha, accion, tipo_anterior, tipo_nuevo, categoria_anterior, categoria_nueva, fecha_movimiento_anterior, fecha_movimiento_nueva, valor_anterior, valor_nuevo, detalle_anterior, detalle_nuevo, origen_tipo, origen_id`.
- Consumo (`EditarMovimientoFinancieroScreen.js:547-583`): `item.accion` **crudo** (`:564`), `new Date(item.fecha).toLocaleString()` (`:567`), `Valor: {formatoDinero(valor_anterior)} → {formatoDinero(valor_nuevo)}` (`:570`) y, solo si `categoria_anterior !== categoria_nueva`, `Categoría: {categoria_anterior || '-'} → {categoria_nueva || '-'}` (`:573-577`). `formatoDinero`: `'-'` para `null`/`undefined`/no finito, si no `$` + `toFixed(2)` (`:600-605`). Sin filas: `Este movimiento todavía no tiene correcciones registradas.` (`:554-556`). `fecha_movimiento_*`, `detalle_*`, `tipo_*` y `origen_*` se leen pero **no se muestran**.

### `actualizarMovimientoManual({ id, tipo, categoria, valor, detalle, fecha })` (`:292-400`)

Devuelve `undefined`. Todo dentro de `db.withTransactionAsync` (`:304`), en este orden:

1. `SELECT * FROM movimientos_financieros WHERE id = ?` (`:307-315`). Si no existe → `throw new Error('MOVIMIENTO_NO_ENCONTRADO')` (`:317-321`).
2. Si `anterior.origen_tipo` es verdadero **y** distinto de `'MANUAL'` → `throw new Error('MOVIMIENTO_AUTOMATICO_NO_EDITABLE')` (`:323-331`). Se editan solo los de `origen_tipo = 'MANUAL'` o `NULL`/vacío.
3. `nuevoValor = Number(valor)`; si `!Number.isFinite(nuevoValor) || nuevoValor <= 0` → `throw new Error('VALOR_INVALIDO')` (`:333-344`). Se evalúa **después** de los otros dos. `Number(null)` y `Number('')` dan `0` → inválido; `Number('12,5')` da `NaN` → inválido.
4. Normalización (`:346-361`): `nuevaFecha = fecha || anterior.fecha`; `nuevoDetalle = detalle?.trim() || null` (si `detalle` no es texto, `.trim` lanza `TypeError`); `nuevaCategoria = categoria || 'OTRO'`; `nuevoTipo = tipo === 'EGRESO' ? 'EGRESO' : 'INGRESO'`.
5. `registrarAuditoria(db, anterior, { tipo: nuevoTipo, categoria: nuevaCategoria, fecha: nuevaFecha, valor: nuevoValor, detalle: nuevoDetalle }, 'EDICION_MANUAL')` (`:363-374`): se escribe **antes** del `UPDATE` y aunque no cambie nada.
6. `UPDATE movimientos_financieros SET tipo = ?, categoria = ?, fecha = ?, valor = ?, detalle = ? WHERE id = ?` con `[nuevoTipo, nuevaCategoria, nuevaFecha, nuevoValor, nuevoDetalle, id]` (`:376-395`). No cambia `ave_id`, `origen_tipo`, `origen_id` ni `fecha_creacion`.

Transacción: historial y `UPDATE` atómicos; cualquier error revierte todo y se propaga. Sin comprobación de ave ni de categoría contra el catálogo.

Consumo (`guardarManual`, `EditarMovimientoFinancieroScreen.js:187-250`): sin categoría → `Alert('Categoría requerida', 'Seleccione una categoría.')` (`:189-195`); `Number(String(valor).replace(',', '.'))` no finito o `<= 0` → `Alert('Valor inválido', 'Ingrese un valor mayor a cero.')` (`:197-213`). Llama con `{ id: movimiento.id, tipo, categoria: categoria.codigo, valor: valorNumero, detalle: detalle.trim(), fecha: movimiento.fecha }` (la fecha original siempre; nunca se edita). Éxito: `Alert('Movimiento actualizado', 'Los cambios fueron guardados y quedaron registrados en el historial de correcciones.', [Aceptar → goBack])` (`:227-237`). **Cualquier** error (también `MOVIMIENTO_NO_ENCONTRADO`, `MOVIMIENTO_AUTOMATICO_NO_EDITABLE`, `VALOR_INVALIDO`): `console.error(error)` + `Alert('Error', 'No fue posible actualizar el movimiento.')` (`:239-245`); no distingue el código. Categorías al editar: INGRESO `['VENTA_AVE','ENVIO_AVE','VENTA_HUEVOS','OTRO']`, EGRESO como al crear (`:341-359`).

Qué ve la pantalla según el origen (`:335-338`, `:389-544`): `automaticoVenta = movimiento.origen_tipo === 'VENTA_AVE' && !!venta` → formulario "Corregir venta" (valor del ave y de envío); si no, formulario manual. **Caso borde**: un movimiento `VENTA_AVE` cuya baja no se encuentra (`venta` null) muestra el formulario manual y al guardar recibe `MOVIMIENTO_AUTOMATICO_NO_EDITABLE` → `Alert` genérico.

### `corregirVentaFinanciera({ bajaId, valorVenta, valorEnvio })` (`:403-490`)

Devuelve `undefined`. Orden exacto:

1. **Fuera de la transacción**: `valorAve = numeroNoNegativo(valorVenta)` y `valorTransporte = numeroNoNegativo(valorEnvio)` (`:412-420`). `numeroNoNegativo` (`:781-811`): `null`/`undefined`/texto vacío tras `trim` → `0`; si no, `Number(String(valor).replace(',', '.'))`; no finito o `< 0` → `null`. Si cualquiera es `null` → `throw new Error('VALOR_INVALIDO')` (`:422-430`). `0` es válido (a diferencia de `actualizarMovimientoManual`). El valor puede llegar como número o texto.
2. Transacción `withTransactionAsync` (`:432`):
   1. `SELECT * FROM bajas_ave WHERE id = ? AND tipo = 'VENTA'` (`:435-444`); si no existe → `throw new Error('VENTA_NO_ENCONTRADA')` (`:446-450`).
   2. `UPDATE bajas_ave SET valor_venta = ?, valor_envio = ? WHERE id = ?` con `[valorAve, valorTransporte, bajaId]` (`:452-465`). Única escritura sobre `bajas_ave`; no toca `aves` ni `ave_historial`.
   3. `sincronizarMovimientoVenta({ db, venta, categoria: 'VENTA_AVE', valor: valorAve, detalle: `Venta de ave ${venta.ave_id}`, accion: 'CORRECCION_VENTA' })` (`:467-475`).
   4. `sincronizarMovimientoVenta({ ..., categoria: 'ENVIO_AVE', valor: valorTransporte, detalle: `Envío asociado a venta de ave ${venta.ave_id}`, accion: 'CORRECCION_ENVIO' })` (`:477-485`).

`sincronizarMovimientoVenta` (`:493-616`):
- Busca el existente: `SELECT * FROM movimientos_financieros WHERE origen_tipo = 'VENTA_AVE' AND origen_id = ? AND categoria = ? ORDER BY id LIMIT 1` con `[venta.id, categoria]` (`:502-517`).
- **Si existe** (`:519-561`): primero `registrarAuditoria(db, existente, { tipo: 'INGRESO', categoria, fecha: venta.fecha, valor, detalle }, accion)` y luego `UPDATE movimientos_financieros SET tipo = 'INGRESO', categoria = ?, fecha = ?, valor = ?, detalle = ?, ave_id = ?, origen_tipo = 'VENTA_AVE', origen_id = ? WHERE id = ?` con `[categoria, venta.fecha, valor, detalle, venta.ave_id, venta.id, existente.id]`. Historial siempre, aunque el valor no cambie.
- **Si no existe** (`:563-614`): **primero** `INSERT INTO movimientos_financieros (tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id) VALUES ('INGRESO', ?, ?, ?, ?, ?, 'VENTA_AVE', ?)` con `[categoria, venta.fecha, valor, detalle, venta.ave_id, venta.id]`; lee la fila creada y **después** escribe historial con `anterior = { id, tipo: null, categoria: null, fecha: null, valor: null, detalle: null, origen_tipo, origen_id }`, `nuevo = creado` y `accion = 'CREACION_POR_CORRECCION'`. Se crea aunque el valor sea `0`.

Consumo (`guardarVenta`, `EditarMovimientoFinancieroScreen.js:253-309`): `parseNoNegativo` propio de la pantalla (`:591-597`, igual semántica: vacío → `0`, coma → punto, `null` si negativo/no finito); si cualquiera es `null` → `Alert('Valor inválido', 'El valor del ave y el valor de envío deben ser números mayores o iguales a cero.')` (`:265-275`), sin llamar. Llama con `{ bajaId: venta.id, valorVenta: ventaNumero, valorEnvio: envioNumero }` (números). Éxito: `Alert('Venta corregida', 'Se actualizaron la venta y sus movimientos financieros relacionados.', [Aceptar → goBack])` (`:286-296`). Cualquier error: `console.error(error)` + `Alert('Error', 'No fue posible corregir la venta.')` (`:298-304`); no distingue `VALOR_INVALIDO` ni `VENTA_NO_ENCONTRADA`.

### Auditoría: `registrarAuditoria(db, anterior, nuevo, accion)` (`:619-668`)

`INSERT INTO movimientos_financieros_historial (movimiento_id, fecha, accion, tipo_anterior, tipo_nuevo, categoria_anterior, categoria_nueva, fecha_movimiento_anterior, fecha_movimiento_nueva, valor_anterior, valor_nuevo, detalle_anterior, detalle_nuevo, origen_tipo, origen_id) VALUES (?×15)` con `[anterior.id, new Date().toISOString(), accion, anterior.tipo ?? null, nuevo.tipo ?? null, anterior.categoria ?? null, nuevo.categoria ?? null, anterior.fecha ?? null, nuevo.fecha ?? null, anterior.valor ?? null, nuevo.valor ?? null, anterior.detalle ?? null, nuevo.detalle ?? null, anterior.origen_tipo ?? null, anterior.origen_id ?? null]` (`:626-666`). `fecha` = instante de la corrección (reloj del dispositivo en V1). `origen_tipo`/`origen_id` salen **siempre de `anterior`**. 15 columnas escritas; `id` automático (V1 no tiene `fecha_creacion` en esta tabla).

| `accion` (texto exacto) | Cuándo (línea del argumento) | Filas | Anterior | Nuevo |
|---|---|---|---|---|
| `EDICION_MANUAL` | `actualizarMovimientoManual` (`:373`), antes del `UPDATE` | 1 | fila actual | `nuevoTipo, nuevaCategoria, nuevaFecha, nuevoValor, nuevoDetalle` |
| `CORRECCION_VENTA` | `corregirVentaFinanciera`, movimiento `VENTA_AVE` existente (`:474`), antes del `UPDATE` | 1 | fila actual | `INGRESO`, `VENTA_AVE`, `venta.fecha`, `valor`, `Venta de ave ${ave_id}` |
| `CORRECCION_ENVIO` | idem, movimiento `ENVIO_AVE` existente (`:484`), antes del `UPDATE` | 1 | fila actual | `INGRESO`, `ENVIO_AVE`, `venta.fecha`, `valor`, `Envío asociado a venta de ave ${ave_id}` |
| `CREACION_POR_CORRECCION` | idem, el movimiento no existía (`:613`), **después** del `INSERT` | 1 | todo `NULL` salvo `id` (= `movimiento_id`), `origen_tipo`, `origen_id` | la fila creada (`tipo INGRESO`, categoría, `fecha`, `valor`, `detalle`) |

- No se escribe historial en el alta manual ni en `registrarVentaAve` (Bajas). No existen otros textos de `accion`.
- Una corrección de venta escribe **2 filas** de historial (una por movimiento), cada una con su `movimiento_id`; se consulta por `movimiento_id`, no por venta. Si falta el movimiento de envío: 1 fila `CORRECCION_VENTA` + 1 `CREACION_POR_CORRECCION`.
- La pantalla muestra la acción tal cual, así que el texto de las cuatro es contrato.

### `obtenerConsolidadoCategorias(periodo = 'TODO')` (`:691-718`)

- SQL (`:704-715`):
  ```sql
  SELECT tipo, COALESCE(categoria, 'OTRO') AS categoria, COUNT(*) AS cantidad, COALESCE(SUM(valor), 0) AS total
  FROM movimientos_financieros
  ${filtroFecha}
  GROUP BY tipo, COALESCE(categoria, 'OTRO')
  ORDER BY tipo DESC, total DESC
  ```
- Devuelve arreglo de `{ tipo, categoria, cantidad, total }` (`cantidad` entero, `total` REAL sin redondeo). Sin JOIN con catálogos (el nombre visible lo resuelve la pantalla). `categoria NULL` se agrupa y se devuelve como `'OTRO'` (y se fusiona con las filas cuya categoría ya es `'OTRO'`). `ORDER BY tipo DESC`: `INGRESO` antes de `EGRESO`; dentro de cada tipo, `total` descendente (empates sin desempate). Incluye cualquier `tipo`. Sin límite. Sin movimientos: `[]`.
- Consumo: `FinanzasScreen.js:106-108`; la pantalla filtra por `tipo` (`:224-235`) y muestra `nombreCategoria(item.categoria)` (`:1030-1071`: `VENTA_AVE` 'Venta de aves', `ENVIO_AVE` 'Envíos de aves', `VENTA_HUEVOS` 'Venta de huevos', `ALIMENTO` 'Alimento', `MEDICAMENTO` 'Medicamentos', `INFRAESTRUCTURA` 'Infraestructura', `COMPRA_AVE` 'Compra de aves', `OTRO` 'Otros'; otro código → el propio código; vacío → 'Otro'). Vacíos: `Sin ingresos en el período.` / `Sin egresos en el período.` (`:441,491`).

### `obtenerConsolidadoMensual(limite = 12)` (`:721-760`)

- SQL (`:730-756`):
  ```sql
  SELECT strftime('%Y-%m', fecha) AS periodo,
    COALESCE(SUM(CASE WHEN tipo='INGRESO' THEN valor ELSE 0 END), 0) AS ingresos,
    COALESCE(SUM(CASE WHEN tipo='EGRESO'  THEN valor ELSE 0 END), 0) AS egresos
  FROM movimientos_financieros
  GROUP BY strftime('%Y-%m', fecha)
  ORDER BY periodo DESC
  LIMIT ?
  ```
  con parámetro `[Number(limite) || 12]` (`:757`): `0`, `NaN`, `undefined` → `12`. Un valor negativo (p. ej. `-1`) pasa tal cual y en SQLite un `LIMIT` negativo significa sin límite (comportamiento documentado del motor, no verificado aquí; la pantalla siempre envía `12`). Un no entero (p. ej. `2.5`) no está especificado (duda técnica 6).
- **Ventana**: sin filtro de fecha ni calendario de 12 meses. Son los **hasta `limite` meses más recientes que tengan al menos un movimiento**, del más reciente al más antiguo (`ORDER BY periodo DESC`, texto `'YYYY-MM'`). **Los meses sin datos no aparecen** (no se rellenan con ceros); entran los meses futuros si hay movimientos con fecha futura; los más antiguos que el duodécimo se descartan. Una `fecha` no interpretable agrupa bajo `periodo = NULL`, que con `DESC` queda al final. **No depende del reloj.**
- Devuelve arreglo de `{ periodo: 'YYYY-MM' (UTC), ingresos, egresos }` (REAL, sin redondeo). Un mes con solo movimientos de otro `tipo` aparece con `0` y `0`.
- Consumo: `FinanzasScreen.js:110-112` (`12`); `balance = Number(item.ingresos||0) - Number(item.egresos||0)` **en JS** (`:582-589`), muestra `{periodo}` y `+$x.xx`/`-$x.xx` (`Math.abs(balance).toFixed(2)`, `:639`; `balance >= 0` → `+`); vacío: `Sin datos mensuales.` (`:575`).

### Importes: tipo y sumas

- V1 guarda `valor REAL` (`migrations.js:329`, `migrationV6.js:32-33`). Las sumas son `SUM` en SQL; `utilidad` y `balance` son restas en JS con `Number`. Las pantallas muestran `Number(x).toFixed(2)` (`FinanzasScreen.js:396-399,639-641,899-901,966-968,1015-1018`; `EditarMovimientoFinancieroScreen.js:604`), de modo que el redondeo es solo de presentación.
- **V2**: número JSON (nunca string ni céntimos); columna `REAL`; el servidor no redondea ni vuelve a parsear; sumas con el mismo `SUM(CASE …)` en SQL y la resta en JS en el servicio; el cliente devuelve `Number(...)`. `JSON.stringify` de un double devuelve la representación más corta que reproduce el mismo double, así que `0.1`, `19.99` y `1234567.89` hacen ida y vuelta idénticos.
- Ejemplos JS que se mantienen: `0.1 + 0.2 = 0.30000000000000004` (visible `$0.30`); `0.3 - 0.1 = 0.19999999999999998` (visible `$0.20`).
- Posible diferencia de 1e-16 por el algoritmo de `SUM` de reales entre SQLite de `expo-sqlite` y el de D1 (suma compensada en SQLite ≥ 3.43): duda técnica 3; verificar en la prueba de datos.

## Consumo desde las pantallas: estados de carga y errores

| Pantalla | Funciones que llama | Carga / estado | `try/catch` | Texto literal de `Alert` |
|---|---|---|---|---|
| `FinanzasScreen` | las 4 lecturas (`Promise.all`, `:92-114`) al enfocar y al cambiar `periodo` (`:157-170`) | `ActivityIndicator` + `Cargando finanzas...` mientras `loading` (`:174-205`) | `cargar` **sí** (`:85-151`), pero el `catch` solo hace `console.error('Error cargando finanzas:', error)` (`:137-144`); `finally` apaga `loading`. **No importa `Alert`** (búsqueda en el archivo: 0 coincidencias). Si falla una de las cuatro llamadas, no se ejecuta ningún `setX`: la pantalla queda con el estado previo (ceros y listas vacías en la primera carga) y sin aviso | ninguno |
| `NuevoMovimientoFinancieroScreen` | `obtenerCatalogoPorCodigo`, `obtenerItemsCatalogo` (`cargarCategorias`, `:76-96`), `registrarIngreso`/`registrarEgreso` (`:156,163`) | sin spinner; `disabled={guardando}` (`:369`) | `guardar` **sí** (`:131-197`), el `catch` solo `console.error('Error guardando movimiento:', error)` (`:184-191`). **`cargarCategorias` no tiene `try/catch`** y se llama sin `await` desde `useEffect` (`:60-64`): un fallo es una promesa rechazada sin manejar y la lista de categorías queda vacía | `Categoría requerida` / `Seleccione una categoría.`; `Valor inválido` / `Ingrese un valor mayor a cero.`; `Movimiento guardado` / `El movimiento financiero fue registrado correctamente.` |
| `EditarMovimientoFinancieroScreen` | `obtenerMovimientoPorId` (`:70`), catálogo (`:85-95`), `obtenerHistorialMovimiento` (`:112`), `obtenerVentaPorBajaId` (`:124`), `actualizarMovimientoManual` (`:218`), `corregirVentaFinanciera` (`:280`) | `ActivityIndicator` mientras `loading` (`:312-321`); `disabled={guardando}` y texto `Guardando...` (`:435,536`) | `cargar` **sí** (`:65-158`), `guardarManual` **sí** (`:215-249`), `guardarVenta` **sí** (`:277-308`); todos con `console.error` + `Alert` | `Error` / `No fue posible cargar el movimiento.`; `Categoría requerida` / `Seleccione una categoría.`; `Valor inválido` / `Ingrese un valor mayor a cero.`; `Movimiento actualizado` / `Los cambios fueron guardados y quedaron registrados en el historial de correcciones.`; `Error` / `No fue posible actualizar el movimiento.`; `Valor inválido` / `El valor del ave y el valor de envío deben ser números mayores o iguales a cero.`; `Venta corregida` / `Se actualizaron la venta y sus movimientos financieros relacionados.`; `Error` / `No fue posible corregir la venta.` |

- Si `cargar` falla en Editar, tras el `Alert` la pantalla queda con `movimiento = null` y muestra `Movimiento no encontrado.` (`:324-332`).
- **Ausencias de manejo de errores de red** (evidencia de arriba; la decisión de tratarlas como excepción es del usuario, ver DUDA PARA EL USUARIO 2): (a) `FinanzasScreen.cargar` (`catch` sin `Alert`); (b) `NuevoMovimientoFinancieroScreen.guardar` (`catch` sin `Alert`); (c) `NuevoMovimientoFinancieroScreen.cargarCategorias` (sin `try/catch`). `EditarMovimientoFinancieroScreen` no tiene ausencias.
- IDs: ninguna de las tres pantallas aplica `Number()`/`parseInt` a `id`, `origen_id` ni `ave_id` (revisadas completas); los `id` solo son `key`, parámetro de navegación `movimientoId` y comparaciones `categoria?.codigo === item.codigo`. No hace falta excepción por UUID.

## Catálogo `CATEGORIAS_FINANCIERAS`

- Nuevo y Editar lo leen con `obtenerCatalogoPorCodigo('CATEGORIAS_FINANCIERAS')` y `obtenerItemsCatalogo(catalogo.id)` (`NuevoMovimientoFinancieroScreen.js:76-96`; `EditarMovimientoFinancieroScreen.js:84-98`) y filtran por listas de **códigos fijos**; usan `item.id`, `item.codigo`, `item.nombre`. Lectura ya resuelta por `ConfiguracionRepository.api.js` (`catalogos.md`); Finanzas **no añade endpoint de catálogo**.
- D1 trae 8 ítems por criadero (`defaultCatalogItems.ts:187-235`): `VENTA_AVE`, `VENTA_HUEVOS`, `ALIMENTO`, `MEDICAMENTO`, `INFRAESTRUCTURA`, `COMPRA_AVE`, `OTRO`, `ENVIO_AVE`.
- Las categorías creadas por el usuario en Configuración (`ConfiguracionScreen.js:52`) nunca se ofrecen (lista filtrada por códigos); una categoría desconocida se muestra con su código en la lista (`FinanzasScreen.js:1063-1069`). Si al abrir Editar la categoría del movimiento no está en el catálogo cargado, la pantalla usa `{ id, codigo, nombre }` con el propio código (`:99-109`). El servidor **no valida** `categoria` contra el catálogo.

## Endpoints V2

Todos bajo `/api/v1/criaderos/:criaderoId/finanzas`, con ownership por criadero (`401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 CRIADERO_NOT_FOUND`) y respuesta `{ success: true, data }`. Los códigos de dominio de V1 se conservan en `error`; el cliente los traduce a `new Error('<CODIGO>')` (patrón `traducirErrorAve`/`huevosApi`). Sin validación nueva: solo la de V1 y la de tipos del cuerpo (ver excepciones). Un endpoint por función con llamadores (11):

| Función V1 | Endpoint | Request | Response `data` | Errores |
|---|---|---|---|---|
| `obtenerResumenFinanciero(periodo)` | `GET /resumen?periodo=TODO\|MES\|ANIO` | `periodo` opcional; cualquier valor distinto de `MES`/`ANIO` = sin filtro (no `400`) | `{ ingresos, egresos, utilidad }` (200) | solo comunes |
| `obtenerMovimientosFinancieros()` | `GET /movimientos` | sin parámetros | `{ movimientos: [{ id, tipo, categoria, fecha, valor, detalle, aveId, origenTipo, origenId, aveCodigo }] }` (200; `fecha DESC`, `rowid DESC`) | solo comunes |
| `registrarIngreso` | `POST /ingresos` | `{ categoria?, valor, detalle?, fecha? }` | `{ id }` (201) | `400 VALIDATION_ERROR` solo por tipo del cuerpo |
| `registrarEgreso` | `POST /egresos` | igual | `{ id }` (201) | igual |
| `obtenerMovimientoPorId(id)` | `GET /movimientos/:movimientoId` | — | `{ movimiento: { id, tipo, categoria, fecha, valor, detalle, aveId, origenTipo, origenId, fechaCreacion, aveCodigo } }` (200) | `404 MOVIMIENTO_NO_ENCONTRADO` → el cliente devuelve `null` |
| `obtenerVentaPorBajaId(bajaId)` | `GET /ventas/:bajaId` | — | `{ venta: { id, aveId, fecha, celular, comprador, ciudadDestino, cooperativaEnvio, valorVenta, valorEnvio, detalle, aveCodigo } }` (200) | `404 VENTA_NO_ENCONTRADA` → el cliente devuelve `null` |
| `actualizarMovimientoManual` | `PUT /movimientos/:movimientoId` | `{ tipo, categoria, valor, detalle, fecha }` (el `id` va en la ruta) | `{ id }` (200); el cliente devuelve `undefined` | `404 MOVIMIENTO_NO_ENCONTRADO`; `409 MOVIMIENTO_AUTOMATICO_NO_EDITABLE`; `400 VALOR_INVALIDO` (en ese orden de evaluación) |
| `corregirVentaFinanciera` | `POST /ventas/:bajaId/correccion` | `{ valorVenta, valorEnvio }` (número, texto, `null` o ausente: se aplica `numeroNoNegativo` de V1) | `{ bajaId }` (200); el cliente devuelve `undefined` | `400 VALOR_INVALIDO` (antes de leer nada); `404 VENTA_NO_ENCONTRADA` |
| `obtenerHistorialMovimiento` | `GET /movimientos/:movimientoId/historial` | — | `{ historial: [{ id, movimientoId, fecha, accion, tipoAnterior, tipoNuevo, categoriaAnterior, categoriaNueva, fechaMovimientoAnterior, fechaMovimientoNueva, valorAnterior, valorNuevo, detalleAnterior, detalleNuevo, origenTipo, origenId }] }` (200; `fecha DESC`, `rowid DESC`) | movimiento inexistente → `[]`, **sin 404** (V1 no comprueba) |
| `obtenerConsolidadoCategorias(periodo)` | `GET /consolidado/categorias?periodo=` | igual que resumen | `{ categorias: [{ tipo, categoria, cantidad, total }] }` (200; `tipo DESC`, `total DESC`) | solo comunes |
| `obtenerConsolidadoMensual(limite)` | `GET /consolidado/mensual?limite=12` | `limite` opcional; el servidor aplica `Number(limite) \|\| 12` | `{ meses: [{ periodo, ingresos, egresos }] }` (200) | solo comunes |

Sin endpoint para `obtenerIngresos`/`obtenerEgresos` (sin llamadores). Los importes viajan como número JSON. Las consultas llevan `criadero_id` en toda lectura y escritura; el `JOIN aves` también filtra por `criadero_id`.

Reglas del servidor (replican V1):
- **Alta** (`POST /ingresos|egresos`): `tipo` fijo por ruta; `categoria || 'OTRO'`; `fecha || new Date().toISOString()` (solo si falta); `Number(valor)`; `detalle || null`; `origen_tipo = 'MANUAL'`; `ave_id` y `origen_id` `NULL`. **Sin validar el importe.** Sin historial. Un solo `INSERT`.
- **PUT movimiento**: existe → `origen_tipo` vacío/`'MANUAL'` → `Number(valor)` finito `> 0` → normalizar (`fecha || anterior.fecha`, `detalle?.trim() || null`, `categoria || 'OTRO'`, `tipo === 'EGRESO' ? 'EGRESO' : 'INGRESO'`) → historial `EDICION_MANUAL` → `UPDATE` de `tipo, categoria, fecha, valor, detalle`. Historial y `UPDATE` en **un `db.batch`**; la lectura previa va antes. `fecha` del historial = instante del servidor.
- **POST corrección**: validar importes (`numeroNoNegativo`) antes de leer. Luego **lee primero** la baja `VENTA` del criadero y los dos movimientos existentes por `(origen_tipo='VENTA_AVE', origen_id, categoria)` con menor `rowid`, y ejecuta **un `db.batch`** en este orden: `UPDATE bajas_ave`; para `VENTA_AVE`: (historial `CORRECCION_VENTA` + `UPDATE`) o (`INSERT` + historial `CREACION_POR_CORRECCION`); lo mismo para `ENVIO_AVE` (`CORRECCION_ENVIO`). Los UUID v7 de los `INSERT` y del historial se generan antes del batch; el historial de creación se construye con los mismos valores insertados. Dentro del batch el historial va **antes** del `UPDATE` (existente) y **después** del `INSERT` (nuevo), como V1. No escribe `ave_historial` ni toca `aves`. Ventana de concurrencia entre lectura y batch aceptada (V1 no tiene concurrencia).
- Los literales de historial y de `detalle` son los de las tablas anteriores; `ave_id` en `Venta de ave ${ave_id}` será el UUID de V2.

## Tabla D1

`movimientos_financieros` y `bajas_ave` **ya existen** (`0010_bajas.sql`, sin cambios). Esta spec añade la migración **`0011`** con solo `movimientos_financieros_historial`. Convención: `fecha_creacion` como en V1; sin `created_at`/`updated_at`/`deleted_at`/`version`/CHECK (V1 no da de baja movimientos).

### `movimientos_financieros` (existente, `0010_bajas.sql:56-84`; replica `migrations.js:320-343`)

Columnas: `id TEXT PK NOT NULL` (UUID v7), `criadero_id TEXT NOT NULL` (FK `criaderos` RESTRICT), `tipo TEXT NOT NULL`, `categoria TEXT`, `fecha TEXT NOT NULL`, `valor REAL NOT NULL`, `detalle TEXT`, `ave_id TEXT` (FK `aves` RESTRICT), `origen_tipo TEXT`, `origen_id TEXT` (sin FK), `fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`. Índices existentes: `ix_movimientos_criadero_fecha (criadero_id, fecha)` y `ix_movimientos_origen (origen_tipo, origen_id)`. Finanzas no necesita más índices.

### `movimientos_financieros_historial` (nueva, `0011`; replica `migrationV6.js:20-45`)

```sql
CREATE TABLE movimientos_financieros_historial (
    id TEXT PRIMARY KEY NOT NULL,
    criadero_id TEXT NOT NULL,
    movimiento_id TEXT NOT NULL,
    fecha TEXT NOT NULL,
    accion TEXT NOT NULL,
    tipo_anterior TEXT,
    tipo_nuevo TEXT,
    categoria_anterior TEXT,
    categoria_nueva TEXT,
    fecha_movimiento_anterior TEXT,
    fecha_movimiento_nueva TEXT,
    valor_anterior REAL,
    valor_nuevo REAL,
    detalle_anterior TEXT,
    detalle_nuevo TEXT,
    origen_tipo TEXT,
    origen_id TEXT,

    FOREIGN KEY (criadero_id)
        REFERENCES criaderos(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    FOREIGN KEY (movimiento_id)
        REFERENCES movimientos_financieros(id)
        ON DELETE RESTRICT ON UPDATE RESTRICT
);

-- idx_mov_fin_hist_movimiento de V1 (migrationV6.js:43-45); cubre la FK.
CREATE INDEX ix_movimientos_historial_movimiento
    ON movimientos_financieros_historial(movimiento_id);
```

Paridad con V1: mismas 15 columnas de datos con la misma nulabilidad; `id` y `origen_id` pasan a `TEXT`; se añade `criadero_id`; sin `fecha_creacion` ni `CHECK` (V1 no los tiene). `accion` sin restricción (valores: `EDICION_MANUAL`, `CORRECCION_VENTA`, `CORRECCION_ENVIO`, `CREACION_POR_CORRECCION`). `origen_id` sin FK (como V1; para `VENTA_AVE` es `bajas_ave.id`).

### Relación con Bajas (ya implementada)

- Cada venta escribe dos ingresos: categoría `VENTA_AVE` con `valorVenta ?? 0` y `ENVIO_AVE` con `valorEnvio ?? 0` (siempre ambos), `detalle` `Venta de ave ${aveId} a ${comprador}` o `Venta de ave ${aveId}` y `Envío de venta de ave ${aveId} a ${comprador}` o `Envío de venta de ave ${aveId}`, `origen_tipo 'VENTA_AVE'`, `origen_id = bajas_ave.id`, `ave_id`; sin historial (V1: `BajaAveRepository.sqlite.js:275-353`; V2: `api/src/aves/aves.repository.ts:246-291`).
- Finanzas lee y actualiza `bajas_ave` solo en `GET /ventas/:bajaId` y `POST /ventas/:bajaId/correccion`. La corrección vive en el servicio de Finanzas y escribe `bajas_ave` por su repositorio.
- Mientras Finanzas esté en SQLite, las ventas de la nube no se ven en Finanzas (limitación anotada en `bajas.md`). Al migrar Finanzas desaparece para esta pantalla.

## Qué leen de Finanzas los repositorios que siguen en SQLite (fase 6; solo documentar)

Búsqueda sin límite de `movimientos_financieros` en `src/` fuera de `FinanzasRepository.js`: solo `BajaAveRepository.sqlite.js:277,327` (escritura de Bajas), migraciones, y las lecturas siguientes.

| Repositorio | Consulta | Equivale a |
|---|---|---|
| `DashboardRepository.js:116-150` (se devuelve en `finanzas`, `:491-517`) | `SUM(CASE tipo)` ingresos/egresos con `WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m','now')`; `utilidad` restada en JS; consumo `InicioScreen.js:882-893` | `GET /finanzas/resumen?periodo=MES` |
| `AlertasRepository.js:486-619` (`obtenerAlertasFinanzas`, SQL `:497-543`) | mismo SQL de mes UTC; si `egresos > ingresos` devuelve una alerta `{ tipo:'FINANZAS', nivel:'ALTO', titulo:'Gastos superiores a ingresos', mensaje:'Los egresos del mes superan los ingresos registrados.', entidadId:null, accion:null, accionDestino:null }`, si no `[]` | `GET /finanzas/resumen?periodo=MES` |
| `ReportesRepository.js:99-123` (`obtenerReporteFinanzas`) | mismo `SUM` **sin filtro** de fecha; `{ ingresos, egresos, utilidad }`; consumo `ReportesScreen.js:72,242-248` | `GET /finanzas/resumen?periodo=TODO` |
| `ReportesRepository.js:217-240` (`obtenerExportacionFinanzas`) | `SELECT mf.fecha AS Fecha, mf.tipo AS Tipo, mf.categoria AS Categoria, mf.valor AS Valor, mf.detalle AS Detalle, a.codigo AS Ave, mf.origen_tipo AS Origen, mf.origen_id AS OrigenId FROM movimientos_financieros mf LEFT JOIN aves a ON a.id = mf.ave_id ORDER BY mf.fecha DESC, mf.id DESC` | `GET /finanzas/movimientos` (mismas filas y orden; el cliente renombra claves) |
| `ClientesRepository.js` | **no lee** `movimientos_financieros` (solo `bajas_ave` y `aves`) | endpoints de Bajas, no de Finanzas |
| `ReportesRepository.js:179,205` | `bajas_ave` (ventas, clientes) | endpoints de Bajas |

No hacen falta endpoints nuevos de Finanzas para esos lectores. `BackupRepository` no menciona `movimientos_financieros` (búsqueda sin límite).

## Excepciones técnicas por pasar a online

- **IDs TEXT UUID v7** en `movimientos_financieros.id` y `movimientos_financieros_historial.id`; `origen_id` y `ave_id` pasan a texto. `registrarIngreso`/`registrarEgreso` ya no pueden devolver `lastInsertRowId`: el servidor devuelve `{ id }` y el cliente devuelve ese `id` (las pantallas lo ignoran).
- **`criadero_id`** en ambas tablas y en toda lectura/escritura; los totales y consolidados son por criadero (V1: una base por dispositivo).
- **FK `RESTRICT`** en lugar de las FK sin acción de V1.
- **Transacciones → `db.batch`** (`actualizarMovimientoManual`, `corregirVentaFinanciera`), con lecturas previas del servicio.
- **Reloj**: `strftime(..., ?)` con el instante inyectado en lugar de `'now'` (mismo resultado UTC); `fecha` del historial = reloj del servidor (V1: dispositivo).
- **Desempate `rowid DESC`** en lugar de `id DESC` en movimientos e historial, y `ORDER BY rowid` en el movimiento existente (V1: `ORDER BY id`).
- **Códigos de error → HTTP**: `MOVIMIENTO_NO_ENCONTRADO` 404, `VENTA_NO_ENCONTRADA` 404, `MOVIMIENTO_AUTOMATICO_NO_EDITABLE` 409, `VALOR_INVALIDO` 400; el cliente los convierte en `new Error('<CODIGO>')` con el mismo texto que V1. `obtenerMovimientoPorId` y `obtenerVentaPorBajaId` devuelven `null` ante el 404.
- **`400 VALIDATION_ERROR` por tipos del cuerpo** (cuerpo no JSON, `detalle` no texto, importe no serializable): solo para enlazar a D1 sin 500; no es regla de negocio (en V1 `detalle.trim` ya fallaría con `TypeError`).
- **Errores de red y autenticación** (401, 403, `CRIADERO_NOT_FOUND`, caída de red): los propaga el cliente REST (`ApiError`).
- **Texto `Venta de ave ${ave_id}`** lleva el UUID de V2 (consecuencia de UUID v7).
- Las excepciones a pantallas V1 por errores de red **no están aprobadas**: ver DUDA PARA EL USUARIO 2.

## Casos de paridad

Convención: importes con decimales (`12.5`, `3.25`, `0.1`, `0.2`, `19.99`, `1234567.89`); comparar con `Number` exacto del mismo cálculo (SQL `SUM` + resta JS), no con redondeos. Reloj fijado donde se indica. Fechas en UTC.

| id | dado | cuando | entonces | evidencia V1 |
|---|---|---|---|---|
| FIN-01 | Criadero sin movimientos | `obtenerResumenFinanciero('TODO')`, `'MES'`, `'ANIO'` | `{ ingresos: 0, egresos: 0, utilidad: 0 }` en los tres | `:20-65` |
| FIN-02 | INGRESO `0.1`, INGRESO `0.2`, EGRESO `0.1` | `obtenerResumenFinanciero('TODO')` | `ingresos` = `SUM` de `0.1` y `0.2` (en JS `0.30000000000000004`; visible `$0.30`), `egresos` `0.1`, `utilidad = ingresos - egresos` en JS (visible `$0.20`); sin redondeo | `:23-65`; `FinanzasScreen.js:396-399` |
| FIN-03 | INGRESO `12.5`, INGRESO `3.25`, EGRESO `1234567.89` | `obtenerResumenFinanciero('TODO')` | `ingresos` `15.75`, `egresos` `1234567.89`, `utilidad` = `15.75 - 1234567.89` calculado en JS (mismo valor que el cálculo directo) | `:50-65` |
| FIN-04 | `registrarIngreso({ valor: 19.99 })` y `registrarEgreso({ valor: 1234567.89 })` | `obtenerMovimientosFinancieros()` | `valor` devuelto idéntico (`19.99`, `1234567.89`) | `:225`; `:75-95` |
| FIN-05 | Movimientos con `fecha` `2026-10-31T23:59:59.999Z`, `2026-11-01T00:00:00.000Z`, `2025-12-31T23:59:59.999Z` y reloj `2026-10-31T23:59:59.999Z` | resumen `'MES'` / `'ANIO'` / `'TODO'` | MES: solo el primero; ANIO: los dos primeros; TODO: los tres; periodo desconocido (`'mes'`, `'X'`, `undefined`) = TODO | `:763-778` |
| FIN-06 | Movimiento `2026-10-31T23:30:00.000Z` y reloj `2026-11-01T00:10:00.000Z` | resumen `'MES'` | no entra (`2026-10` ≠ `2026-11`) aunque en Ecuador siga siendo 31/oct; sí en `'ANIO'` | `:769,773` |
| FIN-07 | Movimiento `2027-01-01T00:00:00.000Z` y reloj `2026-12-31T23:59:59.999Z` | `'MES'` y `'ANIO'` | no entra en ninguno (futuro; igualdad, no `>=`); sí en `'TODO'`. Con reloj `2027-01-01T00:00:00.000Z` entra en ambos | `:769,773,776` |
| FIN-08 | Movimiento `2028-02-29T12:00:00.000Z`, reloj `2028-02-01T00:00:00.000Z` | `'MES'` | entra | `:769` |
| FIN-09 | Movimiento con `tipo` distinto de INGRESO/EGRESO (dato forzado) | resumen y consolidado mensual / por categoría | no suma a `ingresos`/`egresos`; el consolidado mensual lo agrupa con `0`/`0`; el consolidado por categoría sí lo lista | `:23-43,706-715,730-756` |
| FIN-10 | 3 movimientos con `fecha` distintas y 2 con la misma `fecha` | `obtenerMovimientosFinancieros` | todos, `fecha` descendente; empate: el insertado después primero; claves `id, tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id, ave_codigo`; `ave_codigo` `null` si no hay ave | `:77-95` |
| FIN-11 | Alta con `categoria` ausente o `''`, `fecha` ausente, `detalle ''` | `registrarIngreso({ valor: 12.5 })` | `categoria 'OTRO'`, `fecha` ISO actual, `detalle NULL`, `origen_tipo 'MANUAL'`, `ave_id`/`origen_id NULL`; devuelve el id; **ninguna fila de historial** | `:210-232` |
| FIN-12 | Llamada directa con `valor` `0` o `-3.25` | `registrarEgreso` | se guarda sin error (el repositorio no valida); la pantalla lo impide | `:196-233`; `NuevoMovimientoFinancieroScreen.js:116-128` |
| FIN-13 | `valor` `'1,5'` desde la pantalla Nuevo | `guardar` | la pantalla no lo rechaza; `Number('1,5')` = `NaN`; V1 no confirmado (duda 2); en V2 el cliente envía `null` y el servidor responde `400`; la pantalla solo hace `console.error` | `NuevoMovimientoFinancieroScreen.js:116-128,184-191`; `:225` |
| FIN-14 | Sin categoría / valor vacío o `<= 0` | pulsar "Guardar movimiento" | `Alert('Categoría requerida', 'Seleccione una categoría.')` / `Alert('Valor inválido', 'Ingrese un valor mayor a cero.')`; no se llama al repositorio | `NuevoMovimientoFinancieroScreen.js:104-128` |
| FIN-15 | Guardado correcto | `guardar` | `Alert('Movimiento guardado', 'El movimiento financiero fue registrado correctamente.')`, "Aceptar" vuelve atrás | `:170-180` |
| FIN-16 | Movimiento manual `10`, `tipo INGRESO`, categoría `OTRO`, detalle `a` | `actualizarMovimientoManual({ id, tipo:'EGRESO', categoria:'ALIMENTO', valor:12.5, detalle:' x ', fecha })` | 1 fila `EDICION_MANUAL` (anterior: tipo/categoría/fecha/valor/detalle viejos; nuevo: `EGRESO`, `ALIMENTO`, fecha enviada, `12.5`, `'x'`; `origen_tipo` `MANUAL` y `origen_id` `NULL` del anterior) escrita antes del `UPDATE`; `ave_id`/`origen_*` no cambian; devuelve `undefined` | `:307-395,619-668` |
| FIN-17 | Edición sin cambiar nada | `actualizarMovimientoManual` con los mismos datos | se escribe igualmente una fila de historial | `:363-374` |
| FIN-18 | `tipo` ausente o distinto de `'EGRESO'`, `categoria` vacía, `detalle ''`, `fecha` ausente | `actualizarMovimientoManual` | `tipo 'INGRESO'`, `categoria 'OTRO'`, `detalle NULL`, `fecha` anterior | `:346-361` |
| FIN-19 | Movimiento con `origen_tipo` `NULL` (dato forzado) | `actualizarMovimientoManual` | se edita (solo se rechaza `origen_tipo` verdadero y ≠ `'MANUAL'`) | `:323-331` |
| FIN-20 | Movimiento `VENTA_AVE` o `ENVIO_AVE` de una venta | `actualizarMovimientoManual` | `Error('MOVIMIENTO_AUTOMATICO_NO_EDITABLE')`, nada escrito; la pantalla muestra `Error` / `No fue posible actualizar el movimiento.` | `:323-331`; `EditarMovimientoFinancieroScreen.js:239-245` |
| FIN-21 | `id` inexistente; `valor` `0`, `'abc'`, `null`; `id` inexistente **y** `valor` `0` | `actualizarMovimientoManual` | `Error('MOVIMIENTO_NO_ENCONTRADO')` / `Error('VALOR_INVALIDO')`; en el último caso gana `MOVIMIENTO_NO_ENCONTRADO`; nada escrito | `:317-344` |
| FIN-22 | Movimiento `VENTA_AVE` cuya baja no se localiza | abrir "Editar" y guardar | formulario manual y, al guardar, `Alert` genérico por `MOVIMIENTO_AUTOMATICO_NO_EDITABLE` | `EditarMovimientoFinancieroScreen.js:335-338`; `FinanzasRepository.js:323-331` |
| FIN-23 | Venta con sus dos movimientos (`valor_venta` `100`, `valor_envio` `5`, detalle `... a Ana`) | `corregirVentaFinanciera({ bajaId, valorVenta:'120,50', valorEnvio:'' })` | `bajas_ave.valor_venta = 120.5`, `valor_envio = 0`; ambos movimientos con `tipo INGRESO`, `fecha = bajas_ave.fecha`, `valor 120.5` / `0`, `detalle` literal (sin `a Ana`); filas `CORRECCION_VENTA` y `CORRECCION_ENVIO`; `aves` y `ave_historial` sin cambios; devuelve `undefined` | `:412-485`; `:781-811` |
| FIN-24 | Venta sin movimiento `ENVIO_AVE` | `corregirVentaFinanciera` con envío `3.25` | se inserta el movimiento (`INGRESO`, `ENVIO_AVE`, `origen_tipo 'VENTA_AVE'`, `origen_id` = baja, `ave_id`) y una fila `CREACION_POR_CORRECCION` con todos los `*_anterior` `NULL` salvo `origen_*`; el historial se escribe tras el `INSERT` | `:563-614` |
| FIN-25 | Venta con envío `0` y sin movimiento `ENVIO_AVE` | `corregirVentaFinanciera` | también se crea el movimiento con `valor 0` | `:563-588` |
| FIN-26 | Importes `0.1` y `19.99` | `corregirVentaFinanciera` | se guardan idénticos en `bajas_ave` y en los movimientos | `:452-465,534-557` |
| FIN-27 | `valorVenta` `-1` o `'abc'` (o `valorEnvio` inválido) | `corregirVentaFinanciera` | `Error('VALOR_INVALIDO')` **antes** de leer la baja; nada escrito; si además `bajaId` no existe gana `VALOR_INVALIDO`; la pantalla ya lo impide con `Valor inválido` / `El valor del ave y el valor de envío deben ser números mayores o iguales a cero.` | `:412-430`; `EditarMovimientoFinancieroScreen.js:265-275` |
| FIN-28 | `bajaId` inexistente o de tipo `MUERTE` | `corregirVentaFinanciera` con importes válidos | `Error('VENTA_NO_ENCONTRADA')`; nada escrito | `:435-450` |
| FIN-29 | Venta con dos movimientos de la misma categoría (dato forzado) | `corregirVentaFinanciera` | solo se actualiza el de menor `id` (V2: menor `rowid`) | `:502-517` |
| FIN-30 | `valorVenta` `null` y `valorEnvio` ausente | `corregirVentaFinanciera` | ambos `0`, sin error | `:781-793` |
| FIN-31 | Movimiento con 3 correcciones | `obtenerHistorialMovimiento` | 3 filas, `fecha` descendente, desempate el último primero; claves de las 16 columnas | `:678-686` |
| FIN-32 | Movimiento sin historial o inexistente | `obtenerHistorialMovimiento` | `[]` sin error; la pantalla muestra `Este movimiento todavía no tiene correcciones registradas.` | `:678-686`; `EditarMovimientoFinancieroScreen.js:554-556` |
| FIN-33 | `id` inexistente | `obtenerMovimientoPorId` | `null`; la pantalla muestra `Movimiento no encontrado.` | `:243-254`; `EditarMovimientoFinancieroScreen.js:74-77,324-332` |
| FIN-34 | `bajaId` de tipo `MUERTE` o inexistente | `obtenerVentaPorBajaId` | `null`; claves de la fila: `id, ave_id, fecha, celular, comprador, ciudad_destino, cooperativa_envio, valor_venta, valor_envio, detalle, ave_codigo` | `:266-287` |
| FIN-35 | INGRESO `12.5` `VENTA_HUEVOS`, INGRESO `3.25` `OTRO`, INGRESO `1.5` con `categoria NULL`, EGRESO `0.1` `ALIMENTO` y EGRESO `0.2` `ALIMENTO` | `obtenerConsolidadoCategorias('TODO')` | `INGRESO/VENTA_HUEVOS 1 12.5`, `INGRESO/OTRO 2 4.75` (el `NULL` se une a `OTRO`; `total` descendente deja `VENTA_HUEVOS` `12.5` antes que `OTRO` `4.75`), `EGRESO/ALIMENTO 2 0.30000000000000004`; `INGRESO` antes de `EGRESO` | `:704-716` |
| FIN-36 | Movimientos en 14 meses distintos | `obtenerConsolidadoMensual(12)` | 12 filas `{ periodo:'YYYY-MM', ingresos, egresos }` del más reciente al más antiguo; sin filas de relleno; un mes sin movimientos entre dos meses con datos **no** aparece | `:730-757` |
| FIN-37 | Movimientos solo en `2026-08` e `2026-10` | `obtenerConsolidadoMensual(12)` | 2 filas (`2026-10`, `2026-08`), no 12; la pantalla muestra `+$`/`-$` por `balance >= 0` | `:752-757`; `FinanzasScreen.js:582-644` |
| FIN-38 | Movimiento `2026-10-31T23:59:59.999Z` y otro `2026-11-01T00:00:00.000Z` | `obtenerConsolidadoMensual` | caen en `2026-10` y `2026-11` respectivamente (UTC) | `:731,753` |
| FIN-39 | `limite` `0`, `'x'` o ausente | `obtenerConsolidadoMensual` | usa `12` | `:757` |
| FIN-40 | Mes con solo egresos `0.1` y `0.2` | `obtenerConsolidadoMensual` | `ingresos 0`, `egresos` = `SUM`; `balance` negativo `-$0.30` en pantalla | `:732-751`; `FinanzasScreen.js:617-641` |
| FIN-41 | Dos criaderos de la misma cuenta con movimientos | cualquier lectura | cada uno ve solo sus movimientos, historial y totales (diferencia técnica) | `criadero_id` |
| FIN-42 | Fallo de red al abrir Finanzas | `cargar` | solo `console.error`; `loading` se apaga; pantalla con el estado previo (ceros y listas vacías en la primera carga), sin `Alert` (igual que V1 con error de lectura) | `FinanzasScreen.js:137-151` |
| FIN-43 | Fallo de red al guardar un movimiento nuevo | `guardar` | solo `console.error`, sin mensaje; el botón se rehabilita | `NuevoMovimientoFinancieroScreen.js:184-196` |
| FIN-44 | Fallo de red al cargar categorías en Nuevo | `cargarCategorias` | promesa rechazada sin manejar; lista de categorías vacía | `NuevoMovimientoFinancieroScreen.js:60-64,76-96` |
| FIN-45 | Fallo de red al abrir "Editar" | `cargar` | `Alert('Error', 'No fue posible cargar el movimiento.')` y luego `Movimiento no encontrado.` | `EditarMovimientoFinancieroScreen.js:145-154,324-332` |
| FIN-46 | Venta registrada por Bajas en D1 (dos ingresos) | `obtenerMovimientosFinancieros` y `obtenerConsolidadoCategorias('TODO')` | aparecen `ENVIO_AVE` (insertado después) antes que `VENTA_AVE`; con `valor_envio` ausente el movimiento de envío tiene `valor 0` y cuenta en `cantidad` | `BajaAveRepository.sqlite.js:275-353`; `:704-716` |

## Dudas técnicas

1. **Resultado de `Number('1,5')` = `NaN` en el `INSERT`** (`:225`): no se confirma en el código si `expo-sqlite` lo enlaza como `NULL` (violaría `NOT NULL`) o de otra forma. En V2 `JSON.stringify(NaN)` da `null` y se rechazaría por tipo (`400`). Comportamiento visible esperado igual: sin guardar y sin mensaje.
2. **`SUM` de REAL entre versiones de SQLite** (`expo-sqlite` frente a D1): posible diferencia de orden 1e-16; la pantalla redondea a 2 decimales. Verificar con FIN-02 y FIN-35 en la prueba de datos.
3. **`strftime` sobre `fecha` con sufijo `Z` y fracción** se afirma por la documentación de SQLite, no por ejecución; confirmarlo en una prueba de integración con los bordes de FIN-05 a FIN-08 y FIN-38. Una `fecha` en otro formato (p. ej. la de `registrarVentaAve`, que llega de la app) no se ha revisado aquí: si no es ISO interpretable queda fuera de MES/ANIO y agrupa bajo `periodo NULL`.
4. **`LIMIT ?` con `limite` negativo o no entero** en `obtenerConsolidadoMensual`: negativo = sin límite y no entero = posible error de tipo en SQLite; no verificado. La pantalla siempre envía `12`.
5. **`ORDER BY tipo DESC, total DESC`** sin desempate completo en V1: el orden entre empates de `total` no está definido; los casos de paridad deben evitar empates.
6. **Hora del historial**: reloj del dispositivo en V1, del servidor en V2; sin efecto visible salvo desfase de reloj.
7. **Dos movimientos de venta pueden quedar con `valor 0`** (el de envío se crea siempre): las listas los muestran como `+$0.00`. Se replica.
8. **Texto `Venta de ave ${ave_id}`** llevará un UUID largo en V2 (en V1 un entero), tanto en Bajas como en la corrección; se replica el texto con el id.

## DUDA PARA EL USUARIO

1. **Excepciones a pantallas V1 por errores de red** (V1 no las tiene; precedente: las ya aprobadas en Alimentación, Bebida, Salud y Producción de huevos). Decide el usuario cuáles se aprueban; esta spec no las aplica:
   - `FinanzasScreen.js:137-144`: el `catch` de `cargar` solo hace `console.error`; con la red caída muestra el estado previo (ceros en la primera carga) como si no hubiera datos. La pantalla no importa `Alert`. Mismo caso que HUE-25 (`ProduccionHuevosScreen`, ya aprobado).
   - `NuevoMovimientoFinancieroScreen.js:184-191`: el `catch` de `guardar` solo hace `console.error`; con la red caída el usuario no ve nada y el botón se rehabilita (posible doble envío sin saber si guardó).
   - `NuevoMovimientoFinancieroScreen.js:76-96`: `cargarCategorias` sin `try/catch` y sin `await` en `useEffect` (`:60-64`); con la red caída hay una promesa rechazada sin manejar y no aparecen categorías.
   - Sin excepción necesaria: `EditarMovimientoFinancieroScreen.js` (ya tiene `try/catch` con `Alert` en `:145-154,239-245,298-304`) y los IDs UUID (ninguna pantalla usa `Number()`/`parseInt` sobre ids).
2. **Orden de implementación** (decisión de plan; ya no hay dependencia con Bajas porque `bajas_ave` y `movimientos_financieros` existen): ¿Finanzas completa de una vez (con `GET /ventas/:bajaId` y la corrección) o por tramos?
3. **`obtenerIngresos`/`obtenerEgresos`**: esta spec las **omite** por no tener llamadores (criterio de Salud). Si el usuario prefiere implementarlas, serían `GET /movimientos?tipo=INGRESO|EGRESO` sin la clave `tipo`.
