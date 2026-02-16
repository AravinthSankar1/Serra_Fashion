import mongoose from 'mongoose';
import { Product } from '../product/product.model';
import { Category } from '../category/category.model';
import { Brand } from '../brand/brand.model';
import { User } from '../user/user.model';
import { Order } from '../order/order.model';

export const getDashboardStats = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
        totalProducts,
        totalCategories,
        totalBrands,
        totalUsers,
        totalOrders,
        revenueResult,
        recentOrders,
        lowStockProducts,
        salesAnalytics,
        topSellingProducts,
        recentUsers
    ] = await Promise.all([
        Product.countDocuments(),
        Category.countDocuments(),
        Brand.countDocuments(),
        User.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
            { $match: { paymentStatus: 'PAID' } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]),
        Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(10),
        Product.find({ stock: { $lt: 10 } }).limit(5).select('title stock images slug'),
        Order.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo }, paymentStatus: 'PAID' } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        // Top Selling Products based on Order Items (assuming items have productId)
        Order.aggregate([
            { $match: { paymentStatus: 'PAID' } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    sold: { $sum: "$items.quantity" },
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { sold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
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
        User.find().sort({ createdAt: -1 }).limit(5).select('name email profilePicture createdAt role')
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    return {
        overview: {
            totalProducts,
            totalCategories,
            totalBrands,
            totalUsers,
            totalOrders,
            totalRevenue
        },
        charts: {
            salesAnalytics, // Array of { _id: date, revenue, orders }
        },
        lists: {
            recentOrders,
            lowStockProducts,
            topSellingProducts,
            recentUsers
        }
    };
};

export const globalSearch = async (query: string) => {
    if (!query) return { products: [], orders: [], users: [] };

    const regex = new RegExp(query, 'i');
    const isObjectId = mongoose.Types.ObjectId.isValid(query);

    const [products, orders, users] = await Promise.all([
        Product.find({
            $or: [
                { title: regex },
                { slug: regex },
                { description: regex }
            ]
        }).limit(5).select('title images finalPrice slug brand category'),
        Order.find({
            $or: [
                ...(isObjectId ? [{ _id: query }] : []),
                { 'shippingAddress.firstName': regex },
                { 'shippingAddress.lastName': regex },
                { 'shippingAddress.email': regex }
            ]
        }).limit(5).populate('user', 'name email'),
        User.find({
            $or: [
                { name: regex },
                { email: regex }
            ]
        }).limit(5).select('name email profilePicture role')
    ]);

    return { products, orders, users };
};
