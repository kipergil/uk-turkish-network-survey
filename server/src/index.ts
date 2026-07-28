import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { submissionsRouter } from './routes/submissions.js';
import { subscribersRouter } from './routes/subscribers.js';
import { resultsRouter } from './routes/results.js';
import { statsRouter } from './routes/stats.js';
import { contentRouter } from './routes/content.js';

const app = express();
const PORT = Number(process.env.PORT ?? 8787);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/submissions', submissionsRouter);
app.use('/api/subscribers', subscribersRouter);
app.use('/api/results', resultsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/content', contentRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`LocalRater API listening on http://localhost:${PORT}`);
});
