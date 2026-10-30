# Spec: jaulas

> **Regla de paridad con V1.** V2 empieza sin datos de usuario, solo con catálogos. La V1 está probada y es el contrato: V2 reproduce exactamente lo que hace V1. Todo lo que V2 haga distinto es una **diferencia deliberada**: debe registrarse en la sección "Diferencias deliberadas" y estar aprobada por el usuario. Diferencias ya aceptadas: V2 requiere conexión y las pantallas necesitan estados de carga y de error de red.

## Estado

borrador

## Fuente V1

Alcance: jaulas del criadero, su ocupación por aves individuales (sin lotes), su baja lógica ("eliminar" = desactivar) y el historial de la jaula (`jaula_historial`). Sin sincronización offline; D1 como fuente de verdad en V2. Todo sale del código de V1 (árbol actual, `app.json` v1.0.3). Las líneas citadas son del árbol actual.

Repositorios (`src/repositories/`):

- `JaulaRepository.js` (394 líneas, leído completo): `obtenerJaulas` 3-39, `obtenerJaulasInactivas` 41-82, `obtenerAvesHistoricasJaula` 85-109, `obtenerHistorialCompletoJaula` 112-139, `obtenerJaulaPorId` 142-155, `crearJaula` 157-189, `actualizarJaula` 191-221, `desactivarJaula` 223-394.
- `HistorialRepository.js` (66 líneas, leído completo): `registrarHistorialJaula` 4-38, `obtenerHistorialJaula` 41-66.
- `AveRepository.js` (solo lo que toca jaulas): `obtenerAvesPorJaula` 62-96, `obtenerAvesParaAsignarJaula` 99-137, `obtenerJaulasActivas` 622-643, `crearAve` (jaula inicial, `jaula_actual_id` en la inserción `:788`, evento `INGRESO_AVE` `:933-964`), `cambiarJaulaAve` 1555-1716, `obtenerAves`/`obtenerAvePorId`/`obtenerHistorialAve`/`obtenerAvesVendidas`/`obtenerAvesFallecidas` (solo `LEFT JOIN jaulas`: `:45-46,163-164,1736-1737,1810-1811,1873-1874`).
- `SanidadJaulaRepository.js` (`registrarSanidadJaula` 7-60, `normalizarEstado` 62-84): **única escritura de `jaulas.estado_sanitario` después del alta** (`:39-49`); se especifica en otra spec (`cuidados-jaula.md`).
- `AlimentacionRepository.js:73-86` y `BebidaRepository.js:74-87`: escriben `jaula_historial` vía `registrarHistorialJaula` (ver hallazgo 2). Se especifican en `cuidados-jaula.md`.
- `HuevoRepository.js`: `registrarHuevo` guarda `huevos.jaula_id` y `ave_historial.jaula_id` con el valor que le pasa `RegistrarHuevoScreen.js:125-126` (`ave?.jaula_actual_id`) (`HuevoRepository.js:61-110`); `obtenerHuevosAve` (`:125-160`) y `obtenerProduccionPorJaula` (`:307-335`, `INNER JOIN jaulas`) la leen. Pertenece al módulo huevos.
- `DashboardRepository.js:157-185,450-471` (ocupación), `AlertasRepository.js:135-154,166-354` (alertas por jaula activa), `ReportesRepository.js:145-154,260-261,269-290` (`obtenerExportacionJaulas`), `EvolucionAveRepository.js:66-85,381-405` (copia `jaula_actual_id` al `ave_historial`), `CicloVidaRepository.js:49-53` y `ProduccionRepository.js:235-269` (solo lecturas con `JOIN jaulas`): solo consumen jaulas.
- `BajaAveRepository.js`: **no toca jaulas** (búsqueda `jaula`, sin distinguir mayúsculas, sin límite de resultados: 0 coincidencias). `BackupRepository.js`: 0 coincidencias de `jaula` (copia tablas de forma genérica; no se especifica aquí).

Pantallas y componentes: `src/screens/JaulasScreen.js` (lista), `NuevaJaulaScreen.js` (alta), `DetalleJaulaScreen.js` (2001 líneas; el `StyleSheet.create` empieza en `:1399`; leído `1-1399` y el final), `DetalleJaulaInactivaScreen.js`, `SeleccionarAveJaulaScreen.js`, `HistorialJaulaScreen.js`, `src/components/JaulaCard.js` (tarjeta), `src/config/constants.js:34-153` (`JAULA_SANITARY_STATUS`, estilos y etiquetas). Navegación: `src/navigation/JaulasStackNavigator.js` (rutas `ListaJaulas`, `NuevaJaula`, `DetalleJaula`, `DetalleJaulaInactiva`, `SeleccionarAveJaula`, `AlimentacionJaula`, `BebidaJaula`, `SanidadJaula`, `HistorialJaula`, `:58-155`). Las pantallas de alimentación, bebida y sanidad no pertenecen a este módulo.

Esquema (`src/database/`): `migrations.js` (`jaulas` 29-39, `jaula_historial` 109-130, `ave_historial` 133-154, `aves.jaula_actual_id` 69 y FK 83-84, índices `idx_aves_jaula` 346-347 e `idx_jaula_historial_jaula` 352-353), `migrationV6.js:6-17` (`fecha_desactivacion`). Búsqueda de `jaula` (sin distinguir mayúsculas) en `src/database/`: solo `migrations.js` y `migrationV6.js`; ninguna otra migración altera `jaulas`.

Contexto (no sustituye al código): `documents/CriaderoKikirikis_V1_Analisis_Movil_y_Mapeo_API.md` (tablas pantalla -> repositorio `:380-388` y repositorio -> endpoint `:732-735,775-784`), `documents/specs/aves.md` (R-P8 a R-P10).

## Comportamiento en V1

### Hallazgos que corrigen documentos y especificaciones previas

1. **`DetalleJaulaScreen` no usa `HistorialRepository`.** El análisis V1 lo afirma (`CriaderoKikirikis_V1_Analisis_Movil_y_Mapeo_API.md:382`) pero sus imports son solo `JaulaRepository` y `AveRepository` (`DetalleJaulaScreen.js:22-31`). Solo `HistorialJaulaScreen.js:17-19,50-53` importa `obtenerHistorialJaula`; `DetalleJaulaScreen` solo navega a `HistorialJaula` con `{ jaulaId }` (`:1370-1377`). Búsqueda sin límite de `registrarHistorialJaula|obtenerHistorialJaula|HistorialRepository` en `src/`: importadores = `AlimentacionRepository.js:4-5`, `BebidaRepository.js:4-5`, `SanidadJaulaRepository.js:4-5` (escriben) y `HistorialJaulaScreen.js:18-19` (lee). Ninguna otra pantalla llama a `obtenerHistorialJaula`.
2. **`jaula_historial` tiene cinco tipos de evento, no dos.** Búsqueda sin límite de `jaula_historial` en `src/`: escrituras en `AveRepository.js:937` (`crearAve`, `INGRESO_AVE`), `:1656` y `:1688` (`cambiarJaulaAve`, `SALIDA_AVE` e `INGRESO_AVE`), `JaulaRepository.js:331` (`desactivarJaula`, `SALIDA_AVE`) y `HistorialRepository.js:19` (`registrarHistorialJaula`, llamado con `ALIMENTACION` en `AlimentacionRepository.js:77`, `BEBIDA` en `BebidaRepository.js:78`, `SANIDAD` en `SanidadJaulaRepository.js:53`). Lecturas: `JaulaRepository.js:59,100,128`, `HistorialRepository.js:57`. La sección b de `aves.md:98` que lista solo `INGRESO_AVE`/`SALIDA_AVE` es incompleta (hay que corregirla en esa spec cuando se revise). No hay evento propio de la jaula al crearla, editarla ni desactivarla (ningún `INSERT INTO jaula_historial` con otro tipo: la lista anterior es exhaustiva).
3. **No hay reactivación.** `activa` solo se escribe a `0` en `JaulaRepository.js:375` (y `1` por defecto/`INSERT`, `:177`; `migrations.js:36`). Búsqueda sin límite de `activa\s*=`, `fecha_desactivacion` y `reactivar` en `src/`: ninguna operación vuelve una jaula a activa.
4. **No hay capacidad de jaula.** `capacidad` (sin distinguir mayúsculas) no aparece en ningún archivo de `src/` (0 coincidencias).
5. **El código de jaula no se pasa a mayúsculas.** `crearJaula` y `actualizarJaula` solo hacen `codigo.trim()` (`JaulaRepository.js:180,213`). `autoCapitalize="characters"` es solo ayuda del teclado (`NuevaJaulaScreen.js:182`, `DetalleJaulaScreen.js:804`). El Alert de éxito del alta muestra `codigo.trim().toUpperCase()` (`NuevaJaulaScreen.js:91`) aunque lo guardado sea el texto tal como se escribió. `UNIQUE` de SQLite es sensible a mayúsculas (`migrations.js:31`): `j1` y `J1` pueden coexistir.
6. **`DetalleJaulaInactivaScreen.js` tiene el texto corrupto (mojibake) dentro del archivo.** Búsqueda `est谩|Informaci贸n` en `src/`: 2 archivos-coincidencia, ambas en este archivo (p. ej. `:170` "Esta jaula est谩 desactivada. La informaci贸n se conserva 煤nicamente para consulta hist贸rica."). Es un defecto de V1 (el texto previsto es "Esta jaula está desactivada. La información se conserva únicamente para consulta histórica."). Ver P-11 y RJ-P13.
7. **Las aves VENDIDA/FALLECIDA conservan `jaula_actual_id`** y `desactivarJaula` las libera igual que a las activas (ver sección "Desactivar"); las consultas de jaula cuentan y listan solo aves `ACTIVA` (`JaulaRepository.js:20-22`, `AveRepository.js:85-87`). Consecuencia visible: el mensaje de confirmación usa `aves.length` (solo ACTIVA, `DetalleJaulaScreen.js:485-494`), pero el mensaje de resultado usa `cantidadAvesLiberadas` (todas, `:545-559`).
8. **`obtenerJaulasInactivas.cantidad_aves` no es ocupación.** Cuenta aves distintas que figuran en `jaula_historial` de esa jaula (`COUNT(DISTINCT h.ave_id)`, `JaulaRepository.js:57-60`), pero `JaulaCard` lo interpreta como ocupación y muestra "Ocupada"/"Vacía" y "N aves" (`JaulaCard.js:21-28,77-81,102-108`). Una jaula inactiva con historial se ve "Ocupada". Ver RJ-P12.

### a. Métodos públicos

Todos usan `getDatabase()` de `src/database/database`; la única transacción de este módulo es `db.withTransactionAsync` en `desactivarJaula` (`:238`).

| Método | Escribe | Transacción |
|---|---|---|
| `obtenerJaulas`/`obtenerJaulasInactivas`/`obtenerAvesHistoricasJaula`/`obtenerHistorialCompletoJaula`/`obtenerJaulaPorId`/`obtenerHistorialJaula` | no | no |
| `crearJaula` | `jaulas` | no (una sentencia) |
| `actualizarJaula` | `jaulas` | no (una sentencia) |
| `desactivarJaula` | `ave_historial`, `jaula_historial`, `aves`, `jaulas` | sí |
| `registrarHistorialJaula` | `jaula_historial` | no (usa la transacción del llamador si recibe `db`) |
| `AveRepository.cambiarJaulaAve` (módulo aves) | `aves`, `ave_historial`, `jaula_historial` | sí |
| `AveRepository.crearAve` (módulo aves, con jaula inicial) | además `jaula_historial` | sí |

### b. Columnas reales de `jaulas`

