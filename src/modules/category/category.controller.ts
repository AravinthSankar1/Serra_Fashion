import { Request, Response } from 'express';
import { Category } from './category.model';
import { ApiResponse } from '../../utils/response';
import slugify from 'slugify';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, gender, isActive } = req.body;
        const slug = slugify(name, { lower: true, strict: true });

        let categoryImage = { imageUrl: '', imagePublicId: '' };
        if (req.file) {
            categoryImage = (await uploadToCloudinary(req.file, 'categories')) as { imageUrl: string; imagePublicId: string };
        }

        const category = await Category.create({
            name,
            slug,
            gender,
            isActive: isActive === 'false' ? false : true,
            image: categoryImage
        });
        return res.status(201).json(ApiResponse.success(category, 'Category created successfully', 201));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message || 'Failed to create category'));
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        return res.status(200).json(ApiResponse.success(categories));
    } catch (error: any) {
        return res.status(400).json(ApiResponse.error(error.message));
    }
};

export const updateCategory = async (req: Request, res: Response) => {
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

export const deleteCategory = async (req: Request, res: Response) => {
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
