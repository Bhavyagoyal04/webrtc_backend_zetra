import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import mongoose from 'mongoose';

export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const roomId = uuidv4();
    
    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      logger.error('Invalid user ID format', { userId: req.userId });
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const room = new Room({
      roomId,
      participants: [new mongoose.Types.ObjectId(req.userId)],
      active: true,
    });

    await room.save();

    logger.info('Room created successfully', { roomId, userId: req.userId });

    res.status(201).json({
      message: 'Room created successfully',
      roomId: room.roomId,
    });
  } catch (error: any) {
    logger.error('Error creating room', { error: error.message, stack: error.stack, userId: req.userId });
    res.status(500).json({ error: 'Server error creating room' });
  }
};

export const joinRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!roomId) {
      res.status(400).json({ error: 'Room ID is required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      logger.error('Invalid user ID format', { userId: req.userId });
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const room = await Room.findOne({ roomId, active: true });
    if (!room) {
      logger.warn('Attempt to join non-existent or inactive room', { roomId, userId: req.userId });
      res.status(404).json({ error: 'Room not found or inactive' });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    const isParticipant = room.participants.some(
      (participantId) => participantId.toString() === req.userId
    );

    if (!isParticipant) {
      room.participants.push(userObjectId);
      await room.save();
      logger.info('User joined room', { roomId, userId: req.userId });
    } else {
      logger.debug('User already in room', { roomId, userId: req.userId });
    }

    res.status(200).json({
      message: 'Joined room successfully',
      room: {
        roomId: room.roomId,
        participants: room.participants,
      },
    });
  } catch (error: any) {
    logger.error('Error joining room', { error: error.message, stack: error.stack, roomId: req.params.roomId, userId: req.userId });
    res.status(500).json({ error: 'Server error joining room' });
  }
};