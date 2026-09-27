# V2_ARCHITECTURA — Criadero Kikirikis

## Objetivo

Evolucionar V1 hacia una aplicación conectada y multiusuario sin perder su capacidad de trabajar sin conexión ni los datos existentes. Este documento fija las decisiones técnicas de V2. Los detalles de implementación se definirán por etapas.

## Decisiones técnicas

- Aplicación móvil: React Native + Expo.
- Persistencia en el dispositivo: SQLite. La experiencia seguirá el principio offline-first.
- Backend: TypeScript sobre Cloudflare Workers, con Hono para la API HTTP.
- Datos centrales: Cloudflare D1, con migraciones versionadas.
- Imágenes y archivos: Cloudflare R2. D1 almacenará metadatos y referencias, no archivos como BLOB.
- Comunicación: API REST con JSON sobre HTTPS, bajo la ruta versionada `/api/v1`.
- Contrato de API: OpenAPI.
- Identidad y seguridad: autenticación con JWT, access token y refresh token; autorización mediante roles y permisos.
- Repositorio y automatización: GitHub y GitHub Actions para validaciones y despliegues.
- Ambientes separados: DEV, QA y PROD.
- Costos: comenzar con los recursos Free Tier disponibles y revisar sus límites antes de cada despliegue.
- No utilizar .NET ni ASP.NET Core para el backend.

## Reglas de diseño

- Mantener separadas la interfaz móvil, la lógica de API y la persistencia.
- La API debe comprobar permisos en cada operación protegida; validar un JWT por sí solo no basta.
- No guardar contraseñas en texto plano ni secretos en Git.
- Distinguir los archivos públicos de los privados; no asumir que todo objeto de R2 es público.
- Preservar la base SQLite existente y sus migraciones. La incorporación de la API y de la sincronización será gradual.
- Definir explícitamente, antes de implementar la sincronización, cómo se identifican registros, cómo se detectan cambios y cómo se resuelven conflictos. Este documento no presupone todavía esas reglas.
- Mantener una vía de actualización para instalaciones V1 y respaldos existentes.

## Alcance pendiente de diseño detallado

El esquema de D1, los endpoints concretos, la política de tokens, los permisos específicos, el mecanismo de subida de archivos y el protocolo de sincronización se decidirán en sus respectivas etapas. Esas decisiones deben respetar el stack y las reglas anteriores.

## Referencia histórica

`documents/archive/Contexto_Arquitectura_V2_Online_Criadero_Kikirikis.md` contiene el razonamiento y ejemplos de la propuesta original. Consultarlo cuando se necesite ampliar este resumen.
