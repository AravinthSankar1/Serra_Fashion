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
        <div className="w-full bg-white group pt-[80px] md:pt-[104px]">
            <section 
                className="relative w-full h-[65vh] md:h-auto md:aspect-[21/9] bg-gray-50 overflow-hidden cursor-pointer"
                onClick={() => {
                    const link = activeSlides[current].link || '/collection';
                    if (link.startsWith('http')) {
                        window.open(link, '_blank');
                    } else {
                        navigate(link.startsWith('/') ? link : `/${link}`);
                    }
                }}
            >
                {/* Background Image - Immersive scaling with top-aligned content */}
                <img
                    key={current}
                    src={activeSlides[current].image}
                    alt={activeSlides[current].title || "Banner"}
                   className="w-full h-full object-cover md:object-contain transition-opacity duration-300"
                   style={{ objectPosition: 'center center' }}
                />

                {/* Highly subtle navigation - Out of the way */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-2 sm:px-8 z-20 pointer-events-none">
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className="pointer-events-auto h-10 w-10 sm:h-16 sm:w-16 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-8 sm:h-8" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="pointer-events-auto h-10 w-10 sm:h-16 sm:w-16 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-4 h-4 sm:w-8 sm:h-8" />
                    </button>
                </div>

                {/* Minimal Pagination - Absolute bottom */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {activeSlides.map((_: any, i: number) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                            className="group p-1"
                        >
                            <div className={`h-[1px] rounded-full transition-all duration-500 ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/50 group-hover:bg-white'
                                }`} />
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
