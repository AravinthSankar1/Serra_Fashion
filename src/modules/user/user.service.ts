import { User } from './user.model';
import mongoose from 'mongoose';
import { StoreSettings } from '../settings/settings.model';
import { applyDiscountsToProducts } from '../../utils/productUtils';

export const toggleWishlist = async (userId: string, productId: string) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const wishlist = user.wishlist ?? [];

    const isLiked = wishlist.some(
        id => id.toString() === productId
    );

    if (isLiked) {
        await User.findByIdAndUpdate(userId, { $pull: { wishlist: productId } });
    } else {
        await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: productId } });
    }

    const updatedUser = await User.findById(userId);
    return updatedUser?.wishlist;
};

export const getWishlist = async (userId: string) => {
    const user = await User.findById(userId).populate('wishlist');
    if (!user) throw new Error('User not found');

    // Filter out products that no longer exist (populate returns null for them)
    const validProducts = user.wishlist.filter((item: any) => item !== null);

    // If some products were missing, sync the user's wishlist array in the DB
    if (validProducts.length !== user.wishlist.length) {
        await User.findByIdAndUpdate(userId, {
            $set: { wishlist: validProducts.map((p: any) => p._id) }
        });
    }

    const settings = await StoreSettings.findOne().lean();
    return applyDiscountsToProducts(validProducts, settings?.categoryDiscounts || []);
};

export const updateUserProfile = async (userId: string, updateData: any) => {
    return await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
};

export const addToRecentlyViewed = async (userId: string, productId: string) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Keep only the last 10 items
    let recentlyViewed = user.recentlyViewed ?? [];
    recentlyViewed = recentlyViewed.filter(id => id.toString() !== productId);
    recentlyViewed.unshift(new mongoose.Types.ObjectId(productId) as any);
    recentlyViewed = recentlyViewed.slice(0, 10);

    return await User.findByIdAndUpdate(userId, { $set: { recentlyViewed } });
};

export const getRecentlyViewed = async (userId: string) => {
    const user = await User.findById(userId).populate('recentlyViewed');
    if (!user) throw new Error('User not found');

    const validProducts = user.recentlyViewed.filter((item: any) => item !== null);
    
    // In order of newest to oldest
    const settings = await StoreSettings.findOne().lean();
    return applyDiscountsToProducts(validProducts, settings?.categoryDiscounts || []);
};
