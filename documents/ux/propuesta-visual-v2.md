# Propuesta visual v2 (sub-bloques C1 a C6)

Fecha: 2026-11-09 (revisada el mismo día con `validacion-propuesta-visual-v2.md`: F1 a F4, táctil, textos reales, franja de jaula, rendimiento, flujos, toques y fuentes). Estado: PROPUESTA, sin tocar `src/`, `App.js` ni `package.json`. Vista previa: abrir `documents/ux/muestrario-visual-v2.html` en el navegador del PC (selector de variante y de pantalla arriba; botón «Las tres lado a lado»; sin internet usa fuentes de respaldo).

Reemplaza a `propuesta-visual.md` y `muestrario-visual.html` (variantes A «Campo cálido» y B «Verde sobrio», **descartadas** por el usuario: «demasiado sobrias»). De aquello se conserva solo la estructura, la tabla emoji → icono y la lista de flujos Maestro (actualizada abajo).

Reglas nuevas del usuario aplicadas: sin verde como color de marca (el verde queda solo para éxito/alertas), sin amarillo como color de marca (ni acento ni botón flotante), app alegre con fondos de varios colores, tipografía con carácter. Se mantiene lo aprobado: navegación del bloque A, Ionicons en lugar de emojis, tamaños táctiles grandes, migas, insignia de alertas en Más, botón flotante, «Guardar» fijo abajo, accesos rápidos en Inicio (**sin «Registrar huevo»**), Respaldo oculto en modo API, aviso no bloqueante, «Ver ave» directo y alta rápida en catálogos.

Método de contraste: la guardia técnica no permite ejecutar `node`, así que los ratios de este documento están **calculados a mano** (luminancia relativa WCAG, precisión ±0,1). El muestrario recalcula todos en el navegador con JavaScript (sección «Paletas y contraste», con el **peor punto del degradado**); si alguno difiere, manda el del HTML y se corrige este documento. Cuando el HTML marque «NO CUMPLE» en algún par, es un defecto de la propuesta a corregir antes de implementar.

---

## 1. Las tres variantes

Idea común: fondo de pantalla = tres puntos de color **pastel** mezclados (degradados radiales suaves) para que el texto siga leyéndose; el color fuerte vive en cabeceras, botones, tarjetas de métrica, avatares y barra inferior, siempre con texto blanco (≥ 4,5:1) o texto oscuro sobre los acentos claros. Las tarjetas de contenido son blancas (el texto nunca va sobre un degradado: el peor punto que se calcula es el del fondo pastel visible en los márgenes y bajo los títulos).

### 1.1 Variante 1 «Pajarera tropical» (recomendada)

Justificación: los kikirikis son aves de plumaje y los criaderos andinos están llenos de color; coral, turquesa, violeta y fucsia dan la alegría de una pajarera tropical y la mascota turquesa se ve de lejos al sol.

| Rol | Hex | Uso |
|---|---|---|
| Primario (violeta) | `#6D3BD2` | Inicio del degradado de cabecera y botón; blanco encima 6,6:1 |
| Primario oscuro | `#3F1D8F` | Enlaces, texto de énfasis; 9,8:1 sobre el peor fondo |
| Secundario (fucsia) | `#C2188F` | Fin del degradado; blanco encima 5,5:1 |
| Acento 1 (turquesa) | `#19C3C9` | Formas decorativas, mascota, acción con acento; texto oscuro encima 8,0:1 |
| Acento 2 (coral) | `#CC312A` (antes `#D6362E`, 4,7:1) | Botón flotante y tarjeta «Tratamiento»; blanco encima 5,2:1 |
| Tarjeta turquesa profundo | `#007782` (antes `#00808C`, 4,7:1) | Tarjeta «Fallecidas»; blanco 5,3:1 |
| Fondo (3 puntos) | `#FFE3EC` → `#EFE6FF` → `#DDF6F7` | Rosa, lila y turquesa pastel; el más oscuro (`#EFE6FF`) da L = 0,82 |
| Superficie | `#FFFFFF` | Tarjetas |
| Texto principal | `#1B1636` | 17,3:1 sobre blanco, 14,4:1 sobre el peor fondo (cumple ≥ 7:1 para el sol) |
| Texto secundario | `#5A5278` | 7,2:1 sobre blanco, 6,0:1 sobre el peor fondo |
| Borde de campo | `#8A7FB0` | 3,7:1 sobre blanco (componente, mínimo 3:1) |
| Suave (chips, selección) | primario al 14 % sobre blanco | Se calcula en el tema |

### 1.2 Variante 2 «Atardecer andino»

Justificación: los atardeceres de Machachi bajo el Cotopaxi (naranja quemado, magenta, índigo, rosa) dan identidad local y son cálidos, con el índigo como contrapunto frío para enlaces y datos.

