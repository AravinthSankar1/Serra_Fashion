import { Router } from 'express';
import { createCategory, getCategories, updateCategory, deleteCategory } from './category.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';

import { upload } from '../../utils/upload.middleware';

const router = Router();

// Public routes
router.get('/', getCategories);

// Admin only routes
router.post('/', authenticate, authorize([UserRole.ADMIN]), upload.single('image'), createCategory);
router.put('/:id', authenticate, authorize([UserRole.ADMIN]), upload.single('image'), updateCategory);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN]), deleteCategory);

export default router;
