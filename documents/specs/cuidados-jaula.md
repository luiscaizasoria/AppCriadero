# Spec: cuidados-jaula

> **Regla de paridad con V1.** V2 empieza sin datos de usuario, solo con catálogos. La V1 está probada y es el contrato: V2 reproduce exactamente lo que hace V1. Todo lo que V2 haga distinto es una **diferencia deliberada**: debe registrarse en la sección "Diferencias deliberadas" y estar aprobada por el usuario. Diferencias ya aceptadas: V2 requiere conexión y las pantallas necesitan estados de carga y de error de red.

## Estado

borrador

## Fuente V1

Alcance: cuidados de una **jaula** (alimentación, bebida y sanidad). Aves individuales (sin lotes), sin sincronización offline. D1 es la fuente de verdad en V2. Los números de línea son del árbol actual (rama `spec/jaulas`). Esta spec cubre tres pantallas, tres repositorios y tres tablas de eventos más el efecto de sanidad sobre `jaulas.estado_sanitario`.

Repositorios (`src/repositories/`):

- `AlimentacionRepository.js`: `obtenerTiposAlimentos` (l.8-32), `registrarAlimentacion` (l.36-91), `obtenerAlimentacionJaula` (l.95-117).
- `BebidaRepository.js`: `obtenerTiposBebidas` (l.9-33), `registrarBebida` (l.37-92).
- `SanidadJaulaRepository.js`: `registrarSanidadJaula` (l.7-60), `normalizarEstado` (l.62-84, **no exportada**).
- `HistorialRepository.js`: `registrarHistorialJaula` (l.4-38; la llaman los tres repositorios con `db` dentro de la transacción) y `obtenerHistorialJaula` (l.41-66; lectura del historial, fuera del alcance de escritura de esta spec).

Pantallas (`src/screens/`): `AlimentacionJaulaScreen.js`, `BebidaJaulaScreen.js`, `SanidadJaulaScreen.js`. Rutas en `src/navigation/JaulasStackNavigator.js:113-144` (`AlimentacionJaula` título `Alimentación`, `BebidaJaula` título `Bebida`, `SanidadJaula` título `Sanidad`). Cada pantalla recibe solo `route.params.jaulaId` (`AlimentacionJaulaScreen.js:29-31`, `BebidaJaulaScreen.js:29-31`, `SanidadJaulaScreen.js:43-45`).

Esquema (`src/database/migrations.js`, `migrationV1`): `jaulas` (l.29-39, `estado_sanitario TEXT NOT NULL DEFAULT 'NORMAL'` en l.35), `jaula_historial` (l.109-130), `alimentacion_jaula` (l.157-175), `bebida_jaula` (l.178-196), `sanidad_jaula` (l.199-215), índice `idx_jaula_historial_jaula` (l.352-353). Búsqueda sin límite de `estado_sanitario|alimentacion_jaula|bebida_jaula|sanidad_jaula` en `src/`: ninguna migración posterior (V2-V7) toca estas columnas ni tablas; `migrationV6.js:6-7` solo añade `jaulas.fecha_desactivacion`.

Catálogos: `seeders.js` (catálogos `ALIMENTOS` l.93-106 y `BEBIDAS` l.110-123, sin ítems), `migrationV7.js:33-55`, `ConfiguracionScreen.js:40-48` (ofrece administrarlos), `ConfiguracionRepository.js` (alta/edición/desactivación de ítems). Ver `documents/specs/catalogos.md`.

Consumidores de lo que escriben estas pantallas:

- `AlertasRepository.js` `obtenerAlertasJaulas` (l.124-363): lee `alimentacion_jaula` (l.170-197) y `bebida_jaula` (l.264-291). `AlertCard.js:61-69`, `AlertasScreen.js:598-649` e `InicioScreen.js:794-826` navegan a las pantallas de bebida/alimentación.
- `JaulaRepository.js`: lee `estado_sanitario` en `obtenerJaulas` (l.14, 32), `obtenerJaulasInactivas` (l.52, 68), `obtenerJaulaPorId` (`SELECT *`, l.142-155); lo escribe `crearJaula` (l.157-189, siempre `'NORMAL'`, l.177).
- `JaulaCard.js:31-33`, `DetalleJaulaScreen.js:657-659, 1013-1043`, `DetalleJaulaInactivaScreen.js:183`, `ReportesRepository.js:269-290` (`obtenerExportacionJaulas`, `EstadoSanitario`, l.281), `constants.js:34-153` (`JAULA_SANITARY_STATUS`, estilos y `getJaulaSanitaryStatusStyle`).
- Entrada a las pantallas: `DetalleJaulaScreen.js:1280-1390` (tarjeta "Acciones de la jaula"; botones `🍚 Alimentación`, `💧 Bebida`, `🧼 Sanidad`, l.1291-1363), `AlertasScreen.js:598-649` e `InicioScreen.js:794-826` (alimentación/bebida).

Contexto (no sustituye al código): `documents/CriaderoKikirikis_V1_Analisis_Movil_y_Mapeo_API.md` (mapeo l.744-746 y l.894-913), `documents/specs/catalogos.md`, `documents/specs/aves.md` (patrón de `JAULA_NOT_FOUND` y jaula inactiva).

## Comportamiento en V1

### Hallazgos que corrigen o precisan documentos previos

1. **Las pantallas de alimentación y bebida nunca envían `cantidad` ni `detalle`.** Los únicos llamadores de `registrarAlimentacion` y `registrarBebida` en `src/` (búsqueda sin límite) son `AlimentacionJaulaScreen.js:81-92` y `BebidaJaulaScreen.js:82-93`, que pasan solo `jaulaId`, `fecha` y `tipo`. Las columnas `cantidad` y `detalle` de `alimentacion_jaula` y `bebida_jaula` quedan siempre `NULL` en datos creados por la UI de V1. El repositorio sí las acepta (`AlimentacionRepository.js:36-42, 67-68`; `BebidaRepository.js:37-43, 68-69`). El análisis V1 (l.619) y el mapeo (l.899, 907) las listan como campos del request: son capacidad del repositorio, no de la pantalla.
2. **`obtenerAlimentacionJaula` no tiene llamadores.** Búsqueda sin límite de `obtenerAlimentacionJaula` en `src/`: solo aparece su definición (`AlimentacionRepository.js:95`). No existe equivalente de lectura para bebida ni sanidad. Ninguna pantalla de V1 muestra el contenido de `alimentacion_jaula`, `bebida_jaula` ni `sanidad_jaula`; solo se ven como eventos de `jaula_historial` (`HistorialJaulaScreen.js:79-106`, que imprime `tipo_evento`, `fecha` y `detalle` en bruto) y, para alimentación/bebida, a través de las alertas.
3. **`estado_sanitario` no lo leen alertas ni dashboard.** Búsqueda sin límite en `src/`: lo leen solo `JaulaRepository`, `JaulaCard`, `DetalleJaulaScreen`, `DetalleJaulaInactivaScreen` y `ReportesRepository`. `AlertasRepository.js` y `DashboardRepository.js` no lo usan (el dashboard solo cuenta jaulas activas y ocupadas, `DashboardRepository.js:157-185`). Las alertas de jaula usan únicamente `alimentacion_jaula` y `bebida_jaula`; **no hay alerta por sanidad ni por cuarentena**.
4. **`estado_sanitario` solo se escribe en dos sitios.** `crearJaula` (`'NORMAL'`, `JaulaRepository.js:177`) y `registrarSanidadJaula` (`SanidadJaulaRepository.js:37-49`). Búsqueda sin límite de `estado_sanitario` en `src/`. Desactivar una jaula no lo reinicia (`JaulaRepository.js:371-384` solo cambia `activa`, `fecha_desactivacion`, `fecha_actualizacion`).
5. **El `tipo` de sanidad guardado en `sanidad_jaula` es el texto de la pantalla** (`'Fumigación'`, con tilde y mayúscula inicial), mientras que `jaulas.estado_sanitario` guarda el código normalizado (`'FUMIGACION'`). Los dos valores se escriben en la misma transacción (`SanidadJaulaRepository.js:29-34, 45-48`).
6. **Un `tipo` de sanidad no reconocido se guarda tal cual en `sanidad_jaula.tipo` pero deja la jaula en `NORMAL`** (rama `default` de `normalizarEstado`, l.81-82). La pantalla solo envía los cinco valores de `TIPOS` (`SanidadJaulaScreen.js:27-33`), por lo que esa rama no es alcanzable desde la UI.
7. **La rama `case 'Normal'` de `normalizarEstado` (l.66-67) es redundante en comportamiento.** Devuelve `'NORMAL'`, igual que el `default` (l.81-82). Verificado con git (`git show v1.0.0:src/repositories/SanidadJaulaRepository.js`): se añadió entre v1.0.0 y v1.0.3 junto con un reformateo de la transacción; en v1.0.0 el `default` ya devolvía `'NORMAL'`, así que el resultado observable es idéntico con o sin ese caso (RC-CUI-01, cerrada).
8. **Ninguno de los tres repositorios valida que la jaula exista ni que esté activa.** No hay `SELECT` previo ni `throw` en `AlimentacionRepository.js`, `BebidaRepository.js` ni `SanidadJaulaRepository.js` (búsqueda de `throw` en los tres archivos: sin resultados). Una jaula inexistente solo falla por la FK de `alimentacion_jaula.jaula_id` / `bebida_jaula.jaula_id` / `sanidad_jaula.jaula_id` (`migrations.js:172-174, 193-195, 212-214`), con `PRAGMA foreign_keys = ON` (`sqlite.js:63`; deducido, no probado en dispositivo). Una jaula inactiva se acepta. La UI evita ambos casos: las pantallas solo se abren desde `DetalleJaula` (jaulas activas; las inactivas van a `DetalleJaulaInactiva`, `JaulasScreen.js:319-324`, que no tiene botones de cuidado, búsqueda sin límite de `'AlimentacionJaula'|'BebidaJaula'|'SanidadJaula'` en `src/`) y desde alertas, que solo se generan para `activa = 1` (`AlertasRepository.js:135-154`).
9. **Las pantallas no protegen contra doble toque.** Ninguna tiene estado de "guardando" ni deshabilita el botón (`AlimentacionJaulaScreen.js:162-171`, `BebidaJaulaScreen.js:163-172`, `SanidadJaulaScreen.js:260-283`); no hay restricción de unicidad en las tablas. Dos toques seguidos pueden crear dos registros y dos eventos de historial.
10. **Los textos de alimentación y bebida guardan el `nombre` del ítem de catálogo, no su `codigo` ni su `id`** (`AlimentacionJaulaScreen.js:89-90`, `BebidaJaulaScreen.js:90-91`). Renombrar o desactivar el ítem no cambia los registros históricos (coherente con `catalogos.md`, tabla de consumo).

