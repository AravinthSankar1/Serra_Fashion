import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as reviewController from './review.controller';

const router = Router({ mergeParams: true }); // Enable access to :productId from parent router if nested

router.get('/', reviewController.getProductReviews);
router.post('/', authenticate, reviewController.addReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

export default router;
