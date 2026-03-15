import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/error.middleware';
import { ApiResponse } from '../../utils/response';
import * as bannerService from './banner.service';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';

const parseJson = (val: any) => {
    if (typeof val === 'string') {
        try {
            return JSON.parse(val);
        } catch (e) {
            return val;
        }
    }
    return val;
};

export const getBanners = asyncHandler(async (req: Request, res: Response) => {
    const banners = await bannerService.getActiveBanners();
    res.status(200).json(ApiResponse.success(banners));
});

export const getAdminBanners = asyncHandler(async (req: Request, res: Response) => {
    const banners = await bannerService.getAllBanners();
    res.status(200).json(ApiResponse.success(banners));
});

export const createBanner = asyncHandler(async (req: Request, res: Response) => {
    const payload = { ...req.body };
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (files && files.image && files.image[0]) {
        payload.image = await uploadToCloudinary(files.image[0], 'banners');
    } else if (payload.image) {
        payload.image = parseJson(payload.image);
    }
    
    if (files && files.mobileImage && files.mobileImage[0]) {
        payload.mobileImage = await uploadToCloudinary(files.mobileImage[0], 'banners');
    } else if (payload.mobileImage) {
        payload.mobileImage = parseJson(payload.mobileImage);
    }

    const banner = await bannerService.createBanner(payload);
    res.status(201).json(ApiResponse.success(banner, 'Banner created successfully'));
});

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
    const existingBanner = await bannerService.getBannerById(req.params.id);
    if (!existingBanner) throw { statusCode: 404, message: 'Banner not found' };

    const payload = { ...req.body };
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (payload.image) payload.image = parseJson(payload.image);
    if (payload.mobileImage) payload.mobileImage = parseJson(payload.mobileImage);

    // Desktop Image update
    if (files && files.image && files.image[0]) {
        if (existingBanner.image?.imagePublicId) {
            await deleteFromCloudinary(existingBanner.image.imagePublicId);
        }
        payload.image = await uploadToCloudinary(files.image[0], 'banners');
    }

    // Mobile Image update
    if (files && files.mobileImage && files.mobileImage[0]) {
        if (existingBanner.mobileImage?.imagePublicId) {
            await deleteFromCloudinary(existingBanner.mobileImage.imagePublicId);
        }
        payload.mobileImage = await uploadToCloudinary(files.mobileImage[0], 'banners');
    }

    const banner = await bannerService.updateBanner(req.params.id, payload);
    res.status(200).json(ApiResponse.success(banner, 'Banner updated successfully'));
});

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
    const banner = await bannerService.getBannerById(req.params.id);
    if (!banner) throw { statusCode: 404, message: 'Banner not found' };

    if (banner.image?.imagePublicId) {
        await deleteFromCloudinary(banner.image.imagePublicId);
    }
    if (banner.mobileImage?.imagePublicId) {
        await deleteFromCloudinary(banner.mobileImage.imagePublicId);
    }

    await bannerService.deleteBanner(req.params.id);
    res.status(200).json(ApiResponse.success(null, 'Banner deleted successfully'));
});
