import { NextResponse } from 'next/server';
import { siteUrl } from '@/lib/auth';

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'DISCORD_CLIENT_ID missing' }, { status: 500 });
  }
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'identify guilds.members.read',
    redirect_uri: `${siteUrl()}/api/auth/callback`,
    prompt: 'consent',
  });
  return NextResponse.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
}
