import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Layers,
    Tag,
    ShoppingBag,
    Users,
    Package,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils';

const navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { title: 'Categories', icon: Layers, path: '/admin/categories' },
    { title: 'Brands', icon: Tag, path: '/admin/brands' },
    { title: 'Products', icon: ShoppingBag, path: '/admin/products' },
    { title: 'Orders', icon: Package, path: '/admin/orders' },
    { title: 'Promos', icon: Tag, path: '/admin/promos' },
    { title: 'Size Guides', icon: Layers, path: '/admin/size-guides' },
    { title: 'Users', icon: Users, path: '/admin/users' },
];

export default function AdminSidebar() {
    const location = useLocation();
    const { user, logout } = useAuth();

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 z-40">
            {/* Logo */}
            <div className="p-8 border-b border-gray-50">
                <Link to="/" className="group">
                    <h1 className="font-serif text-2xl font-bold tracking-tight text-black italic">
                        SÉRRA FASHION <span className="text-[10px] uppercase font-sans tracking-[0.3em] text-gray-400 block mt-1 not-italic">Admin Dashboard</span>
                    </h1>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 scrollbar-hide">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-4">Menu</p>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-black text-white shadow-lg shadow-black/10"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-black"
                            )}
                        >
                            <div className="flex items-center space-x-3">
                                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-400 group-hover:text-black")} />
                                <span className="text-sm font-semibold tracking-wide">{item.title}</span>
                            </div>
                            {isActive && <ChevronRight className="h-4 w-4 text-white/50" />}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-6 border-t border-gray-50 bg-gray-50/30">
                <div className="flex items-center space-x-3 mb-6 px-4">
                    <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100 shrink-0">
                        {user?.profilePicture?.imageUrl ? (
                            <img src={user.profilePicture.imageUrl} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-white font-bold text-xs">{user?.name?.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
                </button>
            </div>
        </aside>
    );
}
