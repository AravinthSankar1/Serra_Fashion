import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context';
import { useMutation } from '@tanstack/react-query';
import api from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, MessageCircle, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import * as z from 'zod';
import { useState } from 'react';
import SocialLoginSelector from '../components/auth/SocialLoginSelector';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
    const [otpChannel, setOtpChannel] = useState<'email' | 'whatsapp'>('email');
    const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
    const [contact, setContact] = useState('');
    const [otpCode, setOtpCode] = useState('');

    // Social Login State
    const [socialProvider, setSocialProvider] = useState<'Google' | 'Facebook' | null>(null);

    // Password Login Mutation
    const passwordMutation = useMutation({
        mutationFn: async (data: LoginForm) => {
            const res = await api.post('/auth/login', data);
            return res.data;
        },
        onSuccess: (data) => {
            login(data.data);
            toast.success('Access Granted. Welcome back.');
            navigate('/');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Authentication failed.');
        }
    });

    // Send OTP Mutation
    const sendOtpMutation = useMutation({
        mutationFn: async () => {
            if (!contact) throw new Error('Please enter your contact details');
            const res = await api.post('/auth/send-otp', { contact, type: otpChannel });
            return res.data;
        },
        onSuccess: () => {
            toast.success('OTP sent successfully!');
            setOtpStep('verify');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send OTP.');
        }
    });

    // Verify OTP Mutation
    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/auth/verify-otp', { contact, otp: otpCode, type: otpChannel });
            return res.data;
        },
        onSuccess: (data) => {
            login(data.data);
            toast.success('OTP Verified. Welcome!');
            navigate('/');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Invalid OTP.');
        }
    });

    // Social Login Mutation
    const socialMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/auth/social-login', data);
            return res.data;
        },
        onSuccess: (data) => {
            login(data.data);
            toast.success(`Welcome back! Authenticated via ${socialProvider}.`);
            navigate('/');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Social authentication failed.');
        }
    });

    const handleSocialSelect = (account: any) => {
        socialMutation.mutate({
            email: account.email,
            name: account.name,
            provider: socialProvider!,
            profilePicture: account.image,
            idToken: account.idToken,
            accessToken: account.accessToken
        });
        setSocialProvider(null);
    };

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: { rememberMe: false }
    });

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side: Branding/Imagery (Unchanged) */}
            <div className="hidden lg:flex w-1/2 bg-black relative overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
                        alt="Fashion"
                        className="w-full h-full object-cover opacity-60"
                    />
                </div>
                <div className="relative z-10 w-full p-24 flex flex-col justify-between text-white">
                    <div>
                        <div className="flex flex-col items-center leading-none">
                            <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }} className="text-6xl">SÉRRA</h1>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 300, letterSpacing: '0.35em', lineHeight: 1, marginTop: '0.3em' }} className="text-xl uppercase">FASHION</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-white/60">Secure Access</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md space-y-8"
                >
                    {/* Back to Dashboard */}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-black transition-colors -mb-2 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Store
                    </button>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-serif text-gray-900">Welcome Back</h2>
                        <p className="text-gray-500">Sign in to manage your account.</p>
                    </div>

                    {/* Auth Method Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-xl relative">
                        <button
                            onClick={() => setAuthMethod('password')}
                            className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all z-10 ${authMethod === 'password' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Password
                        </button>
                        <button
                            onClick={() => setAuthMethod('otp')}
                            className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all z-10 ${authMethod === 'otp' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            One-Time Password
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {authMethod === 'password' ? (
                            <motion.form
                                key="password-form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={(e: React.FormEvent) => {
                                    e.preventDefault();
                                    handleSubmit((data) => passwordMutation.mutate(data))(e);
                                }}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <Input
                                        label="Email"
                                        placeholder="user@example.com"
                                        {...register('email')}
                                        error={errors.email?.message}
                                    />
                                    <Input
                                        label="Password"
                                        type="password"
                                        placeholder="••••••••"
                                        {...register('password')}
                                        error={errors.password?.message}
                                    />
                                </div>
                                <Button type="submit" className="w-full" isLoading={passwordMutation.isPending}>
                                    Sign In with Password
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="otp-form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                {/* OTP Channel Selector */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => { setOtpChannel('email'); setOtpStep('request'); }}
                                        className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${otpChannel === 'email' ? 'border-black bg-black/5' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <Mail className={`w-6 h-6 ${otpChannel === 'email' ? 'text-black' : 'text-gray-400'}`} />
                                        <span className={`text-sm font-medium ${otpChannel === 'email' ? 'text-black' : 'text-gray-500'}`}>Email</span>
                                    </button>
                                    <button
                                        onClick={() => { setOtpChannel('whatsapp'); setOtpStep('request'); }}
                                        className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${otpChannel === 'whatsapp' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <MessageCircle className={`w-6 h-6 ${otpChannel === 'whatsapp' ? 'text-green-600' : 'text-gray-400'}`} />
                                        <span className={`text-sm font-medium ${otpChannel === 'whatsapp' ? 'text-green-700' : 'text-gray-500'}`}>WhatsApp</span>
                                    </button>
                                </div>

                                {otpStep === 'request' ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                {otpChannel === 'email' ? 'Email Address' : 'Phone Number (International)'}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={otpChannel === 'email' ? 'email' : 'tel'}
                                                    value={contact}
                                                    onChange={(e) => setContact(e.target.value)}
                                                    placeholder={otpChannel === 'email' ? 'user@example.com' : 'e.g. 15551234567'}
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {otpChannel === 'whatsapp' && 'Enter phone number with country code (no + symbol). e.g. 919876543210'}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => sendOtpMutation.mutate()}
                                            className="w-full"
                                            disabled={!contact}
                                            isLoading={sendOtpMutation.isPending}
                                        >
                                            Send One-Time Password
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Enter Verification Code</label>
                                            <input
                                                type="text"
                                                value={otpCode}
                                                maxLength={6}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                                placeholder="123456"
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-center tracking-[0.5em] text-lg font-mono"
                                            />
                                        </div>
                                        <Button
                                            onClick={() => verifyOtpMutation.mutate()}
                                            className="w-full"
                                            disabled={otpCode.length < 6}
                                            isLoading={verifyOtpMutation.isPending}
                                        >
                                            Verify & Login
                                        </Button>
                                        <button
                                            onClick={() => setOtpStep('request')}
                                            className="w-full text-center text-sm text-gray-500 hover:text-black underline"
                                        >
                                            Change Number / Resend
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Social Login Separator */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                            <span className="bg-white px-4 text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1">
                        <button
                            onClick={() => setSocialProvider('Google')}
                            className="flex items-center justify-center space-x-3 h-12 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700 text-sm"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
                            <span>Google Account</span>
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-gray-400">
                            Don't have an account? <Link to="/register" className="text-black font-semibold hover:underline">Sign up</Link>
                        </p>
                    </div>

                    <SocialLoginSelector
                        isOpen={!!socialProvider}
                        onClose={() => setSocialProvider(null)}
                        provider={socialProvider || 'Google'}
                        onSelect={handleSocialSelect}
                    />
                </motion.div>
            </div>
        </div>
    );
}
