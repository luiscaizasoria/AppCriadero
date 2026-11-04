# Spec: bajas

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).

## Estado

borrador (2026-11-03). Sin implementar. Tiene una **dependencia con Finanzas** (tabla `movimientos_financieros`, sección "Dependencia con Finanzas") y varias dudas para el usuario (sección "Dudas").

Alcance: aves individuales (sin lotes), sin sincronización offline, D1 como fuente de verdad. Las líneas son del árbol actual (v1.0.3, `app.json:5`).

## Fuente V1

- `src/repositories/BajaAveRepository.js`: `registrarMuerteAve` 7-129, `registrarVentaAve` 133-436, `obtenerBajasAve` 440-490 (**OMITIDA**, ver abajo), `normalizarCelular` 494-536, `numeroNoNegativo` 540-579 (funciones privadas).
- `src/screens/BajaAveScreen.js` (único llamador de `registrarMuerteAve`/`registrarVentaAve`: 145 y 205; import 17-20). Ruta `BajaAve` en `src/navigation/AvesStackNavigator.js:67-68`; única entrada: botón "⚫ Dar de baja" de `DetalleAveScreen.js:1020-1052`, solo con `ave.estado === 'ACTIVA'`.
- `src/screens/DetalleAveScreen.js`: carga la baja con `obtenerBajaAve` (de `AveRepository`) en `cargarDatos` 107-116; tarjeta "Información de venta"/"Información de fallecimiento" 580-686 (solo si `ave.estado !== 'ACTIVA'`); `formatearDinero` 1207-.
- Listas: `AveRepository.sqlite.js` `obtenerAvesVendidas` 1760-1826 y `obtenerAvesFallecidas` 1828-1889 (`INNER JOIN bajas_ave`), `obtenerBajaAve` 1891-1929. Consumidor: `AvesScreen.js:67-75`.
- API actual: `api/src/aves/aves.repository.ts:149-170` (`listarBajas`, interino sin `bajas_ave`), `aves.types.ts:40-41,222`; cliente `AveRepository.api.js:350-382` (`obtenerAvesVendidas`/`Fallecidas` por `?estado=`; `obtenerBajaAve` devuelve `null`, 376-382); `CicloVidaRepository.api.js:236` (`const bajas = [];`) y 641-645.
- Esquema V1: `src/database/migrations.js:292-317` (`bajas_ave`), `:320-343` (`movimientos_financieros`), `:133-154` (`ave_historial`), `:364-365` (`idx_movimientos_fecha`); `migrationV5.js:18-28` (`celular`, `valor_envio`, `idx_bajas_ave_celular`); `migrationV6.js:20-50` (`movimientos_financieros_historial`, `idx_movimientos_financieros_origen`) y `:76-106` (relleno histórico de `ENVIO_AVE`).
- Búsquedas sin límite en `src/` (resultados completos revisados):
  - `registrarMuerteAve`/`registrarVentaAve`: solo `BajaAveRepository.js` y `BajaAveScreen.js`.
  - **`obtenerBajasAve`: solo su definición (`BajaAveRepository.js:440`); cero llamadores** (consistente con `aves.md` hallazgo 9). **Decisión del usuario: se OMITE** (no se implementa en `.api.js`; en `.sqlite.js` queda el código V1 intacto).
  - `obtenerBajaAve`: `DetalleAveScreen.js:30,108`, `AveRepository.js:81`, `.sqlite.js:1891`, `.api.js:378`.
  - `bajas_ave` también la leen `CicloVidaRepository.sqlite.js:135-159` y, **fuera de alcance** (siguen en SQLite): `ClientesRepository.js` (22-223), `ReportesRepository.js:179,205`, `FinanzasRepository.js:280,439,454`.
- **No hay `jaula_historial` ni liberación de jaula**: `BajaAveRepository.js` no menciona `jaula_historial` ni `jaula_actual_id` (búsqueda sin límite: 0 coincidencias). Las aves VENDIDA/FALLECIDA conservan `jaula_actual_id` (`aves.md` sección de estados).

### Hallazgos

1. **`ENVIO_AVE` se inserta SIEMPRE en una venta, aunque `valor_envio` sea vacío/0**: `BajaAveRepository.js:325-353` no tiene condición (`valorEnvioGuardar ?? 0`). La condición `> 0` solo está en el relleno histórico de la migración V6 (`migrationV6.js:98`), no en `registrarVentaAve`. Se replica el código: dos filas de `movimientos_financieros` por venta, la de envío con `valor` 0 si no hubo envío. (Discrepancia con lo supuesto en el encargo; ver Dudas.)
2. **Orden de escrituras**: `UPDATE aves` primero y `INSERT bajas_ave` después (al revés de lo que se podría suponer). Con `foreign_keys = ON` (`sqlite.js:63`), un `aveId` inexistente hace fallar el `INSERT bajas_ave` por FK y se revierte todo; no hay error de dominio.
3. **Sin verificación de estado**: no hay `SELECT` previo. Un ave ya VENDIDA o FALLECIDA puede darse de baja otra vez (otra fila en `bajas_ave`, otro `ave_historial` y, en venta, otros 2 ingresos); el `UPDATE` pisa el estado (un ave FALLECIDA puede pasar a VENDIDA). Solo la UI lo impide (botón con `ACTIVA`).
4. **Importes sin redondeo**: `REAL` en SQLite; `Number(valor)` tal cual (sin `toFixed`, sin centavos enteros). Las funciones privadas convierten valores inválidos a `null` en silencio (no lanzan).
5. Las dos funciones públicas devuelven `undefined`.
6. `BajaAveScreen` ya tiene `try/catch` con `Alert` y `disabled={guardando}` (ver "Pantallas"): cubre los errores de red sin excepción nueva.
7. En V1 `aveId`, `bajas_ave.id` y `movimientos_financieros.origen_id` son enteros; `origen_id` guarda `baja.lastInsertRowId` (`:320,351`). En V2 serán UUID (excepción técnica).

## Contrato del repositorio

Fachada propuesta (como Aves/Salud): `BajaAveRepository.js` elige `.sqlite.js` (código V1 intacto, incluida `obtenerBajasAve`) o `.api.js` (solo `registrarMuerteAve` y `registrarVentaAve`). `obtenerBajaAve` sigue en `AveRepository` (su `.api.js` pasa de `null` a leer `GET /bajas`).