Fuente: `migrations.js:29-39` y `migrationV6.js:6-7`. No hay `CHECK`. `PRAGMA foreign_keys = ON` (`sqlite.js:63`, según `aves.md`).

| Columna | Tipo | NULL | Default | UNIQUE / FK | Migración |
|---|---|---|---|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | no | - | PK | V1 `:30` |
| codigo | TEXT | NOT NULL | - | UNIQUE (colación binaria, sensible a mayúsculas, **incluye jaulas inactivas**) | V1 `:31` |
| nombre | TEXT | sí | - | - | V1 `:32` |
| ubicacion | TEXT | sí | - | - | V1 `:33` |
| tipo | TEXT | sí | - | texto libre, sin CHECK | V1 `:34` |
| estado_sanitario | TEXT | NOT NULL | 'NORMAL' | sin CHECK | V1 `:35` |
| activa | INTEGER | NOT NULL | 1 | sin CHECK | V1 `:36` |
| fecha_creacion | TEXT | NOT NULL | CURRENT_TIMESTAMP | - | V1 `:37` |
| fecha_actualizacion | TEXT | sí | - | - | V1 `:38` |
| fecha_desactivacion | TEXT | sí | - | - | V6 `migrationV6.js:6-7` (relleno de las ya inactivas `:10-17`) |

Formatos de fecha: `fecha_creacion`/`fecha_actualizacion` = `CURRENT_TIMESTAMP` de SQLite (`YYYY-MM-DD HH:MM:SS`, UTC; `JaulaRepository.js:209,362,377`); `fecha_desactivacion` = `new Date().toISOString()` (`:229-231,376,381`).

`estado_sanitario`: valores que existen: `NORMAL`, `LIMPIEZA`, `FUMIGACION`, `QUEMADURA`, `CUARENTENA` (`constants.js:34-46`, `SanidadJaulaRepository.js:62-84`); etiquetas "Normal", "Limpieza", "Fumigación", "Quemadura", "Cuarentena" (`constants.js:51-128`). Cualquier otro valor o vacío se muestra como `NORMAL` (`getJaulaSanitaryStatusStyle`, `constants.js:133-153`). `crearJaula` lo escribe como `'NORMAL'` (`JaulaRepository.js:177`). **Este módulo no lo modifica**: lo escribe `registrarSanidadJaula` (módulo cuidados de jaula), que también actualiza `fecha_actualizacion` (`SanidadJaulaRepository.js:39-49`).

Tablas relacionadas:

- `jaula_historial` (`migrations.js:109-130`): `id` PK AUTOINCREMENT, `jaula_id` NOT NULL (FK `jaulas` ON DELETE CASCADE), `ave_id` INTEGER NULL (FK `aves` sin ON DELETE), `tipo_evento` TEXT NOT NULL (sin CHECK), `fecha` TEXT NOT NULL, `detalle` TEXT NULL, `fecha_creacion` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP. Índice `idx_jaula_historial_jaula(jaula_id)` (`:352-353`). Tipos escritos: `INGRESO_AVE`, `SALIDA_AVE`, `ALIMENTACION`, `BEBIDA`, `SANIDAD` (hallazgo 2).
- `aves.jaula_actual_id` (INTEGER NULL, FK `jaulas(id)` sin ON DELETE, `migrations.js:69,83-84`; índice `idx_aves_jaula` `:346-347`).
- Otras tablas con `jaula_id` (módulos aparte): `ave_historial.jaula_id` (`:138,152-153`), `alimentacion_jaula`, `bebida_jaula`, `sanidad_jaula` (`jaula_id NOT NULL` ON DELETE CASCADE, `:157-215`), `huevos.jaula_id` (`:225,238-239`).

### c. Código, nombre, ubicación y tipo (alta y edición)

- Alta (`NuevaJaulaScreen.js`): campos "Código *" (`TextInput`, placeholder "Ej. J001", `autoCapitalize="characters"`, `maxLength={20}`, `:171-184`), "Nombre" (placeholder "Ej. Reproductores Sebright", sin límite, `:187-198`), "Ubicación" (placeholder "Ej. Sector A", sin límite, `:201-212`) y "Tipo de jaula" con cinco botones `Reproducción`, `Crecimiento`, `Postura`, `Cuarentena`, `General` (`TIPOS_JAULA`, `:26-32,215-260`), valor inicial `General` (`:48-49`). El tipo no se puede dejar vacío en el alta (siempre hay uno seleccionado).
- Edición (`DetalleJaulaScreen.js`, tarjeta "Editar jaula", `:770-959`): "Código *" (`maxLength={30}`, `:790-809`), "Nombre", "Ubicación" y **"Tipo" como texto libre** (`TextInput`, placeholder "Tipo de jaula", `:864-887`): no usa los cinco botones; el tipo puede quedar vacío (se guarda `NULL`) o contener cualquier texto.
- Normalización en repositorio: `codigo.trim()`; `nombre`, `ubicacion` y `tipo` con `?.trim() || null` (cadena vacía -> `NULL`) (`JaulaRepository.js:180-183,213-216`). Sin límite de longitud en repositorio ni en nombre/ubicación/tipo.
- Unicidad del código: solo la garantiza `UNIQUE` de SQLite (sin chequeo previo en el repositorio); la pantalla traduce el error si el mensaje contiene `unique` (alta, `NuevaJaulaScreen.js:113-123`) o `unique` y `jaulas.codigo` (edición, `DetalleJaulaScreen.js:439-456`). La unicidad es global y **cuenta las jaulas inactivas**: el código de una jaula desactivada queda ocupado.
- Edición: se muestran Ubicación ("Sin ubicación" si vacía), Tipo ("Sin tipo"), Estado sanitario (badge) (`DetalleJaulaScreen.js:962-1047`); título "🏠 {codigo}" y nombre si existe (`:674-697`).
- Éxito alta: Alert "Jaula creada" / "La jaula {CODIGO en mayúsculas} fue registrada correctamente." y vuelve atrás (`NuevaJaulaScreen.js:87-102`). Éxito edición: Alert "Jaula actualizada" / "Los datos de la jaula fueron actualizados correctamente." tras recargar (`DetalleJaulaScreen.js:415-426`).
- Error no mapeado: "Error" / "No fue posible guardar la jaula." (alta, `:127-130`) o "No fue posible actualizar la jaula." (edición, `:465-468`).
- `actualizarJaula` no comprueba que la jaula exista ni que esté activa (`UPDATE ... WHERE id = ?`, `:201-219`); la UI solo ofrece editar desde `DetalleJaula` (pestaña activas).

### d. Listados y detalle

`JaulasScreen` (tab "Jaulas" -> `ListaJaulas`, `JaulasStackNavigator.js:58-67`):

- Cabecera "Jaulas" / "Administración de espacios del criadero" (`JaulasScreen.js:99-102`); pestañas "🏠 Activas" y "📦 Inactivas" (`:105-144`); botón "＋ Nueva jaula" solo en Activas (`:147-170`). Recarga al enfocar y al cambiar de pestaña (`:78-86`). Cargando "Cargando jaulas..." (`:173-200`); error "No se pudieron cargar las jaulas." con botón "Reintentar" (`:203-242`, `:64-66`).
- Vacío: Activas "No tienes jaulas registradas" / "Crea tu primera jaula para comenzar a organizar las aves del criadero."; Inactivas "No tienes jaulas inactivas" / "Las jaulas desactivadas aparecerán aquí y conservarán su historial." (`:245-291`).
- Inactivas: etiqueta "Inactiva · Solo lectura" sobre la tarjeta (`:305-315`). Al tocar: Activas -> `DetalleJaula`, Inactivas -> `DetalleJaulaInactiva`, ambas con `{ jaulaId }` (`:317-330`).
- Todo el filtrado es del lado de SQL por `activa`; no hay búsqueda ni filtros en pantalla, ni paginación.
- `JaulaCard` (`JaulaCard.js:16-172`): "🏠 {codigo}", badge "Ocupada" (cantidad > 0) o "Vacía", nombre si existe, "🐔 {n} ave/aves", "📍 {ubicacion}", "🏷️ {tipo}", "Estado sanitario" con el badge de color (`:21-172`); borde izquierdo con el color del estado sanitario (`:31-46`).

`DetalleJaulaScreen` (`jaulaId`): al enfocar carga `obtenerJaulaPorId` y `obtenerAvesPorJaula` en paralelo (`:116-130`); error de carga solo a `console.error` (`:164-171`), y si no hay jaula muestra "Jaula no encontrada." (`:632-654`); cargando "Cargando jaula..." (`:599-629`). Secciones: encabezado y botones "✏️ Editar jaula" / "🗑️ Eliminar" (`:700-767`), datos y estado sanitario, "🐔 Aves" con contador "{n} ave/aves" y "＋ Agregar" (`:1050-1114`), lista con tocar -> detalle del ave en el tab Aves (`abrirAve`, `:197-228`) y botón "Quitar" por ave, vacío "Jaula vacía" / "No existen aves asignadas actualmente a esta jaula." (`:1117-1153`), y "Acciones de la jaula" (Alimentación, Bebida, Sanidad, Historial, `:1280-1390`). Las aves mostradas son las de `obtenerAvesPorJaula`: solo `ACTIVA` (`AveRepository.js:85-87`).

`DetalleJaulaInactivaScreen` (`jaulaId`): carga en paralelo `obtenerJaulaPorId`, `obtenerAvesHistoricasJaula`, `obtenerHistorialCompletoJaula` (`:55-63`). Muestra título, nombre o "Sin nombre", badge "Inactiva", texto de solo lectura, tarjeta "Información" (código, nombre, ubicación, tipo, estado sanitario **en bruto** `jaula.estado_sanitario`, creación, desactivación = `fecha_desactivacion || fecha_actualizacion`; vacío = "No registrado"; fechas con `toLocaleString()`, `:174-195,308-354`), "Aves que estuvieron aquí" con contador (`:198-254`, vacío "No hay aves registradas en el historial de esta jaula.") y "Historial" con contador (`:257-300`, vacío "La jaula no tiene eventos registrados."; evento = "⬇️ Ingreso de ave" / "⬆️ Salida de ave" / tipo en bruto / "Evento"; fecha; "Ave: {ave_codigo}" si existe; detalle o "Sin detalle"). No hay botones de edición ni acciones.

`HistorialJaulaScreen` (`jaulaId`): `obtenerHistorialJaula` al enfocar (`:37-57`); cada evento muestra `tipo_evento` en bruto, `new Date(item.fecha).toLocaleString()` y `detalle` (`:79-106`); vacío "La jaula todavía no tiene eventos registrados." (`:72-78`). No captura errores de carga (sin `try/catch`, `:48-57`). Alcanza todos los tipos de evento, incluidos `ALIMENTACION`, `BEBIDA` y `SANIDAD` (hallazgo 2).

### e. Asignación de aves (`SeleccionarAveJaulaScreen`, `DetalleJaulaScreen.quitarAve`)

La escritura la hace `AveRepository.cambiarJaulaAve` (especificada en `aves.md`, sección h); aquí se documenta lo que condiciona a las jaulas.

