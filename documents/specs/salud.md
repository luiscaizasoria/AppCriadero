# Spec: salud

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).

## Estado

implementada (2026-11-02, rama `trabajo/migracion-nube`). Pendiente: comprobación en el teléfono físico (modo avión: debe verse el `Alert` de error).

### Lo implementado

- Migración `api/migrations/0008_salud.sql`: tabla `tratamientos_ave` con índices `ix_tratamientos_ave_ave` e `ix_tratamientos_ave_diagnostico`. Aplicada en local, en integración y en la base remota de pruebas.
- API en `api/src/salud/`: `POST /api/v1/criaderos/:criaderoId/aves/:aveId/diagnosticos` y `GET /api/v1/criaderos/:criaderoId/aves/:aveId/salud`.
- Cliente de la app: `SaludRepository.js` (fachada), `SaludRepository.sqlite.js` (código V1 intacto) y `SaludRepository.api.js`. `actualizarEstadoSaludAve` **no está** en `.api.js` (omitida por decisión del usuario; sin llamadores).
- Commits: `7e02ccd` (API), `e5805e6` (cliente), `31b823c` (pantalla) y `b9001bb` (pruebas; caso `08-salud` y flujo `60-salud-enfermedad`).
- Validación: typecheck OK; 203 pruebas unitarias/HTTP y 54 de integración en verde; `/probar datos` 44/44 (58 s, sin fuga entre cuentas); smoke verde (1,7 min); `/probar completo` 25,2 min sin regresiones, flujo `60-salud-enfermedad` migrado y en verde, pendientes `PENDIENTE DE MIGRAR: genealogia, huevos, dashboard`; `revisor-arquitectura-v2`: APROBADO.
- Cuarta excepción aprobada (commit `17ea040`): guarda de `ave` nula en `SaludAveScreen` (ver "Excepciones técnicas"); ya no hay `TypeError` en el render si `cargarDatos` falla.
- Limitaciones conocidas: la ficha de ave sigue sin bajas (ciclo de vida incompleto; los huevos ya se registran en la nube, pero el ciclo de vida no los muestra hasta Genealogía/Ciclo de vida). El botón "Guardar diagnóstico" sigue sin `disabled`: un doble toque puede duplicar el diagnóstico.

Alcance: aves individuales (sin lotes), sin sincronización offline, D1 como fuente de verdad. Las líneas son del árbol actual (v1.0.3, `app.json:5`).

## Fuente V1

- `src/repositories/SaludRepository.js`: `leerCatalogoApi` 16-38 (excepción de catálogos, ya aprobada), `obtenerEnfermedades` 42-85, `obtenerMedicamentos` 90-133, `registrarDiagnostico` 138-313, `obtenerHistorialSaludAve` 319-369, `actualizarEstadoSaludAve` 375-413 (**OMITIDA por decisión del usuario**).
- `src/screens/SaludAveScreen.js` (consumidor principal de las 4 funciones; importa `SaludRepository` en 32-37 y `obtenerAvePorId` de `AveRepository` en 26-28).
- `src/screens/FinalizarTratamientoScreen.js` (solo consumidor de `EstadoSaludRepository.finalizarTratamiento` y `CicloVidaRepository.registrarEventoCicloVida`; no usa `SaludRepository`).
- `src/screens/SaludScreen.js:5-19`: stub (`🐔 Salud`). Búsqueda sin límite de `SaludScreen` en todo el repo `*.js`: solo aparece su propia definición; no está en ningún navegador ni se importa. **Sin contrato; fuera de alcance.**
- Esquema V1: `src/database/migrations.js:243-263` (`diagnosticos_ave`), `:266-289` (`tratamientos_ave`), `:133-154` (`ave_historial`), `:361-362` (`idx_diagnosticos_ave`). `PRAGMA foreign_keys = ON` en `src/database/sqlite.js:63`.
- D1 ya existente: `api/migrations/0006_aves.sql:138-159` (`diagnosticos_ave` con `criadero_id`, FK `ON DELETE RESTRICT`, `estado` por defecto `'ACTIVO'`, índice `ix_diagnosticos_ave_estado(ave_id, estado)`). `tratamientos_ave` **no existe**: la propia migración dice que pertenece a Salud (`0006_aves.sql:13`).
- API ya existente (no se rediseña): `POST /aves/:aveId/finalizar-tratamiento` (`api/src/aves/aves.routes.ts:234-252`, `aves.service.ts:614-645`, `aves.repository.ts:605-632`) y `POST /aves/:aveId/eventos` (`aves.routes.ts:206-218`, `aves.service.ts:481-513`). Cliente: `src/repositories/EstadoSaludRepository.api.js:19-45` y `src/api/avesApi.js` (`traducirErrorAve`).
- Búsquedas sin límite hechas en `src/`: `SaludRepository` (único importador: `SaludAveScreen.js:37`), `tratamientos_ave` y `diagnosticos_ave` (ver "Otros lectores" abajo), `actualizarEstadoSaludAve` (solo su definición `SaludRepository.js:375`; **cero llamadores**), `SaludAve`/`FinalizarTratamiento` (rutas en `AvesStackNavigator.js:11-12,57-63`; entrada a Salud solo desde `DetalleAveScreen.js:892-924`, con `ave.estado === 'ACTIVA'`).

