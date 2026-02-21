import { Router } from 'express';
import * as paymentController from './payment.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/razorpay-key', paymentController.getRazorpayKey);
router.post('/create-order', authenticate, paymentController.createRazorpayOrder);
router.post('/verify-and-create', authenticate, paymentController.verifyPaymentAndCreateOrder);
router.post('/verify-and-update-order', authenticate, paymentController.verifyPaymentAndUpdateOrder);
router.post('/payment-failure', authenticate, paymentController.handlePaymentFailure);

export default router;
