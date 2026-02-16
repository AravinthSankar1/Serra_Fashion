import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../hooks/useCurrency';
import type { Product } from '../types';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard';
import Reviews from '../components/product/Reviews';
import ImageGalleryLightbox from '../components/product/ImageGalleryLightbox';
import SizeGuideModal from '../components/product/SizeGuideModal';
import { ShoppingBag, ChevronLeft, Star, Truck, RefreshCcw, Loader2, Heart, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function ProductDetailsPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart, setIsCartOpen } = useCart();
    const { user, toggleWishlist } = useAuth();
    const { format, convert } = useCurrency();
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', slug],
        queryFn: async () => {
            const res = await api.get(`/products/${slug}`);
            return res.data.data as Product & { variants?: { size: string }[] };
        }
    });

    const { data: relatedProducts } = useQuery({
        queryKey: ['related', product?._id],
        enabled: !!product?._id,
        queryFn: async () => {
            const res = await api.get(`/products/${product?._id}/related`);
            return res.data.data as Product[];
        }
    });

    const isLiked = user?.wishlist?.includes(product?._id || '');

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-gray-200" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Fetching Product Details</span>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                    <h2 className="text-3xl font-serif text-gray-900 italic">Piece Not Found</h2>
                    <p className="mt-4 text-gray-500">The collection item you are looking for does not exist.</p>
                    <Button onClick={() => navigate('/')} className="mt-8 mx-auto">Back to Collection</Button>
                </div>
            </div>
        );
    }

    // Use variants from product if they exist, otherwise use defaults
    const availableSizes = product.variants && product.variants.length > 0
        ? [...new Set(product.variants.map(v => v.size))].filter(Boolean) as string[]
        : ['XS', 'S', 'M', 'L', 'XL'];

    const handleAddToCart = async () => {
        if (!selectedSize) {
            toast.error('Please select a size');
            return;
        }

        setIsAdding(true);
        try {
            await addToCart(product, quantity, selectedSize);
            setIsCartOpen(true);
            toast.success(`Added ${product.title} to bag`, {
                position: "bottom-right",
                autoClose: 2000,
                hideProgressBar: true,
                theme: "dark",
            });
        } catch (err) {
            toast.error('Failed to add item to bag');
        } finally {
            setIsAdding(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: product.title,
            text: `Check out ${product.title} on SÉRRA FASHION`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: Copy to clipboard
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!', {
                    position: "bottom-right",
                    autoClose: 2000,
                    theme: "dark",
                });
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    // Find selected variant
    const selectedVariant = product.variants?.find(v => v.size === selectedSize);
    const currentPrice = selectedVariant ? selectedVariant.price : (product.finalPrice || product.basePrice);
    const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
    const isOutOfStock = currentStock <= 0;

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-12 transition-colors group"
                >
                    <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Collection</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24">
                    {/* Left: Images */}
                    <div>
                        <ImageGalleryLightbox
                            images={product.images}
                            productTitle={product.title}
                        />
                    </div>

                    {/* Right: Info */}
                    <div className="flex flex-col">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                                            {product.brand.name}
                                        </span>
                                        <span className="h-1 w-1 bg-gray-200 rounded-full"></span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                                            {product.category.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleShare}
                                        className="p-2.5 hover:bg-gray-50 rounded-full transition-colors group touch-target"
                                        aria-label="Share product"
                                    >
                                        <Share2 className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
                                    </button>
                                </div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight">
                                    {product.title}
                                </h1>
                                <div className="flex items-center space-x-1 text-amber-500 pt-2">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-3 w-3 fill-current" />)}
                                    <span className="text-[10px] font-bold text-gray-400 ml-2">(48 Reviews)</span>
                                </div>
                            </div>

                            <div className="flex items-baseline space-x-4 pt-4 border-t border-gray-50">
                                <span className="text-3xl font-bold text-gray-900">
                                    {format(convert(currentPrice))}
                                </span>
                                {product.discountPercentage > 0 && !selectedVariant && (
                                    <>
                                        <span className="text-xl text-gray-400 line-through">
                                            {format(convert(product.basePrice))}
                                        </span>
                                        <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
                                            Save {product.discountPercentage}%
                                        </span>
                                    </>
                                )}
                            </div>

                            <p className="text-gray-600 text-lg leading-relaxed font-light font-serif italic">
                                "{product.description}"
                            </p>

                            {/* Options */}
                            <div className="space-y-10 pt-10">
                                {/* Size Selection */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                        <span className="text-gray-900">Select Size</span>
                                        <button
                                            type="button"
                                            onClick={() => setIsSizeGuideOpen(true)}
                                            className="text-gray-400 hover:text-black underline underline-offset-4 transition-colors"
                                        >
                                            Size Guide
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {availableSizes.map(size => {
                                            const v = product.variants?.find(variant => variant.size === size);
                                            const disabled = v && v.stock <= 0;
                                            return (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    disabled={disabled}
                                                    className={`h-12 w-16 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 relative ${selectedSize === size
                                                        ? 'bg-black text-white shadow-xl shadow-black/20'
                                                        : disabled
                                                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed decoration-slice'
                                                            : 'bg-white border border-gray-100 text-gray-400 hover:border-black hover:text-black'
                                                        }`}
                                                >
                                                    {size}
                                                    {disabled && (
                                                        <span className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-full h-px bg-gray-300 rotate-45 transform origin-center" />
                                                        </span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-4 pt-4">
                                    <div className="flex items-center space-x-4 bg-gray-50 rounded-[28px] px-6 h-16">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={isOutOfStock}
                                            className="hover:text-black transition-colors disabled:opacity-50"
                                        >
                                            <MinusIcon />
                                        </button>
                                        <span className="text-base font-bold w-4 text-center">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                                            disabled={isOutOfStock || quantity >= currentStock}
                                            className="hover:text-black transition-colors disabled:opacity-50"
                                        >
                                            <PlusIcon />
                                        </button>
                                    </div>
                                    <Button
                                        onClick={handleAddToCart}
                                        disabled={isAdding || isOutOfStock}
                                        className="flex-1 h-16 rounded-[28px] shadow-xl shadow-black/10 group bg-black disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                                    >
                                        {isAdding ? (
                                            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                                        ) : isOutOfStock ? (
                                            <span className="text-base">Out of Stock</span>
                                        ) : (
                                            <>
                                                <ShoppingBag className="h-5 w-5 mr-3 group-hover:rotate-12 transition-transform" />
                                                <span className="text-base">Add to Bag</span>
                                            </>
                                        )}
                                    </Button>
                                    <button
                                        onClick={() => toggleWishlist(product._id)}
                                        className={`h-16 w-16 rounded-[28px] flex items-center justify-center transition-all duration-300 border ${isLiked
                                            ? 'bg-red-50 border-red-100 text-red-500'
                                            : 'bg-white border-gray-100 text-gray-400 hover:border-black hover:text-black'
                                            }`}
                                    >
                                        <Heart className={`h-6 w-6 ${isLiked ? 'fill-current' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Value Props */}
                            <div className="grid grid-cols-2 gap-4 pt-12 border-t border-gray-50 mt-12">
                                <div className="flex items-center space-x-3 p-4 rounded-3xl bg-gray-50/50">
                                    <Truck className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Complimentary</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Shipping on orders over ₹15,000</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-4 rounded-3xl bg-gray-50/50">
                                    <RefreshCcw className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Reflective Returns</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">30-day effortless exchange</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {
                    relatedProducts && relatedProducts.length > 0 && (
                        <div className="mt-32 border-t border-gray-100 pt-24">
                            <div className="flex items-center justify-between mb-12">
                                <h2 className="text-3xl font-serif font-bold text-gray-900">Wear it with</h2>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                {relatedProducts.map(p => (
                                    <ProductCard key={p._id} product={p} />
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* Reviews */}
                <div className="mt-32 max-w-4xl border-t border-gray-100 pt-24">
                    <Reviews productId={product._id} />
                </div>
            </main>

            {/* Size Guide Modal */}
            <SizeGuideModal
                isOpen={isSizeGuideOpen}
                onClose={() => setIsSizeGuideOpen(false)}
                sizeGuide={product.sizeGuide as any}
            />
        </div>
    );
}

function MinusIcon() {
    return <svg width="12" height="2" viewBox="0 0 12 2" fill="none" className="h-3 w-3"><path d="M11 1H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}

function PlusIcon() {
    return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="h-3 w-3"><path d="M6 1V11M11 6H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
}
