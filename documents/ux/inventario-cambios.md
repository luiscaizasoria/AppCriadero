# Inventario de cambios de la fase UX (para poder revertir)

Fecha de inicio: 2026-11-09. Se completa tras cada bloque (un registro por pantalla: textos, navegación, componentes nuevos). Estado: bloques C0 y A implementados (Bloque A: 2026-11-09). Revertir el commit de un bloque deshace sus cambios.

## Registro por pantalla

| Bloque | Pantalla / archivo | Textos cambiados | Navegación | Componentes nuevos | Estado |
|---|---|---|---|---|---|
| C0 | Ninguna pantalla modificada. Archivos nuevos: `src/theme/{colors,typography,spacing,radii,shadows,icons,index}.js` | ninguno | ninguna | `Icono`, `Boton`, `CampoTexto`, `Tarjeta`, `Insignia`, `EstadoVacio`, `EstadoError`, `EstadoCarga`, `Aviso`, `PantallaHeader` (en `src/components/`; nadie los importa aún) | hecho (2026-11-09); revertir = borrar los archivos nuevos |
| A | `src/navigation/AppNavigator.js` | ninguno | se quita `crearListenerRutaInicial` y los 4 `listeners` `tabPress`; `backBehavior="history"`; la pestaña Inicio ahora contiene `InicioStackNavigator`. Cinco pestañas, mismo orden, misma altura (64) | ninguno | hecho (2026-11-09); revertir con git |
| A | `src/navigation/InicioStackNavigator.js` (nuevo) | ninguno | pila con raíz `InicioPrincipal` (Inicio, sin cabecera) + grupos de ave y de jaula | ninguno | hecho |
| A | `src/navigation/{Aves,Jaulas,Finanzas,Mas}StackNavigator.js` | cabeceras: ver tabla de títulos abajo | `screenOptions` = cabecera única con migas (`opcionesPila`); raíces `headerShown:false`; Aves y Jaulas usan los grupos compartidos; Más registra además los grupos de ave y jaula | ninguno | hecho |
| A | `src/navigation/pantallasCompartidas.js` (nuevo) | ninguno | `pantallasAve(Stack)` y `pantallasJaula(Stack)` se registran en Inicio, Jaulas (ambos), Aves (ave) y Más (ambos); `getId` por `aveId`/`jaulaId` en `DetalleAve`, `GenealogiaAve`, `DetalleJaula`, `DetalleJaulaInactiva` (navegar a una ficha ya abierta la trae al frente, no apila copias) | ninguno | hecho |
| A | `src/navigation/{CabeceraPila,opcionesPila,titulos,contextoPantalla}.js` (nuevos) | títulos en español en `titulos.js` | cabecera: flecha atrás + migas tocables (cada tramo hace `pop` hasta esa pantalla; la primera miga es la sección y vuelve a la raíz) + título | usa `PantallaHeader` | hecho |
| A | `src/components/PantallaHeader.js` | ninguno | prop `onAtras` (flecha); `migaToque` minHeight 44; sin `accessibilityRole="header"` duplicado | ninguno | hecho |
| A | `InicioScreen.js` (780-837) | ninguno | `navigate('Aves'|'Jaulas',{screen,params})` pasa a `navigate('DetalleAve'|'BebidaJaula'|'AlimentacionJaula'|'DetalleJaula', {id})` en la misma pestaña | ninguno | hecho |
| A | `AlertasScreen.js` (574-664) | ninguno | igual que Inicio, dentro de la pila de Más: "atrás" vuelve a Alertas | ninguno | hecho |
| A | `DetalleJaulaScreen.js`, `DetalleJaulaInactivaScreen.js` | ninguno | `abrirAve` hace `navigate('DetalleAve',{aveId})` en la misma pila (se elimina la rama con `Alert` "No fue posible abrir el detalle del ave." porque ya no depende de `getParent()`); publican `jaula.codigo` para las migas | hook `useContextoPantalla` | hecho |
| A | `DetalleAveScreen.js` | ninguno | publica `ave.codigo` para las migas | hook `useContextoPantalla` | hecho |
| A | `GenealogiaAveScreen.js` (512, 982) | ninguno | `push` pasa a `navigate` (con `getId`: sin cadenas ilimitadas de fichas). La ficha NO lee `desdeGenealogia`: la cabecera con migas y la flecha ya vuelven al árbol | ninguno | hecho |
| A | `DetalleJaulaInactivaScreen.js` (import) | ninguno | ninguna | ninguno | se quita el import de `Alert` sin uso (quedó tras eliminar la rama de `abrirAve`) |
| A | Resto de pantallas de las pilas | cabecera nativa (con nombres técnicos) sustituida por la cabecera única: ver tabla | ninguna | `PantallaHeader` vía `CabeceraPila` (`testID` `cabecera`, `cabecera-atras`, `cabecera-miga-N`) | hecho |

### Títulos de cabecera (Bloque A)

| Pantalla | Antes (cabecera nativa) | Ahora |
|---|---|---|
| `NuevaAve` | NuevaAve | Nueva ave (Editar ave si `modoEdicion`) |
| `DetalleAve` | DetalleAve | Ficha del ave |
| `EvolucionAve` | EvolucionAve | Evolución |
| `SaludAve` | SaludAve | Salud |
| `FinalizarTratamiento` | FinalizarTratamiento | Finalizar tratamiento |
| `BajaAve` | BajaAve | Dar de baja |
| `RegistrarHuevo` | RegistrarHuevo | Registrar huevo (mismo texto que el botón que la abre; antes se había puesto "Registro de huevo", corregido: ver flujo 70) |
| `GenealogiaAve` | Árbol genealógico | Genealogía |
| `CicloVidaAve`, `NuevaJaula`, `DetalleJaula`, `DetalleJaulaInactiva`, `SeleccionarAveJaula`, `AlimentacionJaula`, `BebidaJaula`, `SanidadJaula`, `HistorialJaula`, `NuevoMovimientoFinanciero`, `EditarMovimientoFinanciero`, `Configuracion`, `Catalogo`, `EditarCatalogoItem`, `ProduccionHuevos`, `Clientes`, `DetalleCliente`, `Reportes`, `Backup`, `Alertas` | (ya en español) | sin cambio de texto; ahora con migas (p. ej. "Más › Configuración › Razas") |

Acceso (Login, Registro, Selección de criadero) no se toca: es el Bloque B. Las raíces (Inicio, Jaulas, Aves, Finanzas, Más) conservan su título en el cuerpo (se unifica en el Bloque C).

Cada fila: archivo, texto antes -> después, cambio de navegación (origen -> destino), componentes del tema usados, `testID` añadidos.

## Cambios de navegación (previstos y hechos en el Bloque A; detalle en `mapa-navegacion.md`)

- `src/navigation/AppNavigator.js`: eliminar el listener `tabPress`; `backBehavior="history"`; nueva `InicioStack`; insignia de alertas en Más.
- `InicioScreen.js:780-837`, `AlertasScreen.js:574-664`, `DetalleJaulaScreen.js:216`, `DetalleJaulaInactivaScreen.js:107`: `navigate('Aves'|'Jaulas',{screen})` pasa a navegar dentro de la misma pestaña.
- `GenealogiaAveScreen.js:512,982`: sin `push` ilimitado; la ficha no lee `desdeGenealogia` (nadie lo lee; la cabecera con migas y la flecha vuelven al árbol).
- `src/components/*` y `src/theme/*`: nuevos.

## Textos visibles cambiados que usan flujos Maestro

Los flujos de `pruebas/movil/flujos/` buscan por texto visible y no se editan en la fase UX; se actualizan aparte.

| Texto actual | Dónde lo usan los flujos | Cambio previsto | Flujos afectados |
|---|---|---|---|
| "Aceptar" (`Alert` de éxito) | 23 veces en 15 flujos (smoke `01`, `20`, `30`, `41`, `50`, `51`, `52`, `60`, `70`, `90`, `91`, `95`, `96`, `97`, `98`; verificado con grep) | aviso no bloqueante: desaparece el botón (mismo mensaje) | esos 15 |
| "Ver ave" | `40-aves.yaml:42` (con él, 24 coincidencias en 16 flujos) | "Ver ave" solo navega a la ficha | `40` |
| Emojis en botones y títulos ("💾 Guardar...", "🥚 Registrar huevo") | selectores con texto o regex | se retiran (iconos Ionicons); los regex `.*Guardar ave.*` siguen valiendo, los de texto exacto con emoji no | por revisar en el Bloque C |
| Títulos y migas repetidos (p. ej. "Salud") | selectores por texto | coincidencias dobles; usar `testID` | revisado en el Bloque A (filas siguientes) |
| **Bloque A** Título de `RegistrarHuevo`: "RegistrarHuevo" -> "Registrar huevo" | `70-huevo.yaml:23-27` toca `.*Registrar huevo.*` con `index`: el título y el botón ya tienen el mismo texto, así que el `index` debe actualizarse (lo actualiza validador-ux) | actualizar `index` | `70` |
| **Bloque A** Título "Árbol genealógico" -> "Genealogía" (`GenealogiaAve`) | ningún flujo busca "Árbol genealógico" (grep). `.*Genealogía` (`80:21-22`, `90:149-150`) se usa en la ficha, no en el árbol | ninguno | ninguno |
| **Bloque A** Título "BajaAve" -> "Dar de baja" | `.*Dar de baja.*` en `90`, `91`, `96`, `98` se toca en la ficha (botón), no en la pantalla de baja; si algún flujo repitiera el toque estando en la pantalla de baja habría dos coincidencias | solo si se repite | ninguno por ahora |
| **Bloque A** Títulos "Ficha del ave", "Evolución", "Salud", "Finalizar tratamiento"... (nuevos en cabecera) y migas "Aves", "Jaulas", "Más", "Finanzas", "Inicio", código del ave/jaula | `tapOn: "Jaulas"` (`01-smoke:18`, `30-jaulas:15`), `tapOn: "Más"` (`01`, `10`, `20`, `71`) se hacen desde Inicio/raíz, sin migas: sin cambio. `lib/iniciar-sesion.yaml:17` espera "Jaulas" (barra, Inicio). Los `.*Salud`, `.*Bebida`, `.*Historial`, `.*Sanidad`, `.*Alimentación` (`50`-`53`, `60`) se tocan en la ficha de jaula/ave, donde solo hay migas de pantallas anteriores ("Jaulas", "Aves") y título "Detalle de jaula"/"Ficha del ave": sin coincidencia. En pantallas hijas el código del ave aparece también en la miga (p. ej. `AV-P` en Salud): los `tapOn: ".*AV-..*"` de las listas y los `assertVisible` no se ven afectados; un `tapOn` por código en una pantalla hija tocaría la miga (primera coincidencia) | revisar si se añaden `tapOn` por código dentro de pantallas hijas | ninguno hoy |
| **Bloque A** Tocar la pestaña activa vuelve a la raíz de su pila; cambiar de pestaña y volver RESTAURA la pila (antes forzaba la raíz) | los flujos usan `point: 90%,96%` y esperan un texto de la raíz de Más ("Compradores e historial de ventas por celular"): sigue valiendo al estar en Más (pestaña activa = pop a la raíz). Si un flujo vuelve a una pestaña distinta de la activa, ahora ve la pantalla donde la dejó, no la lista (revisar los que cambian de pestaña con una ficha abierta: `94`, `97`, `98`, `99`, `40`-`42`, `90`, `96`) | actualizar si fallan | `94`, `97`, `98`, `99`, posibles `40`-`42`, `90`, `96` |
| **Bloque A** Salto de pestaña de Inicio/Alertas (navegación, no texto) | `94-inicio.yaml`, `99-alertas.yaml`: desde Inicio la alerta abre la ficha/acción en la pestaña Inicio y `back` vuelve a Inicio; desde Alertas (Más) abre dentro de Más y `back` vuelve a Alertas (`99:61-70` suponía volver a Inicio y la pila de Más vacía) | se quedan en la pestaña de origen | `94`, `99` |
| **Bloque A** "Atrás" del teléfono (`back` de Maestro) | `back` en raíz de una pestaña va a la pestaña anterior (`backBehavior="history"`), no a Inicio (`99:61-66`, `97`) | actualizar | `97`, `99` y los que usen `back` |
| Pestañas por coordenadas `30%/50%/90%,96%` | todos | se conservan cinco pestañas y altura de barra | todos |
| Catálogos: "Nuevo elemento" / "Guardar" / "Aceptar" | `20-catalogos.yaml` | alta rápida en la lista | `20` |

