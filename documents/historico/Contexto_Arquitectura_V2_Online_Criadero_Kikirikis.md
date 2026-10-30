# Criadero Kikirikis – Arquitectura Propuesta para la V2 Online

## 1. Contexto general

Este documento define la **arquitectura técnica propuesta para la V2 Online de la aplicación Criadero Kikirikis**.

La intención es evolucionar la aplicación hacia una solución moderna, accesible desde Internet y preparada para ser consumida principalmente por una aplicación móvil, aunque la misma plataforma podrá ser utilizada en el futuro por aplicaciones web, paneles administrativos u otros clientes.

La arquitectura busca:

- Mantener un costo inicial muy bajo.
- Aprovechar principalmente los recursos gratuitos de Cloudflare y GitHub.
- Tener una API REST centralizada.
- Manejar autenticación y autorización.
- Almacenar datos de negocio.
- Almacenar imágenes y archivos.
- Trabajar con Git y prácticas DevOps.
- Implementar CI/CD.
- Mantener ambientes separados de DEV, QA y PROD.
- Poder escalar la solución posteriormente sin tener que rediseñar completamente la plataforma.

La solución **NO utilizará .NET ni ASP.NET Core**.

La propuesta será principalmente **Cloudflare-native** y utilizará **TypeScript** para el backend.

---

# 2. Objetivo de la V2 Online

La V2 Online de Criadero Kikirikis deberá disponer de una plataforma backend que permita:

- Exponer servicios mediante una API REST pública.
- Consumir estos servicios desde una aplicación móvil.
- Gestionar usuarios.
- Gestionar autenticación.
- Gestionar autorización mediante roles y permisos.
- Almacenar información transaccional y de configuración.
- Almacenar imágenes y archivos.
- Exponer imágenes de forma eficiente.
- Implementar seguridad mediante JWT.
- Tener versionamiento de API.
- Tener documentación de servicios mediante OpenAPI.
- Trabajar con Git.
- Implementar CI/CD.
- Automatizar validaciones, pruebas, build y despliegues.
- Separar DEV, QA y PROD.
- Aprovechar inicialmente los Free Tier disponibles.
- Permitir crecimiento futuro.

---

# 3. Stack tecnológico propuesto

## Backend

- TypeScript
- Cloudflare Workers
- Hono como framework HTTP/API
- REST API
- JSON
- OpenAPI / Swagger
- JWT para autenticación y autorización

## Base de datos

- Cloudflare D1
- SQL
- Migraciones versionadas junto con el código

## Archivos e imágenes

- Cloudflare R2
- Las imágenes y archivos no deben almacenarse como BLOB dentro de D1.
- D1 almacenará únicamente metadata y referencias/Object Keys de los archivos.

## Infraestructura

- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2
- Cloudflare DNS
- HTTPS/TLS de Cloudflare
- CDN/cache de Cloudflare cuando corresponda
- Posibilidad de incorporar posteriormente:
  - Cloudflare Turnstile
  - WAF
  - Rate limiting
  - Otras capacidades de seguridad de Cloudflare

## DevOps

- Git
- GitHub
- GitHub Actions
- Integración con Cloudflare
- CI/CD
- Pull Requests
- Branches
- DEV
- QA
- PROD

---

# 4. Arquitectura general

```text
                         GITHUB
                           │
                    Git + Pull Requests
                           │
                           ▼
                    GitHub Actions
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
           LINT          TESTS          BUILD
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                        DEPLOY
                           │
                           ▼
                     CLOUDFLARE
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
       WORKERS             D1               R2
      REST API         DATABASE         FILE STORAGE
          │
          │
     ┌────┴─────┐
     │          │
     ▼          ▼
   AUTH      SERVICES
     │
     │      /customers
     │      /products
     │      /orders
     │      /images
     │      /etc.
     │
     └───────────────┐
                     │
                     ▼
                APP MÓVIL
```

---

# 5. Cloudflare Workers

