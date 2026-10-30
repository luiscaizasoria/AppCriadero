# Spec: catalogos

> **Regla del proyecto (2026-10-29): replicar V1.** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login), y cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz. Solo se permiten diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red). Queda **revocado** el criterio "servidor más estricto que V1" y las decisiones tomadas con él. Todas las reglas abiertas y decisiones de producto de esta spec se marcan: *resuelta: replicar V1*, *técnica, se mantiene* o *revocada*; el resto del texto no se ha reescrito, por lo que las secciones "Diferencias deliberadas", "Decisiones aprobadas" y "Reglas abiertas" conservan su redacción original y deben leerse a la luz de estas marcas.
>
> **Decisiones revocadas en esta spec:** D-CAT-04 (normalizar el código en el servidor), D-CAT-06 (reactivar ítems y listar inactivos), D-CAT-07 (errores diferenciados) y D-CAT-08 (`version` obligatoria).
>
> **Se mantiene (técnico/online):** Catálogos por defecto en cada criadero nuevo, con 42 ítems (Morichillo, Balanceado, Agua y Agua con vitamina; se mantienen ENFERMEDADES, MEDICAMENTOS y ENVIO_AVE aunque V1 no los siembre): D-CAT-01 a D-CAT-03, DP-CAT-01 y DP-CAT-02; y D-CAT-05 (desactivar con `activo = 0`, el código sigue reservado, como V1).


> **Regla de paridad con V1.** V2 empieza sin datos de usuario, solo con catálogos. La V1 está probada y es el contrato: V2 reproduce exactamente lo que hace V1. Todo lo que V2 haga distinto es una **diferencia deliberada**: debe registrarse en la sección "Diferencias deliberadas" y estar aprobada por el usuario. Diferencias ya aceptadas: V2 requiere conexión y las pantallas necesitan estados de carga y de error de red.

## Estado

borrador

## Fuente V1

Alcance: aves individuales (sin lotes), sin sincronización offline. D1 es la fuente de verdad en V2. Los números de línea son del árbol actual (rama `spec/aves`).

Esquema y siembra (`src/database/`):

- `migrations.js` (`migrationV1`): tablas `catalogos` (l.4-10) y `catalogo_items` (l.12-26).
- `migrationV2.js` (`migrationV2`): tablas **heredadas** `enfermedades_catalogo` y `medicamentos_catalogo` (l.15-46) con sus semillas (l.49-79). Ver hallazgo 1.
- `migrationV3.js`: catálogo `RAZAS` + 9 ítems (l.8-206).
- `migrationV4.js`: catálogo `SEXOS` + 2 ítems (l.22-63).
- `migrationV6.js`: ítem `ENVIO_AVE` en `CATEGORIAS_FINANCIERAS` (l.53-73).
- `migrationV7.js`: catálogos `ENFERMEDADES`, `MEDICAMENTOS`, `ALIMENTOS`, `BEBIDAS`, `CATEGORIAS_FINANCIERAS` (l.7-68) y 7 categorías financieras (l.74-189).
- `seeders.js` (`ejecutarSeeders`, `insertarCategoriaFinanciera`): repite `INSERT OR IGNORE` de los 7 catálogos (l.25-140) y de las 7 categorías (l.146-199, helper l.251-286). Se invoca al final de `initDatabase` (`sqlite.js:350`).
- `sqlite.js` (`initDatabase`): ejecuta V1..V7 en orden (V6 en ~l.280-301, V7 en ~l.316-337) y después los seeders (l.350).

Repositorio: `src/repositories/ConfiguracionRepository.js` (`obtenerCatalogos`, `obtenerCatalogoPorCodigo`, `obtenerItemsCatalogo`, `crearItemCatalogo`, `actualizarItemCatalogo`, `eliminarItemCatalogo`).

Pantallas de administración: `src/screens/ConfiguracionScreen.js`, `CatalogoScreen.js`, `EditarCatalogoItemScreen.js`; navegación en `src/navigation/MasStackNavigator.js` (rutas `Configuracion` l.86, `Catalogo` l.104, `EditarCatalogoItem` l.124) y entrada desde `src/screens/MasMenuScreen.js:133-137`. Componente `src/components/SelectorCatalogo.js`.

Consumidores de los catálogos (lectura): `AveRepository`/`NuevaAveScreen.js` (RAZAS, SEXOS), `SaludRepository.js` `obtenerEnfermedades`/`obtenerMedicamentos` (l.7-90) + `SaludAveScreen.js`, `AlimentacionRepository.js` `obtenerTiposAlimentos` (l.8-32) + `AlimentacionJaulaScreen.js`, `BebidaRepository.js` `obtenerTiposBebidas` (l.9-33) + `BebidaJaulaScreen.js`, `NuevoMovimientoFinancieroScreen.js` y `EditarMovimientoFinancieroScreen.js` (CATEGORIAS_FINANCIERAS).

V2 (para la comparación): `api/src/catalogs/defaultCatalogItems.ts`, `api/src/criaderos/criaderos.service.ts` (`crearCriadero`, validaciones de configuración), `api/src/criaderos/criaderos.repository.ts` (`getCatalogosByCodigo`, `getCatalogoItemsInfo`), `api/migrations/0001`-`0004`.

