# Spec: genealogia

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).

## Estado

implementada (2026-11-03, rama `trabajo/migracion-nube`). Pendiente: comprobación en el teléfono físico (árbol con abuelos y consanguinidad). Alcance: árbol genealógico de aves individuales (sin lotes), sin sincronización offline, D1 como fuente de verdad. Las líneas son del árbol de V1 (v1.0.3, `app.json:5`).

**Decisión del usuario (opción A): no hay endpoint nuevo, no hay migración D1 ni cambio de esquema.** El cliente `src/repositories/GenealogiaRepository.api.js` reutiliza el algoritmo de V1 (el mismo código de `GenealogiaRepository.js`) y solo cambia el origen de la lista de aves: en lugar del `SELECT` sobre SQLite, lee las aves por la API ya existente (`GET /api/v1/criaderos/:criaderoId/aves?estado=...`). Esta spec no propone validaciones ni comportamientos nuevos.

### Lo implementado

- Sin endpoint ni migración. `GenealogiaRepository.js` (fachada con `origen()`), `GenealogiaRepository.sqlite.js` (código de V1 sin editar) y `GenealogiaRepository.api.js`.
- `.api.js`: algoritmo de V1 copiado 1:1; lee las aves con tres llamadas `GET /aves?estado=ACTIVA|VENDIDA|FALLECIDA`, las ordena por `codigo` con comparación binaria y usa `String(id)` donde V1 usaba `Number(id)` (diferencia técnica por UUID).
- Hoy no existen aves `VENDIDA`/`FALLECIDA` en D1 (Bajas pendiente): esas dos llamadas devuelven `[]`.
- Excepción aprobada a la pantalla `GenealogiaAveScreen.js` (sexta excepción del proyecto; ver "Excepciones técnicas", punto 7).
- Commits: clientes `010a223`, pantalla `906510e`, pruebas `706837c`. Sin cambios de API.
- Pruebas: caso `pruebas/datos/casos/10-genealogia.mjs` y flujo del emulador `80-genealogia` (migrado; el antiguo `esperado-fallar/genealogia.yaml` ya no existe).
- Validación: typecheck OK; 228 pruebas unitarias/HTTP y 75 de integración; `/probar datos` 65/65 (86,7 s, sin fuga); `/probar completo` desde cero (27,6 min), flujo `80-genealogia` en verde y 0 regresiones; `revisor-arquitectura-v2`: APROBADO.
- **Cobertura del ciclo (`PARENTESCO_CIRCULAR`):** la rama circular de `relacionesInvalidas` no se puede provocar por la API (se bloquea al crear y al actualizar), así que **no tiene prueba automática**. Solo está cubierta por revisión de código (algoritmo copiado 1:1; el revisor lo aprobó). Casos GEN-12 a GEN-16 y GEN-09/GEN-10 (sin Bajas) quedan sin prueba automática.
- Limitaciones conocidas: (1) con un fallo de red `GenealogiaAveScreen.cargar` solo hace `console.error` y la pantalla muestra "No fue posible encontrar el ave." (el usuario decidió no añadir `Alert`); (2) las vendidas y fallecidas no existen hasta Bajas; (3) falta la prueba en el teléfono.

## Fuente V1

- `src/repositories/GenealogiaRepository.js` (completo, 757 líneas). Única función exportada: `obtenerGenealogiaAve` 7-240. Internas: `construirAncestros` 244-330, `agregarAncestro` 334-423, `construirDescendientes` 427-539, `obtenerIdsAncestros` 543-585, `obtenerIdsDescendientes` 589-631, `filtrarAncestrosInvalidos` 635-668, `filtrarDescendientesInvalidos` 672-702, `registrarRelacionInvalida` 706-730, `mapearAve` 734-757.
- `src/screens/GenealogiaAveScreen.js` (único importador del repositorio: `:21-22`; llamada en `cargar` 58-96). Ruta `GenealogiaAve` en `src/navigation/AvesStackNavigator.js:16,83-84`.
- Quién abre la pantalla: **solo** `DetalleAveScreen.js:998-1005` (`navigation.navigate('GenealogiaAve', { aveId })`, botón "🌳 Genealogía"); y la propia pantalla (`navigation.push('GenealogiaAve'...)` no existe: desde el árbol se navega a `DetalleAve`, `GenealogiaAveScreen.js:511-521` y `abrirAve` 965-992, con `desdeGenealogia: true`). Búsqueda sin límite de `Genealogia` y `desdeGenealogia` en `src/`: no hay más referencias (`desdeGenealogia` solo se pasa, ningún lector en `src/`). `AvesScreen.js` no abre genealogía (no aparece en la búsqueda).
- Sin tabla propia: la genealogía se calcula en memoria desde `aves` (`id, codigo, raza, sexo, foto_uri, padre_id, madre_id, estado, estado_salud, fecha_nacimiento`).
- API ya existente que se reutiliza: `api/src/aves/aves.routes.ts:103-113` (`GET /aves?estado=`), `aves.service.ts:229-238` (`listar`), `aves.repository.ts:61-93` (columnas y joins del listado), `:132-145` (`listarActivas`) y `:147-159` (`listarBajas`). Cliente: `src/repositories/AveRepository.api.js` (`apiFetch`, `aSnake`) y `src/api/apiClient.js` (`ApiError`, `NETWORK_ERROR` en `:109-113`).
- Prueba de emulador: antes `pruebas/movil/flujos/esperado-fallar/genealogia.yaml` (ya no existe); hoy el flujo migrado `80-genealogia`.

