import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart, useAuth } from '../context';
import { useCurrency } from '../hooks/useCurrency';
import type { CartItem } from '../types';
import api from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Navbar from '../components/layout/Navbar';
import { ShieldCheck, Truck, CreditCard, ArrowRight, Loader2, CheckCircle2, Check, Plus, Download, MapPin } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
// @ts-ignore
import { useRazorpay } from 'react-razorpay';
import PremiumLoader from '../components/ui/PremiumLoader';

// ─── ZOD SCHEMA ────────────────────────────────────────────
const checkoutSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Valid phone number is required'),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ─── INTERFACES ────────────────────────────────────────────
interface CountryData {
    code: string;
    name: string;
    phoneCode: string;
    currency: string;
    flag: string;
}

interface StateData {
    code: string;
    name: string;
}

// ─── MAIN COMPONENT ────────────────────────────────────────
export default function CheckoutPage() {
    const { cartItems, cartTotal, getItemPrice, clearCart, isCartLoading } = useCart();
    const { user, updateUser, isLoading: isAuthLoading } = useAuth();
    const { format, convert } = useCurrency();
    const navigate = useNavigate();

    // ─── PAYMENT STATE ─────────────────────────────────────
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');

    // ─── RAZORPAY LIFECYCLE REFS ───────────────────────────
    const abortControllerRef = useRef<AbortController | null>(null);
    const paymentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const razorpayInstanceRef = useRef<any>(null);

    // ─── PROMO STATE ───────────────────────────────────────
    const [couponCode, setCouponCode] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [discount, setDiscount] = useState(0);

    // ─── ADDRESS STATE ─────────────────────────────────────
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [isPinLoading, setIsPinLoading] = useState(false);
    const [tempAddress, setTempAddress] = useState({
        street: '', city: '', state: '', zip: '', country: 'India'
    });

    // ─── DYNAMIC LOCATION DATA ─────────────────────────────
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [states, setStates] = useState<StateData[]>([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [selectedCountryCode, setSelectedCountryCode] = useState('IN');

    // ─── FORM ──────────────────────────────────────────────
    const { Razorpay, isLoading: isRzpLoading, error: rzpError } = useRazorpay();
    const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<CheckoutFormData>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            email: user?.email || '',
            firstName: user?.name ? user.name.split(' ')[0] : '',
            lastName: user?.name ? user.name.split(' ').slice(1).join(' ') : '',
            phone: user?.phoneNumber || '',
            country: 'India'
        }
    });

    // ─── RAZORPAY ERROR TOAST ─────────────────────────────
    useEffect(() => {
        if (rzpError) {
            console.error('[RAZORPAY] SDK Error:', rzpError);
            toast.error(`Payment SDK Error: ${rzpError}`);
        }
    }, [rzpError]);

    useEffect(() => {
        console.log('[RAZORPAY] SDK Loaded:', !!Razorpay);
    }, [Razorpay]);

    // ─── CLEANUP FUNCTION (CRITICAL FOR RAZORPAY) ──────────
    const cleanupPaymentState = useCallback(() => {
        setIsSubmitting(false);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        if (paymentTimeoutRef.current) {
            clearTimeout(paymentTimeoutRef.current);
            paymentTimeoutRef.current = null;
        }

        razorpayInstanceRef.current = null;
    }, []);

    // ─── UNMOUNT CLEANUP ───────────────────────────────────
    useEffect(() => {
        return () => { cleanupPaymentState(); };
    }, [cleanupPaymentState]);

    // ─── LOAD COUNTRIES FROM API ───────────────────────────
    useEffect(() => {
        const loadCountries = async () => {
            try {
                const res = await api.get('/locations/countries');
                setCountries(res.data.data || []);
            } catch (error) {
                console.error('Failed to load countries');
            }
        };
        loadCountries();
    }, []);

    // ─── LOAD STATES WHEN COUNTRY CHANGES ──────────────────
    useEffect(() => {
        const loadStates = async () => {
            if (!selectedCountryCode) return;
            setIsLoadingLocations(true);
            try {
                // Compatible with both /locations/states/IN and /locations/countries/IN/states
                const res = await api.get(`/locations/countries/${selectedCountryCode}/states`);
                setStates(res.data.data || []);
            } catch (error) {
                console.error('Failed to load states');
                setStates([]);
            } finally {
                setIsLoadingLocations(false);
            }
        };
        loadStates();
    }, [selectedCountryCode]);

    // ─── AUTO-PREFILL FROM SAVED SHIPPING ADDRESS ──────────
    useEffect(() => {
        if (user?.defaultShippingAddress) {
            // ... (existing logic)
            const addr = user.defaultShippingAddress;
            reset({
                firstName: addr.firstName || user.name?.split(' ')[0] || '',
                lastName: addr.lastName || user.name?.split(' ').slice(1).join(' ') || '',
                email: user.email || '',
                phone: addr.phone || user.phoneNumber || '',
                street: addr.street || '',
                city: addr.city || '',
                state: addr.state || '',
                zipCode: addr.zipCode || '',
                country: addr.country || 'India'
            });
            const matchedCountry = countries.find(c => c.name === addr.country);
            if (matchedCountry) setSelectedCountryCode(matchedCountry.code);
        } else if (user) {
            reset({
                email: user.email || '',
                firstName: user.name ? user.name.split(' ')[0] : '',
                lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
                phone: user.phoneNumber || '',
                country: 'India'
            });

            // Auto-open new address form if no saved addresses
            if (!user.address || user.address.length === 0) {
                setIsAddingAddress(true);
            }
        }
    }, [user, reset, countries]);

    // ─── DEBOUNCED AUTO-SAVE SHIPPING ADDRESS ──────────────
    const watchedFields = watch();
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!user) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            const { firstName, lastName, phone, street, city, state, zipCode, country } = watchedFields;
            if (firstName && lastName && phone && street && city && state && zipCode && country) {
                try {
                    await api.put('/users/shipping-address', {
                        firstName, lastName, phone, street, city, state, zipCode, country
                    });
                } catch {
                    // Silent — non-blocking background save
                }
            }
        }, 3000);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [watchedFields.firstName, watchedFields.lastName, watchedFields.phone, watchedFields.street, watchedFields.city, watchedFields.state, watchedFields.zipCode, watchedFields.country, user]);

    // ─── SYNC FORM WITH SELECTED SAVED ADDRESS (REMOVED: USING DIRECT DATA) ─────
    // Logic moved to onSubmit to avoid complex syncing


    // ─── SYNC FORM WITH TEMP ADDRESS (NEW ADDRESS MODE) ────
    useEffect(() => {
        if (isAddingAddress) {
            const options = { shouldValidate: true, shouldDirty: true };
            setValue('street', tempAddress.street, options);
            setValue('city', tempAddress.city, options);
            setValue('state', tempAddress.state, options);
            setValue('zipCode', tempAddress.zip, options);
            setValue('country', tempAddress.country || (countries.find(c => c.code === selectedCountryCode)?.name || 'India'), options);
        }
    }, [tempAddress, isAddingAddress, setValue, selectedCountryCode, countries]);

    // ─── PIN CODE AUTO-LOOKUP ──────────────────────────────
    useEffect(() => {
        const lookupPin = async () => {
            if (tempAddress.zip.length === 6 && selectedCountryCode === 'IN') {
                setIsPinLoading(true);
                try {
                    const res = await fetch(`https://api.postalpincode.in/pincode/${tempAddress.zip}`);
                    const data = await res.json();
                    if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.[0]) {
                        const postOffice = data[0].PostOffice[0];
                        setTempAddress(prev => ({
                            ...prev,
                            city: postOffice.District,
                            state: postOffice.State
                        }));
                        toast.success(`📍 ${postOffice.District}, ${postOffice.State}`, { autoClose: 1500 });
                    }
                } catch {
                    // Silent fail
                } finally {
                    setIsPinLoading(false);
                }
            }
        };
        lookupPin();
    }, [tempAddress.zip, selectedCountryCode]);

    // ─── HANDLE ADD NEW ADDRESS ────────────────────────────
    const handleAddNewAddress = async () => {
        if (!tempAddress.street || !tempAddress.city || !tempAddress.state || !tempAddress.zip) {
            toast.error('Please fill in all address fields');
            return;
        }

        try {
            const countryName = countries.find(c => c.code === selectedCountryCode)?.name || tempAddress.country;
            const res = await api.post('/users/address', {
                ...tempAddress,
                country: countryName,
                isDefault: !user?.address?.length
            });
            if (user) {
                updateUser({ ...user, address: res.data.data });
            }
            toast.success('Address saved');
            setIsAddingAddress(false);
            setSelectedAddressIndex(res.data.data.length - 1);
            setTempAddress({ street: '', city: '', state: '', zip: '', country: 'India' });
        } catch {
            toast.error('Failed to save address');
        }
    };

    // ─── PROMO CODE HANDLER ────────────────────────────────
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsValidatingCoupon(true);
        try {
            const res = await api.post('/promos/validate', {
                code: couponCode.trim(),
                orderAmount: cartTotal
            });
            const { discount: discountAmount } = res.data.data;
            setDiscount(discountAmount);
            setAppliedCoupon(couponCode.toUpperCase());
            toast.success(`🎉 Promo applied! Saved ${format(convert(discountAmount))}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid promo code');
            setDiscount(0);
            setAppliedCoupon(null);
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponCode('');
    };

    // ─── ORDER CREATION ────────────────────────────────────
    const processOrder = async (orderPayload: any) => {
        try {
            const res = await api.post('/orders', orderPayload);
            setOrderSuccess(res.data.data._id);
            clearCart();
        } catch {
            toast.error('Failed to create order');
        } finally {
            cleanupPaymentState();
        }
    };

    // ─── MAIN SUBMIT HANDLER ───────────────────────────────
    const onSubmit = async (data: CheckoutFormData) => {
        console.log('[CHECKOUT] onSubmit called with data:', data);
        console.log('[CHECKOUT] Payment Method:', paymentMethod);

        if (isSubmitting) {
            console.warn('[CHECKOUT] Submission blocked: isSubmitting is true');
            return;
        } // Double-click protection
        setIsSubmitting(true);
        const finalAmount = cartTotal - discount;

        // ─── SYNC ADDRESS DATA ────────────────────────────────
        if (isAddingAddress) {
            if (!tempAddress.street || !tempAddress.city || !tempAddress.state || !tempAddress.zip) {
                toast.error('Complete the address form first');
                setIsSubmitting(false);
                return;
            }
            if (tempAddress.street.length < 5) {
                toast.error('Street address is required (min 5 chars)');
                setIsSubmitting(false);
                return;
            }

            // Sync temp address to submission data
            data.street = tempAddress.street;
            data.city = tempAddress.city;
            data.state = tempAddress.state;
            data.zipCode = tempAddress.zip;
            data.country = tempAddress.country || 'India';

            // Auto-save logic
            const countryName = countries.find(c => c.code === selectedCountryCode)?.name || tempAddress.country;
            try {
                await api.post('/users/address', { ...tempAddress, country: countryName, isDefault: !user?.address?.length });
            } catch { /* continue */ }
        } else {
            // Case: Using saved address
            if (!user?.address || !user.address[selectedAddressIndex]) {
                toast.error('Please select a valid shipping address');
                setIsSubmitting(false);
                return;
            }
            const savedAddr = user.address[selectedAddressIndex] as any;
            data.street = savedAddr.street || '';
            data.city = savedAddr.city || '';
            data.state = savedAddr.state || '';
            data.zipCode = savedAddr.zip || savedAddr.zipCode || '';
            data.country = savedAddr.country || 'India';

            // Sync with form fields for prefill consistency
            setValue('firstName', data.firstName);
            setValue('lastName', data.lastName);
            setValue('phone', data.phone);
        }

        // ─── COD PATH ─────────────────────────────────────
        if (paymentMethod === 'COD') {
            await processOrder({
                items: cartItems.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    price: getItemPrice(item),
                    size: item.size,
                    color: item.color
                })),
                shippingAddress: data,
                subtotal: cartTotal,
                discount,
                promoCode: appliedCoupon,
                totalAmount: finalAmount,
                paymentMethod: 'COD',
                paymentStatus: 'PENDING'
            });
            return;
        }

        // ─── RAZORPAY PATH (HARDENED) ──────────────────────
        try {
            console.log('[RAZORPAY] Initiating payment flow...');
            const RzpConstructor = Razorpay || (window as any).Razorpay;

            if (!RzpConstructor) {
                console.error('[RAZORPAY] SDK not loaded');
                throw new Error("Razorpay SDK not loaded");
            }

            console.log('[RAZORPAY] Fetching keys...');
            const [keyRes, orderRes] = await Promise.all([
                api.get('/payment/razorpay-key'),
                api.post('/payment/create-order', { amount: finalAmount, currency: 'INR' })
            ]);
            console.log('[RAZORPAY] Key and Order response received');
            console.log('[RAZORPAY] Order ID:', orderRes.data.data.id);

            const razorpayKey = keyRes.data.data.key;
            const { id: order_id, amount, currency } = orderRes.data.data;

            const capturedData = { ...data }; // Snapshot form data

            const options = {
                key: razorpayKey,
                amount: Number(amount),
                currency,
                name: 'SÉRRA FASHION',
                description: 'Purchase Transaction',
                order_id,

                // ─── SUCCESS HANDLER ───────────────────────
                handler: async function (response: any) {
                    setIsSubmitting(true);
                    abortControllerRef.current = new AbortController();

                    // 30s timeout safety net
                    paymentTimeoutRef.current = setTimeout(() => {
                        cleanupPaymentState();
                        toast.error('Payment verification timed out. Contact support.');
                    }, 30000);

                    try {
                        await api.post('/payment/verify-and-create', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            orderData: {
                                items: cartItems.map(item => ({
                                    product: item.product._id,
                                    quantity: item.quantity,
                                    price: getItemPrice(item),
                                    size: item.size,
                                    color: item.color
                                })),
                                subtotal: cartTotal,
                                discount,
                                promoCode: appliedCoupon,
                                totalAmount: finalAmount,
                                shippingAddress: capturedData
                            }
                        }, { signal: abortControllerRef.current?.signal });

                        setOrderSuccess(response.razorpay_payment_id);
                        clearCart();
                        toast.success('Payment successful!');
                    } catch (error: any) {
                        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
                            toast.error('Payment verification failed. Contact support.');
                        }
                    } finally {
                        cleanupPaymentState();
                    }
                },

                prefill: {
                    name: `${data.firstName} ${data.lastName}`,
                    email: data.email,
                    contact: data.phone,
                },

                // ─── MODAL LIFECYCLE (CRITICAL FIX) ────────
                modal: {
                    ondismiss: function () {
                        cleanupPaymentState();
                        toast.info('Payment window closed. You can try again or choose COD.');
                    },
                    escape: true,
                    confirm_close: true,
                    animation: true,
                },

                theme: { color: '#000000' },
            };

            const rzp = new RzpConstructor(options);
            razorpayInstanceRef.current = rzp;

            // ─── FAILURE HANDLER ───────────────────────────
            rzp.on('payment.failed', function (response: any) {
                cleanupPaymentState();
                const desc = response?.error?.description || 'Payment failed';
                toast.error(desc);

                // Log failure to backend
                api.post('/payment/payment-failure', {
                    razorpay_order_id: order_id,
                    error: response?.error
                }).catch(() => { });
            });

            setIsSubmitting(false); // Allow user interaction while modal is open
            rzp.open();
        } catch (error: any) {
            console.error('Payment Initiation Error:', error);
            cleanupPaymentState();
            const message = error.response?.data?.message || error.message || 'Could not initiate payment';
            toast.error(message);
        }
    };


    // ─── COMPUTED VALUES ───────────────────────────────────
    const finalTotal = cartTotal - discount;
    const phoneCode = countries.find(c => c.code === selectedCountryCode)?.phoneCode || '91';

    // ═══════════════════════════════════════════════════════
    // ─── RENDER: ORDER SUCCESS ─────────────────────────────
    // ═══════════════════════════════════════════════════════
    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="max-w-md w-full bg-white border border-gray-100 rounded-[40px] p-12 text-center shadow-2xl shadow-gray-100"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                            className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8"
                        >
                            <CheckCircle2 className="h-10 w-10" />
                        </motion.div>
                        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Order Confirmed</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Thank you for your purchase. Order{' '}
                            <span className="font-bold text-black text-xs uppercase tracking-widest">
                                #{orderSuccess.slice(-8)}
                            </span>{' '}
                            is being prepared with care.
                        </p>
                        <div className="space-y-4">
                            <Button
                                onClick={async () => {
                                    try {
                                        const res = await api.get(`/orders/${orderSuccess}/invoice`, { responseType: 'blob' });
                                        const url = window.URL.createObjectURL(new Blob([res.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `serra-invoice-${orderSuccess.slice(-8)}.pdf`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.parentNode?.removeChild(link);
                                        window.URL.revokeObjectURL(url);
                                    } catch {
                                        toast.error('Failed to download invoice');
                                    }
                                }}
                                variant="outline"
                                className="w-full h-14 border-2 flex items-center justify-center space-x-2"
                            >
                                <Download className="h-4 w-4" />
                                <span>Download Invoice</span>
                            </Button>
                            <Button onClick={() => navigate('/orders')} variant="outline" className="w-full h-14 border-2">
                                View My Orders
                            </Button>
                            <Button onClick={() => navigate('/')} className="w-full h-14">
                                Continue Shopping
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ─── LOADING ───────────────────────────────────────────
    if (isAuthLoading || isCartLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <PremiumLoader />
            </div>
        );
    }

    // ─── NOT LOGGED IN ─────────────────────────────────────
    if (!user) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-32 text-center">
                    <h2 className="text-3xl font-serif text-gray-900">Please login to checkout</h2>
                    <p className="mt-4 text-gray-500">You need to be signed in to complete your purchase.</p>
                    <Button onClick={() => navigate('/login')} className="mt-8 mx-auto">Sign In</Button>
                </div>
            </div>
        );
    }

    // ─── EMPTY CART ────────────────────────────────────────
    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-32 text-center">
                    <h2 className="text-3xl font-serif text-gray-900">Your bag is empty</h2>
                    <p className="mt-4 text-gray-500">Add some pieces to your collection before checking out.</p>
                    <Button onClick={() => navigate('/')} className="mt-8 mx-auto">Browse Collection</Button>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════
    // ─── RENDER: MAIN CHECKOUT ─────────────────────────────
    // ═══════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-gray-50/50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-12 md:py-20 lg:p-24">
                <div className="flex flex-col lg:flex-row gap-16">
                    {/* ─── LEFT: FORM ───────────────────────── */}
                    <div className="flex-1 space-y-12">
                        <section>
                            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">Shipping Information</h2>
                            <form
                                id="checkout-form"
                                onSubmit={handleSubmit(onSubmit, (errors) => {
                                    console.error('[CHECKOUT] Form validation failed:', errors);
                                    toast.error('Please fix the errors in the form before proceeding.');
                                })}
                                className="space-y-6"
                            >

                                <div className="grid grid-cols-2 gap-6">
                                    <Input label="First Name" placeholder="e.g. John" error={errors.firstName?.message} {...register('firstName')} />
                                    <Input label="Last Name" placeholder="e.g. Doe" error={errors.lastName?.message} {...register('lastName')} />
                                </div>
                                <Input label="Email Address" type="email" placeholder="john@example.com" error={errors.email?.message} {...register('email')} />

                                {/* Phone with Dynamic Country Code */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                                    <div className="flex gap-2">
                                        <div className="w-24 bg-white border border-gray-200 rounded-2xl py-3.5 px-3 text-sm font-medium text-center text-gray-500 flex-shrink-0">
                                            +{phoneCode}
                                        </div>
                                        <input
                                            type="tel"
                                            placeholder="9876543210"
                                            className="flex-1 bg-white border border-gray-200 rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                            {...register('phone')}
                                        />
                                    </div>
                                    {errors.phone && <p className="text-xs text-red-500 px-1">{errors.phone.message}</p>}
                                </div>

                                {/* ─── DELIVERY ADDRESS ─────────────── */}
                                <div className="pt-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5" />
                                            Delivery Address
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingAddress(!isAddingAddress)}
                                            className="text-xs font-bold text-black hover:underline"
                                        >
                                            {isAddingAddress ? 'Cancel' : 'Add New Address'}
                                        </button>
                                    </div>

                                    {/* Saved Addresses */}
                                    {!isAddingAddress && user?.address && user.address.length > 0 && (
                                        <div className="flex space-x-4 overflow-x-auto pb-4 mb-6 custom-scrollbar">
                                            {user.address.map((addr: any, idx: number) => (
                                                <motion.div
                                                    key={idx}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => setSelectedAddressIndex(idx)}
                                                    className={`min-w-[200px] p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${selectedAddressIndex === idx
                                                        ? 'border-black bg-gray-50 shadow-sm'
                                                        : 'border-gray-100 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                            {addr.isDefault ? 'Default' : `Address ${idx + 1}`}
                                                        </span>
                                                        {selectedAddressIndex === idx && (
                                                            <Check className="h-4 w-4 bg-black text-white rounded-full p-0.5" />
                                                        )}
                                                    </div>
                                                    <p className="font-bold text-sm mt-2 line-clamp-1">{addr.street}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{addr.city}, {addr.zip}</p>
                                                </motion.div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingAddress(true)}
                                                className="min-w-[50px] flex items-center justify-center rounded-2xl border border-dashed border-gray-200 hover:border-black transition-colors"
                                            >
                                                <Plus className="h-6 w-6 text-gray-300" />
                                            </button>
                                        </div>
                                    )}

                                    {/* New Address Form */}
                                    <AnimatePresence mode="wait">
                                        {isAddingAddress ? (
                                            <motion.div
                                                key="new-address"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6 overflow-hidden"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-serif font-bold">New Address Details</h4>
                                                    <button type="button" onClick={() => setIsAddingAddress(false)} className="text-xs text-red-500 hover:underline">Cancel</button>
                                                </div>

                                                <Input
                                                    label="Street Address"
                                                    placeholder="Flat, House no., Building, Street"
                                                    value={tempAddress.street}
                                                    onChange={(e) => setTempAddress(prev => ({ ...prev, street: e.target.value }))}
                                                />

                                                <div className="grid grid-cols-2 gap-6">
                                                    {/* Dynamic Country Selector */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Country</label>
                                                        <select
                                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none"
                                                            value={selectedCountryCode}
                                                            onChange={(e) => {
                                                                const code = e.target.value;
                                                                setSelectedCountryCode(code);
                                                                const name = countries.find(c => c.code === code)?.name || '';
                                                                setTempAddress(prev => ({ ...prev, country: name, state: '' }));
                                                            }}
                                                        >
                                                            {countries.map(c => (
                                                                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Dynamic State Selector */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">State / Province</label>
                                                        <select
                                                            className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5 outline-none"
                                                            value={tempAddress.state}
                                                            onChange={(e) => setTempAddress(prev => ({ ...prev, state: e.target.value }))}
                                                            disabled={isLoadingLocations}
                                                        >
                                                            <option value="">
                                                                {isLoadingLocations ? 'Loading...' : 'Select State'}
                                                            </option>
                                                            {states.map(s => (
                                                                <option key={s.code} value={s.name}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <Input
                                                        label="City"
                                                        value={tempAddress.city}
                                                        onChange={(e) => setTempAddress(prev => ({ ...prev, city: e.target.value }))}
                                                    />
                                                    <div className="relative">
                                                        <Input
                                                            label="Zip / PIN Code"
                                                            value={tempAddress.zip}
                                                            onChange={(e) => setTempAddress(prev => ({ ...prev, zip: e.target.value }))}
                                                        />
                                                        {isPinLoading && (
                                                            <div className="absolute right-4 top-10">
                                                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={handleAddNewAddress}
                                                    className="w-full py-3.5 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors active:scale-[0.98]"
                                                >
                                                    Save Address
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="selected-address"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="space-y-6"
                                            >
                                                <Input label="Street Address" readOnly value={user?.address?.[selectedAddressIndex]?.street || ''} />
                                                <div className="grid grid-cols-2 gap-6">
                                                    <Input label="City" readOnly value={user?.address?.[selectedAddressIndex]?.city || ''} />
                                                    <Input label="State" readOnly value={user?.address?.[selectedAddressIndex]?.state || ''} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </form>
                        </section>

                        {/* ─── PAYMENT METHOD ──────────────────── */}
                        <section className="bg-white p-8 rounded-[32px] border border-gray-100 space-y-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-50 pb-4 flex items-center">
                                <CreditCard className="h-4 w-4 mr-2" />
                                Payment Method
                            </h3>
                            <div className="space-y-4">
                                {/* Razorpay Option */}
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setPaymentMethod('RAZORPAY')}
                                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${paymentMethod === 'RAZORPAY'
                                        ? 'border-black bg-gray-50 shadow-sm'
                                        : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 bg-[#3395FF] rounded-xl flex items-center justify-center shadow-sm text-white font-bold text-xs">
                                            Pay
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Razorpay Secure</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">UPI / Cards / Netbanking</p>
                                        </div>
                                    </div>
                                    <div className="h-5 w-5 rounded-full border-2 border-black flex items-center justify-center">
                                        {paymentMethod === 'RAZORPAY' && <div className="h-2.5 w-2.5 bg-black rounded-full" />}
                                    </div>
                                </motion.div>

                                {/* COD Option */}
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setPaymentMethod('COD')}
                                    className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${paymentMethod === 'COD'
                                        ? 'border-black bg-gray-50 shadow-sm'
                                        : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center shadow-sm text-white font-bold text-xs">
                                            COD
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Cash On Delivery</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Pay when your order arrives</p>
                                        </div>
                                    </div>
                                    <div className="h-5 w-5 rounded-full border-2 border-black flex items-center justify-center">
                                        {paymentMethod === 'COD' && <div className="h-2.5 w-2.5 bg-black rounded-full" />}
                                    </div>
                                </motion.div>
                            </div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest text-center">
                                Your transaction is encrypted and secure.
                            </p>
                        </section>
                    </div>

                    {/* ─── RIGHT: ORDER SUMMARY ─────────────── */}
                    <div className="w-full lg:w-[400px]">
                        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm sticky top-32">
                            <h2 className="text-xl font-serif font-bold text-gray-900 mb-8 pb-4 border-b border-gray-50">
                                Order Summary
                            </h2>

                            {/* Items */}
                            <div className="space-y-6 mb-8 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                                {cartItems.map((item: CartItem, i: number) => {
                                    const product = item.product || {} as any;
                                    const imageUrl = typeof product.images?.[0] === 'string'
                                        ? product.images[0]
                                        : product.images?.[0]?.imageUrl || '';
                                    const title = product.title || 'Product';
                                    const price = getItemPrice(item);

                                    return (
                                        <div key={i} className="flex space-x-4">
                                            <div className="h-20 w-16 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                                                {imageUrl && <img src={imageUrl} className="h-full w-full object-cover" alt={title} />}
                                            </div>
                                            <div className="flex-1 text-sm">
                                                <p className="font-bold text-gray-900 line-clamp-1">{title}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {item.size && `Size: ${item.size}`}
                                                    {item.size && item.quantity && ' • '}
                                                    Qty: {item.quantity}
                                                </p>
                                                <p className="font-bold text-gray-900 mt-1">
                                                    {format(convert(price * item.quantity))}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Promo Code */}
                            <div className="space-y-4 pt-6 border-t border-gray-50">
                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-emerald-600" />
                                            <span className="text-sm font-bold text-emerald-700 uppercase">{appliedCoupon}</span>
                                        </div>
                                        <button onClick={removeCoupon} className="text-xs text-red-500 font-bold hover:underline">
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            placeholder="Promo Code"
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-black uppercase transition-colors"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleApplyCoupon}
                                            isLoading={isValidatingCoupon}
                                            className="h-10 px-4 text-xs"
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                )}

                                {/* Price Breakdown */}
                                <div className="flex justify-between text-sm text-gray-500 pt-4">
                                    <span>Subtotal</span>
                                    <span>{format(convert(cartTotal))}</span>
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600 font-medium">
                                        <span>Discount ({appliedCoupon})</span>
                                        <span>-{format(convert(discount))}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Shipping</span>
                                    <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Complimentary</span>
                                </div>

                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 border-t border-gray-100">
                                    <span className="font-serif text-xl">Total</span>
                                    <span>{format(convert(finalTotal))}</span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="space-y-2">
                                {Object.keys(errors).length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-600">
                                        <p className="font-bold mb-1">Please check the following fields:</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {Object.entries(errors).map(([key, error]) => (
                                                <li key={key}>
                                                    <span className="capitalize">{key}</span>: {error?.message as string}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <Button
                                    type="button"
                                    onClick={() => {
                                        console.log('[CHECKOUT] Pay button clicked manually');
                                        // Fallback: If hook is loading but window.Razorpay is ready, we are good
                                        const isRzpReady = !isRzpLoading || (window as any).Razorpay;

                                        if (paymentMethod === 'RAZORPAY' && !isRzpReady) {
                                            toast.info('Initializing payment system... please wait a moment.');
                                            return;
                                        }
                                        handleSubmit(onSubmit, (err) => {
                                            console.error('[CHECKOUT] Validation failed:', err);
                                            toast.error('Please complete all required fields.');
                                        })();
                                    }}
                                    disabled={isSubmitting}
                                    className="w-full h-16 rounded-[28px] mt-8 group"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <span>{paymentMethod === 'COD' ? 'Place Order' : 'Proceed to Pay'}</span>
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex items-center justify-center space-x-6 mt-8">
                                <div className="flex flex-col items-center">
                                    <ShieldCheck className="h-5 w-5 text-gray-300 mb-1" />
                                    <span className="text-[8px] font-black uppercase text-gray-400">Secure</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <Truck className="h-5 w-5 text-gray-300 mb-1" />
                                    <span className="text-[8px] font-black uppercase text-gray-400">Insured</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