### `registrarMuerteAve({ aveId, causa, detalle })` (`BajaAveRepository.js:7-129`)

- `fecha = new Date().toISOString()` (`:18-20`), una sola, usada en las tres escrituras. La función **no recibe fecha**.
- Todo dentro de `db.withTransactionAsync` (`:24-127`), en este orden exacto:
  1. `UPDATE aves SET estado = 'FALLECIDA', fecha_actualizacion = ? WHERE id = ?` con `[fecha, aveId]` (`:29-47`). No toca `jaula_actual_id`, `estado_salud` ni `fecha_ultimo_control_salud`.
  2. `INSERT INTO bajas_ave (ave_id, tipo, fecha, causa, detalle) VALUES (?,?,?,?,?)` con `[aveId, 'MUERTE', fecha, causa || null, detalle || null]` (`:51-85`). `celular`, `ciudad_destino`, `cooperativa_envio`, `comprador`, `valor_venta`, `valor_envio` quedan `NULL`.
  3. `INSERT INTO ave_historial (ave_id, tipo_evento, fecha, detalle) VALUES (?,?,?,?)` con `[aveId, 'MUERTE', fecha, detalle || 'Ave dada de baja por fallecimiento.']` (`:89-122`). `jaula_id` = `NULL`. Nótese: el detalle del historial es el `detalle` crudo o el texto por defecto (no incluye la causa).
- No escribe `jaula_historial`, no libera la jaula, no escribe `movimientos_financieros`.
- Errores: ninguno propio (sin validaciones). Ave inexistente: FK del paso 2 (ver arriba).

### `registrarVentaAve({ aveId, fechaVenta, celular, ciudadDestino, cooperativaEnvio, comprador, valorVenta, valorEnvio, detalle })` (`:133-436`)

Antes de la transacción (`:150-185`):
- `fecha = fechaVenta || new Date().toISOString()` (`:150-154`). La pantalla siempre envía `new Date().toISOString()` (`BajaAveScreen.js:209-211`).
- `celularNormalizado = normalizarCelular(celular)` (`:157-160`): `String(celular || '').replace(/\D/g, '')` (solo dígitos); si tiene 12 dígitos y empieza con `593` → `'0' + digitos.slice(3)`; si no, si tiene 9 dígitos y empieza con `9` → `'0' + digitos`; en otro caso se deja tal cual (`:494-536`). No valida longitud.
- Si `celularNormalizado` es `''` → `throw new Error('CELULAR_COMPRADOR_REQUERIDO')` (`:163-171`). **Antes de abrir la transacción: no escribe nada.**
- `valorVentaGuardar = numeroNoNegativo(valorVenta)` y `valorEnvioGuardar = numeroNoNegativo(valorEnvio)` (`:174-183`): `null`, `undefined` o texto vacío tras `trim` → `null`; `Number(valor)` no finito o `< 0` → `null` (**sin lanzar**; **sin** reemplazar coma por punto: eso lo hace la pantalla); si no, el número tal cual (el `0` se conserva como `0`) (`:540-579`).

Dentro de `db.withTransactionAsync` (`:187-434`), en este orden exacto:

1. `UPDATE aves SET estado = 'VENDIDA', fecha_actualizacion = ? WHERE id = ?` con `[fecha, aveId]` (`:192-210`). No toca `jaula_actual_id`.
2. `INSERT INTO bajas_ave (ave_id, tipo, fecha, celular, ciudad_destino, cooperativa_envio, comprador, valor_venta, valor_envio, detalle)` con `[aveId, 'VENTA', fecha, celularNormalizado, ciudadDestino || null, cooperativaEnvio || null, comprador || null, valorVentaGuardar, valorEnvioGuardar, detalle || null]` (`:214-271`). `causa` queda `NULL`. `valor_venta`/`valor_envio` son `NULL` si no se dieron (no `0`). Se guarda `baja.lastInsertRowId` (`:214`).
3. `INSERT INTO movimientos_financieros (tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id)` — **ingreso por la venta** (`:275-322`):
   - `tipo = 'INGRESO'`, `categoria = 'VENTA_AVE'`, `fecha` = la misma `fecha`.
   - `valor = valorVentaGuardar ?? 0` (nunca `NULL`: la columna es `NOT NULL`).
   - `detalle = comprador ? `Venta de ave ${aveId} a ${comprador}` : `Venta de ave ${aveId}`` (`:312-314`). `comprador` es el valor recibido (la pantalla lo envía con `trim`, `''` cuenta como vacío).
   - `ave_id = aveId`, `origen_tipo = 'VENTA_AVE'`, `origen_id = baja.lastInsertRowId`.
4. `INSERT INTO movimientos_financieros (…mismas 8 columnas…)` — **ingreso por el envío, SIEMPRE** (sin condición `> 0`) (`:325-353`):
   - `tipo = 'INGRESO'`, `categoria = 'ENVIO_AVE'`, `fecha` = la misma.
   - `valor = valorEnvioGuardar ?? 0`.
   - `detalle = comprador ? `Envío de venta de ave ${aveId} a ${comprador}` : `Envío de venta de ave ${aveId}`` (`:346-348`; con tilde en "Envío").
   - `ave_id = aveId`, `origen_tipo = 'VENTA_AVE'`, `origen_id = baja.lastInsertRowId`.
5. `INSERT INTO ave_historial (ave_id, tipo_evento, fecha, detalle)` con `[aveId, 'VENTA', fecha, partesHistorial.join(' ')]` (`:357-429`). `jaula_id` = `NULL`. `partesHistorial` se arma así: `'Ave vendida.'`, `` `Celular: ${celularNormalizado}` ``, y solo si hay valor: `` `Comprador: ${comprador}` ``, `` `Destino: ${ciudadDestino}` ``, y `detalle` (texto crudo), todo unido **con un espacio**. Ejemplo: `Ave vendida. Celular: 0991234567 Comprador: Juan Destino: Quito Gracias`. No incluye cooperativa ni importes.

