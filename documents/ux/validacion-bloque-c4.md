# Validación del sub-bloque C4 (Aves y Jaulas, «Pajarera tropical»)

Fecha: 2026-11-09. Revisor: validador-ux. Sin commit; sin emulador. Comparado con HEAD (`git show HEAD:...`).

## Veredicto: CAMBIOS REQUERIDOS (cortos; ningún proceso cambió)

## 1. No regresión funcional
- `git diff` no toca `src/api`, `src/repositories`, `api/`, migraciones, `package*.json`, `src/theme`, `src/navigation` ni `App.js` (0 archivos).
- Repositorios y llamadas iguales en las 11 pantallas: AvesScreen (`:119-125`, mismas tres funciones), DetalleAveScreen (`:151,162,173`), JaulasScreen (`:82-83`), DetalleJaulaScreen (`:160,293,415,560`), NuevaJaulaScreen (`:93`), Alimentación (`:100,144`).
- NuevaAveScreen: mismas validaciones y mensajes (`:856-1042`, `:1105`, `:1350-1446`); `crearAve`/`actualizarAve` con los mismos campos (`:1142-1201`, `:1224-1282`); permisos de foto sin cambio.
- DetalleAveScreen conserva todas las secciones y datos de V1 (Estado, Sexo, Peso, Altura, Largo, Origen, fechas, Padre, Madre, Jaula, Características, venta/fallecimiento, huevos; `:486-824`) y las 7 acciones con las mismas condiciones `ACTIVA` y el mismo `navigate` (`:956-1097`).
- DetalleJaulaScreen: mismos Alert de confirmación y error (`:254,327,398,469,485,517,596`) y mismas rutas (`:982,1157`). Los `try/catch` con `Alert` de Alimentación y Bebida (excepción aprobada) y SaludAve no cambian (SaludAve ni se toca).
- Cambio de comportamiento menor, no de lógica: carga de tipos en Alimentación/Bebida (`Alimentacion:92-120`) y Historial ahora tienen `try/catch` con estado de error y «Reintentar» (antes promesa sin capturar). Es la excepción técnica de errores de red; no altera repositorio ni mensajes de datos. Aceptable, pero hay que anotarlo en la spec de cuidados-jaula.
- DetalleAve: `setError(err)` y `EstadoError` muestra `error?.message` (texto técnico crudo, nuevo). Ver pendientes.

## 2. Aprobados y sus límites
- «Ver ave» directo: solo `navigation.replace('DetalleAve', {aveId})` tras 1,5 s (`NuevaAve:1291-1303`). Temporizador cancelado al desmontar (`:319-322`). Salir antes: el ave ya está guardada, solo se omite la navegación; no se pierde nada.
- Aviso solo en éxito (mismo mensaje y destino). Errores y confirmaciones siguen en `Alert`. Se pierden los títulos «Ave registrada»/«Ave actualizada» en Aves (el `Aviso` no tiene título); en Jaulas se conservan título y mensaje (`JaulaAviso.js:78-79`).
- Doble toque: NuevaAve usa `enviandoRef` (`:841,1085,1454`) y `atenuado`; Jaulas usan `atenuado={guardando || saliendo}` (`NuevaJaula:314`) con `Boton` que deshabilita (`Boton.js:34`). Sin duplicados.
- «Guardar» fijo: mismo texto, `Boton` con icono (`JaulaBarraAccion`, fuera del ScrollView).

## 3. JaulaCard
- Franja = estado sanitario con el mismo mapa de V1 (`JaulaEstado.js:8-19`, el texto sale de `getJaulaSanitaryStatusStyle`); cada estado con icono distinto (no solo color). «N aves» real (`JaulaCard:98-104`); sin capacidad inventada.

