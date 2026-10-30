# Contexto Maestro del Proyecto — Criadero Kikirikis

> Documento de contexto técnico y funcional para continuidad del desarrollo, onboarding de nuevos desarrolladores y uso con asistentes de programación con IA como Windsurf/Cascade.

**Estado del documento:** cierre de la primera versión funcional en pruebas  
**Aplicación:** Criadero Kikirikis  
**Plataforma actual:** aplicación móvil Android desarrollada con React Native + Expo  
**Persistencia actual:** SQLite local  
**Estado de arquitectura:** V1 offline/local; V2 prevista con API, usuarios, servidor y sincronización

---

## 1. Objetivo del proyecto

Criadero Kikirikis es una aplicación móvil para administrar de forma estructurada la operación de un criadero de aves.

El objetivo de la primera versión ha sido reemplazar el control disperso o manual por una aplicación que permita registrar, consultar y relacionar:

- aves;
- jaulas;
- alimentación;
- bebida;
- sanidad;
- enfermedades;
- medicamentos y tratamientos;
- evolución física;
- genealogía;
- huevos;
- bajas o ventas de aves;
- movimientos financieros;
- catálogos parametrizables;
- historial operativo;
- respaldo y restauración de la información.

La aplicación está diseñada para funcionar actualmente de forma local en el dispositivo, sin requerir conexión permanente a Internet.

La intención de V1 no es todavía ser una plataforma multiusuario o centralizada, sino validar correctamente el modelo funcional, los procesos y la experiencia de uso antes de evolucionar hacia una arquitectura conectada.

---

## 2. Estado actual de la V1

La primera versión se encuentra en etapa de pruebas funcionales.

Hasta el cierre actual se han trabajado y probado principalmente:

- gestión de jaulas;
- gestión de aves;
- detalle y ciclo de vida del ave;
- evolución física;
- salud, diagnósticos y tratamientos;
- genealogía;
- alimentación de jaulas;
- bebida de jaulas;
- sanidad de jaulas;
- huevos;
- bajas de aves;
- finanzas;
- parámetros y catálogos;
- navegación entre módulos;
- respaldo y restauración de SQLite;
- respaldo de imágenes incorporadas después de la nueva lógica;
- compartir respaldo;
- migraciones de base de datos hasta V7;
- inicialización idempotente de catálogos requeridos.

La V1 debe considerarse todavía **en validación**, especialmente en escenarios de instalación limpia, actualización y restauración de respaldos.

---

## 3. Tecnologías utilizadas

### Aplicación móvil

- React Native.
- Expo SDK 57.
- JavaScript.
- Expo Image Picker para cámara y galería.
- Expo File System para almacenamiento de archivos.
- Expo Sharing para compartir respaldos.
- Expo Document Picker para seleccionar respaldos.
- Expo Navigation Bar para controlar la barra inferior de Android.

### Navegación

- React Navigation.
- Bottom Tab Navigator.
- Native Stack Navigator.

### Persistencia

- SQLite mediante `expo-sqlite`.
- Base local en el dispositivo.
- Migraciones controladas con `PRAGMA user_version`.

### Código y versionamiento

- Git.
- Repositorio remoto en GitHub.
- EAS Build para generar instalables Android.

### Identificación conocida de Android

```text
com.luiscaizasoria.criaderokikirikis
```

### Proyecto EAS

```text
3cbec0b1-69a3-4c01-98dc-0f744a2290bb
```

---

## 4. Arquitectura actual de V1

La aplicación sigue una estructura simple por responsabilidades.

De forma conceptual:

```text
src/
├── screens/
│   └── pantallas de la aplicación
│
├── navigation/
│   └── navegación por tabs y stacks
│
├── repositories/
│   └── acceso a datos y lógica de persistencia
│
├── database/
│   ├── database.js
│   ├── sqlite.js
│   ├── migrations.js
│   ├── migrationV2.js
│   ├── migrationV3.js
│   ├── migrationV4.js
│   ├── migrationV5.js
│   ├── migrationV6.js
│   ├── migrationV7.js
│   └── seeders.js
│
├── services/
│   └── servicios auxiliares, por ejemplo imágenes
│
└── config/
    └── constantes, colores y configuración
```

La regla general es:

```text
Pantalla
   ↓
Repository / Service
   ↓
SQLite o FileSystem
```

La UI no debería contener SQL directo salvo excepciones justificadas.

---

# 5. Navegación principal

La aplicación utiliza un menú inferior con las secciones principales:

```text
Inicio
Jaulas
Aves
Finanzas
Más
```

Cada módulo principal puede contener su propio Stack Navigator.

Un requerimiento importante ya resuelto es que los botones del menú inferior se comporten como accesos raíz.

Ejemplos:

```text
Jaulas   → ListaJaulas
Aves     → ListaAves
Finanzas → pantalla inicial de Finanzas
Más      → pantalla inicial de Más
```

Esto evita el problema donde el usuario entraba, por ejemplo:

```text
Jaulas
  ↓
Detalle jaula
  ↓
Detalle ave
```

y posteriormente al tocar el tab Aves seguía viendo `DetalleAve` en lugar del listado.

La navegación inferior ahora debe llevar siempre a la pantalla inicial del módulo cuando el usuario pulsa explícitamente el tab.

