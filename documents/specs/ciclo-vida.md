# Spec: ciclo-vida

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).

## Estado

implementada (2026-11-03, rama `trabajo/migracion-nube`). Pendiente: comprobación en el teléfono físico. Alcance: aves individuales (sin lotes), sin sincronización offline, D1 como fuente de verdad. Las líneas son del árbol de V1 (v1.0.3). **Este módulo no crea tablas ni migraciones**: reúne en el cliente fuentes que ya existen en D1; el único cambio de API es un `GET` de solo lectura de la evolución (bloqueo resuelto, ver "Decisiones del usuario resueltas").

### Lo implementado

- `CicloVidaRepository.js` (fachada) ahora enruta `obtenerCicloVidaAve` con `origen()` (antes fijaba SQLite). `CicloVidaRepository.sqlite.js` queda intacto.
- `CicloVidaRepository.api.js` reúne en el **cliente** las fuentes y aplica la lógica de V1: historial (`GET /aves/:aveId/historial`), evolución (**nuevo** `GET /aves/:aveId/evolucion`), salud (`GET /aves/:aveId/salud`) y huevos (`GET /aves/:aveId/huevos`). Bajas = lista vacía. Sin endpoint `/ciclo-vida`.
- API nueva `GET /api/v1/criaderos/:criaderoId/aves/:aveId/evolucion` (solo lectura, sin tabla ni migración): respuesta `{ evolucion: [{ id, aveId, fecha, fotoUri, pesoGramos, alturaCm, largoCm, caracteristicas, observacion, fechaCreacion }] }`, ordenada por `fecha DESC, id DESC`; un ave inexistente devuelve lista vacía con 200.
- Salud en el cliente: no trae el `estado` del diagnóstico ni la observación del tratamiento; no afectan a ningún texto ni al orden. Se reordena por `fecha` desc e `id` desc antes de agrupar.
- Huevos en el cliente: agrupados por día UTC (`fecha.slice(0,10)`), id `huevos-${fecha_dia}`, códigos ordenados por texto ascendente.
- Si una fuente falla, `obtenerCicloVidaAve` rechaza y la pantalla muestra "No fue posible cargar el ciclo de vida del ave." (sin línea de tiempo parcial).
- **Sin excepción a pantallas V1** en este módulo.
- Commits: API de evolución `ecc41cf`, clientes `010a223`, pruebas `706837c`.
- Pruebas: caso `pruebas/datos/casos/11-ciclo-vida.mjs` y flujo del emulador `81-ciclo-vida`.
- Validación: typecheck OK; 228 pruebas unitarias/HTTP y 75 de integración; `/probar datos` 65/65 (86,7 s, sin fuga); `/probar completo` desde cero (27,6 min), flujo `81-ciclo-vida` en verde, 0 regresiones; `revisor-arquitectura-v2`: APROBADO (menores: lista de códigos por día ordenada por texto frente a `GROUP_CONCAT` sin orden; día por `slice(0,10)` en UTC).
- Limitaciones conocidas: Bajas pendiente, así que los eventos `VENTA` y `MUERTE` no aparecen (CIC-29); los desempates por id con UUID v7 son temporales (diferencia técnica aceptada); falta la prueba en el teléfono.

### Estado antes de implementar (histórico de esta spec)

- `registrarEventoCicloVida` ya funciona en modo API (`CicloVidaRepository.api.js:20-50` → `POST /aves/:aveId/eventos`, `aves.routes.ts:206-218`). No se toca.
- `obtenerCicloVidaAve` **siempre va a SQLite**, también en modo API (`CicloVidaRepository.js:33-35`: `return sqlite().obtenerCicloVidaAve(...)`, a diferencia de `registrarEventoCicloVida`, que usa `origen()`, `:37-39`). Con un `aveId` UUID, la consulta de `aves` no encuentra fila y devuelve `[]` (`CicloVidaRepository.sqlite.js:34-38`): la pantalla muestra "Sin eventos todavía".
- Desfases en otros documentos (ya marcados el 2026-11-03 en `aves.md`, `salud.md` y `huevos.md`):
  - `aves.md:33` y `aves.md:648`/R-P15: superados por la decisión de reunir las fuentes **en el cliente**, sin endpoint `/ciclo-vida`.
  - `salud.md` y `huevos.md` ("el ciclo de vida no muestra huevos"): ya no es cierto (salud y huevos sí; bajas no).
  - Comentarios de `CicloVidaRepository.js:7-9` y `CicloVidaRepository.api.js:4-8` ("no tiene endpoint aún"): se reescriben al implementar.
  - Lo que `aves.md:372-376,297` dice del contrato V1 es correcto y esta spec lo amplía (SQL literal, textos exactos, mezcla y orden); no lo contradice. (`aves.md:45` cita `obtenerTituloHistorial` 867-901: coincide.)

## Fuente V1

- `src/repositories/CicloVidaRepository.sqlite.js` (946 líneas, leído completo): `obtenerCicloVidaAve` 6-728; `registrarEventoCicloVida` 731-767; auxiliares `agregarCambioMedida` 770-852, `normalizarTexto` 855-864, `obtenerTituloHistorial` 867-901, `obtenerTimestamp` 904-946.
- `src/repositories/CicloVidaRepository.js` (fachada, 39 líneas) y `CicloVidaRepository.api.js` (50 líneas).
- `src/screens/CicloVidaAveScreen.js` (único consumidor de `obtenerCicloVidaAve`, `:24-25,87`). `registrarEventoCicloVida` solo la llama `FinalizarTratamientoScreen.js:19-20,78` (ver `salud.md:106`).
- Quién abre la pantalla: ruta `CicloVidaAve` en `src/navigation/AvesStackNavigator.js:15,77-78`; único `navigate('CicloVidaAve', { aveId })` en `DetalleAveScreen.js:969-976` (botón siempre visible, también para `VENDIDA`/`FALLECIDA`, `aves.md:208`). Búsqueda sin límite de `CicloVida` en `src/`: no hay otro llamador.
- Esquema V1: `src/database/migrations.js:88-106` (`ave_evolucion`), `:133-154` (`ave_historial`), `:218-240` (`huevos`), `:292-314` (`bajas_ave`; `celular` y `valor_envio` se añaden en `migrationV5.js:18-28`), `:355-362` (índices `idx_ave_historial_ave`, `idx_huevos_ave`, `idx_diagnosticos_ave`).
- Cliente API existente que se reutiliza: `AveRepository.api.js:75-104` (`obtenerAvePorId`), `:337-347` (`obtenerHistorialAve`), `SaludRepository.api.js:104-116` (`obtenerHistorialSaludAve`), `HuevoRepository.api.js:71-83` (`obtenerHuevosAve`), `avesApi.js:38-64` (`aSnake`).

