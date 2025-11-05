import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/database';
import { corsOptions } from './config/cors';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/room';
import callLogRoutes from './routes/callLogRoutes';
import userRoutes from './routes/userRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';
import env from './config/env';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/call-logs', callLogRoutes);
app.use('/api/user', userRoutes);

// Debug routes (only in development)
if (env.NODE_ENV === 'development') {
  const debugRoutes = require('./routes/debug').default;
  app.use('/api/debug', debugRoutes);
}

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.status(200).json({ 
      status: 'ok', 
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      environment: env.NODE_ENV,
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

// WebRTC Signaling with Socket.io
io.on('connection', (socket) => {
  logger.info('User connected', { socketId: socket.id });

  socket.on('join-room', (roomId: string, userId: string) => {
    try {
      if (!roomId || !userId) {
        logger.warn('Invalid join-room parameters', { roomId, userId, socketId: socket.id });
        socket.emit('error', { message: 'Invalid room or user ID' });
        return;
      }

      socket.join(roomId);
      socket.to(roomId).emit('user-connected', userId);
      logger.info('User joined room', { userId, roomId, socketId: socket.id });

      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId);
        logger.info('User disconnected from room', { userId, roomId, socketId: socket.id });
      });
    } catch (error) {
      logger.error('Error in join-room', { error, socketId: socket.id });
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('offer', (roomId: string, offer: RTCSessionDescriptionInit) => {
    try {
      if (!roomId || !offer) {
        logger.warn('Invalid offer parameters', { roomId, socketId: socket.id });
        return;
      }
      socket.to(roomId).emit('offer', offer);
      logger.debug('Offer sent', { roomId, socketId: socket.id });
    } catch (error) {
      logger.error('Error handling offer', { error, socketId: socket.id });
      socket.emit('error', { message: 'Failed to send offer' });
    }
  });

  socket.on('answer', (roomId: string, answer: RTCSessionDescriptionInit) => {
    try {
      if (!roomId || !answer) {
        logger.warn('Invalid answer parameters', { roomId, socketId: socket.id });
        return;
      }
      socket.to(roomId).emit('answer', answer);
      logger.debug('Answer sent', { roomId, socketId: socket.id });
    } catch (error) {
      logger.error('Error handling answer', { error, socketId: socket.id });
      socket.emit('error', { message: 'Failed to send answer' });
    }
  });

  socket.on('ice-candidate', (roomId: string, candidate: RTCIceCandidateInit) => {
    try {
      if (!roomId || !candidate) {
        logger.warn('Invalid ICE candidate parameters', { roomId, socketId: socket.id });
        return;
      }
      socket.to(roomId).emit('ice-candidate', candidate);
      logger.debug('ICE candidate sent', { roomId, socketId: socket.id });
    } catch (error) {
      logger.error('Error handling ICE candidate', { error, socketId: socket.id });
      socket.emit('error', { message: 'Failed to send ICE candidate' });
    }
  });

  socket.on('chat-message', (roomId: string, message: string, username: string) => {
    try {
      if (!roomId || !message || !username) {
        logger.warn('Invalid chat message parameters', { roomId, socketId: socket.id });
        return;
      }
      io.to(roomId).emit('chat-message', { message, username, timestamp: new Date() });
      logger.debug('Chat message sent', { roomId, username, socketId: socket.id });
    } catch (error) {
      logger.error('Error handling chat message', { error, socketId: socket.id });
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('error', (error) => {
    logger.error('Socket error', { error, socketId: socket.id });
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.PORT;

// Graceful shutdown handler
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing server gracefully...');
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await mongoose.connection.close();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { 
    environment: env.NODE_ENV,
    port: PORT,
  });
});
