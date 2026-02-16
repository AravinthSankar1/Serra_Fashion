import mongoose from 'mongoose';
import { config } from '../config';

export const connectDB = async (): Promise<void> => {
    console.info('Attempting to connect to MongoDB...');

    mongoose.connection.on('connected', () => {
        console.info('Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('Mongoose disconnected');
    });

    try {
        await mongoose.connect(config.mongoose.url, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        });
        console.info('Successfully connected to MongoDB');
    } catch (error) {
        console.error('FAILED to connect to MongoDB:', error);
        // Throw error so server won't start if DB is down
        throw error;
    }
};