| Rol | Hex | Uso |
|---|---|---|
| Primario (naranja quemado) | `#C2410C` | Inicio del degradado; blanco encima 5,2:1 |
| Primario oscuro (índigo) | `#3B2F9E` | Enlaces, tarjeta de color, texto de énfasis; 7,7:1 sobre el peor fondo |
| Secundario (magenta) | `#B3126B` | Fin del degradado; blanco 6,5:1 |
| Acento 1 (rosa) | `#FF7BAC` | Botón flotante, mascota; texto oscuro encima 6,8:1 |
| Acento 2 (índigo) | `#3B2F9E` | Formas decorativas y tarjeta |
| Tarjeta rosa fuerte | `#C92E64` (antes `#D6336C`, 4,6:1) | Blanco encima 5,2:1 |
| Fondo (3 puntos) | `#FFE8D6` → `#FFD6E7` → `#E6E0FF` | Durazno, rosa y lila; el más oscuro (`#FFD6E7`) da L = 0,75 |
| Superficie | `#FFFFFF` | Tarjetas |
| Texto principal | `#2B1738` | 16,4:1 sobre blanco, 12,5:1 sobre el peor fondo |
| Texto secundario | `#654A63` | 7,7:1 sobre blanco, 5,9:1 sobre el peor fondo |
| Borde de campo | `#8F6F86` | 4,4:1 sobre blanco |

### 1.3 Variante 3 «Fiesta de colores»

Justificación: el rumbo más atrevido y juvenil; azul eléctrico, violeta, rosa y naranja dan máxima energía y separan mucho las secciones, pensado para quien quiere que «se note» el cambio.

| Rol | Hex | Uso |
|---|---|---|
| Primario (azul eléctrico) | `#2B50E6` | Inicio del degradado; blanco encima 6,2:1 |
| Primario oscuro | `#1A2C8F` | Enlaces; 9,6:1 sobre el peor fondo |
| Secundario (rosa fuerte) | `#D4177A` | Tarjeta y detalles; blanco 5,0:1 |
| Acento 1 (naranja) | `#FF8A1F` | Botón flotante y tarjeta «Tratamiento» (texto oscuro `#141A3D` encima 7,2:1) |
| Acento 2 (violeta) | `#7A2FE0` | Fin del degradado; blanco 6,3:1 |
| Fondo (3 puntos) | `#E3ECFF` → `#F2E4FF` → `#FFE3EF` | Azul, violeta y rosa pastel; el más oscuro (`#F2E4FF`) da L = 0,82 |
| Superficie | `#FFFFFF` | Tarjetas |
| Texto principal | `#141A3D` | 16,9:1 sobre blanco, 13,9:1 sobre el peor fondo |
| Texto secundario | `#54597F` | 6,8:1 sobre blanco, 5,6:1 sobre el peor fondo |
| Borde de campo | `#7C84B4` | 3,6:1 sobre blanco |

Nota: en esta variante el azul de marca se parece al azul de «información»; por eso la información siempre lleva icono y chip `information-circle`, nunca solo color.

### 1.4 Colores de estado (iguales en las tres variantes)

Siempre **icono + texto**, nunca solo color. El verde solo existe aquí.

| Estado | Sólido | Texto (sobre suave) | Suave | Ratio texto/suave |
|---|---|---|---|---|
| Éxito (Sana) | `#12803C` (blanco 5,0:1) | `#0B5A2A` | `#DFF6E5` | 7,4 |
| Advertencia (En tratamiento) | `#E8780A` | `#8A3B00` | `#FFEBD6` | 6,7 |
| Error (Enferma, Crítica) | `#C0182B` (blanco 6,1:1) | `#9B1220` | `#FDE3E6` | 6,9 |
| Información | `#1D5FB8` | `#123F7A` | `#E0EDFF` | 8,8 |
| Advertencia, tarjeta de contador (Alertas «Advertencias:») | `#B45309` (blanco 5,0:1; documentado y comprobado en la tabla del HTML) | n/a (texto blanco sobre el sólido) | n/a | n/a |

Salud del ave: Sana = `checkmark-circle`, En tratamiento = `medkit`, Enferma = `alert-circle`. Alertas: Crítica = `alert-circle`, Advertencia = `warning`, Informativa = `information-circle`. Finanzas: ingreso = éxito con `+` y `trending-up-outline`, egreso = error con `−` y `trending-down-outline`; el balance (texto real «Balance», `FinanzasScreen.js:381`) va en tarjeta de color de marca.

### 1.5 Resumen de contraste (peor punto)

