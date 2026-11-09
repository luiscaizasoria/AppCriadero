# Validación de la propuesta visual (C1 a C6)

Fecha: 2026-11-09. Revisado: `documents/ux/propuesta-visual.md` y `documents/ux/muestrario-visual.html`. Solo propuesta; no se tocó `src/` ni los flujos. Veredicto: **CAMBIOS REQUERIDOS** (ningún proceso cambia, pero hay un dato inventado y errores de texto en el muestrario).

## 1. Contrastes (recalculados a mano; `node` está bloqueado por el guardia, fórmula WCAG de luminancia relativa, precisión ±0,1)

Los 14 pares declarados por variante coinciden con la propuesta. Diferencias menores (no fallan): B texto principal/blanco = 16,1 (doc 15,9); B texto secundario/alterna = 6,0 (doc 5,6); B secundario/blanco = 5,0.

| Par | A | B | Resultado |
|---|---|---|---|
| Texto principal / fondo | 13,8 | 14,9 | AAA |
| Texto principal / blanco | 14,9 | 16,1 | AAA |
| Texto secundario / fondo | 6,1 | 6,65 | AA |
| Texto secundario / alterna | 5,4 | 6,0 | AA |
| Blanco / primario | 6,4 | 7,4 | AA / AAA |
| Blanco / primario oscuro | 9,7 | 11,6 | AAA |
| Texto principal / acento | 8,2 | 6,1 | AAA / AA |
| Secundario (texto) / blanco | 5,0 | 5,0 | AA |
| okt/oks, wnt/wns, ert/ers, int/ins | 7,25 / 7,3 / 7,75 / 8,75 | igual | AAA |
| Blanco / error | 6,5 | 6,5 | AA |
| Borde de campo / blanco | 3,3 | 3,25 | AA componentes |

Ningún par declarado falla. Fallos o riesgos no declarados:
- Acento como forma sobre blanco/fondo: A 1,8:1 (FAB y barra «hoy» de Inicio sobre blanco) y B 2,65:1; incumple 3:1 de componentes gráficos. El FAB se salva por su texto (≥6:1) y la sombra; añadir borde `primarioOscuro` de 1-2 px o sombra fuerte. Barra «hoy» en Inicio: no depender solo del color.
- Texto deshabilitado `#7B8077` sobre alterna: 3,3:1 (propuesta lo declara permitido; aceptable).
- Gráfico de Finanzas: barras verde/rojo sin etiqueta ni leyenda (`muestrario-visual.html:317`): depende solo del color. Añadir leyenda con icono `trending-up/down` o valores sobre la barra.
- Subtítulo de cabecera con `opacity .88` y lema del Login con `.9` sobre degradado: >5,5:1 estimado, correcto.

## 2. Tamaños táctiles en el muestrario (CSS)

Cumplen: botones 56/52/48 (`.btn`, líneas 77-84), campos 52 (`.inp:90`), pestañas 68 alto y ~74 ancho (`.tabs:56`), segmentado 44 (`.seg div:103`), atrás 44x44 (`.hdr .bk:64`), filas 88, accesos 56/88, FAB 56, tarjetas de origen ≥90.
No cumplen o dudosos:
- `.aviso .x` (cerrar aviso): icono de 20 px sin área de 44 (`:120`, uso `:367`). Requiere `hitSlop` o zona 44x44.
- Ojo para ver contraseña: la propuesta lo promete (§5) y el HTML define `i-eye` pero no lo usa; en la app debe tener zona 44x44.
- Migas (`.crumb`, ~22 px de alto): si son pulsables en la app, no llegan a 44 px; si son solo texto, correcto. Confirmar con `src/components` (no hay `Migas.js`; no se verificó).
- Chips de estado 28 px: aceptable porque son informativos, no pulsables; los filtros pulsables usan el segmentado de 44.

## 3. Reducción de toques: clasificación

