import { Router } from 'express';
import * as sizeGuideController from './sizeGuide.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';

const router = Router();

// Public routes
router.get('/', sizeGuideController.getAllSizeGuides);
router.get('/:id', sizeGuideController.getSizeGuideDetails);

// Admin only routes
router.post('/', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), sizeGuideController.createSizeGuide);
router.patch('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), sizeGuideController.updateSizeGuide);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), sizeGuideController.deleteSizeGuide);

export default router;
