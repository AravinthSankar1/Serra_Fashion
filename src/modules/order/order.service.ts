import { Order, IOrder, OrderStatus, PaymentStatus } from './order.model';
import { Product } from '../product/product.model';
import { IVariant } from '../product/product.interface';
import { clearCart } from '../cart/cart.service';
import { eventBus, Events } from '../../events/eventBus';

export const createOrder = async (userId: string, orderData: Partial<IOrder>) => {
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

    console.log(`[ORDER] New order placed: ${order._id} by user ${userId}`);

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

    const [orders, total] = await Promise.all([
        Order.find(query)
            .populate('user', 'name email')
            .populate('items.product')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Order.countDocuments(query)
    ]);

    return {
        orders,
        total,
        page,
        pages: Math.ceil(total / limit)
    };
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus, note?: string) => {
    const order = await Order.findByIdAndUpdate(
        orderId,
        {
            $set: { orderStatus: status },
            $push: { statusHistory: { status, timestamp: new Date(), note: note || `Order status updated to ${status}` } }
        },
        { new: true }
    );

    // Emit event for notifications
    if (order) {
        (eventBus as any).emit(Events.ORDER_STATUS_UPDATED, { orderId: order._id, newStatus: status });
    }

    return order;
};

export const updatePaymentStatus = async (orderId: string, status: PaymentStatus, paymentId?: string) => {
    return await Order.findByIdAndUpdate(orderId, { paymentStatus: status, paymentId }, { new: true });
};

export const cancelOrderForUser = async (orderId: string, userId: string) => {
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

    order.orderStatus = 'CANCELLED' as OrderStatus;
    order.statusHistory.push({
        status: 'CANCELLED' as OrderStatus,
        timestamp: new Date(),
        note: 'Order cancelled by customer'
    });

    await order.save();

    // Emit event
    (eventBus as any).emit(Events.ORDER_STATUS_UPDATED, { orderId: order._id, newStatus: 'CANCELLED' });

    return order;
};
