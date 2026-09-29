import { Hono } from 'hono';

const app = new Hono();

app.get('/api/v1/health', (c) => {
  return c.json({ status: 'ok', service: 'criadero-kikirikis-api' });
});

export default app;
