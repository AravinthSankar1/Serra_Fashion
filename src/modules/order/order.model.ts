import mongoose, { Schema, Document } from 'mongoose';

export enum OrderStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}

interface IStatusHistory {
    status: string;
    timestamp: Date;
    note?: string;
}

interface IOrderItem {
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
    size?: string;
    color?: string;
}

export interface IOrder extends Document {
    user: mongoose.Types.ObjectId;
    items: IOrderItem[];
    subtotal: number; // Before discount
    discount: number; // Promo discount amount
    promoCode?: string; // Applied promo code
    totalAmount: number; // After discount
    shippingAddress: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    paymentStatus: PaymentStatus;
    orderStatus: OrderStatus;
    paymentMethod: string;
    razorpayOrderId?: string; // Razorpay order ID
    razorpayPaymentId?: string; // Razorpay payment ID
    razorpaySignature?: string; // Razorpay signature for verification
    paymentVerified: boolean; // Payment signature verified
    statusHistory: IStatusHistory[];
    createdAt: Date;
    updatedAt: Date;
}

const orderItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    size: String,
    color: String,
});

const statusHistorySchema = new Schema({
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: String,
}, { _id: false });

const orderSchema = new Schema<IOrder>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        items: [orderItemSchema],
        subtotal: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        promoCode: { type: String, uppercase: true },
        totalAmount: { type: Number, required: true },
        shippingAddress: {
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            email: { type: String, required: true },
            phone: { type: String, required: true },
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        paymentStatus: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.PENDING,
        },
        orderStatus: {
            type: String,
            enum: Object.values(OrderStatus),
            default: OrderStatus.PENDING,
        },
        paymentMethod: { type: String, default: 'RAZORPAY' },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
        razorpaySignature: { type: String },
        paymentVerified: { type: Boolean, default: false },
        statusHistory: [statusHistorySchema],
    },
    { timestamps: true }
);

// Index for quick order lookup
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
