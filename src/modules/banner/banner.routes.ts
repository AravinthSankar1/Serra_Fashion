import { Router } from 'express';
import { getBanners, getAdminBanners, createBanner, updateBanner, deleteBanner } from './banner.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';
import { upload } from '../../utils/upload.middleware';

const router = Router();

const bannerUploadOptions = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'mobileImage', maxCount: 1 }
]);

// Public routes
router.get('/', getBanners);

// Admin routes
router.get('/admin', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), getAdminBanners);
router.post('/', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), bannerUploadOptions, createBanner);
router.patch('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), bannerUploadOptions, updateBanner);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), deleteBanner);

export default router;
