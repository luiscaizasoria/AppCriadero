# Spec: alertas-del-dia

> **Regla del proyecto (2026-10-29).** La app V1 conserva pantallas, lógica y comportamiento; solo cambia dónde guarda los datos (SQLite local → API en la nube con D1 + R2 y login). Cada repositorio V1 se reemplaza por un cliente REST con la misma interfaz. Se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online. Esta spec documenta UNA excepción aprobada por el usuario a la paridad con V1 (alerta de Salud). Complementa `documents/specs/alertas.md` (módulo ya implementado).

## Estado

borrador

## Fuente V1

Líneas de `src/repositories/AlertasRepository.sqlite.js` (V1 renombrado; fachada `AlertasRepository.js:43-48`) y del servidor (`api/src/alertas/`). Sin tabla de alertas: se derivan en cada petición, sin estado.

### Diagnóstico: cómo se calcula cada tipo hoy y si persiste

| Tipo | V1 | Servidor | ¿Persiste de un día a otro? |
|---|---|---|---|
| Salud | `AlertasRepository.sqlite.js:17-46` (`obtenerAlertasSalud`): aves `ACTIVA` y `EN_TRATAMIENTO`; `dias = julianday('now') - julianday(COALESCE(fecha_ultimo_control_salud, CURRENT_TIMESTAMP))` (28-34); filtro JS `Number(item.dias \|\| 0) >= 7` (58) | `alertas.repository.ts:16-21` (`SQL_SALUD`, mismo `julianday(?)` con un solo `ahoraIso`) y `alertas.service.ts:26-38` (`>= 7`, mensaje con `Math.floor(dias)`) | **Sí, acumula sin tope**: desde que `dias >= 7` aparece TODOS los días hasta que el ave deje de estar `EN_TRATAMIENTO` o se registre un diagnóstico nuevo (que renueva `fecha_ultimo_control_salud`). No hay límite superior |
| Jaulas | `:124-363` (`obtenerAlertasJaulas`): jaulas `activa = 1`; por jaula, `COUNT(*)` en `alimentacion_jaula` y en `bebida_jaula` con `date(fecha)=date('now')` (186, 280); alerta si es 0 | `alertas.repository.ts:23-33` (`NOT EXISTS ... date(x.fecha) = date(?)`) y `alertas.service.ts:40-63` | **No**. Es diaria: solo mira el día UTC actual; al cambiar de día la jaula vuelve a alertar si no tiene registro de hoy; un registro de ayer no cuenta. No acumula ni guarda historial |
| Producción | `:373-476`: `COUNT(*)` de `huevos` con `date(fecha)=date('now')` (397); alerta si 0 | `alertas.repository.ts:35-36` y `alertas.service.ts:65-75` | **No**. Diaria; cuenta huevos de cualquier ave del criadero en el día UTC actual |
| Finanzas | `:486-619`: suma `INGRESO` y `EGRESO` con `strftime('%Y-%m',fecha)=strftime('%Y-%m','now')` (535-539); alerta si `egresos > ingresos` estricto (551-555) | `alertas.repository.ts:38-43` y `alertas.service.ts:77-87` | Mensual: se mantiene mientras el saldo del mes sea negativo; se reinicia al cambiar de mes UTC. Sin cambio |

### Definición de «hoy»

UTC. V1: `date('now')`/`strftime(..., 'now')` (UTC en SQLite) sobre `fecha` que la app escribe como `new Date().toISOString()` (`AlimentacionJaulaScreen.js:87-89`, `BebidaJaulaScreen.js:90`, `SaludAveScreen.js:309-311`). Servidor: un solo `ahora().toISOString()` por petición (`alertas.service.ts:17`, reloj inyectable `alertas.service.ts:11-14`) usado en todas las consultas. En Ecuador (UTC-5) el «día» cambia a las 19:00 hora local (tarea futura, regla d).

### Contador de Inicio e insignia de Más

