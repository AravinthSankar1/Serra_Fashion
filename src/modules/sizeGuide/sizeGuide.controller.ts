import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/error.middleware';
import { ApiResponse } from '../../utils/response';
import * as sizeGuideService from './sizeGuide.service';

export const createSizeGuide = asyncHandler(async (req: Request, res: Response) => {
    const sizeGuide = await sizeGuideService.createSizeGuide(req.body);
    res.status(201).json(ApiResponse.success(sizeGuide, 'Size guide created successfully'));
});

export const getAllSizeGuides = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, category } = req.query;
    const filters: any = {};
    if (category) filters.category = category;

    const result = await sizeGuideService.getAllSizeGuides(filters, Number(page) || 1, Number(limit) || 20);
    res.status(200).json(ApiResponse.success(result));
});

export const getSizeGuideDetails = asyncHandler(async (req: Request, res: Response) => {
    const sizeGuide = await sizeGuideService.getSizeGuideById(req.params.id);
    if (!sizeGuide) throw { statusCode: 404, message: 'Size guide not found' };
    res.status(200).json(ApiResponse.success(sizeGuide));
});

export const updateSizeGuide = asyncHandler(async (req: Request, res: Response) => {
    const sizeGuide = await sizeGuideService.updateSizeGuide(req.params.id, req.body);
    res.status(200).json(ApiResponse.success(sizeGuide, 'Size guide updated successfully'));
});

export const deleteSizeGuide = asyncHandler(async (req: Request, res: Response) => {
    await sizeGuideService.deleteSizeGuide(req.params.id);
    res.status(200).json(ApiResponse.success(null, 'Size guide deleted successfully'));
});