### a. Catálogos ALIMENTOS y BEBIDAS

- Las pantallas leen la lista con `obtenerTiposAlimentos()` / `obtenerTiposBebidas()` al montarse (`useEffect` sin dependencias, `AlimentacionJaulaScreen.js:46-61`, `BebidaJaulaScreen.js:47-62`). Solo ítems con `ci.activo = 1` del catálogo con `codigo = 'ALIMENTOS'` / `'BEBIDAS'`, ordenados por `ci.nombre` (`AlimentacionRepository.js:25-28`, `BebidaRepository.js:26-29`).
- V1 siembra ambos catálogos **sin ítems** (`seeders.js:93-123`; `migrationV7.js:33-55`; confirmado en `catalogos.md`, hallazgos 1 y 7). El usuario los puebla desde `Configuración` (`ConfiguracionScreen.js:40-48`).
- **Decisión aprobada (2026-10-29):** en V2 ALIMENTOS = Morichillo (`MORICHILLO`), Balanceado (`BALANCEADO`); BEBIDAS = Agua (`AGUA`), Agua con vitamina (`AGUA_VITAMINA`) (`catalogos.md`, D-CAT-03 y DP-CAT-02; plantilla de 38 a 42 ítems, **aún no implementada**). Los ítems pertenecen al criadero; cada usuario puede crear, editar y desactivar los suyos.
- **Catálogo vacío en V1 (sin ítems activos):** las pantallas no muestran ningún mensaje de lista vacía. `tipos.map(...)` no renderiza nada (`AlimentacionJaulaScreen.js:121-158`, `BebidaJaulaScreen.js:122-159`) y solo se ven el título (`🍚 Alimentación` / `💧 Bebida`) y el botón `💾 Guardar`. Al guardar sin selección aparece `Alert.alert('Seleccione alimento', 'Debe seleccionar un tipo de alimento.')` (`AlimentacionJaulaScreen.js:68-77`) o `Alert.alert('Seleccione bebida', 'Debe seleccionar un tipo de bebida.')` (`BebidaJaulaScreen.js:69-78`). La pantalla no ofrece un enlace a `Configuración`. (A diferencia de `SelectorCatalogo`, que muestra `No existen opciones disponibles.` en otras pantallas, `catalogos.md` l.119; estas dos pantallas no lo usan.)
- Selección: una sola opción; se resalta con `tipo?.id === item.id` (`AlimentacionJaulaScreen.js:128-134, 143-150`). No hay opción preseleccionada (`useState(null)`, l.40-43).
- **Cantidad:** columna `cantidad TEXT` (`migrations.js:166, 187`), sin tipo numérico, sin unidad y sin validación. El repositorio guarda `cantidad || null` (`AlimentacionRepository.js:67`, `BebidaRepository.js:68`): vacío, `null`, `undefined`, `0` y `false` se convierten en `NULL`. La pantalla no tiene campo de cantidad (hallazgo 1). Por tanto "cantidad" es **texto libre sin validación**, hoy sin ruta de entrada desde la UI.
- `detalle` (alimentación/bebida): igual, `detalle || null`, sin campo en pantalla; **no** se incluye en el texto del historial.

### b. Alimentación (`registrarAlimentacion`)

Operación en una transacción (`db.withTransactionAsync`, `AlimentacionRepository.js:48-89`):

1. `INSERT INTO alimentacion_jaula (jaula_id, fecha, tipo, cantidad, detalle)` (l.51-70). `fecha_creacion` toma su `DEFAULT CURRENT_TIMESTAMP` (`migrations.js:170`).
2. `registrarHistorialJaula({ jaulaId, tipoEvento: 'ALIMENTACION', fecha, detalle: 'Alimentación: ${tipo}', db })` (l.73-86). `ave_id` queda `null` (valor por defecto, `HistorialRepository.js:6`).

No modifica `jaulas` (no toca `fecha_actualizacion` ni `estado_sanitario`). La `fecha` del registro y del evento es la misma cadena que envía la pantalla: `new Date().toISOString()` (`AlimentacionJaulaScreen.js:85-87`), es decir un instante ISO UTC con milisegundos, no una fecha `YYYY-MM-DD`.

### c. Bebida (`registrarBebida`)

Idéntica a alimentación con la tabla `bebida_jaula` (`BebidaRepository.js:52-71`), `tipoEvento: 'BEBIDA'` y detalle `'Bebida: ${tipo}'` (l.74-87). `fecha = new Date().toISOString()` (`BebidaJaulaScreen.js:86-88`).

### d. Sanidad (`registrarSanidadJaula`)

Una transacción (`SanidadJaulaRepository.js:16-59`) con tres escrituras:

1. `INSERT INTO sanidad_jaula (jaula_id, fecha, tipo, detalle)` con `tipo` tal cual lo recibe (el texto de pantalla) y `detalle || null` (l.18-35).
2. `UPDATE jaulas SET estado_sanitario = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?` con `normalizarEstado(tipo)` (l.37-49). No comprueba el número de filas afectadas.
3. `registrarHistorialJaula({ jaulaId, tipoEvento: 'SANIDAD', fecha, detalle: 'Sanidad: ${tipo}${detalle ? ' | '+detalle : ''}', db })` (l.51-57).

Pantalla: botones de selección única con los cinco valores de `TIPOS` (`SanidadJaulaScreen.js:27-33`), seleccionado por defecto `'Normal'` (l.49-52), y un cuadro multilínea `detalle` con placeholder `Detalle de la actividad sanitaria...` (l.237-255). El botón `Normal` se muestra como `🟢 Normal` (l.213-219). Se envía `detalle.trim()` (l.81-82): un detalle de solo espacios llega como `''`, que el repositorio guarda como `NULL` y no añade el sufijo ` | ` al historial (la condición `detalle ?` es falsa con `''`).

### e. Transiciones reales de `jaulas.estado_sanitario`

Función `normalizarEstado` (`SanidadJaulaRepository.js:62-84`): `switch` con comparación estricta y sensible a mayúsculas y tildes.

| `tipo` recibido | `estado_sanitario` resultante | Línea | Etiqueta en UI (`constants.js`) |
|---|---|---|---|
| `'Normal'` | `NORMAL` | l.66-67 | `Normal` (l.51-64) |
| `'Limpieza'` | `LIMPIEZA` | l.69-70 | `Limpieza` (l.67-80) |
| `'Fumigación'` | `FUMIGACION` | l.72-73 | `Fumigación` (l.83-96) |
| `'Quemadura'` | `QUEMADURA` | l.75-76 | `Quemadura` (l.99-112) |
| `'Cuarentena'` | `CUARENTENA` | l.78-79 | `Cuarentena` (l.115-128) |
| cualquier otro (incluido `'FUMIGACION'`, `'fumigacion'`, `''`, `undefined`) | `NORMAL` | l.81-82 | `Normal` |

