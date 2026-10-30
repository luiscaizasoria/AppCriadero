# Mapa del proyecto Criadero Kikirikis

## Objetivo y regla del proyecto (2026-10-29)

La app móvil V1 conserva pantallas, lógica y comportamiento y solo cambia **dónde guarda los datos**: de SQLite local a la API en la nube (D1 + R2, con login). Cada repositorio de V1 se reemplaza por un cliente REST con la misma interfaz. Por defecto se replica V1 tal cual; solo se permiten las diferencias que exija el paso a online (IDs UUID v7, `criadero_id`, imágenes en R2, autenticación y errores de red). Si V1 no lo hacía, V2 tampoco; se conservan los códigos y mensajes de error de V1.

## Orden de autoridad

Ante una contradicción prevalece, de mayor a menor:

1. Código real.
2. `CLAUDE.md` (raíz).
3. `documents/arquitectura/`.
4. `documents/specs/`.
5. `documents/historico/` (y `documents/referencia-v1/` como referencia de V1).

`documents/traspaso/` es contexto local (ignorado por Git, respaldado fuera del repositorio): no es fuente de autoridad.

## Qué hay en cada carpeta

| Ruta | Contenido |
|---|---|
| `CLAUDE.md` | Única guía para Claude: estado, regla del proyecto, arquitectura, comandos, convenciones, Git |
| `src/` | App móvil V1 (React Native + Expo): `screens/`, `repositories/` (acceso a SQLite; se reemplazarán por clientes REST), `database/` (migraciones y seeders SQLite V1–V7), `navigation/`, `components/`, `services/` (imágenes), `models/`, `config/` |
| `App.js`, `index.js`, `app.json`, `eas.json`, `assets/` | Entrada y configuración de la app Expo |
| `api/src/` | Backend V2 (TypeScript, Cloudflare Workers, Hono): `app.ts` compone los routers, `index.ts` exporta el Worker; módulos `auth/`, `criaderos/` y `catalogs/` con el patrón routes → factory → service → repository |
| `api/migrations/` | Migraciones D1 aplicadas `0001`–`0004` (siguiente: `0005` = jaulas; `0006` = aves e historiales) |
| `api/test/` | Pruebas: unitarias y HTTP (`*.test.ts`), `helpers/` (fakes, adaptador D1 local) e `integration/` (D1 local con better-sqlite3; borra datos locales) |
| `.claude/` | Configuración de Claude Code: `settings.json`, `agents/`, `rules/`, `skills/` (ver abajo) |
| `documents/arquitectura/` | `arquitectura-v2.md` (arquitectura online-first, identidad, riesgos), `modelo-datos-v2.md` (estado real de D1 y borrador del modelo futuro) y `roadmap-v2.md` (siete fases) |
| `documents/referencia-v1/` | `baseline-v1.md` (funciones y restricciones de V1) y `analisis-v1-mapeo-api.md` (análisis de V1 y mapeo repositorio → endpoint; el Anexo B es literal) |
| `documents/specs/` | Una spec por módulo (`aves`, `catalogos`, `jaulas`, `cuidados-jaula`) y `plantilla-spec.md` (plantilla ligera) |
| `documents/historico/` | Documentos antiguos (contexto V1 y V2 previo a online-first, estado de V1) y la copia de las reglas antiguas de la app móvil; no se edita |
| `documents/traspaso/` | Handoff, cierre y respuestas del traspaso: solo local, ignorado por Git |

## Equipo de agentes (`.claude/agents/`)

- **`orquestador-proyecto`** (hilo principal, fijado con `"agent"` en `.claude/settings.json`): coordina a los demás agentes y es el único que habla con el usuario.
- `revisor-arquitectura-v2`: lista de comprobación de arquitectura con veredicto APROBADO o RECHAZADO.
- `analista-codigo-v1`: lee el código de V1 y redacta las specs en `documents/specs/`.
- `especialista-base-datos-d1`: analiza el esquema D1 real, diseña migraciones nuevas y revisa índices, límites del plan gratuito y paridad con V1 (solo local).
- `implementador-api`: escribe el backend (`api/`) y sus pruebas a partir de la spec aprobada.
- `implementador-cliente-app`: escribe el cliente REST de la app con la misma interfaz que el repositorio V1, sin tocar las pantallas V1.
- `revisor-de-cambios`: revisa el diff (capas, propiedad del criadero, paridad con V1) sin editar.
- `ejecutor-de-pruebas`: ejecuta typecheck y las pruebas de `api/` (unitarias, HTTP e integración en memoria) y reporta los resultados reales.
- `probador-integracion-api`: levanta el Worker local con una D1 temporal, hace llamadas HTTP reales, comprueba D1 y los errores de la spec, limpia y reporta.
- `probador-movil`: evalúa y define cómo validar la app contra la API (emulador Android, adb, Maestro) y reduce lo que exige el teléfono físico a una lista corta.
- `redactor-documentacion`: mantiene `documents/` coherente con el código y con la regla del proyecto.

### Flujo por módulo y qué le toca al usuario

1. Spec y V1 (`analista-codigo-v1`) → 2. diseño de tabla (`especialista-base-datos-d1`) → 3. **plan del módulo aprobado por el usuario** → 4. implementar (`implementador-api`, luego `implementador-cliente-app`) → 5. revisar (`revisor-arquitectura-v2` y `revisor-de-cambios`; si rechazan, vuelve al paso 4, máximo dos vueltas) → 6. probar (`ejecutor-de-pruebas` y `probador-integracion-api`) → 7. probar la app (`probador-movil`) → 8. documentar (`redactor-documentacion`) → 9. commit local y resumen corto.

