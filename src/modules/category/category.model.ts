import mongoose, { Schema, Document } from 'mongoose';

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
    },
    { timestamps: true }
);

export const Category = mongoose.model<ICategory>('Category', categorySchema);
