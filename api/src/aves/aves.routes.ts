/**
 * Rutas del modulo de Aves: /api/v1/criaderos/:criaderoId/aves
 */

import { Hono } from 'hono';
import { jwtMiddleware, type AuthUser, type AuthVariables } from '../auth/auth.middleware';
import { createAveDependencies, type AveDependencies } from './aves.factory';
import type { Resultado } from './aves.types';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

type DependenciesFactory = (db: D1Database) => AveDependencies;

const ERRORES_400 = new Set([
  'VALIDATION_ERROR',
  'PADRES_IGUALES',
  'PADRE_ES_MISMA_AVE',
  'MADRE_ES_MISMA_AVE',
  'PADRE_NO_ENCONTRADO',
  'MADRE_NO_ENCONTRADA',
  'PADRE_NO_MACHO',
  'MADRE_NO_HEMBRA',
  'PARENTESCO_CIRCULAR_PADRE',
  'PARENTESCO_CIRCULAR_MADRE',
]);

const ERRORES_404 = new Set(['AVE_NO_ENCONTRADA', 'JAULA_NO_ENCONTRADA']);

const ERRORES_409 = new Set(['AVE_NO_ACTIVA', 'CODIGO_AVE_DUPLICADO', 'UNIQUE_AVES_CODIGO']);

function statusDeError(error: string): 400 | 404 | 409 | 500 {
  if (ERRORES_400.has(error)) return 400;
  if (ERRORES_404.has(error)) return 404;
  if (ERRORES_409.has(error)) return 409;
  return 500;
}

const CUERPO_INVALIDO = {
  success: false,
  error: 'VALIDATION_ERROR',
  message: 'Cuerpo JSON inválido',
};

function errorValidacion(message: string) {
  return { success: false, error: 'VALIDATION_ERROR', message };
}

/** Permite inyectar dependencias falsas en las pruebas. */
export function createAvesRouter(buildDependencies: DependenciesFactory = createAveDependencies) {

  const router = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

  router.use('*', jwtMiddleware);

  // Propiedad del criadero antes de cualquier consulta o cambio.
  router.use('*', async (c, next) => {
    const user = c.get('user') as AuthUser;
    const { userOwnsCriadero } = buildDependencies(c.env.DB);
    const criaderoId = c.req.param('criaderoId') ?? '';

    if (!(await userOwnsCriadero(user.id, criaderoId))) {
      return c.json(
        {
          success: false,
          error: 'FORBIDDEN',
          message: 'No tiene permisos sobre este criadero',
        },
        403
      );
    }

    await next();
  });

  router.onError((error, c) => {
    console.error('Error en endpoint de aves:', error);
    return c.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
      },
      500
    );
  });

  function responder(c: any, resultado: Resultado<unknown>, statusOk: 200 | 201 = 200) {
    if (resultado.success) return c.json(resultado, statusOk);
    return c.json(resultado, statusDeError(resultado.error));
  }

  async function leerJson(c: any): Promise<{ ok: true; body: unknown } | { ok: false }> {
    try {
      return { ok: true, body: await c.req.json() };
    } catch {
      return { ok: false };
    }
  }

  // GET /aves?estado=ACTIVA|VENDIDA|FALLECIDA
  router.get('/', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const estado = c.req.query('estado') ?? 'ACTIVA';

    if (estado !== 'ACTIVA' && estado !== 'VENDIDA' && estado !== 'FALLECIDA') {
      return c.json(errorValidacion('estado debe ser ACTIVA, VENDIDA o FALLECIDA'), 400);
    }

    return responder(c, await service.listar(c.req.param('criaderoId')!, estado));
  });

  // GET /aves/candidatas-padres?aveId=
  router.get('/candidatas-padres', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(
      c,
      await service.listarCandidatasPadres(c.req.param('criaderoId')!, c.req.query('aveId') ?? null)
    );
  });

  // GET /aves/para-asignar-jaula?jaulaId=
  router.get('/para-asignar-jaula', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const jaulaId = c.req.query('jaulaId');

    if (!jaulaId) return c.json(errorValidacion('jaulaId es obligatorio'), 400);

    return responder(c, await service.listarParaAsignarJaula(c.req.param('criaderoId')!, jaulaId));
  });

  // GET /aves/por-jaula/:jaulaId
  router.get('/por-jaula/:jaulaId', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(c, await service.listarPorJaula(c.req.param('criaderoId')!, c.req.param('jaulaId')));
  });

  // GET /aves/existe-codigo?codigo=&excluirAveId=
  router.get('/existe-codigo', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(
      c,
      await service.existeCodigo(
        c.req.param('criaderoId')!,
        c.req.query('codigo') ?? '',
        c.req.query('excluirAveId') ?? null
      )
    );
  });

  // GET /aves/:aveId
  router.get('/:aveId', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(c, await service.obtener(c.req.param('criaderoId')!, c.req.param('aveId')));
  });

  // GET /aves/:aveId/historial
  router.get('/:aveId/historial', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(c, await service.listarHistorial(c.req.param('criaderoId')!, c.req.param('aveId')));
  });

  // GET /aves/:aveId/evolucion
  router.get('/:aveId/evolucion', async (c) => {
    const { service } = buildDependencies(c.env.DB);

    return responder(c, await service.listarEvolucion(c.req.param('criaderoId')!, c.req.param('aveId')));
  });

  // POST /aves
  router.post('/', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(c, await service.crear(c.req.param('criaderoId')!, json.body), 201);
  });

  // PUT /aves/:aveId
  router.put('/:aveId', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.actualizar(c.req.param('criaderoId')!, c.req.param('aveId'), json.body)
    );
  });

  // PUT /aves/:aveId/jaula
  router.put('/:aveId/jaula', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.cambiarJaula(c.req.param('criaderoId')!, c.req.param('aveId'), json.body)
    );
  });

  // POST /aves/:aveId/eventos
  router.post('/:aveId/eventos', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.registrarEvento(c.req.param('criaderoId')!, c.req.param('aveId'), json.body),
      201
    );
  });

  // POST /aves/:aveId/evolucion
  router.post('/:aveId/evolucion', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const json = await leerJson(c);

    if (!json.ok) return c.json(CUERPO_INVALIDO, 400);

    return responder(
      c,
      await service.registrarEvolucion(c.req.param('criaderoId')!, c.req.param('aveId'), json.body),
      201
    );
  });

  // POST /aves/:aveId/finalizar-tratamiento  (body opcional { observacion })
  router.post('/:aveId/finalizar-tratamiento', async (c) => {
    const { service } = buildDependencies(c.env.DB);
    const texto = await c.req.text();
    let body: unknown;

    if (texto.trim()) {
      try {
        body = JSON.parse(texto);
      } catch {
        return c.json(CUERPO_INVALIDO, 400);
      }
    }

    return responder(
      c,
      await service.finalizarTratamiento(c.req.param('criaderoId')!, c.req.param('aveId'), body)
    );
  });

  return router;

}

export default createAvesRouter();
