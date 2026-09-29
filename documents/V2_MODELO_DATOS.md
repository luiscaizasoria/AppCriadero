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

---

## Decisión aprobada #4: Estándar mínimo de entidad sincronizable

Toda entidad de negocio sincronizable de V2 utilizará un conjunto mínimo de campos comunes para soportar identidad global, aislamiento por criadero, auditoría básica, borrado lógico y control de concurrencia.

### Campos estándar D1 + SQLite

Toda entidad de negocio sincronizable tendrá:

- id: identidad global UUID estable;
- criadero_id: identifica el criadero propietario del registro;
- created_at: fecha de creación;
- updated_at: fecha de última modificación;
- deleted_at: fecha de borrado lógico, nullable;
- version: versión entera utilizada para control optimista de concurrencia.

### Metadata local exclusiva de SQLite

SQLite mantendrá además metadata de sincronización local:

- sync_status;
- last_synced_version.

sync_status contemplará inicialmente los estados:

- SYNCED;
- PENDING;
- ERROR.

Estos campos NO se almacenarán en D1 porque representan el estado local de sincronización del dispositivo.

### Regla de soft delete

deleted_at será obligatorio en toda entidad de negocio sincronizable.

El borrado lógico permitirá propagar eliminaciones entre SQLite y D1 sin perder inmediatamente la información necesaria para sincronizar.

Esta regla NO implica que todas las tablas técnicas futuras utilicen soft delete.

Tablas temporales o técnicas como recuperación de contraseña, OAuth o sesiones podrán utilizar políticas diferentes cuando sean diseñadas.

### Regla de versionado

version será obligatorio en toda entidad de negocio sincronizable.

La versión permitirá detectar actualizaciones realizadas sobre una copia antigua del registro.

Conceptualmente:

- un dispositivo conoce una versión determinada;
- envía una modificación indicando esa versión;
- D1 valida que siga siendo la versión actual;
- si la modificación es aceptada, la versión aumenta.

El protocolo detallado de conflictos todavía NO está definido.

### Auditoría inicial

created_at y updated_at serán suficientes como auditoría inicial.

Por ahora NO se agregarán:

- created_by;
- updated_by.

El modelo actual establece un único usuario por criadero y no existen roles ni usuarios compartiendo datos del mismo criadero.

### Campos deliberadamente pospuestos

No se incorporarán todavía a las entidades de negocio:

- server_updated_at;
- last_synced_at;
- device_id;
- hash de contenido;
- metadata detallada de conflictos;
- conflict_reason;
- conflict_data.

El sistema NO asumirá que existe un solo dispositivo.

La identificación y administración de dispositivos, si posteriormente es necesaria, se resolverá en las capas de autenticación, sesiones o sincronización y no mediante device_id en cada entidad de negocio.

---

## Decisión aprobada #5: Identidad UUID y unicidad de negocio

### Identidad técnica

Las entidades que requieran identidad global utilizarán UUID v7.

El UUID será:

- global;
- estable;
- inmutable;
- independiente del código de negocio;
- utilizado tanto en SQLite como en D1.

La implementación concreta para generar UUID v7 en React Native/Expo y Cloudflare Workers se definirá posteriormente.

### Generación de UUID

El componente que crea originalmente un registro será responsable de generar su UUID.

Si una entidad de negocio se crea offline en el dispositivo, el dispositivo generará el UUID antes de persistirla en SQLite.

Si una entidad se crea originalmente mediante la API, la API generará su UUID.

D1 conservará siempre el UUID ya asignado al registro.

No existirá un mecanismo de traducción entre local_id y server_id.

### Migración de identificadores V1

Los INTEGER AUTOINCREMENT existentes en V1 se consideran identificadores locales legacy.

Durante la futura migración se generará un UUID v7 una sola vez para cada registro migrado.

La migración deberá mantener un mapa temporal entre el ID legacy y el nuevo UUID para transformar correctamente todas las relaciones y claves foráneas.

El ID legacy no será utilizado como identidad técnica en V2.

La incorporación de legacy_id como campo persistente será opcional y se decidirá únicamente si aparece una necesidad real de trazabilidad.

### ID técnico y código de negocio

El UUID representa la identidad técnica del registro.

Los códigos visibles para el usuario representan identidad o referencia de negocio y son campos independientes.

Un código de negocio podrá cambiar sin cambiar el UUID del registro.

Las relaciones entre entidades utilizarán UUID y nunca dependerán del código visible.

### Reglas iniciales de unicidad

Se aprueban conceptualmente las siguientes reglas:

- User.email: único global;
- User.google_sub: único global cuando exista;
- Criadero.user_id: único global para mantener relación uno-a-uno;
- catalogos.codigo: único global;
- catalogo_items.codigo: único dentro de la combinación criadero + catálogo;
- jaulas.codigo: único dentro de un criadero;
- aves.codigo: único dentro de un criadero.

La necesidad y unicidad de huevos.codigo queda pendiente hasta diseñar específicamente la entidad huevos.

### Soft delete y reutilización de códigos

Las restricciones de unicidad de códigos de negocio aplicarán conceptualmente a registros activos.

Un código perteneciente únicamente a un registro con deleted_at informado podrá reutilizarse para un nuevo registro.

El UUID permitirá distinguir permanentemente ambos registros aunque hayan utilizado el mismo código de negocio en momentos diferentes.

La implementación física de esta regla mediante índices o constraints se definirá al diseñar el esquema D1.

