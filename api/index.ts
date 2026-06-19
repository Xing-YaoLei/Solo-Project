import express from 'express';
import cors from 'cors';
import { initDatabase } from './db';
import complaintsRouter from './routes/complaints';
import escalationsRouter from './routes/escalations';
import syncRouter from './routes/sync';
import reportsRouter from './routes/reports';

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

app.use('/api/complaints', complaintsRouter);
app.use('/api/escalations', escalationsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/reports', reportsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await initDatabase();
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
});

export default app;