- Ambos salen de `GET /criaderos/:criaderoId/alertas` (la lista completa), no de un contador propio. `api/src/inicio/` NO calcula alertas (búsqueda `alert|Alert` sin resultados en ese módulo); su `inicio.repository.ts:36` cuenta aves en tratamiento (`tratamiento`), un dato del dashboard que no es la alerta y no cambia.
- Inicio: `InicioScreen.js:193-213` llama a `obtenerTodasLasAlertas()` y `obtenerResumenAlertas()`; el aviso usa `alertas.length` (515-516, texto en 590-594) y la tarjeta usa el resumen.
- Insignia de Más: `MasMenuScreen.js:79-81` (`obtenerResumenAlertas`) y `AlertBadge.js:9-26` (`cantidad` = `total`, oculta si `<= 0`); la barra inferior relee con `BarraPestanas.js:43-56` (al enfocar Inicio o Más, mínimo 10 s entre lecturas, `INTERVALO_MIN_MS` línea 21). `AlertasRepository.api.js:39-63` deriva `total/criticas/advertencias` de la lista. Al cambiar la regla de Salud los tres se actualizan solos; no hay que tocar pantallas.

### Qué escribe `fecha_ultimo_control_salud` («último control»)

Tabla `aves`, columna `fecha_ultimo_control_salud` (TEXT; `0006_aves.sql:36`; V1 `migrationV2.js:12`).
- Registrar diagnóstico: `api/src/salud/salud.repository.ts:58-62` (pone `EN_TRATAMIENTO` y la `fecha` que envía la app; V1 `SaludRepository.sqlite.js:257-267`).
- Finalizar tratamiento: `api/src/aves/aves.repository.ts:759-763` (pone `SANA`; deja de ser candidata a alerta).
- Solo V1 SQLite (no existe en API): `SaludRepository.sqlite.js:397` (`CURRENT_TIMESTAMP`) y `EstadoSaludRepository.sqlite.js:41`.
No hay otro escritor en `api/src` ni en `pruebas/datos` (búsqueda sin límite).

## Excepción aprobada a la paridad con V1 (decisión del usuario)

- **(a) Jaulas y Producción**: ya son diarias y NO acumulan (ver tabla). Sin cambio.
- **(b) Salud (cambia)**: la alerta aparece SOLO el día en que se cumple el plazo y no vuelve a aparecer los días siguientes si no se atendió. Hoy V1 y servidor la repiten todos los días desde el 7.º.
- **(c) Finanzas**: sin cambio (mensual).
- **(d) Día en UTC** como V1. Tarea futura: en Ecuador el día cambia a las 19:00 hora local.
- **(e)** Sin tabla de alertas descartadas ni botones de descartar.

### Definición precisa de Salud (propuesta, a confirmar: ver dudas)

Una ave genera la alerta si y solo si:
1. `aves.estado = 'ACTIVA'` y `aves.estado_salud = 'EN_TRATAMIENTO'` (igual que V1);
2. `aves.fecha_ultimo_control_salud` no es `NULL` y es interpretable por SQLite;
3. `date(fecha_ultimo_control_salud, '+7 days') = date(ahora)`, es decir, la fecha UTC del último control + 7 días es exactamente la fecha UTC de hoy. Granularidad de día calendario UTC, no de 168 h: control a las 00:00 y a las 23:59 UTC del mismo día alertan el mismo día.

Consecuencias: control hace 6 días → no; hace 7 días → sí (solo ese día); hace 8 o más → no; `NULL`, fecha inválida o futura → no. «Último control» es siempre `aves.fecha_ultimo_control_salud`; un diagnóstico nuevo la sobrescribe, por lo que reinicia el plazo (nueva fecha + 7). No se guarda ninguna marca de «alerta ya mostrada»: es una función pura de `ahora` y de esa columna.

Riesgo a avisar: un ave enferma sin control NO se recuerda de nuevo: si el usuario no abre la app ese día UTC (o no mira Alertas), nunca verá la alerta; tras el día 7 la ave sigue `EN_TRATAMIENTO` sin ningún aviso. Además la ventana UTC puede caer parcialmente de noche en Ecuador (19:00-24:00 locales ya son el día siguiente UTC).

### Constante y función aisladas (propuesta)

