# Plan de implementación por bloques (fase UX)

Fecha: 2026-11-09. Autor: disenador-ux. Se ejecuta solo tras aprobar `propuesta.md` (opción visual y decisiones de la sección 4). Un bloque por vez; informe corto tras cada uno (máx. 25 líneas); entre bloques la app compila (esbuild sobre los archivos tocados) y sigue funcionando en nube y en SQLite. Cada cambio de texto o estructura se anota en `documents/ux/inventario-cambios.md`.

Nota de orden respecto al método del encargo original: la numeración A a E de este plan sustituye a la lista (a)-(h) anterior porque la prioridad del usuario es orientación y "atrás"; todas las pantallas quedan cubiertas (tabla final).

## Orden recomendado

1. **Bloque C0 (mínimo del tema)**: crear `src/theme/` y componentes base (sin repintar pantallas). Es prerrequisito de A y B; sin impacto visual ni en pruebas.
2. **Bloque A**: navegación y orientación (el dolor principal).
3. **Bloque B**: login, registro, onboarding.
4. **Bloque C**: tema, colores e iconografía (repintado de pantallas por familias).
5. **Bloque D**: listas, formularios y reducción de toques.
6. **Bloque E**: Inicio, Alertas, Reportes e información.

Razón: A corrige el defecto de uso real y es independiente del color; B es acotado y visible; C reutiliza los componentes de C0 y toca casi todos los archivos, por eso va tras fijar la navegación; D y E dependen de C.

## Bloque C0 — Base del sistema de diseño
- Archivos: `src/theme/*`, `src/components/` (Boton, CampoTexto, Chip/ChipGrupo, Tarjeta, Insignia, Icono, EstadoVacio/Error/Carga, Aviso, PantallaHeader), `src/config/constants.js` (solo para apuntar `COLORS` al tema, si se aprueba tocarlo; si no, un puente en `theme`).
- Terminado cuando: el tema exporta los tokens de la opción elegida; cada componente tiene un ejemplo de uso y `testID`; ninguna pantalla cambió; esbuild compila los archivos nuevos.
- Riesgo: ninguno de pruebas.

## Bloque A — Navegación y orientación
- Alcance: `AppNavigator.js` (quitar `crearListenerRutaInicial`, `backBehavior` según decisión, insignia en Más), nueva `InicioStack`, grupos `pantallasAve(Stack)` / `pantallasJaula(Stack)` registrados en Inicio, Jaulas, Aves y Más, títulos y migas con `PantallaHeader` en todas las pilas (corrige los 7 títulos técnicos de Aves), cambio de los `navigate` cruzados en `InicioScreen.js:780-844`, `AlertasScreen.js:574-675`, `DetalleJaulaScreen.js:216`, `DetalleJaulaInactivaScreen.js:107` y `push` de `GenealogiaAveScreen.js:512/982`; `setOptions({contexto})` en las pantallas de detalle; quitar títulos duplicados dentro del cuerpo se hace en el bloque C (aquí solo la cabecera).
- Terminado cuando se cumplen los 11 casos de `diagnostico-navegacion.md`: (1) tocar la pestaña activa dentro de una ficha vuelve a la lista sin dejar pantallas debajo; (2) cambiar de pestaña y volver restaura la pantalla anterior; (3) una alerta de Inicio/Alertas abre la ficha en la misma pestaña y "atrás" vuelve al origen; (4) ave abierta desde una jaula vuelve a la jaula; (5) Genealogía no apila fichas sin fin; (6) toda pantalla muestra miga y título en español; (7) tocar un tramo de la miga navega a esa pantalla.
- Qué probar en el teléfono: los casos 1 a 11 en orden, con "atrás" del sistema y con la flecha de la cabecera.
- Riesgos: (a) **Flujos Maestro** tocan pestañas por coordenadas `30%/50%/90%,96%`: se mantienen cinco pestañas, mismo orden y altura de barra; verificar con smoke. (b) Los flujos de alertas (`94-inicio.yaml`, `99-alertas.yaml`) asumen hoy el salto de pestaña; tras el cambio se quedan en la pestaña de origen: hay que actualizarlos aparte (no se editan en este bloque). (c) Registrar las mismas pantallas en varias pilas duplica componentes montados: probar fugas de estado (cada pila tiene su propia instancia; es correcto). (d) `InicioScreen` pasa a ser pantalla raíz de una pila: `useFocusEffect` y recarga siguen igual.
- Archivos de pruebas afectados: 94, 99 (atajos), todos los que cuentan con cabeceras nativas con texto "DetalleAve"/etc. (ninguno según búsqueda previa: solo buscan textos de cuerpo).

