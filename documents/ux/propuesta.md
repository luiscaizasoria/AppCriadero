# Propuesta de dirección UX (dos opciones) — pendiente de aprobación

Fecha: 2026-11-09. Autor: disenador-ux. No se implementa nada hasta la aprobación. Base: `inventario-actual.md` y `diagnostico-navegacion.md`.

Principio rector: que el usuario sepa dónde está, que le guste el diseño y que cada tarea cueste el menor número de toques **sin cambiar el proceso** (mismas llamadas a repositorios, mismos campos, mismas validaciones, mismos mensajes de error de datos).

## 0. Lo que es común a las dos opciones (la parte que corrige los problemas 1 y 2)

### 0.1 Patrón de navegación (corrige "atrás" incoherente)

1. **Quitar el interceptor `tabPress`** de `AppNavigator.js:37-71`. Con el comportamiento estándar: tocar la pestaña activa vuelve a la lista (pop al inicio); cambiar a otra pestaña y regresar restaura donde estabas. Sin pantallas fantasma.
2. **Cinco pestañas, mismo orden y misma posición** (Inicio, Jaulas, Aves, Finanzas, Más), misma altura útil de barra (el flujo Maestro las toca por coordenadas `30%/50%/90%,96%`). La regla de proyecto de cinco pestañas raíz se mantiene.
3. **Pantallas compartidas por pila (grupos de pantallas)**: las fichas y pantallas de Ave y de Jaula se registran también dentro de las pilas desde donde hoy se saltaba de pestaña. Así, tocar una alerta en Inicio o Alertas, o un ave dentro de una jaula, abre la ficha **dentro de la misma pestaña**, "atrás" vuelve al origen y la barra no cambia de pestaña. Implementación prevista: funciones `pantallasAve(Stack)` y `pantallasJaula(Stack)` en `src/navigation/` registradas en las pilas Inicio (nueva `InicioStack`: Inicio como raíz), Jaulas, Aves y Más. Los `navigate('Aves',{screen:'DetalleAve'})` de `InicioScreen`, `AlertasScreen`, `DetalleJaulaScreen` y `DetalleJaulaInactivaScreen` pasan a `navigate('DetalleAve', {aveId})` (solo cambia el destino de navegación, no la lógica). Alternativa descartada: una pila raíz sobre las pestañas (ocultaría la barra en las fichas y la barra deja de servir para salir).
4. **Genealogía** abre fichas con `navigate` por id (no `push` ilimitado) y la ficha recibe `desdeGenealogia` para mostrar "Volver al árbol" (el parámetro ya viaja, solo falta leerlo).
5. **Atrás del teléfono**: `backBehavior="history"` en las pestañas, de modo que "atrás" desde una raíz vuelva a la pestaña anterior y no siempre a Inicio. DUDA PARA EL USUARIO: ¿prefiere que "atrás" desde cualquier pestaña vaya a Inicio (hoy) o a la pestaña anterior (propuesto)?
6. **Tras guardar**: se mantiene el `goBack` actual (vuelve al origen real gracias al punto 3). Se propone sustituir el `Alert` de éxito con único botón "Aceptar" por un aviso no bloqueante (toast/banner) y volver automáticamente: ahorra 1 toque por guardado (hasta 7 flujos). Requiere actualizar los flujos Maestro ("Aceptar" aparece 23 veces en 15 flujos YAML, verificado con grep; con "Ver ave" de `40-aves.yaml`, 24 coincidencias en 16 flujos). Riesgo adicional: títulos y migas con el mismo texto (p. ej. "Salud" en miga y en título) darán coincidencias dobles en Maestro; se resuelve con `testID` o selectores más precisos. DUDA PARA EL USUARIO: ¿aprobar? Los `Alert` con decisión (confirmar baja, eliminar, quitar ave) NO se tocan.
7. Respuesta ante errores de red/carga: estados comunes de carga (esqueleto), vacío (qué hacer) y error con "Reintentar" en las pantallas que hoy solo hacen `console.error` (Inicio, Reportes, Alertas, Clientes, Más). No cambia mensajes de la API.

### 0.2 Patrón de orientación ("sé dónde estoy")