Restricciones de transición: **ninguna**. No se lee el estado actual antes de escribir (la sentencia `UPDATE` no depende del valor previo), por lo que cualquier estado puede pasar a cualquier otro, incluido el mismo (se vuelve a insertar un registro, se actualiza `fecha_actualizacion` y se crea otro evento). En particular desde `CUARENTENA` se puede ir a `NORMAL`, `LIMPIEZA`, `FUMIGACION`, `QUEMADURA` o `CUARENTENA`. Matriz real:

| Estado actual \ tipo registrado | Normal | Limpieza | Fumigación | Quemadura | Cuarentena |
|---|---|---|---|---|---|
| NORMAL | NORMAL | LIMPIEZA | FUMIGACION | QUEMADURA | CUARENTENA |
| LIMPIEZA | NORMAL | LIMPIEZA | FUMIGACION | QUEMADURA | CUARENTENA |
| FUMIGACION | NORMAL | LIMPIEZA | FUMIGACION | QUEMADURA | CUARENTENA |
| QUEMADURA | NORMAL | LIMPIEZA | FUMIGACION | QUEMADURA | CUARENTENA |
| CUARENTENA | NORMAL | LIMPIEZA | FUMIGACION | QUEMADURA | CUARENTENA |

(La fila no depende del estado actual: es la tabla anterior repetida.) Valor por defecto: en la creación `jaulas.estado_sanitario = 'NORMAL'` (`migrations.js:35`; `crearJaula` lo fija explícitamente, `JaulaRepository.js:177`). No hay `CHECK` sobre la columna en `migrations.js:35`. El `tipo` de jaula `'Cuarentena'` de `NuevaJaulaScreen.js:26-32` (`TIPOS_JAULA`) es un atributo distinto (`jaulas.tipo`) y no se relaciona con `estado_sanitario` (búsqueda sin límite: ningún código los acopla).

Presentación: `getJaulaSanitaryStatusStyle` recorta, pasa a mayúsculas y, si el valor es vacío o desconocido, usa el estilo `NORMAL` (`constants.js:133-151`). `DetalleJaulaInactivaScreen.js:183` muestra el valor **en bruto** (`jaula.estado_sanitario`, p. ej. `CUARENTENA`), no la etiqueta. `ReportesRepository.js:281` exporta el código en bruto como `EstadoSanitario`.

### f. Efectos en `jaula_historial`

`registrarHistorialJaula` (`HistorialRepository.js:17-36`) inserta `(jaula_id, ave_id, tipo_evento, fecha, detalle)`; `detalle || null`. `fecha_creacion` toma el valor por defecto (`migrations.js:122`).

| Operación | `tipo_evento` | `detalle` exacto | `ave_id` |
|---|---|---|---|
| `registrarAlimentacion` | `ALIMENTACION` | `Alimentación: ${tipo}` (p. ej. `Alimentación: Balanceado`) | `null` |
| `registrarBebida` | `BEBIDA` | `Bebida: ${tipo}` | `null` |
| `registrarSanidadJaula` sin detalle | `SANIDAD` | `Sanidad: ${tipo}` (p. ej. `Sanidad: Fumigación`) | `null` |
| `registrarSanidadJaula` con detalle | `SANIDAD` | `Sanidad: ${tipo} \| ${detalle}` (separador ` \| ` con espacios) | `null` |

La `fecha` del evento es la misma que la del registro. Los demás tipos de evento de `jaula_historial` (`INGRESO_AVE`, `SALIDA_AVE`) pertenecen a aves y jaulas.

### g. Efectos en otras partes de V1

- **Alertas** (`AlertasRepository.js:124-363`): para cada jaula con `activa = 1` cuenta filas de `alimentacion_jaula` y `bebida_jaula` con `date(fecha) = date('now')` (l.170-197, 264-291; fecha en **UTC** porque `fecha` es ISO UTC y `date('now')` es UTC). Si el conteo es 0 genera una alerta `{ tipo: 'JAULA', nivel: 'MEDIO', titulo: 'Sin alimentación registrada', mensaje: 'La jaula ${codigo} no tiene alimentación registrada hoy.', entidadId: jaula.id, accion: 'DETALLE_JAULA', accionDestino: 'ALIMENTACION_JAULA' }` (l.203-254) o la equivalente de bebida (`'Sin bebida registrada'`, `'La jaula ${codigo} no tiene bebida registrada hoy.'`, `'BEBIDA_JAULA'`, l.297-348). `AlertCard.js:61-69` rotula `💧 Registrar bebida →` y `🍚 Registrar alimentación →`. Estas alertas pertenecen al módulo de alertas; aquí se documentan porque dependen de que las tablas existan y de la fecha.
- **Jaula** (`jaulas`): solo cambia con sanidad (`estado_sanitario`, `fecha_actualizacion`).

## Contrato del repositorio V1

Todos los métodos son `async`, obtienen la base con `getDatabase()` y **no lanzan errores propios**: no hay `throw` en estos tres archivos. Cualquier fallo de SQLite (FK, `NOT NULL`) se propaga tal cual. Los `id` son `INTEGER AUTOINCREMENT` (V2: UUID v7).

| Método (archivo:línea) | Firma exacta | Devuelve | Errores | Consumo |
|---|---|---|---|---|
| `obtenerTiposAlimentos` (`AlimentacionRepository.js:8`) | `()` | `Array<{ id: INTEGER, codigo: TEXT, nombre: TEXT }>` de `catalogo_items` activos del catálogo `ALIMENTOS`, `ORDER BY ci.nombre`; `[]` si no hay | Ninguno propio | `AlimentacionJaulaScreen.js:54-61` (`setTipos(data)`); usa `id` (clave y selección) y `nombre` (texto y valor guardado); `codigo` no se usa. Sin `try/catch`: un fallo queda como promesa rechazada sin alerta |
| `registrarAlimentacion` (`AlimentacionRepository.js:36`) | `({ jaulaId, fecha, tipo, cantidad, detalle })` | `undefined` (no devuelve el `id` del registro) | FK de `jaula_id` si la jaula no existe; `NOT NULL` en `fecha`/`tipo` si llegaran `null`; `tipo`/`fecha` vacíos (`''`) pasan | `AlimentacionJaulaScreen.js:81-92`. Sin `try/catch`; tras la llamada muestra la alerta de éxito y `goBack()` |
| `obtenerAlimentacionJaula` (`AlimentacionRepository.js:95`) | `(jaulaId)` | `Array` de `SELECT *` de `alimentacion_jaula`: `{ id, jaula_id, fecha, tipo, cantidad, detalle, fecha_creacion }`, `ORDER BY fecha DESC` (sin desempate) | Ninguno propio | **Ninguno** (hallazgo 2) |
| `obtenerTiposBebidas` (`BebidaRepository.js:9`) | `()` | `Array<{ id, codigo, nombre }` del catálogo `BEBIDAS`, activos, `ORDER BY ci.nombre` | Ninguno propio | `BebidaJaulaScreen.js:55-62`; igual que alimentos |
| `registrarBebida` (`BebidaRepository.js:37`) | `({ jaulaId, fecha, tipo, cantidad, detalle })` | `undefined` | Igual que `registrarAlimentacion` | `BebidaJaulaScreen.js:82-93`. Sin `try/catch` |
| `registrarSanidadJaula` (`SanidadJaulaRepository.js:7`) | `({ jaulaId, fecha, tipo, detalle })` | `undefined` | FK de `sanidad_jaula.jaula_id` si la jaula no existe (falla en el primer `INSERT`, antes del `UPDATE`) | `SanidadJaulaScreen.js:64-128`. Con `try/catch`: `console.error` y `Alert.alert('Error', 'No fue posible guardar el registro sanitario.')` (l.108-123) |
| `registrarHistorialJaula` (`HistorialRepository.js:4`) | `({ jaulaId, aveId = null, tipoEvento, fecha, detalle, db = null })` | `undefined`; usa `db` recibido o abre uno nuevo (`db \|\| await getDatabase()`, l.13-14) | FK de `jaula_id` y de `ave_id` | Solo desde repositorios; dentro de la transacción de cada registro |
| `normalizarEstado` (`SanidadJaulaRepository.js:62`) | `(tipo)` (privada, no exportada) | `'NORMAL'`, `'LIMPIEZA'`, `'FUMIGACION'`, `'QUEMADURA'` o `'CUARENTENA'` | Ninguno | Solo `registrarSanidadJaula` (l.46) |

