import { Notification, NotificationType } from './notification.model';

/**
 * Common System Notification creator
 */
export const createNotification = async (data: {
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    recipientRole?: 'admin' | 'vendor' | 'user';
    recipientId?: any;
    metadata?: any;
}) => {
    try {
        const notification = await Notification.create(data);
        console.log(`[NOTIFICATION] Core notification created: ${data.title}`);
        return notification;
    } catch (error) {
        console.error('[NOTIFICATION] Failed to create notification:', error);
        return null;
    }
};

/**
 * Specifically for Admin/Super-Admin alerts
 */
export const createAdminNotification = async (title: string, message: string, type: NotificationType, resourceId?: string) => {
    let link = '/admin/dashboard';
    
    if (resourceId) {
        if (type === NotificationType.VENDOR_SUBMISSION) {
            link = `/admin/products?id=${resourceId}`;
        } else {
            // Default to orders for other types like ORDER_PLACED, CANCELLED, REFUND_REQUESTED
            link = `/admin/orders?id=${resourceId}`;
        }
    }

    return await createNotification({
        title,
        message,
        type,
        link,
        recipientRole: 'admin',
        metadata: resourceId ? { resourceId } : {}
    });
};

export const getAdminNotifications = async (limit: number = 20) => {
    return await Notification.find({ recipientRole: 'admin' })
        .sort({ createdAt: -1 })
        .limit(limit);
};

export const markAsRead = async (id: string) => {
    return await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
};

export const markAllAsRead = async (role: string = 'admin') => {
    return await Notification.updateMany({ recipientRole: role, read: false }, { read: true });
};