- **No escribe `movimientos_financieros_historial`** (búsqueda sin límite: solo `FinanzasRepository.js` la escribe, `registrarAuditoria` 619-668, desde `actualizarMovimientoManual`, `corregirVentaFinanciera` y su sincronizador). Por tanto Bajas no necesita esa tabla.
- No escribe `jaula_historial` ni libera la jaula.
- Transacción: los 5 pasos son atómicos; si falla cualquiera, se revierte todo y la excepción llega a la pantalla.

### `obtenerBajasAve(aveId)` — omitida

Solo se documenta: `SELECT id, tipo, fecha, causa, celular, ciudad_destino, cooperativa_envio, comprador, valor_venta, valor_envio, detalle FROM bajas_ave WHERE ave_id = ? ORDER BY fecha DESC` (`:440-490`). Cero llamadores. No se implementa en la API ni en `.api.js`.

### Lecturas que necesitan los datos de la baja (de otros repositorios)

- **`obtenerBajaAve(aveId)`** (`AveRepository.sqlite.js:1891-1929`): una fila `{ id, tipo, fecha, causa, celular, ciudad_destino, cooperativa_envio, comprador, valor_venta, valor_envio, detalle }`, `ORDER BY fecha DESC LIMIT 1`, o `null` si no hay. Consumo: `DetalleAveScreen.js:107-116`; muestra Fecha, Nombre (`comprador`), Celular, Ciudad destino, Cooperativa, Valor venta y Valor envío (con `formatearDinero`, que devuelve `null` para `null`/`undefined`/`''`/no finito, `:1207-1238`) para VENDIDA, y Causa para FALLECIDA, más Detalle (`:599-682`). Con `baja` `null` la tarjeta se pinta con valores vacíos (`baja?.campo`).
- **`CicloVidaRepository`** `bajas` (`.sqlite.js:135-159`): mismas 11 columnas, `ORDER BY fecha DESC, id DESC`, todas las filas del ave. De ahí salen el evento `VENTA` "Ave vendida" (`:657-666`; líneas `Comprador:`, `Celular:`, `Destino:`, `Cooperativa:`, `Valor: $x.xx`, `Envío: $x.xx`, detalle; `.toFixed(2)` sobre `valor_venta`/`valor_envio` cuando no son `null`) y el evento `MUERTE` "Fallecimiento" (`:698-707`; `Causa:` y detalle). Los eventos `VENTA`/`MUERTE`/`BAJA` de `ave_historial` se excluyen de la línea de tiempo (`:207-223`), de modo que la única fuente de esos dos eventos es `bajas_ave`.
- **Listas** (`AveRepository.sqlite.js:1760-1889`): aves `VENDIDA`/`FALLECIDA` con `INNER JOIN bajas_ave b ON b.ave_id = a.id AND b.tipo = 'VENTA'|'MUERTE'`, `ORDER BY b.fecha DESC`. Campos del ave (los mismos que `obtenerAves`) más, vendidas: `fecha_venta, celular, ciudad_destino, cooperativa_envio, comprador, valor_venta, valor_envio, detalle`; fallecidas: `fecha_fallecimiento, causa, detalle`. Consumo: `AvesScreen.js:70-75`; la pantalla **no lee** ninguno de los campos de baja (búsqueda sin límite de `fecha_venta`/`fecha_fallecimiento`/`item.comprador`/`item.causa` en `src/screens`: solo `ClientesScreen`/`DetalleClienteScreen`, que usan otro repositorio); la baja solo condiciona qué aves aparecen y su orden.

### Pantallas que consumen (textos literales)

| Pantalla | Texto | Línea |
|---|---|---|
| BajaAveScreen | tipo sin elegir: Alert `'Seleccione una opción'` / `'Debe seleccionar si es venta o fallecimiento.'`, `return` (sin `guardando`) | 117-128 |
| BajaAveScreen | venta sin celular (`!celular.trim()`): Alert `'Celular requerido'` / `'Ingrese el número celular del comprador.'`, `return` | 162-173 |
| BajaAveScreen | valor no numérico o negativo (`convertirValorOpcional`, 761-810: coma → punto, `''` → `null`): Alert `'Valor inválido'` / `'El valor de venta y el valor de envío son opcionales, pero si se ingresan deben ser números mayores o iguales a cero.'` | 176-201 |
| BajaAveScreen | éxito: Alert `'Proceso completado'` / `'El ave fue registrada como vendida.'` o `'El ave fue registrada como fallecida.'`, botón `'Aceptar'` → `navigation.popToTop()` | 249-270 |
| BajaAveScreen | error (cualquier excepción del repositorio): `console.error('Error dando de baja ave:', error)` y Alert `'Error'` / `'No fue posible completar la baja del ave.'`; `finally` apaga `guardando` | 274-296 |
| BajaAveScreen | botón `'💾 Confirmar baja'` / `'Guardando...'` con `disabled={guardando}` (sin doble toque) | 718-749 |
| DetalleAveScreen | títulos `'💰 Información de venta'` / `'⚰ Información de fallecimiento'`; etiquetas Fecha, Nombre, Celular, Ciudad destino, Cooperativa, Valor venta, Valor envío, Causa, Detalle | 591-682 |

Argumentos que envía la pantalla (`BajaAveScreen.js`): muerte `{ aveId, causa: causa.trim(), detalle: detalle.trim() }` (145-155); venta `{ aveId, fechaVenta: new Date().toISOString(), celular: celular.trim(), ciudadDestino: ciudadDestino.trim(), cooperativaEnvio: cooperativaEnvio.trim(), comprador: comprador.trim(), valorVenta: number|null, valorEnvio: number|null, detalle: detalle.trim() }` (205-241). Las cadenas vacías llegan como `''` (el repositorio las convierte en `NULL` con `|| null`). Para MUERTE el repositorio ignora todo menos `aveId`, `causa` y `detalle`.

## Endpoints V2

Bajo `/api/v1/criaderos/:criaderoId/aves/:aveId/...`, en el módulo `aves` (mismo router y factory; `bajas_ave`, `aves` y `ave_historial` se escriben juntos). Ownership por criadero como el resto (401 `UNAUTHORIZED`, 403 `FORBIDDEN`, 404 `CRIADERO_NOT_FOUND`). Sin `version`.

### POST `/muerte`  (equivale a `registrarMuerteAve`)

