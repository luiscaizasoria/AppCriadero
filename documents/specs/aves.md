# Spec: aves

> **Regla de paridad con V1.** V2 empieza sin datos de usuario, solo con catálogos. La V1 está probada y es el contrato: V2 reproduce exactamente lo que hace V1. Todo lo que V2 haga distinto es una **diferencia deliberada**: debe registrarse en la sección "Diferencias deliberadas" y estar aprobada por el usuario. Diferencias ya aceptadas: V2 requiere conexión y las pantallas necesitan estados de carga y de error de red.

## Estado

borrador

## Fuente V1

Alcance: aves individuales (sin lotes), sin sincronización offline, D1/R2 como fuente de verdad en V2. Todo sale del código de V1; las líneas son del árbol actual (versión de `app.json:5` = 1.0.3). El historial de git se consultó para `finalizarTratamiento` (ver sección l y R-L10).

Repositorios (`src/repositories/`), líneas exactas:

- `AveRepository.js`: `obtenerAves` 6-60, `obtenerAvesPorJaula` 62-96, `obtenerAvesParaAsignarJaula` 99-137, `obtenerAvePorId` 140-179, `obtenerAvesActivasParaPadres` 182-260, `obtenerIdsDescendientesRelaciones` (privada) 263-396, `validarRelacionPadres` (privada) 399-619, `obtenerJaulasActivas` 622-643, `existeAvePorCodigo` 646-720, `crearAve` 724-972, `actualizarAve` 975-1552, `cambiarJaulaAve` 1555-1716, `obtenerHistorialAve` 1719-1750, `obtenerAvesActivas` 1752-1756, `obtenerAvesVendidas` 1760-1826, `obtenerAvesFallecidas` 1828-1889, `obtenerBajaAve` 1891-1929.
- `EvolucionAveRepository.js`: `obtenerEvolucionAve` 6-41, `registrarEvolucionAve` 44-410 (+ helpers 413-543).
- `GenealogiaRepository.js`: `obtenerGenealogiaAve` 7-240, privadas `construirAncestros` 244-330, `agregarAncestro` 334-423, `construirDescendientes` 427-539, `registrarRelacionInvalida` 706-730, `mapearAve` 734-757.
- `CicloVidaRepository.js`: `obtenerCicloVidaAve` 6-728, `registrarEventoCicloVida` 731-767, `obtenerTituloHistorial` 867-901.
- `SaludRepository.js`: `obtenerEnfermedades` 7-46, `obtenerMedicamentos` 51-90, `registrarDiagnostico` 95-270, `obtenerHistorialSaludAve` 276-326, `actualizarEstadoSaludAve` 332-370.
- `BajaAveRepository.js`: `registrarMuerteAve` 7-129, `registrarVentaAve` 133-436, `obtenerBajasAve` 440-490, `normalizarCelular` 494-536, `numeroNoNegativo` 540-579.
- `JaulaRepository.js` (solo lo que toca aves): `obtenerJaulas` 3-39 (cuenta aves ACTIVA), `desactivarJaula` 223-394.
- `ConfiguracionRepository.js`: `obtenerCatalogos` 7-39, `obtenerCatalogoPorCodigo` 44-77, `obtenerItemsCatalogo` 82-130, `crearItemCatalogo` 135-198, `actualizarItemCatalogo` 203-246, `eliminarItemCatalogo` 251-279.
- `EstadoSaludRepository.js`: **no es un repositorio** (ver hallazgo 1).
- `HuevoRepository.js`: solo como dependiente de `ave_id` (líneas 71 y 95); no releído en esta pasada, pertenece al módulo huevos.

Pantallas y componentes: `src/screens/NuevaAveScreen.js` (alta y edición), `DetalleAveScreen.js`, `AvesScreen.js`, `GenealogiaAveScreen.js`, `EvolucionAveScreen.js`, `SaludAveScreen.js`, `FinalizarTratamientoScreen.js`, `SeleccionarAveJaulaScreen.js`, `DetalleJaulaScreen.js`, `BajaAveScreen.js`, `ConfiguracionScreen.js`, `CatalogoScreen.js`, `EditarCatalogoItemScreen.js`, `src/components/AveCard.js`, `src/components/SelectorCatalogo.js`. Navegación: `src/navigation/AvesStackNavigator.js:12,62-63` (`FinalizarTratamiento`). Servicio de imágenes: `src/services/ImageService.js` (`guardarFotoAve`, no releído en esta pasada).

Esquema (`src/database/`): `migrations.js` (V1: `aves` 42-85, `ave_evolucion` 88-106, `jaula_historial` 109-, `ave_historial` 133-, `diagnosticos_ave` 243-263, `tratamientos_ave` 266-289, `bajas_ave` 292-, índices 346-349), `migrationV2.js:6-12` (`estado_salud`, `fecha_ultimo_control_salud`), `migrationV3.js` (items de `RAZAS`), `migrationV4.js:6-19,29-63` (`sexo`, medidas, catálogo `SEXOS`), `migrationV5.js` (medidas en `ave_evolucion`), `seeders.js`, `sqlite.js:63` (`PRAGMA foreign_keys = ON`).

Contexto (no sustituye al código): `documents/CriaderoKikirikis_V1_Analisis_Movil_y_Mapeo_API.md`, `documents/V2_MODELO_DATOS.md` (DDL de aves borrador no aprobado), `api/migrations/0001`-`0004`.

## Comportamiento en V1

### Hallazgos que corrigen documentos y versiones previas de esta spec

1. **`EstadoSaludRepository.js` no es un repositorio.** Su único `export` es `export default function NuevaAveScreen` (`EstadoSaludRepository.js:48`, único `^export` del archivo); no exporta `finalizarTratamiento`. Es una copia antigua de la pantalla de alta de ave (importa `obtenerAvesActivasParaPadres`/`obtenerJaulasActivas`, líneas 26-27, 239-241). Ver sección "Finalizar tratamiento".
2. **`FinalizarTratamientoScreen.js:14-16` importa `{ finalizarTratamiento }` de ese archivo** y lo llama en `:68`. En el árbol actual esa función no existe. Búsqueda sin límite de `finalizarTratamiento` en todo el repo (excluyendo `node_modules` y `.git`): solo aparece en `FinalizarTratamientoScreen.js:15,68` y en documentos. No hay copia en otro lugar (ni bundles).
3. **`ENFERMA` nunca se escribe.** Búsqueda sin límite de `ENFERMA` en todo el repo fuera de `documents/` (incluye `src/database/` con migraciones y seeders, `api/`, `App.js`): solo hay lecturas, comparaciones y etiquetas, ver la sección g. Ningún `INSERT`/`UPDATE` lo escribe. El restaurador de backup copia columnas genéricamente (`BackupRepository.js:550`), pero no origina el valor.
4. **No existe `HEMRA` en el código** (ver sección k).
5. **El código del ave no se genera**; lo escribe el usuario (sección c).
6. **`actualizarAve` NO escribe en `ave_evolucion`** (confirmado leyendo `AveRepository.js:975-1552`: la única sentencia de inserción es `INSERT INTO ave_historial` en `:1523-1547`). El mapeo del análisis V1 que lista `ave_evolucion` para `actualizarAve` es incorrecto.
7. **No hay capacidad de jaula**: `capacidad` (insensible a mayúsculas) no aparece en ningún archivo de `src/` (0 coincidencias).
8. **`SEXOS` no es configurable en la app**: `ConfiguracionScreen.js:23-55` solo ofrece RAZAS, ENFERMEDADES, MEDICAMENTOS, ALIMENTOS, BEBIDAS y CATEGORIAS_FINANCIERAS, y es el único sitio que navega a `Catalogo` (`:104-113`; búsqueda sin límite de `'Catalogo'` en `src/`). `RAZAS` sí es editable (alta, renombrado y baja lógica).
9. **`obtenerHistorialAve` (`AveRepository.js:1719`) y `obtenerBajasAve` (`BajaAveRepository.js:440`) no tienen llamadores en `src/`** (búsqueda sin límite). `registrarEventoCicloVida` solo lo llama `FinalizarTratamientoScreen.js:78`.
10. **`actualizarEstadoSaludAve` (`SaludRepository.js:332`) no tiene llamadores** y es la única otra escritura de `estado_salud` además de `registrarDiagnostico` (`:213`).

### a. Métodos públicos (resumen; el contrato exacto está en la sección "Contrato del repositorio V1")

Todos usan `getDatabase()` de `src/database/database`. Las transacciones son `db.withTransactionAsync`.

| Método | Escribe | Transacción |
|---|---|---|
| `obtenerAves`/`obtenerAvesActivas`/`obtenerAvesPorJaula`/`obtenerAvesParaAsignarJaula`/`obtenerAvePorId`/`obtenerAvesActivasParaPadres`/`obtenerJaulasActivas`/`existeAvePorCodigo`/`obtenerHistorialAve`/`obtenerAvesVendidas`/`obtenerAvesFallecidas`/`obtenerBajaAve` | no | no |
| `crearAve` | aves, ave_evolucion, ave_historial, jaula_historial (si hay jaula) | sí |
| `actualizarAve` | aves, ave_historial | sí |
| `cambiarJaulaAve` | aves, ave_historial, jaula_historial | sí |
| `registrarEvolucionAve` | aves, ave_evolucion (1 o 2 filas), ave_historial | sí |
| `registrarDiagnostico` | diagnosticos_ave, tratamientos_ave (si hay medicamento), aves (`estado_salud`), ave_historial | sí |
| `registrarEventoCicloVida` | ave_historial | no |
| `registrarMuerteAve` / `registrarVentaAve` | aves (`estado`), bajas_ave, ave_historial (+ 2 `movimientos_financieros` en venta) | sí |
| `actualizarEstadoSaludAve` | aves | no (sin llamadores) |

Notas: las consultas ordenan por `codigo` ascendente (comparación binaria de SQLite) salvo vendidas/fallecidas (`ORDER BY b.fecha DESC`, `AveRepository.js:1821,1884`).

### b. Columnas reales de `aves`

Fuente: `migrations.js:42-85` y migraciones posteriores. No hay `CHECK` en la tabla. `PRAGMA foreign_keys = ON` en `sqlite.js:63`.

| Columna | Tipo | NULL | Default | UNIQUE / FK | Migración |
|---|---|---|---|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | no | - | PK | V1 `:43` |
| codigo | TEXT | NOT NULL | - | UNIQUE (colación binaria) | V1 `:45` |
| origen | TEXT | NOT NULL | - | sin CHECK | V1 `:47` |
| fecha_nacimiento | TEXT | sí | - | - | V1 `:49` |
| edad_meses_compra | INTEGER | sí | - | - | V1 `:51` |
| fecha_ingreso | TEXT | sí | - | - | V1 `:53` |
| criadero_origen | TEXT | sí | - | - | V1 `:55` |
| metodo_envio | TEXT | sí | - | - | V1 `:57` |
| raza | TEXT | sí | - | texto libre, no FK | V1 `:59` |
| caracteristicas | TEXT | sí | - | - | V1 `:61` |
| foto_uri | TEXT | sí | - | - | V1 `:63` |
| padre_id / madre_id | INTEGER | sí | - | FK aves(id), sin ON DELETE | V1 `:65-81` |
| jaula_actual_id | INTEGER | sí | - | FK jaulas(id), sin ON DELETE | V1 `:69,83-84` |
| estado | TEXT | NOT NULL | 'ACTIVA' | sin CHECK | V1 `:71` |
| fecha_creacion | TEXT | NOT NULL | CURRENT_TIMESTAMP | - | V1 `:73` |
| fecha_actualizacion | TEXT | sí | - | - | V1 `:75` |
| estado_salud | TEXT | sí | 'SANA' | sin CHECK | V2 `migrationV2.js:6-8` |
| fecha_ultimo_control_salud | TEXT | sí | - | - | V2 `migrationV2.js:11-12` |
| sexo | TEXT | sí | - | sin CHECK ni FK | V4 `migrationV4.js:6-7` |
| peso_gramos, altura_cm, largo_cm | REAL | sí | - | - | V4 `migrationV4.js:10-19` |

Índices (V1): `idx_aves_jaula`, `idx_aves_estado` (`migrations.js:346-349`).

Tablas relacionadas que el módulo escribe:

- `ave_evolucion` (`migrations.js:88-106`): id, ave_id NOT NULL (FK CASCADE), fecha NOT NULL, foto_uri, caracteristicas, observacion, fecha_creacion; V5 agrega peso_gramos, altura_cm, largo_cm (REAL).
- `ave_historial` (`migrations.js:133-`): id, ave_id NOT NULL (FK CASCADE), jaula_id (FK jaulas), tipo_evento NOT NULL, fecha NOT NULL, detalle, fecha_creacion. Tipos escritos en `src/`: `ALTA`, `DATOS_ACTUALIZADOS`, `CAMBIO_JAULA`, `EVOLUCION`, `SALUD`, `VENTA`, `MUERTE`, `RECUPERACION` (solo desde `FinalizarTratamientoScreen.js:83`).
- `jaula_historial` (`migrations.js:109-`): `INGRESO_AVE`, `SALIDA_AVE`.
- `diagnosticos_ave` (`migrations.js:243-263`): `estado TEXT NOT NULL DEFAULT 'ACTIVO'` (`:256`). El único valor escrito en el árbol actual es `'ACTIVO'` (`SaludRepository.js:140`); `'CERRADO'` no aparece en ningún lugar de `src/` (búsqueda sin límite).
- Catálogos (`migrations.js:4-25`): `catalogos(codigo UNIQUE)` y `catalogo_items(UNIQUE(catalogo_id, codigo))`. `SEXOS`: `MACHO`/`Macho` (`migrationV4.js:43`) y `HEMBRA`/`Hembra` (`migrationV4.js:59`). `RAZAS`: `KIKIRIS`, `KIKIRIKIS_MEJORADOS`, `AZTECAS`, `SEBRING`, `NAGASAKI`, `KIRI`, `FANTASIA`, `SERAMA`, `OTRO` (`migrationV3.js:32-200`). `seeders.js:27-51,207-235` solo asegura las filas de `catalogos`.

### c. Generación del código del ave

- **No hay generación automática.** El código lo escribe el usuario: `TextInput` "Código *" con placeholder "Ej. K001", `autoCapitalize="characters"` y `maxLength={30}` (`NuevaAveScreen.js:1442-1459`).
- Normalización `trim().toUpperCase()`: pantalla (`:741-744`), `crearAve` (`AveRepository.js:798-800`), `actualizarAve` (`:1097-1102`).
- Vacío: la pantalla lo rechaza (`:747-756`). `crearAve` no valida vacío: `codigo.trim()` lanza `TypeError` si `codigo` es `undefined` (`:798`).
- Unicidad: la pantalla llama `existeAvePorCodigo(codigoLimpio, aveIdEdicion|null)` (`NuevaAveScreen.js:979-997`); compara `UPPER(TRIM(codigo))` sobre todas las aves de cualquier estado (`AveRepository.js:684,706`). `crearAve` no comprueba duplicados: depende de `UNIQUE` (`migrations.js:45`); la pantalla traduce el error si el mensaje contiene `unique` y `aves.codigo`, o `codigo_ave_duplicado` (`NuevaAveScreen.js:1209-1234`). `actualizarAve` comprueba duplicado excluyendo el propio id y lanza `CODIGO_AVE_DUPLICADO` (`AveRepository.js:1105-1131`).
- El código es editable en la edición (no hay bloqueo, `NuevaAveScreen.js:1446-1459`).
- La carpeta de fotos usa el código (`guardarFotoAve(fotoTemporal, codigoLimpio)`, `:1017-1020`).

### d. Alta y edición: campos, obligatoriedad y orden de validación

Valores de `origen`: `NACIDA_CRIADERO` (por defecto, `NuevaAveScreen.js:54-58,81-85`) y `COMPRADA`. El repositorio no valida `origen` ni la obligatoriedad de ningún campo: todas las validaciones de campos viven en `guardar` (`NuevaAveScreen.js:738-1351`). Orden:

1. Código (`:747-756`).
2. Raza: sin `razaSeleccionada` (`:759-768`).
3. Sexo: sin `sexoSeleccionado` (`:771-780`).
4. Peso, altura, largo con `convertirNumeroOpcional` (`:2627-2679`): vacío es válido (null); si no es finito o `<= 0` es inválido; reemplaza coma por punto. El campo filtra la entrada con `normalizarEntradaDecimal` (`:2591-2624`, solo dígitos y un punto).
5. Padre y madre con el mismo id (`:837-852`, comparación `===`).
6. Según origen:
   - `NACIDA_CRIADERO`: `fecha_nacimiento = fechaLocalISO(fechaNacimiento)` (siempre hay un `Date`, por defecto hoy, `maximumDate = hoy`, `:1700-1702`). Edad, fecha de ingreso, criadero y método de envío se guardan `null` (`:855-885`).
   - `COMPRADA`: edad entero `>= 0` (`:888-909`), criadero no vacío tras `trim` (`:912-924`), método de envío no vacío tras `trim` (`:927-939`). `fecha_ingreso = fechaLocalISO(fechaIngreso)` (por defecto hoy, `maximumDate = hoy`, `:1882-1884`); `fecha_nacimiento = fechaNacimientoCalculada` (`:952-957`).
7. `existeAvePorCodigo` (`:979-997`, después de las validaciones locales) y copia de la foto (`:1000-1022`).
8. `padreId`/`madreId` solo se envían si el origen es `NACIDA_CRIADERO`; si es `COMPRADA` se envían `null` (`:1074-1084`, `:1158-1168`).

Otras reglas de pantalla:

- Edad solo admite dígitos (`replace(/[^0-9]/g,'')`, `:1829-1837`).
- Raza y sexo se eligen con `SelectorCatalogo` de los catálogos `RAZAS` y `SEXOS` (`:328-374`). **Se guarda en `aves.raza` el `nombre` del ítem (`setRaza(item.nombre)`, `:2031`) y en `aves.sexo` el `codigo` del ítem (`setSexo(item.codigo)`, `:2062`).** Es texto, no una referencia al ítem.
- `obtenerItemsCatalogo` solo devuelve ítems con `activo = 1`, ordenados por `orden, nombre` (`ConfiguracionRepository.js:112-122`); si el catálogo está vacío el selector muestra "No existen opciones disponibles." (`SelectorCatalogo.js:26,31-41`).
- Edición: `razaSeleccionada` se busca por `nombre` sin distinguir mayúsculas (`:503-521`); `sexoSeleccionado` por `codigo` (`:535-553`). Si la raza guardada no coincide con ningún ítem activo, `razaSeleccionada` queda `null` y al guardar aparece "Raza requerida" hasta volver a elegir (consecuencia de guardar texto: renombrar o dar de baja un ítem desincroniza las aves ya guardadas, `ConfiguracionRepository.js:203-246,251-279`).
- Edición: los botones de origen no se deshabilitan (`:1588-1651`); se puede cambiar el origen en ambos sentidos. Al pasar a `COMPRADA`, `padre_id`/`madre_id` quedan `NULL` (`AveRepository.js:1134-1145`).
- La foto no se puede quitar desde la pantalla (solo reemplazar): no hay botón de borrar (`:1525-1570`).
- Edición: la jaula no se muestra ni se envía (`:2197-2235` solo con `!modoEdicion`); `actualizarAve` no la recibe.
- Subtítulo en edición: "Actualiza los datos generales del ave. La jaula, salud, huevos y bajas se administran desde sus procesos correspondientes." (`:1431`).
- Éxito alta: "Ave registrada" / "El ave {codigo} fue registrada correctamente." con botón "Ver ave" (`navigation.replace('DetalleAve')`, `:1175-1196`). Éxito edición: "Ave actualizada" / "Los datos del ave {codigo} fueron actualizados correctamente." (`:1089-1105`).
- Error no mapeado: "Error" / "No fue posible registrar el ave." (alta) o "No fue posible actualizar el ave." (edición) (`:1335-1340`).

