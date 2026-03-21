import { Router } from 'express';
import * as notificationService from './notification.service';

const router = Router();

// Get admin notifications
router.get('/admin', async (req, res, next) => {
    try {
        const notifications = await notificationService.getAdminNotifications();
        res.json({ status: 'success', data: notifications });
    } catch (error) {
        next(error);
    }
});

// Mark as read
router.patch('/:id/read', async (req, res, next) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id);
        res.json({ status: 'success', data: notification });
    } catch (error) {
        next(error);
    }
});

// Mark all as read
router.post('/read-all', async (req, res, next) => {
    try {
        await notificationService.markAllAsRead();
        res.json({ status: 'success', message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
});

export default router;