- Request (camelCase): `{ causa?, detalle?, fecha }`. `aveId` en la ruta. `fecha` la genera el **cliente** con `new Date().toISOString()` (como V1, `:18-20`) y el servidor no la sustituye (mismo criterio que `POST /diagnosticos`).
- Efectos en **un solo `db.batch`**, en el mismo orden que V1:
  1. `UPDATE aves SET estado = 'FALLECIDA', fecha_actualizacion = :fecha WHERE id = :aveId AND criadero_id = :criaderoId`.
  2. `INSERT bajas_ave (id, criadero_id, ave_id, tipo, fecha, causa, detalle)` con `tipo = 'MUERTE'`, `causa || null`, `detalle || null`.
  3. `INSERT ave_historial (id, criadero_id, ave_id, tipo_evento, fecha, detalle)` con `tipo_evento = 'MUERTE'`, `jaula_id` NULL, `detalle = detalle || 'Ave dada de baja por fallecimiento.'`.
- UUID v7 (baja e historial) generados por el servidor antes del batch (el batch no puede leer `lastInsertRowId`).
- Respuesta 201 `{ success: true, data: { id } }` (id de la baja). El cliente descarta el cuerpo y devuelve `undefined`, como V1.

### POST `/venta`  (equivale a `registrarVentaAve`)

- Request: `{ fecha, celular, ciudadDestino?, cooperativaEnvio?, comprador?, valorVenta?, valorEnvio?, detalle? }`. El cliente envía `fecha = fechaVenta || new Date().toISOString()` (V1 `:150-154`). `valorVenta`/`valorEnvio`: número JSON, `null` o ausente (el servidor aplica `numeroNoNegativo` de V1 por si llegara texto: valor inválido → `NULL`, sin error).
- El servidor aplica **tal cual la lógica V1** (no son reglas nuevas): `normalizarCelular` (`:494-536`) y, si el resultado es `''`, `400` con código `CELULAR_COMPRADOR_REQUERIDO` y **sin escribir nada**. El cliente lo traduce a `new Error('CELULAR_COMPRADOR_REQUERIDO')` (mismo texto que V1, que la pantalla ya filtra antes con `!celular.trim()`).
- Efectos en **un solo `db.batch`**, en el orden de V1:
  1. `UPDATE aves SET estado = 'VENDIDA', fecha_actualizacion = :fecha WHERE id = :aveId AND criadero_id = :criaderoId`.
  2. `INSERT bajas_ave (id, criadero_id, ave_id, tipo, fecha, celular, ciudad_destino, cooperativa_envio, comprador, valor_venta, valor_envio, detalle)` con `tipo = 'VENTA'`, celular normalizado, `|| null` en ciudad/cooperativa/comprador/detalle, `valor_venta`/`valor_envio` = resultado de `numeroNoNegativo` (pueden ser `NULL`).
  3. `INSERT movimientos_financieros (id, criadero_id, tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id)` `INGRESO` / `VENTA_AVE`, `valor = valorVenta ?? 0`, detalle `Venta de ave ${aveId}[ a ${comprador}]`, `ave_id`, `origen_tipo = 'VENTA_AVE'`, `origen_id` = id (UUID v7) de la baja del paso 2.
  4. `INSERT movimientos_financieros` `INGRESO` / `ENVIO_AVE`, **siempre**, `valor = valorEnvio ?? 0`, detalle `Envío de venta de ave ${aveId}[ a ${comprador}]`, mismo `origen_tipo`/`origen_id`.
  5. `INSERT ave_historial` `VENTA`, `jaula_id` NULL, detalle `['Ave vendida.', 'Celular: …', 'Comprador: …'?, 'Destino: …'?, detalle?].join(' ')`.
- UUID v7 de baja, 2 movimientos e historial generados por el servidor antes del batch (el id de la baja se usa como `origen_id`).
- Respuesta 201 `{ success: true, data: { id } }`; el cliente devuelve `undefined`.

### Errores comunes a POST `/muerte` y POST `/venta`

- Ave inexistente en el criadero → `404 AVE_NO_ENCONTRADA` (mismo código que `eventos`, `diagnosticos`, `finalizar-tratamiento`; el cliente lo traduce con `traducirErrorAve`). V1 daba `FOREIGN KEY constraint failed`, que la pantalla muestra como `'No fue posible completar la baja del ave.'`. Garantiza además que no se escriba nada sobre un ave de otro criadero.
- **No** se rechaza por estado del ave (ni `AVE_NO_ACTIVA`): V1 no lo hacía (hallazgo 3). Una segunda baja crea otra fila, como V1.
- Tipo incorrecto del cuerpo (no objeto, `fecha` no texto, `causa`/`detalle`/`comprador`/… no texto) → `400 VALIDATION_ERROR`: solo para poder enlazar a D1 sin 500; no es una regla de negocio (mismo criterio que `eventos`/`diagnosticos`).

### GET `/bajas`  (lectura para `obtenerBajaAve` y el ciclo de vida)

- Respuesta 200 `{ success: true, data: { bajas: [{ id, tipo, fecha, causa, celular, ciudadDestino, cooperativaEnvio, comprador, valorVenta, valorEnvio, detalle }] } }`. Todas las bajas del ave (con `criadero_id`), `ORDER BY fecha DESC, id DESC` (el orden de `CicloVidaRepository.sqlite.js:152-155`; el UUID v7 hace que `id DESC` desempate por antigüedad). Ave inexistente o sin bajas: `200` con `bajas: []` (V1 no comprueba el ave).
- Una sola ruta sirve a los dos consumidores:
  - `obtenerBajaAve(aveId)` (en `AveRepository.api.js`) devuelve `bajas[0]` convertido a snake (`aSnake`) o `null` si `[]` (V1: `ORDER BY fecha DESC LIMIT 1`; solo difiere en un empate exacto de `fecha`, donde V1 no define orden).
  - `CicloVidaRepository.api.js`: `const bajas = []` (`:236`) pasa a `bajas = (await GET /bajas).bajas.map(aSnake)`; el bloque de eventos `VENTA`/`MUERTE` (641-) ya está copiado de V1 y espera esas claves (`ciudad_destino`, `cooperativa_envio`, `valor_venta`, `valor_envio`, …). Con eso **dejan de faltar** "Ave vendida" y "Fallecimiento".

### Cambio en `GET /aves?estado=VENDIDA|FALLECIDA` (ya implementado; cambio en `listarBajas`)

