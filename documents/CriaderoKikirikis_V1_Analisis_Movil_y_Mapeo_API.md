# Criadero Kikirikis — Análisis de V1 (móvil) y mapeo a la API V2

Este documento conserva el análisis completo de la aplicación móvil V1 (modelos locales, repositorios, pantallas, lógica de negocio) y el mapeo de cada repositorio hacia endpoints de la API V2. Su contenido principal es el **Anexo B del cierre de traspaso**, reproducido literalmente más abajo, sin reescribir.

Fuente: `documents/traspaso/CIERRE_FINAL_TRASPASO_CRIADERO_KIKIRIKIS_V2.md`, Anexo B (líneas 3810 al final), análisis elaborado por Devin el 12 de octubre de 2026.

## Decisión arquitectónica posterior

El análisis que sigue se redactó **antes** de la decisión oficial de V2 (online-first: D1 es la fuente de verdad de datos, R2 de imágenes, sin sincronización). Por eso, **NO forman parte del alcance actual** las siguientes recomendaciones que aparecen en el texto original:

- Mantener SQLite como caché offline de la app móvil.
- La sincronización bidireccional SQLite ↔ D1 con resolución de conflictos.
- Agregar `user_id` a todas las tablas de negocio. La propiedad se resuelve con `entidad.criadero_id -> criaderos.user_id`; no se duplica `user_id` salvo necesidad técnica documentada.
- Migrar `BackupRepository`. Su destino (descartarlo, reemplazarlo por un respaldo del lado del servidor o mantenerlo para la V1 hasta su retiro) queda como **decisión abierta**.

Siguen **vigentes**: la descripción de V1 (tablas, campos, estados, reglas, pantallas, repositorios y su lógica) y el mapeo repositorio → endpoint, con estos matices:

- El código real de V1 prevalece sobre este análisis si hay diferencias. Todo detalle que vaya a convertirse en endpoint o en migración debe confirmarse en el código y recogerse en una spec de `documents/specs/`.
- Las referencias a tablas "locales" son del esquema SQLite de V1; el esquema D1 real vigente está en `documents/V2_MODELO_DATOS.md`.
- El texto original menciona el valor `HEMRA`; debe verificarse en el código de V1 si es un error real antes de corregirlo.
- Las decisiones vigentes están en `documents/traspaso/` y en `CLAUDE.md`; ver `documents/README.md` para el orden de autoridad.

---

# ANEXO B — ANÁLISIS COMPLETO DE V1 COMPARTIDO POR DEVIN

A continuación se conserva literalmente el análisis disponible. Sus secciones finales sobre offline sync están desactualizadas; la descripción funcional sigue vigente.

---

Voy a compilar el análisis completo de la aplicación móvil actual.

# ANÁLISIS COMPLETO - APLICACIÓN MÓVIL CRIADERO KIKIRIKIS V1

## 1. ENTIDADES/MODELOS LOCALES EXISTENTES

### Tablas Principales (V1 - SQLite Local)

| Entidad | Descripción |
|---------|-------------|
| **aves** | Registro individual de cada ave |
| **jaulas** | Contenedores físicos para aves |
| **huevos** | Registro de huevos producidos |
| **catalogos** | Definición de catálogos parametrizables |
| **catalogo_items** | Items dentro de cada catálogo |
| **diagnosticos_ave** | Diagnósticos de salud |
| **tratamientos_ave** | Tratamientos médicos |
| **bajas_ave** | Salidas (muerte/venta) |
| **movimientos_financieros** | Ingresos/egresos |
| **ave_evolucion** | Historial de crecimiento físico |
| **ave_historial** | Historial de eventos del ave |
| **jaula_historial** | Historial de eventos de jaula |
| **alimentacion_jaula** | Registro de alimentación |
| **bebida_jaula** | Registro de bebida |
| **sanidad_jaula** | Registro de sanidad |
| **movimientos_financieros_historial** | Auditoría de movimientos |

---

## 2. TABLAS LOCALES Y CAMPOS (V7 Actual)

### **aves**
```
- id (INTEGER PK AUTOINCREMENT)
- codigo (TEXT UNIQUE)
- origen (TEXT) - NACIDA_CRIADERO | COMPRADA
- fecha_nacimiento (TEXT)
- edad_meses_compra (INTEGER)
- fecha_ingreso (TEXT)
- criadero_origen (TEXT)
- metodo_envio (TEXT)
- raza (TEXT)
- sexo (TEXT) - MACHO | HEMRA
- peso_gramos (REAL)
- altura_cm (REAL)
- largo_cm (REAL)
- caracteristicas (TEXT)
- foto_uri (TEXT)
- padre_id (INTEGER FK → aves)
- madre_id (INTEGER FK → aves)
- jaula_actual_id (INTEGER FK → jaulas)
- estado (TEXT) - ACTIVA | VENDIDA | FALLECIDA
- estado_salud (TEXT) - SANA | EN_TRATAMIENTO | ENFERMA
- fecha_ultimo_control_salud (TEXT)
- fecha_creacion (TEXT)
- fecha_actualizacion (TEXT)
```

### **jaulas**
```
- id (INTEGER PK AUTOINCREMENT)
- codigo (TEXT UNIQUE)
- nombre (TEXT)
- ubicacion (TEXT)
- tipo (TEXT)
- estado_sanitario (TEXT) - NORMAL | LIMPIEZA | FUMIGACION | QUEMADURA | CUARENTENA
- activa (INTEGER) - 0 | 1
- fecha_creacion (TEXT)
- fecha_actualizacion (TEXT)
- fecha_desactivacion (TEXT)
```

### **huevos**
```
- id (INTEGER PK AUTOINCREMENT)
- codigo (TEXT UNIQUE)
- ave_id (INTEGER FK → aves)
- jaula_id (INTEGER FK → jaulas)
- fecha (TEXT)
- estado (TEXT) - REGISTRADO
- observacion (TEXT)
- fecha_creacion (TEXT)
```

### **catalogos**
```
- id (INTEGER PK AUTOINCREMENT)
- codigo (TEXT UNIQUE) - RAZAS, SEXOS, ENFERMEDADES, MEDICAMENTOS, ALIMENTOS, BEBIDAS, CATEGORIAS_FINANCIERAS
- nombre (TEXT)
- activo (INTEGER)
- fecha_creacion (TEXT)
```

