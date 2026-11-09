# Diagnóstico de navegación: por qué "atrás" y las pestañas llevan a sitios inesperados

Fecha: 2026-11-09. Solo diagnóstico; no se corrigió nada. Versiones: `@react-navigation/routers` 7.6.4, bottom-tabs 7.x, native-stack 7.x (código leído en `node_modules/@react-navigation/*/src`).

## Explicación en lenguaje simple

Cada pestaña (Jaulas, Aves, Finanzas, Más) tiene su propia pila de pantallas. La app intercepta el toque en la pestaña y, en lugar de dejar que React Navigation vuelva a la lista o restaure lo que había, le ordena "ve a la lista". Esa orden **apila otra copia de la lista encima** de la ficha donde estabas. La pantalla se ve bien (la lista), pero debajo siguen la ficha y la lista antiguas, así que "atrás" te devuelve a la ficha que creías haber dejado. Además, los atajos desde Inicio, Alertas y la ficha de jaula saltan a otra pestaña y empujan pantallas dentro de la pila de esa otra pestaña: al volver con "atrás" no regresas al origen sino a lo que ya hubiera en esa pila (normalmente su lista). A eso se suma que Android, con "atrás" desde cualquier pestaña, va siempre a Inicio y no a la pestaña anterior.

## Causa 1 (principal): el listener `tabPress` hace `preventDefault` y `navigate` hacia la lista

- `src/navigation/AppNavigator.js:37-71` define `crearListenerRutaInicial`: en `tabPress` ejecuta `event.preventDefault()` (línea 56) y `navigation.navigate(tabName, { screen: screenName })` (59-65). El comentario (50-55) dice que se quiere evitar que se "reactive el estado anterior" de la pila. Se aplica a Jaulas (226-231), Aves (245-250), Finanzas (264-269) y Más (283-288).
- Por qué apila en vez de volver: `navigate` hacia `{screen:'ListaAves'}` llega a la pila hija como acción `NAVIGATE` (`@react-navigation/core/src/useNavigationBuilder.tsx:715-743`). En `StackRouter.tsx:385-396` solo reutiliza la ruta si el nombre coincide con la pantalla **actual** (línea 389) o si se pasa `pop: true` (391). Si estás en `DetalleAve`, el nombre no coincide, no se pasa `pop`, así que se cae a `StackRouter.tsx:456-467` y **se añade una ruta nueva** `ListaAves` al final. Pila resultante: `[ListaAves, DetalleAve, ListaAves]`.
- Además, `preventDefault` anula el comportamiento nativo que sí sería correcto: `popToTop` al volver a tocar la pestaña activa (lo ejecuta `native-stack` solo si `!e.defaultPrevented`) y la restauración al volver desde otra pestaña (`BottomTabBar.tsx:406` solo navega si no se previno). El resultado no es ni "recordar dónde estaba" ni "reiniciar a la lista": es una mezcla que deja pantallas fantasma.
- Con cada toque repetido en la pestaña estando en una pantalla interna, la pila crece (ListaX, Detalle, ListaX, ...). Solo si ya estás en la lista no se duplica (coincide con la actual).

## Causa 2: atajos que cruzan de pestaña (`navigate` hacia otra pila)

Cada uno cambia de pestaña y empuja la pantalla dentro de la pila de la otra pestaña; "atrás" nunca vuelve al origen.

| Origen | Código | Destino (pila) | Qué pasa al pulsar "atrás" |
|---|---|---|---|
| Inicio, alerta de ave | `InicioScreen.js:780-788` | `Aves > DetalleAve` | va a `ListaAves` (o a lo que hubiera en la pila Aves), pestaña activa pasa a Aves; no vuelve a Inicio |
| Inicio, alerta Bebida/Alimentación/Jaula | `InicioScreen.js:798`, `816`, `834` | `Jaulas > BebidaJaula / AlimentacionJaula / DetalleJaula` | al guardar, `goBack` (`BebidaJaulaScreen.js:122`, `AlimentacionJaulaScreen.js:121`) vuelve a `ListaJaulas`, no a Inicio |
| Alertas (Más), todas las acciones | `AlertasScreen.js:574-675` | `Aves` y `Jaulas` como arriba | igual: queda en la lista de Aves/Jaulas, la pila de Más sigue en Alertas |
| Ficha de jaula, tocar un ave | `DetalleJaulaScreen.js:197-228` (navigate en 216) | `Aves > DetalleAve` | "atrás" lleva a la lista de aves, no a la jaula; la jaula queda abierta, oculta, en la pila de Jaulas |
| Ficha de jaula inactiva, tocar un ave | `DetalleJaulaInactivaScreen.js:94-117` (107) | `Aves > DetalleAve` | igual |

Caso agravante: si la pila de destino ya está en `DetalleAve` (otra ave) o `DetalleJaula` (otra jaula), el nombre coincide con la pantalla actual y `StackRouter.tsx:389-390` **reemplaza los parámetros de esa ficha** en lugar de apilar: se pierde la ficha anterior sin aviso (se ve el ave nueva y "atrás" va a la lista, no a la ficha previa).

Una vez dentro de otra pestaña, volver con la barra inferior activa la Causa 1: la pestaña de origen queda con su pila intacta debajo y, al tocarla, se le apila otra lista.

## Causa 3: otras llamadas que reordenan la pila