- **Cabecera única** (`src/components/PantallaHeader`) usada por **todas** las pantallas internas, en lugar de la cabecera nativa con nombres técnicos y de los títulos duplicados dentro del cuerpo:
  - Línea 1 (miga, texto pequeño, cada tramo tocable): `Aves › A-12 › Salud`. Tocar "Aves" va a la lista (pop al inicio de la pila), tocar "A-12" vuelve a la ficha. Un toque para saltar varios niveles hacia atrás.
  - Línea 2 (título): nombre de la pantalla en español ("Salud", "Registrar huevo", "Nuevo movimiento").
  - A la izquierda, flecha "atrás" siempre visible; a la derecha, acción principal opcional (p. ej. "Guardar" en formularios largos).
- **Datos de contexto**: la miga lleva el código real (ave A-12, jaula J001). Cada pantalla de detalle lo informa con `navigation.setOptions({ contexto })` (una línea por pantalla; no toca la lógica). Si aún no cargó, muestra "Ave".
- **Chip de contexto** en las pantallas hijas de una ave/jaula (Salud, Huevo, Evolución, Baja, Alimentación...): una franja bajo la cabecera con icono, código y estado (p. ej. "A-12 · En tratamiento · Jaula J003") para no tener que volver a la ficha a comprobar.
- Pestañas raíz: título de sección con icono (mismo componente, sin miga) y subtítulo de una línea.
- La barra inferior marca siempre la sección actual (con los atajos del punto 0.1.3 ya no cambia de pestaña inesperadamente). Insignia numérica de alertas sobre "Más" (ya existe `AlertBadge`), con el mismo conteo de `obtenerResumenAlertas`.

### 0.3 Menos toques (sin cambiar el proceso; detalle en `toques-antes.md`)

| Idea | Dónde | Ahorro |
|---|---|---|
| Quitar "Aceptar" tras guardar (aviso no bloqueante + volver) | Nueva jaula, Alimentación, Bebida, Sanidad, Huevo, Finalizar tratamiento, Catálogo, Nuevo movimiento, Baja | 1 toque por tarea |
| Botones de acción de la ficha del ave arriba y fijos (barra de acciones: Salud, Huevo, Evolución, Más ▾), hoy al final de un scroll largo (`DetalleAveScreen.js:804-1052`) | Ficha de ave | 0 toques pero evita scroll largo (hasta 3-4 gestos) |
| Botón flotante "＋" fijo en listas (hoy "＋ Nueva ave/jaula" va arriba y solo en la pestaña Activas) | Aves, Jaulas, Finanzas | evita volver al tope de la lista |
| Alta rápida en catálogos: campo "Nuevo elemento" + botón "Añadir" en la propia lista (envía los mismos `crearItemCatalogo`; descripción vacía; replica "Nombre requerido / Ingrese un nombre.", el `codigo` derivado en mayúsculas con `_` y la descripción vacía de `EditarCatalogoItemScreen.js:71-127`) | Catálogos | 2 toques menos (de 7 a 5: sin pantalla Elemento ni Aceptar) |
| Acceso directo desde Inicio a Producción de huevos, Reportes y Alertas (tarjetas ya con datos: "Ver más ›") | Inicio | de 2 toques (Más > X) a 1 |
| Miga tocable | todas | volver varios niveles en 1 toque |
| `returnKeyType="next"`/`"done"`, `autoFocus` en el primer campo, teclado correcto, botón principal fijo sobre el teclado | formularios | sin toques extra para ocultar teclado y desplazarse |
| Selectores con opción única visible (chips) sin cambios de semántica; **no** se preselecciona ningún dato obligatorio | formularios | (no se toca la validación) |

Lo que NO se hace: preseleccionar raza/sexo/categoría (cambiaría la obligatoriedad), ocultar campos obligatorios, fundir pantallas que cambian el proceso, tocar `src/api`, repositorios, campos o mensajes.

### 0.4 Sistema de diseño (tema único + componentes)

- `src/theme/` con `colors`, `typography`, `spacing`, `radii`, `shadows`, `icons` (mapa nombre lógico > glifo) y `index.js`. `src/config/constants.js` conserva `COLORS` apuntando a los tokens del tema, para que ninguna pantalla se rompa durante la migración por bloques.
- Componentes: `PantallaHeader`, `Pantalla` (contenedor con scroll, teclado, estados cargando/vacío/error), `Boton` (primario, secundario, peligro, texto; estado cargando), `CampoTexto` (etiqueta, ayuda, error, icono), `Chip`/`ChipGrupo` (reemplaza `SelectorCatalogo` y 8 copias), `Tarjeta`, `Insignia`, `Icono`, `EstadoVacio`, `EstadoError`, `Aviso` (toast), `FilaAccion` (tarjeta de menú), `PestanasInternas` (Activas/Vendidas/Fallecidas, periodos), `MiniMetrica`.
- Accesibilidad: objetivo táctil mínimo 48 px, `accessibilityRole` y `accessibilityLabel` en botones con solo icono, contraste ≥ 4,5:1 en texto y botones (los valores de abajo ya cumplen), tamaño de texto mínimo 13 (nada de 12), texto sobre fondo claro siempre en `primaryDark`/`text`/`textSecondary`, `testID` en elementos nuevos.

