# Validación UX del sub-bloque C5 (Salud, Huevos, Genealogía, Ciclo de vida, Evolución, Bajas y Agregar ave a jaula)

Fecha: 2026-11-10. Validador de UX. Veredicto: **APROBADO** (con 3 decisiones pendientes del usuario y 2 observaciones menores).
Método: comparación con `git show HEAD:...` (diff con `--ignore-cr-at-eol`, porque el fin de línea cambió y el diff crudo muestra miles de líneas) y lectura de los archivos actuales. No se ejecutó el emulador.

## 1. No regresión funcional

- `git status` y `git diff --stat`: no se tocaron `src/api/`, `src/repositories/`, `api/`, migraciones ni `package*.json`. Solo `src/screens/*`, `src/components/*` (nuevo `HuevoRanking.js`) y `documents/ux/`.
- Llamadas a repositorios, cuerpos enviados y validaciones: sin hunks en esas zonas. `BajaAveScreen.js:154-334` (`registrarMuerteAve`/`registrarVentaAve`, `convertirValorOpcional`, Alert «Seleccione una opción», «Celular requerido», «Valor inválido», catch «No fue posible completar la baja del ave.») idéntico a HEAD salvo el éxito. `EvolucionAveScreen.js:457-486` y Alert de error `:510` iguales; `manejarErrorFoto` (`:1059`) usa `error.message` solo para decidir el Alert, no lo muestra.
- Excepciones aprobadas: `SaludAveScreen.js:275-320,380-396` conservan los dos `Alert` de los `catch`; la guarda `if(!ave)` (`:451`) se conserva (en vez de `return null`, ahora `EstadoError` + «Reintentar»). `ProduccionHuevosScreen.js:230` conserva el `Alert` de carga. `RegistrarHuevoScreen`: `testID="guardar-huevo"` y lógica de guardar sin cambios. Genealogía: `cargar` (`:85-123`) sin `Alert`, ids con `String(...)` (`:807,1138,1254,1397`), `analizarConsanguinidad`, resaltado (`highlightIds`, `nodeCardConsanguineous` con borde 4 px) y textos de consanguinidad sin cambios en la lógica (el diff solo toca estilos y emojis).
- Datos que V1 mostraba: Salud (estado, enfermedad, medicamento, síntomas, dosis, historial con enfermedad, medicamento y dosis, «Finalizar tratamiento» solo `EN_TRATAMIENTO`), Ciclo de vida (ave, sexo, estado, eventos, jaula, vacío), Evolución (foto, medidas, campos), Producción (Hoy/Semana/Mes, últimos días, ranking, horario, por jaula) se conservan. Se pierde solo el subtítulo de Producción «Análisis avanzado de postura de huevos» (decorativo, anotado en el inventario) y el título del cuerpo en Finalizar tratamiento, Registrar huevo, Ciclo de vida y Agregar ave (la cabecera lo muestra).
- Cambio de comportamiento menor y favorable: «Guardar diagnóstico» ahora queda `atenuado` mientras guarda (`SaludAveScreen.js:811-813`; en HEAD no bloqueaba el doble toque); `SeleccionarAveJaulaScreen` sustituye `disabled={procesandoId!==null}` por una guarda al inicio de la función (`procesandoId !== null || saliendo`), equivalente; `RegistrarHuevoScreen.cargarAve` gana `try/catch` (antes promesa sin capturar).

