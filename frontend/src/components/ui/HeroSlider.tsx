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

    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
    const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 75) nextSlide();
        if (touchStart - touchEnd < -75) prevSlide();
    };

    if (isLoading) return <div className="w-full bg-white pt-[80px] md:pt-[104px]"><div className="w-full aspect-[21/9] sm:aspect-video bg-gray-100 animate-pulse" /></div>;

    return (
        <div className="w-full bg-white group pt-[80px] md:pt-[104px]">
            <section 
                className="relative w-full h-auto bg-gray-50 overflow-hidden cursor-pointer"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                    const link = activeSlides[current].link || '/collection';
                    if (link.startsWith('http')) {
                        window.open(link, '_blank');
                    } else {
                        navigate(link.startsWith('/') ? link : `/${link}`);
                    }
                }}
            >
                {/* Background Image - Absolute 1:1 scaling to match laptop view without any cropping */}
                <img
                    key={current}
                    src={activeSlides[current].image}
                    alt={activeSlides[current].title || "Banner"}
                    className="w-full h-auto block transition-opacity duration-300"
                />

                {/* Highly subtle navigation arrows - Center relative to image height */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-2 sm:px-8 z-20 pointer-events-none">
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        className="pointer-events-auto h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white transition-all md:opacity-0 md:group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        className="pointer-events-auto h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white transition-all md:opacity-0 md:group-hover:opacity-100"
                    >
                        <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Minimal Pagination - Absolute bottom of the image area */}
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {activeSlides.map((_: any, i: number) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                            className="p-1"
                        >
                            <div className={`h-[2px] transition-all duration-500 rounded-full ${i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
