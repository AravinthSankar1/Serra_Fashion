import { Cart } from './cart.model';
import { StoreSettings } from '../settings/settings.model';
import { applyDiscountsToProduct } from '../../utils/productUtils';

const populateCartWithDiscounts = async (cart: any) => {
    if (!cart) return null;
    
    const populatedCart = await cart.populate('items.product');
    const settings = await StoreSettings.findOne().lean();
    const categoryDiscounts = settings?.categoryDiscounts || [];
    
    const cartObj = populatedCart.toObject();
    if (cartObj.items && cartObj.items.length > 0) {
        cartObj.items = cartObj.items.map((item: any) => ({
            ...item,
            product: applyDiscountsToProduct(item.product, categoryDiscounts)
        }));
    }
    return cartObj;
};

export const getCart = async (userId: string) => {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
    }
    return await populateCartWithDiscounts(cart);
};

export const addItemToCart = async (userId: string, item: any) => {
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
    return await populateCartWithDiscounts(cart);
};

export const updateCartItem = async (userId: string, productId: string, quantity: number, size?: string, color?: string) => {
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
    return await populateCartWithDiscounts(cart);
};

export const clearCart = async (userId: string) => {
    const cart = await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } }, { new: true });
    return await populateCartWithDiscounts(cart);
};