Cloudflare Workers será el backend principal de la V2 Online.

No existirá inicialmente un servidor tradicional, VPS, IIS, Kestrel o ASP.NET.

Los Workers expondrán la API REST.

Ejemplo:

```text
https://api.midominio.com/api/v1/
```

Endpoints de referencia:

```text
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh

GET    /api/v1/users/me

GET    /api/v1/products
GET    /api/v1/products/:id
POST   /api/v1/products
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id

POST   /api/v1/images/upload-url
POST   /api/v1/images/confirm
DELETE /api/v1/images/:id
```

La implementación del backend será realizada en **TypeScript**.

Se propone utilizar **Hono** como framework HTTP para estructurar:

- Routes
- Middleware
- Controllers / Handlers
- Validaciones
- Autenticación
- Autorización
- Manejo de errores
- Versionamiento de API

---

# 6. Organización lógica del backend

No se desea colocar toda la lógica directamente dentro de los endpoints.

Se deberá mantener separación de responsabilidades.

Arquitectura conceptual:

```text
Request
   │
   ▼
Router
   │
   ▼
Middleware
   │
   ├── Authentication
   ├── Authorization
   ├── Validation
   └── Logging
   │
   ▼
Controller / Handler
   │
   ▼
Service
   │
   ▼
Repository
   │
   ├── D1
   └── R2
```

Ejemplo conceptual de estructura:

```text
src/
│
├── routes/
│   ├── auth.routes.ts
│   ├── users.routes.ts
│   ├── products.routes.ts
│   └── images.routes.ts
│
├── controllers/
│
├── services/
│
├── repositories/
│
├── middleware/
│   ├── authentication.ts
│   ├── authorization.ts
│   ├── validation.ts
│   └── error-handler.ts
│
├── models/
│
├── schemas/
│
├── security/
│
├── storage/
│
├── database/
│
└── index.ts
```

Esta estructura es conceptual y puede evolucionar durante el diseño técnico.

---

# 7. Cloudflare D1

D1 será inicialmente la base de datos relacional principal de la aplicación.

Debe almacenar:

- Usuarios
- Roles
- Permisos
- Configuraciones
- Entidades de negocio
- Transacciones
- Referencias a imágenes
- Metadata de archivos
- Información necesaria para la aplicación móvil

Ejemplo:

```text
Users
Roles
UserRoles
Permissions
Products
Orders
OrderItems
Images
Configurations
```

Las imágenes no deben almacenarse directamente en D1.

Ejemplo de metadata:

```text
Images

ImageId
EntityType
EntityId
ObjectKey
ContentType
Size
CreatedAt
CreatedBy
Status
```

Ejemplo de `ObjectKey`:

```text
products/123/cover.webp
```

El archivo físico se encontrará en R2.

---

# 8. Cloudflare R2

R2 será utilizado como Object Storage.

Debe almacenar:

- Imágenes
- Fotografías de usuarios
- Imágenes de productos
- Documentos
- Adjuntos
- Otros archivos requeridos por la aplicación

Ejemplo:

```text
kikirikis-media/

users/
   123/
      profile.webp

products/
   123/
      cover.webp
      thumbnail.webp

documents/
   2026/
      document-001.pdf
```

D1 mantendrá la relación entre las entidades del sistema y los objetos almacenados en R2.

---

# 9. Subida de imágenes

Siempre que sea conveniente, se debe evitar utilizar el Worker como intermediario para transferir archivos grandes.

Flujo preferido:

```text
APP
 │
 │ 1. Solicita autorización para subir
 ▼
API / Worker
 │
 │ 2. Valida usuario/permisos
 │
 │ 3. Genera autorización/URL temporal
 ▼
APP
 │
 │ 4. Upload directo
 ▼
R2
 │
 │ 5. Archivo almacenado
 ▼
APP
 │
 │ 6. Confirma operación
 ▼
API
 │
 │ 7. Guarda metadata
 ▼
D1
```

Endpoint conceptual:

