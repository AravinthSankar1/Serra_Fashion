import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Truck, CreditCard, User, MapPin, Calendar, Hash, Clock } from 'lucide-react';
import { type Order } from '../../types';
import { useCurrency } from '../../hooks/useCurrency';

interface OrderDetailDrawerProps {
    order: Order | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function OrderDetailDrawer({ order, isOpen, onClose }: OrderDetailDrawerProps) {
    const { format, convert } = useCurrency();
    if (!order) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[111] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                    <Hash className="h-3 w-3" />
                                    <span>Order Details</span>
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-gray-900">
                                    #{order._id.toUpperCase()}
                                </h2>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-all border border-transparent hover:border-gray-100 shadow-sm">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-10">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-[24px] bg-gray-50 border border-gray-100">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date Placed</span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">{new Date(order.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="p-6 rounded-[24px] bg-gray-50 border border-gray-100">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <CreditCard className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {order.paymentStatus}
                                        </span>
                                        <span className="text-xs font-bold text-gray-900">{order.paymentMethod}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <section className="space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center">
                                    <User className="h-4 w-4 mr-2" />
                                    Customer Information
                                </h3>
                                <div className="grid grid-cols-2 gap-8 p-6 rounded-[32px] border border-gray-100">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-tighter text-gray-400 mb-1">Full Name</p>
                                        <p className="font-bold text-gray-900">{order.user?.name || 'Guest'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-tighter text-gray-400 mb-1">Email Address</p>
                                        <p className="font-bold text-gray-900">{order.user?.email || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex items-center space-x-2 mb-2 text-gray-900">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span className="text-[10px] font-black uppercase tracking-tighter">Shipping Address</span>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {order.shippingAddress.street}<br />
                                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                                            {order.shippingAddress.country}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Order Items */}
                            <section className="space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center">
                                    <Package className="h-4 w-4 mr-2" />
                                    Order Items ({order.items.length})
                                </h3>
                                <div className="space-y-4">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex space-x-4 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <div className="h-24 w-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                                                {item.product?.images?.[0] ? (
                                                    <img src={typeof item.product.images[0] === 'string' ? item.product.images[0] : (item.product.images[0] as any).imageUrl} className="h-full w-full object-cover" alt="" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                                        <Package className="h-6 w-6 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 py-1 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{item.product?.title || 'Unavailable Product'}</h4>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <span className="text-[10px] font-black uppercase text-gray-400 border border-gray-100 px-2 py-0.5 rounded">
                                                            Size: {item.size || 'N/A'}
                                                        </span>
                                                        <span className="text-[10px] font-black uppercase text-gray-400 border border-gray-100 px-2 py-0.5 rounded">
                                                            Qty: {item.quantity}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs text-gray-400">Unit Price: {format(convert(item.price))}</p>
                                                    <p className="font-bold text-gray-900">{format(convert(item.price * item.quantity))}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Timeline */}
                            <section className="space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Order Timeline
                                </h3>
                                <div className="space-y-8 pl-4 border-l-2 border-gray-50 ml-2">
                                    {order.statusHistory?.map((entry, i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[26px] top-1.5 h-4 w-4 rounded-full border-4 border-white bg-black shadow-sm" />
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{entry.status}</p>
                                                <p className="text-[10px] text-gray-400 font-medium uppercase mt-1">
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </p>
                                                {entry.note && (
                                                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg italic">
                                                        {entry.note}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Financial Summary */}
                            <section className="p-8 rounded-[32px] bg-black text-white space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Subtotal</span>
                                    <span className="font-bold">{format(convert(order.totalAmount))}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Shipping</span>
                                    <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">Free</span>
                                </div>
                                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                    <span className="font-serif italic text-xl">Total Amount</span>
                                    <span className="text-2xl font-bold">{format(convert(order.totalAmount))}</span>
                                </div>
                            </section>
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-8 border-t border-gray-100 flex items-center space-x-4 bg-gray-50/30">
                            <button className="flex-1 h-14 bg-white border border-gray-200 rounded-2xl text-xs font-bold uppercase tracking-widest hover:border-black transition-colors flex items-center justify-center">
                                <Truck className="h-4 w-4 mr-2" />
                                Track Order
                            </button>
                            <button className="h-14 w-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center hover:border-black transition-colors">
                                <CreditCard className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