## Contrato del repositorio

### `obtenerCicloVidaAve(aveId)` (`CicloVidaRepository.sqlite.js:6-728`)

Devuelve un arreglo de eventos (`[]` si el ave no existe o si no hay eventos). Sin `try/catch`, sin errores propios: cualquier fallo de SQL se propaga a la pantalla.

#### 1. Lecturas (SQL literal, todas con `aveId` como único parámetro)

**1.1 `aves`** (`:14-31`)
```sql
SELECT id, codigo, origen, fecha_nacimiento, fecha_ingreso, fecha_creacion, estado
FROM aves WHERE id = ?
```
`getFirstAsync`; si no hay fila → `return []` (`:34-38`). Campos que se usan después: `id` (`:172,185`), `origen` (`:166`), `fecha_ingreso` (`:168,174`), `fecha_nacimiento` (`:181,187`). `codigo`, `fecha_creacion` y `estado` se leen y **no se usan**.

**1.2 `ave_historial`** (`:41-62`)
```sql
SELECT h.id, h.tipo_evento, h.fecha, h.detalle, h.jaula_id, j.codigo AS jaula_codigo
FROM ave_historial h LEFT JOIN jaulas j ON j.id = h.jaula_id
WHERE h.ave_id = ? ORDER BY h.fecha DESC, h.id DESC
```
Usados: `id`, `tipo_evento`, `fecha`, `detalle`, `jaula_codigo` (`jaula_id` no se usa).

**1.3 `ave_evolucion`** (`:65-86`)
```sql
SELECT id, fecha, foto_uri, peso_gramos, altura_cm, largo_cm, caracteristicas, observacion
FROM ave_evolucion WHERE ave_id = ? ORDER BY fecha DESC, id DESC
```
Todos los campos se usan.

**1.4 `diagnosticos_ave` + `tratamientos_ave`** (`:89-113`)
```sql
SELECT d.id AS diagnostico_id, d.fecha, d.enfermedad, d.sintomas,
       d.observacion AS diagnostico_observacion, d.estado AS diagnostico_estado,
       t.medicamento, t.dosis, t.observacion AS tratamiento_observacion
FROM diagnosticos_ave d LEFT JOIN tratamientos_ave t ON t.diagnostico_id = d.id
WHERE d.ave_id = ? ORDER BY d.fecha DESC, d.id DESC
```
Se copian al objeto agrupado `estado` (`:421-422`) y `tratamiento.observacion` (`:448-449`) pero **ninguno de los dos influye en el texto ni en el orden** (ver 2.4).

**1.5 `huevos`** (`:116-132`)
```sql
SELECT date(h.fecha) AS fecha_dia, MIN(h.fecha) AS fecha, COUNT(*) AS cantidad,
       GROUP_CONCAT(h.codigo, ', ') AS codigos
FROM huevos h WHERE h.ave_id = ?
GROUP BY date(h.fecha) ORDER BY fecha_dia DESC
```
Sin filtro por `estado`.

**1.6 `bajas_ave`** (`:135-159`)
```sql
SELECT id, tipo, fecha, causa, celular, ciudad_destino, cooperativa_envio,
       comprador, valor_venta, valor_envio, detalle
FROM bajas_ave WHERE ave_id = ? ORDER BY fecha DESC, id DESC
```

#### 2. Generación de eventos (orden de inserción en `eventos`, importa para los empates, ver sección 3)

Forma base `{ id, tipo, fecha, titulo, detalle, ... }`. Textos literales:

**2.1 Origen del ave (`:165-192`)** — un solo evento como máximo, siempre el primero insertado:
- Si `ave.origen === 'COMPRADA'` **y** `ave.fecha_ingreso` truthy: `{ id: 'llegada-{ave.id}', tipo: 'LLEGADA', fecha: ave.fecha_ingreso, titulo: 'Llegada al criadero', detalle: 'El ave ingresó al criadero.' }`.
- Si no (cualquier otro origen, o `COMPRADA` sin `fecha_ingreso`) y `ave.fecha_nacimiento` truthy: `{ id: 'nacimiento-{ave.id}', tipo: 'NACIMIENTO', fecha: ave.fecha_nacimiento, titulo: 'Nacimiento', detalle: 'Fecha de nacimiento registrada para el ave.' }`.
- Si ninguna: no se genera.

**2.2 `ave_historial` (`:195-242`)**, en el orden de la consulta (fecha DESC, id DESC):
- `tipo = String(item.tipo_evento || '').toUpperCase()`.
- Se **omiten** (`continue`) `SALUD`, `POSTURA_HUEVO`, `EVOLUCION`, `VENTA`, `MUERTE`, `BAJA` (`:207-223`). Por tanto aquí solo llegan `ALTA`, `CAMBIO_JAULA`, `DATOS_ACTUALIZADOS`, `RECUPERACION` y cualquier otro valor.
- Evento: `{ id: 'hist-{item.id}', tipo: tipo || 'HISTORIAL', fecha: item.fecha, titulo: obtenerTituloHistorial(tipo), detalle: item.detalle || 'Actualización registrada.', jaulaCodigo: item.jaula_codigo || null }`.
- `obtenerTituloHistorial` (`:867-901`): `ALTA` → "Registro inicial"; `CAMBIO_JAULA` → "Cambio de jaula"; `DATOS_ACTUALIZADOS` → "Datos actualizados"; `RECUPERACION` → "Ave recuperada"; cualquier otro (incluido `''`) → "Actualización".