### Hallazgos

1. **En modo API, `registrarDiagnostico` y `obtenerHistorialSaludAve` siguen yendo a SQLite local** (no tienen el guard `USAR_API` que sí tienen `obtenerEnfermedades`/`obtenerMedicamentos`, `SaludRepository.js:44,92`). El `aveId` de la nube es un UUID que no existe en el SQLite local: el `INSERT` en `diagnosticos_ave` falla por FK y la pantalla solo hace `console.error` (`SaludAveScreen.js:333-341`); el historial sale vacío. Hoy guardar un diagnóstico en modo API no funciona. Este módulo lo corrige.
2. `registrarDiagnostico` guarda en `diagnosticos_ave.enfermedad` y `tratamientos_ave.medicamento` el **nombre** del ítem del catálogo (`SaludAveScreen.js:280-281,292-297`), no el código ni el id. No hay FK al catálogo.
3. `dosis` solo se persiste si hay `medicamento` (va en `tratamientos_ave`); sin medicamento se descarta (`SaludRepository.js:208-246`). `observacion` se guarda **en las dos filas** (diagnóstico y tratamiento) (`:196,240`).
4. `registrarDiagnostico` no lee ni valida el estado del ave ni la existencia previa (no hay `SELECT`): escribe siempre.
5. `diagnosticos_ave.estado` en V1 solo lo escribe `'ACTIVO'` aquí (`:183`); `'CERRADO'` lo pone `finalizarTratamiento` de v1.0.0 (`EstadoSaludRepository.sqlite.js:56-74`). Ver `aves.md` sección l.
6. El formulario no se limpia tras guardar (no hay `setSintomas('')` ni similar en `SaludAveScreen.js:248-351`); solo se recarga con `cargarDatos` (Aceptar, `:323-324`). Se replica.
7. Otros lectores de las tablas de Salud (siguen en SQLite hasta su módulo): `CicloVidaRepository.sqlite.js:89-113` (`diagnostico_id`, `fecha`, `enfermedad`, `sintomas`, `diagnostico_observacion`, `diagnostico_estado`, `medicamento`, `dosis`, `tratamiento_observacion`; `ORDER BY d.fecha DESC, d.id DESC`) y `ReportesRepository.js:46` (`diagnosticos_ave`). El modelo D1 debe conservar `tratamientos_ave.observacion` por este lector.

## Contrato del repositorio