| Par | V1 | V2 | V3 | Mínimo |
|---|---|---|---|---|
| Texto principal sobre blanco / sobre el peor fondo del degradado | 17,3 / 14,4 | 16,4 / 12,5 | 16,9 / 13,9 | 7 (sol) |
| Texto secundario sobre el peor fondo | 6,0 | 5,9 | 5,6 | 4,5 |
| Blanco sobre punto 1 / punto 2 del degradado (cabecera, botón) | 6,6 / 5,5 | 5,2 / 6,5 | 6,2 / 6,3 | 4,5 |
| Enlace (primario oscuro) sobre el peor fondo | 9,8 | 7,7 | 9,6 | 4,5 |
| Texto del botón flotante sobre su fondo | 5,2 | 6,8 | 7,2 | 4,5 |
| Borde de campo sobre blanco | 3,7 | 4,4 | 3,6 | 3 |
| Blanco sobre tarjetas de color 3 y 4 (V1 `#007782` / `#CC312A`; V2 `#C92E64`) | 5,3 / 5,2 | 5,2 (c4) | 5,0 (`#D4177A`, c3) | 4,5 |
| Blanco sobre `#B45309` (Alertas «Advertencias:») / `#C0182B` («Críticas:») / `#12803C` («Ingresos») | 5,0 / 6,2 / 5,0 | igual | igual | 4,5 |
| Botón deshabilitado: `#5F5B73` sobre `#E6E3EE` (antes `#6B6780`, 4,3) | 5,1 | 5,1 | 5,1 | 4,5 |

Holgura: ningún par de texto blanco queda por debajo de 5,0:1 (calculado a mano, ±0,1; el HTML recalcula y manda).

Regla (F1 y F4): los acentos claros (turquesa, rosa, naranja) nunca como color de texto; solo como fondo con texto oscuro o como forma decorativa. **Nunca hay texto sobre un adorno:** (a) en las tarjetas de métrica el círculo translúcido va **arriba a la derecha** (zona de 54x50 px sin texto) y se **elimina** en las de 3 columnas de Alertas y en la de Balance; (b) en las cabeceras los círculos viven en los 110 px de la derecha: el contenido de la cabecera lleva `paddingRight: 110` (excepto el Login, cuyo título va por debajo de los círculos) y los títulos llevan `numberOfLines={1}` (u 2 con `ellipsizeMode`); (c) los círculos tienen `pointerEvents="none"` y `accessibilityElementsHidden`.

---

## 2. Tipografía (común a las tres)

| Función | Fuente | Paquete exacto | Pesos usados |
|---|---|---|---|
| Títulos, botones y cifras grandes (redondeada, juguetona, con carácter) | **Fredoka** | `@expo-google-fonts/fredoka` | `Fredoka_600SemiBold`, `Fredoka_700Bold` |
| Cuerpo y etiquetas (redondeada, muy legible) | **Nunito** | `@expo-google-fonts/nunito` | `Nunito_400Regular`, `Nunito_600SemiBold`, `Nunito_700Bold` |

Alternativas si no gusta Fredoka: `@expo-google-fonts/baloo-2` (más suave) o `@expo-google-fonts/poppins` (geométrica, más seria). Cuerpo alternativo: `@expo-google-fonts/poppins` no, por menor legibilidad en tamaños pequeños; Nunito se mantiene.

**Datos verificados** (`npm view`, hecho por el orquestador, 2026-11-09): `@expo-google-fonts/fredoka` **0.4.1** (741 KB desempaquetado, con todos los pesos y la fuente variable) y `@expo-google-fonts/nunito` **0.4.2** (3,77 MB desempaquetado, con todos los pesos). Ambos nombres de paquete existen.

**Qué se empaqueta:** la app solo incluye los TTF que se importen. Se importan **por ruta profunda, un archivo por peso**, no desde el índice del paquete (el índice enlaza todos los pesos y Metro los empaquetaría):

```js
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Fredoka_700Bold }     from '@expo-google-fonts/fredoka/700Bold';
import { Nunito_400Regular }   from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold }  from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold }      from '@expo-google-fonts/nunito/700Bold';
```

(los nombres de las rutas y de las constantes se confirman al instalar en C1.) **Peso por archivo: ESTIMACIÓN** (cada TTF estático ronda 0,1 a 0,3 MB, total de los 5 del orden de **0,6 a 1,0 MB** en el APK) hasta instalarlos en C1: se medirá con `du` sobre los 5 archivos y se anotará en el informe de C1. Los 741 KB y 3,77 MB son del paquete completo en `node_modules`, no de la app.

Fallback: mientras cargan las fuentes se muestra la pantalla de carga con la mascota (no se pinta texto con otra fuente); si falla la carga, `fontFamily` queda como la del sistema (Roboto), con los mismos tamaños, sin romper el diseño. `tabular-nums` puede no aplicarse a fuentes propias en Android: las cifras grandes se alinean por contenedor, no dependen de ello.

Escala (tamaño / interlínea):

| Token | Fuente y peso | px | Uso |
|---|---|---|---|
| `cifra` | Fredoka 700 | 38 / 42 | Números grandes de tarjetas de métrica |
| `display` | Fredoka 700 | 30 / 36 | Título de Inicio y pantallas de acceso |
| `titulo` | Fredoka 600 | 24 / 30 | Título de pantalla y ficha |
| `subtitulo` | Fredoka 600 | 18 / 22 | Título de tarjeta y sección |
| `boton` | Fredoka 600 | 19 / 22 | Texto de botón |
| `cuerpo` | Nunito 400 | 16 / 23 | Texto general |
| `cuerpoFuerte` | Nunito 700 | 16 / 23 | Valores de datos |
| `etiqueta` | Nunito 700 | 14 / 18 | Etiquetas de campo, chips (13), pestañas (12,5) |
| `secundario` | Nunito 600 | 14 / 19 | Ayudas y subtítulos (mínimo 14) |

