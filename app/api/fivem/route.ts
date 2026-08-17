import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth';
import { getPlayer, getPlayers, getServer, runCommand } from '@/lib/fivem';

async function guard() {
  const user = await readSession();
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  return { user };
}

export async function GET() {
  const { user, error } = await guard();
  if (error) return error;
  try {
    const [server, players] = await Promise.all([getServer(), getPlayers()]);
    return NextResponse.json({ user, server, players: players.players });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'FiveM unreachable' }, { status: 502 });
  }
}

export async function POST(req: Request) {
  const { user, error } = await guard();
  if (error) return error;
  const body = await req.json();
  try {
    if (body.action === 'player') {
      const data = await getPlayer(body.id);
      return NextResponse.json(data);
    }
    const result = await runCommand(body.command, body.args || {}, {
      name: `Web: ${user!.username}`,
      level: user!.level,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Command failed' }, { status: 400 });
  }
}
