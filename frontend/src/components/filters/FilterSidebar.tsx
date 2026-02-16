import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

interface FilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    searchParams: URLSearchParams;
    setSearchParams: (params: URLSearchParams) => void;
    gender?: string;
}

export default function FilterSidebar({ isOpen, onClose, searchParams, setSearchParams, gender }: FilterSidebarProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['category', 'price', 'size']));
    const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 1000]);

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['admin', 'categories'],
        queryFn: async () => {
            const res = await api.get('/categories');
            return res.data.data as any[];
        }
    });

    // Fetch brands
    const { data: brandsData } = useQuery({
        queryKey: ['admin', 'brands'],
        queryFn: async () => {
            const res = await api.get('/brands');
            return res.data.data as any[];
        }
    });

    const displayCategories = categoriesData?.filter(cat =>
        cat.isActive && (!gender || cat.gender === gender || cat.gender === 'UNISEX')
    ) || [];

    const displayBrands = brandsData?.filter((brand: any) => brand.isActive) || [];

    // Available sizes (could be fetched from API if needed)
    const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    // Get active filters
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const sizes = searchParams.get('sizes')?.split(',').filter(Boolean) || [];
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    useEffect(() => {
        const min = parseFloat(minPrice || '0');
        const max = parseFloat(maxPrice || '1000');
        setTempPriceRange([min, max]);
    }, [minPrice, maxPrice]);

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const handleCategoryToggle = (catId: string) => {
        const current = category ? category.split(',') : [];
        const index = current.indexOf(catId);

        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(catId);
        }

        if (current.length > 0) {
            searchParams.set('category', current.join(','));
        } else {
            searchParams.delete('category');
        }
        setSearchParams(searchParams);
    };

    const handleBrandToggle = (brandId: string) => {
        const current = brand ? brand.split(',') : [];
        const index = current.indexOf(brandId);

        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(brandId);
        }

        if (current.length > 0) {
            searchParams.set('brand', current.join(','));
        } else {
            searchParams.delete('brand');
        }
        setSearchParams(searchParams);
    };

    const handleSizeToggle = (size: string) => {
        const currentSizes = sizes.slice();
        const index = currentSizes.indexOf(size);

        if (index > -1) {
            currentSizes.splice(index, 1);
        } else {
            currentSizes.push(size);
        }

        if (currentSizes.length > 0) {
            searchParams.set('sizes', currentSizes.join(','));
        } else {
            searchParams.delete('sizes');
        }
        setSearchParams(searchParams);
    };

    const handlePriceChange = (index: number, value: number) => {
        const newRange: [number, number] = [...tempPriceRange];
        newRange[index] = value;
        if (newRange[0] <= newRange[1]) {
            setTempPriceRange(newRange);
        }
    };

    const applyPriceFilter = () => {
        searchParams.set('minPrice', tempPriceRange[0].toString());
        searchParams.set('maxPrice', tempPriceRange[1].toString());
        setSearchParams(searchParams);
    };

    const clearAllFilters = () => {
        searchParams.delete('category');
        searchParams.delete('brand');
        searchParams.delete('sizes');
        searchParams.delete('minPrice');
        searchParams.delete('maxPrice');
        setSearchParams(searchParams);
        setTempPriceRange([0, 1000]);
    };

    const hasActiveFilters = category || brand || sizes.length > 0 || minPrice || maxPrice;

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`
                    ${isOpen ? 'fixed lg:static inset-y-0 left-0 z-50 bg-white lg:bg-transparent w-80 lg:w-auto overflow-y-auto' : 'hidden lg:block'}
                    space-y-8 p-6 lg:p-0 shadow-2xl lg:shadow-none
                `}
            >
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between pb-6 border-b border-gray-100">
                    <h2 className="text-lg font-serif font-bold">Filters</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Clear All Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="w-full py-2 px-4 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-black transition-colors"
                    >
                        Clear All Filters
                    </button>
                )}

                {/* Categories */}
                <div className="space-y-4">
                    <button
                        onClick={() => toggleSection('category')}
                        className="w-full flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-gray-900"
                    >
                        <span>Categories</span>
                        {expandedSections.has('category') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <AnimatePresence>
                        {expandedSections.has('category') && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-3 overflow-hidden"
                            >
                                {displayCategories.map((cat: any) => (
                                    <label key={cat._id} className="flex items-center group cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-black focus:ring-black focus:ring-offset-0 h-4 w-4"
                                            checked={category?.split(',').includes(cat._id)}
                                            onChange={() => handleCategoryToggle(cat._id)}
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-600 group-hover:text-black transition-colors">
                                            {cat.name}
                                        </span>
                                    </label>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Price Range */}
                <div className="space-y-4">
                    <button
                        onClick={() => toggleSection('price')}
                        className="w-full flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-gray-900"
                    >
                        <span>Price Range</span>
                        {expandedSections.has('price') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <AnimatePresence>
                        {expandedSections.has('price') && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-4 overflow-hidden"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                                        <span>${tempPriceRange[0]}</span>
                                        <span>${tempPriceRange[1]}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="1000"
                                            step="10"
                                            value={tempPriceRange[0]}
                                            onChange={(e) => handlePriceChange(0, parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max="1000"
                                            step="10"
                                            value={tempPriceRange[1]}
                                            onChange={(e) => handlePriceChange(1, parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={applyPriceFilter}
                                    className="w-full py-2 px-4 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    Apply Price
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sizes */}
                <div className="space-y-4">
                    <button
                        onClick={() => toggleSection('size')}
                        className="w-full flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-gray-900"
                    >
                        <span>Sizes</span>
                        {expandedSections.has('size') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <AnimatePresence>
                        {expandedSections.has('size') && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="grid grid-cols-3 gap-2 overflow-hidden"
                            >
                                {availableSizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => handleSizeToggle(size)}
                                        className={`
                                            py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all
                                            ${sizes.includes(size)
                                                ? 'bg-black text-white border-black'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black'
                                            }
                                        `}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Brands */}
                {displayBrands.length > 0 && (
                    <div className="space-y-4">
                        <button
                            onClick={() => toggleSection('brand')}
                            className="w-full flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-gray-900"
                        >
                            <span>Brands</span>
                            {expandedSections.has('brand') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <AnimatePresence>
                            {expandedSections.has('brand') && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-3 overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
                                >
                                    {displayBrands.map((br: any) => (
                                        <label key={br._id} className="flex items-center group cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-black focus:ring-black focus:ring-offset-0 h-4 w-4"
                                                checked={brand?.split(',').includes(br._id)}
                                                onChange={() => handleBrandToggle(br._id)}
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-600 group-hover:text-black transition-colors">
                                                {br.name}
                                            </span>
                                        </label>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </motion.aside>
        </>
    );
}