### **catalogo_items**
```
- id (INTEGER PK AUTOINCREMENT)
- catalogo_id (INTEGER FK → catalogos)
- codigo (TEXT)
- nombre (TEXT)
- descripcion (TEXT)
- activo (INTEGER)
- orden (INTEGER)
- fecha_creacion (TEXT)
UNIQUE(catalogo_id, codigo)
```

### **diagnosticos_ave**
```
- id (INTEGER PK AUTOINCREMENT)
- ave_id (INTEGER FK → aves)
- fecha (TEXT)
- enfermedad (TEXT)
- sintomas (TEXT)
- observacion (TEXT)
- estado (TEXT) - ACTIVO
- fecha_creacion (TEXT)
FK → aves ON DELETE CASCADE
```

### **tratamientos_ave**
```
- id (INTEGER PK AUTOINCREMENT)
- diagnostico_id (INTEGER FK → diagnosticos_ave)
- ave_id (INTEGER FK → aves)
- fecha (TEXT)
- medicamento (TEXT)
- dosis (TEXT)
- observacion (TEXT)
- fecha_creacion (TEXT)
FK → aves ON DELETE CASCADE
```

### **bajas_ave**
```
- id (INTEGER PK AUTOINCREMENT)
- ave_id (INTEGER FK → aves)
- tipo (TEXT) - MUERTE | VENTA
- fecha (TEXT)
- causa (TEXT)
- celular (TEXT)
- ciudad_destino (TEXT)
- cooperativa_envio (TEXT)
- comprador (TEXT)
- valor_venta (REAL)
- valor_envio (REAL)
- detalle (TEXT)
- fecha_creacion (TEXT)
```

### **movimientos_financieros**
```
- id (INTEGER PK AUTOINCREMENT)
- tipo (TEXT) - INGRESO | EGRESO
- categoria (TEXT)
- fecha (TEXT)
- valor (REAL)
- detalle (TEXT)
- ave_id (INTEGER FK → aves)
- origen_tipo (TEXT) - MANUAL | VENTA_AVE
- origen_id (INTEGER)
- fecha_creacion (TEXT)
```

### **ave_evolucion**
```
- id (INTEGER PK AUTOINCREMENT)
- ave_id (INTEGER FK → aves)
- fecha (TEXT)
- foto_uri (TEXT)
- peso_gramos (REAL)
- altura_cm (REAL)
- largo_cm (REAL)
- caracteristicas (TEXT)
- observacion (TEXT)
- fecha_creacion (TEXT)
FK → aves ON DELETE CASCADE
```

### **ave_historial**
```
- id (INTEGER PK AUTOINCREMENT)
- ave_id (INTEGER FK → aves)
- jaula_id (INTEGER FK → jaulas)
- tipo_evento (TEXT) - ALTA | CAMBIO_JAULA | SALUD | POSTURA_HUEVO | EVOLUCION | VENTA | MUERTE
- fecha (TEXT)
- detalle (TEXT)
- fecha_creacion (TEXT)
FK → aves ON DELETE CASCADE
```

### **jaula_historial**
```
- id (INTEGER PK AUTOINCREMENT)
- jaula_id (INTEGER FK → jaulas)
- ave_id (INTEGER FK → aves)
- tipo_evento (TEXT) - INGRESO_AVE | SALIDA_AVE | ALIMENTACION | BEBIDA | SANIDAD
- fecha (TEXT)
- detalle (TEXT)
- fecha_creacion (TEXT)
FK → jaulas ON DELETE CASCADE
```

### **alimentacion_jaula**
```
- id (INTEGER PK AUTOINCREMENT)
- jaula_id (INTEGER FK → jaulas)
- fecha (TEXT)
- tipo (TEXT)
- cantidad (TEXT)
- detalle (TEXT)
- fecha_creacion (TEXT)
FK → jaulas ON DELETE CASCADE
```

### **bebida_jaula**
```
- id (INTEGER PK AUTOINCREMENT)
- jaula_id (INTEGER FK → jaulas)
- fecha (TEXT)
- tipo (TEXT)
- cantidad (TEXT)
- detalle (TEXT)
- fecha_creacion (TEXT)
FK → jaulas ON DELETE CASCADE
```

### **sanidad_jaula**
```
- id (INTEGER PK AUTOINCREMENT)
- jaula_id (INTEGER FK → jaulas)
- fecha (TEXT)
- tipo (TEXT)
- detalle (TEXT)
- fecha_creacion (TEXT)
FK → jaulas ON DELETE CASCADE
```

### **movimientos_financieros_historial**
```
- id (INTEGER PK AUTOINCREMENT)
- movimiento_id (INTEGER FK → movimientos_financieros)
- fecha (TEXT)
- accion (TEXT) - EDICION_MANUAL | CREACION_POR_CORRECCION | CORRECCION_VENTA | CORRECCION_ENVIO
- tipo_anterior (TEXT)
- tipo_nuevo (TEXT)
- categoria_anterior (TEXT)
- categoria_nueva (TEXT)
- fecha_movimiento_anterior (TEXT)
- fecha_movimiento_nueva (TEXT)
- valor_anterior (REAL)
- valor_nuevo (REAL)
- detalle_anterior (TEXT)
- detalle_nuevo (TEXT)
- origen_tipo (TEXT)
- origen_id (INTEGER)
```

---

## 3. RELACIONES ENTRE ENTIDADES

```
aves
  ├─ padre_id → aves (auto-referencia)
  ├─ madre_id → aves (auto-referencia)
  ├─ jaula_actual_id → jaulas
  ├─ ave_evolucion (1:N)
  ├─ ave_historial (1:N)
  ├─ diagnosticos_ave (1:N)
  ├─ tratamientos_ave (1:N)
  ├─ bajas_ave (1:N)
  ├─ huevos (1:N)
  └─ movimientos_financieros (1:N)

jaulas
  ├─ aves (N:1 via jaula_actual_id)
  ├─ jaula_historial (1:N)
  ├─ alimentacion_jaula (1:N)
  ├─ bebida_jaula (1:N)
  ├─ sanidad_jaula (1:N)
  └─ huevos (N:1 via jaula_id)

catalogos
  └─ catalogo_items (1:N)

diagnosticos_ave
  ├─ ave_id → aves
  └─ tratamientos_ave (1:N)

tratamientos_ave
  ├─ diagnostico_id → diagnosticos_ave
  └─ ave_id → aves

bajas_ave
  └─ ave_id → aves

movimientos_financieros
  ├─ ave_id → aves
  └─ movimientos_financieros_historial (1:N)
```