Mensajes de la pantalla tras éxito: `Alimentación registrada` / `El registro fue guardado correctamente.` con botón `Aceptar` que hace `navigation.goBack()` (`AlimentacionJaulaScreen.js:96-106`); `Bebida registrada` / `El registro fue guardado correctamente.` (`BebidaJaulaScreen.js:97-107`); `Sanidad registrada` / `La jaula quedó en estado ${tipo}.` (usa el texto de pantalla, p. ej. `La jaula quedó en estado Fumigación.`; `SanidadJaulaScreen.js:88-104`).

## Validaciones en pantalla

Reglas que viven solo en la UI (los repositorios no validan nada). La columna "Código V2" propone el error del servidor; los mensajes de V1 se conservan en `message`.

| Regla | Mensaje exacto | Archivo:línea | Código de error V2 propuesto |
|---|---|---|---|
| Alimentación: tipo obligatorio (hay que seleccionar un ítem) | título `Seleccione alimento`, texto `Debe seleccionar un tipo de alimento.` | `AlimentacionJaulaScreen.js:68-77` | `VALIDATION_ERROR` |
| Bebida: tipo obligatorio | título `Seleccione bebida`, texto `Debe seleccionar un tipo de bebida.` | `BebidaJaulaScreen.js:69-78` | `VALIDATION_ERROR` |
| Alimentación/bebida: el tipo solo puede ser un ítem del catálogo activo (la lista solo ofrece ítems con `activo = 1`; el repositorio acepta cualquier texto) | (sin mensaje) | `AlimentacionRepository.js:25-28`, `BebidaRepository.js:26-29`; `AlimentacionJaulaScreen.js:121-158` | `VALIDATION_ERROR` (propuesta D-CUI-07) |
| Alimentación/bebida: el valor guardado es `nombre` del ítem (no `codigo`) | (sin mensaje) | `AlimentacionJaulaScreen.js:89-90`; `BebidaJaulaScreen.js:90-91` | Ver DP-CUI-02 |
| Sanidad: `tipo` solo puede ser uno de `Normal`, `Limpieza`, `Fumigación`, `Quemadura`, `Cuarentena` (por los botones; el repositorio mapea cualquier otro a `NORMAL`); valor inicial `Normal` | (sin mensaje) | `SanidadJaulaScreen.js:27-33, 49-52, 177-229`; `SanidadJaulaRepository.js:81-82` | `VALIDATION_ERROR` (propuesta D-CUI-07) |
| Sanidad: `detalle` se envía con `trim()`; vacío -> `NULL` y sin sufijo en el historial | (sin mensaje) | `SanidadJaulaScreen.js:81-82`; `SanidadJaulaRepository.js:33, 55` | Lo aplica el servidor (el repositorio V1 no recorta) |
| Alimentación/bebida: `cantidad` y `detalle`, texto libre; vacío o falsy -> `NULL`; **sin campo en la pantalla**, sin longitud máxima | (sin mensaje) | `AlimentacionRepository.js:67-68`; `BebidaRepository.js:68-69` | `VALIDATION_ERROR` solo si se decide límite (DP-CUI-03) |
| `fecha`: la genera la pantalla con `new Date().toISOString()` (instante UTC); el repositorio no la valida | (sin mensaje) | `AlimentacionJaulaScreen.js:85-87`; `BebidaJaulaScreen.js:86-88`; `SanidadJaulaScreen.js:75-77` | `VALIDATION_ERROR` si es futura o inválida (propuesta D-CUI-06) |
| La jaula debe existir y estar activa (solo se abren desde jaulas activas; el repositorio solo falla por FK si no existe) | (sin mensaje) | `DetalleJaulaScreen.js:1291-1363`; `JaulasScreen.js:319-324`; `AlertasRepository.js:135-154` | `JAULA_NOT_FOUND` (404) / `JAULA_NOT_ACTIVE` (400) (propuesta D-CUI-05) |
| Error al guardar sanidad | título `Error`, texto `No fue posible guardar el registro sanitario.` | `SanidadJaulaScreen.js:116-122` | `INTERNAL_ERROR` |
| Error al guardar alimentación/bebida | **sin manejo** (promesa rechazada, sin alerta; la pantalla no navega) | `AlimentacionJaulaScreen.js:81-92`; `BebidaJaulaScreen.js:82-93` | `INTERNAL_ERROR` (la app V2 mostrará su estado de error de red/servidor) |
| Éxito | `Alimentación registrada` / `Bebida registrada` / `Sanidad registrada` y textos de la sección anterior | l.96-106 / 97-107 / 88-104 | Solo UI |

## Paridad con V1

Estado inicial de referencia: criadero nuevo en V2 con la plantilla de catálogos de 42 ítems y una jaula activa en estado `NORMAL`, sin registros. Los casos que dependen de V2 más estricto están marcados "(diferencia)".