### Hallazgos

1. **Clave del diseño: V1 lee todas las aves de cualquier estado.** El `SELECT` no tiene `WHERE` (`:26-45`), de modo que un padre o madre `VENDIDA`/`FALLECIDA` sale en el árbol. La API lista **un estado por llamada** y, sin parámetro, solo `ACTIVA` (`aves.routes.ts:106`, `aves.repository.ts:138`); hacen falta tres llamadas.
2. **Hoy en D1 no existen aves `VENDIDA`/`FALLECIDA`.** Búsqueda sin límite de `VENDIDA`, `FALLECIDA` y `estado =` en `api/src`: ningún endpoint escribe esos estados (solo se lee `estado = ?` en `listarBajas`, `aves.repository.ts:155`; `aves.repository.ts:415` y `:620` solo filtran `ACTIVA`/`CERRADO`). Las llamadas de bajas devolverán `[]` hasta el módulo Bajas, pero el cliente debe hacerlas igual para no cambiar el contrato cuando Bajas exista.
3. **Todos los `Number(id)` de V1 darían `NaN` con UUID v7** (ver "Excepciones técnicas" y "DUDA PARA EL USUARIO"). En el repositorio rompen el `Map`: todas las aves se guardarían bajo la clave `NaN` y `porId.get(Number(aveId))` devolvería **otra ave cualquiera** (la última de la lista), no `undefined`.
4. **No se puede provocar un ciclo vía la API de aves**, igual que en V1 (ver "Pruebas de datos viables").
5. **El orden de `relacionesInvalidas` depende del `ORDER BY codigo` del SQL** (ver "Orden y colación").

## Contrato del repositorio

Una sola función pública.

### `obtenerGenealogiaAve(aveId, generaciones = 3)` (`GenealogiaRepository.js:7-240`)

Firma exacta: `async function obtenerGenealogiaAve(aveId, generaciones = 3)`.

**Paso a paso (V1):**

1. `maxGeneraciones = Math.min(4, Math.max(1, Number(generaciones) || 3))` (`:16-23`). Casos: `undefined`→3 (valor por defecto), `0`, `NaN`, `''`, `null`→`Number(...)||3` = 3; `5`→4; `-2`→1; `2`→2; `2.5` se queda `2.5` (el `nivel >= 2.5` corta a 3 niveles, pero `generaciones` devuelve `2.5`). `Number(generaciones)` aquí es sobre un número, **no** sobre un id: se conserva igual en V2.
2. SELECT literal (`:26-45`), sin `WHERE`, **todas las aves de cualquier estado**:

   ```sql
   SELECT id, codigo, raza, sexo, foto_uri, padre_id, madre_id,
          estado, estado_salud, fecha_nacimiento
   FROM aves
   ORDER BY codigo
   ```

3. `porId = new Map(aves.map(item => [Number(item.id), item]))` (`:48-56`).
4. `raiz = porId.get(Number(aveId))` (`:59-64`); **si no existe, devuelve `null`** (`:67-71`). No lanza error. Una ave vendida o fallecida como raíz **sí** se encuentra (sin filtro de estado).
5. `hijosPorPadre` (`:74-135`): para cada ave, para `padre_id` y `madre_id` que no sean `null`/`undefined`, `key = Number(parentId)` y se agrega el ave a la lista de esa clave. El orden de las listas es el del `ORDER BY codigo`.
6. `relacionesInvalidas = []`; `ancestros = construirAncestros(raiz, porId, 0, maxGeneraciones, new Set(), relacionesInvalidas)` (`:138-149`) y `descendientes = construirDescendientes(raiz, hijosPorPadre, 0, maxGeneraciones, new Set(), relacionesInvalidas)` (`:152-160`).
7. Detección de cruce (`:163-225`): `idsAncestros` (ids de todos los nodos del subárbol de ancestros, excluida la raíz, `obtenerIdsAncestros` 543-585), `idsDescendientes` (`obtenerIdsDescendientes` 589-631), `idsCruzados` = intersección. Por cada id cruzado: `aveInvolucrada = porId.get(Number(id))` y se registra el texto de cruce (abajo). Luego `ancestros = filtrarAncestrosInvalidos(ancestros, idsCruzados)` y `descendientes = filtrarDescendientesInvalidos(descendientes, idsCruzados)` (ocultan los nodos conflictivos y todo lo que cuelga de ellos).
8. Devuelve (`:228-238`).

