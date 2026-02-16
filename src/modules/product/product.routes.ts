import { Router } from 'express';
import * as productController from './product.controller';
import reviewRoutes from '../review/review.routes';
import { authenticate, authorize, authenticateOptional } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';
import { upload } from '../../utils/upload.middleware';

const router = Router();

// Public routes
router.use('/:productId/reviews', reviewRoutes);
router.get('/:id/related', productController.getRelatedProducts);
router.get('/', productController.getProducts);
router.get('/:idOrSlug', authenticateOptional, productController.getProduct);

// Admin & Vendor only routes
router.post('/', authenticate, authorize([UserRole.ADMIN, UserRole.VENDOR]), upload.array('images'), productController.createProduct);
router.put('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.VENDOR]), upload.array('images'), productController.updateProduct);
router.patch('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.VENDOR]), upload.array('images'), productController.updateProduct);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.VENDOR]), productController.deleteProduct);

export default router;
