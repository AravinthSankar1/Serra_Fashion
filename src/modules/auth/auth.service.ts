import { User } from '../user/user.model';
import { IUser, UserRole } from '../user/user.interface';
import { generateTokens as generateJwt, verifyToken } from './auth.utils';
import { RefreshToken } from './refreshToken.model';
import { eventBus, Events } from '../../events/eventBus';
import { config } from '../../config';
import axios from 'axios';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendEmailOtp, sendWhatsAppOtp } from '../../utils/notification';
import { OAuth2Client } from 'google-auth-library';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

const googleClient = new OAuth2Client(config.google.clientId);

// Helper to generate Auth Tokens with Rotation
const generateAuthTokens = async (user: IUser, ipAddress: string, rememberMe: boolean = false) => {
    // 1. Generate Access Token (JWT)
    const accessToken = jwt.sign(
        { sub: user.id, role: user.role, type: 'access' },
        config.jwt.accessSecret as Secret,
        { expiresIn: config.jwt.accessExpiration as SignOptions['expiresIn'] }
    );

    // 2. Generate Refresh Token (Opaque)
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshExpiresIn = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30d or 7d
    const refreshExpires = new Date(Date.now() + refreshExpiresIn);

    // 3. Save to DB
    await RefreshToken.create({
        user: user.id,
        token: refreshToken,
        expires: refreshExpires,
        createdByIp: ipAddress
    });

    return { access: accessToken, refresh: refreshToken, refreshExpires };
};

export const register = async (userData: Partial<IUser>, ipAddress: string) => {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        throw { statusCode: 400, message: 'Email already exists' };
    }

    const user = await User.create(userData);
    eventBus.emit(Events.USER_CREATED, user);

    const tokens = await generateAuthTokens(user, ipAddress);
    return { user, tokens };
};

export const login = async (email: string, password: string, ipAddress: string, rememberMe: boolean = false) => {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.isPasswordMatch(password))) {
        throw { statusCode: 401, message: 'Invalid credentials' };
    }

    const tokens = await generateAuthTokens(user, ipAddress, rememberMe);
    return { user, tokens };
};

export const refreshToken = async (token: string, ipAddress: string) => {
    const rToken = await RefreshToken.findOne({ token, revoked: undefined });

    if (!rToken) {
        // Reuse Detection: If token not found active, check if it was revoked?
        // Actually, let's check if it exists at all
        const revokedToken = await RefreshToken.findOne({ token });
        if (revokedToken) {
            // Token was already revoked! Security Alert!
            // Revoke all tokens in this chain (user's all tokens maybe?)
            // For now, simple logic: just fail
            throw { statusCode: 401, message: 'Token reused detected! Please login again.' };
        }
        throw { statusCode: 401, message: 'Invalid refresh token' };
    }

    if (rToken.isExpired) {
        throw { statusCode: 401, message: 'Refresh token expired' };
    }

    // Revoke current token (Role Over)
    rToken.revoked = new Date();
    rToken.revokedByIp = ipAddress;

    const user = await User.findById(rToken.user);
    if (!user) {
        throw { statusCode: 401, message: 'User not found' };
    }

    // Generate New Pair
    const newTokens = await generateAuthTokens(user, ipAddress);

    // Link rotation
    rToken.replacedByToken = newTokens.refresh;
    await rToken.save();

    return newTokens;
};

