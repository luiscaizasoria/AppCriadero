# V2_ROADMAP — Criadero Kikirikis

## Estado actual

La rama `feature/v2-docs` prepara el contexto mínimo de V2. En esta etapa solo se modifican documentos. V1.0.3 sigue siendo la referencia funcional; la aplicación debe continuar funcionando localmente durante la evolución a V2.

## Orden de trabajo

### 0. Preparación documental — en curso

- Crear `V1_BASELINE.md`, `V2_ARCHITECTURA.md` y este roadmap.
- Actualizar el `AGENTS.md` de la raíz para que apunte a esos documentos.
- Revisar el cambio documental antes de integrarlo en `v2`.

### 1. Base del backend

- Crear el proyecto TypeScript con Cloudflare Workers y Hono.
- Preparar D1, R2, migraciones, ambientes DEV/QA/PROD y validaciones con GitHub Actions.
- Definir el contrato inicial OpenAPI bajo `/api/v1`.
- Verificar que cada ambiente usa sus propios datos y secretos.

### 2. Identidad y criaderos

- Implementar usuarios, autenticación, access token y refresh token.
- Definir roles y permisos y aplicarlos en la API.
- Modelar criaderos y la pertenencia de usuarios a ellos.
- Documentar y probar la política de expiración, rotación y revocación de tokens.

### 3. Datos de negocio, módulo por módulo

Implementar y validar en este orden:

1. Catálogos.
2. Jaulas.
3. Aves.
4. Imágenes y archivos.
5. Salud y tratamientos.
6. Alimentación, bebida y sanidad.
7. Huevos.
8. Finanzas.

Para cada módulo: revisar primero el comportamiento de V1, definir el esquema y el contrato de API, implementar permisos, y comprobar que los datos existentes pueden conservarse.

### 4. Sincronización offline

- Definir identificadores, registro de cambios, reintentos y resolución de conflictos.
- Incorporar la sincronización gradualmente sin impedir el uso local.
- Probar pérdida de conexión, reconexión, cambios concurrentes y migración de instalaciones V1.
- No declarar completada esta etapa solo porque la API responda correctamente.

### 5. Funciones posteriores

- Adaptar clientes, producción, alertas, reportes y exportación al modelo central.
- Evaluar notificaciones push y mejoras de sincronización según la necesidad real.
- Mantener separadas las funciones ya existentes en V1 de las nuevas funciones remotas.

## Regla para avanzar

Trabajar en cambios pequeños desde `v2`. Antes de iniciar cada etapa, confirmar el alcance y las dependencias de la anterior. No modificar código funcional durante la etapa 0.

## Referencias

- `documents/V1_BASELINE.md`: comportamiento existente.
- `documents/V2_ARCHITECTURA.md`: decisiones técnicas.
- `documents/archive/`: detalle histórico para consultas puntuales.
