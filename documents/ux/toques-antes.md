# Toques ANTES (estado actual de la app)

Fecha: 2026-11-09. Autor: disenador-ux. Contados leyendo el código real (citas `archivo:línea`); aún no medidos en el teléfono.

## Convenciones

- **Toque** = una pulsación en pestaña, tarjeta, botón, chip o campo de texto (enfocar un campo cuenta 1; escribir no cuenta). El botón "Aceptar" de cada `Alert` cuenta como toque. Gestos de desplazamiento y el "atrás" del sistema se indican aparte entre corchetes y no se suman salvo que se diga.
- Punto de partida: **pantalla Inicio con sesión iniciada** (la app abre en la pestaña Inicio, primera pestaña). La tarea 1 (acceso) parte de la pantalla de inicio de sesión.
- Solo campos obligatorios, salvo que se indique "con opcionales". Los selectores de fecha del sistema no se cuentan (las fechas por defecto son hoy).
- Pestañas: Inicio, Jaulas, Aves, Finanzas, Más (`AppNavigator.js:206-290`).
- Ruta = secuencia de pantallas.

## Tabla resumen

| # | Tarea | Toques antes | Estimado con la propuesta (referencia, sin implementar) |
|---|---|---|---|
| 1a | Iniciar sesión y elegir criadero | 4 | 4 |
| 1b | Registrarse y crear el primer criadero | 11 (6 si ya hay criadero) | 11 / 6 |
| 2a | Catálogos: añadir un ítem | 7 | 5 (alta rápida inline) |
| 2b | Catálogos: desactivar ("Eliminar") un ítem | 5 | 5 |
| 3a | Jaulas: crear | 5 | 4 |
| 3b | Jaulas: dar de baja ("Eliminar") | 5 | 4 |
| 4a | Cuidados: registrar alimentación | 6 | 5 |
| 4b | Cuidados: registrar bebida | 6 | 5 |
| 4c | Cuidados: registrar sanidad | 6 | 5 |
| 4d | Cuidados: ver historial de jaula | 3 | 3 |
| 5 | Aves: registrar ave y asignar jaula | 8 | 7 |
| 6a | Salud: diagnóstico solo con enfermedad | 6 | 5 |
| 6b | Salud: diagnóstico con tratamiento (medicamento y dosis) | 8 | 7 |
| 6c | Salud: finalizar tratamiento (después de 6b) | +3 (11 en total) | +2 |
| 7a | Huevos: registrar un huevo | 5 | 4 |
| 7b | Producción: ver producción (tras 7a) | +2 (7 en total) | +1 (atajo en Inicio) |
| 8a | Genealogía de un ave | 3 | 3 |
| 8b | Ciclo de vida de un ave | 3 | 3 |
| 9a | Baja por fallecimiento | 6 (7 con causa) | 5 |
| 9b | Baja por venta | 7 (12 con todos los campos) | 6 |
| 10a | Finanzas: ver resumen | 1 | 1 |
| 10b | Finanzas: registrar ingreso | 6 | 5 |
| 10c | Finanzas: registrar egreso | 7 | 6 |
| 11 | Clientes: lista y detalle | 3 | 3 |
| 12 | Reportes: abrir resumen y exportar un CSV | 3 | 2 (atajo en Inicio) |
| 13 | Alertas: abrir y llegar a un elemento | 3 | 2 |
| 14 | Inicio: ver estado / ir a un elemento de alerta | 0 / 1 | 0 / 1 |
| 15 | Cambio de pestaña y regreso / atrás | ver tabla 15 | ver tabla 15 |

Los "estimados" suponen aprobar las decisiones 3 (aviso en lugar de "Aceptar"), 4, 5 y 7 de `propuesta.md`. Si no se aprueban, el valor es igual al "antes".

## Detalle por tarea

