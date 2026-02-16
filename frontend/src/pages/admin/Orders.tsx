import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { type Order, type OrderStatus } from '../../types';
import { useCurrency } from '../../hooks/useCurrency';
import { Search, ExternalLink, TrendingUp, ShoppingBag, Clock, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import OrderDetailDrawer from './OrderDetailDrawer';
import { motion } from 'framer-motion';

export default function AdminOrders() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { format, convert } = useCurrency();

    const { data: orders, isLoading } = useQuery({
        queryKey: ['admin-orders'],
        queryFn: async () => {
            const res = await api.get('/orders');
            // If the response is paginated (object with orders array), use orders. Otherwise fallback.
            const result = res.data.data;
            return Array.isArray(result) ? result : (result.orders || []);
        },
        refetchInterval: 10000, // Poll every 10 seconds for real-time updates
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string, status: OrderStatus }) => {
            const res = await api.patch(`/orders/${orderId}/status`, { status });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            toast.success('Order status updated');
        }
    });

    const filteredOrders = orders?.filter((order: Order) => {
        const matchesSearch =
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            (order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
        const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: OrderStatus) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'PROCESSING': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'SHIPPED': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'DELIVERED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'CANCELLED': return 'bg-zinc-50 text-zinc-500 border-zinc-100';
        }
    };

    // Summary Stats
    const totalOrders = orders?.length || 0;
    const pendingOrders = orders?.filter((o: Order) => o.orderStatus === 'PENDING').length || 0;
    const totalRevenue = orders?.filter((o: Order) => o.paymentStatus === 'PAID').reduce((acc: number, curr: Order) => acc + curr.totalAmount, 0) || 0;

    const stats = [
        { label: 'Total Volume', value: totalOrders, icon: ShoppingBag, color: 'blue' },
        { label: 'Pending Action', value: pendingOrders, icon: Clock, color: 'amber' },
        { label: 'Net Revenue', value: format(convert(totalRevenue)), icon: TrendingUp, color: 'emerald' },
        { label: 'Fulfillment Rate', value: '98.4%', icon: CheckCircle2, color: 'purple' },
    ];

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-gray-900">Order Management</h1>
                    <p className="text-gray-400 text-xs uppercase tracking-[0.3em] font-black mt-2">Monitor and fulfill customer desires in real-time</p>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by ID or customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-[20px] text-sm focus:ring-2 focus:ring-black outline-none w-64 md:w-96 shadow-sm transition-all focus:shadow-xl focus:shadow-gray-100"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={i}
                        className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center space-x-6"
                    >
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${stat.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                            stat.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                                stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                    'bg-purple-50 text-purple-600'
                            }`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                            <p className="text-xl font-serif font-bold text-gray-900">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    {['all', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === status
                                ? 'bg-black text-white border-black shadow-lg shadow-black/20'
                                : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Showing {filteredOrders?.length || 0} Orders
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-2xl shadow-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Ref ID</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Items</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50/50">
                            {isLoading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-8 py-10"><div className="h-8 bg-gray-50 rounded-2xl"></div></td>
                                    </tr>
                                ))
                            ) : filteredOrders?.map((order: Order) => (
                                <tr key={order._id} className="hover:bg-gray-50/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-mono font-bold text-gray-900">#{order._id.slice(-6).toUpperCase()}</span>
                                            <span className="text-[9px] text-gray-400 font-medium mt-1">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div>
                                            <p className="font-bold text-gray-900">{order.user?.name || 'Guest'}</p>
                                            <p className="text-xs text-gray-400 lowercase">{order.user?.email || 'N/A'}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="inline-flex items-center px-4 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold font-serif italic text-gray-900">
                                            {order.items.length} {order.items.length === 1 ? 'Piece' : 'Pieces'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="font-bold text-gray-900">{format(convert(order.totalAmount))}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <select
                                            value={order.orderStatus}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => updateStatusMutation.mutate({ orderId: order._id, status: e.target.value as OrderStatus })}
                                            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border outline-none cursor-pointer transition-all hover:shadow-sm ${getStatusStyle(order.orderStatus)}`}
                                        >
                                            <option value="PENDING">Pending</option>
                                            <option value="PROCESSING">Processing</option>
                                            <option value="SHIPPED">Shipped</option>
                                            <option value="DELIVERED">Delivered</option>
                                            <option value="CANCELLED">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setIsDrawerOpen(true);
                                            }}
                                            className="p-3 hover:bg-black hover:text-white rounded-2xl transition-all border border-gray-100 hover:border-black group/btn"
                                        >
                                            <ExternalLink className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <OrderDetailDrawer
                order={selectedOrder}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
            />
        </div>
    );
}
