import { Router } from 'express';
import * as navigationController from './navigation.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';

const router = Router();

// Public route
router.get('/', navigationController.getNavigation);

// Admin routes
router.use(authenticate, authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]));
router.get('/all', navigationController.getAllNavigation);
router.post('/', navigationController.createNavigation);
router.patch('/:id', navigationController.updateNavigation);
router.delete('/:id', navigationController.deleteNavigation);

export default router;
