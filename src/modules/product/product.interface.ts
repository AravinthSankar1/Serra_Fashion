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
    vipPrice?: number; // Tribe Member Price
    fit?: string;
    sleeveLength?: string;
    material?: string;
    collectionTags?: string[];
    isPublished: boolean;
    stock: number; // Total stock
    variants: IVariant[];
    sizeGuide?: Types.ObjectId | string;
    vendor?: Types.ObjectId | string;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    // Qikink print-on-demand
    qikinkSku?: string;
    isFulfilledByQikink?: boolean;
    
    // Bewakoof-style individual product controls
    isCodAvailable: boolean;
    isReturnable: boolean;
    isReplaceable: boolean;
    returnWindow: number; // in days

    createdAt: Date;
    updatedAt: Date;
}
