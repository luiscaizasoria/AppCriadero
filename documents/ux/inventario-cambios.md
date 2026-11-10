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

## Cambios de navegación previstos (aún no hechos; detalle en `mapa-navegacion.md`)

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
