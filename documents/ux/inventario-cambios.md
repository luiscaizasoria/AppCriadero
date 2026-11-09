# Inventario de cambios de la fase UX (para poder revertir)

Fecha de inicio: 2026-11-09. Se completa tras cada bloque (un registro por pantalla: textos, navegación, componentes nuevos). Estado: **sin implementar**; solo documentación. Revertir el commit de un bloque deshace sus cambios.

## Registro por pantalla

| Bloque | Pantalla / archivo | Textos cambiados | Navegación | Componentes nuevos | Estado |
|---|---|---|---|---|---|
| C0 | Ninguna pantalla modificada. Archivos nuevos: `src/theme/{colors,typography,spacing,radii,shadows,icons,index}.js` | ninguno | ninguna | `Icono`, `Boton`, `CampoTexto`, `Tarjeta`, `Insignia`, `EstadoVacio`, `EstadoError`, `EstadoCarga`, `Aviso`, `PantallaHeader` (en `src/components/`; nadie los importa aún) | hecho (2026-11-09); revertir = borrar los archivos nuevos |
| (vacío hasta empezar el Bloque C0) | | | | | pendiente |

Cada fila: archivo, texto antes -> después, cambio de navegación (origen -> destino), componentes del tema usados, `testID` añadidos.

## Cambios de navegación previstos (aún no hechos; detalle en `mapa-navegacion.md`)

- `src/navigation/AppNavigator.js`: eliminar el listener `tabPress`; `backBehavior="history"`; nueva `InicioStack`; insignia de alertas en Más.
- `InicioScreen.js:780-837`, `AlertasScreen.js:574-664`, `DetalleJaulaScreen.js:216`, `DetalleJaulaInactivaScreen.js:107`: `navigate('Aves'|'Jaulas',{screen})` pasa a navegar dentro de la misma pestaña.
- `GenealogiaAveScreen.js:512,982`: sin `push` ilimitado; la ficha lee `desdeGenealogia`.
- `src/components/*` y `src/theme/*`: nuevos.

## Textos visibles cambiados que usan flujos Maestro

Los flujos de `pruebas/movil/flujos/` buscan por texto visible y no se editan en la fase UX; se actualizan aparte.

| Texto actual | Dónde lo usan los flujos | Cambio previsto | Flujos afectados |
|---|---|---|---|
| "Aceptar" (`Alert` de éxito) | 23 veces en 15 flujos (smoke `01`, `20`, `30`, `41`, `50`, `51`, `52`, `60`, `70`, `90`, `91`, `95`, `96`, `97`, `98`; verificado con grep) | aviso no bloqueante: desaparece el botón (mismo mensaje) | esos 15 |
| "Ver ave" | `40-aves.yaml:42` (con él, 24 coincidencias en 16 flujos) | "Ver ave" solo navega a la ficha | `40` |
| Emojis en botones y títulos ("💾 Guardar...", "🥚 Registrar huevo") | selectores con texto o regex | se retiran (iconos Ionicons); los regex `.*Guardar ave.*` siguen valiendo, los de texto exacto con emoji no | por revisar en el Bloque C |
| Títulos y migas repetidos (p. ej. "Salud") | selectores por texto | coincidencias dobles; usar `testID` | por revisar en el Bloque A |
| Salto de pestaña de Inicio/Alertas (navegación, no texto) | `94-inicio.yaml`, `99-alertas.yaml` | se quedan en la pestaña de origen | `94`, `99` |
| Pestañas por coordenadas `30%/50%/90%,96%` | todos | se conservan cinco pestañas y altura de barra | todos |
| Catálogos: "Nuevo elemento" / "Guardar" / "Aceptar" | `20-catalogos.yaml` | alta rápida en la lista | `20` |

## Decisiones

Del usuario, 2026-11-09:

1. **Opción A**: pulir el verde azulado, `Ionicons`, sin dependencias nuevas.
2. **"Atrás" del teléfono** vuelve a la pestaña anterior (`backBehavior="history"`).
3. **Plan de bloques** aprobado (`plan-bloques.md`): uno a uno, con visto bueno entre bloques.
4. **Aprobadas, con límites**:
   - El aviso no bloqueante sustituye al `Alert` de éxito sin cambiar la validación ni el mensaje.
   - "Ver ave" solo navega a la ficha.
   - El alta rápida en catálogos usa los mismos endpoints y validaciones (incluye "Nombre requerido", código derivado y descripción vacía).
   - Ocultar "Respaldo" solo en modo API, sin tocar el código de respaldo.
5. **`testID`** permitidos en elementos nuevos o modificados.
