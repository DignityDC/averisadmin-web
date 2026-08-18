'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function SpectatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const playerId = Number(params.id);
  const sessionIdRef = useRef(`web-${playerId}-${Date.now()}`);
  const [status, setStatus] = useState('Connecting…');
  const [name, setName] = useState(`ID ${playerId}`);
  const [frame, setFrame] = useState('');

  useEffect(() => {
    let stopped = false;
    const sessionId = sessionIdRef.current;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    async function connect() {
      const start = await fetch('/api/spectate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', playerId, sessionId }),
      });
      if (start.status === 401) {
        router.push('/login');
        return;
      }
      const started = await start.json();
      if (!start.ok) {
        setStatus(started.error || 'Could not start spectate');
        return;
      }
      setName(started.playerName || name);
      setStatus('Waiting for screenshot-basic…');

      pollTimer = setInterval(async () => {
        if (stopped) return;
        const res = await fetch(`/api/spectate?sessionId=${encodeURIComponent(sessionId)}`);
        if (!res.ok) return;
        const session = await res.json();
        if (session.playerName) setName(session.playerName);
        if (session.frame && typeof session.frame === 'string') {
          const src = session.frame.startsWith('data:') ? session.frame : `data:image/jpeg;base64,${session.frame}`;
          setFrame(src);
          setStatus('Live');
        }
      }, 400);
    }

    connect();
    return () => {
      stopped = true;
      if (pollTimer) clearInterval(pollTimer);
      fetch('/api/spectate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', sessionId }),
      }).catch(() => undefined);
    };
  }, [playerId, router]);

  async function command(commandName: string) {
    await fetch('/api/fivem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: commandName, args: { player: String(playerId) } }),
    });
  }

  return (
    <div className="spectate-wrap">
      <div className="stage">
        {frame ? <img src={frame} alt={name} /> : <p className="status">No frame yet</p>}
      </div>
      <aside className="side">
        <div className="brand">
          LIVE SPECTATE
          <strong>{name}</strong>
        </div>
        <p className="status">{status}</p>
        <div className="row">
          <button className="btn" onClick={() => command('revive')}>
            Revive
          </button>
          <button className="btn" onClick={() => command('freeze')}>
            Freeze
          </button>
        </div>
        <div className="row">
          <button className="btn danger" onClick={() => command('kick')}>
            Kick
          </button>
        </div>
        <Link className="btn" href="/">
          Back to players
        </Link>
      </aside>
    </div>
  );
}