| ID | Dado | Cuando | Entonces | Evidencia V1 |
|---|---|---|---|---|
| PAR-CUI-001 | Criadero nuevo | Se listan los tipos de alimento | `Balanceado`, `Morichillo` (orden por `nombre`); cada ítem con `id`, `codigo`, `nombre`. V1 devuelve lista vacía; V2 la puebla por D-CAT-03 (diferencia aprobada) | `AlimentacionRepository.js:8-32`; `seeders.js:93-106`; `catalogos.md` PAR-CAT-005 |
| PAR-CUI-002 | Criadero nuevo | Se listan los tipos de bebida | `Agua`, `Agua con vitamina` (orden por `nombre`) (diferencia aprobada) | `BebidaRepository.js:9-33` |
| PAR-CUI-003 | Ítem de ALIMENTOS desactivado | Se listan tipos | No aparece (`activo = 1`) | `AlimentacionRepository.js:26` |
| PAR-CUI-004 | Jaula activa | Se registra alimentación con tipo `Balanceado` | Se inserta 1 fila en `alimentacion_jaula` con `tipo = 'Balanceado'`, `cantidad = null`, `detalle = null`, `fecha` = instante ISO UTC; 1 evento `ALIMENTACION` con detalle `Alimentación: Balanceado`, `ave_id` null; la jaula no cambia (ni `estado_sanitario` ni fecha de actualización). Todo en una operación atómica | `AlimentacionRepository.js:48-89`; `HistorialRepository.js:17-36` |
| PAR-CUI-005 | Jaula activa | Se registra bebida con tipo `Agua con vitamina` | 1 fila en `bebida_jaula` y evento `BEBIDA` con detalle `Bebida: Agua con vitamina` | `BebidaRepository.js:49-90` |
| PAR-CUI-006 | Alimentación registrada con `Morichillo`; el ítem se renombra o desactiva | Se consulta el registro | Conserva el texto `Morichillo` (sin FK al ítem) | `AlimentacionJaulaScreen.js:89-90`; `catalogos.md` (tabla de consumo) |
| PAR-CUI-007 | Catálogo ALIMENTOS sin ítems activos | Se abre la pantalla y se guarda sin seleccionar | La pantalla no muestra opciones ni mensaje de lista vacía; al guardar: `Seleccione alimento` / `Debe seleccionar un tipo de alimento.` (V2: `VALIDATION_ERROR`) | `AlimentacionJaulaScreen.js:68-77, 121-158`; `catalogos.md` PAR-CAT-019 |
| PAR-CUI-008 | Catálogo BEBIDAS sin ítems activos | Ídem | `Seleccione bebida` / `Debe seleccionar un tipo de bebida.` | `BebidaJaulaScreen.js:69-78, 122-159` |
| PAR-CUI-009 | Jaula activa | Se envía alimentación sin `tipo` | Rechazo sin escribir nada: `VALIDATION_ERROR` con mensaje `Debe seleccionar un tipo de alimento.` | `AlimentacionJaulaScreen.js:68-77` |
| PAR-CUI-010 | Jaula activa | Se envía bebida sin `tipo` | Rechazo `VALIDATION_ERROR` con mensaje `Debe seleccionar un tipo de bebida.` | `BebidaJaulaScreen.js:69-78` |
| PAR-CUI-011 | Alimentación con `cantidad = ''` o `detalle = ''` | Se registra | `cantidad` y `detalle` se guardan `null` (falsy -> `NULL`) | `AlimentacionRepository.js:67-68` |
| PAR-CUI-012 | Alimentación con `cantidad = '2 kg'` y `detalle = 'Mañana'` (el repositorio los admite; la UI V1 no los envía) | Se registra | Se guardan tal cual; el evento de historial **no** incluye cantidad ni detalle (`Alimentación: {tipo}`) | `AlimentacionRepository.js:63-69, 81-82` |
| PAR-CUI-013 | Jaula `NORMAL` | Sanidad con tipo `Limpieza` y sin detalle | `estado_sanitario = 'LIMPIEZA'`; fila en `sanidad_jaula` con `tipo = 'Limpieza'`, `detalle = null`; evento `SANIDAD` con detalle `Sanidad: Limpieza`; `fecha_actualizacion` de la jaula se actualiza | `SanidadJaulaRepository.js:16-59` |
| PAR-CUI-014 | Jaula `NORMAL` | Sanidad `Fumigación` con detalle `Se aplicó producto` | `estado_sanitario = 'FUMIGACION'`; `sanidad_jaula.tipo = 'Fumigación'`; evento `SANIDAD` con detalle `Sanidad: Fumigación \| Se aplicó producto` | `SanidadJaulaRepository.js:55, 72-73` |
| PAR-CUI-015 | Jaula activa | Sanidad con detalle `'   '` | Se guarda `detalle = null` y el evento es `Sanidad: {tipo}` sin ` \| ` (el servidor recorta; en V1 recorta la pantalla) | `SanidadJaulaScreen.js:81-82`; `SanidadJaulaRepository.js:33, 55` |
| PAR-CUI-016 | Jaula en cualquier estado | Sanidad con cada uno de los 5 tipos | Estados resultantes: `NORMAL`, `LIMPIEZA`, `FUMIGACION`, `QUEMADURA`, `CUARENTENA` según la tabla de transiciones | `SanidadJaulaRepository.js:62-84` |
| PAR-CUI-017 | Jaula en `CUARENTENA` | Sanidad `Normal` | Pasa a `NORMAL` (sin restricciones de transición); lo mismo desde cualquier estado hacia cualquier estado | `SanidadJaulaRepository.js:37-49` (el `UPDATE` no depende del estado previo) |
| PAR-CUI-018 | Jaula en `LIMPIEZA` | Sanidad `Limpieza` otra vez | Estado igual; se inserta otra fila de `sanidad_jaula`, otro evento `SANIDAD` y se actualiza `fecha_actualizacion` | `SanidadJaulaRepository.js:18-57` |
| PAR-CUI-019 | Solo desde el repositorio V1 (la UI no lo permite) | Sanidad con `tipo = 'FUMIGACION'` o `'cuarentena'` | V1: `sanidad_jaula.tipo` guarda el texto crudo y la jaula queda en `NORMAL`. **V2 rechaza (diferencia D-CUI-07, propuesta): `VALIDATION_ERROR`** | `SanidadJaulaRepository.js:81-82` |
| PAR-CUI-020 | Jaula recién creada | Se consulta la jaula | `estado_sanitario = 'NORMAL'` | `JaulaRepository.js:177`; `migrations.js:35` |
| PAR-CUI-021 | Jaula activa | Se registran dos alimentaciones el mismo día | Ambas se guardan (sin unicidad), con dos eventos de historial | `migrations.js:157-175` (sin UNIQUE); hallazgo 9 |
| PAR-CUI-022 | Jaula con registros de alimentación | Se listan registros de la jaula | `fecha` descendente; campos `id, jaula_id, fecha, tipo, cantidad, detalle, fecha_creacion` (V1 no usa esta función, hallazgo 2) | `AlimentacionRepository.js:95-117` |
| PAR-CUI-023 | Jaula activa sin registros hoy | Se calculan alertas | Alerta `Sin alimentación registrada` y `Sin bebida registrada` (nivel `MEDIO`); registrar alimentación/bebida hoy las quita. "Hoy" en V1 es la fecha UTC (módulo de alertas, DP-CUI-11) | `AlertasRepository.js:170-348` |
| PAR-CUI-024 | Jaula con estado `CUARENTENA` | Se calculan alertas/dashboard | No hay alerta ni indicador por estado sanitario (solo color/etiqueta en tarjeta y detalle de jaula) | `AlertasRepository.js`; `DashboardRepository.js:157-185`; `JaulaCard.js:31-46`; hallazgo 3 |
| PAR-CUI-025 | `jaulaId` que no existe | Se registra cualquier cuidado | V1: error de SQLite por FK, sin escritura. V2: `JAULA_NOT_FOUND` 404 (diferencia D-CUI-05, propuesta) | `migrations.js:172-174, 193-195, 212-214`; `sqlite.js:63` |
| PAR-CUI-026 | Jaula inactiva | Se registra cualquier cuidado | V1: el repositorio lo acepta (la UI no lo ofrece). V2: `JAULA_NOT_ACTIVE` 400 (propuesta D-CUI-05) | hallazgo 8 |
| PAR-CUI-027 | Fallo del servidor al guardar sanidad | Se guarda | Mensaje `Error` / `No fue posible guardar el registro sanitario.`; no queda ningún registro parcial (transacción) | `SanidadJaulaScreen.js:108-123` |
| PAR-CUI-028 | Fallo a mitad de la operación (p. ej. al insertar el evento) | Se registra alimentación, bebida o sanidad | No queda ni el registro, ni el cambio de estado, ni el evento (atomicidad); en D1 se logra con `batch` | `AlimentacionRepository.js:48-89`; `SanidadJaulaRepository.js:16-59` |
| PAR-CUI-029 | Jaula de otro criadero o de otro usuario | Se registra o lista cualquier cuidado | `FORBIDDEN` / `JAULA_NOT_FOUND`; sin equivalente en V1 (base local única); requisito V2 | CLAUDE.md "Multi-tenancy" |
| PAR-CUI-030 | `fecha` posterior al momento actual | Se registra cualquier cuidado | V1 la acepta (el repositorio no valida). V2: `VALIDATION_ERROR` (propuesta D-CUI-06) | hallazgo 8; `AlimentacionRepository.js:63-69` |

## Diferencias deliberadas

| ID | Diferencia | Motivo | Estado |
|---|---|---|---|
| D-CUI-01 | V2 requiere conexión | Decisión de arquitectura online-first | aprobada por el usuario (ya aceptada) |
| D-CUI-02 | Las pantallas necesitan estados de carga y de error de red | Consecuencia de D-CUI-01 | aprobada por el usuario (ya aceptada) |
| D-CUI-03 | ALIMENTOS y BEBIDAS salen con 2 ítems cada uno (V1: vacíos): `MORICHILLO`, `BALANCEADO`; `AGUA`, `AGUA_VITAMINA` | Decisión del usuario (`catalogos.md` D-CAT-03) | aprobada por el usuario (2026-10-29) |
| D-CUI-04 | IDs UUID v7 (V1: enteros autoincrementales); fechas de negocio `YYYY-MM-DD`, marcas de tiempo ISO UTC y zona `America/Guayaquil`; soft delete y `version` según convención V2 donde corresponda | Convención V2 | aprobada por el usuario (2026-10-29) en principio; la aplicación a estas tablas (columnas de eventos inmutables) sigue como propuesta, ver DP-CUI-05 |
| D-CUI-05 | El servidor valida que la jaula exista en el criadero (`JAULA_NOT_FOUND` 404) y esté activa (`JAULA_NOT_ACTIVE` 400) antes de escribir. V1: solo FK en el repositorio y la UI solo ofrece jaulas activas | Servidor más estricto donde V1 dependía solo de la pantalla; patrón de `aves.md` (R-P9). El principio está aprobado; su aplicación a cuidados es propuesta | propuesta |
| D-CUI-06 | `fecha` no puede ser futura (`VALIDATION_ERROR`); si el cliente no la envía, el servidor usa la hora actual UTC. V1: la pantalla siempre envía `new Date().toISOString()` y el repositorio no valida | Fechas futuras -> `VALIDATION_ERROR` (principio aprobado, `aves.md` R-P13); detalles (tolerancia de reloj, quién fija la fecha) en DP-CUI-04 | propuesta |
| D-CUI-07 | El servidor valida `tipo`: alimentación y bebida contra los ítems activos del catálogo del criadero (por `nombre`, como V1); sanidad contra los 5 valores. V1: el repositorio acepta cualquier texto (sanidad lo mapea a `NORMAL` pero guarda el texto) | Servidor más estricto donde V1 dependía solo de la pantalla; patrón de `aves.md` (R-P2) | propuesta |
| D-CUI-08 | El servidor recorta (`trim`) `detalle`, `cantidad` y `tipo` y convierte vacío a `null`; opcionalmente impone longitudes máximas (DP-CUI-03). V1: recorta solo la pantalla de sanidad; alimentación/bebida no tienen campos | Paridad con el resultado de V1 sin depender del cliente | propuesta |
| D-CUI-09 | Las respuestas de los `POST` devuelven el registro creado (V1 devuelve `undefined`), y el de sanidad también el estado resultante de la jaula | La API necesita confirmar el resultado; la app necesita el estado para refrescar | propuesta |
| D-CUI-10 | FK reales con `ON DELETE RESTRICT` (V1: `ON DELETE CASCADE` desde `jaulas`) | V2 no borra jaulas físicamente (baja por `activa`/soft delete); coherente con `aves.md` R-P10 | propuesta |
| D-CUI-11 | `jaulas.estado_sanitario` con `CHECK` de los cinco códigos (V1: sin `CHECK`) | Impide valores no mapeados; la columna la crea la migración de jaulas | propuesta (pendiente de la spec de jaulas) |
| D-CUI-12 | Se añaden `GET /jaulas/:jaulaId/alimentacion` (V1: función sin uso) y, si se aprueba, `GET` de bebida y sanidad (V1: inexistentes) | El análisis V1 mapea `obtenerAlimentacionJaula`; ver DP-CUI-09 | propuesta |

