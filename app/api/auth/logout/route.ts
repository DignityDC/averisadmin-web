import { NextResponse } from 'next/server';
import { siteUrl } from '@/lib/auth';

export async function GET(req: Request) {
  const res = NextResponse.redirect(`${siteUrl(req)}/login`, { status: 302 });
  res.cookies.set('sd_session', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}

export async function POST(req: Request) {
  const res = NextResponse.redirect(`${siteUrl(req)}/login`, { status: 302 });
  res.cookies.set('sd_session', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
