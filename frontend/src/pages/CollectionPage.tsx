import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import Navbar from "../components/layout/Navbar";
import ProductCard from "../components/ui/ProductCard";
import FilterSidebar from "../components/filters/FilterSidebar";
import ActiveFilters from "../components/filters/ActiveFilters";
import { ProductGridSkeleton } from "../components/ui/Skeletons";
import type { Product } from "../types";
import { SlidersHorizontal, Grid3x3, LayoutGrid, ArrowRight, ChevronRight, ShoppingBag } from "lucide-react";
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
            const isLanding = !category && !brand && !sizes && !minPrice && !maxPrice && !q;
            const params: any = { sort, page: pageParam, limit: isLanding ? 40 : 12 };
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

    // Filter categories relevant to current gender/context
    const relevantCategories = categoriesData?.filter(cat => 
        gender ? (cat.gender === gender || cat.gender === 'UNISEX') : true
    ) || [];

    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const scrollToSection = (catId: string) => {
        sectionRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

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
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center space-x-2 text-sm font-bold uppercase tracking-widest hover:text-gray-600 transition-colors px-4 py-2 rounded-xl hover:bg-gray-50 shrink-0"
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

                        {/* Flipkart Style Category Icons Nav */}
                        {!category && !q && relevantCategories.length > 0 && (
                            <div className="flex items-center space-x-8 border-l border-gray-100 pl-8 overflow-x-auto no-scrollbar scroll-smooth pr-4 py-2">
                                {relevantCategories.map(cat => (
                                    <button 
                                        key={cat._id}
                                        onClick={() => scrollToSection(cat._id)}
                                        className="flex flex-col items-center space-y-2 group shrink-0"
                                    >
                                        <div className="h-14 w-14 rounded-full bg-gray-50 border-2 border-transparent group-hover:border-black transition-all flex items-center justify-center overflow-hidden shadow-sm">
                                            {cat.image?.imageUrl ? (
                                                <img src={cat.image.imageUrl} alt={cat.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                                            ) : (
                                                <ShoppingBag className="h-6 w-6 text-gray-400" />
                                            )}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">
                                            {cat.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

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
                                {/* Sectioned View Logic */}
                                {!category && !q && !brand && !sizes && !minPrice && !maxPrice ? (
                                    <div className="space-y-16 py-8">
                                        {relevantCategories.map((cat: any) => {
                                            const catProducts = infiniteData?.pages
                                                .flatMap(p => p.products)
                                                .filter(p => p.category?._id === cat._id || p.category === cat._id)
                                                .slice(0, gridSize * 2);

                                            if (!catProducts || catProducts.length === 0) return null;

                                            return (
                                                <div 
                                                    key={cat._id} 
                                                    ref={el => sectionRefs.current[cat._id] = el}
                                                    className="scroll-mt-32 group/section"
                                                >
                                                    {/* Section Header with Arrow */}
                                                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="h-12 w-1.5 bg-black rounded-full" />
                                                            <div>
                                                                <h2 className="text-2xl font-serif font-bold text-gray-900 group-hover/section:text-black transition-colors">{cat.name}</h2>
                                                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-1">Found {catProducts.length}+ curated essentials</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => {
                                                                searchParams.set("category", cat._id);
                                                                setSearchParams(searchParams);
                                                                window.scrollTo(0, 0);
                                                            }}
                                                            className="h-10 w-10 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-black/20"
                                                            title={`View all in ${cat.name}`}
                                                        >
                                                            <ArrowRight className="h-5 w-5" />
                                                        </button>
                                                    </div>

                                                    {/* Flipkart Style Horizontal Scroll */}
                                                    <div className="relative group">
                                                        <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar snap-x scroll-smooth">
                                                            {catProducts.map((product: Product) => (
                                                                <div 
                                                                    key={product._id} 
                                                                    className="min-w-[240px] sm:min-w-[280px] snap-start"
                                                                >
                                                                    <ProductCard product={product} />
                                                                </div>
                                                            ))}
                                                            
                                                            {/* View All Card at the end */}
                                                            <button 
                                                                onClick={() => {
                                                                    searchParams.set("category", cat._id);
                                                                    setSearchParams(searchParams);
                                                                    window.scrollTo(0, 0);
                                                                }}
                                                                className="min-w-[200px] flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all snap-start group/viewall"
                                                            >
                                                                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover/viewall:scale-110 transition-transform">
                                                                    <ChevronRight className="h-6 w-6 text-gray-400 group-hover/viewall:text-black" />
                                                                </div>
                                                                <span className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover/viewall:text-black">View Full Section</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {/* If no sections matched but products exist, show a General section */}
                                        {/* (Or just handle remaining in a grid below) */}
                                    </div>
                                ) : (
                                    <motion.div
                                        layout
                                        className={`grid ${isFilterOpen
                                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                                            : `grid-cols-2 md:grid-cols-3 lg:grid-cols-${gridSize}`
                                            } gap-6 sm:gap-8`}
                                    >
                                        {infiniteData?.pages.map((page: any) => (
                                            page.products.map((product: Product) => (
                                                <ProductCard key={product._id} product={product} />
                                            ))
                                        ))}
                                    </motion.div>
                                )}

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
