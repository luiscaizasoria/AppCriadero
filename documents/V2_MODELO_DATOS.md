# V2_MODELO_DATOS — Criadero Kikirikis

## Propósito

Este documento registra las decisiones sobre el modelo de datos de V2 de forma incremental. Cada decisión aprobada se documenta aquí cuando se toma, sin esperar a un diseño completo previo.

## Principios generales aprobados

- **D1 será la fuente central de datos sincronizados.** Las entidades sincronizables tendrán su origen de verdad en D1 y se replicarán a SQLite en cada dispositivo.
- **SQLite seguirá siendo el almacenamiento local/offline.** La aplicación seguirá funcionando sin conexión, usando SQLite como caché local. Cuando hay conexión, se sincroniza con D1.
- **Las entidades sincronizables usarán identidad global.** Cada registro tendrá un identificador único global (ej. UUID) que sea estable a través de dispositivos y sincronizaciones.
- **El modelo será multi-criadero.** Los datos estarán scoped por criadero, permitiendo que múltiples criaderos operen independientemente dentro del mismo sistema.
- **Todavía no se ha diseñado el esquema D1 completo.** Este documento define decisiones incrementales; el esquema final se construirá acumulando estas decisiones.

## Decisión aprobada #1: Catálogos

### Sistema genérico

V2 utilizará un sistema genérico de catálogos compuesto por:

- `catalogos`: define los tipos de catálogos existentes (ej. RAZAS, SEXOS, etc.)
- `catalogo_items`: define los valores específicos de cada catálogo (ej. "Macho", "Hembra" dentro de SEXOS)

### Catálogos configurables

Los siguientes catálogos se implementarán mediante este sistema genérico:

- RAZAS
- SEXOS
- ENFERMEDADES
- MEDICAMENTOS
- ALIMENTOS
- BEBIDAS
- CATEGORIAS_FINANCIERAS

### Tablas históricas NO reproducidas en D1

Las siguientes tablas de V1 **NO** se reproducirán en D1 porque no tienen consumo funcional activo en V1:

- `enfermedades_catalogo`
- `medicamentos_catalogo`

Si en el futuro se requiere historial de cambios en catálogos, se diseñará un mecanismo específico, no se replicará la estructura histórica actual.

### Regla V2 para referencias a catálogos

Las entidades de negocio deberán guardar una referencia estable al `CatalogItem` correspondiente, no utilizar nombre o código como relación principal.

Esto significa que, por ejemplo, una `ave` no guardará "MACHO" como código/texto de relación, sino el identificador global del `CatalogItem` que representa el sexo Macho en el catálogo SEXOS.

### Comportamiento V1 a migrar

En V1, las entidades actualmente guardan valores textuales directamente:

- RAZAS: guarda nombre
- SEXOS: guarda código
- ENFERMEDADES: guarda nombre
- MEDICAMENTOS: guarda nombre
- ALIMENTOS: guarda nombre
- BEBIDAS: guarda nombre
- CATEGORIAS_FINANCIERAS: guarda código

Una futura migración/sincronización deberá resolver estos valores históricos hacia la identidad global del `CatalogItem` correspondiente. Esto implica:

1. Mapear los valores existentes a los `CatalogItem` creados durante la migración.
2. Actualizar las referencias en las entidades para usar el identificador global en lugar del texto/código.

### Valores de dominio (NO catálogos por ahora)

Los siguientes campos se consideran valores de dominio internos de la aplicación, **NO** catálogos configurables por ahora:

- `aves.estado_salud`
- `sanidad_jaula.tipo`
- `movimientos_financieros.tipo`

Si en el futuro se requiere que estos valores sean configurables o sincronizables, se evaluará si conviene convertirlos en catálogos del sistema genérico.

---

## Decisión aprobada #2: Identidad global y pertenencia a Criadero

### Identidad global

Todas las entidades sincronizables de V2 utilizarán identificadores globales estables.

La estrategia aprobada es utilizar UUID.

El mismo identificador será utilizado tanto en SQLite local como en D1.

Esto evita mantener pares de identificadores local/servidor y permite que un registro creado offline conserve su identidad al sincronizarse.

