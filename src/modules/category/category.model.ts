import mongoose, { Schema, Document, Types } from 'mongoose';

export enum CategoryGender {
    MEN = 'MEN',
    WOMEN = 'WOMEN',
    UNISEX = 'UNISEX'
}

export interface ICategory extends Document {
    name: string;
    slug: string;
    gender: CategoryGender;
    image?: { imageUrl: string; imagePublicId: string };
    isActive: boolean;
    createdBy?: Types.ObjectId | string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        image: {
            imageUrl: { type: String, default: '' },
            imagePublicId: { type: String, default: '' },
        },
        gender: { type: String, enum: Object.values(CategoryGender), default: CategoryGender.UNISEX },
        isActive: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        approvalStatus: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING'
        },
        rejectionReason: String,
    },
    { timestamps: true }
);

export const Category = mongoose.model<ICategory>('Category', categorySchema);
