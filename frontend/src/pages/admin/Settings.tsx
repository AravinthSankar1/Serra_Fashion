import { useState, useEffect } from 'react';
import { Save, Truck, Mail, MapPin, Shield, Info, CreditCard, Tag, Plus, Trash2 } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PremiumLoader from '../../components/ui/PremiumLoader';

interface CategoryDiscount {
    categoryId: string;
    categoryName: string;
    discountPercentage: number;
}

interface Category {
    _id: string;
    name: string;
}

interface QuantityDiscount {
    minQuantity: number;
    discountPercentage: number;
    categoryId?: string;
    categoryName?: string;
}

export default function AdminSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const queryClient = useQueryClient();
    const [categories, setCategories] = useState<Category[]>([]);
    const [settings, setSettings] = useState({
        freeShippingThreshold: 999,
        deliveryCharge: 79,
        returnWindowDays: 7,
        returnPolicy: '',
        exchangePolicy: '',
        contactEmail: '',
        contactPhone: '',
        storeAddress: '',
        isCodEnabled: true,
        isRazorpayEnabled: true,
        categoryDiscounts: [] as CategoryDiscount[],
        quantityDiscounts: [] as QuantityDiscount[],
    });

    useEffect(() => {
        Promise.all([fetchSettings(), fetchCategories()]);
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data.data) {
                setSettings(prev => ({
                    ...prev,
                    ...res.data.data,
                    categoryDiscounts: res.data.data.categoryDiscounts || [],
                    quantityDiscounts: res.data.data.quantityDiscounts || [],
                }));
            }
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data || []);
        } catch (_) {}
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put('/settings', settings);
            queryClient.invalidateQueries({ queryKey: ['store-settings'] });
            toast.success('Settings updated successfully');
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Category Discount helpers ──────────────────────────────────────
    const addCategoryDiscount = () => {
        setSettings(prev => ({
            ...prev,
            categoryDiscounts: [
                ...prev.categoryDiscounts,
                { categoryId: '', categoryName: '', discountPercentage: 0 },
            ],
        }));
    };

    const updateCategoryDiscount = (index: number, field: keyof CategoryDiscount, value: string | number) => {
        const updated = [...settings.categoryDiscounts];
        if (field === 'categoryId') {
            const cat = categories.find(c => c._id === value);
            updated[index] = {
                ...updated[index],
                categoryId: value as string,
                categoryName: cat?.name || '',
            };
        } else {
            (updated[index] as any)[field] = value;
        }
        setSettings(prev => ({ ...prev, categoryDiscounts: updated }));
    };

    const removeCategoryDiscount = (index: number) => {
        setSettings(prev => ({
            ...prev,
            categoryDiscounts: prev.categoryDiscounts.filter((_, i) => i !== index),
        }));
    };

    // ── Quantity Discount helpers ──────────────────────────────────────
    const addQuantityDiscount = () => {
        setSettings(prev => ({
            ...prev,
            quantityDiscounts: [
                ...prev.quantityDiscounts,
                { minQuantity: 1, discountPercentage: 0, categoryId: '', categoryName: '' },
            ],
        }));
    };

    const updateQuantityDiscount = (index: number, field: keyof QuantityDiscount, value: any) => {
        const updated = [...settings.quantityDiscounts];
        if (field === 'categoryId') {
            const cat = categories.find(c => c._id === value);
            updated[index] = {
                ...updated[index],
                categoryId: value as string,
                categoryName: cat?.name || '',
            };
        } else {
            (updated[index] as any)[field] = value;
        }
        setSettings(prev => ({ ...prev, quantityDiscounts: updated }));
    };

    const removeQuantityDiscount = (index: number) => {
        setSettings(prev => ({
            ...prev,
            quantityDiscounts: prev.quantityDiscounts.filter((_, i) => i !== index),
        }));
    };

    // Categories that already have a discount assigned
    const usedCategoryIds = new Set(settings.categoryDiscounts.map(d => d.categoryId));

    if (isLoading) return <PremiumLoader text="Loading System Preferences..." />;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900">Store Settings</h1>
                    <p className="text-gray-500 mt-2">Configure global store preferences and policies.</p>
                </div>
                <Button
                    onClick={handleSave}
                    isLoading={isSaving}
                    className="h-12 px-8 rounded-2xl shadow-xl shadow-black/10"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save All Changes
                </Button>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Shipping & Delivery */}
                    <div className="space-y-6">
                        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                    <Truck className="h-5 w-5" />
                                </div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Shipping & Delivery</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Free Shipping Over (₹)"
                                    type="number"
                                    value={settings.freeShippingThreshold}
                                    onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                                />
                                <Input
                                    label="Standard Delivery Charge (₹)"
                                    type="number"
                                    value={settings.deliveryCharge}
                                    onChange={(e) => setSettings({ ...settings, deliveryCharge: Number(e.target.value) })}
                                />
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Returns & Exchanges</h2>
                            </div>

                            <Input
                                label="Return Window (Days)"
                                type="number"
                                value={settings.returnWindowDays}
                                onChange={(e) => setSettings({ ...settings, returnWindowDays: Number(e.target.value) })}
                            />
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Return Policy Snippet</label>
                                <textarea
                                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none min-h-[100px] resize-none"
                                    value={settings.returnPolicy}
                                    onChange={(e) => setSettings({ ...settings, returnPolicy: e.target.value })}
                                    placeholder="e.g. 7-day easy returns for all unworn items"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Exchange Policy Snippet</label>
                                <textarea
                                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none min-h-[100px] resize-none"
                                    value={settings.exchangePolicy}
                                    onChange={(e) => setSettings({ ...settings, exchangePolicy: e.target.value })}
                                    placeholder="e.g. 14-day effortless size exchange"
                                />
                            </div>
                        </section>
                    </div>

                    {/* Contact & Location */}
                    <div className="space-y-6">
                        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Contact Information</h2>
                            </div>

                            <Input
                                label="Store Support Email"
                                type="email"
                                value={settings.contactEmail}
                                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                            />
                            <Input
                                label="Contact Phone"
                                value={settings.contactPhone}
                                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                            />
                        </section>

                        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Store Location</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Full Physical Address</label>
                                <textarea
                                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none min-h-[120px] resize-none"
                                    value={settings.storeAddress}
                                    onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                                    placeholder="Store address for invoices and footer"
                                />
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <CreditCard className="h-5 w-5" />
                                </div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Payment Gateways</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div>
                                        <p className="text-sm font-bold">Razorpay Online</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enable automated payments</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.isRazorpayEnabled}
                                            onChange={(e) => setSettings({ ...settings, isRazorpayEnabled: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div>
                                        <p className="text-sm font-bold">Cash On Delivery</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enable manual collection</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={settings.isCodEnabled}
                                            onChange={(e) => setSettings({ ...settings, isCodEnabled: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                    </label>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* ── Global Category Discounts ──────────────────────────── */}
                <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                <Tag className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Global Category Discounts</h2>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                    Apply a site-wide discount % to all products in a specific category
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={addCategoryDiscount}
                            className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-black border-2 border-black px-4 py-2 rounded-xl hover:bg-black hover:text-white transition-all"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Category Rule</span>
                        </button>
                    </div>

                    {settings.categoryDiscounts.length === 0 ? (
                        <div className="py-12 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                            <Tag className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-400">No category discounts configured.</p>
                            <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-widest">Click "Add Category Rule" to create one</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                <div className="col-span-6">Category</div>
                                <div className="col-span-4">Discount %</div>
                                <div className="col-span-2 text-right">Action</div>
                            </div>
                            {settings.categoryDiscounts.map((rule, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 items-center bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                                    <div className="col-span-6">
                                        <select
                                            className="w-full bg-white border border-gray-100 rounded-xl py-2.5 px-3 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none"
                                            value={rule.categoryId}
                                            onChange={(e) => updateCategoryDiscount(index, 'categoryId', e.target.value)}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option
                                                    key={cat._id}
                                                    value={cat._id}
                                                    disabled={usedCategoryIds.has(cat._id) && rule.categoryId !== cat._id}
                                                >
                                                    {cat.name}
                                                    {usedCategoryIds.has(cat._id) && rule.categoryId !== cat._id ? ' (already set)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-4">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="w-full bg-white border border-gray-100 rounded-xl py-2.5 px-3 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                                                value={rule.discountPercentage}
                                                onChange={(e) => updateCategoryDiscount(index, 'discountPercentage', Number(e.target.value))}
                                                placeholder="0"
                                            />
                                            <span className="text-sm font-black text-gray-400 shrink-0">%</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        {rule.discountPercentage > 0 && rule.categoryId && (
                                            <span className="text-[9px] font-black px-2 py-1 bg-rose-50 text-rose-600 rounded-lg uppercase tracking-tight mr-2">
                                                -{rule.discountPercentage}% OFF
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeCategoryDiscount(index)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="pt-2 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                                    ⚠️ Important: These are global discounts for display/promotional purposes.
                                    They will be visible in the admin panel. To auto-apply them to product pricing,
                                    use the "Apply to Products" workflow from the category management page.
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* ── Quantity Discounts ──────────────────────────── */}
                <section className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <Plus className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Quantity Discounts</h2>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                    Apply automatic discounts when users add multiple products to their cart (e.g. Buy 2 get 10% off)
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={addQuantityDiscount}
                            className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-black border-2 border-black px-4 py-2 rounded-xl hover:bg-black hover:text-white transition-all"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Quantity Rule</span>
                        </button>
                    </div>

                    {settings.quantityDiscounts.length === 0 ? (
                        <div className="py-12 text-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                            <Plus className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-400">No quantity discounts configured.</p>
                            <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-widest">Click "Add Quantity Rule" to create one</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-4 px-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                <div className="col-span-4">Target Category</div>
                                <div className="col-span-3">Min. Quantity</div>
                                <div className="col-span-3">Discount %</div>
                                <div className="col-span-2 text-right">Action</div>
                            </div>
                            {settings.quantityDiscounts.map((rule, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 items-center bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                                    <div className="col-span-4">
                                        <select
                                            className="w-full bg-white border border-gray-100 rounded-xl py-2.5 px-3 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none"
                                            value={rule.categoryId || ""}
                                            onChange={(e) => updateQuantityDiscount(index, 'categoryId', e.target.value)}
                                        >
                                            <option value="">All Categories</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full bg-white border border-gray-100 rounded-xl py-2.5 px-3 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                                                value={rule.minQuantity}
                                                onChange={(e) => updateQuantityDiscount(index, 'minQuantity', Number(e.target.value))}
                                                placeholder="2"
                                            />
                                            <span className="text-sm font-black text-gray-400 shrink-0">Items</span>
                                        </div>
                                    </div>
                                    <div className="col-span-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="w-full bg-white border border-gray-100 rounded-xl py-2.5 px-3 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                                                value={rule.discountPercentage}
                                                onChange={(e) => updateQuantityDiscount(index, 'discountPercentage', Number(e.target.value))}
                                                placeholder="0"
                                            />
                                            <span className="text-sm font-black text-gray-400 shrink-0">%</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        {rule.discountPercentage > 0 && rule.minQuantity >= 1 && (
                                            <div className="flex flex-col items-end mr-2">
                                                <span className="text-[9px] font-black px-2 py-1 bg-blue-50 text-blue-600 rounded-lg uppercase tracking-tight whitespace-nowrap">
                                                    BUY {rule.minQuantity}+ GET {rule.discountPercentage}% OFF
                                                </span>
                                                {rule.categoryId && (
                                                    <span className="text-[7px] font-black uppercase text-gray-400 mt-0.5 tracking-[0.2em]">{rule.categoryName || 'Selected Cat'} ONLY</span>
                                                )}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeQuantityDiscount(index)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Pro Tip */}
                <div className="bg-black rounded-[40px] p-8 text-white relative overflow-hidden group mb-8">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    <div className="flex items-center space-x-4 mb-4">
                        <Info className="h-6 w-6 text-white/50" />
                        <h3 className="text-lg font-serif">Quick Pro-Tip</h3>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed mb-6">
                        Updates to shipping thresholds and delivery charges take effect immediately across all active sessions and the checkout page. Category discounts are stored globally and can be referenced in promotions.
                    </p>
                </div>

                <div className="flex justify-end pb-12">
                    <Button
                        onClick={handleSave}
                        isLoading={isSaving}
                        className="h-14 px-12 rounded-[28px] shadow-2xl shadow-black/20 text-base"
                    >
                        <Save className="w-5 h-5 mr-3" />
                        Save All System Preferences
                    </Button>
                </div>
            </form>
        </div>
    );
}