### 1. Acceso (modo API)
- **1a Iniciar sesión**: (1) campo Correo `LoginScreen.js:107`, (2) campo Contraseña (121), (3) "Ingresar" (137-150), (4) tarjeta del criadero en `SeleccionCriaderoScreen.js:220-234` ("Toca para entrar"). Ruta: Login > SeleccionCriadero > Inicio. Con un solo criadero el usuario igual debe tocar su tarjeta (no hay entrada automática).
- **1b Registrarse**: (1) "Crear una cuenta" `LoginScreen.js:152-161`; (2) Nombre, (3) Correo, (4) Contraseña (`RegistroScreen.js:107-143`); (5) "Crear cuenta"; después, sin criadero previo, el formulario ya está abierto (`SeleccionCriaderoScreen.js:76`): (6) Nombre del criadero, (7) Provincia, (8) Ciudad, (9) Teléfono, (10) Correo de contacto (el país trae "Ecuador"; todos son obligatorios, `:128`), (11) "Crear criadero" (289-302). Con un criadero ya existente: tocar su tarjeta = 6 en total.

### 2. Catálogos (Más)
- **2a Añadir**: (1) Más, (2) tarjeta Configuración `MasMenuScreen.js:137-146`, (3) catálogo (p. ej. "🐔 Razas") `ConfiguracionScreen.js:93-129`, (4) "Nuevo elemento" `CatalogoScreen.js:445-511`, (5) campo Nombre `EditarCatalogoItemScreen.js:228`, (6) "💾 Guardar" (284-317), (7) "Aceptar" (142-158; hace `goBack` al catálogo). Ruta: Más > Configuración > Catálogo > Elemento > Catálogo.
- **2b Desactivar**: (1) Más, (2) Configuración, (3) catálogo, (4) "Eliminar" en la fila `CatalogoScreen.js:386-430`, (5) "Eliminar" en la confirmación (169-177). (El botón dice "Eliminar" pero desactiva el ítem; el texto es el de V1.)

### 3. Jaulas
- **3a Crear**: (1) Jaulas, (2) "＋ Nueva jaula" `JaulasScreen.js:151-168`, (3) campo Código `NuevaJaulaScreen.js:175` (el tipo viene "General", `:48`; nombre y ubicación opcionales), (4) "Guardar" (263-279), (5) "Aceptar" (95-98, `goBack` a la lista). Ruta: Jaulas > Nueva jaula > Jaulas.
- **3b Baja**: (1) Jaulas, (2) tarjeta de la jaula `JaulasScreen.js:317-330`, (3) "🗑️ Eliminar" `DetalleJaulaScreen.js:758`, (4) "Eliminar" en la confirmación (`:512-520`), (5) "Aceptar" (562-568, `goBack`). Ruta: Jaulas > Detalle de jaula > Jaulas.

### 4. Cuidados de jaula
- **4a Alimentación**: (1) Jaulas, (2) jaula, (3) "🍚 Alimentación" `DetalleJaulaScreen.js:1291-1313` (está al final de una pantalla de 2002 líneas: [scroll]), (4) tipo de alimento (chip) `AlimentacionJaulaScreen.js:142-173`, (5) "💾 Guardar" (180-189), (6) "Aceptar" (114-124, `goBack` al detalle de jaula).
- **4b Bebida**: igual con "💧 Bebida" (`:1316-1338`), `BebidaJaulaScreen`: 6 toques.
- **4c Sanidad**: igual con "🧼 Sanidad" (`:1341-1363`): estado sanitario (chip), "💾 Guardar sanidad" (`SanidadJaulaScreen.js:278`), "Aceptar" (`:100`): 6 toques.
- **Varias en la misma jaula**: tras el "Aceptar" se vuelve al detalle de la jaula; cada cuidado adicional cuesta 4 toques (acción, opción, guardar, aceptar).
- **4d Historial**: (1) Jaulas, (2) jaula, (3) "📖 Historial" (`:1366-1388`, [scroll]). Ruta: Jaulas > Detalle > Historial.

### 5. Aves: registrar ave y asignar jaula
(1) Aves, (2) "＋ Nueva ave" `AvesScreen.js:333-342`, (3) campo Código `NuevaAveScreen.js:1442`, (4) Raza (chip, obligatoria, sin preselección: `:147-161`, validación 761-763), (5) Sexo (chip, obligatorio, 773-775), [scroll hasta "Jaula inicial", `:2203-2231`], (6) jaula (chip; "Sin jaula" también cuenta si se quiere vacía), (7) "💾 Guardar ave" (2238-2268), (8) "Ver ave" (1175-1196; `replace` hacia la ficha). El origen viene "Nacida en criadero" (`:80-85`) y la fecha de nacimiento es hoy por defecto. Con "Comprada" se añaden origen, edad en meses, criadero de origen y método de envío (4 campos obligatorios, `:902-934`): 12 toques. Ruta: Aves > Nueva ave > Ficha del ave (la lista queda debajo).

