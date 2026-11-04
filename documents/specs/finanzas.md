# Spec: finanzas

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).

## Estado

borrador (2026-11-03, rama `trabajo/migracion-nube`). Alcance: movimientos financieros manuales y de venta de aves individuales (sin lotes), sin sincronización offline, D1 como fuente de verdad. Las líneas son del árbol de V1 (v1.0.3, `app.json:5`). Nada de lo descrito se ejecutó: es lectura de código (el comportamiento de SQLite que se cita es el documentado del motor y queda marcado donde hay que verificarlo en una prueba).

## Fuente V1

- `src/repositories/FinanzasRepository.js` (completo, 811 líneas): `obtenerResumenFinanciero` 6-67, `obtenerMovimientosFinancieros` 70-97, `obtenerIngresos` 100-127, `obtenerEgresos` 130-157, `registrarIngreso` 160-175, `registrarEgreso` 178-193, `registrarMovimientoManual` (privada) 196-233, `obtenerMovimientoPorId` 236-256, `obtenerVentaPorBajaId` 259-289, `actualizarMovimientoManual` 292-400, `corregirVentaFinanciera` 403-490, `sincronizarMovimientoVenta` (privada) 493-616, `registrarAuditoria` (privada) 619-668, `obtenerHistorialMovimiento` 671-688, `obtenerConsolidadoCategorias` 691-718, `obtenerConsolidadoMensual` 721-760, `construirFiltroPeriodo` (privada) 763-778, `numeroNoNegativo` (privada) 781-811.
- Esquema V1: `src/database/migrations.js:320-343` (`movimientos_financieros`), `:364-365` (`idx_movimientos_fecha`); `src/database/migrationV6.js:20-40` (`movimientos_financieros_historial`), `:43-50` (índices `idx_mov_fin_hist_movimiento` e `idx_movimientos_financieros_origen`), `:53-73` (ítem `ENVIO_AVE` del catálogo) y `:76-106` (relleno de movimientos `ENVIO_AVE` de ventas antiguas con `valor_envio > 0`; no aplica a V2, que empieza sin datos). `PRAGMA foreign_keys = ON` en `src/database/sqlite.js:63`.
- Pantallas que importan `FinanzasRepository` (búsqueda de `FinanzasRepository` sin límite en todo el repo, excluido `documents/`: **solo tres importadores**):
  - `src/screens/FinanzasScreen.js:19-24`: `obtenerResumenFinanciero`, `obtenerMovimientosFinancieros`, `obtenerConsolidadoCategorias`, `obtenerConsolidadoMensual`. Registrada en `src/navigation/FinanzasStackNavigator.js:42` (tab Finanzas, `AppNavigator.js:261`).
  - `src/screens/NuevoMovimientoFinancieroScreen.js:17-20`: `registrarIngreso`, `registrarEgreso` (`FinanzasStackNavigator.js:49-50`).
  - `src/screens/EditarMovimientoFinancieroScreen.js:22-28`: `obtenerMovimientoPorId`, `obtenerVentaPorBajaId`, `actualizarMovimientoManual`, `corregirVentaFinanciera`, `obtenerHistorialMovimiento` (`FinanzasStackNavigator.js:57-58`).
- **Funciones sin ningún llamador** (búsqueda sin límite de cada nombre): `obtenerIngresos` y `obtenerEgresos` (solo su definición, `FinanzasRepository.js:100,130`). `registrarIngreso`/`registrarEgreso` las llama solo `NuevoMovimientoFinancieroScreen.js:156,163`. `obtenerVentaPorBajaId` solo `EditarMovimientoFinancieroScreen.js:124`.
- Catálogo `CATEGORIAS_FINANCIERAS`: `ConfiguracionRepository` (`obtenerCatalogoPorCodigo`, `obtenerItemsCatalogo`, ya con fachada API; `catalogos.md`). D1 ya tiene la plantilla de 8 ítems (`api/src/catalogs/defaultCatalogItems.ts:187-235`).
- Escritura de ingresos por venta de ave: **pertenece a Bajas** (`BajaAveRepository.js:275-353`, `registrarVentaAve`; spec `bajas.md` aparte). Aquí solo se anota la relación (sección "Relación con Bajas").
- Lectores que NO se migran aquí (solo se anotan; ver sección (h)): `ClientesRepository.js` (lee **solo** `bajas_ave`, nunca `movimientos_financieros`), `ReportesRepository.js:99-123` y `:217-240`, `DashboardRepository.js:116-150`, `AlertasRepository.js:486-619`.

### Hallazgos clave

1. **`obtenerConsolidadoMensual` no es una ventana de 12 meses calendario**: agrupa los meses que **tienen** movimientos y devuelve hasta 12 (los más recientes). Los meses sin datos no aparecen. Ver sección de periodos.
2. **Zona horaria: todo en UTC** (confirmado en el código: ninguna consulta de Finanzas usa `'localtime'`; `strftime(...,'now')` es UTC). La `fecha` que se guarda es `new Date().toISOString()` (UTC con `Z`).
3. **Los importes son `REAL`** y las sumas se hacen **en SQL** (`SUM`); solo `utilidad = ingresos - egresos` se calcula en JS (`:63-64`).
4. **Alta manual no escribe historial**. El historial se escribe solo en `actualizarMovimientoManual` (`EDICION_MANUAL`) y en `corregirVentaFinanciera` (`CORRECCION_VENTA`, `CORRECCION_ENVIO`, `CREACION_POR_CORRECCION`).
5. **Los movimientos de venta (`origen_tipo = 'VENTA_AVE'`) no se editan por `actualizarMovimientoManual`** (`MOVIMIENTO_AUTOMATICO_NO_EDITABLE`); se corrigen con `corregirVentaFinanciera`, que **sí modifica `bajas_ave.valor_venta` y `valor_envio`** (no toca `aves` ni `ave_historial`). Esto crea una dependencia con Bajas (tabla `bajas_ave` no existe aún en D1).
6. `corregirVentaFinanciera` **pisa `detalle`** de los dos movimientos con `Venta de ave ${ave_id}` / `Envío asociado a venta de ave ${ave_id}` (se pierde el `a ${comprador}` que escribió `registrarVentaAve`), y pone `fecha = bajas_ave.fecha`. En V2 `ave_id` será un UUID y el texto lo llevará (consecuencia de UUID v7, ver dudas).
7. `numeroNoNegativo` de Finanzas (`:781-811`) **no es igual** a la de Bajas (`BajaAveRepository.js:540-575`): la de Finanzas convierte vacío/`null` en `0` y cambia `,` por `.`; la de Bajas devuelve `null` en vacío y no cambia la coma.
8. `NuevoMovimientoFinancieroScreen`: la validación `Number(valor)<=0` (`:116-119`) **deja pasar** textos no numéricos como `'1,5'` (`NaN<=0` es `false`); el repositorio hace `Number(valor)` → `NaN` (`:225`). Resultado en SQLite no verificado (ver dudas). `EditarMovimientoFinancieroScreen` sí convierte la coma (`:197-201`).

## Contrato del repositorio

Fachada propuesta (como Salud y Huevos): `FinanzasRepository.js` elige entre `FinanzasRepository.sqlite.js` (código V1 intacto) y `FinanzasRepository.api.js` con `EXPO_PUBLIC_DATA_SOURCE=api`. El `.api.js` exporta **las mismas 13 funciones públicas**, también las dos sin llamadores (`obtenerIngresos`, `obtenerEgresos`; ver DUDA PARA EL USUARIO 1). Las claves devueltas son las de SQLite (snake_case: `ave_id`, `origen_tipo`, `ave_codigo`, `valor_anterior`…); la API viaja en camelCase y el cliente las vuelve a snake_case con `aSnake` (`src/api/avesApi.js:38`), como el resto de módulos.

### Periodos y reloj (aplica a resumen, consolidado por categoría y mensual)

- `construirFiltroPeriodo(periodo, 'fecha')` (`:763-778`) devuelve una cláusula `WHERE` por **igualdad de texto** de `strftime`:
  - `'MES'` → `WHERE strftime('%Y-%m', fecha) = strftime('%Y-%m', 'now')` (`:769`).
  - `'ANIO'` → `WHERE strftime('%Y', fecha) = strftime('%Y', 'now')` (`:773`).
  - Cualquier otro valor (incluido `'TODO'`, el valor por defecto, `undefined` o un valor desconocido) → `''` (sin filtro) (`:776`).
