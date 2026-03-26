import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryDiscount {
    categoryId: string;
    categoryName: string;
    discountPercentage: number;
}

export interface IStoreSettings extends Document {
    freeShippingThreshold: number;
    deliveryCharge: number;
    returnWindowDays: number;
    returnPolicy: string;
    exchangePolicy: string;
    contactEmail: string;
    contactPhone: string;
    storeAddress: string;
    isCodEnabled: boolean;
    isRazorpayEnabled: boolean;
    categoryDiscounts: ICategoryDiscount[];
    updatedAt: Date;
}

const storeSettingsSchema = new Schema<IStoreSettings>(
    {
        freeShippingThreshold: { type: Number, default: 999 },
        deliveryCharge: { type: Number, default: 79 },
        returnWindowDays: { type: Number, default: 7 },
        returnPolicy: { type: String, default: '7-day easy returns' },
        exchangePolicy: { type: String, default: '14-day effortless exchange' },
        contactEmail: { type: String, default: 'serrafashion123@gmail.com' },
        contactPhone: { type: String, default: '+91 9876543210' },
        storeAddress: { type: String, default: 'Avadi, Chennai, Tamil Nadu 600065, India' },
        isCodEnabled: { type: Boolean, default: true },
        isRazorpayEnabled: { type: Boolean, default: true },
        categoryDiscounts: {
            type: [{
                categoryId: { type: String, required: true },
                categoryName: { type: String, required: true },
                discountPercentage: { type: Number, required: true, min: 0, max: 100 },
            }],
            default: []
        }
    },
    { timestamps: true }
);

export const StoreSettings = mongoose.model<IStoreSettings>('StoreSettings', storeSettingsSchema);
