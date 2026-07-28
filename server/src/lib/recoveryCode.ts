import { col, directus, readItems } from './directus.js';

// Small, easy-to-read/spell/say-out-loud word lists — deliberately not a
// crypto-grade wordlist (like BIP-39); this is a human-friendly label, not a
// secret. Combined with a 2-digit suffix, the space (~90 * 90 * 90 ≈ 729k) is
// large enough for this survey's scale, and creation still checks the DB for
// collisions and retries.
const ADJECTIVES = [
  'amber', 'brave', 'calm', 'coral', 'eager', 'fresh', 'gentle', 'golden', 'happy', 'ivory',
  'jolly', 'kind', 'lively', 'misty', 'noble', 'olive', 'proud', 'quiet', 'rapid', 'silver',
  'sunny', 'swift', 'tidy', 'urban', 'vivid', 'warm', 'wise', 'young', 'zesty', 'bold',
  'bright', 'crisp', 'dawn', 'east', 'fair', 'grand', 'high', 'keen', 'light', 'mellow',
  'north', 'ocean', 'plain', 'quick', 'ready', 'south', 'true', 'upper', 'vast', 'west',
  'winter', 'spring', 'summer', 'autumn', 'coastal', 'deep', 'even', 'fine', 'green', 'inner',
  'lower', 'main', 'near', 'open', 'pure', 'real', 'safe', 'still', 'tall', 'wild',
  'blue', 'clear', 'dry', 'even', 'far', 'glad', 'huge', 'iron', 'just', 'loud',
  'mild', 'new', 'old', 'pale', 'rare', 'soft', 'thin', 'wide', 'active', 'cosy',
];
const NOUNS = [
  'falcon', 'harbor', 'meadow', 'river', 'canyon', 'summit', 'garden', 'island', 'valley', 'forest',
  'otter', 'heron', 'sparrow', 'badger', 'rabbit', 'dolphin', 'penguin', 'panther', 'eagle', 'beaver',
  'plaza', 'market', 'bridge', 'lantern', 'compass', 'anchor', 'harbour', 'orchard', 'thicket', 'ridge',
  'lagoon', 'delta', 'plateau', 'glacier', 'reef', 'dune', 'grove', 'marsh', 'cove', 'bay',
  'sparrow', 'robin', 'finch', 'heron', 'crane', 'stork', 'swift', 'wren', 'lark', 'dove',
  'tiger', 'lynx', 'fox', 'wolf', 'bear', 'deer', 'hare', 'mole', 'lark', 'owl',
  'castle', 'tower', 'chapel', 'cottage', 'cabin', 'mill', 'square', 'street', 'alley', 'court',
  'brook', 'stream', 'creek', 'pond', 'lake', 'fjord', 'strait', 'channel', 'shore', 'cliff',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomCode(): string {
  const suffix = String(Math.floor(10 + Math.random() * 90)); // 10-99
  return `${randomFrom(ADJECTIVES)}-${randomFrom(NOUNS)}-${suffix}`;
}

/** Generates a code guaranteed unique in lr_recovery_codes, retrying on the rare collision. */
export async function generateUniqueRecoveryCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode();
    const existing = (await directus.request(
      readItems(col('recovery_codes') as any, { filter: { code: { _eq: code } }, limit: 1 }),
    )) as Array<{ id: string }>;
    if (existing.length === 0) return code;
  }
  throw new Error('Could not generate a unique recovery code after 5 attempts');
}