---

## 4. REPOSITORIOS/CONECTORES LOCALES EXISTENTES

| Repositorio | Archivo | Función Principal |
|-------------|---------|-------------------|
| **AveRepository** | AveRepository.js | CRUD aves, asignación jaulas, validación padres |
| **JaulaRepository** | JaulaRepository.js | CRUD jaulas, historial, desactivación |
| **HuevoRepository** | HuevoRepository.js | Registro huevos, estadísticas producción |
| **FinanzasRepository** | FinanzasRepository.js | Movimientos financieros, resúmenes, correcciones |
| **SaludRepository** | SaludRepository.js | Diagnósticos, tratamientos, estado salud |
| **BajaAveRepository** | BajaAveRepository.js | Muerte y venta de aves |
| **AlimentacionRepository** | AlimentacionRepository.js | Registro alimentación jaulas |
| **BebidaRepository** | BebidaRepository.js | Registro bebida jaulas |
| **SanidadJaulaRepository** | SanidadJaulaRepository.js | Registro sanidad jaulas |
| **EvolucionAveRepository** | EvolucionAveRepository.js | Historial evolución física |
| **GenealogiaRepository** | GenealogiaRepository.js | Árbol genealógico (padres/descendientes) |
| **CicloVidaRepository** | CicloVidaRepository.js | Timeline completo de vida del ave |
| **HistorialRepository** | HistorialRepository.js | Eventos jaulas |
| **ConfiguracionRepository** | ConfiguracionRepository.js | Catálogos e items |
| **ClientesRepository** | ClientesRepository.js | Gestión de compradores (derivado de ventas) |
| **DashboardRepository** | DashboardRepository.js | Métricas de inicio |
| **ProduccionRepository** | ProduccionRepository.js | Análisis de producción de huevos |
| **AlertasRepository** | AlertasRepository.js | Alertas internas de la app |
| **ReportesRepository** | ReportesRepository.js | Exportación de datos |
| **BackupRepository** | BackupRepository.js | Backup/restore SQLite e imágenes |
| **EstadoSaludRepository** | (NO EXISTE - pantalla mal nombrada) | - |
| **ProduccionRepository** | ProduccionRepository.js | Ya listado |

---

## 5. QUÉ PANTALLA USA CADA REPOSITORIO

| Pantalla | Repositorios Usados |
|----------|-------------------|
| **InicioScreen** | DashboardRepository, AlertasRepository |
| **AvesScreen** | AveRepository |
| **NuevaAveScreen** | AveRepository, ImageService |
| **DetalleAveScreen** | AveRepository, GenealogiaRepository, CicloVidaRepository, EvolucionAveRepository, SaludRepository, HuevoRepository, BajaAveRepository |
| **JaulasScreen** | JaulaRepository |
| **NuevaJaulaScreen** | JaulaRepository |
| **DetalleJaulaScreen** | JaulaRepository, AveRepository, HistorialRepository |
| **DetalleJaulaInactivaScreen** | JaulaRepository |
| **AlimentacionJaulaScreen** | AlimentacionRepository, ConfiguracionRepository |
| **BebidaJaulaScreen** | BebidaRepository, ConfiguracionRepository |
| **SanidadJaulaScreen** | SanidadJaulaRepository |
| **HistorialJaulaScreen** | HistorialRepository |
| **SeleccionarAveJaulaScreen** | AveRepository |
| **SaludAveScreen** | SaludRepository |
| **EvolucionAveScreen** | EvolucionAveRepository |
| **GenealogiaAveScreen** | GenealogiaRepository |
| **CicloVidaAveScreen** | CicloVidaRepository |
| **RegistrarHuevoScreen** | HuevoRepository |
| **ProduccionHuevosScreen** | HuevoRepository, ProduccionRepository |
| **BajaAveScreen** | BajaAveRepository |
| **FinanzasScreen** | FinanzasRepository |
| **NuevoMovimientoFinancieroScreen** | FinanzasRepository, ConfiguracionRepository |
| **EditarMovimientoFinancieroScreen** | FinanzasRepository |
| **ClientesScreen** | ClientesRepository |
| **DetalleClienteScreen** | ClientesRepository |
| **CatalogoScreen** | ConfiguracionRepository |
| **EditarCatalogoItemScreen** | ConfiguracionRepository |
| **AlertasScreen** | AlertasRepository |
| **ReportesScreen** | ReportesRepository |
| **ConfiguracionScreen** | - |
| **BackupScreen** | BackupRepository, ImageService |
| **MasMenuScreen** | - |

---

## 6. OPERACIONES DE CADA CONECTOR

### **AveRepository**
- ✅ **Crear**: `crearAve()` - con validación padres, registro inicial evolución, historial
- ✅ **Consultar**: `obtenerAves()`, `obtenerAvePorId()`, `obtenerAvesPorJaula()`, `obtenerAvesParaAsignarJaula()`, `obtenerAvesActivasParaPadres()`
- ✅ **Actualizar**: `actualizarAve()` - con validación padres, código duplicado
- ❌ **Eliminar**: NO existe (se usa baja)
- ✅ **Validar**: `existeAvePorCodigo()`, `validarRelacionPadres()`

### **JaulaRepository**
- ✅ **Crear**: `crearJaula()`
- ✅ **Consultar**: `obtenerJaulas()`, `obtenerJaulasInactivas()`, `obtenerJaulaPorId()`, `obtenerAvesHistoricasJaula()`, `obtenerHistorialCompletoJaula()`
- ✅ **Actualizar**: `actualizarJaula()`
- ✅ **Eliminar (soft)**: `desactivarJaula()` - libera aves, registra historial

