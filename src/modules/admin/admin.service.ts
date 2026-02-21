import mongoose from 'mongoose';
import { Product } from '../product/product.model';
import { Category } from '../category/category.model';
import { Brand } from '../brand/brand.model';
import { User } from '../user/user.model';
import { Order } from '../order/order.model';

export const getDashboardStats = async (vendorId?: string | any) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const vendorMatch = vendorId ? { vendor: new mongoose.Types.ObjectId(vendorId) } : {};

    // For orders, it's more complex since an order can have items from multiple vendors
    // We want stats for orders that contain at least one item from this vendor
    const orderMatch = vendorId ? { "productDetails.vendor": new mongoose.Types.ObjectId(vendorId) } : {};

    const [
        totalProducts,
        totalCategories,
        totalBrands,
        totalUsers,
        totalOrdersCount,
        revenueResult,
        recentOrders,
        lowStockProducts,
        salesAnalytics,
        topSellingProducts,
        recentUsers
    ] = await Promise.all([
        Product.countDocuments(vendorMatch),
        Category.countDocuments(vendorId ? { createdBy: vendorId } : {}),
        Brand.countDocuments(vendorId ? { createdBy: vendorId } : {}),
        vendorId ? Promise.resolve(0) : User.countDocuments(),
        vendorId ?
            Order.aggregate([
                { $unwind: "$items" },
                { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "productDetails" } },
                { $unwind: "$productDetails" },
                { $match: orderMatch },
                { $group: { _id: "$_id" } },
                { $count: "count" }
            ]).then(res => res[0]?.count || 0) :
            Order.countDocuments(),
        Order.aggregate([
            { $match: { paymentStatus: 'PAID' } },
            { $unwind: "$items" },
            { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "productDetails" } },
            { $unwind: "$productDetails" },
            ...(vendorId ? [{ $match: orderMatch }] : []),
            { $group: { _id: null, total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } }
        ]),
        Order.aggregate([
            { $unwind: "$items" },
            { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "productDetails" } },
            { $unwind: "$productDetails" },
            ...(vendorId ? [{ $match: orderMatch }] : []),
            { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
            { $replaceRoot: { newRoot: "$doc" } },
            { $sort: { createdAt: -1 } },
            { $limit: 10 },
            { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            { $project: { "user.password": 0, items: 0 } }
        ]),
        Product.find(vendorMatch ? { ...vendorMatch, stock: { $lt: 10 } } : { stock: { $lt: 10 } }).limit(5).select('title stock images slug'),
        Order.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentStatus: 'PAID' } },
            { $unwind: "$items" },
            { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "productDetails" } },
            { $unwind: "$productDetails" },
            ...(vendorId ? [{ $match: orderMatch }] : []),
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    orders: { $addToSet: "$_id" }
                }
            },
            { $project: { _id: 1, revenue: 1, orders: { $size: "$orders" } } },
            { $sort: { _id: 1 } }
        ]),
        Order.aggregate([
            { $match: { paymentStatus: 'PAID' } },
            { $unwind: "$items" },
            { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "productDetails" } },
            { $unwind: "$productDetails" },
            ...(vendorId ? [{ $match: orderMatch }] : []),
            {
                $group: {
                    _id: "$items.product",
                    sold: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    productDetails: { $first: "$productDetails" }
                }
            },
            { $sort: { sold: -1 } },
            { $limit: 5 },
            {
                $project: {
                    name: "$productDetails.title",
                    image: { $arrayElemAt: ["$productDetails.images.imageUrl", 0] },
                    price: "$productDetails.finalPrice",
                    sold: 1,
                    revenue: 1
                }
            }
        ]),
        vendorId ?
            Promise.resolve([]) :
            User.find().sort({ createdAt: -1 }).limit(5).select('name email profilePicture createdAt role')
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    return {
        overview: {
            totalProducts,
            totalCategories,
            totalBrands,
            totalUsers,
            totalOrders: totalOrdersCount,
            totalRevenue
        },
        charts: {
            salesAnalytics,
        },
        lists: {
            recentOrders,
            lowStockProducts,
            topSellingProducts,
            recentUsers
        }
    };
};

export const globalSearch = async (query: string, vendorId?: string) => {
    if (!query) return { products: [], orders: [], users: [] };

    const regex = new RegExp(query, 'i');
    const isObjectId = mongoose.Types.ObjectId.isValid(query);

    const vendorMatch = vendorId ? { vendor: new mongoose.Types.ObjectId(vendorId) } : {};

    const [products, orders, users] = await Promise.all([
        Product.find({
            ...vendorMatch,
            $or: [
                { title: regex },
                { slug: regex },
                { description: regex }
            ]
        }).limit(5).select('title images finalPrice slug brand category'),
        vendorId ?
            Order.aggregate([
                { $unwind: "$items" },
                { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "productDetails" } },
                { $unwind: "$productDetails" },
                { $match: { "productDetails.vendor": new mongoose.Types.ObjectId(vendorId) } },
                {
                    $match: {
                        $or: [
                            ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(query) }] : []),
                            { 'shippingAddress.firstName': regex },
                            { 'shippingAddress.lastName': regex },
                            { 'shippingAddress.email': regex }
                        ]
                    }
                },
                { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
                { $replaceRoot: { newRoot: "$doc" } },
                { $limit: 5 },
                { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
                { $unwind: "$user" },
                { $project: { "user.name": 1, "user.email": 1, shippingAddress: 1, _id: 1 } }
            ]) :
            Order.find({
                $or: [
                    ...(isObjectId ? [{ _id: query }] : []),
                    { 'shippingAddress.firstName': regex },
                    { 'shippingAddress.lastName': regex },
                    { 'shippingAddress.email': regex }
                ]
            }).limit(5).populate('user', 'name email'),
        vendorId ? Promise.resolve([]) :
            User.find({
                $or: [
                    { name: regex },
                    { email: regex }
                ]
            }).limit(5).select('name email profilePicture role')
    ]);

    return { products, orders, users };
};
