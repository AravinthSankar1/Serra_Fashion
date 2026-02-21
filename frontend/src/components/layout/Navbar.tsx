import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCart } from '../../context';
import { ShoppingBag, User as UserIcon, Search, Heart, Menu, X, LogOut, Settings, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CartDrawer from './CartDrawer';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cartCount, isCartOpen, setIsCartOpen } = useCart();
    const navigate = useNavigate();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
            setSearchQuery('');
        }
    };

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-white/80 backdrop-blur-md py-5'}`}>
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center lg:hidden">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-400">
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="hidden lg:flex lg:items-center lg:space-x-8">
                        <Link to="/collection" className="text-sm font-medium text-gray-700 hover:text-black">Collection</Link>
                        <Link to="/men" className="text-sm font-medium text-gray-700 hover:text-black">Men</Link>
                        <Link to="/women" className="text-sm font-medium text-gray-700 hover:text-black">Women</Link>
                        {user && (
                            <Link to="/orders" className="text-sm font-medium text-gray-700 hover:text-black">My Orders</Link>
                        )}
                        {(user?.role === 'admin' || user?.role === 'super_admin') && (
                            <Link to="/admin" className="text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                                <Settings className="h-3.5 w-3.5" />
                                Admin
                            </Link>
                        )}
                        {user?.role === 'vendor' && (
                            <Link to="/admin" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                <Settings className="h-3.5 w-3.5" />
                                Vendor
                            </Link>
                        )}
                    </div>

                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex flex-col items-center leading-none">
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }} className="text-2xl text-black">SÉRRA</span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 300, letterSpacing: '0.35em', lineHeight: 1, marginTop: '0.3em' }} className="text-[9px] uppercase text-black">FASHION</span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-2 md:space-x-4">
                        <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 text-gray-400 hover:text-black">
                            <Search className="h-5 w-5" />
                        </button>

                        {user && (
                            <Link to="/orders" className="hidden sm:block p-2 text-gray-400 hover:text-black" title="My Orders">
                                <Package className="h-5 w-5" />
                            </Link>
                        )}

                        <Link to="/wishlist" className="hidden sm:block p-2 text-gray-400 hover:text-black relative">
                            <Heart className="h-5 w-5" />
                            {user?.wishlist && user.wishlist.length > 0 && (
                                <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white">
                                    {user.wishlist.length}
                                </span>
                            )}
                        </Link>

                        <Link to="/profile" className="hidden sm:block p-2 text-gray-400 hover:text-black">
                            <UserIcon className="h-5 w-5" />
                        </Link>

                        {user && (
                            <button onClick={logout} className="hidden lg:block p-2 text-gray-400 hover:text-red-600 transition-colors" title="Logout">
                                <LogOut className="h-5 w-5" />
                            </button>
                        )}

                        <button onClick={() => setIsCartOpen(true)} className="p-2 text-gray-400 hover:text-black relative">
                            <ShoppingBag className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-black rounded-full flex items-center justify-center text-[8px] text-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-gray-100 mt-4"
                        >
                            <form onSubmit={handleSearch} className="py-4">
                                <input
                                    type="text"
                                    placeholder="Search for items..."
                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-6 text-sm focus:ring-0"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white z-[70] p-8 shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-12">
                                <Link to="/" className="flex flex-col items-center leading-none">
                                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }} className="text-2xl text-black">SÉRRA</span>
                                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 300, letterSpacing: '0.35em', lineHeight: 1, marginTop: '0.3em' }} className="text-[9px] uppercase text-black">FASHION</span>
                                </Link>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="flex flex-col space-y-6">
                                <Link to="/collection" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium tracking-tight">Collection</Link>
                                <Link to="/men" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium tracking-tight">Men</Link>
                                <Link to="/women" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium tracking-tight">Women</Link>
                                <Link to="/sale" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-medium text-red-600 tracking-tight">Sale</Link>

                                <div className="pt-8 border-t border-gray-100 flex flex-col space-y-6">
                                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-base text-gray-500 font-medium">My Profile</Link>
                                    <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-base text-gray-500 font-medium">My Orders</Link>
                                    <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="text-base text-gray-500 font-medium sm:hidden">My Wishlist</Link>

                                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                                        <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-amber-600 flex items-center gap-2">
                                            <Settings className="h-4 w-4" />
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    {user?.role === 'vendor' && (
                                        <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-blue-600 flex items-center gap-2">
                                            <Settings className="h-4 w-4" />
                                            Vendor Dashboard
                                        </Link>
                                    )}

                                    {user && (
                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="text-left text-base font-bold text-red-600 flex items-center gap-2 pt-4"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Logout
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}
