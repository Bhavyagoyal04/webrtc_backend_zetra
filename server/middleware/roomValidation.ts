import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Middleware to validate roomId parameter in routes like /join/:roomId
export const validateRoomId = (req: Request, res: Response, next: NextFunction) => {
  const { roomId } = req.params;

  // Check if roomId is provided
  if (!roomId) {
    logger.warn('Room ID validation failed: missing roomId', { path: req.path });
    return res.status(400).json({ error: 'Room ID is required' });
  }

  // Validate that roomId follows UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(roomId)) {
    logger.warn('Room ID validation failed: invalid format', { roomId, path: req.path });
    return res.status(400).json({ error: 'Invalid room ID format' });
  }

  // If validation passes, move to next middleware or controller
  next();
};

// Middleware to validate data for room creation
// Currently, no fields are required as roomId is generated automatically
export const validateCreateRoom = (req: Request, res: Response, next: NextFunction) => {
  next();
};
