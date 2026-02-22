import { useNavigate, Outlet, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../admin/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, User as UserIcon, X, ShoppingBag, LogOut, Layers, Tag, Package, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumLoader from '../ui/PremiumLoader';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../../utils';

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    // Fetch stats for notifications
    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get('/admin/stats');
            return res.data.data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
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
            color: 'bg-amber-100 text-amber-600'
        },
        {
            title: 'Pending Brands',
            count: stats?.overview?.pendingBrands || 0,
            link: '/admin/brands?status=PENDING',
            icon: Tag,
            color: 'bg-blue-100 text-blue-600'
        },
        {
            title: 'Pending Categories',
            count: stats?.overview?.pendingCategories || 0,
            link: '/admin/categories?status=PENDING',
            icon: Layers,
            color: 'bg-purple-100 text-purple-600'
        }
    ].filter(n => n.count > 0);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
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
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />

            <div className="flex-1 ml-64 flex flex-col">
                {/* Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-30">
                    <div className="flex items-center space-x-4 flex-1 max-w-xl relative">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products, orders, users..."
                                className="w-full bg-gray-50 border-none rounded-full py-2.5 pl-11 pr-10 text-sm focus:ring-2 focus:ring-black/5"
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
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
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
                                                            className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl text-left transition-colors"
                                                        >
                                                            <div className="h-8 w-8 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                                <img src={p.images[0]?.imageUrl} className="h-full w-full object-cover" alt="" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-gray-900 truncate">{p.title}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase">${p.finalPrice}</p>
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
                                                            className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl text-left transition-colors"
                                                        >
                                                            <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0 text-white">
                                                                <ShoppingBag className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-gray-900 truncate">Order #{o._id.slice(-6).toUpperCase()}</p>
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
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className={cn(
                                    "relative p-2.5 rounded-full transition-all duration-300",
                                    isNotificationOpen ? "bg-black text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                )}
                            >
                                <Bell className="h-5 w-5" />
                                {pendingCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[8px] font-black text-white flex items-center justify-center">
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
                                        className="absolute top-full right-0 mt-4 w-80 bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden z-50 ring-1 ring-black/[0.02]"
                                    >
                                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Notifications</h3>
                                            <span className="px-2 py-1 bg-black text-white text-[8px] font-black rounded-full uppercase">
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
                                                            className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all duration-200 group"
                                                        >
                                                            <div className="flex items-center space-x-4">
                                                                <div className={cn("p-2.5 rounded-xl", notif.color)}>
                                                                    <notif.icon className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-900">{notif.title}</p>
                                                                    <p className="text-[10px] text-gray-400 font-medium">Awaiting action</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-xs font-black text-gray-900 bg-gray-100 h-6 w-6 flex items-center justify-center rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                                                                    {notif.count}
                                                                </span>
                                                                <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-black transition-colors" />
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-10 text-center">
                                                    <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <AlertCircle className="h-6 w-6" />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">System Clear</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">No pending approvals</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                                            <button
                                                onClick={() => { navigate('/admin'); setIsNotificationOpen(false); }}
                                                className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors"
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
                            className="p-2.5 bg-gray-50 rounded-full hover:bg-red-50 hover:text-red-600 transition-all text-gray-500"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>

                        <div className="flex items-center space-x-3 pl-6 border-l border-gray-100">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-gray-900 leading-none">{user?.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{user?.role}</p>
                            </div>
                            <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
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
