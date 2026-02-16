import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { User, Camera, Mail, Globe, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import PremiumLoader from '../components/ui/PremiumLoader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const COUNTRIES = [
    { name: 'India', code: '+91', states: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'West Bengal'] },
    { name: 'United States', code: '+1', states: ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Massachusetts'] },
    { name: 'United Kingdom', code: '+44', states: ['England', 'Scotland', 'Wales', 'Northern Ireland'] },
    { name: 'United Arab Emirates', code: '+971', states: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'] },
    { name: 'Canada', code: '+1', states: ['Ontario', 'Quebec', 'British Columbia', 'Alberta'] },
];

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Mandarin'];

export default function ProfilePage() {
    const { user, updateUser, isLoading: isAuthLoading } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [name, setName] = useState(user?.name || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [language, setLanguage] = useState(user?.language || 'English');
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>(user?.profilePicture?.imageUrl || '');
    const [addresses, setAddresses] = useState<any[]>(user?.address || []);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [isPinLoading, setIsPinLoading] = useState(false);

    // Redirect if not logged in
    useEffect(() => {
        if (!isAuthLoading && !user) {
            navigate('/login');
        }
    }, [user, isAuthLoading, navigate]);

    // Sync state when user data loads
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhoneNumber(user.phoneNumber || '');
            setLanguage(user.language || 'English');
            setPreviewUrl(user.profilePicture?.imageUrl || '');
            setAddresses(user.address || []);
        }
    }, [user]);

    // Temp Address Form State
    const [tempAddress, setTempAddress] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'India'
    });

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-black">
                <PremiumLoader />
            </div>
        );
    }

    if (!user) return null;

    useEffect(() => {
        const lookupPin = async () => {
            if (tempAddress.zip.length === 6 && tempAddress.country === 'India') {
                setIsPinLoading(true);
                try {
                    const res = await fetch(`https://api.postalpincode.in/pincode/${tempAddress.zip}`);
                    const data = await res.json();
                    if (data[0].Status === 'Success') {
                        const postOffice = data[0].PostOffice[0];
                        setTempAddress(prev => ({
                            ...prev,
                            city: postOffice.District,
                            state: postOffice.State
                        }));
                        toast.success(`Location identified: ${postOffice.District}`);
                    }
                } catch (e) {
                    console.error('PIN lookup failed');
                } finally {
                    setIsPinLoading(false);
                }
            }
        };
        lookupPin();
    }, [tempAddress.zip, tempAddress.country]);

    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const res = await api.put('/users/me', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            updateUser(data.data);
            toast.success('Profile updated successfully!', {
                position: "bottom-right",
                theme: "dark"
            });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setProfileFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const validatePhone = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (phoneNumber && !validatePhone(phoneNumber)) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('phoneNumber', phoneNumber);
        formData.append('language', language);
        formData.append('address', JSON.stringify(addresses));
        if (profileFile) {
            formData.append('profile', profileFile);
        }
        mutation.mutate(formData);
    };

    const handleAddAddress = () => {
        if (!tempAddress.street || !tempAddress.city || !tempAddress.state) {
            toast.error('Please fill in all address fields');
            return;
        }
        setAddresses([...addresses, tempAddress]);
        setTempAddress({ street: '', city: '', state: '', zip: '', country: 'India' });
        setIsAddressModalOpen(false);
    };

    const removeAddress = (index: number) => {
        setAddresses(addresses.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Profile Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div className="bg-white rounded-[48px] shadow-2xl shadow-gray-200/50 p-8 border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <ShieldCheck className="h-6 w-6 text-emerald-500" />
                        </div>

                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="relative group">
                                <div className="h-32 w-32 rounded-full border-[4px] border-gray-50 overflow-hidden shadow-inner bg-gray-50">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-300">
                                            <User className="h-12 w-12" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 p-2.5 bg-black text-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                    <Camera className="h-4 w-4" />
                                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                </label>
                            </div>

                            <div>
                                <h2 className="text-2xl font-serif text-gray-900">{user?.name}</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{user?.role} Member</p>
                            </div>

                            <div className="w-full pt-6 border-t border-gray-50 space-y-4 text-left">
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 truncate">{user?.email}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                        <Globe className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">{language} (Primary)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-black rounded-[40px] p-8 text-white">
                        <h3 className="text-lg font-serif mb-4">SÉRRA FASHION Rewards</h3>
                        <p className="text-white/60 text-xs leading-relaxed mb-6">You are 250 points away from unlocking Exclusive Priority Shipping.</p>
                        <Link to="/orders" className="flex items-center justify-between group">
                            <span className="text-xs font-bold uppercase tracking-widest">View My Earnings</span>
                            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>

                {/* Right Panel: Settings Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2"
                >
                    <div className="bg-white rounded-[48px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                        <div className="px-10 py-12">
                            <h3 className="text-2xl font-serif mb-8">Account Settings</h3>

                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <Input
                                        label="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent">
                                            <span className="text-sm font-medium text-gray-400">{user?.email}</span>
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                                        <div className="flex space-x-2">
                                            <select className="bg-gray-50 border-none rounded-2xl px-3 text-xs font-bold text-gray-500 focus:ring-0">
                                                {COUNTRIES.map(c => <option key={c.name} value={c.code}>{c.code}</option>)}
                                            </select>
                                            <Input
                                                containerClassName="flex-1 !mt-0"
                                                placeholder="10 digit mobile number"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Primary Language</label>
                                        <select
                                            className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5"
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                        >
                                            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Addresses</label>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {addresses.map((addr, idx) => (
                                            <div key={idx} className="h-2 w-8 bg-black rounded-full" title={addr.street} />
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setIsAddressModalOpen(true)}
                                            className="ml-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                                        >
                                            + Manage Saved Addresses
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <p className="text-xs text-gray-400 max-w-sm">
                                        Providing your phone number helps us reach you for delivery updates and account security.
                                    </p>
                                    <Button
                                        type="submit"
                                        className="h-14 px-12 rounded-2xl"
                                        isLoading={mutation.isPending}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Saved Addresses List (Inline) */}
                        {addresses.length > 0 && (
                            <div className="bg-gray-50/50 p-10 space-y-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Saved Addresses</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {addresses.map((addr, idx) => (
                                        <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 flex justify-between items-start group">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-gray-900">{addr.street}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                    {addr.city}, {addr.state} • {addr.country}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeAddress(idx)}
                                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <CheckCircle2 className="h-4 w-4 fill-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Address Modal with Country/State Dropdowns */}
            <AnimatePresence>
                {isAddressModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddressModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                            <div className="p-10 space-y-8">
                                <div>
                                    <h2 className="text-2xl font-serif">Add New Address</h2>
                                    <p className="text-xs text-gray-400 mt-1">Please provide accurate shipping details.</p>
                                </div>
                                <div className="space-y-6">
                                    <Input
                                        label="Street Address"
                                        placeholder="Flat, House no., Building, Street"
                                        value={tempAddress.street}
                                        onChange={(e) => setTempAddress({ ...tempAddress, street: e.target.value })}
                                    />

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Country</label>
                                            <select
                                                className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5"
                                                value={tempAddress.country}
                                                onChange={(e) => setTempAddress({ ...tempAddress, country: e.target.value, state: '' })}
                                            >
                                                {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">State / Province</label>
                                            <select
                                                className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5"
                                                value={tempAddress.state}
                                                onChange={(e) => setTempAddress({ ...tempAddress, state: e.target.value })}
                                            >
                                                <option value="">Select State</option>
                                                {COUNTRIES.find(c => c.name === tempAddress.country)?.states.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <Input
                                            label="City"
                                            value={tempAddress.city}
                                            onChange={(e) => setTempAddress({ ...tempAddress, city: e.target.value })}
                                        />
                                        <div className="relative">
                                            <Input
                                                label="Zip Code"
                                                value={tempAddress.zip}
                                                onChange={(e) => setTempAddress({ ...tempAddress, zip: e.target.value })}
                                            />
                                            {isPinLoading && (
                                                <div className="absolute right-4 top-14">
                                                    <PremiumLoader size="sm" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-4 pt-4">
                                    <Button variant="outline" className="flex-1 h-14 rounded-2xl" onClick={() => setIsAddressModalOpen(false)}>Discard</Button>
                                    <Button className="flex-1 h-14 rounded-2xl" onClick={handleAddAddress}>Add Address</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