| Propuesta | Aprobada / nueva | Clase |
|---|---|---|
| Aviso no bloqueante en lugar de `Alert` | aprobada | Roza el proceso (cambia el mecanismo de mensajes; mismo mensaje y misma validación). Conservar texto de error; los flujos que hoy buscan el `Alert` deben actualizarse |
| «Ver ave» directo tras crear | aprobada | Roza el proceso (navegación tras guardar) |
| Alta rápida en catálogos desde el selector | aprobada | Roza el proceso (nueva escritura a catálogos desde otra pantalla) |
| Ocultar Respaldo en modo API | aprobada | Solo-UX (visibilidad; no toca `BackupRepository`) |
| FAB (Nueva ave, Nueva jaula, Nuevo movimiento) | nueva | Solo-UX (misma navegación). Cuidar que no tape el último elemento de la lista (relleno inferior) |
| «Guardar» fijo en formularios | nueva | Solo-UX si llama a la misma función y respeta el teclado; roza si cambia `disabled`/doble toque |
| Accesos rápidos de Inicio | nueva | Solo-UX salvo «Registrar huevo»: abre la lista de aves, no un registro directo (DUDA ya anotada en la propuesta). Los otros tres navegan a pantallas existentes |
| Barra de ocupación en jaulas | nueva | **ROZA y CONTRADICE LA APP**: V1 no tiene `capacidad` (0 coincidencias en `src/`; `documents/specs/jaulas.md:56` y RJ-L5, V2 no la implementa; `JaulaCard.js` solo recibe `cantidadAves`). La propuesta §5 dice «datos que ya existen»: falso. Solo es válido mostrar «N aves» sin barra |
| Objetivos 52-56 px y teclado numérico | nueva | Solo-UX / configuración de entrada (`keyboardType` ya existe en los campos de medidas, `NuevaAveScreen.js:2111,2139,2167`) |

Sin evidencia de cambio de proceso en las demás secciones (paleta, tipografía, iconos). `git status` solo muestra los dos archivos nuevos de `documents/ux/`.

## 4. Emoji a icono

- Glifos Ionicons: los 64 nombres de las tablas §4 existen en `Ionicons.json` (grep por nombre exacto, todos encontrados, incluidos `ellipsis-horizontal-circle`, `cloud-offline-outline`, `ribbon`, `git-network-outline`).
- Emojis reales de `src/` que la tabla NO cubre: `📏` (`EvolucionAveScreen.js`), `🟢`/`🔴` como opciones de tipo Ingreso/Egreso (`NuevoMovimientoFinancieroScreen.js`, `EditarMovimientoFinancieroScreen.js`; la tabla solo trata 🟢🔴🟡 de salud), `🟢` en `SanidadJaulaScreen.js`, `🏆` solo como ranking. Resto de la tabla corresponde a los reales (🐔 🐓 🏠 📍 🏷 📦 🥚 💧 🍚 🧼 📖 🩺 💊 💰 💸 📉 📊 📈 🔔 ✅ ✏ 🗑 💾 📸 📷 🖼 🌿 🌱 🌳 ⚫ ⚰ 🛒 🐣 🏡 📝 📅 🏆 🥇🥈🥉 ⚙ 🚪 📤 ♻ 🔗 ＋ 👤 👥 📱 ⚠ no aparece).
- Inconsistencias del muestrario con la tabla: Fallecidas usa `exit` (tabla: `skull-outline`); Inactivas usa `trash` (tabla: `archive-outline`); `exit` significa a la vez «Fallecidas» y «Dar de baja»; `medkit` para Salud y Tratamiento.

## 5. HTML autónomo

Grep: sin `http://`, `https://`, `src=`, `url(`, `@import`, `<link`, `<iframe`; un único `<script>` en línea (línea 247). Iconos como `<symbol>` SVG internos (`<use href="#i-...">`). Fuentes: pila del sistema. Autónomo. Sintaxis del script revisada a ojo (plantillas anidadas cerradas, `render()` y selector coherentes); no se ejecutó. Defecto cosmético: `'FECHA NACIMIENTO'.toLowerCase()` en la tipografía y números SVG tipo `2.500` (válidos).

