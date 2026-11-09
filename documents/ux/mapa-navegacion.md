# Mapa de navegación ACTUAL (antes de la fase UX)

Fecha: 2026-11-09. Autor: disenador-ux. Verificado en el código de `src/` (archivo:línea). Complementa `diagnostico-navegacion.md` (causas y mecanismo de `StackRouter`). Describe el estado hoy, no el propuesto.

## 1. Estructura

- Raíz: `App.js` decide entre `AccesoNavigator` (sin sesión/criadero) y `AppNavigator` (con criadero).
- `AccesoNavigator.js:32-60`: pila `SeleccionCriadero`, `Login`, `Registro` (según estado de sesión).
- `AppNavigator.js:79-293`: `Tab.Navigator` de 5 pestañas, sin `backBehavior` (valor por defecto: "atrás" desde una pestaña va a la primera, Inicio). Inicio (`:208`) es una pantalla suelta, sin pila; Jaulas (`:220`), Aves (`:239`), Finanzas (`:258`) y Más (`:277`) son pilas. Esas cuatro llevan el listener `tabPress` con `preventDefault` + `navigate(tab,{screen: raíz})` (`:37-71`, aplicado en `:226,245,264,283`).

## 2. Grafo por pila (origen -> destino)

### Acceso (`AccesoNavigator.js`)
| Origen | Destino | Código | Atrás |
|---|---|---|---|
| Login | Registro | `LoginScreen.js:154` | vuelve a Login |
| Registro | Login | `RegistroScreen.js:169` (`navigate`, no `goBack`) | vuelve al Login ya existente en la pila; correcto |
| SeleccionCriadero | (entra a la app) | cambio de estado de sesión | sin atrás |

### Inicio (sin pila; `InicioScreen`)
| Origen | Destino | Código | Atrás |
|---|---|---|---|
| Alerta de ave | pestaña Aves > `DetalleAve` | `InicioScreen.js:780-783` | NO vuelve al origen: queda en Aves (lista o ficha previa) |
| Alerta bebida | Jaulas > `BebidaJaula` | `:798-801` | NO: tras guardar, `goBack` (`BebidaJaulaScreen.js:122`) cae en `ListaJaulas` |
| Alerta alimentación | Jaulas > `AlimentacionJaula` | `:816-819` | NO: igual (`AlimentacionJaulaScreen.js:121`) |
| Alerta jaula | Jaulas > `DetalleJaula` | `:834-837` | NO: atrás cae en `ListaJaulas` |

### Jaulas (`JaulasStackNavigator.js`, raíz `ListaJaulas` `:59`)
| Origen | Destino | Código | Atrás |
|---|---|---|---|
| ListaJaulas | `NuevaJaula` | `JaulasScreen.js:154` | vuelve a la lista; tras guardar `goBack` (`NuevaJaulaScreen.js:98`) |
| ListaJaulas (tarjeta) | `DetalleJaula` (pestaña Activas) o `DetalleJaulaInactiva` | `JaulasScreen.js:320-323` | lista |
| DetalleJaula | `SeleccionarAveJaula` | `DetalleJaulaScreen.js:1091` | detalle de jaula; tras elegir `goBack` (`SeleccionarAveJaulaScreen.js:203`) |
| DetalleJaula | `AlimentacionJaula` / `BebidaJaula` / `SanidadJaula` / `HistorialJaula` | `:1296, 1321, 1346, 1371` | detalle de jaula; tras guardar `goBack` |
| DetalleJaula (tocar un ave) | pestaña Aves > `DetalleAve` | `DetalleJaulaScreen.js:216-220` | NO: va a la lista/ficha previa de Aves; la jaula queda oculta en su pila |
| DetalleJaula (eliminar) | (sale) | `:567` `goBack` | lista |
| DetalleJaulaInactiva (tocar un ave) | Aves > `DetalleAve` | `DetalleJaulaInactivaScreen.js:107-110` | NO: igual |

### Aves (`AvesStackNavigator.js`, raíz `ListaAves` `:36`, sin cabecera)
| Origen | Destino | Código | Atrás |
|---|---|---|---|
| ListaAves | `NuevaAve` | `AvesScreen.js:336` | lista; tras guardar ver abajo |
| ListaAves (tarjeta) | `DetalleAve` | `AvesScreen.js:544-547` | lista |
| NuevaAve (tras guardar, botón "Ver ave") | `DetalleAve` con `replace` | `NuevaAveScreen.js:1187` | la ficha reemplaza al formulario: atrás vuelve a la lista (correcto); "Aceptar"/volver usa `goBack` (`:652`, `:1101`) |
| DetalleAve | `NuevaAve` (editar) | `DetalleAveScreen.js:832` | ficha |
| DetalleAve | `EvolucionAve` / `SaludAve` / `RegistrarHuevo` | `:869, 904, 939` | ficha; tras guardar `goBack` (`EvolucionAveScreen.js:440`, `RegistrarHuevoScreen.js:156`) |
| DetalleAve | `CicloVidaAve` / `GenealogiaAve` | `:970, 999` | ficha |
| DetalleAve | `BajaAve` | `:1032` | ficha; al confirmar `popToTop` (`BajaAveScreen.js:266`): NO vuelve a la ficha ni al origen (siempre `ListaAves`) |
| SaludAve | `FinalizarTratamiento` | `SaludAveScreen.js:481` | salud; tras guardar `goBack` (`FinalizarTratamientoScreen.js:109`) |
| GenealogiaAve (nodo) | `DetalleAve` con `push` y `desdeGenealogia` | `GenealogiaAveScreen.js:512, 982` | NO coherente: cada nodo apila otra ficha (cadena ficha > árbol > ficha...); la ficha no lee `desdeGenealogia` |

