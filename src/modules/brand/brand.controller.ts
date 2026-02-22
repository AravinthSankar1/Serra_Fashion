import { Request, Response } from 'express';
import { Brand } from './brand.model';
import { ApiResponse } from '../../utils/response';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';
import { sendVendorSubmissionAlert } from '../../utils/notification';

export const createBrand = async (req: AuthRequest, res: Response) => {
    try {
        const { name, isActive } = req.body;
        const user = req.user;

        let brandLogo = { imageUrl: '', imagePublicId: '' };
        if (req.file) {
            brandLogo = (await uploadToCloudinary(req.file, 'brands')) as { imageUrl: string; imagePublicId: string };
        }

        const brandData: any = {
            name,
            logo: brandLogo,
            isActive: isActive === 'false' ? false : true,
            createdBy: user?.sub
        };

        // Vendor Logic: Set PENDING
        if (user?.role === UserRole.VENDOR) {
            brandData.approvalStatus = 'PENDING';
            brandData.isActive = false;
        } else {
            // Admin Creations: Auto-approve and activate
            brandData.approvalStatus = 'APPROVED';
            brandData.isActive = true;
        }

        const brand = await Brand.create(brandData);

        // Notify Admin
        if (user?.role === UserRole.VENDOR) {
            await sendVendorSubmissionAlert('email', 'brand', brand.name, user.name || 'Vendor');
        }

        return res.status(201).json(ApiResponse.success(brand, 'Brand created successfully', 201));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const approveBrand = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const brand = await Brand.findByIdAndUpdate(id, {
            approvalStatus: 'APPROVED',
            isActive: true
        }, { new: true });
        return res.status(200).json(ApiResponse.success(brand, 'Brand approved'));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const rejectBrand = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const brand = await Brand.findByIdAndUpdate(id, {
            approvalStatus: 'REJECTED',
            isActive: false,
            rejectionReason: reason
        }, { new: true });
        return res.status(200).json(ApiResponse.success(brand, 'Brand rejected'));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const getBrands = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const query: any = {};

        // Vendor Isolation & Public Filtering
        if (user?.role === UserRole.VENDOR) {
            query.createdBy = user.sub;
        } else if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) {
            // Admin sees all
        } else {
            // Public/Guest: Only see approved brands
            query.approvalStatus = 'APPROVED';
            query.isActive = true;
        }

        const brands = await Brand.find(query).sort({ createdAt: -1 });
        return res.status(200).json(ApiResponse.success(brands));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const updateBrand = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;

        const brand = await Brand.findById(id);
        if (!brand) return res.status(404).json(ApiResponse.error('Brand not found', 404));

        let brandLogo = brand.logo;
        if (req.file) {
            // Delete old logo if exists
            if (brand.logo?.imagePublicId) {
                await deleteFromCloudinary(brand.logo.imagePublicId);
            }
            brandLogo = (await uploadToCloudinary(req.file, 'brands')) as { imageUrl: string; imagePublicId: string };
        }

        const updatedBrand = await Brand.findByIdAndUpdate(
            id,
            { name, logo: brandLogo, isActive: isActive === 'false' ? false : true },
            { new: true }
        );
        return res.status(200).json(ApiResponse.success(updatedBrand, 'Brand updated successfully'));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const deleteBrand = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const brand = await Brand.findById(id);
        if (!brand) return res.status(404).json(ApiResponse.error('Brand not found', 404));

        // Delete logo from Cloudinary
        if (brand.logo?.imagePublicId) {
            await deleteFromCloudinary(brand.logo.imagePublicId);
        }

        await Brand.findByIdAndDelete(id);
        return res.status(200).json(ApiResponse.success(null, 'Brand deleted successfully'));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};
