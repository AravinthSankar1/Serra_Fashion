import { Request, Response } from 'express';
import { Navigation } from './navigation.model';
import { asyncHandler } from '../../middlewares/error.middleware';
import { ApiResponse } from '../../utils/response';

export const getNavigation = asyncHandler(async (req: Request, res: Response) => {
    const navItems = await Navigation.find({ isActive: true }).sort({ order: 1 });
    
    // Auto-generate paths for CATEGORY and GENDER types
    const formattedNav = navItems.map(item => {
        const doc = item.toObject();
        if (doc.type === 'CATEGORY' && doc.categoryId) {
            doc.path = `/search?category=${doc.categoryId}`;
        } else if (doc.type === 'GENDER' && doc.gender) {
            doc.path = `/${doc.gender.toLowerCase()}`;
        }
        return doc;
    });

    res.status(200).json(ApiResponse.success(formattedNav, 'Navigation items fetched successfully'));
});

export const getAllNavigation = asyncHandler(async (req: Request, res: Response) => {
    const navItems = await Navigation.find().sort({ order: 1 });
    res.status(200).json(ApiResponse.success(navItems, 'All navigation items fetched successfully'));
});

export const createNavigation = asyncHandler(async (req: Request, res: Response) => {
    const navItem = await Navigation.create(req.body);
    res.status(201).json(ApiResponse.success(navItem, 'Navigation item created successfully'));
});

export const updateNavigation = asyncHandler(async (req: Request, res: Response) => {
    const navItem = await Navigation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!navItem) throw { statusCode: 404, message: 'Navigation item not found' };
    res.status(200).json(ApiResponse.success(navItem, 'Navigation item updated successfully'));
});

export const deleteNavigation = asyncHandler(async (req: Request, res: Response) => {
    const navItem = await Navigation.findByIdAndDelete(req.params.id);
    if (!navItem) throw { statusCode: 404, message: 'Navigation item not found' };
    res.status(200).json(ApiResponse.success(null, 'Navigation item deleted successfully'));
});
