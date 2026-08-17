import { Hono } from 'hono';
import { getDB, getSettingValue } from '../../db/d1';
import { requireAuth } from '../../middleware/auth';
import { Attendance } from '../../types';

const attendanceApi = new Hono();
attendanceApi.use('*', requireAuth());

attendanceApi.get('/', async (c) => {
  try {
    const db = getDB(c);
    const user = c.get('user')!;
    const records = await db.prepare('SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC').bind(user.sub).all();
    return c.json({ success: true, data: records.results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

attendanceApi.post('/check-in', async (c) => {
  try {
    const db = getDB(c);
    const user = c.get('user')!;
    const body = await c.req.json().catch(() => ({}));
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 8);
    
    const existing = await db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').bind(user.sub, today).first<Attendance>();
    if (existing) return c.json({ success: false, error: 'Sudah check-in hari ini.' }, 400);

    const workStartTime = await getSettingValue(db, 'WORK_START_TIME', '08:30');
    const isLate = currentTime > workStartTime ? 1 : 0;
    
    await db.prepare(`INSERT INTO attendance (id, user_id, date, check_in_time, is_late, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind('att_' + Date.now().toString(36), user.sub, today, currentTime, isLate, 'PRESENT', new Date().toISOString()).run();

    return c.json({ success: true, message: 'Check-in berhasil' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

attendanceApi.post('/check-out', async (c) => {
  try {
    const db = getDB(c);
    const user = c.get('user')!;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 8);
    
    const existing = await db.prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?').bind(user.sub, today).first<Attendance>();
    if (!existing) return c.json({ success: false, error: 'Belum check-in.' }, 400);

    await db.prepare('UPDATE attendance SET check_out_time = ? WHERE id = ?').bind(currentTime, existing.id).run();
    return c.json({ success: true, message: 'Check-out berhasil' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default attendanceApi;