Contexto (no sustituye al código): `documents/referencia-v1/analisis-v1-mapeo-api.md` (sección 13 l.673-683 y mapeo l.741-742, 830-838, 889, 897), `documents/arquitectura/modelo-datos-v2.md` (l.83-101 y modelo #11 l.835-965).

## Comportamiento en V1

### Hallazgos que cambian lo que decían los documentos

1. **Enfermedades y medicamentos NO están sembrados en `catalogo_items`.** Sus 4+4 valores (Coccidia, Coriza, Gripe, Otro / Vitamina, Antibiótico, Antiparasitario, Otro) solo existen en las tablas heredadas `enfermedades_catalogo` y `medicamentos_catalogo` (`migrationV2.js:49-79`). Búsqueda sin límite de `enfermedades_catalogo|medicamentos_catalogo` en `src/`: solo aparece en `migrationV2.js` (l.15, 32, 49, 66); ninguna pantalla ni repositorio las lee. Las pantallas leen `catalogo_items` con `catalogos.codigo = 'ENFERMEDADES'` / `'MEDICAMENTOS'` (`SaludRepository.js:34, 78`), y `migrationV7.js:7-29` solo crea el catálogo vacío. Conclusión por código: en una instalación nueva de V1 esos dos catálogos están vacíos y el usuario debe crear sus ítems. `modelo-datos-v2.md:879, 892` y el análisis V1 (l.637-638, 679-680) afirman lo contrario.
2. **`ENVIO_AVE` no se siembra en una instalación nueva de V1 (deducido del código, no probado en dispositivo).** `migrationV6.js:53-73` inserta `ENVIO_AVE` con `SELECT ... FROM catalogos WHERE codigo='CATEGORIAS_FINANCIERAS'`; en una instalación nueva ese catálogo aún no existe en V6 (lo crean `migrationV7.js:66-68` y `seeders.js:129-140`, ambos posteriores), así que el `INSERT` no inserta filas. Los seeders solo insertan 7 categorías (`seeders.js:146-199`, sin `ENVIO_AVE`). Solo bases que ya tenían el catálogo antes de V6 lo reciben (orden = MAX(orden)+1). Aun así el código usa `'ENVIO_AVE'` como texto en movimientos automáticos: `BajaAveRepository.js:343`, `FinanzasRepository.js:480`, filtro de `EditarMovimientoFinancieroScreen.js:346`, etiqueta `FinanzasScreen.js:1039`.
3. **Las categorías financieras creadas por el usuario no aparecen al registrar un movimiento.** `NuevoMovimientoFinancieroScreen.js:202-228` y `EditarMovimientoFinancieroScreen.js:341-359` filtran `categorias` contra listas de códigos fijos (INGRESO: `VENTA_AVE`, `VENTA_HUEVOS`, `OTRO` en alta; más `ENVIO_AVE` en edición; EGRESO: `ALIMENTO`, `MEDICAMENTO`, `INFRAESTRUCTURA`, `COMPRA_AVE`, `OTRO`). Un ítem nuevo de `CATEGORIAS_FINANCIERAS` se puede crear en `CatalogoScreen`, pero nunca es seleccionable.
4. **`SEXOS` no es administrable.** `ConfiguracionScreen.js:23-55` solo ofrece 6 catálogos (RAZAS, ENFERMEDADES, MEDICAMENTOS, ALIMENTOS, BEBIDAS, CATEGORIAS_FINANCIERAS). `SEXOS` solo se lee en `NuevaAveScreen.js:332-334, 364-373`. Ninguna pantalla V1 permite editarlo; el repositorio sí lo permitiría.
5. **La unicidad cuenta también los ítems "eliminados".** `UNIQUE(catalogo_id, codigo)` no es parcial (`migrations.js:25`), y "eliminar" solo pone `activo = 0` (`ConfiguracionRepository.js:268 (SET activo = 0 en `eliminarItemCatalogo`, l.251-279)`). No hay `DELETE` de ítems en ningún lugar de `src/` (búsqueda `DELETE FROM catalogo_items`: sin resultados; el grep de `catalogo_items` en `src/` lista solo los `INSERT`/`UPDATE`/`SELECT` citados en esta spec).
6. **Los ítems nuevos se ordenan primero.** `catalogo_items.orden` es `NOT NULL DEFAULT 0` (`migrations.js:19`); `crearItemCatalogo` no informa `orden` (`ConfiguracionRepository.js:153-196`), por lo que queda en 0 y `ORDER BY orden, nombre` (`:118-122`) los coloca antes de los sembrados (orden 1..n) en RAZAS y CATEGORIAS_FINANCIERAS.
7. **El análisis V1 y el handoff se contradicen con el código en dos puntos más:** el análisis (l.683) lista "Envío de ave" como categoría de V1 sin matiz (ver hallazgo 2) y el handoff (`CLAUDE_PROJECT_HANDOFF_...md:688`) deja pendiente "verificar si ALIMENTOS/BEBIDAS tienen items iniciales": verificado, no tienen (`migrationV7.js:39-55` solo crea los catálogos; búsqueda de `INSERT ... catalogo_items` en `src/` solo apunta a RAZAS, SEXOS, CATEGORIAS_FINANCIERAS y ENVIO_AVE).

### Tablas y columnas de V1

`catalogos` (`migrations.js:4-10`): `id INTEGER PK AUTOINCREMENT`, `codigo TEXT NOT NULL UNIQUE`, `nombre TEXT NOT NULL`, `activo INTEGER NOT NULL DEFAULT 1`, `fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`. Sin `descripcion`.

`catalogo_items` (`migrations.js:12-26`): `id INTEGER PK AUTOINCREMENT`, `catalogo_id INTEGER NOT NULL` (FK `catalogos(id)`), `codigo TEXT NOT NULL`, `nombre TEXT NOT NULL`, `descripcion TEXT`, `activo INTEGER NOT NULL DEFAULT 1`, `orden INTEGER NOT NULL DEFAULT 0`, `fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`, `UNIQUE(catalogo_id, codigo)`. Sin `fecha_actualizacion`, sin `deleted_at`.

Tablas heredadas sin uso (`migrationV2.js:15-46`): `enfermedades_catalogo` y `medicamentos_catalogo` (`id`, `codigo UNIQUE`, `nombre`, `activo`, `fecha_creacion`).

### Catálogos sembrados en V1 (instalación nueva)

Nombre del catálogo (`catalogos.nombre`) y evidencia:

| `catalogos.codigo` | `catalogos.nombre` V1 | Evidencia |
|---|---|---|
| `RAZAS` | Razas de aves | `migrationV3.js:15-16`, `seeders.js:34-35` |
| `SEXOS` | Sexo de aves | `migrationV4.js:29-30`, `seeders.js:51-52` |
| `ENFERMEDADES` | Enfermedades | `migrationV7.js:14-15`, `seeders.js:68-69` |
| `MEDICAMENTOS` | Medicamentos | `migrationV7.js:27-28`, `seeders.js:85-86` |
| `ALIMENTOS` | Alimentos | `migrationV7.js:40-41`, `seeders.js:102-103` |
| `BEBIDAS` | Bebidas | `migrationV7.js:53-54`, `seeders.js:119-120` |
| `CATEGORIAS_FINANCIERAS` | Categorías financieras | `migrationV7.js:66-67`, `seeders.js:136-137` |

Ítems sembrados (`codigo` | `nombre` | `orden`):

- **RAZAS** (9; `migrationV3.js`): `KIKIRIS` Kikiris 1 (l.32-34); `KIKIRIKIS_MEJORADOS` Kikirikis mejorados 2 (l.53-55); `AZTECAS` Aztecas 3 (l.74-76); `SEBRING` Sebring 4 (l.95-97); `NAGASAKI` Nagasaki 5 (l.116-118); `KIRI` Kiri 6 (l.137-139); `FANTASIA` Fantasía 7 (l.158-160); `SERAMA` Serama 8 (l.179-181); `OTRO` Otro 9 (l.200-202).
- **SEXOS** (2; `migrationV4.js`): `MACHO` Macho 1 (l.43-45); `HEMBRA` Hembra 2 (l.59-61).
- **CATEGORIAS_FINANCIERAS** (7 en instalación nueva; `migrationV7.js:74-189` y `seeders.js:146-199`): `VENTA_AVE` Venta de ave 1; `VENTA_HUEVOS` Venta de huevos 2; `ALIMENTO` Alimento 3; `MEDICAMENTO` Medicamento 4; `INFRAESTRUCTURA` Infraestructura 5; `COMPRA_AVE` Compra de ave 6; `OTRO` Otro 7. `ENVIO_AVE` Envío de ave solo en bases migradas que ya tenían el catálogo (hallazgo 2; `migrationV6.js:62-71`, orden = MAX+1, es decir 8 si había 7).
- **ENFERMEDADES, MEDICAMENTOS, ALIMENTOS, BEBIDAS**: 0 ítems en `catalogo_items` (hallazgo 1 y 7).

### Operaciones por catálogo en V1

`ConfiguracionScreen.js:23-55` ofrece administrar: `RAZAS`, `ENFERMEDADES`, `MEDICAMENTOS`, `ALIMENTOS`, `BEBIDAS`, `CATEGORIAS_FINANCIERAS`. Para todos ellos `CatalogoScreen` permite listar, "Nuevo elemento" (l.445-511), "Editar" (l.325-382) y "Eliminar" (l.386-430, es desactivación). `SEXOS` no está en el menú (hallazgo 4). No hay reactivación en ninguna pantalla ni método de repositorio.

| Operación | Método | Qué hace en SQL | Mensajes |
|---|---|---|---|
| Listar catálogos | `obtenerCatalogos` (l.7-39) | `catalogos WHERE activo = 1 ORDER BY nombre` | Sin uso en `src/` (solo definida) |
| Obtener catálogo | `obtenerCatalogoPorCodigo(codigo)` (l.44-77) | `SELECT id, codigo, nombre FROM catalogos WHERE codigo = ?` (no filtra `activo`) | - |
| Listar ítems | `obtenerItemsCatalogo(catalogoId)` (l.82-130) | `catalogo_items WHERE catalogo_id = ? AND activo = 1 ORDER BY orden, nombre` | - |
| Crear | `crearItemCatalogo({catalogoId, codigo, nombre, descripcion})` (l.135-198) | `INSERT` con `activo = 1`; `descripcion \|\| null`; `orden` por defecto 0 | - |
| Editar | `actualizarItemCatalogo({id, nombre, descripcion})` (l.203-246) | `UPDATE nombre, descripcion WHERE id = ?`; no cambia `codigo`, `orden` ni `activo` | - |
| Eliminar | `eliminarItemCatalogo(id)` (l.251-279) | `UPDATE activo = 0 WHERE id = ?`; no comprueba uso | - |

### Flujo de pantallas (`CatalogoScreen`, `EditarCatalogoItemScreen`)

- Carga (`CatalogoScreen.js:61-125`): `obtenerCatalogoPorCodigo(codigo)`; si existe, `obtenerItemsCatalogo(catalogoData.id)`; si no, lista vacía. Error: `console.error` y lista vacía (sin alerta). Se recarga al enfocar (l.129-142).
- Lista vacía: texto `No existen registros.` (l.266). Cada tarjeta muestra `nombre` y, si hay, `descripcion` (l.296, 302-314).
- Eliminar: `Alert.alert('Eliminar elemento', '¿Desea eliminar ${item.nombre}?', [Cancelar | Eliminar])` (l.152-216); al confirmar llama `eliminarItemCatalogo(item.id)` y recarga (l.183-188); si falla: `Alert.alert('Error', 'No fue posible eliminar el elemento.')` (l.201-204).
- Alta/edición (`EditarCatalogoItemScreen.js`): campos `Nombre` y `Descripción` (l.219-278); título `Editar elemento` / `Nuevo elemento` (l.207-213).
  - Validación: si `!nombre.trim()` → `Alert.alert('Nombre requerido', 'Ingrese un nombre.')` (l.71-82).
  - Edición: `actualizarItemCatalogo({id, nombre: nombre.trim(), descripcion: descripcion.trim()})` (l.98-109).
  - Alta: `crearItemCatalogo({catalogoId, codigo, nombre.trim(), descripcion.trim()})` con `codigo = nombre.trim().toUpperCase().replace(/\s+/g, '_')` (l.116-135; la regla del código, l.120-127).
  - Éxito: `Alert.alert('Guardado', 'El elemento fue guardado correctamente.', [Aceptar → goBack])` (l.142-158).
  - Error (incluye violación de `UNIQUE`): `console.error` y `Alert.alert('Error', 'No fue posible guardar el elemento.')` (l.162-175). El texto exacto del error de SQLite no se muestra al usuario.
  - Botón: `💾 Guardar` / `Guardando...` (l.306-312), deshabilitado mientras guarda (l.294-296).

### Cómo consumen los catálogos las pantallas (qué valor se guarda)

V1 guarda texto, no una clave foránea al ítem. Por eso desactivar o renombrar un ítem no altera los registros históricos.

| Catálogo | Pantalla | Lista (orden) | Valor guardado | Evidencia |
|---|---|---|---|---|
| RAZAS | `NuevaAveScreen` | `obtenerItemsCatalogo` (orden, nombre) | `item.nombre` (columna `aves.raza`) | `NuevaAveScreen.js:328-330, 347-356, 2031-2033` |
| SEXOS | `NuevaAveScreen` | `obtenerItemsCatalogo` | `item.codigo` (columna `aves.sexo`) | `:332-334, 364-373, 2062-2064` |
| ENFERMEDADES | `SaludAveScreen` | `ORDER BY ci.nombre` | `enfermedadSeleccionada.nombre` | `SaludRepository.js:7-46`; `SaludAveScreen.js:280-281` |
| MEDICAMENTOS | `SaludAveScreen` | `ORDER BY ci.nombre` | `medicamentoSeleccionado.nombre` (opcional) | `SaludRepository.js:51-90`; `SaludAveScreen.js:292-295` |
| ALIMENTOS | `AlimentacionJaulaScreen` | `ORDER BY ci.nombre` | `tipo.nombre` | `AlimentacionRepository.js:8-32`; `AlimentacionJaulaScreen.js:89-90` |
| BEBIDAS | `BebidaJaulaScreen` | `ORDER BY ci.nombre` | `tipo.nombre` | `BebidaRepository.js:9-33`; `BebidaJaulaScreen.js:91` |
| CATEGORIAS_FINANCIERAS | `NuevoMovimientoFinancieroScreen` | `obtenerItemsCatalogo` + filtro por códigos fijos | `categoria.codigo` | `NuevoMovimientoFinancieroScreen.js:79-96, 138-139, 202-228` |

Efectos relevantes:

- Edición de ave: la raza actual se vuelve a localizar por `nombre` sin distinguir mayúsculas (`NuevaAveScreen.js:503-521`) y el sexo por `codigo` (`:535-553`). Si la raza fue desactivada o renombrada, `razaSeleccionada` queda `null` y `guardar` exige elegir otra (`:759-763`).
- Edición de movimiento: si la categoría ya no está en el catálogo activo, la pantalla usa un objeto de reserva `{id, codigo, nombre} = mov.categoria` (`EditarMovimientoFinancieroScreen.js:99-109`).
- Sin ítems activos: `SelectorCatalogo` muestra `No existen opciones disponibles.` (`SelectorCatalogo.js:26, 31-41`). Para alimentación y bebida el registro exige un tipo: `Seleccione alimento` / `Debe seleccionar un tipo de alimento.` (`AlimentacionJaulaScreen.js:70-73`) y `Seleccione bebida` / `Debe seleccionar un tipo de bebida.` (`BebidaJaulaScreen.js:71-74`). Para salud, `Enfermedad requerida` / `Selecciona una enfermedad.` (`SaludAveScreen.js:253-258`).

## Contrato del repositorio V1

Archivo: `src/repositories/ConfiguracionRepository.js`. Todos los métodos son `async`, obtienen la base con `getDatabase()` y no lanzan errores propios (cualquier fallo de SQLite se propaga tal cual). No hay `throw new Error` en el archivo.

| Método | Parámetros | Devuelve | Errores | Consumidores |
|---|---|---|---|---|
| `obtenerCatalogos()` (l.7) | ninguno | `[{id, codigo, nombre, activo}]` de catálogos con `activo = 1`, por `nombre` | - | Ninguno en `src/` |
| `obtenerCatalogoPorCodigo(codigo)` (l.44) | `codigo: string` | `{id, codigo, nombre}` o `null` (`getFirstAsync`) | - | `CatalogoScreen:69`, `NuevaAveScreen:328,332`, `NuevoMovimientoFinancieroScreen:80`, `EditarMovimientoFinancieroScreen:85` |
| `obtenerItemsCatalogo(catalogoId)` (l.82) | `catalogoId: number` | `[{id, codigo, nombre, descripcion, activo, orden}]`, solo `activo = 1`, por `orden, nombre` | - | mismos que arriba |
| `crearItemCatalogo({catalogoId, codigo, nombre, descripcion})` (l.135) | objeto | `undefined` (no devuelve el `id`) | Violación de `UNIQUE(catalogo_id, codigo)`; FK inexistente (por `PRAGMA foreign_keys = ON`, `sqlite.js:61-64`) | `EditarCatalogoItemScreen:116`; captura con `try/catch` y alerta genérica |
| `actualizarItemCatalogo({id, nombre, descripcion})` (l.203) | objeto | `undefined` | Ninguno específico; si `id` no existe, no hace nada y no falla | `EditarCatalogoItemScreen:98` |
| `eliminarItemCatalogo(id)` (l.251) | `id: number` | `undefined` | Ninguno específico (idempotente; no falla si ya estaba en 0 o no existe) | `CatalogoScreen:183` |

Lecturas de catálogo fuera del repositorio de configuración (con `JOIN catalogos c` y `c.codigo = '<CODIGO>' AND ci.activo = 1`): `SaludRepository.obtenerEnfermedades/obtenerMedicamentos` (devuelven `{id, codigo, nombre}` por `ci.nombre`), `AlimentacionRepository.obtenerTiposAlimentos`, `BebidaRepository.obtenerTiposBebidas` (ídem).

## Validaciones en pantalla

| Regla | Mensaje exacto | Archivo:línea | Código de error V2 propuesto |
|---|---|---|---|
| `nombre.trim()` no vacío al crear/editar ítem | título `Nombre requerido`, texto `Ingrese un nombre.` | `EditarCatalogoItemScreen.js:71-82` | `VALIDATION_ERROR` |
| `codigo` del ítem nuevo = `nombre.trim().toUpperCase()` con `\s+` → `_` (sin quitar tildes ni signos) | (sin mensaje) | `EditarCatalogoItemScreen.js:120-127` | Lo aplica el backend (ver "Diferencias deliberadas" D-CAT-04) |
| `descripcion` se guarda recortada; vacío → `null` | (sin mensaje) | `EditarCatalogoItemScreen.js:106, 132`; `ConfiguracionRepository.js:192-193, 238-239` | - |
| Código duplicado dentro del mismo catálogo (activo o desactivado) | `Error` / `No fue posible guardar el elemento.` (genérico, no distingue la causa) | `EditarCatalogoItemScreen.js:171-174`; `migrations.js:25` | `CATALOGO_ITEM_DUPLICATE` (propuesto) |
| Confirmación antes de desactivar | `Eliminar elemento` / `¿Desea eliminar ${item.nombre}?` (botones `Cancelar`, `Eliminar`) | `CatalogoScreen.js:152-176` | Solo UI |
| Fallo al desactivar | `Error` / `No fue posible eliminar el elemento.` | `CatalogoScreen.js:201-204` | `INTERNAL_ERROR` |
| No se puede agregar ítem si el catálogo no existe (botón deshabilitado) | (sin mensaje) | `CatalogoScreen.js:450-457` | `CATALOGO_NOT_FOUND` (propuesto) |
| Éxito al guardar | `Guardado` / `El elemento fue guardado correctamente.` | `EditarCatalogoItemScreen.js:142-146` | Solo UI |
| Raza obligatoria al crear/editar ave | `Raza requerida` / `Selecciona la raza del ave.` | `NuevaAveScreen.js:759-763` | Spec de aves |
| Sexo obligatorio | `Sexo requerido` / `Selecciona si el ave es macho o hembra.` | `NuevaAveScreen.js:771-776` | Spec de aves |
| Categoría financiera obligatoria | `Categoría requerida` / `Seleccione una categoría.` | `NuevoMovimientoFinancieroScreen.js:104-111` | Spec de finanzas |

No hay en V1: longitud máxima de nombre/descripción, comprobación de nombres repetidos (solo de código), ni comprobación de uso del ítem antes de desactivarlo.

## Comparación con la plantilla V2 (`defaultCatalogItems.ts`)

`api/src/catalogs/defaultCatalogItems.ts` define 38 ítems (cabecera l.22-32; datos l.34-284). Se copian a cada criadero nuevo en un único `batch` (`criaderos.service.ts:95-117`; `activo = 1`, `deleted_at = NULL`, `version = 1`, `orden = item.order ?? null`; `catalogoItemsGenerados = DEFAULT_CATALOG_ITEMS.length` en l.138).

### Convención de códigos de la plantilla

MAYÚSCULAS, sin tildes ni signos, palabras separadas por `_`: `KIKIRIKIS_MEJORADOS` (Kikirikis mejorados), `FANTASIA` (Fantasía), `ANTIBIOTICO` (Antibiótico), `ENVIO_AVE` (Envío de ave), `GALLINA_GALLO` (Gallina / Gallo, l.216), `INFRAESTRUCTURA`. Las preposiciones "de" se omiten en los códigos de `CATEGORIAS_FINANCIERAS`: `VENTA_AVE` (Venta de ave), `COMPRA_AVE`, `VENTA_HUEVOS`. Un código puede acortar el nombre: `CONSUMO` (Consumo propio, l.275-276), `CRIANZA` (Cría, l.248-249). Códigos repetidos entre catálogos distintos (`OTRO`) son válidos porque la unicidad es por catálogo (`0001_core_schema.sql:98-100`). Los ítems de nombre de una sola palabra usan el nombre en mayúsculas (`COCCIDIA`, `VITAMINA`, `PATO`, `MIXTO`).

### Tabla por catálogo (ítems V1 | plantilla V2 | falta/sobra para igualar a V1)

La columna "V1" es lo que realmente siembra una instalación nueva de V1 (hallazgos 1 y 2). La decisión del usuario (todos los catálogos básicos cargados por defecto y lista inicial para ALIMENTOS y BEBIDAS) es una **diferencia deliberada respecto a V1** en ENFERMEDADES, MEDICAMENTOS, ALIMENTOS, BEBIDAS y `ENVIO_AVE` (ver D-CAT-01 a D-CAT-03).

| Catálogo | Ítems V1 (siembra real) | Ítems plantilla V2 (actual) | Falta / sobra |
|---|---|---|---|
| RAZAS | 9: Kikiris, Kikirikis mejorados, Aztecas, Sebring, Nagasaki, Kiri, Fantasía, Serama, Otro (orden 1-9) | 9, mismos códigos, nombres y orden (l.36-89) | Nada. Igual a V1 |
| SEXOS | 2: Macho (1), Hembra (2) | 2, igual (l.92-103) | Nada. Igual a V1 |
| ENFERMEDADES | 0 en `catalogo_items` (4 valores solo en tabla heredada sin uso) | 4: COCCIDIA, CORIZA, GRIPE, OTRO, `order: null` (l.106-129) | Sobran 4 respecto a V1 real; los mantiene la decisión del usuario (D-CAT-01) |
| MEDICAMENTOS | 0 en `catalogo_items` (4 en tabla heredada sin uso) | 4: VITAMINA, ANTIBIOTICO, ANTIPARASITARIO, OTRO, `order: null` (l.132-155) | Sobran 4 respecto a V1 real; los mantiene la decisión del usuario (D-CAT-01) |
| ALIMENTOS | 0 | 0 (comentario l.157-158 "No tiene items iniciales según V1") | **Faltan 2** por decisión del usuario: Morichillo, Balanceado |
| BEBIDAS | 0 | 0 (comentario l.160-161) | **Faltan 2** por decisión del usuario: Agua, Agua con vitamina |
| CATEGORIAS_FINANCIERAS | 7 en instalación nueva (VENTA_AVE, VENTA_HUEVOS, ALIMENTO, MEDICAMENTO, INFRAESTRUCTURA, COMPRA_AVE, OTRO; orden 1-7); `ENVIO_AVE` solo en bases migradas | 8: los 7 con el mismo orden más `ENVIO_AVE` orden 8 (l.164-211) | Sobra `ENVIO_AVE` respecto a una instalación nueva de V1 (D-CAT-02); el código V1 sí lo usa (`BajaAveRepository.js:343`, `FinanzasRepository.js:480`) |
| ESPECIES | no existe en V1 | 5 (l.214-243) | No aplica (onboarding V2; fuera de V1) |
| TIPOS_CRIADERO | no existe en V1 | 3 (l.246-263) | No aplica |
| FINALIDADES_CRIADERO | no existe en V1 | 3 (l.266-283) | No aplica |

Conteo: actual 9+2+4+4+0+0+8+5+3+3 = 38 (27 del dominio V1 según `modelo-datos-v2.md:965` + 11 de onboarding). Con la decisión: ALIMENTOS 2 y BEBIDAS 2 → **42 ítems** (27 + 4 nuevos + 11). Estrictamente, de los 27 solo 18 (9 razas + 2 sexos + 7 categorías) los siembra V1 de verdad; los otros 9 son 8 enfermedades/medicamentos de tablas heredadas y `ENVIO_AVE`.

### Ítems nuevos propuestos (códigos)

| Catálogo | Código propuesto | Nombre | Orden propuesto | Justificación |
|---|---|---|---|---|
| ALIMENTOS | `MORICHILLO` | Morichillo | null (ver regla abierta) | Nombre de una palabra → mayúsculas, como `COCCIDIA`, `VITAMINA` (l.108, 134) y como lo derivaría V1 (`EditarCatalogoItemScreen.js:120-127`) |
| ALIMENTOS | `BALANCEADO` | Balanceado | null | Ídem |
| BEBIDAS | `AGUA` | Agua | null | Ídem; `OTRO` ya se repite entre catálogos, así que no hay conflicto |
| BEBIDAS | `AGUA_VITAMINA` | Agua con vitamina | null | **Decisión del usuario (2026-10-29).** Omite "con", como se omite "de" en `VENTA_AVE`. Nota: la regla de alta de V1 (`EditarCatalogoItemScreen.js:120-127`) daría `AGUA_CON_VITAMINA` para ese nombre; `AGUA_VITAMINA` es una diferencia consciente respecto de esa regla de alta (el código de un ítem sembrado no lo deriva la regla) |

Estos 4 ítems **no existen aún** en el código; no se han añadido (esta spec no modifica código). La plantilla pasa de 38 a 42 ítems cuando se implemente. `ENFERMEDADES`, `MEDICAMENTOS` y `ENVIO_AVE` se mantienen en la plantilla aunque V1 no los siembre (D-CAT-01, D-CAT-02).

## Tratamiento de ítems desactivados y unicidad: V1 frente a D1

| Aspecto | V1 | D1 actual (0001-0004) | Diferencia / ajuste |
|---|---|---|---|
| Columna de estado | `catalogo_items.activo` (`migrations.js:18`); no hay `deleted_at` | `activo` (`0001:70`) **y** `deleted_at` (`0001:74`) + `version` (`0001:75`) | D1 tiene dos mecanismos; hay que definir cuál implementa "desactivar" (D-CAT-05) |
| "Eliminar" | `UPDATE activo = 0` (`ConfiguracionRepository.js:268 (SET activo = 0 en `eliminarItemCatalogo`, l.251-279)`); no hay borrado físico | Sin endpoints. Las FK `ON DELETE RESTRICT` (`0003:188-196`) impiden borrar el criadero con ítems | Equivalente: desactivar (`activo = 0`); no hard delete (CLAUDE.md) |
| Filtro en listados y selectores | Siempre `activo = 1` (`:115`, `SaludRepository.js:36,80`, `AlimentacionRepository.js:26`, `BebidaRepository.js:27`) | La validación de configuración exige `activo = 1` y `deleted_at IS NULL` (`criaderos.service.ts:222-238, 475-492`; errores `ITEM_NOT_ACTIVE`, `ITEM_DELETED`). No hay listado | Reproducir: listar solo activos por defecto |
| Registros históricos | Guardan texto (nombre/código), sin FK; no se ven afectados (ver tabla de consumo) | Aún no hay módulos que referencien ítems salvo `criadero_configuracion` (FK `ON DELETE SET NULL`, `0003:266-284`) | Decisión por módulo: texto o `item_id` (regla abierta DP-CAT-04) |
| Reactivar | No existe (ni pantalla ni método). Un seeder con `INSERT OR IGNORE` tampoco reactiva (`seeders.js:260`, choca con `UNIQUE`) | Posible a nivel de datos (`activo`), sin endpoint | Diferencia deliberada propuesta D-CAT-06 |
| Borrar | Imposible desde la app | `deleted_at` permitiría soft delete | Fuera de alcance salvo decisión |
| Unicidad de código | `UNIQUE(catalogo_id, codigo)` **total** (cuenta desactivados) (`migrations.js:25`); comparación binaria de SQLite (distingue mayúsculas, tildes) | Índice parcial `ux_catalogo_items_codigo_activo ON (criadero_id, catalogo_id, codigo) WHERE deleted_at IS NULL` (`0001:98-100`, recreado en `0003:75-77, 234-236`): un código se reserva mientras `deleted_at IS NULL`, **aunque `activo = 0`**; solo se libera con `deleted_at` | Si "desactivar" = `activo = 0`, D1 coincide con V1 (el código sigue reservado). Si fuera `deleted_at`, el código se liberaría (distinto de V1) |
| Unicidad de nombre | No existe | No existe | Igual (los nombres pueden repetirse) |
| Mayúsculas/trim del código | El alta fuerza `trim` + `toUpperCase` + espacios→`_` en la pantalla (`EditarCatalogoItemScreen.js:120-127`); el repositorio no valida | El índice es sensible a mayúsculas; sin normalización en el servidor | El backend debe aplicar la misma normalización (D-CAT-04) |
| Edición | Solo `nombre` y `descripcion`; el `codigo` no cambia (`ConfiguracionRepository.js:219-243`) | `version` permite concurrencia optimista (`UPDATE ... WHERE version = ?`, CLAUDE.md) | Añadir `version` en la petición (ajuste técnico) |
| Orden | `orden NOT NULL DEFAULT 0`; ítems nuevos con 0 | `orden INTEGER` nullable (`0001:71`); la plantilla usa `null` en 4 catálogos | Ver regla abierta RC-CAT-05 |
| Descripción y metadatos del catálogo | `catalogos` sin `descripcion` | `catalogos.descripcion` (`0001:51`) y `0002`/`0004` con nombres distintos (p. ej. "Razas" frente a "Razas de aves") | Diferencia menor de etiquetas; ver regla abierta RC-CAT-06 |

## Paridad con V1

Estado inicial de referencia: criadero nuevo en V2 con la plantilla propuesta (42 ítems).

| ID | Dado | Cuando | Entonces | Evidencia V1 |
|---|---|---|---|---|
| PAR-CAT-001 | Criadero nuevo | Se listan ítems de `RAZAS` | 9 ítems en orden 1-9 con códigos y nombres de V1 | `migrationV3.js:21-206`; `defaultCatalogItems.ts:36-89` |
| PAR-CAT-002 | Criadero nuevo | Se listan ítems de `SEXOS` | `MACHO`(1), `HEMBRA`(2) | `migrationV4.js:34-63` |
| PAR-CAT-003 | Criadero nuevo | Se listan ítems de `CATEGORIAS_FINANCIERAS` | Las 7 categorías de V1 en orden 1-7 (más `ENVIO_AVE`, orden 8, por D-CAT-02 aprobada el 2026-10-29) | `migrationV7.js:74-189`; `seeders.js:146-199` |
| PAR-CAT-004 | Criadero nuevo | Se listan `ENFERMEDADES` y `MEDICAMENTOS` | V1 devuelve lista vacía; V2 devuelve 4 cada uno por D-CAT-01 (diferencia deliberada, no paridad) | `SaludRepository.js:7-90`; `migrationV7.js:7-29` |
| PAR-CAT-005 | Criadero nuevo | Se listan `ALIMENTOS` y `BEBIDAS` | V1 vacío; V2 devuelve Morichillo (`MORICHILLO`), Balanceado (`BALANCEADO`) / Agua (`AGUA`), Agua con vitamina (`AGUA_VITAMINA`) por D-CAT-03 (diferencia deliberada aprobada) | `AlimentacionRepository.js:8-32`; `BebidaRepository.js:9-33` |
| PAR-CAT-006 | Catálogo con ítems activos y uno desactivado | Se listan ítems | Solo los activos, ordenados por `orden`, luego `nombre`; cada ítem trae `id, codigo, nombre, descripcion, activo, orden` | `ConfiguracionRepository.js:92-128` |
| PAR-CAT-007 | Catálogo cualquiera | Se crea ítem con nombre `"  Maíz molido "` y descripción vacía | Guarda `nombre = "Maíz molido"`, `codigo = "MAÍZ_MOLIDO"` (mayúsculas con tilde, espacios → `_`), `descripcion = null`, `activo = 1` | `EditarCatalogoItemScreen.js:116-135`; `ConfiguracionRepository.js:153-196` |
| PAR-CAT-008 | Cualquier catálogo | Se crea ítem con nombre vacío o solo espacios | Rechazo: `Nombre requerido` / `Ingrese un nombre.` (V2: `VALIDATION_ERROR`) | `EditarCatalogoItemScreen.js:71-82` |
| PAR-CAT-009 | Existe ítem con código `AGUA` (activo) | Se crea otro ítem cuyo nombre produce `AGUA` (p. ej. `agua`) | Rechazo por duplicado de código (V1: `Error` / `No fue posible guardar el elemento.`; V2: `CATALOGO_ITEM_DUPLICATE`) | `migrations.js:25`; `EditarCatalogoItemScreen.js:162-175` |
| PAR-CAT-010 | Existe ítem desactivado con código `AGUA` | Se crea ítem `Agua` | Sigue rechazado: el código desactivado continúa reservado | `migrations.js:25` (índice total); `ConfiguracionRepository.js:268 (SET activo = 0 en `eliminarItemCatalogo`, l.251-279)` |
| PAR-CAT-011 | Mismo código en catálogos distintos | Se crea `OTRO` en `ALIMENTOS` (ya existe en `RAZAS`) | Aceptado: la unicidad es por catálogo | `migrations.js:25` |
| PAR-CAT-012 | Ítem existente | Se edita con nombre y descripción nuevos | Cambian `nombre` y `descripcion` (recortada; vacía → `null`); `codigo`, `orden` y `activo` no cambian | `ConfiguracionRepository.js:219-243` |
| PAR-CAT-013 | Edición con nombre vacío | Se guarda | Rechazo `Nombre requerido` / `Ingrese un nombre.` | `EditarCatalogoItemScreen.js:71-82` |
| PAR-CAT-014 | Ítem sembrado (p. ej. raza `KIKIRIS`) | Se desactiva ("Eliminar") | `activo = 0`; desaparece de listados y selectores; no se borra la fila | `ConfiguracionRepository.js:268 (SET activo = 0 en `eliminarItemCatalogo`, l.251-279)` |
| PAR-CAT-015 | Ítem ya desactivado | Se desactiva otra vez | Sin error (operación idempotente) | `ConfiguracionRepository.js:268 (SET activo = 0 en `eliminarItemCatalogo`, l.251-279)` |
| PAR-CAT-016 | Ave registrada con raza `Kikiris`; la raza se desactiva | Se consulta el ave | El ave conserva el texto `Kikiris` (sin FK); al editarla hay que elegir otra raza | `NuevaAveScreen.js:503-521, 759-763` |
| PAR-CAT-017 | Movimiento con categoría desactivada | Se abre en edición | Se muestra la categoría guardada por código mediante el objeto de reserva | `EditarMovimientoFinancieroScreen.js:99-109` |
| PAR-CAT-018 | Categoría financiera creada por el usuario | Se registra un movimiento | La categoría no se ofrece (filtro por códigos fijos). Paridad solo si se decide mantener (RC-CAT-02) | `NuevoMovimientoFinancieroScreen.js:202-228` |
| PAR-CAT-019 | Catálogo sin ítems activos | Se abre un selector (alimento/bebida/enfermedad) | La pantalla de registro no puede continuar: `Seleccione alimento` / `Debe seleccionar un tipo de alimento.` (análogos para bebida y salud) | `AlimentacionJaulaScreen.js:70-73`; `BebidaJaulaScreen.js:71-74`; `SaludAveScreen.js:253-258` |
| PAR-CAT-020 | Ítems creados por el usuario con `orden = 0` | Se listan `RAZAS` | Los nuevos aparecen antes que los sembrados (orden 0 < 1). Paridad solo si se decide mantener (RC-CAT-05) | `migrations.js:19`; `ConfiguracionRepository.js:118-122` |
| PAR-CAT-021 | Catálogo `SEXOS` | Se intenta administrar desde la UI | V1 no ofrece la opción en el menú; el endpoint V2 debe decidir si permite crear/editar/desactivar `SEXOS` (RC-CAT-04) | `ConfiguracionScreen.js:23-55` |
| PAR-CAT-022 | Dos criaderos del mismo usuario | Se desactiva un ítem en el criadero A | El criadero B no cambia (los ítems pertenecen al criadero). Sin equivalente en V1 (base local única); requisito V2 | CLAUDE.md "Multi-tenancy"; `0003:174-197` |
| PAR-CAT-023 | Ítem usado como `raza_principal_item_id` en la configuración del criadero | Se desactiva | Sin equivalente en V1. El `PUT .../configuracion` posterior con ese ítem falla `ITEM_NOT_ACTIVE` | `criaderos.service.ts:222-228, 475-482` (ver RC-CAT-08) |

## Diferencias deliberadas

| ID | Diferencia | Motivo | Estado |
|---|---|---|---|
| D-CAT-00 | V2 requiere conexión; estados de carga y de error de red | Decisión de arquitectura online-first | aprobada por el usuario (ya aceptada) |
| D-CAT-01 *[técnica, se mantiene]* | `ENFERMEDADES` y `MEDICAMENTOS` salen con 4 ítems cada uno (V1 real los deja vacíos en `catalogo_items`; los valores solo estaban en tablas heredadas sin uso). Se mantienen aunque V1 no los siembre | Decisión del usuario: todos los catálogos básicos cargados por defecto | aprobada por el usuario (2026-10-29) |
| D-CAT-02 *[técnica, se mantiene]* | `CATEGORIAS_FINANCIERAS` incluye `ENVIO_AVE` en toda instalación nueva (V1 solo en bases migradas); lo usa el flujo de venta de ave. Se mantiene aunque V1 no lo siembre | Decisión del usuario: todos los catálogos básicos por defecto; el código V1 ya depende de `ENVIO_AVE` | aprobada por el usuario (2026-10-29) |
| D-CAT-03 *[técnica, se mantiene]* | `ALIMENTOS` = Morichillo (`MORICHILLO`), Balanceado (`BALANCEADO`); `BEBIDAS` = Agua (`AGUA`), Agua con vitamina (`AGUA_VITAMINA`) (V1: vacíos). `AGUA_VITAMINA` difiere de la regla de alta de V1, que daría `AGUA_CON_VITAMINA` | Decisión del usuario | aprobada por el usuario (2026-10-29) |
| D-CAT-04 *[revocada 2026-10-29]* | El backend normaliza el código de ítems nuevos con la regla de V1 (`trim`, mayúsculas, `\s+` → `_`) en vez de dejarlo a la pantalla. Se mantiene la tilde si el nombre la lleva, como V1 (la plantilla sin tildes es una excepción de los sembrados) | Paridad; evitar que el cliente defina códigos | propuesta |
| D-CAT-05 *[resuelta: replicar V1]* | "Desactivar" = `activo = 0` con `deleted_at = NULL` (el código sigue reservado, igual que V1); `deleted_at` no se usa en ítems de catálogo | Reproduce la unicidad total de V1 sobre el índice parcial de D1 | propuesta |
| D-CAT-06 *[revocada 2026-10-29]* | Se añade "reactivar" (`activo = 1`) y un listado opcional que incluya desactivados (`incluirInactivos`) | V1 no permite recuperar un ítem desactivado ni su código; sin esta función un código queda bloqueado para siempre | propuesta |
| D-CAT-07 *[revocada 2026-10-29]* | Respuestas con errores diferenciados (`CATALOGO_ITEM_DUPLICATE`, `CATALOGO_ITEM_NOT_FOUND`, `CATALOGO_NOT_FOUND`) en vez de la alerta genérica de V1 | La API necesita códigos estables | propuesta |
| D-CAT-08 *[revocada 2026-10-29]* | `version` obligatoria en edición/desactivación/reactivación (concurrencia optimista) | Convención V2 (CLAUDE.md) | propuesta |

## Endpoints V2

**No existen hoy.** Verificado: `api/src/app.ts:49-51` solo monta `/api/v1/criaderos` y `/api/v1/auth`; `api/src/catalogs/` contiene solo `defaultCatalogItems.ts`; la lógica de catálogo en `criaderos.*` se limita a copiar la plantilla y validar la configuración. El análisis V1 (l.741-742, 834-838, 889, 897) propone `GET /catalogos`, `GET|POST|PUT /catalogos/:catalogoId/items`, `DELETE .../items/:itemId` y rutas por código `ALIMENTOS`/`BEBIDAS`. Propuesta de esta spec (alineada, usando el `codigo` del catálogo en lugar del id, consistente con cómo V1 resuelve el catálogo, `CatalogoScreen.js:69`). Todas bajo `/api/v1/criaderos/:criaderoId`, con JWT; `userId` sale del token; ownership con `criaderos.id = ? AND user_id = ? AND deleted_at IS NULL` (si no, `403 FORBIDDEN`); respuesta `{ success, data }` o `{ success: false, error, message }`.

| Método y ruta | Equivale a V1 | Request | Response `data` | Errores |
|---|---|---|---|---|
| `GET /catalogos` | `obtenerCatalogos` (sin uso en V1) | - | `{ catalogos: [{ codigo, nombre, descripcion }] }` de los 7 catálogos básicos (ver RC-CAT-04) | `UNAUTHORIZED`, `FORBIDDEN`, `CRIADERO_NOT_FOUND` |
| `GET /catalogos/:catalogoCodigo/items?incluirInactivos=false` | `obtenerItemsCatalogo` | - | `{ items: [{ id, codigo, nombre, descripcion, activo, orden, version }] }`, orden `orden, nombre`; por defecto solo `activo = true` | `CATALOGO_NOT_FOUND` (404, propuesto), `FORBIDDEN` |
| `POST /catalogos/:catalogoCodigo/items` | `crearItemCatalogo` | `{ nombre, descripcion? }` (el servidor deriva `codigo`, D-CAT-04) | `{ item: { id, codigo, nombre, descripcion, activo: true, orden, version: 1 } }` (201) | `VALIDATION_ERROR` (nombre vacío), `CATALOGO_NOT_FOUND`, `CATALOGO_ITEM_DUPLICATE` (409, propuesto) |
| `PUT /catalogos/:catalogoCodigo/items/:itemId` | `actualizarItemCatalogo` | `{ nombre, descripcion?, version }` | `{ item }` | `VALIDATION_ERROR`, `CATALOGO_ITEM_NOT_FOUND` (404), `CATALOGO_ITEM_CONCURRENCY_CONFLICT` (409) |
| `POST /catalogos/:catalogoCodigo/items/:itemId/desactivar` | `eliminarItemCatalogo` | `{ version }` | `{ item }` con `activo: false` | `CATALOGO_ITEM_NOT_FOUND`, `CATALOGO_ITEM_CONCURRENCY_CONFLICT` |
| `POST /catalogos/:catalogoCodigo/items/:itemId/reactivar` | (no existe en V1, D-CAT-06) | `{ version }` | `{ item }` con `activo: true` | ídem |

Notas:

- `FORBIDDEN`, `UNAUTHORIZED`, `CRIADERO_NOT_FOUND` y `VALIDATION_ERROR` son códigos existentes; los demás son propuestos y deben revisarse antes de crearlos (CLAUDE.md pide reutilizar). Los `*_CONCURRENCY_CONFLICT` ya existen como patrón.
- Desactivar un ítem ya desactivado: sin error (idempotente), como V1 (PAR-CAT-015).
- El `itemId` debe pertenecer al `criaderoId` y al catálogo de la ruta; si no, `CATALOGO_ITEM_NOT_FOUND` (V1 actualiza por `id` sin comprobar catálogo, `ConfiguracionRepository.js:231`; en V2 es un ajuste necesario por multi-tenancy).
- La plantilla se aplica al crear el criadero (ya existente); no hay endpoint de "restablecer valores por defecto" (V1 tampoco).

## Modelo D1

Sin tablas nuevas. Existente y suficiente:

- `catalogos` (`0001:47-57`, siembra global `0002` y `0004`): `id TEXT`, `codigo UNIQUE`, `nombre`, `descripcion`, `activo`, `created_at`, `updated_at`, `deleted_at`, `version`. Siete catálogos de dominio (`0002:13-62`) y tres de onboarding (`0004:24-45`).
- `catalogo_items` (esquema final en `0003:174-197`): `id TEXT PK`, `criadero_id TEXT NOT NULL` (FK `criaderos`), `catalogo_id TEXT NOT NULL` (FK `catalogos`), `codigo`, `nombre`, `descripcion`, `activo INTEGER NOT NULL DEFAULT 1 CHECK IN (0,1)`, `orden INTEGER`, `created_at`, `updated_at`, `deleted_at`, `version`. Índices: `ux_catalogo_items_codigo_activo` único parcial `(criadero_id, catalogo_id, codigo) WHERE deleted_at IS NULL` (`0003:234-236`), `ix_catalogo_items_criadero_id`, `ix_catalogo_items_catalogo_id` (`0003:238-242`).
- `criadero_configuracion` referencia 4 ítems (`0003:250-285`, `ON DELETE SET NULL`).

Migración prevista: ninguna para el esquema si se acepta D-CAT-05 (desactivar con `activo`). Los 4 ítems nuevos se añaden a la plantilla en código (no a una migración: los ítems no se siembran por migración, `0004:11-14`) y solo afectan a criaderos creados después. **Criaderos ya existentes en D1 local no recibirán los 4 ítems**; el proyecto parte sin datos de usuario (regla del proyecto), pero conviene confirmar (RC-CAT-09). Si se decide asegurar unicidad de nombre o restricciones adicionales, sería una migración `0005_*.sql` (hoy no se propone).

## Impacto al implementar

Lista de archivos a tocar (no se tocan en esta spec).

Plantilla 38 → 42 ítems:

- `api/src/catalogs/defaultCatalogItems.ts`: añadir 4 ítems (ALIMENTOS ×2, BEBIDAS ×2); actualizar cabecera (l.22 `Total: 38 items`, l.27 `ALIMENTOS: 0 items`, l.28 `BEBIDAS: 0 items`) y comentarios de l.157-161.
- `api/test/integration/criaderos.d1.test.ts:157`: `.toBe(38)` → `.toBe(42)`. Única expectativa numérica de la plantilla en pruebas. No hay expectativa por catálogo (búsqueda de `ALIMENTOS`/`BEBIDAS`/`DEFAULT_CATALOG_ITEMS` en `api/test/`: sin resultados). `api/test/criadero.service.test.ts:112` usa `toBeGreaterThan(0)` y no cambia (verificado: el matcher está en las líneas 111-112, `.toBeGreaterThan(0)`). Conviene añadir pruebas por catálogo (conteo y códigos de ALIMENTOS y BEBIDAS).
- No cambian `criaderos.service.ts:103-117, 138` (iteran la plantilla; el campo `catalogoItemsGenerados` pasará a 42 automáticamente).

Documentos con la cifra 38 u otros números de la plantilla (actualizar al implementar a 42). Nota de verificación: el matcher de `api/test/criadero.service.test.ts:111-112` es `.toBeGreaterThan(0)` (verificado) y no cambia; en `ConfiguracionRepository.js` el `SET activo = 0` de `eliminarItemCatalogo` está en la línea 268 (la función empieza en 251; se corrigió la cita `:261` en todo este documento):

- `documents/arquitectura/roadmap-v2.md:23` ("38 items de catálogo iniciales").
- `documents/README.md:41` ("plantilla de 38 items").
- `documents/arquitectura/modelo-datos-v2.md`: l.83 (título "Items iniciales de un criadero (38)"), l.93-94 (ALIMENTOS/BEBIDAS 0), l.99 (Total 38), l.322 y l.688 (38 items al crear), l.903-913 (ALIMENTOS y BEBIDAS "No tendrá CatalogoItems iniciales"), l.954-960 y l.965 (cantidades y "Total inicial: 38 (27 de V1 y 11 de onboarding)"), l.1588 (crear criadero + 38 items). Corregir también l.879 y l.892 ("los valores provienen de enfermedades_catalogo/medicamentos_catalogo de V1": son tablas heredadas sin uso).
- `documents/referencia-v1/analisis-v1-mapeo-api.md:637-638, 679-683`: describen enfermedades/medicamentos y `ENVIO_AVE` como ítems de V1 (matizar con los hallazgos 1 y 2). No contiene la cifra 38.
- Dentro de `documents/traspaso/` (sin versionar; actualizar solo si se decide): `CLAUDE_PROJECT_HANDOFF_CRIADERO_KIKIRIKIS.md:682, 688, 866, 879` (el 688 queda resuelto), `CIERRE_FINAL_TRASPASO_CRIADERO_KIKIRIKIS_V2.md:436, 1863, 2072`, `RESPUESTAS_CUESTIONARIO_TRASPASO_CRIADERO_KIKIRIKIS_V2.md:830, 1135`.
- `CLAUDE.md` y `.claude/`: sin ocurrencias de 38 (búsqueda sin límite).
- `documents/historico/`: no se revisa ni modifica (histórico).

Cifras 38/27/11 **ajenas** al catálogo (no tocar): `documents/specs/aves.md:20` (`registrarHuevo (~38)`, línea de código V1), `api/src/catalogs/defaultCatalogItems.ts:8` ("Modelo aprobado #11", número de modelo), `modelo-datos-v2.md:21, 1009` (numeración de decisiones/puntos), `documents/specs/aves.md:403` (punto 11), y las fechas "27 de ..." en traspaso/archive.

Para los endpoints (módulo nuevo `api/src/catalogs/`, siguiendo `criaderos/`; `.claude/rules/api-capas.md`):

- `api/src/catalogs/catalogs.routes.ts`, `catalogs.factory.ts`, `catalogs.service.ts`, `catalogs.repository.ts`, `catalogs.types.ts` (nuevos).
- `api/src/app.ts` (montar el router bajo `/api/v1/criaderos`).
- `api/test/helpers/fake-catalogs.repository.ts` y pruebas `catalogs.service.test.ts`, `catalogs.routes.test.ts`, `api/test/integration/catalogs.d1.test.ts` (nuevos; la de integración borra datos del D1 local: pedir confirmación).
- Reutilizar la validación de ownership existente de `criaderos` (extraerla o llamarla; no duplicar SQL de propiedad).
- Migración: ninguna prevista (ver "Modelo D1").

## Reglas abiertas

### Resolubles leyendo código

- **RC-CAT-01 (abierta).** Confirmar en dispositivo (o con una base V1 real) que una instalación nueva no tiene `ENVIO_AVE` (hallazgo 2, deducido del orden V6 → V7) y qué ítems tienen las bases creadas antes de V6. Evidencia: `migrationV6.js:53-73`, `migrationV7.js:66-68`, `seeders.js:129-199`, `sqlite.js` (orden de migraciones). No se resuelve solo leyendo; puede requerir historial de git del seeder (`git log -S`, tag `v1.0.3`).
- **RC-CAT-02 (abierta).** Confirmar si el filtro por códigos fijos de categorías (hallazgo 3) es intencional y si debe reproducirse en V2 (la API de categorías por tipo INGRESO/EGRESO) o si basta con listar el catálogo completo. Pendiente de leer `FinanzasRepository.js` y la spec de finanzas para ver si el repositorio valida la categoría al guardar el movimiento.
- **RC-CAT-03 (abierta).** Verificar si `BackupRepository.js` exporta/restaura `catalogos` y `catalogo_items` (el grep de `catalogo` en `src/` no lo lista, es decir, aparentemente no); confirmar para saber si los ítems creados por el usuario se pierden en un backup de V1.
- **RC-CAT-04 (abierta).** Confirmar el conjunto de catálogos que expone la API: los 7 básicos (V1 administra 6; `SEXOS` solo se lee). Decidir si `SEXOS` es solo lectura y si ESPECIES/TIPOS_CRIADERO/FINALIDADES_CRIADERO (onboarding) son administrables (no existen en V1).
- **RC-CAT-05 (abierta).** `orden` de ítems nuevos: V1 usa 0 (aparecen primero) y la plantilla usa `null` (SQLite ordena `NULL` primero en `ASC`). Definir orden de lista en V2 y `orden` de los 4 ítems nuevos y de los creados por usuario (propuesta: `null` para ALIMENTOS/BEBIDAS, ordenados por `nombre`, como en V1 donde sus selectores usan `ORDER BY nombre`).
- **RC-CAT-06 (abierta).** `catalogos.nombre`/`descripcion` de D1 (`0002`) difieren de V1 (p. ej. "Razas" frente a "Razas de aves", "Categorias financieras" sin tilde frente a "Categorías financieras"). Las pantallas V1 usan títulos propios (`ConfiguracionScreen.js:26-52`), no `catalogos.nombre`. Decidir qué texto muestra la app de V2.
- **RC-CAT-07 (abierta).** V1 no impide desactivar ítems que usa el sistema (`OTRO`, categorías con lógica automática como `VENTA_AVE`, `ENVIO_AVE`). Verificar si V1 depende de que existan (`BajaAveRepository.js:343` y `FinanzasRepository.js:480` escriben el código como texto sin consultar el catálogo, por lo que no fallan).

### Decisión de producto

- **[resuelta: técnica, se mantiene (regla del proyecto 2026-10-29); catálogos por defecto con 42 ítems (D-CAT-01 a D-CAT-03)] DP-CAT-01 (decidida 2026-10-29, parcial).** Texto original: aprobar o corregir D-CAT-01 a D-CAT-08 (en particular D-CAT-02 `ENVIO_AVE`, D-CAT-05 desactivar con `activo`, D-CAT-06 reactivar). **Decisión:** la aprobación del usuario cubre **solo D-CAT-01, D-CAT-02 y D-CAT-03**. **D-CAT-04 a D-CAT-08 siguen como propuestas sin aprobar** (no hay decisión sobre normalización de código en servidor, desactivar con `activo`, reactivar, errores diferenciados ni `version`).
- **[resuelta: técnica, se mantiene (regla del proyecto 2026-10-29)] DP-CAT-02 (decidida 2026-10-29).** Texto original: códigos de los 4 ítems nuevos (`MORICHILLO`, `BALANCEADO`, `AGUA`, `AGUA_CON_VITAMINA` o `AGUA_VITAMINA`) y su orden (RC-CAT-05). **Decisión:** ALIMENTOS = Morichillo (`MORICHILLO`), Balanceado (`BALANCEADO`); BEBIDAS = Agua (`AGUA`), Agua con vitamina (`AGUA_VITAMINA`). La convención de alta de V1 daría `AGUA_CON_VITAMINA`; `AGUA_VITAMINA` es la decisión del usuario (diferencia consciente respecto de la regla de alta). `ENFERMEDADES`, `MEDICAMENTOS` y `ENVIO_AVE` se mantienen aunque V1 no los siembre. El **orden** de los 4 ítems sigue abierto en RC-CAT-05 (propuesta `null`).
- **[resuelta: replicar V1 (regla del proyecto 2026-10-29)] DP-CAT-03.** ¿Se permite desactivar/editar ítems que están en uso por la configuración del criadero (`criadero_configuracion`) o que el sistema usa por código? Hoy `PUT .../configuracion` exige ítems activos (`criaderos.service.ts:222-228`); ¿bloquear la desactivación del ítem elegido o permitirla? V1 no bloquea nada.
- **[resuelta: replicar V1 (regla del proyecto 2026-10-29)] DP-CAT-04.** En los módulos de V2 que usen catálogos (aves, salud, alimentación, bebida, finanzas): ¿guardar texto como V1 (nombre o código, según el módulo) o `item_id`? V1 guarda texto (ver tabla de consumo) y por eso un renombrado no se propaga. Se decide en la spec de cada módulo.
- **[resuelta: replicar V1 (regla del proyecto 2026-10-29)] DP-CAT-05.** ¿Los criaderos ya creados en D1 local con 38 ítems deben recibir los 4 ítems nuevos? (regla del proyecto: V2 empieza sin datos, por lo que se propone no migrar nada).
- **[resuelta: replicar V1 (regla del proyecto 2026-10-29)] DP-CAT-06.** ¿Se corrige el comportamiento de V1 de que las categorías financieras creadas por el usuario nunca son seleccionables (hallazgo 3)? Cambiarlo es una diferencia deliberada.
- **[resuelta: replicar V1 (regla del proyecto 2026-10-29)] DP-CAT-07.** ¿Se añade unicidad de nombre (V1 solo controla el código)? Cambiarlo es una diferencia deliberada; la propuesta es mantener V1.

## Criterios de terminado

- [ ] Diferencias deliberadas D-CAT-01 a D-CAT-03 aprobadas (2026-10-29); **D-CAT-04 a D-CAT-08 pendientes de aprobación**; reglas abiertas RC-* cerradas y DP-* restantes decididas; estado de la spec en `revisada`.
- [ ] `defaultCatalogItems.ts` con 42 ítems (ALIMENTOS: `MORICHILLO`, `BALANCEADO`; BEBIDAS: `AGUA`, `AGUA_VITAMINA`; se mantienen ENFERMEDADES, MEDICAMENTOS y `ENVIO_AVE`) y códigos aprobados el 2026-10-29; cabecera y comentarios coherentes.
- [ ] Endpoints de la sección "Endpoints V2" implementados en `api/src/catalogs/` siguiendo `routes -> factory -> service -> repository` y montados en `app.ts`.
- [ ] Ownership probado: otro usuario recibe `403 FORBIDDEN` y no ve ítems de otro criadero; el `itemId` de otro criadero o catálogo devuelve `CATALOGO_ITEM_NOT_FOUND`.
- [ ] Pruebas unitarias del service con fakes, HTTP con `app.request()` e integración D1 local (con confirmación previa por ser destructiva): conteo por catálogo (RAZAS 9, SEXOS 2, ENFERMEDADES 4, MEDICAMENTOS 4, ALIMENTOS 2, BEBIDAS 2, CATEGORIAS_FINANCIERAS 8, ESPECIES 5, TIPOS_CRIADERO 3, FINALIDADES_CRIADERO 3; total 42), duplicados (activo y desactivado), idempotencia de desactivar, reactivar y concurrencia por `version`.
- [ ] Casos PAR-CAT-001 a PAR-CAT-023 cubiertos o marcados explícitamente como diferencia deliberada.
- [ ] Prueba de integración `criaderos.d1.test.ts` actualizada de 38 a 42.
- [ ] Documentos de la lista "Impacto al implementar" actualizados (cifra 42, ALIMENTOS/BEBIDAS, orígenes de enfermedades/medicamentos).
- [ ] `npm run typecheck`, `npm test -- --run` y `npm run test:integration` sin errores; `git diff --check` limpio.
