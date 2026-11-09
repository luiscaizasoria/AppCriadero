# Validación de la propuesta visual v2 (2026-11-09)

Alcance: `propuesta-visual-v2.md` y `muestrario-visual-v2.html`. Solo lectura; no se tocó `src/` ni los flujos. **Veredicto: CAMBIOS REQUERIDOS** (ningún proceso cambia; no hay motivo de rechazo).

Método: `node` y la asignación de variables en Bash están bloqueados por el guardia, así que los contrastes se recalcularon **a mano** (luminancia relativa WCAG, ±0,1) y se compararon con la fórmula del script del HTML (correcta: umbral 0,03928, coeficientes 0,2126/0,7152/0,0722).

## 1. Contraste (recalculado)

Cumplen y coinciden con el documento (±0,1): texto principal sobre blanco 17,3 / 16,4 / 16,9 y sobre el peor fondo 14,4 / 12,5 / 13,9 (≥7); secundario sobre el peor fondo 6,0 / 5,9 / 5,6; blanco sobre primario/secundario V1 6,55 / 5,49, V2 5,18 / 6,53, V3 6,19 / 5,00 (V3: #D4177A) y 6,34 (#7A2FE0); enlace 9,8 / 7,7 / 9,6; botón flotante V1 4,74 (blanco sobre #D6362E), V2 6,8, V3 7,15; bordes de campo 3,66 / 4,39 / 3,61 (≥3); tarjetas blanco sobre #00808C 4,70, #D6336C 4,62, #12803C 5,02, #C0182B 6,16; chips de estado 7,36 / 6,69 / 6,92 / 8,78.

Fallos y huecos (con valores):
- **F1. Círculo decorativo translúcido de la tarjeta de métrica (`.mt:after`, blanco 20 %) bajo texto blanco en la rejilla de 3 columnas de Alertas** (`HTML:88, 315-317`). El rótulo de 13 px («Advertencias», «Críticas») invade el círculo. Contraste sobre el fondo ya mezclado: «Advertencias» #B45309 pasa de 5,02 a 3,54; V1 «Total» #6D3BD2 4,33; V2 #C2410C 3,73; V3 #2B50E6 4,17; «Críticas» #C0182B 4,56 (límite). Contradice «nunca hay texto sobre un adorno» (`HTML:145`). En la rejilla 2x2 de Inicio no solapa, pero con fuente escalada o rótulos largos sí podría hacerlo (V1 #00808C mezclado: 3,37; V1 coral: 3,59).
- **F2. Botón deshabilitado** `#6B6780` sobre `#E6E3EE` = 4,28 (<4,5; WCAG exime a los deshabilitados, pero el documento afirma cumplir 4,5). Subir el texto a ≤ `#5F5B73`.
- **F3. Colores sin documentar ni comprobar:** `#B45309` (tarjeta «Advertencias», `HTML:316`) no está en las paletas ni en la tabla del HTML; la tabla del HTML no cubre F1, el botón deshabilitado ni el texto del chip `nt` (primario al 14 %).
- **F4. Cabecera:** los círculos decorativos `a1/a2` (turquesa #19C3C9, rosa #FF7BAC, naranja #FF8A1F) dan 2,1 a 2,4:1 con texto blanco; hoy no solapan (título ≤ 250 px) pero con títulos largos o fuente grande sí. Limitar el título con `numberOfLines` y margen derecho reservado (≥ 110 px).
- Márgenes estrechos (4,6 a 4,8) en coral #D6362E, #D6336C y #00808C con texto de 14 px: sin holgura para el sol; aceptables, pero conviene oscurecerlos ~5 % si se elige V1 o V2.

## 2. Tamaños táctiles
Cumplen en el HTML: botones 58/52/50/48, campos 54, pestañas 62x58, FAB 58, filtro segmentado 44, filas 88. **Incumplen en las maquetas** (el documento §7 promete 44 con `hitSlop`, pero no lo muestra): botón «Atrás» de la cabecera (texto 14 px, `HTML:290`), migas (13 px sin relleno, `HTML:242`), ojo de contraseña (22 px, `HTML:255`), engranaje de opciones (20 px, `HTML:286`) y «cerrar» del aviso (22 px, `HTML:399`). Exigir en C1 un componente `Pressable` con mínimo 44x44 para todos. Incoherencia interna: §7 dice «mínimo 48» y luego admite 44.

## 3. Ningún proceso cambia
- Confirmado: «Registrar huevo» **no** está en los accesos rápidos de Inicio (solo Nueva ave, Nuevo movimiento, Alertas; `HTML:275-277`); sí está, como hoy, en la ficha del ave (`DetalleAveScreen.js:965`). No se inventa capacidad de jaula (`JaulaCard.js` solo muestra `cantidadAves`). Existe el texto real «Ingresar»/«Crear una cuenta» (`LoginScreen.js:147,158`), «Código *», «Peso en gramos», «Altura/Largo en centímetros», «Origen del ave», «Nacida en criadero», «Comprada» y «Guardar ave».
- Clasificación de mejoras de toques: **solo-UX:** accesos rápidos de Inicio (atajos a pantallas existentes), «Guardar» fijo, insignia de alertas en Más (Más ya consulta alertas), «Ver ave» directo, migas, rejilla de acciones de la ficha. **Roza el proceso:** alta rápida en catálogos (nueva escritura desde un formulario), Respaldo oculto en modo API (oculta una función), aviso no bloqueante en lugar de `Alert` (si el aviso sustituye a un `Alert` que bloquea la confirmación, p. ej. al mover un ave o dar de baja, cambia la secuencia: conservar los `Alert` de confirmación) y «Reintentar» (nueva llamada a repositorio; debe reutilizar la misma función). La propuesta no trae tabla de toques antes/después de las 15 tareas: se pide en C1.
- Discrepancias de texto/datos de las maquetas con las pantallas reales (corregir la maqueta o inventariarlas): «Utilidad» (maqueta) frente a «Balance» (`FinanzasScreen.js:381`); «Buscar ave» frente a «Buscar por código...» (`AvesScreen.js:352`); «Registrar bebida →» real (`AlertCard.js:63`) frente a «Registrar bebida» sin flecha; rótulos de Alertas con dos puntos («Críticas:», `AlertasScreen.js:437`); cabecera de la ficha mostrando «K002» y «Atrás» sin migas, cuando el bloque A fija el título «Ficha del ave» y migas (flujos 82, 83, 85 lo exigen); Inicio real tiene más bloques (distribución por raza, finanzas, `InicioScreen.js:365`) que la maqueta, que no los muestra; textos nuevos no listados en §9: «Tus aves registradas», «Tus jaulas del criadero», «Resumen del periodo», «3 alertas por atender», «Sin más pendientes: ¡todo al día!», «Cargando tus aves…». La franja lateral de la tarjeta de jaula hoy codifica el estado sanitario (`JaulaCard.js:43`); la maqueta la usa como color decorativo rotativo: debe conservar el significado o se pierde información.

## 4. Glifos Ionicons
Comprobado con grep en `Ionicons.json`: existen los 85 nombres de la lista del documento; `ruler-outline` NO existe (ya declarado; usar `resize-outline`). El HTML no usa Ionicons sino SVG propios aproximados (no hay nombres que comparar); su tabla «Iconos» lista 24 conceptos, todos cubiertos por la lista del documento (`skull`→`skull-outline`, `tree`→`git-network-outline`, `med`→`medkit`, `gear`→`options-outline`/`settings-outline`).

## 5. Fuentes y dependencias
- `node_modules/@expo-google-fonts` **no existe**: no se pudo verificar nombres de paquete ni pesos. Los nombres `@expo-google-fonts/fredoka` y `@expo-google-fonts/nunito` y los pesos 400/600/700 son los esperables, pero **sin comprobar** (hacerlo en C1 con `npm view` o al instalar). Nótese que el HTML solicita Fredoka 500;600;700, y la propuesta solo usa 600 y 700 (coherente).
- Ya en `package.json`: solo `@expo/vector-icons`. `expo-font` está en `node_modules` como transitiva pero **no declarada**. `expo-linear-gradient`, `react-native-svg` y `@expo-google-fonts/*` **no están** (ni en `package.json` ni en `node_modules`): tres dependencias nuevas más las fuentes (la propuesta lo declara con exactitud).

## 6. HTML
Los únicos recursos externos son 3 líneas de Google Fonts (`preconnect` x2 y la hoja CSS, `HTML:10-12`); sin otros `http`. Fallback correcto (`--fh`: Fredoka, Baloo 2, Trebuchet MS...; `--fb`: Nunito, Segoe UI...). Script en línea, sin `eval`, sin red, sin `innerHTML` con datos externos (solo plantillas propias); orden de definición correcto (`P.nutrition` se añade antes de `render()`); usa los ids globales `selV`, `phones`, etc. (funciona en navegadores, frágil pero inofensivo). `prefers-reduced-motion` respetado. Sin hallazgos de seguridad.

## 7. Rendimiento en gama baja
La mitigación es en parte irreal: «máx. 3 degradados por pantalla» choca con la propia maqueta (Aves: fondo + cabecera + filtro activo + pestaña activa = 4; Nueva ave: fondo + cabecera + botón + pestaña); el fondo «tres LinearGradient» ya consume el tope por sí solo. Pedir: fondo = **un** solo `LinearGradient` (o color liso en gama baja), botón y pestaña activa con color liso o degradado limitado a la cabecera y el botón principal. Sombras: la maqueta pone sombra a toda tarjeta, contra la regla «sin sombra por fila»; en listas largas usar borde de 1 px. Añadir medida real en emulador de gama baja como criterio de aceptación de C1 (arranque con 5 TTF y tiempo de primera pantalla). `Animated` nativo y reducción de movimiento: realista.

## 8. Flujos Maestro afectados (lista del documento incompleta)
Confirmados por grep: emojis en flujos solo en `60-salud-enfermedad.yaml:36` y `99-alertas.yaml:29`. **Faltan en §10:**
- `82`, `83`, `85` (`visible: "Ficha del ave"`, también `assertNotVisible`) y `82:39` (miga por índice): se rompen si la cabecera de la ficha pasa a mostrar «K002»; mantener el título «Ficha del ave» y las migas.
- Todos los `.*Guardar...` anclados (`50:25`, `51:25`, `83:32`, `86:29,57`) y los `assertNotVisible` de `Guardar diagnóstico`/`Guardar movimiento`/`Guardar` (`82:38,50`, `84:43,54`, `85:51`, `86:35,64`): con el botón fijo siempre visible hay que revisar que solo exista en su pantalla.
- `40-aves.yaml:33` `.*Macho` (el chip con icono sigue valiendo si el texto queda «Macho»).
- Textos de la ficha/Alertas que cambian: «Balance»→«Utilidad» si se aplica la maqueta; «Críticas:»; «Buscar por código...» (placeholder).
Pendiente de revisar al implementar (no cambia hoy): `94-inicio.yaml` y el `scrollUntilVisible` con la cabecera más alta.

## Lista corta de cambios requeridos
1. Eliminar o desplazar el círculo `.mt:after` del texto en tarjetas (F1) y añadir esos pares a la tabla del HTML.
2. Texto del botón deshabilitado ≥ 4,5 (F2); documentar `#B45309` y los pares de F3.
3. Componente táctil de 44x44 para Atrás, migas, ojo, opciones y cerrar; unificar «44» frente a «48».
4. Corregir la maqueta a los textos reales (Balance, Buscar por código, flecha de «Registrar bebida», título «Ficha del ave» con migas) y completar §9 con los textos nuevos.
5. Conservar el significado de la franja de la jaula (estado sanitario) y los `Alert` de confirmación; marcar como «roza el proceso» las cuatro mejoras listadas y exigir tabla de toques antes/después.
6. Reescribir §8 con degradados realistas (≤ 2 por pantalla, fondo único) y criterio de medida en gama baja; ampliar §10 con los flujos 82-86, 50, 51 y 94.
7. Verificar en C1 los paquetes de fuentes (no instalados) y decidir `react-native-svg`.

DUDA PARA EL USUARIO: ¿se acepta mostrar «Utilidad» en lugar de «Balance» y «Buscar ave» en lugar de «Buscar por código...» (cambio de texto visible, no de proceso), o se conservan los textos de hoy?

---

# Segunda revisión (2026-11-09)

Método: lectura del documento y del HTML (`grep` de hex y textos) y contrastes recalculados a mano (±0,1). **Veredicto: CAMBIOS REQUERIDOS (menores, solo de coherencia; ningún proceso cambia).**

## Resuelto (verificado con evidencia)
- **F1:** `.mt:after` ahora arriba a la derecha (visible 54x50 px, `HTML:97`); `.mt.nc:after{display:none}` (`HTML:98`) aplicado a las 3 tarjetas de Alertas (`HTML:327-329`) y a Balance (`HTML:339`). En Inicio y Finanzas (2x2) el rótulo queda a la izquierda de x = ancho-54: sin solape.
- **F2:** `#5F5B73` sobre `#E6E3EE` = 5,14 (`HTML:83,387`; documento §1.5 y §4).
- **F3:** `#B45309` documentado (§1.4) y en la tabla del HTML (`HTML:384`); la tabla añade botón deshabilitado, cabecera, «Críticas:», «Ingresos» y chip neutro.
- **F4:** `.hd` con `padding-right:110px` (`HTML:49`), Login `.hd.big` con título bajo los círculos (`HTML:55`); `numberOfLines` y `pointerEvents` en §1.5.
- **Táctil:** `.t44` 44x44 en Atrás, migas (`crumb`, `HTML:252`), ojo (`HTML:265`) y engranaje (`HTML:296`); §4/§7 unificados («48; 44 en secundarios»).
- **Textos reales:** Balance (`HTML:339`), «Buscar por código...» (`HTML:296`), «Registrar bebida →» (`HTML:331`), «Críticas:/Advertencias:/Total:», «Ficha del ave» + miga «Aves ›» (`HTML:300`). Ya no aparecen «Utilidad» ni «Buscar ave».
- **Franja de jaula:** codifica estado sanitario con chip icono+texto (`HTML:308-310`, §3 y §4). **Alert de confirmación:** conservado, solo el de éxito se sustituye (§4, con DUDA al usuario). **Degradados:** 2 por pantalla (`HTML:43` y `49`; botón, filtro y pestaña sólidos; el `radial-gradient` de `HTML:129` es de los paneles de documentación, no de las maquetas).
- **§10:** incluye 82, 83, 85, los `.*Guardar` anclados de 50, 51, 82-86, `40:33`, emojis solo en `60:36` y `99:29`, y `94`. **§11b:** tabla antes/después de 5 tareas con las 3 mejoras y el aviso, con notas (7b y 12 no cambian). **Fuentes:** versiones verificadas (fredoka 0.4.1, nunito 0.4.2), importación por ruta profunda y peso por archivo marcado como estimación.

## Contrastes recalculados (blanco salvo indicación)
`#5F5B73`/`#E6E3EE` 5,14; `#CC312A` 5,20; `#C92E64` 5,17; `#007782` 5,30; `#B45309` 5,02; cabecera V1 peor punto `#C2188F` 5,49 y V2 `#C2410C` 5,18 (el degradado lineal no baja de su extremo más claro). Todos coinciden con el documento y con la tabla del HTML; holgura ≥ 5,0 como afirma §1.5.

## Consistencia de hex
`#CC312A`, `#C92E64`, `#007782`, `#B45309` y `#5F5B73` coinciden entre las tablas por variante, §1.5 y el HTML (`HTML:83,174-187`). Los hex antiguos (`#D6362E`, `#D6336C`, `#00808C`, `#6B6780`) solo aparecen como «antes» en el documento y no están en el HTML.

## Regresiones: ninguna grave
Enlaces externos solo los 3 de Google Fonts (`HTML:10-12`); sin glifos nuevos (la lista Ionicons no cambió; `ruler-outline` sigue excluido).

## Cambios requeridos (menores)
1. `HTML:300`: la miga «Aves ›» de la ficha es un `div.sub`, no `.t44`; la nota (`HTML:299`) y §3 dicen «tocables 44x44». Usar `.t44` o `crumb`.
2. Rótulos obsoletos: `HTML:373-375` y `HTML:400` hablan de «botón» con degradado (el botón ya es sólido); cambiar a «cabecera».
3. Aviso: el Alert de éxito aún está sin decidir (DUDA PARA EL USUARIO ya registrada en §4); no bloquea.
