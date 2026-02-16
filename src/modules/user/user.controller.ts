import { Request, Response } from 'express';
import { User } from './user.model';
import * as userService from './user.service';
import { ApiResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../middlewares/error.middleware';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';

const parseField = (val: any) => {
    if (typeof val !== 'string') return val;

    const trimmed = val.trim();

    // Handle empty values safely
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
        return undefined;
    }

    // Handle JSON (array or object)
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
            return JSON.parse(trimmed);
        } catch {
            throw new Error('Invalid JSON format');
        }
    }

    // Normal string
    return trimmed;
};


export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user?.sub).select('-password');
        if (!user) return res.status(404).json(ApiResponse.error('User not found'));

        return res.status(200).json(ApiResponse.success(user));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error(error.message));
    }
};

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.sub;
    const updateData: any = {};

    // Get current user to handle image deletion
    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json(ApiResponse.error('User not found'));

    // Fields to parse if they come as strings from FormData
    const fields = ['name', 'phoneNumber', 'address'];
    fields.forEach(field => {
        if (req.body[field] !== undefined) {
            const parsed = field === 'address'
                ? parseField(req.body[field])
                : req.body[field];

            if (parsed !== undefined) {
                updateData[field] = parsed;
            }
        }
    });

    // If file was uploaded
    if (req.file) {
        // Delete old profile picture if exists
        if (currentUser.profilePicture?.imagePublicId) {
            await deleteFromCloudinary(currentUser.profilePicture.imagePublicId);
        }
        updateData.profilePicture = (await uploadToCloudinary(req.file, 'users')) as { imageUrl: string; imagePublicId: string };
    }

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json(ApiResponse.error('User not found'));

        return res.status(200).json(ApiResponse.success(user, 'Profile updated successfully'));
    } catch (error: any) {
        console.error('Error in updateProfile:', error);
        return res.status(400).json(ApiResponse.error(error.message));
    }
});

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        return res.status(200).json(ApiResponse.success(users));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error(error.message));
    }
};

export const updateAnyUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        delete updates._id;
        delete updates.id;
        delete updates.password; // Don't allow password update through this route

        if (updates.address) {
            updates.address = parseField(updates.address);
        }

        const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).select('-password');
        if (!user) return res.status(404).json(ApiResponse.error('User not found'));

        return res.status(200).json(ApiResponse.success(user, 'User updated successfully'));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json(ApiResponse.error('User not found'));

        // Delete profile picture from Cloudinary
        if (user.profilePicture?.imagePublicId) {
            await deleteFromCloudinary(user.profilePicture.imagePublicId);
        }

        await User.findByIdAndDelete(id);
        return res.status(200).json(ApiResponse.success(null, 'User deleted successfully'));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error(error.message));
    }
};

export const handleToggleWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await userService.toggleWishlist(req.user!.sub, req.params.productId);
    res.status(200).json(ApiResponse.success(wishlist, 'Wishlist updated'));
});

export const getUserWishlist = asyncHandler(async (req: AuthRequest, res: Response) => {
    const wishlist = await userService.getWishlist(req.user!.sub);
    res.status(200).json(ApiResponse.success(wishlist));
});

export const addAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.sub;
    const { street, city, state, zip, country, isDefault } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json(ApiResponse.error('User not found'));

    if (!user.address) {
        user.address = [];
    }

    if (isDefault) {
        user.address.forEach((addr: any) => addr.isDefault = false);
    }

    user.address.push({ street, city, state, zip, country, isDefault } as any);
    await user.save();

    res.status(200).json(ApiResponse.success(user.address, 'Address added successfully'));
});

export const removeAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.sub;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json(ApiResponse.error('User not found'));

    if (user.address) {
        user.address = user.address.filter((addr: any) => addr._id.toString() !== addressId);
        await user.save();
    }

    res.status(200).json(ApiResponse.success(user.address || [], 'Address removed successfully'));
});

export const setDefaultAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.sub;
    const { addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json(ApiResponse.error('User not found'));

    if (user.address) {
        user.address.forEach((addr: any) => {
            addr.isDefault = addr._id.toString() === addressId;
        });
        await user.save();
    }

    res.status(200).json(ApiResponse.success(user.address || [], 'Default address updated'));
});

export const updateShippingAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.sub;
    const { firstName, lastName, phone, street, city, state, zipCode, country } = req.body;

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                defaultShippingAddress: {
                    firstName,
                    lastName,
                    phone,
                    street,
                    city,
                    state,
                    zipCode,
                    country
                }
            }
        },
        { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json(ApiResponse.error('User not found'));

    res.status(200).json(ApiResponse.success(user.defaultShippingAddress, 'Shipping address saved'));
});

export const updateCurrencyPreference = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.sub;
    const { currency, country } = req.body;

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                preferredCurrency: currency,
                country: country
            }
        },
        { new: true }
    ).select('-password');

    if (!user) return res.status(404).json(ApiResponse.error('User not found'));

    res.status(200).json(ApiResponse.success({ preferredCurrency: user.preferredCurrency, country: user.country }));
});
