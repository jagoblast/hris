import { Hono } from 'hono';
import { db } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';
import { Reimbursement } from '../../types';

const reimburseApi = new Hono();
reimburseApi.use('*', requireAuth());

// GET /api/v1/reimbursements
reimburseApi.get('/', async (c) => {
  const user = c.get('user')!;
  const status = c.req.query('status');

  let res;
  if (user.role === 'KARYAWAN') {
    res = await db.prepare('SELECT * FROM reimbursements WHERE user_id = ?').bind(user.sub).all<Reimbursement>();
  } else {
    res = await db.prepare('SELECT * FROM reimbursements').all<Reimbursement>();
  }

  let items = res.results;
  if (status) {
    items = items.filter(r => r.status === status.toUpperCase());
  }

  return c.json({
    success: true,
    total: items.length,
    data: items,
  });
});

// POST /api/v1/reimbursements
reimburseApi.post('/', async (c) => {
  try {
    const user = c.get('user')!;
    const body = await c.req.json();
    const { category, amount, description, receipt_date, receipt_url } = body;

    if (!category || !amount || !description || !receipt_date) {
      return c.json({ success: false, error: 'Kategori, jumlah, deskripsi, dan tanggal kuitansi wajib diisi.' }, 400);
    }

    if (Number(amount) <= 0) {
      return c.json({ success: false, error: 'Nominal klaim harus lebih besar dari Rp 0.' }, 400);
    }

    const rmbId = `rmb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    await db
      .prepare(
        'INSERT INTO reimbursements (id, user_id, category, amount, description, receipt_date, receipt_url, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        rmbId,
        user.sub,
        category,
        Number(amount),
        description,
        receipt_date,
        receipt_url || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300',
        'PENDING'
      )
      .run();

    return c.json({
      success: true,
      message: 'Klaim reimbursement berhasil diajukan dan menunggu persetujuan HRD.',
      data: { id: rmbId, status: 'PENDING' },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// PATCH /api/v1/reimbursements/:id/approve
reimburseApi.patch('/:id/approve', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const user = c.get('user')!;
    const rmbId = c.req.param('id');
    const now = new Date().toISOString();

    const rmb = await db.prepare('SELECT * FROM reimbursements WHERE id = ?').bind(rmbId).first<Reimbursement>();
    if (!rmb) {
      return c.json({ success: false, error: 'Klaim tidak ditemukan.' }, 404);
    }

    await db
      .prepare('UPDATE reimbursements SET status = ?, approved_by = ?, approved_at = ?, paid_at = ? WHERE id = ?')
      .bind('APPROVED', user.sub, now, null, rmbId)
      .run();

    return c.json({
      success: true,
      message: `Klaim reimburse senilai Rp ${rmb.amount.toLocaleString('id-ID')} berhasil disetujui!`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// PATCH /api/v1/reimbursements/:id/reject
reimburseApi.patch('/:id/reject', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const user = c.get('user')!;
    const rmbId = c.req.param('id');
    const now = new Date().toISOString();

    const rmb = await db.prepare('SELECT * FROM reimbursements WHERE id = ?').bind(rmbId).first<Reimbursement>();
    if (!rmb) {
      return c.json({ success: false, error: 'Klaim tidak ditemukan.' }, 404);
    }

    await db
      .prepare('UPDATE reimbursements SET status = ?, approved_by = ?, approved_at = ?, paid_at = ? WHERE id = ?')
      .bind('REJECTED', user.sub, now, null, rmbId)
      .run();

    return c.json({
      success: true,
      message: 'Klaim reimbursement ditolak.',
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// PATCH /api/v1/reimbursements/:id/payout
reimburseApi.patch('/:id/payout', requireRole('ADMIN', 'HRD'), async (c) => {
  try {
    const user = c.get('user')!;
    const rmbId = c.req.param('id');
    const now = new Date().toISOString();

    const rmb = await db.prepare('SELECT * FROM reimbursements WHERE id = ?').bind(rmbId).first<Reimbursement>();
    if (!rmb) {
      return c.json({ success: false, error: 'Klaim tidak ditemukan.' }, 404);
    }

    await db
      .prepare('UPDATE reimbursements SET status = ?, approved_by = ?, approved_at = ?, paid_at = ? WHERE id = ?')
      .bind('PAID', user.sub, rmb.approved_at || now, now, rmbId)
      .run();

    return c.json({
      success: true,
      message: `Klaim reimbursement Rp ${rmb.amount.toLocaleString('id-ID')} telah dicairkan.`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default reimburseApi;
