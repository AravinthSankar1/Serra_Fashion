import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../api/client";
import Navbar from "../components/layout/Navbar";
import ProductCard from "../components/ui/ProductCard";
import HeroSlider from "../components/ui/HeroSlider";
import ReviewCarousel from "../components/ui/ReviewCarousel";
import Footer from "../components/layout/Footer";
import type { Product } from "../types";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import SEO from "../components/common/SEO";

export default function HomePage() {
    const observerTarget = useRef(null);

    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ["products-infinite"],
        queryFn: async ({ pageParam = 1 }) => {
            const res = await api.get(`/products?page=${pageParam}&limit=8`);
            return res.data.data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    return (
        <div className="min-h-screen bg-white">
            <SEO
                title="SÉRRA FASHION - Luxury Fashion & Apparel"
                description="Shop the latest premium apparel and luxury fashion at SÉRRA FASHION. Discover our curated collections today."
                keywords="fashion, luxury apparel, premium clothing, serra fashion, sērra"
            />
            <Navbar />

            <HeroSlider />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-gray-900">Featured Collection</h2>
                        <p className="text-gray-500 mt-2">Discover our handpicked selection of premium pieces.</p>
                    </div>
                    <Link
                        to="/collection"
                        className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
                    >
                        View All
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="animate-pulse space-y-4">
                                <div className="aspect-[3/4] bg-gray-100 rounded-2xl" />
                                <div className="h-4 bg-gray-100 w-3/4 rounded-full" />
                                <div className="h-4 bg-gray-100 w-1/4 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 sm:gap-8">
                            {infiniteData?.pages.flatMap(page => page.products).map((product: Product) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                        
                        {(!infiniteData || infiniteData.pages[0].products.length === 0) && (
                            <div className="text-center py-24 bg-gray-50 rounded-[32px]">
                                <p className="text-gray-400 font-serif italic uppercase tracking-widest text-sm">
                                    Our latest pieces are arriving soon.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Observer Target */}
                <div ref={observerTarget} className="h-20 mt-10 flex items-center justify-center">
                    {isFetchingNextPage && (
                        <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    )}
                </div>

                {/* Review Carousel Section */}
                <div className="mt-32 border-t border-gray-100 pt-24">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-serif font-bold text-gray-900">What Our Clients Say</h2>
                        <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Experience the excellence through the eyes of our valued customers.</p>
                    </div>
                    <ReviewCarousel />
                </div>
            </main>

            <Footer />
        </div>
    );
}
