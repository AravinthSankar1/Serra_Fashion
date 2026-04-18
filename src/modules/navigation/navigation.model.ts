import mongoose, { Schema, Document, Types } from 'mongoose';

export enum NavType {
    CATEGORY = 'CATEGORY',
    GENDER = 'GENDER',
    CUSTOM = 'CUSTOM'
}

export interface INavigation extends Document {
    label: string;
    type: NavType;
    path?: string;
    categoryId?: Types.ObjectId | string;
    gender?: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const navigationSchema = new Schema<INavigation>(
    {
        label: { type: String, required: true, trim: true },
        type: { type: String, enum: Object.values(NavType), default: NavType.CUSTOM },
        path: { type: String, trim: true },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
        gender: { type: String, enum: ['MEN', 'WOMEN', 'UNISEX'] },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Index for efficient ordering
navigationSchema.index({ order: 1 });

export const Navigation = mongoose.model<INavigation>('Navigation', navigationSchema);