---

## 3. Fondos, cabeceras y barra inferior

| Pantalla | Fondo y cabecera |
|---|---|
| Login / Registro | Cabecera alta (Login) con degradado primario → secundario, mascota saltando (`hop`), dos círculos de acento en la esquina; tarjeta blanca de 28 px de radio que sube sobre la cabecera. Registro: cabecera más baja y mascota pequeña. |
| Inicio | Cabecera con degradado y esquinas inferiores de 34 px; debajo, fondo de tres puntos pastel, aviso de alertas, rejilla 2x2 de tarjetas de color con círculo blanco translúcido **arriba a la derecha** (sin texto encima), accesos rápidos en tarjetas blancas con círculo de color. |
| Listas (Aves, Jaulas, Alertas, Finanzas) | Cabecera de degradado más baja con título y subtítulo, filtro segmentado, tarjetas blancas con borde de 1 px (sin sombra por fila). **Jaulas: la franja lateral codifica el estado sanitario** como hoy (`JaulaCard.js:43`, `getJaulaSanitaryStatusStyle`: Normal éxito, Limpieza información, Fumigación advertencia, Cuarentena y Quemadura error), con chip icono + texto; no es un adorno rotativo. Aves: avatar de color. |
| Fichas (ave, jaula, cliente) | Cabecera con «Atrás» y miga tocables (área 44x44) y el título real («Ficha del ave», como fija el bloque A, no el código), avatar de 72 px en la tarjeta con borde blanco, chips; rejilla de acciones en mosaicos blancos con círculo de color. |
| Formularios | Cabecera baja, migas, secciones en tarjetas blancas, «Guardar» fijo en barra inferior con esquinas redondeadas y sombra (una de las 3 elevaciones permitidas, ver §8). |
| Barra inferior | Píldora blanca flotante (margen 12, radio 30, alto 72) con sombra; pestaña activa = cápsula de **color primario sólido** (sin degradado) y texto blanco; inactivas con icono y etiqueta en texto secundario; insignia roja de alertas en Más. |

Implementación: fondo = **un solo** `LinearGradient` diagonal con los tres puntos pastel como paradas (`expo-linear-gradient` solo hace lineales; el HTML ya lo muestra lineal). Con la cabecera suman **2 degradados por pantalla**; botón primario, filtro activo y pestaña activa son de color sólido (ver §8).

---

## 4. Componentes

Tokens (en `src/theme/`): radios `sm 10, md 16, lg 22, xl 28, pill 99`; botones y campos 54-58 px; margen de pantalla 16; sombras con tinte del color primario (opacidad 0,25-0,35) en lugar de negro, `elevation` 3-8, **solo** en tarjetas de resumen, botón flotante, barra inferior y barra fija de «Guardar» (ver §8). **Área táctil: mínimo 48 px; 44 px en elementos secundarios con `hitSlop`/`minWidth`+`minHeight` 44** (Atrás, migas, ojo de contraseña, engranaje de opciones, cerrar aviso); en C1 se crea un `Pressable` común que garantiza 44x44.

| Componente | Especificación |
|---|---|
| Botón primario | Alto 58, radio 20, **color primario sólido** (sin degradado ni sombra), texto Fredoka 600 19 blanco, icono opcional. Pulsado: escala 0,97 y brillo −12 %. Deshabilitado: fondo `#E6E3EE`, texto `#5F5B73` (5,1:1), borde punteado 2 px `#B9B4CC`, sin sombra, con texto de ayuda. |
| Botón secundario | Alto 52, blanco, borde 2,5 px primario, texto primario oscuro. |
| Botón terciario | Texto subrayado primario oscuro, alto 50. |
| Botón peligro | Alto 52, `error` sólido, texto blanco, `exit-outline`. |
| Botón flotante | Pill de 58 px, borde blanco 3 px (separa del fondo), fondo según variante (coral / rosa / naranja), sombra `flotante`, sobre la barra inferior. |
| Campo | Alto 54, radio 16, borde 2 px, etiqueta 14/700 visible, icono de color primario; foco: borde primario + halo del 22 %; error: borde rojo + icono + mensaje. |
| Tarjeta | Blanca, radio 22, **borde de 1 px suave, sin sombra**; con **franja** de color de 8 px que conserva su significado (jaula: estado sanitario; alerta: nivel) o círculo de icono. |
| Tarjeta de métrica (resumen) | Color sólido de la variante, texto blanco, cifra Fredoka 38; sombra con tinte (única tarjeta con sombra); círculo blanco translúcido decorativo **arriba a la derecha**, solo en la rejilla 2x2 y sin texto encima; sin círculo en las de 3 columnas (Alertas) ni en «Balance». |
| Chip de estado | Pill alto 28, icono 16 + texto 13/700, colores de la tabla 1.4. |
| Filtro segmentado | Contenedor 14 % primario, radio 20; opción activa de color primario sólido y texto blanco, alto 44. |
| Fila de lista | Mínimo 88, avatar 56 con borde blanco, código Fredoka 18, 2 líneas, chip y `chevron-forward`. |
| Aviso no bloqueante | Fondo suave, franja izquierda de 6 px del color de estado, icono + texto, cerrar con 44x44. **Solo sustituye al `Alert` de éxito**; los `Alert` de confirmación (mover un ave, dar de baja, eliminar, etc.) se conservan tal cual. Roza el proceso: hoy «Aceptar» dispara el `goBack`; con el aviso, la vuelta atrás ocurriría sola. DUDA PARA EL USUARIO: ¿se acepta (se ahorra 1 toque) o se mantiene el `Alert` de éxito? |
| Vacío | Mascota (96 px) con título Fredoka y la acción que toca; ver «Mascota» abajo. |
| Carga | Mascota saltando y dos barras-esqueleto del 14 % primario; con «reducir movimiento» queda quieta. |
| Error de red | Círculo rojo suave con `cloud-offline-outline`, mensaje de la API tal cual, botón «Reintentar». |

