import { Router } from 'express';
import { getSettings, updateSettings } from './settings.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';

const router = Router();

// Public: get settings
router.get('/', getSettings);

// Admin only: update settings
router.put('/', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), updateSettings);

export default router;
