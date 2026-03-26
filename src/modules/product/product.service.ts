import { Product } from './product.model';
import { IProduct } from './product.interface';
import { User } from '../user/user.model';
import { StoreSettings } from '../settings/settings.model';

export const createProduct = async (data: Partial<IProduct>) => {
    return await Product.create(data);
};

const applyDiscountsToProduct = (product: any, categoryDiscounts: any[]) => {
    const plainProd = product.toObject ? product.toObject() : product;
    const catDiscount = categoryDiscounts.find(d => d.categoryId === String(plainProd.category?._id || plainProd.category));
    
    if (catDiscount && catDiscount.discountPercentage > plainProd.discountPercentage) {
        const effectiveDiscount = catDiscount.discountPercentage;
        const newFinalPrice = Math.round(plainProd.basePrice - (plainProd.basePrice * effectiveDiscount) / 100);
        return { 
            ...plainProd, 
            discountPercentage: effectiveDiscount, 
            finalPrice: newFinalPrice,
            isGlobalCategoryDiscount: true 
        };
    }
    return plainProd;
};

export const getProducts = async (filters: any, page = 1, limit = 10) => {
    const query: any = {};
    // ... (rest of query logic same)
    if (filters.approvalStatus) {
        query.approvalStatus = filters.approvalStatus;
    } else if (!filters.vendor && !filters.isAdmin) {
        query.approvalStatus = 'APPROVED';
        query.isPublished = true;
    }
    if (filters.vendor) query.vendor = filters.vendor;
    if (filters.isPublished !== undefined) query.isPublished = filters.isPublished === 'true';
    if (filters.search) {
        query.$or = [
            { title: { $regex: filters.search, $options: 'i' } },
            { description: { $regex: filters.search, $options: 'i' } }
        ];
    }
    if (filters.category) {
        const categories = filters.category.split(',');
        query.category = categories.length > 1 ? { $in: categories } : filters.category;
    }
    if (filters.brand) {
        const brands = filters.brand.split(',');
        query.brand = brands.length > 1 ? { $in: brands } : filters.brand;
    }
    if (filters.gender) {
        if (filters.gender === 'MEN' || filters.gender === 'WOMEN') {
            query.gender = { $in: [filters.gender, 'UNISEX'] };
        } else {
            query.gender = filters.gender;
        }
    }
    if (filters.sale === 'true') query.discountPercentage = { $gt: 0 };
    if (filters.sizes) query['variants.size'] = { $in: filters.sizes.split(',') };
    if (filters.minPrice || filters.maxPrice) {
        query.finalPrice = {};
        if (filters.minPrice) query.finalPrice.$gte = Number(filters.minPrice);
        if (filters.maxPrice) query.finalPrice.$lte = Number(filters.maxPrice);
    }
    let sort: any = { createdAt: -1 };
    if (filters.sort) {
        const [field, order] = filters.sort.split('-');
        sort = { [field]: order === 'asc' ? 1 : -1 };
    }

    const skip = (page - 1) * limit;

    const [products, total, settings] = await Promise.all([
        Product.find(query)
            .populate('brand', 'name')
            .populate('category', 'name')
            .sort(sort)
            .skip(skip)
            .limit(limit),
        Product.countDocuments(query),
        StoreSettings.findOne().lean()
    ]);

    const categoryDiscounts = settings?.categoryDiscounts || [];
    const productsWithDiscounts = products.map(p => applyDiscountsToProduct(p, categoryDiscounts));

    return { 
        products: productsWithDiscounts, 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit) 
    };
};

export const getProductById = async (id: string) => {
    const [product, settings] = await Promise.all([
        Product.findById(id).populate('brand category sizeGuide'),
        StoreSettings.findOne().lean()
    ]);
    if (!product) return null;
    return applyDiscountsToProduct(product, settings?.categoryDiscounts || []);
};

export const getProductBySlug = async (slug: string) => {
    const [product, settings] = await Promise.all([
        Product.findOne({ slug }).populate('brand category sizeGuide'),
        StoreSettings.findOne().lean()
    ]);
    if (!product) return null;
    return applyDiscountsToProduct(product, settings?.categoryDiscounts || []);
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
    // Remove from all user wishlists and recently viewed
    await User.updateMany(
        { $or: [{ wishlist: id }, { recentlyViewed: id }] },
        { $pull: { wishlist: id, recentlyViewed: id } }
    );
    return await Product.findByIdAndDelete(id);
};

export const getRelated = async (productId: string, categoryId: string, brandId: string) => {
    const [products, settings] = await Promise.all([
        Product.find({
            $and: [
                { _id: { $ne: productId } },
                { isPublished: true },
                { $or: [{ category: categoryId }, { brand: brandId }] }
            ]
        })
            .limit(4)
            .populate('brand category'),
        StoreSettings.findOne().lean()
    ]);

    const categoryDiscounts = settings?.categoryDiscounts || [];
    return products.map(p => applyDiscountsToProduct(p, categoryDiscounts));
};
