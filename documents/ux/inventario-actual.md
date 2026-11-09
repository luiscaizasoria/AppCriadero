# Inventario actual de la app (fase UX, solo lectura)

Fecha: 2026-11-09. Autor: disenador-ux. Fuente: código real (`App.js`, `src/navigation/`, `src/screens/`, `src/components/`, `src/config/constants.js`). No se modificó nada.

## 1. Arranque y sesión (`App.js`)

- `App.js:86-163`: oculta la barra de navegación de Android (`NavigationBar.setVisibilityAsync('hidden')`, línea 113), inicializa SQLite y muestra spinner "Preparando Criadero Kikirikis..." (212-251).
- Modo API (`USAR_API`): `App.js:260-306`. Sin token o sin criadero muestra `AccesoNavigator` (otro `NavigationContainer`); con ambos, `AppNavigator`. En modo SQLite va directo a `AppNavigator`.
- Pantalla de error de arranque: título rojo + texto (172-203), sin botón de reintento.

## 2. Navegadores, pestañas y pilas

Contenedor: un solo `NavigationContainer` (`App.js:314`). Pestañas inferiores: `src/navigation/AppNavigator.js` (`@react-navigation/bottom-tabs` 7.x). `backBehavior` no se configura: por defecto es `firstRoute` (`node_modules/@react-navigation/routers/src/SwitchRouter.tsx:183`).

| Pestaña (orden) | Icono Ionicons | Contenido | Listener `tabPress` |
|---|---|---|---|
| Inicio (1) | `home` | `InicioScreen` (pantalla suelta, sin pila) | no |
| Jaulas (2) | `grid` | `JaulasStackNavigator` | sí (`AppNavigator.js:226-231`) |
| Aves (3) | `paw` | `AvesStackNavigator` | sí (245-250) |
| Finanzas (4) | `cash` | `FinanzasStackNavigator` | sí (264-269) |
| Más (5) | `settings` | `MasStackNavigator` | sí (283-288) |

Barra: altura fija 64, `paddingTop 5`, `paddingBottom 7`, etiqueta 11 px peso 600, color activo `COLORS.primary`, inactivo `COLORS.textSecondary` (`AppNavigator.js:97-119`). Sin insignia de alertas en la barra.

### Pilas (`createNativeStackNavigator`, todas con `headerTintColor: COLORS.primary`)

- **Jaulas** (`JaulasStackNavigator.js`): `ListaJaulas` (sin cabecera) > `NuevaJaula`, `DetalleJaula`, `DetalleJaulaInactiva`, `SeleccionarAveJaula`, `AlimentacionJaula`, `BebidaJaula`, `SanidadJaula`, `HistorialJaula`. Todas con `title` en español (líneas 58-155). Sin `initialRouteName` (la primera es `ListaJaulas`).
- **Aves** (`AvesStackNavigator.js`): `ListaAves` (sin cabecera) > `NuevaAve`, `DetalleAve`, `EvolucionAve`, `SaludAve`, `FinalizarTratamiento`, `BajaAve`, `RegistrarHuevo`, `CicloVidaAve` (title "Ciclo de vida"), `GenealogiaAve` (title "Árbol genealógico"). **Siete de las diez pantallas no declaran `title`** (líneas 41-74): la cabecera nativa muestra el nombre técnico de la ruta ("DetalleAve", "NuevaAve", "SaludAve"...).
- **Finanzas** (`FinanzasStackNavigator.js`): `FinanzasInicio` (sin cabecera) > `NuevoMovimientoFinanciero` ("Nuevo movimiento"), `EditarMovimientoFinanciero` ("Movimiento financiero").
- **Más** (`MasStackNavigator.js`): `MasMenu` (sin cabecera) > `Configuracion`, `Catalogo` (title dinámico `route.params.titulo`), `EditarCatalogoItem` ("Elemento"), `ProduccionHuevos`, `Clientes`, `DetalleCliente`, `Reportes`, `Backup` ("Respaldo"), `Alertas`.
- **Acceso** (`AccesoNavigator.js`, solo modo API, sin cabecera): `Login` y `Registro` (sin sesión) o `SeleccionCriadero` (con sesión sin criadero).

Pantalla huérfana: `SaludScreen.js` (19 líneas, "🐔 Salud") no está registrada en ningún navegador.

## 3. Pantallas (archivo, función, de dónde se llega)