## Sub-bloque C1 (variante 1 «Pajarera tropical», 2026-11-09)

Ninguna pantalla de `src/screens/` modificada. Revertir = revertir el commit de C1 (archivos nuevos: borrar).

| Archivo | Cambio |
|---|---|
| `src/theme/colors.js` | Tokens de la variante 1 (primario `#6D3BD2`, secundario `#C2188F`, turquesa, coral `#CC312A`, estados con texto/suave, deshabilitado `#5F5B73` sobre `#E6E3EE`, degradados). Se conservan las claves de C0 |
| `src/theme/typography.js` | `fontFamily` Fredoka (títulos, botón, cifras) y Nunito (cuerpo); escala de la propuesta §2; sin `fontWeight` (cada peso es una familia). Alias C0 `tituloTarjeta` y `micro` |
| `src/theme/{radii,shadows,spacing}.js` | radios 10/16/22/28/99; sombras con tinte `resumen`, `flotante`, `barra` (se quitan `card` y `raised`: sin sombra por fila); `spacing.pantalla` 16, `touchMin` 44 |
| `src/theme/fuentes.js` (nuevo), `movimiento.js` (nuevo), `icons.js`, `index.js` | registro de los 5 TTF por import profundo; hook `useReducirMovimiento` (alias `useAnimacionesReducidas`); iconos `masActivo` y `sinConexion` |
| `src/components/` nuevos | `Pulsable` (44x44, escala 0,97, brillo), `Chip`, `IconoCirculo`, `Avatar`, `FondoPantalla` (1 degradado de 3 paradas), `Mascota` (react-native-svg), `Fab`, `PantallaEspera` |
| `src/components/` reescritos (misma API de props) | `Boton` (58/52/50, sólido, deshabilitado punteado), `CampoTexto` (54, foco con halo, icono, error con icono), `Tarjeta` (borde 1 px, sin sombra, `franja`), `Insignia` (ahora alias de `Chip`), `Aviso` (franja 6 px; no usado aún), `EstadoVacio`/`EstadoCarga`/`EstadoError` (mascota; «No se pudo conectar» y «Reintentar»), `PantallaHeader` (degradado, esquinas 34, círculos decorativos, contenido con `paddingRight` 110, migas blancas; mismos `testID` `cabecera`, `cabecera-atras`, `cabecera-miga-N`; área táctil 44x44) |
| `src/navigation/BarraPestanas.js` (nuevo), `AppNavigator.js` | barra inferior propia a ancho completo, mínimo 64 de alto, cinco pestañas al 20 % (toques `30%/50%/70%/90%,96%` siguen cayendo en la misma pestaña), cápsula primaria en la activa, icono de Más pasa de `settings` a `ellipsis-horizontal-circle`; insignia con `obtenerResumenAlertas().total` (se relee al cambiar de pestaña, máx. una vez cada 10 s). `testID` `tab-inicio`, `tab-jaulas`, `tab-aves`, `tab-finanzas`, `tab-mas`, `tab-mas-insignia` |
| `src/navigation/CabeceraPila.js` | usa `insetSuperior` de `PantallaHeader` (el degradado cubre la barra de estado) |
| `App.js` | `useFonts` en paralelo con el arranque; pantalla de espera (`PantallaEspera`, sin texto hasta que carguen las fuentes). «Preparando Criadero Kikirikis...» conserva el texto (ningún flujo lo busca); el cargador de sesión pasa a la misma pantalla sin texto. Si las fuentes fallan, sigue con la del sistema |

Textos visibles cambiados: ninguno de los que usan los flujos. Nuevos: el número de alertas pendientes sobre el icono de Más (insignia roja; accesibilidad: `accessibilityHint` «N alertas pendientes») y «No se pudo conectar» (título por defecto de `EstadoError`, sin uso aún).

Correcciones del validador (2026-11-09), sin cambio de texto ni estructura:

- `src/components/Pulsable.js`: la opacidad del `style` (p. ej. `apagado` 0,5 de `Boton`) ya no se pisa; se multiplica por el brillo (`Animated.multiply`). Los botones terciarios y de texto deshabilitados se ven apagados.
- `App.js`: tope de 4 s a la espera de `useFonts`; pasado ese tiempo se deja `PantallaEspera` y se arranca con la fuente del sistema (el arranque de base de datos, sesión y criadero no cambia).
- `src/theme/movimiento.js`: un único listener compartido de "reducir movimiento" (antes uno por componente).

Flujos Maestro a revisar tras C1 (no se editan aquí):

| Flujo y línea | Motivo |
|---|---|
| `pruebas/movil/flujos/completo/94-inicio.yaml` (`scrollUntilVisible`, líneas 34-111) | la cabecera de las pilas es más alta (la raíz Inicio no usa cabecera, así que su scroll no cambia); revisar al tocar Inicio en C3 |
| `82:46`, `83:53`, `84:50`, `86:60` (`id: "cabecera-miga-N"`/`"cabecera-atras"`) | los `testID` se conservan; la miga ahora es blanca sobre degradado, mismo texto |
| `40-aves.yaml:17`, `41:18`, `81:18`, `82:19`, `83:19`, `84:23,29`, `85:19,29,34,47`, `86:38,45`, `90:19`, `94:71` (`point: "30%/50%/70%/90%,96%"`) | sin cambio previsto: barra a ancho completo con cinco pestañas iguales |
| `lib/iniciar-sesion.yaml:17` y `tapOn: "Jaulas"`/`"Más"` | siguen valiendo: las etiquetas de la barra mantienen el texto |
| Cualquier flujo que cuente texto numérico en Más | la insignia añade un número (p. ej. «3») en la pestaña Más cuando hay alertas |

## Sub-bloque C2 (Login, Registro, Selección de criadero; 2026-11-09)

Sin pantallas de onboarding en la app: «Onboarding» = selección/creación de criadero. Lógica, validaciones, llamadas a `src/api` y mensajes de error sin cambio. Revertir = revertir el commit de C2 (`componentesAcceso.js` nuevo; `estilosAcceso.js` borrado, ya sin importadores).

| Archivo | Cambio |
|---|---|
| `src/screens/acceso/componentesAcceso.js` (nuevo) | `PantallaAcceso` (FondoPantalla con 1 degradado, `StatusBar` oscura, mascota, «Criadero Kikirikis», tarjeta blanca radio 28), `CampoContrasena` (ojo 44x44; «Mostrar/Ocultar contraseña») y `MensajeError` (Aviso de error, mismo texto) |
| `LoginScreen.js` | Mascota saltando, lema nuevo «Control de aves, fácil», `CampoTexto` con iconos, `Boton` sólido 58 con spinner mientras envía, «Crear una cuenta» terciario. testID: `pantalla-login`, `login-correo`, `login-contrasena`, `login-ingresar`, `login-crear-cuenta` |
| `RegistroScreen.js` | Igual, mascota compacta. testID `registro-*` |
| `SeleccionCriaderoScreen.js` | Tarjetas pulsables con `IconoCirculo` y flecha; formulario con `CampoTexto` e iconos; «Reintentar», «Crear otro criadero» y «Cerrar sesión» como `Boton`; carga con `EstadoCarga` |

Textos nuevos (ningún flujo los busca): «Criadero Kikirikis», «Control de aves, fácil», «Cargando tus criaderos...» (antes solo spinner), «Mostrar contraseña»/«Ocultar contraseña» (accesibilidad). Textos existentes sin cambio: «Iniciar sesión», «Ingresar», «Contraseña» (etiqueta y placeholder, `index: 1` de los flujos sigue siendo el campo), «correo@ejemplo.com», «Crear una cuenta», «Cerrar sesión», nombres de criadero.

Riesgo para flujos: «Iniciar sesión» sigue siendo el título (smoke `01:40`, `10-acceso:24,41`). Mientras envía, el botón muestra spinner en lugar del texto «Ingresando...»/«Creando...» (la etiqueta de accesibilidad conserva el texto).

## Sub-bloque C3 (Inicio y Alertas; 2026-11-09)

Lógica, repositorios llamados (`obtenerDashboard`, `obtenerTodasLasAlertas`, `obtenerResumenAlertas`), cálculo de cada dato, filtros, mensajes y navegación de las alertas (`DetalleAve`, `BebidaJaula`, `AlimentacionJaula`, `DetalleJaula`) sin cambio. Revertir = revertir el commit de C3 (nuevos: `BarraEstado`, `TituloSeccion`, `ResumenAlertas`, `AccesoRapido`).

| Archivo | Cambio |
|---|---|
| `InicioScreen.js` | `FondoPantalla` (1 degradado) + `PantallaHeader` (2.º degradado) con título «Criadero Kikirikis» y subtítulo «Estado general del criadero» (nueva prop `subtitulo`); secciones con `TituloSeccion` (icono en círculo en lugar del emoji); métricas en `MetricCard` de color (cifra Fredoka 38); aviso «N alertas por atender» (solo si N>0; abre Más > Alertas) y 3 accesos rápidos (Nueva ave -> `NuevaAve`; Nuevo movimiento -> `Finanzas/NuevoMovimientoFinanciero`; Alertas -> `Más/Alertas`; todos con `initial:false`; sin «Registrar huevo»). Estados: carga (`EstadoCarga`, sin cabecera, igual que antes de cargar), error (`EstadoError` con «Reintentar» = misma `cargar`; solo si falló y no hay datos) y vacío de alertas (`EstadoVacio`). Orden de secciones igual que V1. testID: `inicio-cabecera`, `inicio-aviso-alertas`, `acceso-nueva-ave`, `acceso-nuevo-movimiento`, `acceso-alertas`, `inicio-alerta-N`, `inicio-alertas-vacio` |
| `AlertasScreen.js` | `FondoPantalla`; filtros como píldoras de 44 con icono + texto (testID `filtro-todas`, `filtro-salud`...); resumen con `ResumenAlertas`; vacío con `EstadoVacio`; carga y error (con «Reintentar») como Inicio. Se quita el título «Alertas» del cuerpo (ya lo muestra la cabecera de la pila); el texto «Estado y pendientes del criadero» se conserva. Se elimina un `obtenerResumenAlertas` duplicado y sin uso que estaba al final del archivo (la barra, Más e Inicio usan el del repositorio) |
| `AlertCard.js` | Tarjeta con franja (crítica = roja, advertencia = naranja), círculo de icono por tipo, chip con icono + texto («Crítica» / «Advertencia»), tipo («Salud», «Jaula», «Producción», «Finanzas»; antes el código en mayúsculas), título, mensaje y acción de 48 (mismos textos con flecha, sin emoji). Toda la tarjeta sigue siendo el área de toque |
| `MetricCard`, `ProductionMetricCard`, `ProductionInfoCard`, `charts/{ProgressBar,FinanzasBarChart,ProduccionBarChart}` | Restyling con el tema, emojis -> iconos; misma estructura de `Text` (valor + sufijo en un solo texto) |
| `components/{BarraEstado,TituloSeccion,ResumenAlertas,AccesoRapido}.js` (nuevos) | `BarraEstado`: `StatusBar` solo con la pantalla enfocada (`light` sobre cabecera violeta, `dark` sobre fondos claros); `ResumenAlertas`: contadores de color, cada uno un solo `Text` («Críticas: 0») |
| `CabeceraPila.js` | `BarraEstado estilo="light"` (barra de estado legible sobre el degradado) |
| `BarraPestanas.js` | La insignia de Más se relee solo al enfocar Inicio o Más (antes en cada cambio de pestaña), máx. una vez cada 10 s; sin tocar repositorios |
| `LoginScreen.js`, `Boton.js` | «Ingresar»: `Boton` con nueva prop `atenuado` mientras envía (apagado al 50 %, no acepta otro toque, conserva el texto «Ingresando...» y sin spinner). Registro y Selección de criadero siguen con `cargando` |
| `Mascota.js` | Bucle FINITO: 3 saltos y queda quieta (prop `saltos`); sin saltos con «reducir movimiento» |

