import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/error.middleware';
import { ApiResponse } from '../../utils/response';
import * as bannerService from './banner.service';

export const getBanners = asyncHandler(async (req: Request, res: Response) => {
    const banners = await bannerService.getActiveBanners();
    res.status(200).json(ApiResponse.success(banners));
});

export const getAdminBanners = asyncHandler(async (req: Request, res: Response) => {
    const banners = await bannerService.getAllBanners();
    res.status(200).json(ApiResponse.success(banners));
});

export const createBanner = asyncHandler(async (req: Request, res: Response) => {
    const banner = await bannerService.createBanner(req.body);
    res.status(201).json(ApiResponse.success(banner, 'Banner created successfully'));
});

export const updateBanner = asyncHandler(async (req: Request, res: Response) => {
    const banner = await bannerService.updateBanner(req.params.id, req.body);
    if (!banner) throw { statusCode: 404, message: 'Banner not found' };
    res.status(200).json(ApiResponse.success(banner, 'Banner updated successfully'));
});

export const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
    const banner = await bannerService.deleteBanner(req.params.id);
    if (!banner) throw { statusCode: 404, message: 'Banner not found' };
    res.status(200).json(ApiResponse.success(null, 'Banner deleted successfully'));
});
