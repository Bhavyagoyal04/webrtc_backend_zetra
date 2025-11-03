import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/room';

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
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/room', roomRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// WebRTC Signaling with Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId: string, userId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);
    console.log(`User ${userId} joined room ${roomId}`);

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
      console.log(`User ${userId} disconnected from room ${roomId}`);
    });
  });

  socket.on('offer', (roomId: string, offer: RTCSessionDescriptionInit) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', (roomId: string, answer: RTCSessionDescriptionInit) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice-candidate', (roomId: string, candidate: RTCIceCandidateInit) => {
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  socket.on('chat-message', (roomId: string, message: string, username: string) => {
    io.to(roomId).emit('chat-message', { message, username, timestamp: new Date() });
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
