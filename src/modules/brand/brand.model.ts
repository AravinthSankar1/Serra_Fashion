import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
    name: string;
    logo?: { imageUrl: string; imagePublicId: string };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const brandSchema = new Schema<IBrand>(
    {
        name: { type: String, required: true, trim: true },
        logo: {
            imageUrl: { type: String, default: '' },
            imagePublicId: { type: String, default: '' },
        },
        isActive: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        approvalStatus: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'APPROVED'
        },
        rejectionReason: String,
    },
    { timestamps: true }
);

export const Brand = mongoose.model<IBrand>('Brand', brandSchema);
