import { sign, verify } from 'hono/jwt';
import { JWTPayload, User } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'hris_super_secure_jwt_secret_key_2026_hs256_cloud';

export async function generateToken(user: User): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + (7 * 24 * 60 * 60); // 7 days expiration

  const payload: JWTPayload = {
    sub: user.id,
    nip: user.nip || '',
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || '',
    position: user.position || '',
    avatar: user.avatar,
    iat,
    exp,
  };

  return await sign(payload as any, JWT_SECRET, 'HS256');
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, JWT_SECRET, 'HS256');
    return payload as unknown as JWTPayload;
  } catch (err) {
    return null;
  }
}

export async function signJWT(payload: Partial<JWTPayload>): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + (7 * 24 * 60 * 60);
  const fullPayload = {
    ...payload,
    iat,
    exp,
  };
  return await sign(fullPayload as any, JWT_SECRET, 'HS256');
}

export const verifyJWT = verifyToken;
