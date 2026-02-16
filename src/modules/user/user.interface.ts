import { Document } from 'mongoose';

export enum UserRole {
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin',
    VENDOR = 'vendor',
    CUSTOMER = 'customer',
}

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    profilePicture?: { imageUrl: string; imagePublicId: string };
    phoneNumber?: string;
    isEmailVerified: boolean;
    preferredCurrency?: string;
    country?: string;
    defaultShippingAddress?: {
        firstName: string;
        lastName: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }[];
    wishlist?: string[];
    recentlyViewed?: string[];
    language?: string;

    otpHash?: string;
    otpExpires?: Date;
    otpAttempts?: number;
    otpLastSentAt?: Date;

    createdAt: Date;
    updatedAt: Date;

    isPasswordMatch(password: string): Promise<boolean>;
}
