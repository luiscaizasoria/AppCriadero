# Spec: clientes

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).

## Estado

implementado (2026-11-05)

### Lo implementado (real)

- **API**: `api/src/clientes/` (routes, factory, service, repository, types), montado en `app.ts`. Solo lectura: `GET /clientes`, `GET /clientes/:celular` y `GET /clientes/:celular/compras`. 2 llamadas a D1 por endpoint (ownership + 1 SELECT), iguales con pocos datos y con 2000 ventas / 400 celulares / 2000 aves; tiempo local en memoria 0,7-3,5 ms.
- **Cliente REST**: `src/repositories/ClientesRepository.{js,sqlite.js,api.js}`; el `.sqlite.js` es el repositorio V1 renombrado al 100 % (sin cambios de contenido).
- **Sin migración**: `ix_bajas_ave_celular` ya existe; el índice `(criadero_id, celular)` (D-1) no es necesario con ese volumen. La siguiente migración sigue siendo `0012`.
- **Criadero inexistente**: responde `403 FORBIDDEN`, no `404 CRIADERO_NOT_FOUND` como decía el borrador: `userOwnsCriadero` no distingue ajeno de inexistente, igual que el resto de módulos.
- **SQL**: usa `?` posicionales repitiendo el bind de `criaderoId` (el adaptador `better-sqlite3` de las pruebas fallaba con `?1`/`?2` numerados; D1 acepta ambos). Los bloques SQL de más abajo con `?1`/`?2` son la forma del diseño.
- **Pruebas** (Node por defecto del entorno, 24; el proyecto recomienda 22): typecheck OK; 298 unitarias/HTTP (13 nuevos: 6 de servicio y 7 HTTP, incluido CLI-12) y 130 de integración (11 nuevos: 5 de paridad con el código REAL de V1 sobre `better-sqlite3`, con 3 funciones, 22 celulares, 45 comparaciones y 0 diferencias; y 6 de D1 con aislamiento y datos grandes). `/probar datos` VERDE 96/96 en 173,9 s (informe `2026-11-05-125904-datos`; incluye el caso `14-clientes` con 8 pruebas y la ampliación de `05-aislamiento` con las 3 rutas). `/probar smoke` VERDE (flujo 88 s, total 2,2 min; informe `2026-11-05-130521-smoke`). Flujo `completo/98-clientes.yaml` PASO en 204 s (informe `2026-11-05-130959-completo`): dos ventas al mismo celular, lista, detalle y, con una segunda cuenta desechable, cierre de sesión y estado vacío "No hay clientes para mostrar" (comprueba el aislamiento entre dos cuentas en el mismo teléfono).
- **Revisión de arquitectura**: APROBADO, sin hallazgos bloqueantes ni importantes.
- **Excepciones a pantallas V1**: ninguna. Limitación (decisión del usuario: sin excepciones): `DetalleClienteScreen.js:94-100` con error de red muestra "Cliente no encontrado." (el `catch` solo hace `console.error`), como V1.
- **Pendientes**: foto del ave (`aveFotoUri` sale de `aves.foto_r2_key`, que guarda la ruta local del teléfono hasta R2); D-2 (UUID v7 monotónico en el mismo milisegundo) sin comprobar fuera de las pruebas con ids sintéticos; `ReportesRepository.obtenerExportacionClientes` sigue en SQLite hasta el módulo Reportes; no probado en teléfono físico.

Alcance: aves individuales (sin lotes), sin sincronización offline, D1 como fuente de verdad. Decisión del usuario (fase 6): **los clientes se calculan en el servidor** replicando el SQL de V1; sin validaciones nuevas; sin excepciones a pantallas V1. Las líneas son del árbol de V1 (v1.0.3). No hay tabla de clientes: un "cliente" es el grupo de ventas (`bajas_ave.tipo = 'VENTA'`) con el mismo `celular`.

## Fuente V1

