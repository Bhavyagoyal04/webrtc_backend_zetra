import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room';
import { AuthRequest } from '../middleware/auth';

export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roomId = uuidv4();
    const room = new Room({
      roomId,
      participants: [req.userId],
      active: true,
    });

    await room.save();

    res.status(201).json({
      message: 'Room created successfully',
      roomId: room.roomId,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error creating room' });
  }
};

export const joinRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId, active: true });
    if (!room) {
      res.status(404).json({ error: 'Room not found or inactive' });
      return;
    }

    if (!room.participants.includes(req.userId as any)) {
      room.participants.push(req.userId as any);
      await room.save();
    }

    res.status(200).json({
      message: 'Joined room successfully',
      room: {
        roomId: room.roomId,
        participants: room.participants,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error joining room' });
  }
};