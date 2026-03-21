import mongoose, { Schema, Document } from 'mongoose';

export enum NotificationType {
    ORDER_PLACED = 'ORDER_PLACED',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
    REFUND_REQUESTED = 'REFUND_REQUESTED',
    LOW_STOCK = 'LOW_STOCK',
    VENDOR_SUBMISSION = 'VENDOR_SUBMISSION',
    SYSTEM = 'SYSTEM'
}

export interface INotification extends Document {
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    read: boolean;
    recipientRole?: 'admin' | 'vendor' | 'user';
    recipientId?: mongoose.Types.ObjectId;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
    recipientRole: { type: String, enum: ['admin', 'vendor', 'user'], default: 'admin' },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: Schema.Types.Mixed }
}, {
    timestamps: true
});

// Index for fast querying read/unread for specific recipients
notificationSchema.index({ recipientRole: 1, read: 1 });
notificationSchema.index({ recipientId: 1, read: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
