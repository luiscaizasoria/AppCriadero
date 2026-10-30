# Spec: <módulo>

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz (mismos nombres de función, mismo objeto devuelto, mismos errores). Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red).

## Estado

<!-- Uno solo: borrador | revisada | implementada -->
borrador

## Fuente V1

<!-- Archivos reales de V1 de los que sale esta spec: repositorios (src/repositories/…), pantallas que los consumen (src/screens/…), esquema (src/database/…). Citar archivo:línea. -->

## Contrato del repositorio

<!-- Por cada función pública del repositorio V1: firma exacta, forma exacta del objeto devuelto (campos tal como salen de SQLite), errores lanzados con el texto exacto y cómo los consumen las pantallas (mensaje que muestran). Evidencia archivo:línea. -->

## Endpoints V2

<!-- Un endpoint por función del repositorio, bajo /api/v1/criaderos/:criaderoId/… Método, ruta, request/response en camelCase y errores con los mismos códigos y mensajes que V1. Ownership por criadero. -->

## Tabla D1

<!-- Tablas y columnas (snake_case) equivalentes a las de V1, con las columnas técnicas: id TEXT UUID v7, criadero_id, created_at, updated_at y deleted_at donde V1 desactiva o da de baja; r2_object_key para archivos. FK e índices. Migración prevista (NNNN_*.sql). Sin CHECK ni límites que V1 no tenga. -->

## Excepciones técnicas por pasar a online

<!-- Solo lo que exige el paso a online: UUID v7 en lugar de INTEGER AUTOINCREMENT, criadero_id, R2 en lugar de foto_uri local, autenticación, estados de carga y de error de red. Cada una con su motivo. Nada más. -->

## Casos de paridad

<!-- Casos de prueba que reproducen cada comportamiento de V1. Formato: id | dado (estado inicial) | cuando (operación) | entonces (resultado, efectos en tablas, error y mensaje) | evidencia V1 archivo:línea. -->