## 6. Textos del muestrario frente a la app real

- Login: el botón se llama «Ingresar» en la app (`acceso/LoginScreen.js:147`); el muestrario y su nota dicen «Iniciar sesión» como botón (el título sí es «Iniciar sesión», línea 96). Los flujos pulsan «Ingresar» (`lib/iniciar-sesion.yaml:11`): no cambiar ese texto.
- Nueva ave: etiquetas reales «Código *», «Peso en gramos», «Altura en centímetros», «Largo en centímetros», «Origen del ave»; el muestrario usa «Código», «Peso … g», «Altura … cm». Texto cambiado: `42-aves-editar.yaml:26,30` busca «Código *». Mantener las etiquetas o registrarlas en `inventario-cambios.md`. Placeholders reales («Ej. K001», «Ej. 850») que los flujos usan (`40-aves.yaml:23`) deben conservarse (el muestrario pone «K001» como valor).
- «Jaula J-03», «Galpón norte», «Capacidad 8» son datos ilustrativos; «Capacidad» no existe (ver §3).
- Alertas: «No existen alertas.» coincide; Inicio dice «No existen alertas pendientes.».
- Textos nuevos, aceptables si son solo decoración: «Control de aves, fácil», «Accesos rápidos», «Aún no hay aves», «Reintentar», «Sin conexión con el servidor.». Ojo: «Aún no hay aves» y «Reintentar» son estados nuevos; el error de red real de la app se muestra con `Alert`/texto propio de cada pantalla.
- Pestañas Activas/Vendidas/Fallecidas e Inicio (Activas, Vendidas, Fallecidas, Tratamiento) coinciden con la app.

## 7. Flujos Maestro afectados por quitar emojis

Con emoji en el texto buscado (actualizar al aplicar C3 y C5):
- `pruebas/movil/flujos/completo/99-alertas.yaml:29` `.*🔔 3.*`.
- `pruebas/movil/flujos/completo/60-salud-enfermedad.yaml:36` `.*🔴 Coriza.*`.
Sin emoji pero con texto exacto o anclado que puede cambiar si se tocan etiquetas o botones (revisar, no hay cambio previsto si se conservan las palabras): `.*Vendidas` / `.*Fallecidas` / `.*Activas` con ancla final (`90-baja-venta.yaml:74`, `91-baja-muerte.yaml:45`, `98-clientes.yaml:62,67,107`); `94-inicio.yaml:30-31` `"Vendidas"` y `"Fallecidas"` exactos (títulos de tarjeta; no deben llevar el icono dentro del mismo texto); «Ingresar», «Cerrar sesión» y «Guardar *» en 01-smoke, 10-acceso, 95, 96 y 99 (`99-alertas.yaml:57,68` usan `.*Guardar.*`: con «Guardar» fijo en pantalla, `assertNotVisible` de la línea 68 debe revisarse). Con un FAB «Nueva jaula» en la lista, `01-smoke.yaml:19` sigue valiendo por subcadena.

## Cambios requeridos antes de aprobar

1. Quitar la barra de ocupación y «Capacidad» del muestrario y de la propuesta (§5, §7, jaulas); dejar «N aves».
2. Corregir el botón de Login a «Ingresar» y conservar las etiquetas y placeholders reales de Nueva ave.
3. Completar la tabla de emojis (📏, 🟢/🔴 de tipo de movimiento y de sanidad) y alinear iconos de Fallecidas/Inactivas con la tabla.
4. Dar área táctil de 44 px a «cerrar aviso» y al ojo de contraseña; leyenda o etiqueta en el gráfico de Finanzas; borde al FAB.
5. Reclasificar en §7: aviso no bloqueante, «Ver ave» y alta rápida «rozan el proceso» (siguen aprobadas por el usuario, pero deben probarse con `/probar`).

DUDA PARA EL USUARIO: ¿se acepta que «Registrar huevo» en Inicio abra la lista de aves (ya anotada) y que la barra de ocupación se elimine porque V1 no tiene capacidad de jaula?
