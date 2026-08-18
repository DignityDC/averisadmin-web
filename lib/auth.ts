import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { StaffLevel } from './roles';

export type SessionUser = {
  id: string;
  username: string;
  avatar: string | null;
  level: StaffLevel;
};

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(value);
}

export async function createSession(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function readSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get('sd_session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.level) return null;
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

const PRODUCTION_SITE = 'https://averisadmin-web.vercel.app';

function isLocalHost(value: string) {
  return /localhost|127\.0\.0\.1/i.test(value);
}

function hostFromRequest(req?: Request) {
  if (!req) return '';
  return (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0].trim();
}

export function siteUrl(req?: Request) {
  const host = hostFromRequest(req);
  if (host && !isLocalHost(host)) {
    const proto = req?.headers.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }

  if (process.env.VERCEL) {
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || '';
    if (vercel) return `https://${vercel.replace(/^https?:\/\//, '')}`;
    return PRODUCTION_SITE;
  }

  const env = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
  if (env && !isLocalHost(env)) return env;

  if (host) {
    const proto = req?.headers.get('x-forwarded-proto') || 'http';
    return `${proto}://${host}`;
  }

  return env || 'http://localhost:3000';
}

export function oauthRedirectUri(req: Request) {
  return `${siteUrl(req)}/api/auth/callback`;
}