- **Zona horaria UTC**: `strftime(..., 'now')` es la hora UTC de SQLite; `strftime('%Y-%m', fecha)` interpreta el sufijo `Z` de `YYYY-MM-DDTHH:mm:ss.sssZ` y trabaja en UTC (comportamiento documentado de SQLite; no ejecutado aquí). No hay `'localtime'` en `FinanzasRepository.js` (4 usos de `strftime`/`now`: `:731,753,769,773`). Consecuencia visible, que se replica: un movimiento creado a las 20:00 en Ecuador (UTC-5) del último día del mes queda con fecha UTC del mes siguiente y cuenta para "Este mes" del mes siguiente. La pantalla **muestra** la fecha en hora local (`FinanzasScreen.js:769-772`, `new Date(item.fecha).toLocaleString()`), pero **calcula** en UTC.
- Es igualdad, no `>=`: **no** hay efecto de "fechas futuras entran" (a diferencia de Huevos). Un movimiento con fecha de otro mes/año no entra aunque sea futuro. Una `fecha` que SQLite no pueda interpretar da `strftime = NULL` y queda fuera de MES y ANIO (solo entra en TODO).
- **Dependen del reloj**: `obtenerResumenFinanciero` y `obtenerConsolidadoCategorias` con `'MES'`/`'ANIO'`; y `registrarIngreso`/`registrarEgreso` cuando no llega `fecha` (`:224`, `new Date().toISOString()` en el dispositivo). **No dependen del reloj**: `obtenerMovimientosFinancieros`, `obtenerIngresos`, `obtenerEgresos`, `obtenerMovimientoPorId`, `obtenerVentaPorBajaId`, `obtenerHistorialMovimiento`, `obtenerConsolidadoMensual`, y ambos con `'TODO'`.
- La pantalla pide `'MES'` por defecto (`FinanzasScreen.js:69-72`) y recarga al cambiar de periodo (`:157-170`, dependencia `[periodo]`). El consolidado por categoría usa el mismo `periodo` que el resumen; **la lista de movimientos y "Últimos meses" no se filtran por periodo** (`:104,110-112`).
- V2: el SQL del servidor debe usar el instante que inyecta el servicio (`ahora: () => Date`, `:ahora = ahora().toISOString()`) en lugar de `'now'`: `strftime('%Y-%m', :ahora)`; en producción da lo mismo (UTC) y las pruebas pueden fijar el instante, igual que en `huevos.md` ("Cómo hacer deterministas los cálculos con reloj"). Sin parámetro público de reloj.

### `obtenerResumenFinanciero(periodo = 'TODO')` (`:6-67`)

- SQL literal (`:21-47`; `${filtroFecha}` es la cláusula de arriba):
  ```sql
  SELECT
    COALESCE(SUM(CASE WHEN tipo = 'INGRESO' THEN valor ELSE 0 END), 0) AS ingresos,
    COALESCE(SUM(CASE WHEN tipo = 'EGRESO'  THEN valor ELSE 0 END), 0) AS egresos
  FROM movimientos_financieros
  ${filtroFecha}
  ```
- Devuelve `{ ingresos: number, egresos: number, utilidad: number }`: `ingresos = Number(resultado?.ingresos || 0)`, `egresos = Number(resultado?.egresos || 0)`, `utilidad = ingresos - egresos` (resta en JS, `:50-65`). Un `tipo` distinto de `INGRESO`/`EGRESO` no suma a nada. Sin filas: `{ 0, 0, 0 }`. Sin errores propios. Los egresos van positivos (`valor` siempre positivo; el signo lo da `tipo`).
- Consumo: `FinanzasScreen.js:100-102`; muestra `$` + `Number(value||0).toFixed(2)` (`:960-969`, `:391-399`). Estado inicial `{0,0,0}` (`:35-42`).

### `obtenerMovimientosFinancieros()` (`:70-97`)

- SQL: `SELECT mf.id, mf.tipo, mf.categoria, mf.fecha, mf.valor, mf.detalle, mf.ave_id, mf.origen_tipo, mf.origen_id, a.codigo AS ave_codigo FROM movimientos_financieros mf LEFT JOIN aves a ON a.id = mf.ave_id ORDER BY mf.fecha DESC, mf.id DESC`.
- Sin parámetros, **sin límite ni paginación** (todos los movimientos de la cuenta/criadero). Devuelve arreglo de `{ id, tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id, ave_codigo }`; `categoria`, `detalle`, `ave_id`, `origen_tipo`, `origen_id`, `ave_codigo` pueden ser `null`.
- Orden: `fecha` texto descendente y desempate `id DESC` (en V1, el insertado después primero; p. ej. `ENVIO_AVE` antes que `VENTA_AVE` de la misma venta). En D1 el `id` es UUID v7: desempatar por `rowid DESC` para reproducir ese orden (mismo criterio que `huevos.md`).
- Consumo: `FinanzasScreen.js:104`; el filtro Todos/Ingresos/Egresos se hace **en la pantalla** (`:213-221`). Cada fila navega con `movimientoId: item.id` (`:744-751`); badge `🔗 Venta` si `origen_tipo === 'VENTA_AVE'` (`:778-801`); `Ave: {ave_codigo}` si existe (`:831-847`); `item.detalle || 'Sin detalle'` (`:857-861`).

### `obtenerIngresos()` / `obtenerEgresos()` (`:100-127`, `:130-157`) — sin llamadores

- Mismo SQL que el anterior con `WHERE mf.tipo = 'INGRESO'` / `'EGRESO'` y **sin** la columna `tipo` en el `SELECT`: claves `{ id, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id, ave_codigo }`. Mismo `ORDER BY mf.fecha DESC, mf.id DESC`. Sin límite.

### `registrarIngreso({ categoria, valor, detalle, fecha })` / `registrarEgreso(...)` (`:160-193`)

- Delegan en `registrarMovimientoManual({ tipo: 'INGRESO' | 'EGRESO', categoria, valor, detalle, fecha })` (`:196-233`). **Sin validación y sin transacción** (una sola escritura).
- SQL: `INSERT INTO movimientos_financieros (tipo, categoria, fecha, valor, detalle, origen_tipo) VALUES (?, ?, ?, ?, ?, ?)` con `[tipo, categoria || 'OTRO', fecha || new Date().toISOString(), Number(valor), detalle || null, 'MANUAL']`. `ave_id` y `origen_id` quedan `NULL`.
- Devuelve `result.lastInsertRowId` (número). Las pantallas lo ignoran (`NuevoMovimientoFinancieroScreen.js:156-167`). **No escribe `movimientos_financieros_historial`.** Sin errores de dominio.
- Cómo lo consume la pantalla (`NuevoMovimientoFinancieroScreen.js:100-198`, `guardar`): sin categoría → `Alert.alert('Categoría requerida', 'Seleccione una categoría.')` (`:104-113`); `!valor || Number(valor)<=0` → `Alert.alert('Valor inválido', 'Ingrese un valor mayor a cero.')` (`:116-128`). Argumentos: `categoria: categoria.codigo`, `valor: Number(valor)`, `detalle: detalle.trim()`, `fecha: new Date().toISOString()` (`:136-151`). Éxito: `Alert.alert('Movimiento guardado', 'El movimiento financiero fue registrado correctamente.', [{ text: 'Aceptar', onPress: () => navigation.goBack() }])` (`:170-180`). Error: **solo `console.error('Error guardando movimiento:', error)`** (`:184-191`), sin mensaje al usuario. `disabled={guardando}` en el botón (`:366-370`). `detalle ''` → `NULL` por `detalle || null`.
- Categorías ofrecidas: por tipo, filtradas con listas fijas de códigos: INGRESO `['VENTA_AVE','VENTA_HUEVOS','OTRO']`, EGRESO `['ALIMENTO','MEDICAMENTO','INFRAESTRUCTURA','COMPRA_AVE','OTRO']` (`:202-228`); al cambiar de tipo `categoria` vuelve a `null` (`:68-72`). `ENVIO_AVE` **no** se ofrece al crear.

### `obtenerMovimientoPorId(id)` (`:236-256`)

- SQL: `SELECT mf.*, a.codigo AS ave_codigo FROM movimientos_financieros mf LEFT JOIN aves a ON a.id = mf.ave_id WHERE mf.id = ?`. Devuelve la fila (`getFirstAsync`) o `null` si no existe (sin error). Claves: `id, tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id, fecha_creacion, ave_codigo`.
- Consumo: `EditarMovimientoFinancieroScreen.js:69-77`; si `!mov` → `setMovimiento(null)` y la pantalla muestra `Movimiento no encontrado.` (`:324-332`).

### `obtenerVentaPorBajaId(bajaId)` (`:259-289`) — depende de Bajas

- SQL: `SELECT b.id, b.ave_id, b.fecha, b.celular, b.comprador, b.ciudad_destino, b.cooperativa_envio, b.valor_venta, b.valor_envio, b.detalle, a.codigo AS ave_codigo FROM bajas_ave b INNER JOIN aves a ON a.id = b.ave_id WHERE b.id = ? AND b.tipo = 'VENTA'`. Fila o `null`.
- Consumo: solo si `mov.origen_tipo === 'VENTA_AVE' && mov.origen_id` (`EditarMovimientoFinancieroScreen.js:118-139`), con `mov.origen_id` como `bajaId`. Rellena `valorVenta = String(venta?.valor_venta ?? 0)` y `valorEnvio = String(venta?.valor_envio ?? 0)` (`:129-137`). Muestra `Cliente`, `Celular`, `Destino` con `|| 'No registrado'` (`:421-429`).