**Objeto devuelto (claves exactas):**

```js
{
  ave: { id, codigo, raza, sexo, foto_uri, estado, estado_salud, fecha_nacimiento },  // mapearAve(raiz)
  generaciones: maxGeneraciones,
  ancestros,        // nodo: { ...mapearAve, padres: [ { relacion, nodo } ] }
  descendientes,    // nodo: { ...mapearAve, hijos: [ nodo ] }
  relacionesInvalidas   // [ { tipo: 'PARENTESCO_CIRCULAR', detalle } ]
}
```

- `mapearAve` (`:734-757`) copia **solo** 8 claves, en este orden: `id`, `codigo`, `raza`, `sexo`, `foto_uri`, `estado`, `estado_salud`, `fecha_nacimiento`. **No** copia `padre_id` ni `madre_id` (el algoritmo los lee de la fila, no del nodo). En snake_case, igual que sale de SQLite. Valores `null` donde la columna es nula.
- Nodo de ancestros: `{ ...mapearAve(ave), padres: [...] }`; cada elemento de `padres` es `{ relacion, nodo }` con `relacion` = `'Padre'`/`'Madre'` si `nivel === 0`, o `'Ancestro paterno'`/`'Ancestro materno'` si `nivel > 0` (`:291-322`). El padre se agrega antes que la madre. Si `nivel >= maxGeneraciones` el nodo es `{ ...nodo, padres: [] }` (`:259-268`): las generaciones cuentan desde la raíz (nivel 0) y el último nivel mostrado es `maxGeneraciones` (con 3: padres, abuelos y bisabuelos).
- Nodo de descendientes: `{ ...mapearAve(ave), hijos: [...] }`; con `nivel >= maxGeneraciones`, `hijos: []` (`:442-451`). Los `hijos` se ordenan con `String(a.codigo || '').localeCompare(String(b.codigo || ''))` (`:521-531`), **después** del bucle que registra los ciclos.
- El nodo raíz de `ancestros` y de `descendientes` es un nodo completo de la misma ave (no el de `ave`): el árbol de arriba y el de abajo tienen cada uno su copia de la raíz.

**`agregarAncestro` (`:334-423`):** ignora `parentId` `null`/`undefined` (`:346-354`); si el padre no está en `porId` (`!padre`) **no se agrega nada y no hay error** (`:369-373`; un `padre_id` huérfano se ignora en silencio); si el padre ya está en el camino (`nuevoCamino.has(idPadre)`, `:376`) registra la relación inválida y no lo agrega (`:405`).

**`construirDescendientes` (`:427-539`):** itera `hijosPorPadre.get(id) || []`; si `nuevoCamino.has(hijoId)` registra la relación inválida y salta (`:491-504`).

**Textos exactos de `relacionesInvalidas` (todos con `tipo: 'PARENTESCO_CIRCULAR'`, `registrarRelacionInvalida` 706-730 deduplica por `detalle`, lista por igualdad de cadena):**

| Origen | Texto exacto (`detalle`) | Línea |
|---|---|---|
| Ciclo en ancestros | `` `Relación circular detectada en ancestros: ${codigosCamino}.` ``; `codigosCamino` = códigos del camino más el ancestro repetido, unidos con `' → '` (con espacios y flecha U+2192); si un id no tiene código se usa el propio id | `:382-403` |
| Ciclo en descendientes | `` `Relación circular detectada en descendientes entre ${ave.codigo} y ${item.codigo}.` `` | `:497-500` |
| Cruce ancestro/descendiente | `` `Relación circular detectada entre ${raiz.codigo} y ${aveInvolucrada?.codigo || id}. Un ave no puede aparecer a la vez como ancestro y descendiente de la misma ave.` `` | `:204-207` |

La pantalla muestra el título `⚠️ Relación genealógica inválida`, el texto fijo `Se detectó un parentesco circular. Los ejemplares involucrados se ocultaron del árbol para no mostrar una relación imposible. Corrige el padre o la madre desde Editar ave.` y cada `detalle` como `• detalle` (`GenealogiaAveScreen.js:224-273`).

**Errores:** el repositorio no lanza errores propios; solo propaga los de la base de datos. No hay códigos de error en V1 para esta función.

### Orden y colación (afecta al resultado)