Ejemplo conceptual:

Dispositivo
  -> crea UUID
  -> SQLite
  -> sincronización
  -> D1 conserva el mismo UUID

Los INTEGER PRIMARY KEY AUTOINCREMENT de V1 se consideran identificadores locales históricos y deberán transformarse durante la futura migración.

### Pertenencia directa a Criadero

Toda entidad de negocio sincronizable perteneciente a un criadero deberá almacenar criadero_id directamente.

No se dependerá exclusivamente de relaciones indirectas para determinar ownership.

Esto aplica inicialmente a:

- jaulas
- aves
- ave_evolucion
- ave_historial
- jaula_historial
- huevos
- diagnosticos_ave
- tratamientos_ave
- bajas_ave
- movimientos_financieros
- movimientos_financieros_historial
- alimentacion_jaula
- bebida_jaula
- sanidad_jaula

Aunque algunas entidades puedan deducir el criadero mediante su entidad padre, criadero_id se mantendrá explícitamente para facilitar:

- autorización
- aislamiento multi-criadero
- sincronización
- consultas
- índices
- resolución de conflictos
- auditoría
- funcionamiento offline

La integridad entre criadero_id y las relaciones padre deberá validarse en la capa de dominio/API.

### Caso específico de aves

aves.criadero_id será obligatorio.

No se utilizará jaula_actual_id como mecanismo para determinar a qué criadero pertenece un ave.

Un ave puede existir sin jaula asignada y puede cambiar de jaula sin que cambie su criadero.

aves.criadero_origen seguirá representando información descriptiva sobre procedencia y NO ownership del sistema.

### Catálogos globales y configuración por criadero

La definición de tipos de catálogo será global mediante catalogos.

Ejemplos:

- RAZAS
- SEXOS
- ENFERMEDADES
- MEDICAMENTOS
- ALIMENTOS
- BEBIDAS
- CATEGORIAS_FINANCIERAS

Los valores concretos serán configurables por criadero mediante catalogo_items.

Cada catalogo_item tendrá identidad global y pertenecerá a un criadero_id.

Esto permite que dos criaderos compartan los mismos tipos de catálogo pero mantengan configuraciones independientes.

Al crear un nuevo criadero podrán generarse items predeterminados a partir de una configuración inicial del sistema.

Los items resultantes pertenecerán al criadero.

### Entidades derivadas de V1

clientes no existe actualmente como tabla persistente independiente en V1; se deriva de información de bajas/ventas.

produccion tampoco existe actualmente como tabla persistente independiente; se deriva principalmente de huevos.

Por ahora V2 NO creará tablas específicas clientes ni produccion.

Estas decisiones se reevaluarán cuando se diseñen esos módulos.

### Consecuencia para sincronización

La unidad principal de aislamiento y sincronización será el criadero.

La estrategia detallada de sincronización todavía NO está definida.

---

## Decisión aprobada #3: Autenticación y Onboarding Inicial

### Alcance

V2 utilizará un modelo de autenticación simple.

Cada usuario tendrá exactamente un criadero y cada criadero pertenecerá exactamente a un usuario.

Por ahora NO existirán:

- roles;
- permisos;
- UserCriadero;
- usuarios compartiendo un criadero;
- membresías;
- invitaciones.

El sistema completo podrá contener múltiples usuarios y múltiples criaderos, pero cada usuario únicamente podrá acceder a los datos de su propio criadero.

### Relación User y Criadero

La relación conceptual será uno-a-uno.

Criadero tendrá una referencia user_id única.

User no almacenará directamente criadero_id.

En el flujo normal de V2 el criadero se creará asociado al usuario cuando corresponda.

La migración futura de información V1 se tratará como un proceso específico y no modifica esta regla conceptual.

### User

User representa la identidad autenticable global.

Conceptualmente tendrá:

- id global UUID;
- email único;
- nombre;
- password_hash nullable;
- google_sub nullable y único;
- email_verified_at nullable;
- active;
- created_at;
- updated_at.

No existirá auth_provider.

Los métodos de autenticación disponibles se deducirán de los datos existentes:

- password_hash no nulo permite autenticación con correo y contraseña;
- google_sub no nulo permite autenticación con Google.