## 1. Opción A — Pulir la identidad actual (verde azulado, iconografía coherente)

**Idea**: la app se reconoce igual (verde azulado, fondo casi blanco), pero ordenada y legible: mismos colores base con contraste corregido, iconos de una sola familia en vez de emojis, cabeceras iguales en todas las pantallas.

### Paleta (hex)

| Token | Valor | Uso |
|---|---|---|
| primary | `#3d8b8b` | solo iconos grandes y elementos decorativos (sobre blanco 4,0:1; NO para texto) |
| primaryDark | `#2c6e6e` | fondo de botones primarios y cabecera (blanco encima ≈ 5,9:1; hoy 4,0:1) y TODO texto o enlace sobre fondo claro (≈ 5,9:1 sobre blanco, ≈ 5,2:1 sobre primarySoft) |
| primarySoft | `#e7f5f5` | tinte de selección, chips activos, franjas de contexto (ya en uso) |
| background | `#f5fafb` | fondo (sin cambio) |
| surface | `#ffffff` | tarjetas |
| surfaceAlt | `#e8eeee` | chips inactivos (ya en uso) |
| text | `#223344` | texto principal (= `#234` actual) |
| textSecondary | `#5b6770` | texto secundario (≥ 5,5:1 sobre fondo) |
| border | `#d9e2e5` | bordes |
| success / successSoft | `#1f6b4a` / `#e4f4ec` | sano, ingreso, guardado (hoy `#52b788` con blanco = 2,5:1; `#2a7f5a` sobre el fondo suave da solo ≈ 4,3:1; con `#1f6b4a` ≈ 5,7:1 sobre el suave y mayor sobre blanco) |
| danger / dangerSoft | `#a8322e` / `#fde9e7` | baja, eliminar, egreso, alertas críticas (`#c2413d` sobre el suave da ≈ 4,4:1; con `#a8322e` ≈ 5,7:1). Valores calculados con la fórmula WCAG; reconfirmar al implementar |
| warning / warningSoft | `#f4d35e` / `#fff6d6` (texto `#5c4a00`) | advertencias; siempre con texto oscuro |
| info | `#2873ab` | informativo, enlaces secundarios (≈ 5,1:1) |
| accent (huevos/producción) | `#f4a261` (texto oscuro) | huevos y producción |

Consolida los ~190 literales actuales; Ciclo de vida y Genealogía usan estas familias (el morado de genealogía se mantiene solo como color de parentesco en `GenealogiaAveScreen`, definido en el tema como `kinship`).

### Tipografía
Fuente del sistema (sin dependencias). Escala fija: display 26/bold, título pantalla 22/bold, título tarjeta 17/semibold, cuerpo 15/regular, secundario y micro 13 (mínimo). Cifras grandes 28/bold. Interlineado 1,3.

### Iconografía
`Ionicons` de `@expo/vector-icons`, **ya instalado y ya usado** (`package.json:6`; fuente `Ionicons.ttf` ≈ 390 KB, ya incluida en el APK). Sin dependencias nuevas. Estilo outline en todo; en la barra, relleno cuando está activa. Mapa propuesto (todos comprobados en el `glyphmap` instalado):

| Concepto | Glifo | Concepto | Glifo |
|---|---|---|---|
| Inicio | `home` / `home-outline` | Aves | `paw` / `paw-outline` |
| Jaulas | `grid` / `grid-outline` | Finanzas | `cash` / `cash-outline` |
| Más | `ellipsis-horizontal-circle-outline` | Alertas | `notifications-outline` |
| Huevo | `egg-outline` | Salud | `medkit-outline` |
| Ciclo de vida | `leaf-outline` | Genealogía | `git-network-outline` |
| Evolución (foto) | `camera-outline` / `images-outline` | Baja | `exit-outline` |
| Fallecimiento | `skull-outline` | Venta | `cart-outline` |
| Alimentación | `nutrition-outline` | Bebida | `water-outline` |
| Sanidad | `bandage-outline` | Historial | `time-outline` |
| Guardar | `save-outline` | Añadir | `add-circle` |
| Editar/Eliminar | `create-outline` / `trash-outline` | Reportes/Exportar | `bar-chart-outline` / `share-outline` |
| Clientes | `people-outline` | Producción | `trending-up-outline` |
| Respaldo | `archive-outline` | Cerrar sesión | `log-out-outline` |
| Búsqueda/Filtros | `search-outline` / `options-outline` | Correo/Contraseña | `mail-outline` / `lock-closed-outline` + `eye-outline` |
Ave/gallo: no hay silueta de gallina en Ionicons; se usa `paw` como hoy para sección y se conserva el emoji 🐔 solo como imagen decorativa en estados vacíos y fotos sin imagen (decisión opcional).

