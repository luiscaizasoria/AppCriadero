# Spec: cuidados-jaula

> **Regla del proyecto (2026-10-29): replicar V1.** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login), y cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz. Solo se permiten diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red). Esta spec describe lo que **realmente existe** en el código (rama `trabajo/migracion-nube`); las propuestas de un servidor más estricto que V1 (jaula activa, fecha no futura, validación de `tipo`, recorte, `CHECK` de `estado_sanitario`, `JAULA_NOT_ACTIVE`, `version`) fueron retiradas y no se implementaron.

## Estado

**implementada** (2026-11-02). Commits: `8ee3c59` (API), `909ffc0` (clientes REST con fachadas), `39ff632` (pantallas: manejo de error), `aa472b6` (pruebas). Migración `0007` aplicada en local, en integración y en la base remota de pruebas; API desplegada en el Worker de pruebas y validada allí con `/probar datos` y con los flujos del emulador. **Pendiente:** comprobación en el teléfono, y las alertas "Sin alimentación/bebida registrada hoy" (módulo de alertas, fase 6), que siguen leyendo el SQLite local.

## Fuente V1

Alcance: cuidados de una **jaula** (alimentación, bebida y sanidad). Aves individuales (sin lotes), sin sincronización offline. D1 es la fuente de verdad en V2. Esta spec cubre tres pantallas, tres repositorios y tres tablas de eventos más el efecto de sanidad sobre `jaulas.estado_sanitario`.

Repositorios (`src/repositories/`; hoy cada uno es un conmutador con `.sqlite.js` y `.api.js`):

- `AlimentacionRepository`: `obtenerTiposAlimentos`, `registrarAlimentacion`, `obtenerAlimentacionJaula`.
- `BebidaRepository`: `obtenerTiposBebidas`, `registrarBebida`.
- `SanidadJaulaRepository`: `registrarSanidadJaula`, `normalizarEstado` (no exportada).
- `HistorialRepository`: `registrarHistorialJaula` (la llaman los tres repositorios dentro de la transacción) y `obtenerHistorialJaula` (lectura del historial).

Pantallas (`src/screens/`): `AlimentacionJaulaScreen.js`, `BebidaJaulaScreen.js`, `SanidadJaulaScreen.js`. Rutas en `src/navigation/JaulasStackNavigator.js` (`AlimentacionJaula`, `BebidaJaula`, `SanidadJaula`). Cada pantalla recibe solo `route.params.jaulaId`.

Esquema V1 (`src/database/migrations.js`, `migrationV1`): `jaulas.estado_sanitario TEXT NOT NULL DEFAULT 'NORMAL'`, `jaula_historial`, `alimentacion_jaula`, `bebida_jaula`, `sanidad_jaula`. Ninguna migración posterior (V2-V7) toca estas columnas ni tablas.

Catálogos: ALIMENTOS y BEBIDAS (ver `documents/specs/catalogos.md`).

Consumidores de lo que escriben estas pantallas:

- `AlertasRepository.js` `obtenerAlertasJaulas`: lee `alimentacion_jaula` y `bebida_jaula` (cuenta filas con `date(fecha) = date('now')`, UTC). `AlertCard.js`, `AlertasScreen.js` e `InicioScreen.js` navegan a las pantallas de bebida/alimentación.
- `JaulaRepository`: lee `estado_sanitario`; lo escribe `crearJaula` (siempre `'NORMAL'`).
- `JaulaCard.js`, `DetalleJaulaScreen.js`, `DetalleJaulaInactivaScreen.js`, `ReportesRepository.js` (`EstadoSanitario`), `constants.js` (`JAULA_SANITARY_STATUS`).
- Entrada a las pantallas: `DetalleJaulaScreen.js` (botones Alimentación, Bebida, Sanidad), `AlertasScreen.js` e `InicioScreen.js` (alimentación/bebida).

## Comportamiento en V1

### Hallazgos