### e. Fecha de nacimiento a partir de la edad (`edad_meses_compra`)

- Solo en `COMPRADA`. Se calcula **en la pantalla**: `fechaNacimientoCalculada` (`useMemo`, `NuevaAveScreen.js:257-298`) y de nuevo en `guardar` (`:952-957`). El repositorio guarda lo que recibe.
- Fórmula: `restarMeses(fechaIngreso, edadMesesCompra)` (`:2715-2761`): toma el día original, fija el día 1, resta meses con `setMonth` y restaura `min(díaOriginal, últimoDíaDelMesResultante)`. Entero, sin redondeos.
- Formato guardado: `fechaLocalISO` (`:2682-2712`) devuelve `YYYY-MM-DD` con año/mes/día locales del dispositivo (sin hora ni zona). `fecha_ingreso` y `fecha_nacimiento` se guardan así.
- `fecha_creacion`/`fecha_actualizacion` son `CURRENT_TIMESTAMP` de SQLite (`YYYY-MM-DD HH:MM:SS`, UTC); `ave_historial.fecha`/`ave_evolucion.fecha` son `new Date().toISOString()` (`AveRepository.js:752-754,999-1001,1566-1568`). `registrarMuerteAve`/`registrarVentaAve` escriben `aves.fecha_actualizacion` en ISO (`BajaAveRepository.js:18-20,29-47,192-210`). Conviven tres formatos de fecha.
- Edición: `fechaDesdeISO` (`:2542-2588`) reconstruye el `Date` desde los primeros 10 caracteres como fecha local.
- Edad mostrada: `AveCard.obtenerEdad` (`AveCard.js:384-533`) usa fecha local y muestra "N año(s) M mes(es)", "N mes(es)" o "N día(s)", "No registrada" o "Fecha inválida". `AvesScreen.obtenerEdadMeses` (`AvesScreen.js:619-637`) usa `new Date(fechaNacimiento)` (una cadena `YYYY-MM-DD` se interpreta como UTC) y compara con `getMonth()/getDate()` locales: puede dar un día de desfase según zona. Las dos pantallas no coinciden en el criterio.

### f. Padre y madre

Pantalla:

- Solo se muestran con `NACIDA_CRIADERO`, opcionales (texto: "Son opcionales. Selecciona únicamente si conoces la trazabilidad de los padres. Al editar, los descendientes de esta ave se excluyen para evitar relaciones circulares.", `NuevaAveScreen.js:1747`).
- Candidatos: `obtenerAvesActivasParaPadres(aveIdEdicion|null)` (`:320-324`): solo aves ACTIVA (`AveRepository.js:201`); en edición excluye la propia ave y todos sus descendientes (BFS sobre toda la tabla `aves`, cualquier estado, `:215-258`, `:263-396`). Padre: `item.sexo === 'MACHO'` o el id ya seleccionado (`NuevaAveScreen.js:1762-1768`); madre: `item.sexo === 'HEMBRA'` o el id ya seleccionado (`:1790-1796`). Un ave sin sexo no aparece como candidata. Opción "Sin seleccionar" (`:2313-2340`). Vacío: "Todavía no existen aves disponibles para seleccionar como padre." / "...como madre." (`:1775,1803`).
- Un padre/madre ya guardado que dejó de ser ACTIVA sigue cargado en el estado (`:600-609`) y se reenvía al guardar.
- Mensajes mapeados en el `catch` (`:1237-1326`): ver "Validaciones en pantalla".

Repositorio: `validarRelacionPadres` (`AveRepository.js:399-619`; `crearAve` lo llama sin `aveId`, `:760-764`; `actualizarAve` con `aveId`, `:1088-1094`). Errores `new Error('<CODIGO>')` en este orden:

1. `PADRE_ES_MISMA_AVE` (`:432-442`, solo si hay `aveId`). 2. `MADRE_ES_MISMA_AVE` (`:445-455`). 3. `PADRES_IGUALES` (`:458-470`). 4. `PADRE_NO_ENCONTRADO` (`:493-499`, id inexistente en `aves`, sin filtrar estado). 5. `PADRE_NO_MACHO` (`:502-513`): solo si `padre.sexo` tiene valor y es distinto de `'MACHO'`; un padre sin sexo pasa. 6. `MADRE_NO_ENCONTRADA` (`:538-544`). 7. `MADRE_NO_HEMBRA` (`:547-558`), mismo criterio con `'HEMBRA'`. 8. Solo en edición: `PARENTESCO_CIRCULAR_PADRE`/`PARENTESCO_CIRCULAR_MADRE` si el padre/madre es descendiente del ave (`:570-617`).

`actualizarAve` repite los tres primeros chequeos antes (`:1044-1085`), tras `AVE_NO_ENCONTRADA` (`:1023-1029`) y `AVE_NO_ACTIVA` (`:1032-1041`).

Detalles:

- No se valida el estado del padre/madre en el repositorio, ni fechas, ni que el origen sea `NACIDA_CRIADERO` en `crearAve` (guarda `padreId || null`, `:844-848`); `actualizarAve` fuerza `padre_id`/`madre_id` a `null` si `origen !== 'NACIDA_CRIADERO'` (`:1134-1145`).
- No hay límite de generaciones al guardar. En consulta, `obtenerGenealogiaAve` limita `min(4, max(1, Number(generaciones) || 3))` (`GenealogiaRepository.js:16-23`).
- Genealogía: lee todas las aves de cualquier estado (`:26-45`), devuelve `null` si el ave no existe (`:59-71`), ordena hijos por `codigo` con `localeCompare` (`:521-531`), detecta ciclos y devuelve `relacionesInvalidas` `{ tipo: 'PARENTESCO_CIRCULAR', detalle }` (`:706-730`) con textos "Relación circular detectada en ancestros: A → B.", "Relación circular detectada en descendientes entre X y Y.", "Relación circular detectada entre X y Y. Un ave no puede aparecer a la vez como ancestro y descendiente de la misma ave." (`:206,402,499`) y oculta los nodos conflictivos (`:189-225`).
- `GenealogiaAveScreen` inicia con 3 generaciones (`:40-43`) y ofrece 2, 3 y 4 (`:363-368`); la **consanguinidad se calcula en la pantalla**, es informativa y no bloquea (`analizarConsanguinidad`, `:996-1200`, nota en `:334`). Marca la tarjeta con `estado !== 'ACTIVA'` y atenúa `FALLECIDA` (`:827-830,915-932`).

### g. Estados y transiciones

`aves.estado` (ACTIVA / VENDIDA / FALLECIDA; sin CHECK):

| Transición | Operación | Restricciones en código |
|---|---|---|
| (nueva) -> ACTIVA | `crearAve`, literal `'ACTIVA'` (`AveRepository.js:794`) | ninguna adicional |
| ACTIVA -> FALLECIDA | `registrarMuerteAve` (`BajaAveRepository.js:29-47`) | `UPDATE aves SET estado='FALLECIDA'` sin verificar estado previo ni existencia; no limpia `jaula_actual_id` |
| ACTIVA -> VENDIDA | `registrarVentaAve` (`:192-210`) | idem; valida celular (`:163-171`); crea 2 `movimientos_financieros` (`:275-353`) |

- No existe ninguna operación que vuelva un ave a ACTIVA.
- Solo la pantalla de detalle habilita acciones según estado: para `ACTIVA` muestra Editar, Evolución, Salud, Registrar huevo y Dar de baja (`DetalleAveScreen.js:820-1052`); Ciclo de vida y Genealogía siempre (`:962-1017`). Para `VENDIDA`/`FALLECIDA` muestra "Información de venta"/"Información de fallecimiento" con `obtenerBajaAve` (`:580-686`).
- Editar un ave no activa: el repositorio lanza `AVE_NO_ACTIVA` (`AveRepository.js:1032-1041`) y el `UPDATE` lleva `AND estado = 'ACTIVA'` (`:1172-1173`); la pantalla lo comprueba al cargar (`NuevaAveScreen.js:408-417,637-657`).
- `cambiarJaulaAve` y `registrarEvolucionAve` no validan estado del ave. `registrarDiagnostico` tampoco. La UI solo ofrece estas acciones a aves ACTIVA (asignables: `AveRepository.js:122-128`; acciones del detalle: `DetalleAveScreen.js:820-958`).
- Las aves VENDIDA/FALLECIDA conservan `jaula_actual_id`. `obtenerAvesPorJaula` filtra ACTIVA (`:85-87`), pero `desactivarJaula` libera **todas** las aves con esa jaula sin filtrar estado (`JaulaRepository.js:278-291,357-368`).

`aves.estado_salud` (SANA / EN_TRATAMIENTO / ENFERMA; sin CHECK):

- Default `'SANA'` al agregar la columna (`migrationV2.js:6-8`); `crearAve` no la escribe.
- SANA -> EN_TRATAMIENTO: `registrarDiagnostico` (`SaludRepository.js:207-229`), siempre, junto con `fecha_ultimo_control_salud = fecha`. No comprueba el estado previo ni el estado del ave.
- EN_TRATAMIENTO -> SANA: ver "Finalizar tratamiento". En el árbol actual (v1.0.1 a v1.0.3) **no existe código que la ejecute**; existía en v1.0.0 y V2 la replica (R-P1).
- `ENFERMA`: ver hallazgo 3; se lee en `AvesScreen.js:410,642`, `AveCard.js:550,577`, `DetalleAveScreen.js:1292,1323`, `SaludAveScreen.js:828,860`, `DashboardRepository.js:97`, `ReportesRepository.js:34`.
- Los lectores tratan cualquier valor distinto de EN_TRATAMIENTO/ENFERMA (incluido NULL) como SANA (`AvesScreen.js:640-644`, `DetalleAveScreen.js:1309-1336`, `AveCard.js:563-587`). `AlertasRepository.js:40-58` lista aves ACTIVA con `estado_salud = 'EN_TRATAMIENTO'` y días desde `fecha_ultimo_control_salud` `>= 7`.

### h. Efectos secundarios

Crear (`crearAve`, una transacción, `AveRepository.js:757-967`):

1. `validarRelacionPadres` sin `aveId` (`:760-764`).
2. `INSERT INTO aves` con `estado='ACTIVA'` (`:767-853`); `raza` con `trim() || null`, `sexo || null`, `criaderoOrigen`/`metodoEnvio`/`caracteristicas` con `trim() || null`.
3. `INSERT INTO ave_evolucion`: `fecha = fechaAlta` (ISO), foto, peso, altura, largo, caracteristicas, `observacion = 'Registro inicial'` (`:860-898`).
4. `INSERT INTO ave_historial`: `ALTA`, `jaula_id` = jaula inicial o null, detalle "Ave registrada como nacida en el criadero." si `origen === 'NACIDA_CRIADERO'`, en otro caso "Ave registrada como comprada." (`:901-930`).
5. Si hay `jaulaId`: `INSERT INTO jaula_historial` `INGRESO_AVE`, detalle "Ave {CODIGO} ingresó a la jaula." (`:933-964`). No se escribe `CAMBIO_JAULA`.
- No valida que la jaula exista ni esté activa (la pantalla solo lista `activa = 1`, `AveRepository.js:637`); con `foreign_keys = ON` una jaula inexistente fallaría por FK.

Editar (`actualizarAve`, una transacción, `:1004-1550`): comprobaciones (existencia, estado, padres, duplicado) y luego:

1. `UPDATE aves` (`:1148-1226`) de codigo, origen, fecha_nacimiento, edad_meses_compra, fecha_ingreso, criadero_origen, metodo_envio, raza, sexo, peso_gramos, altura_cm, largo_cm, caracteristicas, foto_uri, padre_id, madre_id y `fecha_actualizacion = CURRENT_TIMESTAMP`. No toca `jaula_actual_id`, `estado` ni `estado_salud`.
2. `INSERT INTO ave_historial` `DATOS_ACTUALIZADOS` con `jaula_id = anterior.jaula_actual_id` (`:1523-1547`). Detalle "Datos generales actualizados: {lista}." con etiquetas `código`, `origen`, `fecha de nacimiento`, `edad de ingreso`, `fecha de ingreso`, `criadero de origen`, `método de envío`, `raza`, `sexo`, `peso`, `altura`, `largo`, `características`, `fotografía`, `padre`, `madre` en ese orden (`:1244-1512`), o "Se guardó la edición de los datos generales sin cambios visibles." si no hay cambios (`:1515-1520`); el evento se inserta igualmente.
3. **No** crea fila en `ave_evolucion`: `aves` y la última evolución pueden divergir.

Cambiar jaula (`cambiarJaulaAve`, una transacción, `:1555-1716`); llamado desde `SeleccionarAveJaulaScreen.asignarAve` (`:162-230`, confirmación `:120-159`) y `DetalleJaulaScreen.quitarAve` (`:268-314`, confirmación `:231-265`):

1. `UPDATE aves SET jaula_actual_id = nuevaJaulaId|NULL, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?` (`:1574-1591`), sin filtrar estado ni verificar existencia.
2. `ave_historial` `CAMBIO_JAULA`, `jaula_id = nuevaJaulaId|null`, detalle "El ave fue movida de una jaula a otra." (anterior y nueva), "El ave fue asignada a una jaula." (solo nueva) o "El ave fue retirada de su jaula." (sin nueva) (`:1594-1647`).
3. Si hay `jaulaAnteriorId`: `jaula_historial` `SALIDA_AVE` en la anterior, "Ave {codigoAve} salió de la jaula." (`:1650-1679`).
4. Si hay `nuevaJaulaId`: `jaula_historial` `INGRESO_AVE` en la nueva, "Ave {codigoAve} ingresó a la jaula." (`:1682-1711`).
- `jaulaAnteriorId` y `codigoAve` los aporta el llamador (`SeleccionarAveJaulaScreen.js:172-188`, `DetalleJaulaScreen.js:273-287`); el repositorio no los verifica. No valida jaula activa ni `anterior != nueva`.

Evolución (`registrarEvolucionAve`, `EvolucionAveRepository.js:44-410`): ver contrato.

### i. Listados, filtros y detalle

`AvesScreen` (tab "Aves" -> `ListaAves`):

- Tres pestañas ACTIVAS/VENDIDAS/FALLECIDAS (`AvesScreen.js:67-75`); recarga al enfocar y al cambiar de pestaña (`:101-108`). Botón "＋ Nueva ave" navega a `NuevaAve` (`:336`).
- Todos los filtros se aplican **en memoria** sobre el resultado completo (`:141-265`): búsqueda por código (substring sin mayúsculas, `:163-171`), raza (igualdad exacta con `item.raza`, opciones derivadas de las aves cargadas, `:111-123,173-179`), sexo (`TODOS`/`MACHO`/`HEMBRA`, `:394-403,181-187`), salud (`SANA`/`ENFERMA`/`EN_TRATAMIENTO` tras `normalizarSalud`, `:405-411,189-195,640-644`), jaula (`TODAS`/`SIN_JAULA`/código, `:126-138,197-213`), edad en meses desde/hasta (`:215-248`; si no hay fecha el ave queda excluida; `parseEnteroOpcional` `:610-616`). Contador "{n} ave(s) encontrada(s)" (`:470-473`). Vacío "Sin resultados" / "No hay aves que coincidan con los filtros seleccionados." (`:524-529`). Error "No se pudieron cargar las aves." con botón "Reintentar" (`:87-89,494-512`). Cargando "Cargando aves..." (`:485-487`). Sin paginación.
- Orden: ACTIVAS por `codigo`; VENDIDAS/FALLECIDAS por fecha de baja descendente. Las dos últimas usan `INNER JOIN bajas_ave` (`AveRepository.js:1806-1808,1869-1871`): un ave `VENDIDA`/`FALLECIDA` sin fila de baja no aparece, y varias bajas del mismo tipo duplicarían la fila.
- Tarjeta `AveCard` (`AveCard.js:16-313`): foto o 🐔, código, raza o "Sin raza" (`:116-119`), sexo ("🐓 Macho", "🐔 Hembra", "Sexo sin registrar", `:318-342`), estado ("Activa"/"Vendida"/"Fallecida", `:345-381`), "Edad aprox." si `COMPRADA` si no "Edad" (`:194-198`), "Jaula" o "Sin jaula" (`:231-235`), "🐓 Padre:"/"🐔 Madre:" o "No registrado" (`:255-271`), badge de salud solo si `ACTIVA` (`:277-309`). Al tocar navega a `DetalleAve` con `aveId` (`AvesScreen.js:540-551`).

`DetalleAveScreen` (`aveId`): en `useFocusEffect` carga `obtenerAvePorId`, `obtenerBajaAve` y `obtenerHuevosAve` en secuencia (`:84-170`). Errores de carga solo a `console.error` (`:130-139`); si no hay ave: "Ave no encontrada." (`:209-228`). Muestra foto o 🐔, código, raza o "Sin raza", badge de salud (`:249-368`) y la tarjeta "Información del ave" con filas Estado, Sexo ("🐓 Macho"/"🐔 Hembra"/vacío, `:1138-1162`), Peso, Altura, Largo (`:1166-1203`), Origen ("Nacida en criadero"/"Comprada"), Fecha nacimiento, (si `COMPRADA`) Edad al ingresar "N meses", Fecha de ingreso, Criadero de origen, Método de envío, Padre, Madre, Jaula (código o "Sin jaula") y Características (o "Sin información") (`:388-568`). El valor vacío se muestra "No registrado" (`:1079-1089`). La edición se invoca con `navigation.navigate('NuevaAve', { aveId, modoEdicion: true })` (`:831-840`); `NuevaAveScreen` solo usa `aveId` (`NuevaAveScreen.js:66-72`).

### j. Fotos