- Hoy `listarBajas` (`aves.repository.ts:149-170`) lista las aves por estado ordenadas por `a.fecha_actualizacion DESC, a.codigo` (interino, con comentario "hasta entonces"). Con `bajas_ave` debe pasar a V1: `INNER JOIN bajas_ave b ON b.ave_id = a.id AND b.tipo = 'VENTA'` (VENDIDA) / `'MUERTE'` (FALLECIDA), `AND b.criadero_id = a.criadero_id`, `ORDER BY b.fecha DESC`, y añadir al elemento: vendidas `fechaVenta, celular, ciudadDestino, cooperativaEnvio, comprador, valorVenta, valorEnvio, detalle`; fallecidas `fechaFallecimiento, causa, detalle` (`aSnake` ya los vuelve `fecha_venta`, etc.). Es el cambio de V1 (replica el `INNER JOIN`: un ave VENDIDA sin baja no aparece; varias bajas del mismo tipo duplican la fila). Con las bajas escritas siempre junto al estado (batch), en V2 un ave sin baja solo podría existir si alguien cambiara `estado` por otra vía, que hoy no hay.
- `AveBajaListado` (`aves.types.ts:40-41`) hay que ampliarlo con esos campos.
- `aves.md` líneas 636-638 aún dicen "una sola baja por ave (R-P7, P-15)" y "devuelve el resumen de baja": R-P7/P-15 están **revocadas** (`aves.md:600,736,807`); esta spec sigue la revocación (replicar V1: `INNER JOIN`). `aves.md` no se toca.

Sin endpoint para `obtenerBajasAve` (omitida). Sin DELETE/PUT de bajas (V1 no los tiene aquí; la corrección de ventas es de Finanzas, `corregirVentaFinanciera`).

## Tabla D1

Migración propuesta `0010_bajas.sql` (la siguiente libre; `0001`–`0009` no se editan). Convención de `0006`–`0009`: `fecha_creacion` como en V1 (sin `created_at`/`updated_at`/`deleted_at`/`version`/CHECK), FK `ON DELETE RESTRICT ON UPDATE RESTRICT`.

### `bajas_ave` (replica `migrations.js:292-317` + `migrationV5.js:18-23`)

| Columna | Tipo | Regla | Origen V1 |
|---|---|---|---|
| id | TEXT PRIMARY KEY NOT NULL | UUID v7 | `id` INTEGER AUTOINCREMENT |
| criadero_id | TEXT NOT NULL | FK criaderos(id) RESTRICT | nuevo |
| ave_id | TEXT NOT NULL | FK aves(id) RESTRICT | `ave_id` (V1: FK sin acción) |
| tipo | TEXT NOT NULL | `'VENTA'` / `'MUERTE'` (sin CHECK) | `tipo` |
| fecha | TEXT NOT NULL | ISO enviada por la app | `fecha` |
| causa | TEXT | nullable | `causa` |
| celular | TEXT | nullable (siempre presente en VENTA) | V5 `celular` |
| ciudad_destino | TEXT | nullable | `ciudad_destino` |
| cooperativa_envio | TEXT | nullable | `cooperativa_envio` |
| comprador | TEXT | nullable | `comprador` |
| valor_venta | REAL | nullable | `valor_venta REAL` |
| valor_envio | REAL | nullable | V5 `valor_envio REAL` |
| detalle | TEXT | nullable | `detalle` |
| fecha_creacion | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | | `fecha_creacion` |

Índices: `ix_bajas_ave_ave (ave_id, fecha)` (listados y `obtenerBajaAve`), `ix_bajas_ave_celular (celular)` (V1 `idx_bajas_ave_celular`, lo usará Clientes). Solo rendimiento.

### `movimientos_financieros` (replica `migrations.js:320-343`; **necesaria para Bajas**, ver dependencia)

| Columna | Tipo | Regla | Origen V1 |
|---|---|---|---|
| id | TEXT PRIMARY KEY NOT NULL | UUID v7 | `id` INTEGER AUTOINCREMENT |
| criadero_id | TEXT NOT NULL | FK criaderos(id) RESTRICT | nuevo |
| tipo | TEXT NOT NULL | `'INGRESO'`/`'EGRESO'` | `tipo` |
| categoria | TEXT | nullable | `categoria` |
| fecha | TEXT NOT NULL | ISO | `fecha` |
| valor | REAL NOT NULL | | `valor REAL NOT NULL` |
| detalle | TEXT | nullable | `detalle` |
| ave_id | TEXT | FK aves(id) RESTRICT, nullable | `ave_id` |
| origen_tipo | TEXT | `'VENTA_AVE'`, `'MANUAL'` (Finanzas) | `origen_tipo` |
| origen_id | TEXT | nullable, **sin FK** (polimórfico; en `VENTA_AVE` es `bajas_ave.id`) | `origen_id INTEGER` |
| fecha_creacion | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | | `fecha_creacion` |

Índices: `ix_movimientos_criadero_fecha (criadero_id, fecha)` (V1 `idx_movimientos_fecha`) e `ix_movimientos_origen (origen_tipo, origen_id)` (V1 `migrationV6.js:48-50`; lo usan `sincronizarMovimientoVenta` y `corregirVentaFinanciera`).

`movimientos_financieros_historial` **no** se crea aquí (Bajas no la escribe); la añade Finanzas (`migrationV6.js:20-45`).

### Tipos de importes y fechas (punto d)

- `valor_venta`, `valor_envio` y `movimientos_financieros.valor` son `REAL`, igual que V1. En D1 (SQLite) `REAL` es un IEEE-754 de 64 bits, **el mismo tipo de dato que el `number` de JavaScript y que `REAL` de SQLite de V1**: el valor se guarda y se devuelve sin redondeo ni conversión (ej. `12.3` ida y vuelta es el mismo double). Por JSON viajan como **número JSON** (no cadena) o `null`; `JSON.stringify`/`JSON.parse` conservan el double. No se usa `INTEGER` en centavos ni `NUMERIC` (cambiaría valores y las sumas `SUM(valor)` de Finanzas/Dashboard/Reportes que hoy operan sobre `REAL`). El servidor no formatea ni aplica `toFixed`: el `.toFixed(2)` es solo de presentación (ciclo de vida, `formatearDinero`).
- Cuidado en el binding de D1: pasar `null` explícito (no `undefined`) para `valor_venta`/`valor_envio` ausentes, para que sigan `NULL` como en V1 y no `0`.
- Fechas: `fecha` es `TEXT` ISO UTC `YYYY-MM-DDTHH:mm:ss.sssZ` generada por la app (`new Date().toISOString()`); `aves.fecha_actualizacion` recibe esa misma `fecha`, en ISO (`aves.md` ya documenta que conviven formatos); `fecha_creacion` es `CURRENT_TIMESTAMP` (`YYYY-MM-DD HH:MM:SS`). El servidor no sustituye `fecha` (los listados ordenan por ella como texto).

