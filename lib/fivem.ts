const SECRET = (process.env.FIVEM_API_SECRET || '').trim();

function apiBase() {
  let base = (process.env.FIVEM_API_URL || '').trim();
  if (!base) throw new Error('FIVEM_API_URL is not set');
  // txAdmin is :40120 — the resource HTTP API is the game port (usually 30120)
  base = base.replace(/:40120\b/, ':30120').replace(/\/+$/, '').replace(/\/api$/i, '');
  const pathPart = base.replace(/^https?:\/\//, '');
  if (!pathPart.includes('/')) base = `${base}/sd_admin`;
  return base;
}

async function fivem<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = apiBase();
  if (!SECRET) throw new Error('FIVEM_API_SECRET is not set on Vercel');
  // FiveM matches header names exactly. Node's Headers class sends "X-Api-Secret"
  // which 401s; a plain lowercase name works.
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-api-secret': SECRET,
  };
  const url = `${base}${path}`;
  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });
  const text = await res.text();
  let data: { error?: string } = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('FiveM API secret mismatch. Set FIVEM_API_SECRET on Vercel to ServerConfig.Api.secret, then redeploy.');
    }
    const hint = /Route .+ not found/i.test(text)
      ? ` — sd_admin is not started. In txAdmin console: ensure sd_admin`
      : '';
    throw new Error(data.error || `FiveM API ${res.status} (${url})${hint}`);
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
    frame?: string | null;
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
