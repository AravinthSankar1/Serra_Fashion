import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";

const slides = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1539109132304-39149798540d?q=80&w=2574",
        title: "Spring Essentials",
        description: "Explore our latest curation of seasonal must-haves.",
        cta: "Shop Collection",
        link: "/collection"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=2572",
        title: "Modern Minimalist",
        description: "Clean lines and timeless silhouettes for the bold.",
        cta: "Explore Now",
        link: "/collection"
    }
];

export default function HeroSlider() {
    const [current, setCurrent] = useState(0);
    const navigate = useNavigate();

    const { data: banners, isLoading } = useQuery({
        queryKey: ['banners'],
        queryFn: async () => {
            const res = await api.get('/banners');
            return res.data.data;
        }
    });

    const activeSlides = banners && banners.length > 0
        ? banners.map((b: any) => ({
            id: b._id,
            image: b.image.imageUrl,
            title: b.title,
            description: b.description,
            cta: b.cta,
            link: b.link
        }))
        : slides;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % activeSlides.length);
        }, 6000); // Increased time
        return () => clearInterval(timer);
    }, [activeSlides.length]);

    const nextSlide = () => setCurrent((prev) => (prev + 1) % activeSlides.length);
    const prevSlide = () => setCurrent((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

    if (isLoading) return <div className="w-full bg-white pt-[80px] md:pt-[104px]"><div className="w-full h-auto aspect-video sm:h-[60vh] md:h-[80vh] bg-gray-100 animate-pulse" /></div>;

    return (
        <div className="w-full bg-white pt-[80px] md:pt-[104px]">
            <section className="relative w-full h-[550px] sm:h-[60vh] md:h-[80vh] overflow-hidden bg-black">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => {
                            const link = activeSlides[current].link || '/collection';
                            if (link.startsWith('http')) {
                                window.open(link, '_blank');
                            } else {
                                navigate(link.startsWith('/') ? link : `/${link}`);
                            }
                        }}
                    >
                        {/* Background Image */}
                        <div className="relative w-full h-full overflow-hidden">
                            <motion.img
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 6, ease: "linear" }}
                                src={activeSlides[current].image}
                                alt={activeSlides[current].title || "Banner"}
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay Gradients */}
                            <div className="absolute inset-0 bg-black/30" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent sm:bg-gradient-to-r sm:from-black/60 sm:via-black/20 sm:to-transparent" />
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center sm:justify-start">
                            <div className="max-w-7xl mx-auto px-6 sm:px-12 w-full">
                                <div className="max-w-xl flex flex-col items-center text-center sm:items-start sm:text-left space-y-4 sm:space-y-6">
                                    <motion.div
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.4, duration: 0.8 }}
                                    >
                                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-white">
                                            Trending Now
                                        </span>
                                    </motion.div>
                                    
                                    <motion.h1 
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.6, duration: 0.8 }}
                                        className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold text-white leading-[1.1] drop-shadow-2xl"
                                    >
                                        {activeSlides[current].title}
                                    </motion.h1>
                                    
                                    <motion.p 
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.8, duration: 0.8 }}
                                        className="text-sm sm:text-lg text-white/90 max-w-md font-medium leading-relaxed drop-shadow-lg"
                                    >
                                        {activeSlides[current].description}
                                    </motion.p>
                                    
                                    <motion.div 
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 1, duration: 0.8 }}
                                        className="pt-4 sm:pt-6"
                                    >
                                        <button className="relative group overflow-hidden h-12 sm:h-14 px-8 sm:px-10 bg-white text-black text-xs sm:text-sm font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-2xl shadow-black/40">
                                            <span className="relative z-10">{activeSlides[current].cta || 'Explore More'}</span>
                                        </button>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-16 sm:w-16 rounded-full bg-black/5 hover:bg-black/20 sm:bg-black/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all group z-20"
                >
                    <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-16 sm:w-16 rounded-full bg-black/5 hover:bg-black/20 sm:bg-black/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all group z-20"
                >
                    <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Pagination Indicators */}
                <div className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 flex gap-3 sm:gap-4 z-20">
                    {activeSlides.map((_: any, i: number) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                            className="group py-2 px-1 relative"
                        >
                            <div className={`h-1 rounded-full transition-all duration-700 ease-out ${i === current ? 'w-8 sm:w-12 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'w-2 bg-white/30 group-hover:w-4 group-hover:bg-white/60'
                                }`} />
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
