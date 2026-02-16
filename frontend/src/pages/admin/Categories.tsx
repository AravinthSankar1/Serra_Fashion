import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, ChevronDown, Check } from 'lucide-react';
import api from '../../api/client';
import { type Category } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PremiumLoader from '../../components/ui/PremiumLoader';

export default function AdminCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeGenderFilter, setActiveGenderFilter] = useState<'ALL' | 'MEN' | 'WOMEN' | 'UNISEX'>('ALL');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [gender, setGender] = useState<'MEN' | 'WOMEN' | 'UNISEX'>('UNISEX');
    const [imagePreview, setImagePreview] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('gender', gender);
        formData.append('isActive', isActive.toString());
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            if (editingCategory) {
                await api.put(`/categories/${editingCategory._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/categories', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            fetchCategories();
            closeModal();
        } catch (error) {
            console.error('Failed to save category:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
        }
    };

    const openModal = (category: Category | null = null) => {
        if (category) {
            setEditingCategory(category);
            setName(category.name);
            setGender(category.gender);
            setImagePreview(category.image?.imageUrl || '');
            setIsActive(category.isActive);
        } else {
            setEditingCategory(null);
            setName('');
            setGender('UNISEX');
            setImagePreview('');
            setIsActive(true);
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-gray-900">Categories</h1>
                    <p className="text-gray-500 mt-1">Manage product classification and department filters</p>
                </div>
                <Button onClick={() => openModal()} className="shadow-lg shadow-black/10 flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Category</span>
                </Button>
            </div>

            {/* Table / List */}
            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-11 pr-5 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-2 relative">
                        <button
                            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                            className={`flex items-center space-x-2 px-4 py-2.5 border rounded-full text-sm font-semibold transition-all ${isFilterDropdownOpen || activeGenderFilter !== 'ALL' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-black'}`}
                        >
                            <Filter className="h-4 w-4" />
                            <span>{activeGenderFilter === 'ALL' ? 'Filter' : activeGenderFilter}</span>
                            <ChevronDown className={`h-3 w-3 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isFilterDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50"
                                >
                                    {['ALL', 'MEN', 'WOMEN', 'UNISEX'].map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => {
                                                setActiveGenderFilter(g as any);
                                                setIsFilterDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                                        >
                                            <span className={activeGenderFilter === g ? 'text-black' : 'text-gray-400'}>{g}</span>
                                            {activeGenderFilter === g && <Check className="h-3 w-3 text-black" />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/30">
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Slug</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Gender</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <PremiumLoader size="md" text="Refreshing Departments..." />
                                    </td>
                                </tr>
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-medium">
                                        No categories found. Create your first one!
                                    </td>
                                </tr>
                            ) : (
                                categories
                                    .filter(c => {
                                        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
                                        const matchesGender = activeGenderFilter === 'ALL' || c.gender === activeGenderFilter;
                                        return matchesSearch && matchesGender;
                                    })
                                    .map((cat) => (
                                        <tr key={cat._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-5 border-l-4 border-transparent hover:border-black pl-7">
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                        {cat.image?.imageUrl && (
                                                            <img src={cat.image.imageUrl} className="h-full w-full object-cover" alt="" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">{cat.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-mono text-gray-400">{cat.slug}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${cat.gender === 'MEN' ? 'bg-blue-50 text-blue-600' :
                                                    cat.gender === 'WOMEN' ? 'bg-pink-50 text-pink-600' :
                                                        'bg-purple-50 text-purple-600'
                                                    }`}>
                                                    {cat.gender}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center space-x-2">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${cat.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                                    <span className={`text-xs font-semibold ${cat.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                        {cat.isActive ? 'Active' : 'Draft'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right space-x-2">
                                                <button
                                                    onClick={() => openModal(cat)}
                                                    className="p-2 text-gray-400 hover:text-black hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[32px] shadow-2xl relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                <h2 className="text-2xl font-serif">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Plus className="h-5 w-5 rotate-45 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <Input
                                    label="Category Name"
                                    placeholder="e.g. Premium Denim"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />

                                <div className="space-y-4">
                                    {imagePreview && (
                                        <div className="relative h-24 w-full rounded-2xl overflow-hidden border border-gray-100">
                                            <img src={imagePreview} alt="Banner Preview" className="h-full w-full object-cover" />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category Banner</label>
                                        <div className="flex items-center space-x-4">
                                            <label className="flex-1 cursor-pointer">
                                                <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-400 hover:border-black transition-all text-center">
                                                    {imageFile ? imageFile.name : 'Update banner image...'}
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            const file = e.target.files[0];
                                                            setImageFile(file);
                                                            setImagePreview(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                />
                                            </label>
                                            {imageFile && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImageFile(null);
                                                        setImagePreview(editingCategory?.image?.imageUrl || '');
                                                    }}
                                                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                                                >
                                                    <Plus className="h-4 w-4 rotate-45" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Department / Gender</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['MEN', 'WOMEN', 'UNISEX'].map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setGender(g as any)}
                                                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${gender === g
                                                    ? 'bg-black text-white shadow-lg shadow-black/10'
                                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Active Status</p>
                                        <p className="text-[10px] text-gray-400 font-medium">Visible to customers on frontend</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsActive(!isActive)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <Button type="submit" className="w-full h-14" isLoading={isSubmitting}>
                                    {editingCategory ? 'Save Changes' : 'Create Category'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
