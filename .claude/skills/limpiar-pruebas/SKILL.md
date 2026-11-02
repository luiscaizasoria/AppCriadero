---
name: limpiar-pruebas
description: Borra TODOS los datos de usuario de la base remota de pruebas criadero-kikirikis-test (no los catálogos globales) y devuelve el recuento final. Solo la invoca el usuario.
disable-model-invocation: true
argument-hint: "[conservar=correo@ejemplo.com] (opcional: conserva a ese usuario y sus datos)"
allowed-tools: Bash(npx wrangler d1 execute criadero-kikirikis-test --remote --env test *) Bash(grep *)
---

# Limpiar la base de pruebas

Borra los datos de usuario de `criadero-kikirikis-test` y deja solo los catálogos globales (`catalogos`). Es destructivo: sin argumentos borra **todos** los usuarios, incluido el del propio usuario. Con `conservar=<correo>` se salta a ese usuario y todo lo suyo.

## Reglas de seguridad

1. **Una sola comprobación previa del nombre de la base.** Antes de cualquier comando remoto, confirma que `api/wrangler.jsonc` define en `env.test` el `database_name` `criadero-kikirikis-test` (por ejemplo `grep -n "criadero-kikirikis-test" api/wrangler.jsonc`). Si no aparece, **detente y avisa**.
2. **Nunca** ejecutes contra `criadero-kikirikis-dev`, `controlgastos-*` ni ninguna otra base, ni sin `--env test`, ni con `--local`. Si el usuario pide otra base, **niégate**.
3. Todos los comandos llevan literalmente `criadero-kikirikis-test --remote --env test`.
4. No leas `api/.dev.vars` ni `.env*`. No toques `documents/traspaso/`.
5. Un comando por tabla (un `--command` por sentencia), en el orden de abajo; si uno falla, detente y reporta (no sigas).

## Orden (respeta las claves foráneas)

Ejecutar desde `api/`. `FILTRO` es `1=1` (todo) o `user_id <> (SELECT id FROM users WHERE email='<correo>')` / `id <> …` cuando hay `conservar`. Para las tablas con `criadero_id`, el filtro es `criadero_id IN (SELECT id FROM criaderos WHERE <filtro por user_id>)`.

Sustituye `CR` por `SELECT id FROM criaderos [WHERE user_id NOT IN (SELECT id FROM users WHERE email='<correo>')]`.

```
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM ave_historial WHERE criadero_id IN (CR)"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM jaula_historial WHERE criadero_id IN (CR)"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM ave_evolucion WHERE criadero_id IN (CR)"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM diagnosticos_ave WHERE criadero_id IN (CR)"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "UPDATE aves SET padre_id=NULL, madre_id=NULL WHERE criadero_id IN (CR)"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM aves WHERE criadero_id IN (CR)"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM alimentacion_jaula WHERE criadero_id IN (CR)"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM bebida_jaula WHERE criadero_id IN (CR)"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM sanidad_jaula WHERE criadero_id IN (CR)"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM jaulas WHERE criadero_id IN (CR)"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM catalogo_items WHERE criadero_id IN (CR)"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM criadero_configuracion WHERE criadero_id IN (CR)"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM criaderos [WHERE user_id NOT IN (SELECT id FROM users WHERE email='<correo>')]"
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "DELETE FROM users [WHERE email <> '<correo>']"
```

Los `UPDATE aves SET padre_id=NULL…` van antes de borrar aves: las aves se referencian entre sí (padre/madre) y un `DELETE` directo falla con `FOREIGN KEY constraint failed`.

Cuando se añadan tablas nuevas con `criadero_id` (cuidados, huevos, salud, finanzas…), insértalas **antes** de `aves`/`jaulas` según sus claves foráneas y actualiza esta lista.

## Recuento final (obligatorio)

```
npx wrangler d1 execute criadero-kikirikis-test --remote --env test --command "SELECT (SELECT count(*) FROM users) users,(SELECT count(*) FROM criaderos) criaderos,(SELECT count(*) FROM criadero_configuracion) cfg,(SELECT count(*) FROM catalogos) catalogos,(SELECT count(*) FROM catalogo_items) items,(SELECT count(*) FROM jaulas) jaulas,(SELECT count(*) FROM aves) aves,(SELECT count(*) FROM ave_evolucion) evo,(SELECT count(*) FROM ave_historial) ave_hist,(SELECT count(*) FROM jaula_historial) jaula_hist,(SELECT count(*) FROM diagnosticos_ave) diag"
```

Devuelve la tabla de recuentos. Esperado sin `conservar`: todo a 0 salvo `catalogos` (10, semilla global). Si algo no queda a 0, dilo.