1. **Las pantallas de alimentación y bebida nunca envían `cantidad` ni `detalle`** (solo `jaulaId`, `fecha` y `tipo`). Las columnas quedan `NULL` en datos creados por la UI de V1; el repositorio sí las acepta.
2. **`obtenerAlimentacionJaula` no tiene llamadores** en V1. No existe lectura equivalente para bebida ni sanidad. Los registros se ven solo como eventos de `jaula_historial` (`HistorialJaulaScreen`) y, para alimentación/bebida, a través de las alertas.
3. **`estado_sanitario` no lo leen alertas ni dashboard**; no hay alerta por sanidad ni por cuarentena.
4. **`estado_sanitario` solo se escribe en dos sitios:** `crearJaula` (`'NORMAL'`) y `registrarSanidadJaula`. Desactivar una jaula no lo reinicia.
5. **El `tipo` guardado en `sanidad_jaula` es el texto de pantalla** (`'Fumigación'`), mientras que `jaulas.estado_sanitario` guarda el código (`'FUMIGACION'`); ambos se escriben en la misma transacción.
6. **Un `tipo` de sanidad no reconocido se guarda tal cual en `sanidad_jaula.tipo` pero deja la jaula en `NORMAL`** (rama `default` de `normalizarEstado`); no es alcanzable desde la UI.
7. **La rama `case 'Normal'` de `normalizarEstado` es redundante** (igual que el `default`); RC-CUI-01 cerrada.
8. **Ninguno de los tres repositorios valida que la jaula exista ni que esté activa.** Una jaula inexistente solo falla por la FK (`PRAGMA foreign_keys = ON`); una inactiva se acepta. La UI evita ambos casos.
9. **Las pantallas no protegen contra doble toque**; no hay unicidad. Dos toques pueden crear dos registros y dos eventos.
10. **Alimentación y bebida guardan el `nombre` del ítem de catálogo**, no su `codigo` ni su `id`. Renombrar o desactivar el ítem no cambia los registros históricos.

### a. Catálogos ALIMENTOS y BEBIDAS

- Las pantallas leen la lista con `obtenerTiposAlimentos()` / `obtenerTiposBebidas()` al montarse: ítems con `activo = 1` del catálogo `ALIMENTOS` / `BEBIDAS`, ordenados por `nombre`.
- V1 siembra ambos catálogos **sin ítems**; V2 los puebla por plantilla (Morichillo, Balanceado; Agua, Agua con vitamina; ver "Excepciones técnicas"). En modo API el cliente reutiliza `ConfiguracionRepository.api.js` y reordena por `nombre` (como V1).
- Catálogo vacío: sin mensaje de lista vacía; al guardar sin selección `Alert.alert('Seleccione alimento', 'Debe seleccionar un tipo de alimento.')` o `('Seleccione bebida', 'Debe seleccionar un tipo de bebida.')` (validación **de la pantalla**, no del servidor).
- Selección única, sin opción preseleccionada.
- `cantidad` es `TEXT` sin unidad ni validación; el repositorio guarda `cantidad || null`. `detalle` igual; **no** se incluye en el texto del historial.

### b. Alimentación (`registrarAlimentacion`)

Una transacción: (1) `INSERT` en `alimentacion_jaula`; (2) `registrarHistorialJaula` con `tipoEvento: 'ALIMENTACION'`, `detalle: 'Alimentación: ${tipo}'`, `ave_id` null. No modifica `jaulas`. La `fecha` es la cadena que envía la pantalla: `new Date().toISOString()` (instante ISO UTC).

### c. Bebida (`registrarBebida`)

Idéntica con `bebida_jaula`, `tipoEvento: 'BEBIDA'` y detalle `'Bebida: ${tipo}'`.

### d. Sanidad (`registrarSanidadJaula`)

Una transacción con tres escrituras: (1) `INSERT` en `sanidad_jaula` con `tipo` tal cual y `detalle || null`; (2) `UPDATE jaulas SET estado_sanitario = normalizarEstado(tipo), fecha_actualizacion = CURRENT_TIMESTAMP`; (3) `registrarHistorialJaula` `SANIDAD` con `'Sanidad: ${tipo}'` o `'Sanidad: ${tipo} | ${detalle}'`. La pantalla ofrece cinco botones (`Normal` por defecto) y un `detalle` multilínea que envía con `trim()` (`''` -> `NULL` y sin sufijo ` | `).

### e. Transiciones reales de `jaulas.estado_sanitario`

`normalizarEstado`: `switch` con comparación estricta (mayúsculas y tildes).

| `tipo` recibido | `estado_sanitario` resultante |
|---|---|
| `'Normal'` | `NORMAL` |
| `'Limpieza'` | `LIMPIEZA` |
| `'Fumigación'` | `FUMIGACION` |
| `'Quemadura'` | `QUEMADURA` |
| `'Cuarentena'` | `CUARENTENA` |
| cualquier otro (incluido `'FUMIGACION'`, `'fumigacion'`, `''`) | `NORMAL` |