### `obtenerHistorialMovimiento(movimientoId)` (`:671-688`)

- SQL: `SELECT * FROM movimientos_financieros_historial WHERE movimiento_id = ? ORDER BY fecha DESC, id DESC`. Arreglo (vacío si no hay o si el movimiento no existe, sin error). Sin límite.
- Claves de cada fila (todas las columnas de la tabla): `id, movimiento_id, fecha, accion, tipo_anterior, tipo_nuevo, categoria_anterior, categoria_nueva, fecha_movimiento_anterior, fecha_movimiento_nueva, valor_anterior, valor_nuevo, detalle_anterior, detalle_nuevo, origen_tipo, origen_id`.
- Consumo (`EditarMovimientoFinancieroScreen.js:547-583`): por fila muestra `item.accion` **crudo** (el código, sin traducir), `new Date(item.fecha).toLocaleString()`, `Valor: {formatoDinero(valor_anterior)} → {formatoDinero(valor_nuevo)}` y, solo si `categoria_anterior !== categoria_nueva`, `Categoría: {categoria_anterior || '-'} → {categoria_nueva || '-'}`. `formatoDinero` devuelve `'-'` para `null`/`undefined`/no finito y si no `$` + `toFixed(2)` (`:600-605`). Sin filas: `Este movimiento todavía no tiene correcciones registradas.` (`:551-557`). Las columnas `fecha_movimiento_*`, `detalle_*`, `tipo_*` y `origen_*` se leen pero **no se muestran**.

### `actualizarMovimientoManual({ id, tipo, categoria, valor, detalle, fecha })` (`:292-400`)

Devuelve `undefined`. Todo dentro de `db.withTransactionAsync` (`:304`), en este orden:

1. `SELECT * FROM movimientos_financieros WHERE id = ?` (`:307-315`). Si no existe → `throw new Error('MOVIMIENTO_NO_ENCONTRADO')` (`:317-321`).
2. Si `anterior.origen_tipo` es verdadero **y** distinto de `'MANUAL'` → `throw new Error('MOVIMIENTO_AUTOMATICO_NO_EDITABLE')` (`:323-331`). Es decir, **solo se editan** los movimientos con `origen_tipo = 'MANUAL'` **o `NULL`/vacío**; cualquier otro (en la práctica `VENTA_AVE`, tanto el de categoría `VENTA_AVE` como el `ENVIO_AVE` de una venta) se rechaza aquí.
3. `nuevoValor = Number(valor)`; si `!Number.isFinite(nuevoValor) || nuevoValor <= 0` → `throw new Error('VALOR_INVALIDO')` (`:333-344`). (El error de valor se evalúa **después** de los otros dos.)
4. Normalización (`:346-361`): `nuevaFecha = fecha || anterior.fecha`; `nuevoDetalle = detalle?.trim() || null` (si `detalle` no es texto, `.trim` lanzaría `TypeError`); `nuevaCategoria = categoria || 'OTRO'`; `nuevoTipo = tipo === 'EGRESO' ? 'EGRESO' : 'INGRESO'` (cualquier otro valor, también `undefined`, → `INGRESO`).
5. `registrarAuditoria(db, anterior, { tipo: nuevoTipo, categoria: nuevaCategoria, fecha: nuevaFecha, valor: nuevoValor, detalle: nuevoDetalle }, 'EDICION_MANUAL')` (`:363-374`): fila de historial **antes** del `UPDATE`, se escribe aunque no cambie nada.
6. `UPDATE movimientos_financieros SET tipo = ?, categoria = ?, fecha = ?, valor = ?, detalle = ? WHERE id = ?` con `[nuevoTipo, nuevaCategoria, nuevaFecha, nuevoValor, nuevoDetalle, id]` (`:376-395`). **No cambia** `ave_id`, `origen_tipo`, `origen_id` ni `fecha_creacion`.

Transacción: historial y `UPDATE` atómicos; cualquier error revierte todo y se propaga. Sin comprobación de ave ni de categoría contra el catálogo.

Cómo lo consume la pantalla (`EditarMovimientoFinancieroScreen.js:187-250`, `guardarManual`): sin categoría → `Alert('Categoría requerida', 'Seleccione una categoría.')` (`:189-195`); `Number(String(valor).replace(',', '.'))`, no finito o `<= 0` → `Alert('Valor inválido', 'Ingrese un valor mayor a cero.')` (`:197-213`). Llama con `{ id: movimiento.id, tipo, categoria: categoria.codigo, valor: valorNumero, detalle: detalle.trim(), fecha: movimiento.fecha }` (siempre reenvía la fecha original; la fecha nunca se edita). Éxito: `Alert('Movimiento actualizado', 'Los cambios fueron guardados y quedaron registrados en el historial de correcciones.', [Aceptar → goBack])` (`:227-237`). **Cualquier** error (incluidos `MOVIMIENTO_NO_ENCONTRADO`, `MOVIMIENTO_AUTOMATICO_NO_EDITABLE`, `VALOR_INVALIDO`): `console.error` + `Alert('Error', 'No fue posible actualizar el movimiento.')` (`:239-245`); la pantalla no distingue el código. Categorías ofrecidas al editar: INGRESO `['VENTA_AVE','ENVIO_AVE','VENTA_HUEVOS','OTRO']`, EGRESO como al crear (`:341-359`).

Qué ve la pantalla según el origen (`:335-338`, `:389-544`): `automaticoVenta = movimiento.origen_tipo === 'VENTA_AVE' && !!venta` → formulario "Corregir venta" (valor del ave y de envío); si no, formulario manual. **Caso borde**: un movimiento `VENTA_AVE` cuya baja no se encuentra (`venta` null) muestra el formulario manual y al guardar recibe `MOVIMIENTO_AUTOMATICO_NO_EDITABLE` → el `Alert` genérico.

### `corregirVentaFinanciera({ bajaId, valorVenta, valorEnvio })` (`:403-490`)

Devuelve `undefined`. Orden exacto:

1. **Fuera de la transacción**: `valorAve = numeroNoNegativo(valorVenta)` y `valorTransporte = numeroNoNegativo(valorEnvio)` (`:412-420`). `numeroNoNegativo` de Finanzas (`:781-811`): `null`/`undefined`/texto vacío tras `trim` → `0`; si no, `Number(String(valor).replace(',', '.'))`; no finito o `< 0` → `null`. Si cualquiera es `null` → `throw new Error('VALOR_INVALIDO')` (`:422-430`). `0` es válido (a diferencia de `actualizarMovimientoManual`).
2. Transacción `withTransactionAsync` (`:432`):
   1. `SELECT * FROM bajas_ave WHERE id = ? AND tipo = 'VENTA'` (`:435-444`); si no existe → `throw new Error('VENTA_NO_ENCONTRADA')` (`:446-450`).
   2. `UPDATE bajas_ave SET valor_venta = ?, valor_envio = ? WHERE id = ?` con `[valorAve, valorTransporte, bajaId]` (`:452-465`). **Es la única escritura sobre `bajas_ave`**; no toca `aves` ni `ave_historial`.
   3. `sincronizarMovimientoVenta({ db, venta, categoria: 'VENTA_AVE', valor: valorAve, detalle: `Venta de ave ${venta.ave_id}`, accion: 'CORRECCION_VENTA' })` (`:467-475`).
   4. `sincronizarMovimientoVenta({ ..., categoria: 'ENVIO_AVE', valor: valorTransporte, detalle: `Envío asociado a venta de ave ${venta.ave_id}`, accion: 'CORRECCION_ENVIO' })` (`:477-485`).

`sincronizarMovimientoVenta` (`:493-616`):
- Busca el existente: `SELECT * FROM movimientos_financieros WHERE origen_tipo = 'VENTA_AVE' AND origen_id = ? AND categoria = ? ORDER BY id LIMIT 1` con `[venta.id, categoria]` (`:502-517`).
- **Si existe** (`:519-561`): `registrarAuditoria(db, existente, { tipo: 'INGRESO', categoria, fecha: venta.fecha, valor, detalle }, accion)` y luego `UPDATE movimientos_financieros SET tipo = 'INGRESO', categoria = ?, fecha = ?, valor = ?, detalle = ?, ave_id = ?, origen_tipo = 'VENTA_AVE', origen_id = ? WHERE id = ?` con `[categoria, venta.fecha, valor, detalle, venta.ave_id, venta.id, existente.id]`. Historial siempre (aunque el valor no cambie).
- **Si no existe** (`:563-614`): `INSERT INTO movimientos_financieros (tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id) VALUES ('INGRESO', ?, ?, ?, ?, ?, 'VENTA_AVE', ?)` con `[categoria, venta.fecha, valor, detalle, venta.ave_id, venta.id]`; lee la fila creada (`SELECT * ... WHERE id = lastInsertRowId`) y escribe historial con `anterior = { id, tipo: null, categoria: null, fecha: null, valor: null, detalle: null, origen_tipo, origen_id }`, `nuevo = creado`, `accion = 'CREACION_POR_CORRECCION'`. Se crea aunque el valor sea `0`.