Textos visibles (antes -> después) y flujos que los usan (`pruebas/movil/flujos/completo/`):

| Antes | Después | Flujos |
|---|---|---|
| «Aves» (título de sección de Inicio) | «Tus aves registradas» (aprobado) | ninguno lo busca; `tapOn: "Aves"` es la barra |
| «🐔 Distribución por raza», «🥚 Producción», «📈 Indicadores», «📊 Producción últimos días», «🔔 Alertas», «💰 Finanzas del mes», «🏠 Jaulas» | mismo texto sin emoji | `94:62` (`.*Finanzas del mes.*` sigue valiendo); el resto no se busca |
| «🥚 Promedio huevos diarios» | «Promedio huevos diarios» | `94:48` (regex `.*...*`, vale) |
| «🔴 Críticas: N», «🟡 Advertencias: N», «🔔 Total: N» (Inicio y Alertas) | «Críticas: N», «Advertencias: N», «Total: N» (un solo texto, con icono aparte) | `94:50-53,107-109`, `99:36-40,63-65,76-78,113-114` (regex `.*Total: 3.*`, valen) |
| «🏠 Total: N», «🐔 Ocupadas: N» (Jaulas de Inicio) | «Total: N», «Ocupadas: N» | `94:63-65` (valen) |
| «✅ No existen alertas pendientes.» / «✅ No existen alertas.» | mismo texto sin emoji | `94:54,116`, `99:41,118` (`assertNotVisible .*No existen alertas.*`, valen) |
| Acciones «💧 Registrar bebida →», «🍚 Registrar alimentación →», «🐔 Revisar ave →» | sin emoji (conservan la flecha) | `99:53-55`, `86:26-27,54-55` (regex `.*Registrar ...*`, valen) |
| Tipo de alerta en mayúsculas («SALUD», «JAULA»...) | «Salud», «Jaula», «Producción», «Finanzas» | ninguno los busca |
| Filtros «🩺 Salud», «🏠 Jaulas», «🥚 Producción», «💰 Finanzas» | sin emoji, con icono | ninguno |
| Barras de Inicio «💰 Ingresos», «📉 Egresos», «📊 Utilidad» | «Ingresos», «Egresos», «Utilidad» | ninguno (`94:67` busca `$0.00`, se conserva) |
| (nuevos) «N alertas por atender», «Accesos rápidos», «Nueva ave», «Nuevo movimiento», «Alertas» (acceso), «Crítica», «Advertencia» (chips) | — | «Nueva ave» y «Nuevo movimiento» también los buscan `40:22`, `82:55`, `84:33,45`, `85:49`, `95:27,50` con la pestaña de Aves o Finanzas activa; con Inicio inactivo sus pantallas se desmontan de la vista, pero vigilar `85:49` (cambio de pestaña) |
| «🔔 N» (insignia de Más, `AlertBadge`) | SIN CAMBIO en C3 (es de Más, bloque h) | `99:29` (`.*🔔 3.*`) sigue valiendo hasta ese bloque; entonces hay que actualizarlo |
| Cabecera de Inicio | ahora fija, fuera del scroll, y solo aparece cuando cargan los datos (igual que el título de V1) | `94:23-24`, `84:19`, `85:60`, `86:23` esperan «Estado general del criadero»: sin cambio |

Correcciones del validador (2026-11-09):

- Subtítulos «Estado general del criadero» (Inicio) y «Estado y pendientes del criadero» (Alertas) QUITADOS (el usuario pidió omitirlos). Los flujos `94:23-24`, `84:19`, `85:60`, `86:23` que esperan «Estado general del criadero» deben actualizarse (usar `inicio-cabecera` o «Criadero Kikirikis»).
- Navegación: `InicioStackNavigator` registra ahora `Alertas` y `NuevoMovimientoFinanciero`; el aviso «N alertas por atender», «Alertas» y «Nuevo movimiento» navegan DENTRO de la pestaña Inicio (`navigation.navigate('Alertas')` / `('NuevoMovimientoFinanciero')`, sin `initial:false`). Flecha, miga «Inicio ›» y «atrás» del teléfono vuelven a Inicio. Siguen registradas en sus pilas originales (Más, Finanzas). Se sustituye lo anotado arriba sobre `Más/Alertas` y `Finanzas/NuevoMovimientoFinanciero`.
- testID `cliente-compras` en el valor de «Compras» (`ClientesScreen` `Metric`, `DetalleClienteScreen` `SummaryMetric`; en la lista se repite por cliente).
- `Boton`: `accessibilityState.busy` también con `atenuado` (disabled ya incluía `atenuado`).
- CAMBIO VISUAL APROBADO RESPECTO A V1: ante un fallo de red, Inicio y Alertas muestran el estado de error con la mascota y «Reintentar» (V1 dejaba ceros). Aprobado por el usuario en esta fase («estados de error con la mascota»). La carga no cambia.
- PENDIENTES DE DECISIÓN (mantenidos, sin aprobación explícita): «Accesos rápidos», «Nueva ave», «Nuevo movimiento», «Alertas» (acceso), chips «Crítica»/«Advertencia» y tipos de alerta en minúsculas («Salud», «Jaula», «Producción», «Finanzas»).

Riesgos para `94-inicio.yaml`: la primera pantalla tiene cabecera, aviso (si hay alertas), 4 tarjetas y 3 accesos antes de «Distribución por raza»; «Aves activas: N», «Razas presentes: N», «Vendidas», «Fallecidas» y «Tratamiento» siguen en la primera pantalla en un teléfono de ~900 dp (estimado, no medido; con pantallas más bajas hay que añadir un `scrollUntilVisible` antes de `94:27`). El `scrollUntilVisible` pendiente de `94:111` no se toca aquí.

## Sub-bloque C4-Aves (lista, ficha y Nueva/Editar ave; 2026-11-09)

Lógica, repositorios llamados, validaciones, mensajes de error, nombres de campo y los `Alert` de error y de confirmación sin cambio. Revertir = revertir el commit de C4 (nuevos: `AveOpcion`, `AveSelectorCatalogo`, `AveAccion`, `aveVisual.js`). No se tocó ningún componente compartido ni `src/theme`. `SeleccionarAveJaulaScreen` no se toca (la usa el flujo de jaulas).

| Archivo | Cambio |
|---|---|
| `AvesScreen.js` | `FondoPantalla` + `PantallaHeader` «Aves» (sin subtítulo «Control y trazabilidad de las aves»: decorativo, omitido como en C3) + `FlatList` (antes `ScrollView`); pestañas en píldora con icono + texto; búsqueda con `CampoTexto`; filtros con `AveOpcion` (icono + texto) y edad con `CampoTexto`; `Fab` coral «Nueva ave» (misma navegación `NuevaAve`, solo en Activas) en lugar del botón de ancho completo; carga `EstadoCarga` («Cargando aves...»), error `EstadoError` (mismo mensaje y «Reintentar» = `cargarAves`), vacío `EstadoVacio`. testID: `aves-cabecera`, `tab-aves-activas|vendidas|fallecidas`, `buscar-ave`, `filtros-aves`, `edad-desde`, `edad-hasta`, `limpiar-filtros`, `fab-agregar-ave` |
| `AveCard.js` | `Tarjeta` pulsable (testID `lista-ave-<codigo>`), `Avatar` (círculo de color por sexo/estado) o foto, chips icono + texto (sexo, estado, salud), edad/jaula, padres con icono |
| `DetalleAveScreen.js` | `FondoPantalla`; tarjeta de cabecera (avatar 72, código, raza, chips salud y estado); `Tarjeta` + `TituloSeccion` por sección; acciones en mosaicos `AveAccion` con círculo de color. NUEVO: si falla la carga y no hay ave, `EstadoError` con «Reintentar» (antes mostraba «Ave no encontrada.»; ese texto se conserva para el caso sin ave). testID: `ficha-ave-cabecera`, `ficha-ave-salud`, `accion-editar-ave`, `accion-evolucion-ave`, `accion-salud-ave`, `accion-registrar-huevo`, `accion-ciclo-vida`, `accion-genealogia`, `accion-dar-de-baja` |
| `NuevaAveScreen.js` | `FondoPantalla`; una `Tarjeta` por sección; `CampoTexto` en todos los campos; opciones con `AveOpcion`; fecha con `CampoFecha` local; «Guardar ave»/«Guardar cambios» FIJO abajo (`Boton` con icono, mismo texto, `atenuado` mientras guarda o muestra el aviso; sin doble toque con un `ref`); se quita el título del cuerpo («Nueva ave»/«Editar ave») porque ya lo muestra la cabecera de la pila. testID: `codigo-ave`, `guardar-ave`, `foto-camara`, `foto-galeria`, `origen-nacida`, `origen-comprada`, `fecha-nacimiento`, `fecha-ingreso`, `edad-meses-compra`, `criadero-origen`, `metodo-envio`, `peso-gramos`, `altura-cm`, `largo-cm`, `caracteristicas`, `raza-<nombre>`, `sexo-<nombre>`, `aviso-ave` |

Comportamientos aprobados aplicados:

- «Ver ave» directo: tras `crearAve`, en vez del `Alert` con «Ver ave», se muestra el `Aviso` de éxito y 1,5 s después `navigation.replace('DetalleAve', {aveId})` (mismo destino). Hay que esperar ese tiempo para que el aviso se vea (el temporizador se cancela si se sale de la pantalla).
- Aviso no bloqueante: los `Alert` de ÉXITO «Ave registrada» y «Ave actualizada» pasan a `Aviso` con el mismo mensaje (`El ave X fue registrada correctamente.` / `Los datos del ave X fueron actualizados correctamente.`); se pierde el título «Ave registrada»/«Ave actualizada» (el `Aviso` solo tiene mensaje). «Editar»: tras el aviso hace `goBack()` (lo que hacía «Aceptar»). Se conservan como `Alert`: todos los de validación y error, «Edición no disponible» (con «Aceptar») y los de permiso de foto.

Textos visibles (antes -> después) y flujos (`pruebas/movil/flujos/completo/`):