Restricciones de transición: **ninguna**; el `UPDATE` no depende del estado previo (cualquier estado puede pasar a cualquier otro, incluido el mismo, que inserta otro registro y otro evento). No hay `CHECK` sobre la columna. El `tipo` de jaula `'Cuarentena'` (`jaulas.tipo`) es un atributo distinto. `DetalleJaulaInactivaScreen` muestra el valor en bruto y `ReportesRepository` exporta el código.

### f. Efectos en `jaula_historial`

| Operación | `tipo_evento` | `detalle` exacto | `ave_id` |
|---|---|---|---|
| alimentación | `ALIMENTACION` | `Alimentación: ${tipo}` | `null` |
| bebida | `BEBIDA` | `Bebida: ${tipo}` | `null` |
| sanidad sin detalle | `SANIDAD` | `Sanidad: ${tipo}` | `null` |
| sanidad con detalle | `SANIDAD` | `Sanidad: ${tipo} \| ${detalle}` | `null` |

La `fecha` del evento es la del registro.

### g. Efectos en otras partes de V1

- **Alertas:** para cada jaula activa, si no hay filas de `alimentacion_jaula` / `bebida_jaula` con `date(fecha) = date('now')` (UTC) genera las alertas `Sin alimentación registrada` / `Sin bebida registrada` (nivel `MEDIO`). Pertenecen al módulo de alertas; ver "Pendiente".
- **Jaula:** solo cambia con sanidad (`estado_sanitario`, `fecha_actualizacion`).

## Contrato del repositorio V1

Todos los métodos son `async` y **no lanzan errores propios**; cualquier fallo de SQLite (FK, `NOT NULL`) se propaga tal cual.

| Método | Firma | Devuelve | Errores | Consumo |
|---|---|---|---|---|
| `obtenerTiposAlimentos` | `()` | `Array<{ id, codigo, nombre }>` activos, `ORDER BY nombre`; `[]` si no hay | Ninguno propio | `AlimentacionJaulaScreen` (usa `id` y `nombre`) |
| `registrarAlimentacion` | `({ jaulaId, fecha, tipo, cantidad, detalle })` | `undefined` | FK si la jaula no existe; `NOT NULL` en `fecha`/`tipo` si llegan `null`; `''` pasa | `AlimentacionJaulaScreen`; tras éxito alerta y `goBack()` |
| `obtenerAlimentacionJaula` | `(jaulaId)` | `Array` de `{ id, jaula_id, fecha, tipo, cantidad, detalle, fecha_creacion }`, `ORDER BY fecha DESC` | Ninguno propio | Ninguno |
| `obtenerTiposBebidas` | `()` | `Array<{ id, codigo, nombre }>` del catálogo `BEBIDAS` | Ninguno propio | `BebidaJaulaScreen` |
| `registrarBebida` | `({ jaulaId, fecha, tipo, cantidad, detalle })` | `undefined` | Igual que alimentación | `BebidaJaulaScreen` |
| `registrarSanidadJaula` | `({ jaulaId, fecha, tipo, detalle })` | `undefined` | FK si la jaula no existe | `SanidadJaulaScreen`; con `try/catch`: `Alert.alert('Error', 'No fue posible guardar el registro sanitario.')` |
| `registrarHistorialJaula` | `({ jaulaId, aveId = null, tipoEvento, fecha, detalle, db = null })` | `undefined` | FK de `jaula_id` y `ave_id` | Solo desde repositorios, dentro de la transacción |
| `obtenerHistorialJaula` | `(jaulaId)` | Eventos del historial (snake_case) | Ninguno propio | `HistorialJaulaScreen` |

Mensajes de éxito: `Alimentación registrada` / `El registro fue guardado correctamente.`; `Bebida registrada` (igual); `Sanidad registrada` / `La jaula quedó en estado ${tipo}.`.

## Validaciones en pantalla

Reglas que viven solo en la UI de V1; el servidor **no** las replica (no valida más de lo que V1 validaba en el repositorio).

