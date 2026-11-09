# Validación del sub-bloque C3 (Inicio y Alertas), 2026-11-09

Veredicto: **CAMBIOS REQUERIDOS** (ningún proceso cambió; no es RECHAZADO).

## 1. No regresión funcional
- `git diff --stat` solo toca `src/screens`, `src/components`, `src/navigation` y `documents/ux`. Sin cambios en `src/api`, `src/repositories`, `api/`, migraciones ni `package*.json`.
- `InicioScreen.js` (HEAD vs actual): mismas llamadas `obtenerDashboard`, `obtenerTodasLasAlertas`, `obtenerResumenAlertas` en un `Promise.all` (`:186-197`); mismos campos de `data` (`aves.activas/vendidas/fallecidas`, `salud.tratamiento`, `totalRazas`, `avesPorRaza`, `huevos`, `mejorPonedora`, `horaPico`, `promedioHuevos`, `ocupacionJaulas`, `produccionSemana`, `finanzas`, `jaulas`); mismo `console.error('Error dashboard:')` (`:222`); mismos 4 destinos de alerta (`:263-323`).
- `AlertasScreen.js`: mismos filtros, mismas 4 navegaciones (`DetalleAve`, `BebidaJaula`, `AlimentacionJaula`, `DetalleJaula`).
- `obtenerResumenAlertas` duplicado de `AlertasScreen`: nadie lo importaba (grep: solo `BarraPestanas.js:8`, `InicioScreen.js:106` y `MasMenuScreen.js:31`, todos desde `AlertasRepository`). Eliminación segura.
- Estado de error con «Reintentar» (`InicioScreen.js:143-147,227,355-387`; `AlertasScreen.js:156-164,208,327-355`): la carga no cambia (`cargar` es la misma y se reutiliza). Cambia el comportamiento visible ante un fallo de red: V1 dejaba la pantalla en ceros (`estado-actual.md`, «Limitaciones»); ahora muestra `EstadoError` solo si no hay datos. Es un estado de error de red (permitido por la regla), pero contradice lo anotado en `estado-actual.md`: DUDA PARA EL USUARIO: ¿se acepta?

## 2. Incumplimientos y pendientes
- INCUMPLE: subtítulo «Estado general del criadero» sigue en Inicio (`InicioScreen.js:412`) y «Estado y pendientes del criadero» en Alertas (`AlertasScreen.js:381-383`). Debían quitarse. Los flujos ya no dependen de ellos (ver parte 3), así que quitarlos no rompe nada.
- Accesos rápidos (`InicioScreen.js:605-673`): NO hay «Registrar huevo»; solo `NuevaAve` (está en la pila de Inicio, `pantallasCompartidas.js:31`), `Finanzas > NuevoMovimientoFinanciero` y `Más > Alertas`. Textos «Tus aves registradas» (`:503`) y «N alertas por atender» (`:476-478`) correctos.
- CAMBIO REQUERIDO (navegación): el aviso (`:441-449`) y los accesos «Nuevo movimiento» (`:637-645`) y «Alertas» (`:660-668`) saltan a otra pestaña con `initial:false`. `CabeceraPila.js:34` solo dibuja la flecha si `indice > 0`: con la pila de destino sin montar no hay flecha ni migas; con la pila ya visitada la flecha lleva a la raíz de Finanzas o a Más, no a Inicio. «Atrás» del encabezado NO vuelve a Inicio (solo el atrás del teléfono, por el historial de pestañas). Propuesta: mostrar migas/flecha que lleven a Inicio, o aceptarlo explícitamente. No hay flujo de este caso (no inventado; falta decidir el comportamiento esperado).
- Rótulos pendientes de decisión del usuario (no aprobados explícitamente): «Accesos rápidos», «Nueva ave», «Nuevo movimiento», «Alertas» (acceso), «Crítica»/«Advertencia» (chips) y tipo en minúsculas («Salud», «Jaula», «Producción», «Finanzas»; `AlertCard.js:10-15`).
- Menor: `Boton.js:44` no marca `busy` con `atenuado` (el login atenuado se anuncia solo como deshabilitado).

## 3. Verificado sin incidencias
- Contrastes calculados a mano (WCAG): blanco/primario `#6D3BD2` 6,55; blanco/`#C0182B` (Críticas, insignia) 6,17; blanco/`#B45309` (Advertencias) 5,02; blanco/`#C2188F` 5,50; blanco/`#007782` 5,30; blanco/`#CC312A` 5,20; `#9B1220` sobre `#FDE3E6` (chip Crítica) 6,92; `#8A3B00` sobre `#FFEBD6` (chip Advertencia, aviso) 6,70; primaryDark sobre primarySoft (filtro inactivo) ≥9; blanco sobre primario (filtro activo y «Total:») 6,55. Todos ≥4,5. Cifras 30-38 pt grandes. Estados siempre con icono + texto (`ResumenAlertas.js:13-15`, `AlertCard.js:46-51`, `FinanzasBarChart.js:30-32`).
- Táctil: filtros `minHeight:44` (`AlertasScreen.js:807`), acceso rápido 96, acción de alerta 48 (`AlertCard.js:76`), pestañas 54, `Pulsable` impone 44x44.
- Degradados: 2 por pantalla (`FondoPantalla` + `PantallaHeader`; único otro uso: ninguno); pantallas de carga/error: 1.
- Insignia de Más: `BarraPestanas.js:44-56`, solo al enfocar Inicio o Más, máx. 1 vez/10 s, mismo `obtenerResumenAlertas`.
- Login: `Boton.js:34,40` (`atenuado` => `disabled`), texto «Ingresando...»/«Ingresar» y lógica (`LoginScreen.js:57,77,117-119`) sin cambio.
- BarraEstado: `light` sobre cabecera (`InicioScreen.js:402`, `CabeceraPila.js:30`), `dark` en carga/error de Inicio (`:336,365`); solo enfocada (`BarraEstado.js:24`).
- Mascota: `Animated.loop` con `iterations: saltos` (3) y sin saltos si reducir movimiento (`Mascota.js:16-18,36`).

