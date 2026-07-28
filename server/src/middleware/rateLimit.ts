import crypto from 'node:crypto';
import rateLimit, { type Options } from 'express-rate-limit';
import type { Request } from 'express';

/**
 * Anti-abuse for write endpoints. Keys the limiter by a salted hash of the
 * request IP rather than the raw address — we never want to persist or log
 * a visitor's real IP anywhere, only use it as an ephemeral, in-memory
 * rate-limit bucket key. This does not affect submission anonymity: the
 * hash is never stored on the submission/answer rows themselves.
 */
const SALT = process.env.IP_HASH_SALT || 'localrater-dev-salt';

function hashIp(req: Request): string {
  const ip = req.ip ?? 'unknown';
  return crypto.createHash('sha256').update(`${SALT}:${ip}`).digest('hex');
}

export function writeRateLimiter(overrides: Partial<Options> = {}) {
  return rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: hashIp,
    ...overrides,
  });
}
