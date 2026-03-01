import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Star, User } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../api/client";

interface Review {
    _id: string;
    comment: string;
    description: string;
    rating: number;
    user: {
        name: string;
        profilePicture?: { imageUrl: string } | string;
    };
}

export default function ReviewCarousel() {
    const [current, setCurrent] = useState(0);

    const { data: reviews } = useQuery<Review[]>({
        queryKey: ["featured-reviews"],
        queryFn: async () => {
            const res = await api.get("/reviews/featured");
            return res.data.data;
        }
    });

    const activeReviews = reviews && reviews.length > 0 ? reviews : [
        {
            _id: "1",
            comment: "Exceptional Quality",
            description: "The attention to detail in the stitching and fabric is world-class. SERRA has become my go-to for minimalist luxury.",
            rating: 5,
            user: { name: "Aditi S." }
        },
        {
            _id: "2",
            comment: "Perfect Fit",
            description: "I was skeptical about ordering online, but the size guide was spot-on. The piece fits like it was tailored for me.",
            rating: 5,
            user: { name: "Rahul M." }
        },
        {
            _id: "3",
            comment: "Timeless Design",
            description: "I've received so many compliments on my recent purchase. Truly timeless silhouettes that stand out in any room.",
            rating: 5,
            user: { name: "Priya K." }
        }
    ];

    useEffect(() => {
        if (activeReviews.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % activeReviews.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [activeReviews.length]);

    return (
        <section className="bg-gray-50 py-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-serif font-bold text-gray-900">Voices of Excellence</h2>
                    <p className="text-gray-500 mt-2 font-medium tracking-wide">Trusted by individuals who appreciate the finer things.</p>
                </div>

                <div className="relative max-w-4xl mx-auto h-[350px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex flex-col items-center text-center px-6"
                        >
                            <div className="bg-white rounded-[48px] p-10 md:p-16 shadow-2xl shadow-gray-200 border border-gray-100 relative w-full">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 h-12 w-12 bg-black rounded-full flex items-center justify-center text-white shadow-xl">
                                    <Quote className="h-5 w-5" />
                                </div>

                                <div className="flex items-center justify-center space-x-1 text-amber-500 mb-8">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-4 w-4 ${i < activeReviews[current].rating ? 'fill-current' : 'text-gray-200 fill-gray-200'}`} />
                                    ))}
                                </div>

                                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6 group-hover:text-black transition-colors">
                                    "{activeReviews[current].comment}"
                                </h3>

                                <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-2xl mx-auto font-light">
                                    {activeReviews[current].description}
                                </p>

                                <div className="flex items-center justify-center space-x-3">
                                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                        {activeReviews[current].user.profilePicture ? (
                                            <img
                                                src={typeof activeReviews[current].user.profilePicture === 'string'
                                                    ? activeReviews[current].user.profilePicture
                                                    : activeReviews[current].user.profilePicture.imageUrl}
                                                className="h-full w-full object-cover"
                                                alt={activeReviews[current].user.name}
                                            />
                                        ) : (
                                            <User className="h-5 w-5 text-gray-300" />
                                        )}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                                        {activeReviews[current].user.name}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-8">
                    {activeReviews.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? 'w-10 bg-black' : 'w-2 bg-gray-200'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
