import { Router } from 'express';
import { createBrand, getBrands, updateBrand, deleteBrand } from './brand.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';

import { upload } from '../../utils/upload.middleware';

const router = Router();

// Public routes
router.get('/', getBrands);

// Admin only routes
router.post('/', authenticate, authorize([UserRole.ADMIN]), upload.single('logo'), createBrand);
router.put('/:id', authenticate, authorize([UserRole.ADMIN]), upload.single('logo'), updateBrand);
router.patch('/:id', authenticate, authorize([UserRole.ADMIN]), upload.single('logo'), updateBrand);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN]), deleteBrand);

export default router;
