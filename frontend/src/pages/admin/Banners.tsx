import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Upload, X, Eye, EyeOff } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PremiumLoader from '../../components/ui/PremiumLoader';

interface Banner {
    _id: string;
    title: string;
    description: string;
    image: {
        imageUrl: string;
        imagePublicId: string;
    };
    link: string;
    cta: string;
    isActive: boolean;
    order: number;
}

export default function AdminBanners() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        imagePublicId: '',
        link: '',
        cta: '',
        isActive: true,
        order: 0
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/banners/admin');
            setBanners(res.data.data);
        } catch (error) {
            toast.error('Failed to fetch banners');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const data = new FormData();
        data.append('image', file);

        try {
            // Remove Content-Type header to let browser set boundary
            const res = await api.post('/admin/upload', data);
            setFormData(prev => ({
                ...prev,
                imageUrl: res.data.data.imageUrl,
                imagePublicId: res.data.data.imagePublicId
            }));
            toast.success('Image uploaded');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.imageUrl) {
            return toast.error('Please upload a banner image');
        }

        const payload = {
            title: formData.title,
            description: formData.description,
            image: {
                imageUrl: formData.imageUrl,
                imagePublicId: formData.imagePublicId
            },
            link: formData.link,
            cta: formData.cta,
            isActive: formData.isActive,
            order: Number(formData.order)
        };

        try {
            if (editingBanner) {
                await api.patch(`/banners/${editingBanner._id}`, payload);
                toast.success('Banner updated');
            } else {
                await api.post('/banners', payload);
                toast.success('Banner created');
            }
            setIsModalOpen(false);
            setEditingBanner(null);
            resetForm();
            fetchBanners();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Action failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;
        try {
            await api.delete(`/banners/${id}`);
            toast.success('Banner deleted');
            fetchBanners();
        } catch (error) {
            toast.error('Failed to delete banner');
        }
    };

    const toggleStatus = async (banner: Banner) => {
        try {
            await api.patch(`/banners/${banner._id}`, { isActive: !banner.isActive });
            fetchBanners();
            toast.success(`Banner ${!banner.isActive ? 'activated' : 'deactivated'}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            imageUrl: '',
            imagePublicId: '',
            link: '',
            cta: '',
            isActive: true,
            order: 0
        });
    };

    if (isLoading) return <PremiumLoader />;

    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 uppercase tracking-tight">Hero Banners</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage homepage slider content</p>
                </div>
                <Button onClick={() => { setEditingBanner(null); resetForm(); setIsModalOpen(true); }} className="h-12 px-6 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Create Banner</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {banners.map((banner) => (
                        <motion.div
                            key={banner._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white rounded-[32px] border ${banner.isActive ? 'border-gray-100' : 'border-gray-200 bg-gray-50 opacity-75'} p-2 group shadow-sm hover:shadow-2xl hover:shadow-gray-100 transition-all`}
                        >
                            <div className="aspect-video rounded-[28px] overflow-hidden bg-gray-50 relative">
                                <img
                                    src={banner.image.imageUrl}
                                    alt={banner.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingBanner(banner);
                                                setFormData({
                                                    title: banner.title,
                                                    description: banner.description,
                                                    imageUrl: banner.image.imageUrl,
                                                    imagePublicId: banner.image.imagePublicId,
                                                    link: banner.link,
                                                    cta: banner.cta,
                                                    isActive: banner.isActive,
                                                    order: banner.order
                                                });
                                                setIsModalOpen(true);
                                            }}
                                            className="p-3 bg-white text-black rounded-2xl hover:scale-110 transition-transform shadow-xl"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(banner)}
                                            className={`p-3 bg-white ${banner.isActive ? 'text-green-500' : 'text-gray-400'} rounded-2xl hover:scale-110 transition-transform shadow-xl`}
                                            title={banner.isActive ? "Deactivate" : "Activate"}
                                        >
                                            {banner.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner._id)}
                                            className="p-3 bg-white text-red-500 rounded-2xl hover:scale-110 transition-transform shadow-xl"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute top-4 left-4">
                                    <span className={`px-3 py-1 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${banner.isActive ? 'bg-white/90 text-black' : 'bg-gray-200 text-gray-500'}`}>
                                        {banner.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-bold tracking-tight truncate">{banner.title}</h3>
                                <p className="text-gray-400 text-xs mt-1 line-clamp-1">{banner.description}</p>
                                <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <span>Order: {banner.order}</span>
                                    <span>{banner.cta}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative bg-white w-full max-w-xl rounded-[40px] p-10 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <h2 className="text-2xl font-serif font-bold mb-8">
                            {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Title"
                                placeholder="e.g. Spring Collection"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />

                            <Input
                                label="Description"
                                placeholder="Marketing copy..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />

                            <div className="grid grid-cols-2 gap-6">
                                <Input
                                    label="Button Text (CTA)"
                                    placeholder="e.g. Shop Now"
                                    value={formData.cta}
                                    onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                                />
                                <Input
                                    label="Link URL"
                                    placeholder="e.g. /collection"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <Input
                                    label="Display Order"
                                    type="number"
                                    placeholder="0"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                                />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Status</label>
                                    <div className="h-12 flex items-center space-x-4">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                                            />
                                            <span className="text-sm font-bold">Active</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Banner Image</label>
                                {formData.imageUrl ? (
                                    <div className="relative aspect-video rounded-3xl overflow-hidden group">
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover bg-gray-50" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, imageUrl: '', imagePublicId: '' }))}
                                            className="absolute top-4 right-4 p-2 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center aspect-video rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-black cursor-pointer transition-all">
                                        <Upload className={`w-8 h-8 ${isUploading ? 'animate-bounce text-black' : 'text-gray-300'}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest mt-4">
                                            {isUploading ? 'Uploading...' : 'Upload Banner Image'}
                                        </span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 h-14 bg-gray-100 text-black rounded-2xl text-xs font-bold uppercase tracking-widest active:scale-[0.98] transition-transform"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] h-14 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-black/10 active:scale-[0.98] transition-all"
                                    disabled={isUploading}
                                >
                                    {editingBanner ? 'Save Changes' : 'Create Banner'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