| Antes | Después | Flujos |
|---|---|---|
| «Ave registrada» (título del `Alert`) | desaparece; el aviso muestra solo «El ave X fue registrada correctamente.» | `40-aves.yaml:38-39` (`visible: "Ave registrada"`) ROMPE: usar `.*fue registrada correctamente.*` |
| «Ver ave» (botón del `Alert`) | desaparece; navega solo | `40-aves.yaml:42` (`tapOn: "Ver ave"`) ROMPE: quitar el toque; esperar `.*AV-H.*` (ya en `:43-45`, tras 1,5 s) |
| «Ave actualizada» | desaparece (solo el mensaje) | ningún flujo lo usa |
| Botón «＋ Nueva ave» (ancho completo) | `Fab` «Nueva ave» (mismo texto) | `40:22`, `82:55`, `85:49` (`.*Nueva ave.*`) valen; con la lista vacía el mensaje NO repite «Nueva ave» para no duplicar coincidencias |
| «🐔 Activas», «💰 Vendidas», «⚰ Fallecidas» | «Activas», «Vendidas», «Fallecidas» (icono aparte) | `90:104,143`, `98:62,67,107`, `91:45`, `90:74` (`.*Activas`, `.*Vendidas`, `.*Fallecidas`) valen. Vacíos: «Aún no hay ventas de aves» / «Aún no hay bajas por fallecimiento» (no terminan en esas palabras) |
| «⚙ Filtros» | «Filtros» | ninguno |
| Filtros «🐓 Macho», «🐔 Hembra», «🟢 Sana», «🔴 Enferma», «🟡 Tratamiento» | sin emoji (icono) | ninguno (`40:32-33` busca `.*Macho` en el formulario) |
| «Sin resultados» (siempre que la lista quedaba vacía) | con filtros: «Sin resultados» (igual); sin aves: «Aún no hay aves registradas» + «Toca el botón de abajo para registrar la primera.» (vendidas/fallecidas: ver arriba) | ninguno |
| AveCard: «🐓 Macho»/«🐔 Hembra», «🟢 Sana», «🟡 En tratamiento», «🔴 Enferma», «🐓 Padre: X», «🐔 Madre: X» | «Macho», «Hembra», «Sana», «En tratamiento», «Enferma», «Padre: X», «Madre: X» (iconos aparte) | `60:31` (`.*En tratamiento.*`) vale |
| Ficha: «🐔 Información del ave», «🥚 Huevos registrados», «💰 Información de venta», «⚰ Información de fallecimiento» | sin emoji (icono en círculo) | `70:33`, `90:83,138`, `91:52-53` (regex `.*...*`) valen |
| Ficha, acciones: «✏️ Editar», «📸 Evolución», «🩺 Salud», «🥚 Registrar huevo», «🌿 Ciclo de vida», «🌳 Genealogía», «⚫ Dar de baja» | mismo texto sin emoji, en mosaico | `42:23-24` (`.*Editar`), `60:20-21`, `82:28-29`, `85:42-43` (`.*Salud`), `70:20-21`, `81:21-22`, `90:94-95`, `91:57-58` (`.*Ciclo de vida`), `80:21-22`, `90:149-150` (`.*Genealogía`), `90:25-26,110-111`, `91:24-25`, `96:25-26`, `98:28-29,73-74` (`.*Dar de baja.*`) valen. Cuidado: no hay otro texto que termine en «Salud», «Editar», «Genealogía» ni «Ciclo de vida» en la ficha |
| Ficha, sexo «🐓 Macho» / «🐔 Hembra» | «Macho» / «Hembra» (icono) | ninguno |
| Ficha: estado de salud «🟢 Sana»... en cabecera | chip con icono; texto «Sana» / «En tratamiento» / «Enferma» | `60:31` vale |
| Nueva ave: «✏️ Editar ave» / «🐔 Nueva ave» (título del cuerpo) | se quita (la cabecera de la pila ya dice «Nueva ave»/«Editar ave») | ninguno |
| «💾 Guardar ave» / «💾 Guardar cambios» / «Guardando...» | «Guardar ave» / «Guardar cambios» / «Guardando...» (icono aparte; barra fija abajo) | `40:35,37`, `42:35-36` (`.*Guardar ave.*`, `.*Guardar cambios.*`) valen; `96:77` `assertNotVisible .*Guardar cambios.*` no cambia |
| «📷 Cámara», «🖼️ Galería», «🐣 Nacida en criadero», «🛒 Comprada», «🐔 {raza}», «🐔 {código}», «🏠 {jaula}» | sin emoji (icono) | `40:30` (`.*Kikiris`), `40:28-29` (`.*AV-P.*`, `.*AV-M.*`), `40:32-33` (`.*Macho`) valen |
| Campo «Código *»: etiqueta y `placeholder` | iguales; el campo lleva `accessibilityLabel` «Código del ave» para que «Código *» no coincida con la etiqueta y el campo a la vez | `42:26,30` (`'Código *'`, `below:`), `40:23` (`"Ej. K001"`) valen |
| Cabecera de la lista: subtítulo «Control y trazabilidad de las aves» | se quita | ninguno |

Pares de contraste: ninguno nuevo. Se reutilizan: blanco sobre primario 6,6:1 (opción y pestaña seleccionada), texto sobre `surfaceAlt` (opción sin seleccionar), `primaryDark` sobre `primarySoft` (contador y fecha estimada), blanco sobre `textSecondary` 7,2:1 (avatar de ave fallecida), blanco sobre `coral` 5,2:1 (Fab) y `successText` sobre `successSoft` 7,4:1 (aviso).

Pendiente: `NuevaAveScreen` sigue usando `Number(item.id)` en los filtros de padres (observación de las limitaciones conocidas; no se toca).

## Sub-bloque C4-Jaulas (lista, ficha, nueva/editar, cuidados e historial; 2026-11-09)

Lógica, repositorios llamados, validaciones, mensajes de error, nombres de campo y navegación sin cambio. Los Alert de ERROR y de CONFIRMACIÓN (Quitar ave, Eliminar jaula, Código requerido, Código duplicado, Seleccione alimento/bebida, errores de guardado, incl. los `try/catch` con `Alert` de Alimentación y Bebida) siguen idénticos. Solo los Alert de ÉXITO pasan a aviso no bloqueante (`JaulaAviso`): mismo título y mismo mensaje en dos textos separados, visible 1,8 s y luego hace solo la navegación que hacía «Aceptar» (`goBack`); sin `goBack`, visible 4 s. Mientras tanto el botón queda atenuado (sin doble toque). Revertir = revertir el commit de C4-Jaulas.

| Archivo | Cambio |
|---|---|
| `JaulasScreen.js` | `FondoPantalla` + `PantallaHeader` «Jaulas» (sin subtítulo, `testID` `jaulas-cabecera`); filtro Activas/Inactivas en píldoras de 44 con icono (`filtro-jaulas-activas`/`-inactivas`); `Fab` coral «Nueva jaula» (`fab-nueva-jaula`, solo en Activas, mismo `navigate('NuevaJaula')`); carga/error/vacío con `EstadoCarga`/`EstadoError`/`EstadoVacio` (mismos textos); «Inactiva · Solo lectura» pasa a `Chip` con candado |
| `components/JaulaCard.js` | `Tarjeta` con franja = estado sanitario (misma lógica de V1: Normal éxito, Limpieza info, Fumigación advertencia, Quemadura y Cuarentena error), chips «Ocupada»/«Vacía» y de estado sanitario (icono + texto), «N aves», ubicación y tipo con iconos. `testID` `lista-jaula-<codigo>` |
| `DetalleJaulaScreen.js` | `FondoPantalla`; tarjeta de cabecera con franja del estado sanitario; «Editar jaula» (secundario) y «Eliminar» (peligro) como `Boton`; edición con `CampoTexto` y barra fija «Cancelar» + «Guardar cambios»; «Aves» con `TituloSeccion`, «Agregar» `Boton`, filas con `IconoCirculo`/foto y «Quitar»; acciones en mosaicos 2x2 (`accion-alimentacion`, `-bebida`, `-sanidad`, `-historial`; mismo `navigate`) |
| `DetalleJaulaInactivaScreen.js` | Mismo lenguaje (chip «Inactiva», `Aviso` informativo fijo, secciones con `TituloSeccion`). Se corrige texto con codificación rota (mojibake) que estaba en el archivo: «Esta jaula está desactivada. La información se conserva únicamente para consulta histórica.», «Información», «Código», «Ubicación», «Creación», «Desactivación», «Aves que estuvieron aquí», «·» |
| `NuevaJaulaScreen.js` | `CampoTexto` con iconos (mismos placeholders), tipos de jaula en píldoras con marca de selección, `Guardar jaula` fijo abajo (`guardar-jaula`), `testID` `jaula-codigo`, `jaula-nombre`, `jaula-ubicacion`. Se quita el título del cuerpo «Nueva jaula» (ya lo muestra la cabecera; evitaba coincidencias dobles) |
| `Alimentacion/Bebida/SanidadJaulaScreen.js` | Opciones en filas con radio (`JaulaOpcion`), «Guardar» / «Guardar sanidad» fijo abajo (`guardar-alimentacion`, `guardar-bebida`, `guardar-sanidad`), texto de ayuda nuevo. Alimentación y Bebida: la carga de tipos tiene `try/catch` propio con estado de error y «Reintentar» (antes un fallo era una promesa sin capturar) y estado de carga/vacío. Se quitan los títulos del cuerpo (la cabecera ya los muestra) |
| `HistorialJaulaScreen.js` | Tarjetas con círculo de icono por tipo; tipo presentado legible («Alimentación», «Bebida», «Sanidad», «Ingreso de ave», «Salida de ave»; antes `ALIMENTACION`, etc.); carga/error con «Reintentar»/vacío |
| nuevos | `components/JaulaAviso.js` (hook `useAvisoExito`), `JaulaBarraAccion.js`, `JaulaOpcion.js`, `JaulaEstado.js` |

Iconos (reemplazan emojis): 🏠 `home-outline`/`grid-outline`, 🐔 `paw`, 📍 `location-outline`, 🏷️ `pricetag-outline`, ✏️ `create-outline`, 🗑️ `trash-outline`, 💾 `save-outline`, ＋ `add`, 🍚 `nutrition-outline`, 💧 `water-outline`, 🧼 `bandage-outline`, 📖 `time-outline`, 📦 `archive-outline`, 🟢 `checkmark-circle-outline`; estados: Normal `checkmark-circle`, Limpieza `sparkles`, Fumigación `cloud`, Quemadura `flame`, Cuarentena `ban`.

Pares de contraste nuevos (calculados con los tokens): pestaña activa blanco sobre primario 6,6:1; inactiva primaryDark sobre blanco 9,8:1; `JaulaOpcion` seleccionada primaryDark sobre primarySoft >= 8:1 (radio primario sobre primarySoft >= 5:1, componente); píldora de tipo seleccionada blanco sobre primario 6,6:1; no seleccionada texto sobre blanco 17:1 y borde `border` 3,7:1; aviso de éxito successText sobre successSoft 7,4:1; «Quitar» dangerText sobre dangerSoft 6,9:1; código de jaula primaryDark sobre blanco 9,8:1; icono de dato textSecondary sobre blanco 7,2:1; «Eliminar» blanco sobre danger 6,1:1; círculo coral con icono blanco 5,2:1 y turquesa con icono oscuro 8,0:1.

Textos visibles (antes -> después) y flujos (`pruebas/movil/flujos/`):

