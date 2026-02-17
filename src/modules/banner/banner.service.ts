import { Banner, IBanner } from './banner.model';

export const getActiveBanners = async () => {
    return await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
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
