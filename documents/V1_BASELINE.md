# V1_BASELINE — Criadero Kikirikis

## Punto de partida

La versión v1.0.3 es el cierre de V1 y el punto de partida de la rama v2. V1 es una aplicación Android hecha con React Native, Expo y JavaScript. Guarda los datos en SQLite local y funciona sin conexión permanente.

Este documento resume los documentos históricos de `documents/archive/`. Antes de modificar una función, comprobar su comportamiento en el código real; si hay diferencias, el código tiene prioridad.

## Funciones existentes que se deben preservar

- Gestión de jaulas y aves, incluida su relación e historial.
- Alimentación, bebida, sanidad, salud y tratamientos.
- Evolución física, genealogía, huevos y bajas o ventas de aves.
- Finanzas y catálogos parametrizables.
- Clientes, análisis de producción, alertas dentro de la aplicación, reportes y exportación de datos.
- Fotografías guardadas como archivos; SQLite conserva sus referencias.
- Respaldo y restauración de datos e imágenes.
- Navegación principal por Inicio, Jaulas, Aves, Finanzas y Más.

## Persistencia y compatibilidad

- La base local usa `expo-sqlite` y tiene migraciones hasta V7.
- No modificar migraciones históricas ya aplicadas. Los cambios de esquema deben usar una migración nueva.
- Proteger los datos de instalaciones existentes y mantener la compatibilidad de respaldos cuando sea posible.
- Una referencia de imagen en SQLite no garantiza que el archivo físico exista.
- Después de restaurar imágenes, un respaldo posterior debe incluirlas junto con las imágenes nuevas.

## Alcance aún no implementado en V1

La documentación histórica identifica como trabajo de V2 la autenticación, la API REST, los datos centrales, el almacenamiento remoto de imágenes y la sincronización offline. Las alertas actuales son internas; no equivalen a notificaciones push. La exportación existente no acredita formatos estándar como CSV, Excel o PDF.

## Validación

Los documentos históricos describen funciones implementadas, pero también señalan pruebas funcionales y de compilación Android pendientes. No interpretar esta lista como prueba de que todos los escenarios se hayan validado. Revisar especialmente instalación limpia, migración desde una versión anterior y restauración con imágenes antes de cambiar esas áreas.

## Referencias históricas

- `documents/archive/CONTEXTO_PROYECTO_CRIADERO_KIKIRIKIS.md`
- `documents/archive/Estado Actual Criadero kikiriki v1.md`

Consultar estos archivos cuando haga falta un detalle que no esté en este resumen.
