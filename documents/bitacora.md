# Bitácora del proyecto

Registro de sesiones, la entrada más nueva ARRIBA. Reglas: una entrada por sesión (`## AAAA-MM-DD sesión N`, máximo 15 líneas: Hecho con hashes, Decisiones con su motivo, Pendiente y Próximo paso exacto); las entradas anteriores nunca se reescriben; sin URLs, ids de recursos, correos ni secretos (repositorio público). Al pasar de 300 líneas, las antiguas se mueven a `documents/historico/bitacora-AAAA-MM.md` y quedan las 5 últimas. El hook de inicio muestra las 3 más recientes (deben caber en unos 4.500 caracteres). Estado resumido: `documents/estado-actual.md`.

## 2026-11-01 sesión 2
- Hecho: sistema de seguimiento: esta bitácora rellena hacia atrás, import del estado en `CLAUDE.md`, hook `SessionStart` (`.claude/hooks/sesion-inicio.ps1`), agente `seguimiento-proyecto` y skills `/cerrar-dia` y `/retomar`. Commit de esta sesión: ver `git log` (mensaje «chore: sistema de seguimiento»).
- Decisión: el estado se carga con import `@` y la bitácora con hook; motivo: el import siempre trae la versión actual y el hook permite recortar la bitácora.
- Decisión: sin hooks `Stop`, `SessionEnd`, `prompt` ni `agent`; motivo: `Stop` se dispara en cada turno y `SessionEnd` solo tiene 1,5 s y no puede lanzar agentes.
- Decisión: el registro al cerrar es manual (`/cerrar-dia`); motivo: ningún hook de cierre puede lanzar un agente.
- Pendiente: probar que `SessionStart` corre en la extensión de VS Code (no probado); error 7403 de Cloudflare al aplicar `0006` en la base de pruebas.
- Próximo paso exacto: reiniciar la sesión y comprobar que aparecen las entradas; luego resolver el acceso a Cloudflare y aplicar `0006` con `--env test`.

## 2026-11-01 sesión 1
- Hecho: prueba en el teléfono: catálogos funcionan; fallan cuidados de jaula, asignar ave y finalizar tratamiento por la migración parcial.
- Hecho: el cliente vuelve a elegir criadero si el guardado ya no existe (`66c152c`); decisiones a-j del orquestador y regla de sesión (`bca6c57`).
- Hecho: módulo Aves implementado en local: API y migración `0006` (`4fc1831`), cliente y fachadas (`37df1fa`), documentación (`0a47957`). 137 pruebas unitarias/HTTP y 35 de integración en verde.
- Decisión: reemplazar `EstadoSaludRepository.js` por una fachada (opción A); motivo: era una copia muerta de una pantalla y la pantalla de finalizar tratamiento lo importa.
- Decisión: crear `diagnosticos_ave` en `0006`; motivo: finalizar tratamiento cierra diagnósticos activos y la tabla no existía en D1.
- Pendiente: `0006` sin aplicar en la base remota de pruebas (error 7403 de Cloudflare: cuenta no válida o sin autorización); Aves sin probar en el teléfono.
- Próximo paso exacto: resolver el acceso a Cloudflare, aplicar `0006` y redesplegar con `--env test`, probar Aves en el teléfono.

## 2026-10-31 sesión 1
- Hecho: guardia de rutas movida a `settings.json` porque los hooks del frontmatter de los agentes no se ejecutaban (`a16d4ca`).
- Hecho: entorno de pruebas en Cloudflare con migraciones `0001` a `0005` (`fb2b1b7`); PBKDF2 a 100.000 iteraciones (`65a2809`).
- Hecho: módulo Catálogos con 42 ítems por criadero (`39c77ca`, `12fc4b3`); Jaulas y Catálogos probados contra la nube (commit por confirmar); Expo por túnel con Expo Go para SDK 57 (por confirmar).
- Decisión: PBKDF2 en 100.000 iteraciones; motivo: es el máximo que admite Cloudflare; mide 13 a 20 ms de CPU en el plan gratuito, riesgo conocido que no se corta.
- Decisión: una sola rama de trabajo sin PR (`8f66787`); motivo: menos fusiones y revisiones.
- Pendiente: Cuidados de jaula, Salud, Bajas, Huevos, Finanzas, R2 y Google Sign-In.
- Próximo paso exacto: módulo Aves.

## 2026-10-30 sesión 1
- Hecho: módulo Jaulas con cliente REST piloto en la app (`39da3b5`); equipo de agentes y orquestador (`c4af622`, `ed9e261`); guardia de agentes endurecido (`e100705`, `8bf4c2c`).
- Decisión: el orquestador coordina y no escribe código; motivo: ahorrar contexto y repartir el trabajo entre especialistas.

## 2026-10-29 sesión 1
- Hecho: clonado del repositorio (por confirmar, sin commit propio) y estructura de Claude Code (`3ec2f31`); documentación V2 en online-first (`a6311c4`).
- Hecho: specs de Aves y Catálogos (`1d15bc6`); specs de Jaulas y Cuidados de jaula (`870e56a`); reorganización de carpetas (`c09c912`).
- Decisión: V2 empieza sin datos y reproduce V1; solo se admiten diferencias técnicas por pasar a online; motivo: la app conserva pantallas, lógica y comportamiento y solo cambia dónde guarda los datos.

## 2026-10-27 sesión 1
- Hecho: traspaso desde ChatGPT (por confirmar: no hay commit; el traspaso es local y no se versiona).

## 2026-10-08 sesión 1
- Hecho: autenticación JWT con pruebas (`0be50e8`, `8fbba03`), inyección de dependencias y pruebas HTTP (`03ad371`) e integración con D1 local (`9fa2dae`).

## 2026-09-28 a 2026-10-04 (resumen)
- Hecho: bootstrap del backend con Workers y Hono (`d1a6bd3`), esquema inicial D1 (`e3fbe8d`), catálogos base (`9ed8174`) y onboarding de criaderos (`9441b22`, `d170055`, `d7429ef`, `14ee3ec`); diseño del modelo de datos V2 (28 al 30-sep).

## 2026-09-22 a 2026-09-27 (resumen)
- Hecho: app V1 (releases 1.0.0 a 1.0.3, `4a8cc6c` a `248ced2`) y preparación del contexto de V2 (`6d4a76d`).