### 6. Salud
- **6a Diagnóstico**: (1) Aves, (2) ave, (3) "🩺 Salud" `DetalleAveScreen.js:896-922` ([scroll] hasta "Acciones", 804-1052), (4) enfermedad (chip, obligatoria `SaludAveScreen.js:257-268`), (5) "💾 Guardar diagnóstico" (739), (6) "Aceptar" (317-332; recarga la misma pantalla, no vuelve).
- **6b Con tratamiento**: sumar (5) medicamento (chip) y (6) campo Dosis antes de guardar: 8 toques.
- **6c Finalizar tratamiento**: (1) "✅ Finalizar tratamiento" `SaludAveScreen.js:467-499` (solo con estado EN_TRATAMIENTO), (2) "✅ Confirmar recuperación" `FinalizarTratamientoScreen.js:187-219` (observación opcional), (3) "Aceptar" (96-113, `goBack` a Salud). Ruta: Aves > Ficha > Salud > Finalizar tratamiento > Salud.

### 7. Huevos y producción
- **7a Registrar**: (1) Aves, (2) ave, (3) "🥚 Registrar huevo" `DetalleAveScreen.js:927-958` ([scroll]), (4) "🥚 Registrar huevo" `RegistrarHuevoScreen.js:289-322` (fecha automática, observación opcional), (5) "Aceptar" (141-162, `goBack` a la ficha).
- **7b Ver producción**: (6) Más, (7) "Producción de huevos" `MasMenuScreen.js:149-158`. Con el cambio de pestaña, la pila de Aves queda con su ficha debajo (diagnóstico de navegación).

### 8. Genealogía y ciclo de vida
- **8a**: (1) Aves, (2) ave, (3) "🌳 Genealogía" `DetalleAveScreen.js:991-1017` ([scroll]). Tocar un nodo del árbol apila otra ficha (`GenealogiaAveScreen.js:511-521`, 982-990).
- **8b**: (1) Aves, (2) ave, (3) "🌿 Ciclo de vida" (962-988). Ambas seguidas: 3 + [atrás] + 1 = 5.

### 9. Bajas
- **Fallecimiento**: (1) Aves, (2) ave, (3) "⚫ Dar de baja" `DetalleAveScreen.js:1020-1051` ([scroll]; solo si está ACTIVA), (4) "⚰ Fallecimiento" `BajaAveScreen.js:349-382`, (5) "💾 Confirmar baja" (718-744; causa y detalle opcionales), (6) "Aceptar" (249-268, `popToTop` a la lista de Aves). Con causa: 7.
- **Venta**: (4) "💰 Venta" (388-421), (5) campo Celular (obligatorio, 162-173), (6) "💾 Confirmar baja", (7) "Aceptar". Opcionales: Nombre, Ciudad destino, Cooperativa, Valor venta, Valor de envío, Detalle: hasta 12 con los cinco campos de venta.

### 10. Finanzas
- **10a Ver resumen**: (1) Finanzas (`FinanzasScreen.js`, periodo "Este mes" por defecto: 269-325; cambiar periodo +1).
- **10b Ingreso**: (1) Finanzas, (2) "＋ Nuevo movimiento" `FinanzasScreen.js:524-546`, (3) categoría (chip, obligatoria `NuevoMovimientoFinancieroScreen.js:104-113`), (4) campo Valor (`keyboardType="numeric"`, 336-344, obligatorio >0), (5) "💾 Guardar movimiento" (373), (6) "Aceptar" (170-180, `goBack`). Tipo viene "INGRESO" (41).
- **10c Egreso**: sumar el chip "Egreso" del tipo (245-262): 7 toques.
- Editar/corregir un movimiento existente: Finanzas, movimiento (`FinanzasScreen.js:744-752`).

### 11. Clientes
(1) Más, (2) "Clientes" `MasMenuScreen.js:161-170`, (3) tarjeta del cliente `ClientesScreen.js:366-374`. Con búsqueda por nombre/celular (placeholder "Buscar por nombre, celular o ciudad..."): +1 campo.

