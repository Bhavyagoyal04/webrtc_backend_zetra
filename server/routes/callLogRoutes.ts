import { Router } from 'express';
import {
  getUserCallLogs,
  createCallLog,
  endCallLog,
  getCallLogStats,
} from '../controllers/callLogController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getUserCallLogs);
router.post('/', authenticateToken, createCallLog);
router.put('/:roomId/end', authenticateToken, endCallLog);
router.get('/stats', authenticateToken, getCallLogStats);

export default router;