- `src/repositories/ClientesRepository.js` (solo lee, no escribe): `obtenerClientes` 7-97, `obtenerClientePorCelular` 101-191, `obtenerComprasCliente` 195-241.
- Pantallas (únicos llamadores; búsqueda sin límite de `obtenerClientes|obtenerClientePorCelular|obtenerComprasCliente|ClientesRepository` en `src/`): `src/screens/ClientesScreen.js` (import 21-23, llamada 73-75) y `src/screens/DetalleClienteScreen.js` (import 19-22, llamadas 73-80). Rutas `Clientes` y `DetalleCliente` en `src/navigation/MasStackNavigator.js:160-181`; entrada: tarjeta "Clientes" de `MasMenuScreen.js:163`.
- Tabla origen: `bajas_ave` (V1 `src/database/migrations.js:292`; `celular` e `idx_bajas_ave_celular` en `migrationV5.js:18-28`) y `aves` para el detalle. En D1 ya existen: `api/migrations/0010_bajas.sql:24-54` (`bajas_ave`, índices `ix_bajas_ave_ave (ave_id, fecha)` e `ix_bajas_ave_celular (celular)`) y `0006` (`aves`).
- Cómo se escriben los datos (módulo Bajas, ya en la API): `api/src/aves/aves.repository.ts` (INSERT en `bajas_ave` ~262; ver `bajas.md`). `registrarVentaAve` guarda `celular` **normalizado a solo dígitos** (`BajaAveRepository.js:157-160,494-536`; `bajas.md` BAJ-05), `comprador`/`ciudad_destino`/`cooperativa_envio`/`detalle` como `texto || null` y `valor_venta`/`valor_envio` como `REAL` o `NULL`. `fecha` es ISO UTC enviada por la app.
- Foto del ave: en D1 la columna es `aves.foto_r2_key` y la API la expone como `fotoUri` (`api/src/aves/aves.repository.ts:89,123,303,323`; `aves.types.ts:4`): guarda sin interpretar la ruta local del teléfono hasta que exista R2. V1: `aves.foto_uri`.
- `corregirVentaFinanciera` (módulo Finanzas, ya en la API) modifica `bajas_ave.valor_venta`/`valor_envio` (`finanzas.repository.ts:232`); Clientes lee siempre el valor actual de `bajas_ave`.
- Otros lectores de `bajas_ave` fuera de este módulo: `ReportesRepository.js` (incluida `obtenerExportacionClientes`, `ReportesScreen.js:27,166`); siguen en SQLite hasta Reportes.

### Hallazgos

1. **Cero escrituras**: Clientes no escribe nada (búsqueda de `INSERT|UPDATE|DELETE` en `ClientesRepository.js`: 0 coincidencias). No hace falta migración de datos ni idempotencia.
2. **Agrupación por texto exacto**: `GROUP BY b.celular` y `b.celular = ?` comparan el texto tal cual (en SQLite `=` sobre TEXT es binario, sensible a mayúsculas y espacios). D1 es SQLite: mismo comportamiento. En la práctica el celular guardado es solo dígitos (normalizado al vender), pero no se debe asumir en la API.
3. **`TRIM` sin segundo argumento solo quita espacios** (no tabs ni saltos de línea); se replica por usar el mismo SQL.
4. **`nombre` y `ciudad` salen de subconsultas correlacionadas** sobre la última venta (`ORDER BY fecha DESC, id DESC LIMIT 1`) con valor no vacío tras `TRIM(COALESCE(x,''))`; se devuelve el valor **sin recortar**. `nombre` por defecto `'Sin nombre'`; `ciudad` por defecto `''` (nunca `NULL`). La pantalla además hace `item.nombre || 'Sin nombre'` (`ClientesScreen.js:410-413`, `DetalleClienteScreen.js:227-231`).
5. `obtenerClientePorCelular` **no** excluye celular vacío (solo `b.celular = ?`), pero un celular `''` no puede existir en `bajas_ave` por la ruta normal (`registrarVentaAve` lanza `CELULAR_COMPRADOR_REQUERIDO`) y la pantalla solo navega con celulares tomados de la lista, que excluye vacíos.
6. **Sin paginación ni límite**: V1 devuelve todos los clientes y todas las compras.
7. **`COUNT(*)` cuenta filas de `bajas_ave`** (una por venta, también las dobles bajas del mismo ave, `bajas.md` BAJ-10) mientras que `obtenerComprasCliente` hace `INNER JOIN aves`; con la FK de D1 (y la de V1 con `foreign_keys = ON`) ambos cuadran.
8. El orden de `ultima_compra` es **comparación de texto** de `fecha` ISO (`MAX(b.fecha)` y `ORDER BY`); las fechas de ventas son ISO UTC de la app, así que el orden es cronológico. Se replica sin parsear fechas.

## Contrato del repositorio

Fachada como Finanzas/Bajas: `src/repositories/ClientesRepository.js` pasa a elegir `ClientesRepository.sqlite.js` (el código actual de V1, sin tocar) o `ClientesRepository.api.js` según `src/config/dataSource.js`. Las pantallas no cambian el import.

### `obtenerClientes()` (`ClientesRepository.js:7-97`)

- Sin parámetros. Devuelve **array** (puede ser `[]`) de objetos con exactamente estas claves y tipos:

| Clave | Tipo | Valor |
|---|---|---|
| `celular` | string | `b.celular` (no nulo ni solo espacios) |
| `nombre` | string | `comprador` de la última venta con comprador no vacío; `'Sin nombre'` si ninguna lo tiene |
| `ciudad` | string | `ciudad_destino` de la última venta con ciudad no vacía; `''` si ninguna |
| `total_compras` | number (entero) | `COUNT(*)` |
| `total_ventas` | number | `COALESCE(SUM(valor_venta), 0)`; `0` entero si todas son `NULL`, REAL en otro caso (sin redondeo) |
| `total_envios` | number | `COALESCE(SUM(valor_envio), 0)`, igual |
| `ultima_compra` | string | `MAX(fecha)` (ISO tal cual se guardó) |