## 4. Contraste, táctil, accesibilidad (cálculo manual con los tokens)
- Blanco sobre primario 6,55:1; blanco sobre coral (Fab) 5,2:1; blanco sobre success 5,0:1; dangerText sobre dangerSoft 6,9:1; blanco sobre danger 6,1:1; texto sobre surfaceAlt > 14:1; paleta de avatares (iconos blancos u oscuros) 5,2 a 8,0:1; avatar de fallecida blanco sobre textSecondary 7,2:1. Todos >= 4,5:1.
- Táctil: `AveOpcion` minHeight `touchMin` (`:34`); pestañas, «Quitar» y cerrar aviso con `touchMin`; Fab 58. Degradados: lista 2 (fondo + cabecera), fichas y formularios 1.
- Accesibilidad: roles `tab`/`button`, `accessibilityState` selected/expanded/disabled, `accessibilityLiveRegion` en el aviso, `useReducirMovimiento`; estados con icono + texto.

## 5. Rendimiento
- AvesScreen usa `FlatList` con `keyExtractor` `String(ave.id)`, `initialNumToRender 8`, `windowSize 7`; `listaFiltrada` en `useMemo`; sin bucles de render. Contenido con `paddingBottom` 104 (Aves) y 112 (Jaulas) > Fab 58 + 16: el Fab no tapa la última tarjeta.

## 6. Textos nuevos o cambiados sin aprobación explícita (decisión del usuario)
1. Fab «Nueva ave» / «Nueva jaula» en lugar de «＋ Nueva ave» (mismo texto, distinta forma).
2. «Ave no encontrada.» pasa a `EstadoVacio`; fallo de carga muestra `EstadoError` con `error.message` crudo y «Reintentar» (V1 mostraba «Ave no encontrada.»).
3. Vacíos nuevos: «Aún no hay aves registradas», «Aún no hay ventas de aves», «Aún no hay bajas por fallecimiento», «No tienes jaulas registradas/inactivas».
4. Ayudas nuevas: «Selecciona el tipo de alimento/bebida que recibió la jaula.», «No hay tipos de alimento/bebida».
5. Historial: tipo de evento legible («Alimentación», «Ingreso de ave»...) en vez del código.
6. Contador «N aves encontradas».
7. Corrección de mojibake en DetalleJaulaInactiva (mejora; confirmar).
8. Pérdida de los títulos «Ave registrada» / «Ave actualizada» del aviso.

DUDA PARA EL USUARIO: ¿se aprueban estos textos y el mensaje de error técnico en la ficha del ave?

## 7. Flujos Maestro (sin emulador)
Cambiados: `smoke/01-smoke.yaml` (sin «Aceptar»: espera que desaparezca «Jaula creada»); `completo/30-jaulas.yaml` (dos altas con espera visible y luego notVisible del aviso; «Eliminar» del Alert con `rightOf: "Cancelar"` para evitar la coincidencia doble con el botón de la ficha; sin «Aceptar» de «Jaula eliminada», espera «Inactivas»); `40-aves.yaml` (`.*fue registrada correctamente.*`, sin «Ver ave», espera `.*Información del ave.*` antes de `.*AV-H.*` porque el aviso también contiene el código); `50`, `51`, `52` (sin «Aceptar»; esperan que desaparezca el título del aviso).
Revisados sin cambio: 41 (`Agregar` exacto del Alert de otra pantalla; la ficha queda oculta), 42, 53, 60, 70, 82, 83, 85, 86, 90, 91, 94, 96, 98, 99 (textos por regex que siguen válidos; los «Aceptar» restantes son de pantallas no tocadas). Ninguno desactivado ni PENDIENTE.
Riesgos para el próximo `/probar`: (a) `tapOn "AV-xxx"` exacto en 82, 85, 90, 96, 98: `AveCard` ahora tiene `accessibilityLabel` «CODIGO, raza»; si Maestro no ve el `Text` hijo habrá que pasar a regex; (b) `rightOf` del botón «Eliminar» de 30; (c) 82/85/83 asumen que «Nueva ave»/«Nueva jaula» solo está en el Fab de la lista.
testID que faltan: ninguno (los flujos usan texto; existen `eliminar-jaula`, `guardar-jaula`, `fab-agregar-ave`).
