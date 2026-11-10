# Validación del cierre total (2026-11-10)

Veredicto: **APROBADO**. Revisión del `git diff src/` sin commit, `rendimiento.md` y la sección «Cierre total» de `inventario-cambios.md`. No se ejecutó el emulador.

## Evidencia
- **BarraPestanas navigate** (`src/navigation/BarraPestanas.js:77`): `CommonActions.navigate(route.name, undefined, { merge: true })` produce `{type:'NAVIGATE', payload:{name, params:undefined, merge:true, pop:undefined}}`. La forma de objeto (obsoleta) devolvía el payload `{name, merge:true}` (`node_modules/@react-navigation/routers/src/CommonActions.tsx:104-137`). Es equivalente; la forma nueva elimina el `console.warn` que activaba el LogBox. Se conservan `target: state.key`, el `tabPress` y la guarda `!enfocada`.
- **Título «Baja del ave»** (`titulos.js`): coincide con lo que esperan los flujos 90, 91, 96 y 98 (`.*Baja del ave.*`). El botón de la ficha sigue diciendo «Dar de baja» (los flujos tocan `.*Dar de baja.*`). Ningún flujo busca «Dar de baja» como título de cabecera.
- **«Salud» sin código** (`SaludAveScreen.js:536`): ningún flujo contiene «Salud AV-» (búsqueda en `pruebas/movil`: 0 coincidencias). Los flujos tocan `.*Salud` desde la ficha. Con el título «Salud» el selector `.*Salud` ahora puede coincidir también con el título de la propia pantalla; no afecta a los flujos porque solo se usa en la ficha.
- **Genealogía inactiva** (`GenealogiaAveScreen.js`, `nodeCardInactive`): solo cambia el estilo (`opacity 0.8` a `borderStyle dashed`). Sin cambio de lógica ni de texto. El borde discontinuo añade un canal no cromático.
- **React.memo y AveCard/AvesScreen:** `Chip`, `IconoCirculo` y `AveCard` son puros (props primitivas). `AveCard` conserva `testID` `lista-ave-${codigo}`, `accessibilityLabel` y `onPress`; `onAbrir(ave)` navega a `DetalleAve` con `{aveId: ave.id}`, igual que antes. `renderItem`, `keyExtractor` y `abrirAve` con `useCallback` dependen solo de `navigation`/estables. Sin cambio de comportamiento.
- **No-regresión:** el diff no toca `src/api/`, `src/repositories/`, `api/` ni migraciones.

## Observaciones
- «Atrás» desde la ficha de Genealogía con la misma ave sigue como aceptada en el inventario (observación 6); sin novedad.
- Los flujos 82-86, 96 y 98 pasan a depender de `testID` de pestañas (`tab-inicio|jaulas|aves|finanzas|mas`, definidos en `BarraPestanas.js:12-16`) y de las etiquetas accesibles «Volver» / «Ir a AV-N1» (`PantallaHeader.js:52,68`).
