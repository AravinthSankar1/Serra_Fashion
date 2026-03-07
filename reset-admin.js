/**
 * Reset Admin Script - Plain Node.js
 * Run with: node reset-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
}

const userSchema = new mongoose.Schema(
    {
        name: String,
        email: { type: String, unique: true, lowercase: true },
        password: { type: String, select: false },
        role: { type: String, default: 'customer' },
        isEmailVerified: { type: Boolean, default: false },
        profilePicture: { imageUrl: String, imagePublicId: String },
        phoneNumber: String,
        preferredCurrency: String,
        country: String,
        otpHash: { type: String, select: false },
        otpExpires: { type: Date, select: false },
        otpAttempts: { type: Number, default: 0, select: false },
        otpLastSentAt: { type: Date, select: false },
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
        recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    },
    { timestamps: true }
);

const User = mongoose.model('User', userSchema);

const run = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected!');

        // Hash the password manually
        const hashedPassword = await bcrypt.hash('Password@123', 10);

        // Upsert: update if exists, create if not
        const result = await User.findOneAndUpdate(
            { email: 'admin@serra.com' },
            {
                $set: {
                    name: 'Serra Admin',
                    email: 'admin@serra.com',
                    password: hashedPassword,
                    role: 'super_admin',
                    isEmailVerified: true,
                }
            },
            { upsert: true, new: true }
        );

        console.log('\n🎉 Admin user reset successfully!');
        console.log('──────────────────────────────────');
        console.log(`   Email    : admin@serra.com`);
        console.log(`   Password : Password@123`);
        console.log(`   Role     : ${result.role}`);
        console.log(`   ID       : ${result._id}`);
        console.log('──────────────────────────────────');
        console.log('\nYou can now log in at: http://localhost:5173/login\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

run();
