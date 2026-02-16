import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ActiveFiltersProps {
    searchParams: URLSearchParams;
    setSearchParams: (params: URLSearchParams) => void;
    categoriesData?: any[];
    brandsData?: any[];
}

export default function ActiveFilters({ searchParams, setSearchParams, categoriesData, brandsData }: ActiveFiltersProps) {
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const sizes = searchParams.get('sizes')?.split(',').filter(Boolean) || [];
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const removeFilter = (key: string, value?: string) => {
        if (key === 'sizes' && value) {
            const currentSizes = sizes.filter(s => s !== value);
            if (currentSizes.length > 0) {
                searchParams.set('sizes', currentSizes.join(','));
            } else {
                searchParams.delete('sizes');
            }
        } else if (key === 'price') {
            searchParams.delete('minPrice');
            searchParams.delete('maxPrice');
        } else {
            searchParams.delete(key);
        }
        setSearchParams(searchParams);
    };

    const categoryName = categoriesData?.find(c => c._id === category)?.name;
    const brandName = brandsData?.find(b => b._id === brand)?.name;

    const hasFilters = category || brand || sizes.length > 0 || minPrice || maxPrice;

    if (!hasFilters) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Active Filters:</span>

            {category && categoryName && (
                <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => removeFilter('category')}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-black text-white rounded-full text-xs font-bold hover:bg-gray-800 transition-colors group"
                >
                    <span>{categoryName}</span>
                    <X className="h-3 w-3 group-hover:rotate-90 transition-transform" />
                </motion.button>
            )}

            {brand && brandName && (
                <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => removeFilter('brand')}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-black text-white rounded-full text-xs font-bold hover:bg-gray-800 transition-colors group"
                >
                    <span>{brandName}</span>
                    <X className="h-3 w-3 group-hover:rotate-90 transition-transform" />
                </motion.button>
            )}

            {sizes.map(size => (
                <motion.button
                    key={size}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => removeFilter('sizes', size)}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-black text-white rounded-full text-xs font-bold hover:bg-gray-800 transition-colors group"
                >
                    <span>Size {size}</span>
                    <X className="h-3 w-3 group-hover:rotate-90 transition-transform" />
                </motion.button>
            ))}

            {(minPrice || maxPrice) && (
                <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => removeFilter('price')}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-black text-white rounded-full text-xs font-bold hover:bg-gray-800 transition-colors group"
                >
                    <span>${minPrice || 0} - ${maxPrice || 1000}</span>
                    <X className="h-3 w-3 group-hover:rotate-90 transition-transform" />
                </motion.button>
            )}
        </div>
    );
}
