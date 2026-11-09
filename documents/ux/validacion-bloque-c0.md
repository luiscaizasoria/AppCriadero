# Validación del bloque C0 (base del tema) - 2026-11-09

Veredicto: **APROBADO** (con 2 observaciones menores para C1+, no bloqueantes).

## 1. No-regresión (git status / diff / grep)
- `git status`: solo `documents/ux/inventario-cambios.md` modificado (+1 línea, fila C0) y archivos nuevos en `src/theme/` y `src/components/` (10). No hay cambios en `src/api`, `src/repositories`, `api/`, migraciones, `package.json`, pantallas, navegadores ni `App.js`.
- Grep de `theme` y de los 10 componentes en `src/` y `App.js`: solo los importan los propios archivos nuevos (11 coincidencias, todas en `theme/index.js` y los componentes nuevos). `App.js` sin coincidencias. Ningún archivo existente los usa: sin cambio visible.
- `@expo/vector-icons ^15.0.2` ya figura en `package.json:6` (sin dependencia nueva).

## 2. Tokens frente a Opción A (`propuesta.md:59-72, 77`)
- `colors.js:5-23` coincide hex a hex (primary, primaryDark, primarySoft, background, surface, surfaceAlt, text, textSecondary, border, success/Soft, danger/Soft, warning/Soft/Text, info, accent/Text). Extras no listados en la propuesta: kinship `#7b5ea7`, overlay, white (aceptables).
- `typography.js:3-10`: display 26/700, titulo 22/700, tituloTarjeta 17/600, cuerpo 15, secundario y micro 13 (mínimo), cifra 28/700; interlineado ~1,3. Coincide.
- `spacing.js:9`: `touch: 48`. Coincide.
- Contraste (calculado a mano con la fórmula WCAG; node bloqueado por el guardia): blanco/primaryDark 5,9; primaryDark/primarySoft 5,3; blanco/danger 6,6; danger/dangerSoft 5,7; success/successSoft 5,7; warningText/warningSoft 8,0; accentText/accent 6,7; text/surfaceAlt 11; textSecondary sobre background 5,5, sobre blanco 5,8, sobre primarySoft 5,2; info/blanco 5,1; info/primarySoft 4,55 (margen mínimo, `Insignia` tono `info`). Todos los pares usados ≥ 4,5:1.
- Texto sobre fondo claro usa primaryDark/text/textSecondary; `primary` (#3d8b8b, 4,0:1) solo en iconos de 48 px (`EstadoVacio.js:18`). Correcto.

## 3. Glifos Ionicons
- `icons.js:4-50` define 47 glifos; el grep sobre `Ionicons.json` instalado devuelve 47 coincidencias para los 47 nombres: todos existen. `Icono.js:16` además acepta un glifo directo como respaldo.

## 4. Accesibilidad de componentes
- `Boton`: role button, label = título, estado disabled/busy, `minHeight` 48, `testID`. Bien.
- `Aviso`: live region, texto además del icono y del color, botón cerrar 48x48 con label. `CampoTexto`: label, error con texto + borde (no solo color), live region, `minHeight` 48. `EstadoCarga` (progressbar + label), `EstadoError` (role alert, texto + icono). `Insignia`: el estado va en texto. `Icono`: decorativo oculto salvo label. `Tarjeta`: role button si es tocable.

## Observaciones (no bloquean C0)
1. `PantallaHeader.js:42` `migaToque.minHeight: 32` < 44/48: debe subirse a 44 como mínimo antes de usarlo (criterio táctil).
2. `PantallaHeader.js:12` pone `accessibilityRole="header"` en el contenedor de migas y otra vez en el título (`:31`): duplicado; dejarlo solo en el título. `Tarjeta` táctil sin `accessibilityLabel` por defecto: pasar siempre uno en C1+. `Insignia` tono `info` roza 4,5:1.
- No hay flujos Maestro afectados (sin cambios de texto visible). Pendiente de verificar en emulador: que `Ionicons` cargue la fuente en Expo Go (se hará con `/probar smoke`).