## Bloque B — Login, registro y onboarding
- Alcance: `LoginScreen`, `RegistroScreen`, `SeleccionCriaderoScreen`, `estilosAcceso.js` (se sustituye por componentes del tema); `App.js` solo si hace falta pantalla de carga con identidad (estrictamente necesario); indicador de pasos 1/2 y 2/2; mostrar/ocultar contraseña; `returnKeyType`; error de API en banner (mismo texto).
- Terminado cuando: iniciar sesión, registrarse, elegir/crear criadero y "Cerrar sesión" funcionan idénticos en nube; los mensajes de error de la API se muestran sin cambios; los textos "Iniciar sesión", "Ingresar", "Crear una cuenta", "Crear cuenta", "Ya tengo una cuenta", "Crear criadero", "Toca para entrar", "Reintentar", "Cerrar sesión" y los placeholders ("correo@ejemplo.com", "Contraseña", "Tu nombre") se conservan (los flujos `10-acceso.yaml` y `lib/iniciar-sesion.yaml` los buscan). Si se cambia alguno, se anota y se actualiza el flujo aparte.
- Probar en teléfono: login con credenciales válidas e inválidas, registro con cuenta nueva, selección con uno y con varios criaderos, teclado numérico/correo, giro de pantalla.
- Riesgo: formularios con teclado abierto (KeyboardAvoidingView solo para iOS hoy; en Android los campos inferiores pueden quedar tapados: revisar con `windowSoftInputMode` actual de `app.json`, sin modificarlo).

## Bloque C — Tema, colores e iconografía
- Alcance: repintar por familias, una por entrega interna: (1) tarjetas y listas de Jaulas y Aves (`JaulaCard`, `AveCard`, `StatusBadge`), (2) formularios (Nueva jaula, Nueva ave, Alimentación, Bebida, Sanidad, Huevo, Salud, Baja, Finanzas, Catálogo), (3) Detalle de jaula y de ave, (4) Ciclo de vida y Genealogía (hoy 46 literales), (5) Más/Configuración/Clientes/Respaldo; sustituir emojis por `Icono` y los literales `#e8eeee`, `#e7f5f5`, `#fff` y similares por tokens; quitar títulos duplicados del cuerpo.
- Terminado cuando: no quedan hex literales en `src/screens` ni `src/components` salvo los de la paleta del tema y el color de parentesco; los emojis de botones y menús se sustituyen por iconos; contraste verificado; todos los `Text` conservan el significado.
- **Riesgo principal en pruebas**: los flujos buscan texto visible. Quitar el emoji de "💾 Guardar" o "＋ Nueva ave" no rompe los regex `.*Guardar ave.*` / `.*Nueva ave.*`, pero sí romperá cualquier coincidencia de texto exacto con emoji. Regla: **no cambiar palabras**; solo quitar o poner prefijos de icono; si un texto cambia, listar en `inventario-cambios.md` y proponer la actualización del flujo. Verificar los flujos antes de cada entrega con búsqueda de los textos citados en `pruebas/movil/flujos/`.
- Probar en teléfono: lectura al sol (brillo alto), tamaño de fuente grande del sistema, modo oscuro del teléfono (la app fuerza `userInterfaceStyle: light`).