- `ORDER BY codigo` en SQLite usa colación **BINARY** (orden por bytes: mayúsculas antes que minúsculas, `AV-10` antes de `AV-9`). Determina el orden de inserción en `hijosPorPadre` y, por tanto, el orden en que se recorren los hijos y **el orden de `relacionesInvalidas`** (el bucle de `construirDescendientes` registra antes de `hijos.sort`). Los `hijos` finales se ordenan por `localeCompare` (no binario), de modo que el orden final de `hijos` solo depende de `localeCompare`; los códigos son únicos por criadero, así que no hay empates. **El cliente debe ordenar las aves por `codigo` con comparación binaria (`a < b`, no `localeCompare`) antes de construir `hijosPorPadre`** para reproducir `relacionesInvalidas`. El `ORDER BY` del listado `ACTIVA` ya es `ORDER BY a.codigo` (`aves.repository.ts:139`) pero el de `listarBajas` es `fecha_actualizacion DESC, codigo` (`:156`) y al unir tres listas hace falta un orden global: se reordena en el cliente (ver Excepciones técnicas).

## Endpoints V2

**Ninguno nuevo** (decisión del usuario, opción A). Se reutiliza:

- `GET /api/v1/criaderos/:criaderoId/aves?estado=ACTIVA`, `?estado=VENDIDA` y `?estado=FALLECIDA` (`aves.routes.ts:103-113`), una llamada por estado, **en paralelo** (`Promise.all`). Respuesta `{ success: true, data: { aves: [...] } }` (`aves.service.ts:237`). Estado inválido: `400 VALIDATION_ERROR` (no ocurre porque el cliente solo envía los tres válidos).
- Cada ave del listado trae (`aves.repository.ts:61-87`): `id`, `codigo`, `raza`, `sexo`, `fotoUri` (de `foto_r2_key`), `padreId`, `madreId`, `estado`, `estadoSalud`, `fechaNacimiento` y más columnas que el algoritmo no usa. Con `aSnake` (`AveRepository.api.js`) salen `foto_uri`, `padre_id`, `madre_id`, `estado_salud`, `fecha_nacimiento`: las **mismas 10 columnas** que lee el `SELECT` de V1.
- Ownership por criadero como el resto (`401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 CRIADERO_NOT_FOUND`); `criaderoId` sale de la sesión del cliente (`rutaAves()`).

### Cliente `GenealogiaRepository.api.js` (implementado; fachada `GenealogiaRepository.js` como Salud/Huevos)

1. Fachada `GenealogiaRepository.js` elige entre `GenealogiaRepository.sqlite.js` (código V1 intacto, renombrado) y `GenealogiaRepository.api.js` con la bandera `EXPO_PUBLIC_DATA_SOURCE=api` (mismo patrón que el resto de módulos).
2. `obtenerGenealogiaAve(aveId, generaciones = 3)` en `.api.js`: misma firma y mismo cálculo de `maxGeneraciones`.
3. Sustituir solo el `SELECT` por: `const [activas, vendidas, fallecidas] = await Promise.all([ACTIVA, VENDIDA, FALLECIDA].map(estado => apiFetch(`${ruta}?estado=${estado}`)))`; concatenar, mapear con `aSnake` y reordenar por `codigo` en binario. El resto de funciones (`construirAncestros`, `agregarAncestro`, `construirDescendientes`, `obtenerIds*`, `filtrar*`, `registrarRelacionInvalida`, `mapearAve`) se copian con los textos idénticos y con la única adaptación de id descrita abajo.
4. Si una de las tres llamadas falla, falla todo (`Promise.all`), como en V1 falla el único `SELECT`; el error de `apiFetch` (`ApiError`, `NETWORK_ERROR`) se propaga sin traducir.
5. El ave raíz se busca en la lista combinada, con lo que una raíz `VENDIDA`/`FALLECIDA` también se encuentra (igual que V1). Con `aveId` inexistente devuelve `null`.

**Costo:** 3 llamadas HTTP (en paralelo) + ordenación y mapeos en memoria del cliente por cada apertura de la pantalla y por cada cambio de generaciones (`GenealogiaAveScreen.js:99-113`, `useFocusEffect` con `[aveId, generaciones]`; recarga también al volver desde `DetalleAve`). Cada llamada incluye 3 joins (`jaulas`, `aves p`, `aves m`) y devuelve más columnas de las necesarias (`aves.repository.ts:61-93`). Sin paginación, igual que V1 (que lee toda la tabla). Para un criadero pequeño es irrelevante; crece linealmente con el total de aves y la carga completa se repite en cada foco.

## Tabla D1

