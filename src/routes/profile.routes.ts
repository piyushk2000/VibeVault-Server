import { Router } from 'express';
import { getProfile, updateProfile, updateUser, searchLocations, getLocationByCoordinates } from '../controller/profile';
import { validateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/', validateToken, getProfile);
router.put('/', validateToken, updateProfile);
router.put('/user', validateToken, updateUser);
router.get('/locations/search', searchLocations);
router.get('/locations/coordinates', getLocationByCoordinates);

export default router;