### Acceso (`src/screens/acceso/`)
| Pantalla | Qué hace | Se llega desde |
|---|---|---|
| `LoginScreen.js` | Correo + contraseña, "Ingresar", enlace "Crear una cuenta" | arranque sin sesión; `RegistroScreen.js:169` |
| `RegistroScreen.js` | Nombre, correo, contraseña, "Crear cuenta", enlace "Ya tengo una cuenta" | `LoginScreen.js:154` |
| `SeleccionCriaderoScreen.js` | Lista de criaderos ("Toca para entrar"), "Crear otro criadero", formulario de 6 campos (país trae "Ecuador"), "Reintentar", "Cerrar sesión" | tras iniciar sesión sin criadero guardado |
| `estilosAcceso.js` | Estilos compartidos de las tres (título 26, etiquetas 15, inputs radio 12, botón radio 14) | importado |

### Inicio
`InicioScreen.js` (pestaña): tarjetas en una sola columna con scroll: Aves (activas, vendidas, fallecidas, tratamiento), Distribución por raza, Producción, Indicadores, Producción últimos días, Alertas (cada alerta navega a su ave/jaula: líneas 774-846), Finanzas del mes, Jaulas. Título `Header` "Criadero Kikirikis" / "Estado general del criadero" (255-261). Un fallo de red solo hace `console.error` (173-180).

### Jaulas
| Pantalla | Qué hace | Se llega desde |
|---|---|---|
| `JaulasScreen.js` (`ListaJaulas`) | Pestañas internas Activas/Inactivas, "＋ Nueva jaula" (solo activas), tarjetas `JaulaCard` | pestaña Jaulas |
| `NuevaJaulaScreen.js` | Código*, nombre, ubicación, tipo (chips) | `JaulasScreen.js:154` |
| `DetalleJaulaScreen.js` (2002 líneas) | Datos, editar en la propia pantalla, "Eliminar" (baja), aves de la jaula (Quitar, abrir ave), "Agregar", acciones Alimentación/Bebida/Sanidad/Historial | `JaulasScreen.js:320`, `InicioScreen.js:834`, `AlertasScreen.js:658` |
| `DetalleJaulaInactivaScreen.js` | Historial de una jaula dada de baja (solo lectura) | `JaulasScreen.js:320` |
| `SeleccionarAveJaulaScreen.js` | Elegir ave para asignar | `DetalleJaulaScreen.js:1091` |
| `AlimentacionJaulaScreen.js`, `BebidaJaulaScreen.js` | Elegir tipo (chips del catálogo) y guardar con fecha actual; Alert y `goBack` | `DetalleJaulaScreen.js:1296/1321`; Inicio (798, 816) y Alertas (602, 630) |
| `SanidadJaulaScreen.js` | Elegir estado sanitario y guardar | `DetalleJaulaScreen.js:1346` |
| `HistorialJaulaScreen.js` | Lista de eventos de la jaula | `DetalleJaulaScreen.js:1371` |

### Aves
| Pantalla | Qué hace | Se llega desde |
|---|---|---|
| `AvesScreen.js` (`ListaAves`) | `Header` "Aves", pestañas Activas/Vendidas/Fallecidas, "＋ Nueva ave", búsqueda por código, filtros plegables (raza, sexo, salud, jaula, edad), tarjetas `AveCard` | pestaña Aves |
| `NuevaAveScreen.js` (3168 líneas) | Alta y edición (parámetro `modoEdicion`): código*, foto, origen (nacida/comprada), fechas, padres, raza*, sexo*, medidas, características, jaula inicial; "Guardar ave" | `AvesScreen.js:336`, `DetalleAveScreen.js:832` |
| `DetalleAveScreen.js` (1776) | Ficha: datos, huevos, botón por acción: Editar, Evolución, Salud, Registrar huevo, Ciclo de vida, Genealogía, Dar de baja (al final del scroll, 804-1052) | `AvesScreen.js:544`, Inicio/Alertas (Aves.DetalleAve), `DetalleJaulaScreen.js:216`, `DetalleJaulaInactivaScreen.js:107`, Genealogía (push, 512/982), `NuevaAveScreen.js:1187` (replace) |
| `EvolucionAveScreen.js` | Seguimiento con foto/medidas | `DetalleAveScreen.js:869` |
| `SaludAveScreen.js` | Diagnóstico (enfermedad, síntomas, medicamento, dosis), estado, historial sanitario, "Finalizar tratamiento" | `DetalleAveScreen.js:904` |
| `FinalizarTratamientoScreen.js` | Observación + "Confirmar recuperación" | `SaludAveScreen.js:481` |
| `BajaAveScreen.js` | Fallecimiento o Venta, campos según tipo, "Confirmar baja" | `DetalleAveScreen.js:1032` |
| `RegistrarHuevoScreen.js` | Observación y "Registrar huevo" (fecha actual) | `DetalleAveScreen.js:939` |
| `CicloVidaAveScreen.js` | Línea de tiempo del ave | `DetalleAveScreen.js:970` |
| `GenealogiaAveScreen.js` | Árbol de ancestros y descendientes; tocar un nodo abre su ficha | `DetalleAveScreen.js:999` |