### **HuevoRepository**
- ✅ **Crear**: `registrarHuevo()` - genera código, registra historial ave
- ✅ **Consultar**: `obtenerHuevosAve()`, `obtenerProduccionHuevos()`, `obtenerTopPonedoras()`, `obtenerProduccionPorDia()`, `obtenerProduccionPorHora()`, `obtenerProduccionPorJaula()`
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **FinanzasRepository**
- ✅ **Crear**: `registrarIngreso()`, `registrarEgreso()`
- ✅ **Consultar**: `obtenerResumenFinanciero()`, `obtenerMovimientosFinancieros()`, `obtenerIngresos()`, `obtenerEgresos()`, `obtenerMovimientoPorId()`, `obtenerVentaPorBajaId()`, `obtenerConsolidadoCategorias()`, `obtenerConsolidadoMensual()`
- ✅ **Actualizar**: `actualizarMovimientoManual()`, `corregirVentaFinanciera()`
- ❌ **Eliminar**: NO existe (usa soft delete por inactividad)

### **SaludRepository**
- ✅ **Crear**: `registrarDiagnostico()` - con tratamiento opcional, actualiza estado ave
- ✅ **Consultar**: `obtenerEnfermedades()`, `obtenerMedicamentos()`, `obtenerHistorialSaludAve()`
- ✅ **Actualizar**: `actualizarEstadoSaludAve()`
- ❌ **Eliminar**: NO existe

### **BajaAveRepository**
- ✅ **Crear**: `registrarMuerteAve()`, `registrarVentaAve()` - actualiza estado ave, genera movimientos financieros
- ✅ **Consultar**: `obtenerBajasAve()`
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **AlimentacionRepository**
- ✅ **Crear**: `registrarAlimentacion()` - registra historial jaula
- ✅ **Consultar**: `obtenerTiposAlimentos()`, `obtenerAlimentacionJaula()`
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **BebidaRepository**
- ✅ **Crear**: `registrarBebida()` - registra historial jaula
- ✅ **Consultar**: `obtenerTiposBebidas()`
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **SanidadJaulaRepository**
- ✅ **Crear**: `registrarSanidadJaula()` - actualiza estado sanitario jaula, registra historial
- ❌ **Consultar**: NO existe (usa JaulaRepository)
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **EvolucionAveRepository**
- ✅ **Crear**: `registrarEvolucionAve()` - actualiza ave actual, registra evolución, historial
- ✅ **Consultar**: `obtenerEvolucionAve()`
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **GenealogiaRepository**
- ❌ **Crear**: NO existe (los padres se asignan en AveRepository)
- ✅ **Consultar**: `obtenerGenealogiaAve()` - ancestros, descendientes, detección circular
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **CicloVidaRepository**
- ✅ **Crear**: `registrarEventoCicloVida()`
- ✅ **Consultar**: `obtenerCicloVidaAve()` - timeline completo
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **HistorialRepository**
- ✅ **Crear**: `registrarHistorialJaula()`
- ✅ **Consultar**: `obtenerHistorialJaula()`
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **ConfiguracionRepository**
- ✅ **Crear**: `crearItemCatalogo()`
- ✅ **Consultar**: `obtenerCatalogos()`, `obtenerCatalogoPorCodigo()`, `obtenerItemsCatalogo()`
- ✅ **Actualizar**: `actualizarItemCatalogo()`
- ✅ **Eliminar (soft)**: `eliminarItemCatalogo()` - marca activo=0

### **ClientesRepository**
- ❌ **Crear**: NO existe (clientes se derivan de ventas)
- ✅ **Consultar**: `obtenerClientes()`, `obtenerClientePorCelular()`, `obtenerComprasCliente()`
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **DashboardRepository**
- ❌ **Crear**: NO existe
- ✅ **Consultar**: `obtenerDashboard()` - métricas agregadas
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **ProduccionRepository**
- ❌ **Crear**: NO existe
- ✅ **Consultar**: `obtenerResumenProduccion()`, `obtenerRankingPonedoras()`, `obtenerProduccionPorDia()`, `obtenerProduccionPorJaula()`, `obtenerProduccionPorAve()`
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **AlertasRepository**
- ❌ **Crear**: NO existe (se calculan dinámicamente)
- ✅ **Consultar**: `obtenerAlertasSalud()`, `obtenerAlertasJaulas()`, `obtenerAlertasProduccion()`, `obtenerAlertasFinanzas()`, `obtenerTodasLasAlertas()`, `obtenerResumenAlertas()`
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **ReportesRepository**
- ❌ **Crear**: NO existe
- ✅ **Consultar**: `obtenerReporteAves()`, `obtenerReporteSalud()`, `obtenerReporteProduccion()`, `obtenerReporteFinanzas()`, `obtenerExportacionAves()`, `obtenerExportacionVentas()`, `obtenerExportacionClientes()`, `obtenerExportacionFinanzas()`, `obtenerExportacionHuevos()`, `obtenerExportacionJaulas()`
- ❌ **Actualizar**: NO existe
- ❌ **Eliminar**: NO existe

### **BackupRepository**
- ✅ **Crear**: backup SQLite, backup imágenes
- ✅ **Consultar**: NO existe (exporta datos)
- ✅ **Actualizar**: restore SQLite, restore imágenes
- ❌ **Eliminar**: NO existe

---

## 7. CÓMO FUNCIONA ACTUALMENTE EL USUARIO/LOGIN

**V1 NO TIENE USUARIO NI LOGIN.**

- La aplicación es **local-only** sin autenticación
- No existe tabla `users` en V1
- No existe concepto de sesión
- No existe autenticación
- No existe autorización
- No existe multi-tenancy
- Es una aplicación de **un solo criadero por dispositivo**

---

## 8. QUÉ DATOS SE GUARDAN ACTUALMENTE POR CRIADERO

**V1 NO TIENE CONCEPTO DE CRIADERO.**

La aplicación asume un único criadero local. Todos los datos son globales:
- Todas las aves
- Todas las jaulas
- Todos los huevos
- Toda la producción
- Todos los movimientos financieros
- Todos los catálogos

---

## 9. QUÉ INFORMACIÓN SE MANEJA DE CADA AVE INDIVIDUAL

