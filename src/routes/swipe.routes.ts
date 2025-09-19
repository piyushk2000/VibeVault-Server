import { Router } from 'express';
import { getDiscoverUsers, swipeUser, getPendingSwipes } from '../controller/swipe';
import { validateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/discover', validateToken, getDiscoverUsers);
router.post('/', validateToken, swipeUser);
router.get('/pending', validateToken, getPendingSwipes);

export default router;