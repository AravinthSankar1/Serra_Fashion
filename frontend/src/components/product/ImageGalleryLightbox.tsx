import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ImageGalleryLightboxProps {
    images: { imageUrl: string; imagePublicId: string }[];
    productTitle: string;
}

export default function ImageGalleryLightbox({ images, productTitle }: ImageGalleryLightboxProps) {
    const [selectedImage, setSelectedImage] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const openLightbox = (index: number) => {
        setSelectedImage(index);
        setIsLightboxOpen(true);
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
        document.body.style.overflow = 'unset';
    };

    const nextImage = () => {
        setSelectedImage((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
    };

    // Touch/Swipe handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 75) {
            // Swipe left - next image
            nextImage();
        }
        if (touchStart - touchEnd < -75) {
            // Swipe right - prev image
            prevImage();
        }
    };

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isLightboxOpen) return;
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') closeLightbox();
    };

    // Attach keyboard listener
    useState(() => {
        window.addEventListener('keydown', handleKeyDown as any);
        return () => window.removeEventListener('keydown', handleKeyDown as any);
    });

    return (
        <>
            {/* Main Product Image Gallery */}
            <div className="space-y-4">
                {/* Main Image */}
                <div
                    className="relative aspect-[3/4] sm:aspect-square overflow-hidden rounded-3xl bg-gray-100 cursor-zoom-in group"
                    onClick={() => openLightbox(selectedImage)}
                >
                    <img
                        src={images[selectedImage]?.imageUrl}
                        alt={`${productTitle} - Image ${selectedImage + 1}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ opacity: 1, scale: 1 }}
                            className="hidden sm:flex items-center justify-center h-14 w-14 bg-white/90 backdrop-blur-sm rounded-full shadow-xl"
                        >
                            <ZoomIn className="h-6 w-6 text-black" />
                        </motion.div>
                    </div>
                    {/* Mobile Zoom Indicator */}
                    <div className="sm:hidden absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-white text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                        <ZoomIn className="h-3 w-3" />
                        <span>Tap to Zoom</span>
                    </div>
                </div>

                {/* Thumbnail Gallery */}
                <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`aspect-square overflow-hidden rounded-2xl transition-all ${selectedImage === idx
                                ? 'ring-2 ring-black ring-offset-2 scale-105'
                                : 'hover:ring-2 hover:ring-gray-300 opacity-60 hover:opacity-100'
                                }`}
                        >
                            <img
                                src={img.imageUrl}
                                alt={`${productTitle} thumbnail ${idx + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm"
                    >
                        {/* Header */}
                        <div className="absolute top-0 inset-x-0 h-16 sm:h-20 bg-gradient-to-b from-black/50 to-transparent z-10 flex items-center justify-between px-4 sm:px-8">
                            <div className="text-white">
                                <p className="text-xs sm:text-sm font-bold uppercase tracking-widest">{productTitle}</p>
                                <p className="text-[10px] sm:text-xs text-white/60 font-medium">
                                    Image {selectedImage + 1} of {images.length}
                                </p>
                            </div>
                            <button
                                onClick={closeLightbox}
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors touch-target"
                                aria-label="Close lightbox"
                            >
                                <X className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </button>
                        </div>

                        {/* Main Image Container */}
                        <div
                            className="h-full w-full flex items-center justify-center p-4 sm:p-16"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <motion.img
                                key={selectedImage}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                src={images[selectedImage]?.imageUrl}
                                alt={`${productTitle} - Image ${selectedImage + 1}`}
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>

                        {/* Navigation Arrows - Desktop */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm items-center justify-center transition-colors z-20"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="h-7 w-7 text-white" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm items-center justify-center transition-colors z-20"
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="h-7 w-7 text-white" />
                                </button>
                            </>
                        )}

                        {/* Thumbnail Strip - Bottom */}
                        <div className="absolute bottom-0 inset-x-0 h-24 sm:h-28 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center px-4 sm:px-8 overflow-x-auto scrollbar-hide">
                            <div className="flex space-x-2 sm:space-x-3">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden flex-shrink-0 transition-all ${selectedImage === idx
                                            ? 'ring-2 ring-white scale-110'
                                            : 'opacity-40 hover:opacity-100'
                                            }`}
                                    >
                                        <img
                                            src={img.imageUrl}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence >
        </>
    );
}
