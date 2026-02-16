import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, ThumbsUp, MessageSquare, User } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

interface Review {
    _id: string;
    user: {
        _id: string;
        name: string;
        profilePicture?: string;
    };
    rating: number;
    comment: string;
    description: string;
    isVerifiedPurchase: boolean;
    createdAt: string;
}

export default function Reviews({ productId }: { productId: string }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [description, setDescription] = useState('');

    const { data: reviews, isLoading } = useQuery({
        queryKey: ['reviews', productId],
        queryFn: async () => {
            const res = await api.get(`/products/${productId}/reviews`);
            return res.data.data as Review[];
        }
    });

    const mutation = useMutation({
        mutationFn: async () => {
            await api.post(`/products/${productId}/reviews`, {
                rating,
                comment,
                description
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
            setIsFormOpen(false);
            setRating(5);
            setComment('');
            setDescription('');
            toast.success('Review submitted successfully');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        }
    });

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-serif font-bold">Reviews ({reviews?.length || 0})</h3>
                {user && !isFormOpen && (
                    <Button onClick={() => setIsFormOpen(true)}>Write a Review</Button>
                )}
            </div>

            {isFormOpen && (
                <div className="bg-gray-50 p-6 rounded-[24px] space-y-4 animate-in fade-in slide-in-from-top-4">
                    <h4 className="font-bold">Share your experience</h4>
                    <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className={`transition-transform hover:scale-110 ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`}
                            >
                                <Star className="h-6 w-6 fill-current" />
                            </button>
                        ))}
                    </div>
                    <input
                        className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black transition-colors"
                        placeholder="Review Title (e.g. Great fit!)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <textarea
                        className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black transition-colors min-h-[100px]"
                        placeholder="Tell us more about the quality, fit, and style..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button onClick={() => mutation.mutate()} isLoading={mutation.isPending}>Submit Review</Button>
                    </div>
                </div>
            )}

            <div className="space-y-8">
                {isLoading ? (
                    <div className="text-center text-gray-400 py-10">Loading reviews...</div>
                ) : reviews?.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-[24px]">
                        <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                    </div>
                ) : (
                    reviews?.map((review) => (
                        <div key={review._id} className="border-b border-gray-100 pb-8 last:border-0">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                        {review.user.profilePicture ? (
                                            <img src={review.user.profilePicture} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{review.user.name}</p>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-current' : 'text-gray-200 fill-gray-200'}`} />
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-400">• {new Date(review.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                {review.isVerifiedPurchase && (
                                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center">
                                        <ThumbsUp className="h-3 w-3 mr-1" /> Verified Buyer
                                    </span>
                                )}
                            </div>
                            <h5 className="font-bold text-gray-900 mb-2">{review.comment}</h5>
                            <p className="text-gray-600 text-sm leading-relaxed">{review.description}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