- Lista de candidatas: `obtenerAvesParaAsignarJaula(jaulaId)` = aves `ACTIVA` con `jaula_actual_id IS NULL OR jaula_actual_id <> jaulaId` (`AveRepository.js:122-130`), con `jaula_codigo` de la jaula actual. **La UI nunca ofrece mover un ave a la jaula en la que ya está**. Vacío: "No hay aves disponibles" / "Todas las aves activas ya pertenecen a esta jaula o no existen más aves registradas." (`SeleccionarAveJaulaScreen.js:297-333`).
- Confirmación y llamada: ver "Validaciones en pantalla". `asignarAve` envía `jaulaAnteriorId = ave.jaula_actual_id || null`, `nuevaJaulaId = jaulaId`, `codigoAve = ave.codigo` (`:172-188`); `quitarAve` envía `jaulaAnteriorId = jaulaId`, `nuevaJaulaId = null`, `codigoAve` (`DetalleJaulaScreen.js:273-287`).
- Éxito asignar: "Ave asignada" / "El ave {codigo} ahora pertenece a la jaula {jaulaCodigo}." y vuelve atrás (`:191-207`). Éxito quitar: recarga y "Ave retirada" / "El ave {codigo} quedó sin jaula asignada." (`DetalleJaulaScreen.js:290-296`).
- Errores: "Error" / "No fue posible asignar el ave a la jaula." (`:218-221`); "Error" / "No fue posible retirar el ave de la jaula." (`DetalleJaulaScreen.js:307-310`); carga: "Error" / "No fue posible cargar las aves disponibles." (`SeleccionarAveJaulaScreen.js:89-92`).
- **Pendiente resuelto (anterior == nueva).** Ni `cambiarJaulaAve` (`AveRepository.js:1555-1716`) ni las pantallas validan `anterior != nueva`; la UI lo evita porque la lista de candidatas excluye las aves de esa jaula (`:127`) y quitar siempre envía `nuevaJaulaId = null`. Solo sería alcanzable con una lista desactualizada (el ave ya fue movida a esa jaula desde otro lugar tras cargar la lista). Efecto si llegara igual: `UPDATE` sin cambio real, `ave_historial` `CAMBIO_JAULA` "El ave fue movida de una jaula a otra." y en `jaula_historial` una `SALIDA_AVE` y una `INGRESO_AVE` de la misma jaula (`:1597-1711`). Ver RJ-L3 y RJ-P4.

### f. Desactivar ("Eliminar") una jaula

Pantalla: botón "🗑️ Eliminar" (`DetalleJaulaScreen.js:737-761`) -> confirmación (`:482-526`) -> `desactivarJaula(jaulaId)` (`:539-542`). Es **baja lógica**: la jaula no se borra, deja de salir en Activas y aparece en Inactivas conservando historial (textos "su información histórica se conservará", `:501`; `JaulasScreen.js:284`).

Repositorio `desactivarJaula(id)` (`:223-394`), una transacción:

1. `SELECT id, codigo, nombre, activa FROM jaulas WHERE id = ?` (`:241-255`). Si no existe: `throw new Error('JAULA_NO_ENCONTRADA')` (`:258-264`).
2. Si `Number(jaula.activa) !== 1`: `return;` sin escribir nada (`:267-275`); el valor devuelto es `{ cantidadAvesLiberadas: 0 }` (`:234-235,390-392`). Es decir, desactivar una jaula ya inactiva es **idempotente** (la UI no lo permite: el botón solo existe en `DetalleJaula`).
3. Lee todas las aves con `jaula_actual_id = id` **sin filtrar estado** (ACTIVA, VENDIDA y FALLECIDA), `ORDER BY codigo` (`:278-291`); `cantidadAvesLiberadas = avesAsignadas.length` (`:294-295`).
4. Por cada ave: `INSERT INTO ave_historial` `(ave_id, jaula_id = NULL, 'CAMBIO_JAULA', fecha ISO, "La jaula {codigo} fue eliminada. El ave quedó sin jaula asignada.")` (`:303-326`) y `INSERT INTO jaula_historial` `(jaula_id = id, ave_id, 'SALIDA_AVE', fecha, "Ave {codigo} salió de la jaula porque la jaula fue eliminada.")` (`:329-352`). Todas con la misma `fecha = new Date().toISOString()` (`:229-231`).
5. `UPDATE aves SET jaula_actual_id = NULL, fecha_actualizacion = CURRENT_TIMESTAMP WHERE jaula_actual_id = ?` (`:357-368`).
6. `UPDATE jaulas SET activa = 0, fecha_desactivacion = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?` (`:371-384`).
7. Devuelve `{ cantidadAvesLiberadas }`. No se escribe ningún evento propio de la jaula (solo los `SALIDA_AVE` por ave).

La pantalla: éxito "Jaula eliminada" con tres variantes de mensaje (0, 1 o N aves liberadas) y vuelve atrás (`:551-571`); error cualquiera (incluido `JAULA_NO_ENCONTRADA`) -> "Error" / "No fue posible eliminar la jaula." (`:574-587`).

Las aves dadas de baja (VENDIDA/FALLECIDA) conservan su jaula hasta que la jaula se desactiva; `BajaAveRepository` no la libera (0 coincidencias de `jaula`).

### g. Efectos y relaciones hacia otras entidades

- Ocupación: `cantidad_aves` y "ocupada" cuentan solo aves `ACTIVA` (`JaulaRepository.js:20-22`; `DashboardRepository.js:157-185`: `ocupadas` = jaulas activas con al menos un ave ACTIVA; porcentaje `ocupadas / total * 100` con dos decimales, `:450-471`).
- Alertas: por cada jaula activa, "Sin alimentación registrada" y "Sin bebida registrada" si no hay registros de hoy (`AlertasRepository.js:135-154,166-354`). Pertenecen al módulo de alertas.
- Exportación: `obtenerExportacionJaulas` devuelve `Codigo, Nombre, Ubicacion, Tipo, EstadoSanitario, Estado ('ACTIVA'|'INACTIVA'), FechaCreacion, FechaDesactivacion` ordenado por `codigo` (`ReportesRepository.js:269-290`); módulo de reportes.
- Selector de jaula del alta de ave: `obtenerJaulasActivas()` devuelve `{ id, codigo, nombre }` solo de jaulas activas, `ORDER BY codigo` (`AveRepository.js:622-643`); `NuevaAveScreen.js:326` y `SelectorJaula` (`:2392-2470`). Aves sin jaula: opción "Sin jaula" (`:2406-2433`).
- El alta de ave con jaula inicial escribe `jaula_historial` `INGRESO_AVE` (`AveRepository.js:933-964`); `crearAve` no valida que la jaula exista ni esté activa (`aves.md`, sección h).

## Contrato del repositorio V1

Forma de las filas: objetos planos con los nombres de columna de SQLite (`snake_case`), tal como los devuelve `getAllAsync`/`getFirstAsync`; los enteros de SQLite llegan como `number`; ninguna función convierte tipos.

### JaulaRepository.js

**`obtenerJaulas()`** (`:3-39`). Sin parámetros. Devuelve `Array<{ id, codigo, nombre, ubicacion, tipo, estado_sanitario, activa, fecha_creacion, cantidad_aves }>` de jaulas con `activa = 1`, `LEFT JOIN aves` por `jaula_actual_id` y `estado = 'ACTIVA'`, `COUNT(a.id) AS cantidad_aves`, `ORDER BY j.codigo`. Errores: ninguno propio. Consumo: `JaulasScreen.js:49-54` (`setJaulas`; error -> "No se pudieron cargar las jaulas."); `JaulaCard` usa `cantidad_aves`, `nombre`, `ubicacion`, `tipo`, `estado_sanitario`, `codigo`.

**`obtenerJaulasInactivas()`** (`:41-82`). Sin parámetros. Devuelve `Array<{ id, codigo, nombre, ubicacion, tipo, estado_sanitario, activa, fecha_creacion, fecha_actualizacion, fecha_desactivacion, cantidad_aves }>` de jaulas con `activa = 0`; `cantidad_aves = COUNT(DISTINCT h.ave_id)` sobre `jaula_historial` de la jaula (aves que pasaron por ella, no ocupación; hallazgo 8). Orden: `COALESCE(fecha_desactivacion, fecha_actualizacion, fecha_creacion) DESC, codigo`. Consumo: `JaulasScreen.js:52`.

**`obtenerAvesHistoricasJaula(jaulaId)`** (`:85-109`). Devuelve `Array<{ id, codigo, raza, sexo, estado, foto_uri }>` (`SELECT DISTINCT`) de las aves con alguna fila en `jaula_historial` de esa jaula (`INNER JOIN aves`), `ORDER BY a.codigo`. Consumo: `DetalleJaulaInactivaScreen.js:61,198-254` (usa `id`, `foto_uri`, `sexo`, `codigo`, `raza`; `estado` se devuelve pero no se muestra).

**`obtenerHistorialCompletoJaula(jaulaId)`** (`:112-139`). Devuelve `Array<{ id, jaula_id, ave_id, tipo_evento, fecha, detalle, ave_codigo }>`, `LEFT JOIN aves` (`ave_codigo` es `NULL` en eventos sin ave), `ORDER BY h.fecha DESC, h.id DESC`. Consumo: `DetalleJaulaInactivaScreen.js:62,257-300` (usa `id`, `tipo_evento`, `fecha`, `ave_codigo`, `detalle`).

**`obtenerJaulaPorId(id)`** (`:142-155`). Devuelve `SELECT * FROM jaulas WHERE id = ?` con `getFirstAsync`: fila `{ id, codigo, nombre, ubicacion, tipo, estado_sanitario, activa, fecha_creacion, fecha_actualizacion, fecha_desactivacion }` de **cualquier** estado (activa o no), o un valor falsy si no existe (las pantallas comprueban `!jaula`, `DetalleJaulaScreen.js:632-654`, `DetalleJaulaInactivaScreen.js:135-143`). Errores: ninguno propio.

**`crearJaula({ codigo, nombre, ubicacion, tipo })`** (`:157-189`). `INSERT INTO jaulas (codigo, nombre, ubicacion, tipo, estado_sanitario, activa) VALUES (trim(codigo), nombre?.trim() || null, ubicacion?.trim() || null, tipo?.trim() || null, 'NORMAL', 1)`. Devuelve `result.lastInsertRowId` (número). Errores: no valida nada; `codigo.trim()` lanza `TypeError` si `codigo` es `undefined`/`null`; código repetido -> error de SQLite cuyo mensaje contiene `UNIQUE constraint failed: jaulas.codigo` (texto de SQLite, no definido por el código). Consumo: `NuevaJaulaScreen.js:74-84` (ignora el valor devuelto); captura `error.message?.toLowerCase().includes('unique')` (`:113-123`).

**`actualizarJaula({ id, codigo, nombre, ubicacion, tipo })`** (`:191-221`). `UPDATE jaulas SET codigo, nombre, ubicacion, tipo (mismas normalizaciones), fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`. No devuelve valor. No comprueba existencia ni estado; no toca `estado_sanitario` ni `activa`. Errores: igual que `crearJaula` (`UNIQUE`, `TypeError`). Consumo: `DetalleJaulaScreen.js:395-412`; captura `unique` y `jaulas.codigo` (`:439-456`).

**`desactivarJaula(id)`** (`:223-394`). Devuelve `{ cantidadAvesLiberadas: number }` (también `0` si la jaula ya estaba inactiva, ver sección f). Error lanzado: `new Error('JAULA_NO_ENCONTRADA')` (`:258-264`; la transacción se revierte). Consumo: `DetalleJaulaScreen.js:539-559` (usa solo `cantidadAvesLiberadas`); cualquier error -> "No fue posible eliminar la jaula.".

### HistorialRepository.js

**`registrarHistorialJaula({ jaulaId, aveId = null, tipoEvento, fecha, detalle, db = null })`** (`:4-38`). `INSERT INTO jaula_historial (jaula_id, ave_id, tipo_evento, fecha, detalle) VALUES (jaulaId, aveId, tipoEvento, fecha, detalle || null)`. Si recibe `db` usa esa conexión (participa en la transacción del llamador), si no `getDatabase()`. No devuelve valor; no valida. Llamadores: `AlimentacionRepository.js:73-86`, `BebidaRepository.js:74-87`, `SanidadJaulaRepository.js:51-57`, todos con `db` y sin `aveId` (`ave_id` queda `NULL`). Ninguna pantalla la llama directamente.