### Finanzas
`FinanzasScreen.js` (pestaña): título "💰 Finanzas", periodo (Este mes/Este año/Todo, líneas 269-325), ingresos/egresos/balance, consolidado por categoría, "＋ Nuevo movimiento", últimos meses, movimientos (toque abre edición). `NuevoMovimientoFinancieroScreen.js` (tipo, categoría*, valor*, detalle). `EditarMovimientoFinancieroScreen.js` (ver/corregir).

### Más
| Pantalla | Qué hace | Se llega desde |
|---|---|---|
| `MasMenuScreen.js` | Título "Más", seis tarjetas con emoji (Configuración, Producción de huevos, Clientes, Reportes, Respaldo, Alertas con `AlertBadge`) y "Cerrar sesión" (solo API) | pestaña Más |
| `ConfiguracionScreen.js` | Seis catálogos (Razas, Enfermedades, Medicamentos, Alimentos, Bebidas, Categorías financieras) | `MasMenuScreen.js:142` |
| `CatalogoScreen.js` | Lista de ítems con Editar/Eliminar (desactivar), "Nuevo elemento" | `ConfiguracionScreen.js:104` |
| `EditarCatalogoItemScreen.js` | Nombre + descripción, "Guardar" | `CatalogoScreen.js:338/466` |
| `ProduccionHuevosScreen.js` | Resumen hoy/mes, gráfica de días, por jaula | `MasMenuScreen.js:154` |
| `ClientesScreen.js`, `DetalleClienteScreen.js` | Buscar clientes; detalle con compras | `MasMenuScreen.js:166`; `ClientesScreen.js:366` |
| `ReportesScreen.js` | Resúmenes (Aves, Salud, Producción, Finanzas) y 6 botones "Exportar X" (CSV) | `MasMenuScreen.js:178` |
| `BackupScreen.js` | "Respaldo": crear/compartir/restaurar (SQLite) | `MasMenuScreen.js:190` |
| `AlertasScreen.js` | Resumen, filtros, lista; cada alerta navega a ave/jaula (574-675) | `MasMenuScreen.js:203` |

## 4. Componentes (`src/components/`) y repeticiones

`Header.js` (título con "🐔 " fijo delante, 28 px bold primario), `Card.js` (radio 16, sombra), `SectionTitle.js` (20 bold, color `#234` literal), `MetricCard.js`, `AveCard.js` (839 líneas, 12 hex literales), `JaulaCard.js`, `StatusBadge.js`, `AlertBadge.js`, `AlertCard.js`, `RankingCard.js`, `ProductionInfoCard.js`, `ProductionMetricCard.js`, `SelectorCatalogo.js` (chips con "🐔 " fijo, fondo `#e8eeee`), `charts/` (ProgressBar, FinanzasBarChart, ProduccionBarChart, ProduccionJaulaBarChart).

Uso de componentes comunes en pantallas (conteo de coincidencias): solo 10 de 35 pantallas usan alguno (`Header` en Aves, Reportes, Alertas, Inicio; `Card` en Reportes, Detalle Ave/Jaula, etc.). El resto repite títulos, tarjetas, botones, campos y chips en su propio `StyleSheet`.

Patrones repetidos copiados en cada pantalla (no hay componente): título de pantalla dentro del cuerpo (24-28 px, primario, con emoji), etiqueta + `TextInput`, botón primario "💾 Guardar...", chips de selección (Alimentación, Bebida, Sanidad, Baja, Nuevo movimiento, Nueva jaula, Nueva ave), pestañas internas (Aves, Jaulas, Finanzas periodo), estados "Cargando..." con `ActivityIndicator`, `Alert` de éxito con único botón "Aceptar".

