import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthResponse, User } from '../types';
import api from '../api/client';
import { toast } from 'react-toastify';
import { PixelEvents } from '../components/common/MetaPixelHelper';

interface AuthContextType {
    user: User | null;
    login: (data: AuthResponse) => void;
    updateUser: (user: User) => void;
    logout: () => void;
    toggleWishlist: (productId: string) => Promise<void>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Safe storage helper for restricted environments (like Instagram WebView)
const safeStorage = {
    getItem: (key: string) => { try { return localStorage.getItem(key); } catch (e) { return null; } },
    setItem: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch (e) { } },
    removeItem: (key: string) => { try { localStorage.removeItem(key); } catch (e) { } }
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = safeStorage.getItem('accessToken');
        const storedUser = safeStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (data: AuthResponse) => {
        safeStorage.setItem('accessToken', data.tokens.access);
        safeStorage.setItem('refreshToken', data.tokens.refresh);
        safeStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
    };

    const updateUser = (updatedUser: User) => {
        safeStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const toggleWishlist = async (productId: string) => {
        if (!user) {
            toast.error('Please login to save favorites');
            return;
        }
        try {
            const res = await api.post(`/users/wishlist/${productId}`);
            const newWishlist = res.data.data;
            updateUser({ ...user, wishlist: newWishlist });
            // Fire AddToWishlist pixel event only when adding (not removing)
            if (newWishlist.includes(productId)) {
                PixelEvents.addToWishlist(undefined, productId);
            }
            toast.success(newWishlist.includes(productId) ? 'Saved to favorites' : 'Removed from favorites', {
                position: "bottom-right",
                autoClose: 1500,
                hideProgressBar: true,
                theme: "dark",
            });
        } catch (error) {
            toast.error('Could not update favorites');
        }
    };

    const logout = () => {
        safeStorage.removeItem('accessToken');
        safeStorage.removeItem('refreshToken');
        safeStorage.removeItem('user');
        setUser(null);
        toast.info('Securely signed out. We hope to see you back soon.');
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const isSuperAdmin = user?.role === 'super_admin';

    return (
        <AuthContext.Provider value={{
            user,
            login,
            updateUser,
            logout,
            toggleWishlist,
            isAuthenticated: !!user,
            isAdmin,
            isSuperAdmin,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
