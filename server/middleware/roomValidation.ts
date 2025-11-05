import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const validateRoomId = (req: Request, res: Response, next: NextFunction) => {
  const { roomId } = req.params;

  if (!roomId) {
    logger.warn('Room ID validation failed: missing roomId', { path: req.path });
    res.status(400).json({ error: 'Room ID is required' });
    return;
  }

  // UUID v4 format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(roomId)) {
    logger.warn('Room ID validation failed: invalid format', { roomId, path: req.path });
    res.status(400).json({ error: 'Invalid room ID format' });
    return;
  }

  next();
};

export const validateCreateRoom = (req: Request, res: Response, next: NextFunction) => {
  // Room creation doesn't require body validation as roomId is auto-generated
  next();
};
