import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import type { Product } from '../types';
import Navbar from '../components/layout/Navbar';
import ProductCard from '../components/ui/ProductCard';
import { Heart, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function WishlistPage() {
    const { data: wishlist, isLoading } = useQuery({
        queryKey: ['wishlist'],
        queryFn: async () => {
            const res = await api.get('/users/wishlist');
            return res.data.data as Product[];
        }
    });

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <header className="pt-20 pb-10 border-b border-gray-50">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-serif font-bold text-gray-900"
                    >
                        Wishlist
                    </motion.h1>
                    <p className="mt-4 text-gray-500 uppercase tracking-[0.3em] text-xs font-semibold">
                        Your Curated Favorites
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-16">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-gray-200" />
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading Favorites</span>
                    </div>
                ) : wishlist && wishlist.length > 0 ? (
                    <motion.div
                        layout
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12"
                    >
                        {wishlist.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-32 border-2 border-dashed border-gray-100 rounded-[40px]">
                        <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Heart className="h-8 w-8 text-gray-300" />
                        </div>
                        <h2 className="text-2xl font-serif text-gray-900 mb-2">Your wishlist is empty</h2>
                        <p className="text-gray-400 mb-8 max-w-xs mx-auto">Save items you love to find them easily later.</p>
                        <Link to="/" className="inline-flex items-center space-x-2 bg-black text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all group">
                            <span>Start Exploring</span>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