Duplicación de título: la cabecera nativa y el título del cuerpo dicen lo mismo en Nueva jaula, Alimentación, Bebida, Sanidad, Historial, Configuración, Reportes, Alertas, Respaldo, Genealogía, Ciclo de vida.

## 5. Iconografía

- Librería: `@expo/vector-icons` (ya en `package.json:6`, versión ^15.0.2). Uso real de `Ionicons` solo en: barra de pestañas (`AppNavigator.js:181`, glifos `home`, `grid`, `paw`, `cash`, `settings`, todos rellenos) y `CatalogoScreen.js` (`create-outline`, `trash-outline`, `add`, color literal `#FFFFFF`).
- Todo lo demás es emoji de texto (188 líneas con emoji en 30 pantallas): 🐔 🥚 💾 💰 🩺 🌿 🌳 📸 ⚫ ⚰ 🏠 🍚 💧 🧼 📖 ✏️ 🗑️ 📤 🔔 👥 📊 ⚙️ 🚪 ✅ ＋ (signo ancho de ancho completo). Renderizan distinto según el fabricante de Android y no heredan color.
- Los textos de varios botones incluyen el emoji (flujos Maestro con regex `.*Nueva ave.*` toleran el prefijo; textos exactos como "Ver ave" no llevan emoji).

## 6. Paleta actual (valores reales)

`src/config/constants.js:1-27` (`COLORS`): `primary #3d8b8b`, `background #f5fafb`, `card #ffffff`, `success #52b788`, `danger #d9534f`, `warning #f4d35e`, `orange #f4a261`, `info #4ea8de`, `text #234` (= `#223344`), `textSecondary #666`, `border #d9e2e5`, `white #ffffff`.
Estados sanitarios de jaula (`constants.js:49-130`): Normal success, Limpieza info, Fumigación warning (texto oscuro), Quemadura orange, Cuarentena danger.

Literales fuera del tema (152 en 28 pantallas + 36 en 15 componentes; 441 usos de `COLORS.*`): `#e8eeee` (fondo de chips, ~12), `#e7f5f5` (tinte de selección, ~12), `#fff`/`#FFFFFF` (texto sobre botones, ~35), `#8ec9b8`, `#fde9e7`, `#59636a`, `#6c757d`, `#eceff1`, `#d7efea`, `#f8fafa`; Finanzas `#2a9d8f` (ingreso) y `#d9534f` (egreso) más `#e1f3ef`, `#347d70`; Ciclo de vida 26 literales (`#8acb78`, `#58c7b4`, `#8e7cc3`, `#5b8def`, `#e76f51`, `#e9c46a`, `#2a9d8f`...); Genealogía 20 (morado `#6d45a2`, `#9b72cf`, `#4d2d73`, ámbar `#e4b84c`, verdes `#4f7f69`); Detalle ave `#fff0b3`, `#5c4a00`, `#5b8f72`.

Contraste (calculado): blanco sobre `primary #3d8b8b` = 4,0:1 (no llega a 4,5:1 para texto normal); blanco sobre `success #52b788` = 2,5:1 (falla); `textSecondary #666` sobre `background` = 5,4:1 (correcto).

## 7. Tipografía y espaciado

Fuente del sistema (`fontFamily` no se usa en ningún archivo de `src/`). Escala observada: títulos de pantalla 24-28 px bold (Header 28, Inicio 24, MasMenu y formularios 25-26, acceso 26), subtítulo 15-16 px, secciones 18-20, etiquetas 15, cuerpo 14-16, pie 11-12; valores grandes 26 (MetricCard) a 42 (AvesScreen:801). Relleno de pantalla 16-20; radios 12 (inputs), 14 (botones/tarjetas de acceso), 16 (Card). Cabeceras nativas: color de acción `primary`, título en el estilo por defecto del sistema (negrita solo en Jaulas y Finanzas).

## 8. Pruebas Maestro (`pruebas/movil/flujos/`)

- 22 flujos en `completo/`, uno `smoke/` y `lib/` (abrir-app, entrar, iniciar-sesion).
- Tocan la barra inferior **por coordenadas**: `30%,96%` (Jaulas), `50%,96%` (Aves), `90%,96%` (Más). Cambiar el número, el orden o la altura de las pestañas los rompe.
- Buscan por texto visible con regex (`".*Nueva ave.*"`, `".*Guardar ave.*"`), por texto exacto ("Ver ave", "Padre") y por placeholder ("Ej. K001"). No hay `testID` en `src/` (0 coincidencias).