| Código | Efecto |
|---|---|
| `GenealogiaAveScreen.js:512` y `982` `navigation.push('DetalleAve', {..., desdeGenealogia:true})` | Cada nodo del árbol apila otra ficha. Se puede encadenar ficha > genealogía > ficha > genealogía... sin límite. El parámetro `desdeGenealogia` no lo lee ninguna pantalla (solo aparece en Genealogía), así que la ficha no sabe que viene del árbol. Todas se titulan "DetalleAve". |
| `BajaAveScreen.js:266` `navigation.popToTop()` (tras la baja) | Vuelve a `ListaAves`, no a la ficha. Es razonable (el ave ya no está activa) pero rompe la pila completa; si se llegó desde Inicio/Alertas/Jaula, se termina en la lista de Aves, no en el origen. |
| `NuevaAveScreen.js:1187` `navigation.replace('DetalleAve')` (botón "Ver ave") | Sustituye el formulario por la ficha: correcto; "atrás" va a la lista. Se anota porque el formulario ya no se puede retomar. |
| `goBack()` tras guardar en `NuevaJaula:98`, `Alimentacion:121`, `Bebida:122`, `Sanidad:100`, `SeleccionarAveJaula:203`, `RegistrarHuevo:156`, `FinalizarTratamiento:109`, `EditarCatalogoItem:154`, `NuevoMovimientoFinanciero:177`, `EditarMovimientoFinanciero:234/293`, `EvolucionAve:440`, `NuevaAve:652/1101`, `DetalleJaula:567` | Funcionan bien cuando se entró desde la pantalla anterior natural; dan el destino inesperado solo cuando la pantalla se abrió por un atajo (Causa 2). |
| `AppNavigator.js:32-33` sin `backBehavior` | Valor por defecto `firstRoute` (`SwitchRouter.tsx:183`): "atrás" del teléfono desde Jaulas/Aves/Finanzas/Más (con la pila en su raíz) salta a **Inicio**, no a la pestaña anterior; desde Inicio sale de la app. |
| `App.js:113` barra de navegación de Android oculta | El usuario depende del gesto de atrás o del botón de cabecera; aumenta la sensación de azar al volver. |
| Sin `title` en 7 pantallas de Aves (`AvesStackNavigator.js:41-74`) | Cabecera con nombre técnico ("DetalleAve", "SaludAve"): no orienta. Es la raíz de "no sé dónde estoy". |
| Cabeceras de los tabs raíz ocultas (`headerShown:false`) + títulos propios en el cuerpo con formatos distintos | Cada raíz muestra un título con estilo diferente (`Header` 28 px, "💰 Finanzas", "Más", "Criadero Kikirikis"); no hay indicación de sección en pantallas internas salvo la cabecera nativa. |

## Casos concretos reproducibles (lista)

1. Aves > ficha del ave A-12 > tocar pestaña Aves: se ve la lista; "atrás" muestra otra vez la ficha A-12.
2. Aves > ficha > Salud > tocar pestaña Aves: lista; "atrás" vuelve a Salud, luego ficha, luego otra lista (3 capas ocultas).
3. Aves > ficha > pestaña Finanzas > pestaña Aves: aterriza en la lista (no en la ficha), con la ficha debajo.
4. Jaulas > detalle de jaula > tocar un ave: salta a Aves > ficha; "atrás" lleva a la lista de aves, no a la jaula; pestaña Jaulas sigue en el detalle por debajo, luego tocarla apila otra lista.
5. Inicio > alerta de ave: abre Aves > ficha; "atrás" lleva a la lista de Aves y la barra marca Aves, no Inicio.
6. Inicio > alerta de alimentación > Guardar > Aceptar: termina en la lista de Jaulas.
7. Alertas (Más) > alerta de jaula: abre Jaulas > detalle; la pila de Más queda en Alertas; al volver a Más sigue en Alertas (o vuelve a la lista si se toca la pestaña, por la Causa 1).
8. Ficha de ave A > árbol genealógico > tocar ave B > árbol > tocar C: cuatro o más fichas apiladas todas tituladas "DetalleAve".
9. Dar de baja un ave abierta desde Inicio: al aceptar termina en la lista de Aves.
10. Atrás del sistema desde Jaulas (en la lista): va a Inicio; desde Inicio sale de la app.
11. Ave abierta desde una jaula, luego otra ave abierta desde otra jaula en la misma sesión: si la pila de Aves está en una ficha, la segunda sustituye a la primera sin dejarla en la pila.

## Lo que no es causa

- Stacks no están anidados en pilas más profundas ni hay `reset`/`CommonActions` en el código (búsqueda en `src/`: sin coincidencias de `reset`, `StackActions`, `beforeRemove`, `BackHandler`).
- `initialRouteName` solo existe en Aves, Finanzas y Más y coincide con la primera pantalla: no interviene.
- `useFocusEffect` (recarga de datos) no cambia la navegación.

## Observaciones (sin tocar)

- DUDA PARA EL USUARIO: al volver a una pestaña, ¿debe mostrar la lista inicial de esa sección (como ahora pretende el código) o recordar la ficha donde estaba? Hoy es un híbrido. La propuesta recomienda: tocar la pestaña activa vuelve a la lista (comportamiento estándar); cambiar de pestaña y regresar restaura lo que había.
- DUDA PARA EL USUARIO: ¿"atrás" desde una ficha abierta por un atajo (alerta, ave desde jaula) debe devolver al origen? La propuesta lo asume (sí).