**2.3 `ave_evolucion` (`:245-389`)**:
- Copia del arreglo ordenada **ascendente** por `obtenerTimestamp(fecha)` (`:245-258`; el sort es estable, así que los empates conservan el orden de la consulta: id DESC).
- Se recorre con `evolucionAnterior = null` al inicio. Para cada `item`: `observacion = String(item.observacion || '').trim()`.
  - Si `observacion.toLowerCase() === 'registro inicial'`: `evolucionAnterior = item; continue` (no genera evento, pero sí es la base de comparación del siguiente) (`:277-288`).
  - Si no, `detalleEvolucion = []` y se agrega, en este orden (`:294-365`):
    1. `agregarCambioMedida(Peso, anterior.peso_gramos, item.peso_gramos, 'g')`, luego `Altura` con `altura_cm` y `cm`, luego `Largo` con `largo_cm` y `cm` (`:770-852`). Vacío = `null`, `undefined` o `''`. Reglas: ambos vacíos → nada; ambos con valor e iguales por `Number()` → nada; anterior vacío y actual con valor → `"{label}: {Number(actual)} {unidad}"`; anterior con valor y actual vacío → `"{label}: {Number(anterior)} {unidad} → sin dato"`; ambos con valor distintos → `"{label}: {Number(anterior)} {unidad} → {Number(actual)} {unidad}"`. (Las flechas son `→`.)
    2. Si `normalizarTexto(anterior?.foto_uri) !== normalizarTexto(item.foto_uri)` → `'Fotografía actualizada.'` (`normalizarTexto` = `String(v || '').trim()`; sin anterior, compara contra `''`).
    3. Si `normalizarTexto(anterior?.caracteristicas) !== normalizarTexto(item.caracteristicas)` **y** `item.caracteristicas` truthy → `` `Características: ${item.caracteristicas}` `` (sin recorte).
    4. Si `observacion` (ya recortada) no vacía → `` `Observación: ${observacion}` ``.
  - Evento: `{ id: 'evolucion-{item.id}', tipo: 'EVOLUCION', fecha: item.fecha, titulo: 'Evolución registrada', detalle: detalleEvolucion.length > 0 ? detalleEvolucion.join('\n') : 'Se actualizó la evolución del ave.', fotoUri: item.foto_uri || null, caracteristicas: item.caracteristicas || null }`. Luego `evolucionAnterior = item`.

**2.4 Diagnósticos (`:393-533`)**:
- Agrupación con `Map` por `diagnostico_id` en el orden de la consulta (primera aparición fija la posición). Objeto agrupado `{ id, fecha, enfermedad, sintomas, observacion: diagnostico_observacion, estado: diagnostico_estado, tratamientos: [] }`.
- Por cada fila, si `medicamento || dosis || tratamiento_observacion` es truthy se agrega `{ medicamento, dosis, observacion }` a `tratamientos` (`:430-452`).
- Por cada diagnóstico agrupado (en orden de inserción del `Map`) se arma `partes` en este orden: `Síntomas: {sintomas}` si hay; `Observación: {observacion}` si hay; por cada tratamiento con `medicamento` truthy: `Medicamento: {medicamento}` y, si hay `dosis`, se le anexa ` · Dosis: {dosis}` (separador `" · "`, con el punto medio `·`) (`:462-516`).
- Evento: `{ id: 'salud-{item.id}', tipo: 'SALUD', fecha: item.fecha, titulo: item.enfermedad ? 'Diagnóstico: {enfermedad}' : 'Diagnóstico de salud', detalle: partes.length > 0 ? partes.join('\n') : 'Se registró un diagnóstico de salud.' }` (`:519-531`). Sin `jaulaCodigo`, sin `fotoUri`.
- Ni `estado` ni `tratamiento.observacion` salen en ningún texto. `tratamiento.observacion` solo participa en la condición de la fila de tratamiento; en V1 y en D1 una fila de `tratamientos_ave` solo se crea cuando hay `medicamento` (`SaludRepository.js` `if(medicamento)`, `salud.md:56`; `salud.repository.ts:40`), de modo que esa condición ya se cumple por `medicamento` y el texto no cambia.

**2.5 Huevos por día (`:536-561`)**: por cada fila de `huevos` (orden de la consulta, `fecha_dia DESC`): `cantidad = Number(item.cantidad || 0)`; evento `{ id: 'huevos-{fecha_dia}', tipo: 'POSTURA_HUEVO', fecha: item.fecha (= MIN(fecha) del día), titulo: cantidad === 1 ? 'Huevo registrado' : '{cantidad} huevos registrados', detalle: item.codigos ? 'Códigos: {codigos}' : null }`. El `id` es **sintético** (`huevos-` + fecha del día, `YYYY-MM-DD`); `codigos` es `GROUP_CONCAT(codigo, ', ')` (separador coma + espacio). Sin `jaulaCodigo`.

**2.6 Bajas (`:564-711`)**: por cada fila:
- `tipo === 'VENTA'`: `detalleVenta` en este orden: `Comprador: {comprador}`, `Celular: {celular}`, `Destino: {ciudad_destino}`, `Cooperativa: {cooperativa_envio}` (cada una solo si truthy); `Valor: ${Number(valor_venta).toFixed(2)}` y `Envío: ${Number(valor_envio).toFixed(2)}` (cada una si el valor no es `null` ni `undefined`, también con `0`); `detalle` tal cual si truthy. Evento `{ id: 'venta-{item.id}', tipo: 'VENTA', fecha, titulo: 'Ave vendida', detalle: detalleVenta.join('\n') || 'El ave fue registrada como vendida.' }`.
- `tipo === 'MUERTE'`: `Causa: {causa}` si hay; `detalle` tal cual si hay. Evento `{ id: 'muerte-{item.id}', tipo: 'MUERTE', fecha, titulo: 'Fallecimiento', detalle: partes.join('\n') || 'El ave fue registrada como fallecida.' }`.
- Cualquier otro `tipo`: no genera evento.
- **En modo API esta fuente es lista vacía** (no existe `bajas_ave` en D1; módulo Bajas pendiente): no hay eventos `VENTA`/`MUERTE`. Como el historial omite también `VENTA`/`MUERTE`/`BAJA` (`:207-223`), una ave vendida o fallecida no mostrará su baja hasta migrar Bajas. **Limitación conocida.**

