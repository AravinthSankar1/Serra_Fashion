import { Link } from 'react-router-dom';
import type { Product } from '../../types';
import { useCurrency } from '../../hooks/useCurrency';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function ProductCard({ product }: { product: Product }) {
    const { toggleWishlist, user } = useAuth();
    const { format, convert } = useCurrency();
    const isLiked = user?.wishlist?.includes(product._id);
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative"
        >
            {/* Image Container */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl sm:rounded-[32px] bg-gray-100">
                <Link to={`/product/${product.slug}`} className="block h-full w-full">
                    {!imageLoaded && (
                        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                    )}
                    <img
                        src={product.images[0]?.imageUrl}
                        alt={product.title}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        className={`h-full w-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                    />
                </Link>

                {/* Badges */}
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-col gap-2 z-10">
                    {product.discountPercentage > 0 && (
                        <span className="bg-white/90 backdrop-blur-sm text-black text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                            -{Math.round(product.discountPercentage)}%
                        </span>
                    )}
                    {product.stock <= 5 && product.stock > 0 && (
                        <span className="bg-amber-500/90 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-black px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                            Only {product.stock} Left
                        </span>
                    )}
                </div>

                {/* Wishlist Button - Perfectly Centered */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product._id);
                    }}
                    className="absolute top-3 sm:top-4 right-3 sm:right-4 h-9 w-9 sm:h-10 sm:w-10 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 z-10 flex items-center justify-center"
                    aria-label="Add to wishlist"
                >
                    <Heart
                        className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
                    />
                </button>

                {/* "View Piece" Button - Always visible on mobile, hover on desktop */}
                <div className="absolute bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-4 sm:translate-y-12 sm:group-hover:translate-y-0 transition-transform duration-300">
                    <Link
                        to={`/product/${product.slug}`}
                        className="w-full h-11 sm:h-12 bg-black text-white rounded-xl sm:rounded-2xl flex items-center justify-center space-x-2 text-[11px] sm:text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-xl active:scale-[0.98]"
                    >
                        <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>View Piece</span>
                    </Link>
                </div>
            </div>

            {/* Content */}
            <div className="mt-4 sm:mt-5 px-1">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 truncate">
                            {product.brand?.name || product.category?.name || 'Serra'}
                        </p>
                        <Link
                            to={`/product/${product.slug}`}
                            className="block text-sm sm:text-sm font-bold text-gray-900 group-hover:underline line-clamp-2 leading-tight"
                        >
                            {product.title}
                        </Link>
                    </div>
                    <div className="text-right flex-shrink-0">
                        {product.discountPercentage > 0 ? (
                            <div className="flex flex-col items-end">
                                <span className="text-sm sm:text-sm font-bold text-red-600 whitespace-nowrap">{format(convert(product.finalPrice))}</span>
                                <span className="text-[10px] sm:text-[10px] text-gray-400 line-through whitespace-nowrap">{format(convert(product.basePrice))}</span>
                            </div>
                        ) : (
                            <span className="text-sm sm:text-sm font-bold text-gray-900 whitespace-nowrap">{format(convert(product.basePrice))}</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
