# Validación del sub-bloque C6 (Finanzas, Clientes, Reportes, Configuración, Catálogos y Más)

Fecha: 2026-11-10. Validador de UX. Comparación contra `HEAD` con `git diff --ignore-cr-at-eol` (los diffs normales salen enormes por CRLF). Sin emulador.

## Veredicto: APROBADO (con 4 observaciones no bloqueantes y 4 dudas para el usuario)

## 1. No regresión funcional
- `git diff --stat` sobre `src/api`, `src/repositories`, `api/`, `package.json`, `package-lock.json` y migraciones: vacío. Solo cambian pantallas, 3 componentes nuevos/reescritos (`AlertBadge`, `MasFila`, `OpcionPildora`) y la sección C6 del inventario. `Card`, `Header`, `SectionTitle`, `StatusBadge`, `RankingCard` y `SelectorCatalogo` no se tocan.
- `FinanzasScreen`: mismas 4 llamadas en `Promise.all` (`FinanzasScreen.js:162-176`: resumen por periodo, movimientos, consolidado por periodo, mensual 12), mismos filtros (`:242-264`), mismos cálculos (`Number(x||0).toFixed(2)`, balance mensual, `Math.abs`), mismo destino (`EditarMovimientoFinanciero {movimientoId}` `:834`, `NuevoMovimientoFinanciero` `:1150`). Se conservan resumen, consolidado por categoría (ingresos/egresos), mensual, filtros y lista. Solo se añade `errorCarga`.
- `NuevoMovimientoFinancieroScreen` y `EditarMovimientoFinancieroScreen`: el diff de la lógica solo cambia `Alert` de éxito por `mostrarAviso` (mismo título, mensaje y `goBack`); validaciones, `Alert` de error y de «Valor inválido`, datos enviados y `keyboardType` intactos. Nuevo: `console.error` sin Alert nuevo en Nuevo movimiento (catch intacto).
- `ReportesScreen`: `cargar` y `ejecutarExportacion` intactos (el diff solo cambia `ó` por `ó`, mismo carácter); 6 exportaciones con mismos `obtener*` y `nombre`; las secciones Aves, Salud, Producción, Finanzas y Exportaciones se conservan con los mismos textos de datos (`Activas: N`, `Ingresos: $0.00`...). `disabled={!!exportando}` pasa a `if(!exportando)` (equivalente).
- `ClientesScreen`, `DetalleClienteScreen`: mismo `obtener*`, mismas métricas (`Compras`, `Total aves`, `Envíos`), `testID cliente-compras` conservado. El texto de error de Clientes sigue siendo el fijo «No fue posible cargar los clientes.».
- `ConfiguracionScreen`: mismos 6 catálogos y códigos; solo el título pierde el emoji. `BackupScreen`: solo JSX y estilos (`Boton atenuado={procesando}` equivale a `disabled`); lógica y Alert intactos.
- Ningún `error.message` crudo en las 11 pantallas (grep vacío). Ningún emoji en las 11 pantallas ni en los 3 componentes (grep; solo uno en un comentario de `AlertBadge.js:7`).

## 2. Alta rápida de catálogos
`CatalogoScreen.js:285-375` vs `EditarCatalogoItemScreen.js:85-198`: mismo repositorio (`crearItemCatalogo`), mismo código derivado (`trim().toUpperCase().replace(/\s+/g,'_')`), descripción `''`, «Nombre requerido»/«Ingrese un nombre.», «No fue posible guardar el elemento.»; catálogo nulo bloquea campo y botón (`:461,:480`). Doble toque: `Boton atenuado={anadiendo}` bloquea el botón, pero `onSubmitEditing={altaRapida}` (`:464`) no consulta `anadiendo` (observación 1). Un nombre repetido da el mismo error genérico que V1.

## 3. Modo API / SQLite
- «Respaldo» solo con `!USAR_API` (`MasMenuScreen.js:198-213`); en V1 se mostraba siempre (cambio aprobado por el usuario, ver duda 1). «Cerrar sesión» solo con `USAR_API` (`:237-250`). Orden igual al de V1 (Config, Huevos, Clientes, Reportes, Respaldo, Alertas, Cerrar sesión).
- `AlertBadge.js:15-25`: píldora con campana + Text `N`, `testID alertas-insignia-texto`, `accessibilityLabel` «N alertas pendientes»; se oculta con `cantidad<=0` como antes.

## 4. Avisos y estados
Avisos solo donde había `Alert` de ÉXITO (Guardado, Movimiento guardado/actualizado, Venta corregida), mismo texto y destino. Los `Alert` de error, confirmación y validación se conservan. Estados de carga/error/vacío con «Reintentar» en Finanzas, Reportes, Catálogo, DetalleCliente y EditarMovimiento (antes: ceros, lista vacía o «no encontrado»): a confirmar (duda 2).

## 5. Consistencia
- Contraste (recalculados): blanco/`success` 5,03; blanco/`danger` 6,17; `textSecondary`/blanco 7,2; resto de pares del inventario coherentes con `theme/colors.js`.
- Táctil: píldoras 44 (`OpcionPildora`), Editar/Eliminar `minHeight 44` (`CatalogoScreen.js:792`), filtros y periodos `touchMin` (`FinanzasScreen.js:1435,1672,1746`), exportaciones 112.
- Degradados: Finanzas 2 (fondo + cabecera); el resto, 1. Icono + texto en gráficos de barras y chips (no solo color); un solo set Ionicons.
- Accesibilidad: `accessibilityRole radio/radiogroup/tab`, etiquetas en campos, `maxFontSizeMultiplier` en cifras grandes.

## 6. Observaciones (no bloquean)
1. Alta rápida: `onSubmitEditing` sin guarda de `anadiendo` (podría duplicar con doble Enter); un fallo de `cargar()` tras crear mostraría el estado de error aunque el ítem exista.
2. Orientación: `titulos.js:27,31` da «Movimiento financiero» y «Elemento» como cabecera, mientras la tarjeta/botón que abre dice «Ver / corregir», «Nuevo elemento» o «Editar», y el cuerpo «Editar movimiento»/«Corregir venta»/«Editar elemento». No coinciden con el origen.
3. El inventario dice que `BackupScreen` «NO se toca» (línea 320) y luego que se restiló (línea 359): unificar.
4. El aviso dura 1,8 s: en los flujos hay que esperar `notVisible` del aviso antes de seguir (el texto del formulario, p. ej. «Ingreso manual uno», sigue visible mientras tanto).

## DUDAS PARA EL USUARIO
1. «Respaldo» oculto en modo API: ¿confirmado que en la nube no debe verse (V1 lo mostraba siempre)?
2. Estados de error con mensaje humano y «Reintentar» en Finanzas y Nuevo movimiento: antes se decidió «sin aviso de red» en esas dos pantallas; ¿se mantiene la nueva decisión?
3. Textos nuevos pendientes de aprobar: «Alta rápida», «Escribe un nombre», «Añadir», «Cargando elementos...», «Aún no hay movimientos», «Sin movimientos de este tipo», «No fue posible cargar…» (5), «Reintentar».
4. ¿Alinear las cabeceras («Movimiento financiero», «Elemento») con el texto de la tarjeta que las abre?

## Flujos Maestro actualizados (`pruebas/movil/flujos/completo/`)
- `99-alertas.yaml:28-32`: `.*🔔 3.*` pasa a `{id: alertas-insignia-texto, text: "3"}`.
- `20-catalogos.yaml:33-39`: se quita `tapOn "Aceptar"`; espera `notVisible "Guardado"` y luego `visible "Alta rápida"`.
- `95-finanzas-movimientos.yaml:45,68,128` (ahora ~45-50, 72-77, 131-136): se quita `tapOn "Aceptar"` y se espera `notVisible` del aviso (necesario antes de esperar «Ingreso/Egreso manual uno», que sigue visible en el formulario).
- `96-finanzas-correccion-venta.yaml:117-120`: se quita `tapOn "Aceptar"` (corrección de venta) y se espera `notVisible "Venta corregida"`. Solo mi línea; las de C5 (`Proceso completado`) no se tocaron.
- Sin cambio (revisados): `97-reportes`, `98-clientes` (`cliente-compras`, «Compras realizadas», «Cliente no encontrado.»), `84`, `86`, `94`, `10`, `smoke`, `30`, `40`, `42`. `97:111` conserva `OK|Aceptar` (Alert de error intacto). Ninguno desactivado; ninguno PENDIENTE. Sin ejecutar: lo lanza el orquestador (`/probar smoke`).
