import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Globe } from 'lucide-react';
import PremiumLoader from '../../components/ui/PremiumLoader';
import api from '../../api/client';
import type { Brand } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function AdminBrands() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form states
    const [name, setName] = useState('');
    const [logoPreview, setLogoPreview] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchBrands = async () => {
        try {
            const res = await api.get('/brands');
            setBrands(res.data.data);
        } catch (error) {
            console.error('Failed to fetch brands:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('isActive', isActive.toString());
        if (logoFile) {
            formData.append('logo', logoFile);
        }

        try {
            if (editingBrand) {
                await api.put(`/brands/${editingBrand._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/brands', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            fetchBrands();
            closeModal();
        } catch (error) {
            console.error('Failed to save brand:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you certain you want to remove this brand?')) return;
        try {
            await api.delete(`/brands/${id}`);
            fetchBrands();
        } catch (error) {
            console.error('Failed to delete brand:', error);
        }
    };

    const openModal = (brand: Brand | null = null) => {
        if (brand) {
            setEditingBrand(brand);
            setName(brand.name);
            setLogoPreview(brand.logo?.imageUrl || '');
            setIsActive(brand.isActive);
        } else {
            setEditingBrand(null);
            setName('');
            setLogoPreview('');
            setIsActive(true);
        }
        setLogoFile(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-gray-900">Brands</h1>
                    <p className="text-gray-500 mt-1">Manage global luxury partners and designer boutiques</p>
                </div>
                <Button onClick={() => openModal()} className="shadow-lg shadow-black/10 flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Brand</span>
                </Button>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find a brand..."
                            className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-11 pr-5 text-sm focus:ring-2 focus:ring-black/5 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/30">
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Brand</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Logo URL</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Integration</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex justify-center">
                                            <PremiumLoader size="md" text="Loading Global Partners..." />
                                        </div>
                                    </td>
                                </tr>
                            ) : brands.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-medium">
                                        No brands listed yet.
                                    </td>
                                </tr>
                            ) : (
                                brands
                                    .filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((brand) => (
                                        <tr key={brand._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center space-x-4">
                                                    <div className="h-12 w-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100">
                                                        {brand.logo?.imageUrl ? (
                                                            <img src={brand.logo.imageUrl} alt={brand.name} className="h-full w-full object-contain p-2" />
                                                        ) : (
                                                            <Globe className="h-5 w-5 text-gray-300" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">{brand.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-mono text-gray-400 truncate max-w-[200px] block">
                                                    {brand.logo?.imageUrl || 'No logo provided'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center space-x-2">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${brand.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                                    <span className={`text-xs font-semibold ${brand.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                        {brand.isActive ? 'Active Member' : 'Paused'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right space-x-2">
                                                <button
                                                    onClick={() => openModal(brand)}
                                                    className="p-2 text-gray-400 hover:text-black hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(brand._id)}
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
                                <h2 className="text-2xl font-serif">{editingBrand ? 'Edit Brand' : 'New Brand'}</h2>
                                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <Plus className="h-5 w-5 rotate-45 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <Input
                                    label="Brand Name"
                                    placeholder="e.g. Gucci, Zara, etc."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />

                                <div className="space-y-4">
                                    {logoPreview && (
                                        <div className="relative h-20 w-20 mx-auto rounded-2xl overflow-hidden border border-gray-100">
                                            <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain p-2" />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Logo Upload</label>
                                        <div className="flex items-center space-x-4">
                                            <label className="flex-1 cursor-pointer">
                                                <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-400 hover:border-black transition-all text-center">
                                                    {logoFile ? logoFile.name : 'Choose brand logo...'}
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) {
                                                            const file = e.target.files[0];
                                                            setLogoFile(file);
                                                            setLogoPreview(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                />
                                            </label>
                                            {logoFile && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setLogoFile(null);
                                                        setLogoPreview(editingBrand?.logo?.imageUrl || '');
                                                    }}
                                                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                                                >
                                                    <Plus className="h-4 w-4 rotate-45" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Partnership Status</p>
                                        <p className="text-[10px] text-gray-400 font-medium">Show brand products in shop</p>
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
                                    {editingBrand ? 'Save Changes' : 'Create Brand'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