#### 3. Mezcla y orden final (`:714-726`)

- Todos los eventos van en un único arreglo, en este **orden de inserción**: origen (2.1) → historial (2.2) → evolución (2.3, cronológica ascendente) → diagnósticos (2.4) → huevos (2.5) → bajas (2.6).
- Orden final: `eventos.sort((a, b) => obtenerTimestamp(b.fecha) - obtenerTimestamp(a.fecha))`, es decir **solo por fecha descendente** (más reciente primero). No hay desempate propio: los empates conservan el orden de inserción (el `Array.prototype.sort` de JS es estable en Node y en Hermes recientes; **no verificado en el Hermes de la app**, ver duda 5).
- `obtenerTimestamp(fecha)` (`:904-946`): sin fecha → `0`; `String(fecha).trim().replace(' ', 'T')` (solo el primer espacio); si coincide `^\d{4}-\d{2}-\d{2}$` se le agrega `T00:00:00` (hora **local** del dispositivo); `Date.parse`; no finito → `0`. Una fecha ISO con `Z` se interpreta en UTC; una sin zona (p. ej. `2026-01-05 10:00:00` o `YYYY-MM-DD`) en hora local. El cliente debe usar **el mismo código** (copia literal de la función) para dar igual resultado.
- Todas las fuentes se leen siempre completas; no hay límite ni paginación.

#### 4. Forma exacta del objeto devuelto

Arreglo de objetos con claves: siempre `id` (string), `tipo`, `fecha`, `titulo`, `detalle` (puede ser `null` solo en huevos sin códigos). Adicionales según tipo: `jaulaCodigo` (solo eventos de historial; `string|null`), `fotoUri` y `caracteristicas` (solo `EVOLUCION`; `string|null`). Las claves son camelCase aun en V1 (no vienen de columnas). Tipos posibles de `tipo`: `LLEGADA`, `NACIMIENTO`, `HISTORIAL` o el `tipo_evento` en mayúsculas, `EVOLUCION`, `SALUD`, `POSTURA_HUEVO`, `VENTA`, `MUERTE`.

### `registrarEventoCicloVida({ aveId, tipoEvento, detalle, fecha = null })` (`:731-767`)

Ya cubierto en `aves.md:376` y `CicloVidaRepository.api.js:20-50`: `INSERT INTO ave_historial (ave_id, tipo_evento, fecha, detalle)` con `fecha || new Date().toISOString()` y `detalle || null`, sin `jaula_id`, sin transacción. Devuelve `undefined`. Sin cambios en esta spec.

### Cómo consume la pantalla (`CicloVidaAveScreen.js`)

- `cargar` (`:65-124`): `setLoading(true)`, `setError(null)`, `Promise.all([obtenerAvePorId(aveId), obtenerCicloVidaAve(aveId)])` (`:79-90`), `setAve`, `setEventos`. `catch`: `console.error('Error cargando ciclo de vida:', ...)` y `setError('No fue posible cargar el ciclo de vida del ave.')` (`:103-114`); `finally`: `setLoading(false)`. Se recarga en cada foco (`useFocusEffect`, `:127-140`, dependencia `[aveId]`).
- Estados: `loading` → spinner con "Cargando ciclo de vida..." (`:143-175`); `error || !ave` → solo texto rojo `error || 'Ave no encontrada.'` (`:178-207`); si no, título "🌿 Ciclo de vida", subtítulo "Historia completa y cronológica de {ave.codigo}", tarjeta del ave y "Línea de tiempo" (`:210-338`).
- Sin eventos: tarjeta "Sin eventos todavía" / "Los cambios del ave aparecerán aquí a medida que se registren." (`:341-377`).
- Por evento (`:380-577`): fecha con `formatearFecha(evento.fecha)` (`:764-850`), `evento.titulo`, `evento.detalle` si hay, `🏠 Jaula {jaulaCodigo}` si hay, caja "Características" con `evento.caracteristicas`, imagen con `evento.fotoUri`; `key={evento.id}`; iconos y colores por `evento.tipo` (`obtenerVisualEvento`, `:641-761`), con `default` para tipos no listados (p. ej. `HISTORIAL`).
- Si una fuente falla, **no se muestra una línea de tiempo parcial**: `obtenerCicloVidaAve` rechaza y la pantalla muestra el texto de error general (igual que en V1 ante un fallo de SQL). El cliente API debe rechazar (no tragar errores de una fuente) para conservar esa conducta.

## Endpoints V2

**No se crea ningún endpoint ni tabla nueva para la reunión de eventos**: `obtenerCicloVidaAve` en `CicloVidaRepository.api.js` hará varias lecturas existentes y aplicará **la misma lógica de V1 en el cliente** (copia de las funciones auxiliares y de la mezcla/orden de `:162-726`). Todas bajo `/api/v1/criaderos/:criaderoId/aves/:aveId/...` (ownership por criadero ya aplicado en los routers).

### Mapa fuente V1 → endpoint existente y cobertura (verificado en `api/src`)

