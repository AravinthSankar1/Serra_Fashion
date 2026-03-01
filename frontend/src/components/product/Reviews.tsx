import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, ThumbsUp, MessageSquare, User, ImagePlus, X } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { toast } from 'react-toastify';

interface Review {
    _id: string;
    user: {
        _id: string;
        name: string;
        profilePicture?: { imageUrl: string } | string;
    };
    rating: number;
    comment: string;
    description: string;
    images?: string[];
    isVerifiedPurchase: boolean;
    createdAt: string;
}

export default function Reviews({ productId }: { productId: string }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [description, setDescription] = useState('');
    const [reviewImages, setReviewImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const { data: reviews, isLoading } = useQuery({
        queryKey: ['reviews', productId],
        queryFn: async () => {
            const res = await api.get(`/products/${productId}/reviews`);
            return res.data.data as Review[];
        }
    });

    const mutation = useMutation({
        mutationFn: async () => {
            // upload images if any via multipart, or as URLs via base form
            const formData = new FormData();
            formData.append('rating', String(rating));
            formData.append('comment', comment);
            formData.append('description', description);
            reviewImages.forEach(img => formData.append('reviewImages', img));

            await api.post(`/products/${productId}/reviews`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
            setIsFormOpen(false);
            setRating(5);
            setComment('');
            setDescription('');
            setReviewImages([]);
            setPreviewUrls([]);
            toast.success('Review submitted!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        }
    });

    const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []).slice(0, 4);
        setReviewImages(prev => [...prev, ...files].slice(0, 4));
        const urls = files.map(f => URL.createObjectURL(f));
        setPreviewUrls(prev => [...prev, ...urls].slice(0, 4));
    };

    const removeImage = (idx: number) => {
        setReviewImages(prev => prev.filter((_, i) => i !== idx));
        setPreviewUrls(prev => prev.filter((_, i) => i !== idx));
    };

    const getUserAvatar = (review: Review) => {
        if (!review.user.profilePicture) return null;
        if (typeof review.user.profilePicture === 'string') return review.user.profilePicture;
        return review.user.profilePicture.imageUrl;
    };

    return (
        <div className="space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-2xl font-serif font-bold">Reviews ({reviews?.length || 0})</h3>
                {!isFormOpen && (
                    user ? (
                        <Button onClick={() => setIsFormOpen(true)}>Write a Review</Button>
                    ) : (
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors underline underline-offset-4"
                        >
                            Sign in to write a review
                        </button>
                    )
                )}
            </div>

            {isFormOpen && (
                <div className="bg-gray-50 p-6 rounded-[24px] space-y-5 animate-in fade-in slide-in-from-top-4">
                    <h4 className="font-bold">Share your experience</h4>

                    {/* Star Rating */}
                    <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className={`transition-transform hover:scale-110 ${star <= (hoverRating || rating) ? 'text-amber-400' : 'text-gray-300'}`}
                            >
                                <Star className="h-7 w-7 fill-current" />
                            </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-500 self-center font-semibold">
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][hoverRating || rating]}
                        </span>
                    </div>

                    <input
                        className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black transition-colors"
                        placeholder="Review Title (e.g. Great fit!)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <textarea
                        className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-black transition-colors min-h-[100px] resize-none"
                        placeholder="Tell us more about the quality, fit, and style..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    {/* Image Upload */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Add Photos (optional)</p>
                        <div className="flex flex-wrap gap-3">
                            {previewUrls.map((url, idx) => (
                                <div key={idx} className="relative h-20 w-20 rounded-xl overflow-hidden group">
                                    <img src={url} className="h-full w-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            {previewUrls.length < 4 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-black hover:text-black transition-colors"
                                >
                                    <ImagePlus className="h-5 w-5" />
                                    <span className="text-[9px] mt-1 font-bold uppercase">Add</span>
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImagePick}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => { setIsFormOpen(false); setPreviewUrls([]); setReviewImages([]); }}>Cancel</Button>
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
                                        {getUserAvatar(review) ? (
                                            <img src={getUserAvatar(review)!} className="h-full w-full object-cover" alt={review.user.name} />
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

                            {/* Review Images */}
                            {review.images && review.images.length > 0 && (
                                <div className="flex gap-3 mt-4 flex-wrap">
                                    {review.images.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`Review photo ${idx + 1}`}
                                            className="h-24 w-24 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-gray-100"
                                            onClick={() => window.open(img, '_blank')}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
