import { Hono } from 'hono';
import criaderosRouter from './criaderos/criaderos.routes';

const app = new Hono();

app.get('/api/v1/health', (c) => {
  return c.json({ status: 'ok', service: 'criadero-kikirikis-api' });
});

app.route('/api/v1/criaderos', criaderosRouter);

export default app;
