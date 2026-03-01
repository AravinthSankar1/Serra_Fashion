import { useState, useEffect } from 'react';
import { Save, Truck, Mail, MapPin, Shield, Info } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'react-toastify';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PremiumLoader from '../../components/ui/PremiumLoader';

export default function AdminSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState({
        freeShippingThreshold: 999,
        deliveryCharge: 79,
        returnWindowDays: 7,
        returnPolicy: '',
        exchangePolicy: '',
        contactEmail: '',
        contactPhone: '',
        storeAddress: '',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            if (res.data.data) {
                setSettings(res.data.data);
            }
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put('/settings', settings);
            toast.success('Settings updated successfully');
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

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

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                    <div className="bg-black rounded-[40px] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center space-x-4 mb-4">
                            <Info className="h-6 w-6 text-white/50" />
                            <h3 className="text-lg font-serif">Quick Pro-Tip</h3>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed mb-6">
                            Updates to shipping thresholds and delivery charges take effect immediately across all active sessions and the checkout page.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
