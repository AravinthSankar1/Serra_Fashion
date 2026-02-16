import { Router } from 'express';
import { getProfile, updateProfile, getAllUsers, updateAnyUser, deleteUser, handleToggleWishlist, getUserWishlist, addAddress, removeAddress, setDefaultAddress, updateShippingAddress, updateCurrencyPreference } from './user.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from './user.interface';
import { upload } from '../../utils/upload.middleware';

const router = Router();

router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, upload.single('profile'), updateProfile);
router.put('/shipping-address', authenticate, updateShippingAddress);
router.put('/currency-preference', authenticate, updateCurrencyPreference);
router.post('/wishlist/:productId', authenticate, handleToggleWishlist);
router.get('/wishlist', authenticate, getUserWishlist);
router.post('/address', authenticate, addAddress);
router.delete('/address/:addressId', authenticate, removeAddress);
router.put('/address/:addressId/default', authenticate, setDefaultAddress);

// Admin only
router.get('/', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), getAllUsers);
router.put('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), updateAnyUser);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]), deleteUser);

export default router;