### Datos básicos
- Código único
- Origen (NACIDA_CRIADERO | COMPRADA)
- Fecha nacimiento o cálculo desde edad compra
- Fecha ingreso
- Criadero origen (si comprada)
- Método envío (si comprada)
- Raza
- Sexo
- Peso, altura, largo
- Características
- Foto (URI local)

### Relaciones
- Padre (id)
- Madre (id)
- Jaula actual

### Estado
- Estado (ACTIVA | VENDIDA | FALLECIDA)
- Estado salud (SANA | EN_TRATAMIENTO | ENFERMA)
- Fecha último control salud

### Historial
- **Evolución física**: peso, altura, largo, foto, características en timeline
- **Salud**: diagnósticos, síntomas, observaciones, tratamientos
- **Producción**: huevos registrados
- **Genealogía**: ancestros y descendientes hasta 4 generaciones
- **Ciclo de vida**: timeline completo de eventos (alta, cambios jaula, salud, evolución, huevos, venta, muerte)

---

## 10. QUÉ LÓGICA EXISTE PARA JAULAS

### Gestión
- CRUD de jaulas
- Código único
- Ubicación, tipo
- Estado sanitario (NORMAL | LIMPIEZA | FUMIGACION | QUEMADURA | CUARENTENA)
- Activación/desactivación (soft delete)
- Fecha desactivación

### Relación con aves
- Una jaula puede tener múltiples aves
- Una ave pertenece a una jaula (o ninguna)
- Al desactivar jaula: libera aves, registra historial

### Historial
- Eventos: INGRESO_AVE, SALIDA_AVE, ALIMENTACION, BEBIDA, SANIDAD
- Registro de aves históricas que pasaron por la jaula

### Cuidados
- Alimentación: tipo, cantidad, detalle, fecha
- Bebida: tipo, cantidad, detalle, fecha
- Sanidad: tipo, detalle, fecha - actualiza estado sanitario

---

## 11. QUÉ LÓGICA EXISTE PARA TRATAMIENTOS, ENFERMEDADES, MEDICAMENTOS

### Diagnósticos
- Enfermedad (de catálogo ENFERMEDADES)
- Síntomas
- Observación
- Estado (ACTIVO)
- Fecha

### Tratamientos
- Asociados a diagnóstico
- Medicamento (de catálogo MEDICAMENTOS)
- Dosis
- Observación
- Fecha

### Estado del ave
- Al registrar diagnóstico: `estado_salud = EN_TRATAMIENTO`
- Actualiza `fecha_ultimo_control_salud`
- Registro en `ave_historial` tipo SALUD

### Catálogos
- ENFERMEDADES: Coccidia, Coriza, Gripe, Otro
- MEDICAMENTOS: Vitamina, Antibiótico, Antiparasitario, Otro

---

## 12. QUÉ LÓGICA EXISTE PARA FINANZAS

### Movimientos
- Tipo: INGRESO | EGRESO
- Categoría (de catálogo CATEGORIAS_FINANCIERAS)
- Fecha
- Valor (REAL)
- Detalle
- Ave asociada (opcional)
- Origen: MANUAL | VENTA_AVE

### Categorías financieras
- VENTA_AVE, VENTA_HUEVOS, ALIMENTO, MEDICAMENTO, INFRAESTRUCTURA, COMPRA_AVE, ENVIO_AVE, OTRO

### Automatización
- Venta de ave → genera INGRESO VENTA_AVE
- Venta de ave → genera INGRESO ENVIO_AVE (si valor_envio > 0)
- Origen VENTA_Ave con origen_id = bajas_ave.id

### Auditoría
- `movimientos_financieros_historial` registra cambios
- Acciones: EDICION_MANUAL, CREACION_POR_CORRECCION, CORRECCION_VENTA, CORRECCION_ENVIO
- Permite corregir ventas financieras (valor_venta, valor_envio)

### Resúmenes
- Por período: TODO, MES, ANIO
- Consolidado por categoría
- Consolidado mensual (últimos 12 meses)

---

## 13. QUÉ CATÁLOGOS UTILIZA ACTUALMENTE LA APLICACIÓN

| Catálogo | Código | Items |
|----------|--------|-------|
| **Razas** | RAZAS | Kikiris, Kikirikis mejorados, Aztecas, Sebring, Nagasaki, Kiri, Fantasía, Serama, Otro |
| **Sexos** | SEXOS | Macho, Hembra |
| **Enfermedades** | ENFERMEDADES | Coccidia, Coriza, Gripe, Otro |
| **Medicamentos** | MEDICAMENTOS | Vitamina, Antibiótico, Antiparasitario, Otro |
| **Alimentos** | ALIMENTOS | Configurable por usuario |
| **Bebidas** | BEBIDAS | Configurable por usuario |
| **Categorías financieras** | CATEGORIAS_FINANCIERAS | Venta de ave, Venta de huevos, Alimento, Medicamento, Infraestructura, Compra de ave, Envío de ave, Otro |

---

## 14. QUÉ FUNCIONALIDADES DEPENDEN ÚNICAMENTE DEL ALMACENAMIENTO LOCAL

**TODAS LAS FUNCIONALIDADES SON LOCALES EN V1.**

- Gestión de aves
- Gestión de jaulas
- Registro de huevos
- Salud y tratamientos
- Finanzas
- Catálogos
- Clientes (derivados de ventas)
- Dashboard
- Alertas internas
- Reportes y exportación
- Backup/restore
- Genealogía
- Historial de eventos

---

## 15. QUÉ CONECTORES LOCALES DEBERÍAN CONVERTIRSE EN LLAMADAS A API REST

### Fase 1: Autenticación y Criaderos (V2 - YA IMPLEMENTADO EN BACKEND)
- ✅ `POST /api/v1/auth/register` - Registrar usuario
- ✅ `POST /api/v1/auth/login` - Login usuario
- ✅ `POST /api/v1/criaderos` - Crear criadero
- ✅ `PUT /api/v1/criaderos/:criaderoId/configuracion` - Configurar criadero
- ✅ `POST /api/v1/criaderos/:criaderoId/onboarding/complete` - Completar onboarding
- ✅ `GET /api/v1/criaderos/:criaderoId/onboarding` - Estado onboarding

### Fase 2: Migración de repositorios a API (PENDIENTE)