- Orden: `ultima_compra DESC, celular ASC`. Solo ventas (`tipo = 'VENTA'`) con `celular IS NOT NULL AND TRIM(celular) <> ''`.
- Errores: ninguno propio. Si falla la base, la excepción llega a la pantalla.
- Consumo (`ClientesScreen.js`): `try/catch` 62-101: `console.error('Error cargando clientes:', …)` y texto `'No fue posible cargar los clientes.'` con botón "Reintentar" (`:90-92,282-299`). Usa `Number(item.total_compras || 0)` (465-467), `formatearDinero(item.total_ventas)` = `` `$${Number(valor || 0).toFixed(2)}` `` (544-554), `formatearFechaCorta(item.ultima_compra)` (560-596: vacío → `'-'`; `new Date(String(f).replace(' ','T'))`; fecha inválida → el texto; si no `toLocaleDateString()`). Filtro local por `nombre`, `celular` y `ciudad` (sin mayúsculas, 130-178). `key={item.celular}` (359); navega con `{ celular: item.celular }` (365-373). Estado vacío: tarjeta "No hay clientes para mostrar" (306-346).

### `obtenerClientePorCelular(celular)` (`:101-191`)

- Misma SELECT que `obtenerClientes` con `WHERE b.tipo = 'VENTA' AND b.celular = ?` y `GROUP BY b.celular`; devuelve **un objeto** con las mismas 7 claves y tipos, o **`null`** si no hay ventas con ese celular (`getFirstAsync`; el código del repositorio no hace nada más; la pantalla solo comprueba `!cliente`).
- Consumo (`DetalleClienteScreen.js`): `Promise.all([obtenerClientePorCelular(celular), obtenerComprasCliente(celular)])` (67-81); `cliente` falsy → texto "Cliente no encontrado." (155-179). Muestra `nombre || 'Sin nombre'`, `📱 celular`, `📍 ciudad` solo si no vacío, "Compras" `String(Number(total_compras || 0))`, "Total aves" `formatearDinero(total_ventas)` y "Envíos" `formatearDinero(total_envios)` (227-296). Error: `catch` solo `console.error('Error cargando detalle del cliente:', …)` (94-100), sin `Alert` ni mensaje; `finally` apaga `loading` (102-108).

### `obtenerComprasCliente(celular)` (`:195-241`)

- Devuelve **array** (puede ser `[]`) de objetos con exactamente estas claves:

| Clave | Tipo | Origen |
|---|---|---|
| `venta_id` | string en V2 (entero en V1) | `bajas_ave.id` |
| `fecha` | string | `bajas_ave.fecha` |
| `celular` | string | `bajas_ave.celular` |
| `comprador`, `ciudad_destino`, `cooperativa_envio`, `detalle` | string o `null` | tal cual (`NULL` si no se dio) |
| `valor_venta`, `valor_envio` | number o `null` | tal cual (`NULL` si no se dio; `0` se conserva) |
| `ave_id` | string en V2 (entero en V1) | `aves.id` |
| `ave_codigo` | string | `aves.codigo` |
| `ave_raza`, `ave_sexo` | string o `null` | `aves.raza`, `aves.sexo` |
| `ave_foto_uri` | string o `null` | V1 `aves.foto_uri`; V2 `aves.foto_r2_key` |

- `FROM bajas_ave b INNER JOIN aves a ON a.id = b.ave_id WHERE b.tipo = 'VENTA' AND b.celular = ? ORDER BY b.fecha DESC, b.id DESC`.
- Consumo (`DetalleClienteScreen.js:310-464`): `key={item.venta_id}`; `Image` solo si `ave_foto_uri` (329-357, si no 🐔); `ave_codigo`; `ave_raza || 'Sin raza'` y `textoSexo` (`MACHO`→"🐓 Macho", `HEMBRA`→"🐔 Hembra", otro→"Sexo no registrado", 548-572); `formatearFecha(fecha)` con `toLocaleString()` (632-668; vacío → 'Sin fecha'); `formatearDineroOpcional(valor_venta|valor_envio)` (576-612: `null`/`undefined`/`''`/no finito → `'No registrado'`, si no `$x.xx`); `ciudad_destino || 'No registrado'`; `cooperativa_envio || 'No registrado'`; `detalle` solo si no vacío. Con `[]` no se pinta ninguna tarjeta (no hay texto vacío propio).

## Endpoints V2

Bajo `/api/v1/criaderos/:criaderoId/clientes`, módulo nuevo `api/src/clientes/` (capas routes → factory → service → repository como el resto). Solo lectura. Ownership por criadero como en los demás módulos: 401 `UNAUTHORIZED`, 403 `FORBIDDEN` (también para un criadero inexistente; no hay 404 de criadero). Sin `version`, sin cuerpo, sin validaciones nuevas.

