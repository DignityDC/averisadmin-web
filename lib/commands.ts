import { atLeast, type StaffLevel } from './roles';

export type SlashCommand = {
  name: string;
  description: string;
  level: StaffLevel;
  options?: Record<string, unknown>[];
};

const player = (name = 'player', desc = 'Server id or name') => ({
  type: 3,
  name,
  description: desc,
  required: true,
});

export const SLASH_COMMANDS: SlashCommand[] = [
  { name: 'players', description: 'List online players', level: 'mod' },
  { name: 'server', description: 'Show server status', level: 'mod' },
  {
    name: 'player',
    description: 'Look up a player',
    level: 'mod',
    options: [player()],
  },
  {
    name: 'kick',
    description: 'Kick a player',
    level: 'mod',
    options: [player(), { type: 3, name: 'reason', description: 'Kick reason', required: false }],
  },
  {
    name: 'ban',
    description: 'Ban a player',
    level: 'admin',
    options: [
      player(),
      { type: 4, name: 'hours', description: 'Hours (0 = permanent)', required: false },
      { type: 3, name: 'reason', description: 'Ban reason', required: false },
    ],
  },
  {
    name: 'warn',
    description: 'Warn a player',
    level: 'mod',
    options: [player(), { type: 3, name: 'reason', description: 'Warning', required: false }],
  },
  { name: 'freeze', description: 'Freeze a player', level: 'mod', options: [player()] },
  { name: 'unfreeze', description: 'Unfreeze a player', level: 'mod', options: [player()] },
  { name: 'mute', description: 'Mute a player', level: 'mod', options: [player()] },
  { name: 'unmute', description: 'Unmute a player', level: 'mod', options: [player()] },
  { name: 'revive', description: 'Revive a player', level: 'mod', options: [player()] },
  { name: 'reviveall', description: 'Revive everyone', level: 'admin' },
  { name: 'heal', description: 'Heal a player', level: 'mod', options: [player()] },
  { name: 'kill', description: 'Kill a player', level: 'mod', options: [player()] },
  {
    name: 'bring',
    description: 'Bring a player to another player',
    level: 'mod',
    options: [player(), player('to', 'Destination player')],
  },
  {
    name: 'tp',
    description: 'Teleport a player to a named location',
    level: 'mod',
    options: [player(), { type: 3, name: 'location', description: 'Location name', required: true }],
  },
  {
    name: 'setjob',
    description: 'Set a player job',
    level: 'mod',
    options: [
      player(),
      { type: 3, name: 'job', description: 'Job name', required: true },
      { type: 4, name: 'grade', description: 'Grade', required: false },
    ],
  },
  {
    name: 'givemoney',
    description: 'Give money to a player',
    level: 'mod',
    options: [
      player(),
      { type: 10, name: 'amount', description: 'Amount', required: true },
      { type: 3, name: 'account', description: 'cash or bank', required: false },
    ],
  },
  {
    name: 'giveitem',
    description: 'Give an item to a player',
    level: 'mod',
    options: [
      player(),
      { type: 3, name: 'item', description: 'Item name', required: true },
      { type: 4, name: 'amount', description: 'Amount', required: false },
    ],
  },
  {
    name: 'weather',
    description: 'Set weather',
    level: 'mod',
    options: [{ type: 3, name: 'type', description: 'CLEAR, RAIN, THUNDER, EXTRASUNNY...', required: true }],
  },
  {
    name: 'time',
    description: 'Set time',
    level: 'mod',
    options: [
      { type: 4, name: 'hour', description: '0-23', required: true },
      { type: 4, name: 'minute', description: '0-59', required: false },
    ],
  },
  {
    name: 'blackout',
    description: 'Toggle blackout',
    level: 'mod',
    options: [{ type: 3, name: 'state', description: 'on, off, or toggle', required: false }],
  },
  {
    name: 'announce',
    description: 'Send a server announcement',
    level: 'mod',
    options: [{ type: 3, name: 'message', description: 'Announcement text', required: true }],
  },
  {
    name: 'execute',
    description: 'Run a server console command',
    level: 'god',
    options: [{ type: 3, name: 'command', description: 'Console command', required: true }],
  },
];

export function canRun(level: StaffLevel, command: string) {
  const def = SLASH_COMMANDS.find((c) => c.name === command);
  if (!def) return false;
  return atLeast(level, def.level);
}

export function optionMap(options: { name: string; value?: unknown }[] | undefined) {
  const map: Record<string, unknown> = {};
  for (const opt of options || []) map[opt.name] = opt.value;
  return map;
}
