import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../hooks/useCurrency';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { cartItems, updateQuantity, removeFromCart, cartTotal, cartCount, getItemPrice } = useCart() as any;
    const { format, convert } = useCurrency();
    // Note: useCart returns cartItems which is mapped from cart or guestItems in my implementation

    // Adjusted to match the specific logic in CartContext
    const items = cartItems;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <ShoppingBag className="h-5 w-5" />
                                <h2 className="text-xl font-serif font-bold">Your Bag</h2>
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                    {cartCount} Items
                                </span>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Free Shipping Progress */}
                        {cartTotal < 150 && cartTotal > 0 && (
                            <div className="bg-gray-900 text-white text-center py-3 text-[10px] font-bold uppercase tracking-widest">
                                Spend {format(convert(150 - cartTotal))} more for free shipping
                            </div>
                        )}
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                                        <ShoppingBag className="h-10 w-10 text-gray-300" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xl font-serif font-bold text-gray-900">Your bag is empty</p>
                                        <p className="text-sm text-gray-500 max-w-[200px] mx-auto">Looks like you haven't added any pieces to your collection yet.</p>
                                    </div>
                                    <Button onClick={onClose} variant="secondary" className="mt-4 px-8">
                                        Start Shopping
                                    </Button>
                                </div>
                            ) : (
                                items.map((item: any, idx: number) => {
                                    const selectedVariant = item.product.variants?.find((v: any) =>
                                        (!item.size || v.size === item.size) &&
                                        (!item.color || v.color === item.color)
                                    );

                                    return (
                                        <div
                                            key={`${item.product._id}-${item.size}-${idx}`}
                                            className="flex gap-5 p-4 bg-white border border-gray-100 rounded-3xl hover:border-gray-200 transition-colors shadow-sm"
                                        >
                                            {/* Image */}
                                            <div className="h-36 w-28 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
                                                <img
                                                    src={typeof item.product?.images?.[0] === 'string' ? item.product.images[0] : item.product?.images?.[0]?.imageUrl}
                                                    alt={item.product?.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">
                                                            {item.product.title}
                                                        </h3>
                                                        <button
                                                            onClick={() => removeFromCart(item.product._id, item.size, item.color)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors -mr-1 p-1"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-medium truncate">{item.product.category?.name}</p>
                                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                                        {item.size && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md whitespace-nowrap">
                                                                Size {item.size}
                                                            </span>
                                                        )}
                                                        {item.color && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md whitespace-nowrap">
                                                                {item.color}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-end justify-between pt-4">
                                                    <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-2 py-1 border border-gray-100">
                                                        <button
                                                            onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.size, item.color)}
                                                            disabled={item.quantity <= 1}
                                                            className="p-1.5 hover:text-black text-gray-400 disabled:opacity-30 transition-colors"
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.size, item.color)}
                                                            className="p-1.5 hover:text-black text-gray-400 transition-colors"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        {item.product.discountPercentage > 0 ? (
                                                            <div className="flex flex-col items-end">
                                                                <p className="text-base font-bold text-red-600">
                                                                    {format(convert(getItemPrice(item) * item.quantity))}
                                                                </p>
                                                                <p className="text-[10px] text-gray-400 line-through">
                                                                    {format(convert((selectedVariant?.price || item.product.basePrice) * item.quantity))}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <p className="text-base font-bold text-gray-900">
                                                                {format(convert(getItemPrice(item) * item.quantity))}
                                                            </p>
                                                        )}
                                                        {item.quantity > 1 && (
                                                            <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                                {format(convert(getItemPrice(item)))} ea
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-gray-100 bg-white space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-500">
                                        <span>Subtotal</span>
                                        <span>{format(convert(cartTotal))}</span>
                                    </div>
                                    <div className="flex justify-between text-base font-bold text-gray-900 pt-3 border-t border-gray-50">
                                        <span className="font-serif">Total</span>
                                        <span className="text-xl">{format(convert(cartTotal))}</span>
                                    </div>
                                </div>

                                <Link to="/checkout" onClick={onClose} className="block">
                                    <Button className="w-full h-14 rounded-xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-black/5 group">
                                        <span className="group-hover:mr-2 transition-all">Proceed to Checkout</span>
                                        <ArrowRight className="h-4 w-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                                    </Button>
                                </Link>

                                <p className="text-[10px] text-center text-gray-400 font-medium">
                                    Shipping & taxes calculated at checkout
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
}
