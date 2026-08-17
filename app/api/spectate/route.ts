import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth';
import {
  getSpectateSession,
  sendSpectateAnswer,
  sendSpectateIce,
  startSpectate,
  stopSpectate,
} from '@/lib/fivem';

async function guard() {
  const user = await readSession();
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  return { user };
}

export async function POST(req: Request) {
  const { error } = await guard();
  if (error) return error;
  const body = await req.json();
  try {
    if (body.action === 'start') {
      const sessionId = body.sessionId || `web-${body.playerId}-${Date.now()}`;
      const result = await startSpectate(Number(body.playerId), sessionId);
      return NextResponse.json(result);
    }
    if (body.action === 'stop') {
      await stopSpectate(body.sessionId);
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'answer') {
      await sendSpectateAnswer(body.sessionId, body.answer);
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'ice') {
      await sendSpectateIce(body.sessionId, body.candidate);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Spectate failed' }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const { error } = await guard();
  if (error) return error;
  const sessionId = new URL(req.url).searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'missing sessionId' }, { status: 400 });
  try {
    const session = await getSpectateSession(sessionId);
    return NextResponse.json(session);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Session missing' }, { status: 404 });
  }
}