### Patrón de login, registro y selección de criadero
- Pantalla con logo (`assets/icon.png`) y nombre "Criadero Kikirikis" arriba sobre fondo `primarySoft`, tarjeta blanca con formulario.
- Campos con icono (`mail-outline`, `lock-closed-outline`), mostrar/ocultar contraseña, `returnKeyType` encadenado (correo > contraseña > enviar), botón principal grande; error de la API en banner rojo con icono bajo los campos (mismo texto).
- Registro: igual con título "Crear cuenta" e indicador "Paso 1 de 2" (cuenta) y en Selección de criadero "Paso 2 de 2" (criadero) para orientar; el nombre del criadero se pide primero y los datos se agrupan en "Ubicación" y "Contacto".
- Selección de criadero: tarjetas con icono, nombre y ubicación, chevron; "Crear otro criadero" como botón secundario; "Cerrar sesión" fijo abajo como texto.
- Onboarding: la app hoy no tiene pantallas de bienvenida (el backend tiene `onboarding`, la app no lo usa). Propuesta: no añadir pantallas; en Inicio vacío (sin jaulas ni aves) mostrar una guía de 3 pasos con botón directo: "1. Crea tu primera jaula > 2. Registra un ave > 3. Registra su alimentación" (solo enlaces a pantallas existentes). DUDA PARA EL USUARIO: ¿se desea esa guía (no cambia ningún proceso)?

### Pantallas principales (descripción)
| Pantalla | Cambio |
|---|---|
| Inicio | Cabecera con saludo y nombre del criadero; fila de 4 cifras clave (activas, huevos hoy, alertas, ocupación) fijas arriba; tarjetas plegables por sección (Aves, Producción, Finanzas, Jaulas) con icono Ionicons y "Ver más ›"; alertas ordenadas por nivel con icono y color; estados de carga (esqueleto), vacío y error con "Reintentar". |
| Jaulas (lista) | Pestañas internas Activas/Inactivas como segmentado; tarjetas con insignia de estado sanitario (color + icono), conteo de aves; botón flotante "＋". |
| Detalle de jaula | Cabecera con miga y estado; barra de acciones con 4 botones de icono (Alimentación, Bebida, Sanidad, Historial) justo bajo la cabecera, aves de la jaula debajo; Editar/Eliminar en menú "⋮". |
| Formularios de jaula, alimentación, bebida, sanidad | `PantallaHeader`, `CampoTexto`, `ChipGrupo`, botón primario fijo abajo, aviso de éxito no bloqueante. |
| Aves (lista) | Segmentado Activas/Vendidas/Fallecidas, buscador fijo arriba con botón de filtros (indicador cuando hay filtros activos), tarjetas con foto, estado de salud con color e icono; botón flotante "＋". |
| Ficha de ave | Cabecera con código y estado; barra de acciones fija (Salud, Huevo, Evolución, Más); secciones plegables (Datos, Huevos, Historial); Ciclo de vida y Genealogía como filas "Ver ›"; "Dar de baja" en la sección final con color de peligro. |
| Nueva ave / editar | Secciones con título e icono (Identificación, Origen, Datos, Medidas, Jaula); campos obligatorios marcados y errores bajo el campo (mismos textos); botón "Guardar ave" fijo; chips de raza/sexo/jaula como `ChipGrupo`. |
| Salud / Finalizar tratamiento | Chip de contexto del ave, estado actual destacado, formulario en dos pasos visuales (Diagnóstico > Tratamiento) en la misma pantalla, historial sanitario como línea de tiempo. |
| Huevos / Producción | Registrar huevo con fecha visible y botón único; producción con cifras grandes y gráficas con la paleta de accent. |
| Genealogía / Ciclo de vida | Árbol y línea de tiempo con colores del tema; "Volver al árbol". |
| Bajas | Dos tarjetas grandes (Fallecimiento / Venta) en lugar de chips; campos de venta agrupados; "Confirmar baja" en rojo con confirmación existente. |
| Finanzas | Resumen del periodo en tarjeta (ingresos verde, egresos rojo, balance), segmentado de periodo, consolidados con barras, movimientos con icono por tipo; botón flotante "＋ Movimiento". |
| Nuevo/Editar movimiento | Tipo como segmentado Ingreso/Egreso, categoría en chips, valor con teclado numérico, botón fijo. |
| Clientes / Detalle | Buscador fijo, tarjetas con iniciales, estado vacío con indicación de qué hacer. |
| Reportes | Resúmenes en tarjetas con icono; exportaciones como lista de filas con icono `share-outline` (misma función, mismo texto "Exportar X"). |
| Alertas | Resumen por nivel arriba, filtros como chips, lista con icono y acción clara ("Abrir ave", "Abrir jaula"). |
| Más | Lista agrupada en dos bloques: "Operación" (Alertas, Producción de huevos, Clientes, Reportes) y "Administración" (Configuración, Respaldo, Cerrar sesión), iconos Ionicons, insignia de Alertas. |
| Configuración / Catálogos | Lista de catálogos con icono y conteo; en el catálogo, alta rápida inline, "Eliminar" con confirmación (el texto actual se mantiene), estado vacío explicativo. |