La API responde en **camelCase** y el cliente REST lo devuelve **en las claves de V1** con `aSnake` (`src/api/avesApi.js:38`; es la conversión de `ciudadDestino` → `ciudad_destino`, `aveFotoUri` → `ave_foto_uri`, `ventaId` → `venta_id`, etc.). Esa conversión mínima da exactamente las 7 y 14 claves de V1; los valores pasan sin transformar (no se añaden ni quitan claves, no hay `Number()` ni `toFixed` en el servidor ni en el cliente).

### Celular en la ruta

El celular viaja **como segmento de ruta codificado con `encodeURIComponent(celular)`**:
`GET /clientes/:celular` y `GET /clientes/:celular/compras`.

Motivos:
- Un `+` sin codificar en una **consulta** (`?celular=+593…`) se decodifica como espacio (`URLSearchParams`), alterando el texto y rompiendo la comparación exacta de V1. En una **ruta** un `+` literal sí se conserva (en un path el `+` no es espacio), de modo que olvidar la codificación es menos grave. Con `encodeURIComponent` los espacios, `%`, `+` y `/` viajan bien en ambos casos; se elige la ruta por esa tolerancia y por coherencia con el resto de la API.
- El resto de la API usa identificadores en la ruta (`/aves/:aveId`); `celular` identifica al cliente.
- Hono decodifica los parámetros de ruta (`c.req.param`): el servidor usa el valor decodificado como texto exacto. El implementador debe confirmar con una prueba HTTP que `%2B`, `%20`, `%25` y `%2F` llegan intactos (ver CLI-12); si `%2F` no se conservara, se anota como duda técnica, no se resuelve con otro diseño.
- Celular vacío: `encodeURIComponent('')` da un segmento vacío que no coincide con ninguna ruta (`404` genérico de ruta). V1 devolvería `null`/`[]`. Es inalcanzable desde la UI (hallazgo 5) y solo ocurriría llamando al repositorio a mano; **no se inventa un tratamiento**, queda como duda técnica menor (D-3). `undefined`/`null` como celular: tampoco ocurre desde la pantalla (`route.params.celular` viene de la lista).

### GET `/clientes`  (equivale a `obtenerClientes`)

- Respuesta 200: `{ "success": true, "data": { "clientes": [ { "celular", "nombre", "ciudad", "totalCompras", "totalVentas", "totalEnvios", "ultimaCompra" } ] } }`.
- Tipos: `totalCompras` entero; `totalVentas`/`totalEnvios` number JSON (`0` si todas `NULL`); `nombre` string, `ciudad` string (`''` posible), `ultimaCompra` string. Sin clientes: `clientes: []` con 200.
- Cliente REST: `return data.clientes.map(aSnake)`.

### GET `/clientes/:celular`  (equivale a `obtenerClientePorCelular`)

- Respuesta 200: `{ "success": true, "data": { "cliente": { …7 campos… } } }` o `{ "success": true, "data": { "cliente": null } }` si no hay ventas con ese celular.
- **Sin 404 para "cliente no encontrado"**: V1 devuelve `null` y la pantalla ya muestra "Cliente no encontrado." (`DetalleClienteScreen.js:155-179`). Un 404 obligaría a distinguirlo de otros errores en el cliente y no aporta nada. El cliente REST devuelve `aSnake(data.cliente)`, que da `null` si es `null` (`avesApi.js:40-47`), idéntico a V1 en lo que consume la pantalla (`!cliente`).
- `403 FORBIDDEN` (criadero ajeno o inexistente) solo por el criadero, nunca por el celular.

### GET `/clientes/:celular/compras`  (equivale a `obtenerComprasCliente`)

- Respuesta 200: `{ "success": true, "data": { "compras": [ { "ventaId", "fecha", "celular", "comprador", "ciudadDestino", "cooperativaEnvio", "valorVenta", "valorEnvio", "detalle", "aveId", "aveCodigo", "aveRaza", "aveSexo", "aveFotoUri" } ] } }`. Celular inexistente: `compras: []` con 200.
- Cliente REST: `return data.compras.map(aSnake)`.
- `aveFotoUri` = `aves.foto_r2_key` (hoy contiene la ruta local del teléfono que subió el ave; ver "Pendientes").

### Errores

- Solo los comunes (401, 403, red). No hay `VALIDATION_ERROR` ni errores de dominio: V1 no lanza ninguno. El cliente propaga el `ApiError` sin traducir; `ClientesScreen` ya lo muestra con su texto y "Reintentar"; `DetalleClienteScreen` lo deja en `console.error` y pinta "Cliente no encontrado." (comportamiento V1 ante cualquier fallo; ver "Qué ve cada pantalla").

### Consultas D1 por endpoint (fijo, independiente del número de ventas o clientes)

