import { NextResponse } from 'next/server';
import { createSession, oauthRedirectUri, siteUrl } from '@/lib/auth';
import { levelFromRoles } from '@/lib/roles';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const origin = siteUrl(req);
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const redirectUri = oauthRedirectUri(req);
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID || '',
    client_secret: process.env.DISCORD_CLIENT_SECRET || '',
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
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
    return NextResponse.redirect(`${origin}/login?error=not_in_guild`);
  }
  const member = await memberRes.json();
  const level = levelFromRoles(member.roles || []);
  if (!level) {
    return NextResponse.redirect(`${origin}/login?error=no_staff_role`);
  }

  const jwt = await createSession({
    id: user.id,
    username: user.global_name || user.username,
    avatar: user.avatar,
    level,
  });

  const res = NextResponse.redirect(`${origin}/`);
  res.cookies.set('sd_session', jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
