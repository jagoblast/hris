import { Hono } from 'hono';
import { getDB } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';

const reimbursementsApi = new Hono();
reimbursementsApi.use('*', requireAuth());

reimbursementsApi.get('/', async (c) => {
  try {
    const db = getDB(c);
    const user = c.get('user')!;
    let query = `
      SELECT r.*, u.name as user_name, u.department as user_department, a.name as approved_by_name 
      FROM reimbursements r 
      LEFT JOIN users u ON r.user_id = u.id 
      LEFT JOIN users a ON r.approved_by = a.id 
    `;
    
    let results;
    if (user.role === 'KARYAWAN') {
      query += ' WHERE r.user_id = ? ORDER BY r.created_at DESC';
      const res = await db.prepare(query).bind(user.sub).all();
      results = res.results;
    } else {
      query += ' ORDER BY r.created_at DESC';
      const res = await db.prepare(query).all();
      results = res.results;
    }
    return c.json({ success: true, data: results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

reimbursementsApi.post('/', async (c) => {
  try {
    const db = getDB(c);
    const user = c.get('user')!;
    const body = await c.req.json();
    const id = 'rmb_' + Date.now().toString(36);
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO reimbursements (id, user_id, category, amount, description, receipt_date, receipt_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).bind(
      id, user.sub, body.category, Number(body.amount), body.description, body.receipt_date, body.receipt_url || '', now
    ).run();

    return c.json({ success: true, message: 'Klaim reimbursement berhasil diajukan' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

reimbursementsApi.patch('/:id/status', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const db = getDB(c);
    const user = c.get('user')!;
    const id = c.req.param('id');
    const body = await c.req.json();
    const now = new Date().toISOString();

    let query = 'UPDATE reimbursements SET status = ?, approved_by = ?, approved_at = ?';
    const binds: any[] = [body.status, user.sub, now];

    if (body.status === 'PAID') {
      query += ', paid_at = ?';
      binds.push(now);
    }
    
    query += ' WHERE id = ?';
    binds.push(id);

    await db.prepare(query).bind(...binds).run();

    return c.json({ success: true, message: `Reimbursement berhasil diubah ke status ${body.status}` });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default reimbursementsApi;