| Fuente V1 | Endpoint existente | Cliente existente | Cobertura |
|---|---|---|---|
| `aves` (1.1) | `GET /aves/:aveId` (`aves.routes.ts:156-161`; columnas `COLUMNAS_LISTADO`, `aves.repository.ts:61-87`) | `obtenerAvePorId` (`AveRepository.api.js:75-104`; devuelve `null` si `AVE_NO_ENCONTRADA`) | **Completa**: `origen`, `fecha_nacimiento`, `fecha_ingreso`, `id` (`aSnake`). Sin ave → `null` → el cliente devuelve `[]` como V1. |
| `ave_historial` (1.2) | `GET /aves/:aveId/historial` (`aves.routes.ts:163-168`; SQL `aves.repository.ts:490-511`: `id, aveId, jaulaId, tipoEvento, fecha, detalle, fechaCreacion, jaulaCodigo`; `LEFT JOIN jaulas`; `ORDER BY h.fecha DESC, h.id DESC`) | `obtenerHistorialAve` (`AveRepository.api.js:337-347`) | **Completa** (mismos campos y mismo orden que V1; `aSnake` da `tipo_evento`, `jaula_codigo`). Sin llamadores previos en la app (`aves.md:71`). |
| `ave_evolucion` (1.3) | **No existe** (en `api/src` `ave_evolucion` solo aparece en `INSERT` y `COUNT`: `aves.repository.ts:354,533,549,580`; `aves.routes.ts` solo tiene `POST /:aveId/evolucion`, `:220-232`) | `obtenerEvolucionAve` sigue en SQLite aun en modo API (`EvolucionAveRepository.js:31-33`, `.api.js:7-8`) | **SIN COBERTURA. BLOQUEO** (ver abajo). |
| `diagnosticos_ave` + `tratamientos_ave` (1.4) | `GET /aves/:aveId/salud` (`salud.routes.ts:95-104`; SQL `salud.repository.ts:78-91`: `d.id, d.fecha, d.enfermedad, d.sintomas, d.observacion, t.medicamento, t.dosis`; `LEFT JOIN tratamientos_ave`; `ORDER BY d.fecha DESC`) | `obtenerHistorialSaludAve` (`SaludRepository.api.js:104-116`, devuelve esas 7 claves) | **Suficiente para el texto**, con campos V1 que la API no devuelve: ver abajo. |
| `huevos` (1.5) | `GET /aves/:aveId/huevos` (`huevos.routes.ts:105-114`; SQL `huevos.repository.ts:110-126`: `id, codigo, fecha, estado, observacion, jaulaCodigo`; `ORDER BY h.fecha DESC, h.rowid DESC`) | `obtenerHuevosAve` (`HuevoRepository.api.js:71-83`) | **Suficiente**: el agrupado por día (`date(fecha)`, `MIN`, `COUNT`, `GROUP_CONCAT`) se calcula en el cliente con `fecha` y `codigo`. |
| `bajas_ave` (1.6) | Ninguno (no existe la tabla en D1; `AveRepository.api.js:376-382`, `obtenerBajaAve` devuelve `null`) | — | **Lista vacía** en modo API (decisión del usuario). Limitación conocida. |

### Campos que V1 lee y la API NO devuelve hoy

- **Evolución**: todo (no hay `GET`). Ver DUDA 1.
- **Salud**:
  - `diagnosticos_ave.estado` (`diagnostico_estado`): no se devuelve. **No cambia ningún texto ni el orden** (`CicloVidaRepository.sqlite.js:421-422` solo lo copia; `aves.md:298`). No hace falta.
  - `tratamientos_ave.observacion` (`tratamiento_observacion`): no se devuelve. Solo entra en la condición de `:430-436`, que ya se cumple siempre que exista tratamiento (porque solo se crea con `medicamento`, `salud.repository.ts:40`); no se muestra (`:492-514` usa solo `medicamento` y `dosis`). No hace falta.
  - Desempate `d.id DESC` de V1 (`:108`): la API ordena solo por `d.fecha DESC` (`salud.repository.ts:85`; ya anotado en `salud.md:192`). **El cliente lo reproduce reordenando** por `fecha` desc y `id` desc antes de agrupar (sin cambio de API). Con UUID v7 el orden por `id` es temporal (a diferencia de V1, ver duda 4).
  - `fecha_creacion` del diagnóstico: V1 no lo usa en el ciclo de vida.
- **Historial**: `jaula_id` se devuelve (`jaulaId`); `fecha_creacion` extra no se usa. Nada falta.
- **Huevos**: la API no devuelve `rowid`; V1 tampoco lo usa. `GROUP_CONCAT` en V1 no define orden (ver duda 3).
- **Ave**: nada falta.

Conclusión: **solo falta la evolución**; salud, historial, huevos y ave se cubren con endpoints y clientes que ya existen. Bajas es lista vacía.

### Diseño del cliente `obtenerCicloVidaAve(aveId)` en `CicloVidaRepository.api.js`

Mismo nombre y misma forma de objeto que V1 (sección 4). Pasos:

1. `ave = await obtenerAvePorId(aveId)`; si `!ave` (o falsy) → `return []` (V1 `:34-38`).
2. Leer las fuentes (cada llamada puede rechazar; no capturar): `obtenerHistorialAve(aveId)`, evolución (ver DUDA 1), `obtenerHistorialSaludAve(aveId)`, `obtenerHuevosAve(aveId)`; bajas = `[]`. Orden de las llamadas libre (no afecta el resultado); si una falla, todo rechaza.
3. Normalizar a la forma de las consultas V1: historial ya en orden V1; salud reordenada (`fecha` desc, `id` desc) y agrupada con la misma lógica de `Map`; huevos agrupados por día.
4. Aplicar sin cambios las secciones 2.1–2.6 y el orden de la sección 3. Se copian las funciones `agregarCambioMedida`, `normalizarTexto`, `obtenerTituloHistorial` y `obtenerTimestamp`, y el literal de cada texto.
5. Agrupación de huevos por día (reproduce `:116-132`): clave = equivalente de `date(h.fecha)` (parte `YYYY-MM-DD` de la fecha; ver duda 2); `fecha` = mínimo lexicográfico de las `fecha` del día (`MIN` de SQLite sobre texto); `cantidad` = conteo; `codigos` = `codigo` unidos con `', '` en el orden de la duda 3; grupos ordenados por clave descendente (`ORDER BY fecha_dia DESC`).
6. Los `id` de evento siguen los patrones de V1; los `{id}` internos son UUID v7 (strings), p. ej. `hist-0190…`. `huevos-{fecha_dia}` conserva el id sintético.

