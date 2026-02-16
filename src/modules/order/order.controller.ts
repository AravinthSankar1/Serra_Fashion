import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as orderService from './order.service';
import { ApiResponse } from '../../utils/response';
import { asyncHandler } from '../../middlewares/error.middleware';
import { OrderStatus } from './order.model';
import { generateInvoicePDF } from './invoice.service';

export const placeOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await orderService.createOrder(req.user!.sub, req.body);
    res.status(201).json(ApiResponse.success(order, 'Order placed successfully'));
});

export const getMyOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orders = await orderService.getUserOrders(req.user!.sub);
    res.status(200).json(ApiResponse.success(orders));
});

export const getOrderDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await orderService.getOrderById(req.params.id, req.user!.sub);
    if (!order) throw { statusCode: 404, message: 'Order not found' };
    res.status(200).json(ApiResponse.success(order));
});

// Admin Controllers
export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, status, paymentStatus, userId } = req.query;

    const filters = {
        status,
        paymentStatus,
        userId
    };

    const result = await orderService.getAllOrders(filters, Number(page) || 1, Number(limit) || 20);
    res.status(200).json(ApiResponse.success(result));
});

export const updateOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, note } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status as OrderStatus, note);
    res.status(200).json(ApiResponse.success(order, 'Order status updated'));
});

import * as promoService from '../promo/promo.service';

export const validateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { code, orderAmount, cartItems } = req.body;
    const result = await promoService.validatePromo(code, req.user!.sub, orderAmount, cartItems || []);
    res.status(200).json(ApiResponse.success(result, 'Coupon applied successfully'));
});

export const downloadInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await orderService.getOrderById(req.params.id, req.user!.sub);
    if (!order) throw { statusCode: 404, message: 'Order not found' };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);

    generateInvoicePDF(order as any, res);
});