## Dependencia con Finanzas

**Qué necesita Bajas de Finanzas.** Solo escribir 2 filas por venta en `movimientos_financieros` (8 columnas: `tipo, categoria, fecha, valor, detalle, ave_id, origen_tipo, origen_id`) dentro del batch de `POST /venta`. No lee esa tabla, no escribe el historial, no usa los catálogos en el servidor (las categorías `VENTA_AVE` y `ENVIO_AVE` ya están en la plantilla de 42 ítems: `api/src/catalogs/defaultCatalogItems.ts:190,232`). La tabla no existe en D1 (búsqueda en `api/`: solo `aves.repository.ts`/`aves.types.ts`, y solo en comentarios sobre `bajas_ave`).

**Lo que comparte con `FinanzasRepository.js`** (evidencia de acoplamiento por `origen_tipo`/`origen_id`):
- `obtenerVentaPorBajaId(bajaId)` (`:259-289`): `FROM bajas_ave b INNER JOIN aves a ... WHERE b.id = ? AND b.tipo = 'VENTA'`; se llama con `mov.origen_id` (`EditarMovimientoFinancieroScreen.js:118-126`).
- `corregirVentaFinanciera({ bajaId, valorVenta, valorEnvio })` (`:403-490`): lee y **actualiza `bajas_ave.valor_venta`/`valor_envio`** (`:452-465`) y sincroniza los dos movimientos por `origen_tipo = 'VENTA_AVE' AND origen_id = ? AND categoria = ?` (`:502-559`), con textos de detalle **distintos** a los de Bajas (`Envío asociado a venta de ave ${venta.ave_id}`, `:483`) y escribe el historial.
- Lectores que seguirán en SQLite hasta su módulo: `FinanzasScreen`, `Dashboard`, `Alertas`, `Reportes` (`DashboardRepository.js:144`, `AlertasRepository.js:531`, `ReportesRepository.js:110,233`), `ClientesRepository.js`.
- El `origen_id` de V1 es un entero; en D1 será el UUID de `bajas_ave.id`; Finanzas deberá usar `origen_id TEXT`.

**Opción A: crear `movimientos_financieros` en la misma migración `0010` que `bajas_ave`; Finanzas añade después solo lo que falte (`movimientos_financieros_historial`, endpoints, clientes).**
- Tamaño: 1 tabla replicada de V1 (11 columnas, 2 índices) + 2 `INSERT` en el batch de venta. Sin endpoints de Finanzas.
- Riesgo: bajo. La tabla replica V1 sin interpretar; lo único que hereda Finanzas es una decisión ya cerrada (columnas de V1, `origen_id TEXT`). Si Finanzas necesitara un índice más, va en `0011`.
- Contra: mientras Finanzas no se migre, **en modo API los ingresos de ventas quedan en D1 pero las pantallas de Finanzas, Inicio y Reportes siguen leyendo el SQLite local** y no los ven (mismo tipo de limitación que ya existe con Alertas/Inicio, `estado-actual.md`). Se documenta como limitación conocida.

**Opción B: un único módulo Bajas+Finanzas.**
- Tamaño: Finanzas son 13 funciones exportadas (`obtenerResumenFinanciero`, `obtenerMovimientosFinancieros`, `obtenerIngresos`, `obtenerEgresos`, `registrarIngreso`, `registrarEgreso`, `obtenerMovimientoPorId`, `obtenerVentaPorBajaId`, `actualizarMovimientoManual`, `corregirVentaFinanciera`, `obtenerHistorialMovimiento`, `obtenerConsolidadoCategorias`, `obtenerConsolidadoMensual`; `FinanzasRepository.js:6-760`), 3 pantallas (Finanzas, Nuevo y Editar movimiento) con filtros por periodo (`strftime`) y auditoría; es varias veces el trabajo de Bajas.
- Riesgo: alto (mezcla dos dominios, retrasa Bajas, la spec de Finanzas aún no existe y no se ha leído `FinanzasScreen`/`Nuevo...` con esta profundidad). Ventaja: sin el desfase de lecturas.

**Recomendación: Opción A.** Evidencia: (1) Bajas solo escribe y solo necesita la tabla (no el historial ni lecturas); (2) la tabla de V1 es de 11 columnas sin lógica y Finanzas la usa sin cambiarla (`origen_tipo`/`origen_id` ya la acoplan por construcción); (3) B triplica el alcance y el riesgo; (4) el desfase de lecturas de A es una limitación temporal y conocida, igual que con Alertas/Inicio. El orden pendiente ya pone Finanzas justo después de Bajas (`estado-actual.md`). Lo que Finanzas añadirá: `movimientos_financieros_historial` (`migrationV6.js:20-45`), endpoints y clientes, y el cierre de la limitación.

## Excepciones técnicas por pasar a online

