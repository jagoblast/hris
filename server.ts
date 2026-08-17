import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import apiRoutes from './src/routes/api';
import { verifyJWT, signJWT } from './src/utils/jwt';
import { db } from './src/db/d1';
import { User } from './src/types';

// Import SSR Page Views
import { DashboardPage } from './app/routes/dashboard';
import { AttendancePage } from './app/routes/attendance';
import { LeavesPage } from './app/routes/leaves';
import { PayrollPage } from './app/routes/payroll';
import { ReimbursementsPage } from './app/routes/reimbursements';
import { MeetingsPage } from './app/routes/meetings';
import { EmployeesPage } from './app/routes/employees';
import { SettingsPage } from './app/routes/settings';
import { ApiDocsPage } from './app/routes/api-docs';
import { LoginPage } from './app/routes/login';

const app = new Hono();

// 1. Mount API Routes
app.route('/api/v1', apiRoutes);

// 2. Auth Helper
async function getAuthUser(c: any) {
  const token = getCookie(c, 'hris_token') || getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return await verifyJWT(token);
  } catch (e) {
    return null;
  }
}

// 3. Auth Guard
app.use('*', async (c, next) => {
  const path = c.req.path;
  
  if (
    path.startsWith('/api') || 
    path === '/login' || 
    path.startsWith('/assets') || 
    path.startsWith('/public') || 
    path === '/client.js'
  ) {
    await next();
    return;
  }

  const user = await getAuthUser(c);
  if (!user) {
    return c.redirect('/login');
  }

  c.set('user', user);
  await next();
});

// 4. SSR Frontend View Routes
app.get('/login', async (c) => {
  const user = await getAuthUser(c);
  if (user) return c.redirect('/');
  const page = await LoginPage();
  return c.html(page);
});

app.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const email = (body.email as string || '').trim().toLowerCase();
  const password = body.password as string || '';

  const user = await db
    .prepare('SELECT * FROM users WHERE email = ? AND status = "ACTIVE"')
    .bind(email)
    .first<User>();

  if (!user || (user.password_hash !== password && user.password !== password)) {
    const page = await LoginPage('Email atau password tidak sesuai. Silakan coba lagi.');
    return c.html(page);
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

  setCookie(c, 'auth_token', token, { path: '/', httpOnly: false, sameSite: 'Lax', maxAge: 604800 });
  setCookie(c, 'hris_token', token, { path: '/', httpOnly: false, sameSite: 'Lax', maxAge: 604800 });

  return c.redirect('/');
});

app.get('/', async (c) => {
  const user = c.get('user');
  const page = await DashboardPage(user);
  return c.html(page);
});

app.get('/attendance', async (c) => {
  const user = c.get('user');
  const page = await AttendancePage(user);
  return c.html(page);
});

app.get('/leaves', async (c) => {
  const user = c.get('user');
  const page = await LeavesPage(user);
  return c.html(page);
});

app.get('/payroll', async (c) => {
  const user = c.get('user');
  const month = c.req.query('month') ? Number(c.req.query('month')) : undefined;
  const year = c.req.query('year') ? Number(c.req.query('year')) : undefined;
  const page = await PayrollPage(user, month, year);
  return c.html(page);
});

app.get('/reimbursements', async (c) => {
  const user = c.get('user');
  const page = await ReimbursementsPage(user);
  return c.html(page);
});

app.get('/meetings', async (c) => {
  const user = c.get('user');
  const page = await MeetingsPage(user);
  return c.html(page);
});

app.get('/employees', async (c) => {
  const user = c.get('user');
  if (user.role === 'KARYAWAN') return c.redirect('/');
  const page = await EmployeesPage(user);
  return c.html(page);
});

app.get('/settings', async (c) => {
  const user = c.get('user');
  const page = await SettingsPage(user);
  return c.html(page);
});

app.get('/api-docs', async (c) => {
  const user = c.get('user');
  const page = await ApiDocsPage(user);
  return c.html(page);
});

// WAJIB: Hono menangani request sebagai worker (ini secara natif sudah sesuai standar Web Response Cloudflare)
export default app;
