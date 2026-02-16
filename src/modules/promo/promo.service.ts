import { Promo, IPromo, PromoType } from './promo.model';
import mongoose from 'mongoose';

export const createPromo = async (data: Partial<IPromo>) => {
    // Validate expiry date
    if (data.expiresAt && new Date(data.expiresAt) <= new Date()) {
        throw { statusCode: 400, message: 'Expiry date must be in the future' };
    }

    // Validate discount value
    if (data.type === PromoType.PERCENTAGE && data.value && (data.value < 0 || data.value > 100)) {
        throw { statusCode: 400, message: 'Percentage discount must be between 0 and 100' };
    }

    const promo = await Promo.create(data);
    return promo;
};

export const validatePromo = async (code: string, userId: string, orderAmount: number, cartItems: any[]) => {
    const promo = await Promo.findOne({
        code: code.toUpperCase(),
        isActive: true,
        expiresAt: { $gt: new Date() }
    });

    if (!promo) {
        throw { statusCode: 404, message: 'Promo code not found or expired' };
    }

    // Check usage limit
    if (promo.usedCount >= promo.usageLimit) {
        throw { statusCode: 400, message: 'Promo code usage limit reached' };
    }

    // Check if user already used this promo
    const userUsage = promo.usedBy.find(u => u.user.toString() === userId);
    if (userUsage) {
        throw { statusCode: 400, message: 'You have already used this promo code' };
    }

    // Check minimum order amount
    if (orderAmount < promo.minOrderAmount) {
        throw {
            statusCode: 400,
            message: `Minimum order amount of ₹${promo.minOrderAmount} required`
        };
    }

    // Calculate discount
    let discount = 0;
    if (promo.type === PromoType.PERCENTAGE) {
        discount = (orderAmount * promo.value) / 100;
        // Apply max discount cap if set
        if (promo.maxDiscount && discount > promo.maxDiscount) {
            discount = promo.maxDiscount;
        }
    } else {
        discount = promo.value;
    }

    // Ensure discount doesn't exceed order amount
    discount = Math.min(discount, orderAmount);

    return {
        code: promo.code,
        type: promo.type,
        value: promo.value,
        discount: Math.round(discount),
        finalAmount: Math.round(orderAmount - discount)
    };
};

export const applyPromo = async (code: string, userId: string, orderAmount: number, discountApplied: number) => {
    const promo = await Promo.findOne({ code: code.toUpperCase() });

    if (!promo) {
        throw { statusCode: 404, message: 'Promo code not found' };
    }

    // Add to used list
    promo.usedBy.push({
        user: new mongoose.Types.ObjectId(userId),
        usedAt: new Date(),
        orderAmount,
        discountApplied
    });

    promo.usedCount += 1;
    await promo.save();

    return promo;
};

export const getAllPromos = async (filters: any = {}, page: number = 1, limit: number = 20) => {
    const query: any = {};

    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.type) query.type = filters.type;

    const skip = (page - 1) * limit;

    const [promos, total] = await Promise.all([
        Promo.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Promo.countDocuments(query)
    ]);

    return {
        promos,
        total,
        page,
        pages: Math.ceil(total / limit)
    };
};

export const updatePromo = async (id: string, data: Partial<IPromo>) => {
    return await Promo.findByIdAndUpdate(id, data, { new: true });
};

export const deletePromo = async (id: string) => {
    return await Promo.findByIdAndDelete(id);
};

export const getPromoAnalytics = async (promoId: string) => {
    const promo = await Promo.findById(promoId);

    if (!promo) {
        throw { statusCode: 404, message: 'Promo not found' };
    }

    const totalRevenue = promo.usedBy.reduce((sum, usage) => sum + usage.orderAmount, 0);
    const totalDiscount = promo.usedBy.reduce((sum, usage) => sum + usage.discountApplied, 0);

    return {
        code: promo.code,
        usedCount: promo.usedCount,
        usageLimit: promo.usageLimit,
        totalRevenue,
        totalDiscount,
        averageOrderValue: promo.usedCount > 0 ? totalRevenue / promo.usedCount : 0,
        usageHistory: promo.usedBy
    };
};
