import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { Review } from './review.model';
import { Product } from '../product/product.model';
import { Order } from '../order/order.model';
import { ApiResponse } from '../../utils/response';
import { asyncHandler } from '../../middlewares/error.middleware';
import { UserRole } from '../user/user.interface';

import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';

// Get reviews for a product
export const getProductReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;
    let reviews = await Review.find({ product: productId })
        .populate('user', 'name profilePicture')
        .sort({ createdAt: -1 });

    // Filter out reviews where user account no longer exists
    reviews = reviews.filter(review => review.user !== null);

    res.status(200).json(ApiResponse.success(reviews));
});

// Add a review
export const addReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId } = req.params;
    const { rating, comment, description } = req.body;
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

    let images: { imageUrl: string, imagePublicId: string }[] = [];
    if (req.files && Array.isArray(req.files)) {
        const uploadPromises = (req.files as any[]).map(file =>
            uploadToCloudinary(file, 'reviews')
        );
        images = (await Promise.all(uploadPromises)) as { imageUrl: string, imagePublicId: string }[];
    }

    const review = await Review.create({
        user: userId,
        product: productId,
        rating: Number(rating),
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

// Get all reviews (Admin only)
export const getAllReviews = asyncHandler(async (_req: AuthRequest, res: Response) => {
    let reviews = await Review.find()
        .populate('user', 'name profilePicture')
        .populate('product', 'title slug images')
        .sort({ createdAt: -1 });

    // Filter out reviews where user account no longer exists
    reviews = reviews.filter(review => review.user !== null);

    res.status(200).json(ApiResponse.success(reviews));
});

// Update review status/priority (Admin only)
export const updateReviewStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { showOnHomepage, priority } = req.body;

    const review = await Review.findById(id);
    if (!review) throw { statusCode: 404, message: 'Review not found' };

    if (showOnHomepage !== undefined) review.showOnHomepage = showOnHomepage;
    if (priority !== undefined) review.priority = Number(priority);

    await review.save();
    res.status(200).json(ApiResponse.success(review, 'Review updated successfully'));
});

// Get featured reviews for homepage
export const getFeaturedReviews = asyncHandler(async (_req: AuthRequest, res: Response) => {
    let reviews = await Review.find({ showOnHomepage: true })
        .populate('user', 'name profilePicture')
        .sort({ priority: -1, createdAt: -1 })
        .limit(10);

    // Filter out reviews where user account no longer exists (populate returns null)
    reviews = reviews.filter(review => review.user !== null);

    res.status(200).json(ApiResponse.success(reviews));
});

// Delete review (Admin or Owner)
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) throw { statusCode: 404, message: 'Review not found' };

    if (review.user.toString() !== req.user!.sub && req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.SUPER_ADMIN) {
        throw { statusCode: 403, message: 'Not authorized' };
    }

    const productId = review.product;
    
    // Purge images from cloud
    if (review.images && review.images.length > 0) {
        for (const img of review.images) {
            if (img.imagePublicId) {
                await deleteFromCloudinary(img.imagePublicId);
            }
        }
    }

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

