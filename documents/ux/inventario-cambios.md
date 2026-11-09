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