### Finanzas (`FinanzasStackNavigator.js`, raíz `FinanzasInicio` `:41`)
| Origen | Destino | Código | Atrás |
|---|---|---|---|
| FinanzasInicio | `NuevoMovimientoFinanciero` | `FinanzasScreen.js:531` | lista; tras guardar `goBack` (`NuevoMovimientoFinancieroScreen.js:177`) |
| FinanzasInicio (movimiento) | `EditarMovimientoFinanciero` | `:745` | lista; `goBack` tras guardar/corregir (`EditarMovimientoFinancieroScreen.js:234, 293`) |

### Más (`MasStackNavigator.js`, raíz `MasMenu` `:69`)
| Origen | Destino | Código | Atrás |
|---|---|---|---|
| MasMenu | `Configuracion`, `ProduccionHuevos`, `Clientes`, `Reportes`, `Backup`, `Alertas` | `MasMenuScreen.js:142, 154, 166, 178, 190, 203` | menú |
| Configuracion | `Catalogo` | `ConfiguracionScreen.js:104` | configuración |
| Catalogo | `EditarCatalogoItem` (editar `:338`, nuevo `:466`) | `CatalogoScreen.js:338, 466` | catálogo; tras guardar `goBack` (`EditarCatalogoItemScreen.js:154`) |
| Clientes | `DetalleCliente` | `ClientesScreen.js:366` | lista |
| Alertas | Aves > `DetalleAve` (`AlertasScreen.js:574-580`), Jaulas > `BebidaJaula` (`:602-608`), `AlimentacionJaula` (`:630-636`), `DetalleJaula` (`:658-664`) | | NO: cambia de pestaña; atrás queda en Aves/Jaulas, Más sigue en Alertas |

## 3. Qué hace "atrás" y qué muestra cada pestaña al volver

- Flecha/gesto "atrás" dentro de una pila: `goBack` a la pantalla anterior de esa pila (cabecera nativa). En las raíces de Aves (sin cabecera, `AvesStackNavigator.js:36`) no hay flecha.
- "Atrás" del sistema (Android) en una raíz de pila: sin `backBehavior`, sale a Inicio (pestaña inicial); desde Inicio sale de la app.
- Tocar una pestaña (cualquiera de las 4 con pila), activa o no: `preventDefault` + `navigate(tab,{screen: raíz})` (`AppNavigator.js:56-65`). Si la pantalla actual de esa pila es otra, NO se reutiliza la raíz: se apila una `ListaX` nueva (diagnóstico, `StackRouter` 456-467). Resultado: `[ListaX, DetalleX, ListaX]` (pila fantasma; "atrás" lleva a la ficha antigua). Si ya estás en la raíz, no cambia nada.
- Qué muestra cada pestaña al volver desde otra: la raíz (lista/menú), porque el listener la fuerza; la pila anterior queda debajo, oculta. Inicio: siempre la pantalla única (se recarga por foco, ver `InicioScreen.js`).

## 4. Casos donde "atrás" NO vuelve al origen (resumen)

1. Inicio > ficha de ave / jaula / alimentación / bebida (`InicioScreen.js:780-837`).
2. Alertas > ficha de ave / jaula / alimentación / bebida (`AlertasScreen.js:574-664`).
3. Detalle de jaula (activa) > ave (`DetalleJaulaScreen.js:216`).
4. Detalle de jaula inactiva > ave (`DetalleJaulaInactivaScreen.js:107`).
5. Genealogía > nodo > fichas encadenadas (`GenealogiaAveScreen.js:512, 982`).
6. Baja de ave confirmada: `popToTop` a `ListaAves` (`BajaAveScreen.js:266`).
7. Tocar pestañas con pila interna: pila fantasma (`AppNavigator.js:37-71`).
8. Guardar alimentación/bebida llegando desde Inicio/Alertas: `goBack` cae en `ListaJaulas` (`AlimentacionJaulaScreen.js:121`, `BebidaJaulaScreen.js:122`).
9. Ficha ya abierta con el mismo nombre: la nueva `navigate` reemplaza los parámetros (se pierde la ficha previa) (diagnóstico, `StackRouter` 389-390).
10. "Atrás" del sistema desde cualquier pestaña: Inicio, no la pestaña previa.

Casos correctos (vuelven al origen): Login/Registro, formularios de Jaulas/Aves/Finanzas/Catálogo y sus `goBack`, ListaX > DetalleX > acciones, `replace` de NuevaAve a DetalleAve.

## 5. Pendiente de verificar en teléfono
Comportamiento exacto de la pila hija al abrirse por primera vez con `navigate(tab,{screen})` (si hay `ListaX` debajo) depende de `initial`; el diagnóstico lo toma de `node_modules`. Probar en el teléfono antes y después del Bloque B.
