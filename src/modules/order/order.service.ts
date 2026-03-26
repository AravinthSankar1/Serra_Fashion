import { Order, IOrder, OrderStatus, PaymentStatus } from './order.model';
import { Product } from '../product/product.model';
import { IVariant } from '../product/product.interface';
import { clearCart } from '../cart/cart.service';
import { eventBus, Events } from '../../events/eventBus';
import { submitOrderToQikink } from '../../services/qikink.service';
import { StoreSettings } from '../settings/settings.model';

export const createOrder = async (userId: string, orderData: Partial<IOrder>) => {
    // Global COD check
    if (orderData.paymentMethod === 'COD') {
        const settings = await StoreSettings.findOne();
        if (settings && settings.isCodEnabled === false) {
            throw { statusCode: 400, message: 'Cash on Delivery is currently disabled by the store.' };
        }
    }

    // Fetch product titles and validate COD per item
    if (orderData.items) {
        for (const item of orderData.items) {
            const product = await Product.findById(item.product);
            if (!product) continue;
            
            // Populate the name field for persistent invoices
            (item as any).name = product.title;

            if (orderData.paymentMethod === 'COD' && product.isCodAvailable === false) {
                throw { 
                    statusCode: 400, 
                    message: `Product "${product.title}" is not available for Cash on Delivery.` 
                };
            }
        }
    }

    const order = await Order.create({
        ...orderData,
        user: userId,
        statusHistory: [{ status: OrderStatus.PENDING, timestamp: new Date(), note: 'Order placed' }]
    });

    // Deduct stock and validate availability
    for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) {
            console.warn(`[STOCK] Product not found ${item.product}`);
            continue;
        }

        // Logic for Variant Stock Deduction
        if (item.size && product.variants && product.variants.length > 0) {
            const variant = product.variants.find((v: IVariant) =>
                v.size === item.size && (item.color ? v.color === item.color : true)
            );

            if (!variant || variant.stock < item.quantity) {
                console.warn(`[STOCK] Insufficient variant stock for product ${item.product} size ${item.size}`);
                // In production, throw error here
            } else {
                // Atomic update for variant stock
                await Product.findOneAndUpdate(
                    { _id: item.product, variants: { $elemMatch: { _id: variant._id! } } },
                    {
                        $inc: {
                            "variants.$.stock": -item.quantity,
                            stock: -item.quantity // Also update global stock count
                        }
                    }
                );
            }
        } else {
            // Logic for Simple Product Stock Deduction
            if (product.stock < item.quantity) {
                console.warn(`[STOCK] Insufficient stock for product ${item.product}`);
            }
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity },
            });
        }
    }

    // Clear user's cart after successful order placement
    await clearCart(userId);

    // Emit Order Created Event for Admin Dashboard / Notifications
    (eventBus as any).emit(Events.ORDER_CREATED, order);

    // Send Notifications
    import('../../utils/notification').then(({ sendOrderNotification }) => {
        sendOrderNotification(order);
    });

    import('../notification/notification.service').then(({ createAdminNotification }) => {
        import('../notification/notification.model').then(({ NotificationType }) => {
            createAdminNotification(
                'New Order Received',
                `A new order #${order._id.toString().slice(-6).toUpperCase()} has been placed for ₹${order.totalAmount.toLocaleString()}.`,
                NotificationType.ORDER_PLACED,
                order._id.toString()
            );
        });
    });

    console.log(`[ORDER] New order placed: ${order._id} by user ${userId}`);

    // ── Qikink Fulfillment (fire-and-forget) ──────────────────────────────
    // Populate product details needed for Qikink submission
    Order.findById(order._id).populate('items.product').then(async (populatedOrder) => {
        if (!populatedOrder) return;
        submitOrderToQikink(populatedOrder).then(async (result) => {
            if (result) {
                const qikinkOrderId = result?.order?.id || result?.order?.order_id || null;
                await Order.findByIdAndUpdate(order._id, {
                    qikinkSubmitted: true,
                    ...(qikinkOrderId ? { qikinkOrderId } : {}),
                    qikinkStatus: 'SUBMITTED',
                });
                console.log(`[QIKINK] Order ${order._id} submitted. Qikink ID: ${qikinkOrderId}`);
            }
        }).catch((err: any) => {
            console.error(`[QIKINK] Failed to submit order ${order._id}:`, err?.message || err);
        });
    }).catch((err: any) => {
        console.error(`[QIKINK] Populate error for order ${order._id}:`, err?.message || err);
    });
    // ─────────────────────────────────────────────────────────────────────

    return order;
};