**Ninguna.** Sin migración nueva (la siguiente libre sigue siendo `0010`). Se leen las columnas existentes de `aves` (`0006_aves.sql`): `id`, `codigo`, `raza`, `sexo`, `foto_r2_key` (expuesta como `fotoUri`), `padre_id`, `madre_id`, `estado`, `estado_salud`, `fecha_nacimiento`, con FK a `aves(id)` para padre y madre. No se añaden columnas, índices ni endpoints.

## Excepciones técnicas por pasar a online

1. **IDs UUID v7 (texto) en lugar de enteros: `Number(x)` → identidad `String(x)` en el repositorio.** Es la única adaptación del algoritmo. Líneas de `GenealogiaRepository.js` afectadas (todas pasan a `String(...)` o a usar el id tal cual):
   - `:52` (`porId` clave), `:61` (`porId.get(Number(aveId))`), `:106` (clave de `hijosPorPadre`), `:200` (`porId.get(Number(id))` en el cruce);
   - `:272` y `:455` (id del nodo actual en `construirAncestros` / `construirDescendientes`), `:358` (`idPadre`), `:390` (`porId.get(Number(id))` dentro de `codigosCamino`), `:486` (`hijoId`);
   - `:561` y `:575` (`obtenerIdsAncestros`), `:607` y `:621` (`obtenerIdsDescendientes`);
   - `:651` y `:688` (`filtrarAncestrosInvalidos` / `filtrarDescendientesInvalidos`).
   Motivo: con UUID `Number('0192...')` es `NaN`; `Map`/`Set` colapsan todos los `NaN` en una sola clave (SameValueZero), `NaN === NaN` es falso y no habría detección de ciclos ni búsqueda por id. `String(x)` conserva las comparaciones exactas de V1 (un id nunca coincide con otro distinto). Los ids de V1 eran enteros: `Number(item.id)` igualaba `1` y `'1'`; con `String` el `aveId` que llega por `route.params` (cadena UUID) coincide con el `id` del listado (cadena UUID) sin conversión.
2. **Tres lecturas (`ACTIVA`, `VENDIDA`, `FALLECIDA`) en lugar de un `SELECT` único**, porque la API de aves lista por estado. Contenido idéntico al de V1 (misma unión de estados, mismas 10 columnas).
3. **Ordenación por `codigo` en el cliente con comparación binaria**, porque al concatenar tres listados el orden ya no lo da un único `ORDER BY` (y `listarBajas` ordena por otro criterio). Reproduce la colación BINARY de SQLite (ver "Orden y colación").
4. **`foto_uri` = `foto_r2_key`** de D1 (hoy guarda la ruta local del teléfono; limitación conocida de R2, módulo aparte). Sin cambio funcional.
5. **Errores de red y autenticación** (`ApiError`, 401, 403, `CRIADERO_NOT_FOUND`, `NETWORK_ERROR`): los lanza `apiFetch`; la pantalla ya los captura en su `catch` (ver "Cómo consume la pantalla").
6. Sin R2, sin migración y sin endpoint nuevo.
7. **Pantalla `GenealogiaAveScreen.js` (excepción aprobada por el usuario, sexta del proyecto).** `Number(x)` → `String(x)` en 6 lecturas de id (líneas aprox. 690, 972, 974, 1088, 1093 y 1231), `Number(item.nodo?.id)` → `item.nodo?.id` y `.filter(Number.isFinite)` → `.filter(id => id !== undefined && id !== null)` en 2 sitios. Con ids numéricos de SQLite el resultado es equivalente (lo comprobó el revisor). Motivo: UUID v7 (diferencia permitida). Sin cambios de textos ni de diseño. Detalle del motivo en "Decisiones del usuario resueltas".

## Cómo consume la pantalla `GenealogiaAveScreen`

- `cargar` (`:58-96`): `setLoading(true)`; `data = await obtenerGenealogiaAve(aveId, generaciones)`; `catch`: solo `console.error('Error cargando genealogía:', error)` (`:80-87`), **sin Alert**; `finally`: `setLoading(false)`.
- Mientras `loading`: spinner con `Construyendo árbol genealógico...` (`:116-147`).
- `data` nulo (ave inexistente o **error de carga**): texto `No fue posible encontrar el ave.` (`:150-174`). Con la red caída el usuario ve ese mismo texto (mensaje engañoso: diría "no existe" cuando es un fallo de red). Si el fallo ocurre al cambiar de generaciones tras una carga correcta, `data` conserva el árbol anterior (no se borra en `catch`) y la pantalla enseña el árbol viejo con el botón de generaciones ya cambiado. Ver DUDA PARA EL USUARIO 2.
- Botones de generaciones `2`, `3`, `4` (`:363-404`); por defecto 3 (`:40-43`).
- Sin ancestros: `Sin ancestros registrados` (`:494-500`).
- Claves de lista: `` `${item.relacion}-${item.nodo.id}` `` (`:457, 646`), `item.id` (`:563, 767`), `` `${item.tipo}-${index}` `` (`:258`). Con UUID (cadena) son válidas y únicas.