Fachada propuesta (como Jaulas/Cuidados): `SaludRepository.js` pasa a elegir `.sqlite.js` (código V1 intacto, incluida `actualizarEstadoSaludAve`) o `.api.js`. El `.api.js` exporta **solo** las 4 funciones; `actualizarEstadoSaludAve` no se implementa en la API (omitida por decisión del usuario, sin llamadores). En `.api.js`, `obtenerEnfermedades`/`obtenerMedicamentos` conservan la resolución actual (`leerCatalogoApi`, `SaludRepository.js:16-38`: `obtenerCatalogoPorCodigo(codigo)`; si no hay catálogo `[]`; `obtenerItemsCatalogo(catalogo.id)`; mapea a `{ id, codigo, nombre }`; ordena por `nombre` con `<`/`>`). Esa lectura es la excepción aprobada de `catalogos.md`; no cambia.

### `obtenerEnfermedades()` / `obtenerMedicamentos()`

- Sin parámetros. Devuelve arreglo de `{ id, codigo, nombre }` de los ítems con `activo = 1` del catálogo `ENFERMEDADES` / `MEDICAMENTOS`, `ORDER BY ci.nombre` (`SaludRepository.js:52-83,100-131`). Sin errores propios. Consumo: `SaludAveScreen.js:189-192`, chips con `item.nombre` y `key = item.id`.
- V2: sin endpoint nuevo (catálogos ya implementados).

### `registrarDiagnostico({ aveId, enfermedad, sintomas, observacion, medicamento, dosis, fecha })` (`SaludRepository.js:138-313`)

Devuelve `undefined`. Todo dentro de `db.withTransactionAsync` (`:162`), en este orden exacto:

1. `INSERT INTO diagnosticos_ave (ave_id, fecha, enfermedad, sintomas, observacion, estado) VALUES (?,?,?,?,?, 'ACTIVO')` con `[aveId, fecha, enfermedad, sintomas || null, observacion || null]` (`:167-199`). `diagnosticoId = lastInsertRowId` (`:203-204`).
2. **Solo si `medicamento` es verdadero** (`if(medicamento)`, `:208`; `''` y `null` cuentan como "sin medicamento"): `INSERT INTO tratamientos_ave (diagnostico_id, ave_id, fecha, medicamento, dosis, observacion) VALUES (?,?,?,?,?,?)` con `[diagnosticoId, aveId, fecha, medicamento, dosis || null, observacion || null]` (`:211-243`). Misma `fecha` que el diagnóstico.
3. `UPDATE aves SET estado_salud = 'EN_TRATAMIENTO', fecha_ultimo_control_salud = ? WHERE id = ?` con `[fecha, aveId]` (`:250-272`). No toca `fecha_actualizacion` ni `estado`; no lee el estado previo (se sobrescribe aunque ya sea `EN_TRATAMIENTO`, `ENFERMA` o `SANA`).
4. `INSERT INTO ave_historial (ave_id, tipo_evento, fecha, detalle) VALUES (?,?,?,?)` con `[aveId, 'SALUD', fecha, `Diagnóstico registrado: ${enfermedad}`]` (`:276-306`). Sin `jaula_id` (queda `NULL`). Detalle literal: `Diagnóstico registrado: ` + `enfermedad` (el nombre del ítem).

Valores nulos: `sintomas || null`, `observacion || null`, `dosis || null` (cadena vacía → `NULL`). `enfermedad`, `fecha`, `aveId` y `medicamento` (cuando hay) se guardan tal cual.

Transacción: las 3–4 escrituras son atómicas; si cualquiera falla, se revierte todo y la excepción se propaga al llamador.

Casos de error (no hay validación ni errores de dominio en el repositorio):
- **Ave inexistente**: con `foreign_keys = ON` (`sqlite.js:63`) el primer `INSERT` (`diagnosticos_ave.ave_id → aves(id)`, `migrations.js:260-262`) falla con `FOREIGN KEY constraint failed`, se revierte todo. No hay error de dominio. La pantalla solo llega con un `aveId` real (navega desde el detalle).
- **Ave no ACTIVA** (VENDIDA, FALLECIDA, etc.): el repositorio **no lo comprueba**; escribe igual. Solo la UI lo evita: el botón "Salud" aparece únicamente con `ave.estado === 'ACTIVA'` (`DetalleAveScreen.js:892-924`).
- `enfermedad` o `fecha` nulos: fallarían por `NOT NULL` (`migrations.js:248,250`); la pantalla nunca los envía así (ver validación abajo).

