const BASE = (process.env.FIVEM_API_URL || '').replace(/\/$/, '');
const SECRET = process.env.FIVEM_API_SECRET || '';

async function fivem<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE) throw new Error('FIVEM_API_URL is not set');
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (SECRET) headers.set('X-Api-Secret', SECRET);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `FiveM API ${res.status}`);
  }
  return data as T;
}

export type PlayerRow = {
  id: number;
  name: string;
  charName?: string;
  ping?: number;
  health?: number;
  armor?: number;
  job?: string;
  citizenid?: string;
  x?: number;
  y?: number;
  z?: number;
};

export function getServer() {
  return fivem<{ name: string; online: number; max: number; weather: string; blackout: boolean }>('/api/server');
}

export function getPlayers() {
  return fivem<{ players: PlayerRow[] }>('/api/players');
}

export function getPlayer(id: string | number) {
  return fivem<{ player: PlayerRow }>(`/api/player?id=${encodeURIComponent(String(id))}`);
}

export function runCommand(command: string, args: Record<string, unknown>, actor?: { name?: string; level?: string }) {
  return fivem<{ ok: boolean; result: { message: string } }>('/api/command', {
    method: 'POST',
    body: JSON.stringify({
      command,
      args,
      actorName: actor?.name,
      actorLevel: actor?.level,
    }),
  });
}

export function createWatchToken(name: string, discordId: string, level: string) {
  return fivem<{ token: string; expiresIn: number }>('/api/token', {
    method: 'POST',
    body: JSON.stringify({ name, discordId, level, ttl: 3600 }),
  });
}

export function startSpectate(playerId: number, sessionId: string) {
  return fivem<{ ok: boolean; sessionId: string; playerName: string }>('/api/spectate/start', {
    method: 'POST',
    body: JSON.stringify({ playerId, sessionId }),
  });
}

export function stopSpectate(sessionId: string) {
  return fivem('/api/spectate/stop', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}

export function getSpectateSession(sessionId: string) {
  return fivem<{
    sessionId: string;
    playerId: number;
    playerName: string;
    offer: RTCSessionDescriptionInit | null;
    ice: RTCIceCandidateInit[];
  }>(`/api/spectate/session?sessionId=${encodeURIComponent(sessionId)}`);
}

export function sendSpectateAnswer(sessionId: string, answer: RTCSessionDescriptionInit) {
  return fivem('/api/spectate/answer', {
    method: 'POST',
    body: JSON.stringify({ sessionId, answer }),
  });
}

export function sendSpectateIce(sessionId: string, candidate: RTCIceCandidateInit) {
  return fivem('/api/spectate/ice', {
    method: 'POST',
    body: JSON.stringify({ sessionId, candidate }),
  });
}