## Casos de paridad

| id | dado | cuando | entonces | evidencia V1 |
|---|---|---|---|---|
| GEN-01 | `aveId` inexistente | `obtenerGenealogiaAve('x')` | devuelve `null`; la pantalla muestra `No fue posible encontrar el ave.` | `GenealogiaRepository.js:59-71`; `GenealogiaAveScreen.js:150-174` |
| GEN-02 | Ave sin padre ni madre ni hijos | `obtenerGenealogiaAve(id)` | `{ ave, generaciones: 3, ancestros: {...nodo, padres: []}, descendientes: {...nodo, hijos: []}, relacionesInvalidas: [] }`; claves exactas del nodo: `id, codigo, raza, sexo, foto_uri, estado, estado_salud, fecha_nacimiento` + `padres`/`hijos` | `:228-238`, `:734-757` |
| GEN-03 | Ave H con padre P (macho) y madre M (hembra) | idem | `ancestros.padres = [{ relacion: 'Padre', nodo: P }, { relacion: 'Madre', nodo: M }]` (padre antes que madre) | `:291-322` |
| GEN-04 | P tiene padre y madre (abuelos) | idem | los abuelos salen con `relacion` `'Ancestro paterno'` y `'Ancestro materno'` bajo P y M; al nivel 0 solo `'Padre'`/`'Madre'` | `:295-297, 312-314` |
| GEN-05 | Cadena de 6 niveles de ancestros | `generaciones` 3 | profundidad máxima = 3 (el nodo del nivel 3 lleva `padres: []`); `generaciones: 3` en el resultado | `:259-268` |
| GEN-06 | idem | `generaciones` 2, 4, 5, 0, -2, `undefined`, `'abc'` | resultado `generaciones` 2, 4, 4, 3, 1, 3, 3 | `:16-23` |
| GEN-07 | Ave con hijos `AV-B`, `AV-A`, `AV-C` | idem | `descendientes.hijos` ordenados `AV-A`, `AV-B`, `AV-C` (`localeCompare`) | `:521-531` |
| GEN-08 | Hijos y nietos | `generaciones` 1 | `hijos` de la raíz con `hijos: []` (nivel 1 ya corta) | `:442-451` |
| GEN-09 | Padre `VENDIDA` o `FALLECIDA` (cuando exista Bajas) | árbol del hijo `ACTIVA` | el padre aparece en `ancestros` (V1 no filtra por estado); el cliente lo obtiene de la llamada `?estado=VENDIDA`/`FALLECIDA` | `:26-45` |
| GEN-10 | Raíz `VENDIDA` o `FALLECIDA` | `obtenerGenealogiaAve(id)` | se devuelve su árbol (no `null`) | `:59-71` |
| GEN-11 | `padre_id` que no existe en la lista | idem | se ignora sin error, sin nodo ni relación inválida | `:363-373` |
| GEN-12 | Ciclo `A.padre = B`, `B.padre = A` (solo vía datos directos) | árbol de A | `relacionesInvalidas` incluye `Relación circular detectada en ancestros: A → B → A.` con el texto y flechas exactos; el nodo repetido no se agrega | `:376-405` |
| GEN-13 | Ciclo de descendientes (`A` hijo de `B`, `B` hijo de `A`) | árbol de A | `Relación circular detectada en descendientes entre A y B.` | `:491-504` |
| GEN-14 | Ancestro que a la vez es descendiente de la raíz | idem | un texto `Relación circular detectada entre RAIZ y OTRA. Un ave no puede aparecer a la vez como ancestro y descendiente de la misma ave.` por cada id cruzado; esos ids se ocultan de `ancestros` y `descendientes` (con todo lo que cuelga de ellos) | `:163-225, 635-702` |
| GEN-15 | Misma relación inválida detectada dos veces | idem | `relacionesInvalidas` no repite el mismo `detalle` | `:706-730` |
| GEN-16 | Dos aves con códigos `AV-10` y `AV-9`, con ciclo | idem | orden de `relacionesInvalidas` según `ORDER BY codigo` binario (`AV-10` antes de `AV-9`) | `:43`, `:474-518` |
| GEN-17 | UUID v7 como ids (propio de V2) | árbol de un ave con padre y madre | el árbol sale con las aves correctas (no la última de la lista) y `ave.id` es el UUID pedido | excepción técnica 1 |
| GEN-18 | Hermanos (mismos padre y madre) cruzados | árbol de su hijo | la pantalla muestra `Cruce entre hermanos`; con un solo progenitor común `Cruce entre medio hermanos` | `GenealogiaAveScreen.js:1146-1188` |
| GEN-19 | Sin red | `obtenerGenealogiaAve` | `ApiError` `NETWORK_ERROR` (propagado); la pantalla hace `console.error`, apaga el spinner y muestra `No fue posible encontrar el ave.` (V1 no tenía fallo de red; ver DUDA 2) | `GenealogiaAveScreen.js:80-95, 150-174` |
| GEN-20 | Sin aves `VENDIDA`/`FALLECIDA` en D1 | idem | las dos llamadas devuelven `[]`; el resultado es el mismo que con solo las activas | `aves.repository.ts:147-159` |

