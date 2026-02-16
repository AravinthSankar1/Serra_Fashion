import Queue from 'bull';
import { sendOrderConfirmation, sendOrderStatusUpdate, sendAdminOrderAlert } from '../utils/notification';
import { Order } from '../modules/order/order.model';
import { User } from '../modules/user/user.model';

// Create notification queue
export const notificationQueue = new Queue('notifications', {
    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
    }
});

// Process notification jobs
notificationQueue.process(async (job) => {
    const { type, data } = job.data;

    console.log(`[QUEUE] Processing ${type} notification:`, job.id);

    try {
        switch (type) {
            case 'ORDER_CREATED':
                await handleOrderCreated(data);
                break;
            case 'ORDER_STATUS_UPDATED':
                await handleOrderStatusUpdated(data);
                break;
            default:
                console.warn(`[QUEUE] Unknown notification type: ${type}`);
        }
    } catch (error: any) {
        console.error(`[QUEUE] Error processing notification:`, error);
        throw error; // Will trigger retry
    }
});

async function handleOrderCreated(data: { orderId: string }) {
    const order = await Order.findById(data.orderId).populate('user');
    if (!order) {
        console.error('[QUEUE] Order not found:', data.orderId);
        return;
    }

    const user = order.user as any;

    // Send to customer (Email + WhatsApp)
    await Promise.all([
        sendOrderConfirmation(user.email, order),
        user.phoneNumber ? sendOrderConfirmation(user.phoneNumber, order, 'whatsapp') : null
    ]);

    // Send to admin
    await Promise.all([
        sendAdminOrderAlert('email', order),
        sendAdminOrderAlert('whatsapp', order)
    ]);

    console.log(`[QUEUE] Order confirmation sent for order: ${order._id}`);
}

async function handleOrderStatusUpdated(data: { orderId: string, newStatus: string }) {
    const order = await Order.findById(data.orderId).populate('user');
    if (!order) {
        console.error('[QUEUE] Order not found:', data.orderId);
        return;
    }

    const user = order.user as any;

    // Send to customer
    await Promise.all([
        sendOrderStatusUpdate(user.email, order, data.newStatus),
        user.phoneNumber ? sendOrderStatusUpdate(user.phoneNumber, order, data.newStatus, 'whatsapp') : null
    ]);

    console.log(`[QUEUE] Status update sent for order: ${order._id}`);
}

// Error handling
notificationQueue.on('failed', (job, err) => {
    console.error(`[QUEUE] Job ${job.id} failed:`, err.message);
});

notificationQueue.on('completed', (job) => {
    console.log(`[QUEUE] Job ${job.id} completed`);
});

export default notificationQueue;
