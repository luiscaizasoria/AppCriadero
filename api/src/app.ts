import { Hono } from 'hono';
import defaultCriaderosRouter from './criaderos/criaderos.routes';
import defaultAuthRouter from './auth/auth.routes';
import defaultJaulasRouter from './jaulas/jaulas.routes';
import defaultCatalogosRouter from './catalogs/catalogs.routes';
import defaultAvesRouter from './aves/aves.routes';
import defaultCuidadosRouter from './cuidados/cuidados.routes';
import defaultSaludRouter from './salud/salud.routes';
import defaultHuevosRouter from './huevos/huevos.routes';
import defaultFinanzasRouter from './finanzas/finanzas.routes';
import defaultClientesRouter from './clientes/clientes.routes';
import defaultReportesRouter from './reportes/reportes.routes';


export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};


type AppRouter = Hono<any, any, any>;


type AppOptions = {
  criaderosRouter?: AppRouter;
  authRouter?: AppRouter;
  jaulasRouter?: AppRouter;
  catalogosRouter?: AppRouter;
  avesRouter?: AppRouter;
  cuidadosRouter?: AppRouter;
  saludRouter?: AppRouter;
  huevosRouter?: AppRouter;
  finanzasRouter?: AppRouter;
  clientesRouter?: AppRouter;
  reportesRouter?: AppRouter;
};



export function createApp(
  options: AppOptions = {}
) {

  const app = new Hono<{ Bindings: Env }>();


  const criaderosRouter =
    options.criaderosRouter ?? defaultCriaderosRouter;


  const authRouter =
    options.authRouter ?? defaultAuthRouter;


  const jaulasRouter =
    options.jaulasRouter ?? defaultJaulasRouter;


  const catalogosRouter =
    options.catalogosRouter ?? defaultCatalogosRouter;


  const avesRouter =
    options.avesRouter ?? defaultAvesRouter;


  const cuidadosRouter =
    options.cuidadosRouter ?? defaultCuidadosRouter;


  const saludRouter =
    options.saludRouter ?? defaultSaludRouter;


  const huevosRouter =
    options.huevosRouter ?? defaultHuevosRouter;


  const finanzasRouter =
    options.finanzasRouter ?? defaultFinanzasRouter;


  const clientesRouter =
    options.clientesRouter ?? defaultClientesRouter;


  const reportesRouter =
    options.reportesRouter ?? defaultReportesRouter;



  app.get('/api/v1/health', (c) => {

    return c.json({
      status: 'ok',
      service: 'criadero-kikirikis-api'
    });

  });



  app.route('/api/v1/criaderos', criaderosRouter);

  app.route('/api/v1/criaderos/:criaderoId/jaulas', jaulasRouter);

  app.route('/api/v1/criaderos/:criaderoId/jaulas/:jaulaId', cuidadosRouter);

  app.route('/api/v1/criaderos/:criaderoId/catalogos', catalogosRouter);

  app.route('/api/v1/criaderos/:criaderoId/aves', avesRouter);

  app.route('/api/v1/criaderos/:criaderoId/aves/:aveId', saludRouter);

  app.route('/api/v1/criaderos/:criaderoId', huevosRouter);

  app.route('/api/v1/criaderos/:criaderoId/finanzas', finanzasRouter);

  app.route('/api/v1/criaderos/:criaderoId/clientes', clientesRouter);

  app.route('/api/v1/criaderos/:criaderoId/reportes', reportesRouter);

  app.route('/api/v1/auth', authRouter);


  return app;

}


const app = createApp();

export default app;