## Pruebas de datos viables

- **Sí (`/probar datos`, sin ciclo):** crear con la API de aves un abuelo (macho) y una abuela (hembra), un padre (macho) con `padreId`/`madreId` de los abuelos, una madre (hembra) y un hijo con `padreId`/`madreId`, todos con `origen` `NACIDA_CRIADERO` (sexo `MACHO` para el padre y `HEMBRA` para la madre: `aves.service.ts:305,312`). Comparar `ancestros`, `descendientes` y `generaciones` 2/3/4 del cliente contra el resultado esperado. La API no devuelve `raza` obligatoria; ningún campo nuevo.
- **Ciclo vía la API: no se puede.** `crear` solo admite padre y madre ya existentes (`aves.service.ts:337`, con `aveId = null` no hay recorrido de descendientes: un ave nueva no puede ser ancestro de nadie). `actualizar` (`aves.service.ts:384`) valida con `validarRelacionPadres`: `PADRE_ES_MISMA_AVE` / `MADRE_ES_MISMA_AVE` (`:297-298`), `PADRES_IGUALES` (`:299`) y, con `aveId`, `PARENTESCO_CIRCULAR_PADRE` / `PARENTESCO_CIRCULAR_MADRE` si el padre o la madre elegidos están entre los descendientes (CTE recursiva, `aves.repository.ts:118-127`; `aves.service.ts:317-320`). Es el mismo control que V1 (`AveRepository.sqlite.js:599, 614`). Además `actualizar` solo conserva padre y madre si `origen === 'NACIDA_CRIADERO'` (`:391-394`). Resultado: la rama `PARENTESCO_CIRCULAR` del algoritmo solo es alcanzable con datos corruptos (escritura directa en la base, o una carrera entre dos ediciones simultáneas, no probada).
- **Cobertura del ciclo:** (a) prueba unitaria del algoritmo con una lista de aves en memoria que contenga el ciclo (función pura una vez separado el origen de datos; el `.api.js` puede probarse inyectando un `apiFetch` falso, como los otros clientes), y (b) en integración local (`LocalD1Adapter`, base en memoria) insertar el ciclo con SQL directo y leer con la API de aves; no se hace nada contra la base remota (requeriría autorización expresa y escritura directa).
- **Emulador:** el flujo `80-genealogia` ya está migrado (resuelto).
- **Resuelto (2026-11-03):** el caso `10-genealogia.mjs` cubre lo viable por la API; la rama circular quedó sin prueba automática (solo revisión de código), como se preveía arriba.
- El estado `VENDIDA`/`FALLECIDA` no se puede crear en D1 hoy (Bajas pendiente): GEN-09 y GEN-10 se difieren al módulo Bajas; solo se verifica GEN-20 (listas vacías).

## Dudas técnicas

1. Concurrencia entre dos ediciones simultáneas que formen un ciclo (mismo control en V1 y V2, no probada). Solo informativa.
2. *(Resuelta.)* `Number.isFinite` en `GenealogiaAveScreen.js:1153, 1163` descartaba todos los ids UUID; se sustituyó por un filtro de nulos dentro de la excepción aprobada (ver "Decisiones del usuario resueltas").
3. Si `localeCompare` de Hermes (Android) coincide con el de la ejecución en el navegador de pruebas: no se comprobó; las pruebas del algoritmo con `localeCompare` dependen del motor.
4. Cuando exista Bajas, `GET /aves?estado=VENDIDA|FALLECIDA` puede exigir `INNER JOIN` con `bajas_ave` (como `AveRepository.sqlite.js` de V1, ver comentario `aves.repository.ts:148-149`): si una ave vendida sin fila en `bajas_ave` dejara de listarse, el padre vendido desaparecería del árbol. A revisar en el módulo Bajas.

## Decisiones del usuario resueltas

1. **Excepción a `GenealogiaAveScreen.js`: APROBADA** (2026-11-03; ver "Excepciones técnicas", punto 7). Se aplicó el cambio mínimo de la tabla siguiente. La evidencia original se conserva abajo (las líneas son del árbol antes del cambio).
2. **Aviso de error de red: el usuario decidió NO añadir `Alert`** en el `catch` de `cargar`. Un fallo de red muestra "No fue posible encontrar el ave." (limitación conocida; ver "Lo implementado").

