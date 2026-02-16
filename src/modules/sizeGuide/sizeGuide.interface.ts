import { Document } from 'mongoose';

export interface ISizeGuide extends Document {
    name: string;
    description?: string;
    image: {
        imageUrl: string;
        imagePublicId: string;
    };
    category?: string; // Optional filtering
    createdAt: Date;
    updatedAt: Date;
}
