import mongoose, { Schema } from 'mongoose';
import { ISizeGuide } from './sizeGuide.interface';

const sizeGuideSchema = new Schema<ISizeGuide>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        image: {
            imageUrl: { type: String, required: true },
            imagePublicId: { type: String, required: true }
        },
        category: { type: Schema.Types.ObjectId, ref: 'Category' }
    },
    { timestamps: true }
);

export const SizeGuide = mongoose.model<ISizeGuide>('SizeGuide', sizeGuideSchema);
