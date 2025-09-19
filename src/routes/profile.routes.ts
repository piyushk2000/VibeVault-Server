import { Router } from 'express';
import { getProfile, updateProfile, updateUser } from '../controller/profile';
import { validateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', validateToken, getProfile);
router.put('/', validateToken, updateProfile);
router.put('/user', validateToken, updateUser);

export default router;