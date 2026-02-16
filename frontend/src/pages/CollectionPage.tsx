import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import Navbar from "../components/layout/Navbar";
import ProductCard from "../components/ui/ProductCard";
import FilterSidebar from "../components/filters/FilterSidebar";
import ActiveFilters from "../components/filters/ActiveFilters";
import { ProductGridSkeleton } from "../components/ui/Skeletons";
import type { Product } from "../types";
import { SlidersHorizontal, Grid3x3, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function CollectionPage({ title, gender, isSale }: { title: string; gender?: string; isSale?: boolean }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [gridSize, setGridSize] = useState<3 | 4>(4); // 3 or 4 columns
    const observerTarget = useRef(null);

    // Extract filters from URL
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "createdAt-desc";
    const brand = searchParams.get("brand");
    const sizes = searchParams.get("sizes");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const q = searchParams.get("q");

    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ["products", gender, category, brand, sizes, sort, minPrice, maxPrice, q],
        queryFn: async ({ pageParam = 1 }) => {
            const params: any = { sort, page: pageParam, limit: 12 };
            if (gender) params.gender = gender;
            if (isSale) params.sale = 'true';
            if (category) params.category = category;
            if (brand) params.brand = brand;
            if (sizes) params.sizes = sizes;
            if (minPrice) params.minPrice = minPrice;
            if (maxPrice) params.maxPrice = maxPrice;
            if (q) params.search = q;

            const res = await api.get("/products", { params });
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

    const { data: categoriesData } = useQuery({
        queryKey: ["admin", "categories"],
        queryFn: async () => {
            const res = await api.get('/categories');
            return res.data.data as any[];
        }
    });

    const { data: brandsData } = useQuery({
        queryKey: ["admin", "brands"],
        queryFn: async () => {
            const res = await api.get('/brands');
            return res.data.data as any[];
        }
    });

    const handleSortChange = (newSort: string) => {
        searchParams.set("sort", newSort);
        setSearchParams(searchParams);
    };

    const activeCategory = categoriesData?.find(c => c._id === category);
    const displayTitle = q ? `Search: ${q}` : (activeCategory ? activeCategory.name : title);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <header className="pt-20 pb-10 border-b border-gray-50 bg-gradient-to-b from-gray-50/50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-gray-900"
                    >
                        {displayTitle}
                    </motion.h1>
                    <p className="mt-4 text-gray-500 uppercase tracking-[0.3em] text-xs font-semibold">
                        {q ? 'Search Results' : 'Curated Collection'}
                    </p>
                    {infiniteData && !isLoading && (
                        <p className="mt-2 text-gray-400 text-sm">
                            {infiniteData.pages[0].total} {infiniteData.pages[0].total === 1 ? 'piece' : 'pieces'} found
                        </p>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center space-x-2 text-sm font-bold uppercase tracking-widest hover:text-gray-600 transition-colors px-4 py-2 rounded-xl hover:bg-gray-50"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="hidden sm:inline">Filter & Refine</span>
                        <span className="sm:hidden">Filters</span>
                        {(category || brand || sizes || minPrice || maxPrice) && (
                            <span className="ml-2 px-2 py-0.5 bg-black text-white text-[10px] font-black rounded-full">
                                {[category, brand, sizes?.split(',').length, minPrice || maxPrice].filter(Boolean).length}
                            </span>
                        )}
                    </button>

                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                        {/* Grid Size Toggle - Hidden on mobile */}
                        <div className="hidden md:flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
                            <button
                                onClick={() => setGridSize(3)}
                                className={`p-2 rounded transition-colors ${gridSize === 3 ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                                title="3 columns"
                            >
                                <Grid3x3 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setGridSize(4)}
                                className={`p-2 rounded transition-colors ${gridSize === 4 ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
                                title="4 columns"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                        </div>

                        <select
                            value={sort}
                            onChange={(e) => handleSortChange(e.target.value)}
                            className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-widest border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer bg-white"
                        >
                            <option value="createdAt-desc">Newest</option>
                            <option value="finalPrice-asc">Price: Low to High</option>
                            <option value="finalPrice-desc">Price: High to Low</option>
                            <option value="title-asc">Name: A-Z</option>
                            <option value="title-desc">Name: Z-A</option>
                        </select>
                    </div>
                </div>

                {/* Active Filters */}
                <ActiveFilters
                    searchParams={searchParams}
                    setSearchParams={setSearchParams}
                    categoriesData={categoriesData}
                    brandsData={brandsData}
                />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Sidebar Filters */}
                    <AnimatePresence>
                        {isFilterOpen && (
                            <FilterSidebar
                                isOpen={isFilterOpen}
                                onClose={() => setIsFilterOpen(false)}
                                searchParams={searchParams}
                                setSearchParams={setSearchParams}
                                gender={gender}
                            />
                        )}
                    </AnimatePresence>

                    {/* Product Grid */}
                    <div className={isFilterOpen ? 'lg:col-span-3' : 'lg:col-span-4'}>
                        {isLoading ? (
                            <ProductGridSkeleton count={isFilterOpen ? 9 : 12} />
                        ) : (
                            <>
                                <motion.div
                                    layout
                                    className={`grid ${isFilterOpen
                                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                        : `grid-cols-2 md:grid-cols-${gridSize === 3 ? '3' : '3'} lg:grid-cols-${gridSize}`
                                        } gap-6 sm:gap-8`}
                                >
                                    {infiniteData?.pages.map((page: any) => (
                                        page.products.map((product: Product) => (
                                            <ProductCard key={product._id} product={product} />
                                        ))
                                    ))}
                                </motion.div>

                                {/* Observer Target */}
                                <div ref={observerTarget} className="h-10 mt-10 flex items-center justify-center">
                                    {isFetchingNextPage && (
                                        <div className="flex space-x-2">
                                            <div className="w-2 h-2 bg-black rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
