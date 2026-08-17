'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Player = {
  id: number;
  name: string;
  charName?: string;
  ping?: number;
  job?: string;
  health?: number;
};

type Payload = {
  user: { username: string; level: string };
  server: { name: string; online: number; max: number; weather: string; blackout: boolean };
  players: Player[];
};

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/fivem', { cache: 'no-store' });
    if (res.status === 401) {
      router.push('/login');
      return;
    }
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed to load server');
      return;
    }
    setData(json);
    setError('');
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, []);

  async function command(playerId: number, commandName: string) {
    setBusy(`${commandName}-${playerId}`);
    await fetch('/api/fivem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: commandName, args: { player: String(playerId) } }),
    });
    setBusy(null);
    load();
  }

  if (!data) {
    return (
      <div className="shell">
        <p className="status">{error || 'Loading server...'}</p>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          SD ADMIN
          <strong>{data.server.name}</strong>
        </div>
        <div className="row">
          <span className="status">
            {data.user.username} · {data.user.level}
          </span>
          <form action="/api/auth/logout" method="post">
            <button className="btn" type="submit">
              Logout
            </button>
          </form>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span>Players</span>
          <b>
            {data.server.online}/{data.server.max}
          </b>
        </div>
        <div className="stat">
          <span>Weather</span>
          <b>{data.server.weather}</b>
        </div>
        <div className="stat">
          <span>Blackout</span>
          <b>{data.server.blackout ? 'On' : 'Off'}</b>
        </div>
        <div className="stat">
          <span>Staff</span>
          <b>{data.user.level}</b>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {data.players.length === 0 ? (
        <div className="panel">
          <p className="status">No players online.</p>
        </div>
      ) : (
      <div className="grid">
        {data.players.map((player) => (
          <article className="panel player" key={player.id}>
            <div className="meta">
              <span>ID {player.id}</span>
              <span>{player.ping ?? 0}ms</span>
            </div>
            <h3>{player.charName || player.name}</h3>
            <div className="meta">
              <span>{player.job || 'Unemployed'}</span>
              <span>HP {player.health ?? 0}</span>
            </div>
            <div className="row">
              <Link className="btn primary" href={`/spectate/${player.id}`}>
                Spectate
              </Link>
              <button className="btn" disabled={busy !== null} onClick={() => command(player.id, 'revive')}>
                Revive
              </button>
              <button className="btn" disabled={busy !== null} onClick={() => command(player.id, 'freeze')}>
                Freeze
              </button>
              <button className="btn danger" disabled={busy !== null} onClick={() => command(player.id, 'kick')}>
                Kick
              </button>
            </div>
          </article>
        ))}
      </div>
      )}
    </div>
  );
}