Fachada: `CicloVidaRepository.js:33-35` debe usar `origen()` (hoy fija `sqlite()`); `CicloVidaRepository.sqlite.js` queda intacto.

## Tabla D1

Sin tablas ni migraciones nuevas para el ciclo de vida. Las fuentes ya existen en D1:

- `ave_historial`, `ave_evolucion`, `diagnosticos_ave`: `api/migrations/0006_aves.sql:66-112,138-159` (`ave_evolucion` tiene `foto_r2_key`, `peso_gramos`, `altura_cm`, `largo_cm`, `caracteristicas`, `observacion`, `fecha_creacion`; índice `ix_ave_evolucion_ave_fecha(ave_id, fecha)`).
- `tratamientos_ave`: `0008_salud.sql` (con `observacion`, `salud.md:40`).
- `huevos`: `0009_huevos.sql:25-63` (índice `ix_huevos_ave_fecha(ave_id, fecha)`).
- `bajas_ave`: **no existe** (módulo Bajas pendiente).

Si el usuario aprueba el `GET` de evolución (DUDA 1) no hace falta migración: solo una consulta de lectura sobre `ave_evolucion`.

## Excepciones técnicas por pasar a online

1. **UUID v7**: los `id` de evento (`hist-…`, `evolucion-…`, `salud-…`) llevan UUID en vez de enteros; `ORDER BY ... id DESC` ordena por tiempo de creación (v7) en lugar de por autoincremento (ver duda 4).
2. **`criadero_id`**: lo resuelve la ruta (`rutaAves()`); el repositorio y la pantalla no lo manejan.
3. **Autenticación y errores de red**: las lecturas pasan por `apiFetch`; un fallo de red o sesión rechaza `obtenerCicloVidaAve` y la pantalla muestra el mensaje de V1 `'No fue posible cargar el ciclo de vida del ave.'` (`CicloVidaAveScreen.js:111-113`). No se requiere ninguna excepción de pantalla para esto: la pantalla ya tiene `try/catch` con estado de error (a diferencia de las pantallas de Cuidados).
4. **Foto de evolución**: el campo `fotoUri` del evento seguirá siendo la ruta local guardada en `foto_r2_key` hasta el módulo R2 (`estado-actual.md`). La API de evolución debe devolverla como `fotoUri` (como hace `aves.repository.ts:76`); no es clave de objeto real todavía.
5. **Bajas** vacías: no es diferencia técnica sino **limitación conocida** por módulo pendiente (se retira al migrar Bajas).

Excepciones de pantalla: **ninguna necesaria**. Evidencia: `CicloVidaAveScreen.js:103-114` ya captura el error; no hay `Number(aveId)` ni `parseInt` sobre ids en la pantalla (leída completa) ni en el punto de entrada (`DetalleAveScreen.js:969-976` pasa `aveId` tal cual; los `Number(` de `DetalleAveScreen.js:1185,1225` son de medidas y dinero); `key={evento.id}` es string. Las demás entradas a `DetalleAve` pasan `ave.id` tal cual (`AvesScreen.js:545-548`). Seguirá sin usarse un identificador numérico.

## Casos de paridad

Pruebas de datos viables (clientes REST contra el Worker de pruebas) con fechas fijas: se controlan por parámetro `fecha` en `registrarDiagnostico`, `registrarHuevo` y `registrarEventoCicloVida`, y `fechaNacimiento`/`fechaIngreso` en `crearAve`. **No se controlan** las fechas de `ALTA`, `DATOS_ACTUALIZADOS`, `CAMBIO_JAULA` ni de las evoluciones (las pone el servidor con la hora actual, `registrarEvolucionAve` no recibe fecha, `EvolucionAveRepository.api.js:21-57`): esos casos se prueban por contenido y por "van primero" (fecha actual > fechas fijas pasadas), no por fecha exacta. Fechas de ejemplo: `2026-01-05`, `2026-01-05T10:00:00.000Z`, etc.