- `aves.foto_uri` guarda una **URI local del dispositivo**. Flujo: `seleccionarFotoGaleria` / `tomarFotoCamara` -> URI temporal (`NuevaAveScreen.js:680-735`) -> al guardar `guardarFotoAve(uriTemporal, codigo)` copia a una carpeta propia y devuelve esa ruta (`:1000-1022`). En edición solo copia si `fotoTemporal !== fotoOriginal`.
- La copia ocurre antes de `crearAve`/`actualizarAve`; si la transacción falla queda el archivo huérfano.
- No se verifica que el archivo exista (`Image` recibe la URI tal cual, `DetalleAveScreen.js:263-274`, `NuevaAveScreen.js:1481-1489`).
- `ave_evolucion.foto_uri` replica la URI de `aves.foto_uri` en cada registro (`AveRepository.js:880`, `EvolucionAveRepository.js:253`). `registrarEvolucionAve` sí puede dejar `aves.foto_uri` en null (`fotoUri || null`, `:216-217`).
- Errores de foto (alta/edición): "Permiso requerido" / "Debes permitir el acceso a la cámara." / "Debes permitir el acceso a las fotografías."; "Error" / "No fue posible obtener la fotografía." (`NuevaAveScreen.js:2485-2539`). En evolución los textos de permiso son "Debes permitir el acceso a la cámara para tomar fotografías." y "Debes permitir el acceso a las fotografías del dispositivo." (`EvolucionAveScreen.js:1018-1072`).

### k. HEMRA frente a HEMBRA (cerrado)

- `HEMRA` no aparece en ningún archivo de código (búsqueda en `src/` y `api/src/`). Solo en documentos (`CriaderoKikirikis_V1_Analisis_Movil_y_Mapeo_API.md`, `V2_MODELO_DATOS.md`, `documents/traspaso/`).
- `HEMBRA` es el único valor usado: `migrationV4.js:59` (ítem del catálogo `SEXOS`), `AveRepository.js:550` (`MADRE_NO_HEMBRA`), `NuevaAveScreen.js:1792`, `AvesScreen.js:399`, `DetalleAveScreen.js:1151`, `AveCard.js:332`, `GenealogiaAveScreen.js:815,1301,1309,1383`, `api/src/catalogs/defaultCatalogItems.ts:100`. `MACHO` igual (`migrationV4.js:43`, `AveRepository.js:506`).
- Conclusión: no hay inconsistencia en el código; `HEMRA` es un typo del documento de análisis. V2 sin datos de usuario: no hay valores legados que normalizar.

### l. Finalizar tratamiento (R-P1 decidida: se replica v1.0.0 completo)

**Ruta real en el árbol actual (verificada leyendo el código):**

1. Disparo: `SaludAveScreen.js:451-488` muestra el botón "✅ Finalizar tratamiento" solo si `ave.estado_salud === 'EN_TRATAMIENTO'` y navega a `FinalizarTratamiento` con `{ aveId }`. La pantalla de salud solo es accesible desde el detalle de un ave `ACTIVA` (`DetalleAveScreen.js:892-924`).
2. Ruta registrada en `AvesStackNavigator.js:62-63`.
3. `FinalizarTratamientoScreen.js:49-137` (`guardar`): `observacion.trim()` (`:59-61`), `fechaRecuperacion = new Date().toISOString()` (`:63-65`), `await finalizarTratamiento({ aveId, observacion })` (`:68-75`), luego `await registrarEventoCicloVida({ aveId, tipoEvento: 'RECUPERACION', fecha, detalle })` (`:78-93`) con detalle `Tratamiento finalizado. ${observacion}` o "Tratamiento finalizado. El ave volvió al estado sana." Éxito: Alert "Tratamiento finalizado" / "El ave volvió al estado sana." y `goBack` (`:96-113`). Error: `console.error` y Alert "Error" / "No fue posible finalizar el tratamiento." (`:116-128`).
4. `finalizarTratamiento` se importa de `../repositories/EstadoSaludRepository` (`:14-16`), archivo cuyo único export es `default function NuevaAveScreen` (`EstadoSaludRepository.js:48`). Por tanto **en el árbol actual `finalizarTratamiento` es `undefined` y la llamada de `:68` lanzaría `TypeError` antes de ejecutar nada**: `registrarEventoCicloVida` no se llega a invocar y ninguna tabla cambia. Se vería el Alert de error.
5. Ningún otro código de `src/` escribe `estado_salud = 'SANA'`: las únicas escrituras de `estado_salud` son `SaludRepository.js:213` (`'EN_TRATAMIENTO'`) y `SaludRepository.js:352` (`actualizarEstadoSaludAve`, valor libre, sin llamadores). Búsqueda sin límite de `estado_salud` y `'SANA'` en `src/` (solo lecturas y el `DEFAULT` de `migrationV2.js:8`).
6. Descartado el OTA: `package.json` no tiene `expo-updates` (búsqueda: 0 coincidencias) y `app.json` no declara `updates`.

**Decisión (R-P1, aprobada por el usuario, 2026-10-29): V2 replica el comportamiento COMPLETO de v1.0.0**, con una diferencia deliberada (P-13): el servidor rechaza la operación si el ave no está `EN_TRATAMIENTO` (V1 solo ocultaba el botón).

**Evidencia verificada con git** (`git show 4a8cc6c:src/repositories/EstadoSaludRepository.js`, ver R-L10). Etiquetas: v1.0.0 -> `4a8cc6c`, v1.0.1 -> `97edf7f`, v1.0.2 -> `00df6d9`, v1.0.3 -> `248ced2`.

- En `4a8cc6c` (v1.0.0), `EstadoSaludRepository.js` exportaba `finalizarTratamiento({ aveId, observacion })` dentro de `db.withTransactionAsync`: (1) `UPDATE aves SET estado_salud='SANA', fecha_ultimo_control_salud=? WHERE id=?` con `fecha = new Date().toISOString()`; (2) `UPDATE diagnosticos_ave SET estado='CERRADO' WHERE ave_id=? AND estado='ACTIVO'`; (3) `INSERT ave_historial(ave_id, tipo_evento, fecha, detalle)` tipo `SALUD` con detalle `Recuperación registrada: ${observacion}` o "Ave recuperada y tratamiento finalizado.".
- Después, la pantalla (`FinalizarTratamientoScreen.js:78-93`) llama `registrarEventoCicloVida` con `RECUPERACION` y detalle `Tratamiento finalizado. {obs}` o "Tratamiento finalizado. El ave volvió al estado sana.".
- La función se perdió en el commit `97edf7f` (v1.0.1, 2026-09-23), que sobrescribió el archivo con una copia de `NuevaAveScreen` (+2110/-69 líneas). No existe en v1.0.1, v1.0.2 ni v1.0.3.
- Nota: el usuario afirma que en su teléfono funciona (probablemente un build previo a v1.0.1; el número de versión de `app.json` no lo distingue, porque v1.0.0 y v1.0.1 dicen "1.0.0"). Esto ya no condiciona la decisión.

Lo que se verificó del lado del consumo:

- `diagnosticos_ave.estado` por defecto `'ACTIVO'` (`migrations.js:256`) y `registrarDiagnostico` lo inserta explícitamente `'ACTIVO'` (`SaludRepository.js:140`).
- `registrarEventoCicloVida` inserta en `ave_historial` `(ave_id, tipo_evento, fecha, detalle)` con `detalle || null` y fecha ISO si no se pasa (`CicloVidaRepository.js:731-767`), sin `jaula_id`.
- `obtenerCicloVidaAve` excluye del historial los tipos `SALUD`, `POSTURA_HUEVO`, `EVOLUCION`, `VENTA`, `MUERTE`, `BAJA` (`:207-223`) y por tanto **sí muestra `RECUPERACION`** con título "Ave recuperada" (`:890-892`) y el `detalle` guardado; la pantalla le da icono ✅ (`CicloVidaAveScreen.js:715-721`). La fila `SALUD` de v1.0.0 no se ve en el ciclo de vida (solo la reconstruyen los diagnósticos, `:393-533`) y `obtenerHistorialAve` no tiene llamadores.
- Nada en el código actual lee `diagnosticos_ave.estado` para decidir algo: `CicloVidaRepository.js:98,422` lo copia al objeto del diagnóstico (que no se muestra, `:519-531`), `ReportesRepository.js:46-48` y `SaludRepository.js:305-324` no filtran por estado. El cierre de diagnósticos solo es observable en la base.
- Tras el éxito, `SaludAveScreen` recarga al enfocar (`useFocusEffect`, `:140-151`) y el badge pasa a "🟢 Sana" y el botón desaparece; el ave deja de aparecer en `AlertasRepository.js:40-58`.

**Conciliación con lo que afirma el usuario:** el usuario dice que funciona y que "solo cambia `estado_salud`". El árbol v1.0.3 no lo respalda (la llamada falla), pero la v1.0.0 hacía más que cambiar el estado. El usuario decidió replicar el comportamiento completo (R-P1 decidida).

**Resultado esperado en V2 (una sola transacción, `db.batch`):**

1. `aves.estado_salud = 'SANA'` y `fecha_ultimo_control_salud` = ahora (ISO UTC).
2. `diagnosticos_ave` del ave con estado `ACTIVO` pasan a `CERRADO`. Nota: hoy V1 (árbol actual) solo escribe `'ACTIVO'`; `'CERRADO'` proviene del código de v1.0.0, por lo que `diagnosticos_ave.estado` pasa a admitir `CERRADO` (ver Modelo D1).
3. `ave_historial` tipo `SALUD`, detalle `Recuperación registrada: {observacion}` o "Ave recuperada y tratamiento finalizado.".
4. Evento `RECUPERACION` en el ciclo de vida (`ave_historial`), detalle `Tratamiento finalizado. {obs}` o "Tratamiento finalizado. El ave volvió al estado sana.".
5. Diferencia deliberada: si el ave no está `EN_TRATAMIENTO`, el servidor rechaza sin escribir nada (código y ruta: subreglas R-P1a y R-P1b).

## Contrato del repositorio V1

Convenciones: `db.getAllAsync` devuelve un arreglo (vacío si no hay filas); `db.getFirstAsync` devuelve la primera fila o un valor falso si no hay (las pantallas lo tratan con `!ave`). Los errores de dominio son `new Error('<CODIGO>')`. Los valores son tal como salen de SQLite (INTEGER como número, TEXT como cadena, REAL como número, NULL como `null`). Todas las funciones son `async` y se importan por nombre.

### AveRepository.js

**`obtenerAves()`** (`:6-60`) y alias **`obtenerAvesActivas()`** (`:1752-1756`). Sin parámetros. Devuelve arreglo de aves con `estado = 'ACTIVA'` ordenado por `codigo`, objeto con: `id, codigo, origen, fecha_nacimiento, edad_meses_compra, fecha_ingreso, criadero_origen, metodo_envio, raza, sexo, peso_gramos, altura_cm, largo_cm, caracteristicas, foto_uri, padre_id, madre_id, jaula_actual_id, estado, estado_salud, fecha_creacion, jaula_codigo, jaula_nombre, padre_codigo, madre_codigo` (`:14-41`; `jaula_*` y `padre/madre_codigo` por `LEFT JOIN`, pueden ser `null`). Sin errores de dominio. Consumo: `AvesScreen.js:68` (todos los campos para `AveCard` y filtros); `AvesScreen.js:77` guarda el arreglo; error de carga -> "No se pudieron cargar las aves." (`:87-89`).

**`obtenerAvesPorJaula(jaulaId)`** (`:62-96`). Arreglo de aves `ACTIVA` con `jaula_actual_id = ?`, orden `codigo`; campos `id, codigo, origen, fecha_nacimiento, raza, caracteristicas, foto_uri, jaula_actual_id, estado` (`:73-81`). Consumo: `DetalleJaulaScreen.js:126`.

**`obtenerAvesParaAsignarJaula(jaulaId)`** (`:99-137`). Arreglo de aves `ACTIVA` cuya jaula es `NULL` o `<> jaulaId`, orden `codigo`; campos `id, codigo, raza, foto_uri, jaula_actual_id, jaula_codigo` (`:110-115`). Consumo: `SeleccionarAveJaulaScreen.js:70-78`; error de carga -> Alert "Error" / "No fue posible cargar las aves disponibles." (`:89-92`). La pantalla usa `jaula_actual_id` y `jaula_codigo` para el mensaje de confirmación (`:123-126`) y muestra "Raza no especificada" / "Actualmente: Sin jaula" (`:420,433`).

**`obtenerAvePorId(id)`** (`:140-179`). Una fila `a.*` más `jaula_codigo, jaula_nombre, padre_codigo, madre_codigo`; cualquier estado. `a.*` = `id, codigo, origen, fecha_nacimiento, edad_meses_compra, fecha_ingreso, criadero_origen, metodo_envio, raza, caracteristicas, foto_uri, padre_id, madre_id, jaula_actual_id, estado, fecha_creacion, fecha_actualizacion, estado_salud, fecha_ultimo_control_salud, sexo, peso_gramos, altura_cm, largo_cm` (orden de las columnas de las migraciones). Si no existe, valor falso. Consumo: `DetalleAveScreen.js:96-100`, `SaludAveScreen.js:184`, `EvolucionAveScreen.js:115` ("Ave no encontrada." `:505-523`), `NuevaAveScreen.js:337` (edición; si falta -> `throw new Error('AVE_NO_ENCONTRADA')` en `:399-405`, que cae al Alert genérico "No fue posible cargar los datos del ave.", `:658-667`).

**`obtenerAvesActivasParaPadres(aveIdActual = null)`** (`:182-260`). Arreglo de `{ id, codigo, raza, sexo }` de aves `ACTIVA` por `codigo` (`:193-203`); con `aveIdActual` excluye esa ave y a todos sus descendientes (`:215-258`). Consumo: `NuevaAveScreen.js:320-324,381-389` (filtra por `sexo` y por el id ya seleccionado, `:1762-1796`).

**`obtenerJaulasActivas()`** (`:622-643`). Arreglo de `{ id, codigo, nombre }` con `activa = 1` por `codigo`. Consumo: `NuevaAveScreen.js:326,392` (muestra `🏠 {codigo}`, `:2469`).

**`existeAvePorCodigo(codigo, excluirAveId = null)`** (`:646-720`). Devuelve `boolean`; `false` si el código queda vacío (`:664-668`); compara `UPPER(TRIM(codigo)) = ?` con `trim().toUpperCase()`; no filtra por estado. Consumo: `NuevaAveScreen.js:979-997`.

**`crearAve({ codigo, origen, fechaNacimiento, edadMesesCompra, fechaIngreso, criaderoOrigen, metodoEnvio, raza, sexo, pesoGramos, alturaCm, largoCm, caracteristicas, fotoUri, padreId, madreId, jaulaId })`** (`:724-972`). Devuelve `aveId` (número, `lastInsertRowId`, `:856-857,970`). Errores: los de `validarRelacionPadres` (`PADRES_IGUALES`, `PADRE_NO_ENCONTRADO`, `PADRE_NO_MACHO`, `MADRE_NO_ENCONTRADA`, `MADRE_NO_HEMBRA`; sin `PADRE_ES_MISMA_AVE` porque no hay `aveId`); error SQLite de `UNIQUE` en `aves.codigo`; `TypeError` si `codigo` es `undefined`; error de FK si la jaula no existe. Consumo: `NuevaAveScreen.js:1113-1172`; usa el valor devuelto para `navigation.replace('DetalleAve', { aveId })` (`:1186-1192`); los errores se capturan en `:1199-1342`.

**`actualizarAve({ id, codigo, origen, fechaNacimiento, edadMesesCompra, fechaIngreso, criaderoOrigen, metodoEnvio, raza, sexo, pesoGramos, alturaCm, largoCm, caracteristicas, fotoUri, padreId, madreId })`** (`:975-1552`). Devuelve `undefined`. Errores en orden: `AVE_NO_ENCONTRADA` (`:1023-1029`), `AVE_NO_ACTIVA` (`:1032-1041`), `PADRE_ES_MISMA_AVE`, `MADRE_ES_MISMA_AVE`, `PADRES_IGUALES` (`:1044-1085`), los de `validarRelacionPadres` con `aveId` incluidos `PARENTESCO_CIRCULAR_*` (`:1088-1094`), `CODIGO_AVE_DUPLICADO` (`:1105-1131`). Consumo: `NuevaAveScreen.js:1027-1086`; éxito -> Alert y `goBack`. `AVE_NO_ACTIVA`, `AVE_NO_ENCONTRADA` y `PADRE/MADRE_NO_ENCONTRADA` en guardado no tienen mapeo y caen en "No fue posible actualizar el ave." (`:1335-1340`).

**`cambiarJaulaAve({ aveId, jaulaAnteriorId, nuevaJaulaId, codigoAve })`** (`:1555-1716`). Devuelve `undefined`. No lanza errores de dominio; errores de FK/SQL se propagan. Consumo: `SeleccionarAveJaulaScreen.js:172-188` (éxito "Ave asignada" / "El ave {codigo} ahora pertenece a la jaula {jaulaCodigo}."; error "Error" / "No fue posible asignar el ave a la jaula."), `DetalleJaulaScreen.js:273-296` (éxito "Ave retirada" / "El ave {codigo} quedó sin jaula asignada."; error "No fue posible retirar el ave de la jaula.").

**`obtenerHistorialAve(aveId)`** (`:1719-1750`). Arreglo de `ave_historial` (`h.*` = `id, ave_id, jaula_id, tipo_evento, fecha, detalle, fecha_creacion`) más `jaula_codigo`, `ORDER BY h.fecha DESC, h.id DESC`. **Sin llamadores en `src/`.**

**`obtenerAvesVendidas()`** (`:1760-1826`). Aves `VENDIDA` con `INNER JOIN bajas_ave ... tipo = 'VENTA'`; campos `id, codigo, origen, fecha_nacimiento, edad_meses_compra, fecha_ingreso, raza, sexo, peso_gramos, altura_cm, largo_cm, caracteristicas, foto_uri, padre_id, madre_id, jaula_actual_id, estado, estado_salud, jaula_codigo, jaula_nombre, padre_codigo, madre_codigo, fecha_venta, celular, ciudad_destino, cooperativa_envio, comprador, valor_venta, valor_envio, detalle` (`:1770-1802`; no trae `criadero_origen`, `metodo_envio` ni `fecha_creacion`). Orden `b.fecha DESC`. Consumo: `AvesScreen.js:70-72`.

**`obtenerAvesFallecidas()`** (`:1828-1889`). Igual con `tipo = 'MUERTE'`; campos de ave (mismos que vendidas) más `fecha_fallecimiento, causa, detalle` (`:1838-1865`). Consumo: `AvesScreen.js:73-75`.

**`obtenerBajaAve(aveId)`** (`:1891-1929`). Una fila de `bajas_ave` `{ id, tipo, fecha, causa, celular, ciudad_destino, cooperativa_envio, comprador, valor_venta, valor_envio, detalle }`, `ORDER BY fecha DESC LIMIT 1`. Consumo: `DetalleAveScreen.js:107-116` (campos usados en `:599-682`).

### EvolucionAveRepository.js

**`obtenerEvolucionAve(aveId)`** (`:6-41`). Arreglo `{ id, ave_id, fecha, foto_uri, peso_gramos, altura_cm, largo_cm, caracteristicas, observacion, fecha_creacion }`, `ORDER BY fecha DESC, id DESC`. **Sin llamadores en pantallas** (`EvolucionAveScreen.js` solo importa `registrarEvolucionAve`, `:26-28`; el historial de evolución se ve en el ciclo de vida).