## Decisiones aprobadas por el usuario (2026-10-29)

Aprobadas para el proyecto el 2026-10-29. Esta spec las respeta; las aplicaciones concretas a cuidados que no figuran aquí siguen como "propuesta" en "Diferencias deliberadas".

| ID | Decisión | Estado |
|---|---|---|
| A-CUI-01 | Orden de migraciones: `0005` = **solo jaulas**; `0006` = aves, `ave_evolucion`, `ave_historial` y `jaula_historial`. Las tablas de cuidados (`alimentacion_jaula`, `bebida_jaula`, `sanidad_jaula`) dependen de `jaulas` y de `jaula_historial` (porque `registrarHistorialJaula` escribe en `jaula_historial`), así que se proponen **después** de `0006` (número exacto, p. ej. `0007`, regla abierta DP-CUI-10). No se incluyen en `0005` ni en `0006`. | aprobada por el usuario, 2026-10-29 |
| A-CUI-02 | Catálogos: ALIMENTOS = `MORICHILLO` (Morichillo), `BALANCEADO` (Balanceado); BEBIDAS = `AGUA` (Agua), `AGUA_VITAMINA` (Agua con vitamina). La plantilla pasa de 38 a 42 ítems (aún no implementado). Los ítems pertenecen al criadero; cada usuario puede crear, editar y desactivar los suyos. Coherente con `catalogos.md` D-CAT-03 y DP-CAT-02. | aprobada por el usuario, 2026-10-29 |
| A-CUI-03 | Fechas de negocio `YYYY-MM-DD` y marcas de tiempo ISO UTC; zona `America/Guayaquil`. IDs UUID v7; soft delete y `version` según convención V2 (diferencias deliberadas "propuesta" respecto a V1). | aprobada por el usuario, 2026-10-29 |
| A-CUI-04 | Servidor más estricto donde V1 dependía solo de la pantalla: validar que la jaula exista, pertenezca al criadero y esté activa (`JAULA_NOT_FOUND` 404, `JAULA_NOT_ACTIVE` 400, como en la spec de aves); fechas futuras -> `VALIDATION_ERROR`. Se anotan como diferencias deliberadas "propuesta" (D-CUI-05, D-CUI-06) cuando V1 no las aplica. | criterio general aprobado por el usuario (2026-10-29); los códigos y HTTP concretos (`JAULA_NOT_FOUND` 404, `JAULA_NOT_ACTIVE` 400, patrón de `ITEM_NOT_ACTIVE`) los decidió Claude por ese criterio y el usuario los revisa |

## Endpoints V2

Propuesta; no hay endpoints de jaulas ni de cuidados implementados hoy en `api/` (CLAUDE.md: módulos de negocio pendientes). Todos bajo `/api/v1/criaderos/:criaderoId`, con JWT; el `userId` sale del token, nunca del body. Ownership: `criaderos.id = ? AND user_id = ? AND deleted_at IS NULL`; si no es propietario, `403 FORBIDDEN`; si el criadero no existe, `CRIADERO_NOT_FOUND`. La `jaulaId` debe pertenecer al `criaderoId` (si no: `JAULA_NOT_FOUND`) y estar activa para escribir (`JAULA_NOT_ACTIVE`). Éxito `{ "success": true, "data": … }`; error `{ "success": false, "error": "CODIGO", "message": "…" }`. Campos en camelCase. Estilo actual: 400 para `VALIDATION_ERROR`, 404 no encontrado, 409 conflictos de concurrencia.

Orden de comprobaciones propuesto: autenticación, ownership del criadero, forma del body (`VALIDATION_ERROR`), existencia de la jaula (`JAULA_NOT_FOUND`), jaula activa (`JAULA_NOT_ACTIVE`), pertenencia del `tipo` al catálogo (`VALIDATION_ERROR`), escritura atómica.

Los tipos de alimento y bebida se listan con el endpoint de catálogos de `catalogos.md`: `GET /catalogos/ALIMENTOS/items` y `GET /catalogos/BEBIDAS/items` (equivalen a `obtenerTiposAlimentos` / `obtenerTiposBebidas`; el mapeo V1 usa la misma ruta, análisis l.898, 906). Detalle de orden y filtro en RC-CUI-05. No se redefinen aquí.

### POST `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/alimentacion`

- Equivale a `registrarAlimentacion`. Request: `{ tipo, cantidad?, detalle?, fecha? }`.
  - `tipo`: obligatorio, `nombre` de un ítem activo de `ALIMENTOS` del criadero (texto, como V1). Ausente o vacío: `VALIDATION_ERROR`, `message` `Debe seleccionar un tipo de alimento.`
  - `cantidad`, `detalle`: opcionales; texto libre, recortados, vacío -> `null`.
  - `fecha`: opcional, instante ISO UTC no futuro; si falta, el servidor usa la hora actual (D-CUI-06, DP-CUI-04).
- Efectos (una sola operación atómica, `db.batch`): inserta en `alimentacion_jaula`; inserta en `jaula_historial` `tipo_evento = 'ALIMENTACION'`, `detalle = 'Alimentación: {tipo}'`, `fecha` igual a la del registro, `ave_id = null`. No modifica `jaulas`.
- Respuesta 201 `{ success: true, data: { registro: { id, jaulaId, fecha, tipo, cantidad, detalle, createdAt } } }`.
- Errores: `VALIDATION_ERROR` 400, `JAULA_NOT_FOUND` 404, `JAULA_NOT_ACTIVE` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `CRIADERO_NOT_FOUND` 404, `INTERNAL_ERROR` 500.

### GET `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/alimentacion`

- Equivale a `obtenerAlimentacionJaula` (sin uso en V1, hallazgo 2). `data.registros[]` con los campos anteriores, orden `fecha` descendente y, como desempate (propuesta; V1 no lo define), `id` descendente (UUID v7 ordenable por tiempo). Sin paginación definida (DP-CUI-09).
- Errores: `JAULA_NOT_FOUND` 404, 401, 403, `CRIADERO_NOT_FOUND`. Una jaula inactiva se puede consultar (lectura).

### POST `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/bebida`

- Equivale a `registrarBebida`; idéntico al de alimentación con la tabla `bebida_jaula`, catálogo `BEBIDAS`, `tipo_evento = 'BEBIDA'`, detalle `'Bebida: {tipo}'` y mensaje de validación `Debe seleccionar un tipo de bebida.`. Respuesta 201 `{ success: true, data: { registro } }`.

### POST `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/sanidad`

- Equivale a `registrarSanidadJaula`. Request: `{ tipo, detalle?, fecha? }`.
  - `tipo`: obligatorio; uno de `Normal`, `Limpieza`, `Fumigación`, `Quemadura`, `Cuarentena` (los textos de V1, que son los guardados en `sanidad_jaula.tipo`; alternativa de códigos en DP-CUI-01). Otro valor: `VALIDATION_ERROR`.
  - `detalle`: opcional, recortado, vacío -> `null`.
  - `fecha`: como en alimentación.
- Efectos (una sola operación atómica, `db.batch`): (1) inserta en `sanidad_jaula` con `tipo` recibido; (2) `UPDATE jaulas SET estado_sanitario = {normalizarEstado(tipo)}, updated_at = {ahora}, version = version + 1` de esa jaula y criadero; (3) inserta `jaula_historial` `tipo_evento = 'SANIDAD'`, `detalle = 'Sanidad: {tipo}'` o `'Sanidad: {tipo} | {detalle}'`, `ave_id = null`. Sin restricciones de transición (paridad, DP-CUI-06). La exigencia de `version` del cliente sobre la jaula queda en DP-CUI-08.
- Respuesta 201 `{ success: true, data: { registro: { id, jaulaId, fecha, tipo, detalle, createdAt }, jaula: { id, estadoSanitario, version } } }`.
- Errores: `VALIDATION_ERROR` 400, `JAULA_NOT_FOUND` 404, `JAULA_NOT_ACTIVE` 400, 401, 403, `CRIADERO_NOT_FOUND`, `INTERNAL_ERROR` 500.

### Equivalencia de errores V1 -> V2