---

# 6. Módulo Inicio

El módulo Inicio funciona como punto principal de entrada a la aplicación.

Su propósito es entregar una vista resumida de la situación del criadero y permitir acceso rápido a los módulos relevantes.

El detalle exacto de los indicadores puede evolucionar, pero la pantalla debe mantenerse como un resumen operativo y no convertirse en una pantalla de mantenimiento de datos.

---

# 7. Módulo Jaulas

## 7.1 Lista de jaulas

Pantalla raíz:

```text
ListaJaulas
```

Permite visualizar las jaulas registradas y acceder a su detalle.

Una jaula puede relacionarse con:

- aves;
- alimentación;
- bebida;
- sanidad;
- historial;
- estado activo/inactivo.

## 7.2 Nueva jaula

Pantalla:

```text
NuevaJaula
```

Permite registrar una nueva jaula.

## 7.3 Detalle de jaula

Pantalla:

```text
DetalleJaula
```

Centraliza la información de una jaula activa y permite acceder a sus procesos asociados.

Desde aquí pueden visualizarse las aves asignadas y navegar hacia el detalle individual del ave.

## 7.4 Jaulas inactivas

Pantalla:

```text
DetalleJaulaInactiva
```

Permite consultar información histórica de una jaula que ya no se encuentra activa.

## 7.5 Asignación de aves

Pantalla:

```text
SeleccionarAveJaula
```

Permite seleccionar y asociar aves a una jaula.

## 7.6 Alimentación

Pantalla:

```text
AlimentacionJaula
```

Registra alimentación suministrada a una jaula.

Los alimentos deben provenir del catálogo parametrizable de alimentos.

Tabla conocida:

```text
alimentacion_jaula
```

## 7.7 Bebida

Pantalla:

```text
BebidaJaula
```

Registra bebida, suplementos líquidos o elementos equivalentes definidos por la operación.

Los valores disponibles deben relacionarse con el catálogo de bebidas.

Tabla conocida:

```text
bebida_jaula
```

## 7.8 Sanidad

Pantalla:

```text
SanidadJaula
```

Registra eventos sanitarios de la jaula.

Se han utilizado estados/eventos como:

- Normal;
- Limpieza;
- Fumigación;
- Quemadura;
- Cuarentena.

Un evento sanitario actualiza también el estado sanitario actual de la jaula y registra un evento histórico.

Tabla conocida:

```text
sanidad_jaula
```

## 7.9 Historial de jaula

Pantalla:

```text
HistorialJaula
```

Busca consolidar eventos relevantes ocurridos sobre una jaula.

Tabla conocida:

```text
jaula_historial
```

---

# 8. Módulo Aves

## 8.1 Lista de aves

Pantalla raíz:

```text
ListaAves
```

Presenta las aves registradas.

## 8.2 Nueva ave

Pantalla:

```text
NuevaAve
```

Permite registrar un ave con información como:

- código;
- raza;
- sexo;
- datos físicos;
- información relacionada;
- fotografía.

## 8.3 Detalle de ave

Pantalla:

```text
DetalleAve
```

Es la vista central del ave.

Debe responder rápidamente:

- cuál es el ave;
- en qué estado está;
- a qué jaula pertenece;
- qué raza y sexo tiene;
- qué información física posee;
- cuál es su foto;
- qué eventos importantes ha tenido;
- qué accesos relacionados existen.

## 8.4 Evolución física

Pantalla:

```text
EvolucionAve
```

Permite registrar cambios físicos en el tiempo.

Campos trabajados:

- peso;
- altura;
- largo;
- fecha;
- fotografía cuando corresponda.

Tabla conocida:

```text
ave_evolucion
```

Esto permite separar el valor actual de un ave de su evolución histórica.

## 8.5 Salud

Pantalla:

```text
SaludAve
```

Gestiona información sanitaria individual del ave.

Se relaciona con:

- enfermedades;
- diagnósticos;
- medicamentos;
- tratamientos.

Tablas conocidas:

```text
diagnosticos_ave
tratamientos_ave
enfermedades_catalogo
medicamentos_catalogo
```

Además existe una parametrización genérica mediante `catalogos` y `catalogo_items`, por lo que a futuro debe evitarse mantener dos fuentes de verdad para el mismo concepto.

## 8.6 Finalización de tratamiento

Pantalla:

```text
FinalizarTratamiento
```

Permite cerrar un tratamiento registrado.

## 8.7 Baja de ave

Pantalla:

```text
BajaAve
```

Permite registrar la salida de un ave.

Una baja puede estar relacionada con venta u otra causa.

Tabla conocida:

```text
bajas_ave
```

La operación puede generar información financiera cuando corresponda.

## 8.8 Registro de huevos

Pantalla:

```text
RegistrarHuevo
```

Permite registrar huevos asociados a la operación del criadero.

Tabla conocida:

```text
huevos
```

## 8.9 Ciclo de vida

Pantalla:

```text
CicloVidaAve
```

Su objetivo es mostrar de forma ordenada el historial relevante del ave.

Tabla conocida:

```text
ave_historial
```

## 8.10 Genealogía

Pantalla:

```text
GenealogiaAve
```

Permite visualizar relaciones genealógicas del ave.