| Endpoint | Consultas |
|---|---|
| `GET /clientes` | 2: comprobación de propiedad del criadero (la de los demás módulos) + 1 SELECT agregado |
| `GET /clientes/:celular` | 2: propiedad + 1 SELECT agregado |
| `GET /clientes/:celular/compras` | 2: propiedad + 1 SELECT con JOIN |

Las subconsultas correlacionadas de `nombre` y `ciudad` van **dentro** de la misma sentencia (V1 ya las tenía así): no son llamadas a D1 adicionales. Muy por debajo del límite de 50 del plan gratuito. Sin N+1 ni lectura de ventas para agrupar en memoria.

SQL propuesto (nombres de columna de V1 en snake_case, alias camelCase para la respuesta; `?1` = `criaderoId`). Se **añade `criadero_id`** en la consulta principal y en cada subconsulta (si no, un celular repetido en otro criadero mezclaría nombre y ciudad ajenos):

```sql
SELECT
  b.celular AS celular,
  COALESCE((
    SELECT b2.comprador FROM bajas_ave b2
    WHERE b2.criadero_id = ?1 AND b2.tipo = 'VENTA' AND b2.celular = b.celular
      AND TRIM(COALESCE(b2.comprador, '')) <> ''
    ORDER BY b2.fecha DESC, b2.id DESC LIMIT 1
  ), 'Sin nombre') AS nombre,
  COALESCE((
    SELECT b3.ciudad_destino FROM bajas_ave b3
    WHERE b3.criadero_id = ?1 AND b3.tipo = 'VENTA' AND b3.celular = b.celular
      AND TRIM(COALESCE(b3.ciudad_destino, '')) <> ''
    ORDER BY b3.fecha DESC, b3.id DESC LIMIT 1
  ), '') AS ciudad,
  COUNT(*) AS totalCompras,
  COALESCE(SUM(b.valor_venta), 0) AS totalVentas,
  COALESCE(SUM(b.valor_envio), 0) AS totalEnvios,
  MAX(b.fecha) AS ultimaCompra
FROM bajas_ave b
WHERE b.criadero_id = ?1 AND b.tipo = 'VENTA'
  AND b.celular IS NOT NULL AND TRIM(b.celular) <> ''
GROUP BY b.celular
ORDER BY ultimaCompra DESC, b.celular ASC
```

- `GET /clientes/:celular`: la misma SELECT con `WHERE b.criadero_id = ?1 AND b.tipo = 'VENTA' AND b.celular = ?2` (sin las condiciones de `IS NOT NULL`/`TRIM`, como V1 `:179-181`) y sin `ORDER BY`; el servicio devuelve `filas[0] ?? null`.
- `GET /clientes/:celular/compras`:

```sql
SELECT b.id AS ventaId, b.fecha, b.celular, b.comprador,
       b.ciudad_destino AS ciudadDestino, b.cooperativa_envio AS cooperativaEnvio,
       b.valor_venta AS valorVenta, b.valor_envio AS valorEnvio, b.detalle,
       a.id AS aveId, a.codigo AS aveCodigo, a.raza AS aveRaza, a.sexo AS aveSexo,
       a.foto_r2_key AS aveFotoUri
FROM bajas_ave b
INNER JOIN aves a ON a.id = b.ave_id AND a.criadero_id = b.criadero_id
WHERE b.criadero_id = ?1 AND b.tipo = 'VENTA' AND b.celular = ?2
ORDER BY b.fecha DESC, b.id DESC
```

Notas del SQL: el `ORDER BY ultimaCompra DESC, b.celular ASC` conserva el alias de V1 (SQLite permite ordenar por el alias del agregado). Los agregados no se redondean (`REAL`, sin `ROUND`). No se usa `ROW_NUMBER`/CTE: el SQL de V1 es válido en D1 y mantener la forma literal reduce el riesgo de divergencia.

### Orden y desempates (UUID v7 frente a AUTOINCREMENT)

- Listado: `ultima_compra DESC` y luego `celular ASC`: orden total (el celular es la clave del grupo), sin ambigüedad.
- Compras y subconsultas de `nombre`/`ciudad`: `fecha DESC, id DESC`. En V1 `id` es entero creciente por inserción, por lo que desempata las ventas con **idéntica `fecha`** (texto ISO a milisegundos) por orden de registro. En V2 `bajas_ave.id` es UUID v7 generado por el servidor al crear la venta: su texto en hexadecimal minúscula ordena por instante de creación en milisegundos, así que `id DESC` también pone primero la más reciente. Diferencias posibles: (a) dos bajas creadas en el mismo milisegundo por el servidor podrían ordenarse por los bits aleatorios (dependerá de si el generador `uuid` v7 es monotónico dentro del mismo ms; el implementador debe comprobarlo); (b) `fecha` la envía la app y `id` lo genera el servidor, pero `id` solo se consulta cuando `fecha` empata exactamente. Dos ventas con la misma `fecha` al milisegundo requieren dos pulsaciones simultáneas del mismo usuario: caso prácticamente inalcanzable. No afecta a la paridad observable; se prueba con ids sintéticos ordenados (CLI-09).

