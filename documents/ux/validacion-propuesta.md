# Validación de la propuesta UX (validador-ux), 2026-11-09

Alcance: solo la propuesta (`propuesta.md`, `plan-bloques.md`, `toques-antes.md`, `diagnostico-navegacion.md`). No hay implementación. Verificación por muestreo contra `src/`.

## Veredicto: CAMBIOS REQUERIDOS (ningún proceso cambiado; la propuesta es aprobable con las correcciones de abajo)

## 1. Diagnóstico de navegación: verificado
- `AppNavigator.js:37-71`: `crearListenerRutaInicial` con `preventDefault` (56) y `navigate(tabName,{screen})` (59-65). Existe.
- Sin `backBehavior` en todo `src/` (grep vacío). Existe.
- `AvesStackNavigator.js:41-74`: `NuevaAve`, `DetalleAve`, `EvolucionAve`, `SaludAve`, `FinalizarTratamiento`, `BajaAve`, `RegistrarHuevo` sin `title` (solo `ListaAves` lleva `headerShown:false`). Existe (7 pantallas; `CicloVidaAve` desde 76 a revisar).
- Atajos cruzados: `InicioScreen.js:781-783` (Aves > DetalleAve), `799/817/835` (Jaulas); `DetalleJaulaScreen.js:216-220` (`tabNavigation.navigate('Aves',{screen:'DetalleAve'})`). Existen.
- `GenealogiaAveScreen.js:517` y `987` envían `desdeGenealogia`; ninguna otra pantalla lo lee. Existe.
- `BajaAveScreen.js:266` `popToTop()`; `NuevaAveScreen.js:1187` `replace`. Existen.
- Casos donde "atrás" NO vuelve al origen (confirmados por código): Inicio/Alertas > ficha de ave; Inicio/Alertas > Alimentación/Bebida/Jaula (tras guardar cae en lista de Jaulas); Detalle de jaula (activa e inactiva) > ave; Genealogía > nodo (cadena de fichas); Baja (popToTop a la lista); tocar pestaña activa/cambiar de pestaña (pila fantasma); atrás del sistema desde raíz va a Inicio. Los 11 casos del diagnóstico son coherentes. El mecanismo interno de `StackRouter` (líneas 385-467) lo cita del código de `node_modules`; no lo reverifiqué (solo muestreo de `src/`).
- No hay un `mapa-navegacion.md` con el grafo; la tabla de la sección Causa 2 lo cubre parcialmente. Pendiente: el diseñador debe producirlo (grafo completo pantalla a pantalla) antes del Bloque A.

## 2. No-regresión funcional: sin cambios en proceso
- `git status`: solo `?? documents/ux/`. `git diff HEAD -- src App.js api` vacío. No se tocó código, repositorios, API ni migraciones. OK.
- Clasificación de propuestas:
  - Solo-UX: quitar `tabPress`, grupos de pantallas por pila, `InicioStack`, migas/cabecera, chip de contexto, tema/iconos/paleta, botón flotante, barra de acciones fija, estados carga/vacío/error con "Reintentar", `returnKeyType`/`autoFocus`, login con pasos "1 de 2/2 de 2", insignia en Más, miga tocable.
  - Roza el proceso (requiere decisión del usuario, ya listadas 2-8 en la propuesta, confirmo): (a) `backBehavior="history"` (comportamiento de navegación nativa); (b) Alert de éxito > aviso no bloqueante: elimina un diálogo bloqueante, actualiza ~24 apariciones en 16 flujos; (c) "Ver ave" directo: hoy único botón (`NuevaAveScreen.js:1175-1196`); (d) alta rápida en catálogos: elimina la pantalla `EditarCatalogoItemScreen` del camino, y debe replicar su validación "Nombre requerido / Ingrese un nombre." (`:71-82`), el `codigo` derivado (`:120-127`, mayúsculas y `_`) y la descripción vacía; (e) ocultar Respaldo en modo API: oculta una función (`BackupScreen`), no solo estilo; (f) guía de 3 pasos en Inicio vacío y "Dar de baja" en sección final; (g) "Atajos de Inicio a Producción/Reportes/Alertas": nueva navegación, no cambia datos; (h) "Salud en dos pasos visuales": cuidar que no cambie la validación (enfermedad obligatoria) ni el orden de campos; (i) Bajas como tarjetas en lugar de chips: solo si conserva el mismo valor/campos.
  - Además, el cambio de `navigate('Aves',{screen:'DetalleAve'})` a `navigate('DetalleAve')` y pantallas duplicadas por pila: toca código de pantallas (permitido en fase UX) pero es zona crítica ("navegación"); exige diff revisado y smoke tras Bloque A.
- Propuesta de ocultar/agregar etiquetas no cambia textos de error de datos. OK.