export const socialLogin = async (data: {
    email?: string,
    name?: string,
    provider: string,
    profilePicture?: string,
    idToken?: string,
    accessToken?: string
}, ipAddress: string) => {
    let email: string | undefined;
    let name: string | undefined;
    let profilePicture: string | undefined;

    const provider = data.provider.toLowerCase();

    if (provider === 'google') {
        if (!data.idToken) {
            throw { statusCode: 401, message: 'Google idToken is required' };
        }
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: data.idToken,
                audience: config.google.clientId,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw { statusCode: 401, message: 'Invalid Google token' };
            }
            email = payload.email;
            name = payload.name;
            profilePicture = payload.picture;
        } catch (error) {
            throw { statusCode: 401, message: 'Google authentication failed' };
        }
    } else if (provider === 'facebook') {
        if (!data.accessToken) {
            throw { statusCode: 401, message: 'Facebook accessToken is required' };
        }
        try {
            const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${data.accessToken}`);
            const fbData = response.data;
            if (!fbData || !fbData.email) {
                throw { statusCode: 401, message: 'Invalid Facebook token or email not shared' };
            }
            email = fbData.email;
            name = fbData.name;
            profilePicture = fbData.picture?.data?.url;
        } catch (error) {
            throw { statusCode: 401, message: 'Facebook authentication failed' };
        }
    } else {
        throw { statusCode: 400, message: 'Unsupported social provider' };
    }

    if (!email) {
        throw { statusCode: 401, message: 'Social authentication failed: Email not found' };
    }

    let user = await User.findOne({ email });

    if (!user) {
        // JIT User Provisioning
        user = await User.create({
            email,
            name: name || email.split('@')[0],
            role: 'customer',
            password: Math.random().toString(36).slice(-12) + 'S1@',
            profilePicture: { imageUrl: profilePicture || '' }
        });
        // Emit Event
        (eventBus as any).emit(Events.USER_CREATED, user);
    }

    const tokens = await generateAuthTokens(user, ipAddress);
    return { user, tokens };
};

// Helper to generate OTP
const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtp = async (contact: string, type: 'email' | 'whatsapp') => {
    // Basic validation to prevent 500 errors from invalid email formats
    if (type === 'email' && !contact.includes('@')) {
        throw { statusCode: 400, message: 'Invalid email address' };
    }

    let query: any = {};
    if (type === 'email') query.email = contact.toLowerCase().trim();
    else if (type === 'whatsapp') query.phoneNumber = contact.trim();

    let user = await User.findOne(query);

    // Auto-create user if not exists (JIT Provisioning for OTP flow)
    if (!user) {
        if (type === 'email') {
            user = await User.create({
                email: contact,
                name: contact.split('@')[0],
                role: 'customer',
                isEmailVerified: false,
                password: crypto.randomBytes(16).toString('hex') + 'S1@'
            });
        } else {
            user = await User.create({
                email: `${contact}@placeholder.com`,
                phoneNumber: contact,
                name: contact,
                role: 'customer',
                isEmailVerified: false,
                password: crypto.randomBytes(16).toString('hex') + 'S1@'
            });
        }
        // Emit Event
        (eventBus as any).emit(Events.USER_CREATED, user);
    }

    // Check rate limits (30s cooldown)
    if (user.otpLastSentAt) {
        const timeDiff = new Date().getTime() - user.otpLastSentAt.getTime();
        if (timeDiff < 30 * 1000) {
            throw { statusCode: 429, message: 'Please wait 30 seconds before requesting a new OTP' };
        }
    }

    // Generate OTP
    const otp = generateOtp();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    user.otpHash = otpHash;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save();

    let sent = false;
    if (type === 'email') {
        sent = await sendEmailOtp(contact, otp);
    } else {
        sent = await sendWhatsAppOtp(contact, otp);
    }

    if (!sent) {
        throw { statusCode: 500, message: 'Failed to send OTP' };
    }

    return { message: 'OTP sent successfully', devOtp: config.env === 'development' ? otp : undefined };
};

export const verifyOtp = async (contact: string, otp: string, type: 'email' | 'whatsapp', ipAddress: string) => {
    let query: any = {};
    if (type === 'email') query.email = contact;
    else if (type === 'whatsapp') query.phoneNumber = contact;

    const user = await User.findOne(query).select('+otpHash +otpExpires +otpAttempts');

    if (!user) {
        throw { statusCode: 404, message: 'User not found' };
    }

    if (!user.otpExpires || user.otpExpires < new Date()) {
        throw { statusCode: 400, message: 'OTP expired' };
    }

    if (user.otpAttempts && user.otpAttempts >= 5) {
        throw { statusCode: 429, message: 'Too many attempts. Please request a new OTP.' };
    }

    const isMatch = await bcrypt.compare(otp, user.otpHash || '');
    if (!isMatch) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        await user.save();
        throw { statusCode: 400, message: 'Invalid OTP' };
    }

    user.otpHash = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;

    if (type === 'email' && !user.isEmailVerified) {
        user.isEmailVerified = true;
    }

    await user.save();

    const tokens = await generateAuthTokens(user, ipAddress);
    return { user, tokens };
};
