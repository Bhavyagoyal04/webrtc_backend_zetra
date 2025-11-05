import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';

const router = Router();

// Only enable debug routes in development
if (process.env.NODE_ENV === 'development') {
  router.get('/status', async (req: Request, res: Response) => {
    try {
      const dbStatus = mongoose.connection.readyState;
      const dbStates = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      res.status(200).json({
        server: {
          status: 'running',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform,
          environment: process.env.NODE_ENV,
        },
        database: {
          status: dbStates[dbStatus as keyof typeof dbStates] || 'unknown',
          host: mongoose.connection.host,
          name: mongoose.connection.name,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('Debug status endpoint error', { error: error.message });
      res.status(500).json({ error: 'Failed to get status' });
    }
  });

  router.get('/env', (req: Request, res: Response) => {
    res.status(200).json({
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      MONGO_URI: process.env.MONGO_URI ? '***configured***' : 'missing',
      JWT_SECRET: process.env.JWT_SECRET ? '***configured***' : 'missing',
      SOCKET_URL: process.env.SOCKET_URL,
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    });
  });
}

export default router;
