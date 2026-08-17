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

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}
