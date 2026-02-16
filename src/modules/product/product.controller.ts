import { Response, Request } from 'express';
import { asyncHandler } from '../../middlewares/error.middleware';
import * as productService from './product.service';
import { ApiResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { User } from '../user/user.model';
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

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const productData = { ...req.body };

    // Parse JSON strings if they come from FormData
    if (productData.variants) productData.variants = parseJson(productData.variants);
    if (productData.images) productData.images = parseJson(productData.images);

    if (req.files && Array.isArray(req.files)) {
        const uploadPromises = (req.files as Express.Multer.File[]).map(file =>
            uploadToCloudinary(file, 'products')
        );
        const uploadedImages = await Promise.all(uploadPromises);
        productData.images = [...(productData.images || []), ...uploadedImages];
    }
    const product = await productService.createProduct(productData);
    res.status(201).json(ApiResponse.success(product, 'Product created successfully'));
});

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...filters } = req.query;
    const result = await productService.getProducts(filters, Number(page) || 1, Number(limit) || 20);
    res.status(200).json(ApiResponse.success(result));
});

export const getProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { idOrSlug } = req.params;
    let product;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
        product = await productService.getProductById(idOrSlug);
    } else {
        product = await productService.getProductBySlug(idOrSlug);
    }

    if (!product) throw { statusCode: 404, message: 'Product not found' };

    // Track recently viewed if user is authenticated
    if (req.user) {
        await User.findByIdAndUpdate(req.user.sub, {
            $pull: { recentlyViewed: product._id }, // Remove if already exists (to move to front)
        });
        await User.findByIdAndUpdate(req.user.sub, {
            $push: {
                recentlyViewed: {
                    $each: [product._id],
                    $position: 0,
                    $slice: 10 // Keep only last 10
                }
            }
        });
    }

    res.status(200).json(ApiResponse.success(product));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;
    const existingProduct = await productService.getProductById(productId);
    if (!existingProduct) throw { statusCode: 404, message: 'Product not found' };

    const productData = { ...req.body };

    // Parse JSON strings if they come from FormData
    if (productData.variants) productData.variants = parseJson(productData.variants);
    if (productData.images) productData.images = parseJson(productData.images);

    // Sanitize productData
    const sanitizedData = { ...productData };
    delete sanitizedData._id;
    delete sanitizedData.id;
    delete sanitizedData.createdAt;
    delete sanitizedData.updatedAt;

    // Initial images from request
    let currentImages = Array.isArray(productData.images) ? productData.images : existingProduct.images;

    // Handle new file uploads
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const uploadPromises = (req.files as Express.Multer.File[]).map(file =>
            uploadToCloudinary(file, 'products')
        );
        const uploadedImages = (await Promise.all(uploadPromises)) as { imageUrl: string; imagePublicId: string }[];
        currentImages = [...currentImages, ...uploadedImages];
    }

    // Determine which images were deleted
    const newPublicIds = new Set(currentImages.map((img: any) => img.imagePublicId));
    const deletedImages = existingProduct.images.filter(img => !newPublicIds.has(img.imagePublicId));

    // Delete removed images from Cloudinary
    for (const img of deletedImages) {
        if (img.imagePublicId) {
            await deleteFromCloudinary(img.imagePublicId);
        }
    }

    sanitizedData.images = currentImages;
    const product = await productService.updateProduct(productId, sanitizedData);
    res.status(200).json(ApiResponse.success(product, 'Product updated successfully'));
});

export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    if (!product) throw { statusCode: 404, message: 'Product not found' };

    const related = await productService.getRelated(product.id, (product.category as any)._id || product.category, (product.brand as any)._id || product.brand);
    res.status(200).json(ApiResponse.success(related));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getProductById(req.params.id);
    if (!product) throw { statusCode: 404, message: 'Product not found' };

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
        for (const img of product.images) {
            if (img.imagePublicId) {
                await deleteFromCloudinary(img.imagePublicId);
            }
        }
    }

    await productService.deleteProduct(req.params.id);
    res.status(200).json(ApiResponse.success(null, 'Product deleted successfully'));
});