- **IDs TEXT UUID v7** en `bajas_ave.id`, `movimientos_financieros.id`, `ave_historial.id` y en `movimientos_financieros.origen_id`/`ave_id` (en V1 `origen_id` = `lastInsertRowId`). El servidor genera todos los UUID antes del batch (no puede leer `lastInsertRowId`). `aveId` aparece en el `detalle` de los movimientos de V1 (`Venta de ave ${aveId}`): en V2 será el UUID (ver Dudas).
- **`criadero_id`** en `bajas_ave` y `movimientos_financieros`, y en todas las escrituras/lecturas; ownership por criadero.
- **FK `RESTRICT`** en lugar de FK sin acción (heredado de `0006`; no hay hard delete de aves).
- **Transacción → `db.batch`** (atomicidad equivalente a `withTransactionAsync`).
- **`fecha` enviada por el cliente** (también en `muerte`, donde V1 la creaba dentro del repositorio): se conserva el reloj de la app, igual que V1 y que `diagnosticos`.
- **Ave inexistente → `404 AVE_NO_ENCONTRADA`** (V1: `FOREIGN KEY constraint failed`). La pantalla no distingue el error.
- **`CELULAR_COMPRADOR_REQUERIDO`** viaja como `400` con ese código (V1: `Error` lanzado por el repositorio) y el cliente lo vuelve a lanzar con el mismo texto. La lógica de `normalizarCelular`/`numeroNoNegativo` se ejecuta en el servidor porque determina el dato guardado.
- **Tipos del cuerpo** (`VALIDATION_ERROR`) solo para el binding a D1.
- **Errores de red/autenticación** (401, 403, `CRIADERO_NOT_FOUND`, red): los propaga el cliente (`ApiError`, `traducirErrorAve`); `BajaAveScreen` ya los muestra con su `Alert` genérico.
- **Lectura de bajas** (`GET /bajas`) y cambio de `listarBajas` a `INNER JOIN bajas_ave`: necesarios para que las listas, `DetalleAveScreen` y el ciclo de vida lean en la nube lo que V1 leía de `bajas_ave`.

## Casos de paridad

Importes con `REAL` tal cual (ej. `12.5` = 12.5, no 1250). Ave `K001` ACTIVA salvo que se diga otra cosa.

| id | dado | cuando | entonces | evidencia V1 |
|---|---|---|---|---|
| BAJ-01 | Ave ACTIVA en jaula J1, venta sin envío | `registrarVentaAve` con `celular '0991234567'`, `comprador 'Juan'`, `ciudadDestino 'Quito'`, `valorVenta 12.5`, `valorEnvio null`, `detalle ''` | `aves.estado 'VENDIDA'`, `fecha_actualizacion = fecha`, `jaula_actual_id` sigue J1; `bajas_ave` 1 fila `VENTA` con `valor_venta 12.5`, `valor_envio NULL`, `causa NULL`, `detalle NULL`; `movimientos_financieros` 2 filas `INGRESO`: `VENTA_AVE` `valor 12.5` detalle `Venta de ave {aveId} a Juan` y `ENVIO_AVE` **`valor 0`** detalle `Envío de venta de ave {aveId} a Juan`, ambas con `origen_tipo 'VENTA_AVE'`, `origen_id` = id de la baja; `ave_historial` `VENTA` `Ave vendida. Celular: 0991234567 Comprador: Juan Destino: Quito`; devuelve `undefined`; sin `jaula_historial` | `BajaAveRepository.js:192-429` |
| BAJ-02 | Igual | venta con `valorVenta 12.5`, `valorEnvio 3.25`, `cooperativaEnvio 'Coop'`, `detalle 'Gracias'` | `valor_envio 3.25`; `ENVIO_AVE` `valor 3.25`; historial `Ave vendida. Celular: 0991234567 Comprador: Juan Destino: Quito Gracias` (cooperativa e importes no entran al historial); `cooperativa_envio 'Coop'` | `:214-271,325-353,357-429` |
| BAJ-03 | Igual | venta sin valores ni comprador (`valorVenta null`, `valorEnvio null`, `comprador ''`) | `valor_venta`/`valor_envio` `NULL`; `VENTA_AVE` `valor 0` detalle `Venta de ave {aveId}`; `ENVIO_AVE` `valor 0` detalle `Envío de venta de ave {aveId}`; `comprador NULL`; historial `Ave vendida. Celular: …` | `:309-314,345-348` |
| BAJ-04 | Igual | venta con `valorVenta 0` | `valor_venta 0` (no `NULL`), `VENTA_AVE valor 0` | `:540-579` |
| BAJ-05 | Igual | venta con celular `'+593 99 123 4567'`, `'593991234567'` o `'991234567'` | se guarda `'0991234567'` (12 dígitos con 593 → `0`+resto; 9 dígitos con 9 → `0`+dígitos); otro formato (p. ej. `'12345'`) se guarda solo con dígitos, sin error | `:494-536` |
| BAJ-06 | Igual | venta con `celular ''` o sin dígitos (`'abc'`) | `Error('CELULAR_COMPRADOR_REQUERIDO')` antes de la transacción; ninguna tabla cambia; el aviso de la pantalla es `'Celular requerido'` (si `celular.trim()` es vacío) o `'Error'` / `'No fue posible completar la baja del ave.'` (si solo tiene letras) | `:163-171`; `BajaAveScreen.js:162-173,274-287` |
| BAJ-07 | Igual | venta con `valorVenta -1` o `'abc'` directo al repositorio | se guarda `NULL` en `valor_venta` y `0` en el movimiento, sin error; la pantalla lo rechaza antes con `'Valor inválido'` | `:564-572`; `BajaAveScreen.js:188-201` |
| BAJ-08 | Ave ACTIVA | `registrarMuerteAve` con `causa 'Enfermedad'`, `detalle ''` | `aves.estado 'FALLECIDA'`, `fecha_actualizacion = fecha`, `jaula_actual_id` intacto; `bajas_ave` `MUERTE` `causa 'Enfermedad'`, `detalle NULL`, resto `NULL`; `ave_historial` `MUERTE` `Ave dada de baja por fallecimiento.` con `jaula_id` NULL; **0** filas en `movimientos_financieros` y en `jaula_historial`; devuelve `undefined` | `:29-122` |
| BAJ-09 | Igual | muerte con `detalle 'Aplastada'` | `bajas_ave.detalle 'Aplastada'` y `ave_historial.detalle 'Aplastada'` (la causa no entra al historial) | `:79-84,119-120` |
| BAJ-10 | Ave ya VENDIDA (llamada directa a la API) | `registrarMuerteAve` o `registrarVentaAve` | se escribe igual: nueva fila de baja, historial, y en venta 2 ingresos más; el estado se pisa (VENDIDA → FALLECIDA); sin rechazo ni `AVE_NO_ACTIVA`; la UI no ofrece el botón | `:29-47,192-210` (sin lectura previa); `DetalleAveScreen.js:1020-1052` |
| BAJ-11 | `aveId` inexistente | `registrarMuerteAve`/`registrarVentaAve` | V1: `FOREIGN KEY constraint failed` en el `INSERT bajas_ave`, nada escrito (el `UPDATE` afecta 0 filas). V2: `404 AVE_NO_ENCONTRADA`, nada escrito (excepción técnica) | `:51-85,217-271`; `sqlite.js:63`; `migrations.js:315-316` |
| BAJ-12 | Falla cualquiera de los pasos 2 a 5 de la venta | `registrarVentaAve` | no queda ninguna fila ni el cambio de estado (transacción / batch atómico) | `:187` |
| BAJ-13 | Venta registrada una sola vez | doble clic en "Confirmar baja" | V1 lo evita con `disabled={guardando}`; si el cliente repitiera la llamada habría 2 bajas y 4 ingresos (no hay idempotencia en V1). V2 no añade idempotencia | `BajaAveScreen.js:728-730`; `BajaAveRepository.js:187-434` |
| BAJ-14 | Una venta registrada, otra ave FALLECIDA sin baja | listar VENDIDAS / FALLECIDAS | solo aparecen aves con fila de baja del tipo (`INNER JOIN`), por `b.fecha DESC`; con campos de baja en el elemento | `AveRepository.sqlite.js:1806-1821,1869-1884` |
| BAJ-15 | Ave VENDIDA con baja / FALLECIDA con baja | `obtenerBajaAve` | la fila más reciente por `fecha` con las 11 columnas; `null` si no hay (la pantalla muestra la tarjeta con valores vacíos) | `AveRepository.sqlite.js:1899-1927`; `DetalleAveScreen.js:599-682` |
| BAJ-16 | Ave con baja `VENTA` (valores `12.5` / `3.25`) y otra `MUERTE` | `obtenerCicloVidaAve` | eventos `venta-{id}` "Ave vendida" con detalle `Comprador: Juan\nCelular: …\nDestino: Quito\nCooperativa: Coop\nValor: $12.50\nEnvío: $3.25\nGracias` (sin las líneas vacías) y `muerte-{id}` "Fallecimiento" con `Causa: …\n{detalle}`; por defecto `El ave fue registrada como vendida.`/`…fallecida.`; los `ave_historial` `VENTA`/`MUERTE` no se duplican en la línea de tiempo | `CicloVidaRepository.sqlite.js:207-223,564-711` |
| BAJ-17 | Baja tras venta | `obtenerBajasAve` | omitida (sin llamadores) | `BajaAveRepository.js:440` |
| BAJ-18 | Pantalla, tipo sin elegir | "Confirmar baja" | Alert `'Seleccione una opción'` / `'Debe seleccionar si es venta o fallecimiento.'`; no se llama al repositorio | `BajaAveScreen.js:117-128` |
| BAJ-19 | Éxito | `guardar` | Alert `'Proceso completado'` / `'El ave fue registrada como vendida.'` (o `…fallecida.`), `Aceptar` → `popToTop` | `BajaAveScreen.js:249-270` |
| BAJ-20 | Falla de red/servidor | `guardar` | `console.error` y Alert `'Error'` / `'No fue posible completar la baja del ave.'`; `guardando` vuelve a `false` | `BajaAveScreen.js:274-296` |