| Regla | Mensaje exacto | Dónde vive |
|---|---|---|
| Alimentación: tipo obligatorio | `Seleccione alimento` / `Debe seleccionar un tipo de alimento.` | Pantalla (`AlimentacionJaulaScreen`) |
| Bebida: tipo obligatorio | `Seleccione bebida` / `Debe seleccionar un tipo de bebida.` | Pantalla (`BebidaJaulaScreen`) |
| El `tipo` de alimento/bebida es un ítem del catálogo activo (solo la lista) | (sin mensaje) | Pantalla; el servidor acepta cualquier texto |
| Sanidad: `tipo` es uno de los cinco botones, inicial `Normal` | (sin mensaje) | Pantalla; el servidor mapea cualquier otro a `NORMAL` |
| Sanidad: `detalle` se envía con `trim()` | (sin mensaje) | Pantalla (el servidor no recorta) |
| `fecha`: `new Date().toISOString()` | (sin mensaje) | Pantalla; el servidor no la valida |
| Error al guardar sanidad | `Error` / `No fue posible guardar el registro sanitario.` | `SanidadJaulaScreen` (V1) |
| Error al guardar alimentación/bebida | V1: sin manejo. V2: `Error` / `No fue posible guardar el registro.` | Excepción a pantalla aprobada (ver más abajo) |

## Endpoints V2 (implementados)

Todos bajo `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId`, con JWT (`userId` del token, nunca del body). El router de cuidados (`api/src/cuidados/`, `routes -> factory -> service -> repository`) se monta en `api/src/app.ts` sobre esa ruta. Éxito `{ success: true, data }`; error `{ success: false, error, message }`.

Orden de comprobaciones: JWT (401) -> ownership del criadero (`403 FORBIDDEN`) -> cuerpo JSON y objeto (`400 VALIDATION_ERROR`) -> `fecha` obligatoria -> `tipo` obligatorio -> tipo de dato escalar de `fecha`/`tipo`, y de `cantidad`/`detalle` -> existencia de la jaula en el criadero (`404 JAULA_NO_ENCONTRADA`) -> escritura atómica. La fecha se comprueba antes que el tipo y ambos antes que la jaula (como SQLite en V1, donde el `NOT NULL` falla antes que la FK).

### POST `/alimentacion` y POST `/bebida`

- Request: `{ tipo, fecha, cantidad?, detalle? }`. `fecha` y `tipo` obligatorios (no `null`/`undefined`); `cantidad` y `detalle` aplican `x || null` como V1 (vacío, `0` o `false` -> `null`) y se guardan como texto. Sin `trim`. Sin comprobar que el `tipo` esté en el catálogo.
- Efectos (un solo `db.batch`): `INSERT` en `alimentacion_jaula` / `bebida_jaula` y `INSERT` en `jaula_historial` (`ALIMENTACION` / `BEBIDA`, detalle `Alimentación: {tipo}` / `Bebida: {tipo}`, misma `fecha`, `ave_id` null). No modifica `jaulas`.
- Respuesta **201** `{ data: { registro: { id, jaulaId, fecha, tipo, cantidad, detalle } } }`.

### POST `/sanidad`

- Request: `{ tipo, fecha, detalle? }` (sin `cantidad`, como V1).
- Efectos (un solo `db.batch`): `INSERT` en `sanidad_jaula` con el `tipo` recibido; `UPDATE jaulas SET estado_sanitario = normalizarEstado(tipo), fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ? AND criadero_id = ?`; `INSERT` en `jaula_historial` `SANIDAD` (`Sanidad: {tipo}` o `Sanidad: {tipo} | {detalle}`). Sin restricciones de transición; sin `version`.
- Respuesta **201** `{ data: { registro: { id, jaulaId, fecha, tipo, detalle }, jaula: { id, estadoSanitario } } }`.

### GET `/alimentacion`

- Equivale a `obtenerAlimentacionJaula`: `data.registros[]` con `{ id, jaulaId, fecha, tipo, cantidad, detalle, fechaCreacion }`, ordenados `fecha DESC, id DESC` (el desempate por `id` es técnico). Una jaula inexistente o de otro criadero devuelve `registros: []` (V1 devolvería `[]`). No hay lectura de bebida ni sanidad (V1 no la tiene).

### GET `/historial` (módulo jaulas)

Ya existía en el módulo de jaulas (`obtenerHistorialCompletoJaula`); ahora cada evento incluye `fechaCreacion`, que el cliente `HistorialRepository.api.js` devuelve como `fecha_creacion`.

### Errores reales

