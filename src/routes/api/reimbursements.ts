import { Hono } from 'hono';
import { getDB } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';

const reimbursementsApi = new Hono();
reimbursementsApi.use('*', requireAuth());

reimbursementsApi.get('/', async (c) => {
  try {
    const db = getDB(c);
    const res = await db.prepare('SELECT * FROM reimbursements ORDER BY created_at DESC').all();
    return c.json({ success: true, data: res.results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

reimbursementsApi.post('/:id/approve', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const db = getDB(c);
    const id = c.req.param('id');
    const user = c.get('user')!;
    await db.prepare('UPDATE reimbursements SET status = "APPROVED", approved_by = ?, approved_at = ? WHERE id = ?')
      .bind(user.sub, new Date().toISOString(), id).run();
    return c.json({ success: true, message: 'Berhasil disetujui' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default reimbursementsApi;
