import { Cart } from './cart.model';
import { Product } from '../product/product.model';
import { validatePromo } from '../promo/promo.service';
import mongoose from 'mongoose';

export const calculateCartTotals = async (cartItems: any[], userId: string, isVip: boolean = false, appliedPromo?: string) => {
    let subtotal = 0;
    let totalDiscount = 0;
    
    for (const item of cartItems) {
        if (item.product && item.product.finalPrice) {
            const applicablePrice = (isVip && item.product.vipPrice) ? item.product.vipPrice : item.product.finalPrice;
            const itemTotal = applicablePrice * item.quantity;
            subtotal += item.product.basePrice * item.quantity;
            totalDiscount += (item.product.basePrice - applicablePrice) * item.quantity;
        }
    }

    let finalTotal = subtotal - totalDiscount;
    let promoDiscount = 0;

    if (appliedPromo) {
        try {
            const promoResult = await validatePromo(appliedPromo, userId, finalTotal, cartItems);
            promoDiscount = promoResult.discount;
            finalTotal = promoResult.finalAmount;
        } catch (error) {
            // If promo validation fails, ignore it here, or throw it. Assuming ignore to let cart load.
        }
    }

    return { subtotal, totalDiscount, promoDiscount, finalTotal };
};

export const getCart = async (userId: string, isVip: boolean = false) => {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
        return { cart, totals: { subtotal: 0, totalDiscount: 0, promoDiscount: 0, finalTotal: 0 } };
    }
    const totals = await calculateCartTotals(cart.items, userId, isVip, cart.appliedPromo);
    return { cart, totals };
};

export const addItemToCart = async (userId: string, item: any, isVip: boolean = false) => {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = await Cart.create({ user: userId, items: [item] });
    } else {
        const existingItemIndex = cart.items.findIndex(
            (i: any) =>
                i.product.toString() === item.product &&
                i.size === item.size &&
                i.color === item.color
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += item.quantity;
        } else {
            cart.items.push(item);
        }
        await cart.save();
    }
    const populatedCart = await cart.populate('items.product');
    const totals = await calculateCartTotals(populatedCart.items, userId, isVip, cart.appliedPromo);
    return { cart: populatedCart, totals };
};

export const updateCartItem = async (userId: string, productId: string, quantity: number, isVip: boolean = false, size?: string, color?: string) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new Error('Cart not found');

    const itemIndex = cart.items.findIndex(
        (i: any) =>
            i.product.toString() === productId &&
            (size !== undefined ? i.size === size : true) &&
            (color !== undefined ? i.color === color : true)
    );

    if (itemIndex > -1) {
        if (quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = quantity;
        }
        await cart.save();
    }
    const populatedCart = await cart.populate('items.product');
    const totals = await calculateCartTotals(populatedCart.items, userId, isVip, cart.appliedPromo);
    return { cart: populatedCart, totals };
};

export const clearCart = async (userId: string) => {
    const cart = await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [], appliedPromo: null } }, { new: true });
    return { cart: await cart?.populate('items.product'), totals: { subtotal: 0, totalDiscount: 0, promoDiscount: 0, finalTotal: 0 } };
};

export const applyPromoToCart = async (userId: string, promoCode: string, isVip: boolean = false) => {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) throw new Error('Cart not found');
    
    // Test if promo is valid before saving it to cart
    const populatedCart = await cart.populate('items.product');
    const tempTotals = await calculateCartTotals(populatedCart.items, userId, isVip);
    
    const promoResult = await validatePromo(promoCode, userId, tempTotals.finalTotal, populatedCart.items);

    cart.appliedPromo = promoResult.code;
    await cart.save();

    const finalTotals = await calculateCartTotals(populatedCart.items, userId, isVip, cart.appliedPromo);

    return { cart: populatedCart, totals: finalTotals };
};

export const removePromoFromCart = async (userId: string, isVip: boolean = false) => {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) throw new Error('Cart not found');
    
    cart.appliedPromo = undefined;
    await cart.save();

    const populatedCart = await cart.populate('items.product');
    const totals = await calculateCartTotals(populatedCart.items, userId, isVip);

    return { cart: populatedCart, totals };
};