El objetivo es poder identificar ascendencia y relaciones familiares cuando los datos están disponibles.

---

# 9. Imágenes de aves

Las imágenes no se almacenan como BLOB directamente dentro de SQLite.

El proceso actual es:

```text
Cámara / Galería
      ↓
ImagePicker
      ↓
URI temporal
      ↓
guardarFotoAve()
      ↓
FileSystem.documentDirectory
      ↓
kikirikis/aves/<codigoAve>/
      ↓
SQLite guarda foto_uri
```

Ejemplo conceptual:

```text
documentDirectory/
└── kikirikis/
    └── aves/
        └── 001/
            └── foto_xxxxx.jpeg
```

SQLite mantiene únicamente la URI.

## Consideración importante detectada durante pruebas

Fotografías creadas previamente bajo otro contenedor de Expo Go pueden mantener rutas históricas como:

```text
.../ExperienceData/@anonymous/CriaderoKikirikis-.../
```

La base conserva esas URI, pero Android puede impedir su lectura desde una experiencia o instalación distinta.

Durante pruebas se detectaron referencias existentes en base que ya no eran físicamente legibles.

Por esta razón:

- una URI en SQLite no garantiza que el archivo físico siga disponible;
- un backup debe verificar que cada archivo exista y pueda leerse;
- las imágenes nuevas deben permanecer dentro de una carpeta controlada por la aplicación;
- las imágenes restauradas deben copiarse al almacenamiento de la instalación actual y recibir una URI nueva.

---

# 10. Parámetros y catálogos

La aplicación utiliza catálogos parametrizables para evitar valores rígidos en las pantallas.

Tablas:

```text
catalogos
catalogo_items
```

Catálogos maestros esperados:

```text
RAZAS
SEXOS
ENFERMEDADES
MEDICAMENTOS
ALIMENTOS
BEBIDAS
CATEGORIAS_FINANCIERAS
```

El módulo permite:

- listar valores;
- crear;
- editar;
- eliminar según la implementación vigente.

Pantallas conocidas:

```text
CatalogoScreen
EditarCatalogoItemScreen
```

## Relación con el resto de la aplicación

Los parámetros deben actuar como fuente de selección para los procesos operativos.

Ejemplo:

```text
Parámetro ALIMENTOS
       ↓
AlimentacionJaula
```

```text
Parámetro BEBIDAS
       ↓
BebidaJaula
```

```text
Parámetro ENFERMEDADES
       ↓
Salud / Diagnóstico Ave
```

```text
Parámetro MEDICAMENTOS
       ↓
Tratamiento Ave
```

```text
Parámetro CATEGORIAS_FINANCIERAS
       ↓
Movimientos financieros
```

La regla funcional de V2 debería ser tener una sola fuente de verdad para cada catálogo.

---

# 11. Migraciones de SQLite

La base utiliza:

```sql
PRAGMA user_version;
```

para conocer la versión actual del esquema.

Las migraciones se ejecutan secuencialmente.

Estado actual:

```text
V1 = 1
V2 = 2
V3 = 3
V4 = 4
V5 = 5
V6 = 6
V7 = 7
```

## V4

Entre otros ajustes, incorporó campos actuales del ave como:

```text
sexo
peso_gramos
altura_cm
largo_cm
```

## V5

Introdujo evolución física mediante:

```text
ave_evolucion
```

## V6

Incluye funcionalidad adicional consolidada durante la evolución del proyecto, incluyendo módulos operativos y financieros usados actualmente.

## V7

Se creó para corregir instalaciones limpias donde algunos catálogos padres no existían.

V7 garantiza la existencia de catálogos requeridos.

Además, `seeders.js` se ejecuta al iniciar la base y funciona como segunda defensa idempotente.

La filosofía es:

```text
Migración
    ↓
estructura / datos maestros indispensables

Seeder
    ↓
verificación idempotente
```

El seeder utiliza estrategias como `INSERT OR IGNORE` para no duplicar datos existentes.

---

# 12. Finanzas

Pantalla principal:

```text
FinanzasScreen
```

Funcionalidades actuales:

- resumen de ingresos;
- resumen de egresos;
- balance;
- período:
  - este mes;
  - este año;
  - todo;
- consolidado por categoría;
- consolidado mensual;
- listado de movimientos;
- filtros:
  - todos;
  - ingresos;
  - egresos;
- creación de movimiento;
- consulta/corrección de movimiento existente.

El botón:

```text
+ Nuevo movimiento
```

fue movido para aparecer inmediatamente después del consolidado por categoría, evitando que el usuario deba desplazarse hasta el final cuando existen muchos movimientos.

Tablas conocidas:

```text
movimientos_financieros
movimientos_financieros_historial
```

Categorías conocidas en la aplicación:

```text
VENTA_AVE
ENVIO_AVE
VENTA_HUEVOS
ALIMENTO
MEDICAMENTO
INFRAESTRUCTURA
COMPRA_AVE
OTRO
```

Debe continuarse migrando hacia categorías configurables en lugar de depender de mapas rígidos.

---

# 13. Relación entre procesos principales

La aplicación no debe verse como módulos independientes.

El modelo funcional es una red relacionada.

## Ejemplo: ave