## Tabla D1

**Sin tabla nueva.** Clientes lee `bajas_ave` (y `aves`) de la migración `0010`/`0006`; no hay columnas nuevas.

**Índice**: el filtro de todas las consultas es `criadero_id` + `tipo = 'VENTA'` + `celular`. `ix_bajas_ave_celular (celular)` (ya existente) cubre `b.celular = ?` y las subconsultas por celular, pero el recorrido del listado completo filtrado por `criadero_id` no tiene índice con `criadero_id` en cabeza (hoy habría un recorrido de `bajas_ave` filtrando; con los volúmenes de un criadero es barato). **No hace falta ninguna migración para la paridad.** Opcional de rendimiento (cambio solo de índice, sin efectos en resultados): `0012` con `CREATE INDEX ix_bajas_ave_criadero_celular ON bajas_ave(criadero_id, celular)`. Decisión del orquestador/usuario (D-1); si se crea, aplicar en local, integración y base de pruebas con la aprobación habitual.

## Excepciones técnicas por pasar a online

- **IDs `TEXT` UUID v7** en `venta_id` y `ave_id` (V1: enteros). La pantalla solo los usa como `key` (`DetalleClienteScreen.js:315-317`); no hay `Number()` ni comparación numérica sobre ningún id en las dos pantallas (búsqueda en ambas: 0 usos).
- **`criadero_id`** en la ruta y en todas las consultas y JOIN; ownership por criadero (403). Con ello el aislamiento entre cuentas y criaderos es por servidor.
- **Celular codificado en la ruta** (`encodeURIComponent`) por ser identificador en una URL; el servidor recibe el texto original.
- **Foto del ave**: `ave_foto_uri` se lee de `aves.foto_r2_key` (R2 aún sin hacer; hoy guarda la ruta local del teléfono). Ver Pendientes.
- **Errores de red y autenticación** (401, 403, sin conexión): el cliente propaga el `ApiError`. Las pantallas ya tienen su manejo V1 (`ClientesScreen` muestra el texto de error con "Reintentar"; `DetalleClienteScreen` lo deja en `console.error`). Sin cambios en pantallas.
- **Cálculo en el servidor** (decisión del usuario): el SQL de agregación de V1 se ejecuta en D1 en lugar de SQLite local. Mismo SQL, mismas semánticas de SQLite.

No hay otras diferencias; no hay validaciones ni límites nuevos.

## Qué ve cada pantalla y si hay que modificarla

**Conclusión: no hay que modificar ninguna pantalla** (`git diff -- src/screens` debe quedar vacío). Se revisó cada uso de campo:

- `ClientesScreen.js:74`: `data` va directo a `setClientes`; lee `nombre`, `celular`, `ciudad`, `total_compras`, `total_ventas`, `ultima_compra` (claves V1 devueltas por el cliente). Con `[]` pinta la tarjeta vacía; con fallo pinta el error y "Reintentar".
- `DetalleClienteScreen.js:73-94`: `clienteData` a `setCliente` y `comprasData` a `setCompras`; lee las 7 claves del cliente y las 14 de compras. `null` → "Cliente no encontrado.".
- Tipos: `Number(x || 0)`, `toFixed(2)`, `formatearDineroOpcional` distinguen `null`; el servidor entrega `null` real (no `0` ni `''`) en `valor_venta`/`valor_envio` y `0` en los totales cuando son `NULL`, igual que V1.
- Sin `Number()` sobre ids ni comparaciones estrictas con enteros.

Observaciones (comportamiento V1 que se mantiene; **no** son excepciones y no se resuelven aquí):
1. `DetalleClienteScreen.cargarDatos` (`:94-100`) no avisa del fallo: ante un error de red o de sesión el usuario ve "Cliente no encontrado." tras la carga. En V1 solo podía ocurrir por un error de SQLite. **DUDA PARA EL USUARIO**: ¿se acepta tal cual, como se aceptó en `DetalleAveScreen` y `FinanzasScreen`, o se quiere un aviso de red? Solo se cambiaría con decisión expresa del usuario, como excepción a `DetalleClienteScreen.js:94-100`.
2. `ave_foto_uri` con ruta local de otro teléfono o reinstalación: `Image` no muestra nada (sin crash); V1 ya no garantizaba que el archivo existiera (`app-movil-v1.md`).

## Casos de paridad

Convenciones: ventas en `bajas_ave` con `tipo = 'VENTA'`; `id` ordenado de forma creciente en el orden de inserción; fechas ISO fijas (sin reloj: son lecturas puras). Ave `K001`, `K002`, … de un mismo criadero.

