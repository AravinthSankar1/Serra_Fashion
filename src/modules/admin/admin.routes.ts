import { Router } from 'express';
import { getDashboardStats, globalSearch, uploadFile } from './admin.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.get('/stats', authenticate, authorize([UserRole.ADMIN]), getDashboardStats);
router.get('/global-search', authenticate, authorize([UserRole.ADMIN]), globalSearch);
router.post('/upload', authenticate, authorize([UserRole.ADMIN]), upload.single('image'), uploadFile);

export default router;