```text
Ave
├── Raza
├── Sexo
├── Jaula
├── Fotografía
├── Evolución física
├── Salud
│   ├── Diagnóstico
│   ├── Enfermedad
│   ├── Medicamento
│   └── Tratamiento
├── Genealogía
├── Huevos
├── Historial
└── Baja / Venta
    └── Movimiento financiero
```

## Ejemplo: jaula

```text
Jaula
├── Aves
├── Alimentación
│   └── Catálogo de alimentos
├── Bebida
│   └── Catálogo de bebidas
├── Sanidad
└── Historial
```

## Ejemplo: parámetros

```text
Parámetros
├── Razas
├── Sexos
├── Enfermedades
├── Medicamentos
├── Alimentos
├── Bebidas
└── Categorías financieras
      ↓
utilizados por pantallas operativas
```

---

# 14. Historial y trazabilidad

La aplicación ya incorpora tablas históricas para evitar que toda la información sea solamente el “estado actual”.

Ejemplos:

```text
ave_historial
jaula_historial
movimientos_financieros_historial
ave_evolucion
```

La evolución del producto debería continuar con este principio:

> cuando un dato tenga valor histórico para la operación, no debe perderse al modificar el estado actual.

---

# 15. Backup, restauración y compartir respaldo

Este módulo fue uno de los puntos más delicados de V1.

Pantalla:

```text
BackupScreen
```

Repository principal:

```text
BackupRepository
```

## 15.1 Datos SQLite

El respaldo genera SQL con el contenido de las tablas del usuario.

El flujo actual comprobado para datos es:

```text
SQLite
   ↓
generar SQL
   ↓
seleccionar carpeta Android
   ↓
guardar respaldo
```

La restauración usa:

```text
DocumentPicker
   ↓
content://
   ↓
copyAsync
   ↓
copia temporal dentro de la aplicación
   ↓
readAsStringAsync
   ↓
execAsync
   ↓
restauración SQLite
```

Este enfoque solucionó problemas de lectura directa desde URIs de Android.

## 15.2 Imágenes

Se agregó soporte para incorporar imágenes disponibles al respaldo.

El objetivo funcional es:

```text
Backup N
├── datos
└── imágenes disponibles
```

Al restaurar:

```text
datos SQL
   ↓
restaurar imágenes físicamente
   ↓
crear URI nueva
   ↓
actualizar foto_uri
```

De esta forma una imagen restaurada debe convertirse en una imagen normal de la instalación actual.

Entonces el ciclo esperado es:

```text
Backup 1
  ↓
restaurar imágenes A/B/C
  ↓
agregar nuevas imágenes D/E
  ↓
Backup 2
  ↓
incluye A/B/C/D/E
```

## 15.3 Estado de validación

En pruebas se comprobó que imágenes nuevas pueden ser detectadas por la lógica de respaldo.

También se detectó que algunas imágenes antiguas provenientes de rutas históricas de Expo Go no pueden ser leídas por Android.

Esta limitación debe verificarse nuevamente en el APK instalado definitivo.

## 15.4 Compartir respaldo

El botón de compartir fue habilitado.

Puede compartir un respaldo existente o generar uno temporal para abrir el mecanismo nativo de compartir del dispositivo.

---

# 16. Exportación

En V1 existe una funcionalidad de exportación práctica mediante:

```text
Crear respaldo
Compartir respaldo
```

Esto permite sacar información fuera del dispositivo como copia de seguridad.

No debe confundirse con un módulo completo de exportación funcional en formatos como:

- Excel;
- CSV;
- PDF;
- reportes imprimibles.

Esos formatos no quedan considerados como completamente consolidados en el alcance actual documentado.

Son candidatos naturales para V2.

---

# 17. Reportes

V1 ya contiene vistas consolidadas, especialmente en Finanzas.

Ejemplos:

- ingresos;
- egresos;
- balance;
- consolidado por categoría;
- consolidado mensual.

Sin embargo, un subsistema formal de reportes descargables con filtros, PDF/Excel y generación histórica no se considera cerrado dentro de la V1 descrita en este documento.

Para V2 debería separarse:

```text
Dashboard
≠
Reporte
```

El Dashboard responde rápidamente al estado actual.

Un reporte debe permitir:

- seleccionar período;
- seleccionar filtros;
- generar un resultado reproducible;
- exportar;
- compartir;
- eventualmente imprimir.

---

# 18. Notificaciones y alertas

Durante la evolución de V1 se han discutido alertas operativas.

No obstante, con el código consolidado revisado hasta el cierre de este documento no debe asumirse que existe todavía un sistema completo de notificaciones remotas/push.

Debe distinguirse:

```text
Alerta dentro de la aplicación
```

de:

```text
Notificación push del servidor
```

Para V2 se plantea un sistema de notificaciones centralizado relacionado con eventos como:

- tratamientos próximos a finalizar;
- controles sanitarios;
- alimentación;
- medicamentos;
- huevos;
- eventos reproductivos;
- vencimientos o tareas configurables.

---

# 19. Estado de cierre de V1

La V1 se cierra conceptualmente como:

> Aplicación móvil local funcional para validar el dominio operativo del criadero antes de migrar a un modelo conectado.

## Casos que deben mantenerse en pruebas

### Instalación limpia

Validar:

```text
V1 → V7
```

y comprobar que:

