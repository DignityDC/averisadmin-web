'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
};

export default function SpectatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const playerId = Number(params.id);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef(`web-${playerId}-${Date.now()}`);
  const [status, setStatus] = useState('Connecting…');
  const [name, setName] = useState(`ID ${playerId}`);

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
      setStatus('Waiting for player stream…');

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      pc.ondatachannel = (event) => {
        const channel = event.channel;
        channel.binaryType = 'arraybuffer';
        channel.onopen = () => setStatus('Live');
        channel.onmessage = (ev) => {
          const blob = new Blob([ev.data], { type: 'image/webp' });
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            if (canvas.width !== img.width) canvas.width = img.width;
            if (canvas.height !== img.height) canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
          };
          img.src = url;
        };
      };
      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        fetch('/api/spectate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ice', sessionId, candidate: event.candidate.toJSON() }),
        }).catch(() => undefined);
      };

      let answered = false;
      pollTimer = setInterval(async () => {
        if (stopped) return;
        const res = await fetch(`/api/spectate?sessionId=${encodeURIComponent(sessionId)}`);
        if (!res.ok) return;
        const session = await res.json();
        if (session.playerName) setName(session.playerName);
        if (session.frame) {
          setStatus('Live');
          const src = session.frame.startsWith('data:') ? session.frame : `data:image/jpeg;base64,${session.frame}`;
          const img = new Image();
          img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            if (canvas.width !== img.width) canvas.width = img.width;
            if (canvas.height !== img.height) canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
          };
          img.src = src;
        }
        if (session.offer && !answered) {
          answered = true;
          if (!session.frame) setStatus('Negotiating WebRTC…');
          await pc.setRemoteDescription(new RTCSessionDescription(session.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await fetch('/api/spectate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'answer', sessionId, answer }),
          });
        }
        for (const candidate of session.ice || []) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {
            /* ignore */
          }
        }
      }, 700);
    }

    connect();
    return () => {
      stopped = true;
      if (pollTimer) clearInterval(pollTimer);
      pcRef.current?.close();
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
        <canvas ref={canvasRef} />
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
