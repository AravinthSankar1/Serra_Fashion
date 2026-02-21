import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { type Order } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import Navbar from '../components/layout/Navbar';
import { Package, MapPin, Download, XCircle, CheckCircle2, Truck, Clock, ShoppingBag, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useRazorpay } from 'react-razorpay';

// ─── STATUS CONFIG ─────────────────────────────────────────
const ORDER_STEPS = [
    { key: 'PENDING', label: 'Ordered', shortLabel: 'Ordered' },
    { key: 'PROCESSING', label: 'Shipped', shortLabel: 'Shipped' },
    { key: 'SHIPPED', label: 'Out for Delivery', shortLabel: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered', shortLabel: 'Delivery' },
];

const STATUS_STEP_MAP: Record<string, number> = {
    PENDING: 0,
    PROCESSING: 1,
    SHIPPED: 2,
    DELIVERED: 3,
    CANCELLED: -1,
};

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
    PENDING: { label: 'Order Placed', bg: 'bg-amber-50', text: 'text-amber-700' },
    PROCESSING: { label: 'Shipping Soon!', bg: 'bg-blue-50', text: 'text-blue-700' },
    SHIPPED: { label: 'On the Way!', bg: 'bg-indigo-50', text: 'text-indigo-700' },
    DELIVERED: { label: 'Delivered ✓', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-500' },
};

// ─── DELIVERY ESTIMATE ─────────────────────────────────────
function getDeliveryEstimate(order: Order): string {
    if (order.orderStatus === 'DELIVERED') {
        const last = order.statusHistory?.find(h => h.status === 'DELIVERED');
        if (last) return `Delivered on ${new Date(last.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
        return 'Delivered';
    }
    if (order.orderStatus === 'CANCELLED') return 'Order Cancelled';
    const placed = new Date(order.createdAt);
    const estimate = new Date(placed);
    estimate.setDate(estimate.getDate() + 5);
    return `Delivery by ${estimate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`;
}

// ─── STEP DATE: find the timestamp of a given status from history ─
function getStepDate(order: Order, statusKey: string): string | null {
    // PENDING = order placed = createdAt
    if (statusKey === 'PENDING') {
        return new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
    const entry = order.statusHistory?.find(h => h.status === statusKey);
    if (!entry) return null;
    return new Date(entry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ─── HORIZONTAL STEP TRACKER ───────────────────────────────
function OrderTracker({ order }: { order: Order }) {
    const currentStep = STATUS_STEP_MAP[order.orderStatus] ?? 0;
    const isCancelled = order.orderStatus === 'CANCELLED';

    if (isCancelled) {
        return (
            <div className="flex items-center space-x-3 py-2">
                <XCircle className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest text-[10px]">Order Cancelled</span>
            </div>
        );
    }

    return (
        <div className="w-full py-4">
            <div className="relative flex items-start justify-between">
                {/* Background track line */}
                <div className="absolute top-[14px] left-0 right-0 h-[2px] bg-gray-100 z-0" />

                {/* Filled progress line */}
                <div
                    className="absolute top-[14px] left-0 h-[2px] bg-black z-0 transition-all duration-700"
                    style={{ width: currentStep === 0 ? '0%' : `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%` }}
                />

                {ORDER_STEPS.map((step, idx) => {
                    const isDone = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    const stepDate = getStepDate(order, step.key);

                    return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center" style={{ width: `${100 / ORDER_STEPS.length}%` }}>
                            {/* Node */}
                            <div className="relative flex items-center justify-center">
                                {isCurrent && (
                                    <span className="absolute h-7 w-7 rounded-full bg-black/10 animate-ping" />
                                )}
                                <div
                                    className={`h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isDone
                                        ? 'bg-black border-black'
                                        : isCurrent
                                            ? 'bg-black border-black'
                                            : 'bg-white border-gray-200'
                                        }`}
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                    ) : isCurrent ? (
                                        <div className="h-2.5 w-2.5 rounded-full bg-white" />
                                    ) : (
                                        <div className="h-2 w-2 rounded-full bg-gray-200" />
                                    )}
                                </div>
                            </div>

                            {/* Label + Date */}
                            <p className={`text-center mt-2 font-bold leading-tight ${isDone || isCurrent ? 'text-gray-900' : 'text-gray-400'
                                }`} style={{ fontSize: '10px' }}>
                                {step.shortLabel}
                            </p>
                            {stepDate && (
                                <p className="text-center text-gray-400 mt-0.5" style={{ fontSize: '9px' }}>
                                    {stepDate}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── CANCEL MUTATION ───────────────────────────────────────
function CancelButton({ orderId, onSuccess }: { orderId: string; onSuccess: () => void }) {
    const [confirming, setConfirming] = useState(false);
    const { mutate: cancel, isPending } = useMutation({
        mutationFn: () => api.patch(`/orders/${orderId}/cancel`),
        onSuccess: () => {
            toast.success('Order cancelled successfully');
            onSuccess();
            setConfirming(false);
        },
        onError: () => toast.error('Failed to cancel order. Please try again.')
    });

    if (!confirming) {
        return (
            <button
                onClick={() => setConfirming(true)}
                className="text-xs font-bold text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
                Cancel Order
            </button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
            >
                <span className="text-xs text-gray-500">Sure?</span>
                <button
                    onClick={() => cancel()}
                    disabled={isPending}
                    className="text-xs font-bold text-white bg-red-500 px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                    {isPending ? 'Cancelling…' : 'Yes, Cancel'}
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    className="text-xs font-bold text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    Keep
                </button>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── MAIN PAGE ─────────────────────────────────────────────
export default function OrdersPage() {
    const { format, convert } = useCurrency();
    const queryClient = useQueryClient();
    const { Razorpay } = useRazorpay();
    const [isPaying, setIsPaying] = useState<string | null>(null);

    const handlePayment = async (order: Order) => {
        setIsPaying(order._id);
        try {
            // 1. Get Razorpay key
            const keyRes = await api.get('/payment/razorpay-key');
            const razorpayKey = keyRes.data.data.key;

            // 2. Create Razorpay order (for the full total, no hidden fees)
            const orderRes = await api.post('/payment/create-order', {
                amount: order.totalAmount,
                currency: 'INR'
            });

            const { id: rzp_order_id, amount, currency } = orderRes.data.data;

            const options = {
                key: razorpayKey,
                amount: amount.toString(),
                currency: currency,
                name: "SÉRRA FASHION",
                description: `Payment for Order #${order._id.slice(-8).toUpperCase()}`,
                order_id: rzp_order_id,
                handler: async function (response: any) {
                    try {
                        await api.post('/payment/verify-and-update-order', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderId: order._id
                        });
                        toast.success('Payment successful!');
                        queryClient.invalidateQueries({ queryKey: ['orders', 'my-orders'] });
                    } catch (error) {
                        toast.error('Payment verification failed');
                    } finally {
                        setIsPaying(null);
                    }
                },
                prefill: {
                    name: order.user?.name || '',
                    email: order.user?.email || '',
                    contact: order.shippingAddress.phone || '',
                },
                theme: {
                    color: "#000000",
                },
                modal: {
                    ondismiss: () => setIsPaying(null)
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();
        } catch (error) {
            toast.error('Could not initiate payment');
            setIsPaying(null);
        }
    };

    const { data: orders, isLoading, isError, error } = useQuery({
        queryKey: ['orders', 'my-orders'],
        queryFn: async () => {
            const res = await api.get('/orders/my-orders');
            return res.data.data as Order[];
        },
        retry: 1
    });

    const handleInvoiceDownload = async (orderId: string) => {
        try {
            const res = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `serra-invoice-${orderId.slice(-8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error('Failed to download invoice');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 py-12 md:py-20">
                {/* Page Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-1">My Orders</h1>
                    <p className="text-gray-400 uppercase tracking-widest text-[10px] font-black">Your order history</p>
                </div>

                {/* States */}
                {isLoading ? (
                    <div className="space-y-5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-gray-100" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-red-100">
                        <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-serif text-gray-900 mb-2">Connection Error</h2>
                        <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                            We couldn't reach the server. Please ensure the backend is running and try again.
                        </p>
                        <button
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['orders', 'my-orders'] })}
                            className="bg-black text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
                        >
                            Retry Connection
                        </button>
                    </div>
                ) : orders && orders.length > 0 ? (
                    <div className="space-y-6">
                        {orders.map((order, orderIdx) => {
                            const badge = STATUS_BADGE[order.orderStatus];
                            const firstImage = order.items[0]?.product?.images?.[0];
                            const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.imageUrl;
                            const firstTitle = order.items[0]?.product?.title || 'Order';
                            const canCancel = order.orderStatus === 'PENDING' || order.orderStatus === 'PROCESSING';
                            const addr = order.shippingAddress;

                            return (
                                <motion.div
                                    key={order._id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: orderIdx * 0.06 }}
                                    className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                                >
                                    {/* ── TOP: ORDER HEADER ─────────────────── */}
                                    <div className="p-6 pb-4 flex items-start gap-4">
                                        {/* Product thumbnail */}
                                        <div className="h-20 w-16 flex-shrink-0 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                                            {imageUrl
                                                ? <img src={imageUrl} className="h-full w-full object-cover" alt={firstTitle} />
                                                : <div className="h-full w-full flex items-center justify-center"><Package className="h-6 w-6 text-gray-300" /></div>
                                            }
                                        </div>

                                        {/* Meta */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 truncate text-sm">{firstTitle}{order.items.length > 1 && ` +${order.items.length - 1} more`}</p>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                                                        Order #{order._id.slice(-10).toUpperCase()}
                                                    </p>
                                                </div>
                                                {/* Status badge */}
                                                <span className={`flex-shrink-0 text-[10px] font-black uppercase tracking-wide px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                                                    {badge.label}
                                                </span>
                                            </div>

                                            {/* Delivery estimate */}
                                            <div className="flex items-center gap-1.5 mt-2">
                                                {order.orderStatus === 'DELIVERED'
                                                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                                    : order.orderStatus === 'CANCELLED'
                                                        ? <XCircle className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                        : <Truck className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                }
                                                <span className="text-xs text-gray-600 font-medium">{getDeliveryEstimate(order)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── STEP TRACKER ──────────────────────── */}
                                    <div className="px-6">
                                        <OrderTracker order={order} />
                                    </div>

                                    {/* ── DIVIDER ───────────────────────────── */}
                                    <div className="h-px bg-gray-50 mx-6" />

                                    {/* ── PAYMENT ACTION BOLLARD (Switch to UPI / Pay Now) ───── */}
                                    {order.paymentStatus === 'PENDING' && order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
                                        <div className="mx-6 mb-4 p-4 rounded-2xl bg-gray-50 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                                    <CreditCard className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">
                                                        {order.paymentMethod === 'COD' ? 'Switch to UPI' : 'Complete Payment'}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-tight">
                                                        {order.paymentMethod === 'COD' ? 'Pay now to skip COD hassle' : 'Pay online to confirm your order'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-gray-900">{format(convert(order.totalAmount))}</p>
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                                                        Secure Payment
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handlePayment(order)}
                                                    disabled={!!isPaying}
                                                    className="bg-[#8a2be2] text-white px-8 py-3 rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 disabled:opacity-50"
                                                >
                                                    {isPaying === order._id ? 'Opening...' : 'Pay Now'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── PAYMENT MODE ──────────────────────── */}
                                    <div className="px-6 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                                            <span className="text-xs text-gray-500">Your payment mode:</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-800">
                                            {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod} · {format(convert(order.totalAmount))}
                                        </span>
                                    </div>

                                    {/* ── DIVIDER ───────────────────────────── */}
                                    <div className="h-px bg-gray-50 mx-6" />

                                    {/* ── DELIVERY ADDRESS ──────────────────── */}
                                    {addr && (
                                        <div className="px-6 py-3 flex items-start gap-2">
                                            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Delivery Address</p>
                                                <p className="text-xs text-gray-700 leading-relaxed truncate">
                                                    {[addr.firstName, addr.lastName].filter(Boolean).join(' ')}{addr.firstName || addr.lastName ? ' · ' : ''}{addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── DIVIDER ───────────────────────────── */}
                                    <div className="h-px bg-gray-50 mx-6" />

                                    {/* ── ACTIONS ───────────────────────────── */}
                                    <div className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {/* Cancellation row */}
                                            {canCancel && (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-gray-400">Cancellation available till shipping</span>
                                                    <CancelButton
                                                        orderId={order._id}
                                                        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['orders', 'my-orders'] })}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Invoice download */}
                                        <button
                                            onClick={() => handleInvoiceDownload(order._id)}
                                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                            Invoice
                                        </button>
                                    </div>

                                    {/* ── ITEMS COLLAPSE (all items if >1) ──── */}
                                    {order.items.length > 1 && (
                                        <div className="border-t border-gray-50 px-6 py-4 space-y-3 bg-gray-50/40">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">All Items</p>
                                            {order.items.map((item, idx) => {
                                                const img = item.product?.images?.[0];
                                                const url = typeof img === 'string' ? img : img?.imageUrl;
                                                return (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <div className="h-10 w-8 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-gray-100">
                                                            {url ? <img src={url} className="h-full w-full object-cover" alt="" /> : <ShoppingBag className="h-4 w-4 text-gray-300 m-auto mt-1.5" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <Link to={`/product/${item.product?.slug}`} className="text-xs font-bold text-gray-900 truncate block hover:underline">
                                                                {item.product?.title || 'Product'}
                                                            </Link>
                                                            <p className="text-[10px] text-gray-400">Qty: {item.quantity}{item.size ? ` · ${item.size}` : ''}</p>
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-900">{format(convert(item.price * item.quantity))}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    /* ── EMPTY STATE ───────────────── */
                    <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="h-8 w-8 text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-serif text-gray-900 mb-2">No history yet</h2>
                        <p className="text-gray-400 mb-8 max-w-xs mx-auto">Start your collection by exploring our curated essentials.</p>
                        <Link to="/" className="inline-flex items-center space-x-2 bg-black text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all">
                            <span>Browse Shop</span>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