**`registrarEvolucionAve({ aveId, fotoUri, pesoGramos, alturaCm, largoCm, caracteristicas, observacion })`** (`:44-410`). Devuelve `undefined`. Error: `AVE_NO_ENCONTRADA` (`:91-97`). Efectos en una transacción: lee el ave (`:66-88`); si no tiene evoluciones inserta una "Registro inicial" con `fecha = aves.fecha_creacion || ahora`, foto/medidas/características actuales (`:100-176`); calcula medidas finales (`numeroOActual`: si no se informa una medida conserva la actual, `:179-197,429-471`); `UPDATE aves` de foto_uri, peso, altura, largo, caracteristicas (`caracteristicas || null`) y `fecha_actualizacion` (`:200-230`); inserta la evolución nueva con `observacion || null` (`:233-268`); inserta `ave_historial` `EVOLUCION` con `jaula_id` actual y detalle "Evolución registrada. {cambios unidos con '. '}." o "Se actualizó la evolución del ave." (+ " {observacion}" si existe), con cambios del tipo "Peso: 800 g → 850 g", "Altura: ...", "Largo: ...", "Fotografía actualizada", "Características actualizadas" y "No registrado" para medidas previas vacías (`:271-405,511-531`). No valida estado del ave. Consumo: `EvolucionAveScreen.js:396-425`; éxito "Evolución registrada" / "La nueva información fue guardada y el estado anterior permanecerá en el historial." (`:428-444`); error "Error" / "No fue posible guardar la evolución del ave." (`:455-458`).

### GenealogiaRepository.js

**`obtenerGenealogiaAve(aveId, generaciones = 3)`** (`:7-240`). Devuelve `null` si el ave no existe (`:67-71`); si no `{ ave, generaciones, ancestros, descendientes, relacionesInvalidas }` (`:228-238`). `ave` y cada nodo: `{ id, codigo, raza, sexo, foto_uri, estado, estado_salud, fecha_nacimiento }` (`mapearAve`, `:734-757`). `ancestros`: nodo con `padres: [{ relacion, nodo }]`, `relacion` en {"Padre","Madre","Ancestro paterno","Ancestro materno"} (`:291-322`). `descendientes`: nodo con `hijos: []` (`:534-538`). `generaciones` devuelto = `min(4, max(1, Number(generaciones) || 3))`. `relacionesInvalidas`: `[{ tipo: 'PARENTESCO_CIRCULAR', detalle }]`. Sin errores de dominio. Consumo: `GenealogiaAveScreen.js:68-77`; `null` o error de carga -> "No fue posible encontrar el ave." (`:150-174`; el error solo va a `console.error`, `:80-87`).

### CicloVidaRepository.js

**`obtenerCicloVidaAve(aveId)`** (`:6-728`). `[]` si el ave no existe (`:34-38`); si no arreglo de eventos ordenados por fecha descendente (`:714-723`) con forma `{ id, tipo, fecha, titulo, detalle, ... }` (`id` como `llegada-{id}`, `nacimiento-{id}`, `hist-{id}`, `evolucion-{id}`, `salud-{id}`, `huevos-{fecha_dia}`, `venta-{id}`, `muerte-{id}`; extras `jaulaCodigo`, `fotoUri`, `caracteristicas`). Mezcla `aves`, `ave_historial` (excluye `SALUD`, `POSTURA_HUEVO`, `EVOLUCION`, `VENTA`, `MUERTE`, `BAJA`, `:207-223`), `ave_evolucion` (omite la "Registro inicial", `:277-288`), `diagnosticos_ave`/`tratamientos_ave`, `huevos` agrupados por día y `bajas_ave`. Títulos de historial (`:867-901`): `ALTA` "Registro inicial", `CAMBIO_JAULA` "Cambio de jaula", `DATOS_ACTUALIZADOS` "Datos actualizados", `RECUPERACION` "Ave recuperada", otros "Actualización". Consumo: `CicloVidaAveScreen.js:87`.

**`registrarEventoCicloVida({ aveId, tipoEvento, detalle, fecha = null })`** (`:731-767`). `undefined`; inserta en `ave_historial` `(ave_id, tipo_evento, fecha, detalle)` con `fecha || ISO ahora` y `detalle || null`; sin transacción, sin `jaula_id`. Único llamador: `FinalizarTratamientoScreen.js:78-93`.

### SaludRepository.js

**`obtenerEnfermedades()`** (`:7-46`) y **`obtenerMedicamentos()`** (`:51-90`). Arreglo `{ id, codigo, nombre }` de ítems activos de los catálogos `ENFERMEDADES`/`MEDICAMENTOS` ordenados por `nombre`. Consumo: `SaludAveScreen.js:189-192`.

**`registrarDiagnostico({ aveId, enfermedad, sintomas, observacion, medicamento, dosis, fecha })`** (`:95-270`). `undefined`. Una transacción: inserta `diagnosticos_ave(ave_id, fecha, enfermedad, sintomas, observacion, estado='ACTIVO')` con `sintomas || null`, `observacion || null` (`:124-156`); si hay `medicamento` inserta `tratamientos_ave(diagnostico_id, ave_id, fecha, medicamento, dosis || null, observacion || null)` (`:165-203`); `UPDATE aves SET estado_salud='EN_TRATAMIENTO', fecha_ultimo_control_salud=?` (`:207-229`); `ave_historial` `SALUD`, detalle `Diagnóstico registrado: ${enfermedad}` (`:233-263`). Sin errores de dominio. Consumo: `SaludAveScreen.js:276-308` (`enfermedad` = `nombre` del ítem, `medicamento` = `nombre` o `null`, `fecha` ISO); éxito Alert "Registro guardado" / "El tratamiento fue registrado correctamente." y recarga (`:312-329`); **en error solo `console.error`, sin mensaje al usuario** (`:333-341`).

**`obtenerHistorialSaludAve(aveId)`** (`:276-326`). Arreglo `{ id, fecha, enfermedad, sintomas, observacion, medicamento, dosis }` (`LEFT JOIN tratamientos_ave`), `ORDER BY d.fecha DESC`; sin filtro de estado. Consumo: `SaludAveScreen.js:195-197`; muestra `🔴 {enfermedad}`, medicamento o "Sin medicamento", dosis (`:749-799`).

**`actualizarEstadoSaludAve({ aveId, estado })`** (`:332-370`). `undefined`; `UPDATE aves SET estado_salud = ?, fecha_ultimo_control_salud = CURRENT_TIMESTAMP`; no valida `estado`. **Sin llamadores.**

### BajaAveRepository.js (resumen; el contrato completo corresponde al módulo de bajas)

**`registrarMuerteAve({ aveId, causa, detalle })`** (`:7-129`). `undefined`. Transacción: `UPDATE aves SET estado='FALLECIDA', fecha_actualizacion = ISO` (`:29-47`); `INSERT bajas_ave` tipo `MUERTE`, `causa || null`, `detalle || null` (`:51-85`); `INSERT ave_historial` `MUERTE` con `detalle || 'Ave dada de baja por fallecimiento.'` (`:89-122`). Sin errores de dominio.

**`registrarVentaAve({ aveId, fechaVenta, celular, ciudadDestino, cooperativaEnvio, comprador, valorVenta, valorEnvio, detalle })`** (`:133-436`). `undefined`. Error: `CELULAR_COMPRADOR_REQUERIDO` si `normalizarCelular` queda vacío (`:157-171`; normaliza `593`+9 dígitos y 9 dígitos que empiezan por `9` a `0…`, `:494-536`). `numeroNoNegativo` devuelve `null` si vacío o inválido o `< 0` (`:540-579`). Transacción: `UPDATE aves` `VENDIDA`; `INSERT bajas_ave` `VENTA`; 2 `movimientos_financieros` `INGRESO` (`VENTA_AVE` y `ENVIO_AVE`, valor `?? 0`, detalle con el id interno del ave, `:275-353`); `ave_historial` `VENTA` con "Ave vendida. Celular: … Comprador: … Destino: … {detalle}" (`:357-429`). Consumo: `BajaAveScreen.js:145-241`; la pantalla comprueba antes tipo, celular y valores (ver "Validaciones en pantalla"); cualquier error del repositorio cae en "Error" / "No fue posible completar la baja del ave." (`:274-289`), incluido `CELULAR_COMPRADOR_REQUERIDO`.

### JaulaRepository.js (solo lo que toca aves)

**`desactivarJaula(id)`** (`:223-394`). Devuelve `{ cantidadAvesLiberadas }` (`:390-392`). Error `JAULA_NO_ENCONTRADA` (`:258-264`); si la jaula ya está inactiva retorna sin hacer nada (`:267-275`, el valor devuelto es entonces `{ cantidadAvesLiberadas: 0 }`). Por cada ave con `jaula_actual_id = id` (cualquier estado, `:278-291`): `ave_historial` `CAMBIO_JAULA` con `jaula_id = null` y detalle "La jaula {codigo} fue eliminada. El ave quedó sin jaula asignada." (`:303-326`); `jaula_historial` `SALIDA_AVE` "Ave {codigo} salió de la jaula porque la jaula fue eliminada." (`:329-352`); luego `UPDATE aves SET jaula_actual_id = NULL, fecha_actualizacion = CURRENT_TIMESTAMP` (`:357-368`) y `UPDATE jaulas SET activa=0, fecha_desactivacion` (`:371-384`). Consumo: `DetalleJaulaScreen.js:540-558`.

### ConfiguracionRepository.js (catálogos que usa el módulo)

- `obtenerCatalogos()` (`:7-39`): `{ id, codigo, nombre, activo }` activos por `nombre`. `obtenerCatalogoPorCodigo(codigo)` (`:44-77`): `{ id, codigo, nombre }` o falso. `obtenerItemsCatalogo(catalogoId)` (`:82-130`): `{ id, codigo, nombre, descripcion, activo, orden }`, solo `activo = 1`, `ORDER BY orden, nombre`.
- `crearItemCatalogo({ catalogoId, codigo, nombre, descripcion })` (`:135-198`): inserta con `activo = 1` (el `orden` no se pasa). `actualizarItemCatalogo({ id, nombre, descripcion })` (`:203-246`): solo cambia nombre y descripción, **no el código**. `eliminarItemCatalogo(id)` (`:251-279`): baja lógica `activo = 0`.
- Catálogos editables en la UI: `RAZAS`, `ENFERMEDADES`, `MEDICAMENTOS`, `ALIMENTOS`, `BEBIDAS`, `CATEGORIAS_FINANCIERAS` (`ConfiguracionScreen.js:23-55`). `SEXOS` no. Alta de ítem: el `codigo` se deriva del nombre en mayúsculas con espacios a `_` (`EditarCatalogoItemScreen.js:120-127`); un código repetido en el mismo catálogo viola `UNIQUE(catalogo_id, codigo)` (`migrations.js:25`) y la pantalla muestra "No fue posible guardar el elemento." (`:171-174`). Nombre vacío: "Nombre requerido" / "Ingrese un nombre." (`:71-82`). Eliminar pide confirmación "Eliminar elemento" / "¿Desea eliminar {nombre}?" (`CatalogoScreen.js:152-216`).
- Consecuencia para aves: la raza se guarda por `nombre`; renombrar un ítem no actualiza `aves.raza` y dar de baja un ítem no cambia las aves ya guardadas (`NuevaAveScreen.js:503-521`).

## Validaciones en pantalla

Reglas que viven solo en la UI (el repositorio no las aplica), para que el backend también las aplique. Código V2 propuesto: se reutiliza `VALIDATION_ERROR` (HTTP 400 en el estilo actual de `api/src/criaderos/criaderos.routes.ts:35-36,84-85,137-138`) siempre que no haga falta distinguir el caso; los códigos marcados (propuesta) son nuevos. `FORBIDDEN` existe (`criaderos.routes.ts:72,125,184`).

| Regla | Mensaje exacto (título / mensaje) | Archivo:línea | Código V2 propuesto |
|---|---|---|---|
| Código obligatorio (tras `trim`) | "Código requerido" / "Ingresa un código para el ave." | `NuevaAveScreen.js:747-756` | `VALIDATION_ERROR` |
| Código máximo 30 caracteres | (sin mensaje: `maxLength={30}` corta la entrada) | `NuevaAveScreen.js:1458` | `VALIDATION_ERROR` |
| Código en mayúsculas, sin espacios en los extremos | (sin mensaje: normalización) | `NuevaAveScreen.js:741-744`; `AveRepository.js:798-800` | normalizar en servicio |
| Código único (todas las aves, cualquier estado) | "Código duplicado" / "Ya existe un ave con ese código." | `NuevaAveScreen.js:979-997,1209-1234` | `CODIGO_AVE_DUPLICADO` (R-P14, código de V1, 409) |
| Raza obligatoria (texto, validada contra el catálogo `RAZAS` del criadero, R-P2) | "Raza requerida" / "Selecciona la raza del ave." | `NuevaAveScreen.js:759-768` | `VALIDATION_ERROR` (`raza`) |
| Sexo obligatorio siempre (texto = código `MACHO`/`HEMBRA`, validado contra `SEXOS`, R-P2/R-P5) | "Sexo requerido" / "Selecciona si el ave es macho o hembra." | `NuevaAveScreen.js:771-780` | `VALIDATION_ERROR` (`sexo`) |
| Peso vacío o número > 0 | "Peso inválido" / "El peso debe ser un número mayor a cero o dejarse vacío." | `NuevaAveScreen.js:783-798,2627-2679` | `VALIDATION_ERROR` |
| Altura vacía o número > 0 | "Altura inválida" / "La altura debe ser un número mayor a cero o dejarse vacía." | `NuevaAveScreen.js:801-816` | `VALIDATION_ERROR` |
| Largo vacío o número > 0 | "Largo inválido" / "El largo debe ser un número mayor a cero o dejarse vacío." | `NuevaAveScreen.js:819-834` | `VALIDATION_ERROR` |
| Padre y madre distintos | "Padres inválidos" / "El padre y la madre no pueden ser la misma ave." | `NuevaAveScreen.js:837-852,1289-1302` | `AVE_PARENTS_EQUAL` (propuesta) |
| COMPRADA: edad entera >= 0 | "Edad requerida" / "Ingresa la edad del ave en meses usando un número entero igual o mayor a cero." | `NuevaAveScreen.js:888-909` | `VALIDATION_ERROR` |
| COMPRADA: criadero de origen no vacío | "Criadero requerido" / "Ingresa el nombre del criadero de origen." | `NuevaAveScreen.js:912-924` | `VALIDATION_ERROR` |
| COMPRADA: método de envío no vacío | "Método de envío requerido" / "Ingresa el método de envío o traslado del ave." | `NuevaAveScreen.js:927-939` | `VALIDATION_ERROR` |
| Edad solo dígitos | (sin mensaje: filtra la entrada) | `NuevaAveScreen.js:1829-1837` | `VALIDATION_ERROR` |
| Medidas: solo dígitos y un punto; coma = punto | (sin mensaje) | `NuevaAveScreen.js:2591-2624,2627-2639` | `VALIDATION_ERROR` |
| Fechas de nacimiento/ingreso no futuras | (sin mensaje: `maximumDate = hoy`; el repositorio no valida) | `NuevaAveScreen.js:1700-1702,1882-1884` | `VALIDATION_ERROR` (R-P13, aprobada; ver P-11) |
| Solo se edita un ave ACTIVA | "Edición no disponible" / "Solo se pueden editar aves activas." | `NuevaAveScreen.js:408-417,637-657`; `AveRepository.js:1032-1041` | `AVE_NOT_ACTIVE` (propuesta, 409) |
| Padre descendiente de la ave | "Relación genealógica inválida" / "El ave seleccionada como padre es descendiente de esta misma ave. Esto generaría un ciclo imposible en el árbol genealógico." | `NuevaAveScreen.js:1237-1250` | `AVE_PARENT_CIRCULAR` (propuesta) |
| Madre descendiente de la ave | "Relación genealógica inválida" / "El ave seleccionada como madre es descendiente de esta misma ave. Esto generaría un ciclo imposible en el árbol genealógico." | `NuevaAveScreen.js:1253-1266` | `AVE_PARENT_CIRCULAR` |
| Padre/madre = la propia ave | "Relación genealógica inválida" / "Un ave no puede registrarse a sí misma como padre o madre." | `NuevaAveScreen.js:1269-1286` | `AVE_PARENT_IS_SELF` (propuesta) |
| Padre debe ser macho | "Sexo del progenitor inválido" / "El ejemplar seleccionado como padre debe estar registrado como macho." | `NuevaAveScreen.js:1305-1326` | `PADRE_NO_MACHO` (R-P14, código de V1) |
| Madre debe ser hembra | "Sexo del progenitor inválido" / "El ejemplar seleccionado como madre debe estar registrado como hembra." | `NuevaAveScreen.js:1305-1326` | `MADRE_NO_HEMBRA` (R-P14, código de V1) |
| Padre/madre inexistente (sin mapeo en pantalla) | cae en "Error" / "No fue posible registrar el ave." o "…actualizar el ave." | `NuevaAveScreen.js:1335-1340`; `AveRepository.js:493-499,538-544` | `AVE_PARENT_NOT_FOUND` (propuesta) |
| Candidato a padre: sexo `MACHO`; a madre: `HEMBRA` (la UI filtra; el repositorio solo rechaza sexos distintos si hay sexo) | (sin mensaje) | `NuevaAveScreen.js:1762-1768,1790-1796`; `AveRepository.js:502-513,547-558` | R-P5 decidida: sexo siempre exigido y `MACHO`/`HEMBRA` validado para padre y madre; R-P11: cualquier ave del criadero con el sexo correcto, sin validar estado ni fechas |
| Padres solo con origen NACIDA_CRIADERO (pantalla envía `null` si COMPRADA) | (sin mensaje) | `NuevaAveScreen.js:1074-1084,1158-1168`; `AveRepository.js:1134-1145` | normalizar en servicio |
| Evolución: medidas vacías o > 0 | "Medidas inválidas" / "Peso, altura y largo son opcionales, pero cuando se ingresan deben ser números mayores a cero." | `EvolucionAveScreen.js:300-315,910-959` | `VALIDATION_ERROR` |
| Evolución: algún cambio u observación | "Sin cambios" / "Modifica la fotografía, características, alguna medida o agrega una observación." | `EvolucionAveScreen.js:345-366` | `VALIDATION_ERROR` |
| Diagnóstico: enfermedad obligatoria | "Enfermedad requerida" / "Selecciona una enfermedad." | `SaludAveScreen.js:252-263` | `VALIDATION_ERROR` |
| "Finalizar tratamiento" solo con `EN_TRATAMIENTO` (en V1 solo se oculta el botón; no hay comprobación en servidor; el servidor de V2 sí rechaza, P-13) | (sin mensaje) | `SaludAveScreen.js:451-488` | código por definir (subregla R-P1a) |
| Baja: tipo obligatorio | "Seleccione una opción" / "Debe seleccionar si es venta o fallecimiento." | `BajaAveScreen.js:117-128` | módulo bajas |
| Venta: celular obligatorio | "Celular requerido" / "Ingrese el número celular del comprador." | `BajaAveScreen.js:162-173` | módulo bajas |
| Venta: valores vacíos o >= 0 | "Valor inválido" / "El valor de venta y el valor de envío son opcionales, pero si se ingresan deben ser números mayores o iguales a cero." | `BajaAveScreen.js:188-201` | módulo bajas |
| Confirmación al asignar a jaula | "Asignar ave" / "El ave {codigo} actualmente pertenece a la jaula {jaula_codigo}. ¿Deseas moverla a {jaulaCodigo}?" o "¿Deseas agregar el ave {codigo} a la jaula {jaulaCodigo}?" (botones Cancelar / Mover o Agregar) | `SeleccionarAveJaulaScreen.js:120-159` | UI |
| Confirmación al quitar de jaula | "Quitar ave" / "¿Deseas retirar el ave {codigo} de la jaula {jaula.codigo}?" (Cancelar / Quitar) | `DetalleJaulaScreen.js:231-265` | UI |