**`obtenerHistorialJaula(jaulaId)`** (`:41-66`). Devuelve `Array<{ id, jaula_id, ave_id, tipo_evento, fecha, detalle, fecha_creacion }>` de `jaula_historial` de esa jaula, `ORDER BY fecha DESC, id DESC`, sin `JOIN` (no trae `ave_codigo`). Consumo: `HistorialJaulaScreen.js:50-55` (usa `id`, `tipo_evento`, `fecha`, `detalle`; `fecha_creacion` no se muestra).

### Funciones de otros repositorios que condicionan al módulo (contrato detallado en `aves.md`)

- `AveRepository.obtenerAvesPorJaula(jaulaId)` (`:62-96`): `Array<{ id, codigo, origen, fecha_nacimiento, raza, caracteristicas, foto_uri, jaula_actual_id, estado }>`, solo `estado = 'ACTIVA'`, `ORDER BY codigo`. Consumo: `DetalleJaulaScreen.js:126-128,1156-1274` (usa `id`, `codigo`, `raza`, `foto_uri`).
- `AveRepository.obtenerAvesParaAsignarJaula(jaulaId)` (`:99-137`): `Array<{ id, codigo, raza, foto_uri, jaula_actual_id, jaula_codigo }>`. Consumo: `SeleccionarAveJaulaScreen.js:70-78,120-159,336-468`.
- `AveRepository.obtenerJaulasActivas()` (`:622-643`): `Array<{ id, codigo, nombre }>`.
- `AveRepository.cambiarJaulaAve({ aveId, jaulaAnteriorId, nuevaJaulaId, codigoAve })` (`:1555-1716`): sin valor devuelto; ver `aves.md` sección h y la sección e de esta spec.

## Validaciones en pantalla

Reglas que viven solo en la UI o en la combinación UI + SQLite (el repositorio no las aplica), para que el backend también las aplique. Código V2: `VALIDATION_ERROR` (HTTP 400 en el estilo de `criaderos.routes.ts`) cuando no haga falta distinguir; los códigos nuevos son propuestas. `JAULA_NOT_ACTIVE` (HTTP 400, patrón `ITEM_NOT_ACTIVE`) está aprobado (decisión A-2).

| Regla | Mensaje exacto (título / mensaje) | Archivo:línea | Código V2 propuesto |
|---|---|---|---|
| Código obligatorio (tras `trim`), alta | "Código requerido" / "Ingresa un código para la jaula." | `NuevaJaulaScreen.js:57-66` | `VALIDATION_ERROR` (`codigo`) |
| Código obligatorio (tras `trim`), edición | "Código requerido" / "Ingresa un código para la jaula." | `DetalleJaulaScreen.js:372-385` | `VALIDATION_ERROR` (`codigo`) |
| Longitud máxima del código: 20 en el alta, 30 en la edición (solo `maxLength` de pantalla; el repositorio no limita) | (sin mensaje: el campo corta la entrada) | `NuevaJaulaScreen.js:183`; `DetalleJaulaScreen.js:805` | `VALIDATION_ERROR`; valor único por decidir (RJ-P2) |
| Código con `trim`; **sin** pasar a mayúsculas (hallazgo 5) | (sin mensaje: normalización) | `JaulaRepository.js:180,213` | normalizar con `trim` en servicio; mayúsculas por decidir (RJ-P1) |
| Código único entre **todas** las jaulas, activas e inactivas (sensible a mayúsculas) | "Código duplicado" / "Ya existe una jaula con ese código." | `NuevaJaulaScreen.js:113-123`; `DetalleJaulaScreen.js:439-456`; `migrations.js:31` | `CODIGO_JAULA_DUPLICADO` (propuesta, 409; sigue la convención de `CODIGO_AVE_DUPLICADO`; V1 no tiene cadena propia: es el mensaje de SQLite) |
| Nombre, ubicación y tipo opcionales; con `trim`; cadena vacía -> `NULL`; sin longitud máxima | (sin mensaje) | `JaulaRepository.js:181-183,214-216` | normalizar en servicio |
| Tipo del alta: uno de `Reproducción`, `Crecimiento`, `Postura`, `Cuarentena`, `General` (por defecto `General`); en la edición es texto libre y puede quedar vacío | (sin mensaje) | `NuevaJaulaScreen.js:26-32,48-49`; `DetalleJaulaScreen.js:873-887` | `VALIDATION_ERROR`; restricción por decidir (RJ-P3) |
| Solo se edita y se desactiva una jaula **activa** (la UI solo da esas acciones en la pestaña Activas; el repositorio no lo comprueba al editar) | (sin mensaje en V1) | `JaulasScreen.js:305-330`; `DetalleJaulaScreen.js:700-767`; `JaulaRepository.js:201-219` | `JAULA_NOT_ACTIVE` (aprobado el código y el HTTP 400; aplicarlo a editar es la diferencia P-06) |
| Jaula inexistente al abrir detalle | "Jaula no encontrada." | `DetalleJaulaScreen.js:632-654`; `DetalleJaulaInactivaScreen.js:135-143` | `JAULA_NOT_FOUND` (404) |
| Jaula inexistente al desactivar | "Error" / "No fue posible eliminar la jaula." (la cadena de V1 es `JAULA_NO_ENCONTRADA`, no mapeada) | `JaulaRepository.js:258-264`; `DetalleJaulaScreen.js:574-587` | `JAULA_NOT_FOUND` (404) |
| Confirmación al eliminar (con tres variantes del segundo párrafo) | "Eliminar jaula" / "¿Estás seguro de eliminar la jaula {codigo}?\n\n{La jaula está vacía. / El ave asignada será retirada y quedará sin jaula. / Las {n} aves asignadas serán retiradas y quedarán sin jaula.}\n\nLa jaula dejará de aparecer como activa, pero su información histórica se conservará." (botones Cancelar / Eliminar) | `DetalleJaulaScreen.js:482-526` | UI |
| Resultado de eliminar | "Jaula eliminada" / "La jaula fue eliminada correctamente." / "La jaula fue eliminada y el ave asignada quedó sin jaula." / "La jaula fue eliminada y {n} aves quedaron sin jaula." | `DetalleJaulaScreen.js:551-571` | UI (n = `cantidadAvesLiberadas`) |
| Confirmación al quitar un ave | "Quitar ave" / "¿Deseas retirar el ave {codigo} de la jaula {jaula.codigo}?" (Cancelar / Quitar) | `DetalleJaulaScreen.js:231-265` | UI |
| Confirmación al asignar un ave | "Asignar ave" / "El ave {codigo} actualmente pertenece a la jaula {jaula_codigo}. ¿Deseas moverla a {jaulaCodigo}?" o "¿Deseas agregar el ave {codigo} a la jaula {jaulaCodigo}?" (botones Cancelar / Mover o Agregar) | `SeleccionarAveJaulaScreen.js:120-159` | UI |
| Solo aves `ACTIVA` se pueden asignar o quitar (la UI solo lista ACTIVA; el repositorio no valida) | (sin mensaje) | `AveRepository.js:122-124`; `:85-87` | `AVE_NOT_ACTIVE` (409, aprobado en aves, R-P8) |
| No se mueve un ave a la jaula en la que ya está (solo la lista lo evita) | (sin mensaje) | `AveRepository.js:125-128`; `SeleccionarAveJaulaScreen.js:70-73` | `VALIDATION_ERROR` 400 (decidido por Claude por criterio de paridad con servidor más estricto, aves R-P8a; el usuario lo revisa; ver RJ-P4) |
| Destino de asignación: solo jaula activa (la UI solo muestra la jaula abierta, que es activa; el repositorio no valida) | (sin mensaje en V1) | `DetalleJaulaScreen.js:1090-1100`; `AveRepository.js:1555-1716` | `JAULA_NOT_ACTIVE` (400, aprobado en aves, R-P9) |

Mensajes de carga y error de la UI relevantes (se conservan en V2 más los estados de red aceptados): "Cargando jaulas..." / "No se pudieron cargar las jaulas." / "Reintentar" (`JaulasScreen.js:194,64-66,234`); "Cargando jaula..." (`DetalleJaulaScreen.js:622`); "Cargando historial de la jaula..." (`DetalleJaulaInactivaScreen.js:128`); "Buscando aves..." (`SeleccionarAveJaulaScreen.js:258`); "Error" / "No fue posible abrir el detalle del ave." (`DetalleJaulaScreen.js:206-209`).

## Paridad con V1

Formato: id | dado | cuando | entonces | evidencia V1. "Tablas" son las de V1; en V2 se traducen al modelo D1 con las diferencias aprobadas. Los casos con aves o historial dependen de la migración `0006` (ver "Decisiones aprobadas").

