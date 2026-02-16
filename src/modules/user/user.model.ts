import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser, UserRole } from './user.interface';

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false },
        role: { type: String, enum: Object.values(UserRole), default: UserRole.CUSTOMER },
        profilePicture: {
            imageUrl: { type: String, default: '' },
            imagePublicId: { type: String, default: '' },
        },
        phoneNumber: { type: String, default: '' },
        isEmailVerified: { type: Boolean, default: false },
        preferredCurrency: { type: String, default: 'INR' },
        country: { type: String, default: 'IN' },
        defaultShippingAddress: {
            firstName: String,
            lastName: String,
            phone: String,
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String,
        },
        address: [
            {
                street: String,
                city: String,
                state: String,
                zip: String,
                country: String,
                isDefault: { type: Boolean, default: false },
            },
        ],
        wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
        recentlyViewed: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
        language: { type: String, default: 'English' },

        otpHash: { type: String, select: false },
        otpExpires: { type: Date, select: false },
        otpAttempts: { type: Number, default: 0, select: false },
        otpLastSentAt: { type: Date, select: false },
    },
    { timestamps: true }
);

userSchema.methods.isPasswordMatch = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password as string);
};

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password as string, 10);
    }
    next();
});

export const User = mongoose.model<IUser>('User', userSchema);