```text
POST /api/v1/images/upload-url
```

Respuesta conceptual:

```json
{
  "imageId": "uuid",
  "uploadUrl": "URL_TEMPORAL",
  "objectKey": "products/123/uuid.webp"
}
```

Posteriormente:

```text
POST /api/v1/images/confirm
```

De esta forma el backend mantiene control sobre la autorización sin convertirse innecesariamente en transportador de todos los bytes del archivo.

---

# 10. Acceso a imágenes

Se podrá utilizar un dominio dedicado:

```text
media.midominio.com
```

Ejemplos:

```text
https://media.midominio.com/products/123/cover.webp
https://media.midominio.com/users/456/profile.webp
```

Dependiendo de la naturaleza de los archivos se deberán distinguir:

- Archivos públicos.
- Archivos privados.
- Archivos que requieran URLs temporales o firmadas.

No se debe asumir que todo objeto almacenado en R2 debe ser públicamente accesible.

---

# 11. Seguridad

La seguridad será una parte transversal de la arquitectura.

Inicialmente se plantea autenticación basada en JWT.

Flujo:

```text
APP
 │
 ▼
POST /api/v1/auth/login
 │
 ▼
Worker
 │
 ├── valida credenciales
 ├── valida estado del usuario
 └── genera tokens
 │
 ▼
APP
```

Las siguientes solicitudes utilizarán:

```text
Authorization: Bearer <JWT>
```

El backend deberá implementar middleware para:

```text
Request
   │
   ▼
Validar JWT
   │
   ▼
Identificar usuario
   │
   ▼
Validar rol/permisos
   │
   ▼
Ejecutar servicio
```

No basta únicamente con comprobar que existe un JWT.

Debe existir autorización para las operaciones que lo requieran.

---

# 12. Access Token y Refresh Token

La arquitectura deberá contemplar:

```text
Access Token
+
Refresh Token
```

El Access Token tendrá una duración relativamente corta.

El Refresh Token permitirá renovar la sesión sin solicitar nuevamente usuario y contraseña.

Ejemplo:

```text
POST /api/v1/auth/login

        ↓

Access Token
Refresh Token

        ↓

Access Token expira

        ↓

POST /api/v1/auth/refresh

        ↓

Nuevo Access Token
```

La estrategia exacta de almacenamiento, rotación, revocación y expiración deberá definirse durante el diseño detallado de seguridad.

---

# 13. Contraseñas y secretos

Nunca se almacenarán contraseñas en texto plano.

Se deberá utilizar un mecanismo criptográfico adecuado para almacenamiento de contraseñas.

Además:

- Secretos JWT no estarán en Git.
- Credenciales no estarán en archivos versionados.
- Tokens de Cloudflare no estarán en código fuente.
- La configuración sensible deberá manejarse mediante Secrets/Variables de ambiente.
- DEV, QA y PROD deberán tener secretos independientes.

---

# 14. API versionada

Desde el comienzo se utilizará:

```text
/api/v1/
```

Ejemplo:

```text
/api/v1/auth
/api/v1/users
/api/v1/products
/api/v1/orders
```

Esto permitirá introducir posteriormente:

```text
/api/v2/
```

sin romper inmediatamente aplicaciones móviles que continúen utilizando V1.

Esto es especialmente importante porque una aplicación móvil instalada en dispositivos no puede actualizarse instantáneamente para todos los usuarios.

---

# 15. OpenAPI / Swagger

La API deberá mantener un contrato documentado mediante OpenAPI.

Debe permitir conocer:

- Endpoints
- Parámetros
- Request
- Response
- Códigos HTTP
- Modelos
- Autenticación
- Errores

Esto permitirá facilitar integraciones futuras y mantener una documentación técnica clara de los servicios.

---

# 16. Ambientes

Se desea mantener separados:

```text
DEV
QA
PROD
```

Ejemplo:

```text
DEV
api-dev.midominio.com

QA
api-qa.midominio.com

PROD
api.midominio.com
```