| id | dado | cuando | entonces | evidencia V1 |
|---|---|---|---|---|
| CIC-01 | `aveId` inexistente | `obtenerCicloVidaAve` | `[]` (sin error) | `sqlite.js:34-38` |
| CIC-02 | Ave `NACIDA` (origen distinto de `COMPRADA`) con `fecha_nacimiento = 2026-01-05` | `obtenerCicloVidaAve` | Contiene `{ id: 'nacimiento-{id}', tipo: 'NACIMIENTO', fecha: '2026-01-05', titulo: 'Nacimiento', detalle: 'Fecha de nacimiento registrada para el ave.' }` | `:180-192` |
| CIC-03 | Ave `COMPRADA` con `fecha_ingreso = 2026-01-06` y `fecha_nacimiento` | igual | Contiene `llegada-{id}` "Llegada al criadero" / "El ave ingresó al criadero." y **no** `nacimiento-…` | `:165-179` |
| CIC-04 | Ave `COMPRADA` sin `fecha_ingreso` y con `fecha_nacimiento` | igual | Cae a `nacimiento-{id}` | `:165-168,180-192` |
| CIC-05 | Ave sin `fecha_nacimiento` ni `fecha_ingreso` | igual | Sin evento de origen | `:165-192` |
| CIC-06 | Ave recién creada (con `ALTA` y evolución "Registro inicial") | igual | `hist-{id}` tipo `ALTA` titulo "Registro inicial" con el detalle del alta; **no** hay evento de evolución por la "Registro inicial" (`registro inicial` en cualquier caja/espacios) | `:200-240,277-288,867-877` |
| CIC-07 | Ave con eventos `SALUD`, `POSTURA_HUEVO`, `EVOLUCION` en `ave_historial` (los escriben diagnóstico, huevo y evolución) | igual | Ningún `hist-…` de esos tipos; aparecen solo los reconstruidos (`salud-…`, `huevos-…`, `evolucion-…`) | `:207-223` |
| CIC-08 | Evento `RECUPERACION` con `fecha = 2026-01-20T10:00:00.000Z` y detalle `X` | igual | `hist-{id}` titulo "Ave recuperada", `detalle: 'X'`, `jaulaCodigo: null` | `:890-892`, `aves.md:297` |
| CIC-09 | Evento de historial sin detalle (`detalle` null) | igual | `detalle: 'Actualización registrada.'` | `:234-236` |
| CIC-10 | Evento de historial con `tipo_evento` desconocido (p. ej. `OTRO`) | igual | `titulo: 'Actualización'`, `tipo: 'OTRO'` | `:228,895-898` |
| CIC-11 | Evento `CAMBIO_JAULA` con `jaula_id` válida | igual | `jaulaCodigo` = código de la jaula; titulo "Cambio de jaula" | `:226-240,880-883` |
| CIC-12 | Diagnóstico `fecha = 2026-02-01T08:00:00.000Z`, enfermedad `Coriza`, sintomas `Estornudos`, observación `Aislar`, medicamento `Enrofloxacina`, dosis `5 ml` | igual | `{ id: 'salud-{diagId}', tipo: 'SALUD', titulo: 'Diagnóstico: Coriza', detalle: 'Síntomas: Estornudos\nObservación: Aislar\nMedicamento: Enrofloxacina · Dosis: 5 ml' }` | `:462-531` |
| CIC-13 | Diagnóstico sin sintomas, sin observación, sin medicamento | igual | `detalle: 'Se registró un diagnóstico de salud.'` | `:527-530` |
| CIC-14 | Diagnóstico con medicamento y sin dosis | igual | Línea `Medicamento: M` sin ` · Dosis` | `:496-512` |
| CIC-15 | Diagnóstico con `enfermedad` vacía/null (solo construible por la pantalla si lo permite; si no, prueba de unidad del cliente) | igual | `titulo: 'Diagnóstico de salud'` | `:523-526` |
| CIC-16 | Dos diagnósticos con la **misma** `fecha` | igual | Orden por `id` descendente (el creado después primero); mismo `fecha` en el sort final conserva ese orden | `:106-108,714-723` |
| CIC-17 | 1 huevo el `2026-02-10T09:00:00.000Z` | igual | `{ id: 'huevos-2026-02-10', tipo: 'POSTURA_HUEVO', fecha: '2026-02-10T09:00:00.000Z', titulo: 'Huevo registrado', detalle: 'Códigos: H000001' }` | `:116-132,547-559` |
| CIC-18 | 3 huevos el mismo día (`T08:00`, `T09:00`, `T10:00`) | igual | Un solo evento `huevos-2026-02-10`, `titulo: '3 huevos registrados'`, `fecha` = el `T08:00` (mínimo), `detalle: 'Códigos: Hxxxxxx, Hyyyyyy, Hzzzzzz'` con `', '` | `:120-123,547-559` |
| CIC-19 | Huevos en dos días | igual | Dos eventos `huevos-{dia}`, ordenados en el resultado final por `fecha` desc | `:127,714-723` |
| CIC-20 | Evolución: inicial (peso 1000, altura 30, largo 40, sin características) y una segunda con peso 1200, altura 30, largo 45, `características` "Plumaje nuevo", observación "Control" | igual | Evento `evolucion-{id}` con `detalle: 'Peso: 1000 g → 1200 g\nLargo: 40 cm → 45 cm\nCaracterísticas: Plumaje nuevo\nObservación: Control'`, `tipo: 'EVOLUCION'`, `titulo: 'Evolución registrada'`, `fotoUri: null`, `caracteristicas: 'Plumaje nuevo'` (el cambio de foto no aparece si ambas son vacías) | `:245-389,770-852` |
| CIC-21 | Evolución sin ningún cambio ni observación | igual | `detalle: 'Se actualizó la evolución del ave.'` | `:373-376` |
| CIC-22 | Evolución con foto distinta de la anterior | igual | La línea `Fotografía actualizada.` (con punto) | `:321-335` |
| CIC-23 | Evolución con peso que antes era vacío / ahora vacío | igual | `Peso: 1200 g` / `Peso: 1000 g → sin dato` | `:818-845` |
| CIC-24 | Evolución con peso igual por `Number()` (p. ej. `1000` y `1000.0`) | igual | Sin línea de peso | `:805-815` |
| CIC-25 | Ave con evolución tras "Registro inicial" y características iguales no vacías | igual | Sin línea de `Características` (solo se agrega si cambió y no está vacía) | `:338-354` |
| CIC-26 | Mezcla: nacimiento 2026-01-05, diagnóstico 2026-02-01, huevo 2026-02-10, recuperación 2026-02-20 | igual | Orden: recuperación, huevo, diagnóstico, nacimiento (fecha desc); y los eventos del alta/evolución del servidor (fecha actual) primero | `:714-723` |
| CIC-27 | Fechas de distinto formato (`2026-02-10` y `2026-02-10T08:00:00.000Z`) en eventos distintos | igual | Orden según `obtenerTimestamp` (la fecha solo se lee como local, la ISO como UTC) | `:904-946` |
| CIC-28 | Dos eventos con idéntico `fecha` de fuentes distintas | igual | Conservan el orden de inserción: origen, historial, evolución, salud, huevos, bajas | `:162-726` |
| CIC-29 | Ave `VENDIDA`/`FALLECIDA` (baja) en modo API | igual | **Limitación conocida**: sin evento `venta-…`/`muerte-…` (no hay `bajas_ave`); en SQLite sí aparecen según 2.6 (casos para cuando se migre Bajas: textos de `:573-707`) | `:564-711` |
| CIC-30 | Fallo de red/sesión en cualquiera de las lecturas | Abrir `CicloVidaAveScreen` | La pantalla muestra "No fue posible cargar el ciclo de vida del ave." y ninguna línea de tiempo parcial | `CicloVidaAveScreen.js:103-114,178-207` |
| CIC-31 | Ave sin eventos | Abrir la pantalla | "Sin eventos todavía" / "Los cambios del ave aparecerán aquí a medida que se registren." | `CicloVidaAveScreen.js:341-377` |
| CIC-32 | Dos cuentas / criaderos | Ciclo de vida de un `aveId` del otro criadero | Sin datos de otro criadero (los endpoints filtran por `criadero_id`; `obtenerAvePorId` da `null` → `[]` o el error del router) | `aves.repository.ts:277-292` |