Cómo lo consume la pantalla (`EditarMovimientoFinancieroScreen.js:253-309`, `guardarVenta`): `parseNoNegativo` propio de la pantalla (`:591-597`, igual que el del repositorio: vacío → `0`, coma → punto, `null` si negativo/no finito); si cualquiera es `null` → `Alert('Valor inválido', 'El valor del ave y el valor de envío deben ser números mayores o iguales a cero.')` (`:265-275`) y no llama. Llama con `{ bajaId: venta.id, valorVenta, valorEnvio }`. Éxito: `Alert('Venta corregida', 'Se actualizaron la venta y sus movimientos financieros relacionados.', [Aceptar → goBack])` (`:286-296`). Cualquier error: `console.error` + `Alert('Error', 'No fue posible corregir la venta.')` (`:298-304`); no distingue `VALOR_INVALIDO` ni `VENTA_NO_ENCONTRADA`.

### Historial de movimientos: acciones y qué escribe cada columna (`registrarAuditoria`, `:619-668`)

`INSERT INTO movimientos_financieros_historial (movimiento_id, fecha, accion, tipo_anterior, tipo_nuevo, categoria_anterior, categoria_nueva, fecha_movimiento_anterior, fecha_movimiento_nueva, valor_anterior, valor_nuevo, detalle_anterior, detalle_nuevo, origen_tipo, origen_id) VALUES (?×15)` con `[anterior.id, new Date().toISOString(), accion, anterior.tipo ?? null, nuevo.tipo ?? null, anterior.categoria ?? null, nuevo.categoria ?? null, anterior.fecha ?? null, nuevo.fecha ?? null, anterior.valor ?? null, nuevo.valor ?? null, anterior.detalle ?? null, nuevo.detalle ?? null, anterior.origen_tipo ?? null, anterior.origen_id ?? null]`. `fecha` es el instante de la corrección (reloj del dispositivo en V1). `origen_tipo`/`origen_id` salen **siempre de `anterior`**.

| `accion` (texto exacto) | Cuándo | Filas | Anterior | Nuevo |
|---|---|---|---|---|
| `EDICION_MANUAL` | `actualizarMovimientoManual` (`:373`) | 1 | fila actual del movimiento | `nuevoTipo, nuevaCategoria, nuevaFecha, nuevoValor, nuevoDetalle` |
| `CORRECCION_VENTA` | `corregirVentaFinanciera`, movimiento `VENTA_AVE` existente (`:474`) | 1 | fila actual | `tipo 'INGRESO'`, categoría `VENTA_AVE`, `fecha = venta.fecha`, `valor`, detalle `Venta de ave ${ave_id}` |
| `CORRECCION_ENVIO` | idem, movimiento `ENVIO_AVE` existente (`:484`) | 1 | fila actual | `tipo 'INGRESO'`, categoría `ENVIO_AVE`, `fecha = venta.fecha`, `valor`, detalle `Envío asociado a venta de ave ${ave_id}` |
| `CREACION_POR_CORRECCION` | idem, el movimiento no existía (`:613`) | 1 | todo `NULL` salvo `id`, `origen_tipo`, `origen_id` | la fila creada |

- **No se escribe historial** en el alta manual (`registrarMovimientoManual`) ni en `registrarVentaAve` (Bajas). No hay otros textos de detalle: `detalle_anterior`/`detalle_nuevo` son los `detalle` del movimiento, no una descripción de la acción.
- La pantalla muestra la acción tal cual (`item.accion`), por lo que el texto de los cuatro códigos es contrato.
- Tras corregir una venta, el historial de cada movimiento (el de `VENTA_AVE` y el de `ENVIO_AVE`) tiene su propia fila; se consulta por `movimiento_id`, no por venta.

### `obtenerConsolidadoCategorias(periodo = 'TODO')` (`:691-718`)

- SQL (`:705-715`):
  ```sql
  SELECT tipo, COALESCE(categoria, 'OTRO') AS categoria, COUNT(*) AS cantidad, COALESCE(SUM(valor), 0) AS total
  FROM movimientos_financieros
  ${filtroFecha}
  GROUP BY tipo, COALESCE(categoria, 'OTRO')
  ORDER BY tipo DESC, total DESC
  ```
- Devuelve arreglo de `{ tipo, categoria, cantidad, total }` (`cantidad` entero, `total` REAL). `ORDER BY tipo DESC`: `'INGRESO'` antes de `'EGRESO'` (orden alfabético descendente); dentro de cada tipo, `total` descendente (**empates sin desempate definido**). Incluye cualquier `tipo`, también los que no son INGRESO/EGRESO. Sin límite.
- Consumo: `FinanzasScreen.js:106-108`; la pantalla filtra por `tipo` (`:224-235`) y muestra `nombreCategoria(item.categoria)` (mapa fijo `:1030-1071`: `VENTA_AVE` 'Venta de aves', `ENVIO_AVE` 'Envíos de aves', `VENTA_HUEVOS` 'Venta de huevos', `ALIMENTO` 'Alimento', `MEDICAMENTO` 'Medicamentos', `INFRAESTRUCTURA` 'Infraestructura', `COMPRA_AVE` 'Compra de aves', `OTRO` 'Otros'; otro código → el propio código; vacío → 'Otro'). Vacío: `Sin ingresos en el período.` / `Sin egresos en el período.` (`:441,491`).

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
  con parámetro `[Number(limite) || 12]` (`0`, `NaN` o no numérico → `12`).
- **Ventana**: no hay filtro por fecha ni calendario de 12 meses. Son los **hasta 12 meses más recientes que tengan al menos un movimiento**, ordenados del más reciente al más antiguo (`ORDER BY periodo DESC`, comparación de texto `'YYYY-MM'`). **Meses sin datos no aparecen** (no se rellenan con ceros); incluye meses futuros si hay movimientos con fecha futura (el más futuro va primero); los más antiguos que el duodécimo se descartan. Una `fecha` no interpretable agrupa bajo `periodo = NULL`, que por `DESC` queda al final y puede aparecer si hay menos de 12 meses. **No depende del reloj.**
- Etiqueta: `periodo` texto `'YYYY-MM'` en **UTC**. Devuelve arreglo de `{ periodo, ingresos, egresos }` (REAL). Un mes con solo movimientos de otro `tipo` aparece con `0` y `0`.
- Consumo: `FinanzasScreen.js:110-112` (siempre `12`); por fila `balance = Number(item.ingresos||0) - Number(item.egresos||0)` calculado **en JS** (`:582-589`), muestra `{periodo}` y `+$x.xx`/`-$x.xx` (`Math.abs(balance).toFixed(2)`, `:615-644`; `balance >= 0` → `+`); vacío: `Sin datos mensuales.` (`:575`). `key={item.periodo}`.

### Importes: tipo y sumas

- V1 guarda `valor REAL` (`migrations.js:329`, `migrationV6.js:32-33`). Las sumas son `SUM` en SQL; `utilidad` y `balance` mensual son restas en JS con `Number`. Para mostrar, las pantallas hacen `Number(x).toFixed(2)` (`FinanzasScreen.js:396-399,639-641,899-901,966-968,1015-1018`; `EditarMovimientoFinancieroScreen.js:604`), de modo que el redondeo visual es solo de presentación.
- **Propuesta V2**:
  - **Viaje por JSON**: número JSON (nunca string, nunca céntimos enteros). `JSON.stringify` de un `double` es la representación más corta que reproduce exactamente el mismo `double`, y `JSON.parse` lo devuelve idéntico (`0.1`, `19.99`, `1234567.89` ida y vuelta sin pérdida). El cliente REST envía `Number(valor)` (igual que V1 `:225`) y devuelve `Number(...)`.
  - **D1**: columna `REAL` (doble IEEE 754, igual que V1), sin `ROUND`, sin `CAST`, sin conversión a céntimos; el servidor no vuelve a parsear con `parseFloat` ni redondea en ninguna capa.
  - **Sumas en SQL** (mismo `SUM(CASE ...)`) y **resta en JS** en el servicio (`utilidad = ingresos - egresos`; balance mensual lo calcula la pantalla), como V1. Así los resultados coinciden salvo diferencias de versión del motor SQLite en el algoritmo de `SUM` de reales (SQLite ≥ 3.43 usa suma compensada); el efecto sería del orden de 1e-16 y la pantalla redondea a 2 decimales. **Queda como DUDA TÉCNICA 3**: verificar en la prueba de paridad con 0.1 + 0.2.
  - Ejemplos en JS que se mantienen: `0.1 + 0.2 = 0.30000000000000004` (visible `$0.30`); `0.3 - 0.1 = 0.19999999999999998` (visible `$0.20`); `19.99` y `1234567.89` ida y vuelta idénticos.
  - Los tipos `INTEGER` de SQLite no intervienen: la columna es `REAL` y `5` se guarda como `5.0`; el JSON devuelve `5`.
