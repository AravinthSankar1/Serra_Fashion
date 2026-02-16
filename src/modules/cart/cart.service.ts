import { Cart } from './cart.model';

export const getCart = async (userId: string) => {
    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
    }
    return cart;
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
    return await cart.populate('items.product');
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
    return await cart.populate('items.product');
};

export const clearCart = async (userId: string) => {
    const cart = await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } }, { new: true });
    return cart?.populate('items.product');
};