| ID | Dado | Cuando | Entonces | Evidencia V1 |
|---|---|---|---|---|
| PAR-JAU-001 | Sin jaulas | Alta con código "J001" y tipo por defecto | `jaulas` con `codigo='J001'`, `nombre`/`ubicacion` `NULL`, `tipo='General'`, `estado_sanitario='NORMAL'`, `activa=1`, `fecha_creacion` rellena; Alert "Jaula creada" / "La jaula J001 fue registrada correctamente."; no se escribe `jaula_historial` | `NuevaJaulaScreen.js:48-49,74-102`; `JaulaRepository.js:166-185` |
| PAR-JAU-002 | Sin jaulas | Alta con código " j002 ", nombre " Sector A ", ubicación vacía | Se guarda `codigo='j002'` (solo `trim`, **sin** mayúsculas), `nombre='Sector A'`, `ubicacion=NULL`; el Alert muestra "J002" (V1) | `JaulaRepository.js:180-183`; `NuevaJaulaScreen.js:91` (hallazgo 5) |
| PAR-JAU-003 | Alta | Código vacío o solo espacios | Alert "Código requerido" / "Ingresa un código para la jaula."; no se escribe nada | `NuevaJaulaScreen.js:57-66` |
| PAR-JAU-004 | Existe la jaula `J001` (activa) | Alta con `J001` | Alert "Código duplicado" / "Ya existe una jaula con ese código."; sin escritura | `NuevaJaulaScreen.js:113-123`; `migrations.js:31` |
| PAR-JAU-005 | `J001` está inactiva | Alta con `J001` | Igual que PAR-JAU-004: el código de una jaula inactiva sigue ocupado (`UNIQUE` global) | `migrations.js:31`; `JaulaRepository.js:166-185` |
| PAR-JAU-006 | Existe `J001` y no existe `j001` | Alta con `j001` | Se acepta: la unicidad distingue mayúsculas (diferencia posible, RJ-P1) | `migrations.js:31` |
| PAR-JAU-007 | Jaulas `J002`, `J001` activas e `J003` inactiva | Listar Activas | Solo `J001`, `J002` en ese orden (`ORDER BY codigo`), cada una con los campos de `obtenerJaulas` y `cantidad_aves` | `JaulaRepository.js:7-37` |
| PAR-JAU-008 | Jaula activa con 2 aves `ACTIVA` y 1 `VENDIDA` asignadas | Listar Activas | `cantidad_aves = 2` (solo ACTIVA); badge "Ocupada" y "🐔 2 aves" | `JaulaRepository.js:17-22`; `JaulaCard.js:21-28,102-108` |
| PAR-JAU-009 | Jaula activa sin aves | Listar Activas | `cantidad_aves = 0`; badge "Vacía", "🐔 0 aves" | `JaulaRepository.js:17-22`; `JaulaCard.js:77-81,103-107` |
| PAR-JAU-010 | Ninguna jaula | Abrir Activas / Inactivas | "No tienes jaulas registradas" / "Crea tu primera jaula para comenzar a organizar las aves del criadero." / "No tienes jaulas inactivas" / "Las jaulas desactivadas aparecerán aquí y conservarán su historial." | `JaulasScreen.js:245-291` |
| PAR-JAU-011 | Jaulas inactivas A (desactivada hoy), B (desactivada ayer) | Listar Inactivas | A antes que B (`COALESCE(fecha_desactivacion, fecha_actualizacion, fecha_creacion) DESC`, luego `codigo`); `cantidad_aves` = aves distintas en su historial | `JaulaRepository.js:41-80` |
| PAR-JAU-012 | Jaula con estado sanitario `CUARENTENA` | Listar o abrir detalle | Etiqueta "Cuarentena" con el color de cuarentena; un valor desconocido o vacío se muestra "Normal" | `constants.js:115-128,133-153`; `JaulaCard.js:31-34`; `DetalleJaulaScreen.js:657-660,1008-1045` |
| PAR-JAU-013 | Jaula activa con aves ACTIVA y una VENDIDA asignadas | Abrir `DetalleJaula` | La lista muestra solo las ACTIVA (contador "{n} ave(s)"), con "Quitar" por ave; sin aves: "Jaula vacía" / "No existen aves asignadas actualmente a esta jaula." | `AveRepository.js:62-96`; `DetalleJaulaScreen.js:1069-1081,1117-1153` |
| PAR-JAU-014 | Jaula activa `J001` | Editar código a `J002` ya existente | Alert "Código duplicado" / "Ya existe una jaula con ese código."; la edición no se guarda | `DetalleJaulaScreen.js:439-456` |
| PAR-JAU-015 | Jaula activa `J001` | Editar: código sin cambio (mismo) y otro nombre | Se guarda (el propio código no es duplicado) y `fecha_actualizacion` cambia; Alert "Jaula actualizada" / "Los datos de la jaula fueron actualizados correctamente." | `JaulaRepository.js:201-219`; `DetalleJaulaScreen.js:395-426` |
| PAR-JAU-016 | Jaula activa con tipo `Postura` | Editar y dejar el tipo vacío; o escribir "Aviario" | Vacío -> `tipo=NULL` ("Sin tipo"); "Aviario" se acepta (texto libre) | `DetalleJaulaScreen.js:873-887,1001-1003`; `JaulaRepository.js:216` |
| PAR-JAU-017 | Edición | Código vacío o solo espacios | Alert "Código requerido" / "Ingresa un código para la jaula."; no se escribe | `DetalleJaulaScreen.js:372-385` |
| PAR-JAU-018 | `jaulaId` inexistente | Abrir `DetalleJaula` o `DetalleJaulaInactiva` | "Jaula no encontrada." | `DetalleJaulaScreen.js:632-654`; `DetalleJaulaInactivaScreen.js:135-143` |
| PAR-JAU-019 | Jaula activa vacía | Eliminar (confirmar) | `activa=0`, `fecha_desactivacion` = ahora ISO, `fecha_actualizacion` cambia; sin eventos de historial; Alert "Jaula eliminada" / "La jaula fue eliminada correctamente."; sale de Activas y entra en Inactivas | `JaulaRepository.js:371-392`; `DetalleJaulaScreen.js:551-571` |
| PAR-JAU-020 | Jaula activa `J001` con 2 aves ACTIVA | Eliminar (confirmar) | Ambas con `jaula_actual_id=NULL` y `fecha_actualizacion`; por cada ave `ave_historial` `CAMBIO_JAULA` (`jaula_id` NULL, "La jaula J001 fue eliminada. El ave quedó sin jaula asignada.") y `jaula_historial` `SALIDA_AVE` ("Ave {codigo} salió de la jaula porque la jaula fue eliminada."); devuelve `{ cantidadAvesLiberadas: 2 }`; Alert "La jaula fue eliminada y 2 aves quedaron sin jaula."; la confirmación decía "Las 2 aves asignadas serán retiradas y quedarán sin jaula." | `JaulaRepository.js:278-392`; `DetalleJaulaScreen.js:485-494,545-559` |
| PAR-JAU-021 | Jaula con 1 ave ACTIVA y 1 `VENDIDA` asignadas | Eliminar | Las dos quedan con `jaula_actual_id=NULL` y con sus eventos; `cantidadAvesLiberadas = 2`; la confirmación decía "El ave asignada será retirada…" (contaba solo la ACTIVA, `aves.length = 1`) | `JaulaRepository.js:278-295,357-368`; `DetalleJaulaScreen.js:485-494` (hallazgo 7) |
| PAR-JAU-022 | Jaula con 1 ave asignada | Eliminar | Alert "Jaula eliminada" / "La jaula fue eliminada y el ave asignada quedó sin jaula." | `DetalleJaulaScreen.js:555-559` |
| PAR-JAU-023 | Jaula ya inactiva | `desactivarJaula(id)` otra vez (solo repositorio; la UI no lo ofrece) | No escribe nada; devuelve `{ cantidadAvesLiberadas: 0 }` | `JaulaRepository.js:267-275,390-392` |
| PAR-JAU-024 | `id` inexistente | `desactivarJaula(id)` | Error `JAULA_NO_ENCONTRADA`; pantalla: "Error" / "No fue posible eliminar la jaula." | `JaulaRepository.js:258-264`; `DetalleJaulaScreen.js:574-587` |
| PAR-JAU-025 | Jaula inactiva con historial de 3 aves distintas (una con 2 eventos) | Abrir `DetalleJaulaInactiva` | "Aves que estuvieron aquí" lista 3 aves distintas por código; "Historial" lista todos los eventos por `fecha DESC, id DESC` con "Ave: {codigo}" si hay ave; sin acciones de edición | `JaulaRepository.js:85-139`; `DetalleJaulaInactivaScreen.js:198-300` |
| PAR-JAU-026 | Jaula inactiva sin eventos | Abrir `DetalleJaulaInactiva` | "No hay aves registradas en el historial de esta jaula." y "La jaula no tiene eventos registrados." | `DetalleJaulaInactivaScreen.js:208-214,267-273` |
| PAR-JAU-027 | Jaula con eventos `INGRESO_AVE`, `SALIDA_AVE`, `ALIMENTACION`, `BEBIDA`, `SANIDAD` | Abrir `HistorialJaula` | Se muestran todos por `fecha DESC, id DESC` con `tipo_evento` en bruto, fecha local y `detalle`; sin jaula: "La jaula todavía no tiene eventos registrados." | `HistorialRepository.js:41-66`; `HistorialJaulaScreen.js:72-106` |
| PAR-JAU-028 | Ave ACTIVA sin jaula; jaula activa | Asignar desde `SeleccionarAveJaula` (confirmar "Agregar") | Ver PAR-AVE-024 en `aves.md`; Alert "Ave asignada" / "El ave {codigo} ahora pertenece a la jaula {jaulaCodigo}." | `SeleccionarAveJaulaScreen.js:120-207`; `AveRepository.js:1555-1716` |
| PAR-JAU-029 | Ave ACTIVA en `J1` | Abrir `SeleccionarAveJaula` de `J1` | El ave **no** aparece en la lista (candidatas: sin jaula o con jaula distinta); si no queda ninguna: "No hay aves disponibles" / "Todas las aves activas ya pertenecen a esta jaula o no existen más aves registradas." | `AveRepository.js:122-130`; `SeleccionarAveJaulaScreen.js:297-333` |
| PAR-JAU-030 | Ave ACTIVA en `J1`, `J2` activa | Asignar a `J2` (confirmar "Mover") | Ver PAR-AVE-025: `SALIDA_AVE` en `J1`, `INGRESO_AVE` en `J2` | `SeleccionarAveJaulaScreen.js:120-188`; `AveRepository.js:1597-1711` |
| PAR-JAU-031 | Ave VENDIDA o FALLECIDA | Abrir `SeleccionarAveJaula` o la jaula que conserva | No aparece como candidata ni en la lista de la jaula (solo ACTIVA); conserva su `jaula_actual_id` hasta que la jaula se desactive | `AveRepository.js:85-87,122-124`; `aves.md` sección g |
| PAR-JAU-032 | Ave ACTIVA en `J1` | Quitar desde `DetalleJaula` (confirmar "Quitar") | Ver PAR-AVE-026; Alert "Ave retirada" / "El ave {codigo} quedó sin jaula asignada." y la lista se recarga | `DetalleJaulaScreen.js:231-296` |
| PAR-JAU-033 | Aves sin jaula y con jaula | Abrir el selector de jaula del alta de ave | Lista solo jaulas activas `{ id, codigo, nombre }` ordenadas por código, más "Sin jaula" | `AveRepository.js:622-643`; `NuevaAveScreen.js:2392-2470` |
| PAR-JAU-034 | Jaula activa con aves ACTIVA | Dashboard | `ocupadas` cuenta la jaula una sola vez; `total` = jaulas activas; porcentaje con dos decimales (0 si `total = 0`) | `DashboardRepository.js:157-185,450-471` (módulo dashboard) |

## Diferencias deliberadas

Estados: "aprobada" = cubierta por una decisión explícita del usuario (sección "Decisiones aprobadas"); "propuesta" = sin decisión explícita.

| ID | Diferencia | Motivo | Estado |
|---|---|---|---|
| D-01 | V2 requiere conexión | Online-first, D1 como fuente de verdad | aprobada por el usuario |
| D-02 | Pantallas con estados de carga y de error de red | Consecuencia de D-01 | aprobada por el usuario |
| P-01 | IDs `TEXT` UUID v7 en lugar de `INTEGER AUTOINCREMENT` (jaulas y `jaula_historial`) | Decisión vigente de V2 (CLAUDE.md) | aprobada (convención de IDs, decisión A-3) |
| P-02 | `deleted_at` y `version` (concurrencia optimista, `JAULA_CONCURRENCY_CONFLICT`); V1 no tiene ninguno. `deleted_at` queda sin uso en jaulas: "eliminar" desactiva con `activa = 0` (sin hard delete) | Convención V2; la baja es lógica, igual que V1 | aprobada (soft delete y `version`, decisión A-3); nombre del código de error y uso de `version` en DELETE, propuestos (RJ-P8) |
| P-03 | Fechas de negocio `YYYY-MM-DD` y marcas de tiempo ISO 8601 UTC únicas, zona `America/Guayaquil`; V1 mezcla `CURRENT_TIMESTAMP` (`YYYY-MM-DD HH:MM:SS`) y ISO UTC | Un formato canónico | aprobada (decisión A-3) |
| P-04 | `jaula_historial` se crea en la migración `0006` (con `aves`, `ave_evolucion`, `ave_historial`), no en `0005`; en `0005` solo `jaulas`. FK reales con `ON DELETE RESTRICT` (V1: `ON DELETE CASCADE` hacia `jaulas`, sin acción hacia `aves`) | `jaula_historial` referencia `aves`; integridad referencial | aprobada (decisión A-1; `RESTRICT` por aves R-P10) |
| P-05 | El servidor aplica las validaciones que V1 tiene solo en pantalla (código obligatorio y con longitud máxima, unicidad con código de error propio, tipo) | En V2 el cliente no es de confianza | propuesta |
| P-06 | Editar y desactivar una jaula inactiva se rechaza con `JAULA_NOT_ACTIVE` (400) (V1: `actualizarJaula` no comprueba estado; la UI no lo permite) | Servidor más estricto cuando V1 dependía solo de la pantalla | propuesta (el código y el HTTP son los aprobados para aves; aplicarlo a editar/desactivar no está decidido, RJ-P5) |
| P-07 | Jaula inexistente -> `JAULA_NOT_FOUND` (404) en editar y desactivar (V1: `actualizarJaula` es un `UPDATE` sin efecto; `desactivarJaula` lanza `JAULA_NO_ENCONTRADA` que la pantalla muestra como error genérico) | Contrato HTTP estable | propuesta |
| P-08 | El servidor lee las aves de la jaula y escribe todas las filas de `ave_historial`/`jaula_historial` en una sola operación atómica (`db.batch`); V1 usa `withTransactionAsync` | D1 | propuesta |
| P-09 | El historial se sirve en un solo endpoint con `aveCodigo` y `createdAt` (V1 tiene dos consultas: `obtenerHistorialCompletoJaula` con `ave_codigo`, `obtenerHistorialJaula` con `fecha_creacion`); desempate adicional `created_at DESC` antes de `id DESC` (con UUID v7 `id` no refleja el orden de inserción dentro del mismo milisegundo) | Evitar dos endpoints casi idénticos; estabilidad del orden | propuesta |
| P-10 | CHECK en `estado_sanitario` (5 valores), `activa` (0/1) y `tipo_evento` (5 valores); V1 sin CHECK | Integridad (V1 se comporta como si fueran cerrados; coherente con P-05 de aves) | propuesta |
| P-11 | Textos de `DetalleJaulaInactivaScreen` corregidos (V1 los tiene corruptos, hallazgo 6) | Defecto de codificación de V1; el texto previsto es claro | propuesta |
| P-12 | Unicidad del código por criadero (`criadero_id, codigo`) entre jaulas no eliminadas; V1 es global en una base. Las jaulas inactivas **siguen reservando** el código, como V1 | Modelo `users 1—N criaderos`; paridad con V1 | propuesta |
| P-13 | La API devuelve el listado de aves actuales e históricas de una jaula con endpoints propios (V1 las obtiene de `AveRepository`/`JaulaRepository` desde cada pantalla) | La app ya no accede a tablas; el análisis V1 no mapea estas dos funciones | propuesta (RJ-P6) |

