import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../api/client';
import { type NavigationItem } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PremiumLoader from '../../components/ui/PremiumLoader';
import { toast } from 'react-toastify';

export default function AdminNavigation() {
    const [navItems, setNavItems] = useState<NavigationItem[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<NavigationItem | null>(null);

    // Form states
    const [label, setLabel] = useState('');
    const [type, setType] = useState<'CATEGORY' | 'GENDER' | 'CUSTOM'>('CUSTOM');
    const [categoryId, setCategoryId] = useState('');
    const [gender, setGender] = useState<'MEN' | 'WOMEN' | 'UNISEX'>('MEN');
    const [path, setPath] = useState('');
    const [order, setOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchNavigation = async () => {
        try {
            const [navRes, catRes] = await Promise.all([
                api.get('/navigation/all'),
                api.get('/categories')
            ]);
            setNavItems(navRes.data.data);
            setCategories(catRes.data.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load navigation data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNavigation();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data: any = { label, type, order, isActive };
        if (type === 'CUSTOM') data.path = path;
        else if (type === 'CATEGORY') data.categoryId = categoryId;
        else if (type === 'GENDER') data.gender = gender;

        try {
            if (editingItem) {
                await api.patch(`/navigation/${editingItem._id}`, data);
                toast.success('Link updated successfully');
            } else {
                await api.post('/navigation', data);
                toast.success('Link created successfully');
            }
            fetchNavigation();
            closeModal();
        } catch (error) {
            console.error('Failed to save navigation:', error);
            toast.error('Error saving link');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this navigation link?')) return;
        try {
            await api.delete(`/navigation/${id}`);
            toast.success('Link removed');
            fetchNavigation();
        } catch (error) {
            toast.error('Error deleting link');
        }
    };

    const openModal = (item: NavigationItem | null = null) => {
        if (item) {
            setEditingItem(item);
            setLabel(item.label);
            setType(item.type || 'CUSTOM');
            setPath(item.path || '');
            setCategoryId(item.categoryId || '');
            setGender(item.gender || 'MEN');
            setOrder(item.order);
            setIsActive(item.isActive);
        } else {
            setEditingItem(null);
            setLabel('');
            setType('CUSTOM');
            setPath('/');
            setCategoryId(categories[0]?._id || '');
            setGender('MEN');
            setOrder(navItems.length + 1);
            setIsActive(true);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-gray-900">Navigation Manager</h1>
                    <p className="text-gray-500 mt-1">Manage the top menu with automated mapping</p>
                </div>
                <Button onClick={() => openModal()} className="shadow-lg shadow-black/10 flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add New Tab</span>
                </Button>
            </div>

            <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/30">
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Order</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Label</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Mapping Type</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">Details</th>
                                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <PremiumLoader size="md" text="Refreshing Menu..." />
                                    </td>
                                </tr>
                            ) : (
                                navItems.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5 font-mono font-bold text-gray-300">#{item.order}</td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm font-bold text-gray-900">{item.label}</span>
                                            {!item.isActive && <span className="ml-2 text-[8px] font-black bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">HIDDEN</span>}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${
                                                item.type === 'CATEGORY' ? 'bg-blue-50 text-blue-600' :
                                                item.type === 'GENDER' ? 'bg-purple-50 text-purple-600' :
                                                'bg-gray-50 text-gray-500'
                                            }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            {item.type === 'CATEGORY' ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-medium text-gray-600">Category:</span>
                                                    <span className="text-xs font-bold text-black">{categories.find(c => c._id === item.categoryId)?.name || 'Loading...'}</span>
                                                </div>
                                            ) : item.type === 'GENDER' ? (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-medium text-gray-600">Gender:</span>
                                                    <span className="text-xs font-bold text-black">{item.gender}</span>
                                                </div>
                                            ) : (
                                                <code className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-400">{item.path}</code>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right space-x-2">
                                            <button onClick={() => openModal(item)} className="p-2 text-gray-300 hover:text-black hover:bg-white rounded-lg transition-all"><Edit2 className="h-4 w-4" /></button>
                                            <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="h-4 w-4" /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-[32px] shadow-2xl relative z-10 w-full max-w-md overflow-hidden" >
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h2 className="text-2xl font-serif">{editingItem ? 'Edit Tab' : 'New Navigation Tab'}</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Configure automated mapping below</p>
                                </div>
                                <button onClick={closeModal} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"><Plus className="h-5 w-5 rotate-45 text-gray-400" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <Input label="Tab Label" placeholder="e.g. Accessories" value={label} onChange={(e) => setLabel(e.target.value)} required />

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mapping Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['CATEGORY', 'GENDER', 'CUSTOM'] as const).map((t) => (
                                            <button key={t} type="button" onClick={() => setType(t)} className={`py-2 px-1 rounded-xl text-[9px] font-black tracking-widest transition-all ${type === t ? 'bg-black text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {type === 'CATEGORY' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Category</label>
                                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full bg-gray-50 border border-transparent focus:border-black rounded-xl py-3 px-4 text-sm font-bold focus:outline-none transition-all" required >
                                            <option value="">Choose a category...</option>
                                            {categories.map((cat) => (
                                                <option key={cat._id} value={cat._id}>{cat.name} ({cat.gender})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {type === 'GENDER' && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Department</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['MEN', 'WOMEN', 'UNISEX'] as const).map((g) => (
                                                <button key={g} type="button" onClick={() => setGender(g)} className={`py-2 rounded-xl text-[10px] font-bold transition-all ${gender === g ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {type === 'CUSTOM' && (
                                    <Input label="Custom Path" placeholder="/collection or https://..." value={path} onChange={(e) => setPath(e.target.value)} required />
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Display Order" type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value))} required />
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Visible</label>
                                        <button type="button" onClick={() => setIsActive(!isActive)} className={`h-11 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest ${isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                            {isActive ? 'Active' : 'Hidden'}
                                        </button>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-14" isLoading={isSubmitting}>
                                    {editingItem ? 'Save Changes' : 'Create Navigation Tab'}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