- `COALESCE(..., 0)` devuelve `0` entero sin filas; `Number(...)` lo deja `0`.

## Endpoints V2

Todos bajo `/api/v1/criaderos/:criaderoId/finanzas`, con ownership por criadero (`401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 CRIADERO_NOT_FOUND`) y respuesta `{ success: true, data }`. Los códigos de dominio de V1 se conservan; el cliente los traduce a `new Error('<CODIGO>')` (patrón `traducirErrorAve`/`huevosApi`). No se añade validación nueva: solo la que V1 ya tenía en el repositorio y la de tipos del cuerpo para poder enlazar a D1 (ver excepciones).

| Función V1 | Endpoint | Request | Response `data` | Errores |
|---|---|---|---|---|
| `obtenerResumenFinanciero(periodo)` | `GET /resumen?periodo=TODO\|MES\|ANIO` | `periodo` opcional; cualquier valor distinto de `MES`/`ANIO` = sin filtro (no `400`) | `{ ingresos, egresos, utilidad }` | solo comunes |
| `obtenerMovimientosFinancieros()` | `GET /movimientos` | sin parámetros | `{ movimientos: [{ id, tipo, categoria, fecha, valor, detalle, aveId, origenTipo, origenId, aveCodigo }] }` (`fecha DESC`, `rowid DESC`; `aveId` y `origenId` texto) | solo comunes |
| `obtenerIngresos()` / `obtenerEgresos()` | `GET /movimientos?tipo=INGRESO` / `?tipo=EGRESO` | `tipo` opcional | igual pero **sin** clave `tipo` en cada elemento (como V1) | solo comunes |
| `registrarIngreso` | `POST /ingresos` | `{ categoria?, valor, detalle?, fecha? }` | `{ id }` (201) | `400 VALIDATION_ERROR` solo por tipo del cuerpo |
| `registrarEgreso` | `POST /egresos` | igual | `{ id }` (201) | igual |
| `obtenerMovimientoPorId(id)` | `GET /movimientos/:movimientoId` | — | `{ movimiento: { id, tipo, categoria, fecha, valor, detalle, aveId, origenTipo, origenId, fechaCreacion, aveCodigo } }` | `404 MOVIMIENTO_NO_ENCONTRADO` → el cliente devuelve `null` (V1 devuelve `null`) |
| `obtenerVentaPorBajaId(bajaId)` | `GET /ventas/:bajaId` | — | `{ venta: { id, aveId, fecha, celular, comprador, ciudadDestino, cooperativaEnvio, valorVenta, valorEnvio, detalle, aveCodigo } }` | `404 VENTA_NO_ENCONTRADA` → el cliente devuelve `null` |
| `actualizarMovimientoManual` | `PUT /movimientos/:movimientoId` | `{ tipo, categoria, valor, detalle, fecha }` (el `id` va en la ruta) | `{ id }` (200); el cliente devuelve `undefined` | `404 MOVIMIENTO_NO_ENCONTRADO`; `409 MOVIMIENTO_AUTOMATICO_NO_EDITABLE`; `400 VALOR_INVALIDO` (en ese orden de evaluación) |
| `corregirVentaFinanciera` | `POST /ventas/:bajaId/correccion` | `{ valorVenta, valorEnvio }` | `{ bajaId }` (200); el cliente devuelve `undefined` | `400 VALOR_INVALIDO` (antes de leer nada); `404 VENTA_NO_ENCONTRADA` |
| `obtenerHistorialMovimiento` | `GET /movimientos/:movimientoId/historial` | — | `{ historial: [{ id, movimientoId, fecha, accion, tipoAnterior, tipoNuevo, categoriaAnterior, categoriaNueva, fechaMovimientoAnterior, fechaMovimientoNueva, valorAnterior, valorNuevo, detalleAnterior, detalleNuevo, origenTipo, origenId }] }` (`fecha DESC`, `rowid DESC`); movimiento inexistente → `[]`, **sin 404** (V1 no comprueba) | solo comunes |
| `obtenerConsolidadoCategorias(periodo)` | `GET /consolidado/categorias?periodo=` | igual que resumen | `{ categorias: [{ tipo, categoria, cantidad, total }] }` (`tipo DESC`, `total DESC`) | solo comunes |
| `obtenerConsolidadoMensual(limite)` | `GET /consolidado/mensual?limite=12` | `limite` opcional; el servidor aplica `Number(limite) \|\| 12` | `{ meses: [{ periodo, ingresos, egresos }] }` | solo comunes |

Reglas del servidor (replican V1):
- **Alta** (`POST /ingresos|egresos`): `tipo` fijo por ruta; `categoria || 'OTRO'`; `fecha || new Date().toISOString()` (el servidor solo la rellena si falta, como V1); `Number(valor)`; `detalle || null`; `origen_tipo = 'MANUAL'`; `ave_id` y `origen_id` `NULL`. **Sin validar el importe** (V1 no lo valida en el repositorio). Sin historial.
- **PUT movimiento**: orden y reglas de la sección `actualizarMovimientoManual` (existe → origen `NULL`/`'MANUAL'` → `valor` finito `> 0` → normalizar → historial `EDICION_MANUAL` → `UPDATE`), en **un solo `db.batch`**. `fecha` del historial = instante del servidor.
- **POST corrección**: como V1, la validación de importes antes de tocar datos. El servicio **lee primero** (baja `VENTA` del criadero, los dos movimientos existentes por `(origen_tipo='VENTA_AVE', origen_id, categoria)` con el menor `rowid`) y luego ejecuta **un `db.batch`** con, en este orden: `UPDATE bajas_ave`, (historial + `UPDATE`) o (`INSERT` + historial `CREACION_POR_CORRECCION`) para `VENTA_AVE`, y lo mismo para `ENVIO_AVE`. Los UUID v7 de los INSERT se generan antes del batch; el historial de `CREACION_POR_CORRECCION` se construye con los mismos valores que se insertan (equivale a releer la fila). No escribe `ave_historial` ni toca `aves`. Ventana de concurrencia entre lectura y batch aceptada (V1 no tiene concurrencia).
- Los literales de historial y de `detalle` son los de las tablas anteriores; `ave_id` en `Venta de ave ${ave_id}` será el UUID de V2 (ver dudas).

## Tabla D1

Migración nueva (siguiente libre: `0010`; **el número y si Bajas la comparte los fija el orquestador** al coordinar con `bajas.md`). Convención de `0006`–`0009`: `fecha_creacion` como en V1, sin `created_at`/`updated_at`/`deleted_at`/`version`/CHECK (V1 no tiene baja lógica de movimientos: no se borran ni se desactivan).

### `movimientos_financieros` (replica `migrations.js:320-343`)

| Columna | Tipo | Regla | Origen V1 |
|---|---|---|---|
| id | TEXT PRIMARY KEY NOT NULL | UUID v7 (servidor) | `id` INTEGER AUTOINCREMENT |
| criadero_id | TEXT NOT NULL | FK criaderos(id) ON DELETE RESTRICT ON UPDATE RESTRICT | nuevo |
| tipo | TEXT NOT NULL | `INGRESO`/`EGRESO`; sin CHECK | `tipo` |
| categoria | TEXT | nullable (código del catálogo; no FK) | `categoria` |
| fecha | TEXT NOT NULL | ISO UTC enviada por la app | `fecha` |
| valor | REAL NOT NULL | sin redondeo | `valor` |
| detalle | TEXT | nullable | `detalle` |
| ave_id | TEXT | nullable; FK aves(id) RESTRICT/RESTRICT | `ave_id` (FK a aves) |
| origen_tipo | TEXT | nullable (`MANUAL`, `VENTA_AVE`) | `origen_tipo` |
| origen_id | TEXT | nullable; **sin FK** (V1 no la tiene; para `VENTA_AVE` es `bajas_ave.id`) | `origen_id` INTEGER |
| fecha_creacion | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | | `fecha_creacion` |

Índices (solo rendimiento, no cambian resultados): `ix_movimientos_financieros_criadero_fecha (criadero_id, fecha)` (sustituye `idx_movimientos_fecha`, `migrations.js:364-365`), `ix_movimientos_financieros_origen (criadero_id, origen_tipo, origen_id)` (sustituye `idx_movimientos_financieros_origen`, `migrationV6.js:48-50`) e `ix_movimientos_financieros_ave (ave_id)` (FK).

### `movimientos_financieros_historial` (replica `migrationV6.js:20-40`)

| Columna | Tipo | Regla |
|---|---|---|
| id | TEXT PRIMARY KEY NOT NULL | UUID v7 |
| criadero_id | TEXT NOT NULL | FK criaderos RESTRICT |
| movimiento_id | TEXT NOT NULL | FK movimientos_financieros(id) RESTRICT |
| fecha | TEXT NOT NULL | instante de la corrección (ISO) |
| accion | TEXT NOT NULL | `EDICION_MANUAL`, `CORRECCION_VENTA`, `CORRECCION_ENVIO`, `CREACION_POR_CORRECCION` |
| tipo_anterior, tipo_nuevo | TEXT | nullable |
| categoria_anterior, categoria_nueva | TEXT | nullable |
| fecha_movimiento_anterior, fecha_movimiento_nueva | TEXT | nullable |
| valor_anterior, valor_nuevo | REAL | nullable |
| detalle_anterior, detalle_nuevo | TEXT | nullable |
| origen_tipo | TEXT | nullable |
| origen_id | TEXT | nullable; sin FK |

