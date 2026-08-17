import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const full = resolve(process.cwd(), file);
    if (!existsSync(full)) continue;
    for (const line of readFileSync(full, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const commands = [
  { name: 'players', description: 'List online players' },
  { name: 'server', description: 'Show server status' },
  {
    name: 'player',
    description: 'Look up a player',
    options: [{ type: 3, name: 'player', description: 'Server id or name', required: true }],
  },
  {
    name: 'kick',
    description: 'Kick a player',
    options: [
      { type: 3, name: 'player', description: 'Server id or name', required: true },
      { type: 3, name: 'reason', description: 'Kick reason', required: false },
    ],
  },
  {
    name: 'ban',
    description: 'Ban a player',
    options: [
      { type: 3, name: 'player', description: 'Server id or name', required: true },
      { type: 4, name: 'hours', description: 'Hours (0 = permanent)', required: false },
      { type: 3, name: 'reason', description: 'Ban reason', required: false },
    ],
  },
  {
    name: 'warn',
    description: 'Warn a player',
    options: [
      { type: 3, name: 'player', description: 'Server id or name', required: true },
      { type: 3, name: 'reason', description: 'Warning', required: false },
    ],
  },
  { name: 'freeze', description: 'Freeze a player', options: [{ type: 3, name: 'player', description: 'Server id or name', required: true }] },
  { name: 'unfreeze', description: 'Unfreeze a player', options: [{ type: 3, name: 'player', description: 'Server id or name', required: true }] },
  { name: 'mute', description: 'Mute a player', options: [{ type: 3, name: 'player', description: 'Server id or name', required: true }] },
  { name: 'unmute', description: 'Unmute a player', options: [{ type: 3, name: 'player', description: 'Server id or name', required: true }] },
  { name: 'revive', description: 'Revive a player', options: [{ type: 3, name: 'player', description: 'Server id or name', required: true }] },
  { name: 'reviveall', description: 'Revive everyone' },
  { name: 'heal', description: 'Heal a player', options: [{ type: 3, name: 'player', description: 'Server id or name', required: true }] },
  { name: 'kill', description: 'Kill a player', options: [{ type: 3, name: 'player', description: 'Server id or name', required: true }] },
  {
    name: 'bring',
    description: 'Bring a player to another player',
    options: [
      { type: 3, name: 'player', description: 'Server id or name', required: true },
      { type: 3, name: 'to', description: 'Destination player', required: true },
    ],
  },
  {
    name: 'tp',
    description: 'Teleport a player to a named location',
    options: [
      { type: 3, name: 'player', description: 'Server id or name', required: true },
      { type: 3, name: 'location', description: 'Location name', required: true },
    ],
  },
  {
    name: 'setjob',
    description: 'Set a player job',
    options: [
      { type: 3, name: 'player', description: 'Server id or name', required: true },
      { type: 3, name: 'job', description: 'Job name', required: true },
      { type: 4, name: 'grade', description: 'Grade', required: false },
    ],
  },
  {
    name: 'givemoney',
    description: 'Give money to a player',
    options: [
      { type: 3, name: 'player', description: 'Server id or name', required: true },
      { type: 10, name: 'amount', description: 'Amount', required: true },
      { type: 3, name: 'account', description: 'cash or bank', required: false },
    ],
  },
  {
    name: 'giveitem',
    description: 'Give an item to a player',
    options: [
      { type: 3, name: 'player', description: 'Server id or name', required: true },
      { type: 3, name: 'item', description: 'Item name', required: true },
      { type: 4, name: 'amount', description: 'Amount', required: false },
    ],
  },
  {
    name: 'weather',
    description: 'Set weather',
    options: [{ type: 3, name: 'type', description: 'CLEAR, RAIN, THUNDER, EXTRASUNNY...', required: true }],
  },
  {
    name: 'time',
    description: 'Set time',
    options: [
      { type: 4, name: 'hour', description: '0-23', required: true },
      { type: 4, name: 'minute', description: '0-59', required: false },
    ],
  },
  {
    name: 'blackout',
    description: 'Toggle blackout',
    options: [{ type: 3, name: 'state', description: 'on, off, or toggle', required: false }],
  },
  {
    name: 'announce',
    description: 'Send a server announcement',
    options: [{ type: 3, name: 'message', description: 'Announcement text', required: true }],
  },
  {
    name: 'execute',
    description: 'Run a server console command',
    options: [{ type: 3, name: 'command', description: 'Console command', required: true }],
  },
];

async function main() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !clientId || !guildId) {
    throw new Error('Set DISCORD_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID');
  }

  const url = `https://discord.com/api/v10/applications/${clientId}/guilds/${guildId}/commands`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(body);
    throw new Error(`Discord returned ${res.status}`);
  }
  console.log(`Registered ${Array.isArray(body) ? body.length : 0} guild slash commands.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
