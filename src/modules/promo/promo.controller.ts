import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../middlewares/error.middleware';
import { ApiResponse } from '../../utils/response';
import * as promoService from './promo.service';

// Admin: Create promo
export const createPromo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const promo = await promoService.createPromo(req.body);
    res.status(201).json(ApiResponse.success(promo, 'Promo code created successfully'));
});

// Customer: Validate promo
export const validatePromo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { code, orderAmount, cartItems } = req.body;

    if (!code || !orderAmount) {
        throw { statusCode: 400, message: 'Code and order amount are required' };
    }

    const result = await promoService.validatePromo(
        code,
        req.user!.sub,
        orderAmount,
        cartItems || []
    );

    res.status(200).json(ApiResponse.success(result, 'Promo code is valid'));
});

// Admin: Get all promos
export const getAllPromos = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page, limit, isActive, type } = req.query;

    const filters = { isActive, type };
    const result = await promoService.getAllPromos(filters, Number(page) || 1, Number(limit) || 20);

    res.status(200).json(ApiResponse.success(result));
});

// Admin: Update promo
export const updatePromo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const promo = await promoService.updatePromo(req.params.id, req.body);
    res.status(200).json(ApiResponse.success(promo, 'Promo code updated successfully'));
});

// Admin: Delete promo
export const deletePromo = asyncHandler(async (req: AuthRequest, res: Response) => {
    await promoService.deletePromo(req.params.id);
    res.status(200).json(ApiResponse.success(null, 'Promo code deleted successfully'));
});

// Admin: Get promo analytics
export const getPromoAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const analytics = await promoService.getPromoAnalytics(req.params.id);
    res.status(200).json(ApiResponse.success(analytics));
});