| V1 | V2 | HTTP |
|---|---|---|
| (pantalla) `Seleccione alimento` / `Debe seleccionar un tipo de alimento.` | `VALIDATION_ERROR` con ese mensaje | 400 |
| (pantalla) `Seleccione bebida` / `Debe seleccionar un tipo de bebida.` | `VALIDATION_ERROR` con ese mensaje | 400 |
| error de FK por jaula inexistente | `JAULA_NOT_FOUND` | 404 |
| jaula inactiva (V1 la acepta; nuevo) | `JAULA_NOT_ACTIVE` (propuesta) | 400 |
| `tipo` de sanidad no reconocido (V1: `NORMAL`) | `VALIDATION_ERROR` | 400 |
| `Error` / `No fue posible guardar el registro sanitario.` | `INTERNAL_ERROR` | 500 |

Los repositorios V1 no lanzan códigos de error propios (no hay `throw`), así que no hay cadenas V1 que conservar más allá de los mensajes de las pantallas.

## Modelo D1

PROPUESTA derivada del código V1. Las migraciones **aún no se crean**. Dependencias (A-CUI-01): `jaulas` en `0005`, `jaula_historial` en `0006`; estas tablas de cuidados van después de `0006` (número exacto en DP-CUI-10, p. ej. `api/migrations/0007_cuidados_jaula.sql`). Estado actual en D1 (`0001`-`0004`): no existen `jaulas`, historiales ni tablas de cuidados.

Convenciones: `id TEXT` UUID v7 generado por el servicio, `criadero_id TEXT NOT NULL` (FK `criaderos(id)`), snake_case, `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`. Las tres tablas son **eventos inmutables**: V1 no edita ni elimina registros de alimentación, bebida ni sanidad (no existen `UPDATE`/`DELETE` sobre ellas, búsqueda sin límite en `src/`; solo `INSERT`). Por eso se propone **no** incluir `updated_at`, `version` ni `deleted_at` (se confirma o corrige en DP-CUI-05).

### Tabla `alimentacion_jaula` (propuesta)

| Columna | Tipo | Regla | Origen V1 |
|---|---|---|---|
| id | TEXT PK NOT NULL | UUID v7 | `id` INTEGER |
| criadero_id | TEXT NOT NULL | FK criaderos(id) `ON DELETE RESTRICT` | nuevo |
| jaula_id | TEXT NOT NULL | FK jaulas(id) `ON DELETE RESTRICT` (V1: `CASCADE`, D-CUI-10); el servicio valida que la jaula sea del mismo criadero | `jaula_id` |
| fecha | TEXT NOT NULL | instante ISO UTC | `fecha` (ISO de la pantalla) |
| tipo | TEXT NOT NULL | texto = `nombre` del ítem de `ALIMENTOS` (no FK, DP-CUI-02); validado en el servicio | `tipo` |
| cantidad | TEXT | texto libre, recortado; sin tipo numérico (V1 es `TEXT`) | `cantidad` |
| detalle | TEXT | texto libre | `detalle` |
| created_at | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | | `fecha_creacion` |

Índices propuestos: `ix_alimentacion_jaula_jaula_fecha (criadero_id, jaula_id, fecha)` (listado por jaula, orden descendente); `ix_alimentacion_jaula_criadero_fecha (criadero_id, fecha)` (alertas "hoy" por criadero, V1 `AlertasRepository.js:170-197`).

### Tabla `bebida_jaula` (propuesta)

Mismas columnas e índices (`ix_bebida_jaula_jaula_fecha`, `ix_bebida_jaula_criadero_fecha`); `tipo` = `nombre` del ítem de `BEBIDAS`. Origen V1: `migrations.js:178-196`.

### Tabla `sanidad_jaula` (propuesta)

| Columna | Tipo | Regla | Origen V1 |
|---|---|---|---|
| id | TEXT PK NOT NULL | UUID v7 | `id` INTEGER |
| criadero_id | TEXT NOT NULL | FK criaderos(id) `ON DELETE RESTRICT` | nuevo |
| jaula_id | TEXT NOT NULL | FK jaulas(id) `ON DELETE RESTRICT` | `jaula_id` |
| fecha | TEXT NOT NULL | instante ISO UTC | `fecha` |
| tipo | TEXT NOT NULL | texto de V1 (`Normal`, `Limpieza`, `Fumigación`, `Quemadura`, `Cuarentena`); `CHECK (tipo IN (...))` opcional (por definir, DP-CUI-01) | `tipo` |
| detalle | TEXT | texto libre | `detalle` |
| created_at | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | | `fecha_creacion` |

Índice propuesto: `ix_sanidad_jaula_jaula_fecha (criadero_id, jaula_id, fecha)`. V1 no tiene índice sobre estas tablas (solo `idx_jaula_historial_jaula`, `migrations.js:352-353`).

### Columna `jaulas.estado_sanitario` (propiedad de la migración de jaulas)

`estado_sanitario TEXT NOT NULL DEFAULT 'NORMAL' CHECK (estado_sanitario IN ('NORMAL','LIMPIEZA','FUMIGACION','QUEMADURA','CUARENTENA'))`. V1: `NOT NULL DEFAULT 'NORMAL'` sin `CHECK` (`migrations.js:35`). Esta spec solo la **requiere**; el DDL de `jaulas` se define en la spec de jaulas (`0005`). `registrarSanidadJaula` también actualiza `updated_at` (V1 `fecha_actualizacion`) y, por convención V2, `version`.

### `jaula_historial` (no se define aquí)

Esta spec escribe en `jaula_historial` (columnas `jaula_id`, `ave_id`, `tipo_evento`, `fecha`, `detalle`; `0006`). Debe aceptar `tipo_evento` `ALIMENTACION`, `BEBIDA` y `SANIDAD` además de `INGRESO_AVE` y `SALIDA_AVE`; si la tabla propuesta lleva un `CHECK` sobre `tipo_evento`, debe incluirlos. `criadero_id` también.

### Atomicidad

Alimentación y bebida: `db.batch([INSERT registro, INSERT jaula_historial])`. Sanidad: `db.batch([INSERT registro, UPDATE jaulas, INSERT jaula_historial])`. Los UUID se generan en el servicio antes del `batch`, así que no se necesita el `id` autogenerado. Para que el `UPDATE` de sanidad no afecte a una jaula desactivada en paralelo, la sentencia debe incluir la condición de jaula activa y de `criadero_id` (según la representación de "activa" de la spec de jaulas); si no afecta filas, el servicio debe tratarlo como `JAULA_NOT_ACTIVE`/`JAULA_NOT_FOUND` (detalle de implementación, por confirmar).

V2 empieza sin datos de usuario: no hay importación ni mapeo de IDs V1 -> UUID.

## Reglas abiertas

### Resolubles leyendo código

- **RC-CUI-01 (cerrada 2026-10-29, verificada con git).** Entre v1.0.0 (`4a8cc6c`) y v1.0.3 (`248ced2`) `SanidadJaulaRepository.js` solo cambió de formato (transacción reescrita sin cambio de efectos) y `normalizarEstado` ganó `case 'Normal': return 'NORMAL'`, redundante porque el `default` de v1.0.0 ya devolvía `'NORMAL'`. Las funciones exportadas son las mismas (`registrarSanidadJaula`, `normalizarEstado` privada). No se perdió ninguna función.
- **RC-CUI-02 (abierta).** Confirmar en dispositivo (o con la base de V1) que registrar con `jaulaId` inexistente falla por FK (deducido de `PRAGMA foreign_keys = ON`, `sqlite.js:63`, no probado) y qué mensaje ve el usuario (alimentación/bebida: ninguno; sanidad: `No fue posible guardar el registro sanitario.`).
- **RC-CUI-03 (abierta).** `HistorialJaulaScreen.js` muestra `tipo_evento` y `detalle` en bruto (l.87-101). Verificar qué función de lectura usa (`obtenerHistorialJaula` o `obtenerHistorialCompletoJaula`) y si algún otro lugar interpreta los valores `ALIMENTACION`/`BEBIDA`/`SANIDAD`. Búsqueda de esas cadenas en `src/` solo las muestra en los tres repositorios. Pertenece a la spec de jaulas (historial); aquí se deja como dependencia.
- **RC-CUI-04 (abierta).** Qué hace V1 con el backup de estas tablas: `BackupRepository.js:390-420, 440-458` enumera las tablas desde `sqlite_master`, no por nombre. No se leyó completo; sin relevancia para V2 (sin backup/offline), solo para confirmar que no hay lógica específica de estas tablas.
- **RC-CUI-05 (abierta).** Orden de la lista de tipos: V1 usa `ORDER BY ci.nombre` (`AlimentacionRepository.js:28`, `BebidaRepository.js:29`), mientras que el endpoint de catálogos propuesto en `catalogos.md` ordena por `orden, nombre` (RC-CAT-05: `orden` de los 4 ítems nuevos y de los creados por usuario aún sin decidir). Para paridad, la app de V2 debe ordenar estas dos listas por `nombre` o el endpoint ofrecer ese orden.
- **RC-CUI-06 (abierta).** `AlertasRepository.js:186, 280` compara `date(fecha) = date('now')` en UTC; no se verificó si `Dashboard`/`Inicio` muestran los mismos conteos con otro criterio (`DashboardRepository.js:199` usa `date('now')` solo para huevos). Se decide en la spec de alertas (ver DP-CUI-11).
- **RC-CUI-07 (cerrada, 2026-10-29).** ¿Alguien llama a `obtenerAlimentacionJaula`? No: solo existe la definición (búsqueda sin límite en `src/`). Ver hallazgo 2.
- **RC-CUI-08 (cerrada, 2026-10-29).** ¿Las pantallas de alimentación/bebida envían `cantidad` y `detalle`? No (llamadores únicos `AlimentacionJaulaScreen.js:81-92`, `BebidaJaulaScreen.js:82-93`). Ver hallazgo 1.
- **RC-CUI-09 (cerrada, 2026-10-29).** ¿Alertas, dashboard o reportes dependen de `estado_sanitario`? Solo el reporte lo exporta (`ReportesRepository.js:281`); alertas y dashboard no lo leen. Ver hallazgo 3.
- **RC-CUI-10 (cerrada, 2026-10-29).** ¿Hay restricciones de transición o valores por defecto no mapeados en `normalizarEstado`? No hay restricciones; todo valor no mapeado da `NORMAL`. Ver sección e.

