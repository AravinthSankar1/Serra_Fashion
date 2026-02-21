import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/error.middleware';
import { ApiResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../../config';
import { Order, PaymentStatus, OrderStatus } from '../order/order.model';
import { applyPromo } from '../promo/promo.service';
import { eventBus, Events } from '../../events/eventBus';

const razorpay = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
});

export const getRazorpayKey = asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(ApiResponse.success({ key: config.razorpay.keyId }));
});

// Step 1: Create Razorpay Order (before user pays)
export const createRazorpayOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { amount, currency = 'INR' } = req.body;

    if (!amount || amount <= 0) {
        throw { statusCode: 400, message: 'Invalid amount' };
    }

    const options = {
        amount: Math.round(amount * 100), // amount in paise
        currency,
        receipt: `rcpt_${Date.now().toString().slice(-8)}_${req.user!.sub.slice(-10)}`, // Shortened to fit 40-char limit
    };

    try {
        const razorpayOrder = await razorpay.orders.create(options);
        console.log(`[RAZORPAY] Order created: ${razorpayOrder.id} for amount ${options.amount}`);

        res.status(200).json(ApiResponse.success({
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        }, 'Razorpay order created'));
    } catch (error: any) {
        console.error('[RAZORPAY_API_ERROR]', error);
        // Razorpay errors often have a 'statusCode' and 'error' object
        const status = error.statusCode || 500;
        const msg = error.error?.description || error.message || 'Razorpay order creation failed';
        res.status(status).json(ApiResponse.error(msg, status));
    }
});

// Step 2: Verify payment and create order in DB
export const verifyPaymentAndCreateOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderData // Contains items, address, promo, etc.
    } = req.body;

    // 1. Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(body.toString())
        .digest('hex');

    console.log(`[RAZORPAY] Verifying payment: Order=${razorpay_order_id}, Payment=${razorpay_payment_id}`);

    if (expectedSignature !== razorpay_signature) {
        console.error(`[RAZORPAY] Signature Mismatch! Expected: ${expectedSignature}, Received: ${razorpay_signature}`);
        throw { statusCode: 400, message: 'Invalid payment signature. Payment verification failed.' };
    }
    console.log('[RAZORPAY] Signature verified successfully');

    // 2. Check if order already exists with this razorpay_order_id (prevent duplicates)
    const existingOrder = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (existingOrder) {
        return res.status(200).json(ApiResponse.success(existingOrder, 'Order already exists'));
    }

    // 3. Apply promo code if provided
    let discount = 0;
    if (orderData.promoCode) {
        try {
            await applyPromo(
                orderData.promoCode,
                req.user!.sub,
                orderData.subtotal,
                discount
            );
            discount = orderData.discount || 0;
        } catch (error: any) {
            // If promo fails, continue without discount
            console.error('Promo application failed:', error.message);
        }
    }

    // 4. Create order in database
    const order = await Order.create({
        user: req.user!.sub,
        items: orderData.items,
        subtotal: orderData.subtotal,
        discount,
        promoCode: orderData.promoCode,
        totalAmount: orderData.totalAmount,
        shippingAddress: orderData.shippingAddress,
        paymentMethod: 'RAZORPAY',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentVerified: true,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.PENDING,
        statusHistory: [
            { status: OrderStatus.PENDING, timestamp: new Date(), note: 'Payment verified, order created' }
        ]
    });

    // 5. Deduct stock (handled by order service in a proper implementation)
    // For now, assume it's done

    // 6. Clear cart (if needed)
    // await clearCart(req.user!.sub);

    // 7. Emit events for notifications
    (eventBus as any).emit(Events.ORDER_CREATED, order);

    res.status(201).json(ApiResponse.success(order, 'Order placed successfully'));
});

// Handle payment failure (optional, for logging)
export const handlePaymentFailure = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { razorpay_order_id, error } = req.body;

    // Log the failure
    console.error('[PAYMENT_FAILURE]', {
        razorpay_order_id,
        error,
        userId: req.user!.sub,
        timestamp: new Date()
    });

    res.status(200).json(ApiResponse.success(null, 'Payment failure logged'));
});

// Step 3: Verify payment and update EXISTING order (for "Switch to UPI")
export const verifyPaymentAndUpdateOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderId
    } = req.body;

    // 1. Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        throw { statusCode: 400, message: 'Invalid payment signature' };
    }

    // 2. Find and update order
    const order = await Order.findOne({ _id: orderId, user: req.user!.sub });
    if (!order) {
        throw { statusCode: 404, message: 'Order not found' };
    }

    order.paymentMethod = 'RAZORPAY';
    order.paymentStatus = PaymentStatus.PAID;
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentVerified = true;

    order.statusHistory.push({
        status: order.orderStatus,
        timestamp: new Date(),
        note: `Payment method switched to RAZORPAY. Status updated to PAID.`
    });

    await order.save();

    res.status(200).json(ApiResponse.success(order, 'Payment verified and order updated'));
});
