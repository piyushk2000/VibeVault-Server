import { Router } from 'express';
import { getConnections, getConnectionMessages, sendMessage } from '../controller/connection';
import { validateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', validateToken, getConnections);
router.get('/:connectionId/messages', validateToken, getConnectionMessages);
router.post('/:connectionId/messages', validateToken, sendMessage);

export default router;