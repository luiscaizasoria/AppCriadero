# Spec: <módulo>

> **Regla de paridad con V1.** V2 empieza sin datos de usuario, solo con catálogos. La V1 está probada y es el contrato: V2 reproduce exactamente lo que hace V1. Todo lo que V2 haga distinto es una **diferencia deliberada**: debe registrarse en la sección "Diferencias deliberadas" y estar aprobada por el usuario. Diferencias ya aceptadas: V2 requiere conexión y las pantallas necesitan estados de carga y de error de red.

## Estado

<!-- Uno solo: borrador | revisada | implementada -->
borrador

## Fuente V1

<!-- Archivos reales de V1 de los que sale esta spec: pantallas (src/screens/…), repositorios (src/repositories/…), esquema (src/database/…). Citar archivo y función. -->

## Comportamiento en V1

<!-- Qué hace hoy la app: campos y obligatoriedad, validaciones, estados y transiciones, efectos secundarios (historial, finanzas, estados de otras entidades), generación de códigos. Solo lo confirmado en el código, con archivo:línea. -->

## Contrato del repositorio V1

<!-- Por cada método público del repositorio V1: firma (parámetros exactos), forma exacta del objeto devuelto (nombres de campos y tipos tal como salen de SQLite), errores lanzados (texto exacto del Error) y cómo lo consumen las pantallas (qué campos usan, cómo capturan el error). Evidencia archivo:línea. -->

## Validaciones en pantalla

<!-- Reglas que viven solo en la UI (no en el repositorio), con el mensaje exacto, para que el backend también las aplique. Formato: regla | mensaje exacto | archivo:línea | código de error V2 propuesto. -->

## Paridad con V1

<!-- Casos de prueba que reproducen cada comportamiento de V1. Formato: id | dado (estado inicial) | cuando (operación) | entonces (resultado, efectos en tablas, error) | evidencia V1. -->

## Diferencias deliberadas

<!-- Lo que V2 hará distinto de V1. Cada una con motivo y estado de aprobación (propuesta | aprobada por el usuario). Ya aceptadas: requiere conexión; estados de carga y de error de red. -->

## Endpoints V2

<!-- Método, ruta bajo /api/v1/criaderos/:criaderoId/…, request/response en camelCase, errores con códigos estables, ownership. -->

## Modelo D1

<!-- Tablas y columnas (snake_case): id TEXT UUID v7, criadero_id, created_at, updated_at, deleted_at, version; FK, índices, r2_object_key para archivos. Migración prevista (NNNN_*.sql). -->

## Reglas abiertas

<!-- Dos subsecciones. No inventar.
### Resolubles leyendo código
(las que se cierran con más lectura del código V1; cerrarlas antes de pasar a `revisada`)
### Decisión de producto
(las decide el usuario)
Las reglas cerradas se conservan marcadas "cerrada" con el motivo y la fecha. -->

## Criterios de terminado

<!-- Lista verificable: endpoints implementados, ownership probado, tests unitarios/HTTP/integración, migración aplicada en local, casos de la sección "Paridad con V1" pasando, diferencias deliberadas aprobadas, typecheck sin errores. -->