Cómo lo consume la pantalla (`SaludAveScreen.js:248-351`, `guardar`):
- Antes de llamar: si no hay `enfermedadSeleccionada` → `Alert.alert('Enfermedad requerida', 'Selecciona una enfermedad.')` y `return` (`:252-263`). Es la única validación.
- Argumentos: `aveId` (de `route.params`, `:55-57`), `enfermedad: enfermedadSeleccionada.nombre`, `sintomas: sintomas.trim()`, `observacion: observacion.trim()`, `medicamento: medicamentoSeleccionado ? medicamentoSeleccionado.nombre : null`, `dosis: dosis.trim()`, `fecha: new Date().toISOString()` (`:276-308`). Nota: `observacion` es un estado (`:117-120`) que **no tiene ningún `TextInput` en la pantalla** (solo hay Síntomas `:579-599` y Dosis `:683-699`): siempre llega `''` → se guarda `NULL`.
- Éxito: `Alert.alert('Registro guardado', 'El tratamiento fue registrado correctamente.', [{ text: 'Aceptar', onPress: cargarDatos }])` (`:312-329`).
- Error: solo `console.error(error)` (`:333-336`), **sin mensaje al usuario**. `finally` apaga `guardando` (`:342-348`). El botón no usa `disabled={guardando}` (`:705-728`), por lo que se puede pulsar repetidamente.

### `obtenerHistorialSaludAve(aveId)` (`SaludRepository.js:319-369`)

- Una consulta, un arreglo de filas:
  ```sql
  SELECT d.id, d.fecha, d.enfermedad, d.sintomas, d.observacion, t.medicamento, t.dosis
  FROM diagnosticos_ave d
  LEFT JOIN tratamientos_ave t ON t.diagnostico_id = d.id
  WHERE d.ave_id = ?
  ORDER BY d.fecha DESC
  ```
- Forma de cada elemento: `{ id, fecha, enfermedad, sintomas, observacion, medicamento, dosis }` (snake_case de SQLite; aquí coincide con camelCase). `id` = `diagnosticos_ave.id`. `medicamento`/`dosis` son `null` si el diagnóstico no tiene tratamiento. `observacion` es la del **diagnóstico**, no la del tratamiento.
- Sin filtro por `estado` (incluye `ACTIVO` y `CERRADO`); sin desempate en el orden (solo `d.fecha DESC`); sin comprobar que el ave exista: ave inexistente → `[]`, sin error. Sin límite.
- Consumo: `SaludAveScreen.js:195-197`; muestra por fila `🔴 {item.enfermedad}`, `item.medicamento || 'Sin medicamento'` y `item.dosis || ''` (`:749-799`); `sintomas`, `observacion` y `fecha` se leen pero **no se muestran**. Un fallo en la carga solo hace `console.error` (`:226-232`).

### `actualizarEstadoSaludAve` — omitida

Solo se documenta: `UPDATE aves SET estado_salud = ?, fecha_ultimo_control_salud = CURRENT_TIMESTAMP WHERE id = ?` (`:375-413`). Cero llamadores. No se implementa en API ni en D1.

### Textos de las pantallas (literales)

| Pantalla | Texto | Línea |
|---|---|---|
| SaludAveScreen | Alert `'Enfermedad requerida'` / `'Selecciona una enfermedad.'` | 256-259 |
| SaludAveScreen | Alert `'Registro guardado'` / `'El tratamiento fue registrado correctamente.'`, botón `'Aceptar'` | 312-329 |
| SaludAveScreen | Etiquetas de estado: `'🟡 En tratamiento'`, `'🔴 Enferma'`, `'🟢 Sana'` | 844-870 |
| SaludAveScreen | `'Sin medicamento'`, `'Historial sanitario'`, `'💾 Guardar diagnóstico'`, `'✅ Finalizar tratamiento'` | 778, 742, 723, 481 |
| FinalizarTratamientoScreen | Éxito `'Tratamiento finalizado'` / `'El ave volvió al estado sana.'` + `goBack` | 96-113 |
| FinalizarTratamientoScreen | Error `'Error'` / `'No fue posible finalizar el tratamiento.'` | 123-126 |

