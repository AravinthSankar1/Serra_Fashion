export type UserRole = 'customer' | 'admin' | 'super_admin' | 'vendor';

export interface User {
    _id: string;
    name: string;
    email: string;
    role: UserRole;
    profilePicture?: { imageUrl: string; imagePublicId: string };
    phoneNumber?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }[];
    defaultShippingAddress?: {
        firstName: string;
        lastName: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    wishlist?: string[];
    recentlyViewed?: string[];
    language?: string;
    createdAt?: string;
}

export interface AuthResponse {
    user: User;
    tokens: {
        access: string;
        refresh: string;
    };
}

export interface Brand {
    _id: string;
    name: string;
    logo?: { imageUrl: string; imagePublicId: string };
    isActive: boolean;
}

export interface Category {
    _id: string;
    name: string;
    slug: string;
    gender: 'MEN' | 'WOMEN' | 'UNISEX';
    image?: { imageUrl: string; imagePublicId: string };
    isActive: boolean;
}

export interface ProductVariant {
    _id?: string;
    size?: string;
    color?: string;
    sku: string;
    price: number;
    stock: number;
}

export interface SizeGuide {
    _id: string;
    name: string;
    description?: string;
    image: { imageUrl: string; imagePublicId: string };
    category?: Category;
}

export interface Product {
    _id: string;
    title: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    basePrice: number;
    finalPrice: number;
    discount: number;
    discountPercentage: number;
    images: { imageUrl: string; imagePublicId: string }[];
    gender: 'MEN' | 'WOMEN' | 'UNISEX';
    brand: Brand;
    category: Category;
    isPublished: boolean;
    stock: number;
    variants?: ProductVariant[];
    sizeGuide?: SizeGuide | string;
}

export interface CartItem {
    product: Product;
    quantity: number;
    size?: string;
    color?: string;
}

export interface Cart {
    _id: string;
    user: string;
    items: CartItem[];
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Order {
    _id: string;
    user: User;
    items: {
        product: Product;
        quantity: number;
        price: number;
        size?: string;
        color?: string;
    }[];
    totalAmount: number;
    shippingAddress: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    paymentStatus: PaymentStatus;
    orderStatus: OrderStatus;
    paymentMethod: string;
    paymentId?: string;
    subtotal: number;
    discount: number;
    promoCode?: string;
    statusHistory: {
        status: string;
        timestamp: string;
        note?: string;
    }[];
    createdAt: string;
}
