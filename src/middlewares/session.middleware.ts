import { Response, NextFunction } from 'express';
import { ActiveSession } from '../modules/session/session.model';
import { AuthRequest } from './auth.middleware';

export const trackSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Skip tracking for non-GET requests if they are assets or internal
        const path = req.path;
        if (path.includes('/api/admin/active-sessions') || path.includes('/api/admin/stats')) {
            return next();
        }

        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        // We use a combination of IP and UserAgent as a sessionId if no visitor ID was provided
        // In a real-world app, we'd use a dedicated cookie-based visitor ID.
        const visitorId = req.headers['x-visitor-id'] || `${ip}-${userAgent}`;
        
        const userId = req.user?.sub;
        
        // Only track if it's an API request or a page request (simplified check)
        // Adjust path if needed
        const currentPath = req.headers['x-current-path'] || path;

        // Upsert the session record
        // We use userId + visitorId to handle cases where a user might log in/out
        const query = userId ? { userId } : { sessionId: visitorId };

        await ActiveSession.findOneAndUpdate(
            query,
            {
                userId,
                sessionId: visitorId,
                ip,
                userAgent,
                currentPath,
                lastActive: new Date(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        next();
    } catch (error) {
        // Silently fail session tracking to not interrupt the main request flow
        console.error('Session tracking error:', error);
        next();
    }
};