Mensajes de error genéricos y estados de la UI relevantes (se mantienen en V2 más los estados de red aceptados): "Error" / "No fue posible cargar los datos del ave." (`NuevaAveScreen.js:660-665`), "…cargar las aves o jaulas disponibles." (`:664`), "Error" / "No fue posible cargar el ave." (`EvolucionAveScreen.js:153-156`), "Ave no encontrada." (`DetalleAveScreen.js:220`, `EvolucionAveScreen.js:515`), "No fue posible encontrar el ave." (`GenealogiaAveScreen.js:167`).

## Paridad con V1

Formato: id | dado | cuando | entonces | evidencia V1. "Tablas" son las de V1; en V2 se traducen al modelo D1 con las diferencias aprobadas.

| ID | Dado | Cuando | Entonces | Evidencia V1 |
|---|---|---|---|---|
| PAR-AVE-001 | Sin aves; catálogos con raza y sexo | Alta NACIDA con código, raza, sexo | `aves` con `estado='ACTIVA'`, `estado_salud='SANA'` (default), `fecha_nacimiento` = fecha elegida, edad/ingreso/criadero/método `NULL`; 1 fila `ave_evolucion` con `observacion='Registro inicial'`; 1 `ave_historial` `ALTA` "Ave registrada como nacida en el criadero." con `jaula_id` NULL; sin `jaula_historial` | `NuevaAveScreen.js:875-885,1113-1172`; `AveRepository.js:767-930`; `migrationV2.js:6-8` |
| PAR-AVE-002 | Idem | Alta COMPRADA con edad 8, ingreso 2025-06-15, criadero y método | `fecha_ingreso='2025-06-15'`, `edad_meses_compra=8`, `fecha_nacimiento='2024-10-15'`, `criadero_origen`/`metodo_envio` con `trim`; `padre_id`/`madre_id` NULL; historial `ALTA` "Ave registrada como comprada." | `NuevaAveScreen.js:888-969,2715-2761`; `AveRepository.js:923-928` |
| PAR-AVE-003 | Una jaula activa | Alta con jaula inicial | `aves.jaula_actual_id` = jaula; `ave_historial.jaula_id` = jaula; `jaula_historial` `INGRESO_AVE` "Ave {CODIGO} ingresó a la jaula."; sin `CAMBIO_JAULA` | `AveRepository.js:850-851,916,933-964` |
| PAR-AVE-004 | Alta | Código " k001 " | Se guarda `K001` (también en el detalle de `jaula_historial`) | `NuevaAveScreen.js:741-744`; `AveRepository.js:798-800,956-960` |
| PAR-AVE-005 | Alta | Código vacío o solo espacios | Alert "Código requerido" / "Ingresa un código para el ave."; no se escribe nada | `NuevaAveScreen.js:747-756` |
| PAR-AVE-006 | Existe `K001` (ACTIVA); otro caso con `K001` VENDIDA | Alta con `k001` | Alert "Código duplicado" / "Ya existe un ave con ese código."; sin escritura (unicidad entre todos los estados) | `NuevaAveScreen.js:979-997`; `AveRepository.js:684,706` |
| PAR-AVE-007 | Alta | Sin raza | "Raza requerida" / "Selecciona la raza del ave." | `NuevaAveScreen.js:759-768` |
| PAR-AVE-008 | Alta con raza | Sin sexo | "Sexo requerido" / "Selecciona si el ave es macho o hembra." | `NuevaAveScreen.js:771-780` |
| PAR-AVE-009 | Alta | Peso "0", "-1", "abc"; peso vacío; peso "850,5" | Las tres primeras: "Peso inválido" / "El peso debe ser un número mayor a cero o dejarse vacío."; vacío -> `NULL`; "850,5" -> 850.5 | `NuevaAveScreen.js:783-798,2627-2679` |
| PAR-AVE-010 | Alta | Altura o largo inválidos | "Altura inválida" / "La altura debe ser un número mayor a cero o dejarse vacía." / "Largo inválido" / "El largo debe ser un número mayor a cero o dejarse vacío." | `NuevaAveScreen.js:801-834` |
| PAR-AVE-011 | Alta NACIDA | Padre y madre con el mismo id | "Padres inválidos" / "El padre y la madre no pueden ser la misma ave." | `NuevaAveScreen.js:837-852`; `AveRepository.js:458-470` |
| PAR-AVE-012 | Alta COMPRADA | Edad vacía | "Edad requerida" / "Ingresa la edad del ave en meses usando un número entero igual o mayor a cero." | `NuevaAveScreen.js:894-909` |
| PAR-AVE-013 | Alta COMPRADA | Criadero con solo espacios; método con solo espacios | "Criadero requerido" / "Ingresa el nombre del criadero de origen."; "Método de envío requerido" / "Ingresa el método de envío o traslado del ave." | `NuevaAveScreen.js:912-939` |
| PAR-AVE-014 | Alta COMPRADA | Ingreso 2025-03-31 y edad 1; ingreso 2024-03-31 y edad 1; ingreso 2025-05-31 y edad 3 | `fecha_nacimiento` = 2025-02-28; 2024-02-29; 2025-02-28 (resultados derivados del algoritmo `restarMeses`; confirmar con prueba unitaria) | `NuevaAveScreen.js:2715-2761` |
| PAR-AVE-015 | Alta NACIDA; ave `H1` con sexo HEMBRA | Padre = `H1` | Error `PADRE_NO_MACHO` -> "Sexo del progenitor inválido" / "El ejemplar seleccionado como padre debe estar registrado como macho." (la UI no lo ofrece; el repositorio lo rechaza) | `AveRepository.js:502-513`; `NuevaAveScreen.js:1305-1326` |
| PAR-AVE-016 | Alta NACIDA; ave `M1` con sexo MACHO | Madre = `M1` | `MADRE_NO_HEMBRA` -> "Sexo del progenitor inválido" / "El ejemplar seleccionado como madre debe estar registrado como hembra." | `AveRepository.js:547-558`; `NuevaAveScreen.js:1317-1321` |
| PAR-AVE-017 | Alta | Padre con id inexistente | `PADRE_NO_ENCONTRADO` sin mapeo -> "Error" / "No fue posible registrar el ave."; transacción revertida | `AveRepository.js:493-499`; `NuevaAveScreen.js:1335-1340` |
| PAR-AVE-018 | Ave ACTIVA con peso 800 | Editar solo el peso a 850 | `UPDATE aves` (peso, `fecha_actualizacion`); `ave_historial` `DATOS_ACTUALIZADOS` "Datos generales actualizados: peso." con `jaula_id` actual; **no** hay nueva fila en `ave_evolucion` | `AveRepository.js:1148-1226,1244-1547` |
| PAR-AVE-019 | Ave ACTIVA | Guardar la edición sin cambiar nada | `ave_historial` `DATOS_ACTUALIZADOS` "Se guardó la edición de los datos generales sin cambios visibles." (el evento se inserta) | `AveRepository.js:1515-1547` |
| PAR-AVE-020 | Ave VENDIDA o FALLECIDA | Abrir edición | Alert "Edición no disponible" / "Solo se pueden editar aves activas." y vuelve atrás; el repositorio lanza `AVE_NO_ACTIVA` | `NuevaAveScreen.js:408-417,637-657`; `AveRepository.js:1032-1041` |
| PAR-AVE-021 | Dos aves `A`, `B` | Editar `A` con el código de `B` | "Código duplicado" / "Ya existe un ave con ese código." (pantalla) o `CODIGO_AVE_DUPLICADO` (repositorio); editar con su propio código no es duplicado | `NuevaAveScreen.js:979-997,1209-1234`; `AveRepository.js:684-690,1105-1131` |
| PAR-AVE-022 | `A` es padre de `B` | Editar `A` con padre = `B` | `PARENTESCO_CIRCULAR_PADRE` -> "Relación genealógica inválida" / "El ave seleccionada como padre es descendiente de esta misma ave. Esto generaría un ciclo imposible en el árbol genealógico." (con madre, texto análogo con "madre") | `AveRepository.js:590-617`; `NuevaAveScreen.js:1237-1266` |
| PAR-AVE-023 | Ave con padre/madre | Editar y cambiar origen a COMPRADA | `padre_id`/`madre_id` quedan NULL; el detalle del historial incluye `origen`, `padre`, `madre` (y los campos que cambien) | `AveRepository.js:1134-1145,1244-1512` |
| PAR-AVE-024 | Ave sin jaula; jaula activa | Asignar (confirmar "Agregar") | `aves.jaula_actual_id` = jaula; `ave_historial` `CAMBIO_JAULA` "El ave fue asignada a una jaula."; `jaula_historial` solo `INGRESO_AVE` | `AveRepository.js:1574-1647,1682-1711`; `SeleccionarAveJaulaScreen.js:120-159` |
| PAR-AVE-025 | Ave en jaula J1 | Asignar a J2 ("Mover") | `CAMBIO_JAULA` "El ave fue movida de una jaula a otra." con `jaula_id`=J2; `SALIDA_AVE` en J1 ("Ave {codigo} salió de la jaula.") e `INGRESO_AVE` en J2 | `AveRepository.js:1597-1711` |
| PAR-AVE-026 | Ave en jaula J1 | Quitar de la jaula | `jaula_actual_id` NULL; `CAMBIO_JAULA` "El ave fue retirada de su jaula." con `jaula_id` NULL; solo `SALIDA_AVE`; Alert "Ave retirada" / "El ave {codigo} quedó sin jaula asignada." | `AveRepository.js:1615-1679`; `DetalleJaulaScreen.js:273-296` |
| PAR-AVE-027 | Aves ACTIVA, VENDIDA, FALLECIDA | Listar ACTIVAS | Solo las ACTIVA, por `codigo` ascendente, con `jaula_codigo`, `padre_codigo`, `madre_codigo` | `AveRepository.js:54-56` |
| PAR-AVE-028 | Ave VENDIDA con baja `VENTA`; otra VENDIDA sin baja | Listar VENDIDAS | Solo aparece la que tiene baja (`INNER JOIN`), por fecha de baja descendente, con campos de venta | `AveRepository.js:1806-1821` |
| PAR-AVE-029 | Lista cargada | Combinar búsqueda, raza, sexo, salud, jaula y edad | Filtrado en memoria con igualdad exacta de raza/sexo; edad excluye aves sin `fecha_nacimiento`; contador "{n} ave(s) encontrada(s)"; vacío "Sin resultados" | `AvesScreen.js:141-265,470-473,524-529` |
| PAR-AVE-030 | Ave inexistente | Abrir detalle | "Ave no encontrada." | `DetalleAveScreen.js:209-228` |
| PAR-AVE-031 | Ave ACTIVA / VENDIDA | Abrir detalle | ACTIVA: botones Editar, Evolución, Salud, Registrar huevo, Ciclo de vida, Genealogía, Dar de baja; VENDIDA/FALLECIDA: solo Ciclo de vida y Genealogía y la tarjeta de baja | `DetalleAveScreen.js:580-686,820-1052` |
| PAR-AVE-032 | Aves activas y descendientes de `A` | Candidatos a padre al editar `A` | Excluye a `A` y a sus descendientes (cualquier estado); solo ACTIVA; padre solo `MACHO` (+ el ya seleccionado), madre solo `HEMBRA` | `AveRepository.js:190-258`; `NuevaAveScreen.js:1762-1796` |
| PAR-AVE-033 | Ave con 4 niveles de ancestros | Genealogía con 3 (default), 2, 4; y con valor 9 o 0 | Profundidad `min(4, max(1, n \|\| 3))` (9 -> 4; 0 -> 3 por `\|\| 3`); la pantalla solo ofrece 2, 3, 4 | `GenealogiaRepository.js:16-23`; `GenealogiaAveScreen.js:363-368` |
| PAR-AVE-034 | Datos con ciclo (solo construible fuera de la app) | Genealogía | `relacionesInvalidas` con el texto de ciclo y nodos ocultos; en V2 el ciclo no es construible por la API (prueba unitaria de servicio/consulta, no de datos) | `GenealogiaRepository.js:189-225,706-730` |
| PAR-AVE-035 | Ave ACTIVA sin evoluciones | Registrar evolución con peso 850 | Se inserta evolución "Registro inicial" con `fecha_creacion` del ave, luego la nueva; `UPDATE aves` peso y `fecha_actualizacion`; `ave_historial` `EVOLUCION` "Evolución registrada. Peso: No registrado → 850 g." (+ observación) | `EvolucionAveRepository.js:100-405` |
| PAR-AVE-036 | Pantalla de evolución | Sin cambios ni observación; peso "0" | "Sin cambios" / "Modifica la fotografía, características, alguna medida o agrega una observación."; "Medidas inválidas" / "Peso, altura y largo son opcionales, pero cuando se ingresan deben ser números mayores a cero." | `EvolucionAveScreen.js:300-366` |
| PAR-AVE-037 | Ave ACTIVA SANA | Registrar diagnóstico (enfermedad y medicamento) | `diagnosticos_ave.estado='ACTIVO'`; `tratamientos_ave` con medicamento/dosis; `aves.estado_salud='EN_TRATAMIENTO'`, `fecha_ultimo_control_salud` = fecha; `ave_historial` `SALUD` "Diagnóstico registrado: {enfermedad}"; Alert "Registro guardado" / "El tratamiento fue registrado correctamente." | `SaludRepository.js:124-263`; `SaludAveScreen.js:276-329` |
| PAR-AVE-038 | Salud | Guardar sin enfermedad | "Enfermedad requerida" / "Selecciona una enfermedad." | `SaludAveScreen.js:252-263` |
| PAR-AVE-039 | Ave `EN_TRATAMIENTO` con diagnóstico `ACTIVO` | Finalizar tratamiento (comportamiento completo de v1.0.0, R-P1 aprobada; todo en una transacción) | `aves.estado_salud='SANA'` y `fecha_ultimo_control_salud` = ahora; diagnósticos `ACTIVO` del ave -> `CERRADO`; `ave_historial` `SALUD` ("Recuperación registrada: {obs}" o "Ave recuperada y tratamiento finalizado."); evento `RECUPERACION` con detalle "Tratamiento finalizado. {obs}" o "Tratamiento finalizado. El ave volvió al estado sana."; Alert "Tratamiento finalizado" / "El ave volvió al estado sana." | `FinalizarTratamientoScreen.js:49-113`; v1.0.0 (`4a8cc6c`, `EstadoSaludRepository.js`, verificado con git) |
| PAR-AVE-040 | Ave `SANA` | Abrir Salud | No se muestra el botón "Finalizar tratamiento" | `SaludAveScreen.js:451-488` |
| PAR-AVE-041 | Ave con evento `RECUPERACION` | Abrir ciclo de vida | Aparece "Ave recuperada" (✅) con el detalle; los `SALUD` de historial no aparecen (se reconstruyen de los diagnósticos) | `CicloVidaRepository.js:207-223,890-892`; `CicloVidaAveScreen.js:715-721` |
| PAR-AVE-042 | Ave ACTIVA en una jaula | Baja por fallecimiento | `estado='FALLECIDA'`, `bajas_ave` `MUERTE`, `ave_historial` `MUERTE` "Ave dada de baja por fallecimiento." (o el detalle); **conserva `jaula_actual_id`** | `BajaAveRepository.js:29-122` |
| PAR-AVE-043 | Jaula con aves ACTIVA y una VENDIDA asignadas | Desactivar la jaula | Todas las aves con esa jaula (incluida la vendida) quedan con `jaula_actual_id` NULL; por cada una `CAMBIO_JAULA` y `SALIDA_AVE` | `JaulaRepository.js:278-368` |
| PAR-AVE-044 | Catálogo `RAZAS` con un ítem dado de baja o renombrado y un ave con esa raza | Editar el ave | V1: la raza no coincide y aparece "Raza requerida" hasta reelegir (texto). V2 (R-P2) mantiene el texto, validado contra el catálogo del criadero al guardar; al editar un ave cuya raza ya no está activa el servidor exige elegir una activa, como V1 (P-04 sustituida) | `NuevaAveScreen.js:503-521,759-768` |
| PAR-AVE-045 | Catálogo `SEXOS` | Alta | Solo `MACHO` y `HEMBRA`; se guarda el código | `migrationV4.js:43,59`; `NuevaAveScreen.js:2062` |
| PAR-AVE-046 | Ave que NO está `EN_TRATAMIENTO` (p. ej. `SANA`) | Finalizar tratamiento | **Diferencia deliberada (P-13, aprobada):** el servidor rechaza sin escribir nada (código por definir, R-P1a). V1 solo ocultaba el botón y el repositorio de v1.0.0 no lo comprobaba | `SaludAveScreen.js:451-488` (botón oculto); v1.0.0 `4a8cc6c` (sin comprobación) |

## Diferencias deliberadas

Estados: las diferencias P-03, P-04, P-07, P-10 a P-20 se concilian con las decisiones R-P1 a R-P17 aprobadas por el usuario el 2026-10-29 (ver "Decisiones aprobadas por el usuario"). "aprobada" = cubierta por una decisión explícita del usuario; "propuesta" = sin decisión explícita.

