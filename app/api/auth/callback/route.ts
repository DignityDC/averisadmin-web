import { NextResponse } from 'next/server';
import { createSession, siteUrl } from '@/lib/auth';
import { levelFromRoles } from '@/lib/roles';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${siteUrl()}/login?error=missing_code`);
  }

  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID || '',
    client_secret: process.env.DISCORD_CLIENT_SECRET || '',
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${siteUrl()}/api/auth/callback`,
  });

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    return NextResponse.redirect(`${siteUrl()}/login?error=oauth`);
  }

  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const user = await userRes.json();

  const guildId = process.env.DISCORD_GUILD_ID;
  const memberRes = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!memberRes.ok) {
    return NextResponse.redirect(`${siteUrl()}/login?error=not_in_guild`);
  }
  const member = await memberRes.json();
  const level = levelFromRoles(member.roles || []);
  if (!level) {
    return NextResponse.redirect(`${siteUrl()}/login?error=no_staff_role`);
  }

  const jwt = await createSession({
    id: user.id,
    username: user.global_name || user.username,
    avatar: user.avatar,
    level,
  });

  const res = NextResponse.redirect(`${siteUrl()}/`);
  res.cookies.set('sd_session', jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
