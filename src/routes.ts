import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import productRoutes from './modules/product/product.routes';
import categoryRoutes from './modules/category/category.routes';
import brandRoutes from './modules/brand/brand.routes';
import adminRoutes from './modules/admin/admin.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/order/order.routes';
import paymentRoutes from './modules/payment/payment.routes';
import promoRoutes from './modules/promo/promo.routes';
import locationRoutes from './modules/location/location.routes';
import currencyRoutes from './modules/currency/currency.routes';
import sizeGuideRoutes from './modules/sizeGuide/sizeGuide.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/admin', adminRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payment', paymentRoutes);
router.use('/promos', promoRoutes);
router.use('/locations', locationRoutes);
router.use('/currency', currencyRoutes);
router.use('/size-guides', sizeGuideRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
