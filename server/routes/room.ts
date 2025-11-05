import { Router } from 'express';
import { createRoom, joinRoom } from '../controllers/roomController';
import { authenticate } from '../middleware/auth';
import { validateRoomId, validateCreateRoom } from '../middleware/roomValidation';

const router = Router();

router.post('/create', authenticate, validateCreateRoom, createRoom);
router.post('/join/:roomId', authenticate, validateRoomId, joinRoom);

export default router;