### Relación con `finalizar-tratamiento` y `eventos` (ya implementados)

- `FinalizarTratamientoScreen.guardar` (`:49-137`) hace dos llamadas **no atómicas**: `finalizarTratamiento({ aveId, observacion })` (`:68-75`) y luego `registrarEventoCicloVida({ ..., tipoEvento: 'RECUPERACION', ... })` (`:78-93`). En API: `POST /finalizar-tratamiento` (pone `SANA`, cierra diagnósticos `ACTIVO` → `CERRADO`, evento `SALUD`) y `POST /eventos` (`RECUPERACION`). Si la segunda falla, queda la primera hecha y se ve el Alert de error (igual que en V1). Detalle en `aves.md` sección l.
- Orden causal: `registrarDiagnostico` crea diagnósticos `ACTIVO` y pone `EN_TRATAMIENTO`; el botón "Finalizar tratamiento" solo aparece con `EN_TRATAMIENTO` (`SaludAveScreen.js:451-490`); `finalizar-tratamiento` los cierra. `obtenerHistorialSaludAve` los devuelve con ambos estados.
- Los eventos `SALUD` del historial del ave (`Diagnóstico registrado: ...` y `Recuperación registrada: ...`) se escriben en `ave_historial`; `obtenerCicloVidaAve` los excluye (`aves.md` sección l) y reconstruye la línea de tiempo desde `diagnosticos_ave`/`tratamientos_ave`.
- Este módulo no toca `finalizar-tratamiento` ni `eventos`.

## Endpoints V2

Bajo `/api/v1/criaderos/:criaderoId/aves/:aveId/...`, en el módulo `aves` (comparten router y fachada con Aves; `tratamientos_ave` y `diagnosticos_ave` se escriben juntos). Ownership por criadero como el resto (401 `UNAUTHORIZED`, 403 `FORBIDDEN`, 404 `CRIADERO_NOT_FOUND`).

### POST `/diagnosticos`  (equivale a `registrarDiagnostico`)

- Request (camelCase): `{ enfermedad, sintomas?, observacion?, medicamento?, dosis?, fecha }`. `aveId` va en la ruta. `fecha` la envía la app (`new Date().toISOString()`, `SaludAveScreen.js:304-306`), igual que V1; el servidor no la sustituye.
- Efectos, en **un solo `db.batch`** (equivale a la transacción de V1) y en el mismo orden:
  1. `INSERT diagnosticos_ave (id, criadero_id, ave_id, fecha, enfermedad, sintomas, observacion, estado)` con `estado = 'ACTIVO'`, `sintomas || null`, `observacion || null`.
  2. Solo si `medicamento` es verdadero: `INSERT tratamientos_ave (id, criadero_id, diagnostico_id, ave_id, fecha, medicamento, dosis, observacion)` con `dosis || null`, `observacion || null` (misma `observacion` y `fecha` que el diagnóstico).
  3. `UPDATE aves SET estado_salud = 'EN_TRATAMIENTO', fecha_ultimo_control_salud = :fecha WHERE id = :aveId AND criadero_id = :criaderoId` (sin `fecha_actualizacion`).
  4. `INSERT ave_historial (id, criadero_id, ave_id, tipo_evento, fecha, detalle)` con `tipo_evento = 'SALUD'`, `jaula_id` ausente (NULL), `detalle = 'Diagnóstico registrado: ' + enfermedad`.