### Baja del ave: aviso con `popToTop` a los 1,8 s
- `BajaAveScreen.js:290-305` + `useAvisoExito.js:26-35`: la baja ya está guardada cuando aparece el aviso; el botón queda `atenuado` (`:` `guardando || saliendo`, `Boton.js:34`) y no acepta otro toque. `saliendo` nunca vuelve a false: no hay doble baja.
- Riesgo de perder la navegación: si la persona pulsa «atrás» en esos 1,8 s, el cleanup (`useAvisoExito.js:19-24`) cancela el temporizador y el `popToTop` no corre; vuelve a la ficha, que ya recarga al enfocar (efecto de V1) y muestra el ave vendida/fallecida. Si la app pasa a segundo plano, `popToTop` se retrasa hasta volver. Riesgo bajo, sin pérdida de datos.
- Observación: V1 no pedía confirmación antes de la baja (solo validaciones), así que «confirmaciones siguen siendo Alert» se cumple para validaciones y errores; no hay un «¿Confirmar?» que conservar. Valoración: aceptable; la decisión de mantener el diálogo es del usuario (DUDA 1).
- «Registro guardado» (Salud): `mostrarAviso(...)` + `cargarDatos()` inmediato (`SaludAveScreen.js:366-376`). En HEAD `cargarDatos` corría en el `onPress` de «Aceptar»; el resultado final es el mismo (mismas llamadas, mismo orden); solo se adelanta. El aviso se pinta también en la rama de carga (`avisoExito`, `:445`), así que no se pierde durante la recarga.

## 2. Aviso solo en éxito
Sustituidos solo los Alert de éxito: «Registro guardado», «Tratamiento finalizado», «Huevo registrado», «Evolución registrada», «Proceso completado», «Ave asignada»; mismo título y mensaje, mismo destino (`goBack`/`popToTop`). Confirmaciones («Asignar ave», «Mover»), validaciones y errores siguen como `Alert`.

## 3. Errores humanos
`grep` de `error.message`/`error?.message` en las 10 pantallas y `DetalleAveScreen`: ninguno se pinta (solo `EvolucionAveScreen.js:1065`, lógica). Mensajes: «No fue posible cargar los datos de salud / el ave / la producción de huevos / el árbol genealógico / las aves disponibles», más «Reintentar» conectado a la misma función de carga (`cargarDatos`, `cargarAve`, `cargar`). Ciclo de vida usa el texto fijo de V1 (`CicloVidaAveScreen.js:150`). `DetalleAveScreen.js:281` ya no muestra `error.message`.

## 4. Contraste, táctil, iconos (cálculo manual, luminancia relativa)
| Par | Resultado |
|---|---|
| Blanco sobre `info` #1D5FB8 | L=0,119 -> 6,2:1 |
| `warningText` #8A3B00 / `warningSoft` #FFEBD6 (chip En tratamiento, aviso inválida) | 6,7:1 |
| `dangerText` #9B1220 / `dangerSoft` #FDE3E6 (chip Enferma) | 5,6:1 (el token declara 6,9) |
| `successText` #0B5A2A / `successSoft` #DFF6E5 (chip Sana, aviso éxito) | 7,3:1 |
| `infoText` #123F7A / `infoSoft` #E0EDFF (chip Vendida) | 8,8:1 |
| `textSecondary` sobre `surfaceAlt` (HuevoRanking, tarjetas) | ~6,4:1 |
| Copas: blanco/coral 5,2; texto oscuro/turquesa 8,0; blanco/primary 6,6; paw blanco/textSecondary ~7,5 | cumple |
| Borde `kinship` #7B5EA7 sobre blanco (resaltado, no texto) | ~5,2:1 (>=3) |
- Observación menor: Genealogía `nodeCardInactive` con `opacity:0.8` (`GenealogiaAveScreen.js:2043`) deja `textSecondary` en ~4,5:1; en HEAD era 0,72 (peor). Aceptable; sugerencia: usar `text` en los nodos «Fallecida».
- Táctil: `AveOpcion` `minHeight: touchMin` (44), selectores de generaciones 48x44, `Boton` >=52, filas de Seleccionar ave con `Tarjeta` pulsable alta, cerrar aviso 44. Un solo degradado por pantalla (`FondoPantalla`); sin degradado de cabecera en estas pantallas. Emojis: ninguno en las 10 pantallas (búsqueda por rangos Unicode y escapes `\uD83`); Ionicons con un significado por concepto (`skull-outline` fallecimiento, `cart-outline` venta, `medkit` salud). Accesibilidad: `accessibilityRole="header"` en títulos, `alert` en avisos y errores, `accessibilityState.selected` en generaciones y opciones, chips con icono + texto (no solo color), `maxFontSizeMultiplier` solo en la cifra grande de Producción.
- Orientación: cabeceras vía `titulos.js` (Salud, Finalizar tratamiento, Dar de baja, Registrar huevo, Ciclo de vida, Genealogía, Agregar ave, Producción de huevos). Observación: en «Dar de baja» el título del cuerpo sigue siendo «Baja del ave» y en Salud «Salud AV-X»; no coinciden letra a letra con la cabecera/botón (la tarjeta de origen dice «Dar de baja»). Es texto de V1 que los flujos usan; se deja como sugerencia.

