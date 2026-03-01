import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Trash2, Home, ArrowUp, ArrowDown, User, CheckCircle, Quote } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import PremiumLoader from '../../components/ui/PremiumLoader';

interface Review {
    _id: string;
    user: {
        name: string;
        profilePicture?: { imageUrl: string } | string;
    };
    product: {
        title: string;
        images: { imageUrl: string }[];
    };
    rating: number;
    comment: string;
    description: string;
    showOnHomepage: boolean;
    isVerifiedPurchase: boolean;
    priority: number;
    createdAt: string;
}

export default function AdminReviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'HOMEPAGE'>('ALL');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await api.get('/reviews/all');
            setReviews(res.data.data);
        } catch (error) {
            toast.error('Failed to load reviews');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleHomepage = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/reviews/${id}/status`, { showOnHomepage: !currentStatus });
            setReviews(reviews.map(r => r._id === id ? { ...r, showOnHomepage: !currentStatus } : r));
            toast.success(!currentStatus ? 'Added to homepage' : 'Removed from homepage');
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const updatePriority = async (id: string, currentPriority: number, delta: number) => {
        const newPriority = currentPriority + delta;
        try {
            await api.patch(`/reviews/${id}/status`, { priority: newPriority });
            setReviews(reviews.map(r => r._id === id ? { ...r, priority: newPriority } : r));
        } catch (error) {
            toast.error('Update failed');
        }
    };

    const deleteReview = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;
        try {
            await api.delete(`/reviews/${id}`);
            setReviews(reviews.filter(r => r._id !== id));
            toast.success('Review deleted');
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const filteredReviews = filter === 'HOMEPAGE'
        ? reviews.filter(r => r.showOnHomepage).sort((a, b) => b.priority - a.priority)
        : reviews;

    if (isLoading) return <PremiumLoader text="Fetching Customer Sentiments..." />;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900">Review Management</h1>
                    <p className="text-gray-500 mt-2">Curate customer voices for your homepage gallery.</p>
                </div>
                <div className="flex items-center bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === 'ALL' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
                    >
                        All Reviews
                    </button>
                    <button
                        onClick={() => setFilter('HOMEPAGE')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === 'HOMEPAGE' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
                    >
                        Homepage Featured
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredReviews.map((review) => (
                        <motion.div
                            layout
                            key={review._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`bg-white rounded-[40px] border p-8 relative group transition-all duration-300 hover:shadow-2xl hover:shadow-gray-100 ${review.showOnHomepage ? 'border-black ring-1 ring-black' : 'border-gray-100'}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
                                        {review.user?.profilePicture ? (
                                            <img
                                                src={typeof review.user.profilePicture === 'string' ? review.user.profilePicture : review.user.profilePicture.imageUrl}
                                                className="h-full w-full object-cover"
                                                alt=""
                                            />
                                        ) : (
                                            <User className="h-5 w-5 text-gray-300" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{review.user?.name}</p>
                                        <div className="flex items-center space-x-1 mt-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-2.5 w-2.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {review.showOnHomepage && (
                                    <div className="bg-black text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse">
                                        Featured
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 mb-8">
                                <h3 className="font-serif font-bold text-gray-900 text-lg">"{review.comment}"</h3>
                                <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 italic">
                                    {review.description}
                                </p>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[32px] mb-8">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-8 bg-white rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                        <img src={review.product?.images[0]?.imageUrl} className="h-full w-full object-cover" alt="" />
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate max-w-[100px]">
                                        {review.product?.title}
                                    </p>
                                </div>
                                {review.isVerifiedPurchase && (
                                    <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                        <CheckCircle className="h-3 w-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Verified</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => toggleHomepage(review._id, review.showOnHomepage)}
                                        className={`p-3 rounded-2xl transition-all ${review.showOnHomepage ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-black'}`}
                                        title={review.showOnHomepage ? "Featured on Homepage" : "Not Featured"}
                                    >
                                        <Home className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteReview(review._id)}
                                        className="p-3 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
                                        title="Delete Review"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {review.showOnHomepage && (
                                    <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-2xl">
                                        <button
                                            onClick={() => updatePriority(review._id, review.priority, 1)}
                                            className="p-1.5 hover:bg-white rounded-xl transition-all text-gray-500 hover:text-black"
                                        >
                                            <ArrowUp className="h-3 w-3" />
                                        </button>
                                        <span className="w-8 text-center text-[10px] font-black">{review.priority}</span>
                                        <button
                                            onClick={() => updatePriority(review._id, review.priority, -1)}
                                            className="p-1.5 hover:bg-white rounded-xl transition-all text-gray-500 hover:text-black"
                                        >
                                            <ArrowDown className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            {filteredReviews.length === 0 && (
                <div className="py-32 text-center flex flex-col items-center">
                    <div className="h-20 w-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-6">
                        <Quote className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-gray-900">No sentiments found</h3>
                    <p className="text-gray-500 mt-2">Start showcasing your customer excellence stories here.</p>
                </div>
            )}
        </div>
    );
}
