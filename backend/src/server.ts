import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PORT } from './config/env';
import { connectDB } from './db/connection';
import projectRoutes from './routes/projectRoutes';
import { checkHealth } from './controllers/projectController';

const app = express();

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', checkHealth);

// Project Documentation Endpoints
app.use('/api/projects', projectRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  try {
    console.log('[Exapro Server] Initializing MongoDB database connection...');
    await connectDB();

    app.listen(PORT, () => {
      console.log(`[Exapro Server] Running on http://localhost:${PORT}`);
      console.log(`[Exapro Server] Health endpoint: http://localhost:${PORT}/api/health`);
    });
  } catch (err: any) {
    console.error('[Exapro Server] Fatal startup failure:', err);
    process.exit(1);
  }
}

startServer();

export default app;
