import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyJWT } from '../utils/jwt'; // DIPERBAIKI: Menggunakan verifyJWT
import { JWTPayload, UserRole } from '../types';

declare module 'hono' {
  interface ContextVariableMap {
    user?: JWTPayload;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  let token: string | undefined;

  // Check Bearer Token (Android API & Mobile apps)
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // Check Cookie (Web SSR navigation)
  if (!token) {
    // Tambahkan fallback hris_token dan auth_token agar sama dengan konfigurasi setCookie
    token = getCookie(c, 'auth_token') || getCookie(c, 'hris_token');
  }

  if (token) {
    try {
      const payload = await verifyJWT(token); // DIPERBAIKI: Sesuai dengan penamaan di server.ts
      if (payload) {
        c.set('user', payload);
      }
    } catch (err) {
      // Abaikan jika token invalid/expired, middleware akan lanjut dan dicegat oleh requireAuth
    }
  }

  await next();
}

export function requireAuth() {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user) {
      // If it's an API request, return JSON 401
      if (c.req.path.startsWith('/api/')) {
        return c.json({
          success: false,
          error: 'Unauthorized. Silakan login atau sertakan Bearer JWT Token di Authorization header.',
          code: 'UNAUTHORIZED'
        }, 401);
      }
      // If web SSR, redirect to login
      return c.redirect('/login');
    }
    await next();
  };
}

export function requireRole(...roles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user) {
      if (c.req.path.startsWith('/api/')) {
        return c.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
      }
      return c.redirect('/login');
    }

    if (!roles.includes(user.role)) {
      if (c.req.path.startsWith('/api/')) {
        return c.json({
          success: false,
          error: `Forbidden. Role ${user.role} tidak memiliki hak akses ke endpoint ini. Membutuhkan role: ${roles.join(', ')}`,
          code: 'FORBIDDEN'
        }, 403);
      }
      return c.html(`
        <div style="font-family: system-ui; text-align: center; padding: 50px;">
          <h2>Akses Ditolak (403 Forbidden)</h2>
          <p>Akun Anda (${user.role}) tidak memiliki izin untuk melihat halaman ini.</p>
          <a href="/" style="color: #2563eb; text-decoration: underline;">Kembali ke Dashboard</a>
        </div>
      `, 403);
    }

    await next();
  };
}
