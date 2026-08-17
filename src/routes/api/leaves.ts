import { Hono } from 'hono';
import { db } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';
import { LeaveRequest, User } from '../../types';

const leavesApi = new Hono();
leavesApi.use('*', requireAuth());

// GET /api/v1/leaves/quota
leavesApi.get('/quota', async (c) => {
  const user = c.get('user')!;
  const userData = await db.prepare('SELECT leave_quota FROM users WHERE id = ?').bind(user.sub).first<User>();
  
  const leaves = await db.prepare('SELECT * FROM leaves WHERE user_id = ?').bind(user.sub).all<LeaveRequest>();
  const approvedLeaves = leaves.results.filter(l => l.status === 'APPROVED');
  const usedDays = approvedLeaves.reduce((sum, l) => sum + (l.leave_type === 'TAHUNAN' ? l.total_days : 0), 0);
  const pendingRequests = leaves.results.filter(l => l.status === 'PENDING').length;

  return c.json({
    success: true,
    quota: userData?.leave_quota ?? 12,
    used_days: usedDays,
    pending_count: pendingRequests,
  });
});

// GET /api/v1/leaves
leavesApi.get('/', async (c) => {
  const user = c.get('user')!;
  const status = c.req.query('status');

  let res;
  if (user.role === 'KARYAWAN') {
    res = await db.prepare('SELECT * FROM leaves WHERE user_id = ?').bind(user.sub).all<LeaveRequest>();
  } else {
    res = await db.prepare('SELECT * FROM leaves').all<LeaveRequest>();
  }

  let items = res.results;
  if (status) {
    items = items.filter(l => l.status === status.toUpperCase());
  }

  return c.json({
    success: true,
    total: items.length,
    data: items,
  });
});

// POST /api/v1/leaves
leavesApi.post('/', async (c) => {
  try {
    const user = c.get('user')!;
    const body = await c.req.json();
    const { leave_type, start_date, end_date, total_days, reason, attachment_url } = body;

    if (!leave_type || !start_date || !end_date || !total_days || !reason) {
      return c.json({ success: false, error: 'Semua field permohonan cuti wajib diisi.' }, 400);
    }

    // Check user quota if annual leave
    if (leave_type === 'TAHUNAN') {
      const u = await db.prepare('SELECT leave_quota FROM users WHERE id = ?').bind(user.sub).first<User>();
      if (u && u.leave_quota < Number(total_days)) {
        return c.json({
          success: false,
          error: `Sisa kuota cuti tahunan Anda (${u.leave_quota} hari) tidak mencukupi untuk pengajuan ${total_days} hari.`,
        }, 400);
      }
    }

    const leaveId = `lv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    await db
      .prepare(
        'INSERT INTO leaves (id, user_id, leave_type, start_date, end_date, total_days, reason, attachment_url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        leaveId,
        user.sub,
        leave_type,
        start_date,
        end_date,
        Number(total_days),
        reason,
        attachment_url || null,
        'PENDING'
      )
      .run();

    return c.json({
      success: true,
      message: 'Pengajuan cuti/izin berhasil dikirim ke HRD untuk ditinjau.',
      data: { id: leaveId, status: 'PENDING' },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// PATCH /api/v1/leaves/:id/approve (HRD & Admin only)
leavesApi.patch('/:id/approve', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const user = c.get('user')!;
    const leaveId = c.req.param('id');
    const now = new Date().toISOString();

    const leave = await db.prepare('SELECT * FROM leaves WHERE id = ?').bind(leaveId).first<LeaveRequest>();
    if (!leave) {
      return c.json({ success: false, error: 'Pengajuan cuti tidak ditemukan.' }, 404);
    }

    if (leave.status !== 'PENDING') {
      return c.json({ success: false, error: `Pengajuan cuti sudah berstatus ${leave.status}.` }, 400);
    }

    await db
      .prepare('UPDATE leaves SET status = ?, approved_by = ?, approved_at = ?, rejection_reason = ? WHERE id = ?')
      .bind('APPROVED', user.sub, now, null, leaveId)
      .run();

    return c.json({
      success: true,
      message: `Permohonan cuti karyawan ${leave.user_name || ''} berhasil disetujui 1-klik!`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// PATCH /api/v1/leaves/:id/reject (HRD & Admin only)
leavesApi.patch('/:id/reject', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const user = c.get('user')!;
    const leaveId = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const reason = body.reason || 'Kebutuhan operasional mendesak di jadwal tersebut.';
    const now = new Date().toISOString();

    const leave = await db.prepare('SELECT * FROM leaves WHERE id = ?').bind(leaveId).first<LeaveRequest>();
    if (!leave) {
      return c.json({ success: false, error: 'Pengajuan cuti tidak ditemukan.' }, 404);
    }

    await db
      .prepare('UPDATE leaves SET status = ?, approved_by = ?, approved_at = ?, rejection_reason = ? WHERE id = ?')
      .bind('REJECTED', user.sub, now, reason, leaveId)
      .run();

    return c.json({
      success: true,
      message: 'Permohonan cuti telah ditolak.',
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default leavesApi;
