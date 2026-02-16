import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context';
import { useMutation } from '@tanstack/react-query';
import api from '../api/client';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { motion } from 'framer-motion';
import { UserPlus, ArrowRight, Check, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import * as z from 'zod';

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    agree: z.boolean().refine((val) => val === true, {
        message: 'You must agree to the terms',
    }),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const mutation = useMutation({
        mutationFn: async (data: RegisterForm) => {
            const res = await api.post('/auth/register', data);
            return res.data;
        },
        onSuccess: (data) => {
            login(data.data);
            toast.success('Welcome to SÉRRA FASHION! Your account is ready.');
            navigate('/');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
        }
    });

    const onSubmit = (data: RegisterForm) => {
        mutation.mutate(data);
    };

    const benefits = [
        'Exclusive access to new collections',
        'Early bird discounts and special offers',
        'Free shipping on orders over ₹10,000',
        'Tier-1 data protection & privacy',
    ];

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side: Branding/Imagery */}
            <div className="hidden lg:flex w-1/2 bg-black relative overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1887"
                        alt="Fashion"
                        className="w-full h-full object-cover opacity-60"
                    />
                </div>
                <div className="relative z-10 w-full p-24 flex flex-col justify-between text-white">
                    <div>
                        <Link to="/" className="inline-block">
                            <h1 className="font-serif text-6xl tracking-tight">SÉRRA FASHION</h1>
                        </Link>
                        <div className="mt-12 space-y-6">
                            <h2 className="text-3xl font-light">Join the community.</h2>
                            <ul className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center space-x-3 text-gray-300"
                                    >
                                        <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium">{benefit}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md space-y-10"
                >
                    <div className="space-y-4">
                        <div className="inline-flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                            <UserPlus className="h-3 w-3 text-black" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">New Invitation</span>
                        </div>
                        <h2 className="text-4xl font-serif text-gray-900 leading-tight">Create Your Account</h2>
                        <p className="text-gray-500 font-medium">Join thousands of high-end fashion enthusiasts.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-6">
                            <div className="relative">
                                <Input
                                    label="Full Name"
                                    placeholder="Enter your name"
                                    {...register('name')}
                                    error={errors.name?.message}
                                />
                                <UserIcon className="absolute right-4 top-14 h-4 w-4 text-gray-300" />
                            </div>

                            <div className="relative">
                                <Input
                                    label="Email Address"
                                    placeholder="Enter your email"
                                    {...register('email')}
                                    error={errors.email?.message}
                                />
                                <Mail className="absolute right-4 top-14 h-4 w-4 text-gray-300" />
                            </div>

                            <div className="relative">
                                <Input
                                    label="Account Password"
                                    type="password"
                                    placeholder="Create a strong password"
                                    {...register('password')}
                                    error={errors.password?.message}
                                />
                                <Lock className="absolute right-4 top-14 h-4 w-4 text-gray-300" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Primary Language</label>
                                <select className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-black/5">
                                    <option>English</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                    <option>German</option>
                                    <option>Hindi</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-start space-x-3 cursor-pointer group">
                                <div className="relative mt-1">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        {...register('agree')}
                                    />
                                    <div className="w-5 h-5 border-2 border-gray-200 rounded-lg group-hover:border-black transition-colors peer-checked:bg-black peer-checked:border-black"></div>
                                    <ArrowRight className="absolute inset-0 h-3 w-3 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity rotate-[-45deg]" />
                                </div>
                                <span className="text-xs text-gray-400 font-medium leading-relaxed group-hover:text-black transition-colors">
                                    I agree to the <span className="font-bold underline decoration-zinc-200 underline-offset-4">Terms of Service</span> and <span className="font-bold underline decoration-zinc-200 underline-offset-4">Privacy Policy</span>.
                                </span>
                            </label>
                            {errors.agree && <p className="text-xs text-red-500 font-bold uppercase tracking-widest">{errors.agree.message}</p>}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-base shadow-xl shadow-black/10 group"
                            isLoading={mutation.isPending}
                        >
                            <span>Create Account</span>
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </form>

                    <div className="space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                                <span className="bg-white px-4 text-gray-400">Quick Authenticate</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => toast.info('Our secure social handshake protocol is being finalized.')}
                                className="flex items-center justify-center space-x-3 h-12 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all"
                            >
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-4 w-4" alt="Google" />
                                <span className="text-xs font-bold text-gray-700">Google Vault</span>
                            </button>
                            {/* <button
                                onClick={() => toast.info('Our secure social handshake protocol is being finalized.')}
                                className="flex items-center justify-center space-x-3 h-12 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all"
                            >
                                <img src="https://www.svgrepo.com/show/475643/facebook-color.svg" className="h-4 w-4" alt="Facebook" />
                                <span className="text-xs font-bold text-gray-700">Facebook Meta</span>
                            </button> */}
                        </div>
                    </div>

                    <div className="text-center pt-4">
                        <p className="text-sm text-gray-400 font-medium">
                            Already have an account? <Link to="/login" className="text-black font-bold hover:underline underline-offset-4">Sign in here</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
