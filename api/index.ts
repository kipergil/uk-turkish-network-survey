import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../server/src/app.js';

/**
 * Single Vercel serverless function fronting the whole Express app.
 * vercel.json rewrites every /api/* request to this file, so Express's own
 * routers (mounted at /api/submissions, /api/results, etc. in
 * server/src/app.ts) still see the full original path.
 */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req as any, res as any);
}
