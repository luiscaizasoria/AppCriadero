# Toques DESPUÉS del Bloque A (tareas afectadas)

Fecha: 2026-11-09. Contados por lectura del código (no medidos en el teléfono). Mismas convenciones que `toques-antes.md`: toque = pulsación en pestaña, tarjeta, botón, chip o campo; el "atrás" del sistema se indica entre corchetes. Punto de partida: Inicio con sesión iniciada.

## Tarea 15: cambio de pestaña y regreso / atrás

| Escenario (desde Inicio) | Antes | Después | Qué ocurre ahora |
|---|---|---|---|
| Aves > ave (2) > Finanzas (3) > Aves (4) | 4, cae en la lista; ficha escondida | 4, **vuelve a la ficha** | la pila de Aves se restaura |
| Volver a la ficha tras lo anterior | +1 [atrás] | 0 | ya está en la ficha |
| Aves > ave > Salud (3) > tocar pestaña Aves (4) | 4; lista con 3 capas ocultas | 4; lista, **sin capas ocultas** | tocar la pestaña activa vuelve a la raíz; [atrás] sale a la pestaña anterior |
| Jaulas > jaula > ave | 3; salta a Aves | 3; ficha del ave **dentro de Jaulas** | |
| Volver a la jaula tras ver el ave | 5-6 | **1** (flecha o [atrás]; la miga "J-xx" también) | atrás vuelve a la jaula |
| Inicio > alerta de ave (1) > volver a Inicio | 1 + 1 (pestaña Inicio) | 1 + 1 [atrás] o flecha | la barra sigue en Inicio |
| Alimentar desde alerta de Inicio: alerta > opción > Guardar > Aceptar | 4; termina en la lista de Jaulas | 4; **termina en Inicio** | `goBack` ya vuelve al origen |
| "Atrás" del teléfono desde la raíz de Aves / Jaulas / Finanzas / Más | 1; va a Inicio | 1; va a la pestaña anterior | `backBehavior="history"` |
| Genealogía: A > nodo B > nodo C | 3 + 1 + 1 + 1, fichas encadenadas | 3 + 1 + 1 + 1 a la ida; volver a la ficha de A con **1 toque en la miga** (antes 3 atrás) | sin copias repetidas de la misma ficha |

## Tareas que arrancan desde Inicio o Alertas

| Tarea | Antes | Después | Nota |
|---|---|---|---|
| 13 Alertas: abrir y llegar a un elemento (Más > Alertas > alerta) | 3; cambia de pestaña | 3; abre la ficha/acción en Más; [atrás] vuelve a Alertas | sin saltos de pestaña |
| 14 Inicio: ir a un elemento de alerta | 1 | 1; ficha en Inicio; [atrás] vuelve a Inicio | |
| 9a/9b Baja de un ave abierta desde Inicio/Alertas/Jaula | termina en la lista de Aves | termina en la raíz de la pestaña de origen (`popToTop` actual sin cambios) | observación abajo |
| 8a Genealogía de un ave | 3 | 3 | |

Sin cambio en el resto de tareas (1 a 12): el Bloque A no toca formularios ni "Aceptar" (Bloque D).

## Observaciones
- `BajaAveScreen.js:266` `popToTop()` queda igual (lógica); con las fichas en varias pilas, tras una baja se llega a la raíz de la pestaña desde la que se abrió (Inicio, Jaulas, Más o Aves).
- Un tramo de miga hace `pop` a esa pantalla; si la pantalla destino ya no está en la pila (no ocurre con el flujo normal) no hay tramo.
