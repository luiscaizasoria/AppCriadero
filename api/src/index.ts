import { Hono } from 'hono';
import criaderosRouter from './criaderos/criaderos.routes';
import authRouter from './auth/auth.routes';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

app.get('/api/v1/health', (c) => {
  return c.json({ status: 'ok', service: 'criadero-kikirikis-api' });
});

app.route('/api/v1/criaderos', criaderosRouter);
app.route('/api/v1/auth', authRouter);

export default app;