## 4. Flujos Maestro (`pruebas/movil/flujos/completo/`) actualizados
- `94-inicio.yaml`: espera por «Tus aves registradas» (ya no por el subtítulo); aserciones de «2 alertas por atender»/«1 alerta por atender»; «Vendidas», «Fallecidas», «Tratamiento» exactos ANTES de desplazar; `scrollUntilVisible` a «Accesos rápidos» y a «Aves activas: N» (la tarjeta de razas queda ~740 dp abajo); «Mayor postura» con scroll; `$0.00` comprobado antes de bajar a Jaulas; `assertNotVisible` «Registrar huevo».
- `99-alertas.yaml`: espera por «Alertas pendientes» (el subtítulo también está en la tarjeta de Más y no probaba nada); «Tus aves registradas» en lugar del subtítulo de Inicio. `🔔 3` (`:29`) sigue válido (`AlertBadge.js:54`); «Guardar» (`:68`) sigue válido.
- `86-nav-inicio-alertas-atras.yaml`, `84-nav-finanzas-nuevo-atras.yaml`: mismas sustituciones de espera.
- `85-nav-pestanas-regreso.yaml`: `:49` ahora se acompaña de `assertNotVisible: "Accesos rápidos"` (descarta el «Nueva ave» de Inicio); `:60` espera «Tus aves registradas».
- `98-clientes.yaml:129,140`: `text: "2", below: "Compras"` (reduce el falso positivo con la insignia de Más; no lo elimina del todo). Para hacerlo exacto falta un `testID` en el valor de `Metric` (`ClientesScreen.js:527`) y `SummaryMetric` (`DetalleClienteScreen.js:495`), p. ej. `cliente-compras`; lo añade el diseñador. Con la semilla hay 3 alertas, así que hoy la insignia muestra 3, no 2.
- Ningún flujo desactivado ni PENDIENTE. No ejecutados (emulador a cargo del orquestador): validar con `/probar smoke` y el flujo 94 aislado.

## 5. Segunda revisión (tras correcciones del diseñador)
- (1) Subtítulos eliminados: grep sin coincidencias en `InicioScreen.js` ni `AlertasScreen.js`. Solo queda «Estado y pendientes del criadero» en la tarjeta del menú `MasMenuScreen.js:231` (otra pantalla, texto de V1, fuera del alcance de la corrección).
- (2) Navegación: `InicioStackNavigator.js:43-51` registra `Alertas` y `NuevoMovimientoFinanciero`; `InicioScreen.js:440,632,651` navega a ellas dentro de la pila de Inicio. Con la pantalla en índice 1, `CabeceraPila.js:34` dibuja la flecha y la miga 0 es «Inicio» (`:20-23`): atrás y miga vuelven a Inicio. Siguen registradas en Más (`MasStackNavigator.js:122`, Alertas) y Finanzas (`FinanzasStackNavigator.js:38`, Nuevo movimiento); mismos nombres de ruta y títulos (`titulos.js:26,37`). CERRADO el cambio requerido de la primera revisión.
- (3) testID `cliente-compras`: `ClientesScreen.js:532` y `DetalleClienteScreen.js:499`; en la lista se repite por tarjeta.
- (4) `Boton.js`: `busy: cargando || atenuado`. CERRADO.
- (5) `git diff --name-only`: solo `src/components`, `src/navigation`, `src/screens`, flujos y `documents/ux`; sin `src/api`, repositorios, `api/`, migraciones ni `package*.json`. Lógica de Inicio/Alertas: mismas llamadas y navegaciones (`InicioScreen.js:269-318`).
- Flujos cambiados: `98-clientes` (id `cliente-compras` + text "2", lista y detalle), `99-alertas` (comentario; Alertas se abre desde Más, sin cambio de comportamiento), `86-nav-inicio-alertas-atras` (tramo 3 nuevo: Inicio > acceso Alertas > flecha > Inicio; Inicio > acceso Nuevo movimiento > flecha > Inicio). `94`, `84` y `85` ya esperaban «Tus aves registradas». Ningún flujo usa los subtítulos eliminados.
- Riesgo: en la lista de `98` el id se repite; `assertVisible` con id+text pasa si alguna tarjeta muestra «2» (la semilla tiene un cliente). No ejecutados.
- Veredicto: APROBADO (validar con `/probar smoke` y los flujos 86 y 98 aislados).
