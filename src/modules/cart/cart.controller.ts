import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as cartService from './cart.service';
import { ApiResponse } from '../../utils/response';
import { asyncHandler } from '../../middlewares/error.middleware';
import { User } from '../user/user.model';

export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.sub);
    const isVip = user?.isVip || false;
    const cart = await cartService.getCart(req.user!.sub, isVip);
    res.status(200).json(ApiResponse.success(cart));
});

export const addItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.sub);
    const isVip = user?.isVip || false;
    const cart = await cartService.addItemToCart(req.user!.sub, req.body, isVip);
    res.status(200).json(ApiResponse.success(cart, 'Item added to cart'));
});

export const updateItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.sub);
    const isVip = user?.isVip || false;
    const { productId, quantity, size, color } = req.body;
    const cart = await cartService.updateCartItem(req.user!.sub, productId, quantity, isVip, size, color);
    res.status(200).json(ApiResponse.success(cart, 'Cart updated'));
});

export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await cartService.clearCart(req.user!.sub);
    res.status(200).json(ApiResponse.success(cart, 'Cart cleared'));
});

export const applyPromo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.sub);
    const isVip = user?.isVip || false;
    const { promoCode } = req.body;
    
    if (!promoCode) throw { statusCode: 400, message: 'Promo code is required' };

    const cart = await cartService.applyPromoToCart(req.user!.sub, promoCode, isVip);
    res.status(200).json(ApiResponse.success(cart, `Promo code ${promoCode} applied successfully`));
});

export const removePromo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.sub);
    const isVip = user?.isVip || false;

    const cart = await cartService.removePromoFromCart(req.user!.sub, isVip);
    res.status(200).json(ApiResponse.success(cart, 'Promo code removed successfully'));
});