Archivo nuevo `api/src/alertas/alertas.reglas.ts`:
- `export const DIAS_PLAZO_CONTROL_SALUD = 7;`
- `export function modificadorPlazoSalud(): string` que devuelve `` `+${DIAS_PLAZO_CONTROL_SALUD} days` `` (modificador de `date()` de SQLite; se pasa como parámetro `?`).
- Opcional: `export function esDiaDeAlertaSalud(ultimoControl: string | null, ahoraIso: string): boolean` solo para documentar y probar la regla; la decisión real sigue en SQL para conservar el análisis de formatos de SQLite (ISO con `Z`, con espacio, con desplazamiento). Cambiar el plazo o pasar de «solo el día» a «desde el día» exige tocar únicamente este archivo (más `SQL_SALUD`).
El mensaje usaría `DIAS_PLAZO_CONTROL_SALUD` (ver duda 2).

## Endpoints V2

Sin endpoint nuevo ni cambio de contrato: `GET /api/v1/criaderos/:criaderoId/alertas` devuelve la misma forma; solo cambia el conjunto de alertas `SALUD`. Sin migración (siguiente `0012`).

## Tabla D1

Sin cambios. Se lee `aves.fecha_ultimo_control_salud` (`0006_aves.sql:36`); índice existente `ix_aves_criadero_estado`.

## Excepciones técnicas por pasar a online

Ninguna nueva. La excepción de esta spec es de producto (regla de Salud), aprobada por el usuario, no del paso a online. Cliente REST y pantallas sin cambios.

## Casos de paridad

Reloj fijo `AHORA = 2026-11-16T15:00:00.000Z`; ave `ACTIVA`, `EN_TRATAMIENTO`, salvo que se diga otra cosa. «Igual a V1» = Jaulas, Producción, Finanzas y orden no cambian.

| id | dado | cuando | entonces |
|---|---|---|---|
| SAL-01 | control `2026-11-10T15:00:00.000Z` (hace 6 días) | alertas | sin alerta SALUD (V1 tampoco) |
| SAL-02 | control `2026-11-09T15:00:00.000Z` (hace 7 días exactos) | alertas | una alerta SALUD/ALTO |
| SAL-03 | controles `2026-11-09T00:00:00.000Z` y `2026-11-09T23:59:59.999Z` | alertas | ambos alertan (día calendario); V1 no alertaría el segundo hasta las 23:59 del día 16 |
| SAL-04 | control `2026-11-08T15:00:00.000Z` (hace 8 días) | alertas | sin alerta (V1 sí alerta: excepción aprobada) |
| SAL-05 | control hace 30 días | alertas | sin alerta (V1 sí) |
| SAL-06 | control hace 7 días | `AHORA` y `AHORA` + 1 día | día 7: sí; día 8: no (la alerta no vuelve) |
| SAL-07 | control hace 3 días, luego diagnóstico nuevo el día 5 | `AHORA` = control nuevo + 7 días | alerta ese día; el plazo viejo no cuenta (reinicio) |
| SAL-08 | control `2026-11-09T20:00:00-05:00` (= `2026-11-10T01:00Z`) | alertas | no alerta hoy; sí el 17 (fecha UTC + 7) |
| SAL-09 | control `2026-10-31`, `AHORA` = `2026-11-07T10:00:00.000Z` | alertas | alerta (cambio de mes) |
| SAL-10 | control con formato `YYYY-MM-DD HH:MM:SS` hace 7 días | alertas | igual que con ISO |
| SAL-11 | `fecha_ultimo_control_salud` `NULL`; texto inválido; fecha futura | alertas | sin alerta |
| SAL-12 | ave `VENDIDA`/`FALLECIDA`, o `SANA`/`ENFERMA`/`NULL`, con control hace 7 días | alertas | sin alerta |
| SAL-13 | cambiar `DIAS_PLAZO_CONTROL_SALUD` a 5 | alertas | aplica a control hace 5 días y no a 7 (la constante gobierna todo) |
| SAL-14 | alerta SALUD el día 7 | `obtenerResumenAlertas`, insignia y aviso de Inicio | `total`/`criticas` cuentan +1 ese día y vuelven a bajar al siguiente |
| SAL-15 | mismas consultas del día | Jaulas (sin cuidados hoy; con registro de ayer), Producción, Finanzas | igual a V1 (ALE-03 a ALE-09, ALE-18 a ALE-24 de `alertas.md`) |