### Decisiones pospuestas

Todavía no se definirá:

- librería concreta de UUID v7 para Expo;
- librería concreta de UUID v7 para Cloudflare Workers;
- índices físicos;
- formato de códigos visibles;
- prefijos y secuencias;
- estrategia concreta de generación de códigos;
- resolución de conflictos de códigos durante sincronización;
- uso persistente de legacy_id.

---

## Decisión aprobada #6: Relaciones estructurales e históricos

### Relaciones principales

Criadero será la raíz de las entidades de negocio.

Se mantienen conceptualmente las relaciones:

- Criadero -> Jaulas;
- Criadero -> Aves;
- Ave -> Jaula actual;
- Ave -> Padre;
- Ave -> Madre;
- Ave -> Huevos;
- Ave -> Diagnósticos;
- Diagnóstico -> Tratamientos;
- Ave -> Bajas;
- Ave -> AveEvolucion;
- Ave -> AveHistorial;
- Jaula -> JaulaHistorial;
- Jaula -> Alimentación;
- Jaula -> Bebida;
- Jaula -> Sanidad.

Todas las relaciones utilizarán UUID.

### Jaula actual de un ave

aves.jaula_actual_id será nullable.

Un ave podrá existir sin estar asignada actualmente a una jaula.

El criadero propietario del ave NO se determinará mediante jaula_actual_id, ya que aves.criadero_id es la relación de ownership aprobada.

### Genealogía

aves.padre_id y aves.madre_id serán referencias opcionales a otras aves.

Ambas serán nullable porque puede existir un ave cuya genealogía no esté registrada en el sistema.

Las reglas de dominio relacionadas con genealogía, como validación de sexo, pertenencia al mismo criadero o prevención de ciclos, se definirán posteriormente en la capa de dominio/API.

### Huevos

huevos continuará como entidad independiente.

Todo huevo deberá estar asociado a un ave mediante ave_id.

La relación huevos.ave_id será obligatoria.

huevos.jaula_id será opcional.

La jaula representa contexto adicional del registro pero no sustituye la relación obligatoria con el ave.

### AveEvolucion

ave_evolucion se mantendrá como entidad independiente.

Representa la evolución física e información asociada de un ave y estará relacionada mediante ave_id.

### Diagnósticos y tratamientos

diagnosticos_ave se mantendrá como entidad independiente relacionada con Ave.

tratamientos_ave se mantendrá como entidad independiente.

Cada tratamiento podrá relacionarse explícitamente con su diagnóstico mediante diagnostico_id y con el ave según la estructura definitiva del módulo de salud.

### Bajas de aves

bajas_ave se mantendrá como entidad independiente relacionada mediante ave_id.

Representará los eventos de baja como muerte o venta y conservará la información propia de dichos eventos.

### AveHistorial

ave_historial se mantendrá como entidad independiente.

ave_historial.ave_id será obligatorio.

ave_historial.jaula_id será nullable.

Esto permite registrar eventos que no requieren una jaula asociada, incluyendo actualmente eventos como:

- ALTA de un ave sin jaula;
- SALUD;
- MUERTE;
- VENTA.

### JaulaHistorial

jaula_historial se mantendrá como entidad independiente.

jaula_historial.jaula_id será obligatorio.

jaula_historial.ave_id permanecerá nullable.

Aunque el código V1 analizado utiliza actualmente un ave específica en los eventos encontrados, V1 permite NULL y no existe evidencia suficiente para introducir una restricción obligatoria nueva en V2.

### Historial financiero

movimientos_financieros_historial se mantendrá inicialmente como entidad independiente.

Su estructura física se definirá cuando se diseñe específicamente el módulo financiero.

### Origen de movimientos financieros

V1 utiliza una relación polimórfica mediante:

- origen_tipo;
- origen_id;
- ave_id opcional.

El análisis del código V1 confirma únicamente los siguientes orígenes:

- MANUAL: origen_id es NULL y ave_id es NULL;
- VENTA_AVE: origen_id referencia bajas_ave.id y ave_id referencia el ave vendida.

V2 eliminará la relación polimórfica origen_tipo + origen_id para estos casos actualmente conocidos.

Se utilizará una relación explícita:

- movimientos_financieros.baja_ave_id nullable.

Reglas conceptuales:

- un movimiento manual tendrá baja_ave_id NULL;
- un movimiento originado por una venta tendrá baja_ave_id apuntando al registro correspondiente de bajas_ave.

movimientos_financieros.ave_id tampoco se mantendrá para este caso, porque el ave puede obtenerse mediante:

MovimientoFinanciero
-> BajaAve
-> Ave

Esto evita duplicar relaciones y posibles inconsistencias entre ave_id y baja_ave_id.

Si en el futuro aparecen nuevos tipos reales de origen financiero, se diseñarán explícitamente cuando el módulo correspondiente lo requiera, en lugar de reintroducir anticipadamente una relación polimórfica genérica.

### Entidades independientes que se mantienen

Por ahora se mantienen como entidades separadas:

- ave_evolucion;
- ave_historial;
- jaula_historial;
- huevos;
- diagnosticos_ave;
- tratamientos_ave;
- bajas_ave;
- movimientos_financieros;
- movimientos_financieros_historial;
- alimentacion_jaula;
- bebida_jaula;
- sanidad_jaula.

No se utilizará por ahora un mecanismo genérico único de historial para reemplazar estas entidades.
