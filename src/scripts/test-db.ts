import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('MONGODB_URI is not defined in .env');
            process.exit(1);
        }
        console.log('Attempting to connect to MongoDB with debug options...');

        // Try with family: 4 to force IPv4
        await mongoose.connect(uri, {
            family: 4,
            serverSelectionTimeoutMS: 5000,
        } as any);

        console.log('✅ Connection Successful!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection Failed:');
        console.error(error);
        process.exit(1);
    }
};

testConnection();
