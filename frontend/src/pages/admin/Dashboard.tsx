import { ShoppingBag, Layers, Users, TrendingUp, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';

interface Stats {
    totalProducts: number;
    totalCategories: number;
    totalBrands: number;
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    recentOrders: any[];
    lowStockProducts: any[];
    salesAnalytics: { _id: string; revenue: number; count: number }[];
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get('/admin/stats');
            return res.data.data as Stats;
        },
        refetchInterval: 10000, // Refresh every 10 seconds for real-time feel
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    };

    const cards = [
        { title: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: TrendingUp, color: 'emerald' },
        { title: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'blue' },
        { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'purple' },
        { title: 'Total Products', value: stats?.totalProducts || 0, icon: Layers, color: 'amber' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-black" />
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black text-white p-10 rounded-[32px] relative overflow-hidden shadow-2xl shadow-black/20"
            >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/20">
                            <Sparkles className="h-4 w-4 text-amber-400" />
                            <span className="text-sm font-semibold uppercase tracking-wider">Admin Systems Online</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif mb-4 leading-tight">
                            Welcome back, <span className="italic">{user?.name?.split(' ')[0] || 'Admin'}</span>
                        </h1>
                        <p className="text-gray-400 text-lg font-light leading-relaxed">
                            Your premium fashion management suite is fully synchronized. Monitor metrics and manage your inventory with precision.
                        </p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative"
                    >
                        <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-white/10 p-2 bg-gradient-to-tr from-amber-500/20 to-purple-500/20 backdrop-blur-sm">
                            <div className="h-full w-full rounded-full overflow-hidden border-2 border-white/20 relative shadow-2xl">
                                {user?.profilePicture?.imageUrl ? (
                                    <img
                                        src={user.profilePicture.imageUrl}
                                        alt={user.name}
                                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-white/5 flex items-center justify-center">
                                        <span className="text-4xl font-serif font-bold text-white/40">
                                            {user?.name?.charAt(0).toUpperCase() || 'A'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Status Indicator */}
                        <div className="absolute bottom-2 right-2 h-6 w-6 bg-emerald-500 rounded-full border-4 border-black" />
                    </motion.div>
                </div>
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/20 blur-[120px] rounded-full pointer-events-none transition-all duration-500"></div>
                <div className="absolute bottom-0 right-32 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>
            </motion.div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group cursor-default"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn(
                                "p-3 rounded-2xl transition-colors duration-300",
                                card.color === 'blue' && "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
                                card.color === 'purple' && "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white",
                                card.color === 'amber' && "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
                                card.color === 'emerald' && "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                            )}>
                                <card.icon className="h-6 w-6" />
                            </div>
                            <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-bold">
                                <TrendingUp className="h-3 w-3" />
                                <span>+12%</span>
                            </div>
                        </div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{card.title}</h3>
                        <p className="text-4xl font-serif text-gray-900 group-hover:scale-110 transition-transform origin-left duration-300">{card.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions / Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[24px] border border-gray-100 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-gray-900">Recent Business Transactions</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Live feed of global orders</p>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-black underline underline-offset-4">View All</button>
                    </div>
                    <div className="space-y-4">
                        {stats?.recentOrders?.length === 0 ? (
                            <div className="py-12 text-center bg-gray-50 rounded-[24px] border border-dashed border-gray-200">
                                <ShoppingBag className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Recent Transactions</p>
                            </div>
                        ) : stats?.recentOrders?.map((order: any) => (
                            <div key={order._id} className="group flex items-center justify-between py-5 px-6 border border-transparent hover:border-gray-100 hover:bg-gray-50/50 rounded-2xl transition-all duration-300">
                                <div className="flex items-center space-x-5">
                                    <div className="h-12 w-12 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors duration-300">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 group-hover:translate-x-1 transition-transform duration-300">New Order: {formatCurrency(order.totalAmount)}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">
                                            #{order._id.slice(-6).toUpperCase()} • {order.user?.name || 'Customer'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-gray-300">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    <span className="block text-[10px] font-black uppercase tracking-tighter text-emerald-500 mt-1">
                                        {order.orderStatus}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[24px] border border-gray-100 p-8 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-gray-900">Inventory Alerts</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-1">Refill required soon</p>
                        </div>
                        <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center">
                            <Layers className="h-4 w-4 text-amber-600" />
                        </div>
                    </div>

                    <div className="space-y-6 flex-1">
                        {stats?.lowStockProducts?.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                                <p className="text-[10px] font-black uppercase text-gray-400">All Stock Levels Optimal</p>
                            </div>
                        ) : stats?.lowStockProducts?.map((product: any) => (
                            <div key={product._id} className="flex items-center justify-between group">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                        <img src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.imageUrl} className="h-full w-full object-cover" alt="" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 line-clamp-1">{product.title}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Stock Left: {product.stock}</p>
                                    </div>
                                </div>
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full rounded-full transition-all duration-1000",
                                            product.stock < 5 ? "bg-red-500" : "bg-amber-500"
                                        )}
                                        style={{ width: `${(product.stock / 10) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-gray-50 flex items-center justify-between mt-auto">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Warehouse Status</span>
                        <span className="flex items-center space-x-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span>Online</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
