import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { Review } from './review.model';
import { Product } from '../product/product.model';
import { Order } from '../order/order.model';
import { ApiResponse } from '../../utils/response';
import { asyncHandler } from '../../middlewares/error.middleware';

// Get reviews for a product
export const getProductReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;
    const reviews = await Review.find({ product: productId })
        .populate('user', 'name profilePicture')
        .sort({ createdAt: -1 });

    res.status(200).json(ApiResponse.success(reviews));
});

// Add a review
export const addReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;
    const { rating, comment, description, images } = req.body;
    const userId = req.user!.sub;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) throw { statusCode: 404, message: 'Product not found' };

    // Check if verified purchase (optional but good for trust)
    const hasPurchased = await Order.findOne({
        user: userId,
        "items.product": productId,
        paymentStatus: 'PAID'
    });

    const review = await Review.create({
        user: userId,
        product: productId,
        rating,
        comment,
        description,
        images,
        isVerifiedPurchase: !!hasPurchased
    });

    // Update Product Stats (Recalculate average rating)
    const reviews = await Review.find({ product: productId });
    const totalRating = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productId, {
        ratings: averageRating,
        numReviews: reviews.length
    });

    res.status(201).json(ApiResponse.success(review, 'Review added successfully'));
});

// Delete review (Admin or Owner)
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) throw { statusCode: 404, message: 'Review not found' };

    if (review.user.toString() !== req.user!.sub && req.user!.role !== 'admin') {
        throw { statusCode: 403, message: 'Not authorized' };
    }

    const productId = review.product;
    await review.deleteOne();

    // Update Product Stats
    const reviews = await Review.find({ product: productId });
    const totalRating = reviews.length > 0 ? reviews.reduce((acc, curr) => acc + curr.rating, 0) : 0;
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    await Product.findByIdAndUpdate(productId, {
        ratings: averageRating,
        numReviews: reviews.length
    });

    res.status(200).json(ApiResponse.success(null, 'Review deleted'));
});
