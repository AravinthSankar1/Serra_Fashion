import { Router } from 'express';
import { createCategory, getCategories, updateCategory, deleteCategory, approveCategory, rejectCategory } from './category.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';

import { upload } from '../../utils/upload.middleware';

const router = Router();

// Public routes
router.get('/', getCategories);

// Admin & Vendor routes
router.post('/', authenticate, authorize([UserRole.ADMIN, UserRole.VENDOR]), upload.single('image'), createCategory);
router.put('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.VENDOR]), upload.single('image'), updateCategory);
router.patch('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.VENDOR]), upload.single('image'), updateCategory);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.VENDOR]), deleteCategory);

// Admin only routes
router.patch('/:id/approve', authenticate, authorize([UserRole.ADMIN]), approveCategory);
router.patch('/:id/reject', authenticate, authorize([UserRole.ADMIN]), rejectCategory);

export default router;
