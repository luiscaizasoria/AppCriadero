# Validación del Bloque A (navegación y orientación)

Fecha: 2026-11-09. Validador de UX. Revisión por lectura del código y de `git diff` (sin emulador ni teléfono). Cambios sin commit.

**Veredicto: APROBADO**, con observaciones no bloqueantes (sección final). Los flujos Maestro del bloque no se han ejecutado: queda `/probar smoke` y, al cerrar la fase, `/probar completo`.

## 1. No regresión funcional

- `git diff --stat` sobre `src/api`, `src/repositories`, `api/`, migraciones, `package.json`, `app.json` y `App.js`: sin cambios. Los archivos tocados son `src/navigation/*`, `src/components/PantallaHeader.js`, 6 pantallas y documentación.
- Hunks de pantallas (todos de navegación o de publicar texto para las migas):
  - `InicioScreen.js:780-830` y `AlertasScreen.js:574-640`: solo cambia el destino (`navigate('Aves',{screen,params})` pasa a `navigate('DetalleAve'|'BebidaJaula'|'AlimentacionJaula'|'DetalleJaula',{aveId|jaulaId})`); mismos parámetros y mismas condiciones por `accionDestino`.
  - `DetalleAveScreen.js:27-92`, `DetalleJaulaScreen.js:41-67`, `DetalleJaulaInactivaScreen.js:33-49`: añaden `useContextoPantalla(route.key, codigo)`; no tocan carga, repositorios ni validaciones.
  - `GenealogiaAveScreen.js:512,982`: `push` pasa a `navigate` (los mismos parámetros).
- Rama con `Alert` «No fue posible abrir el detalle del ave.» (`DetalleJaulaScreen.js:208-216`, `DetalleJaulaInactivaScreen.js:100-108`): era una guarda de navegación (fallaba solo si `navigation.getParent()` era nulo), no un error de datos ni una validación. Ahora `DetalleAve` está registrada en la misma pila (`pantallasCompartidas.js:32`), así que la condición ya no existe. Justificada; es lógica de navegación.
- Observación de limpieza: `Alert` queda importado y sin uso en `DetalleJaulaInactivaScreen.js` (1 sola aparición).

## 2. Los 11 casos de `diagnostico-navegacion.md`

| # | Causa | Estado | Evidencia |
|---|---|---|---|
| 1, 2, 3 | `tabPress` con `preventDefault` + `navigate` a la lista apilaba copias | Resuelto | `AppNavigator.js`: listener y `crearListenerRutaInicial` eliminados (diff -37 líneas); `native-stack` hace `popToTop` al tocar la pestaña activa y `BottomTabBar` restaura al volver |
| 4 | Ficha de jaula > ave saltaba a Aves | Resuelto | `DetalleJaulaScreen.js:212`, `DetalleJaulaInactivaScreen.js:103`: `navigate('DetalleAve')` en su pila; `JaulasStackNavigator.js:36` registra `pantallasAve` |
| 5, 6 | Inicio > alerta saltaba a otra pestaña | Resuelto | `InicioScreen.js:780-830`; `InicioStackNavigator.js` (nueva pila con fichas y pantallas de jaula); `goBack` de Alimentación/Bebida vuelve a Inicio |
| 7 | Alertas (Más) saltaba a Aves/Jaulas | Resuelto | `AlertasScreen.js:574-640`; `MasStackNavigator.js:127-129` registra los grupos de ave y jaula |
| 8 | Genealogía apilaba fichas sin límite | Parcial | `navigate` + `getId` (`pantallasCompartidas.js:32,39,48,49`, `StackRouter.tsx:379-384,445-446`): no se repite la ficha de la MISMA ave; con aves distintas la pila sigue creciendo (Lista, Ficha A, Gen A, Ficha B, Gen B, ...) pero cada tramo lleva miga tocable. Ver observación 3 |
| 9 | Baja desde Inicio terminaba en Aves | Mejorado | `BajaAveScreen.js:266` `popToTop()` (sin cambios) ahora vuelve a la raíz de la pestaña de origen. Desde Alertas termina en el menú Más, no en Alertas |
| 10 | Atrás desde pestaña iba a Inicio | Resuelto | `AppNavigator.js:50` `backBehavior="history"` |
| 11 | La segunda ficha sustituía a la primera | Resuelto | pilas separadas por pestaña y `getId` por `aveId`/`jaulaId` (`opcionesPila.js:15-23`) |

Causas auxiliares: títulos técnicos sustituidos por `titulos.js:3-40`; `App.js:113` (barra de Android oculta) no se toca.

## 3. Orientación

- Todas las pantallas de las cinco pilas, salvo la raíz de cada una, usan `CabeceraPila` (`opcionesPila.js:6-10`): flecha, migas tocables y título en español (`titulos.js`). Probado por código: la primera miga es la sección (pestaña) y vuelve a la raíz (`CabeceraPila.js:20-25`); `pop(indice - i)` vuelve a esa pantalla exacta.
- Sin cabecera con el patrón (por diseño, para B y C): las 5 raíces (`InicioPrincipal`, `ListaJaulas`, `ListaAves`, `FinanzasInicio`, `MasMenu`) con título propio en el cuerpo en formatos distintos ("Más" en `MasMenuScreen.js:126-128`, "💰 Finanzas"...), y las pantallas de acceso (Login, Registro, selección de criadero; Bloque B). Faltantes del patrón: ninguna pantalla de pila queda sin título.
- Coincidencia título / tarjeta o botón: coincide en Configuración, Producción de huevos, Clientes, Reportes, Alertas, Evolución, Salud, Ciclo de vida, Genealogía, Dar de baja, Alimentación, Bebida, Sanidad, Historial, Nueva ave, Nueva jaula, Nuevo movimiento. No coincide (menor): «Registro de huevo» frente al botón «Registrar huevo» (elegido a propósito por el flujo 70), «Agregar ave» frente a «＋ Agregar» (`DetalleJaulaScreen.js:1100`), «Elemento» frente a «Nuevo elemento», «Ficha del ave» frente a la tarjeta (código del ave; correcto), «Historial de jaula» frente a la tarjeta de jaula inactiva.

