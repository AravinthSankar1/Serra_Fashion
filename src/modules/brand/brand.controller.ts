import { Request, Response } from 'express';
import { Brand } from './brand.model';
import { ApiResponse } from '../../utils/response';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';

export const createBrand = async (req: Request, res: Response) => {
    try {
        const { name, isActive } = req.body;

        let brandLogo = { imageUrl: '', imagePublicId: '' };
        if (req.file) {
            brandLogo = (await uploadToCloudinary(req.file, 'brands')) as { imageUrl: string; imagePublicId: string };
        }

        const brand = await Brand.create({ name, logo: brandLogo, isActive: isActive === 'false' ? false : true });
        return res.status(201).json(ApiResponse.success(brand, 'Brand created successfully', 201));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const getBrands = async (req: Request, res: Response) => {
    try {
        const brands = await Brand.find().sort({ createdAt: -1 });
        return res.status(200).json(ApiResponse.success(brands));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const updateBrand = async (req: Request, res: Response) => {
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

export const deleteBrand = async (req: Request, res: Response) => {
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
