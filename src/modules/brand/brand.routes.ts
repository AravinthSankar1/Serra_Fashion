import { Router } from 'express';
import { createBrand, getBrands, updateBrand, deleteBrand, approveBrand, rejectBrand } from './brand.controller';
import { authenticate, authorize, authenticateOptional } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';

import { upload } from '../../utils/upload.middleware';

const router = Router();

// Public routes
router.get('/', authenticateOptional, getBrands);

// Admin & Vendor routes
router.post('/', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.VENDOR]), upload.single('logo'), createBrand);
router.put('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.VENDOR]), upload.single('logo'), updateBrand);
router.patch('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.VENDOR]), upload.single('logo'), updateBrand);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.VENDOR]), deleteBrand);

// Admin only routes
router.patch('/:id/approve', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), approveBrand);
router.patch('/:id/reject', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), rejectBrand);

export default router;
