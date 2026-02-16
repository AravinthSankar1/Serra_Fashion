import mongoose from 'mongoose';
import { config } from '../config';

export const connectDB = async (): Promise<void> => {
    console.info('Attempting to connect to MongoDB...');

    (mongoose.connection as any).on('connected', () => {
        console.info('Mongoose connected to DB');
    });

    (mongoose.connection as any).on('error', (err: any) => {
        console.error('Mongoose connection error:', err);
    });

    (mongoose.connection as any).on('disconnected', () => {
        console.warn('Mongoose disconnected');
    });

    try {
        await mongoose.connect(config.mongoose.url, {
            serverSelectionTimeoutMS: 5000,
        } as any);
        console.info('Successfully connected to MongoDB');
    } catch (error) {
        console.error('FAILED to connect to MongoDB:', error);
        throw error;
    }
};