| id | dado | cuando | entonces | evidencia V1 |
|---|---|---|---|---|
| CLI-01 | Sin ventas | `obtenerClientes()` | `[]`; la pantalla muestra "No hay clientes para mostrar" | `ClientesRepository.js:81-95`; `ClientesScreen.js:306-346` |
| CLI-02 | Dos ventas a `0991234567` (12.5/3.25 y 7.5/`NULL`) | `obtenerClientes()` | 1 fila: `total_compras 2`, `total_ventas 20`, `total_envios 3.25`, `ultima_compra` = la mayor `fecha` | `:61-79` |
| CLI-03 | Venta con `valor_venta` y `valor_envio` `NULL` | `obtenerClientes()` | `total_ventas 0` y `total_envios 0` (número, no `null`) | `:63-75` |
| CLI-04 | Ventas con REAL "difíciles" (0.1 + 0.2) | `obtenerClientes()` | suma exacta del `SUM` de SQLite, sin redondear (pantalla: `toFixed(2)`) | `:63-68` |
| CLI-05 | Venta con `celular NULL`, otra con `celular ' '`, una `MUERTE` con celular | `obtenerClientes()` | ninguna entra en el listado | `:84-86` |
| CLI-06 | Ventas a un celular: la más reciente sin comprador, una anterior con `'Ana'` | `obtenerClientes()` y `obtenerClientePorCelular` | `nombre 'Ana'` (última **con** comprador no vacío) | `:19-38` |
| CLI-07 | Ninguna venta del celular con comprador (`NULL`, `''` o solo espacios; las dos últimas por inserción directa en la prueba) | ambas | `nombre 'Sin nombre'`; pantalla muestra "Sin nombre" | `:37`; `ClientesScreen.js:410-413` |
| CLI-08 | Ninguna con ciudad / ciudades distintas con la última vacía | ambas | `ciudad ''` / la última no vacía; pantalla oculta `📍` si `''` | `:40-59`; `ClientesScreen.js:425-439` |
| CLI-09 | Dos ventas del mismo celular con **idéntica `fecha`** y comprador distinto | ambas | gana la de `id` mayor (en V2 el UUID v7 de creación posterior) | `:32-34,53-55` |
| CLI-10 | Tres clientes con `ultima_compra` distintas y dos con la misma | `obtenerClientes()` | `ultima_compra` descendente; empate por `celular` ascendente | `:91-93` |
| CLI-11 | Cliente existente / inexistente | `obtenerClientePorCelular` | objeto con 7 claves / `null` (200, `cliente: null`); la pantalla: detalle / "Cliente no encontrado." | `:109-189`; `DetalleClienteScreen.js:155-179` |
| CLI-12 | Celular con `+`, espacios, `%` (p. ej. `+593 99 123 4567`) guardado tal cual (inserción directa en la prueba) | las tres funciones | se encuentra por igualdad exacta; `'593…'` sin `+` o sin espacios **no** coincide (sin normalizar); HTTP: el segmento codificado llega intacto | `:181`, `:230` |
| CLI-13 | Cliente con 3 ventas, una sin `valor_envio`, otra con `valor_venta 0`, un ave sin raza ni sexo | `obtenerComprasCliente` | 3 filas con las 14 claves, orden `fecha DESC, id DESC`; `valor_envio null`, `valor_venta 0`, `ave_raza null`, `ave_sexo null`; la pantalla: "No registrado" para el `null`, `$0.00` para `0`, "Sin raza", "Sexo no registrado" | `:205-234`; `DetalleClienteScreen.js:380-387,411-423,548-612` |
| CLI-14 | Celular sin ventas | `obtenerComprasCliente` | `[]` (200), sin error | `:228-234` |
| CLI-15 | Ave vendida dos veces (doble baja) al mismo celular | listado y compras | `total_compras 2` y 2 tarjetas con el mismo `ave_codigo` | `bajas.md` BAJ-10; `:61`, `:225-226` |
| CLI-16 | Ventas con `foto_uri` de ave (V2: `foto_r2_key`) | `obtenerComprasCliente` | `ave_foto_uri` con el texto guardado; `null` si no hay (🐔) | `:221`; `DetalleClienteScreen.js:329-357` |
| CLI-17 | Venta corregida desde Finanzas (`valor_venta` actualizado) | listado y compras | los totales y `valor_venta` reflejan el valor actual de `bajas_ave` | `finanzas.repository.ts:232` |
| CLI-18 | Dos criaderos (o cuentas) con el mismo celular | las tres funciones en cada uno | cada uno ve solo sus ventas; nombre y ciudad no se mezclan; criadero ajeno o inexistente → 403 | excepción técnica `criadero_id` |
| CLI-19 | Muchas ventas (p. ej. 2000 ventas a 300 celulares) | las tres funciones | mismo resultado que V1; D1 recibe 2 consultas por petición (se comprueba contando llamadas del adaptador) | `:7-97` |
| CLI-20 | Fallo de red/sesión | `ClientesScreen` / `DetalleClienteScreen` | Clientes: texto `'No fue posible cargar los clientes.'` y "Reintentar"; Detalle: `console.error` y "Cliente no encontrado." | `ClientesScreen.js:82-93`; `DetalleClienteScreen.js:94-100` |

