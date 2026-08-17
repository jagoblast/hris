import { Hono } from 'hono';
import { getDB } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';

const payrollApi = new Hono();
payrollApi.use('*', requireAuth());

payrollApi.get('/', async (c) => {
  try {
    const db = getDB(c);
    const user = c.get('user')!;
    
    let query = `
      SELECT p.*, u.name as user_name, u.position as user_position, u.department as user_department 
      FROM payroll p 
      LEFT JOIN users u ON p.user_id = u.id 
    `;
    let results;

    if (user.role === 'KARYAWAN') {
      query += ' WHERE p.user_id = ? AND p.status = "PAID" ORDER BY p.period_year DESC, p.period_month DESC';
      const res = await db.prepare(query).bind(user.sub).all();
      results = res.results;
    } else {
      query += ' ORDER BY p.period_year DESC, p.period_month DESC, p.created_at DESC';
      const res = await db.prepare(query).all();
      results = res.results;
    }

    return c.json({ success: true, data: results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

payrollApi.post('/', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const db = getDB(c);
    const body = await c.req.json();
    const id = 'pay_' + Date.now().toString(36);
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO payroll (
        id, user_id, period_month, period_year, base_salary, allowance_transport, allowance_meal, 
        overtime_pay, reimburse_pay, late_deduction, tax_deduction, bpjs_deduction, 
        gross_salary, net_salary, total_attendance_days, total_late_days, total_leave_days, total_alpha_days, 
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?)
    `).bind(
      id, body.user_id, Number(body.period_month), Number(body.period_year), 
      Number(body.base_salary), Number(body.allowance_transport || 0), Number(body.allowance_meal || 0),
      Number(body.overtime_pay || 0), Number(body.reimburse_pay || 0), Number(body.late_deduction || 0),
      Number(body.tax_deduction || 0), Number(body.bpjs_deduction || 0), Number(body.gross_salary),
      Number(body.net_salary), Number(body.total_attendance_days || 0), Number(body.total_late_days || 0),
      Number(body.total_leave_days || 0), Number(body.total_alpha_days || 0), now
    ).run();

    return c.json({ success: true, message: 'Data slip gaji (payroll) berhasil dibuat' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

payrollApi.patch('/:id/status', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const db = getDB(c);
    const id = c.req.param('id');
    const body = await c.req.json();
    const now = new Date().toISOString();

    let query = 'UPDATE payroll SET status = ?';
    const binds: any[] = [body.status];

    if (body.status === 'PAID') {
      query += ', paid_at = ?';
      binds.push(now);
    }
    
    query += ' WHERE id = ?';
    binds.push(id);

    await db.prepare(query).bind(...binds).run();
    return c.json({ success: true, message: `Status slip gaji diubah menjadi ${body.status}` });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default payrollApi;