| Antes | Después | Flujos |
|---|---|---|
| «Aceptar» (Alert de éxito: Jaula creada, Alimentación/Bebida/Sanidad registrada, Jaula eliminada) | no existe: aviso con el mismo título y mensaje; vuelve solo | `smoke/01-smoke:29`; `30:26,35,65-67` (el 66 es `optional`); `50:29`, `51:29`, `52:32` (usar `extendedWaitUntil` del título y quitar el toque; el título ya es un texto separado: `01:27`, `50:27`, `51:27`, `52:30`) |
| «＋ Nueva jaula» (botón) | `Fab` «Nueva jaula» | `01:19`, `30:16,30,44`, `83:55`, `86:40` (regex `.*Nueva jaula.*`, valen) |
| «🏠 Activas», «📦 Inactivas» | «Activas», «Inactivas» | `30:68`, `90:104,143`, `98:67` (regex, valen) |
| «🏠 CÓDIGO» (tarjeta y ficha) | «CÓDIGO» | `.*JA-1.*` etc. valen |
| «🐔 N aves» | «N aves» | ninguno |
| «🗑️ Eliminar» | «Eliminar» | `30:57,59` (`.*Eliminar`, vale). **RIESGO** `30:64` `tapOn: "Eliminar"` (texto exacto, botón del Alert): ahora el botón de la ficha también se llama exactamente «Eliminar»; si Maestro ve ambos hay que usar `index` o el `id` `eliminar-jaula` |
| «✏️ Editar jaula», «💾 Guardar cambios» | sin emoji | ninguno |
| «🍚 Alimentación», «💧 Bebida», «🧼 Sanidad», «📖 Historial» (botones de la ficha) | «Alimentación», «Bebida», «Sanidad», «Historial» (mosaicos) | `50:20-21,31-32`, `51`, `52:20-21,34-35`, `53:20-21`, `83:29-30` (regex `.*X`, valen) |
| «＋ Agregar» | «Agregar» | `41:24,37` (regex, valen); `41:32` exacto es del Alert de otra pantalla |
| «💾 Guardar», «💾 Guardar sanidad», «💾 Guardar jaula» | «Guardar», «Guardar sanidad», «Guardar jaula» (barra fija) | `01:25`, `30:17,25,34,48`, `50:24-25`, `83:32`, `52:27-28` (regex, valen) |
| Títulos en el cuerpo «Alimentación», «Bebida», «Sanidad», «Historial», «Nueva jaula» | quitados (los muestra la cabecera) | evita coincidencias dobles |
| Tipos de sanidad «🟢 Normal» | «Normal» | ninguno |
| Tipo de evento del historial `ALIMENTACION`... | «Alimentación»... | ninguno lo busca (el detalle `Alimentación: Morichillo` sigue igual: `50:34`, `52:37`) |

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

- `RegistrarHuevoScreen.js`: añadido `testID="guardar-huevo"` al botón "Registrar huevo"/"Guardando..." (sin otro cambio).

## C4 refactor (avisos y barra de acción comunes; 2026-11-09)

Sin cambios de texto, testID, tiempos (1,5 s Aves; 1,8 s y 4 s Jaulas) ni lógica.

- `components/Aviso.js`: props nuevos opcionales `titulo` (título y mensaje en textos separados) y `flotante` (superpuesto arriba con entrada animada, antes `JaulaAviso`). Sin ellos se comporta como antes.
- `components/useAvisoExito.js` (nuevo, export por defecto): el hook movido desde `JaulaAviso.js`, idéntico.
- `components/BarraAccion.js` (nuevo): el antiguo `JaulaBarraAccion`, idéntico.
- Jaulas (`AlimentacionJaulaScreen`, `BebidaJaulaScreen`, `SanidadJaulaScreen`, `NuevaJaulaScreen`, `DetalleJaulaScreen`): imports y uso de `<Aviso flotante titulo mensaje tono="exito" duracion={0}>` y `<BarraAccion>`.
- `NuevaAveScreen.js`: `avisarYNavegar(titulo, mensaje, destino)`; títulos «Ave registrada» y «Ave actualizada» (mensajes iguales); la barra inferior usa `BarraAccion` (añade la sombra de la barra de Jaulas; `styles.barraGuardar` queda sin uso).
- `components/JaulaAviso.js` y `components/JaulaBarraAccion.js`: BORRADOS en el commit `66a9bd4`/cierre (ya no existen).

## Sub-bloque C5 (Salud, Huevos, Genealogía, Ciclo de vida, Evolución, Bajas y Agregar ave a jaula; 2026-11-09)

Lógica, repositorios llamados, validaciones, mensajes de los `Alert` de error/validación, navegación y excepciones aprobadas sin cambio: `SaludAveScreen` conserva los dos `Alert` de los `catch` y la guarda `if (!ave)`; `ProduccionHuevosScreen` conserva el `Alert` de carga; `GenealogiaAveScreen` conserva ids `String`, sin `Alert` en el `catch` y el resaltado y aviso de consanguinidad (solo restilizados; las funciones `analizarConsanguinidad`, `obtenerMapaAncestros`, `describirCruceAscendente` y `abrirAve` no se tocaron); `BajaAveScreen` conserva `popToTop`. Revertir = revertir el commit de C5 (nuevo: `components/HuevoRanking.js`). No se tocó ningún componente compartido ni `src/theme`.

Aviso no bloqueante (solo los `Alert` de ÉXITO; mismo título y mensaje en dos textos; 1,8 s y luego la navegación que hacía «Aceptar»; botón atenuado mientras tanto): «Tratamiento finalizado» (`goBack`), «Huevo registrado» (`goBack`), «Evolución registrada» (`goBack`), «Proceso completado» (`popToTop`), «Ave asignada» (`goBack`). «Registro guardado» (Salud) no navega: aviso 4 s y recarga inmediata de los datos (antes recargaba al tocar «Aceptar»). Se conservan como `Alert`: todos los de error y validación, «Asignar ave» (Cancelar/Agregar/Mover), permisos de foto, «Sin cambios», «Medidas inválidas», «Celular requerido», «Valor inválido», «Seleccione una opción», «Enfermedad requerida».

| Archivo | Cambio |
|---|---|
| `SaludAveScreen.js` | `FondoPantalla`; tarjeta de cabecera (círculo `medkit`, «Salud AV-X», chip de estado vía `visualSalud`, «Finalizar tratamiento» secundario solo `EN_TRATAMIENTO`); enfermedad y medicamento en tarjetas con `AveOpcion`; síntomas y dosis con `CampoTexto` (mismos placeholders); «Guardar diagnóstico» FIJO abajo (`BarraAccion`, `atenuado` mientras guarda); historial en tarjetas con franja. Carga con `EstadoCarga`; en lugar de `return null` (sin ave) ahora `EstadoError` «No fue posible cargar los datos de salud.» + «Reintentar» (el `Alert` del catch se mantiene). testID: `salud-estado`, `finalizar-tratamiento`, `guardar-diagnostico` |
| `SaludScreen.js` | Huérfana: `FondoPantalla` + `EstadoVacio` «Salud» (antes «🐔 Salud» sin estilo) |
| `FinalizarTratamientoScreen.js` | `FondoPantalla`; tarjeta con `CampoTexto` «Observación» (mismo placeholder) y texto de ayuda nuevo «El ave volverá al estado sana.»; «Confirmar recuperación» FIJO abajo. Se quita el título del cuerpo (lo muestra la cabecera). testID: `observacion-recuperacion`, `confirmar-recuperacion` |
| `RegistrarHuevoScreen.js` | `FondoPantalla`; tarjeta de ave («Ave: X», «Jaula: Y», círculo `egg`); «Observación» con `CampoTexto`; «Registrar huevo» FIJO abajo conservando `testID="guardar-huevo"`. Se quita el título del cuerpo. NUEVO: `cargarAve` tiene `try/catch` (antes promesa sin capturar) y muestra `EstadoError` «No fue posible cargar el ave.» + «Reintentar»; el formulario sigue disponible (como V1). testID: `huevo-ave`, `observacion-huevo` |
| `ProduccionHuevosScreen.js` | `FondoPantalla`; `TituloSeccion` con icono; resumen en tarjeta con tres filas apiladas (etiqueta y cifra debajo; los flujos buscan la cifra bajo «Hoy»/«Semana»); ranking con `HuevoRanking` (copas en lugar de medallas); horario con icono por fila (mismo texto «H:00 - N huevos»); `EstadoCarga`; NUEVO `EstadoError` «No fue posible cargar la producción de huevos.» + «Reintentar» (el `Alert` se mantiene; antes quedaban los resúmenes en cero). Vacíos nuevos: «Aún no hay huevos registrados.» (ranking y horario). Se quitan el `Header` «Producción» y su subtítulo «Análisis avanzado de postura de huevos» (la cabecera ya dice «Producción de huevos») |
| `components/HuevoRanking.js` (nuevo) | Fila de «Mejores ponedoras»: código y «N huevos» en dos textos, copa (posiciones 1 a 3) o paw. No sustituye a `RankingCard` (compartida) |
| `GenealogiaAveScreen.js` | `FondoPantalla`; título «Árbol genealógico» (sin 🌳); avisos de relación inválida y consanguinidad con icono + texto y colores del tema (morado `kinship` + `primarySoft`); selector de generaciones con `Pulsable` 48x44; nodos con `IconoCirculo`/foto, icono de sexo, `Chip` Vendida/Fallecida; ancestro común resaltado igual (borde morado 4 px, fondo `primarySoft`, ahora con icono de enlace). Carga `EstadoCarga`; si falla `EstadoError` «No fue posible cargar el árbol genealógico.» + «Reintentar» (antes «No fue posible encontrar el ave.»). Sin `Alert`. testID: `generaciones-2|3|4` |
| `CicloVidaAveScreen.js` | `FondoPantalla`; tarjeta del ave (avatar/foto, chips de sexo y estado); línea de tiempo con `IconoCirculo` por tipo y `Tarjeta` por evento; vacío con mascota; error con «Reintentar» (mismo mensaje «No fue posible cargar el ciclo de vida del ave.»); «Ave no encontrada.» con `EstadoVacio`. Se quita el título del cuerpo «🌿 Ciclo de vida» (la cabecera lo muestra) |
| `EvolucionAveScreen.js` | `FondoPantalla`; foto en tarjeta con «Cámara»/«Galería» (`Boton` secundario con icono); medidas actuales y campos con `CampoTexto` (mismos textos y placeholders); «Guardar evolución» FIJO abajo; NUEVO `EstadoError` «No fue posible cargar el ave.» + «Reintentar» si falla la carga (el `Alert` se mantiene). testID: `evolucion-camara|galeria|peso|altura|largo|caracteristicas|observacion`, `guardar-evolucion` |
| `BajaAveScreen.js` | `FondoPantalla`; tarjeta «Baja del ave» con `AveOpcion` «Fallecimiento»/«Venta»; campos con `CampoTexto` (mismas etiquetas y placeholders, mismo orden «Valor venta» antes de «Valor de envío»); tarjeta nueva rotulada «Datos del comprador» (texto nuevo, solo ventas); «Confirmar baja» FIJO abajo en rojo (`peligro`). testID: `baja-fallecimiento`, `baja-venta`, `confirmar-baja` |
| `SeleccionarAveJaulaScreen.js` | `FondoPantalla`; filas con `Tarjeta` pulsable (avatar/foto, código, raza, chip «Actualmente: Jaula X»); carga «Buscando aves...» con mascota; vacío con mascota (mismos textos); NUEVO `EstadoError` «No fue posible cargar las aves disponibles.» + «Reintentar» (el `Alert` se mantiene). Se quita el título del cuerpo «🐔 Agregar ave» (la cabecera lo muestra). testID `asignar-ave-<codigo>` |
| `DetalleAveScreen.js` (solo esto de C4) | El estado de error de carga ya no muestra `error.message`: «No fue posible cargar el ave.» + «Reintentar» |

Textos visibles (antes -> después) y flujos (`pruebas/movil/flujos/completo/`):