- la aplicación inicia;
- los catálogos padres existen;
- pueden crearse parámetros;
- pueden crearse jaulas;
- pueden crearse aves;
- puede utilizarse Finanzas.

### Actualización

Validar que una base de versión anterior pueda actualizarse sin eliminar información.

### Navegación

Validar especialmente:

```text
Jaulas → DetalleJaula → DetalleAve
```

y luego:

```text
tab Aves → ListaAves
```

### Backup

Validar:

- crear;
- restaurar;
- compartir;
- datos;
- imágenes nuevas;
- imágenes restauradas;
- segundo backup con imágenes restauradas + imágenes nuevas.

---

# 20. Limitaciones actuales de V1

La primera versión todavía está centrada en un único dispositivo.

Limitaciones estructurales:

- SQLite local;
- sin servidor central;
- sin login real contra backend;
- sin múltiples usuarios sincronizados;
- sin sincronización automática entre dispositivos;
- imágenes almacenadas localmente;
- respaldo manual;
- ausencia de API central de dominio;
- auditoría limitada al dispositivo;
- riesgo de URI histórica inválida cuando cambia el contenedor de la aplicación;
- algunos catálogos todavía poseen estructuras históricas paralelas;
- reportes exportables todavía no constituyen un subsistema completo;
- notificaciones push requieren backend o servicio remoto.

Estas limitaciones son aceptables para una V1 enfocada en validar funcionalidad.

---

# 21. Visión de la V2

V2 debe transformar la aplicación desde:

```text
App móvil local
```

hacia:

```text
App móvil
    ↓
API
    ↓
Servicios de negocio
    ↓
Base central
    ↓
Almacenamiento de imágenes
```

---

# 22. Arquitectura objetivo V2

Una arquitectura propuesta:

```text
React Native / Expo
        │
        │ HTTPS
        ▼
API REST
        │
        ├── Autenticación
        ├── Usuarios
        ├── Criaderos
        ├── Jaulas
        ├── Aves
        ├── Salud
        ├── Alimentación
        ├── Huevos
        ├── Finanzas
        ├── Reportes
        └── Notificaciones
        │
        ▼
Base de datos central
        │
        └── almacenamiento de archivos/imágenes
```

SQLite puede permanecer como almacenamiento local para:

- caché;
- funcionamiento offline;
- datos temporales;
- cola de sincronización.

La API pasa a ser la fuente central cuando la sincronización esté disponible.

---

# 23. Usuarios y seguridad V2

V2 debería introducir:

## Autenticación

- login;
- token de acceso;
- JWT o mecanismo equivalente;
- refresh token si la arquitectura lo requiere;
- expiración de sesión.

## Usuarios

Ejemplos:

```text
Administrador
Operador
Consulta
```

A futuro:

```text
Usuario
   ↓
pertenece a uno o más criaderos
   ↓
tiene roles/permisos
```

## Seguridad

Debe contemplarse:

- HTTPS obligatorio;
- validación de datos en servidor;
- autorización por recurso;
- secretos fuera del repositorio;
- almacenamiento seguro de tokens;
- auditoría;
- control de acceso a imágenes.

---

# 24. Multi-criadero y multiusuario

La evolución natural permite que una cuenta pueda administrar uno o varios criaderos.

Modelo conceptual:

```text
Usuario
   │
   ├── Criadero A
   │      ├── Jaulas
   │      └── Aves
   │
   └── Criadero B
          ├── Jaulas
          └── Aves
```

Todos los registros del servidor deberían incluir una forma de identificar el propietario lógico, por ejemplo:

```text
criaderoId
```

Esto debe definirse antes de migrar los datos de SQLite a la API.

---

# 25. Identificadores en V2

En V1 muchos registros dependen de IDs SQLite locales.

Para V2 se recomienda utilizar identificadores globales para las entidades sincronizadas.

Ejemplo:

```text
UUID
```

Esto facilita:

- trabajo offline;
- sincronización;
- creación desde múltiples dispositivos;
- evitar colisiones.

---

# 26. Sincronización V2

No debe reemplazarse SQLite abruptamente.

Se recomienda una transición:

```text
Fase 1
SQLite local

Fase 2
SQLite + API

Fase 3
API como fuente central
SQLite como caché/offline
```

La sincronización debe controlar como mínimo:

```text
idGlobal
fechaCreacion
fechaActualizacion
estadoSincronizacion
```

Estados potenciales:

```text
SINCRONIZADO
PENDIENTE_CREAR
PENDIENTE_ACTUALIZAR
PENDIENTE_ELIMINAR
ERROR
```

---

# 27. Imágenes en V2

Las imágenes no deberían almacenarse dentro de la base central como Base64 salvo un requerimiento específico.

Modelo recomendado:

```text
App
 ↓
subir archivo
 ↓
Object Storage
 ↓
URL / key
 ↓
Base de datos guarda referencia
```

Opciones tecnológicas podrán evaluarse en V2.

Ejemplos de arquitectura:

- S3 compatible;
- Cloudflare R2;
- Azure Blob Storage;
- almacenamiento equivalente.

La decisión definitiva debe realizarse al diseñar infraestructura y costos de V2.

---

# 28. API V2

La API debe reflejar procesos del dominio y no únicamente tablas.

Ejemplos conceptuales:

