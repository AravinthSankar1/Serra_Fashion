import { Document, Types } from 'mongoose';

export enum ProductGender {
    MEN = 'MEN',
    WOMEN = 'WOMEN',
    UNISEX = 'UNISEX'
}

export interface IVariant {
    _id?: Types.ObjectId | string;
    size?: string;
    color?: string;
    colorCode?: string;
    variantImage?: { imageUrl: string; imagePublicId: string };
    sku: string;
    price: number;
    stock: number;
}

export interface IProduct extends Document {
    name: string; // Same as title
    title: string;
    slug: string;
    description: string;
    brand: Types.ObjectId | string;
    brandId: Types.ObjectId | string; // Alias
    category: Types.ObjectId | string;
    categoryId: Types.ObjectId | string; // Alias
    gender: ProductGender;
    images: { imageUrl: string; imagePublicId: string }[];
    basePrice: number; // Same as price
    costPrice?: number;
    currency: string;
    price: number;
    discountPercentage: number; // Same as discount
    discount: number;
    finalPrice: number;
    isPublished: boolean;
    stock: number; // Total stock
    variants: IVariant[];
    sizeGuide?: Types.ObjectId | string;
    vendor?: Types.ObjectId | string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
