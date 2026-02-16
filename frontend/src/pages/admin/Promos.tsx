import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Calendar, Percent, Ticket } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PremiumLoader from '../../components/ui/PremiumLoader';

interface Promo {
    _id: string;
    code: string;
    description: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minOrderAmount: number;
    usageLimit: number;
    usedCount: number;
    expiresAt: string;
    isActive: boolean;
}

export default function AdminPromos() {
    const [promos, setPromos] = useState<Promo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Promo | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: 0,
        usageLimit: 100,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true
    });

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/promos');
            setPromos(res.data.data.promos);
        } catch (error) {
            toast.error('Failed to fetch promos');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPromo) {
                await api.patch(`/promos/${editingPromo._id}`, formData);
                toast.success('Promo updated');
            } else {
                await api.post('/promos', formData);
                toast.success('Promo created');
            }
            setIsModalOpen(false);
            setEditingPromo(null);
            resetForm();
            fetchPromos();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Action failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this promo?')) return;
        try {
            await api.delete(`/promos/${id}`);
            toast.success('Promo deleted');
            fetchPromos();
        } catch (error) {
            toast.error('Failed to delete promo');
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            type: 'PERCENTAGE',
            value: 10,
            minOrderAmount: 0,
            usageLimit: 100,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isActive: true
        });
    };

    const filteredPromos = promos.filter(p =>
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <PremiumLoader />;

    return (
        <div className="space-y-8 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 uppercase tracking-tight">Promo Codes</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage discounts and seasonal offers</p>
                </div>
                <Button onClick={() => { setEditingPromo(null); resetForm(); setIsModalOpen(true); }} className="h-12 px-6 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Create Promo</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by code or description..."
                        className="w-full pl-12 pr-4 h-14 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black/5 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-white rounded-2xl border border-gray-100 p-1">
                    <button className="flex-1 py-1 text-xs font-bold uppercase tracking-widest bg-black text-white rounded-xl">Active</button>
                    <button className="flex-1 py-1 text-xs font-bold uppercase tracking-widest text-gray-400">All</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredPromos.map((promo) => (
                        <motion.div
                            key={promo._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
                                    <Ticket className="w-6 h-6" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setEditingPromo(promo); setFormData({ ...promo, expiresAt: promo.expiresAt.split('T')[0] } as any); setIsModalOpen(true); }}
                                        className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-black transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(promo._id)}
                                        className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold tracking-tight mb-1">{promo.code}</h3>
                            <p className="text-sm text-gray-500 mb-6 line-clamp-2">{promo.description}</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                        <Percent className="w-3 h-3" />
                                        Discount
                                    </div>
                                    <span className="text-lg font-bold">
                                        {promo.type === 'PERCENTAGE' ? `${promo.value}%` : `₹${promo.value}`}
                                    </span>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                        <Calendar className="w-3 h-3" />
                                        Expires
                                    </div>
                                    <span className="text-xs font-bold">
                                        {new Date(promo.expiresAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    Used: {promo.usedCount} / {promo.usageLimit}
                                </span>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${promo.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                    }`}>
                                    {promo.isActive ? 'Active' : 'Expired'}
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
                        className="relative bg-white w-full max-w-lg rounded-[40px] p-10 overflow-hidden shadow-2xl"
                    >
                        <h2 className="text-2xl font-serif font-bold mb-8">
                            {editingPromo ? 'Edit Promo Code' : 'Create New Promo'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <Input
                                    label="Promo Code"
                                    placeholder="e.g. SUMMER25"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    required
                                />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Type</label>
                                    <select
                                        className="w-full h-12 bg-gray-50 border-none rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FIXED">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                            </div>

                            <Input
                                label="Description"
                                placeholder="Describe this offer..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />

                            <div className="grid grid-cols-2 gap-6">
                                <Input
                                    label="Discount Value"
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                    required
                                />
                                <Input
                                    label="Min Order Amount"
                                    type="number"
                                    value={formData.minOrderAmount}
                                    onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <Input
                                    label="Usage Limit"
                                    type="number"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                                    required
                                />
                                <Input
                                    label="Expiry Date"
                                    type="date"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 h-14 bg-gray-100 text-black rounded-2xl text-xs font-bold uppercase tracking-widest shadow-sm active:scale-[0.98] transition-transform"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] h-14 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-black/10 active:scale-[0.98] transition-all"
                                >
                                    {editingPromo ? 'Update Promo' : 'Create Promo'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
