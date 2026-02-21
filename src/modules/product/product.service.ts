import { Product } from './product.model';
import { IProduct } from './product.interface';

export const createProduct = async (data: Partial<IProduct>) => {
    return await Product.create(data);
};

export const getProducts = async (filters: any, page = 1, limit = 10) => {
    const query: any = {};

    // 1. Visibility & Approval Logic
    if (!filters.approvalStatus && !filters.vendor) {
        query.approvalStatus = 'APPROVED';
        query.isPublished = true;
    } else {
        if (filters.approvalStatus) query.approvalStatus = filters.approvalStatus;
        if (filters.vendor) query.vendor = filters.vendor;
        if (filters.isPublished !== undefined) query.isPublished = filters.isPublished === 'true';
    }

    // 2. Text Search
    if (filters.search) {
        query.$or = [
            { title: { $regex: filters.search, $options: 'i' } },
            { description: { $regex: filters.search, $options: 'i' } }
        ];
    }

    // 3. Exact Matches & Multi-select
    if (filters.category) {
        const categories = filters.category.split(',');
        if (categories.length > 1) {
            query.category = { $in: categories };
        } else {
            query.category = filters.category;
        }
    }

    if (filters.brand) {
        const brands = filters.brand.split(',');
        if (brands.length > 1) {
            query.brand = { $in: brands };
        } else {
            query.brand = filters.brand;
        }
    }

    if (filters.gender) query.gender = filters.gender;
    if (filters.sale === 'true') query.discountPercentage = { $gt: 0 };

    // 4. Size Filters
    if (filters.sizes) {
        const sizes = filters.sizes.split(',');
        query['variants.size'] = { $in: sizes };
    }

    // 5. Price Range
    if (filters.minPrice || filters.maxPrice) {
        query.finalPrice = {};
        if (filters.minPrice) query.finalPrice.$gte = Number(filters.minPrice);
        if (filters.maxPrice) query.finalPrice.$lte = Number(filters.maxPrice);
    }

    // 6. Sorting
    let sort: any = { createdAt: -1 };
    if (filters.sort) {
        const [field, order] = filters.sort.split('-');
        sort = { [field]: order === 'asc' ? 1 : -1 };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(query)
            .populate('brand', 'name')
            .populate('category', 'name')
            .sort(sort)
            .skip(skip)
            .limit(limit),
        Product.countDocuments(query)
    ]);

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getProductById = async (id: string) => {
    return await Product.findById(id).populate('brand category sizeGuide');
};

export const getProductBySlug = async (slug: string) => {
    return await Product.findOne({ slug }).populate('brand category sizeGuide');
};

export const updateProduct = async (id: string, data: Partial<IProduct>) => {
    // Manually calculate final price if basePrice or discountPercentage is updated
    if (data.basePrice !== undefined || data.discountPercentage !== undefined) {
        const product = await Product.findById(id);
        if (product) {
            const basePrice = data.basePrice ?? product.basePrice;
            const discountPercentage = data.discountPercentage ?? product.discountPercentage;
            data.finalPrice = Math.round(basePrice - (basePrice * discountPercentage) / 100);
        }
    }
    return await Product.findByIdAndUpdate(id, data, { new: true });
};

export const deleteProduct = async (id: string) => {
    return await Product.findByIdAndDelete(id);
};

export const getRelated = async (productId: string, categoryId: string, brandId: string) => {
    return await Product.find({
        $and: [
            { _id: { $ne: productId } },
            { isPublished: true },
            { $or: [{ category: categoryId }, { brand: brandId }] }
        ]
    })
        .limit(4)
        .populate('brand category');
};