- El servidor genera los UUID v7 (diagnóstico, tratamiento si aplica, historial) antes del batch, ya que el batch no puede leer `lastInsertRowId`.
- Respuesta 201 `{ success: true, data: { id } }` (id del diagnóstico). El cliente `registrarDiagnostico` descarta el cuerpo y devuelve `undefined`, como V1.
- Errores: ave inexistente en el criadero → `404 AVE_NO_ENCONTRADA` (mismo código que `eventos`/`finalizar-tratamiento`; el cliente lo traduce con `traducirErrorAve` a `new Error('AVE_NO_ENCONTRADA')`). V1 daba `FOREIGN KEY constraint failed` (la pantalla ignora el mensaje, `:333-336`). **No** se rechaza por estado del ave (ni `AVE_NO_ACTIVA`): V1 no lo hacía. Sin `version`.
- Tipos del cuerpo (mismo criterio que `eventos`, `aves.service.ts:488-498`): objeto JSON; `enfermedad` y `fecha` texto; `sintomas`, `observacion`, `medicamento`, `dosis` texto o ausentes/null → si no, `400 VALIDATION_ERROR`. Es solo para poder enlazar a D1 sin error 500; no es una regla nueva de negocio (ver dudas).

### GET `/salud`  (equivale a `obtenerHistorialSaludAve`)

- Respuesta 200 `{ success: true, data: { historial: [{ id, fecha, enfermedad, sintomas, observacion, medicamento, dosis }] } }`. Misma consulta que V1 con `AND d.criadero_id = ?`, `LEFT JOIN tratamientos_ave t ON t.diagnostico_id = d.id`, `ORDER BY d.fecha DESC` (sin desempate). Nombres de campo idénticos a V1 (una palabra), así `aSnake` no cambia nada. El cliente devuelve el arreglo `historial`.
- Ave inexistente: `200` con `historial: []` (V1 no comprueba el ave; no se añade 404). Sin estado ni paginación.

Sin endpoints para enfermedades/medicamentos (usan `GET /catalogos/:codigo/items`, ya implementado) ni para `actualizarEstadoSaludAve`.

## Tabla D1

Migración `0008_salud.sql` (implementada; `0006` y `0007` no se editan). `diagnosticos_ave` **ya existe** en `0006` y no cambia (columnas: `id, criadero_id, ave_id, fecha, enfermedad, sintomas, observacion, estado DEFAULT 'ACTIVO', fecha_creacion`; coinciden con V1 `migrations.js:243-263`).

`tratamientos_ave` (replica `migrations.js:266-289`; convención de `0006`: `fecha_creacion` como en V1, sin `created_at`/`updated_at`/`deleted_at`/`version`/CHECK):

| Columna | Tipo | Regla | Origen V1 |
|---|---|---|---|
| id | TEXT PRIMARY KEY NOT NULL | UUID v7 | `id` INTEGER AUTOINCREMENT |
| criadero_id | TEXT NOT NULL | FK criaderos(id) RESTRICT | nuevo |
| diagnostico_id | TEXT | FK diagnosticos_ave(id) RESTRICT; nullable como en V1 (`:269`) | `diagnostico_id` |
| ave_id | TEXT NOT NULL | FK aves(id) RESTRICT (V1: `ON DELETE CASCADE`; no hay hard delete de aves) | `ave_id` |
| fecha | TEXT NOT NULL | ISO enviada por la app | `fecha` |
| medicamento | TEXT NOT NULL | nombre del ítem (texto, no FK) | `medicamento` |
| dosis | TEXT | nullable | `dosis` |
| observacion | TEXT | nullable | `observacion` |
| fecha_creacion | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | | `fecha_creacion` |

Índices (implementados): `ix_tratamientos_ave_diagnostico` sobre `diagnostico_id` (para el `LEFT JOIN`) e `ix_tratamientos_ave_ave` sobre `ave_id` (V1 no tiene índices; es solo rendimiento, no cambia el resultado). Las FK siguen el patrón de `0006` (`ON DELETE RESTRICT ON UPDATE RESTRICT`).

## Excepciones técnicas por pasar a online

