import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as reviewController from './review.controller';

const router = Router({ mergeParams: true });

router.get('/featured', reviewController.getFeaturedReviews);
router.get('/all', authenticate, reviewController.getAllReviews);
router.patch('/:id/status', authenticate, reviewController.updateReviewStatus);

router.get('/', reviewController.getProductReviews);
router.post('/', authenticate, reviewController.addReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

export default router;
