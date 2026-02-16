import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Upload, X } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PremiumLoader from '../../components/ui/PremiumLoader';

interface SizeGuide {
    _id: string;
    name: string;
    description: string;
    image: {
        imageUrl: string;
        imagePublicId: string;
    };
    category: any;
}

export default function AdminSizeGuides() {
    const [sizeGuides, setSizeGuides] = useState<SizeGuide[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSizeGuide, setEditingSizeGuide] = useState<SizeGuide | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: '',
        imagePublicId: '',
        category: ''
    });

    useEffect(() => {
        fetchSizeGuides();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data || []);
        } catch (error) { }
    };

    const fetchSizeGuides = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/size-guides');
            setSizeGuides(res.data.data.sizeGuides);
        } catch (error) {
            toast.error('Failed to fetch size guides');
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
            const res = await api.post('/admin/upload', data);
            setFormData(prev => ({
                ...prev,
                imageUrl: res.data.data.imageUrl,
                imagePublicId: res.data.data.imagePublicId
            }));
            toast.success('Image uploaded');
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.imageUrl) {
            return toast.error('Please upload a size guide image');
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            image: {
                imageUrl: formData.imageUrl,
                imagePublicId: formData.imagePublicId
            },
            category: formData.category || undefined
        };

        try {
            if (editingSizeGuide) {
                await api.patch(`/size-guides/${editingSizeGuide._id}`, payload);
                toast.success('Size guide updated');
            } else {
                await api.post('/size-guides', payload);
                toast.success('Size guide created');
            }
            setIsModalOpen(false);
            setEditingSizeGuide(null);
            resetForm();
            fetchSizeGuides();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Action failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this size guide?')) return;
        try {
            await api.delete(`/size-guides/${id}`);
            toast.success('Size guide deleted');
            fetchSizeGuides();
        } catch (error) {
            toast.error('Failed to delete size guide');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            imageUrl: '',
            imagePublicId: '',
            category: ''
        });
    };

    if (isLoading) return <PremiumLoader />;

    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 uppercase tracking-tight">Size Guides</h1>
                    <p className="text-gray-500 text-sm mt-1">Create and manage sizing standards for your collections</p>
                </div>
                <Button onClick={() => { setEditingSizeGuide(null); resetForm(); setIsModalOpen(true); }} className="h-12 px-6 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Create Guide</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {sizeGuides.map((guide) => (
                        <motion.div
                            key={guide._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[32px] border border-gray-100 p-2 group shadow-sm hover:shadow-2xl hover:shadow-gray-100 transition-all"
                        >
                            <div className="aspect-[4/3] rounded-[28px] overflow-hidden bg-gray-50 relative">
                                <img
                                    src={guide.image.imageUrl}
                                    alt={guide.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingSizeGuide(guide);
                                                setFormData({
                                                    name: guide.name,
                                                    description: guide.description,
                                                    imageUrl: guide.image.imageUrl,
                                                    imagePublicId: guide.image.imagePublicId,
                                                    category: guide.category?._id || ''
                                                });
                                                setIsModalOpen(true);
                                            }}
                                            className="p-3 bg-white text-black rounded-2xl hover:scale-110 transition-transform shadow-xl"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(guide._id)}
                                            className="p-3 bg-white text-red-500 rounded-2xl hover:scale-110 transition-transform shadow-xl"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                {guide.category && (
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-black shadow-sm">
                                            {guide.category.name}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-bold tracking-tight">{guide.name}</h3>
                                <p className="text-gray-400 text-xs mt-1 line-clamp-1">{guide.description}</p>
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
                        className="relative bg-white w-full max-w-xl rounded-[40px] p-10 overflow-hidden shadow-2xl"
                    >
                        <h2 className="text-2xl font-serif font-bold mb-8">
                            {editingSizeGuide ? 'Edit Size Guide' : 'Add New Size Guide'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <Input
                                    label="Guide Name"
                                    placeholder="e.g. Standard Men's T-Shirt"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Apply to Category</label>
                                    <select
                                        className="w-full h-12 bg-gray-50 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">None (Generic)</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <Input
                                label="Description"
                                placeholder="Details about this sizing chart..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />

                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Chart Image</label>
                                {formData.imageUrl ? (
                                    <div className="relative aspect-video rounded-3xl overflow-hidden group">
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain bg-gray-50" />
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
                                            {isUploading ? 'Uploading High Resolution...' : 'Upload Sizing Chart'}
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
                                    {editingSizeGuide ? 'Save Changes' : 'Publish Guide'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