## Endpoints V2

Propuesta; no hay endpoints de jaulas implementados hoy en `api/` (CLAUDE.md: pendiente). Todos bajo `/api/v1/criaderos/:criaderoId/jaulas`, JWT (`Authorization: Bearer`) y ownership: el criadero debe ser del usuario autenticado (`criaderos.id = ? AND user_id = ? AND deleted_at IS NULL`); si no es propietario `403 FORBIDDEN`, si no existe `404 CRIADERO_NOT_FOUND`, como `criaderos.routes.ts:72,125,184` y `criaderos.service.ts:178,345,356,574`. Todo `jaulaId` debe pertenecer a ese `criaderoId` (si no, `JAULA_NOT_FOUND`; no se filtra información de otro criadero). Éxito `{ success: true, data }`; error `{ success: false, error, message }` (opcional `missingFields`). camelCase. Estilo de estados: 400 `VALIDATION_ERROR`/`JAULA_NOT_ACTIVE`, 404 no encontrado, 409 conflicto (sin 422), como en la spec de aves.

Mapeo V1 -> V2 (análisis V1, `:732-735,775-784`): `obtenerJaulas`/`obtenerJaulasInactivas` -> `GET /jaulas`; `obtenerJaulaPorId` -> `GET /jaulas/:jaulaId`; `crearJaula` -> `POST /jaulas`; `actualizarJaula` -> `PUT /jaulas/:jaulaId`; `desactivarJaula` -> `DELETE /jaulas/:jaulaId`; `obtenerHistorialCompletoJaula`/`obtenerHistorialJaula` -> `GET /jaulas/:jaulaId/historial`. `obtenerAvesPorJaula` y `obtenerAvesHistoricasJaula` no figuran en el mapeo del análisis: se proponen `GET /jaulas/:jaulaId/aves` (RJ-P6). `obtenerJaulasActivas` (selector del alta de ave) se cubre con `GET /jaulas?estado=ACTIVA`.

Equivalencia de errores V1 -> V2:

| V1 | V2 | HTTP |
|---|---|---|
| UNIQUE `jaulas.codigo` (mensaje de SQLite, mapeado en pantalla a "Código duplicado") | `CODIGO_JAULA_DUPLICADO` (propuesta) | 409 |
| `JAULA_NO_ENCONTRADA` / jaula inexistente / "Jaula no encontrada." | `JAULA_NOT_FOUND` (propuesta) | 404 |
| editar o desactivar jaula inactiva (nuevo) | `JAULA_NOT_ACTIVE` (aprobado el código y el HTTP) | 400 |
| validaciones solo de pantalla (código vacío, longitud, tipo) | `VALIDATION_ERROR` con el mensaje de V1 | 400 |
| versión desactualizada (nuevo) | `JAULA_CONCURRENCY_CONFLICT` (propuesta, patrón `*_CONCURRENCY_CONFLICT`) | 409 |

### GET `/api/v1/criaderos/:criaderoId/jaulas`

- Equivale a `obtenerJaulas` y `obtenerJaulasInactivas`. Query: `estado` = `ACTIVA` (por defecto) o `INACTIVA`. Se devuelve la lista completa; sin paginación ni filtros de servidor (V1 no los tiene).
- `ACTIVA`: `activa = 1`, orden `codigo` ascendente; `data.jaulas[]`: `id, codigo, nombre, ubicacion, tipo, estadoSanitario, activa, createdAt, cantidadAves` (aves `ACTIVA` asignadas, `JaulaRepository.js:7-37`). `INACTIVA`: `activa = 0`, orden `COALESCE(fechaDesactivacion, updatedAt, createdAt) DESC, codigo`; añade `updatedAt` y `fechaDesactivacion`; `cantidadAves` = aves distintas en su historial (V1, hallazgo 8; RJ-P12 decide si se conserva el nombre y la lectura).
- Errores: 400 `VALIDATION_ERROR` (`estado` inválido), 401, 403 `FORBIDDEN`, 404 `CRIADERO_NOT_FOUND`.

### GET `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId`

- Equivale a `obtenerJaulaPorId` (cualquier estado). `data.jaula`: `id, codigo, nombre, ubicacion, tipo, estadoSanitario, activa, createdAt, updatedAt, fechaDesactivacion, version`. La app decide la pantalla por `activa`.
- Errores: 404 `JAULA_NOT_FOUND`, 404 `CRIADERO_NOT_FOUND`, 401, 403.

### POST `/api/v1/criaderos/:criaderoId/jaulas`

- Request `{ codigo, nombre?, ubicacion?, tipo? }`. Todos texto; `codigo` obligatorio tras `trim`; `nombre`, `ubicacion`, `tipo` con `trim` y vacío -> `null`. `userId` no va en el body. `estadoSanitario` no se acepta (nace `NORMAL`); `activa` nace en 1; no se acepta `criaderoId` en el body.
- Validaciones: las de "Validaciones en pantalla" (código obligatorio, longitud y tipo según decisiones RJ-P1 a RJ-P3, unicidad por criadero entre todas las jaulas, incluidas inactivas).
- Efectos: inserta la fila (`version = 1`); no escribe historial (V1 tampoco).
- Respuesta 201 `{ success: true, data: { jaula } }`. Errores: `VALIDATION_ERROR`, `CODIGO_JAULA_DUPLICADO`, 401, 403, `CRIADERO_NOT_FOUND`.

### PUT `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId`

- Request `{ codigo, nombre?, ubicacion?, tipo?, version }` (los cuatro campos de `actualizarJaula`; no cambia `estadoSanitario` ni `activa`). Mismas validaciones y normalizaciones que el alta, con la unicidad excluyendo la propia jaula.
- Efectos: `UPDATE ... WHERE id = ? AND criadero_id = ? AND version = ?`, `version + 1`, `updated_at`. No escribe historial.
- Respuesta 200 `{ success: true, data: { jaula } }`. Errores: `VALIDATION_ERROR`, `JAULA_NOT_FOUND`, `JAULA_NOT_ACTIVE` (P-06), `CODIGO_JAULA_DUPLICADO`, `JAULA_CONCURRENCY_CONFLICT`, 401, 403, `CRIADERO_NOT_FOUND`.

### DELETE `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId`

- Equivale a `desactivarJaula`: baja lógica (no hard delete). Una sola operación atómica (`db.batch`), con las reglas de V1: lee **todas** las aves con `jaula_actual_id = :jaulaId` sin filtrar estado (incluso `VENDIDA`/`FALLECIDA`, decisión A-2); por cada una `ave_historial` `CAMBIO_JAULA` (`jaula_id` null, "La jaula {codigo} fue eliminada. El ave quedó sin jaula asignada.") y `jaula_historial` `SALIDA_AVE` ("Ave {codigo} salió de la jaula porque la jaula fue eliminada."); pone `jaula_actual_id = NULL` (`version + 1`, `updated_at` en aves) y `activa = 0`, `fecha_desactivacion` = ahora ISO UTC, `updated_at`, `version + 1` en la jaula. Una sola marca de tiempo para todos los eventos.
- Respuesta 200 `{ success: true, data: { cantidadAvesLiberadas } }`. Si la jaula ya estaba inactiva: V1 es idempotente (200 con `0`); V2 propone lo mismo por paridad o rechazar con `JAULA_NOT_ACTIVE` (RJ-P5). Errores: `JAULA_NOT_FOUND` (404), `JAULA_CONCURRENCY_CONFLICT` si se exige `version` (RJ-P8), 401, 403, `CRIADERO_NOT_FOUND`.
- Depende de `aves`, `ave_historial` y `jaula_historial` (migración `0006`): el endpoint solo puede implementarse completo cuando existan esas tablas (ver Modelo D1).

### GET `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/aves` (ruta PROPUESTA, RJ-P6)

- Equivale a `obtenerAvesPorJaula` (por defecto) y a `obtenerAvesHistoricasJaula` (`?alcance=historicas`). Actuales: aves `ACTIVA` con `jaula_actual_id = :jaulaId`, orden `codigo`; `data.aves[]`: `id, codigo, origen, fechaNacimiento, raza, caracteristicas, fotoKey, jaulaId, estado`. Históricas: aves distintas con evento en `jaula_historial` de la jaula, orden `codigo`; `data.aves[]`: `id, codigo, raza, sexo, estado, fotoKey`. El campo de foto se define en la fase de R2 (aves R-P12: mientras tanto opcional).
- Errores: `JAULA_NOT_FOUND`, 400 `VALIDATION_ERROR` (`alcance`), 401, 403, `CRIADERO_NOT_FOUND`.
- `GET /aves?disponiblesParaJaula=:jaulaId` (candidatas a asignar) lo define la spec de aves.

### GET `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/historial`

- Equivale a `obtenerHistorialCompletoJaula` y `obtenerHistorialJaula` (P-09). Todos los tipos de evento de `jaula_historial` de la jaula (`INGRESO_AVE`, `SALIDA_AVE`, `ALIMENTACION`, `BEBIDA`, `SANIDAD`), orden `fecha DESC, created_at DESC, id DESC`.
- `data.eventos[]`: `id, jaulaId, aveId, aveCodigo (null si no hay ave), tipoEvento, fecha, detalle, createdAt`.
- Errores: `JAULA_NOT_FOUND`, 401, 403, `CRIADERO_NOT_FOUND`. Sirve tanto a `HistorialJaula` (activa) como a `DetalleJaulaInactiva`.
- La escritura de eventos `ALIMENTACION`, `BEBIDA` y `SANIDAD` la hacen los endpoints de cuidados de jaula (spec `cuidados-jaula.md`); `INGRESO_AVE`/`SALIDA_AVE` por alta de ave, cambio de jaula (spec de aves) y por `DELETE` de la jaula (aquí).

