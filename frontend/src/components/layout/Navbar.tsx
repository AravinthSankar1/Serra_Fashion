import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useCart } from '../../context';
import { ShoppingBag, User as UserIcon, Search, Heart, Menu, X, LogOut, Settings, Package, ArrowRight, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CartDrawer from './CartDrawer';
import api from '../../api/client';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { cartCount, isCartOpen, setIsCartOpen } = useCart();
    const navigate = useNavigate();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleScroll = () => { setIsScrolled(window.scrollY > 50); };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close search on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isSearchOpen) closeSearch();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen]);

    // Debounced live search — fires 300ms after user stops typing
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const q = searchQuery.trim();
        if (q.length < 2) { setSearchResults([]); setIsSearching(false); return; }
        setIsSearching(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await api.get('/products', { params: { search: q, limit: 6, page: 1 } });
                setSearchResults(res.data.data.products || []);
            } catch { setSearchResults([]); }
            finally { setIsSearching(false); }
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchQuery]);

    const closeSearch = () => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) { navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`); closeSearch(); }
    };

    const handleResultClick = (slug: string) => { navigate(`/product/${slug}`); closeSearch(); };

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
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }} className="text-3xl text-black">SÉRRA</span>
                            <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 300, letterSpacing: '0.35em', lineHeight: 1, marginTop: '0.3em' }} className="text-[10px] uppercase text-black">FASHION</span>
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

                {/* Search Overlay */}
                <AnimatePresence>
                    {isSearchOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeSearch}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                            />

                            {/* Search Panel */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed top-0 left-0 right-0 z-50 bg-white shadow-2xl"
                            >
                                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
                                    {/* Header row */}
                                    <div className="flex items-center justify-between mb-5">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Search SÉRRA</span>
                                        <button
                                            onClick={closeSearch}
                                            className="flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-black transition-colors group"
                                        >
                                            <span className="hidden sm:block border border-gray-200 rounded px-1.5 py-0.5 text-[9px] group-hover:border-black transition-colors">ESC</span>
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Search Input */}
                                    <form onSubmit={handleSearch}>
                                        <div className="relative group">
                                            {isSearching ? (
                                                <Loader2 className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                                            ) : (
                                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors duration-200" />
                                            )}
                                            <input
                                                type="text"
                                                id="navbar-search-input"
                                                placeholder="Search for products, styles, brands..."
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-2xl py-4 pl-14 pr-16 text-base font-medium placeholder:text-gray-300 focus:outline-none focus:bg-white transition-all duration-200"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                autoFocus
                                            />
                                            {searchQuery ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearchQuery('')}
                                                    className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black transition-colors"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
                                                    <kbd className="border border-gray-200 rounded px-1.5 py-0.5 text-[9px] font-bold text-gray-400">↵</kbd>
                                                    <span className="text-[9px] text-gray-300 font-bold">to search</span>
                                                </div>
                                            )}
                                        </div>
                                    </form>

                                    {/* ── LIVE RESULTS ───────────────────────────── */}
                                    <AnimatePresence mode="wait">
                                        {searchQuery.trim().length >= 2 ? (
                                            <motion.div
                                                key="results"
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="mt-4"
                                            >
                                                {isSearching ? (
                                                    /* Skeleton rows */
                                                    <div className="space-y-3">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="flex items-center gap-4 p-3 rounded-2xl animate-pulse">
                                                                <div className="h-14 w-14 bg-gray-100 rounded-xl flex-shrink-0" />
                                                                <div className="flex-1 space-y-2">
                                                                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                                                                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : searchResults.length > 0 ? (
                                                    <>
                                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">
                                                            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery.trim()}"
                                                        </p>
                                                        <div className="space-y-1">
                                                            {searchResults.map((product: any) => {
                                                                const imgUrl = typeof product.images?.[0] === 'string'
                                                                    ? product.images[0]
                                                                    : product.images?.[0]?.imageUrl || '';
                                                                const price = product.finalPrice ?? product.basePrice ?? 0;
                                                                return (
                                                                    <button
                                                                        key={product._id}
                                                                        onClick={() => handleResultClick(product.slug || product._id)}
                                                                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all duration-150 group text-left"
                                                                    >
                                                                        {/* Thumbnail */}
                                                                        <div className="h-14 w-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                                                            {imgUrl && <img src={imgUrl} alt={product.title} className="h-full w-full object-cover" />}
                                                                        </div>
                                                                        {/* Info */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-bold text-gray-900 truncate group-hover:text-black">{product.title}</p>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                {product.category?.name && (
                                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{product.category.name}</span>
                                                                                )}
                                                                                {product.stock > 0 && (
                                                                                    <span className="text-[9px] font-black text-emerald-500">● In Stock</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {/* Price */}
                                                                        <div className="text-right flex-shrink-0">
                                                                            <p className="text-sm font-black text-gray-900">₹{price.toLocaleString('en-IN')}</p>
                                                                            {product.discountPercentage > 0 && (
                                                                                <p className="text-[9px] text-emerald-500 font-bold">{product.discountPercentage}% off</p>
                                                                            )}
                                                                        </div>
                                                                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all flex-shrink-0" />
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        {/* View all link */}
                                                        <button
                                                            onClick={handleSearch as any}
                                                            className="mt-4 w-full py-3 border-t border-gray-100 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            View all results for "{searchQuery.trim()}"
                                                            <ArrowRight className="h-3 w-3" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    /* Empty state */
                                                    <div className="py-6 text-center">
                                                        <p className="text-sm font-bold text-gray-900 mb-1">No results found</p>
                                                        <p className="text-xs text-gray-400">Try a different keyword or browse our collection</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ) : (
                                            /* Trending tags — shown when input is empty */
                                            <motion.div
                                                key="trending"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="mt-5 flex flex-wrap items-center gap-2"
                                            >
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 mr-1">Trending:</span>
                                                {['Oversized', 'Graphic Tee', 'Premium', 'Unisex', 'Black'].map((tag) => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => { navigate(`/search?q=${encodeURIComponent(tag)}`); closeSearch(); }}
                                                        className="px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white text-gray-600 text-xs font-bold rounded-full transition-all duration-200 hover:scale-105"
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </>
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
                                <Link to="/" className="flex flex-col items-center leading-none group">
                                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }} className="text-3xl text-black">SÉRRA</span>
                                    <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 300, letterSpacing: '0.35em', lineHeight: 1, marginTop: '0.3em' }} className="text-[10px] uppercase text-black">FASHION</span>
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
