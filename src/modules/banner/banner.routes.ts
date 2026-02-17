import { Router } from 'express';
import { getBanners, getAdminBanners, createBanner, updateBanner, deleteBanner } from './banner.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';

const router = Router();

// Public routes
router.get('/', getBanners);

// Admin routes
router.get('/admin', authenticate, authorize([UserRole.ADMIN]), getAdminBanners);
router.post('/', authenticate, authorize([UserRole.ADMIN]), createBanner);
router.patch('/:id', authenticate, authorize([UserRole.ADMIN]), updateBanner);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN]), deleteBanner);

export default router;