(V1 no tiene `fecha_creacion` en esta tabla; no se añade.) Índice `ix_movimientos_financieros_historial_movimiento (movimiento_id)` (sustituye `idx_mov_fin_hist_movimiento`, `migrationV6.js:43-45`).

### Dependencia con Bajas (qué debe existir ya)

- **Bajas necesita `movimientos_financieros`** (su `registrarVentaAve` inserta dos ingresos, `VENTA_AVE` y `ENVIO_AVE`, en su transacción, `BajaAveRepository.js:275-353`) y **no** necesita `movimientos_financieros_historial` (no escribe historial). Por tanto, `movimientos_financieros` debe crearse **antes o con** la migración de Bajas; recomendado: una migración de Finanzas con **las dos tablas** antes de Bajas, de modo que Bajas escriba en una tabla ya existente y sin FK en `origen_id`.
- **Finanzas depende de `bajas_ave`** solo para tres piezas: `obtenerVentaPorBajaId`, `corregirVentaFinanciera` (lee y actualiza `bajas_ave`) y el `ave_codigo` de las ventas (ya cubierto por `aves`). Orden recomendado: (1) Finanzas sin ventas: resumen, lista, altas manuales, edición manual, historial y consolidados (no requieren `bajas_ave`); (2) Bajas; (3) `GET /ventas/:bajaId` y `POST /ventas/:bajaId/correccion`. Si se implementan juntos, la corrección debe vivir en el servicio de Finanzas y escribir `bajas_ave` por su repositorio.

### Relación con Bajas (solo anotada; no se especifica aquí)

- `origen_tipo = 'VENTA_AVE'` y `origen_id = bajas_ave.id` (en V1 `baja.lastInsertRowId`, `BajaAveRepository.js:320,351`), `ave_id = bajas_ave.ave_id`. Dos movimientos por venta: categoría `VENTA_AVE` con `valor_venta ?? 0` y categoría `ENVIO_AVE` con `valor_envio ?? 0` (siempre ambos, aunque sea `0`); `detalle` `Venta de ave ${aveId} a ${comprador}` o `Venta de ave ${aveId}` y `Envío de venta de ave ${aveId} a ${comprador}` o `Envío de venta de ave ${aveId}`; sin historial. `bajas_ave.valor_venta`/`valor_envio` pueden ser `NULL` (`numeroNoNegativo` de Bajas devuelve `null` en vacío) mientras el movimiento guarda `0`.

## Catálogo `CATEGORIAS_FINANCIERAS` (e)

- Las pantallas Nuevo y Editar lo leen con `obtenerCatalogoPorCodigo('CATEGORIAS_FINANCIERAS')` y luego `obtenerItemsCatalogo(catalogo.id)` (`NuevoMovimientoFinancieroScreen.js:76-96`; `EditarMovimientoFinancieroScreen.js:84-98`) y filtran por listas de **códigos fijos** (ver arriba). Usan `item.id`, `item.codigo` y `item.nombre`. Es la lectura ya resuelta por `ConfiguracionRepository.api.js` (`catalogos.md`); Finanzas **no añade endpoint de catálogo**.
- D1 ya trae 8 ítems por criadero: `VENTA_AVE` 'Venta de ave', `VENTA_HUEVOS` 'Venta de huevos', `ALIMENTO` 'Alimento', `MEDICAMENTO` 'Medicamento', `INFRAESTRUCTURA` 'Infraestructura', `COMPRA_AVE` 'Compra de ave', `OTRO` 'Otro', `ENVIO_AVE` 'Envío de ave' (`defaultCatalogItems.ts:187-235`; en V1 `ENVIO_AVE` lo añadió `migrationV6.js:53-73`). Coinciden con los 8 códigos que la pantalla conoce.
- Consecuencia de V1 que se replica: `ConfiguracionScreen.js:52` permite editar ese catálogo, pero **las categorías creadas por el usuario nunca se ofrecen** (la lista está filtrada por códigos fijos) y una categoría desconocida se muestra con su código en la lista (`FinanzasScreen.js:1063-1069`). Los nombres de la lista de movimientos (mapa fijo, p. ej. 'Venta de aves') difieren de los del catálogo ('Venta de ave'); no se unifican.
- El servidor **no valida** `categoria` contra el catálogo (V1 no lo hace).
- Si al abrir "Editar" el movimiento tiene una categoría que no está en el catálogo cargado, la pantalla usa `{ id, codigo, nombre }` con el propio código (`:99-109`).

## Excepciones técnicas por pasar a online

- **IDs TEXT UUID v7** en `movimientos_financieros.id` y `movimientos_financieros_historial.id`; también `origen_id` y `ave_id` pasan a texto. `registrarIngreso`/`registrarEgreso` ya no pueden devolver `lastInsertRowId`: el servidor devuelve `{ id }` y el cliente devuelve ese `id` (las pantallas lo ignoran). Las pantallas solo usan `id` como `key` y como parámetro de navegación (`movimientoId`), sin `Number()`/`parseInt` (revisadas las tres pantallas completas).
- **`criadero_id`** en ambas tablas y en toda lectura/escritura (ownership por criadero); los totales y consolidados son por criadero (V1: una base por dispositivo).
- **FK `RESTRICT`** en lugar de las FK sin acción de V1 (V1: `ave_id → aves(id)`, `movimiento_id → movimientos_financieros(id)`).
- **Transacciones → `db.batch`** (`actualizarMovimientoManual`, `corregirVentaFinanciera`); lecturas previas del servicio por no poder leer dentro del batch.
- **Reloj**: `strftime(..., :ahora)` con el instante que inyecta el servicio en lugar de `'now'` (mismo resultado, UTC); `fecha` del historial = reloj del servidor (V1: dispositivo).
- **Desempate `rowid DESC`** en lugar de `id DESC` (el `id` UUID no es autoincremental) en movimientos, historial y en `ORDER BY ... LIMIT 1` del movimiento existente (V1: `ORDER BY id`; aquí `ORDER BY rowid`).
- **Códigos de error → HTTP**: `MOVIMIENTO_NO_ENCONTRADO` 404, `VENTA_NO_ENCONTRADA` 404, `MOVIMIENTO_AUTOMATICO_NO_EDITABLE` 409, `VALOR_INVALIDO` 400; el cliente los convierte en `new Error('<CODIGO>')` con el mismo texto que V1. `obtenerMovimientoPorId` y `obtenerVentaPorBajaId` devuelven `null` en el cliente ante el 404 (V1: `null`).
- **`400 VALIDATION_ERROR` por tipos del cuerpo** (cuerpo no JSON, `detalle` no texto, importe no serializable): solo para poder enlazar a D1 sin 500; V1 no lo hacía (en V1 `detalle.trim` ya fallaría con `TypeError` en la edición). No es regla de negocio.
- **Errores de red y autenticación** (401, 403, `CRIADERO_NOT_FOUND`, caída de red): los propaga el cliente REST (`ApiError`).
- **Texto `Venta de ave ${ave_id}`**: contendrá el UUID de V2 (en V1 un entero); es consecuencia de UUID v7 (ver duda 4).

## Casos de paridad

Convención de importes: se prueban con decimales (`0.1`, `0.2`, `19.99`, `1234567.89`); comparar con `Number` exacto del mismo cálculo (SQL `SUM` y resta JS), no con redondeos.

