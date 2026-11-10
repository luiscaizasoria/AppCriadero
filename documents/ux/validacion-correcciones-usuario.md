# Validación de las correcciones tras prueba del usuario (2026-11-10)

Alcance: `git diff src/` sin commit (27 archivos modificados y 4 nuevos) y `documents/ux/inventario-cambios.md`, sección «Correcciones tras prueba del usuario» (puntos 1-8). Auditor: `validador-ux`.

## Veredicto: APROBADO (con 3 observaciones, ninguna bloquea)

## No-regresión funcional
- `git status` y `git diff --stat` sobre `api/`, `src/api/`, `src/repositories/`: sin cambios. Sin migraciones.
- Las pantallas conservan llamadas a repositorios, condiciones de validación y textos de `Alert`. Solo se añade `v.fallar(campo, mismo mensaje)` junto a cada `Alert` (ej. `NuevaJaulaScreen.js` guardar; `SaludAveScreen.js:323-331`; `NuevoMovimientoFinancieroScreen.js` categoría y valor).

## Hallazgos por punto
1. Iconos: `Icono.js` es el único punto de entrada de iconos (no hay otro uso directo de Ionicons en pantallas). `ALIAS_SVG` solo intercepta `paw`, `paw-outline`, `nutrition`, `nutrition-outline`, `ave`, `ave-relleno`, `grano`; el resto sigue por Ionicons. `testID`, `accessibilityLabel` y `style` se reenvían igual. `react-native-svg` figura en `package.json` (15.15.4). Nota: el diff de `Icono.js` es de archivo entero por fin de línea (LF/CRLF), no por contenido.
2. Salud: `navigation.goBack()` tras `registrarDiagnostico` (`SaludAveScreen.js:398`); `cargarDatos()` y el aviso se conservan. SaludAve solo se abre desde DetalleAve, que recarga con `useFocusEffect`. El aviso «Registro guardado» ya no se ve (la pantalla se cierra).
3. `filtrarDecimal`: solo dígitos y un punto, coma a punto; las validaciones de guardado no cambian.
4. Acento verde/rojo: opcional por prop; contraste declarado AA.
5. `categoriaVisible`: coherente con la excepción aprobada; lo fijo sigue por tipo y lo creado sale en ambos.
6. `ResumenAlertas`: un solo Text, `adjustsFontSizeToFit`, textos iguales.
7. Guardias: `useGuardaEnvio` libera con `finally` en todos los caminos (retornos tempranos, errores, `Alert`); no hay `await` sobre callbacks de `Alert`, así que ningún guardia puede quedar bloqueado para siempre. `guardia(...)` se recrea por render pero comparte el `useRef`. `Boton.guardando` apaga, cambia a «Guardando...» y no cambia el momento de navegación ni de los `Alert`.
8. Validación visual: `CampoTexto` reenvía `contenedorRef`/`inputRef`/`alEditar`; `CampoContrasena` pasa `...props`, así que funciona en Login y Registro. `CampoGrupo` marca borde y mensaje (icono + texto, no solo color).
9. Acceso: el mensaje local sale bajo el campo (mismo texto) y los errores de API siguen en `MensajeError`. «Toca para entrar» pasa a «Entrando...» solo durante la acción.

## Observaciones
- O1 (UX, no bloquea): tras guardar Salud no hay confirmación visible en la ficha (el aviso queda en la pantalla cerrada). La ficha solo cambia el estado a «En tratamiento». Sugerencia: pasar el aviso a la ficha (parámetro de ruta) o aceptar esta salida.
- O2 (efecto del filtro): en Editar venta, «Valor del ave» y «Valor de envío» vacíos valen 0 (`parseNoNegativo`, sin cambios). Como las letras ahora se descartan, escribir «abc» deja el campo vacío, que es válido con valor 0, mientras que antes daba «Valor inválido». La validación no cambió, pero ya no se puede provocar ese error con letras; el flujo `96` se adaptó (un punto solo sigue siendo inválido). DUDA PARA EL USUARIO: ¿está bien que un valor del ave vacío o con letras se guarde como 0, como en V1 con el campo vacío?
- O3: la categoría con código creado por el usuario que coincida con un código fijo de otro tipo (ej. nombre «Alimento» en Ingreso) se trata como fija; caso improbable.

## Flujos de Maestro
- `completo/60-salud-enfermedad.yaml`: ya no espera «Registro guardado»; espera «Ficha del ave» y «En tratamiento» y reabre Salud para comprobar el historial.
- `completo/96-finanzas-correccion-venta.yaml`: el valor inválido pasa de «abc» a «.» y se alcanza el campo por `id` `venta-valor-ave`.
- `completo/87-correcciones-usuario.yaml` (nuevo): validación visual en Nueva jaula, categoría creada visible en Ingreso y Egreso, Valor «ab1,5x» queda «1.5» y Salud termina en la ficha. Semilla `--jaulas=JX-1 --aves=AV-U:MACHO:JX-1`. No ejecutado.
- Revisados sin cambio: `10-acceso` (el error de contraseña viene de la API), `30-jaulas` («Guardando» solo en `notVisible`), `95`, `90`, `98`, `82`, `84`, `iniciar-sesion` (no dependen de los textos cambiados). Ningún flujo busca «Toca para entrar» ni iconos por texto, y no existe el testID `acceso-error` (solo una captura con ese nombre).
