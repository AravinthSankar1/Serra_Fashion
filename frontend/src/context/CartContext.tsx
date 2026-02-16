import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/client';
import type { Cart, CartItem, Product } from '../types';

interface CartContextType {
    cart: Cart | null;
    guestItems: CartItem[];
    cartItems: CartItem[];
    addToCart: (product: Product, quantity: number, size?: string, color?: string) => void;
    updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
    removeFromCart: (productId: string, size?: string, color?: string) => void;
    cartCount: number;
    cartTotal: number;
    clearCart: () => void;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
    isCartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [cart, setCart] = useState<Cart | null>(null);
    const [guestItems, setGuestItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCartLoading, setIsCartLoading] = useState(false);

    // 1. Load guest cart from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('guest_cart');
        if (stored) {
            try {
                setGuestItems(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse guest cart');
            }
        }
    }, []);

    // 2. Fetch backend cart when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchCart();
        } else {
            setCart(null);
        }
    }, [isAuthenticated]);

    // 3. Sync guest cart to backend after login
    useEffect(() => {
        if (isAuthenticated && guestItems.length > 0) {
            syncGuestCart();
        }
    }, [isAuthenticated, guestItems.length]);

    const fetchCart = async () => {
        setIsCartLoading(true);
        try {
            const res = await api.get('/cart');
            setCart(res.data.data);
        } catch (error) {
            console.error('Failed to fetch cart', error);
        } finally {
            setIsCartLoading(false);
        }
    };

    const syncGuestCart = async () => {
        setIsCartLoading(true);
        try {
            // Bulk sync
            for (const item of guestItems) {
                await api.post('/cart/add', {
                    product: item.product._id,
                    quantity: item.quantity,
                    size: item.size,
                    color: item.color
                });
            }
            setGuestItems([]);
            localStorage.removeItem('guest_cart');
            await fetchCart();
        } catch (error) {
            console.error('Failed to sync guest cart', error);
        } finally {
            setIsCartLoading(false);
        }
    };

    const addToCart = async (product: Product, quantity: number, size?: string, color?: string) => {
        if (isAuthenticated) {
            try {
                const res = await api.post('/cart/add', { product: product._id, quantity, size, color });
                setCart(res.data.data);
            } catch (error) {
                console.error('Add to cart failed', error);
                throw error;
            }
        } else {
            const newItems = [...guestItems];
            const existing = newItems.find(i =>
                i.product._id === product._id &&
                i.size === size &&
                i.color === color
            );
            if (existing) {
                existing.quantity += quantity;
            } else {
                newItems.push({ product, quantity, size, color });
            }
            setGuestItems(newItems);
            localStorage.setItem('guest_cart', JSON.stringify(newItems));
        }
    };

    const updateQuantity = async (productId: string, quantity: number, size?: string, color?: string) => {
        if (isAuthenticated) {
            try {
                const res = await api.put('/cart/update', { productId, quantity, size, color });
                setCart(res.data.data);
            } catch (error) {
                console.error('Update cart failed', error);
            }
        } else {
            let newItems = [...guestItems];
            const existingIndex = newItems.findIndex(i =>
                i.product._id === productId &&
                i.size === size &&
                i.color === color
            );

            if (existingIndex > -1) {
                if (quantity <= 0) {
                    newItems.splice(existingIndex, 1);
                } else {
                    newItems[existingIndex].quantity = quantity;
                }
                setGuestItems(newItems);
                localStorage.setItem('guest_cart', JSON.stringify(newItems));
            }
        }
    };

    const removeFromCart = (productId: string, size?: string, color?: string) => {
        updateQuantity(productId, 0, size, color);
    };

    const clearCart = async () => {
        if (isAuthenticated) {
            try {
                await api.delete('/cart/clear');
                await fetchCart();
            } catch (error) {
                console.error('Clear cart failed', error);
            }
        } else {
            setGuestItems([]);
            localStorage.removeItem('guest_cart');
        }
    };

    const cartItems = isAuthenticated ? cart?.items || [] : guestItems;
    const cartCount = cartItems.reduce((acc: number, item: CartItem) => acc + item.quantity, 0);
    const cartTotal = cartItems.reduce((acc: number, item: CartItem) => acc + (item.product.finalPrice || item.product.basePrice) * item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            guestItems,
            cartItems,
            addToCart,
            updateQuantity,
            removeFromCart,
            cartCount,
            cartTotal,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            isCartLoading
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        // Return a dummy context to prevent crashes, the component will re-render once provider is ready
        return {
            cart: null,
            guestItems: [],
            cartItems: [],
            addToCart: () => { },
            updateQuantity: () => { },
            removeFromCart: () => { },
            cartCount: 0,
            cartTotal: 0,
            clearCart: () => { },
            isCartOpen: false,
            setIsCartOpen: () => { },
            isCartLoading: false
        };
    }
    return context;
}
