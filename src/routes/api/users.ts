import { Hono } from 'hono';
import { getDB } from '../../db/d1';
import { requireAuth } from '../../middleware/auth';

const usersApi = new Hono();
usersApi.use('*', requireAuth());

usersApi.get('/', async (c) => {
  try {
    const db = getDB(c);
    const res = await db.prepare('SELECT id, nip, name, email, role, position, department FROM users').all();
    return c.json({ success: true, data: res.results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default usersApi;
