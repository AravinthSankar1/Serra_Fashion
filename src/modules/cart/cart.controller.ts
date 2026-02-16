import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as cartService from './cart.service';
import { ApiResponse } from '../../utils/response';
import { asyncHandler } from '../../middlewares/error.middleware';

export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await cartService.getCart(req.user!.sub);
    res.status(200).json(ApiResponse.success(cart));
});

export const addItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await cartService.addItemToCart(req.user!.sub, req.body);
    res.status(200).json(ApiResponse.success(cart, 'Item added to cart'));
});

export const updateItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, quantity, size, color } = req.body;
    const cart = await cartService.updateCartItem(req.user!.sub, productId, quantity, size, color);
    res.status(200).json(ApiResponse.success(cart, 'Cart updated'));
});

export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await cartService.clearCart(req.user!.sub);
    res.status(200).json(ApiResponse.success(cart, 'Cart cleared'));
});
