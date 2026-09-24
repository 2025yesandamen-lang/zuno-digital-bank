import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/api';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log API requests in development
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[ZUNO CORE API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'HEALTHY',
      service: 'ZUNO Digital Bank Core Engine',
      version: '1.0.0-GA',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Banking & Operations API
  app.use('/api', apiRouter);

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏦 ZUNO Digital Bank Core Server running on http://localhost:${PORT}`);
  });
}

startServer();