Dependencias entre módulos: este módulo se implementa **antes** que Aves (decisión A-1). `aves.jaula_actual_id` tendrá FK a `jaulas(id)` con `ON DELETE RESTRICT`. Las reglas de rechazo de jaula inactiva en el alta de ave y en el cambio de jaula (`JAULA_NOT_ACTIVE`, 400) y de cambio/quitar solo a aves `ACTIVA` (`AVE_NOT_ACTIVE`, 409) viven en la spec de aves.

## Modelo D1

PROPUESTA derivada del código V1. **Las migraciones aún no se crean.** Estado actual en D1 (`api/migrations/0001`-`0004`): `users`, `criaderos`, `catalogos`, `catalogo_items` (con `criadero_id`), `criadero_configuracion`; no existen `jaulas`, `aves` ni historiales. Orden aprobado (decisión A-1): `0005` = **solo `jaulas`**; `0006` = `aves`, `ave_evolucion`, `ave_historial` y `jaula_historial`. Convenciones de `.claude/rules/api-migraciones-d1.md` y de `0001_core_schema.sql` (`CHECK (x IN (0,1))`, `FOREIGN KEY ... ON DELETE RESTRICT ON UPDATE RESTRICT`, índices `ix_`/`ux_`, índice único parcial con `WHERE deleted_at IS NULL`).

### Tabla `jaulas` (migración `0005_<descripción>.sql`, propuesta)

| Columna | Tipo | Regla | Origen V1 |
|---|---|---|---|
| id | TEXT PRIMARY KEY NOT NULL | UUID v7 | `id` INTEGER |
| criadero_id | TEXT NOT NULL | FK `criaderos(id)` ON DELETE RESTRICT ON UPDATE RESTRICT | nuevo |
| codigo | TEXT NOT NULL | `trim`; único por criadero entre filas no eliminadas (índice parcial); longitud y mayúsculas por decidir (RJ-P1, RJ-P2) | `codigo` |
| nombre | TEXT | `trim`, vacío -> NULL | `nombre` |
| ubicacion | TEXT | `trim`, vacío -> NULL | `ubicacion` |
| tipo | TEXT | `trim`, vacío -> NULL; valores por decidir (RJ-P3) | `tipo` |
| estado_sanitario | TEXT NOT NULL DEFAULT 'NORMAL' | CHECK IN ('NORMAL','LIMPIEZA','FUMIGACION','QUEMADURA','CUARENTENA') (P-10, propuesta); lo escribe el módulo de cuidados de jaula, este módulo solo lo inicializa | `estado_sanitario` |
| activa | INTEGER NOT NULL DEFAULT 1 | CHECK (activa IN (0, 1)) | `activa` |
| fecha_desactivacion | TEXT | ISO 8601 UTC; NULL mientras `activa = 1` | `fecha_desactivacion` |
| created_at, updated_at | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | convención D1 (formato por decidir en la API, aves R-P3a) | `fecha_creacion`, `fecha_actualizacion` |
| deleted_at | TEXT | soft delete; **sin uso funcional** en jaulas (la baja es `activa = 0`) | nuevo |
| version | INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1) | concurrencia | nuevo |

Índices propuestos: `ux_jaulas_codigo_activo ON jaulas(criadero_id, codigo) WHERE deleted_at IS NULL` (equivale a la unicidad global de V1 porque una jaula desactivada **no** pone `deleted_at`, así que su código sigue reservado); `ix_jaulas_criadero_activa (criadero_id, activa, deleted_at)`; `ix_jaulas_criadero_id (criadero_id)` si no se cubre con el anterior.

Notas: V1 no tiene `capacidad` (hallazgo 4): no se crea. `fecha_desactivacion` conserva el nombre de V1 en español; el nombre definitivo de las columnas de dominio y de `activa` (frente a `deleted_at`) se confirma con RJ-P10.

### Tabla `jaula_historial` (migración `0006`, propuesta; **no** va en `0005`)

| Columna | Tipo | Regla | Origen V1 |
|---|---|---|---|
| id | TEXT PRIMARY KEY NOT NULL | UUID v7 | `id` INTEGER |
| criadero_id | TEXT NOT NULL | FK `criaderos(id)` RESTRICT | nuevo |
| jaula_id | TEXT NOT NULL | FK `jaulas(id)` ON DELETE RESTRICT (V1: CASCADE) | `jaula_id` |
| ave_id | TEXT | FK `aves(id)` ON DELETE RESTRICT; NULL en eventos de cuidado | `ave_id` |
| tipo_evento | TEXT NOT NULL | CHECK IN ('INGRESO_AVE','SALIDA_AVE','ALIMENTACION','BEBIDA','SANIDAD') (P-10, propuesta) | `tipo_evento` |
| fecha | TEXT NOT NULL | ISO 8601 UTC (V1: ISO UTC en todas las escrituras de este módulo: `AveRepository.js:1566-1568`, `JaulaRepository.js:229-231`; para cuidados la fecha la aporta la pantalla correspondiente) | `fecha` |
| detalle | TEXT | textos de V1 (secciones f y e) | `detalle` |
| created_at | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | convención | `fecha_creacion` |

El historial es de solo inserción (V1 nunca actualiza ni borra filas): sin `updated_at`, `deleted_at` ni `version` salvo que se decida otra cosa (RJ-P10). Índices propuestos: `ix_jaula_historial_jaula (criadero_id, jaula_id, fecha DESC)` (reemplaza `idx_jaula_historial_jaula`), `ix_jaula_historial_ave (ave_id)`.

Consistencia de `criadero_id`: las FK simples no garantizan que `jaula_id`/`ave_id` pertenezcan al mismo criadero que la fila; el servicio debe validarlo (patrón `ITEM_WRONG_CRIADERO` en `criaderos.service.ts`). `aves.jaula_actual_id`: FK `jaulas(id)` `ON DELETE RESTRICT` (en la migración `0006`, definida en la spec de aves).

V2 empieza sin datos de usuario: no hay importación ni mapeo de IDs V1 -> UUID (reglas cerradas heredadas de aves, R-C4 y R-C5).

## Decisiones aprobadas por el usuario (2026-10-29)

Todas las filas tienen estado "aprobada por el usuario, 2026-10-29".

| ID | Decisión | Estado |
|---|---|---|
| A-1 | Orden de migraciones: `0005` = **solo jaulas**; `0006` = `aves`, `ave_evolucion`, `ave_historial` y `jaula_historial` (`jaula_historial` referencia `aves`, por eso va después). Jaulas se implementa antes que Aves; `aves.jaula_actual_id` tendrá FK real con `ON DELETE RESTRICT`. (Las migraciones aún no se crean.) | aprobada por el usuario, 2026-10-29 |
| A-2 | La baja de ave no libera la jaula, como V1; `desactivarJaula` sí libera **todas** las aves de la jaula, incluso vendidas y fallecidas, como V1. Se rechaza una jaula inactiva en el alta de ave y en el cambio de jaula con `JAULA_NOT_ACTIVE` (HTTP 400, patrón de `ITEM_NOT_ACTIVE`); cambiar o quitar jaula solo a aves `ACTIVA` (`AVE_NOT_ACTIVE`, 409). Estas dos últimas reglas viven en la spec de aves; aquí son dependencia. | aprobada por el usuario, 2026-10-29 |
| A-3 | Fechas de negocio `YYYY-MM-DD` y marcas de tiempo ISO UTC; zona `America/Guayaquil`. IDs UUID v7, soft delete (`deleted_at`) y `version` (convención V2). | aprobada por el usuario, 2026-10-29 |

## Reglas abiertas

### Resolubles leyendo código

- **RJ-L1 (cerrada: 2026-10-29) Discrepancia sobre `HistorialRepository` y `DetalleJaulaScreen`.** El análisis V1 dice que `DetalleJaulaScreen` usa `HistorialRepository` (`CriaderoKikirikis_V1_Analisis_Movil_y_Mapeo_API.md:382`), pero no lo importa (`DetalleJaulaScreen.js:22-31`). Quien lo importa: `HistorialJaulaScreen.js:17-19` (lee `obtenerHistorialJaula`) y tres repositorios que escriben vía `registrarHistorialJaula` (`AlimentacionRepository.js:4,73`, `BebidaRepository.js:4,74`, `SanidadJaulaRepository.js:4,51`). Búsqueda sin límite en todo `src/`. `DetalleJaulaScreen` solo navega a `HistorialJaula` (`:1370-1377`).
- **RJ-L2 (cerrada: 2026-10-29) Quién escribe `jaula_historial` y con qué tipos.** `AveRepository.crearAve` (`:937`, `INGRESO_AVE`), `AveRepository.cambiarJaulaAve` (`:1656` `SALIDA_AVE`, `:1688` `INGRESO_AVE`), `JaulaRepository.desactivarJaula` (`:331`, `SALIDA_AVE`), `HistorialRepository.registrarHistorialJaula` (`:19`) llamado por alimentación (`ALIMENTACION`), bebida (`BEBIDA`) y sanidad (`SANIDAD`). Búsqueda sin límite de `jaula_historial` y de `registrarHistorialJaula`. `SanidadJaulaRepository` además escribe `jaulas.estado_sanitario` y `fecha_actualizacion` (`:39-49`). Corrige `aves.md:98` (solo cita dos tipos).
- **RJ-L3 (cerrada: 2026-10-29) ¿La UI impide `anterior == nueva` al cambiar de jaula?** Sí, por construcción: la lista de `SeleccionarAveJaulaScreen` es `obtenerAvesParaAsignarJaula(jaulaId)`, que excluye las aves con `jaula_actual_id = jaulaId` (`AveRepository.js:122-128`; texto del vacío `SeleccionarAveJaulaScreen.js:330`), y `quitarAve` envía `nuevaJaulaId = null` (`DetalleJaulaScreen.js:281-282`). `cambiarJaulaAve` no valida nada (`AveRepository.js:1555-1716`) y las pantallas no comparan los ids. Solo una lista desactualizada podría producir `anterior == nueva`. Efecto de que llegue: ver sección e. La decisión de rechazo es RJ-P4.
- **RJ-L4 (cerrada: 2026-10-29) `BajaAveRepository` no toca la jaula.** Búsqueda `jaula` sin distinguir mayúsculas y sin límite: 0 coincidencias. Las aves VENDIDA/FALLECIDA conservan `jaula_actual_id` (decisión A-2).
- **RJ-L5 (cerrada: 2026-10-29) Capacidad de jaula.** 0 coincidencias de `capacidad` en `src/` (búsqueda sin límite). V2 no la implementa.
- **RJ-L6 (cerrada: 2026-10-29) Reactivación de jaulas.** `activa` solo se pone a 0 (`JaulaRepository.js:375`); no existe operación inversa (búsqueda sin límite de `activa\s*=`, `fecha_desactivacion`, `reactivar`). V2 no la implementa.
- **RJ-L7 (cerrada: 2026-10-29) Quién escribe `jaulas.estado_sanitario`.** `crearJaula` lo inicializa en `'NORMAL'` (`JaulaRepository.js:177`) y `SanidadJaulaRepository.registrarSanidadJaula` lo cambia (`:37-49`, `normalizarEstado` `:62-84`: `Normal`, `Limpieza`, `Fumigación`, `Quemadura`, `Cuarentena`, cualquier otro -> `NORMAL`). Se especifica en `cuidados-jaula.md`.
- **RJ-L8 (cerrada: 2026-10-29) Pantallas de alimentación, bebida y sanidad sobre jaulas inactivas.** Las tres pantallas solo se abren desde `DetalleJaulaScreen` (jaula activa): `navigate('AlimentacionJaula')` en `DetalleJaulaScreen.js:1297`, `BebidaJaula` en `:1322` y `SanidadJaula` en `:1347`; búsqueda sin límite de esos nombres en `DetalleJaulaInactivaScreen.js` y `JaulasScreen.js`: sin coincidencias. Los repositorios no comprueban que la jaula esté activa (ver `cuidados-jaula.md`). En V2 el servidor rechaza escrituras de cuidados sobre una jaula inactiva (`JAULA_NOT_ACTIVE`, diferencia propuesta en `cuidados-jaula.md`).
- **RJ-L9 (cerrada: 2026-10-29, verificada con git y bytes) Texto corrupto de `DetalleJaulaInactivaScreen`.** El archivo contiene los caracteres corruptos literales: p. ej. `DetalleJaulaInactivaScreen.js:170` guarda `est谩` (bytes UTF-8 `e8 b0 a9`, `谩`) en lugar de `á`. Solo un commit toca el archivo (`4a8cc6c`, v1.0.0) y es idéntico en v1.0.3, así que no existe otra versión sana en git. Se mostraría tal cual en el dispositivo (inferencia, sin probar en dispositivo). Ver RJ-P13.
- **RJ-L10 (cerrada: 2026-10-29, verificada con git) Estado de la rama.** `git diff --stat v1.0.3 -- src` no devuelve diferencias: el árbol `src/` es idéntico al tag `v1.0.3`, por lo que las líneas citadas valen para v1.0.3.