| Repositorio Local | Endpoint REST Propuesto | Método HTTP | Entidades D1 |
|------------------|------------------------|-------------|--------------|
| **AveRepository** | `/api/v1/criaderos/:criaderoId/aves` | GET, POST | aves, ave_evolucion, ave_historial |
| | `/api/v1/criaderos/:criaderoId/aves/:aveId` | GET, PUT | aves |
| | `/api/v1/criaderos/:criaderoId/aves/:aveId/jaula` | PUT | aves, ave_historial, jaula_historial |
| **JaulaRepository** | `/api/v1/criaderos/:criaderoId/jaulas` | GET, POST | jaulas |
| | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId` | GET, PUT, DELETE | jaulas, jaula_historial |
| | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/historial` | GET | jaula_historial |
| **HuevoRepository** | `/api/v1/criaderos/:criaderoId/huevos` | GET, POST | huevos, ave_historial |
| | `/api/v1/criaderos/:criaderoId/huevos/produccion` | GET | huevos (agregados) |
| **FinanzasRepository** | `/api/v1/criaderos/:criaderoId/finanzas/movimientos` | GET, POST | movimientos_financieros |
| | `/api/v1/criaderos/:criaderoId/finanzas/movimientos/:movimientoId` | GET, PUT | movimientos_financieros, movimientos_financieros_historial |
| | `/api/v1/criaderos/:criaderoId/finanzas/resumen` | GET | movimientos_financieros (agregados) |
| **SaludRepository** | `/api/v1/criaderos/:criaderoId/aves/:aveId/salud` | GET, POST | diagnosticos_ave, tratamientos_ave, aves |
| | `/api/v1/criaderos/:criaderoId/aves/:aveId/salud/estado` | PUT | aves |
| **BajaAveRepository** | `/api/v1/criaderos/:criaderoId/aves/:aveId/baja` | POST | bajas_ave, aves, movimientos_financieros |
| **AlimentacionRepository** | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/alimentacion` | GET, POST | alimentacion_jaula, jaula_historial |
| **BebidaRepository** | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/bebida` | GET, POST | bebida_jaula, jaula_historial |
| **SanidadJaulaRepository** | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/sanidad` | POST | sanidad_jaula, jaulas, jaula_historial |
| **EvolucionAveRepository** | `/api/v1/criaderos/:criaderoId/aves/:aveId/evolucion` | GET, POST | ave_evolucion, aves, ave_historial |
| **GenealogiaRepository** | `/api/v1/criaderos/:criaderoId/aves/:aveId/genealogia` | GET | aves (query compleja) |
| **CicloVidaRepository** | `/api/v1/criaderos/:criaderoId/aves/:aveId/ciclo-vida` | GET | ave_historial, ave_evolucion, diagnosticos_ave, huevos, bajas_ave |
| **ConfiguracionRepository** | `/api/v1/criaderos/:criaderoId/catalogos` | GET | catalogos, catalogo_items |
| | `/api/v1/criaderos/:criaderoId/catalogos/:catalogoId/items` | GET, POST, PUT | catalogo_items |
| **ClientesRepository** | `/api/v1/criaderos/:criaderoId/clientes` | GET | bajas_ave (agregados) |
| | `/api/v1/criaderos/:criaderoId/clientes/:celular` | GET | bajas_ave (agregados) |
| **DashboardRepository** | `/api/v1/criaderos/:criaderoId/dashboard` | GET | todas las tablas (agregados) |
| **ProduccionRepository** | `/api/v1/criaderos/:criaderoId/produccion` | GET | huevos (agregados) |
| **AlertasRepository** | `/api/v1/criaderos/:criaderoId/alertas` | GET | múltiples tablas (cálculos) |
| **ReportesRepository** | `/api/v1/criaderos/:criaderoId/reportes/:tipo` | GET | todas las tablas |
| **BackupRepository** | **NO MIGRAR** - backup local mantiene como funcionalidad offline |

---

## MAPEO DETALLADO: CONECTOR LOCAL → ENDPOINT REST

### AveRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerAves()` | `/api/v1/criaderos/:criaderoId/aves` | GET | - | `{ aves: [...] }` | aves (WHERE criadero_id AND estado='ACTIVA') |
| `obtenerAvePorId(id)` | `/api/v1/criaderos/:criaderoId/aves/:aveId` | GET | - | `{ ave: {...} }` | aves + jaulas + padres |
| `crearAve(data)` | `/api/v1/criaderos/:criaderoId/aves` | POST | `{ codigo, origen, ... }` | `{ id, ... }` | aves + ave_evolucion + ave_historial + jaula_historial |
| `actualizarAve(data)` | `/api/v1/criaderos/:criaderoId/aves/:aveId` | PUT | `{ codigo, origen, ... }` | `{ ... }` | aves + ave_evolucion + ave_historial |
| `obtenerAvesParaAsignarJaula(jaulaId)` | `/api/v1/criaderos/:criaderoId/aves?disponiblesParaJaula=jaulaId` | GET | - | `{ aves: [...] }` | aves (WHERE NOT jaula_actual_id OR jaula_actual_id != ?) |
| `asignarJaula(aveId, jaulaId)` | `/api/v1/criaderos/:criaderoId/aves/:aveId/jaula` | PUT | `{ jaulaId }` | `{ ... }` | aves + ave_historial + jaula_historial |

### JaulaRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerJaulas()` | `/api/v1/criaderos/:criaderoId/jaulas` | GET | - | `{ jaulas: [...] }` | jaulas + COUNT(aves) |
| `obtenerJaulaPorId(id)` | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId` | GET | - | `{ jaula: {...} }` | jaulas |
| `crearJaula(data)` | `/api/v1/criaderos/:criaderoId/jaulas` | POST | `{ codigo, nombre, ... }` | `{ id, ... }` | jaulas |
| `actualizarJaula(data)` | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId` | PUT | `{ codigo, nombre, ... }` | `{ ... }` | jaulas |
| `desactivarJaula(id)` | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId` | DELETE | - | `{ cantidadAvesLiberadas }` | jaulas + aves + ave_historial + jaula_historial |
| `obtenerHistorialCompletoJaula(id)` | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/historial` | GET | - | `{ eventos: [...] }` | jaula_historial + aves |

### HuevoRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `registrarHuevo(data)` | `/api/v1/criaderos/:criaderoId/huevos` | POST | `{ aveId, jaulaId, fecha, observacion }` | `{ codigo, ... }` | huevos + ave_historial |
| `obtenerHuevosAve(aveId)` | `/api/v1/criaderos/:criaderoId/aves/:aveId/huevos` | GET | - | `{ huevos: [...] }` | huevos + jaulas |
| `obtenerProduccionHuevos()` | `/api/v1/criaderos/:criaderoId/huevos/produccion` | GET | - | `{ total, hoy, mes }` | huevos (agregados) |
| `obtenerTopPonedoras()` | `/api/v1/criaderos/:criaderoId/huevos/ponedoras` | GET | - | `{ aves: [...] }` | huevos + aves (GROUP BY) |

### FinanzasRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerResumenFinanciero(periodo)` | `/api/v1/criaderos/:criaderoId/finanzas/resumen?periodo=...` | GET | - | `{ ingresos, egresos, utilidad }` | movimientos_financieros (agregados) |
| `obtenerMovimientosFinancieros()` | `/api/v1/criaderos/:criaderoId/finanzas/movimientos` | GET | - | `{ movimientos: [...] }` | movimientos_financieros + aves |
| `registrarIngreso(data)` | `/api/v1/criaderos/:criaderoId/finanzas/movimientos` | POST | `{ tipo: INGRESO, ... }` | `{ id, ... }` | movimientos_financieros |
| `registrarEgreso(data)` | `/api/v1/criaderos/:criaderoId/finanzas/movimientos` | POST | `{ tipo: EGRESO, ... }` | `{ id, ... }` | movimientos_financieros |
| `actualizarMovimientoManual(data)` | `/api/v1/criaderos/:criaderoId/finanzas/movimientos/:movimientoId` | PUT | `{ ... }` | `{ ... }` | movimientos_financieros + movimientos_financieros_historial |

### SaludRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `registrarDiagnostico(data)` | `/api/v1/criaderos/:criaderoId/aves/:aveId/salud` | POST | `{ enfermedad, sintomas, medicamento, dosis, ... }` | `{ id, ... }` | diagnosticos_ave + tratamientos_ave + aves + ave_historial |
| `obtenerHistorialSaludAve(aveId)` | `/api/v1/criaderos/:criaderoId/aves/:aveId/salud` | GET | - | `{ diagnosticos: [...] }` | diagnosticos_ave + tratamientos_ave |
| `actualizarEstadoSaludAve(data)` | `/api/v1/criaderos/:criaderoId/aves/:aveId/salud/estado` | PUT | `{ estado }` | `{ ... }` | aves |

### BajaAveRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `registrarMuerteAve(data)` | `/api/v1/criaderos/:criaderoId/aves/:aveId/baja` | POST | `{ tipo: MUERTE, causa, detalle }` | `{ id, ... }` | bajas_ave + aves + ave_historial |
| `registrarVentaAve(data)` | `/api/v1/criaderos/:criaderoId/aves/:aveId/baja` | POST | `{ tipo: VENTA, celular, comprador, valorVenta, valorEnvio, ... }` | `{ id, ... }` | bajas_ave + aves + movimientos_financieros (2) + ave_historial |

### EvolucionAveRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `registrarEvolucionAve(data)` | `/api/v1/criaderos/:criaderoId/aves/:aveId/evolucion` | POST | `{ fotoUri, pesoGramos, alturaCm, largoCm, ... }` | `{ id, ... }` | ave_evolucion + aves + ave_historial |
| `obtenerEvolucionAve(aveId)` | `/api/v1/criaderos/:criaderoId/aves/:aveId/evolucion` | GET | - | `{ evoluciones: [...] }` | ave_evolucion |

### GenealogiaRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerGenealogiaAve(aveId, generaciones)` | `/api/v1/criaderos/:criaderoId/aves/:aveId/genealogia?generaciones=...` | GET | - | `{ ave, ancestros, descendientes, relacionesInvalidas }` | aves (query recursiva en memoria) |

### CicloVidaRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerCicloVidaAve(aveId)` | `/api/v1/criaderos/:criaderoId/aves/:aveId/ciclo-vida` | GET | - | `{ eventos: [...] }` | ave_historial + ave_evolucion + diagnosticos_ave + tratamientos_ave + huevos + bajas_ave |

### ConfiguracionRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerCatalogos()` | `/api/v1/criaderos/:criaderoId/catalogos` | GET | - | `{ catalogos: [...] }` | catalogos |
| `obtenerItemsCatalogo(catalogoId)` | `/api/v1/criaderos/:criaderoId/catalogos/:catalogoId/items` | GET | - | `{ items: [...] }` | catalogo_items (WHERE catalogo_id AND activo=1) |
| `crearItemCatalogo(data)` | `/api/v1/criaderos/:criaderoId/catalogos/:catalogoId/items` | POST | `{ codigo, nombre, descripcion }` | `{ id, ... }` | catalogo_items |
| `actualizarItemCatalogo(data)` | `/api/v1/criaderos/:criaderoId/catalogos/items/:itemId` | PUT | `{ nombre, descripcion }` | `{ ... }` | catalogo_items |
| `eliminarItemCatalogo(id)` | `/api/v1/criaderos/:criaderoId/catalogos/items/:itemId` | DELETE | - | `{ ... }` | catalogo_items (soft delete activo=0) |

### DashboardRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerDashboard()` | `/api/v1/criaderos/:criaderoId/dashboard` | GET | - | `{ aves, salud, finanzas, jaulas, huevos, ... }` | Todas las tablas (agregados) |

### ProduccionRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerResumenProduccion()` | `/api/v1/criaderos/:criaderoId/produccion/resumen` | GET | - | `{ hoy, semana, mes }` | huevos (agregados) |
| `obtenerRankingPonedoras()` | `/api/v1/criaderos/:criaderoId/produccion/ponedoras` | GET | - | `{ aves: [...] }` | huevos + aves (GROUP BY) |
| `obtenerProduccionPorDia()` | `/api/v1/criaderos/:criaderoId/produccion/por-dia` | GET | - | `{ datos: [...] }` | huevos (GROUP BY día) |
| `obtenerProduccionPorJaula()` | `/api/v1/criaderos/:criaderoId/produccion/por-jaula` | GET | - | `{ datos: [...] }` | huevos + jaulas (GROUP BY) |

### AlertasRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerTodasLasAlertas()` | `/api/v1/criaderos/:criaderoId/alertas` | GET | - | `{ alertas: [...] }` | Múltiples tablas (cálculos dinámicos) |
| `obtenerResumenAlertas()` | `/api/v1/criaderos/:criaderoId/alertas/resumen` | GET | - | `{ total, criticas, advertencias }` | Múltiples tablas (cálculos) |

### ReportesRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerReporteAves()` | `/api/v1/criaderos/:criaderoId/reportes/aves` | GET | - | `{ activas, vendidas, fallecidas }` | aves (agregados) |
| `obtenerReporteSalud()` | `/api/v1/criaderos/:criaderoId/reportes/salud` | GET | - | `{ estado, enfermedades }` | aves + diagnosticos_ave (agregados) |
| `obtenerReporteProduccion()` | `/api/v1/criaderos/:criaderoId/reportes/produccion` | GET | - | `{ huevos, mejor }` | huevos (agregados) |
| `obtenerReporteFinanzas()` | `/api/v1/criaderos/:criaderoId/reportes/finanzas` | GET | - | `{ ingresos, egresos, utilidad }` | movimientos_financieros (agregados) |
| `obtenerExportacionAves()` | `/api/v1/criaderos/:criaderoId/exportar/aves` | GET | - | `[...]` | aves + jaulas + padres |
| `obtenerExportacionVentas()` | `/api/v1/criaderos/:criaderoId/exportar/ventas` | GET | - | `[...]` | bajas_ave + aves |
| `obtenerExportacionClientes()` | `/api/v1/criaderos/:criaderoId/exportar/clientes` | GET | - | `[...]` | bajas_ave (agregados) |
| `obtenerExportacionFinanzas()` | `/api/v1/criaderos/:criaderoId/exportar/finanzas` | GET | - | `[...]` | movimientos_financieros + aves |
| `obtenerExportacionHuevos()` | `/api/v1/criaderos/:criaderoId/exportar/huevos` | GET | - | `[...]` | huevos + aves + jaulas |
| `obtenerExportacionJaulas()` | `/api/v1/criaderos/:criaderoId/exportar/jaulas` | GET | - | `[...]` | jaulas |

### ClientesRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerClientes()` | `/api/v1/criaderos/:criaderoId/clientes` | GET | - | `{ clientes: [...] }` | bajas_ave (GROUP BY celular) |
| `obtenerClientePorCelular(celular)` | `/api/v1/criaderos/:criaderoId/clientes/:celular` | GET | - | `{ cliente: {...} }` | bajas_ave (GROUP BY celular) |
| `obtenerComprasCliente(celular)` | `/api/v1/criaderos/:criaderoId/clientes/:celular/compras` | GET | - | `{ compras: [...] }` | bajas_ave + aves |

### AlimentacionRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerTiposAlimentos()` | `/api/v1/criaderos/:criaderoId/catalogos/ALIMENTOS/items` | GET | - | `{ items: [...] }` | catalogo_items (WHERE catalogo.codigo='ALIMENTOS') |
| `registrarAlimentacion(data)` | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/alimentacion` | POST | `{ fecha, tipo, cantidad, detalle }` | `{ id, ... }` | alimentacion_jaula + jaula_historial |
| `obtenerAlimentacionJaula(jaulaId)` | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/alimentacion` | GET | - | `{ registros: [...] }` | alimentacion_jaula |

### BebidaRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `obtenerTiposBebidas()` | `/api/v1/criaderos/:criaderoId/catalogos/BEBIDAS/items` | GET | - | `{ items: [...] }` | catalogo_items (WHERE catalogo.codigo='BEBIDAS') |
| `registrarBebida(data)` | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/bebida` | POST | `{ fecha, tipo, cantidad, detalle }` | `{ id, ... }` | bebida_jaula + jaula_historial |

### SanidadJaulaRepository

| Operación Local | Endpoint REST | Método | Request | Response | D1 Involucradas |
|----------------|--------------|--------|---------|----------|-----------------|
| `registrarSanidadJaula(data)` | `/api/v1/criaderos/:criaderoId/jaulas/:jaulaId/sanidad` | POST | `{ fecha, tipo, detalle }` | `{ id, ... }` | sanidad_jaula + jaulas + jaula_historial |

---

## RESUMEN DE CAMBIOS PARA V2

### Cambios arquitectónicos necesarios:

1. **Agregar user_id a todas las tablas principales**:
   - aves
   - jaulas
   - huevos
   - movimientos_financieros
   - diagnosticos_ave
   - bajas_ave
   - alimentacion_jaula
   - bebida_jaula
   - sanidad_jaula

2. **Agregar criadero_id a todas las tablas**:
   - Ya existe en backend V2
   - Necesita migración en móvil

3. **Mantener SQLite local como cache offline**:
   - Para operación sin conexión
   - Sincronización con backend cuando haya conexión

4. **Preservar BackupRepository local**:
   - Como funcionalidad offline
   - No migrar a API

5. **Implementar capa de sincronización**:
   - Detectar cambios locales
   - Enviar a API
   - Recibir cambios del servidor
   - Resolver conflictos

### Endpoints críticos para MVP móvil online:

1. Autenticación (YA IMPLEMENTADO)
2. Criaderos (YA IMPLEMENTADO)
3. Aves CRUD
4. Jaulas CRUD
5. Huevos CRUD
6. Finanzas básicas
7. Salud básica

### Endpoints de análisis/reportes (fase posterior):

1. Dashboard
2. Producción
3. Alertas
4. Reportes
5. Exportación

Este análisis respeta exactamente la lógica actual de la app móvil y no inventa nuevas funcionalidades. El backend V2 actual ya tiene la base de usuarios, criaderos y onboarding. Los próximos pasos son migrar las tablas existentes al esquema multi-tenant con user_id y criadero_id, e implementar los endpoints REST correspondientes.