## Plan de pruebas

1. **Unitarias de service** con fake de repositorio: respuesta 200 con `cliente: null`, listas vacías, sin 404 por celular.
2. **HTTP ligero** (`app.request()`): 401/403 de criadero (inexistente = 403); el celular `+593%2099%20123%204567` y `%25`/`%2F` llegan intactos al service (CLI-12); mapeo camelCase de las claves.
3. **Integración D1** (`LocalD1Adapter`, SQLite en memoria con las migraciones): ejecutar el SQL real con datos de CLI-01 a CLI-19; contar las llamadas a D1 por endpoint (2) con 2000 ventas (CLI-19); aislamiento entre criaderos (CLI-18).
4. **Paridad contra el código real de V1** (como en Finanzas): cargar `src/repositories/ClientesRepository.js` real sobre `better-sqlite3` en memoria con el esquema de V1 (`getDatabase` simulado con `getAllAsync`/`getFirstAsync`), insertar el mismo conjunto de ventas (ids enteros crecientes en V1; UUID v7 crecientes en V2, con celulares y fechas fijas, sin reloj) y comparar las tres funciones tras convertir con `aSnake` (los `id` se comparan por posición/orden, no por valor). Incluir REAL con redondeo "difícil" y el mismo orden de inserción para que el orden de suma de `SUM` coincida.
5. **`/probar datos`**: caso nuevo (numeración a decidir por el orquestador) que registra ventas con `BajaAveRepository.api.js` (varios compradores, celulares con distintos formatos de entrada normalizados, ventas con y sin valores, ave sin raza), consulta con `ClientesRepository.api.js` y comprueba claves exactas, orden, totales y aislamiento entre dos cuentas; limpiar `bajas_ave`/`aves` como los casos existentes.
6. **Pantalla (emulador/`/probar completo`)**: a continuación del flujo `90-baja-venta`: Más → Clientes debe mostrar una tarjeta con el nombre del comprador, `📱 celular`, `📍 ciudad`, Compras `1`, Ventas `$x.xx` y la fecha corta; la búsqueda por nombre/celular/ciudad filtra; al abrir se ve nombre, celular, ciudad, "Compras", "Total aves", "Envíos" y la tarjeta "🐔 Compras realizadas" con código, raza · sexo, fecha, "Valor ave", "Valor envío" ("No registrado" si no hay), "Ciudad", "Cooperativa" y el detalle. Cuenta nueva sin ventas: "No hay clientes para mostrar". Estado de red: se comprueba con modo avión en el teléfono (Clientes muestra el error y "Reintentar"; Detalle "Cliente no encontrado.").

## Implementación (prevista; cumplida el 2026-11-05, ver "Lo implementado")

- API: `api/src/clientes/` (`clientes.routes.ts`, `.factory.ts`, `.service.ts`, `.repository.ts`, `.types.ts`), montado en `app.ts`; sin migración para la paridad.
- Cliente: `ClientesRepository.js` (fachada), `.sqlite.js` (el código actual de V1 sin cambios) y `.api.js` con `apiFetch` y `rutaCriadero` (`src/api/huevosApi.js`), `aSnake` de `src/api/avesApi.js`, `encodeURIComponent` en el celular.
- Nada de `src/screens/`.

## Pendientes y limitaciones

- **Foto del ave**: hasta R2, `ave_foto_uri` es la ruta local de quien subió el ave (solo se ve en ese teléfono).
- En modo API las ventas de la nube ya son visibles en Clientes; Reportes (`obtenerExportacionClientes`) sigue en SQLite.
- Dos cuentas en el mismo teléfono ya no compartirán clientes en modo API (el servidor filtra por criadero).

## Dudas

- **DUDA PARA EL USUARIO:** `DetalleClienteScreen.js:94-100` (`catch` solo con `console.error`): ante un error de red muestra "Cliente no encontrado." en lugar de un aviso de conexión. Se deja como V1; solo se cambiaría con tu decisión expresa.
- D-1 (resuelta): no se crea `0012`; el índice `(criadero_id, celular)` no es necesario con el volumen probado (2000 ventas).
- D-2 (técnica, abierta): confirmar si el generador UUID v7 (`uuid`) es monotónico dentro del mismo milisegundo; solo afecta a empates exactos de `fecha` (CLI-09). Solo comprobado con ids sintéticos.
- D-3 (técnica): celular vacío en la ruta devuelve el 404 de ruta en lugar de `null`/`[]` de V1; inalcanzable desde la UI (hallazgo 5), no se trata.
- D-4 (resuelta): la prueba HTTP CLI-12 comprueba que el celular codificado llega intacto al servicio.