| ID | Diferencia | Motivo | Estado |
|---|---|---|---|
| D-01 | V2 requiere conexión | Online-first, D1 como fuente de verdad | aprobada por el usuario |
| D-02 | Pantallas con estados de carga y de error de red | Consecuencia de D-01 | aprobada por el usuario |
| P-01 | IDs `TEXT` UUID v7 en lugar de `INTEGER AUTOINCREMENT` | Decisión vigente de V2 (CLAUDE.md) | propuesta |
| P-02 | `deleted_at` (soft delete) y `version` (concurrencia optimista, `AVE_CONCURRENCY_CONFLICT`); V1 no tiene ninguno | Decisión vigente de V2; las aves no se borran (baja) | propuesta |
| P-03 | Fotos en R2 con `r2_object_key` y metadatos; V1 guarda `foto_uri` local. **Diferido a la fase de R2 (R-P12, 2026-10-29):** mientras tanto la foto es opcional y no se puede quitar al editar, como V1 | D1 no guarda binarios; el flujo de subida es nuevo | aprobada (diferida a la fase de R2; flujo de subida sin definir) |
| P-04 | **SUSTITUIDA por R-P2 (2026-10-29).** Antes: `raza_item_id`/`sexo_item_id` como FK. Ahora: `raza` y `sexo` se guardan como texto, como V1 (raza = `nombre`, sexo = `codigo`), validados contra el catálogo del criadero (ítem activo); raza obligatoria, sexo siempre. La diferencia con V1 es solo que el servidor valida contra el catálogo | Paridad con V1; integridad mínima sin FK | aprobada por el usuario, 2026-10-29 (reescrita) |
| P-05 | `CHECK` en `origen`, `estado`, `estado_salud` y `NOT NULL` en `estado_salud`; V1 sin CHECK y `estado_salud` nullable | Integridad (V1 se comporta como si ya fueran cerrados) | propuesta |
| P-06 | El servidor aplica todas las validaciones que V1 tiene solo en pantalla (sección "Validaciones en pantalla") | En V2 el cliente no es de confianza | propuesta |
| P-07 | Códigos de error (R-P14, 2026-10-29): se **conservan los de V1** `CODIGO_AVE_DUPLICADO`, `PADRE_NO_MACHO`, `MADRE_NO_HEMBRA` para que las pantallas muestren los mismos mensajes; los **nuevos** siguen la convención actual de la API (`AVE_NOT_FOUND`, `AVE_NOT_ACTIVE`, `AVE_PARENT_*`, `AVE_PARENTS_EQUAL`, `AVE_CONCURRENCY_CONFLICT`, `JAULA_NOT_FOUND`, etc.; nombres exactos aún por confirmar, R-P14a); V1 usa cadenas internas | Contrato HTTP estable y compatibilidad de mensajes | aprobada el criterio (2026-10-29); nombres nuevos propuestos |
| P-08 | El servidor lee la jaula anterior y el código del ave al cambiar de jaula; V1 los recibe del cliente (`cambiarJaulaAve`) | Evitar datos falsificables | propuesta |
| P-09 | Unicidad de `codigo` por criadero (multi-tenant); V1 es global en una base | Modelo `users 1—N criaderos` | propuesta |
| P-10 | Fechas de negocio `YYYY-MM-DD` y marcas de tiempo ISO 8601 UTC únicas; V1 mezcla tres formatos (R-P3) | Un formato canónico | aprobada por el usuario, 2026-10-29 |
| P-11 | El servidor rechaza fechas de nacimiento/ingreso futuras con `VALIDATION_ERROR`; V1 solo lo impide el selector de fecha (R-P13) | Validar en servidor | aprobada por el usuario, 2026-10-29 |
| P-12 | **SUSTITUIDA por R-P4 (2026-10-29).** El cliente calcula `fecha_nacimiento` de `COMPRADA` con el algoritmo de V1 (`restarMeses`); el servidor solo valida que sea una fecha válida y no futura (no la recalcula) | Paridad con V1 | aprobada por el usuario, 2026-10-29 (reescrita) |
| P-13 | "Finalizar tratamiento": se implementa el comportamiento COMPLETO de v1.0.0 (estado SANA + `fecha_ultimo_control_salud`, diagnósticos `ACTIVO` a `CERRADO`, `ave_historial` `SALUD`, evento `RECUPERACION`; una transacción). **Diferencia respecto a V1:** el servidor rechaza si el ave no está `EN_TRATAMIENTO` (V1 solo ocultaba el botón). Ver sección l y R-P1 | Decisión del usuario; evidencia de git (`4a8cc6c`) | aprobada por el usuario, 2026-10-29 |
| P-14 | Zona horaria fija del criadero `America/Guayaquil` para fechas de negocio; V1 usa la zona del dispositivo (R-P3) | Un criterio único en servidor | aprobada por el usuario, 2026-10-29 |
| P-15 | Una sola baja por ave; el listado de vendidas/fallecidas devuelve el resumen de baja (V1: `INNER JOIN` que puede duplicar o perder filas) (R-P7) | Evitar duplicados y aves invisibles | aprobada por el usuario, 2026-10-29 |
| P-16 | Se rechaza una jaula inactiva en el alta y en el cambio de jaula (V1 no lo valida; la UI solo lista activas) (R-P9) | Validar en servidor | aprobada por el usuario, 2026-10-29 |
| P-17 | Cambiar jaula se rechaza si el ave no está `ACTIVA` (V1 no lo valida; la UI solo ofrece ACTIVAS). La baja no libera la jaula, como V1 (R-P8) | Validar en servidor | aprobada por el usuario, 2026-10-29 |
| P-18 | Padre/madre: cualquier ave existente del mismo criadero con el sexo correcto, sin validar estado ni fechas (el repositorio V1 ya es así; la UI V1 solo ofrecía ACTIVAS más la ya seleccionada) (R-P11) | Paridad con el repositorio V1 | aprobada por el usuario, 2026-10-29 |
| P-19 | Sexo siempre obligatorio y `MACHO`/`HEMBRA` validado para padre y madre; desaparece la tolerancia del repositorio a progenitores sin sexo (R-P5) | Coherencia con la pantalla | aprobada por el usuario, 2026-10-29 |
| P-20 | FK reales con `ON DELETE RESTRICT` (`jaulas` en `0005`, `aves` en `0006`); V1 tiene FK sin `ON DELETE` (R-P10) | Integridad referencial en D1 | aprobada por el usuario, 2026-10-29 |

## Endpoints V2

Propuesta; no hay endpoints de aves implementados hoy en `api/`. Todos bajo `/api/v1/criaderos/:criaderoId/aves`, JWT (`Authorization: Bearer`) y ownership (criadero del usuario autenticado; `FORBIDDEN` si no es propietario, `CRIADERO_NOT_FOUND` si no existe, como `criaderos.routes.ts:72,125,184`). Todo `aveId`, `jaulaId`, `padreId`, `madreId` debe pertenecer a ese `criaderoId` y no estar eliminado; `raza` y `sexo` (texto) se validan contra los ítems activos de `RAZAS` y `SEXOS` de ese criadero (R-P2). Éxito `{ success: true, data }`; error `{ success: false, error, message }`. camelCase. Códigos existentes en `api/src`: `VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_TOKEN`, `FORBIDDEN`, `CRIADERO_NOT_FOUND`, `ITEM_WRONG_CRIADERO`, `ITEM_NOT_ACTIVE`, `ITEM_DELETED`, `ITEM_WRONG_CATALOG`, `ITEMS_NOT_FOUND`, `ONBOARDING_INCOMPLETE`, `INTERNAL_ERROR`, `*_CONCURRENCY_CONFLICT`. El estilo actual usa 400 para `VALIDATION_ERROR` e `ITEM_*`, 404 para no encontrado y 409 para conflictos de concurrencia (`criaderos.routes.ts:35-41,84-95,137-154`); se propone mantenerlo (sin 422).

Equivalencia de errores V1 -> V2 (R-P14: se conservan los códigos de V1 `CODIGO_AVE_DUPLICADO`, `PADRE_NO_MACHO` y `MADRE_NO_HEMBRA`; los nuevos son propuestas que siguen la convención actual):

| V1 | V2 | HTTP |
|---|---|---|
| `CODIGO_AVE_DUPLICADO` / UNIQUE aves.codigo | `CODIGO_AVE_DUPLICADO` (conservado) | 409 |
| `AVE_NO_ENCONTRADA` | `AVE_NOT_FOUND` | 404 |
| `AVE_NO_ACTIVA` | `AVE_NOT_ACTIVE` | 409 |
| `PADRE_ES_MISMA_AVE` / `MADRE_ES_MISMA_AVE` | `AVE_PARENT_IS_SELF` | 400 |
| `PADRES_IGUALES` | `AVE_PARENTS_EQUAL` | 400 |
| `PADRE_NO_ENCONTRADO` / `MADRE_NO_ENCONTRADA` | `AVE_PARENT_NOT_FOUND` | 400 |
| `PADRE_NO_MACHO` | `PADRE_NO_MACHO` (conservado) | 400 |
| `MADRE_NO_HEMBRA` | `MADRE_NO_HEMBRA` (conservado) | 400 |
| `PARENTESCO_CIRCULAR_PADRE` / `_MADRE` | `AVE_PARENT_CIRCULAR` | 400 |
| jaula inexistente (V1: error de FK) | `JAULA_NOT_FOUND` | 404 |
| jaula inactiva en alta o cambio (nuevo, R-P9; nombre por definir, R-P9a) | `JAULA_NOT_ACTIVE` (propuesta) | 409 o 400 (por definir) |
| cambiar jaula con ave no `ACTIVA` (nuevo, R-P8) | `AVE_NOT_ACTIVE` | 409 |
| finalizar tratamiento con ave no `EN_TRATAMIENTO` (nuevo, R-P1) | por definir (R-P1a) | por definir |
| validaciones solo de pantalla | `VALIDATION_ERROR` con el mensaje de V1 | 400 |

### GET `/api/v1/criaderos/:criaderoId/aves`

- Equivale a `obtenerAves`/`obtenerAvesVendidas`/`obtenerAvesFallecidas`. Query: solo `estado` (`ACTIVA` por defecto, `VENDIDA`, `FALLECIDA`). R-P6 (decidida): se devuelve la lista completa y la app filtra en memoria (búsqueda, raza, sexo, salud, jaula, edad) como V1; paginar después si hace falta (no se define paginación ahora).
- Orden: `codigo` ascendente para `ACTIVA`; `VENDIDA`/`FALLECIDA` por fecha de baja descendente; el listado devuelve el resumen de baja y hay una sola baja por ave (R-P7, P-15).
- `data.aves[]`: `id, codigo, origen, fechaNacimiento, edadMesesCompra, fechaIngreso, criaderoOrigen, metodoEnvio, raza (texto), sexo (texto, código MACHO/HEMBRA), pesoGramos, alturaCm, largoCm, caracteristicas, fotoKey, padreId, madreId, padreCodigo, madreCodigo, jaulaId, jaulaCodigo, jaulaNombre, estado, estadoSalud, createdAt, updatedAt, version` (campos de `obtenerAves`, `AveRepository.js:14-41`); en vendidas/fallecidas, además el resumen de baja.
- Errores: 400 `VALIDATION_ERROR`, 401, 403 `FORBIDDEN`, 404 `CRIADERO_NOT_FOUND`.

### GET `/api/v1/criaderos/:criaderoId/aves?disponiblesParaJaula=:jaulaId`

- Equivale a `obtenerAvesParaAsignarJaula` (`AveRepository.js:99-137`): ACTIVA sin jaula o con jaula distinta, orden por código. `data.aves[]`: `id, codigo, raza, fotoKey, jaulaId, jaulaCodigo`. `JAULA_NOT_FOUND` 404 si la jaula no existe en el criadero. Candidatos a padre/madre (`obtenerAvesActivasParaPadres`): sin endpoint propio; el servidor acepta como padre/madre cualquier ave existente del criadero con el sexo correcto (R-P11) y la app filtra los candidatos de la lista completa (R-P6).

### GET `/api/v1/criaderos/:criaderoId/aves/:aveId`

- Equivale a `obtenerAvePorId` (cualquier estado). `data.ave` con los campos anteriores más `fechaUltimoControlSalud`. Errores: 404 `AVE_NOT_FOUND`, 404 `CRIADERO_NOT_FOUND`, 401, 403.
- Genealogía, evolución, salud, huevos, ciclo de vida y baja se sirven en otros módulos o endpoints (`/genealogia`, `/evolucion`, `/salud`, `/huevos`, `/ciclo-vida`, `/baja`). Este módulo **no** define endpoints propios de historial ni de evolución (R-P15: solo `ciclo-vida`; el resto se decide en las specs de Evolución). "Finalizar tratamiento" se define más abajo como propuesta de ruta.

### POST `/api/v1/criaderos/:criaderoId/aves`

- Request: `{ codigo, origen, fechaNacimiento?, edadMesesCompra?, fechaIngreso?, criaderoOrigen?, metodoEnvio?, raza, sexo, pesoGramos?, alturaCm?, largoCm?, caracteristicas?, fotoKey?, padreId?, madreId?, jaulaId? }`. `raza` y `sexo` son texto como V1 (R-P2): `raza` = nombre del ítem de `RAZAS`, `sexo` = código `MACHO`/`HEMBRA`; ambos obligatorios y validados contra el catálogo activo del criadero. Fechas `YYYY-MM-DD` (R-P3).
- Validaciones: las de la sección "Validaciones en pantalla" más las del repositorio (`validarRelacionPadres`, `AveRepository.js:399-619`), en el mismo orden. `origen` solo `NACIDA_CRIADERO` o `COMPRADA` (P-05). `NACIDA_CRIADERO`: `fechaNacimiento` obligatoria; `edadMesesCompra`, `fechaIngreso`, `criaderoOrigen`, `metodoEnvio` = null. `COMPRADA`: edad entera >= 0, `criaderoOrigen`, `metodoEnvio`, `fechaIngreso` obligatorios; `fechaNacimiento` la calcula el **cliente** como V1 (`restarMeses`) y el servidor solo valida que sea una fecha válida y no futura (R-P4, P-12 sustituida); `padreId`/`madreId` = null (V1 los envía null). Fechas futuras (`fechaNacimiento`, `fechaIngreso`) -> `VALIDATION_ERROR` (R-P13). `jaulaId` debe existir en el criadero y estar activa (R-P9). Padre/madre: cualquier ave existente del criadero con sexo `MACHO`/`HEMBRA` respectivamente, sin validar estado ni fechas (R-P5, R-P11).
- Efectos (una operación atómica, `db.batch`): inserta el ave con `estado='ACTIVA'`, `estadoSalud='SANA'`; `ave_evolucion` inicial ("Registro inicial"); `ave_historial` `ALTA` (textos de V1); si hay jaula, `ave_historial.jaula_id` y `jaula_historial` `INGRESO_AVE` ("Ave {CODIGO} ingresó a la jaula.").
- Respuesta 201 `{ success: true, data: { ave } }`. Errores: `VALIDATION_ERROR`, `CODIGO_AVE_DUPLICADO`, `PADRE_NO_MACHO`, `MADRE_NO_HEMBRA`, `AVE_PARENT_*`, `JAULA_NOT_FOUND`, jaula inactiva (R-P9a), 401, 403, `CRIADERO_NOT_FOUND`.
- Foto: el flujo R2 queda **diferido a la fase de R2** (R-P12). Mientras tanto la foto es opcional; `fotoKey` no se define hasta esa fase.

### PUT `/api/v1/criaderos/:criaderoId/aves/:aveId`

- Request: los mismos campos que POST sin `jaulaId`, más `version`. Solo aves `ACTIVA` (`AVE_NOT_ACTIVE`). Validaciones del POST, más padre/madre != la propia ave y no descendientes (`AVE_PARENT_CIRCULAR`, BFS sobre aves del criadero de cualquier estado) y código único excluyendo la propia ave. El `origen` es editable en ambos sentidos, como V1 (R-P17): los campos del otro origen se vacían y, si `origen !== 'NACIDA_CRIADERO'`, `padreId`/`madreId` se guardan null (`AveRepository.js:1134-1145`). La foto no se puede quitar (R-P12).
- Efectos: actualiza `aves` (`version` + 1, `updated_at`), inserta `ave_historial` `DATOS_ACTUALIZADOS` con la jaula actual y el detalle de V1 (etiquetas en el orden de `:1244-1512`). **No** crea `ave_evolucion`, no cambia `estado`, `estadoSalud` ni jaula.
- Respuesta 200 `{ success: true, data: { ave } }`. Errores: `VALIDATION_ERROR`, `AVE_NOT_FOUND`, `AVE_NOT_ACTIVE`, `CODIGO_AVE_DUPLICADO`, `AVE_CONCURRENCY_CONFLICT` (propuesta), `PADRE_NO_MACHO`, `MADRE_NO_HEMBRA`, `AVE_PARENT_*`, 401, 403, 404.
- Sin DELETE: la baja es el módulo de bajas.

### PUT `/api/v1/criaderos/:criaderoId/aves/:aveId/jaula`

- Request `{ jaulaId: string | null, version }`. Equivale a `cambiarJaulaAve` (`AveRepository.js:1555-1716`): actualiza `jaula_actual_id`; `ave_historial` `CAMBIO_JAULA` con los tres textos de V1; `jaula_historial` `SALIDA_AVE` (anterior) e `INGRESO_AVE` (nueva) con "Ave {codigo} salió de la jaula." / "Ave {codigo} ingresó a la jaula." El servidor lee la jaula anterior y el código (P-08).
- V1 no valida estado del ave, jaula activa ni `anterior != nueva`; la UI solo muestra aves ACTIVA y jaulas activas. V2 (diferencias deliberadas P-17 y P-16): rechaza si el ave no está `ACTIVA` (`AVE_NOT_ACTIVE`, R-P8) y rechaza una jaula destino inactiva (R-P9). La baja no libera la jaula, como V1. `anterior != nueva` sigue sin decidirse (R-P8a).
- Respuesta 200 `{ success: true, data: { ave } }`. Errores: `AVE_NOT_FOUND`, `AVE_NOT_ACTIVE`, `JAULA_NOT_FOUND`, jaula inactiva (R-P9a), `VALIDATION_ERROR`, `AVE_CONCURRENCY_CONFLICT`, 401, 403, `CRIADERO_NOT_FOUND`.

### POST `/api/v1/criaderos/:criaderoId/aves/:aveId/finalizar-tratamiento` (ruta PROPUESTA, R-P1b)

- Equivale a `finalizarTratamiento({ aveId, observacion })` de v1.0.0 más el `registrarEventoCicloVida` de `FinalizarTratamientoScreen.js:78-93`. Request: `{ observacion?, version }` (`observacion` con `trim`; vacío -> textos por defecto). `version` y su nombre siguen la convención de concurrencia optimista (propuesta).
- Efectos (una sola transacción, `db.batch`): `aves.estado_salud='SANA'`, `fecha_ultimo_control_salud` = ahora ISO UTC, `version`+1; `diagnosticos_ave` del ave `ACTIVO` -> `CERRADO`; `ave_historial` `SALUD` ("Recuperación registrada: {observacion}" o "Ave recuperada y tratamiento finalizado."); `ave_historial` `RECUPERACION` ("Tratamiento finalizado. {obs}" o "Tratamiento finalizado. El ave volvió al estado sana.").
- Diferencia deliberada (P-13): si el ave no está `EN_TRATAMIENTO` se rechaza sin escribir nada. Código y HTTP por definir (R-P1a).
- Respuesta 200 `{ success: true, data: { ave } }`. Errores: `AVE_NOT_FOUND`, rechazo por estado (R-P1a), `AVE_CONCURRENCY_CONFLICT`, `VALIDATION_ERROR`, 401, 403, `CRIADERO_NOT_FOUND`. La ruta pertenece conceptualmente al módulo de salud; se deja aquí como propuesta porque escribe `aves`.

