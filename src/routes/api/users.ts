import { Hono } from 'hono';
import { db } from '../../db/d1';
import { requireAuth, requireRole } from '../../middleware/auth';
import { User } from '../../types';

const usersApi = new Hono();
usersApi.use('*', requireAuth());

// GET /api/v1/users
usersApi.get('/', async (c) => {
  const role = c.req.query('role');
  const res = await db.prepare('SELECT * FROM users').all<User>();
  let users = res.results.map(({ password_hash, ...safe }) => safe);

  if (role) {
    users = users.filter(u => u.role === role.toUpperCase());
  }

  return c.json({
    success: true,
    total: users.length,
    data: users,
  });
});

// POST /api/v1/users (Admin only)
usersApi.post('/', requireRole('ADMIN'), async (c) => {
  try {
    const body = await c.req.json();
    const { nip, name, email, password, role, position, department, phone, base_salary, allowance_transport, allowance_meal, leave_quota } = body;

    if (!nip || !name || !email || !password || !role || !position || !department) {
      return c.json({ success: false, error: 'Data karyawan tidak lengkap.' }, 400);
    }

    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<User>();
    if (existing) {
      return c.json({ success: false, error: 'Email sudah terdaftar.' }, 400);
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    await db
      .prepare(
        'INSERT INTO users (id, nip, name, email, password_hash, role, position, department, phone, base_salary, allowance_transport, allowance_meal, join_date, leave_quota, avatar, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        userId,
        nip,
        name,
        email,
        password,
        role,
        position,
        department,
        phone || '',
        Number(base_salary || 5000000),
        Number(allowance_transport || 500000),
        Number(allowance_meal || 500000),
        new Date().toISOString().split('T')[0],
        Number(leave_quota || 12),
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        'ACTIVE'
      )
      .run();

    return c.json({
      success: true,
      message: 'Karyawan baru berhasil ditambahkan.',
      data: { id: userId, nip, name, email, role },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default usersApi;