### 12. Reportes
(1) Más, (2) "Reportes" `MasMenuScreen.js:173-182` (los cuatro resúmenes se ven al abrir: `ReportesScreen.js:179-250`), (3) "Exportar Aves" (o cualquiera de las 6) `:261-285`; a continuación aparece la hoja de compartir del sistema (fuera de la app, no contada).

### 13. Alertas
(1) Más, (2) "Alertas" `MasMenuScreen.js:197-252` (con insignia con el total), (3) tocar una alerta (`AlertasScreen.js:566-680`) abre la ficha del ave o la jaula dentro de **otra pestaña** (Aves o Jaulas). Filtros opcionales: 1 toque por filtro (`:113`, 325).

### 14. Inicio
- Ver el estado: 0 toques (es la pestaña inicial `AppNavigator.js:206`); el contenido ocupa varias pantallas de scroll (`InicioScreen.js`: Aves, razas, producción, indicadores, alertas, finanzas, jaulas).
- Ir a un elemento de alerta del propio Inicio: 1 toque (`:774-846`), también cruza de pestaña.
- Ir a Producción, Reportes o Alertas desde Inicio: 2 toques (Más + opción); no hay atajo.

### 15. Cambio de pestaña y regreso / navegación atrás

| Escenario (desde Inicio) | Toques actuales | Qué ocurre | Ideal |
|---|---|---|---|
| Aves > ave (2) > pestaña Finanzas (3) > pestaña Aves (4) | 4 | cae en la lista de Aves (no en la ficha); la ficha queda escondida debajo | 3 (vuelve a la ficha) |
| Desde ahí volver a la ficha | +1 [atrás] | `AppNavigator.js:56-65` apiló otra lista encima | 0 |
| Aves > ave > Salud (3) > tocar pestaña Aves (4) | 4 | lista; el "atrás" muestra Salud, luego la ficha, luego otra lista | 4, y "atrás" sale de la sección |
| Jaulas > jaula > ave (3: `DetalleJaulaScreen.js:216`) | 3 | salta a la pestaña Aves, ficha; "atrás" va a la lista de Aves | 3, "atrás" vuelve a la jaula |
| Volver a la jaula tras ver el ave | pestaña Jaulas (4) + [atrás] (5) + ... = 5-6 | pestaña Jaulas apila otra lista sobre el detalle | 1 |
| Inicio > alerta de ave (1) > volver a Inicio | 1 + 1 (pestaña Inicio) | "atrás" lleva a la lista de Aves; pestaña activa pasa a Aves | 1 + 1 [atrás] |
| Alimentar desde alerta de Inicio: alerta (1) > opción (2) > Guardar (3) > Aceptar (4) | 4 | termina en la lista de Jaulas (`goBack` desde `AlimentacionJaulaScreen.js:121`), no en Inicio | 3 y de vuelta en Inicio |
| "Atrás" del teléfono desde la lista de Aves / Jaulas / Finanzas / Más | 1 | va a Inicio (backBehavior por defecto `firstRoute`, `SwitchRouter.tsx:183`), no a la pestaña anterior | a la anterior (decisión) |
| Genealogía: ave A > nodo B > nodo C | 3 + 1 + 1 + 1 | cadena de fichas "DetalleAve" que hay que desandar una por una | miga tocable: 1 |

## Observaciones de lógica (no se tocan; solo informativas)

- `NuevaAveScreen.js:1175-1196`: el aviso "Ave registrada" ofrece un único botón "Ver ave"; el flujo normal no deja volver al formulario.
- `SaludAveScreen.js`: "Guardar diagnóstico" no tiene `disabled` (ya documentado en `estado-actual.md`).
- `NuevoMovimientoFinancieroScreen.js:184-191`: el `catch` solo hace `console.error` (sin aviso al usuario ante error de red); por decisión del usuario no se cambia.
- `BajaAveScreen.js:266`: `popToTop` tras la baja; V1 no libera la jaula (ya documentado).
- `SaludScreen.js` huérfana (no está en ningún navegador).
- `DetalleAveScreen.js:1-1067`: la ficha no usa el parámetro `desdeGenealogia` que envía Genealogía.
