import { SizeGuide } from './sizeGuide.model';
import { ISizeGuide } from './sizeGuide.interface';

export const createSizeGuide = async (data: Partial<ISizeGuide>) => {
    return await SizeGuide.create(data);
};

export const getAllSizeGuides = async (filters: any = {}, page: number = 1, limit: number = 20) => {
    const skip = (page - 1) * limit;
    const [sizeGuides, total] = await Promise.all([
        SizeGuide.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('category'),
        SizeGuide.countDocuments(filters)
    ]);

    return {
        sizeGuides,
        total,
        page,
        pages: Math.ceil(total / limit)
    };
};

export const getSizeGuideById = async (id: string) => {
    return await SizeGuide.findById(id).populate('category');
};

export const updateSizeGuide = async (id: string, data: Partial<ISizeGuide>) => {
    return await SizeGuide.findByIdAndUpdate(id, data, { new: true });
};

export const deleteSizeGuide = async (id: string) => {
    return await SizeGuide.findByIdAndDelete(id);
};
