import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
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

// 1. Mount API Routes for Android Mobile & Web Clients
app.route('/api/v1', apiRoutes);

// 2. Helper to extract authenticated user from Cookie or Header
async function getAuthUser(c: any) {
  const token = getCookie(c, 'hris_token') || getCookie(c, 'auth_token') || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const payload = await verifyJWT(token);
    return payload;
  } catch (e) {
    return null;
  }
}

// 3. SSR Frontend View Routes (app/)

// Login Page (GET)
app.get('/login', async (c) => {
  const user = await getAuthUser(c);
  if (user) return c.redirect('/');
  return c.html(LoginPage());
});

// Login Handler (POST Form Submit)
app.post('/login', async (c) => {
  const body = await c.req.parseBody();
  const email = (body.email as string || '').trim().toLowerCase();
  const password = body.password as string || '';

  const user = await db
    .prepare('SELECT * FROM users WHERE email = ? AND status = "ACTIVE"')
    .bind(email)
    .first<User>();

  if (!user || (user.password_hash !== password && user.password !== password)) {
    return c.html(LoginPage('Email atau password tidak sesuai. Silakan coba lagi.'));
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
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  setCookie(c, 'hris_token', token, {
    path: '/',
    httpOnly: false,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  return c.redirect('/');
});

// Auth Guard for SSR Web Pages
app.use('*', async (c, next) => {
  const path = c.req.path;
  
  // Abaikan pengecekan token untuk rute publik dan file statis
  if (
    path.startsWith('/api') || 
    path === '/login' || 
    path.startsWith('/public') || 
    path.startsWith('/assets') || 
    path === '/client.js'
  ) {
    // WAJIB RETURN NEXT agar Response tidak terputus (Penyebab error Cloudflare)
    return next();
  }

  const user = await getAuthUser(c);
  if (!user) {
    return c.redirect('/login');
  }

  c.set('user', user);
  
  // WAJIB RETURN NEXT agar Response tidak terputus
  return next();
});

// Dashboard Overview (Bento Grid)
app.get('/', async (c) => {
  const user = c.get('user');
  const page = await DashboardPage(user);
  return c.html(page);
});

// Absensi Online
app.get('/attendance', async (c) => {
  const user = c.get('user');
  const page = await AttendancePage(user);
  return c.html(page);
});

// Cuti & Izin
app.get('/leaves', async (c) => {
  const user = c.get('user');
  const page = await LeavesPage(user);
  return c.html(page);
});

// Payroll Otomatis
app.get('/payroll', async (c) => {
  const user = c.get('user');
  const month = c.req.query('month') ? Number(c.req.query('month')) : undefined;
  const year = c.req.query('year') ? Number(c.req.query('year')) : undefined;
  const page = await PayrollPage(user, month, year);
  return c.html(page);
});

// Klaim & Reimburse
app.get('/reimbursements', async (c) => {
  const user = c.get('user');
  const page = await ReimbursementsPage(user);
  return c.html(page);
});

// Rapat / Meetings
app.get('/meetings', async (c) => {
  const user = c.get('user');
  const page = await MeetingsPage(user);
  return c.html(page);
});

// Data Karyawan (Admin / HRD only)
app.get('/employees', async (c) => {
  const user = c.get('user');
  if (user.role === 'KARYAWAN') {
    return c.redirect('/');
  }
  const page = await EmployeesPage(user);
  return c.html(page);
});

// Pengaturan Perusahaan & Jam Kerja (D1 Settings Table)
app.get('/settings', async (c) => {
  const user = c.get('user');
  const page = await SettingsPage(user);
  return c.html(page);
});

// Android API Docs & Sandbox
app.get('/api-docs', async (c) => {
  const user = c.get('user');
  const page = ApiDocsPage(user);
  return c.html(page);
});


// =====================================================================
// 4. ADAPTOR LINGKUNGAN (CLOUDFARE PAGES vs LOKAL)
// =====================================================================

// Ekspor default objek yang dibutuhkan oleh Cloudflare Pages
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    try {
      // Jalankan aplikasi Hono
      const res = await app.fetch(request, env, ctx);

      // Tangkap aset statis (CSS/JS) yang dihasilkan Vite
      if (res.status === 404 && env.ASSETS) {
        return await env.ASSETS.fetch(request);
      }

      return res;
    } catch (error) {
      console.error('Unhandled Server Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

// Adaptor untuk pengembangan lokal (npm run dev)
if (typeof process !== 'undefined' && process.release?.name === 'node') {
  import('@hono/node-server').then(({ serve }) => {
    import('@hono/node-server/serve-static').then(({ serveStatic }) => {
      
      // Serve static assets secara lokal
      app.use('/public/*', serveStatic({ root: './' }));
      app.use('/assets/*', serveStatic({ root: './dist' }));
      app.use('/client.js', serveStatic({ path: './public/client.js' }));
      app.use('/client.ts', serveStatic({ path: './client.ts' }));

      const port = 3000;
      console.log(`🚀 Nusantara HRIS Bento Server running locally on http://0.0.0.0:${port}`);
      serve({
        fetch: app.fetch,
        port,
        hostname: '0.0.0.0',
      });
    });
  });
}
