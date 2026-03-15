import mongoose, { Schema, Document } from 'mongoose';

export interface IStoreSettings extends Document {
    freeShippingThreshold: number;  // e.g. 999 means free shipping over ₹999
    deliveryCharge: number;          // e.g. 79
    returnWindowDays: number;        // e.g. 7
    returnPolicy: string;            // e.g. "7-day easy returns"
    exchangePolicy: string;          // e.g. "14-day exchange"
    contactEmail: string;
    contactPhone: string;
    storeAddress: string;
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
    },
    { timestamps: true }
);

export const StoreSettings = mongoose.model<IStoreSettings>('StoreSettings', storeSettingsSchema);