## Dudas

DUDA PARA EL USUARIO:

1. **Fila `ENVIO_AVE` con valor 0.** El código real inserta siempre dos ingresos por venta, aunque no haya envío (la fila de envío con `valor 0`; `BajaAveRepository.js:325-353`). La migración V6 sí filtraba `> 0`, pero solo para el relleno de datos antiguos. La spec replica el código (siempre 2 filas). Efecto visible: en Finanzas esa fila de 0 aparece en el listado y cuenta en `COUNT(*)` del consolidado (`FinanzasRepository.js:704-716`). ¿Se confirma replicar así (lo que implica la regla), o se prefiere `> 0` (cambio de comportamiento)? No he podido comprobar el tag `v1.0.3` en Git (no puedo ejecutar comandos); el árbol actual es la fuente.
2. **`detalle` de los movimientos con el UUID.** V1 escribe `Venta de ave ${aveId}` con el id entero (por ejemplo `Venta de ave 12`). En V2 `aveId` es un UUID v7 y el texto queda como `Venta de ave 0190…`. Se propone la fórmula literal de V1 con el id. Alternativa (cambia el texto): usar el `codigo` del ave. ¿Cuál?
3. **Opción A o B de Finanzas.** Recomendación: A (crear `movimientos_financieros` en `0010_bajas.sql`, sin su historial). Necesita aprobación del plan. Consecuencia de A: en modo API, los ingresos de ventas no se verán en Finanzas/Inicio/Reportes hasta migrar Finanzas.
4. **Excepciones a pantallas V1.** `BajaAveScreen` no necesita ninguna (tiene `try/catch` con `Alert` y `disabled`). `DetalleAveScreen.cargarDatos` tiene un `catch` que solo hace `console.error` (`:130-139`): si `obtenerBajaAve` falla por red, `baja` queda `null`, la tarjeta sale con valores vacíos y, como la lectura de huevos va después en el mismo `try` (`:118-126`), no se cargan los huevos. No es nuevo de Bajas (V1 ya no mostraba error ahí) y no propongo cambiarlo; solo se anota por si el usuario quiere tratarlo como excepción de errores de red.

Dudas técnicas (no bloquean):
- `registrarVentaAve` normaliza el celular pero no valida longitud; se replica (BAJ-05).
- `ClientesRepository`, `ReportesRepository` y la corrección de ventas (`corregirVentaFinanciera`) leen/escriben `bajas_ave` en SQLite; en modo API siguen sin ver las ventas de la nube hasta migrar Clientes/Finanzas/Reportes (fase 6). `bajas_ave.valor_venta`/`valor_envio` los modificará `corregirVentaFinanciera` cuando se migre Finanzas.
- Con `obtenerBajaAve` en `.api.js` leyendo `GET /bajas`, el empate exacto de `fecha` entre dos bajas del mismo ave (solo posible con doble baja) se resuelve por `id DESC`; V1 no define orden en ese caso.
- Las aves `VENDIDA`/`FALLECIDA` conservan `jaula_actual_id` (V1); `desactivarJaula` las libera (`aves.md`), no es parte de este módulo.
