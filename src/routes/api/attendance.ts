import { Hono } from 'hono';
import { db } from '../../db/d1';
import { requireAuth } from '../../middleware/auth';
import { Attendance } from '../../types';

const attendanceApi = new Hono();
attendanceApi.use('*', requireAuth());

// Office standard work schedule
const OFFICE_START_TIME = '08:30:00';
const OFFICE_START_MINUTES = 8 * 60 + 30; // 510 mins

// GET /api/v1/attendance/today
attendanceApi.get('/today', async (c) => {
  const user = c.get('user')!;
  const today = new Date().toISOString().split('T')[0];

  const record = await db
    .prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?')
    .bind(user.sub, today)
    .first<Attendance>();

  return c.json({
    success: true,
    date: today,
    attendance: record || null,
    has_checked_in: !!record?.check_in_time,
    has_checked_out: !!record?.check_out_time,
  });
});

// POST /api/v1/attendance/check-in
attendanceApi.post('/check-in', async (c) => {
  try {
    const user = c.get('user')!;
    const body = await c.req.json().catch(() => ({}));
    const today = new Date().toISOString().split('T')[0];

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const checkInTime = `${hours}:${minutes}:${seconds}`;

    // Calculate late
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    let isLate = 0;
    let lateMinutes = 0;

    if (currentTotalMinutes > OFFICE_START_MINUTES) {
      isLate = 1;
      lateMinutes = currentTotalMinutes - OFFICE_START_MINUTES;
    }

    const existing = await db
      .prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?')
      .bind(user.sub, today)
      .first<Attendance>();

    if (existing && existing.check_in_time) {
      return c.json({
        success: false,
        error: `Anda sudah melakukan check-in hari ini pada pukul ${existing.check_in_time}.`,
      }, 400);
    }

    const attId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const lat = body.lat ?? -6.2088;
    const lng = body.lng ?? 106.8456;
    const location = body.location ?? 'Kantor Pusat Nusantara Digital';
    const notes = body.notes ?? (isLate ? `Terlambat ${lateMinutes} menit` : 'Tepat Waktu');
    const selfieUrl = body.selfie_url ?? user.department;
    const status = isLate ? 'LATE' : 'PRESENT';

    await db
      .prepare(
        'INSERT INTO attendance (id, user_id, date, check_in_time, check_out_time, check_in_lat, check_in_lng, check_in_location, is_late, late_minutes, work_hours, status, notes, selfie_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        attId,
        user.sub,
        today,
        checkInTime,
        null,
        lat,
        lng,
        location,
        isLate,
        lateMinutes,
        0,
        status,
        notes,
        selfieUrl
      )
      .run();

    return c.json({
      success: true,
      message: isLate
        ? `Check-in berhasil. Perhatian: Anda terdeteksi terlambat ${lateMinutes} menit (Batas: ${OFFICE_START_TIME.substring(0, 5)} WIB).`
        : 'Check-in berhasil! Selamat bekerja.',
      data: {
        id: attId,
        date: today,
        check_in_time: checkInTime,
        is_late: isLate,
        late_minutes: lateMinutes,
        status,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /api/v1/attendance/check-out
attendanceApi.post('/check-out', async (c) => {
  try {
    const user = c.get('user')!;
    const body = await c.req.json().catch(() => ({}));
    const today = new Date().toISOString().split('T')[0];

    const existing = await db
      .prepare('SELECT * FROM attendance WHERE user_id = ? AND date = ?')
      .bind(user.sub, today)
      .first<Attendance>();

    if (!existing || !existing.check_in_time) {
      return c.json({ success: false, error: 'Anda belum melakukan check-in hari ini.' }, 400);
    }

    if (existing.check_out_time) {
      return c.json({ success: false, error: `Anda sudah check-out hari ini pada ${existing.check_out_time}.` }, 400);
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const checkOutTime = `${hours}:${minutes}:${seconds}`;

    // Calculate work hours
    const [inH, inM, inS] = existing.check_in_time.split(':').map(Number);
    const inTotalSec = inH * 3600 + inM * 60 + (inS || 0);
    const outTotalSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const diffHours = Math.max(0, Math.round(((outTotalSec - inTotalSec) / 3600) * 10) / 10);

    const notes = body.notes ? `${existing.notes || ''} | Out: ${body.notes}` : existing.notes;

    await db
      .prepare('UPDATE attendance SET check_out_time = ?, work_hours = ?, notes = ? WHERE id = ?')
      .bind(checkOutTime, diffHours, notes, existing.id)
      .run();

    return c.json({
      success: true,
      message: `Check-out berhasil pada ${checkOutTime}. Total jam kerja: ${diffHours} jam.`,
      data: {
        id: existing.id,
        check_out_time: checkOutTime,
        work_hours: diffHours,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// GET /api/v1/attendance/history
attendanceApi.get('/history', async (c) => {
  const user = c.get('user')!;
  const targetUserId = c.req.query('user_id') || (user.role === 'KARYAWAN' ? user.sub : undefined);
  const date = c.req.query('date');

  let res;
  if (targetUserId) {
    res = await db.prepare('SELECT * FROM attendance WHERE user_id = ?').bind(targetUserId).all<Attendance>();
  } else if (date) {
    res = await db.prepare('SELECT * FROM attendance WHERE date = ?').bind(date).all<Attendance>();
  } else {
    res = await db.prepare('SELECT * FROM attendance').all<Attendance>();
  }

  return c.json({
    success: true,
    total: res.results.length,
    data: res.results,
  });
});

export default attendanceApi;