- **IDs TEXT UUID v7** para `diagnosticos_ave.id`, `tratamientos_ave.id`, `ave_historial.id` (el servidor los genera). La respuesta de `registrarDiagnostico` ya no puede depender de `lastInsertRowId`; se devuelve `{ id }` y el cliente la ignora.
- **`criadero_id`** en `tratamientos_ave` y en todas las escrituras/consultas (ownership por criadero).
- **FK `RESTRICT`** en lugar de `CASCADE` (hereda la decisión de `0006`; sin hard delete de aves).
- **Transacción → `db.batch`** (atomicidad equivalente a `withTransactionAsync`).
- **Ave inexistente → `404 AVE_NO_ENCONTRADA`** en `POST /diagnosticos` (V1: error de FK de SQLite). La pantalla no distingue el error.
- **Errores de red/autenticación** (401, 403, `CRIADERO_NOT_FOUND`, fallos de red): los propaga el cliente REST (`ApiError`, `traducirErrorAve`).
- **Tipos del cuerpo** (`VALIDATION_ERROR` por tipo incorrecto): solo para el binding a D1, como en `eventos`.
- Lecturas de catálogo ENFERMEDADES/MEDICAMENTOS: excepción ya aprobada (`catalogos.md`); se conserva el `.api.js` con `leerCatalogoApi`.
- **Avisos de error de red en `SaludAveScreen.js` (tercera excepción aprobada por el usuario a las pantallas V1, 2026-11-02, commit `31b823c`).** Solo se añadieron dos `Alert.alert` en los `catch` existentes: `cargarDatos` (`'No fue posible cargar los datos de salud.'`) y `guardar` (`'No fue posible guardar el registro.'`). No se añadió `disabled` al botón (limitación conocida, ver "Estado"). `FinalizarTratamientoScreen` no necesitó excepción.
- **Guarda de ave nula en `SaludAveScreen.js` (cuarta excepción aprobada por el usuario a las pantallas V1, commit `17ea040`).** Se añadió `if (!ave) { return null; }` justo después del bloque de `loading`. Motivo: errores de red; si `cargarDatos` fallaba, `ave` quedaba `null` y el render daba `TypeError` (`ave.codigo`, `ave.estado_salud`). Nada más cambió.

## Casos de paridad