| id | dado | cuando | entonces | evidencia V1 |
|---|---|---|---|---|
| FIN-01 | Criadero sin movimientos | `obtenerResumenFinanciero('TODO')` / `'MES'` / `'ANIO'` | `{ ingresos: 0, egresos: 0, utilidad: 0 }` en los tres | `:20-65` |
| FIN-02 | INGRESO `0.1`, INGRESO `0.2`, EGRESO `0.1` | `obtenerResumenFinanciero('TODO')` | `ingresos` = `SUM` de `0.1` y `0.2` (en JS `0.30000000000000004`; visible `$0.30`), `egresos` `0.1`, `utilidad = ingresos - egresos` en JS (`0.20000000000000004`, visible `$0.20`); sin redondeo en servidor ni cliente | `:23-65`; `FinanzasScreen.js:396-399` |
| FIN-03 | INGRESO `19.99` y EGRESO `1234567.89` | `registrarIngreso`/`registrarEgreso` y luego `obtenerMovimientosFinancieros` | `valor` devuelto idéntico (`19.99` y `1234567.89`) | `:225`; `:75-95` |
| FIN-04 | Movimientos del mes UTC actual, del mes anterior y del año anterior | resumen con `'MES'`, `'ANIO'`, `'TODO'` | MES solo el mes UTC actual; ANIO solo el año UTC actual; TODO todos; periodo desconocido = TODO | `:763-778` |
| FIN-05 | Movimiento con fecha `2026-10-31T23:30:00.000Z` y reloj fijado en `2026-11-01T00:10:00Z` | resumen `'MES'` | no entra (mes UTC `2026-10` ≠ `2026-11`), aunque en Ecuador siga siendo 31/oct | `:769` |
| FIN-06 | Movimiento con fecha futura en otro mes | resumen `'MES'` | no entra (igualdad, no `>=`); sí entra en `'TODO'` | `:769,776` |
| FIN-07 | Movimiento con `tipo` distinto de INGRESO/EGRESO | resumen y consolidado mensual | no suma a `ingresos`/`egresos`; el consolidado por categoría sí lo lista | `:23-43,706-715` |
| FIN-08 | 3 movimientos con fechas distintas y 2 con la misma `fecha` | `obtenerMovimientosFinancieros` | todos, `fecha` descendente; empate: el insertado después primero; claves `id, tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id, ave_codigo`; `ave_codigo` `null` si no hay ave | `:77-95` |
| FIN-09 | Mezcla de ingresos y egresos | `obtenerIngresos` / `obtenerEgresos` | solo ese `tipo`; sin clave `tipo` | `:107-125,137-155` |
| FIN-10 | Alta con `categoria` ausente/`''`, `fecha` ausente, `detalle ''` | `registrarIngreso` | `categoria 'OTRO'`, `fecha` ISO actual, `detalle NULL`, `origen_tipo 'MANUAL'`, `ave_id`/`origen_id NULL`; devuelve el id; **ninguna fila de historial** | `:210-232` |
| FIN-11 | Alta con `valor` `0` o negativo (llamada directa) | `registrarEgreso` | se guarda sin error (el repositorio no valida); la pantalla lo impide | `:196-233`; `NuevoMovimientoFinancieroScreen.js:116-128` |
| FIN-12 | `valor` no numérico (`'1,5'`) enviado desde Nuevo | `guardar` | la pantalla no lo rechaza (`NaN<=0` es falso); el repositorio hace `Number('1,5')` = `NaN`; resultado en SQLite no verificado (ver duda 2); en V2, error sin mensaje (solo `console.error`) | `NuevoMovimientoFinancieroScreen.js:116-128,184-191`; `:225` |
| FIN-13 | Sin categoría seleccionada / valor vacío o `<= 0` | pulsar "Guardar movimiento" | `Alert('Categoría requerida', 'Seleccione una categoría.')` / `Alert('Valor inválido', 'Ingrese un valor mayor a cero.')`; no se llama al repositorio | `NuevoMovimientoFinancieroScreen.js:104-128` |
| FIN-14 | Guardado correcto | `guardar` | `Alert('Movimiento guardado', 'El movimiento financiero fue registrado correctamente.')`, "Aceptar" vuelve atrás | `:170-180` |
| FIN-15 | Movimiento manual con valor `10` | `actualizarMovimientoManual({ id, tipo:'EGRESO', categoria:'ALIMENTO', valor:12.5, detalle:' x ', fecha })` | 1 fila `EDICION_MANUAL` (anterior: tipo/categoría/fecha/valor/detalle viejos; nuevo: `EGRESO`, `ALIMENTO`, fecha enviada, `12.5`, `'x'`; `origen_tipo`/`origen_id` del anterior) **antes** del `UPDATE`; `ave_id`/`origen_*` no cambian; devuelve `undefined` | `:307-395,619-668` |
| FIN-16 | Edición sin cambiar nada | `actualizarMovimientoManual` con los mismos datos | igualmente se escribe una fila de historial | `:363-374` |
| FIN-17 | `tipo` ausente o distinto de `'EGRESO'` / `categoria` vacía / `detalle ''` / `fecha` ausente | `actualizarMovimientoManual` | `tipo 'INGRESO'`, `categoria 'OTRO'`, `detalle NULL`, `fecha` anterior | `:346-361` |
| FIN-18 | Movimiento con `origen_tipo` `NULL` (legado) | `actualizarMovimientoManual` | se edita (solo se rechaza `origen_tipo` verdadero y ≠ `'MANUAL'`) | `:323-331` |
| FIN-19 | Movimiento `VENTA_AVE` o `ENVIO_AVE` de una venta | `actualizarMovimientoManual` | `Error('MOVIMIENTO_AUTOMATICO_NO_EDITABLE')`, nada escrito; la pantalla muestra `Error` / `No fue posible actualizar el movimiento.` | `:323-331`; `EditarMovimientoFinancieroScreen.js:239-245` |
| FIN-20 | `id` inexistente / `valor` `0`, `'abc'`, `null` | `actualizarMovimientoManual` | `Error('MOVIMIENTO_NO_ENCONTRADO')` (se evalúa primero) / `Error('VALOR_INVALIDO')`; nada escrito | `:317-344` |
| FIN-21 | Movimiento `VENTA_AVE` sin baja localizable | abrir "Editar" y guardar | formulario manual y, al guardar, `Alert` genérico por `MOVIMIENTO_AUTOMATICO_NO_EDITABLE` | `EditarMovimientoFinancieroScreen.js:335-338`; `FinanzasRepository.js:323-331` |
| FIN-22 | Venta con sus dos movimientos | `corregirVentaFinanciera({ bajaId, valorVenta:'120,50', valorEnvio:'' })` | `bajas_ave.valor_venta = 120.5`, `valor_envio = 0`; ambos movimientos actualizados (`tipo INGRESO`, `fecha = bajas_ave.fecha`, `valor`, `detalle` literal) con filas `CORRECCION_VENTA` y `CORRECCION_ENVIO`; no cambia `aves` ni `ave_historial`; devuelve `undefined` | `:412-485`; `:781-811` |
| FIN-23 | Venta sin movimiento `ENVIO_AVE` | `corregirVentaFinanciera` con envío `5` | se inserta el movimiento (`INGRESO`, `ENVIO_AVE`, `origen_tipo 'VENTA_AVE'`, `origen_id` = baja) y una fila `CREACION_POR_CORRECCION` con todos los `*_anterior` `NULL` | `:563-614` |
| FIN-24 | Venta con envío `0` y sin movimiento `ENVIO_AVE` | `corregirVentaFinanciera` | también se crea el movimiento con `valor 0` | `:563-588` |
| FIN-25 | Importes con decimales (`0.1`, `19.99`) | `corregirVentaFinanciera` | se guardan idénticos en `bajas_ave` y movimientos | `:452-465,534-557` |
| FIN-26 | `valorVenta` negativo o `'abc'` | `corregirVentaFinanciera` | `Error('VALOR_INVALIDO')` **antes** de la transacción; nada escrito; la pantalla ya lo impide con `Valor inválido` / `El valor del ave y el valor de envío deben ser números mayores o iguales a cero.` | `:412-430`; `EditarMovimientoFinancieroScreen.js:265-275` |
| FIN-27 | `bajaId` inexistente o de tipo `MUERTE` | `corregirVentaFinanciera` | `Error('VENTA_NO_ENCONTRADA')`; nada escrito | `:435-450` |
| FIN-28 | Venta con movimientos duplicados de la misma categoría (dato legado) | `corregirVentaFinanciera` | solo se actualiza el de menor `id` (V2: menor `rowid`) | `:502-517` |
| FIN-29 | Movimiento con 3 correcciones | `obtenerHistorialMovimiento` | 3 filas, `fecha` descendente, desempate el último primero; la pantalla muestra `accion` crudo, `Valor: $a → $b` y `Categoría: x → y` solo si cambió | `:678-686`; `EditarMovimientoFinancieroScreen.js:558-582` |
| FIN-30 | Movimiento sin historial o inexistente | `obtenerHistorialMovimiento` | `[]` sin error; la pantalla muestra `Este movimiento todavía no tiene correcciones registradas.` | `:678-686`; `:551-557` |
| FIN-31 | `id` inexistente | `obtenerMovimientoPorId` | `null`; la pantalla muestra `Movimiento no encontrado.` | `:243-254`; `EditarMovimientoFinancieroScreen.js:74-77,324-332` |
| FIN-32 | Movimientos de INGRESO (2 categorías) y EGRESO (1) | `obtenerConsolidadoCategorias('TODO')` | filas `{ tipo, categoria, cantidad, total }` con `INGRESO` primero y `total` descendente; `categoria NULL` → `'OTRO'` | `:704-716` |
| FIN-33 | Movimientos en 14 meses distintos | `obtenerConsolidadoMensual(12)` | 12 filas `{ periodo:'YYYY-MM', ingresos, egresos }` del más reciente al más antiguo; no hay filas de relleno; con un mes sin movimientos entre dos meses con datos, ese mes **no** aparece | `:730-757` |
| FIN-34 | Movimientos solo en 2 meses | `obtenerConsolidadoMensual(12)` | 2 filas (no 12); la pantalla muestra `+$`/`-$` por `balance >= 0` | `:752-757`; `FinanzasScreen.js:582-644` |
| FIN-35 | `limite` `0`, `'x'` o ausente | `obtenerConsolidadoMensual` | usa `12` | `:757` |
| FIN-36 | Mes con solo egresos | `obtenerConsolidadoMensual` | `ingresos 0`, `egresos` total; `balance` negativo `-$x.xx` | `:732-751`; `FinanzasScreen.js:617-631` |
| FIN-37 | Dos criaderos de la misma cuenta | cualquier lectura | cada uno ve solo sus movimientos y totales (diferencia técnica) | `criadero_id` |
| FIN-38 | Fallo de red al abrir Finanzas | `cargar` | solo `console.error`; `loading` se apaga; la pantalla queda con ceros y listas vacías (V1 no mostraba `Alert`) | `FinanzasScreen.js:137-151` |
| FIN-39 | Fallo de red al guardar un movimiento nuevo | `guardar` | solo `console.error`, sin mensaje (V1 igual); el botón se rehabilita | `NuevoMovimientoFinancieroScreen.js:184-196` |
| FIN-40 | Fallo de red al abrir "Editar" | `cargar` | `Alert('Error', 'No fue posible cargar el movimiento.')` | `EditarMovimientoFinancieroScreen.js:145-154` |