### Pruebas que dependen de las reglas actuales (habrá que actualizarlas)

- `api/test/alertas.service.test.ts` (líneas 51-56 y el umbral `>= 7`) y `api/test/helpers/fake-alertas.repository.ts`.
- `api/test/integration/alertas.d1.test.ts`: `ALE-10..17` (196-235: controles a 8, 7,9 y 9 días), 295 (20 días), 335 (volumen: `8 + i%5` días) y 362.
- `api/test/integration/alertas.paridad-v1.d1.test.ts`: compara contra el V1 REAL con `toStrictEqual`; las partes de Salud (263-264, 271-304 y las semillas pseudoaleatorias) dejan de ser paridad y deben pasar a pruebas propias de la regla nueva o filtrarse por `tipo`. Jaulas, Producción, Finanzas y el orden siguen en paridad.
- `pruebas/datos/casos/16-alertas.mjs`: `controlHace(dias)` (22-23), `esperadas` (36-38, modelo `>= 7`), controles a 10, 1 y 11 días (111-114), esperados 163-164, 195 y 254-261, y los totales de resumen (173: 9/3/6; 196; 266). Con la regla nueva `controlHace(10)` ya no alerta; hay que usar control hace exactamente 7 días con margen de medianoche UTC (el caso ya evita el borde con 10 días y 1 h; ahora el borde es inevitable: fijar la fecha por día UTC y no ejecutar cerca de las 00:00 UTC).
- `pruebas/datos/casos/05-aislamiento.mjs:59` (solo 403, sin cambio). `17-inicio.mjs` y `15-reportes.mjs` usan el conteo `tratamiento`, no las alertas: sin cambio.
- Flujos Maestro `pruebas/movil/flujos/completo/99-alertas.yaml` y el de Inicio (94): usan cuentas sin aves en tratamiento; sin impacto esperado, a confirmar al correrlos si el usuario lo pide.

## Dudas

- **DUDA PARA EL USUARIO 1:** granularidad del plazo. Propuesta: día calendario UTC (`date(control, '+7 days') = date(ahora)`). Alternativa: «desde las 168 h exactas pero solo el primer día» (ventana de 24 h sin alinear al día): daría alertas a distinta hora según la hora del control y se cortaría a mitad de día UTC.
- **DUDA PARA EL USUARIO 2:** texto del mensaje `El ave K lleva N días en tratamiento.` Con la regla por día, el cálculo `Math.floor(dias)` daría 6 o 7 según la hora. Propuesta: usar siempre `DIAS_PLAZO_CONTROL_SALUD` (`lleva 7 días`). Es un cambio de texto frente a V1.
- **DUDA PARA EL USUARIO 3:** un ave con control `NULL` no alerta nunca (V1 igual). Y un ave que entra a `EN_TRATAMIENTO` sin diagnóstico nuevo (no existe en API) no se contempla.
- **DUDA PARA EL USUARIO 4:** si la app no consulta alertas ese día UTC (por ejemplo, el aviso cae entre 19:00 y 24:00 hora Ecuador), el aviso se pierde; confirmar que se acepta (riesgo aprobado en la regla b).
- Duda técnica: la regla en SQL (`date(?, ?)`) frente a TypeScript; se propone SQL para conservar el análisis de formatos de SQLite (`Date.parse` trata `YYYY-MM-DD HH:MM:SS` como hora local).

## Archivos que habrá que tocar (cuando se apruebe)

`api/src/alertas/alertas.repository.ts` (`SQL_SALUD`), `alertas.service.ts` (quitar `>= 7`/`Math.floor`), nuevo `alertas.reglas.ts`, `alertas.types.ts` (si cambia la fila), `documents/specs/alertas.md` (nota de la excepción) y las pruebas listadas arriba. Ninguna pantalla ni `src/repositories/`.