## Bloque D — Listas, formularios y reducción de toques
- Alcance: botón flotante "＋" (Aves, Jaulas, Finanzas), barra de acciones fija en ficha de ave y de jaula, aviso no bloqueante en lugar del `Alert` de éxito (si se aprueba; los `Alert` de confirmación no se tocan), "Ver ave" directo (si se aprueba), alta rápida en catálogos (si se aprueba), `autoFocus`/`returnKeyType`/teclado en formularios, botón principal fijo sobre el teclado, estados de carga/vacío/error con "Reintentar" en listas, accesibilidad (etiquetas, 48 px).
- Terminado cuando: las 15 tareas de `toques-antes.md` se repiten con el conteo "después" menor o igual; ningún campo, validación ni llamada a repositorio cambió (diff revisado); los formularios siguen enviando exactamente los mismos datos.
- **Riesgo en pruebas**: Títulos duplicados (miga + título) pueden dar coincidencias dobles de texto en Maestro: usar `testID`. "Aceptar" aparece 23 veces en 15 flujos (verificado con grep; con "Ver ave" de `40` son 24 en 16) (smoke, 20, 30, 41, 50, 51, 52, 60, 70, 90, 91, 95, 96, 97, 98) y "Ver ave" en `40-aves.yaml:42`; quitar el diálogo exige actualizar esos flujos. Hasta entonces los flujos fallarían: por eso se pide la aprobación explícita (decisiones 3 y 4) y la actualización paralela de los flujos por quien los mantiene.
- Probar en teléfono: crear jaula, ave, huevo, movimiento, baja, alimentar; modo avión (error visible y botón "Reintentar"); doble toque en guardar (los botones con `disabled` actual se conservan).

## Bloque E — Inicio, Alertas, Reportes e información
- Alcance: Inicio (cifras clave, tarjetas plegables, atajos a Producción/Reportes/Alertas, estados de carga/error con reintento, guía de primeros pasos), Alertas (resumen por nivel, filtros, acciones claras), Reportes (tarjetas y filas de exportación), Producción de huevos y gráficas (`charts/`) con la paleta, Clientes y Detalle, Respaldo.
- Terminado cuando: las mismas cifras y alertas se muestran con los mismos datos (comparar con la versión anterior en una cuenta de prueba); cada pantalla informativa tiene estado vacío con indicación de qué hacer y error con reintento; los textos que buscan `94-inicio.yaml`, `97-reportes.yaml`, `98-clientes.yaml`, `99-alertas.yaml` se conservan o se anotan.
- Riesgos: Inicio es la pantalla más densa (`InicioScreen.js` 1087 líneas); el flujo `94-inicio.yaml` ya tiene una regresión pendiente (falta un `scrollUntilVisible`, según `estado-actual.md`): este bloque no la arregla; no mezclar. Observación de lógica (no se toca): un fallo de red en Inicio deja las cifras en cero sin aviso (`InicioScreen.js:173-180`); la mejora visual muestra el estado de error, no cambia el cálculo.

## Cobertura frente a la lista de pantallas

| Bloque del encargo original | Cubierto en |
|---|---|
| (a) acceso | B |
| (b) navegación e inicio | A y E |
| (c) jaulas | C (formularios y tarjetas), D (acciones) |
| (d) aves y ficha | C, D |
| (e) salud, huevos, genealogía, ciclo de vida | C, D |
| (f) finanzas y bajas | C, D |
| (g) clientes, reportes, alertas | E |
| (h) más, configuración, catálogos | C, D |

## Reglas transversales de cada bloque

1. Antes: listar los archivos a tocar y los textos que cambian; buscarlos en `pruebas/movil/flujos/`.
2. Durante: no tocar `src/api`, `src/repositories`, `api/`, `src/database`, nombres de campo, validaciones, textos de error de datos; sin dependencias nuevas.
3. Después: esbuild sobre los archivos tocados, revisión de diff, informe de máx. 25 líneas (qué cambió, qué probar en el teléfono, qué falló), anotación en `inventario-cambios.md`, esperar el visto bueno.
4. Cada bloque deja la app usable: el tema y los componentes nuevos conviven con pantallas aún sin migrar.
5. Los flujos Maestro no se editan aquí; la lista de flujos afectados se entrega con cada informe para que se actualicen aparte.
