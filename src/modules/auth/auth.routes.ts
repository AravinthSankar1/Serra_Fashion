import { Router } from 'express';
import * as authController from './auth.controller';

import rateLimit from 'express-rate-limit';

const router = Router();

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 OTP requests per windowMs
    message: 'Too many OTP requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit verify attempts
    message: 'Too many verification attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/social-login', authController.socialLogin);
router.post('/refresh-token', authController.refreshToken);
router.post('/send-otp', otpLimiter, authController.sendOtp);
router.post('/verify-otp', verifyLimiter, authController.verifyOtp);
router.post('/logout', authController.logout);

export default router;
