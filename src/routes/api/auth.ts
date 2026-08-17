import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { getDB } from '../../db/d1';
import { signJWT } from '../../utils/jwt';
import { requireAuth } from '../../middleware/auth';
import { User } from '../../types';

const authApi = new Hono();

// POST /api/v1/auth/login
authApi.post('/login', async (c) => {
  try {
    const db = getDB(c);
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ success: false, error: 'Email dan password wajib diisi.' }, 400);
    }

    const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();

    if (!user || user.password_hash !== password) {
      return c.json({ success: false, error: 'Email atau password salah.' }, 401);
    }

    if (user.status !== 'ACTIVE') {
      return c.json({ success: false, error: 'Akun Anda dinonaktifkan. Hubungi HRD/Admin.' }, 403);
    }

    const token = await signJWT({
      sub: user.id,
      nip: user.nip,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      position: user.position,
      avatar: user.avatar,
    });

    setCookie(c, 'auth_token', token, {
      path: '/',
      httpOnly: false, 
      secure: false,
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    const { password_hash, ...safeUser } = user;

    return c.json({
      success: true,
      message: 'Login berhasil',
      token,
      token_type: 'Bearer',
      expires_in: 7 * 24 * 60 * 60,
      user: safeUser,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Internal server error' }, 500);
  }
});

// POST /api/v1/auth/register
authApi.post('/register', async (c) => {
  try {
    const db = getDB(c);
    const contentType = c.req.header('content-type') || '';
    let name, email, password;

    if (contentType.includes('application/json')) {
      const body = await c.req.json();
      name = body.name;
      email = body.email;
      password = body.password;
    } 
    else {
      const body = await c.req.parseBody();
      name = body.name as string;
      email = body.email as string;
      password = body.password as string;
    }

    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();
    password = password || '';

    const isForm = contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data');

    if (!name || !email || !password) {
      return isForm 
        ? c.redirect('/register?error=Semua+field+wajib+diisi.') 
        : c.json({ success: false, error: 'Semua field wajib diisi.' }, 400);
    }

    const existingUser = await db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>();

    if (existingUser) {
      return isForm 
        ? c.redirect('/register?error=Email+sudah+terdaftar.+Gunakan+email+lain.') 
        : c.json({ success: false, error: 'Email sudah terdaftar.' }, 400);
    }

    const id = 'usr_' + Date.now().toString(36);
    const nip = 'ADM-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const today = new Date().toISOString().split('T')[0];
    
    await db
      .prepare(`
        INSERT INTO users 
        (id, nip, name, email, password_hash, role, position, department, phone, base_salary, allowance_transport, allowance_meal, join_date, leave_quota, avatar, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id, nip, name, email, password, 
        'ADMIN', 'System Administrator', 'Information Technology', 
        '', 10000000, 1000000, 1000000, 
        today, 12, '', 'ACTIVE'
      )
      .run();

    if (isForm) {
      return c.redirect('/login');
    }

    return c.json({
      success: true,
      message: 'Registrasi Admin berhasil',
      user: { id, nip, name, email, role: 'ADMIN' }
    });

  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Internal server error' }, 500);
  }
});

// POST /api/v1/auth/logout
authApi.post('/logout', (c) => {
  deleteCookie(c, 'auth_token', { path: '/' });
  return c.json({ success: true, message: 'Logout berhasil' });
});

// GET /api/v1/auth/me
authApi.get('/me', requireAuth(), async (c) => {
  const db = getDB(c);
  const jwtUser = c.get('user')!;
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(jwtUser.sub).first<User>();
  if (!user) {
    return c.json({ success: false, error: 'User tidak ditemukan' }, 404);
  }
  const { password_hash, ...safeUser } = user;
  return c.json({ success: true, user: safeUser });
});

// GET /api/v1/auth/demo-accounts
authApi.get('/demo-accounts', async (c) => {
  const db = getDB(c);
  const res = await db.prepare('SELECT id, nip, name, email, role, position, department, avatar FROM users').all<Partial<User>>();
  return c.json({
    success: true,
    data: res.results,
    note: 'Password default untuk semua akun demo: "admin123" (Admin), "hrd123" (HRD), "karyawan123" / "dewi123" / "rizky123" (Karyawan)'
  });
});

export default authApi;