## 4. Pestañas

Cinco pestañas en el mismo orden (Inicio, Jaulas, Aves, Finanzas, Más; `AppNavigator.js:177-233`), `tabBarStyle` con altura 64, paddings y fuente intactos (el diff no toca esas líneas). Coordenadas Maestro 30% / 50% / 70% / 90% y 96% de alto: sin cambio. Cambio funcional esperado: Inicio pasa de pantalla a pila (`InicioStackNavigator.js`) con raíz sin cabecera.

## 5. Toques (3 tareas recontadas por el código)

| Tarea | Resultado del recuento |
|---|---|
| Aves > ave > Finanzas > Aves | 4 toques; la ficha sigue abierta (sin listener, restaura la pila). Coincide con `toques-despues-bloque-a.md` |
| Jaulas > jaula > ave y volver | 3 toques de ida; volver = 1 (flecha, miga o atrás), porque `DetalleAve` está en la pila de Jaulas (`DetalleJaulaScreen.js:212`). Coincide |
| Inicio > alerta > volver / alimentar desde alerta | 1 + 1; alimentar = alerta, opción, Guardar, Aceptar = 4 y `goBack` (`AlimentacionJaulaScreen.js:121`) cae en Inicio. Coincide |

Corrección a la tabla: «Genealogía A > B > C ... sin copias repetidas» solo vale para la misma ave (ver observación 3).

## 6. Coincidencias dobles en Maestro (migas y títulos)

- Las migas llevan `accessibilityLabel="Ir a X"` (`PantallaHeader.js:21`) y la flecha «Volver» (`:37`). Los flujos no usan regex del tipo `.*Aves.*`, `.*Jaulas.*`, `.*Más.*` o `.*Volver.*` (grep): sin choque. Los `tapOn: "Jaulas"` / `"Más"` exactos ocurren desde Inicio, sin migas.
- Choque real encontrado y corregido: `42-aves-editar.yaml` hacía `tapOn: "AV-M"` en el formulario de edición; la miga con el código del ave (`DetalleAveScreen.js:88`) es ahora `AV-M` exacto y se tocaría en lugar del campo (volvería a la ficha). Pasa a `below: 'Código *'`.
- Títulos nuevos que repiten botones de la lista (Nueva ave, Nueva jaula, Nuevo movimiento): los flujos solo los tocan en la lista, antes de abrir la pantalla; sin choque. «Registro de huevo» no suma una tercera coincidencia a `70-huevo`.

## Observaciones (no bloquean)

1. Doc: `inventario-cambios.md:44-45` («Cambios previstos») aún dice que «la ficha lee `desdeGenealogia`», pero la fila de `GenealogiaAveScreen` indica que no. Alinear.
2. Limpieza: quitar el import `Alert` sin uso en `DetalleJaulaInactivaScreen.js`.
3. Genealogía: con `getId`, navegar al nodo central (la misma ave) trae la ficha existente al frente (`StackRouter.tsx:445-446`), por lo que el orden de la pila cambia (Lista, Gen A, Ficha A); «atrás» sigue siendo coherente pero no deshace en orden exacto. Matizar la frase «sin copias repetidas» de la tabla de toques.
4. Baja desde Alertas: `popToTop` deja en el menú Más, no en Alertas (decisión de lógica, no se toca).
5. Titles menores sin coincidencia con el botón (sección 3): resolver en el Bloque C.
6. DUDA PARA EL USUARIO: ¿«Registro de huevo» debe pasar a «Registrar huevo» (alineado con el botón) aceptando actualizar `70-huevo`?

## Flujos Maestro (parte 2)

Cambiados: `completo/42-aves-editar.yaml` (campo código por etiqueta), `completo/94-inicio.yaml` (scrollUntilVisible antes de «Sin producción registrada»; era la REGRESION del 2026-11-07, `261`), `completo/99-alertas.yaml` (back vuelve a Alertas, no a Inicio; se comprueba que no se salta de pestaña).
Revisados sin cambio (texto y recorrido siguen valiendo): `40`, `41`, `90`, `96`, `97`, `98` (el `back` o la pestaña Más se usan en la raíz o tocan la pestaña activa: `popToTop`).
Nuevos: `82-nav-aves-salud-atras`, `83-nav-jaulas-cuidados-atras`, `84-nav-finanzas-nuevo-atras`, `85-nav-pestanas-regreso`, `86-nav-inicio-alertas-atras`. Usan por primera vez selectores `id:` (`cabecera-atras`, `cabecera-miga-1`): confirmar en el primer `/probar smoke`/`completo` que Expo Go expone el `testID` como `resource-id`; si no, sustituirlos por el texto «Volver» (etiqueta de accesibilidad).
