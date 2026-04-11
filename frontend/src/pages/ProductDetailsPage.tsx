import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../hooks/useCurrency';
import type { Product } from '../types';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import ProductCard from '../components/ui/ProductCard';
import Reviews from '../components/product/Reviews';
import ImageGalleryLightbox from '../components/product/ImageGalleryLightbox';
import SizeGuideModal from '../components/product/SizeGuideModal';
import { ShoppingBag, ChevronLeft, Star, Truck, RefreshCcw, Loader2, Heart, Share2, Tag, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { toast } from 'react-toastify';
import SEO from '../components/common/SEO';
import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { PixelEvents } from '../components/common/MetaPixelHelper';

// Map common color names to CSS hex values
const COLOR_MAP: Record<string, string> = {
    black: '#000000', white: '#FFFFFF', red: '#E53E3E', blue: '#3182CE',
    green: '#38A169', grey: '#718096', gray: '#718096', navy: '#1A365D',
    pink: '#ED64A6', yellow: '#D69E2E', orange: '#DD6B20', purple: '#805AD5',
    maroon: '#7B341E', brown: '#744210', beige: '#D4A574', cyan: '#00BCD4',
    teal: '#319795', mint: '#68D391', lavender: '#B794F4', coral: '#FC8181',
    cream: '#FAF0E6', charcoal: '#2D3748', khaki: '#BDB76B', olive: '#808000',
};

function getColorCode(name: string, fallback?: string): string {
    if (fallback && fallback.startsWith('#')) return fallback;
    const key = name.toLowerCase().replace(/\s+/g, '');
    return COLOR_MAP[key] || fallback || '#e5e7eb';
}

export default function ProductDetailsPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart, setIsCartOpen } = useCart();
    const { user, toggleWishlist } = useAuth();
    const { format, convert } = useCurrency();
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', slug],
        queryFn: async () => {
            const res = await api.get(`/products/${slug}`);
            return res.data.data as Product;
        }
    });

    const { data: storeSettings } = useQuery({
        queryKey: ['store-settings'],
        queryFn: async () => {
            const res = await api.get('/settings');
            return res.data.data;
        }
    });

    const { data: reviews } = useQuery({
        queryKey: ['reviews', product?._id],
        enabled: !!product?._id,
        queryFn: async () => {
            const res = await api.get(`/products/${product?._id}/reviews`);
            return res.data.data;
        }
    });

    // ... (related products query same)

    const { data: relatedProducts } = useQuery({
        queryKey: ['related', product?._id],
        enabled: !!product?._id,
        queryFn: async () => {
            const res = await api.get(`/products/${product?._id}/related`);
            return res.data.data as Product[];
        }
    });

    // Fire Meta Pixel ViewContent event and add to Recently Viewed when product loads
    useEffect(() => {
        if (product && user) {
            PixelEvents.viewContent(
                product.title,
                product._id,
                product.finalPrice || product.basePrice
            );
            
            // Add to recently viewed on backend
            api.post(`/user/recently-viewed/${product._id}`).catch(err => {
                console.error('Failed to add to recently viewed:', err);
            });
        }
    }, [product?._id, user?._id]);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    if (error || !product) return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading product</div>;

    const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
        "image": product.images?.map(img => typeof img === 'string' ? img : img.imageUrl),
        "description": product.description,
        "sku": product._id, // Product interface doesn't have sku, use _id
        "brand": {
            "@type": "Brand",
            "name": typeof product.brand === 'object' ? (product.brand as any).name : "SÉRRA FASHION"
        },
        "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "INR",
            "price": product.basePrice,
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
        }
    };

    // Use variants from product if they exist
    const hasVariants = product.variants && product.variants.length > 0;

    // Get unique colors with their hex codes
    const availableColors = hasVariants
        ? Array.from(
            product.variants!
                .reduce((acc, v) => {
                    if (v.color && !acc.has(v.color)) {
                        acc.set(v.color, (v as any).colorCode || '');
                    }
                    return acc;
                }, new Map<string, string>())
                .entries()
        ).map(([name, code]) => ({ name, code }))
        : [];

    // Get sizes based on selected color (if colors exist), otherwise all sizes
    const availableSizes = hasVariants
        ? [...new Set(
            product.variants!
                .filter(v => !selectedColor || v.color === selectedColor)
                .map(v => v.size)
                .filter(Boolean)
        )] as string[]
        : [];

    const handleAddToCart = async () => {
        if (hasVariants) {
            if (availableColors.length > 0 && !selectedColor) {
                toast.error('Please select a color');
                return;
            }
            if (availableSizes.length > 0 && !selectedSize) {
                toast.error('Please select a size');
                return;
            }
        }

        setIsAdding(true);
        try {
            // Construct cart item - if backend expects variantId, pass it.
            // The addToCart context probably handles it.
            // Assuming addToCart signature: (product, quantity, size, color)

            // We need to check useCart signature.
            // In step 52 line 86: await addToCart(product, quantity, selectedSize);
            // I should update it to pass color too.
            await addToCart(product, quantity, selectedSize, selectedColor);

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

    // ... (handleShare same)
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: product.title,
                text: product.description,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.info('Product link copied to clipboard!');
        }
    };

    // Find selected variant for price/stock/image
    const selectedVariant = product.variants?.find(v =>
        (!selectedColor || v.color === selectedColor) &&
        (!selectedSize || v.size === selectedSize)
    );

    // Image logic: if a color is selected and that variant has an image, put it first
    const variantSpecificImage = product.variants?.find(v => v.color === selectedColor && v.variantImage?.imageUrl)?.variantImage;

    const displayImages = variantSpecificImage?.imageUrl
        ? [variantSpecificImage, ...product.images.filter(img => img.imageUrl !== variantSpecificImage.imageUrl)]
        : product.images && product.images.length > 0
            ? product.images
            : [{ imageUrl: "https://via.placeholder.com/600x800?text=No+Image", imagePublicId: "placeholder" }];

    const getDisplayPrice = () => {
        let price = selectedVariant ? selectedVariant.price : (product.finalPrice || product.basePrice || 0);

        // If a variant is selected, we need to manually apply the discount if it exists
        // because variants currently only store their base price.
        if (selectedVariant && product.discountPercentage > 0) {
            return Math.round(price - (price * product.discountPercentage) / 100);
        }

        return price;
    };

    const currentPrice = getDisplayPrice();
    const currentStock = selectedVariant ? selectedVariant.stock : (product.stock || 0);
    const isOutOfStock = currentStock <= 0;

    const isLiked = user?.wishlist?.includes(product._id || '');

    const applicableQuantityDiscounts = storeSettings?.quantityDiscounts?.filter(
        (rule: any) => !rule.categoryId || rule.categoryId === (typeof product.category === 'object' ? (product.category as any)._id : product.category)
    ) || [];

    return (
        <div className="min-h-screen bg-white">
            <SEO
                title={product.title}
                description={product.description?.slice(0, 160)}
                image={typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0].imageUrl}
                type="product"
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify(schemaData)}
                </script>
            </Helmet>
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 pt-24 pb-12 md:pt-32 md:pb-20">
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
                            key={selectedColor} // Force re-render gallery when color changes to show variant image
                            images={displayImages}
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
                                            {product.brand?.name || 'Brand'}
                                        </span>
                                        <span className="h-1 w-1 bg-gray-200 rounded-full"></span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                                            {product.category?.name || 'Category'}
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
                                    <span className="text-[10px] font-bold text-gray-400 ml-2">
                                        ({reviews?.length || 0} Reviews)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-baseline space-x-4 pt-4 border-t border-gray-50">
                                <span className="text-3xl font-bold text-gray-900">
                                    {format(convert(currentPrice))}
                                </span>
                                {product.discountPercentage > 0 && (
                                    <>
                                        <span className="text-xl text-gray-400 line-through">
                                            {format(convert(selectedVariant ? selectedVariant.price : product.basePrice))}
                                        </span>
                                        <span className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
                                            Save {product.discountPercentage}%
                                        </span>
                                    </>
                                )}
                            </div>

                            <p className="text-gray-600 text-lg leading-relaxed font-light font-serif">
                                "{product.description}"
                            </p>

                            {/* Options */}
                            <div className="space-y-10 pt-10">
                                {/* Color Selection */}
                                {availableColors.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                            <span className="text-gray-900">Select Color: <span className="text-gray-500">{selectedColor}</span></span>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            {availableColors.map(color => (
                                                <button
                                                    key={color.name}
                                                    onClick={() => { setSelectedColor(color.name); setSelectedSize(''); }}
                                                    className={`group relative flex flex-col items-center gap-2 transition-all duration-300`}
                                                    title={color.name}
                                                >
                                                    <div className={`h-12 w-12 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${selectedColor === color.name ? 'border-black scale-110 shadow-lg' : 'border-transparent hover:border-gray-300'}`}>
                                                        <div
                                                            className="h-10 w-10 rounded-full shadow-inner"
                                                            style={{
                                                                backgroundColor: getColorCode(color.name, color.code),
                                                                border: getColorCode(color.name, color.code) === '#FFFFFF' ? '1px solid #e5e7eb' : 'none'
                                                            }}
                                                        />
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${selectedColor === color.name ? 'text-black' : 'text-gray-400'}`}>
                                                        {color.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Size Selection */}
                                {(availableSizes.length > 0 || hasVariants) && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                                            <span className="text-gray-900">Select Size</span>
                                            {product.sizeGuide && typeof product.sizeGuide === 'object' && product.sizeGuide._id && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsSizeGuideOpen(true)}
                                                    className="text-gray-400 hover:text-black underline underline-offset-4 transition-colors"
                                                >
                                                    Size Guide
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {availableSizes.length > 0 ? availableSizes.map(size => {
                                                const v = product.variants?.find(variant =>
                                                    variant.size === size &&
                                                    (!selectedColor || variant.color === selectedColor)
                                                );
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
                                            }) : (
                                                <p className="text-sm text-gray-400">No sizes available for this color.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Offers Callout */}
                                {applicableQuantityDiscounts.length > 0 && (
                                    <div className="space-y-4 pt-6 border-t border-gray-50">
                                        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                                            <Tag className="h-3.5 w-3.5" />
                                            <span>Bulk Purchase Offers</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {applicableQuantityDiscounts
                                                .sort((a: any, b: any) => a.minQuantity - b.minQuantity)
                                                .map((rule: any, idx: number) => {
                                                    const isMet = quantity >= rule.minQuantity;
                                                    return (
                                                        <div 
                                                            key={idx}
                                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                                                                isMet 
                                                                ? 'bg-blue-50/50 border-blue-100 shadow-sm' 
                                                                : 'bg-gray-50/30 border-gray-100 opacity-60'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                                                                    isMet ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                                                                }`}>
                                                                    {isMet ? <Check className="h-4 w-4" /> : rule.minQuantity}
                                                                </div>
                                                                <div>
                                                                    <p className={`text-sm font-bold ${isMet ? 'text-blue-900' : 'text-gray-500'}`}>
                                                                        Buy {rule.minQuantity}+ Items
                                                                    </p>
                                                                    <p className="text-[10px] uppercase font-black tracking-widest text-blue-600/70">
                                                                        Get {rule.discountPercentage}% Instant Discount
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {isMet && (
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Applied</p>
                                                                    <p className="text-xs font-bold text-blue-900">
                                                                        Save {format(convert(Math.round((currentPrice * quantity * rule.discountPercentage) / 100)))}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                        {!applicableQuantityDiscounts.some((r: any) => quantity >= r.minQuantity) && (
                                            <p className="text-[10px] font-bold text-blue-500/80 uppercase tracking-widest text-center mt-2 italic">
                                                Add {Math.min(...applicableQuantityDiscounts.map((r: any) => r.minQuantity)) - quantity} more to unlock bulk savings
                                            </p>
                                        )}
                                    </div>
                                )}

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
                                                <div className="flex flex-col items-start">
                                                    <span className="text-base">Add to Bag</span>
                                                    {applicableQuantityDiscounts.some((r: any) => quantity >= r.minQuantity) && (
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-white/60 -mt-1">
                                                            Bulk Discount Included
                                                        </span>
                                                    )}
                                                </div>
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

                            {/* Shipping & Returns — Dynamic */}
                            <div className="grid grid-cols-2 gap-4 pt-12 border-t border-gray-50 mt-12">
                                <div className="flex items-center space-x-3 p-4 rounded-3xl bg-gray-50/50">
                                    <Truck className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Free Shipping</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                            {storeSettings
                                                ? `On orders over ${format(convert(storeSettings.freeShippingThreshold))} • ${format(convert(storeSettings.deliveryCharge))} otherwise`
                                                : 'Loading...'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-4 rounded-3xl bg-gray-50/50">
                                    <RefreshCcw className="h-5 w-5 text-gray-400" />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Returns & Exchange</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                            {storeSettings ? `${storeSettings.returnPolicy} • ${storeSettings.exchangePolicy}` : '...'}
                                        </p>
                                    </div>
                                </div>
                                {product.isCodAvailable !== false && (
                                    <div className="flex items-center space-x-3 p-4 rounded-3xl bg-emerald-50/50 border border-emerald-100 col-span-2">
                                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Cash on Delivery Available</p>
                                    </div>
                                )}
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

            <Footer />

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