| Antes | Después | Flujos |
|---|---|---|
| «Aceptar» tras «Registro guardado» (Salud) | no existe: aviso con el mismo título y mensaje | `60:29` (`tapOn: "Aceptar"`) ROMPE: quitar el toque. `60:27` (`visible: "Registro guardado"`) vale |
| «🔴 Coriza» (historial sanitario) | «Coriza» | `60:36` (`element: ".*🔴 Coriza.*"`) ROMPE: usar `.*Coriza.*`; `60:37` ya busca `.*Coriza.*` (también coincide con el chip de enfermedad del formulario) |
| «💾 Guardar diagnóstico», «✅ Finalizar tratamiento», «🩺 Salud AV-X» | sin emoji | `60:24-25`, `82:31,38,44,50`, `85:45,54` (`.*Guardar diagnóstico.*`) valen. Con la barra fija el botón está siempre visible: los `assertNotVisible` de `82` y `85` se evalúan fuera de Salud y siguen válidos |
| «Aceptar» tras «Huevo registrado» | no existe: aviso con título «Huevo registrado» y mensaje «Se generó el código H000001» | `70:31` ROMPE: quitar el toque (queda tras 1,8 s el `goBack`); `70:28,30` valen |
| «🥚 Registrar huevo» (botón) | «Registrar huevo» | `70:25-26` (por `id`) vale; `70:21` toca el botón de la ficha |
| «Aceptar» tras «Proceso completado» (Baja) | no existe: aviso con el mismo título y mensaje; `popToTop` a los 1,8 s | `90:69,127`, `91:41` ROMPEN: quitar el toque y esperar el siguiente texto con `extendedWaitUntil`; `90:66,68`, `91:38,40` valen. Los flujos `96:47-49` y `98:56-58,101-103` (esperan «Proceso completado» + «Aceptar») dependen de esta pantalla: ROMPEN igual |
| «⚰ Fallecimiento», «💰 Venta», «💾 Confirmar baja», «⚫ Baja del ave» | sin emoji | `91:29` (`.*Fallecimiento`), `90:30,115` (`.*Venta`), `90:34,64,123`, `91:36` (`.*Confirmar baja.*`), `90:28`, `91:27` (`.*Baja del ave.*`) valen; placeholders «Ej. Enfermedad», «Ej. 0991234567», «Nombre del comprador», «Opcional» sin cambio |
| «Aceptar» tras «Ave asignada» | no existe: aviso; `goBack` a los 1,8 s | `41:36,47` ROMPEN: quitar el toque; `41:34,45` valen; `41:37` (`.*Agregar`, ya en la ficha) debe esperar a que vuelva |
| «🥚 Resumen», «🥚 Hoy», «📅 Semana», «🥚 Mes», «📊 Producción últimos días», «🏆 Mejores ponedoras», «⏰ Horario de postura», «🏠 Producción por jaula» | sin emoji (icono) | `71:24` (`.*Resumen`), `27` (`.*Hoy`), `31,34` (`.*Semana`), `35` (`.*Mes`), `37` (`.*Mejores ponedoras`), `46` (`.*Producción por jaula`) valen; `71:29-35` buscan «2» bajo «Hoy» y «4» bajo «Semana»: se conserva el orden vertical etiqueta-cifra |
| Medallas 🥇🥈🥉🐔 | copa / paw en círculo | `71:40,44` (`AV-Q`, `AV-P`, «3 huevos», «2 huevos») valen |
| «🌳 Árbol genealógico», «⚠️ Relación genealógica inválida», «🧬 Consanguinidad detectada», «↑ Ancestros», «↓ Descendientes», «🐓 Macho», «🐔 Hembra», «💰 Vendida», «⚰️ Fallecida» | sin emoji ni flecha (icono) | `80:24-28` (`.*AV-P.*`, `.*AV-M.*`, `assertNotVisible` de «Relación genealógica inválida» y «Consanguinidad detectada») valen |
| «No fue posible encontrar el ave.» (Genealogía, si falla la carga) | «No fue posible cargar el árbol genealógico.» + «Reintentar» | ninguno |
| «🌿 Ciclo de vida» (título del cuerpo), «🏠 Jaula X», «🐓 Macho», «🐔 Hembra», emojis de cada evento | sin título de cuerpo; «Jaula X» con icono; iconos de Ionicons | `81:24` (`.*(Llegada al criadero|Nacimiento|huevos? registrados?).*`), `81:26-27`, `81:30` (`.*2 huevos registrados.*`), `91:60-62`, `90:97-99` valen (los títulos de evento vienen del repositorio) |
| «📸 Evolución de AV-X», «📷 Cámara», «🖼️ Galería», «📏 Medidas actuales», «💾 Guardar evolución» | sin emoji (el título «Evolución de AV-X» se conserva) | ningún flujo |
| «Aceptar» tras «Evolución registrada» | no existe: aviso; `goBack` a los 1,8 s | ningún flujo |
| «🐔 Agregar ave» (título del cuerpo) | quitado (lo muestra la cabecera) | `41:24` (`.*Agregar`) vale |
| «Observación» (Finalizar tratamiento y Registrar huevo) | etiqueta del campo (igual) | ninguno |
| Detalle de ave: error de carga | «No fue posible cargar el ave.» (antes el mensaje técnico) | ninguno |

Pares de contraste (calculados con los tokens, ±0,1): blanco sobre `primary` 6,6:1 (opción seleccionada, botón); blanco sobre `danger` 6,1:1 («Confirmar baja»; círculo de Salud/Venta); `primaryDark` sobre `primarySoft` ≥ 9,8:1 (avisos de consanguinidad, etiquetas de nodo); `warningText` sobre `warningSoft` 6,7:1 (relación inválida); `textSecondary` sobre `infoSoft`/`fondoA`/`primarySoft`/`surfaceAlt` ≥ 6,0:1 (nodos y medidas); `text` sobre `turquesa` 8,0:1 (círculo de Nacimiento); blanco sobre `warningSolid` 5,0:1 (círculo de huevo en la línea de tiempo); blanco sobre `turquesaProfundo` 5,3:1, `success` 5,0:1, `info` 6,1:1 (calculado a mano, comprobar en el HTML de la propuesta), `secondary` 5,5:1, `primaryDark` y `text` altos (círculos de eventos); blanco sobre `textSecondary` 7,2:1 (paw del ranking). Par nuevo a vigilar: blanco sobre `colors.info` (`#1D5FB8`) en el círculo del evento «Alta» (no figura en la tabla 1.5; estimado ≥ 6:1, si el HTML marca otra cosa corregir).

DUDA PARA EL USUARIO (C5): (1) «Proceso completado» (Baja) pasa a aviso con `popToTop` a los 1,8 s: se aplicó la regla «Alert de éxito -> aviso», pero la baja es irreversible y antes había que tocar «Aceptar»; si prefieres mantener el diálogo, es un cambio de una línea. (2) «Registro guardado» (Salud) ya no espera «Aceptar» para recargar: recarga de inmediato. (3) En Registrar huevo, si falla la carga del ave el formulario sigue disponible (como V1) y se podría registrar un huevo sin jaula; no se cambió.

## Sub-bloque C6 (Finanzas, Clientes, Reportes, Configuración, Catálogos y Más; 2026-11-09)

Sin cambios de lógica, repositorios, importes, periodos (UTC), exportación CSV ni mensajes de datos. Componentes nuevos: `OpcionPildora.js` (selección única en píldora), `MasFila.js` (fila de menú). `AlertBadge.js` reescrito (solo lo usa Más). `Card`, `Header`, `SectionTitle`, `RankingCard` NO se tocan (los usa `ProduccionHuevosScreen`, de C5; `ReportesScreen` ya no los usa). `SelectorCatalogo` y `StatusBadge` no los usa C6 y no se tocan. `BackupScreen.js` se restiló solo en JSX y estilos, con la lógica intacta (ver más abajo).

| Pantalla | Cambios visibles | Textos cambiados |
|---|---|---|
| `MasMenuScreen` | cabecera con degradado «Más» + subtítulo, filas `MasFila` con círculo de icono, `AlertBadge` con campana Ionicons | Se quitan los emojis de iconos. «Respaldo» solo se muestra con `USAR_API` falso (en modo API queda oculto). Conserva «Cerrar sesión» (solo API), «Estado y pendientes del criadero» y el orden |
| `AlertBadge` | Antes un Text «🔔 3»; ahora píldora roja con campana + Text `3` (`testID` `alertas-insignia-texto`, `accessibilityLabel` «3 alertas pendientes») | «🔔 N» pasa a «N» |
| `ConfiguracionScreen` | filas con icono; sin título en el cuerpo (lo da la cabecera) | Títulos sin emoji: Razas, Enfermedades, Medicamentos, Alimentos, Bebidas, Categorías financieras (el `titulo` que recibe Catálogo ya no lleva emoji; cabecera «Más › Configuración › Razas») |
| `CatalogoScreen` | tarjetas por elemento, «Editar»/«Eliminar» en píldoras de 44 px, estados carga/error/vacío; **alta rápida** arriba (campo + «Añadir», mismas validaciones y repositorio que `EditarCatalogoItemScreen`, descripción vacía; aviso «Guardado» y recarga); «Nuevo elemento» sigue al final de la lista (Boton secundario) | Sin título en el cuerpo. Nuevos: «Alta rápida», «Escribe un nombre», «Añadir», «Cargando elementos...», «No fue posible cargar el catálogo.» + «Reintentar». «No existen registros.» pasa a título de estado vacío |
| `EditarCatalogoItemScreen` | campos en tarjeta, «Guardar» fijo abajo, aviso de éxito | «💾 Guardar» -> «Guardar». Alert «Guardado» + «Aceptar» -> aviso «Guardado» (vuelve solo a los 1,8 s) |
| `FinanzasScreen` | cabecera «Finanzas», periodo en segmentado, tarjetas Ingresos (verde, trending-up) y Egresos (rojo, trending-down), Balance en violeta, barras proporcionales por categoría, `Fab` «Nuevo movimiento», estados carga/error/vacío | Se quitan emojis («💰», «💸», «🔗 Venta» -> chip «Venta» con icono, «＋ Nuevo movimiento» -> Fab «Nuevo movimiento», «Ver / corregir ›» -> «Ver / corregir» + flecha). Nuevos: «Aún no hay movimientos», «Sin movimientos de este tipo», «No fue posible cargar las finanzas.» + «Reintentar». Las cantidades de la lista son un solo Text («+$12.50») |
| `NuevoMovimientoFinancieroScreen` | formulario en tarjeta, píldoras, «Guardar movimiento» fijo abajo | «💰 Nuevo movimiento» (título del cuerpo) se quita (la cabecera dice «Nuevo movimiento»); «🟢 Ingreso»/«🔴 Egreso» -> «Ingreso»/«Egreso» con icono; «💾 Guardar movimiento» -> «Guardar movimiento». Alert «Movimiento guardado» + «Aceptar» -> aviso (vuelve solo). Error de envío: solo `console.error` (sin Alert, decisión del usuario) |
| `EditarMovimientoFinancieroScreen` | igual patrón; «Guardar cambios»/«Guardar corrección» fijo abajo; ayuda de venta en aviso informativo | «✏️ Editar movimiento»/«🔗 Corregir venta» -> sin emoji (siguen como título del cuerpo); «💾 Guardar…» -> sin emoji; Alerts de éxito «Movimiento actualizado» y «Venta corregida» + «Aceptar» -> avisos (vuelven solos). Los Alert de error y de «Valor inválido» se conservan. Nuevo estado de error de carga («No fue posible cargar el movimiento.» + «Reintentar», además del Alert existente) |
| `ClientesScreen` | `CampoTexto` de búsqueda, tarjetas con avatar, estados con mascota | Se quita el título «👥 Clientes» del cuerpo (la cabecera lo da); se quitan «📱», «📍», «👤», «›». El mensaje de error pasa a título de `EstadoError` |
| `DetalleClienteScreen` | tarjetas, avatar 72, estados | «🐔 Compras realizadas» -> «Compras realizadas»; «🐓 Macho»/«🐔 Hembra» -> «Macho»/«Hembra» con icono. Nuevo: error de carga («No fue posible cargar el cliente.» + «Reintentar»); «Cliente no encontrado.» solo si no hay error |
| `ReportesScreen` | secciones con `TituloSeccion`, filas con icono, botones de exportación en tarjetas | Se quita el título «Reportes» del cuerpo (cabecera); subtítulo conservado. Emojis de secciones y de «🔴 enfermedad» -> iconos; «🔴 Coriza (1)» pasa a «Coriza (1)». Nuevo: «No fue posible cargar los reportes.» + «Reintentar» (antes quedaban ceros sin aviso). Exportación CSV: misma lógica y Alerts |