## Qué haría falta para que Clientes y Reportes lean la nube (h; no se implementa)

- **`ClientesRepository.js`** no lee `movimientos_financieros`: son tres consultas sobre `bajas_ave` (y `aves` para las compras): `obtenerClientes` (`:7-97`, agrupa por `celular`, subconsultas de nombre y ciudad más recientes, `SUM(valor_venta)`, `SUM(valor_envio)`, `MAX(fecha)`), `obtenerClientePorCelular` (`:101-191`) y `obtenerComprasCliente` (`:195-241`). Solo necesita endpoints de **Bajas** (p. ej. `/clientes`, `/clientes/:celular`, `/clientes/:celular/compras`, con el mismo SQL y `criadero_id`) y **no** requiere Finanzas. Relación: `corregirVentaFinanciera` modifica `bajas_ave.valor_venta`/`valor_envio` y por tanto cambia `total_ventas`/`total_envios` de los clientes; ese cambio ya queda en D1 si la corrección escribe `bajas_ave`.
- **`ReportesRepository.obtenerReporteFinanzas`** (`:99-123`, sin periodo; `{ ingresos, egresos, utilidad }` con la misma forma que el resumen): basta `GET /finanzas/resumen?periodo=TODO` (sin endpoint nuevo); consumo `ReportesScreen.js:72,242-248`.
- **`ReportesRepository.obtenerExportacionFinanzas`** (`:217-240`): columnas `Fecha, Tipo, Categoria, Valor, Detalle, Ave (codigo), Origen (origen_tipo), OrigenId (origen_id)`, `ORDER BY mf.fecha DESC, mf.id DESC`: se puede construir en el cliente con `GET /finanzas/movimientos` (mismos datos y orden; solo renombrar claves). `obtenerExportacionVentas` y `obtenerExportacionClientes` (`:162-214`) leen `bajas_ave` y dependen de Bajas.
- **`DashboardRepository`** (`:116-150`, `finanzas` del mes UTC actual; `InicioScreen.js:882-893`) y **`AlertasRepository.obtenerAlertasFinanzas`** (`:486-619`; alerta `FINANZAS`, nivel `ALTO`, título `Gastos superiores a ingresos`, mensaje `Los egresos del mes superan los ingresos registrados.`, solo si `egresos > ingresos` del mes UTC): ambos equivalen a `GET /finanzas/resumen?periodo=MES` (misma regla UTC e igualdad de `strftime`). Con ese endpoint, la fase 6 solo necesita un cliente que llame a `obtenerResumenFinanciero('MES')`.
- Todas esas lecturas deben salir de la nube en fase 6 (Inicio, Alertas y Reportes siguen leyendo SQLite hoy y **no verán** los movimientos de la nube; limitación conocida a anotar al implementar).
- `BackupRepository` no menciona `movimientos_financieros` (búsqueda sin límite): su restauración trata la base completa; fuera de alcance.

## Dudas técnicas

1. **`obtenerIngresos` y `obtenerEgresos` no tienen llamadores.** Propuesta: implementarlas igual en `.api.js` (con `GET /movimientos?tipo=`), como se hizo con las funciones sin llamadores de Huevos. Alternativa: omitirlas. Lo decide el usuario (ver DUDA PARA EL USUARIO 1).
2. **Resultado de `Number('1,5')` = `NaN` en el `INSERT`** (`registrarMovimientoManual`, `:225`): no se confirma en el código si `expo-sqlite` lo enlaza como `NULL` (violaría `NOT NULL` y la pantalla solo haría `console.error`) o lo guarda de otra forma. En V2 `JSON.stringify(NaN)` da `null` y se rechazaría por tipo (`400`). Comportamiento visible esperado igual: sin guardar y sin mensaje.
3. **`SUM` de REAL entre versiones de SQLite.** V1 usa el SQLite embebido de `expo-sqlite`; D1 usa el suyo. Si difieren en el algoritmo de suma (compensada o no), podría haber diferencias del orden de 1e-16; la pantalla redondea a 2 decimales. Verificar con FIN-02 en la prueba de datos.
4. **`Venta de ave ${ave_id}`** pasará a llevar un UUID largo en V2 (en V1, un entero) tanto en `registrarVentaAve` (Bajas) como en la corrección. Es consecuencia de los IDs UUID v7; la pantalla no muestra ese detalle en la lista salvo como `detalle` del movimiento (`FinanzasScreen.js:857-861`). Se replica el texto con el id.
5. **Hora del historial**: `registrarAuditoria` usa el reloj del dispositivo (V1); en V2 sería el del servidor. Diferencia técnica, sin efecto visible salvo desfase de reloj.
6. **`ORDER BY tipo DESC, total DESC` y `ORDER BY mf.fecha DESC`** sin desempate completo en V1 (empates en `total`): el orden entre empates no está definido; los casos de paridad deben evitar empates.
7. **Estado D1 de `bajas_ave`**: no existe aún (búsqueda en `api/` sin resultados); `obtenerVentaPorBajaId` y la corrección quedan bloqueadas hasta que Bajas cree la tabla (ver "Dependencia con Bajas"). La spec `bajas.md` está en redacción por otro agente; pueden compartir migración.
8. **Dos movimientos de venta pueden quedar con `valor 0`** (el de envío se crea siempre, también con `0`); las listas los muestran como `+$0.00`. Se replica.

## DUDA PARA EL USUARIO

1. **`obtenerIngresos` / `obtenerEgresos` sin llamadores.** ¿Se implementan en el cliente y la API (como las funciones sin llamadores de Huevos) o se omiten (como `actualizarEstadoSaludAve` en Salud)?
2. **Excepciones a pantallas V1 por errores de red** (solo si se aprueban; hoy V1 no las tiene, y el precedente son las excepciones ya aprobadas en Alimentación, Bebida, Salud y Producción de huevos):
   - `NuevoMovimientoFinancieroScreen.js:184-191`: el `catch` de `guardar` solo hace `console.error`; con la red caída el usuario no ve nada (el botón se rehabilita). Propuesta: `Alert.alert('Error', 'No fue posible guardar el movimiento.')`.
   - `NuevoMovimientoFinancieroScreen.js:76-96` (`cargarCategorias`, llamada sin `await` desde `useEffect`, `:60-64`): no tiene `try/catch`; con la red caída hay una promesa rechazada sin manejar y no aparecen categorías. Propuesta: `try/catch` con aviso.
   - `FinanzasScreen.js:137-144`: el `catch` de `cargar` solo hace `console.error`; con la red caída muestra ceros y listas vacías como si no hubiera datos (mismo caso que HUE-25, ya aprobado en `ProduccionHuevosScreen`). Propuesta: `Alert.alert('Error', 'No fue posible cargar las finanzas.')`.
   - `EditarMovimientoFinancieroScreen.js` ya tiene `try/catch` con `Alert` en carga, guardado manual y corrección de venta (`:145-154,239-245,298-304`): no necesita excepción.
   - **IDs UUID**: ninguna de las tres pantallas usa `Number()`, `parseInt` ni comparaciones numéricas sobre `id`/`origen_id`/`ave_id` (evidencia: lectura completa; los `id` solo son `key`, parámetro de navegación y `categoria?.id === item.id` entre ítems del catálogo), así que **no** se necesita excepción por UUID.
3. **Orden de implementación respecto de Bajas** (decisión de producto/plan): ¿Finanzas primero con sus dos tablas y sin las funciones de venta, luego Bajas, y por último `GET /ventas/:bajaId` y la corrección? ¿O ambos módulos en una sola migración/entrega?
4. **Resultado de los textos del historial `Venta de ave ${ave_id}` con UUID** (duda técnica 4): ¿se acepta que el `detalle` lleve el UUID del ave, como consecuencia directa de UUID v7?