Dependencias entre módulos: jaulas (R-P10: el módulo Jaulas va antes que Aves; FK `jaula_actual_id`, `jaula_historial`), catálogos (`RAZAS`, `SEXOS`; ya en D1, validación de texto), R2 (foto, diferido), evolución, salud (`estado_salud`, finalizar tratamiento), bajas (`estado`), huevos y finanzas (`ave_id`).

## Modelo D1

PROPUESTA derivada del código V1. Orden de módulos y migraciones (R-P10, aprobada 2026-10-29): Jaulas antes que Aves; `0005` = jaulas y `0006` = aves (`api/migrations/0006_<descripción>.sql`), con FK reales y `ON DELETE RESTRICT`. **Las migraciones aún no se crean.** Estado actual en D1 (`0001`-`0004`): `users`, `criaderos`, `catalogos`, `catalogo_items` (con `criadero_id`), `criadero_configuracion`; no existen `jaulas`, `aves` ni historiales. `SEXOS` (`MACHO`, `HEMBRA`) y `RAZAS` ya cargan en `api/src/catalogs/defaultCatalogItems.ts`.

### Tabla `aves` (propuesta)

| Columna | Tipo | Regla | Origen V1 |
|---|---|---|---|
| id | TEXT PK NOT NULL | UUID v7 | `id` INTEGER |
| criadero_id | TEXT NOT NULL | FK criaderos(id) | nuevo |
| codigo | TEXT NOT NULL | único por criadero entre activos; mayúsculas y `trim` | `codigo` |
| origen | TEXT NOT NULL | CHECK IN ('NACIDA_CRIADERO','COMPRADA') | `origen` (sin CHECK) |
| fecha_nacimiento | TEXT | `YYYY-MM-DD` | igual |
| edad_meses_compra | INTEGER | CHECK >= 0 si no es null | igual |
| fecha_ingreso | TEXT | `YYYY-MM-DD` | igual |
| criadero_origen, metodo_envio | TEXT | solo COMPRADA | igual |
| raza | TEXT NOT NULL | texto (nombre del ítem de `RAZAS`), **no FK** (R-P2); validada contra el catálogo del criadero en el servicio | `raza` (texto; V1 nullable, pero la pantalla la exige) |
| sexo | TEXT NOT NULL | texto (código `MACHO`/`HEMBRA`), **no FK** (R-P2/R-P5); validado en el servicio; CHECK IN ('MACHO','HEMBRA') opcional (por definir) | `sexo` (texto; V1 nullable, la pantalla lo exige) |
| peso_gramos, altura_cm, largo_cm | REAL | `> 0` si no es null | igual |
| caracteristicas | TEXT | - | igual |
| r2_object_key | TEXT | clave R2, nunca URI local; opcional y no se puede quitar al editar mientras no haya R2 (R-P12, diferido a la fase de R2) | `foto_uri` |
| padre_id, madre_id | TEXT | FK aves(id) `ON DELETE RESTRICT` | igual |
| jaula_actual_id | TEXT | FK jaulas(id) `ON DELETE RESTRICT` (jaulas en `0005`, antes que aves) | igual |
| estado | TEXT NOT NULL DEFAULT 'ACTIVA' | CHECK IN ('ACTIVA','VENDIDA','FALLECIDA') | igual |
| estado_salud | TEXT NOT NULL DEFAULT 'SANA' | CHECK IN ('SANA','EN_TRATAMIENTO','ENFERMA') | igual (V1 nullable) |
| fecha_ultimo_control_salud | TEXT | - | igual |
| created_at, updated_at | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | convención D1 | `fecha_creacion`, `fecha_actualizacion` |
| deleted_at | TEXT | soft delete | nuevo |
| version | INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1) | concurrencia | nuevo |

Índices propuestos: `ux_aves_codigo_activo ON aves(criadero_id, codigo) WHERE deleted_at IS NULL` (equivale a la unicidad global de V1 porque V2 no borra aves: la baja cambia `estado`, no `deleted_at`); `ix_aves_criadero_estado (criadero_id, estado, deleted_at)`; `ix_aves_criadero_jaula (criadero_id, jaula_actual_id, estado, deleted_at)`; `ix_aves_padre`, `ix_aves_madre`.

CHECK de estados (`origen`, `estado`, `estado_salud`): se mantiene la propuesta P-05 (sin decisión explícita del usuario; sigue como propuesta).

Diferencias frente al DDL borrador de `V2_MODELO_DATOS.md` (~1055-1139): `foto_r2_key` vs `r2_object_key` (convención de `api-migraciones-d1.md`); `ON DELETE SET NULL` del borrador frente a `ON DELETE RESTRICT` decidido (R-P10); `raza`/`sexo` como texto y no como FK a ítems (R-P2); sin CHECK de `edad_meses_compra` ni medidas en el borrador.

Consistencia de `criadero_id`: las FK simples no garantizan que `padre_id`, `madre_id` y `jaula_actual_id` pertenezcan al mismo criadero; el servicio debe validarlo (patrón `ITEM_WRONG_CRIADERO` en `criaderos.service.ts`). `raza` y `sexo` se validan contra los ítems activos de `RAZAS`/`SEXOS` del criadero.

`diagnosticos_ave.estado` (módulo de salud) pasa a admitir `'CERRADO'` además de `'ACTIVO'` (R-P1): en V1 actual solo se escribe `'ACTIVO'` (`SaludRepository.js:140`); `'CERRADO'` proviene del código de v1.0.0 (`4a8cc6c`).

Tablas relacionadas (de otros módulos, por dependencia): `ave_evolucion` (ave_id, fecha, foto, peso, altura, largo, caracteristicas, observacion), `ave_historial` (ave_id, jaula_id, tipo_evento, fecha, detalle; incluye los tipos `SALUD` y `RECUPERACION` escritos al finalizar tratamiento), `jaula_historial` (jaula_id, ave_id, tipo_evento, fecha, detalle) y `diagnosticos_ave` con `criadero_id` y convenciones comunes; deben existir si `POST /aves`, `PUT /aves/:aveId/jaula` y finalizar tratamiento los escriben. Su migración y ubicación exacta (`0005` o `0006`) no la fija la decisión R-P10 (que solo fija 0005 = jaulas y 0006 = aves); se decide al redactar las migraciones de esos módulos.

V2 empieza sin datos de usuario: no hay importación ni mapeo de IDs V1 -> UUID (ver reglas cerradas R-C4, R-C5).

## Decisiones aprobadas por el usuario (2026-10-29)

Todas las filas tienen estado "aprobada por el usuario, 2026-10-29". El texto original de cada pregunta se conserva en "Reglas abiertas > Decisión de producto".

| ID | Decisión | Estado |
|---|---|---|
| R-P1 | Finalizar tratamiento: se replica el comportamiento COMPLETO de v1.0.0: `estado_salud = SANA`, `fecha_ultimo_control_salud` actualizada, `diagnosticos_ave` activos a `CERRADO`, evento `SALUD` en `ave_historial` ("Recuperación registrada: {observacion}" o "Ave recuperada y tratamiento finalizado.") y evento `RECUPERACION` en el ciclo de vida; todo en una sola transacción. Diferencia deliberada: el servidor rechaza la operación si el ave no está `EN_TRATAMIENTO` (V1 solo ocultaba el botón). | aprobada por el usuario, 2026-10-29 |
| R-P2 | Raza y sexo: texto como V1, validado contra el catálogo del criadero; raza obligatoria; sexo siempre. | aprobada por el usuario, 2026-10-29 |
| R-P3 | Fechas de negocio `YYYY-MM-DD` y marcas de tiempo ISO UTC; zona fija del criadero `America/Guayaquil`. | aprobada por el usuario, 2026-10-29 |
| R-P4 | La fecha de nacimiento de aves COMPRADA la calcula el cliente como V1; el servidor valida que sea una fecha válida y no futura. | aprobada por el usuario, 2026-10-29 |
| R-P5 | Exigir sexo siempre y validar `MACHO`/`HEMBRA` para padre y madre. | aprobada por el usuario, 2026-10-29 |
| R-P6 | Lista completa y filtros en la app, como V1; paginar después si hace falta. | aprobada por el usuario, 2026-10-29 |
| R-P7 | Una sola baja por ave; el listado de vendidas/fallecidas devuelve el resumen de baja. | aprobada por el usuario, 2026-10-29 |
| R-P8 | Cambiar jaula: rechazar si el ave no está `ACTIVA`. La baja no libera la jaula, como V1. | aprobada por el usuario, 2026-10-29 |
| R-P9 | Rechazar jaula inactiva en alta y cambio de jaula. | aprobada por el usuario, 2026-10-29 |
| R-P10 | Orden de módulos: Jaulas antes que Aves. `0005` = jaulas, `0006` = aves, con FK real y `ON DELETE RESTRICT`. (Las migraciones aún NO se crean.) | aprobada por el usuario, 2026-10-29 |
| R-P11 | Padres: cualquier ave existente del mismo criadero con el sexo correcto, sin validar estado ni fechas. | aprobada por el usuario, 2026-10-29 |
| R-P12 | Fotos en R2: diferido a la fase de R2. Mientras tanto la foto es opcional y no se puede quitar al editar, como V1. | aprobada por el usuario, 2026-10-29 |
| R-P13 | Rechazar fechas futuras (`VALIDATION_ERROR`). | aprobada por el usuario, 2026-10-29 |
| R-P14 | Conservar los códigos de error de V1 (`CODIGO_AVE_DUPLICADO`, `PADRE_NO_MACHO`, `MADRE_NO_HEMBRA`) para que las pantallas muestren los mismos mensajes; los nuevos siguen la convención actual de la API. | aprobada por el usuario, 2026-10-29 |
| R-P15 | Historial y evolución: solo `ciclo-vida`; el resto se decide en las specs de Evolución. | aprobada por el usuario, 2026-10-29 |
| R-P16 | Edad: el cliente replica ambas funciones tal cual. | aprobada por el usuario, 2026-10-29 |
| R-P17 | Origen editable en la edición: replicarlo. | aprobada por el usuario, 2026-10-29 |

Las subreglas derivadas (R-P1a a R-P1c, R-P2a, R-P3a, R-P3b, R-P8a, R-P9a, R-P14a) siguen **abiertas** en "Reglas abiertas".

## Reglas abiertas

### Resolubles leyendo código

- **R-L1 (cerrada: 2026-10-29) Estado de `EstadoSaludRepository.js`.** Es una copia de `NuevaAveScreen`; su único export es `default function NuevaAveScreen` (`EstadoSaludRepository.js:48`); no exporta `finalizarTratamiento`. No hay otra copia de esa función en el repo (búsqueda sin límite). El historial de git (R-L10) confirma que la función existió en v1.0.0 y se perdió en v1.0.1.
- **R-L2 (cerrada: 2026-10-29) `ENFERMA` nunca se escribe.** Búsqueda sin límite en todo el repo fuera de `documents/` (incluidas migraciones, seeders y `api/`): solo lecturas y etiquetas (`ReportesRepository.js:34`, `DashboardRepository.js:97`, `SaludAveScreen.js:828,860`, `AvesScreen.js:410,642`, `DetalleAveScreen.js:1292,1323`, `AveCard.js:550,577`). Ningún `INSERT`/`UPDATE` lo escribe; `actualizarEstadoSaludAve` podría hacerlo pero no tiene llamadores. En V1 es un valor alcanzable solo por lectura de datos externos.
- **R-L3 (cerrada: 2026-10-29) HEMRA frente a HEMBRA.** `HEMRA` solo existe en documentos; el código usa `HEMBRA` (sección k).
- **R-L4 (cerrada: 2026-10-29) Cómo se guardan raza y sexo, y qué catálogos son configurables.** Raza: `aves.raza` = `nombre` del ítem (texto). Sexo: `aves.sexo` = `codigo` del ítem (texto). Catálogos editables en la app: `RAZAS`, `ENFERMEDADES`, `MEDICAMENTOS`, `ALIMENTOS`, `BEBIDAS`, `CATEGORIAS_FINANCIERAS`; `SEXOS` no (`ConfiguracionScreen.js:23-55`). Renombrar un ítem no actualiza las aves; la baja es lógica (`activo = 0`). Decisión R-P2: V2 mantiene el texto (sin FK), validado contra el catálogo del criadero.
- **R-L5 (cerrada: 2026-10-29) `actualizarAve` no escribe `ave_evolucion`.** Confirmado (`AveRepository.js:975-1552`). V2 replica (sin evolución en edición); si se quisiera cambiar, sería una diferencia a proponer.
- **R-L6 (cerrada: 2026-10-29) Quién calcula la fecha de nacimiento de COMPRADA.** En V1 la pantalla (`NuevaAveScreen.js:257-298,952-957`); en edición se recalcula siempre con `COMPRADA` (se envía `fechaNacimientoGuardar`, `:1037-1038`). Decisión R-P4: el cliente sigue calculándola como V1 y el servidor solo valida (P-12 sustituida).
- **R-L7 (cerrada: 2026-10-29) Generación y reglas del código del ave.** Manual, sin prefijo ni secuencia; `trim().toUpperCase()`; máximo 30 solo por `maxLength` de pantalla; sin restricción de caracteres; único entre todas las aves de cualquier estado (`UPPER(TRIM)`); editable. V2 replica; el límite de 30 se aplica en el servidor (P-06).
- **R-L8 (cerrada: 2026-10-29) Capacidad de jaula.** No existe en V1 (0 coincidencias de `capacidad` en `src/`); V2 no la implementa.
- **R-L9 (cerrada: 2026-10-29) Fechas futuras, orden de fechas y tipos numéricos.** V1 solo impide fechas futuras con el selector (`maximumDate`); no valida `fecha_nacimiento <= fecha_ingreso` ni contra la de los padres; medidas sin máximos, REAL, `> 0`, decimales con coma o punto; solo `codigo` tiene límite de longitud. Replicar; el rechazo de fechas futuras en el servidor es P-11 (R-P13 aprobada). Los demás límites superiores no existen en V1 y no se inventan.
- **R-L10 (cerrada: 2026-10-29, verificada con git) Historial de `finalizarTratamiento`.** `git log -S"finalizarTratamiento"` en `src/` devuelve solo `4a8cc6c` (v1.0.0) y `97edf7f` (v1.0.1). En `4a8cc6c`, `EstadoSaludRepository.js` (~110 líneas) exportaba `finalizarTratamiento({ aveId, observacion })` dentro de `db.withTransactionAsync`: (1) `UPDATE aves SET estado_salud='SANA', fecha_ultimo_control_salud=? WHERE id=?` con `fecha = new Date().toISOString()`; (2) `UPDATE diagnosticos_ave SET estado='CERRADO' WHERE ave_id=? AND estado='ACTIVO'`; (3) `INSERT ave_historial` tipo `SALUD`, detalle `Recuperación registrada: ${observacion}` o `Ave recuperada y tratamiento finalizado.`. El commit `97edf7f` (v1.0.1, +2110/-69 líneas) sobrescribió ese archivo con una copia de `NuevaAveScreen`. `FinalizarTratamientoScreen.js` es idéntico en v1.0.0 y v1.0.3 y sigue importando la función. Comprobación: `git show 4a8cc6c:src/repositories/EstadoSaludRepository.js`; `git show v1.0.3:src/repositories/EstadoSaludRepository.js | grep -n "^export"`. Etiquetas: v1.0.0 -> `4a8cc6c`, v1.0.1 -> `97edf7f` (2026-09-23), v1.0.2 -> `00df6d9`, v1.0.3 -> `248ced2`. La función no existe en v1.0.1, v1.0.2 ni v1.0.3. Decisión: R-P1 (replicar v1.0.0 completo); la comprobación en dispositivo ya no condiciona la decisión.
- **R-L11 (cerrada: 2026-10-29) `registrarDiagnostico` y `diagnosticos_ave.estado`.** Inserta `'ACTIVO'` (`SaludRepository.js:140`; default `migrations.js:256`). `'CERRADO'` no se escribe en el árbol actual. Nada del código actual decide en función de ese campo (sección l).
- **R-L12 (cerrada: 2026-10-29) Qué escribe `registrarEventoCicloVida`.** Una fila `ave_historial` `(ave_id, tipo_evento, fecha, detalle)` sin `jaula_id` (`CicloVidaRepository.js:748-765`); el evento `RECUPERACION` se muestra como "Ave recuperada" (`:890-892`).
- **R-L13 (cerrada: 2026-10-29) Códigos de error HTTP y `FORBIDDEN`.** `FORBIDDEN` existe (`criaderos.routes.ts:72,125,184`); el estilo usa 400/404/409 (sin 422). La propuesta de la tabla de errores sigue ese estilo; los códigos nuevos son propuestas (P-07).
- **R-L14 (cerrada: 2026-10-29) Límite de generaciones.** V1 solo limita en la consulta (1-4, por defecto 3; la pantalla ofrece 2, 3, 4) y no al guardar. Replicar en `GET .../genealogia`; la consanguinidad se calcula en el cliente.
- **R-L15 (cerrada: 2026-10-29) Divergencia entre `aves` y `ave_evolucion`.** Por R-L5 en V1 pueden divergir (la edición cambia medidas/foto/características de `aves` sin evolución; `registrarEvolucionAve` las cambia en ambas). V2 replica.
- **R-L16 (cerrada: 2026-10-29) Foto en edición.** V1 no permite quitar la foto desde la pantalla de datos (`NuevaAveScreen.js:1525-1570`); sí puede quedar `null` por evolución (`EvolucionAveRepository.js:216-217`). V2 replica.
- **R-L17 (cerrada: 2026-10-29) Tipos de evento de historial.** Cadenas libres sin CHECK; los valores escritos son los de la sección b. Si V2 usa catálogo cerrado se registra como diferencia (P-05).
- **R-L18 (cerrada por la decisión de empezar sin datos de usuario) Valor de `sexo` en datos reales, incluido `HEMRA` y valores raros.** No hay datos heredados; solo se aceptan los códigos `MACHO`/`HEMBRA` de `SEXOS` del criadero (texto validado, R-P2).
- **R-L19 (cerrada por la decisión de empezar sin datos de usuario) `origen` con valores distintos de los dos conocidos.** No hay datos heredados; V2 usa CHECK (P-05).
- **R-L20 (cerrada por la decisión de empezar sin datos de usuario) Códigos legados en minúsculas o con espacios y colisiones al normalizar.** No hay datos heredados.
- **R-C4 (cerrada por la decisión de empezar sin datos de usuario) Importación de bases V1.** No se importa.
- **R-C5 (cerrada por la decisión de empezar sin datos de usuario) Mapeo de IDs V1 -> UUID.** No aplica.
- **R-L21 (cerrada por la decisión de empezar sin datos de usuario) Raza guardada como texto sin ítem equivalente; fotos `foto_uri` locales no migrables o con archivo inexistente; ciclos genealógicos ya presentes en datos legados; fechas guardadas sin zona o con formato mixto en datos existentes.** No hay datos heredados. Las fotos de V2 nacen en R2 (diferido a esa fase, R-P12) y los ciclos no son construibles por la API (PAR-AVE-034). El formato canónico hacia adelante sigue en R-P3.

