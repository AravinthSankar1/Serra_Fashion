import { Router } from 'express';
import * as cartController from './cart.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate); // All cart routes require authentication

router.get('/', cartController.getCart);
router.post('/add', cartController.addItem);
router.put('/update', cartController.updateItem);
router.delete('/clear', cartController.clearCart);

export default router;