## 2. Opción B — Identidad nueva ("Campo": verde bosque, crema y ámbar de yema)

**Idea**: un aspecto más cálido y propio de una granja: fondo crema, verde bosque y ámbar; tarjetas planas con borde; iconos de granja de la familia Material Community. Mismo patrón de navegación y orientación que A (sección 0).

### Paleta (hex)

| Token | Valor | Uso |
|---|---|---|
| primary | `#2d6a4f` | botones, cabecera, pestaña activa (blanco encima ≈ 6,4:1) |
| primarySoft | `#e3efe8` | selección, chips activos |
| accent | `#e9a23b` (texto `#3a2a00`) | huevos, producción, botón flotante |
| background | `#faf7f0` | fondo crema |
| surface | `#ffffff` | tarjetas |
| surfaceAlt | `#f0eadb` | chips inactivos |
| text | `#1d2b25` | principal |
| textSecondary | `#5e6b63` | secundario |
| border | `#e1dacb` | bordes |
| success / danger / info | `#2e7d4f` / `#b3382c` / `#2f6f9f` | estados (todos ≥ 4,5:1 con blanco; valores aproximados, a verificar al implementar) |
| warning | `#e9a23b` con texto oscuro | advertencias |

### Tipografía
Fuente del sistema con escala más grande y jerarquía marcada (display 28/heavy, título 22/bold, cuerpo 16, secundario 14, micro 12). Una fuente propia (por ejemplo una de Google Fonts) exigiría `expo-font` y un paquete de fuentes: **dependencia nueva, no se incluye sin aprobación**; no es necesaria.

### Iconografía
`MaterialCommunityIcons` de `@expo/vector-icons` (mismo paquete ya instalado; sin cambios en `package.json`). **Peso**: `MaterialCommunityIcons.ttf` ≈ 1,3 MB que se sumaría al APK (Ionicons ≈ 390 KB ya incluido). Justificación: tiene iconos de granja que Ionicons no tiene (comprobados en el `glyphmap`): `bird` (ave), `egg` / `egg-outline` (huevo), `fence` (jaula/corral), `family-tree` (genealogía), `stethoscope` (salud), `pill` (medicamento), `grain` (alimento), `cash-multiple` / `cash-plus` / `cash-minus` (finanzas), `bell-outline`, `sprout-outline` (ciclo de vida), `view-grid-outline`, `account-group-outline`, `file-chart-outline`, `cog-outline`, `timeline-text-outline`, `home-variant-outline`. Se muestran dentro de un círculo tintado (`primarySoft`/`accent` suave) para dar identidad. Pestañas: Inicio `home-variant-outline`, Jaulas `fence`, Aves `bird`, Finanzas `cash-multiple`, Más `dots-horizontal-circle-outline` (a verificar).

### Patrón de login, registro y onboarding
- Pantalla completa verde bosque en la mitad superior con logo y lema "Tu criadero, en orden", formulario en una hoja blanca de esquinas redondeadas (radio 24) que sube; campos tipo "outlined" con icono.
- Registro con los 2 pasos descritos en A (cuenta > criadero) con barra de progreso; selección de criadero con tarjetas con icono `fence`.
- Mismos criterios: errores en banner, `returnKeyType` encadenado, mostrar contraseña. Guía de primeros pasos en Inicio vacío (DUDA PARA EL USUARIO, igual que en A).