### Decisión de producto

- **DP-CUI-01 Contrato del `tipo` de sanidad.** V1 envía el texto de pantalla (`Fumigación`) y lo guarda tal cual en `sanidad_jaula.tipo` junto al código en `jaulas.estado_sanitario`. Opciones: (a) la API acepta los textos de V1 (propuesta, paridad con lo guardado, igual que raza/sexo en aves); (b) la API acepta códigos (`FUMIGACION`) y el texto se deriva en la app. Pendiente además si `sanidad_jaula.tipo` lleva `CHECK`.
- **DP-CUI-02 Valor guardado de alimento y bebida.** V1 guarda el `nombre` del ítem (sin FK). Propuesta: mismo criterio (texto = nombre del ítem activo del criadero, validado en el servidor; comparación exacta). Alternativa: guardar `item_id` o `codigo` (`catalogos.md` DP-CAT-04 deja la decisión por módulo). Si el usuario renombra un ítem, el registro histórico conserva el texto anterior (paridad).
- **DP-CUI-03 `cantidad` y `detalle` en alimentación y bebida.** La UI V1 no los envía, pero las tablas y el repositorio los admiten y el mapeo los lista. ¿Se exponen en la API? ¿Se imponen longitudes máximas? ¿`cantidad` sigue siendo texto libre o pasa a número con unidad (diferencia deliberada)? Propuesta: opcionales, texto libre, recortados, sin límite adicional hasta decidir.
- **DP-CUI-04 `fecha` del registro.** V1 la fija el cliente (`new Date().toISOString()`) y no se valida. Propuesta (D-CUI-06): opcional en el body; si falta, la fija el servidor; si viene, no puede ser futura. Pendientes: tolerancia de desfase de reloj del dispositivo, y si el cliente puede enviar fechas pasadas (V1 no ofrece selector de fecha).
- **DP-CUI-05 Columnas de las tablas de eventos inmutables.** Propuesta: sin `updated_at`, `version` ni `deleted_at` (V1 no edita ni borra). Alternativa: añadir `deleted_at` (soft delete) y `version` por convención V2. ¿Se confirma?
- **DP-CUI-06 Transiciones de sanidad.** V1 permite cualquier estado desde cualquier estado, incluido repetir el mismo (crea otro registro y otro evento). Propuesta: mantener paridad. Alternativas (diferencia deliberada): rechazar el estado repetido; exigir paso por una secuencia (p. ej. salir de `CUARENTENA` solo a `NORMAL`).
- **DP-CUI-07 HTTP de `JAULA_NOT_ACTIVE` (decidida por Claude el 2026-10-29 por criterio de paridad con servidor más estricto; el usuario la revisa).** 400, alineado con `aves.md` R-P9a (también decidida: 400, mismo patrón que `ITEM_NOT_ACTIVE` en `criaderos.routes.ts:148-153`). La corrección de la atribución: el usuario aprobó el criterio, no el código HTTP.
- **DP-CUI-08 Concurrencia de sanidad sobre la jaula.** El `UPDATE` de `jaulas` sube `version`. ¿Se exige `version` de la jaula en el request (409 `JAULA_CONCURRENCY_CONFLICT`) o el evento se aplica siempre (como V1, que no tiene concurrencia)? Propuesta: no exigirla (el último registro gana, como V1); incrementar `version` igualmente.
- **DP-CUI-09 Lecturas.** V1 no tiene lectura de bebida ni sanidad y no usa la de alimentación. ¿Se implementa solo `GET alimentacion` (mapeo del análisis), también bebida y sanidad, o ninguna hasta que exista una pantalla que las use? ¿Paginación y filtro por rango de fechas?
- **DP-CUI-10 Número y agrupación de la migración.** Propuesta: una migración `0007_cuidados_jaula.sql` con las tres tablas e índices, posterior a `0005` (jaulas) y `0006` (aves e historiales). Confirmar el número y si se agrupan o se separan por tabla.
- **DP-CUI-11 "Hoy" en alertas y zona horaria.** V1 calcula "hoy" en UTC (`date('now')`, `AlertasRepository.js:186, 280`). Con A-CUI-03 (zona `America/Guayaquil`, UTC-5) una alimentación a las 20:00 locales cuenta como del día siguiente. ¿V2 calcula "hoy" en la zona del criadero (diferencia deliberada, módulo de alertas)? Esta spec solo registra la dependencia.
- **DP-CUI-12 Doble toque e idempotencia.** V1 no protege contra duplicados (hallazgo 9). ¿Se añade clave de idempotencia o ventana anti-duplicado en el servidor, o solo se deshabilita el botón en la app?
- **DP-CUI-13 Ítems de catálogo en uso.** ¿Se bloquea desactivar o renombrar un ítem de ALIMENTOS/BEBIDAS usado en registros? V1 no bloquea nada (ver `catalogos.md` DP-CAT-03). Propuesta: no bloquear (texto histórico).

## Criterios de terminado

- [ ] Diferencias deliberadas D-CUI-05 a D-CUI-12 aprobadas o ajustadas por el usuario (D-CUI-01 a D-CUI-03 ya aprobadas; D-CUI-04 aprobada en principio); reglas abiertas RC-* cerradas y DP-CUI-* decididas; estado de la spec en `revisada`.
- [ ] Spec de jaulas redactada y migración `0005` (jaulas, con `estado_sanitario` y su `CHECK`) y `0006` (aves e historiales, `jaula_historial` con los tipos `ALIMENTACION`, `BEBIDA`, `SANIDAD`) aplicadas en local antes de implementar este módulo.
- [ ] Plantilla de catálogos con 42 ítems (ALIMENTOS: `MORICHILLO`, `BALANCEADO`; BEBIDAS: `AGUA`, `AGUA_VITAMINA`) y endpoint de ítems por catálogo disponible (`catalogos.md`).
- [ ] Migración de cuidados (`0007_cuidados_jaula.sql` u otro número decidido) con las tres tablas, FK `ON DELETE RESTRICT`, `criadero_id` e índices, aplicada en local.
- [ ] Endpoints de la sección "Endpoints V2" implementados en un módulo nuevo `api/src/` siguiendo `routes -> factory -> service -> repository`, con registro + historial (+ cambio de estado en sanidad) en un único `db.batch`.
- [ ] Ownership probado: otro usuario recibe `403 FORBIDDEN`; una jaula de otro criadero devuelve `JAULA_NOT_FOUND` y no se escribe nada.
- [ ] Validaciones de la sección "Validaciones en pantalla" aplicadas en el servidor con los mensajes de V1; `JAULA_NOT_FOUND`, `JAULA_NOT_ACTIVE`, fechas futuras y `tipo` fuera de catálogo/lista rechazados.
- [ ] Pruebas unitarias del service con fakes, HTTP con `app.request()` e integración D1 local (con confirmación previa por ser destructiva): tabla de transiciones completa (5x5), texto exacto del historial, atomicidad (fallo a mitad no deja nada), `detalle` vacío o con espacios.
- [ ] Casos PAR-CUI-001 a PAR-CUI-030 cubiertos o marcados explícitamente como diferencia deliberada.
- [ ] `npm run typecheck`, `npm test -- --run` y `npm run test:integration` sin errores; `git diff --check` limpio.
