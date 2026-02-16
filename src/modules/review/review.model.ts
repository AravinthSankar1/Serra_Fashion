import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
    user: Schema.Types.ObjectId;
    product: Schema.Types.ObjectId;
    rating: number;
    comment: string; // Title or short summary
    description?: string; // Detailed review
    images?: string[];
    isVerifiedPurchase: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, trim: true, maxlength: 100 },
        description: { type: String, trim: true, maxlength: 1000 },
        images: [String],
        isVerifiedPurchase: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Prevent multiple reviews from same user on same product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
