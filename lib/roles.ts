export type StaffLevel = 'mod' | 'admin' | 'god';

export const STAFF_ROLES: Record<string, StaffLevel> = {
  '1531318178561658890': 'god', // Owner
  '1531318181002743890': 'god', // Head Admin
  '1531318186287304885': 'admin', // Admin
  '1531318188778979569': 'admin', // Senior Mod
  '1531318191282847955': 'mod', // Mod
};

const RANK: Record<StaffLevel, number> = { mod: 1, admin: 2, god: 3 };

export function levelFromRoles(roleIds: string[]): StaffLevel | null {
  let best: StaffLevel | null = null;
  let bestRank = 0;
  for (const id of roleIds) {
    const mapped = STAFF_ROLES[id];
    const rank = mapped ? RANK[mapped] : 0;
    if (rank > bestRank) {
      best = mapped;
      bestRank = rank;
    }
  }
  return best;
}

export function atLeast(current: StaffLevel, required: StaffLevel) {
  return RANK[current] >= RANK[required];
}
