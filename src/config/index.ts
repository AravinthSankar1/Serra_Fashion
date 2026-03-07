import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    PORT: z.string().default('5000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MONGODB_URI: z.string().url(),
    JWT_ACCESS_SECRET: z.string().min(1),
    JWT_REFRESH_SECRET: z.string().min(1),
    JWT_ACCESS_EXPIRATION: z.string().default('15m'),
    JWT_REFRESH_EXPIRATION: z.string().default('7d'),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().min(1),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    FACEBOOK_APP_ID: z.string().min(1),
    FACEBOOK_APP_SECRET: z.string().min(1),
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    // Email
    SMTP_HOST: z.string().optional().default('smtp.gmail.com'),
    SMTP_PORT: z.string().optional().default('587'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    // Gmail API Bypass
    GMAIL_CLIENT_ID: z.string().optional(),
    GMAIL_CLIENT_SECRET: z.string().optional(),
    GMAIL_REFRESH_TOKEN: z.string().optional(),
    // WhatsApp
    WHATSAPP_API_URL: z.string().optional().default('https://graph.facebook.com/v18.0'),
    WHATSAPP_ACCESS_TOKEN: z.string().optional(),
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    // Admin Notifications
    ADMIN_EMAIL: z.string().optional(),
    ADMIN_PHONE: z.string().optional(),
    // Qikink
    QIKINK_CLIENT_ID: z.string().optional(),
    QIKINK_CLIENT_SECRET: z.string().optional(),
    QIKINK_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
    QIKINK_SHIPPING: z.string().optional().default('1'),
    QIKINK_GATEWAY: z.string().optional().default('PREPAID'),
});

const envVars = envSchema.parse(process.env);

export const config = {
    port: parseInt(envVars.PORT, 10),
    env: envVars.NODE_ENV,
    frontendUrl: envVars.FRONTEND_URL,
    mongoose: {
        url: envVars.MONGODB_URI,
    },
    jwt: {
        accessSecret: envVars.JWT_ACCESS_SECRET,
        refreshSecret: envVars.JWT_REFRESH_SECRET,
        accessExpiration: envVars.JWT_ACCESS_EXPIRATION,
        refreshExpiration: envVars.JWT_REFRESH_EXPIRATION,
    },
    cloudinary: {
        cloudName: envVars.CLOUDINARY_CLOUD_NAME,
        apiKey: envVars.CLOUDINARY_API_KEY,
        apiSecret: envVars.CLOUDINARY_API_SECRET,
    },
    google: {
        clientId: envVars.GOOGLE_CLIENT_ID,
        clientSecret: envVars.GOOGLE_CLIENT_SECRET,
    },
    facebook: {
        appId: envVars.FACEBOOK_APP_ID,
        appSecret: envVars.FACEBOOK_APP_SECRET,
    },
    razorpay: {
        keyId: envVars.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        keySecret: envVars.RAZORPAY_KEY_SECRET || 'placeholder_secret',
    },
    email: {
        host: envVars.SMTP_HOST,
        port: parseInt(envVars.SMTP_PORT, 10),
        auth: {
            user: envVars.SMTP_USER?.trim(),
            pass: envVars.SMTP_PASS?.replace(/\s/g, ''), // Remove all spaces from App Password
        },
        from: (envVars.EMAIL_FROM || envVars.SMTP_USER)?.replace(/^["']|["']$/g, '').trim(),
        gmail: {
            clientId: envVars.GMAIL_CLIENT_ID?.trim(),
            clientSecret: envVars.GMAIL_CLIENT_SECRET?.trim(),
            refreshToken: envVars.GMAIL_REFRESH_TOKEN?.trim(),
        }
    },
    whatsapp: {
        apiUrl: envVars.WHATSAPP_API_URL,
        accessToken: envVars.WHATSAPP_ACCESS_TOKEN,
        phoneNumberId: envVars.WHATSAPP_PHONE_NUMBER_ID,
    },
    admin: {
        email: envVars.ADMIN_EMAIL,
        phone: envVars.ADMIN_PHONE,
    },
    qikink: {
        clientId: (envVars.QIKINK_CLIENT_ID || '').trim(),
        clientSecret: (envVars.QIKINK_CLIENT_SECRET || '').trim(),
        mode: envVars.QIKINK_MODE,
        baseUrl: envVars.QIKINK_MODE === 'live' ? 'https://api.qikink.com' : 'https://sandbox.qikink.com',
        shipping: parseInt(envVars.QIKINK_SHIPPING || '1', 10),
        gateway: envVars.QIKINK_GATEWAY || 'PREPAID',
    }
};
