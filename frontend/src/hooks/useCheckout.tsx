import { useCurrency } from './useCurrency';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart, useAuth } from '../context';
import api from '../api/client';

import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useRazorpay } from 'react-razorpay';

const checkoutSchema = z.object({
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Valid phone number is required'),
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().min(5, 'Zip code is required'),
    country: z.string().min(2, 'Country is required'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export function useCheckout() {
    const { cartItems, cartTotal, clearCart, isCartLoading } = useCart();
    const { user, updateUser, isLoading: isAuthLoading } = useAuth();
    const { format } = useCurrency();
    const navigate = useNavigate();
    const { Razorpay } = useRazorpay();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [isPinLoading, setIsPinLoading] = useState(false);
    const [tempAddress, setTempAddress] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'India'
    });

    const abortControllerRef = useRef<AbortController | null>(null);
    const paymentTimeoutRef = useRef<any>(null);

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
    }, []);

    useEffect(() => {
        return () => {
            cleanupPaymentState();
        };
    }, [cleanupPaymentState]);

    useEffect(() => {
        if (user?.defaultShippingAddress) {
            const addr = user.defaultShippingAddress;
            reset({
                firstName: addr.firstName || '',
                lastName: addr.lastName || '',
                email: user.email || '',
                phone: addr.phone || user.phoneNumber || '',
                street: addr.street || '',
                city: addr.city || '',
                state: addr.state || '',
                zipCode: addr.zipCode || '',
                country: addr.country || 'India'
            });
        } else if (user) {
            reset({
                email: user.email || '',
                firstName: user.name ? user.name.split(' ')[0] : '',
                lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
                phone: user.phoneNumber || '',
                country: 'India'
            });
        }
    }, [user, reset]);

    useEffect(() => {
        const saveAddress = async () => {
            const formValues = watch();
            if (formValues.firstName && formValues.lastName && formValues.phone &&
                formValues.street && formValues.city && formValues.state &&
                formValues.zipCode && formValues.country) {

                try {
                    await api.put('/users/shipping-address', {
                        firstName: formValues.firstName,
                        lastName: formValues.lastName,
                        phone: formValues.phone,
                        street: formValues.street,
                        city: formValues.city,
                        state: formValues.state,
                        zipCode: formValues.zipCode,
                        country: formValues.country
                    });
                } catch (error) {
                    // Silent fail
                }
            }
        };

        const debounceTimer = setTimeout(saveAddress, 2000);
        return () => clearTimeout(debounceTimer);
    }, [watch()]);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidatingCoupon(true);
        try {
            const res = await api.post('/promos/validate', {
                code: couponCode,
                orderAmount: cartTotal
            });
            const { discount: discountAmount } = res.data.data;
            setDiscount(discountAmount);
            setAppliedCoupon(couponCode);
            toast.success(`Promo applied! Saved ${format(discountAmount)}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid promo code');
            setDiscount(0);
            setAppliedCoupon(null);
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const processOrder = async (orderPayload: any) => {
        try {
            const res = await api.post('/orders', orderPayload);
            setOrderSuccess(res.data.data._id);
            clearCart();
        } catch (error) {
            toast.error('Failed to create order');
        } finally {
            cleanupPaymentState();
        }
    };

    const onSubmit = async (data: CheckoutFormData) => {
        setIsSubmitting(true);
        const finalAmount = cartTotal - discount;

        if (isAddingAddress) {
            if (!tempAddress.street || !tempAddress.city || !tempAddress.state || !tempAddress.zip) {
                toast.error('Please complete the address form first');
                setIsSubmitting(false);
                return;
            }
            await api.post('/users/address', { ...tempAddress, isDefault: user?.address?.length === 0 });
            data.street = tempAddress.street;
            data.city = tempAddress.city;
            data.state = tempAddress.state;
            data.zipCode = tempAddress.zip;
            data.country = tempAddress.country;
        }

        if (paymentMethod === 'COD') {
            await processOrder({
                items: cartItems.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    price: item.product.finalPrice || item.product.basePrice,
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

        try {
            const keyRes = await api.get('/payment/razorpay-key');
            const razorpayKey = keyRes.data.data.key;

            const orderRes = await api.post('/payment/create-order', {
                amount: finalAmount,
                currency: 'INR'
            });

            const { id: order_id, amount, currency } = orderRes.data.data;

            const options = {
                key: razorpayKey,
                amount: amount.toString(),
                currency: currency,
                name: "SÉRRA FASHION",
                description: "Purchase Transaction",
                order_id: order_id,
                handler: async function (response: any) {
                    setIsSubmitting(true);
                    abortControllerRef.current = new AbortController();

                    paymentTimeoutRef.current = setTimeout(() => {
                        cleanupPaymentState();
                        toast.error('Payment verification timeout');
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
                                    price: item.product.finalPrice || item.product.basePrice,
                                    size: item.size,
                                    color: item.color
                                })),
                                subtotal: cartTotal,
                                discount,
                                promoCode: appliedCoupon,
                                totalAmount: finalAmount,
                                shippingAddress: data
                            }
                        }, { signal: abortControllerRef.current?.signal });

                        setOrderSuccess(response.razorpay_order_id);
                        clearCart();
                    } catch (error: any) {
                        if (error.name !== 'CanceledError') {
                            toast.error('Payment verification failed');
                        }
                    } finally {
                        cleanupPaymentState();
                    }
                },
                prefill: {
                    name: data.firstName + ' ' + data.lastName,
                    email: data.email,
                    contact: data.phone,
                },
                modal: {
                    ondismiss: function () {
                        cleanupPaymentState();
                        toast.info('Payment cancelled');
                    },
                    escape: false,
                    confirm_close: true
                },
                theme: {
                    color: "#000000",
                },
            };

            const rzp = new Razorpay(options);

            rzp.on('payment.failed', function (response: any) {
                cleanupPaymentState();
                toast.error('Payment failed: ' + response.error.description);
            });

            rzp.open();
        } catch (error) {
            cleanupPaymentState();
            toast.error('Could not initiate payment. Please try again.');
        }
    };

    return {
        cartItems,
        cartTotal,
        user,
        isAuthLoading,
        isCartLoading,
        isSubmitting,
        orderSuccess,
        couponCode,
        setCouponCode,
        isValidatingCoupon,
        appliedCoupon,
        discount,
        paymentMethod,
        setPaymentMethod,
        selectedAddressIndex,
        setSelectedAddressIndex,
        isAddingAddress,
        setIsAddingAddress,
        isPinLoading,
        setIsPinLoading,
        tempAddress,
        setTempAddress,
        register,
        handleSubmit,
        errors,
        setValue,
        handleApplyCoupon,
        onSubmit,
        navigate,
        format,
        updateUser
    };
}