| Caso | HTTP | Código | Mensaje |
|---|---|---|---|
| Sin token / token inválido | 401 | `UNAUTHORIZED` / `INVALID_TOKEN` | los del middleware |
| Criadero ajeno | 403 | `FORBIDDEN` | `No tiene permisos sobre este criadero` |
| Cuerpo no JSON | 400 | `VALIDATION_ERROR` | `Cuerpo JSON inválido` |
| Falta `fecha` | 400 | `VALIDATION_ERROR` | `NOT NULL constraint failed: <tabla>.fecha` |
| Falta `tipo` | 400 | `VALIDATION_ERROR` | `NOT NULL constraint failed: <tabla>.tipo` |
| `fecha`/`tipo` no escalares; `cantidad`/`detalle` objeto o arreglo | 400 | `VALIDATION_ERROR` | mensaje técnico (tipo de dato) |
| Jaula inexistente o de otro criadero | 404 | `JAULA_NO_ENCONTRADA` | `FOREIGN KEY constraint failed` |
| Error interno | 500 | `INTERNAL_ERROR` | `Error interno del servidor` |

`<tabla>` es `alimentacion_jaula`, `bebida_jaula` o `sanidad_jaula`. La comprobación de dato obligatorio es del servidor para replicar el `NOT NULL` de SQLite; el mensaje `Debe seleccionar un tipo de …` de la pantalla sigue siendo solo de la pantalla.

### Lo que el servidor NO valida (igual que V1)

Jaula inactiva (se acepta), fecha futura o con formato libre, `tipo` fuera del catálogo o de los cinco valores de sanidad (se guarda tal cual y la jaula queda en `NORMAL`), longitudes, espacios sobrantes (sin `trim`), `CHECK` sobre `estado_sanitario`, doble toque o duplicados (sin idempotencia), y no exige `version`.

### Cliente de la app (modo API)

`src/api/cuidadosJaulaApi.js` aporta `rutaJaula(jaulaId)` (lee el criadero de la sesión) y `traducirErrorCuidado`: `JAULA_NO_ENCONTRADA` -> `Error('FOREIGN KEY constraint failed')` y `VALIDATION_ERROR` 400 -> `Error(message)`, para que las pantallas reconozcan los textos de SQLite de V1. `AlimentacionRepository.api.js`, `BebidaRepository.api.js`, `SanidadJaulaRepository.api.js` y `HistorialRepository.api.js` mantienen la interfaz V1 (objetos snake_case; los `registrar*` devuelven `undefined`). `registrarHistorialJaula` en modo API lanza un error explicativo: el servidor registra el evento junto con cada cuidado. Los conmutadores `*.js` eligen `.api.js` o `.sqlite.js` con `EXPO_PUBLIC_DATA_SOURCE`. Las lecturas del catálogo (`obtenerTiposAlimentos`/`obtenerTiposBebidas`) usan `ConfiguracionRepository.api.js`.

## Modelo D1 (migración `0007_cuidados_jaula.sql`)

Aplicada en local, integración y base remota de pruebas. Tres tablas con las mismas columnas, nulabilidad y valores por defecto de V1, más las columnas técnicas. Sin `CHECK`, `version`, `deleted_at` ni `updated_at`; son eventos inmutables (V1 solo hace `INSERT`).

| Tabla | Columnas |
|---|---|
| `alimentacion_jaula` | `id TEXT PK` (UUID v7), `criadero_id TEXT NOT NULL`, `jaula_id TEXT NOT NULL`, `fecha TEXT NOT NULL`, `tipo TEXT NOT NULL`, `cantidad TEXT`, `detalle TEXT`, `fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP` |
| `bebida_jaula` | igual que `alimentacion_jaula` |
| `sanidad_jaula` | igual pero **sin `cantidad`** (como V1) |

FK: `criadero_id -> criaderos(id)` y `jaula_id -> jaulas(id)`, ambas `ON DELETE RESTRICT ON UPDATE RESTRICT`. Índices: `ix_alimentacion_jaula_jaula_fecha`, `ix_bebida_jaula_jaula_fecha` e `ix_sanidad_jaula_jaula_fecha`, todos sobre `(jaula_id, fecha)`. `tipo` es texto libre sin FK al catálogo. `jaulas.estado_sanitario` (`TEXT NOT NULL DEFAULT 'NORMAL'`, sin `CHECK`) viene de `0005`; `jaula_historial` de `0006`. Atomicidad: alimentación y bebida `db.batch([registro, historial])`; sanidad `db.batch([registro, UPDATE jaulas, historial])`, con UUID v7 generados en el servicio. V2 empieza sin datos; no hay importación ni mapeo de IDs.

