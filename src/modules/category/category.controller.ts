import { Request, Response } from 'express';
import { Category } from './category.model';
import { ApiResponse } from '../../utils/response';
import slugify from 'slugify';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';
import { sendVendorSubmissionAlert } from '../../utils/notification';

export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { name, gender, isActive } = req.body;
        const user = req.user;
        const slug = slugify(name, { lower: true, strict: true });

        let categoryImage = { imageUrl: '', imagePublicId: '' };
        if (req.file) {
            categoryImage = (await uploadToCloudinary(req.file, 'categories')) as { imageUrl: string; imagePublicId: string };
        }

        const categoryData: any = {
            name,
            slug,
            gender,
            isActive: isActive === 'false' ? false : true,
            image: categoryImage,
            createdBy: user?.sub
        };

        // Vendor Logic: Set PENDING
        if (user?.role === UserRole.VENDOR) {
            categoryData.approvalStatus = 'PENDING';
            categoryData.isActive = false;
        } else {
            // Admin Creations: Auto-approve and activate
            categoryData.approvalStatus = 'APPROVED';
            categoryData.isActive = true;
        }

        const category = await Category.create(categoryData);

        // Notify Admin
        if (user?.role === UserRole.VENDOR) {
            await sendVendorSubmissionAlert('email', 'category', category.name, user.name || 'Vendor');
        }

        return res.status(201).json(ApiResponse.success(category, 'Category created successfully', 201));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message || 'Failed to create category'));
    }
};

export const approveCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndUpdate(id, {
            approvalStatus: 'APPROVED',
            isActive: true
        }, { new: true });
        return res.status(200).json(ApiResponse.success(category, 'Category approved'));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const rejectCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const category = await Category.findByIdAndUpdate(id, {
            approvalStatus: 'REJECTED',
            isActive: false,
            rejectionReason: reason
        }, { new: true });
        return res.status(200).json(ApiResponse.success(category, 'Category rejected'));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const query: any = {};

        // Vendor Isolation & Public Filtering
        if (user?.role === UserRole.VENDOR) {
            query.createdBy = user.sub;
        } else if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) {
            // Admin sees all
        } else {
            // Public/Guest: Only see approved categories
            query.approvalStatus = 'APPROVED';
            query.isActive = true;
        }

        const categories = await Category.find(query).sort({ createdAt: -1 });
        return res.status(200).json(ApiResponse.success(categories));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, gender, isActive } = req.body;

        const category = await Category.findById(id);
        if (!category) return res.status(404).json(ApiResponse.error('Category not found', 404));

        let categoryImage = category.image;
        if (req.file) {
            // Delete old image if exists
            if (category.image?.imagePublicId) {
                await deleteFromCloudinary(category.image.imagePublicId);
            }
            categoryImage = (await uploadToCloudinary(req.file, 'categories')) as { imageUrl: string; imagePublicId: string };
        }

        const updateData: any = {
            name,
            gender,
            isActive: isActive === 'false' ? false : true,
            image: categoryImage
        };
        if (name) {
            updateData.slug = slugify(name, { lower: true, strict: true });
        }

        const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
        return res.status(200).json(ApiResponse.success(updatedCategory, 'Category updated successfully'));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);
        if (!category) return res.status(404).json(ApiResponse.error('Category not found', 404));

        // Delete image from Cloudinary
        if (category.image?.imagePublicId) {
            await deleteFromCloudinary(category.image.imagePublicId);
        }

        await Category.findByIdAndDelete(id);
        return res.status(200).json(ApiResponse.success(null, 'Category deleted successfully'));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};
