import { NextResponse } from 'next/server';
import { siteUrl } from '@/lib/auth';

export async function GET() {
  const res = NextResponse.redirect(`${siteUrl()}/login`, { status: 302 });
  res.cookies.set('sd_session', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}

export async function POST() {
  const res = NextResponse.redirect(`${siteUrl()}/login`, { status: 302 });
  res.cookies.set('sd_session', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
