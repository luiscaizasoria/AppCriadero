# Colores de tarjeta por estado

Tokens en `src/theme/estados.js` (`coloresEstado`, `estiloTarjetaEstado`, `franjaEstado`). La tarjeta completa (fondo + borde de 2 px; en jaulas, además la franja lateral) cambia según el estado de V1. El estado nunca va solo en color: cada tarjeta lleva un chip con icono + texto y el estado también está en `accessibilityLabel`. Sin amarillo; verde solo en el chip de estado positivo.

## Tabla

| Estado (V1) | Dónde | Familia | Fondo | Borde / franja | Texto principal / secundario | Icono del chip |
|---|---|---|---|---|---|---|
| Normal (jaula) | Jaulas | neutro | `#FFFFFF` | borde `#E4DDF5` 1 px; franja verde `#12803C` (V1) | `#1B1636` / `#5A5278` | checkmark-circle (chip verde) |
| Limpieza | Jaulas | info (azul) | `#EEF5FF` | `#1D5FB8` | `#1B1636` / `#5A5278` | brush |
| Fumigación | Jaulas | advertencia (naranja) | `#FFF1E3` | `#B45309` | `#1B1636` / `#5A5278` | cloud |
| Quemadura | Jaulas | advertencia (naranja, como V1) | `#FFF1E3` | `#B45309` | `#1B1636` / `#5A5278` | flame |
| Cuarentena | Jaulas | peligro (rojo) | `#FFEEF0` | `#C0182B` | `#1B1636` / `#5A5278` | ban |
| Sana | Aves activas | neutro | `#FFFFFF` | `#E4DDF5` 1 px | igual | checkmark-circle (chip verde) |
| En tratamiento | Aves activas | advertencia | `#FFF1E3` | `#B45309` | igual | medkit |
| Enferma | Aves activas | peligro | `#FFEEF0` | `#C0182B` | igual | alert-circle |
| Vendida / Fallecida | Aves | sin cambio (blanca, como antes) | `#FFFFFF` | `#E4DDF5` | igual | cart-outline / skull-outline |

Nota: Quemadura y Fumigación comparten el tono naranja de advertencia (decisión del usuario, 2026-11-16, para separar Quemadura de Cuarentena, que queda en rojo); se distinguen por icono (flame / cloud) y texto. Contraste ya calculado abajo para ese tono.

Estados leídos del código: `JAULA_SANITARY_STATUS_STYLES` (Normal, Limpieza, Fumigación, Quemadura, Cuarentena; cualquier otro valor cae en Normal) y `visualSalud` (SANA por defecto, EN_TRATAMIENTO, ENFERMA).

## Contraste calculado (WCAG 2.x, L = 0,2126 R + 0,7152 G + 0,0722 B linealizados)

Luminancias: `#1B1636` 0,0107; `#5A5278` 0,0958; blanco 1,000; `#EEF5FF` 0,9069; `#FFF1E3` 0,8973; `#FFEEF0` 0,8868; peor fondo de pantalla `#EFE6FF` 0,82; `#1D5FB8` 0,1190; `#B45309` 0,160; `#C0182B` 0,1221.

Las tarjetas son opacas: el degradado de pantalla no queda detrás del texto, solo junto al borde (se comprueba abajo contra el peor fondo `#EFE6FF`; `#FFE3EC` y `#DDF6F7` son más claros que él en sentido contrario no empeoran el cociente de forma relevante).

| Par | Cálculo (L1+0,05)/(L2+0,05) | Resultado | Criterio |
|---|---|---|---|
| Texto `#1B1636` / fondo info | 0,9569 / 0,0607 | 15,8:1 | AA texto 4,5 |
| Texto secundario `#5A5278` / fondo info | 0,9569 / 0,1458 | 6,6:1 | AA 4,5 |
| Texto / fondo advertencia | 0,9473 / 0,0607 | 15,6:1 | AA |
| Secundario / fondo advertencia | 0,9473 / 0,1458 | 6,5:1 | AA |
| Texto / fondo peligro | 0,9368 / 0,0607 | 15,4:1 | AA |
| Secundario / fondo peligro | 0,9368 / 0,1458 | 6,4:1 | AA |
| Texto / blanco (neutro) | 1,05 / 0,0607 | 17,3:1 | AA |
| Borde info / fondo `#EEF5FF` | 0,9569 / 0,169 | 5,7:1 | componente 3:1 |
| Borde advertencia / fondo `#FFF1E3` | 0,9473 / 0,210 | 4,5:1 | 3:1 |
| Borde peligro / fondo `#FFEEF0` | 0,9368 / 0,1721 | 5,4:1 | 3:1 |
| Borde info / pantalla `#EFE6FF` | 0,87 / 0,169 | 5,1:1 | 3:1 |
| Borde advertencia / pantalla | 0,87 / 0,210 | 4,1:1 | 3:1 |
| Borde peligro / pantalla | 0,87 / 0,1721 | 5,0:1 | 3:1 |

Chips: conservan sus pares existentes de `colors.js` (`*Text` sobre `*Soft`: 6,7 a 8,8:1). El chip va sobre un fondo de tarjeta casi igual, por eso el significado lo da el icono + texto y no el contraste chip/tarjeta.

Nota: los cociente se calcularon a mano (el guardia técnico no permite ejecutar scripts); conviene revisarlos con una herramienta si se cambia algún hex.

## Leyenda

No se añadió leyenda: cada tarjeta ya muestra el chip con texto; una leyenda colapsable recargaría la cabecera de las listas.