**Mascota:** un kikiriki dibujado (cuerpo redondo, cresta, ojo, pico, patas) con los colores de la variante (`m1`, `m2`, `m3`), en login, vacíos, carga y alertas sin pendientes. Se implementa sin librerías de ilustración: preferentemente con `react-native-svg` (viene en el SDK de Expo, pero **no está en `package.json`: requiere aprobación como dependencia extra**) o, sin ella, compuesta con `View` (círculos con `borderRadius`, pico con triángulo de bordes). DUDA PARA EL USUARIO: ¿apruebas `react-native-svg` solo para la mascota? Si no, se hace con `View` (algo más simple de forma).

---

## 5. Iconografía

Librería: Ionicons (`@expo/vector-icons`, ya instalada). Cada sección o acción se muestra dentro de un **círculo o cápsula de color** (colores `c1` a `c4` de la variante; icono blanco, o texto oscuro sobre el naranja/rosa claros). Estilo contorno; relleno solo en la pestaña activa.

Verificación en `node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json` (hecha el 2026-11-09, todos existen): `home`, `home-outline`, `grid`, `grid-outline`, `paw`, `paw-outline`, `cash`, `cash-outline`, `ellipsis-horizontal-circle`, `ellipsis-horizontal-circle-outline`, `notifications`, `notifications-outline`, `egg`, `egg-outline`, `water-outline`, `nutrition-outline`, `bandage-outline`, `medkit`, `medkit-outline`, `medical-outline`, `time-outline`, `leaf`, `leaf-outline`, `git-network-outline`, `skull-outline`, `exit-outline`, `cart-outline`, `trending-up-outline`, `trending-down-outline`, `bar-chart-outline`, `people-outline`, `person-circle-outline`, `settings-outline`, `male-outline`, `female-outline`, `camera-outline`, `images-outline`, `location-outline`, `pricetag-outline`, `call-outline`, `create-outline`, `trash-outline`, `save-outline`, `search-outline`, `options-outline`, `chevron-forward`, `chevron-back`, `chevron-down`, `add`, `add-circle`, `close`, `close-circle`, `checkmark`, `checkmark-circle`, `checkmark-circle-outline`, `alert-circle`, `alert-circle-outline`, `warning`, `information-circle`, `cloud-offline-outline`, `refresh-outline`, `eye-outline`, `eye-off-outline`, `mail-outline`, `lock-closed-outline`, `log-out-outline`, `share-outline`, `link-outline`, `archive-outline`, `resize-outline`, `sparkles-outline`, `document-text-outline`, `calendar-outline`, `trophy-outline`, `ribbon`, `receipt-outline`, `wallet-outline`, `flash-outline`, `sunny-outline`, `star-outline`, `heart-outline`, `happy-outline`, `sad-outline`. (`ruler-outline` NO existe: se usa `resize-outline`.)

La **tabla emoji → icono** completa (con las notas por archivo) es la de `propuesta-visual.md` sección 4 (vigente, no cambia con la variante; se reutiliza tal cual). Añadidos de esta propuesta: aviso informativo `information-circle`; nivel de alerta Informativa `information-circle`; mascota en lugar de `checkmark-circle` en «sin alertas» (el chip conserva el icono). Se mantienen sin cambio los `→` dentro de datos.

---

## 6. Microinteracciones (solo `Animated`/`Pressable`, sin dependencias)