```text
POST   /auth/login

GET    /aves
POST   /aves
GET    /aves/{id}
PUT    /aves/{id}

GET    /jaulas
POST   /jaulas
GET    /jaulas/{id}

POST   /jaulas/{id}/alimentaciones
POST   /jaulas/{id}/bebidas
POST   /jaulas/{id}/sanidad

POST   /aves/{id}/diagnosticos
POST   /aves/{id}/tratamientos
POST   /aves/{id}/evoluciones

GET    /finanzas/movimientos
POST   /finanzas/movimientos
GET    /reportes/finanzas

POST   /media
```

Esta lista es orientativa y deberá diseñarse formalmente antes de desarrollo.

---

# 29. Estrategia recomendada para iniciar V2

No comenzar migrando todo al mismo tiempo.

Orden sugerido:

```text
1. Autenticación y usuarios
2. Criaderos / tenants
3. Catálogos
4. Jaulas
5. Aves
6. Imágenes
7. Salud
8. Alimentación / bebida / sanidad
9. Huevos
10. Finanzas
11. Sincronización offline
12. Reportes
13. Notificaciones
```

---

# 30. Uso del proyecto con IA para programación

El proyecto ya tiene suficiente funcionalidad como para que un asistente de programación sea muy útil.

Sin embargo, la IA no debe recibir solamente un prompt del tipo:

> “mejora la aplicación”.

Primero debe conocer:

- arquitectura;
- navegación;
- esquema de datos;
- migraciones;
- reglas de compatibilidad;
- funcionalidades cerradas;
- funcionalidades en pruebas;
- funcionalidades futuras.

Este documento está diseñado precisamente para ser ese contexto inicial.

---

# 31. Integración con Windsurf

Windsurf puede utilizar el repositorio completo como contexto para Cascade.

La integración recomendada no consiste en subir el proyecto manualmente archivo por archivo.

El flujo correcto es:

```text
GitHub
  ↓
repositorio local
  ↓
abrir carpeta en Windsurf
  ↓
indexación del código
  ↓
Cascade
```

Windsurf dispone actualmente de contexto del codebase, Cascade, reglas persistentes, `AGENTS.md`, Workflows, MCP y otras herramientas para trabajar con proyectos completos.

---

# 32. Paso 1 — Tener el repositorio limpio

Antes de abrir el proyecto con Windsurf:

```bash
git status
```

Debe estar claro qué cambios pertenecen a la versión actual.

Después:

```bash
git add .
git commit -m "..."
git push
```

No comenzar una refactorización grande con archivos locales sin versionar.

---

# 33. Paso 2 — Clonar o abrir el proyecto en Windsurf

Si el repositorio ya existe localmente, simplemente puede abrirse la carpeta raíz con Windsurf.

Si se trabajará desde otra máquina:

```bash
git clone <repositorio>
cd <repositorio>
npm install
```

Después abrir esa carpeta en Windsurf.

---

# 34. Paso 3 — Verificar el proyecto antes de pedir cambios

Primera instrucción recomendada para Cascade:

```text
Analiza este repositorio completo antes de modificar código.

Quiero que identifiques:
1. estructura del proyecto;
2. navegación;
3. screens;
4. repositories;
5. database y migraciones;
6. servicios;
7. flujo de imágenes;
8. backup/restauración;
9. dependencias de Expo;
10. posibles zonas críticas.

No modifiques archivos todavía.

Usa CONTEXTO_PROYECTO_CRIADERO_KIKIRIKIS.md como contexto funcional.
Devuélveme primero un mapa técnico del repositorio y cualquier diferencia que encuentres respecto al documento.
```

Esto es importante.

La IA debe validar el documento contra el código real antes de asumir que todo coincide exactamente.

---

# 35. Paso 4 — Guardar este documento dentro del repositorio

Ubicación sugerida:

```text
docs/
└── CONTEXTO_PROYECTO_CRIADERO_KIKIRIKIS.md
```

Otra opción es mantenerlo en la raíz si se desea máxima visibilidad.

---

# 36. Paso 5 — Crear instrucciones permanentes para la IA

Además de este documento, conviene crear un archivo de instrucciones para Cascade.

Windsurf soporta actualmente `AGENTS.md` con instrucciones aplicadas según su ubicación en el proyecto.

Una buena estrategia es colocar:

```text
AGENTS.md
```

en la raíz.

Contenido sugerido:

```markdown
# Reglas del proyecto Criadero Kikirikis

Antes de modificar código:
- revisar CONTEXTO_PROYECTO_CRIADERO_KIKIRIKIS.md;
- inspeccionar los archivos reales afectados;
- no asumir nombres de tablas, rutas o pantallas;
- no eliminar funcionalidades existentes para simplificar un cambio;
- no modificar migraciones históricas ya aplicadas;
- toda modificación de esquema debe crear una migración nueva;
- mantener compatibilidad con bases existentes;
- preservar el funcionamiento actual de backup/restauración;
- preservar navegación raíz de los tabs;
- tratar rutas de imágenes con cuidado;
- no almacenar secretos en el repositorio;
- explicar qué archivos serán modificados antes de cambios grandes;
- después de modificar, ejecutar las validaciones disponibles.
```

También pueden utilizarse reglas persistentes de Windsurf para convenciones globales o del workspace.