Cada ambiente deberá utilizar recursos independientes cuando corresponda.

Ejemplo:

```text
DEV
├── kikirikis-dev D1
└── kikirikis-media-dev R2

QA
├── kikirikis-qa D1
└── kikirikis-media-qa R2

PROD
├── kikirikis-prod D1
└── kikirikis-media-prod R2
```

Nunca se deberán mezclar datos de producción con desarrollo o QA.

---

# 17. Git

GitHub será utilizado como repositorio principal.

Flujo inicial propuesto:

```text
feature/*
     │
     ▼
Pull Request
     │
     ▼
develop
     │
     ▼
DEV
```

Después de validaciones:

```text
develop
   │
   ▼
release
   │
   ▼
QA
```

Y finalmente:

```text
release
   │
   ▼
main
   │
   ▼
PROD
```

La estrategia exacta de branching podrá simplificarse si posteriormente se determina que un modelo trunk-based resulta más conveniente.

---

# 18. CI/CD

GitHub Actions será utilizado para automatización.

Pipeline conceptual:

```text
PUSH / PULL REQUEST
        │
        ▼
Install dependencies
        │
        ▼
Lint
        │
        ▼
Unit Tests
        │
        ▼
Build
        │
        ▼
Security / validations
        │
        ▼
Deploy
        │
        ▼
Cloudflare Workers
```

Dependiendo del branch:

```text
develop
   ↓
DEV

release
   ↓
QA

main
   ↓
PROD
```

Las migraciones de D1 deberán formar parte de una estrategia controlada de despliegue y versionamiento.

---

# 19. Cloudflare como plataforma

Cloudflare no se utilizará únicamente para almacenar imágenes.

Será una pieza central de infraestructura para la V2 Online:

```text
Cloudflare
│
├── Workers
│     └── API/backend
│
├── D1
│     └── Base de datos
│
├── R2
│     └── Imágenes/archivos
│
├── DNS
│     └── Dominios/subdominios
│
├── HTTPS/TLS
│
├── CDN/Cache
│
├── Seguridad
│
└── Posibles capacidades futuras
      ├── Turnstile
      ├── WAF
      └── otras capacidades Cloudflare
```

---

# 20. Dominios

Durante desarrollo se puede comenzar utilizando los dominios proporcionados por Cloudflare.

Posteriormente se pretende utilizar un dominio propio.

Arquitectura conceptual:

```text
midominio.com
│
├── www.midominio.com
│       └── Web
│
├── api.midominio.com
│       └── Workers
│
└── media.midominio.com
        └── R2 / distribución de archivos
```

---

# 21. Aplicación móvil

La aplicación móvil consumirá únicamente contratos HTTP.

No deberá depender directamente de detalles internos de D1.

Ejemplo:

```text
APP MÓVIL
    │
    │ HTTPS / JSON
    ▼
API
    │
    ├── Authentication
    ├── Authorization
    ├── Business Logic
    ├── D1
    └── R2
```

La aplicación móvil nunca debe conectarse directamente a D1.

El Worker/API será responsable de aplicar:

- Seguridad
- Validaciones
- Reglas de negocio
- Autorización
- Acceso a datos

---

# 22. Principios arquitectónicos

La solución deberá diseñarse considerando:

1. Bajo costo inicial.
2. Uso del Free Tier mientras el volumen lo permita.
3. Seguridad desde el inicio.
4. Separación de responsabilidades.
5. API versionada.
6. Código mantenible.
7. Infraestructura reproducible.
8. Ambientes separados.
9. CI/CD.
10. Escalabilidad.
11. Observabilidad.
12. Posibilidad de evolucionar componentes en el futuro.
13. Evitar dependencias innecesarias entre la aplicación móvil y la infraestructura.
14. No almacenar archivos grandes dentro de la base relacional.
15. No almacenar secretos en Git.

---

# 23. Arquitectura objetivo resumida