### Pantallas principales
Misma estructura que A (cabecera de miga, barra de acciones, botones flotantes, secciones), con estas diferencias de estilo: tarjetas planas (borde 1 px `border`, sin sombra, radio 20); cabecera de las raíces con banda `primary` y texto blanco; iconos en círculos tintados en Más, Inicio y listas; botón flotante ámbar; segmentados con fondo `surfaceAlt` y ficha activa `primary`; cifras de Inicio en tarjetas coloreadas suaves (verde, ámbar, azul); Finanzas con barras verde bosque (ingreso) y rojo ladrillo (egreso).

## 3. Comparación y recomendación

| Criterio | A (pulir) | B (nueva) |
|---|---|---|
| Reconocimiento | igual que hoy, más limpio | cambia el aspecto por completo |
| Peso/dependencias | Ionicons ya usado (0 KB extra, 0 deps) | MaterialCommunityIcons ≈ +1,3 MB, 0 deps nuevas |
| Iconos de granja | no hay gallina/jaula; se usan metáforas (`paw`, `grid`, `egg-outline`) | `bird`, `fence`, `egg`, `family-tree`: muy expresivos |
| Esfuerzo | mismo trabajo de sistema de diseño en ambas; el tema es intercambiable | ídem, más repintado de literales (los mismos ~190) |
| Riesgo en pruebas | bajo | bajo (los textos no cambian entre A y B) |
| Contraste | corregido | corregido |

**Recomendación: empezar con la Opción A.** Razones: (1) el usuario pidió orientarse y reducir toques antes que renovar la marca; (2) A no añade peso ni dependencias y cumple contraste; (3) el sistema de diseño se construye con tokens, de modo que pasar a B después es cambiar `colors`, `icons` y `radii` sin rehacer pantallas; (4) los iconos de granja de B se pueden adoptar de forma selectiva en A (solo `bird`, `fence`, `egg` si se aprueba el +1,3 MB). DUDA PARA EL USUARIO: ¿A, B o A con los iconos de granja de B?

## 4. Decisiones que necesito del usuario (resumen)

1. Opción visual: A, B o A + iconos de granja.
2. "Atrás" del teléfono desde una pestaña: a Inicio (hoy) o a la pestaña anterior (propuesto).
3. Sustituir el `Alert` "Aceptar" de éxito por aviso no bloqueante y volver solo (actualiza flujos Maestro).
4. "Ver ave" tras registrar: ir directo a la ficha (aviso + navegación) o mantener el diálogo.
5. Alta rápida en catálogos (campo inline en la lista).
6. Guía de primeros pasos en Inicio vacío.
7. Atajos de Inicio a Producción, Reportes y Alertas.
8. `BackupScreen` ("Respaldo") en modo API: ¿se mantiene visible o se oculta? (hoy visible en ambos modos; es SQLite local).

## 5. Decisiones

Decisiones del usuario del 2026-11-09 (relayadas por el orquestador). También registradas en `inventario-cambios.md`.

1. **Opción visual: A** (pulir la identidad verde azulada, `Ionicons`, sin dependencias nuevas). B y los iconos de granja no se adoptan.
2. **"Atrás" del teléfono**: vuelve a la pestaña anterior (`backBehavior="history"`).
3. **Plan de bloques** (`plan-bloques.md`): aprobado; un bloque por vez, informe corto y visto bueno entre bloques.
4. **Propuestas que rozan el proceso: APROBADAS con estos límites**:
   - Aviso no bloqueante en lugar del `Alert` de éxito con "Aceptar": no cambia la validación ni el mensaje; los `Alert` de decisión (baja, eliminar, quitar ave) no se tocan.
   - "Ver ave" tras registrar: solo navega a la ficha.
   - Alta rápida en catálogos: mismos endpoints (`crearItemCatalogo`) y mismas validaciones, incluido "Nombre requerido", el código derivado (mayúsculas y `_`) y la descripción vacía.
   - Ocultar "Respaldo" solo en modo API (`EXPO_PUBLIC_DATA_SOURCE=api`), sin tocar el código de respaldo (`BackupScreen`, `BackupRepository`).
5. **Autorización**: `testID` permitidos en elementos nuevos o modificados.
6. Sin decisión expresa (no implementar hasta tenerla): guía de primeros pasos en Inicio vacío y atajos de Inicio a Producción, Reportes y Alertas.