---

# 37. Paso 6 — No permitir que la IA reescriba migraciones antiguas

Regla crítica:

```text
migrationV1
migrationV2
...
migrationV7
```

una vez aplicadas deben tratarse como historial.

Si V2 requiere una columna nueva:

```text
NO editar migrationV4
```

Crear:

```text
migrationV8
```

o la versión correspondiente.

Esto evita que una instalación existente y una instalación limpia terminen con esquemas diferentes.

---

# 38. Paso 7 — Trabajar por tareas pequeñas

Ejemplo incorrecto:

```text
Convierte toda mi aplicación en cliente-servidor.
```

Ejemplo correcto:

```text
Analiza cómo se obtiene actualmente la lista de aves.
Diseña una interfaz de repositorio que permita mantener SQLite hoy y usar API más adelante.
No cambies todavía ninguna pantalla.
```

Después:

```text
Implementa solamente esa interfaz y adapta AvesRepository.
```

Después:

```text
Ejecuta las comprobaciones y muéstrame el diff.
```

La IA funciona mejor cuando el trabajo grande se divide en fases verificables.

---

# 39. Paso 8 — Usar Git como mecanismo de seguridad

Cada cambio significativo debe vivir en una rama.

Ejemplo:

```bash
git checkout -b feature/api-auth
```

Luego:

```text
IA modifica
   ↓
revisión
   ↓
prueba
   ↓
commit
```

No utilizar Cascade como sustituto del control de versiones.

---

# 40. Paso 9 — Proteger archivos críticos

Archivos/áreas que deben revisarse con especial cuidado:

```text
database/sqlite.js
database/migration*.js
database/seeders.js
repositories/BackupRepository.js
services/ImageService.js
navigation/AppNavigator.js
app.json
```

Una modificación en estos archivos puede afectar toda la aplicación.

---

# 41. Paso 10 — Proteger secretos

Antes de V2 deberá existir una política clara.

Nunca versionar:

```text
passwords
JWT secrets
API keys privadas
tokens
credenciales de base
service account credentials
```

Usar variables de entorno y mecanismos adecuados para Expo/EAS y backend.

También debe configurarse `.gitignore` y, cuando corresponda, reglas de exclusión para la indexación de IA.

---

# 42. Paso 11 — Ejecutar validaciones después de cada tarea

Como mínimo:

```bash
npm install
npx expo start -c
```

Cuando corresponda:

```bash
npx expo install --check
```

Y antes de release:

```bash
npx eas-cli@latest build -p android --profile preview
```

Debe probarse en un dispositivo real.

---

# 43. Paso 12 — Utilizar Cascade para análisis de impacto

Prompt recomendado:

```text
Antes de realizar este cambio, identifica todas las pantallas, repositories, tablas,
migraciones y rutas de navegación que dependen de esta funcionalidad.

No modifiques código todavía.

Quiero primero un análisis de impacto y un plan.
```

Esto es especialmente útil para:

- aves;
- jaulas;
- baja/venta;
- finanzas;
- salud;
- backup;
- migraciones.

---

# 44. Paso 13 — Uso opcional de Workflows y Hooks de Windsurf

Windsurf permite crear Workflows reutilizables y Hooks.

Puede aprovecharse posteriormente para tareas como:

```text
/validar-release
/revisar-migraciones
/revisar-backup
/build-preview
```

Un Hook del workspace también puede ejecutar validaciones automáticas después de cambios realizados por Cascade.

Ejemplo conceptual:

```text
Cascade modifica JS
   ↓
post_write_code
   ↓
formatter / lint / pruebas
```

No es obligatorio para comenzar.

Primero se recomienda trabajar con:

```text
repositorio
+ contexto
+ AGENTS.md
+ Git
+ tareas pequeñas
```

---

# 45. Paso 14 — MCP en una etapa posterior

Windsurf también soporta Model Context Protocol.

MCP podría utilizarse después para conectar herramientas adicionales.

Ejemplos futuros:

- GitHub;
- base de datos de desarrollo;
- documentación interna;
- servicios de observabilidad;
- herramientas de testing.

No es necesario configurar MCP para empezar con el proyecto.

---

# 46. Flujo recomendado de trabajo diario con Windsurf

```text
1. git pull
2. abrir Windsurf
3. seleccionar tarea
4. pedir análisis de impacto
5. revisar plan
6. permitir modificación
7. revisar diff
8. ejecutar app
9. probar en Android
10. commit
11. push
```

---

# 47. Prompt maestro inicial para Windsurf

Copiar como primer mensaje relevante en Cascade:

```text
Estamos trabajando en Criadero Kikirikis, una aplicación móvil React Native + Expo
para administrar un criadero de aves.

Lee primero:
docs/CONTEXTO_PROYECTO_CRIADERO_KIKIRIKIS.md

Después analiza el repositorio real.

Reglas:
- No modifiques código todavía.
- No asumas que el documento reemplaza al código real.
- Identifica diferencias entre documentación y código.
- Respeta la arquitectura existente.
- No elimines funcionalidades para simplificar.
- No modifiques migraciones históricas.
- Cualquier cambio nuevo de SQLite debe ir en una migración nueva.
- Conserva compatibilidad con instalaciones existentes.
- Protege especialmente backup/restauración, imágenes y navegación.
- Antes de cada cambio grande presenta un análisis de impacto.
- Después de modificar código revisa el diff y ejecuta las comprobaciones posibles.

Primera tarea:
genera un mapa técnico del proyecto mostrando screens, navigation, repositories,
database, services y sus relaciones principales.
```