User no almacenará directamente:

- criadero actual;
- roles;
- permisos;
- datos de negocio;
- configuración del criadero.

### Autenticación con Google

La identidad externa estable de Google será google_sub, correspondiente al campo sub entregado por Google.

El sistema NO dependerá únicamente del email para identificar una cuenta Google.

Flujo conceptual de primer ingreso con Google:

1. Validar la identidad entregada por Google.
2. Buscar un User por google_sub.
3. Si existe, realizar login.
4. Si no existe, verificar si el email ya pertenece a otra cuenta.
5. Si el email no existe, crear User.
6. Marcar email_verified_at.
7. Activar la cuenta.
8. Crear Criadero con nombre inicial "Mi Criadero".
9. Generar credenciales de sesión.
10. Permitir ingresar a la aplicación.

### Cuenta existente con contraseña e intento de Google

Si existe un User con el mismo email y password_hash, pero sin google_sub asociado:

- NO se creará un segundo usuario;
- NO se vinculará Google automáticamente;
- se indicará al usuario que debe iniciar sesión con su contraseña.

La vinculación explícita entre métodos de autenticación queda fuera del alcance actual.

### Registro con correo y contraseña

Flujo conceptual:

1. El usuario ingresa email y contraseña.
2. Se crea User con password_hash.
3. email_verified_at queda nulo.
4. La cuenta permanece inactiva.
5. Se envía un mecanismo de verificación de email.
6. El usuario verifica su email.
7. email_verified_at se registra.
8. La cuenta se activa.
9. Se crea Criadero con nombre inicial "Mi Criadero".
10. Se generan credenciales de sesión.
11. El usuario ingresa a la aplicación.

La contraseña original nunca se almacenará.

Solo se almacenará un password_hash generado mediante el mecanismo criptográfico que se seleccione durante la implementación de autenticación.

### Login con correo y contraseña

Flujo conceptual:

1. El usuario ingresa email y contraseña.
2. Se busca User por email.
3. Se verifica que password_hash exista.
4. Se verifica la contraseña.
5. Se verifica que la cuenta esté activa.
6. Se generan las credenciales de sesión.
7. Se carga el contexto local correspondiente al usuario/criadero.
8. Se permite ingresar.

### Recuperación de contraseña

La recuperación de contraseña forma parte del alcance de V2.

Flujo conceptual:

1. El usuario ingresa su email.
2. Se verifica que exista una cuenta con password_hash.
3. Se genera un token temporal de recuperación.
4. Se envía el mecanismo de recuperación al correo.
5. El usuario define una nueva contraseña.
6. Se actualiza password_hash.
7. El token de recuperación deja de ser válido.
8. Las sesiones existentes podrán invalidarse según la estrategia definitiva de autenticación.

La implementación física de password_reset_tokens se definirá posteriormente.

### Logout

Al cerrar sesión:

- se invalidará o eliminará el contexto de autenticación activo;
- se eliminarán las credenciales/tokens locales;
- se cerrará el contexto SQLite del usuario actual;
- se regresará a la pantalla de login.

El logout NO eliminará los datos SQLite del usuario.

### Aislamiento SQLite por usuario/criadero

V2 es offline-first.

Por lo tanto, SQLite puede contener información todavía no sincronizada con D1.

Los datos locales NO deben borrarse automáticamente al cerrar sesión.

Cada usuario/criadero deberá mantener un contexto SQLite local aislado.

Conceptualmente:

Usuario A
  -> SQLite A

Usuario B
  -> SQLite B

Al cambiar de usuario se cambiará de contexto SQLite sin mezclar ni eliminar los datos del usuario anterior.

La implementación física de este aislamiento se definirá durante el diseño de sincronización.

### Fuera del alcance actual

Todavía no se diseñarán en detalle:

- refresh tokens;
- sesiones activas;
- password_reset_tokens;
- email_verification_tokens;
- oauth_states;
- implementación concreta de OAuth;
- algoritmo concreto de password hashing;
- tiempos de expiración de tokens;
- sincronización detallada;
- resolución de conflictos.

Estas decisiones se tratarán en sus fases correspondientes.
