import { useState, useEffect } from "react";

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

    if (isLoading) return <div className="w-full bg-white pt-[80px] md:pt-[104px]"><div className="w-full aspect-[21/9] sm:aspect-video bg-gray-100 animate-pulse" /></div>;

    return (
        <div className="w-full bg-white pt-[80px] md:pt-[104px]">
            <section className="relative w-full cursor-pointer group"
                onClick={() => {
                    const link = activeSlides[current].link || '/collection';
                    if (link.startsWith('http')) {
                        window.open(link, '_blank');
                    } else {
                        navigate(link.startsWith('/') ? link : `/${link}`);
                    }
                }}
            >
                {/* Background Image - Absolute scaling to match laptop 1:1 ratio */}
                <img
                    key={current}
                    src={activeSlides[current].image}
                    alt={activeSlides[current].title || "Banner"}
                    className="w-full h-auto block transition-opacity duration-300"
                />

                {/* Navigation Arrows - Smaller on mobile to avoid overlap */}
                <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-16 sm:w-16 rounded-full bg-black/10 hover:bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all group z-20"
                >
                    <ChevronLeft className="w-3 h-3 sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-16 sm:w-16 rounded-full bg-black/10 hover:bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all group z-20"
                >
                    <ChevronRight className="w-3 h-3 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Simple Pagination Indicators - Adjusted for new scaling */}
                <div className="absolute bottom-4 sm:bottom-12 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-4 z-20">
                    {activeSlides.map((_: any, i: number) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                            className="group py-2 px-1 relative"
                        >
                            <div className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-6 sm:w-12 bg-white' : 'w-2 bg-white/30'
                                }`} />
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