- **Pulsación:** `Pressable` con `Animated.spring` a escala 0,97 (`useNativeDriver: true`); botones, tarjetas pulsables y pestañas. Costo mínimo.
- **Entrada de tarjetas:** `Animated.timing` de opacidad 0→1 y `translateY` 10→0 en 300 ms, escalonada 60 ms, **solo las 6 primeras** y solo en la primera aparición de la pantalla (no al reordenar ni recargar).
- **Mascota de carga:** un único `Animated.loop` de `translateY` con `useNativeDriver`; se detiene al terminar la carga.
- **Reducir movimiento:** `AccessibilityInfo.isReduceMotionEnabled()` + suscripción a `reduceMotionChanged`; si está activo, sin salto, sin entrada escalonada y la pulsación solo cambia el brillo. Un hook único `useAnimacionesReducidas` en `src/theme/`.
- Nada de animaciones dentro de `FlatList` por fila ni listas largas.

---

## 7. Accesibilidad

Táctil **mínimo 48 (44 en elementos secundarios con `hitSlop`)**: botones 52-58, campos 54, filas 88, pestañas 58; Atrás, migas, ojo de contraseña, engranaje de opciones y cerrar aviso tienen área pulsable de 44x44 (también en las maquetas y en la sección de componentes del HTML); contraste AA calculado también sobre fondos de color y peor punto del degradado (tablas 1.1 a 1.5), texto principal ≥ 7:1 en las tres para el sol; el color nunca es el único canal (chips y avisos con icono + texto, finanzas con `+`/`−`); `accessibilityRole`/`accessibilityLabel` en iconos que actúan solos; los emojis desaparecen (los lectores de pantalla los leían mal); `allowFontScaling` activo con tope `maxFontSizeMultiplier` 1,3 en cifras de tarjetas para que no se rompan.

---

## 8. Riesgos de rendimiento en gama baja y mitigación

| Riesgo | Mitigación |
|---|---|
| Degradados (`LinearGradient` nativo) | **Máximo 2 por pantalla: el fondo (un único `LinearGradient` con tres paradas) y la cabecera.** Botón primario, filtro activo y pestaña activa son de color sólido; filas y tarjetas, sólidas. En gama baja el fondo puede degradar a color liso. |
| Fuentes: carga al abrir | `useFonts` con 5 archivos (~0,6-1,0 MB, estimación hasta C1); pantalla de carga con la mascota (sin SplashScreen extra, sin dependencia); no se bloquea más de lo necesario. |
| Sombras (`elevation` y `shadow*`) | **Elevación solo en tarjetas de resumen (métricas), botón flotante y barras inferiores (pestañas y «Guardar» fijo).** Sin sombra por fila ni en tarjetas de listas largas (borde de 1 px) ni en botones. |
| Formas decorativas (`View` redondos grandes con opacidad) | Máx. 3 por pantalla, estáticas, sin `overflow` en listas; no animadas; nunca bajo texto (§1.5). |
| Fondos radiales del HTML | Eliminados: el HTML ya usa el mismo degradado lineal de tres paradas. |
| Medición | **Medir en emulador de gama baja al cerrar C1:** arranque con los 5 TTF, tiempo hasta la primera pantalla y fluidez al desplazar Aves con 50+ filas; si no cumple, degradado de fondo a color liso. Criterio de aceptación de C1. |
| Animaciones | Ver sección 6: nativas, limitadas y desactivables. |

---

## 9. Qué cambia respecto a hoy (resumen; el detalle está bajo cada maqueta)

Login, Registro, Inicio, Aves, Ficha del ave, Jaulas, Nueva ave, Alertas y Finanzas están maquetadas en las tres variantes con los **textos reales** de las pantallas: «Ingresar», «Código *», «Peso en gramos», «Altura/Largo en centímetros», «Origen del ave», «Nacida en criadero»/«Comprada», «Guardar ave», «Balance» (`FinanzasScreen.js:381`; no «Utilidad»), «Buscar por código...» (`AvesScreen.js:352`; no «Buscar ave»), «Registrar bebida →» con flecha (`AlertCard.js:63`), «Críticas:», «Advertencias:», «Total:» con dos puntos (`AlertasScreen.js:437`), y la ficha del ave con cabecera «Ficha del ave» y miga «Aves ›» como fija el bloque A. «N aves» en jaulas, sin barra de ocupación porque V1 no tiene capacidad.

**Textos nuevos (TEXTO NUEVO propuesto; no sustituyen a ninguno existente y el usuario puede rechazarlos uno a uno; en el HTML llevan la marca «(TEXTO NUEVO)»):**

| Texto | Dónde | Necesario |
|---|---|---|
| «Criadero Kikirikis» y lema «Control de aves, fácil» | Login (cabecera) | Lema opcional; sin él queda solo el nombre |
| «Accesos rápidos» | Inicio, sobre los 3 atajos | Sí (rotula la sección) |
| «3 alertas por atender» (el número es dato) | Aviso de Inicio | Sí si se muestra el aviso; sustituye a nada |
| «Tus aves registradas», «Tus jaulas del criadero», «Resumen del periodo» | Subtítulos de cabecera de Aves, Jaulas y Finanzas | **No**: decorativos; por defecto se omiten (subtítulo vacío) salvo que el usuario los pida |
| «Sin más pendientes: ¡todo al día!» | Vacío de Alertas | Sí (hoy «sin alertas» se muestra con otro texto, que se conserva si el usuario no aprueba) |
| «Aún no hay aves» y similares, «Cargando tus aves…», «No se pudo conectar» (mensaje de la API tal cual si existe), «Reintentar» | Estados vacío, carga y error | Sí (estados nuevos) |

