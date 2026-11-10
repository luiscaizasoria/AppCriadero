# Validación de la segunda ronda de correcciones (2026-11-10)

Veredicto: **APROBADO** (con 2 observaciones menores; sin cambios de proceso).

## No regresión
- `git status`/`git diff` en `api/`, `src/api/`, `src/repositories/`: vacío. Solo 14 archivos de `src/` (componentes, pantallas, tema).
- Mensajes: sin cambios salvo los aprobados («Cerrando...» `MasMenuScreen.js`, `SeleccionCriaderoScreen.js`; «Eliminando...» `DetalleJaulaScreen.js:815-818`; «No fue posible guardar el registro.» `NuevoMovimientoFinancieroScreen.js:227`).

## Puntos
- Venta sin filtro (`EditarMovimientoFinancieroScreen.js:491,502`): `parseNoNegativo` (l.700-706) da 0 con vacío y `null` con «abc» (NaN) -> Alert «Valor inválido» (l.315). Igual que V1. OK.
- Aviso de Salud: `SaludAveScreen` fija `avisoSalud` en la ruta previa solo si es `DetalleAve`, luego `goBack`. `DetalleAveScreen` lo muestra y llama `setParams({avisoSalud: undefined})`; el efecto depende de `avisoSalud`, no repite. Sin conflicto con `useFocusEffect` (recarga datos, no toca params). Se ve una sola vez (cierra a 4 s, `useAvisoExito`). Observación 1: el efecto corre con la ficha en segundo plano; el temporizador de 4 s puede empezar antes de que Salud termine de cerrar (goBack es inmediato: impacto mínimo, comprobar en teléfono, punto 5 de `pendiente-en-telefono.md`). Si la ruta previa no es `DetalleAve`, no hay aviso (SaludAve solo se abre desde la ficha).
- Guard: «Cerrar sesión» (`SeleccionCriadero`) y Más liberan en `finally`; Eliminar jaula con `guardia(eliminarJaula)` y `procesandoJaula`; Nuevo movimiento mantiene su `finally`. Observación 2: no se revisó el guard completo de `SaludAveScreen` (sin cambios en este diff); su botón sigue sin `disabled` según estado-actual.
- Validación múltiple: `useValidacion.fallar` acepta lista y mensaje o lista; compatible con usos de un solo campo. Login, Registro, Criadero nuevo marcan todos los vacíos con la misma condición de guarda que antes. Padres inválidos marca padre y madre con `CampoGrupo` y se limpian al elegir.
- Iconos: `jaula`/`jaula-relleno` SVG en `Icono.js`, alias `grid`/`grid-outline` redirigidos (usos en CicloVida, NuevaJaula significan jaula: coherente); `hourglass-outline` y `brush` mantienen un icono distinto por estado de jaula. `sparkles-outline` queda solo en Origen del ave y evento de ciclo de vida. Sin choques.

## Flujos
- `60-salud-enfermedad.yaml`: ya esperaba la ficha («Ficha del ave» + «En tratamiento»), espera robusta; solo se actualizó el comentario. `87` ya espera la ficha: sin cambio.
- `96-finanzas-correccion-venta.yaml`: «.» -> «abc» (ahora se ve y da «Valor inválido»); se mantiene el tap por id `venta-valor-ave`.
- `10-acceso.yaml`: no prueba campos vacíos; sin cambio. «Cerrar sesión» (10, 94, 97, 98, 99, smoke 01): el texto solo cambia durante la operación y el Alert es igual: sin cambio. `30-jaulas`: `.*Eliminar` no coincide con «Eliminando...» (solo durante la operación): sin cambio.
- Repetir: 96, 60, 87, 30 y 10; smoke 01 como comprobación general.
