import { useNavigate, Outlet, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../admin/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, User as UserIcon, X, ShoppingBag, LogOut, Layers, Tag, ChevronRight, AlertCircle, Settings, Sun, Moon } from 'lucide-react';
import api from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumLoader from '../ui/PremiumLoader';
import { useQuery } from '@tanstack/react-query';
import { useCurrency } from '../../hooks/useCurrency';
import { cn } from '../../utils';
import { useTheme } from '../../context/ThemeContext';

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { format, convert } = useCurrency();
    const { theme, toggleTheme } = useTheme();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const gearRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isGearOpen, setIsGearOpen] = useState(false);

    // Fetch stats for notifications
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get('/admin/stats');
            return res.data.data;
        },
        refetchInterval: 30000,
    });

    const pendingCount = (stats?.overview?.pendingProducts || 0) +
        (stats?.overview?.pendingBrands || 0) +
        (stats?.overview?.pendingCategories || 0);

    const pendingNotifications = [
        {
            title: 'Pending Products',
            count: stats?.overview?.pendingProducts || 0,
            link: '/admin/products?status=PENDING',
            icon: ShoppingBag,
            color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
        },
        {
            title: 'Pending Brands',
            count: stats?.overview?.pendingBrands || 0,
            link: '/admin/brands?status=PENDING',
            icon: Tag,
            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
        },
        {
            title: 'Pending Categories',
            count: stats?.overview?.pendingCategories || 0,
            link: '/admin/categories?status=PENDING',
            icon: Layers,
            color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400'
        }
    ].filter(n => n.count > 0);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
            if (gearRef.current && !gearRef.current.contains(event.target as Node)) {
                setIsGearOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setIsSearching(true);
                try {
                    const res = await api.get(`/admin/global-search?q=${searchQuery}`);
                    setSearchResults(res.data.data);
                } catch (e) {
                    console.error('Search failed');
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults(null);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300">
            <AdminSidebar />

            <div className="flex-1 ml-64 flex flex-col">
                {/* Header */}
                <header className="h-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-10 sticky top-0 z-30 transition-colors duration-300">
                    <div className="flex items-center space-x-4 flex-1 max-w-xl relative">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products, orders, users..."
                                className="w-full bg-gray-50 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 border-none rounded-full py-2.5 pl-11 pr-10 text-sm focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 transition-colors duration-300"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2"
                                >
                                    <X className="h-3 w-3 text-gray-400" />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {(searchResults || isSearching) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-[24px] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
                                >
                                    {isSearching ? (
                                        <div className="p-12 text-center">
                                            <PremiumLoader size="sm" text="Scanning Inventory..." />
                                        </div>
                                    ) : (
                                        <div className="p-4 space-y-6">
                                            {searchResults.products?.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Products</h4>
                                                    {searchResults.products.map((p: any) => (
                                                        <button
                                                            key={p._id}
                                                            onClick={() => { navigate(`/admin/products?id=${p._id}`); setSearchQuery(''); }}
                                                            className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-left transition-colors"
                                                        >
                                                            <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                                                                <img src={p.images[0]?.imageUrl} className="h-full w-full object-cover" alt="" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{p.title}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase">{format(convert(p.finalPrice))}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {searchResults.orders?.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Orders</h4>
                                                    {searchResults.orders.map((o: any) => (
                                                        <button
                                                            key={o._id}
                                                            onClick={() => { navigate(`/admin/orders?id=${o._id}`); setSearchQuery(''); }}
                                                            className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-left transition-colors"
                                                        >
                                                            <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0 text-white">
                                                                <ShoppingBag className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">Order #{o._id.slice(-6).toUpperCase()}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase">{o.shippingAddress.firstName} {o.shippingAddress.lastName}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center space-x-6">

                        {/* ── Gear Icon with Theme Toggle ── */}
                        <div className="relative" ref={gearRef}>
                            <button
                                onClick={() => setIsGearOpen(!isGearOpen)}
                                className={cn(
                                    "relative p-2.5 rounded-full transition-all duration-300",
                                    isGearOpen
                                        ? "bg-black dark:bg-white text-white dark:text-black"
                                        : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                )}
                                title="Appearance Settings"
                            >
                                <Settings className={cn("h-5 w-5 transition-transform duration-500", isGearOpen && "rotate-90")} />
                            </button>

                            <AnimatePresence>
                                {isGearOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full right-0 mt-4 w-64 bg-white dark:bg-gray-900 rounded-[24px] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                                    >
                                        <div className="p-5 border-b border-gray-50 dark:border-gray-800 flex items-center space-x-3 bg-gray-50/50 dark:bg-gray-800/50">
                                            <Settings className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 dark:text-gray-100">Appearance</h3>
                                        </div>

                                        <div className="p-4">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 px-1">Theme Mode</p>

                                            {/* Toggle Switch */}
                                            <button
                                                onClick={() => { toggleTheme(); setIsGearOpen(false); }}
                                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-200 group"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-300",
                                                        theme === 'dark'
                                                            ? "bg-indigo-500/20 text-indigo-400"
                                                            : "bg-amber-100 text-amber-600"
                                                    )}>
                                                        {theme === 'dark' ? (
                                                            <Moon className="h-4 w-4" />
                                                        ) : (
                                                            <Sun className="h-4 w-4" />
                                                        )}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                                            Switch to {theme === 'dark' ? 'light' : 'dark'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Visual toggle pill */}
                                                <div className={cn(
                                                    "w-12 h-6 rounded-full transition-all duration-300 relative flex-shrink-0",
                                                    theme === 'dark' ? "bg-indigo-500" : "bg-amber-400"
                                                )}>
                                                    <motion.div
                                                        layout
                                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        className={cn(
                                                            "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm",
                                                            theme === 'dark' ? "right-1" : "left-1"
                                                        )}
                                                    />
                                                </div>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notification Bell */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className={cn(
                                    "relative p-2.5 rounded-full transition-all duration-300",
                                    isNotificationOpen
                                        ? "bg-black dark:bg-white text-white dark:text-black"
                                        : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                )}
                            >
                                <Bell className="h-5 w-5" />
                                {pendingCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 text-[8px] font-black text-white flex items-center justify-center">
                                        {pendingCount}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {isNotificationOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full right-0 mt-4 w-80 bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 ring-1 ring-black/[0.02]"
                                    >
                                        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 dark:text-gray-100">Notifications</h3>
                                            <span className="px-2 py-1 bg-black dark:bg-white text-white dark:text-black text-[8px] font-black rounded-full uppercase">
                                                {pendingCount} New
                                            </span>
                                        </div>

                                        <div className="max-h-[320px] overflow-y-auto">
                                            {pendingNotifications.length > 0 ? (
                                                <div className="p-2">
                                                    {pendingNotifications.map((notif, idx) => (
                                                        <Link
                                                            key={idx}
                                                            to={notif.link}
                                                            onClick={() => setIsNotificationOpen(false)}
                                                            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center space-x-4">
                                                                <div className={cn("p-2.5 rounded-xl", notif.color)}>
                                                                    <notif.icon className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{notif.title}</p>
                                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Awaiting action</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-xs font-black text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 h-6 w-6 flex items-center justify-center rounded-lg group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                                                                    {notif.count}
                                                                </span>
                                                                <ChevronRight className="h-3 w-3 text-gray-300 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white transition-colors" />
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-10 text-center">
                                                    <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <AlertCircle className="h-6 w-6" />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">System Clear</p>
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-tighter">No pending approvals</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                                            <button
                                                onClick={() => { navigate('/admin'); setIsNotificationOpen(false); }}
                                                className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                                            >
                                                View All Activity
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={logout}
                            className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all text-gray-500 dark:text-gray-400"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>

                        <div className="flex items-center space-x-3 pl-6 border-l border-gray-100 dark:border-gray-800">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">{user?.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{user?.role}</p>
                            </div>
                            <div className="h-10 w-10 bg-black dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
                                {user?.profilePicture?.imageUrl ? (
                                    <img src={user.profilePicture.imageUrl} alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                    <UserIcon className="h-5 w-5 text-white" />
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 p-10 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
