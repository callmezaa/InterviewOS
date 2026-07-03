import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';

const app = express();
const port = Number(process.env.PORT) || 3001;
const prisma = new PrismaClient();

app.use(cors({
  origin: process.env.FRONTEND_URL?.split(',').map(o => o.trim()) || 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.get('/', (_req, res) => {
  res.json({ app: 'InterviewOS API', version: '1.0.0' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Listening on 0.0.0.0:${port}`);
});