## 3. Toques ANTES: recuento por muestreo
Recontadas (código real): 3a Jaulas crear = 5 (`JaulasScreen`, `NuevaJaulaScreen.js:48,95-98`) OK; 2a catálogo añadir = 7, `EditarCatalogoItemScreen.js:142-158` Aceptar con goBack OK; 7a huevo = 5 (botón en `DetalleAveScreen.js:954`) OK; 6b/6c = 8 y +3 = 11 coherente; 7b +2 = 7 OK; 9a fallecimiento = 6 (botón "Dar de baja" `DetalleAveScreen.js:1047`) OK; 1a = 4 OK. Sin discrepancias en lo contado.
Inconsistencias en "después":
- 2a: la propuesta dice "3 toques menos" (`propuesta.md:37`), pero la tabla pasa de 7 a 5 (2 menos). Corregir. Realista: Más, Configuración, catálogo, escribir en el campo, Añadir = 5.
- Casi todas las rebajas de "después" dependen solo de quitar "Aceptar" (decisión 3). Si no se aprueba, quedan iguales; la tabla ya lo advierte. 5 y 10c: 7 y 6 ídem. 12: "2 con atajo" y 13: "2" es realista; 4a-4c: 5 asume "aviso", OK.
- 1b y 8a/8b no mejoran: realista. Tarea 6a/6b: "después" no cuenta el scroll hasta "Acciones" (`DetalleAveScreen.js:804-1052`); la barra fija lo elimina pero no es toque. OK.
- Falta mostrar toques de jaula en 3b (Aceptar tras Eliminar) en "después" sin la decisión 3: aceptable.

## 4. Consistencia, accesibilidad y contraste (recalculado)
Relación de contraste con fórmula WCAG (cálculo propio):
- `#3d8b8b` sobre blanco 3,99 (la propuesta dice 4,0: correcto). `#2c6e6e` blanco 5,9 OK. `#52b788` blanco 2,47 (2,5 OK). `#2a7f5a` 4,90 OK sobre blanco; `#c2413d` 5,10; `#2873ab` 5,09; `#2d6a4f` 6,4; `#b3382c` 5,97; `#2e7d4f` 5,05. `textSecondary #5b6770` sobre `#f5fafb` 5,5 OK.
- Fallos o riesgos:
  1. `primary #3d8b8b` se mantiene como "acentos, iconos activos, enlaces": como texto sobre `#f5fafb` da ~3,8:1 (<4,5). Usar `primaryDark` para texto y enlaces; `primary` solo para iconos grandes.
  2. `success` `#2a7f5a` sobre `successSoft #e4f4ec` ≈ 4,3 y `danger #c2413d` sobre `dangerSoft #fde9e7` ≈ 4,4: por debajo de 4,5 en chips de texto pequeño. Oscurecer un paso o usar texto del color más oscuro.
  3. Opción B: sus valores `info #2f6f9f` y demás están marcados "a verificar"; las comprobadas pasan. `warning` y `accent` solo con texto oscuro: bien, pero declarar como regla (no texto blanco ni color sobre ámbar).
  4. "Contraste al sol": solo se mide ratio, no brillo alto; ver nota para prueba en teléfono (el plan lo prevé).
- Tamaño táctil: 48 px propuesto (>=44 pedido) OK. Textos mínimo 12: aceptable, pero 12 en micro con `textSecondary` es el peor caso; preferir 13.
- Accesibilidad: `accessibilityRole/Label`, `testID` y no depender solo del color están previstos; añadir explícitamente "icono + texto en insignias de estado" (ya implícito) y `allowFontScaling` por defecto con pruebas a fuente grande (prevista en el Bloque C).
- Un solo set de iconos: A es coherente (Ionicons ya instalado, `package.json`). B suma ~1,3 MB: decisión del usuario.

## 5. Riesgos para los flujos Maestro (confirmados)
- "Aceptar" 24 coincidencias en 16 flujos (smoke, 20, 30, 40(Ver ave), 41, 50, 51, 52, 60, 70, 90, 91, 95, 96, 97, 98); el plan dice 23 en 15: actualizar cifra (40 usa "Ver ave", no "Aceptar").
- Flujos 94 y 99 asumen el salto de pestaña (atajos de Inicio/Alertas); se rompen con el Bloque A. El 94 ya está en regresión pendiente: no mezclar.
- Pestañas por coordenadas `30/50/90%,96%`: mantener cinco pestañas y altura de barra; riesgo bajo si el tema no cambia el alto.
- Quitar emojis (Bloque C): los textos con regex tipo `.*Guardar ave.*` no se rompen; revisar los de texto exacto con emoji.
- Migas tocables y títulos nuevos añaden texto repetido ("Salud" en miga y en título): los flujos que buscan "Salud" pueden coincidir dos veces; usar `testID` o ajustar los selectores.
- Flujos nuevos que harían falta (no creados): los 5 de navegación del encargo (Aves > detalle > salud > atrás; Jaulas > detalle > cuidados > atrás; Más > Finanzas > nuevo movimiento > atrás; cambio de pestaña y regreso; Inicio/Alertas > atrás); y, si se aprueba, uno de alta rápida en catálogos y otro de "Ver ave" directo.

## Cambios requeridos (lista corta)
1. Producir `documents/ux/mapa-navegacion.md` con el grafo completo (pantalla, destinos, qué hace "atrás", qué muestra cada pestaña) antes de implementar el Bloque A.
2. Corregir "3 toques menos" a 2 en la alta rápida de catálogos; documentar que replica "Nombre requerido", el `codigo` derivado y la descripción vacía.
3. Cambiar `primary #3d8b8b` para texto/enlaces (usar `primaryDark`) y oscurecer `success`/`danger` sobre sus fondos suaves (>=4,5:1).
4. Corregir la cifra de flujos con "Aceptar" (24 coincidencias, 16 archivos) y añadir riesgo de títulos duplicados (miga + título).
5. Decisión explícita del usuario sobre (a)-(e) de la sección 2 antes de los Bloques A y D; Respaldo no se oculta sin decisión.

DUDA PARA EL USUARIO: ¿A, B o A con iconos de granja; atrás del teléfono a pestaña anterior o a Inicio; aviso no bloqueante en lugar de "Aceptar"; "Ver ave" directo; alta rápida en catálogos; ocultar Respaldo en modo API?
