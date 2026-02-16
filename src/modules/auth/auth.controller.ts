import { Response, Request, CookieOptions } from 'express';
import { asyncHandler } from '../../middlewares/error.middleware';
import * as authService from './auth.service';
import { ApiResponse } from '../../utils/response';
import { config } from '../../config';

const sendTokenResponse = (res: Response, result: { user?: any, tokens: { access: string, refresh: string, refreshExpires: Date } }, message: string) => {
    const { user, tokens } = result;

    const cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: config.env === 'production',
        expires: tokens.refreshExpires,
        sameSite: config.env === 'production' ? 'strict' : 'lax'
    };

    res.cookie('refreshToken', tokens.refresh, cookieOptions);

    res.status(200).json(ApiResponse.success({
        user,
        tokens: {
            access: tokens.access,
            refresh: tokens.refresh
        }
    }, message));
};

export const register = asyncHandler(async (req: Request, res: Response) => {
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    const result = await authService.register(req.body, ipAddress);
    sendTokenResponse(res, result, 'User registered successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, rememberMe } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    const result = await authService.login(email, password, ipAddress, !!rememberMe);
    sendTokenResponse(res, result, 'Login successful');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const ipAddress = req.ip || req.socket.remoteAddress || '';

    if (!refreshToken) {
        throw { statusCode: 400, message: 'Refresh token is required' };
    }

    const tokens = await authService.refreshToken(refreshToken, ipAddress);

    // Create a result object fitting sendTokenResponse, handling missing user
    const result = { tokens };
    // Types might complain about missing user, but function says user?: any.

    // Direct response for refresh to simple wrapper
    const cookieOptions: CookieOptions = {
        httpOnly: true,
        secure: config.env === 'production',
        expires: tokens.refreshExpires,
        sameSite: config.env === 'production' ? 'strict' : 'lax'
    };

    res.cookie('refreshToken', tokens.refresh, cookieOptions);
    res.status(200).json(ApiResponse.success({
        access: tokens.access,
        refresh: tokens.refresh
    }, 'Token refreshed successfully'));
});

export const socialLogin = asyncHandler(async (req: Request, res: Response) => {
    const ipAddress = req.ip || req.socket.remoteAddress || '';
    const result = await authService.socialLogin(req.body, ipAddress);
    sendTokenResponse(res, result, 'Social login successful');
});

export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
    const { contact, type } = req.body; // type: 'email' | 'whatsapp'
    if (!contact || !['email', 'whatsapp'].includes(type)) {
        throw { statusCode: 400, message: 'Invalid contact or type. Type must be email or whatsapp.' };
    }
    const result = await authService.sendOtp(contact, type);
    res.status(200).json(ApiResponse.success(result, 'OTP sent successfully'));
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { contact, otp, type } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || '';

    if (!contact || !otp || !['email', 'whatsapp'].includes(type)) {
        throw { statusCode: 400, message: 'Invalid request. Provide contact, otp and type.' };
    }
    const result = await authService.verifyOtp(contact, otp, type, ipAddress);
    sendTokenResponse(res, result, 'OTP verified successfully');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    // Ideally we should revoke the token in DB, but for now just clear cookie
    // To strictly revoke, we need the refresh token value
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (refreshToken) {
        // Call service to revoke if you want strict logout
        // await authService.revokeToken(refreshToken); 
        // But we didn't implement revokeToken public function yet, only implicit in refresh.
        // Pass for now.
    }

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: config.env === 'production' ? 'strict' : 'lax'
    });
    res.status(200).json(ApiResponse.success(null, 'Logged out successfully'));
});
