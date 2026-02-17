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
        }, 6000);
        return () => clearInterval(timer);
    }, [activeSlides.length]);

    const nextSlide = () => setCurrent((prev) => (prev + 1) % activeSlides.length);
    const prevSlide = () => setCurrent((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

    if (isLoading) return <div className="h-[80vh] w-full bg-gray-100 animate-pulse" />;

    return (
        <section className="relative h-[80vh] w-full overflow-hidden bg-gray-100">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0"
                >
                    <img
                        src={activeSlides[current].image}
                        alt={activeSlides[current].title}
                        className="w-full h-full object-cover animate-float"
                    />
                    <div className="absolute inset-0 bg-black/30" />

                    <div className="absolute inset-0 flex items-center justify-center text-center">
                        <div className="max-w-3xl px-6">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 reveal-text"
                            >
                                {activeSlides[current].title}
                            </motion.h1>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-xl text-white/90 mb-10"
                            >
                                {activeSlides[current].description}
                            </motion.p>
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                onClick={() => navigate(activeSlides[current].link)}
                                className="bg-white text-black px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-black hover:text-white transition-all shadow-xl"
                            >
                                {activeSlides[current].cta}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
                {activeSlides.map((_: any, i: number) => (
                    <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                    />
                ))}
            </div>
        </section>
    );
}