## Excepciones técnicas (diferencias deliberadas por el paso a online)

| ID | Diferencia | Motivo |
|---|---|---|
| D-CUI-01 | V2 requiere conexión | Online-first (aprobada) |
| D-CUI-02 | Las pantallas necesitan estados de carga y de error de red | Consecuencia de D-CUI-01 (aprobada) |
| D-CUI-03 | ALIMENTOS y BEBIDAS salen con 2 ítems cada uno (V1: vacíos): `MORICHILLO`, `BALANCEADO`; `AGUA`, `AGUA_VITAMINA` | Decisión del usuario (`catalogos.md` D-CAT-03), 2026-10-29 |
| D-CUI-04 | IDs UUID v7 (V1: enteros) y columna `criadero_id` | Multi-tenancy |
| D-CUI-05 | FK con `ON DELETE RESTRICT` (V1: `CASCADE`) | V2 no borra jaulas físicamente |
| D-CUI-06 | Los `POST` devuelven el registro creado (y `jaula.estadoSanitario` en sanidad); el cliente REST devuelve `undefined` como V1 | La API confirma el resultado |
| D-CUI-07 | `GET /historial` devuelve `fechaCreacion` | El cliente la expone como `fecha_creacion` |
| D-CUI-08 | Jaula inexistente: `404 JAULA_NO_ENCONTRADA` con el mensaje `FOREIGN KEY constraint failed`; dato obligatorio: `400 VALIDATION_ERROR` con el texto `NOT NULL constraint failed: …` | Traducir los errores de SQLite de V1 a HTTP conservando su texto |

## Excepciones a pantallas V1 (autorizadas)

Regla general: no se tocan las pantallas de V1. Excepciones aprobadas:

1. **"Cerrar sesión" en `MasMenuScreen`** (solo en modo API). Aprobada antes de este módulo; motivo: autenticación.
2. **`AlimentacionJaulaScreen.js` y `BebidaJaulaScreen.js`**: se añadió `try/catch` con `Alert.alert('Error', 'No fue posible guardar el registro.')` (mismo estilo que `SanidadJaulaScreen`). Aprobada por el usuario el 2026-11-02. Motivo: errores de red al pasar a la nube; V1 no manejaba errores en esas dos pantallas y la promesa rechazada dejaba la pantalla sin respuesta. Nada más cambió en esas pantallas.

Nota de la fase UX (cambio visual aprobado, estados de error): en `AlimentacionJaulaScreen`, `BebidaJaulaScreen` y `HistorialJaulaScreen` la carga de tipos y datos ahora va dentro de un `try/catch` con estado de error y botón «Reintentar» (antes era una promesa sin capturar). No cambia la lógica ni los mensajes de la API, y el `try/catch` con `Alert` de la excepción 2 sigue igual.

Además, el aviso de éxito al guardar un cuidado es ahora un aviso no bloqueante que navega solo (antes un `Alert` con «Aceptar»), con el mismo título y mensaje.

## Paridad con V1

Estado inicial: criadero nuevo en V2 con la plantilla de catálogos de 42 ítems y una jaula activa en estado `NORMAL`, sin registros.

