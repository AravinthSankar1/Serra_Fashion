import { Request, Response } from 'express';
import { StoreSettings } from './settings.model';
import { asyncHandler } from '../../middlewares/error.middleware';
import { ApiResponse } from '../../utils/response';

// GET /api/v1/settings — public, returns current store settings
export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
    let settings = await StoreSettings.findOne();
    if (!settings) {
        // Auto-create defaults on first access
        settings = await StoreSettings.create({});
    }
    res.json(ApiResponse.success(settings));
});

// PUT /api/v1/settings — admin only, update settings
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const { 
        freeShippingThreshold, 
        deliveryCharge, 
        returnWindowDays, 
        returnPolicy, 
        exchangePolicy, 
        contactEmail, 
        contactPhone, 
        storeAddress,
        isCodEnabled,
        isRazorpayEnabled,
        categoryDiscounts,
        quantityDiscounts
    } = req.body;

    let settings = await StoreSettings.findOne();
    if (!settings) {
        settings = await StoreSettings.create({ 
            freeShippingThreshold, 
            deliveryCharge, 
            returnWindowDays, 
            returnPolicy, 
            exchangePolicy, 
            contactEmail, 
            contactPhone, 
            storeAddress,
            isCodEnabled,
            isRazorpayEnabled,
            categoryDiscounts: categoryDiscounts || [],
            quantityDiscounts: quantityDiscounts || []
        });
    } else {
        if (freeShippingThreshold !== undefined) settings.freeShippingThreshold = Number(freeShippingThreshold);
        if (deliveryCharge !== undefined) settings.deliveryCharge = Number(deliveryCharge);
        if (returnWindowDays !== undefined) settings.returnWindowDays = Number(returnWindowDays);
        if (returnPolicy !== undefined) settings.returnPolicy = returnPolicy;
        if (exchangePolicy !== undefined) settings.exchangePolicy = exchangePolicy;
        if (contactEmail !== undefined) settings.contactEmail = contactEmail;
        if (contactPhone !== undefined) settings.contactPhone = contactPhone;
        if (storeAddress !== undefined) settings.storeAddress = storeAddress;
        if (isCodEnabled !== undefined) settings.isCodEnabled = isCodEnabled;
        if (isRazorpayEnabled !== undefined) settings.isRazorpayEnabled = isRazorpayEnabled;
        if (categoryDiscounts !== undefined) settings.categoryDiscounts = categoryDiscounts;
        if (quantityDiscounts !== undefined) settings.quantityDiscounts = quantityDiscounts;
        await settings.save();
    }

    res.json(ApiResponse.success(settings, 'Settings updated successfully'));
});
