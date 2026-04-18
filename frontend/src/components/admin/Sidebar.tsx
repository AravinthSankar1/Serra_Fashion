import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Layers,
    Tag,
    ShoppingBag,
    Users,
    Package,
    LogOut,
    ChevronRight,
    Image as ImageIcon,
    RefreshCw,
    MessageCircle,
    Activity,
    Menu as MenuIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';

const navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { title: 'Categories', icon: Layers, path: '/admin/categories' },
    { title: 'Navigation', icon: MenuIcon, path: '/admin/navigation' },
    { title: 'Brands', icon: Tag, path: '/admin/brands' },
    { title: 'Products', icon: ShoppingBag, path: '/admin/products' },
    { title: 'Orders', icon: Package, path: '/admin/orders' },
    { title: 'Promos', icon: Tag, path: '/admin/promos' },
    { title: 'Size Guides', icon: Layers, path: '/admin/size-guides' },
    { title: 'Users', icon: Users, path: '/admin/users' },
    { title: 'Live Traffic', icon: Activity, path: '/admin/active-sessions' },
    { title: 'Banners', icon: ImageIcon, path: '/admin/banners' },
    { title: 'Reviews', icon: MessageCircle, path: '/admin/reviews' },
    { title: 'Support Desk', icon: MessageCircle, path: '/admin/support' },
    { title: 'Settings', icon: RefreshCw, path: '/admin/settings' },
];

export default function AdminSidebar() {
    const location = useLocation();
    const { user, logout } = useAuth();

    return (
        <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col h-screen fixed left-0 top-0 z-40 transition-colors duration-300">
            <div className="p-8 border-b border-gray-50 dark:border-gray-800">
                <Link to="/" className="group">
                    <div className="flex flex-col items-center leading-none">
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }} className="text-3xl text-black dark:text-white">SÉRRA</span>
                        <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 300, letterSpacing: '0.35em', lineHeight: 1, marginTop: '0.3em' }} className="text-[10px] uppercase text-black dark:text-white">FASHION</span>
                    </div>
                    <span className="text-[10px] uppercase font-sans tracking-[0.3em] text-gray-400 dark:text-gray-500 block mt-2 text-center">
                        {user?.role === 'vendor' ? 'Vendor Dashboard' : 'Admin Dashboard'}
                    </span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 scrollbar-hide">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-4 px-4">Menu</p>
                {navItems
                    .filter(item => {
                        if (user?.role === 'vendor') {
                            // Vendor dashboard already has a prominent 'Orders' box, removing redundant sidebar link if asked
                            const vendorAllowed = ['Dashboard', 'Categories', 'Products', 'Size Guides'];
                            return vendorAllowed.includes(item.title);
                        }
                        return true;
                    })
                    .map((item) => {
                        const isActive = item.path === '/admin' 
                            ? location.pathname === '/admin' 
                            : location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 dark:shadow-white/5"
                                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white"
                                )}
                            >
                                <div className="flex items-center space-x-3">
                                    <item.icon className={cn(
                                        "h-5 w-5",
                                        isActive
                                            ? "text-white dark:text-black"
                                            : "text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white"
                                    )} />
                                    <span className="text-sm font-semibold tracking-wide">{item.title}</span>
                                </div>
                                {isActive && <ChevronRight className="h-4 w-4 text-white/50 dark:text-black/40" />}
                            </Link>
                        );
                    })
                }
            </nav>

            {/* User Profile */}
            <div className="p-6 border-t border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
                <div className="flex items-center space-x-3 mb-6 px-4">
                    <div className="h-10 w-10 bg-black dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 shrink-0">
                        {user?.profilePicture?.imageUrl ? (
                            <img src={user.profilePicture.imageUrl} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-white font-bold text-xs">{user?.name?.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{user?.name || 'User'}</p>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all duration-200"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
                </button>
            </div>
        </aside>
    );
}
