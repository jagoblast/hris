import { Hono } from 'hono';
import { getDB } from '../../db/d1';
import { requireAuth } from '../../middleware/auth';

const usersApi = new Hono();
usersApi.use('*', requireAuth());

usersApi.get('/', async (c) => {
  try {
    const db = getDB(c);
    // Mengambil data pengguna tanpa mengembalikan password_hash
    const { results } = await db.prepare('SELECT id, nip, name, email, role, position, department, avatar, status, join_date, leave_quota FROM users ORDER BY name ASC').all();
    return c.json({ success: true, data: results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default usersApi;