### Decisión de producto

- **RJ-P1 Mayúsculas y unicidad del código de jaula.** V1 solo hace `trim` (hallazgo 5): `j1` y `J1` coexisten y el Alert de éxito muestra el código en mayúsculas aunque guarda el texto original. Las aves sí pasan a mayúsculas (`aves.md` sección c). Opciones: (a) replicar V1 (solo `trim`, unicidad sensible a mayúsculas); (b) normalizar a mayúsculas y comparar así (diferencia deliberada); (c) guardar tal cual pero unicidad insensible a mayúsculas.
- **RJ-P2 Longitud máxima del código.** V1: 20 en el alta (`NuevaJaulaScreen.js:183`) y 30 en la edición (`DetalleJaulaScreen.js:805`); el repositorio no limita. ¿Qué límite aplica el servidor (20, 30 u otro)? Con 20 una jaula existente editada con 30 no sería válida, pero en V2 empieza sin datos.
- **RJ-P3 Valores de `tipo`.** V1 ofrece cinco valores en el alta y texto libre en la edición (`:26-32` frente a `:873-887`); `tipo` puede ser `NULL`. Opciones: (a) texto libre, opcional (replica el repositorio); (b) lista cerrada de los cinco valores (también en edición); (c) catálogo configurable por criadero. ¿Se puede dejar vacío?
- **RJ-P4 `anterior == nueva` y quitar a un ave sin jaula (decidida por Claude el 2026-10-29 por criterio de paridad con servidor más estricto, aves R-P8a: el servidor rechaza con `VALIDATION_ERROR` 400 sin escribir nada; el usuario la revisa).** (Conecta con aves R-P8a.) V1 no valida (RJ-L3); la UI lo evita. Propuesta: el servidor rechaza un cambio a la misma jaula (`VALIDATION_ERROR` 400, sin escribir nada) y un "quitar jaula" de un ave que ya no tiene jaula (`VALIDATION_ERROR` o idempotente), porque V1 escribiría eventos espurios (`CAMBIO_JAULA` y `SALIDA_AVE`/`INGRESO_AVE` en la misma jaula). Opciones: (a) rechazar (propuesta); (b) tratarlo como éxito sin escribir nada (idempotente); (c) replicar V1 (escribir los eventos).
- **RJ-P5 Editar o desactivar una jaula ya inactiva.** V1: la UI no lo ofrece; `actualizarJaula` no valida estado y `desactivarJaula` es idempotente (200 con `0`). Propuesta: editar una inactiva -> `JAULA_NOT_ACTIVE` (400); desactivar una inactiva -> idempotente como V1 o `JAULA_NOT_ACTIVE`. Elegir.
- **RJ-P6 Rutas para las aves de una jaula.** `obtenerAvesPorJaula` y `obtenerAvesHistoricasJaula` no están en el mapeo del análisis V1. Propuesta de esta spec: `GET /jaulas/:jaulaId/aves` y `?alcance=historicas`. Alternativa: `GET /aves?jaulaId=:id` (en la spec de aves hoy solo existe `disponiblesParaJaula`) o incluir las aves en `GET /jaulas/:jaulaId`. Elegir y alinear con `aves.md`.
- **RJ-P7 Unificar o mantener separadas las dos consultas de historial.** V1 tiene `obtenerHistorialCompletoJaula` (con `ave_codigo`) y `obtenerHistorialJaula` (con `fecha_creacion`), mismo orden. Propuesta P-09: un solo endpoint con `aveCodigo` y `createdAt`. ¿Se acepta, y se añade el desempate `created_at` (UUID v7)?
- **RJ-P8 Código de error del código duplicado, concurrencia y `version` en DELETE.** Confirmar `CODIGO_JAULA_DUPLICADO` (409), `JAULA_NOT_FOUND` (404) y `JAULA_CONCURRENCY_CONFLICT` (409). ¿`DELETE` exige `version` (más seguro, pero V1 no la tiene) o no? Si no se exige, dos desactivaciones simultáneas se resuelven por la idempotencia (RJ-P5).
- **RJ-P9 Evento de la propia jaula al crearla o desactivarla.** V1 no escribe ninguno (solo `SALIDA_AVE` por ave al desactivar). Propuesta: replicar V1 (sin evento propio). Confirmar que no se añade (cualquier tipo nuevo exigiría ampliar el CHECK de `tipo_evento`).
- **RJ-P10 Modelo de "eliminar".** Propuesta: `activa` + `fecha_desactivacion` (nombres de V1) y `deleted_at` sin uso funcional. Alternativas: renombrar a una convención en inglés/otra (`desactivada_at`), o usar `deleted_at` para la desactivación (rompería la lista de Inactivas y el reservado del código). ¿Se aprueba la propuesta? Y `jaula_historial`: ¿lleva `updated_at`/`version`/`deleted_at` o solo `created_at`?
- **RJ-P11 CHECK de `estado_sanitario` y `tipo_evento`.** V1 sin CHECK (P-10). Los cinco valores de cada uno son todos los que escribe el código. ¿Se aprueban los CHECK o se validan solo en el servicio?
- **RJ-P12 `cantidadAves` en jaulas inactivas.** V1 devuelve aves distintas del historial, pero la tarjeta lo lee como ocupación ("Ocupada"/"N aves", hallazgo 8). Opciones: (a) replicar tal cual (nombre `cantidadAves`); (b) renombrar el campo (`cantidadAvesHistoricas`) y que la tarjeta de inactivas muestre "N aves en el historial" sin badge de ocupación (diferencia deliberada); (c) mostrar 0/ocultar.
- **RJ-P13 Textos corruptos de `DetalleJaulaInactivaScreen`.** V1 los muestra con mojibake (hallazgo 6). Propuesta P-11: corregirlos en la app V2 ("Esta jaula está desactivada. La información se conserva únicamente para consulta histórica.", "Información", "Código", "Ubicación", "Creación", "Desactivación", "Aves que estuvieron aquí", "Historial"). ¿Se aprueba?
- **RJ-P14 Formato de fecha en las listas.** V1 usa `toLocaleString()` del dispositivo sobre `fecha_creacion` (`YYYY-MM-DD HH:MM:SS` sin zona) y sobre ISO (`DetalleJaulaInactivaScreen.js:349-354`, `HistorialJaulaScreen.js:93-95`). V2 devuelve ISO UTC (A-3); ¿la app muestra en `America/Guayaquil` o en la zona del dispositivo?

## Criterios de terminado

- [ ] Endpoints de jaulas implementados bajo `/api/v1/criaderos/:criaderoId/jaulas`: `GET` lista (`estado=ACTIVA|INACTIVA`), `GET` detalle, `POST`, `PUT`, `DELETE` (desactivación), `GET .../aves` (ruta propuesta, RJ-P6) y `GET .../historial`; respuestas `{ success: true, data }` / `{ success: false, error, message }`.
- [ ] Orden de migraciones respetado (decisión A-1): migración `0005` crea **solo `jaulas`** y se aplica en local (`npx wrangler d1 migrations apply criadero-kikirikis-dev --local`) sin editar `0001`-`0004`; `jaula_historial` queda para `0006` junto con `aves`, `ave_evolucion` y `ave_historial`; `DELETE` y el historial se completan cuando exista `0006`. Jaulas implementada antes que Aves.
- [ ] Reglas de las aves coordinadas con `aves.md`: `aves.jaula_actual_id` con FK `ON DELETE RESTRICT`, rechazo de jaula inactiva (`JAULA_NOT_ACTIVE`, 400) y cambio/quitar solo a aves `ACTIVA` (`AVE_NOT_ACTIVE`, 409).
- [ ] Ownership probado: un usuario no accede a jaulas, aves ni historial de otro criadero (`FORBIDDEN` / `CRIADERO_NOT_FOUND` / `JAULA_NOT_FOUND`); toda consulta filtra por `criadero_id` y excluye `deleted_at`; `userId` nunca viene en el body.
- [ ] Los casos PAR-JAU-001 a PAR-JAU-034 pasando (los que dependen de aves, `ave_historial` y `jaula_historial` cuando exista `0006`), con los mensajes exactos de "Validaciones en pantalla".
- [ ] Diferencias deliberadas P-01 a P-13 aprobadas o resueltas (D-01, D-02 y las cubiertas por A-1, A-2 y A-3 ya aprobadas); reglas "Resolubles leyendo código" cerradas (RJ-L1 a RJ-L10) y "Decisión de producto" RJ-P1 a RJ-P14 decididas; estado de la spec `revisada` antes de implementar.
- [ ] Tests unitarios (servicio con fakes) con nombres `debe …`: debe rechazar código vacío; debe aplicar `trim` y vacío -> null en nombre, ubicación y tipo; debe rechazar un código duplicado en el mismo criadero (incluido el de una jaula inactiva); debe permitir el mismo código en otro criadero; debe desactivar una jaula vacía; debe liberar todas las aves de la jaula, incluidas vendidas y fallecidas, escribiendo `CAMBIO_JAULA` y `SALIDA_AVE` por cada una y devolver `cantidadAvesLiberadas`; debe devolver `JAULA_NOT_FOUND` con una jaula inexistente o de otro criadero; debe rechazar editar una jaula inactiva; debe ser idempotente o rechazar según RJ-P5 al desactivar una inactiva; debe rechazar con conflicto de versión; debe listar activas por código con `cantidadAves` solo de aves ACTIVA; debe listar inactivas por fecha de desactivación descendente.
- [ ] Tests HTTP (`UNAUTHORIZED`/`INVALID_TOKEN`, `FORBIDDEN`, `CRIADERO_NOT_FOUND`, `VALIDATION_ERROR`, `JAULA_NOT_FOUND`, `CODIGO_JAULA_DUPLICADO`, `JAULA_NOT_ACTIVE`, conflicto de versión) e integración D1 local (alta, unicidad parcial, desactivación atómica con las aves y los dos historiales, FK `RESTRICT`). `npm run test:integration` solo con confirmación del usuario.
- [ ] `npm run typecheck` sin errores; `git diff --check`; sin secretos ni datos reales de clientes; sin cambios en V1.
