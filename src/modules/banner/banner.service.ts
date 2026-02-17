import { Banner, IBanner } from './banner.model';
import { Category } from '../category/category.model';

export const getActiveBanners = async () => {
    // Get dedicated banners
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();

    // Get active categories with images (to use as banners)
    const categories = await Category.find({
        isActive: true,
        'image.imageUrl': { $exists: true, $ne: '' }
    }).sort({ createdAt: -1 }).lean();

    // Transform category images into banner format
    const categoryBanners = categories.map((cat: any, index: number) => ({
        _id: cat._id,
        title: cat.name,
        description: `Explore our ${cat.name} collection`,
        image: {
            imageUrl: cat.image.imageUrl,
            imagePublicId: cat.image.imagePublicId
        },
        link: `/products?category=${cat.slug}`,
        cta: 'Shop Now',
        isActive: true,
        order: 1000 + index, // Place category banners after dedicated banners
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt
    }));

    // Combine and sort
    const allBanners = [...banners, ...categoryBanners].sort((a, b) => a.order - b.order);

    return allBanners;
};

export const getAllBanners = async () => {
    return await Banner.find().sort({ order: 1, createdAt: -1 });
};

export const createBanner = async (data: Partial<IBanner>) => {
    return await Banner.create(data);
};

export const updateBanner = async (id: string, data: Partial<IBanner>) => {
    return await Banner.findByIdAndUpdate(id, data, { new: true });
};

export const deleteBanner = async (id: string) => {
    return await Banner.findByIdAndDelete(id);
};