```text
                              INTERNET
                                  │
                                  ▼
                         ┌─────────────────┐
                         │   CLOUDFLARE    │
                         │ DNS / TLS / WAF │
                         └────────┬────────┘
                                  │
                                  ▼
                         api.midominio.com
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   CLOUDFLARE WORKERS    │
                    │                         │
                    │ TypeScript + Hono       │
                    │ REST API / OpenAPI      │
                    │ JWT Auth                │
                    │ Business Logic          │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
             ┌──────────────┐          ┌──────────────┐
             │      D1      │          │      R2      │
             │              │          │              │
             │ SQL / Datos  │          │ Imágenes     │
             │ Usuarios     │          │ Archivos     │
             │ Negocio      │          │ Documentos   │
             └──────────────┘          └──────┬───────┘
                                             │
                                             ▼
                                    media.midominio.com


                         APP MÓVIL
                             │
                             │ HTTPS / JWT / JSON
                             ▼
                     api.midominio.com
```

Ciclo de desarrollo:

```text
Developer
    │
    ▼
feature branch
    │
    ▼
GitHub
    │
    ▼
Pull Request
    │
    ▼
GitHub Actions
    │
    ├── Lint
    ├── Tests
    ├── Build
    └── Validations
          │
          ▼
       Deploy
          │
     ┌────┼─────┐
     ▼    ▼     ▼
    DEV   QA   PROD
          │
          ▼
      Cloudflare
```

---

# 24. Decisiones ya tomadas

Estas decisiones deben considerarse como punto de partida y no volver a plantearse como alternativas salvo que aparezca una limitación técnica importante:

- El backend **NO utilizará .NET**.
- Backend en **TypeScript**.
- API mediante **Cloudflare Workers**.
- Framework HTTP propuesto: **Hono**.
- Base relacional: **Cloudflare D1**.
- Imágenes/archivos: **Cloudflare R2**.
- Git y repositorio: **GitHub**.
- CI/CD: **GitHub Actions + Cloudflare**.
- Autenticación basada en **JWT**.
- Se contemplan **Access Token + Refresh Token**.
- API REST versionada.
- OpenAPI como contrato/documentación.
- Separación de DEV, QA y PROD.
- La aplicación móvil consumirá la API mediante HTTPS/JSON.
- El objetivo inicial es aprovechar al máximo los recursos gratuitos disponibles.
- La arquitectura debe poder evolucionar cuando aumenten usuarios, almacenamiento, tráfico o complejidad.

---

# 25. Instrucción para continuar el proyecto en otro chat o agente

Este documento debe utilizarse como **contexto base de la V2 Online de Criadero Kikirikis**.

A partir de aquí, cualquier propuesta de:

- Arquitectura
- Estructura de repositorio
- Modelo de datos
- Seguridad
- CI/CD
- API
- Almacenamiento
- Desarrollo backend
- DevOps
- Infraestructura

debe ser compatible con las decisiones descritas anteriormente.

Antes de comenzar la implementación se deberá profundizar especialmente en:

- Arquitectura detallada del proyecto TypeScript/Hono.
- Modelo de autenticación y autorización.
- Roles y permisos.
- Diseño de D1.
- Estrategia de migraciones.
- Manejo de R2.
- Seguridad de archivos privados.
- Estructura estándar de respuestas y errores de API.
- Logging y observabilidad.
- Rate limiting.
- CORS.
- Validación de requests.
- OpenAPI.
- Testing.
- Git branching.
- Pipelines DEV/QA/PROD.
- Manejo de Secrets.
- Estrategia de backups y recuperación.
- Límites del Free Tier.
- Estrategia de crecimiento.

No se deben inventar funcionalidades concretas del negocio que todavía no hayan sido definidas.

La arquitectura anterior constituye la **plataforma tecnológica base propuesta para la V2 Online de Criadero Kikirikis**. Los módulos funcionales, procesos y reglas específicas del negocio deberán definirse posteriormente.