| ID | Dado | Cuando | Entonces |
|---|---|---|---|
| PAR-CUI-001 | Criadero nuevo | Se listan los tipos de alimento | `Balanceado`, `Morichillo` (orden por `nombre`), cada ítem con `id`, `codigo`, `nombre` (diferencia D-CUI-03; V1 devuelve vacío) |
| PAR-CUI-002 | Criadero nuevo | Se listan los tipos de bebida | `Agua`, `Agua con vitamina` (D-CUI-03) |
| PAR-CUI-003 | Ítem de ALIMENTOS desactivado | Se listan tipos | No aparece |
| PAR-CUI-004 | Jaula activa | Alimentación con tipo `Balanceado` | 1 fila en `alimentacion_jaula` (`cantidad` y `detalle` `null`), 1 evento `ALIMENTACION` con `Alimentación: Balanceado` y `ave_id` null; la jaula no cambia; operación atómica |
| PAR-CUI-005 | Jaula activa | Bebida con tipo `Agua con vitamina` | 1 fila en `bebida_jaula` y evento `BEBIDA` con `Bebida: Agua con vitamina` |
| PAR-CUI-006 | Alimentación con `Morichillo`; el ítem se renombra o desactiva | Se consulta el registro | Conserva el texto `Morichillo` (sin FK) |
| PAR-CUI-007 | Catálogo ALIMENTOS sin ítems activos | Se guarda sin seleccionar | Lo detiene la pantalla: `Seleccione alimento` / `Debe seleccionar un tipo de alimento.` |
| PAR-CUI-008 | Catálogo BEBIDAS sin ítems activos | Ídem | `Seleccione bebida` / `Debe seleccionar un tipo de bebida.` (pantalla) |
| PAR-CUI-009 | Llamada a la API | Alimentación o bebida sin `tipo` | `400 VALIDATION_ERROR` con `NOT NULL constraint failed: <tabla>.tipo` (equivale al `NOT NULL` de V1) |
| PAR-CUI-010 | Llamada a la API | Sin `fecha` (y sin `tipo`) | `NOT NULL constraint failed: <tabla>.fecha` (la fecha se comprueba antes que el tipo) |
| PAR-CUI-011 | `cantidad = ''` o `detalle = ''` | Se registra | Se guardan `null` (`x \|\| null`) |
| PAR-CUI-012 | `cantidad = '2 kg'` y `detalle = 'Mañana'` | Se registra | Se guardan tal cual; el evento de historial no los incluye |
| PAR-CUI-013 | Jaula `NORMAL` | Sanidad `Limpieza` sin detalle | `estado_sanitario = 'LIMPIEZA'`; fila con `tipo = 'Limpieza'`, `detalle` null; evento `Sanidad: Limpieza`; `fecha_actualizacion` se actualiza |
| PAR-CUI-014 | Jaula `NORMAL` | Sanidad `Fumigación` con detalle `Se aplicó producto` | `FUMIGACION`; `sanidad_jaula.tipo = 'Fumigación'`; evento `Sanidad: Fumigación \| Se aplicó producto` |
| PAR-CUI-015 | Detalle `'   '` | Sanidad por la API | **Sin `trim` en el servidor**: se guarda `'   '` y el evento lleva ` \| `. En la app lo evita la pantalla (`detalle.trim()`), como en V1 |
| PAR-CUI-016 | Jaula en cualquier estado | Sanidad con cada uno de los 5 tipos | Estados `NORMAL`, `LIMPIEZA`, `FUMIGACION`, `QUEMADURA`, `CUARENTENA` |
| PAR-CUI-017 | Jaula en `CUARENTENA` | Sanidad `Normal` | Pasa a `NORMAL` (sin restricciones) |
| PAR-CUI-018 | Jaula en `LIMPIEZA` | Sanidad `Limpieza` otra vez | Estado igual; otra fila, otro evento |
| PAR-CUI-019 | Llamada a la API | Sanidad con `tipo = 'FUMIGACION'` o `'cuarentena'` | **V2 acepta, como V1**: `sanidad_jaula.tipo` guarda el texto crudo y la jaula queda en `NORMAL` |
| PAR-CUI-020 | Jaula recién creada | Se consulta | `estado_sanitario = 'NORMAL'` |
| PAR-CUI-021 | Jaula activa | Dos alimentaciones el mismo día | Ambas se guardan, con dos eventos |
| PAR-CUI-022 | Jaula con registros | `GET /alimentacion` | `fecha` descendente; `{ id, jaulaId, fecha, tipo, cantidad, detalle, fechaCreacion }` |
| PAR-CUI-023 | Jaula activa sin registros hoy | Se calculan alertas | **Pendiente**: las alertas siguen leyendo SQLite local (fase 6) |
| PAR-CUI-024 | Jaula en `CUARENTENA` | Alertas/dashboard | Sin alerta por estado sanitario (igual que V1) |
| PAR-CUI-025 | `jaulaId` inexistente | Cualquier cuidado | **V2 `404 JAULA_NO_ENCONTRADA`** con `FOREIGN KEY constraint failed`, sin escritura (equivale al error de FK de V1) |
| PAR-CUI-026 | Jaula inactiva | Cualquier cuidado | **V2 acepta, como V1** |
| PAR-CUI-027 | Fallo del servidor al guardar sanidad | Se guarda | `Error` / `No fue posible guardar el registro sanitario.` (pantalla) |
| PAR-CUI-028 | Fallo a mitad de la operación | Cualquier cuidado | No queda registro, cambio de estado ni evento (`db.batch`) |
| PAR-CUI-029 | Jaula de otro criadero o usuario | Cualquier cuidado | `403 FORBIDDEN` (criadero ajeno) o `404 JAULA_NO_ENCONTRADA` (jaula de otro criadero propio); sin equivalente en V1 |
| PAR-CUI-030 | `fecha` futura | Cualquier cuidado | **V2 acepta, como V1** |
| PAR-CUI-031 | Error de red al guardar alimentación/bebida | Se guarda | `Error` / `No fue posible guardar el registro.` (excepción a pantalla aprobada) |

