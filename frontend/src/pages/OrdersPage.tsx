import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { type Order } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import Navbar from '../components/layout/Navbar';
import { Package, ChevronRight, Clock, Truck, CheckCircle2, XCircle, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function OrdersPage() {
    const { format, convert } = useCurrency();
    const { data: orders, isLoading } = useQuery({
        queryKey: ['orders', 'my-orders'],
        queryFn: async () => {
            const res = await api.get('/orders/my-orders');
            return res.data.data as Order[];
        }
    });

    const getStatusIcon = (status: Order['orderStatus']) => {
        switch (status) {
            case 'PENDING': return <Clock className="h-4 w-4 text-amber-500" />;
            case 'PROCESSING': return <Package className="h-4 w-4 text-blue-500" />;
            case 'SHIPPED': return <Truck className="h-4 w-4 text-indigo-500" />;
            case 'DELIVERED': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'CANCELLED': return <XCircle className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 py-12 md:py-20">
                <div className="mb-12">
                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">My Orders</h1>
                    <p className="text-gray-500 uppercase tracking-widest text-[10px] font-black">History of your carefully selected pieces</p>
                </div>

                {isLoading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-white rounded-3xl animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : orders && orders.length > 0 ? (
                    <div className="space-y-8">
                        {orders.map((order) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={order._id}
                                className="bg-white rounded-[40px] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500 group"
                            >
                                <div className="p-8 md:p-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-gray-50">
                                        <div className="flex items-center space-x-6">
                                            <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                                                <Package className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</p>
                                                <p className="font-bold text-gray-900 font-mono">#{order._id.slice(-8).toUpperCase()}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
                                                {getStatusIcon(order.orderStatus)}
                                                <span className="text-[10px] font-black uppercase tracking-tighter text-gray-700">
                                                    {order.orderStatus}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date Placed</p>
                                                <p className="text-sm font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center space-x-4">
                                                    <div className="h-20 w-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                                        <img src={item.product?.images?.[0]?.imageUrl} className="h-full w-full object-cover" alt="" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <Link to={`/product/${item.product?.slug}`} className="font-bold text-gray-900 group-hover:text-black hover:underline truncate block">
                                                            {item.product?.title || 'Unknown Product'}
                                                        </Link>
                                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-tight mt-1">
                                                            Qty: {item.quantity} • {item.size || 'Standard'}
                                                        </p>
                                                        <p className="text-sm font-bold mt-1 text-gray-900">{format(convert(item.price))}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-col justify-between p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    <span>Subtotal</span>
                                                    <span>{format(convert(order.totalAmount))}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-500">
                                                    <span>Shipping</span>
                                                    <span>Complimentary</span>
                                                </div>
                                                <div className="flex justify-between pt-3 border-t border-gray-100 items-baseline">
                                                    <span className="font-serif italic font-bold text-gray-900">Total Charged</span>
                                                    <span className="text-2xl font-bold text-gray-900">{format(convert(order.totalAmount))}</span>
                                                </div>
                                            </div>

                                            <div className="mt-6 flex flex-col gap-3">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await api.get(`/orders/${order._id}/invoice`, { responseType: 'blob' });
                                                            const url = window.URL.createObjectURL(new Blob([res.data]));
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.setAttribute('download', `invoice-${order._id}.pdf`);
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            link.parentNode?.removeChild(link);
                                                        } catch (e) {
                                                            console.error(e);
                                                            // toast.error('Failed to download invoice');
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-widest bg-white text-black border border-gray-200 py-4 rounded-xl hover:bg-gray-50 transition-colors"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    <span>Download Invoice</span>
                                                </button>

                                                {/* Details Link (optional or keep existing) */}
                                            </div>
                                        </div>
                                        <Link
                                            to={`/checkout`}
                                            className="mt-6 flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-widest bg-black text-white py-4 rounded-2xl hover:bg-zinc-800 transition-colors shadow-lg shadow-black/5"
                                        >
                                            <span>View Order Details</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                        <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="h-8 w-8 text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-serif text-gray-900 mb-2 italic">No history yet</h2>
                        <p className="text-gray-400 mb-8 max-w-xs mx-auto">Start your collection by exploring our curated essentials.</p>
                        <Link to="/" className="inline-flex items-center space-x-2 bg-black text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all">
                            <span>Browse Shop</span>
                        </Link>
                    </div>
                )
                }
            </main >
        </div >
    );
}
