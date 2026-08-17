import { Hono } from 'hono';
import { getDB } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';

const leavesApi = new Hono();
leavesApi.use('*', requireAuth());

leavesApi.get('/', async (c) => {
  try {
    const db = getDB(c);
    const user = c.get('user')!;
    let query = `
      SELECT l.*, u.name as user_name, u.position as user_position, u.department as user_department, a.name as approved_by_name 
      FROM leaves l 
      LEFT JOIN users u ON l.user_id = u.id 
      LEFT JOIN users a ON l.approved_by = a.id 
    `;
    
    let results;
    if (user.role === 'KARYAWAN') {
      query += ' WHERE l.user_id = ? ORDER BY l.created_at DESC';
      const res = await db.prepare(query).bind(user.sub).all();
      results = res.results;
    } else {
      query += ' ORDER BY l.created_at DESC';
      const res = await db.prepare(query).all();
      results = res.results;
    }
    return c.json({ success: true, data: results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

leavesApi.post('/', async (c) => {
  try {
    const db = getDB(c);
    const user = c.get('user')!;
    const body = await c.req.json();
    const id = 'lv_' + Date.now().toString(36);
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO leaves (id, user_id, leave_type, start_date, end_date, total_days, reason, attachment_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `).bind(
      id, user.sub, body.leave_type, body.start_date, body.end_date, 
      Number(body.total_days || 1), body.reason, body.attachment_url || null, now
    ).run();
    
    return c.json({ success: true, message: 'Pengajuan cuti berhasil dibuat' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

leavesApi.patch('/:id/status', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const db = getDB(c);
    const user = c.get('user')!;
    const id = c.req.param('id');
    const body = await c.req.json();
    const now = new Date().toISOString();

    await db.prepare(`
      UPDATE leaves 
      SET status = ?, approved_by = ?, approved_at = ?, rejection_reason = ? 
      WHERE id = ?
    `).bind(
      body.status, user.sub, now, body.rejection_reason || null, id
    ).run();

    // Logika Pengurangan Sisa Kuota Cuti Otomatis jika disetujui
    if (body.status === 'APPROVED') {
       const leave = await db.prepare('SELECT user_id, leave_type, total_days FROM leaves WHERE id = ?').bind(id).first<any>();
       if (leave && leave.leave_type === 'TAHUNAN') {
          await db.prepare('UPDATE users SET leave_quota = MAX(0, leave_quota - ?) WHERE id = ?')
            .bind(leave.total_days, leave.user_id).run();
       }
    }

    return c.json({ success: true, message: `Status cuti berhasil diubah menjadi ${body.status}` });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default leavesApi;