## 5. Pendientes de decisión (textos nuevos no aprobados)
1. «Proceso completado» (Baja) como aviso autonavegante (decisión del diseñador; ver arriba).
2. Textos nuevos: «El ave volverá al estado sana.» (Finalizar tratamiento), «Datos del comprador» (Baja), «Aún no hay registros sanitarios de esta ave.» (Salud), «Aún no hay huevos registrados.» (Producción, dos veces), «Cargando datos de salud...», «Cargando producción...», «Cargando ave...», títulos de error del apartado 3, y «Salud» huérfano (`SaludScreen`, sin ruta).
3. Se elimina el subtítulo «Análisis avanzado de postura de huevos» y se reemplaza el mensaje «No fue posible encontrar el ave.» de Genealogía por «No fue posible cargar el árbol genealógico.».
4. DUDA PARA EL USUARIO: Registrar huevo con fallo de carga deja el formulario disponible (V1) y permite registrar un huevo sin jaula conocida.

## Flujos Maestro (`pruebas/movil/flujos/completo/`)
Cambios con el mínimo cambio (se quita `tapOn: "Aceptar"` y, donde el flujo siguiente depende de volver, se espera `notVisible` del título del aviso; el `goBack`/`popToTop` ocurre a los 1,8 s):
- `60-salud-enfermedad.yaml`: sin «Aceptar» tras «Registro guardado» (los datos se recargan solos); `.*🔴 Coriza.*` -> `.*Sin medicamento.*` (texto que solo aparece en el historial; el chip de enfermedad del formulario también dice «Coriza», así que «Coriza» a secas no distingue; `60:37` ya afirma «Coriza»).
- `70-huevo.yaml`: espera `notVisible: "Huevo registrado"` en lugar de «Aceptar».
- `41-aves-jaula.yaml`: dos esperas `notVisible: "Ave asignada"` (evita tocar `.*Agregar`, que también coincide con la cabecera «Agregar ave», antes de volver a la ficha de la jaula, y evita el «atrás» a destiempo).
- `90-baja-venta.yaml` (dos veces), `91-baja-muerte.yaml`, `96-finanzas-correccion-venta.yaml` (solo línea de la baja) y `98-clientes.yaml` (dos veces): `notVisible: "Proceso completado"` en lugar de «Aceptar».
- Revisados sin cambios: `71`, `80`, `81`, `82`, `85` (los textos `.*Resumen`, `.*Hoy`, `2`/`4` bajo etiquetas, `AV-Q`, «3 huevos», `.*Genealogía`, `.*Guardar diagnóstico.*`, etc. siguen en pantalla). `52`/`53` no pasan por C5.
- PENDIENTE-C6 (no editados por mí): `95:45,68,128` (`96` «Venta corregida» ya lo adaptó C6), `97:111` (`OK|Aceptar` por si aplica), `20:33` (`Aceptar` en Catálogos). Los tocan pantallas de C6.
- Riesgo de los flujos: sin emulador; las esperas `notVisible` suponen que el texto del aviso no persiste en la pantalla destino (no persiste: el aviso vive en la pantalla de origen).
