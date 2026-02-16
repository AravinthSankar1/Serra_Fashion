import { EventEmitter } from 'node:events';
import { config } from '../config';

// Typed Events Enum
export enum Events {
    USER_CREATED = 'user.created',
    PRODUCT_CREATED = 'product.created',
    PRODUCT_LOW_STOCK = 'product.stock.low',
    ORDER_CREATED = 'order.created',
    ORDER_STATUS_UPDATED = 'order.status.updated',
    PAYMENT_SUCCESS = 'payment.success',
    PAYMENT_FAILED = 'payment.failed',
}

class EventBus extends EventEmitter {
    private static instance: EventBus;

    private constructor() {
        super();
        this.setupListeners();
    }

    private setupListeners() {
        // Order Created - Trigger Notifications
        this.on(Events.ORDER_CREATED, async (order) => {
            try {
                const { notificationQueue } = await import('../queue/notification.queue');
                await notificationQueue.add({ type: 'ORDER_CREATED', data: { orderId: order._id } });
            } catch (error) {
                console.error('[EVENT] Failed to queue ORDER_CREATED notification:', error);
            }
        });

        // Order Status Update - Trigger Notifications
        this.on(Events.ORDER_STATUS_UPDATED, async (data) => {
            try {
                const { notificationQueue } = await import('../queue/notification.queue');
                await notificationQueue.add({
                    type: 'ORDER_STATUS_UPDATED',
                    data: { orderId: data.orderId, newStatus: data.newStatus }
                });
            } catch (error) {
                console.error('[EVENT] Failed to queue ORDER_STATUS_UPDATED notification:', error);
            }
        });
    }

    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
}

export const eventBus = EventBus.getInstance();