export const getUserOrders = async (userId: string) => {
    return await Order.find({ user: userId }).populate('items.product').sort({ createdAt: -1 });
};

export const getOrderById = async (orderId: string, userId?: string) => {
    const query: any = { _id: orderId };
    if (userId) query.user = userId;

    return await Order.findOne(query).populate('items.product user', 'name email');
};

export const getAllOrders = async (filters: any = {}, page: number = 1, limit: number = 20) => {
    const query: any = {};

    if (filters.status) query.orderStatus = filters.status;
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.userId) query.user = filters.userId;

    if (filters.vendorId) {
        const vendorProductIds = await Product.find({ vendor: filters.vendorId }).distinct('_id');
        query['items.product'] = { $in: vendorProductIds };
    }

    // Advanced search (e.g. by order ID or user name - handled by controller passing IDs?) 
    // Usually controller handles complex parsing, service handles direct query fields.

    const skip = (page - 1) * limit;

    const [orders, total, statsResult, pendingCount] = await Promise.all([
        Order.find(query)
            .populate('user', 'name email')
            .populate('items.product')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Order.countDocuments(query),
        Order.aggregate([
            { $match: { ...query, paymentStatus: 'PAID' } },
            { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } }
        ]),
        Order.countDocuments({ ...query, orderStatus: 'PENDING' })
    ]);

    return {
        orders,
        total,
        page,
        pages: Math.ceil(total / limit),
        stats: {
            totalRevenue: statsResult[0]?.totalSales || 0,
            pendingCount
        }
    };
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    let update: any = {
        $set: { orderStatus: status },
        $push: { statusHistory: { status, timestamp: new Date(), note: note || `Order status updated to ${status}` } }
    };

    // If marked as DELIVERED and it was COD, automatically mark as PAID
    if (status === OrderStatus.DELIVERED) {
        const currentOrder = await Order.findById(orderId);
        if (currentOrder && currentOrder.paymentMethod === 'COD' && currentOrder.paymentStatus === 'PENDING') {
            update.$set.paymentStatus = 'PAID';
            update.$push.statusHistory.push({
                status: 'PAYMENT_RECEIVED',
                timestamp: new Date(),
                note: 'Payment received via Cash on Delivery'
            });
        }
    }

    const order = await Order.findByIdAndUpdate(orderId, update, { new: true });

    // Emit event for notifications
    if (order) {
        (eventBus as any).emit(Events.ORDER_STATUS_UPDATED, { orderId: order._id, newStatus: status });
    }

    return order;
};

export const updatePaymentStatus = async (orderId: string, status: any, note?: string) => {
    const order = await Order.findByIdAndUpdate(
        orderId,
        {
            $set: { paymentStatus: status },
            $push: { statusHistory: { status: `PAYMENT_${status}`, timestamp: new Date(), note: note || `Payment status updated to ${status}` } }
        },
        { new: true }
    );
    return order;
};

