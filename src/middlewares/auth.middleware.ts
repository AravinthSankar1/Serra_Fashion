import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiResponse } from '../utils/response';
import { UserRole } from '../modules/user/user.interface';

export interface AuthRequest extends Request {
    user?: {
        sub: string;
        role: UserRole;
        name?: string;
    };
    headers: Request['headers'];
    body: any;
    params: any;
    query: any;
    file?: any;
    files?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json(ApiResponse.error('Unauthorized', 401));
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json(ApiResponse.error('Invalid Token', 401));
    }
};

export const authenticateOptional = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
        req.user = decoded;
        next();
    } catch (error) {
        // If token is invalid, we just don't populate req.user but still allow the request
        next();
    }
};

export const authorize = (roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json(ApiResponse.error('Forbidden', 403));
    }
    next();
};
