import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../../config';
import { UserRole } from '../user/user.interface';

export const generateTokens = (userId: string, role: UserRole, rememberMe: boolean = false) => {
    const accessToken = jwt.sign(
        { sub: userId, role, type: 'access' },
        config.jwt.accessSecret as Secret,
        { expiresIn: config.jwt.accessExpiration as SignOptions['expiresIn'] }
    );

    // If remember me is true, refresh token lasts 30 days, else default (7d)
    const refreshExpiry = rememberMe ? '30d' : config.jwt.refreshExpiration;

    const refreshToken = jwt.sign(
        { sub: userId, type: 'refresh' },
        config.jwt.refreshSecret as Secret,
        { expiresIn: refreshExpiry as SignOptions['expiresIn'] }
    );

    return { access: accessToken, refresh: refreshToken };
};

export const verifyToken = (token: string, secret: string) => {
    return jwt.verify(token, secret);
};