export const cancelOrderForUser = async (orderId: string, userId: string, reason?: string, description?: string) => {
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
        throw { statusCode: 404, message: 'Order not found' };
    }

    if (!['PENDING', 'PROCESSING'].includes(order.orderStatus)) {
        throw { statusCode: 400, message: `Order cannot be cancelled in ${order.orderStatus} status` };
    }

    // Restore stock
    for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) continue;

        if (item.size && product.variants && product.variants.length > 0) {
            const variant = product.variants.find((v: IVariant) =>
                v.size === item.size && (item.color ? v.color === item.color : true)
            );

            if (variant) {
                await Product.findOneAndUpdate(
                    { _id: item.product, "variants._id": variant._id },
                    {
                        $inc: {
                            "variants.$.stock": item.quantity,
                            stock: item.quantity
                        }
                    }
                );
            }
        } else {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity }
            });
        }
    }

    order.orderStatus = OrderStatus.CANCELLED;
    order.cancellationReason = reason;
    order.cancellationDescription = description;
    order.statusHistory.push({
        status: OrderStatus.CANCELLED,
        timestamp: new Date(),
        note: `Order cancelled by customer. Reason: ${reason || 'Not provided'}`
    });

    await order.save();

    // Notify Admin via Email and In-App notification
    const populatedOrder = await Order.findById(order._id).populate('user', 'name email');
    import('../../utils/notification').then(({ sendAdminCancellationAlert }) => {
        sendAdminCancellationAlert('email', populatedOrder, reason);
    });

    import('../notification/notification.service').then(({ createAdminNotification }) => {
        import('../notification/notification.model').then(({ NotificationType }) => {
            createAdminNotification(
                'Order Cancelled',
                `Order #${order._id.toString().slice(-6).toUpperCase()} was cancelled by the customer. Reason: ${reason || 'Not provided'}.`,
                NotificationType.ORDER_CANCELLED,
                order._id.toString()
            );
        }).catch(err => console.error('[NOTIF_ERR] Admin cancellation notification failed:', err));
    });

    // Emit event
    (eventBus as any).emit(Events.ORDER_STATUS_UPDATED, { orderId: order._id, newStatus: OrderStatus.CANCELLED });

    return order;
};

export const requestRefundForUser = async (orderId: string, userId: string, reason: string, description?: string) => {
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
        throw { statusCode: 404, message: 'Order not found' };
    }

    // Usually can only refund if PAID or DELIVERED (if not delivered they'd cancel)
    if (order.paymentStatus !== PaymentStatus.PAID) {
        throw { statusCode: 400, message: 'Only paid orders can be requested for refund.' };
    }

    if (order.orderStatus === OrderStatus.CANCELLED || order.orderStatus === OrderStatus.REFUND_REQUESTED) {
        throw { statusCode: 400, message: `Order is already ${order.orderStatus}.` };
    }

    order.orderStatus = OrderStatus.REFUND_REQUESTED;
    order.refundReason = reason;
    order.refundDescription = description;
    order.statusHistory.push({
        status: OrderStatus.REFUND_REQUESTED,
        timestamp: new Date(),
        note: `Refund requested by customer. Reason: ${reason}`
    });

    await order.save();

    // Notify Admin via Email and In-App notification
    const populatedOrder = await Order.findById(order._id).populate('user', 'name email');
    import('../../utils/notification').then(({ sendAdminRefundAlert }) => {
        sendAdminRefundAlert('email', populatedOrder, reason, description);
    });

    import('../notification/notification.service').then(({ createAdminNotification }) => {
        import('../notification/notification.model').then(({ NotificationType }) => {
            createAdminNotification(
                'Refund Requested',
                `A refund has been requested for Order #${order._id.toString().slice(-6).toUpperCase()}. Reason: ${reason}.`,
                NotificationType.REFUND_REQUESTED,
                order._id.toString()
            );
        }).catch(err => console.error('[NOTIF_ERR] Admin refund notification failed:', err));
    });

    // Emit event
    (eventBus as any).emit(Events.ORDER_STATUS_UPDATED, { orderId: order._id, newStatus: OrderStatus.REFUND_REQUESTED });

    return order;
};
