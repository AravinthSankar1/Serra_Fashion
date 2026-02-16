import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthResponse, User } from '../types';
import api from '../api/client';
import { toast } from 'react-toastify';

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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (data: AuthResponse) => {
        localStorage.setItem('accessToken', data.tokens.access);
        localStorage.setItem('refreshToken', data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
    };

    const updateUser = (updatedUser: User) => {
        localStorage.setItem('user', JSON.stringify(updatedUser));
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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
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
