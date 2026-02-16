import { User } from './user.model';
import mongoose from 'mongoose';

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
    return user.wishlist;
};

export const updateUserProfile = async (userId: string, updateData: any) => {
    return await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
};