### Decisión de producto

- **R-P1 (decidida 2026-10-29, aprobada por el usuario) Finalizar tratamiento: qué replicar.** **Decisión:** se replica el comportamiento COMPLETO de v1.0.0 (a): `estado_salud='SANA'`, `fecha_ultimo_control_salud` actualizada, `diagnosticos_ave` activos a `CERRADO`, `ave_historial` `SALUD` ("Recuperación registrada: {observacion}" o "Ave recuperada y tratamiento finalizado.") y evento `RECUPERACION` en el ciclo de vida, todo en una sola transacción. Diferencia deliberada: el servidor rechaza la operación si el ave no está `EN_TRATAMIENTO` (V1 solo ocultaba el botón). Evidencia: sección l y R-L10 (verificada con git: `4a8cc6c` v1.0.0 -> `97edf7f` v1.0.1). Texto original: según el árbol actual el botón falla (`TypeError`, Alert "Error" / "No fue posible finalizar el tratamiento."), y según el historial de git (verificado) la v1.0.0 hacía actualizar `aves`, cerrar diagnósticos, escribir historial `SALUD` y el evento `RECUPERACION`. El usuario dice que en su app funciona y que solo cambia `estado_salud`. Pregunta original: ¿V2 hace (a) lo de v1.0.0 completo (estado + `fecha_ultimo_control_salud` + diagnósticos a `CERRADO` + historial `SALUD` + evento `RECUPERACION`), (b) solo `estado_salud='SANA'` (y `fecha_ultimo_control_salud`), o (c) otra combinación? Y si el ave no está `EN_TRATAMIENTO`, ¿el servidor rechaza (409 o `VALIDATION_ERROR`) o es idempotente (V1 solo oculta el botón)?
  - **R-P1a (abierta, subregla) Rechazo si el ave no está `EN_TRATAMIENTO`.** Definir el código de error y el HTTP (p. ej. `AVE_NOT_IN_TREATMENT` con 409, o `VALIDATION_ERROR` con 400; propuesta sin aprobar) y el mensaje.
  - **R-P1b (abierta, subregla) Ruta y módulo.** ¿El endpoint es `POST .../aves/:aveId/finalizar-tratamiento` (propuesta de ruta en esta spec) o vive en el módulo de salud (`.../salud/...`)? ¿Qué `observacion` máxima y qué `version` exige?
  - **R-P1c (abierta, subregla) `ENFERMA`.** Si el ave está `ENFERMA` (valor que V1 nunca escribe, R-L2), el rechazo por no estar `EN_TRATAMIENTO` también aplica; confirmar que no se debe permitir finalizar desde `ENFERMA`.
- **R-P2 (decidida 2026-10-29, aprobada por el usuario) Raza y sexo como ítem de catálogo.** **Decisión:** opción (b): texto como V1 (raza = nombre, sexo = código), validado contra el catálogo del criadero; raza obligatoria; sexo siempre. P-04 queda sustituida. Texto original: V1 guarda el nombre/código como texto (R-L4). Opciones: (a) FK a `catalogo_items` (propuesta P-04: renombrar el ítem se refleja en las aves; un ítem dado de baja no se puede elegir pero las aves existentes lo conservan); (b) copiar el nombre como texto como V1 (sin FK, el renombrado no se propaga). ¿Cuál, y `razaItemId` es obligatorio como en la pantalla?
  - **R-P2a (abierta, subregla) Qué ítems valida el texto.** Raza se guarda por `nombre` y sexo por `codigo`: ¿la comparación de raza es insensible a mayúsculas (como la búsqueda de V1 en edición, `NuevaAveScreen.js:503-521`) y se guarda el nombre canónico del ítem o el texto recibido? ¿Qué código de error si no existe en el catálogo (`VALIDATION_ERROR` o los `ITEM_*`)?
- **R-P3 (decidida 2026-10-29, aprobada por el usuario) Formato de fecha canónico y zona horaria del criadero.** **Decisión:** fechas de negocio `YYYY-MM-DD` y marcas de tiempo ISO UTC (opción a); zona fija del criadero `America/Guayaquil`. Texto original: V1 mezcla `YYYY-MM-DD` local (nacimiento/ingreso), ISO UTC (historial, evolución) y `YYYY-MM-DD HH:MM:SS` UTC (creación). Opciones: (a) fechas de negocio `YYYY-MM-DD` + marcas de tiempo ISO UTC (P-10); (b) otro. ¿Zona horaria fija del criadero o la del cliente?
  - **R-P3a (abierta, subregla) `CURRENT_TIMESTAMP`.** V1 escribe `fecha_creacion`/`fecha_actualizacion` con `CURRENT_TIMESTAMP` de SQLite (`YYYY-MM-DD HH:MM:SS` UTC, sin `T` ni `Z`). Si se mantiene `DEFAULT CURRENT_TIMESTAMP` en D1 (convención de V2), el formato no es ISO con `T`/`Z`. ¿Se normalizan a ISO UTC en la respuesta de la API o se escriben desde el servicio? Y ¿qué fecha de "hoy" usa el servidor para rechazar fechas futuras (el día calendario en `America/Guayaquil`)?
  - **R-P3b (abierta, subregla) Fecha de negocio de "ahora".** Las fechas de negocio generadas por el servidor (p. ej. fecha de un evento) ¿son el instante ISO UTC o el día en `America/Guayaquil`? V1 usa ISO UTC para historial y evolución.
- **R-P4 (decidida 2026-10-29, aprobada por el usuario) Cálculo de `fecha_nacimiento` en COMPRADA.** **Decisión:** opción (b): el cliente la calcula como V1; el servidor valida que sea una fecha válida y no futura. P-12 queda sustituida. Texto original: Opciones: (a) el servidor la calcula siempre (P-12) y rechaza o ignora una `fechaNacimiento` enviada; (b) el cliente la calcula como V1 y el servidor la acepta; si hay discrepancia, ¿cuál manda?
- **R-P5 (decidida 2026-10-29, aprobada por el usuario) Aves sin sexo como progenitor.** **Decisión:** V2 exige sexo siempre y valida `MACHO`/`HEMBRA` para padre y madre. Texto original: Con `sexoItemId` obligatorio (como exige la pantalla) en V2 no habrá aves sin sexo; la excepción del repositorio (`padre.sexo &&`, `AveRepository.js:502-513,547-558`) deja de aplicar. ¿Confirmas que V2 exija sexo siempre y valide `MACHO`/`HEMBRA` por el código del ítem, o se replica la tolerancia?
- **R-P6 (decidida 2026-10-29, aprobada por el usuario) Candidatos a padre/madre y filtros: ¿servidor o cliente?** **Decisión:** opción (a): lista completa y filtros en la app, como V1; paginar después si hace falta. Texto original: V1 filtra todo en memoria y no tiene paginación (`AvesScreen.js:141-265`); `obtenerAvesActivasParaPadres` no figura en el mapeo del análisis. Opciones: (a) V2 devuelve la lista completa y la app filtra igual que V1; (b) filtros por query en `GET /aves` y parámetro para candidatos (`?candidatosPadres=true&excluirAveId=`); (c) endpoint propio de candidatos.
- **R-P7 (decidida 2026-10-29, aprobada por el usuario) Listados de vendidas/fallecidas.** **Decisión:** una sola baja por ave; el listado de vendidas/fallecidas devuelve el resumen de baja. Texto original: V1 usa `INNER JOIN bajas_ave` (un ave sin baja desaparece; varias bajas duplican filas). ¿Una sola baja por ave? ¿El listado devuelve el resumen de baja? Depende del módulo de bajas.
- **R-P8 (decidida 2026-10-29, aprobada por el usuario) Cambiar jaula a un ave no activa.** **Decisión:** rechazar si el ave no está `ACTIVA` (`AVE_NOT_ACTIVE`); la baja no libera la jaula, como V1. Texto original: V1 no lo valida (la UI solo ofrece ACTIVAS; las bajas no liberan la jaula). Opciones: (a) rechazar si no es `ACTIVA` (`AVE_NOT_ACTIVE`); (b) permitir como V1. Y ¿la baja debe liberar la jaula o se conserva como V1 (`desactivarJaula` sí libera todas, incluso vendidas)?
  - **R-P8a (abierta, subregla) `anterior == nueva` y quitar jaula.** V1 no valida que la jaula nueva sea distinta de la anterior; tampoco se decidió si quitar la jaula (`jaulaId = null`) de un ave no `ACTIVA` se rechaza (la regla R-P8 habla de "cambiar jaula"). Y `desactivarJaula` (módulo Jaulas) libera aves de cualquier estado, como V1: confirmar en la spec de Jaulas.
- **R-P9 (decidida 2026-10-29, aprobada por el usuario) Jaula inactiva en alta/cambio de jaula.** **Decisión:** rechazar jaula inactiva en el alta y en el cambio de jaula. Texto original: V1 no valida que la jaula esté activa (la UI solo lista activas). Opciones: (a) rechazar con `JAULA_NOT_ACTIVE` (propuesta nueva); (b) aceptar si existe.
  - **R-P9a (abierta, subregla) Código y HTTP del rechazo.** `JAULA_NOT_ACTIVE` es solo una propuesta de nombre (409 o 400 por definir).
- **R-P10 (decidida 2026-10-29, aprobada por el usuario) Orden de migraciones y alcance de `0005`.** **Decisión:** Jaulas antes que Aves; `0005` = jaulas, `0006` = aves, con FK real y `ON DELETE RESTRICT` (opción b). Las migraciones aún no se crean. Texto original: `aves` referencia `jaulas`, que no existe en D1. Opciones: (a) `0005` crea solo `aves` sin FK a jaulas hasta tener jaulas; (b) `0005` = jaulas y `0006` = aves; (c) una migración con ambas. ¿Dónde viven `ave_evolucion`, `ave_historial` y `jaula_historial`? ¿`ON DELETE` RESTRICT o SET NULL (el borrador usa SET NULL)?
- **R-P11 (decidida 2026-10-29, aprobada por el usuario) Padres vendidos/fallecidos y fechas.** **Decisión:** opción (a): cualquier ave existente del mismo criadero con el sexo correcto, sin validar estado ni fechas. Texto original: V1 acepta en el repositorio padres de cualquier estado y sin comparar fechas (la UI solo ofrece ACTIVAS más el ya seleccionado). Opciones: (a) replicar el repositorio (cualquier estado, sin fechas); (b) restringir a ACTIVA; (c) validar edad mínima del progenitor.
- **R-P12 (decidida 2026-10-29, aprobada por el usuario) Fotos en R2.** **Decisión:** diferido a la fase de R2. Mientras tanto la foto es opcional y no se puede quitar al editar, como V1. El flujo de subida, prefijo de clave, tamaño y tipos permitidos se definen en la fase de R2. Texto original: V1 guarda una URI local (copia antes de la transacción). V2 necesita un flujo de subida (antes o después del `POST`), prefijo de clave por criadero, tamaño y tipos permitidos. ¿Cuál? ¿Se mantiene la regla de V1 de no poder quitar la foto en la edición?
- **R-P13 (decidida 2026-10-29, aprobada por el usuario) Fechas futuras (P-11).** **Decisión:** rechazar con `VALIDATION_ERROR`. Texto original: ¿El servidor las rechaza con `VALIDATION_ERROR` (propuesta) o replica V1 (solo el selector)?
- **R-P14 (decidida 2026-10-29, aprobada por el usuario) Nombres y estatus de los códigos de error nuevos (P-07).** **Decisión:** conservar los códigos de error de V1 (`CODIGO_AVE_DUPLICADO`, `PADRE_NO_MACHO`, `MADRE_NO_HEMBRA`) para que las pantallas muestren los mismos mensajes; los nuevos siguen la convención actual de la API. Texto original: Aprobación de la tabla de equivalencias y de `AVE_CONCURRENCY_CONFLICT`.
  - **R-P14a (abierta, subregla) Nombres de los códigos nuevos.** Los nombres de la tabla de equivalencias distintos de los tres conservados (`AVE_NOT_FOUND`, `AVE_NOT_ACTIVE`, `AVE_PARENT_IS_SELF`, `AVE_PARENTS_EQUAL`, `AVE_PARENT_NOT_FOUND`, `AVE_PARENT_CIRCULAR`, `JAULA_NOT_FOUND`, `AVE_CONCURRENCY_CONFLICT`) siguen siendo propuestas; confirmar. Para `PADRES_IGUALES`, `PADRE_ES_MISMA_AVE`, `MADRE_ES_MISMA_AVE`, `PADRE_NO_ENCONTRADO`, `MADRE_NO_ENCONTRADA` y `PARENTESCO_CIRCULAR_*` (códigos de V1 que la decisión no nombra), ¿se conservan también o se renombran? La decisión nombra solo tres.
- **R-P15 (decidida 2026-10-29, aprobada por el usuario) Historial de ave y evolución en endpoints.** **Decisión:** solo `ciclo-vida`; el resto (historial y evolución) se decide en las specs de Evolución. Texto original: `obtenerHistorialAve` y `obtenerEvolucionAve` no tienen llamadores en V1 (el historial se ve vía ciclo de vida). ¿V2 los expone en los endpoints de aves o solo `ciclo-vida`?
- **R-P16 (decidida 2026-10-29, aprobada por el usuario) Edad mostrada y filtro de edad.** **Decisión:** el cliente replica ambas funciones tal cual (`AveCard.obtenerEdad` y `AvesScreen.obtenerEdadMeses`); el servidor no calcula la edad. Texto original: `AveCard` usa fecha local; `AvesScreen.obtenerEdadMeses` interpreta `YYYY-MM-DD` como UTC (posible desfase de un día). ¿V2 calcula la edad en el servidor con un solo criterio (cuál) o el cliente replica ambas funciones tal cual?
- **R-P17 (decidida 2026-10-29, aprobada por el usuario) Origen editable en la edición.** **Decisión:** replicarlo. Texto original: V1 permite cambiar `origen` en ambos sentidos al editar (los campos del otro origen se vacían y los padres se anulan, `NuevaAveScreen.js:1588-1651`; `AveRepository.js:1134-1145`). ¿V2 lo replica?

## Criterios de terminado

- [ ] Endpoints de aves (`GET` lista, `GET` con `disponiblesParaJaula`, `GET` detalle, `POST`, `PUT` datos, `PUT` jaula) implementados bajo `/api/v1/criaderos/:criaderoId/aves`, con `{ success: true, data }` / `{ success: false, error, message }`, sin `DELETE`.
- [ ] `POST .../aves/:aveId/finalizar-tratamiento` (ruta propuesta, R-P1b) implementado: una sola transacción (`estado_salud='SANA'`, `fecha_ultimo_control_salud`, diagnósticos `ACTIVO` -> `CERRADO`, `ave_historial` `SALUD` y `RECUPERACION`) y rechazo si el ave no está `EN_TRATAMIENTO` (código por definir, R-P1a).
- [ ] Decisiones R-P1 a R-P17 aprobadas el 2026-10-29 reflejadas en el código; subreglas abiertas (R-P1a a R-P1c, R-P2a, R-P3a, R-P3b, R-P8a, R-P9a, R-P14a) resueltas; reglas "Resolubles leyendo código" cerradas; diferencias deliberadas P-01, P-02, P-05, P-06, P-08 y P-09 (aún propuestas) aprobadas; estado de la spec `revisada` antes de implementar.
- [ ] Dependencia de orden: el módulo Jaulas (migración `0005`) implementado antes que Aves (migración `0006`, FK reales con `ON DELETE RESTRICT`, sin editar `0001`-`0004`), aplicadas solo en local con `npx wrangler d1 migrations apply criadero-kikirikis-dev --local`. `raza` y `sexo` como texto validado contra el catálogo del criadero (sin FK). Foto opcional y sin quitar mientras no exista R2 (diferido).
- [ ] Toda consulta filtra por `criadero_id` del criadero autenticado y excluye `deleted_at`; probado que un usuario no accede a aves, jaulas, padres ni ítems de otro criadero (`FORBIDDEN` / `CRIADERO_NOT_FOUND` / `AVE_NOT_FOUND`).
- [ ] Los casos PAR-AVE-001 a PAR-AVE-046 pasando (los que dependen de módulos de jaulas, salud, bajas y ciclo de vida, cuando existan; PAR-AVE-039 con el comportamiento completo de v1.0.0 y PAR-AVE-046 como diferencia deliberada), con los mensajes exactos de la sección "Validaciones en pantalla".
- [ ] Tests unitarios (servicio) con nombres `debe …`: debe rechazar código vacío; debe normalizar el código a mayúsculas y sin espacios; debe exigir edad, criadero de origen y método de envío cuando el origen es COMPRADA; debe validar que la fecha de nacimiento de una COMPRADA sea válida y no futura (el cálculo restando meses lo hace el cliente, R-P4; la prueba de `restarMeses` corresponde al cliente); debe rechazar medidas menores o iguales a cero; debe rechazar padre y madre iguales; debe rechazar un ave como su propio padre o madre; debe rechazar padre que no sea macho y madre que no sea hembra; debe rechazar ciclos genealógicos al editar; debe rechazar la edición de un ave no activa; debe devolver `CODIGO_AVE_DUPLICADO` con código repetido; debe rechazar una raza o un sexo que no estén en el catálogo del criadero; debe rechazar fechas futuras; debe rechazar una jaula inactiva en el alta y en el cambio de jaula; debe rechazar el cambio de jaula de un ave no activa; debe finalizar el tratamiento cerrando diagnósticos y registrando `SALUD` y `RECUPERACION`; debe rechazar finalizar el tratamiento de un ave que no está en tratamiento; debe crear `ave_evolucion` inicial, historial `ALTA` y, con jaula, `INGRESO_AVE`; debe no crear evolución al editar.
- [ ] Tests HTTP (`UNAUTHORIZED`/`INVALID_TOKEN`, `FORBIDDEN`, `CRIADERO_NOT_FOUND`, `VALIDATION_ERROR`, conflicto de versión) e integración D1 local (alta con evolución inicial, `ALTA`, `INGRESO_AVE`; cambio de jaula con `CAMBIO_JAULA`, `SALIDA_AVE`, `INGRESO_AVE`; atomicidad del batch). `npm run test:integration` solo con confirmación del usuario.
- [ ] `HEMRA`/`HEMBRA` resuelto: solo ítems de `SEXOS` del criadero (`MACHO`, `HEMBRA`).
- [ ] `npm run typecheck` sin errores; `git diff --check`; sin secretos ni datos reales de clientes; sin cambios en V1.
