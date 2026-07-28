import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { submissionsRouter } from './routes/submissions.js';
import { subscribersRouter } from './routes/subscribers.js';
import { resultsRouter } from './routes/results.js';
import { statsRouter } from './routes/stats.js';
import { contentRouter } from './routes/content.js';

const app = express();

// Behind Vercel's edge network (and any other reverse proxy) req.ip only
// reflects X-Forwarded-For once Express is told to trust the first hop —
// required for express-rate-limit's IP-hash keying to work correctly.
app.set('trust proxy', 1);

// CORS_ORIGIN unset -> reflect the request's own origin. In production the
// client and API share one Vercel domain (same-origin, so this header is
// moot); this only matters for local dev / preview URLs.
const CORS_ORIGIN = process.env.CORS_ORIGIN;
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN || true }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/submissions', submissionsRouter);
app.use('/api/subscribers', subscribersRouter);
app.use('/api/results', resultsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/content', contentRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
