import { Hono } from 'hono';
import defaultCriaderosRouter from './criaderos/criaderos.routes';
import defaultAuthRouter from './auth/auth.routes';


export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};


type AppRouter = Hono<any, any, any>;


type AppOptions = {
  criaderosRouter?: AppRouter;
  authRouter?: AppRouter;
};



export function createApp(
  options: AppOptions = {}
) {

  const app = new Hono<{ Bindings: Env }>();


  const criaderosRouter =
    options.criaderosRouter ?? defaultCriaderosRouter;


  const authRouter =
    options.authRouter ?? defaultAuthRouter;



  app.get('/api/v1/health', (c) => {

    return c.json({
      status: 'ok',
      service: 'criadero-kikirikis-api'
    });

  });



  app.route('/api/v1/criaderos', criaderosRouter);

  app.route('/api/v1/auth', authRouter);


  return app;

}


const app = createApp();

export default app;