Los datos de las maquetas (K001, cifras) son ejemplos de la vista previa.

Observación (sin cambiar): `AlertasScreen` e `InicioScreen` repiten la lógica de contadores.

---

## 10. Flujos Maestro afectados (no se editan aquí; actualizar aparte)

Lista de `propuesta-visual.md`, vigente y ampliada tras revisar `pruebas/movil/flujos/`:

- `99-alertas.yaml:29` busca `.*🔔 3.*` (el emoji pasa a icono; el contador pasa a «3» en un contador de color).
- `60-salud-enfermedad.yaml:36` busca `.*🔴 Coriza.*` (el emoji pasa a icono).
- Anclados al final: `.*Vendidas`, `.*Fallecidas`, `.*Activas` en `90-baja-venta.yaml:74`, `91-baja-muerte.yaml:45`, `98-clientes.yaml:62,67,107` (sin emoji siguen valiendo; revisar anclaje).
- `94-inicio.yaml:30-31`: textos exactos «Vendidas» y «Fallecidas» (el icono no va dentro del texto; en la tarjeta de color el rótulo es un `Text` aparte, como hoy).
- `99-alertas.yaml:68`: `assertNotVisible` de `.*Guardar.*`; con «Guardar» fijo siempre visible en formularios hay que revisarlo.
- **Añadidos tras la validación:**
  - `82`, `83`, `85` dependen de `visible: "Ficha del ave"` (y de su `assertNotVisible`); `82:39` toca una miga por índice. Se conserva el título «Ficha del ave» y las migas del bloque A (en la maqueta ya se muestra así); no mostrar el código del ave como título.
  - `.*Guardar` anclados con `assertNotVisible`: `50:25`, `51:25`, `83:32`, `86:29,57` (anclados) y `82:38,50`, `84:43,54`, `85:51`, `86:35,64` (de «Guardar diagnóstico», «Guardar movimiento», «Guardar»). Con el «Guardar» fijo siempre visible hay que revisar los flujos **50, 51, 82, 83, 84, 85 y 86**: el botón debe existir solo en su pantalla y conservar su texto.
  - `40-aves.yaml:33` `.*Macho` (vale si el chip sigue diciendo «Macho»).
  - Textos que se conservan por decisión de esta revisión: «Balance», «Buscar por código...», «Críticas:», «Registrar bebida →»: no rompen flujos.
  - Emojis en flujos: solo `60-salud-enfermedad.yaml:36` y `99-alertas.yaml:29`.
- NUEVO en v2: el Login añade «Criadero Kikirikis» y «Control de aves, fácil» visibles; grep de `Criadero Kikirikis`, `Control de aves`, `Accesos rápidos` e `Iniciar sesión` en los flujos: solo `smoke/01-smoke.yaml:40` busca «Iniciar sesión» (se conserva); ninguno busca los textos nuevos, pero un flujo que esperara «Criadero Kikirikis» para confirmar Inicio podría coincidir con el Login (no existe hoy).
- Cabecera con degradado: si un flujo usa `scrollUntilVisible` o `swipe` por coordenadas, la cabecera más alta cambia las posiciones (revisar `94-inicio.yaml`, ya frágil por el scroll).
- Se conservan `placeholder` («correo@ejemplo.com», «Contraseña», «Tu nombre», «Ej. K001», «Ej. 850», «Ej. 24.5», «Ej. 31») y los `testID` existentes.

---

## 11. Plan de sub-bloques C1 a C6

Un sub-bloque por vez, informe corto (≤ 25 líneas), visto bueno del usuario y compilación entre sub-bloques (nube y SQLite). Todo se registra en `documents/ux/inventario-cambios.md`.

| Sub-bloque | Contenido |
|---|---|
| C1 | Tema de la variante elegida (`src/theme/`: colores, fuentes, escala, radios, sombras, hook de movimiento reducido), carga de fuentes en `App.js` (lo estrictamente necesario), componentes comunes (botón con degradado, tarjeta, chip, campo, aviso, avatar, mascota, vacío/carga/error) aplicados a `Header`, migas, barra inferior flotante con insignia y botón flotante. |
| C2 | Login, Registro, Selección de criadero y Onboarding. |
| C3 | Inicio y Alertas (más accesos rápidos sin «Registrar huevo»). |
| C4 | Aves (lista, ficha, Nueva ave con «Guardar» fijo) y Jaulas. |
| C5 | Salud, Huevos, Genealogía, Ciclo de vida y Bajas. |
| C6 | Finanzas, Clientes, Reportes, Configuración, Catálogos y Más. |

### Tareas para instalar dependencias (las hace la sesión principal, con aprobación; no se toca `package.json` desde aquí)