**Al usuario solo le toca:** aprobar el plan de cada módulo, el push, los despliegues (y todo comando `--remote` o que cree o borre recursos en Cloudflare), las decisiones de producto y la comprobación mínima en el teléfono. Los subagentes no pueden preguntar al usuario: sus dudas las pregunta el orquestador.

**Cumplimiento técnico y reinicio:** el hook `.claude/hooks/guardia.ps1` (en el frontmatter de cada agente) limita dónde escribe cada agente y qué comandos Bash admite; `.claude/settings.json` pregunta antes de push, deploy y comandos remotos. Es comparación de texto, no una frontera de seguridad. Para activar el orquestador hay que reiniciar la sesión (o recargar la ventana de VS Code); para desactivarlo, quitar la clave `agent` de `.claude/settings.json`. La extensión de VS Code puede no aplicar el ajuste `agent` (no confirmado): en ese caso, iniciar con `claude --agent orquestador-proyecto` o actuar según `.claude/agents/orquestador-proyecto.md`.

**Los hooks NO están confirmados como protección técnica (2026-10-30).** En pruebas reales con subagentes (7 intentos que debían bloquearse en esta sesión y 2 más en la anterior), ninguno se bloqueó y el guardia ni siquiera se ejecutó (una traza escrita al inicio del script no apareció). La documentación oficial dice que los hooks del frontmatter de subagentes de proyecto solo corren tras aceptar el diálogo de confianza de la carpeta (https://code.claude.com/docs/en/sub-agents, sección de hooks en frontmatter) y que un hook que falla o no arranca no bloquea salvo `onFailure: "block"` (v2.1.295+) o salida con código 2 (https://code.claude.com/docs/en/hooks). Mientras no se confirme, las restricciones de cada agente son **reglas de conducta**, y la seguridad real son las **ramas, los PR y las reglas `ask`/`deny` de `.claude/settings.json`**. Los hooks se mantienen como defensa adicional.

## Reglas (`.claude/rules/`)

- `api-capas`: flujo routes → factory → service → repository y reglas de código de `api/src`.
- `api-migraciones-d1`: cómo escribir y aplicar migraciones D1 (`api/migrations`).
- `api-tests`: niveles de prueba y estilo (`debe …`) de `api/test`.
- `app-movil-v1`: reglas de la app móvil V1 (SQLite V7 → V8, cinco tabs, backup e imágenes, áreas críticas).
- `secretos`: manejo de secretos (`.dev.vars`, `.env`).
- `specs`: cómo redactar specs (replicar V1, plantilla ligera, evidencia archivo:línea).
- `documentacion`: estructura de `documents/` y regla de mantener este índice.

## Skills (`.claude/skills/`)

- `nuevo-modulo-api`: crea un módulo de la API siguiendo las capas.
- `verificar-api`: typecheck y pruebas unitarias/HTTP de `api/` (la integración solo con confirmación).
- `migrar-repositorio-a-api`: migra un repositorio de V1 a la API y a un cliente REST con la misma interfaz.

## Flujo para migrar un módulo

1. Leer la spec del módulo (`documents/specs/<modulo>.md`) y el repositorio V1 con sus pantallas; si no hay spec, pedirla a `analista-codigo-v1` con `plantilla-spec.md`.
2. Definir los endpoints y la tabla D1 equivalentes (migración nueva `NNNN_*.sql`; jaulas `0005`, aves `0006`).
3. Implementar en `api/` siguiendo routes → factory → service → repository.
4. Crear el cliente REST de la app con la misma interfaz que el repositorio V1 (mismos nombres, mismo objeto devuelto, mismos errores).
5. Pruebas unitarias, HTTP e integración, más las pruebas de paridad con V1.
6. Comprobar que las pantallas no cambiaron y que la app sigue funcionando.

Procedimiento detallado: skill `migrar-repositorio-a-api`.

## Notas

- Las specs de módulo se redactan desde el código real de V1, no desde el DDL borrador de `arquitectura/modelo-datos-v2.md`.
- En las specs, las reglas abiertas y decisiones de producto están marcadas como *resuelta: replicar V1*, *técnica, se mantiene* o *revocada* (regla del proyecto 2026-10-29); cada spec lista arriba sus decisiones revocadas.
- El comentario de `api/src/catalogs/defaultCatalogItems.ts` (línea 8) aún cita el nombre antiguo del modelo de datos; es código y no se tocó en esta reorganización.

## Pendientes

- [ ] Aplicar la regla del proyecto al código: `analisis-v1-mapeo-api.md` y el resto de la documentación describen diferencias (versión, CHECK, validaciones nuevas) que la regla revoca; los documentos de arquitectura no se han reescrito.
- [ ] `baseline-v1.md`: su apartado "Alcance aún no implementado en V1" todavía menciona la sincronización offline como trabajo de V2.
- [ ] Specs de los módulos restantes (Huevos, Salud, Finanzas, Bajas, Evolución, etc.) con `plantilla-spec.md`.
- [ ] Decidir el destino de `BackupRepository` en V2.
- [ ] Resolver los riesgos de `arquitectura-v2.md` (PBKDF2 en Worker real, rate limiting, CORS, CI, refresh token, `active` en el registro).
