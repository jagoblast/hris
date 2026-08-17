import { Hono } from 'hono';
import { getDB } from '../../db/d1';
import { requireAuth } from '../../middleware/auth';

const leavesApi = new Hono();
leavesApi.use('*', requireAuth());

leavesApi.get('/', async (c) => {
  try {
    const db = getDB(c);
    const res = await db.prepare('SELECT * FROM leaves ORDER BY created_at DESC').all();
    return c.json({ success: true, data: res.results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default leavesApi;
