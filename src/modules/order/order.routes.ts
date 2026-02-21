import { Router } from 'express';
import * as orderController from './order.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';

const router = Router();

router.use(authenticate);

router.post('/', orderController.placeOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', orderController.getOrderDetails);
router.get('/:id/invoice', orderController.downloadInvoice);
router.patch('/:id/cancel', orderController.cancelOrder);

// Validate Coupon
router.post('/validate-coupon', orderController.validateCoupon);

// Admin Routes
router.get('/', authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), orderController.getAllOrders);
router.patch('/:id/status', authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), orderController.updateOrder);

export default router;