### Flujos Maestro afectados por C6 (no editados aquí)

- `99-alertas.yaml:29` `visible: ".*🔔 3.*"`: cambia. Equivalente exacto: `visible: "3 alertas pendientes"` (accessibilityLabel del Text del número) o `visible: {id: "alertas-insignia-texto", text: "3"}`.
- `20-catalogos.yaml:33`: `tapOn: "Aceptar"` tras «Guardado» deja de existir (aviso que vuelve solo a los 1,8 s; «Guardado» sigue visible ese tiempo). Quitar el toque y esperar la lista (`Catalogo`). Los `tapOn ".*Guardar.*"`, `"Nombre"`, `".*Nuevo elemento.*"` y el error «No fue posible guardar el elemento.» siguen valiendo. `.*Razas.*` vale (título sin emoji).
- `95-finanzas-movimientos.yaml:45, 68, 128`: `tapOn: "Aceptar"` tras «Movimiento guardado»/«Movimiento actualizado» desaparece (el aviso vuelve solo). Los `extendedWaitUntil` siguientes (lista de Finanzas) ya esperan la vuelta. `.*Nuevo movimiento.*` ahora toca el Fab; `.*Egreso`, `"Alimento"`, `below: "Valor"/"Detalle"`, `.*Guardar movimiento.*` y `.*Guardar cambios.*` valen. Los TextInput de Valor/Detalle tienen `accessibilityLabel` «Valor del movimiento»/«Detalle del movimiento» (para no duplicar la etiqueta visible).
- `96-finanzas-correccion-venta.yaml:114`: `tapOn: "Aceptar"` tras «Venta corregida» desaparece; `:113` (mensaje) sigue valiendo durante el aviso. `.*Venta` (chip), `.*Ave: AV-FV.*`, `.*Corregir venta.*`, `assertNotVisible .*Guardar cambios.*`, `.*Guardar corrección.*`, `below: "Valor de envío"` valen. El `tapOn: "OK"` del Alert «Valor inválido» se conserva.
- `84-nav-finanzas-nuevo-atras`, `97-reportes`, `98-clientes`, `71`, `10`, `smoke`, `94`: sin cambio de texto buscado («Cerrar sesión», «Producción de huevos», «Compradores e historial de ventas por celular», «Resumen y exportación del criadero», «Activas: 2», etc.).
- Riesgo: el aviso de éxito dura 1,8 s antes de volver; un `extendedWaitUntil` de «Movimiento guardado» debe pillarlo (sondeo de Maestro ~1 s).

### Pares de contraste nuevos o usados en C6 (cálculo a mano, ±0,1)

| Par | Ratio |
|---|---|
| Blanco sobre `success` `#12803C` (tarjeta «Ingresos») | 5,0 |
| Blanco sobre `danger` `#C0182B` (tarjeta «Egresos», insignia de alertas, botón Eliminar) | 6,1 |
| Blanco sobre `primary` `#6D3BD2` (tarjeta «Balance», píldora activa, segmentado activo) | 6,6 |
| `successText` `#0B5A2A` / `dangerText` `#9B1220` sobre blanco (importes de la lista, meses, encabezados) | 9,6 / 8,0 |
| `primaryDark` sobre blanco (Editar, texto de segmentado inactivo, «Exportar …») | 10,6 |
| `textSecondary` sobre blanco (fechas, descripciones) | 7,2 |
| Chip «Venta» `infoText` sobre `infoSoft` | 8,8 |

### DUDAS y observaciones

- `BackupScreen` (restilizada después, 2026-11-10): solo JSX y estilos (FondoPantalla, ScrollView, Tarjeta, Boton con `atenuado` mientras procesa). Lógica, Alert y repositorio intactos. Textos: se quita el título «💾 Respaldo» del cuerpo (la cabecera lo da) y los emojis de los tres botones («Crear y guardar respaldo», «Compartir respaldo», «Restaurar respaldo» con icono). Ningún flujo Maestro los busca. Contraste: blanco sobre `danger` 6,1; `primaryDark` sobre blanco 10,6.
- Observación: Finanzas, Reportes, Catálogo, DetalleCliente y Editar movimiento ahora muestran un estado de error con «Reintentar» si falla la carga (antes: ceros, lista vacía o «no encontrado»). No cambia ningún dato ni proceso; revisar que sea lo deseado frente a la decisión previa de «sin aviso de red» en Finanzas.
- Observación: en la alta rápida el código se deriva igual que en `EditarCatalogoItemScreen`; un nombre repetido da el mismo error genérico.

## Cierre (2026-11-10)

- `BajaAveScreen`: «Proceso completado» vuelve a ser `Alert` con botón «Aceptar» (`popToTop`), mismos mensajes («El ave fue registrada como vendida.»/«…fallecida.»). Se quitan `useAvisoExito`, `Aviso` y `saliendo`; el botón «Confirmar baja» sigue atenuado con `guardando`. Confirma que el texto «Aceptar» reaparece, por lo que revierte lo de C5.
- Flujos que `validador-ux` debe revertir a `tapOn: "Aceptar"` en lugar de `notVisible: "Proceso completado"` (más el comentario `# C5` previo): `90-baja-venta.yaml:69-71` y `:128-131`; `91-baja-muerte.yaml:41-43`; `96-finanzas-correccion-venta.yaml:49-51`; `98-clientes.yaml:58-60` y `:104-107` (comprobar cada bloque tras revertir; el resto de líneas `visible: "Proceso completado"` valen).
- Limpieza: sin imports ni requires dinámicos de `Card`, `Header`, `SectionTitle`, `StatusBadge`, `RankingCard` ni `SelectorCatalogo` en `src/` ni `App.js` (grep). El guardia no deja borrar: el orquestador debe ejecutar `git rm src/components/{Card,Header,SectionTitle,StatusBadge,RankingCard,SelectorCatalogo}.js`.
- `JaulaEstado.js` (cierre): ya no importa `getJaulaSanitaryStatusStyle`; los textos (Normal, Limpieza, Fumigación, Quemadura, Cuarentena) y el caso por defecto (vacío o desconocido -> Normal) son los de `constants.js`. Colores/tonos sin cambio (los chips usan los pares `*Text`/`*Soft` del tema, >= 4,5:1; Quemadura sigue en familia error). `constants.js` conserva la función (otros usos fuera de UX).

## Cierre total (2026-11-10)

### Cambios (para revertir)
- `src/navigation/BarraPestanas.js`: `CommonActions.navigate({ name, merge: true })` pasa a `CommonActions.navigate(route.name, undefined, { merge: true })` (forma de objeto obsoleta en `@react-navigation/native` 7.4.1). Equivalencia: `routers/src/CommonActions.tsx:104-137` produce la misma acción `NAVIGATE` con `name`, `params` (undefined) y `merge: true` (`pop` undefined); el router de pestañas (`SwitchRouter.tsx:355-419`) solo lee `name`, `params`, `merge` y `path`, igual en ambas formas. Misma pestaña destino, mismo `merge` de parámetros, `target: state.key` intacto; el historial de pestañas (atrás del teléfono) y la pila restaurada dependen del router, no de la forma del argumento. En el resto de `src/` no hay otros `navigate({...})` ni `CommonActions` (solo `StackActions.pop` en `CabeceraPila`, no obsoleto).
- `src/navigation/titulos.js`: `BajaAve` «Dar de baja» -> «Baja del ave» (cabecera = título del cuerpo; los flujos esperan «Baja del ave»). El botón de la ficha sigue diciendo «Dar de baja».
- `SaludAveScreen.js`: título del cuerpo «Salud {código}» -> «Salud» (igual que la cabecera; el código sigue en las migas «Aves › A-12»). Ningún flujo busca «Salud AV-».
- `GenealogiaAveScreen.js` `nodeCardInactive`: `opacity 0.8` -> `borderStyle 'dashed'`. El texto secundario del nodo «Fallecida» pasa de ~4,5:1 a >= 6,0:1 (sin opacidad, valor del tema sobre los tintes del nodo). Lógica intacta.
- Rendimiento (ver `rendimiento.md`): `AveCard`, `Chip`, `IconoCirculo` con `React.memo`; `AveCard` con prop opcional `onAbrir`; `AvesScreen` con `renderItem`/`keyExtractor`/manejador en `useCallback`. Mismos `testID` y comportamiento.
- `titulos.js` revalidado: todas las rutas tienen título; `NuevaAve`, `EditarCatalogoItem` y `Catalogo` son dinámicos y correctos; «Editar movimiento» y «Editar elemento» ya coinciden con el cuerpo.
- Doc: encabezado de «Cambios de navegación» (ya hechos) y nota de `JaulaAviso`/`JaulaBarraAccion` (ya borrados).

### Observaciones de `documents/ux/` y su cierre
1. C0 miga con `minHeight` 32: cerrada (la miga es un `Pulsable`, que aplica el mínimo táctil; `migaToque` ya no fija 32).
2. C0 `accessibilityRole="header"` duplicado en migas: cerrada (solo en el título, `PantallaHeader.js:74`).
3. C0 `Chip` tono `info` roza 4,5:1: cerrada (`infoText` sobre `infoSoft` 8,8:1 según C6).
4. Bloque A: `Alert` sin uso en `DetalleJaulaInactivaScreen`: cerrada (ya no existe).
5. Bloque A: doc «Cambios previstos» desalineado: cerrada.
6. Bloque A: «atrás» en Genealogía no deshace en orden exacto con la misma ave: aceptada (consecuencia de `getId`, con migas).
7. Bloque A: baja desde Alertas deja en Más (`popToTop`): lógica, no se toca.
8. Bloque A/C5: títulos «Baja del ave» y «Salud AV-X»: cerrada. «Registro de huevo»: ya es «Registrar huevo».
9. C1: mascota en bucle infinito: cerrada (3 saltos finitos, `Mascota.js`).
10. C1: `98-clientes.yaml` `assertVisible "2"` podría coincidir con la insignia de Más: flujo en `pruebas/movil`, fuera de mi alcance (falso positivo, no fallo).
11. C1: botón terciario deshabilitado < 4,5:1: exento (estado deshabilitado).
12. C3: textos nuevos («Accesos rápidos», «Nueva ave», «Alertas», chips) y error con «Reintentar» en Inicio/Alertas frente a «ceros como V1»: DECISIÓN DEL USUARIO.
13. C4: textos nuevos de vacíos/ayudas/historial, error técnico crudo en la ficha del ave, pérdida de títulos «Ave registrada/actualizada»: DECISIÓN DEL USUARIO.
14. C5: textos nuevos; «Registrar huevo» con fallo de carga deja el formulario (V1); `SaludScreen` huérfano sin ruta: DECISIÓN DEL USUARIO (no se toca).
15. C6 obs. 1: doble Enter en alta rápida: cerrada (`anadiendoRef`, `CatalogoScreen.js:97,294`); error de `cargar()` tras crear: aceptado (Reintentar).
16. C6 obs. 2 y DUDA 4 (cabeceras «Movimiento financiero»/«Elemento»): cerrada (`titulos.js`).
17. C6 obs. 3 (`BackupScreen`): cerrada, vale «restilizada».
18. C6 obs. 4 (aviso de 1,8 s en flujos): informativa para `pruebas/movil`.
19. C6 DUDAS 1-3 («Respaldo» oculto en API, errores con «Reintentar» en Finanzas, textos nuevos): DECISIÓN DEL USUARIO.
20. `JaulaAviso`/`JaulaBarraAccion` pendientes de borrar: cerrada (borrados). Seis componentes sin uso: borrados en el cierre previo.
21. `NuevaAveScreen` usa `Number(item.id)` en filtros de padres: lógica, no se toca (observación al orquestador).