| id | dado | cuando | entonces | evidencia V1 |
|---|---|---|---|---|
| SAL-01 | Ave ACTIVA `SANA`, ENFERMEDAD elegida, sin medicamento | `registrarDiagnostico` con `sintomas ''`, `observacion ''`, `medicamento null`, `dosis ''` | 1 fila en `diagnosticos_ave` (`estado 'ACTIVO'`, `sintomas`/`observacion` NULL), **0** en `tratamientos_ave`, `aves.estado_salud 'EN_TRATAMIENTO'` y `fecha_ultimo_control_salud = fecha`, 1 fila `ave_historial` `SALUD` "Diagnóstico registrado: {enfermedad}" con `jaula_id` NULL; devuelve `undefined` | `SaludRepository.js:167-306` |
| SAL-02 | Igual, con medicamento y dosis | `registrarDiagnostico` con `medicamento 'X'`, `dosis '2 ml'` | además 1 fila `tratamientos_ave` con `diagnostico_id`, mismo `fecha`, `dosis '2 ml'`, `observacion` igual a la del diagnóstico | `:208-246` |
| SAL-03 | Medicamento seleccionado, dosis `''` | `registrarDiagnostico` | `tratamientos_ave.dosis` NULL | `:238` |
| SAL-04 | `medicamento` `''` o `null` con `dosis '5'` | `registrarDiagnostico` | no hay fila de tratamiento; la dosis se pierde | `:208` |
| SAL-05 | Ave ya `EN_TRATAMIENTO` o con diagnósticos previos | `registrarDiagnostico` | se crea otro diagnóstico `ACTIVO`; `fecha_ultimo_control_salud` se sobrescribe; sin rechazo | `:250-272` (sin lectura previa) |
| SAL-06 | Ave `VENDIDA`/`FALLECIDA` (llamada directa a la API) | `registrarDiagnostico` | se escribe igual (V1 no comprueba estado); la UI no ofrece el botón | `SaludRepository.js:138-313`; `DetalleAveScreen.js:892-924` |
| SAL-07 | `aveId` inexistente | `registrarDiagnostico` | V1: `FOREIGN KEY constraint failed`, nada escrito. V2: `404 AVE_NO_ENCONTRADA`, nada escrito (excepción técnica) | `migrations.js:260-262`; `sqlite.js:63` |
| SAL-08 | Falla la 3.ª o 4.ª escritura | `registrarDiagnostico` | no queda ninguna fila (transacción / batch atómico) | `:162` |
| SAL-09 | Ave con 3 diagnósticos de fechas distintas, uno con tratamiento | `obtenerHistorialSaludAve` | 3 filas `{id, fecha, enfermedad, sintomas, observacion, medicamento, dosis}` por `fecha` descendente; el que no tiene tratamiento trae `medicamento`/`dosis` NULL | `:329-367` |
| SAL-10 | Diagnósticos `CERRADO` y `ACTIVO` | `obtenerHistorialSaludAve` | aparecen todos | `:356` |
| SAL-11 | `aveId` sin diagnósticos o inexistente | `obtenerHistorialSaludAve` | `[]`, sin error | `:329-367` |
| SAL-12 | Criadero nuevo | `obtenerEnfermedades`/`obtenerMedicamentos` | 4 ítems cada uno por D-CAT-01 (V1 real: vacío; diferencia ya aprobada) | `catalogos.md` PAR-CAT-004 |
| SAL-13 | Enfermedad no elegida | pulsar "Guardar diagnóstico" | Alert `Enfermedad requerida` / `Selecciona una enfermedad.`; no se llama al repositorio | `SaludAveScreen.js:252-263` |
| SAL-14 | Guardado correcto | `guardar` | Alert `Registro guardado` / `El tratamiento fue registrado correctamente.`; "Aceptar" recarga; el formulario no se limpia | `:312-329` |
| SAL-15 | Ave `EN_TRATAMIENTO` con diagnósticos `ACTIVO` | `finalizar-tratamiento` + `POST /eventos` RECUPERACION | `estado_salud 'SANA'`, diagnósticos `CERRADO`, eventos `SALUD` y `RECUPERACION`; el historial de salud sigue mostrando los diagnósticos | `aves.md` sección l; `FinalizarTratamientoScreen.js:68-93` |

## Dudas técnicas

- `observacion` (estado de `SaludAveScreen`, `:117-120`) no tiene `TextInput` en la pantalla (sin referencias en el JSX 386-805): llega siempre `''`. Se replica; ver si es intencional queda para el usuario (no cambia la API).
- `enfermedad`/`fecha` ausentes: V1 daría `NOT NULL constraint failed`; en la API se mapea a `VALIDATION_ERROR` por tipo (como `eventos`). La pantalla nunca los envía vacíos.
- `ORDER BY d.fecha DESC` sin desempate (V1): con la misma `fecha` el orden no está definido; `CicloVidaRepository.sqlite.js:106-108` sí desempata por `d.id DESC`. Se replica el orden de `obtenerHistorialSaludAve`.
- Desfase con `aves.md` sección l (punto 4): allí `EstadoSaludRepository` figura como roto; ya está resuelto (`EstadoSaludRepository.sqlite.js` restaura `finalizarTratamiento` de v1.0.0, ver `estado-actual.md`). Esta spec es la vigente en ese punto; `aves.md` no se toca aquí.

## Decisiones del usuario sobre pantallas V1 (resueltas)

Las dudas sobre `SaludAveScreen` quedaron resueltas el 2026-11-02: se aprobó el aviso con `Alert` en los `catch` de `cargarDatos` y `guardar` (ver "Excepciones técnicas"). El 2026-11-03 se aprobó además la guarda de `ave` nula en el render (cuarta excepción, `17ea040`). No se aprobó desactivar el botón; queda como limitación conocida. `FinalizarTratamientoScreen` no necesita excepción: ya tiene `catch` con `Alert` y `disabled={guardando}`.
