import mongoose from 'mongoose';
import { User } from '../modules/user/user.model';
import { UserRole } from '../modules/user/user.interface';
import { config } from '../config';
import dotenv from 'dotenv';

dotenv.config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(config.mongoose.url);
        console.log('Connected to DB...');

        // Remove existing admin if any
        await User.deleteOne({ email: 'admin@serra.com' });

        // Create fresh admin user (password will be hashed by the pre-save hook)
        const admin = await User.create({
            name: 'Serra Admin',
            email: 'admin@serra.com',
            password: 'Password@123',
            role: UserRole.SUPER_ADMIN,
            isEmailVerified: true,
        });

        console.log('✅ Admin user created/reset successfully!');
        console.log(`   Email: admin@serra.com`);
        console.log(`   Password: Password@123`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   ID: ${admin._id}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to reset admin:', error);
        process.exit(1);
    }
};

resetAdmin();
