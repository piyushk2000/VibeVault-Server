import { Router } from 'express';
import { addUserMedia, updateUserMedia, deleteUserMedia, getUserMedia } from '../controller/userMedia';
import { validateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', validateToken, addUserMedia);
router.put('/:id', validateToken, updateUserMedia);
router.delete('/:id', validateToken, deleteUserMedia);
router.get('/', validateToken, getUserMedia);

export default router;
