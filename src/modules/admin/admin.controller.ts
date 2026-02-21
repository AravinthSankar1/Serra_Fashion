import { Response } from 'express';
import { ApiResponse } from '../../utils/response';
import * as adminService from './admin.service';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const vendorId = req.user.role === UserRole.VENDOR ? req.user.sub : undefined;
        const stats = await adminService.getDashboardStats(vendorId);
        return res.status(200).json(ApiResponse.success(stats));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error(error.message));
    }
};

export const globalSearch = async (req: AuthRequest, res: Response) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(200).json(ApiResponse.success({ products: [], orders: [], users: [] }));
        }

        const vendorId = req.user.role === UserRole.VENDOR ? req.user.sub : undefined;
        const results = await adminService.globalSearch(q.toString(), vendorId);
        return res.status(200).json(ApiResponse.success(results));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error(error.message));
    }
};

export const uploadFile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json(ApiResponse.error('No file uploaded'));
        }

        const result = (await uploadToCloudinary(req.file, 'admin_uploads')) as { imageUrl: string; imagePublicId: string };
        return res.status(200).json(ApiResponse.success(result, 'File uploaded successfully'));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error(error.message || 'File upload failed'));
    }
};
