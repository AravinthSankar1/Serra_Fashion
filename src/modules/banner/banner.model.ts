import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
    title: string;
    description: string;
    image: {
        imageUrl: string;
        imagePublicId: string;
    };
    mobileImage?: {
        imageUrl: string;
        imagePublicId: string;
    };
    type: 'HERO' | 'SECONDARY_PROMO' | 'CATEGORY_TILE';
    link: string;
    cta: string;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        image: {
            imageUrl: { type: String, required: true },
            imagePublicId: { type: String, required: true },
        },
        mobileImage: {
            imageUrl: { type: String },
            imagePublicId: { type: String },
        },
        type: { type: String, enum: ['HERO', 'SECONDARY_PROMO', 'CATEGORY_TILE'], default: 'HERO' },
        link: { type: String, default: '/collection' },
        cta: { type: String, default: 'Shop Now' },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const Banner = mongoose.model<IBanner>('Banner', bannerSchema);