## Decisiones del usuario resueltas

- **Evolución (antes BLOQUEO): resuelta.** Se autorizó el `GET /aves/:aveId/evolucion` de solo lectura, sin tabla ni migración (implementado, `ecc41cf`; ver "Lo implementado"). Sin pantalla V1 modificada. El texto original del bloqueo se conserva abajo como evidencia.
- Dudas 2 y 3 (día por 10 primeros caracteres UTC y códigos por texto ascendente) se aplicaron como se proponían; el revisor las anotó como diferencias menores. La duda 4 (desempates con UUID v7) se acepta como diferencia técnica.

## Dudas y bloqueo original (evidencia)

1. **BLOQUEO (resuelto; evolución): no existía ningún endpoint de lectura de `ave_evolucion`.** Evidencia: `aves.routes.ts` solo define `POST /:aveId/evolucion` (`:220-232`); `ave_evolucion` solo se escribe en `aves.repository.ts:354,549,580` y se cuenta en `:533`; `EvolucionAveRepository.js:31-33` deja `obtenerEvolucionAve` en SQLite. Sin esta fuente, en modo API desaparecen **todos** los eventos `EVOLUCION` del ciclo de vida (el historial los omite, `sqlite.js:207-223`; su detalle en texto de `ave_historial` es otro, p. ej. "Evolución registrada. Peso: …", `EvolucionAveRepository.sqlite.js:362-378`, y no se puede reconstruir el formato `Peso: a g → b g`). Hace falta, **sin tabla nueva ni migración**, un `GET /api/v1/criaderos/:criaderoId/aves/:aveId/evolucion` de solo lectura: `{ evolucion: [{ id, aveId, fecha, fotoUri, pesoGramos, alturaCm, largoCm, caracteristicas, observacion, fechaCreacion }] }`, `fotoUri` = `foto_r2_key AS fotoUri` (como `aves.repository.ts:76`), `ORDER BY fecha DESC, id DESC` (igual que `EvolucionAveRepository.sqlite.js:14-39`), filtrando `ave_id` y `criadero_id`. Además `obtenerEvolucionAve` (sin llamadores) podría usarlo. ¿Autoriza este cambio mínimo de API (solo lectura, mismas capas routes/service/repository) o prefiere dejar la evolución fuera del ciclo de vida en modo API como limitación conocida?
2. **Agrupado de huevos por día (`date(h.fecha)`).** V1 usa `date()` de SQLite, que convierte a UTC los textos con zona (`Z`, `+hh:mm`) y devuelve `NULL` para textos no válidos (clave `huevos-null`). La app escribe siempre `new Date().toISOString()` (`HuevoRepository.api.js:52`; en V1 `HuevoRepository.sqlite.js:55-56`), por lo que bastaría tomar los 10 primeros caracteres (UTC). Me limito a esa regla; no lo puedo confirmar para fechas con offset distinto de `Z` (no confirmable en el código: `RegistrarHuevoScreen` no se leyó en este análisis). ¿Se acepta "10 primeros caracteres" como equivalente de `date()`?
3. **Orden de `GROUP_CONCAT(h.codigo, ', ')` en V1 no está definido** (sin `ORDER BY`; en la práctica orden de lectura por `idx_huevos_ave`, es decir de inserción). La API devuelve `fecha DESC, rowid DESC` (`huevos.repository.ts:117`) y no expone `rowid`. Propuesta: dentro de cada día ordenar por `codigo` ascendente (los códigos `H%06d` crecen con la inserción, `huevos.md:209`), que reproduce el orden de inserción habitual de V1. Para días con la misma `fecha` exacta no se puede garantizar más.
4. **Desempates con UUID v7**: V1 desempata `h.id DESC` / `d.id DESC` con enteros autoincrementales (orden de inserción exacto). Con UUID v7 el orden es temporal con resolución de ms y puede variar entre eventos del mismo ms generados en isolates distintos. Es una diferencia técnica por el cambio de ids, aceptada en la regla del proyecto; solo afecta empates exactos de `fecha`. No hay `fecha_creacion` en el contrato de la API de salud ni de huevos para mejorar el desempate (el historial de ave sí trae `fechaCreacion`, `aves.types.ts:113`).
5. **Estabilidad del `sort`** del arreglo final (empates) en el motor JS de la app (Hermes): V1 depende de la misma propiedad, por lo que el comportamiento es igual al de V1 en el mismo dispositivo; no se verificó la versión de Hermes del build.
6. **Rendimiento**: en modo API la pantalla hará 6 lecturas (`obtenerAvePorId` en la pantalla, más ave, historial, evolución, salud y huevos del cliente) en vez de una consulta local; es un efecto del paso a online y no cambia el comportamiento. Si el usuario quiere una sola llamada (`/ciclo-vida`, como proponía `aves.md:648`), exigiría un endpoint nuevo con lógica en el servidor: **no se propone**, ya que la decisión es reunir en el cliente.
7. **Fachada**: `CicloVidaRepository.js:33-35` fija SQLite para `obtenerCicloVidaAve`; hay que cambiarla a `origen()` al implementar (cambio de repositorio, no de pantalla).
8. **Pruebas de datos y pantalla**: las fechas de `ALTA`, evolución, `DATOS_ACTUALIZADOS` y `CAMBIO_JAULA` no se pueden fijar desde el cliente (las pone el servidor); los casos CIC-06, CIC-20 a CIC-25 se verifican por contenido y no por fecha. `CicloVidaAveScreen` queda cubierta ahora por el flujo `81-ciclo-vida` (resuelto 2026-11-03).
