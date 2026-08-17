import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions';
import { canRun, optionMap, SLASH_COMMANDS } from '@/lib/commands';
import { getPlayers, getServer, runCommand } from '@/lib/fivem';
import { levelFromRoles } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function embed(title: string, description: string, ok = true) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: 64,
      embeds: [
        {
          title,
          description,
          color: ok ? 0x5865f2 : 0xed4245,
        },
      ],
    },
  };
}

export async function POST(req: Request) {
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');
  const raw = await req.text();
  const publicKey = process.env.DISCORD_PUBLIC_KEY || '';

  if (!signature || !timestamp || !verifyKey(raw, signature, timestamp, publicKey)) {
    return json({ error: 'invalid request signature' }, 401);
  }

  const interaction = JSON.parse(raw);
  if (interaction.type === InteractionType.PING) {
    return json({ type: InteractionResponseType.PONG });
  }

  if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
    return json(embed('Unsupported', 'This interaction type is not handled.', false));
  }

  const name = interaction.data?.name as string;
  const def = SLASH_COMMANDS.find((c) => c.name === name);
  const roles: string[] = interaction.member?.roles || [];
  const level = levelFromRoles(roles);
  const username = interaction.member?.user?.global_name || interaction.member?.user?.username || 'Discord';

  if (!level) {
    return json(embed('Permission denied', 'Your Discord roles are not mapped to staff.', false));
  }
  if (!def || !canRun(level, name)) {
    return json(embed('Permission denied', `\`${name}\` requires a higher staff role.`, false));
  }

  const opts = optionMap(interaction.data?.options);
  const actor = { name: `Discord: ${username}`, level };

  try {
    if (name === 'players') {
      const { players } = await getPlayers();
      const lines = players.slice(0, 25).map((p) => `\`${p.id}\` ${p.charName || p.name} — ${p.job || 'Unemployed'}`);
      return json(embed(`Online (${players.length})`, lines.join('\n') || 'No players online.'));
    }
    if (name === 'server') {
      const info = await getServer();
      return json(embed(info.name, `Players: **${info.online}/${info.max}**\nWeather: **${info.weather}**\nBlackout: **${info.blackout ? 'on' : 'off'}**`));
    }
    if (name === 'player') {
      const { getPlayer } = await import('@/lib/fivem');
      const { player } = await getPlayer(String(opts.player));
      return json(
        embed(
          `${player.charName || player.name} [${player.id}]`,
          `Job: ${player.job || '—'}\nPing: ${player.ping}ms\nHealth/Armor: ${player.health}/${player.armor}`
        )
      );
    }

    const args: Record<string, unknown> = { ...opts };
    if (opts.type) args.weather = opts.type;
    const result = await runCommand(name, args, actor);
    return json(embed('Done', result.result?.message || 'Command executed.'));
  } catch (err) {
    return json(embed('Error', err instanceof Error ? err.message : 'Command failed', false));
  }
}
