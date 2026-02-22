import { Router } from 'express';
import * as promoController from './promo.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';

const router = Router();

// Customer routes
router.post('/validate', authenticate, promoController.validatePromo);

// Admin routes
router.post('/', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), promoController.createPromo);
router.get('/', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), promoController.getAllPromos);
router.put('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), promoController.updatePromo);
router.patch('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), promoController.updatePromo);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), promoController.deletePromo);
router.get('/:id/analytics', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), promoController.getPromoAnalytics);

export default router;
