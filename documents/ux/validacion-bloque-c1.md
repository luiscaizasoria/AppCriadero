# Validación del sub-bloque C1 (variante 1 «Pajarera tropical»)

Fecha: 2026-11-09. Validador de UX. Sin commit aún. Veredicto: **CAMBIOS REQUERIDOS** (2 menores, ninguna bloqueante; no hay regresión funcional).

## 1. No regresión
- `git diff --name-only`: solo `App.js`, `documents/ux/inventario-cambios.md`, `src/components/*`, `src/navigation/{AppNavigator,CabeceraPila}.js` y `src/theme/*`. No aparecen `src/api`, `src/repositories`, `api/`, migraciones, `package.json` ni lock. Ningún archivo de `src/screens/`.
- `App.js` (diff): solo se retira `ActivityIndicator`, se añade `useFonts` (líneas ~96-104) y `PantallaEspera` (~236-270). La lógica de base de datos, sesión y criadero no cambia. `useFonts` no bloquea si falla (`!fuentesListas && !errorFuentes`). Riesgo residual: si `useFonts` no resolviera ni fallara nunca, la espera sería indefinida (sin tope).
- Insignia: `BarraPestanas.js:8,45` solo llama a `obtenerResumenAlertas` (fachada `AlertasRepository.js:47`, lectura); `.catch(() => {})` en `:49`. No modifica repositorios.

## 2. Tokens y contrastes
- `colors.js:8-59` coincide con `propuesta-visual-v2.md:23-33,79-83` (todos los hex de la variante 1).
- Cálculo propio (WCAG): blanco/primario 6,55; blanco/secundario 5,50 (peor punto de la cabecera: el extremo fucsia; el medio da ~6,4); blanco/coral (FAB) 5,2; blanco/peligro (insignia, 11 px) 6,2; pestaña activa blanco/primario 6,55; inactiva `#5A5278`/blanco 7,2; dangerText/soft 6,9; warningText/soft 6,7; infoText/soft 8,8; texto/turquesa (chip acento) 8,0; borde de campo 3,66 (componente, vale 3:1). Los demás pares coinciden con los de la propuesta. **Ninguno queda por debajo de 4,5:1.**
- Menor: el texto de la insignia es de 11 px (`BarraPestanas.js:158`), por debajo del mínimo de 12-13 px del resto de la escala. Contraste correcto.

## 3. Táctil
- `Pulsable.js:54` impone 44x44 salvo `sinMinimo`. Atrás y migas (`PantallaHeader.js:46,63`) usan el mínimo. `Aviso.js:62` cierra a 44. Botones 50-58 (`Boton.js:9-14`), campos 54 (`CampoTexto.js:83`), FAB 58 (`Fab.js:32`), pestañas 54 de alto por 20 % de ancho (`BarraPestanas.js:133`). Cumple.

## 4. Barra inferior
- `flex: 1` en cinco ítems (`BarraPestanas.js:133`): centros al 10/30/50/70/90 %. Orden Inicio, Jaulas, Aves, Finanzas, Más (`AppNavigator.js:64-120`). Altura mínima 64 (`:126`), ítem de 54 con paddingBottom 5 + inset: la zona táctil queda casi igual a la anterior (antes bajaba a +7). El 96 % de alto cae dentro del ítem (sin inset) o en el borde (inset de gestos ~24 dp, margen ~0,7 %): igual que antes, pero a confirmar en el emulador.
- `testID`: `tab-*` y `tab-mas-insignia` nuevos; de la cabecera se conservan `cabecera`, `cabecera-atras`, `cabecera-miga-N` (`CabeceraPila.js:33`, `PantallaHeader.js:49,65`). Tocar la activa vuelve a la raíz (se emite `tabPress`, `:64-68`).

## 5. Degradados y sombras
- Máx. 2 por pantalla: cabecera (`PantallaHeader.js:22`) + `FondoPantalla.js:14`; el botón es sólido (`Boton.js:9`). `PantallaEspera` usa solo el fondo. Sombras solo en barra, FAB y resumen (`shadows.js`); `Tarjeta.js` sin sombra.

## 6. Accesibilidad
- Roles y etiquetas presentes (`tab`, `link`, `button`, `header`, `alert`, `progressbar`; `accessibilityState` en pestañas y botones). Decorativos ocultos (círculos, mascota, iconos). Reducir movimiento: `Pulsable.js:28` (solo brillo) y `Mascota.js:15`. Estados con icono + texto (`Aviso.js:8-12`, `Chip.js`). Menor: `maxFontSizeMultiplier={1.2}` en la barra limita el texto escalable (`BarraPestanas.js:100,109`); aceptable por el espacio, anotarlo.

## 7. Rendimiento
- Los 5 TTF por import profundo (`fuentes.js:3-7`). Sin bucles de render: `useEffect([state.index])` con tope de 10 s (`BarraPestanas.js:38-50`); `montada` evita `setState` tras desmontar. Coste: una llamada de alertas por cambio de pestaña (≥10 s), en modo API un `GET /alertas` completo. Efecto lateral: un cambio hecho en esos 10 s no actualiza el número hasta el siguiente cambio. Cada `Pulsable` suscribe su propio listener de movimiento reducido (`movimiento.js:16`); en listas largas conviene un valor compartido.

## 8. Flujos Maestro en riesgo (no se editan)
- Insignia numérica: `94-inicio`, `99-alertas`, `71-produccion-huevos`, `95-finanzas-movimientos` y cualquier `assertVisible`/`tapOn` con un número suelto (el número de Más podría coincidir). `tapOn: "Más"` (`01-smoke:34`, `10:35`, `20:15`, `71:19`) sigue válido.
- Cambio de icono de Más: ningún flujo busca el icono. Cabecera más alta: `94:34-111` (el propio inventario lo avisa). Coordenadas `30/50/70/90 %,96 %` (lista en el inventario, `:93`): sin cambio previsto; confirmar con `/probar smoke`.

## Cambios requeridos
1. `Pulsable.js:56` sustituye cualquier `opacity` del `style` (por ejemplo `Boton.js:91`, `apagado: opacity 0.5`): los botones terciario y texto deshabilitados no se ven apagados. Combinar la opacidad del estilo con `brillo` o mover `apagado` a un `View` interior.
2. `App.js`: añadir un tope (p. ej. 3-5 s) a la espera de `useFonts`, para que nunca bloquee el arranque.

DUDA PARA EL USUARIO: ninguna.