## Reglas abiertas y decisiones

Todas resueltas por la regla del proyecto (replicar V1), salvo lo indicado.

### Resolubles leyendo código

- **RC-CUI-01** (cerrada): `case 'Normal'` redundante; no se perdió ninguna función entre v1.0.0 y v1.0.3.
- **RC-CUI-02** (abierta, sin impacto): confirmar en V1 en dispositivo que una `jaulaId` inexistente falla por FK y el mensaje que ve el usuario. En V2 se traduce a `FOREIGN KEY constraint failed`.
- **RC-CUI-03** (resuelta): `HistorialJaulaScreen` lee `obtenerHistorialJaula`; en modo API usa `GET /historial` (módulo jaulas) con `fechaCreacion`.
- **RC-CUI-04** (abierta, sin relevancia para V2): el backup de V1 enumera tablas desde `sqlite_master`; no se leyó completo.
- **RC-CUI-05** (resuelta): el orden por `nombre` de V1 se conserva reordenando en el cliente REST.
- **RC-CUI-06** (abierta, módulo de alertas): las alertas comparan `date(fecha) = date('now')` en UTC.
- **RC-CUI-07 a RC-CUI-10** (cerradas): `obtenerAlimentacionJaula` sin llamadores; las pantallas no envían `cantidad`/`detalle`; solo el reporte lee `estado_sanitario`; sin restricciones de transición.

### Decisión de producto

- **DP-CUI-01 a DP-CUI-06, DP-CUI-08, DP-CUI-09, DP-CUI-11 a DP-CUI-13**: resueltas, replicar V1. `tipo` de sanidad con los textos de V1 y cualquier otro se acepta; el valor guardado es el `nombre`; `cantidad`/`detalle` opcionales sin límite; la `fecha` la envía el cliente y no se valida; tablas sin `updated_at`/`version`/`deleted_at`; sin restricciones de transición; sin `version` de la jaula; solo `GET /alimentacion` (lo único que V1 tiene); "hoy" en UTC como V1 (alertas, pendiente); sin idempotencia; los ítems en uso no se bloquean.
- **DP-CUI-07** (`JAULA_NOT_ACTIVE`): **revocada**; no existe ese código.
- **DP-CUI-10** (resuelta, técnica): una sola migración `0007_cuidados_jaula.sql` con las tres tablas.

## Criterios de terminado

- [x] Migración `0007` con las tres tablas, FK `ON DELETE RESTRICT`, `criadero_id` e índices, aplicada en local, en integración y en la base remota de pruebas.
- [x] Endpoints implementados en `api/src/cuidados/` (`routes -> factory -> service -> repository`) con registro + historial (+ cambio de estado en sanidad) en un único `db.batch`.
- [x] Ownership: otro usuario recibe `403 FORBIDDEN`; una jaula de otro criadero devuelve `404 JAULA_NO_ENCONTRADA` sin escribir.
- [x] Paridad con V1 sin validaciones nuevas (jaula inactiva, fecha futura, `tipo` libre y sin `trim` aceptados).
- [x] Clientes REST con fachadas (`Alimentacion`, `Bebida`, `SanidadJaula`, `Historial` `*.api.js`) y excepción aprobada en las dos pantallas.
- [x] Pruebas unitarias, HTTP e integración (commit `aa472b6`); validado en el Worker de pruebas con `/probar datos` y los flujos del emulador.
- [ ] Comprobación en el teléfono.
- [ ] Alertas "Sin alimentación/bebida registrada hoy" leyendo la nube (módulo de alertas, fase 6 del roadmap).
