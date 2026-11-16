# Inicio navegable

Fecha: 2026-11-16. Decisión del usuario: desde Inicio se puede ir a todo lo que ofrece. Patrón del Bloque A: los destinos se abren dentro de la pestaña Inicio (pila `InicioStackNavigator`), la flecha y la miga «Inicio ›» vuelven a Inicio y la pestaña activa sigue siendo Inicio. Sin textos nuevos ni cambios de lógica.

## Elementos tocables de `InicioScreen`

| Elemento | Pantalla destino | Filtro / parámetro | ¿Existía? |
|---|---|---|---|
| Aviso «N alertas por atender» | Alertas | – | sí |
| Aves activas | `ListaAves` | `estado: ACTIVAS` | nuevo |
| Aves vendidas | `ListaAves` | `estado: VENDIDAS` | nuevo |
| Aves fallecidas | `ListaAves` | `estado: FALLECIDAS` | nuevo |
| Salud (Tratamiento) | `ListaAves` | `estado: ACTIVAS`, `filtroSalud: EN_TRATAMIENTO` (filtro de salud que la lista ya tenía; solo se preselecciona) | nuevo |
| Acceso rápido Nueva ave | `NuevaAve` | – | sí |
| Acceso rápido Nuevo movimiento | `NuevoMovimientoFinanciero` | – | sí |
| Acceso rápido Alertas | Alertas | – | sí |
| Aves por raza (cada fila) | `ListaAves` | `estado: ACTIVAS`, `filtroRaza: <raza>` («Sin raza» = vacías) | nuevo |
| Razas presentes / Aves activas (texto) | sin destino propio | – | no |
| Huevos Hoy y Este mes | `ProduccionHuevos` | – | nuevo |
| Mejor ponedora | `DetalleAve` | `aveId` buscado por código en activas, vendidas y fallecidas; si no aparece, `ListaAves` con `busqueda: <código>` | nuevo |
| Mayor postura (hora pico) | `ProduccionHuevos` | solo si hay dato | nuevo |
| Promedio huevos diarios | `ProduccionHuevos` | – | nuevo |
| Ocupación de jaulas (Indicadores) | `ListaJaulas` | – | nuevo |
| Producción últimos días (gráfica) | `ProduccionHuevos` | solo si hay datos | nuevo |
| Resumen de alertas (Críticas, Advertencias, Total) | Alertas | – | nuevo |
| Cada alerta (tarjeta) | Ficha de ave o de jaula, Bebida o Alimentación | según `accionDestino` | sí |
| Finanzas del mes | `FinanzasInicio` | periodo por defecto (Este mes) | nuevo |
| Jaulas: Total, Ocupadas y Ocupación | `ListaJaulas` | – | nuevo |

## Cambios de navegación y de componentes

- `InicioStackNavigator`: registra `ListaAves`, `ListaJaulas`, `FinanzasInicio`, `EditarMovimientoFinanciero` y `ProduccionHuevos` (cabecera con flecha y migas de la pila).
- `AvesScreen`, `JaulasScreen`, `FinanzasScreen`: si se abren apiladas (`usePantallaApilada`, índice > 0) no dibujan su cabecera propia; en su pestaña se ven igual que antes. `AvesScreen` lee parámetros opcionales `estado`, `filtroSalud`, `filtroRaza` y `busqueda` (solo valores iniciales; sin ellos se comporta igual).
- Componentes: `TarjetaEnlace` (nuevo, tarjeta con chevron); `MetricCard`, `ProductionMetricCard` y `ProductionInfoCard` aceptan `onPress` (efecto de pulsación, chevron, rol de botón).
- Etiquetas de accesibilidad nuevas, distintas del texto visible («Ver aves vendidas», «Abrir finanzas», etc.). `testID` nuevos: `inicio-aves-activas|vendidas|fallecidas|tratamiento`, `inicio-raza-<raza>`, `inicio-huevos-hoy|mes`, `inicio-mejor-ponedora`, `inicio-hora-pico`, `inicio-promedio-huevos`, `inicio-ocupacion-indicador`, `inicio-produccion-semana`, `inicio-resumen-alertas`, `inicio-finanzas`, `inicio-jaulas`.
- Degradados: sin cambios (solo la cabecera).
