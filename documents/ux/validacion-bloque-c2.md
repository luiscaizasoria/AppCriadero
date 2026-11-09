# Validación del sub-bloque C2 (Login, Registro, Selección de criadero)

Fecha: 2026-11-09. Validador: validador-ux. Veredicto: **APROBADO** (con tres observaciones menores, ninguna bloqueante).

## Parte 1. Evidencia

1. **No regresión.** `git diff HEAD --stat -- src/api src/repositories api package.json package-lock.json` vacío. Las tres pantallas cambian solo imports y JSX (hunks en `LoginScreen.js:3-25,83-152`, `RegistroScreen.js:3-25,87-164`, `SeleccionCriaderoScreen.js:6-50,178-410`); las funciones `entrar`, `registrar`, `cargar`, `elegir`, `crear`, `cerrarSesion`, `cambiar` y `campos` no aparecen en el diff. Llamadas a `src/api` y mensajes de error intactos. Textos de los flujos idénticos: «Iniciar sesión» (`LoginScreen.js:87`), «Ingresar» (`:118`), «Contraseña» etiqueta y placeholder (`:107,110`), «correo@ejemplo.com» (`:101`), «Crear una cuenta» (`:127`), «Cerrar sesión» (`SeleccionCriaderoScreen` botón), nombre del criadero (`{criadero.nombre}`). Cambio de estado: mientras envía, el botón muestra spinner (el texto «Ingresando...» queda solo en la etiqueta de accesibilidad); ningún flujo lo busca (grep).
2. **Lema** «Control de aves, fácil»: solo `LoginScreen.js:89` (`lema`). Registro y Selección no lo pasan. Sin pantallas de onboarding nuevas (grep `PantallaAcceso`: 3 usos).
3. **Contrastes (a mano, luminancia WCAG):** texto `#1B1636` sobre blanco 17,3:1; `textSecondary` `#5A5278` (subtítulo, «Toca para entrar», placeholder) 7,2:1 sobre blanco y 6,0:1 sobre el fondo pastel más oscuro (lema); «Criadero Kikirikis» `primaryDark` 9,8:1 sobre el degradado; botón sólido blanco sobre `#6D3BD2` 6,55:1; enlace «Crear una cuenta» `primaryDark` sobre blanco 11,8:1 y subrayado (no solo color); `dangerText` sobre `dangerSoft` 6,9:1 (con icono y franja); borde de campo 3,7:1 (≥3 en componentes). Icono de criadero `#1B1636` sobre turquesa 8,0:1. Todo ≥4,5:1.
4. **Táctil:** ojo 44x44 (`componentesAcceso.js:274-281` y `Pulsable` minWidth/minHeight); botones 50 a 58 de alto (`Boton.js:8-15`); tarjeta de criadero ≥80; campos 54.
5. **Degradados:** 1 por pantalla (`FondoPantalla`, `componentesAcceso.js:57`); botones sólidos, sin cabecera. ≤2.
6. **Accesibilidad:** `accessibilityLabel` en cada campo (`CampoTexto.js:48`); ojo con «Mostrar/Ocultar contraseña» (`componentesAcceso.js:155-159`); título con `accessibilityRole="header"`; `Mascota` oculta a lectores y quieta con «reducir movimiento» (`Mascota.js:15-17`); error = `Aviso` con icono + franja + texto, `accessibilityLiveRegion` (`Aviso.js:28-35`); texto escalable (alturas mínimas, no fijas).
7. **testIDs** nuevos únicos (grep): `pantalla-login`, `login-{correo,contrasena,contrasena-ojo,ingresar,crear-cuenta}`, `pantalla-registro`, `registro-*`, `pantalla-seleccion-criadero`, `seleccion-{cargando,crear-otro,crear-criadero,reintentar,cerrar-sesion}`, `criadero-{id}`, `criadero-campo-{campo}`; `acceso-error` es común pero solo hay un `MensajeError` visible por pantalla.

Arreglos posteriores de C1: `Pulsable.js:41-44` combina opacidad del estilo con el brillo (`Animated.multiply`, válido con driver nativo; `flatten` admite arreglos y nulos). `App.js:109-124,254` tope de 4 s; hooks antes de cualquier `return`; `initialize()` (barra, `initDatabase`, errores) y el bloque de sesión/criadero idénticos a los previos (`git diff --ignore-space-at-eol 9b0799a HEAD -- App.js`: solo fuentes y espera). `movimiento.js:5-38` listener único, estado inicial coherente. Correctos.

## Observaciones (no bloquean)

- `Boton` terciario deshabilitado (`Cerrar sesión` con `procesando`) queda al 50 % de opacidad (<4,5:1); estado deshabilitado, exento.
- Mascota con bucle infinito en Login y carga: Maestro puede tardar más en «asentar» la pantalla tras cada toque (más lento, no fallo).
- `98-clientes.yaml:129,140` (`assertVisible: "2"`) podría satisfacerse con la insignia numérica de Más si hay 2 alertas (falso positivo, no fallo). Se deja.

## Parte 2. Flujos

Cambiados (2): `lib/iniciar-sesion.yaml` y `completo/10-acceso.yaml`: se añade `hideKeyboard` tras escribir el correo. Motivo: el formulario queda ~250 dp más abajo (mascota, marca y lema); con el teclado abierto el campo «Contraseña» podría quedar fuera de la vista. Los selectores («correo@ejemplo.com», «Contraseña» `index: 1`, «Ingresar») siguen válidos: etiqueta y campo siguen siendo 2 coincidencias en ese orden, y «Mostrar contraseña» no coincide con el regex anclado.

Revisados sin cambio: `lib/abrir-app.yaml` y `lib/entrar.yaml` («Iniciar sesi.n» y el nombre del criadero siguen igual), `01-smoke` y resto de «Cerrar sesión» (`94`, `97`, `98`, `99`: pantalla Más sin tocar), `99` (la insignia «3» no choca con `.*Total: 3.*` ni `.*🔔 3.*`), `95` (solo toca `70%,96%`), `71` (`text "2"/"4"` acotados `below/above`, la insignia está en la barra y queda fuera), `94:34-111` (Inicio es raíz sin cabecera; solo la barra inferior sube a 64 dp, `scrollUntilVisible` sigue válido). Ninguno PENDIENTE; ninguno desactivado.

DUDA PARA EL USUARIO: ninguna.
