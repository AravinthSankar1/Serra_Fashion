import mongoose, { Schema, Document } from 'mongoose';

export enum PromoType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED = 'FIXED'
}

export interface IPromo extends Document {
    code: string;
    description: string;
    type: PromoType;
    value: number; // Percentage (0-100) or Fixed Amount
    minOrderAmount: number;
    maxDiscount?: number; // For percentage type, cap the discount
    usageLimit: number;
    usedCount: number;
    expiresAt: Date;
    isActive: boolean;
    applicableCategories?: mongoose.Types.ObjectId[];
    applicableProducts?: mongoose.Types.ObjectId[];
    usedBy: Array<{
        user: mongoose.Types.ObjectId;
        usedAt: Date;
        orderAmount: number;
        discountApplied: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const promoSchema = new Schema<IPromo>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        },
        description: { type: String, required: true },
        type: {
            type: String,
            enum: Object.values(PromoType),
            required: true
        },
        value: {
            type: Number,
            required: true,
            min: 0
        },
        minOrderAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        maxDiscount: {
            type: Number,
            min: 0
        },
        usageLimit: {
            type: Number,
            required: true,
            min: 1
        },
        usedCount: {
            type: Number,
            default: 0,
            min: 0
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        applicableCategories: [{
            type: Schema.Types.ObjectId,
            ref: 'Category'
        }],
        applicableProducts: [{
            type: Schema.Types.ObjectId,
            ref: 'Product'
        }],
        usedBy: [{
            user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            usedAt: { type: Date, default: Date.now },
            orderAmount: { type: Number, required: true },
            discountApplied: { type: Number, required: true }
        }]
    },
    { timestamps: true }
);

// Index for quick lookup
promoSchema.index({ code: 1, isActive: 1, expiresAt: 1 });

export const Promo = mongoose.model<IPromo>('Promo', promoSchema);
