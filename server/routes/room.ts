import { Router } from 'express';
import { createRoom, joinRoom } from '../controllers/roomController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/create', authenticate, createRoom);
router.post('/join/:roomId', authenticate, joinRoom);

export default router;