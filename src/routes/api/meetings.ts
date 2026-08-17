import { Hono } from 'hono';
import { getDB } from '../../db/d1';
import { requireAuth } from '../../middleware/auth';

const meetingsApi = new Hono();
meetingsApi.use('*', requireAuth());

meetingsApi.get('/', async (c) => {
  try {
    const db = getDB(c);
    const res = await db.prepare('SELECT * FROM meetings ORDER BY date ASC').all();
    return c.json({ success: true, data: res.results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default meetingsApi;
