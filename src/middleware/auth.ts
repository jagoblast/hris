import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '../utils/jwt';
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
    token = getCookie(c, 'auth_token');
  }

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      c.set('user', payload);
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