1. Con Node 22, desde la raíz: `npx expo install expo-font expo-linear-gradient`. En el registro npm figuran `expo-font` 58.x y `expo-linear-gradient` 58.x (verificado por el orquestador): **no se instalan con `npm install`**, sino con `npx expo install`, que elige la versión de SDK 57 compatible con Expo ~57.0.23 (`expo-font` ya existe como transitiva en `node_modules` pero no está declarada).
2. `npm install @expo-google-fonts/fredoka@0.4.1 @expo-google-fonts/nunito@0.4.2` (o las alternativas elegidas) e importar por ruta profunda los 5 pesos de §2.
3. Solo si se aprueba la mascota con SVG: `npx expo install react-native-svg`.
4. Medir el tamaño real de los 5 archivos TTF usados y el arranque en el emulador de gama baja (criterio de aceptación de C1, §8); anotarlo en el informe de C1.
5. Reiniciar Expo con `--clear`; probar en el emulador y en el teléfono (Expo Go incluye `expo-font` y `expo-linear-gradient`; no hace falta nuevo APK si se usa Expo Go).
6. Revisar que ningún módulo de `src/api/`, `src/repositories/` ni `src/database/` cambie (solo `src/theme`, `src/components`, `src/screens`, `src/navigation`, `App.js`).

---

## 11b. Toques antes y después de las mejoras nuevas (5 tareas)

Fuente del «antes»: `toques-antes.md` (códigos de tarea de allí). Convención de ese documento (un toque = una pulsación; el «Aceptar» de un `Alert` cuenta). Mejoras: **botón flotante (FAB)**, **«Guardar» fijo** y **accesos rápidos de Inicio** (Nueva ave, Nuevo movimiento, Alertas; sin «Registrar huevo»). La última columna suma además el aviso no bloqueante en lugar del `Alert` de éxito (quita el «Aceptar»; roza el proceso, ver §4).

| Tarea | Antes | FAB + Guardar fijo + accesos rápidos | + aviso (sin «Aceptar») | Qué explica la diferencia |
|---|---|---|---|---|
| 3a Crear jaula (Jaulas, Nueva jaula, Código, Guardar, Aceptar) | 5 | 5 | 4 | El FAB «Nueva jaula» reemplaza al botón «＋ Nueva jaula» (1 toque en ambos): no ahorra toques, solo lo hace visible; «Guardar» fijo no ahorra toques |
| 5 Registrar ave y asignar jaula (Aves, Nueva ave, Código, Raza, Sexo, Jaula, Guardar, Ver ave) | 8 | 7 (desde Inicio: acceso «Nueva ave» sustituye a Aves + Nueva ave) | 7 | «Ver ave» es la acción del `Alert` actual y se conserva; «Guardar» fijo evita buscar el botón al final del formulario largo, sin cambiar los toques |
| 10b Registrar ingreso (Finanzas, Nuevo movimiento, Categoría, Valor, Guardar, Aceptar) | 6 | 5 (desde Inicio: «Nuevo movimiento») | 4 | El acceso rápido sustituye a Finanzas + Nuevo movimiento |
| 10c Registrar egreso (10b + chip «Egreso») | 7 | 6 | 5 | Igual que 10b |
| 13 Alertas: abrir y llegar a un elemento (Más, Alertas, tocar alerta) | 3 | 2 (acceso «Alertas» de Inicio, o el propio aviso de Inicio) | 2 | Sin Más; no hay «Aceptar» en esta tarea |

Notas: (1) `toques-antes.md` estimaba 7b (producción) en +1 y 12 (reportes) en 2 «con atajo en Inicio»; esos atajos **no** están entre los tres accesos rápidos, así que 7b sigue en 7 y 12 en 3. (2) Los toques de desplazamiento (scroll) no se cuentan; el «Guardar» fijo no los reduce pero evita el último. (3) Cifras calculadas sobre el código leído, sin medir en teléfono.

---

## 12. Elegir variante

| Criterio | 1 Pajarera tropical | 2 Atardecer andino | 3 Fiesta de colores |
|---|---|---|---|
| Alegría y cambio visible | Muy alto | Alto, más cálido | Máximo |
| Relación con el negocio | Aves tropicales, plumaje | Machachi y los Andes | Neutra (juvenil) |
| Riesgo de saturar | Medio | Bajo | Alto |
| Texto a pleno sol | 14,4:1 peor punto | 12,5:1 | 13,9:1 |
| Botón flotante | Coral | Rosa | Naranja |

**Recomendación: 1 «Pajarera tropical»** (alegre sin cansar, la mascota turquesa resalta, coral y turquesa son complementarios). Se pueden mezclar tokens (p. ej. fondos de la 2 con cabecera de la 1).

DUDA PARA EL USUARIO: (1) ¿variante elegida? (2) ¿se aprueba `react-native-svg` para la mascota o se hace con `View`? (3) ¿se acepta Fredoka + Nunito o prefieres Baloo 2 / Poppins? (4) El texto nuevo «Control de aves, fácil» en Login, ¿se acepta como lema?