### Avisos (logcat de `2026-11-10-080951-completo`)
- Corregido (nuestro): «Passing an object as the argument to 'navigate' is deprecated» (28 veces en `logcat-continuo.txt`, una por arranque; origen `BarraPestanas.js`).
- Dejados (V1/sistema): `E/ReactNativeJS 'Error guardando catálogo:' UNIQUE constraint failed` (el flujo 20 repite un código; `console.error` de V1/API) y `VNDK is deprecated with product` (Android). Sin «VirtualizedLists», `unique "key"` ni «Possible Unhandled Promise» en logcat ni en `metro.txt`. Por código: sin `FlatList` anidada en `ScrollView` vertical y todos los `map` con JSX llevan `key`.
- Sin ejecutar la app tras estos cambios: el aviso `navigate` debería desaparecer en el siguiente logcat.

### Cierre de la fase UX (2026-11-10): FASE CERRADA, pendiente la prueba final del usuario

- Resultado: variante «Pajarera tropical»; fuentes Fredoka (títulos, botones, números) y Nunito (cuerpo) con respaldo del sistema; mascota con `react-native-svg` (3 saltos y se detiene; respeta «reducir movimiento»). Dependencias añadidas: `expo-font`, `expo-linear-gradient`, `react-native-svg` y `@expo-google-fonts/*` (commit `9b0799a`).
- Reglas del tema que quedan vigentes: tokens en `src/theme/`; componentes comunes en `src/components/`; máximo 2 degradados por pantalla; toques >= 44; contraste AA; sin verde ni amarillo como marca (verde solo para éxito y alertas); avisos de éxito no bloqueantes (`Aviso`/`useAvisoExito`); los `Alert` de error y de confirmación se mantienen.
- Causa de la mayoría de regresiones del completo: `BarraPestanas.js` usaba `CommonActions.navigate({name, merge})` (obsoleto en React Navigation 7.4.1); el aviso abría el LogBox en Expo Go y tapaba pantallas. Ahora `CommonActions.navigate(route.name, undefined, {merge:true})`, misma acción `NAVIGATE` (verificado en `node_modules`).
- Commits locales de la jornada: `b538d57`, `5165b25`, `a5f8880`, `2082a1d` y el de los flujos 95 y 96. Último push: `df6b1b8`.
- `/probar completo` del 2026-11-10 (NO hubo ejecución completa en verde):
  - `2026-11-10-080951-completo`: ROJO, 14 PASO y 14 REGRESION (78,0 min); causas: aviso de `navigate`/LogBox, contenido bajo el pliegue y avisos efímeros de 4 s.
  - `2026-11-10-105816-completo` (final): ROJO literal, 23 PASO y 5 REGRESION en 69,9 min. Fallos: `95` (aviso efímero «Movimiento actualizado»; fallo del flujo) y `96`-`99` por la caída del emulador (`device not found`; FALLO DE ENTORNO real).
  - `95` y `96` se corrigieron (esperar la condición, no el aviso) y pasaron aparte; `97`, `98` y `99` pasaron aparte tras restaurar el DNS del emulador con `-dns-server 8.8.8.8,1.1.1.1`. Ninguna regresión real de la app en los fallos finales.
- Limpieza: recuento final de la base de pruebas igual al inicial (0 desechables, 3 cuentas, 3 criaderos, 2 aves).
- Incidencia nueva: tras recuperar el emulador sin snapshot el DNS falló (FALLO DE RED en `97`-`99`); arrancarlo con `-dns-server 8.8.8.8,1.1.1.1`.
- Sin medir: rendimiento en gama baja; fluidez de la lista de aves con cientos de registros y fotos; coste de los degradados; arranque en frío con fuentes; que el aviso de `navigate` haya desaparecido del logcat (falta un arranque real); `90-baja-venta` tardó 328 s.
- Próximos pasos, en este orden: (1) prueba final del usuario en el teléfono, (2) fotos en R2, (3) login con Google, (4) ambientes de pruebas y producción, (5) retiro de SQLite con respaldo.

## Correcciones tras prueba del usuario (2026-11-10)

- Iconos: `Icono.js` dibuja con `react-native-svg` un ave (`ave`, `ave-relleno`) y una espiga (`grano`); `paw`/`paw-outline` y `nutrition`/`nutrition-outline` se redirigen a ellos en todo `src/`. `theme/icons.js`: `aves`/`avesActivo` -> `ave`/`ave-relleno`; `alimentacion` -> `grano`. Resto de iconos revisados sin cambio. testID intactos.
- `SaludAveScreen`: tras guardar, `navigation.goBack()` (a la ficha; `cargarDatos()` se conserva). El aviso «Registro guardado» ya no llega a verse (la pantalla se cierra). Datos guardados sin cambio.
- `components/filtroNumerico.js` (nuevo): `filtrarDecimal` (solo dígitos y un punto; coma -> punto) y `categoriaVisible`. Usado en Nuevo y Editar movimiento (Valor, Valor del ave, Valor de envío) con `decimal-pad`. Validaciones y mensajes sin cambio.
- Nuevo movimiento: prop opcional `acento` en `OpcionPildora`, `CampoTexto` y `Boton`; verde `success` (Ingreso) o rojo `danger` (Egreso) en tarjeta, etiquetas (`successText`/`dangerText`), píldoras, campos y botón. Contraste AA (blanco sobre success 5,0; sobre danger 6,1).
- EXCEPCIÓN APROBADA A LA PARIDAD DE V1 (decisión del usuario): en Nuevo y Editar movimiento las categorías cuyo código no está en las listas fijas (creadas por el usuario) se muestran en AMBOS tipos. Finanzas y Reportes no filtran por lista de categorías: sin cambio.
- `ResumenAlertas`: un solo Text con `numberOfLines 2`, `adjustsFontSizeToFit`, `minimumFontScale 0.6`, cifra 24 px, menos padding horizontal. Textos iguales («Críticas: 0»...).

### Puntos 1 y 7: «Guardando...» y validación visual (segunda parte)

- Componentes nuevos: `useGuardaEnvio` (guard con `useRef` contra doble envío: `onPress={guardia(guardar)}`), `useValidacion` (errores por campo, `fallar(campo, mensaje)` con borde rojo + mensaje + scroll al campo + foco; el error se limpia al editar), `CampoGrupo` (borde rojo y mensaje para grupos de opciones). `CampoTexto` gana props `contenedorRef`, `inputRef`, `alEditar`. `Boton` gana `guardando` (apaga, quita icono y muestra «Guardando...») y `tituloGuardando`.
- Los `Alert` de validación se conservan; el mensaje es el mismo texto de siempre. Sin cambio de momento de navegación ni de testID.
- Acceso (Login, Registro, Criadero nuevo): el mensaje de validación local ya no sale en el `Aviso` superior sino bajo el primer campo vacío (mismo texto); los errores de API siguen en el `Aviso`. Registro y Criadero pasan de spinner a texto «Creando...»; Login «Ingresando...».
- Retroalimentación nueva sin guardado previo: Nuevo movimiento («Guardando...»), SaludAve («Guardando...»), Sanidad (guard), Catálogo alta rápida («Guardando...»), Quitar ave de jaula («Quitando...»), Eliminar elemento de catálogo («Eliminando...»), abrir criadero («Entrando...»).
- Guard añadido (ya tenían texto): NuevaJaula, DetalleJaula (editar), Alimentación, Bebida, Sanidad, SeleccionarAveJaula, FinalizarTratamiento, RegistrarHuevo, BajaAve, EditarMovimiento (manual y venta), EditarCatalogoItem, EvolucionAve. NuevaAve y alta rápida de catálogo ya tenían guard propio.
- Validación visual en: NuevaJaula, DetalleJaula, NuevaAve (código, raza, sexo, peso, altura, largo, edad, criadero, método, código duplicado), Alimentación, Bebida, SaludAve, BajaAve, Nuevo/Editar movimiento, Catálogo (alta rápida y edición), EvolucionAve, Login, Registro, Criadero nuevo.

## Segunda ronda de correcciones (2026-11-10, decisiones 2, 3, 4, 5, 6, 7 y 9)

- Punto 2, corrección de venta (`EditarMovimientoFinancieroScreen`): «Valor del ave» y «Valor de envío» ya no usan `filtrarDecimal`; `onChangeText` solo cambia coma por punto (texto tal cual se teclea, como V1). `parseNoNegativo` y el Alert «Valor inválido» no cambian (con letras ahora es inválido, ya no se descartan). «Valor» del movimiento (Nuevo y Editar manual) conserva el filtro.
- Punto 3: `Boton` «Cerrar sesión» de `SeleccionCriaderoScreen` pasa a «Cerrando...» (`guardando`, con `useGuardaEnvio`); la fila de Más pasa su título a «Cerrando...» y deja de aceptar toques (estado `cerrando`; Alert de confirmación igual). `DetalleJaulaScreen`: el botón `eliminar-jaula` (texto «Eliminar») muestra «Eliminando...» deshabilitado mientras `procesandoJaula`; la acción del Alert va con guard. Momento de navegar sin cambio.
- Punto 4: `SaludAveScreen` ya no llama a `mostrarAviso`; antes de `goBack()` fija el parámetro de ruta `avisoSalud {titulo, mensaje}` en la ruta previa `DetalleAve` (`CommonActions.setParams` con `source`). `DetalleAveScreen` lo muestra con `useAvisoExito` + `Aviso flotante` y limpia el parámetro (`setParams({avisoSalud: undefined})`). Mismo título y mensaje. Se quita la recarga `cargarDatos()` previa a `goBack` (la ficha recarga al enfocar).
- Punto 5: `useValidacion.fallar` acepta una lista de campos (y mensaje o lista de mensajes): marca todos, scroll y foco al primero (compatible con el uso anterior). NuevaAve: «Padres inválidos» (local y de la API `padres_iguales`) marca `padre` y `madre` con `CampoGrupo` (borde rojo y mensaje) además del Alert; al elegir padre o madre se limpian. Login, Registro y Criadero nuevo marcan todos los campos vacíos.
- Punto 6: `NuevoMovimientoFinancieroScreen`: el `catch` ahora muestra `Alert.alert('Error', 'No fue posible guardar el registro.')`; el `finally` ya liberaba el botón y el guard. Editar ya tenía sus Alert de error (sin cambio).
- Punto 7: `theme/icons.js`: `jaulas`/`jaulasActivo` -> `jaula`/`jaula-relleno` (SVG propio en `Icono.js`: jaula de barras); `grid-outline` y `grid` se redirigen a ellos (también en usos directos de Ciclo de vida, Nueva jaula, Reportes, Producción y Seleccionar ave). `cicloVida`: `leaf-outline` -> `hourglass-outline`. `JaulaEstado`: Limpieza `sparkles`/`sparkles-outline` -> `brush`/`brush-outline` (no choca con Bebida `water-outline`). Los `sparkles-outline` de «Origen del ave» (NuevaAve) y del evento de Ciclo de vida no se tocan (no son limpieza).
- Punto 9: `documents/ux/pendiente-en-telefono.md` (nuevo).
- Para los flujos Maestro: textos nuevos «Cerrando...» y «Eliminando...» solo aparecen durante la operación; el aviso «Registro guardado» ahora se ve en la ficha del ave (no en Salud); en venta corregida las letras ya no se descartan al teclear. testID sin cambio.