---

# 48. Prompt recomendado para cada nueva funcionalidad

```text
Necesito implementar: <REQUERIMIENTO>.

Antes de programar:

1. Busca todos los archivos relacionados.
2. Explica cómo funciona actualmente.
3. Identifica qué tablas y migraciones intervienen.
4. Identifica navegación afectada.
5. Identifica riesgos de compatibilidad.
6. Propón el cambio mínimo necesario.
7. No modifiques código hasta terminar el análisis.

Después de aprobar el plan, implementa el cambio sin eliminar funcionalidades existentes.
```

---

# 49. Prompt recomendado para corregir bugs

```text
Tenemos este problema:

<DESCRIPCIÓN + LOG>

No intentes solucionarlo todavía.

Primero:
- localiza el flujo exacto;
- identifica el punto de fallo;
- diferencia causa de síntoma;
- revisa cambios recientes;
- identifica impacto en datos existentes.

Después propón una corrección mínima y compatible.
```

---

# 50. Qué no debe hacer la IA

No permitir instrucciones generales como:

```text
reescribe todo
moderniza todo
cambia toda la base
simplifica la arquitectura
```

sin un análisis previo.

Especialmente evitar:

- reemplazar SQLite sin estrategia de migración;
- cambiar nombres de pantallas sin revisar navegación;
- editar migraciones antiguas;
- borrar columnas;
- cambiar `foto_uri` sin considerar archivos físicos;
- modificar formato de backup sin compatibilidad;
- reemplazar repositories completos por implementaciones parciales;
- agregar dependencias innecesarias;
- modificar `app.json` eliminando plugins existentes;
- exponer secretos.

---

# 51. Principios técnicos a mantener

## Compatibilidad

Toda mejora debe considerar datos existentes.

## Migraciones incrementales

Nunca asumir una instalación nueva.

## Trazabilidad

No perder información histórica valiosa.

## Parametrización

Evitar valores rígidos cuando el negocio puede configurarlos.

## Separación

Mantener UI, persistencia y servicios separados.

## Offline first

Mientras V2 no esté finalizada, la aplicación debe continuar funcionando localmente.

## API gradual

La integración con backend debe incorporarse módulo por módulo.

## Seguridad

No confiar únicamente en validaciones del cliente cuando exista API.

---

# 52. Roadmap sugerido

## V1 — actual

```text
Aplicación móvil local
SQLite
gestión completa básica
backup
imágenes locales
finanzas
parámetros
pruebas
```

## V1.x

```text
estabilización
corrección de bugs
pruebas de instalación
pruebas de backup
mejoras UX
```

## V2.0

```text
usuarios
autenticación
API
base central
almacenamiento remoto de imágenes
criaderos
sincronización inicial
```

## V2.x

```text
roles
multiusuario
multi-criadero
notificaciones
reportes
exportación
sincronización offline robusta
auditoría
```

---

# 53. Criterio de cierre técnico de V1

Antes de declarar V1 estable deben pasar al menos estos escenarios:

```text
[ ] instalación limpia
[ ] migración hasta versión actual
[ ] creación de parámetros
[ ] creación de jaula
[ ] creación de ave
[ ] fotografía nueva
[ ] navegación cruzada Jaula → Ave
[ ] tab Aves regresa a ListaAves
[ ] alimentación
[ ] bebida
[ ] sanidad
[ ] salud/tratamientos
[ ] huevos
[ ] genealogía
[ ] evolución
[ ] baja
[ ] finanzas
[ ] backup de datos
[ ] backup de imágenes nuevas
[ ] restauración
[ ] segundo backup después de restauración
[ ] compartir respaldo
[ ] build Android preview
```

---

# 54. Conclusión

Criadero Kikirikis ya superó la etapa de prototipo puramente visual.

V1 representa un modelo funcional real del negocio:

```text
Parámetros
   ↓
Jaulas ↔ Aves
   ↓       ↓
Comida   Salud
Bebida   Evolución
Sanidad  Genealogía
          Huevos
          Bajas
            ↓
         Finanzas
```

El siguiente salto no debería ser reescribir la aplicación.

Debe ser conservar el dominio validado y agregar gradualmente:

```text
usuarios
API
servidor
sincronización
almacenamiento remoto
notificaciones
reportes
```

Windsurf puede utilizarse como acelerador de este proceso siempre que el repositorio, este documento, Git y reglas de proyecto se conviertan en la fuente de contexto antes de cada cambio.

---

## Nota de mantenimiento de este documento

Actualizar este archivo cuando ocurra cualquiera de los siguientes eventos:

- nueva migración;
- nuevo módulo;
- cambio importante de navegación;
- nueva integración;
- cambio de arquitectura;
- introducción de API;
- cambio de estrategia de sincronización;
- cambio en almacenamiento de imágenes;
- cierre de una versión.

Este documento debe evolucionar junto con el código y no convertirse en una fotografía obsoleta del proyecto.