### Evidencia original de la excepción a pantallas V1 (`GenealogiaAveScreen.js`)

**Evidencia.** La pantalla usa `Number(...)` sobre ids en 6 sitios (más un `Number.isFinite`). Con UUID v7, `Number('01980f2a-...')` es siempre `NaN`. Consecuencias (el repositorio ya quedaría corregido con `String(...)`; solo falla la pantalla). Búsqueda sin límite de `Number(` en el archivo: `:690, 972, 974, 1088, 1093, 1151, 1161, 1231`.

| Línea | Código | Qué se rompe con UUID | Cambio mínimo |
|---|---|---|---|
| `:690` | `highlightIds?.has(Number(node.id))` (resalta en el árbol los ancestros comunes) | `Set.has(NaN)` es verdadero si el set contiene `NaN`: si `idsComunes` (construido en `:1043-1054` con claves `NaN` de `:1231`) no está vacío, **todas** las tarjetas salen resaltadas | `highlightIds?.has(String(node.id))` |
| `:972-974` | `Number(currentAveId) === Number(newAveId)` en `abrirAve` | `NaN === NaN` es falso: la guarda "no abrir la misma ave" nunca se cumple; tocar el ave actual vuelve a apilar `DetalleAve` del mismo ejemplar | `String(currentAveId) === String(newAveId)` |
| `:1088, 1093` | `mapaSegundo.get(Number(primero.id))`, `mapaPrimero.get(Number(segundo.id))` (profundidad de un progenitor dentro de los ancestros del otro: decide `describirCruceAscendente`, p. ej. "padre y su hija") | el mapa tiene una sola clave `NaN` (último nodo visitado), la profundidad sale errónea y se clasifica mal el tipo de cruce | `String(...)` en ambos |
| `:1151, 1161` (+ `.filter(Number.isFinite)` en `:1153, 1163`) | ids de los padres de cada progenitor | `NaN` no es finito: ambos conjuntos quedan vacíos y **nunca** se detecta "Cruce entre hermanos" / "medio hermanos" (rama `:1176-1188`) | quitar `Number(...)` y el filtro `Number.isFinite`, o `String(...)` con filtro `Boolean` |
| `:1231` | `obtenerMapaAncestros`: `const id = Number(node.id)` | todas las aves comparten la clave `NaN`; `idsComunes` (`:1043-1054`) contiene `NaN` en cuanto ambos progenitores tienen **algún** ancestro: falsa detección de consanguinidad ("Ancestro común detectado") en casi cualquier árbol con abuelos, y la lista `ancestrosComunes` sale con un solo nodo | `const id = String(node.id)` |

Sin cambios necesarios (usan el id tal cual): navegación `navigation.push('DetalleAve', { aveId })` (`:511-521, 982-990`), claves de lista (`:258, 457, 563, 646, 767`), y quien abre la pantalla, `DetalleAveScreen.js:998-1005` (pasa `aveId` sin convertir; no se revisaron otros usos de ids dentro de `DetalleAveScreen`, fuera de este módulo). `AvesScreen` no abre la genealogía.

**Resumen para decidir.** Sin tocar la pantalla, con UUID: (1) en la mayoría de árboles con abuelos aparecería un aviso falso de consanguinidad y tarjetas resaltadas; (2) no se detectaría hermanos ni medio hermanos; (3) el tipo de cruce padre/hija se clasificaría mal; (4) tocar el ave central abriría su propio detalle. El árbol en sí (ancestros, descendientes, relaciones inválidas) sería correcto si el repositorio usa `String(...)`. El cambio es de 5 expresiones (`Number(x)` → `String(x)`) más quitar `.filter(Number.isFinite)` en 2 sitios, sin tocar textos ni diseño. **Aprobada por el usuario y aplicada** (precedente: las excepciones aprobadas a pantallas V1 listadas en `estado-actual.md`; el motivo es el paso a UUID v7, una diferencia permitida). Alternativa descartada: que el repositorio devolviera ids numéricos sintéticos en los nodos (cambiaría el `id` que la pantalla pasa a `DetalleAve`).

### Aviso de error de red (decisión resuelta)

V1 solo hacía `console.error` en `cargar` (`GenealogiaAveScreen.js:80-87`) y con un fallo mostraba `No fue posible encontrar el ave.` (`:150-174`). En modo API un corte de red produce ese mismo texto (engañoso). El usuario decidió no tocarlo: queda como limitación conocida (precedente: `DetalleAveScreen` y `RegistrarHuevoScreen.cargarAve`).
