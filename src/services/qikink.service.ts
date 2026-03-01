import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

// ──────────────────────────────────────────────
//  Token cache (in-memory, per process)
// ──────────────────────────────────────────────
interface TokenCache {
    token: string;
    expiresAt: number; // Unix ms
}

let tokenCache: TokenCache | null = null;

// ──────────────────────────────────────────────
//  Qikink API types
// ──────────────────────────────────────────────
export interface QikinkLineItem {
    /** 0 = use designs array, 1 = use SKU from My Products */
    search_from_my_products: 0 | 1;
    /** Print type ID (1=DTG, 2=All-over, 3=Embroidery, 17=DTF, etc.) */
    print_type_id?: number;
    quantity: number;
    /** SKU from SKU Descriptions page or My Products page */
    sku: string;
    designs?: QikinkDesign[];
}

export interface QikinkDesign {
    design_code: string;
    width_inches?: number;
    height_inches?: number;
    /** "fr" | "bk" | "lp" | "rp" | "rs" | "ls" */
    placement_sku?: string;
    design_url?: string;
    mockup_url?: string;
}

export interface QikinkShippingAddress {
    first_name: string;
    last_name?: string;
    address1: string;
    address2?: string;
    Phone: string;
    email: string;
    city: string;
    zip: string | number;
    province: string; // Valid state name
    country_code: string;
}

export interface QikinkCreateOrderPayload {
    order_number: string;
    /** 0 = Self Shipping, 1 = Qikink Shipping */
    qikink_shipping: 0 | 1;
    /** "COD" | "PREPAID" */
    gateway: string;
    total_order_value: number;
    line_items: QikinkLineItem[];
    shipping_address?: QikinkShippingAddress;
}

export interface QikinkOrderResponse {
    status: boolean;
    message?: string;
    order?: any;
    errors?: any;
}

// ──────────────────────────────────────────────
//  Sandbox Mocks
// ──────────────────────────────────────────────
const MOCK_PRODUCTS = [
    {
        id: "mock_1122",
        sku: "MOCK-TSHIRT",
        name: "[SANDBOX] Classic White Tee",
        price: 399,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800",
        description: "A high-quality cotton t-shirt with custom print. Perfect for sandbox testing.",
        variants: [
            { size: 'S', color: 'White', price: 399, stock: 50 },
            { size: 'M', color: 'White', price: 399, stock: 50 },
            { size: 'L', color: 'White', price: 399, stock: 50 }
        ]
    },
    {
        id: "mock_3344",
        sku: "MOCK-HOODIE",
        name: "[SANDBOX] Midnight Hoodie",
        price: 850,
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800",
        description: "Premium fleece hoodie for maximum comfort and testing sync flows.",
        variants: [
            { size: 'M', color: 'Black', price: 850, stock: 30 },
            { size: 'L', color: 'Black', price: 850, stock: 30 }
        ]
    },
    {
        id: "mock_5566",
        sku: "MOCK-TOTE",
        name: "[SANDBOX] Eco Canvas Tote",
        price: 150,
        image: "https://images.unsplash.com/photo-1544816153-0973055ce7ca?auto=format&fit=crop&q=80&w=800",
        description: "Durable canvas tote bag. Simple and elegant mock product.",
        variants: [
            { size: 'ONE SIZE', color: 'Natural', price: 150, stock: 200 }
        ]
    }
];

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const isConfigured = (): boolean => {
    console.log('[QIKINK] Checking config:', {
        hasClientId: !!config.qikink.clientId,
        clientIdValue: config.qikink.clientId,
        hasClientSecret: !!config.qikink.clientSecret,
        isPlaceholder: config.qikink.clientId === 'your_qikink_client_id'
    });
    return !!(config.qikink.clientId && config.qikink.clientSecret &&
        config.qikink.clientId !== 'your_qikink_client_id');
};

let _client: AxiosInstance | null = null;

const getClient = (): AxiosInstance => {
    if (!_client) {
        _client = axios.create({
            baseURL: config.qikink.baseUrl,
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
        });
    }
    return _client;
};

// ──────────────────────────────────────────────
//  Authentication
// ──────────────────────────────────────────────

/**
 * Fetches a new access token from Qikink.
 * Endpoint (sandbox): POST https://sandbox.qikink.com/api/token
 * Body: { ClientId, client_secret }
 * Response: { ClientId, Accesstoken, expires_in }
 */
export const getQikinkToken = async (): Promise<string> => {
    // Return cached token if still valid (with 60 second buffer)
    if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
        return tokenCache.token;
    }

    if (!isConfigured()) {
        const cid = config.qikink.clientId || '';
        const csec = config.qikink.clientSecret || '';
        throw new Error(`Qikink Config Error: IDLen=${cid.length}, SecLen=${csec.length}, IDPrefix=${cid.substring(0, 5)}. Please check your .env file.`);
    }

    const client = getClient();
    try {
        const payload = new URLSearchParams();
        payload.append('ClientId', config.qikink.clientId);
        payload.append('client_secret', config.qikink.clientSecret);

        const res = await client.post('/api/token', payload.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = res.data;
        if (!data.Accesstoken) {
            throw new Error(`Qikink auth failed: ${JSON.stringify(data)}`);
        }

        const expiresIn = data.expires_in || 3600; // default 1 hour
        tokenCache = {
            token: data.Accesstoken,
            expiresAt: Date.now() + expiresIn * 1000,
        };

        console.log(`[QIKINK] New access token obtained, expires in ${expiresIn}s`);
        return tokenCache.token;
    } catch (err: any) {
        console.error('[QIKINK] Token fetch error:', err?.response?.data || err.message);
        throw err;
    }
};

// ──────────────────────────────────────────────
//  Orders
// ──────────────────────────────────────────────

/**
 * Creates an order on Qikink.
 * POST /api/order/create
 */
export const createQikinkOrder = async (payload: QikinkCreateOrderPayload): Promise<QikinkOrderResponse> => {
    const token = await getQikinkToken();
    const client = getClient();

    try {
        const res = await client.post('/api/order/create', payload, {
            headers: {
                'ClientId': config.qikink.clientId,
                'Accesstoken': token
            },
        });
        console.log(`[QIKINK] Order created: ${payload.order_number}`, res.data);
        return res.data;
    } catch (err: any) {
        const errData = err?.response?.data || { message: err.message };
        console.error('[QIKINK] Create order error:', errData);
        throw errData;
    }
};

/**
 * Fetches all orders (or a specific order).
 * GET /api/order/list?id=<order_id>&from_date=<date>&to_date=<date>
 */
export const getQikinkOrders = async (params?: {
    id?: string;
    from_date?: string;
    to_date?: string;
}): Promise<any> => {
    const token = await getQikinkToken();
    const client = getClient();

    try {
        const res = await client.get('/api/order', {
            headers: {
                'ClientId': config.qikink.clientId,
                'Accesstoken': token
            },
            params,
        });
        return res.data;
    } catch (err: any) {
        const errData = err?.response?.data || { message: err.message };
        console.error('[QIKINK] Get orders error:', errData);
        throw errData;
    }
};

/**
 * Checks the status of a specific Qikink order.
 */
export const getQikinkOrderStatus = async (qikinkOrderId: string): Promise<any> => {
    return getQikinkOrders({ id: qikinkOrderId });
};

/**
 * Build and submit a Qikink order from a Serra Order object.
 * Maps Serra order fields to Qikink API format.
 *
 * NOTE: For Qikink to fulfill, each product must have a qikinkSku set on it.
 *       Products without a qikinkSku will be skipped.
 */
export const submitOrderToQikink = async (order: any): Promise<QikinkOrderResponse | null> => {
    if (!isConfigured()) {
        console.warn('[QIKINK] Skipping: API not configured. Set QIKINK_CLIENT_ID and QIKINK_CLIENT_SECRET.');
        return null;
    }

    // Filter items that have a Qikink SKU configured on the product
    const qikinkItems: QikinkLineItem[] = [];
    for (const item of order.items) {
        const product = item.product; // populated Product document
        if (!product?.qikinkSku) continue; // skip non-Qikink products

        qikinkItems.push({
            search_from_my_products: 1, // use sku from My Products
            quantity: item.quantity,
            sku: product.qikinkSku,
        });
    }

    if (qikinkItems.length === 0) {
        console.log(`[QIKINK] No Qikink-fulfilled items for order ${order._id}, skipping submission.`);
        return null;
    }

    const addr = order.shippingAddress;
    const shipping_address: QikinkShippingAddress = {
        first_name: addr.firstName,
        last_name: addr.lastName,
        address1: addr.street,
        Phone: addr.phone,
        email: addr.email,
        city: addr.city,
        zip: addr.zipCode,
        province: addr.state,
        country_code: addr.country || 'IN', // default India
    };

    const payload: QikinkCreateOrderPayload = {
        order_number: order._id.toString(),
        qikink_shipping: config.qikink.shipping as 0 | 1,
        gateway: config.qikink.gateway,
        total_order_value: order.totalAmount,
        line_items: qikinkItems,
        shipping_address: config.qikink.shipping === 1 ? shipping_address : undefined,
    };

    return createQikinkOrder(payload);
};

// ──────────────────────────────────────────────
//  Product Catalog (Push-to-Store)
// ──────────────────────────────────────────────

/**
 * Fetches Qikink's full product catalog (all available products for POD).
 * GET /api/products
 */
export const getQikinkCatalog = async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    print_type_id?: number;
}): Promise<any> => {
    const token = await getQikinkToken();
    const client = getClient();
    try {
        // NOTE: Qikink documentation for the 08-23 version does not list a products endpoint.
        // If this returns 404, it means product sync via API is not supported by your account.
        const res = await client.get('/api/products', {
            headers: {
                'ClientId': config.qikink.clientId,
                'Accesstoken': token
            },
            params,
        });
        return res.data;
    } catch (err: any) {
        const errData = err?.response?.data || { message: err.message };
        console.error('[QIKINK] Get catalog error:', errData);
        throw errData;
    }
};

/**
 * Fetches products the user has added to "My Products" in Qikink dashboard
 * (These are products with designs already applied).
 * GET /api/my-products  (or /api/myproducts depending on Qikink version)
 */
export const getQikinkMyProducts = async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
}): Promise<any> => {
    const token = await getQikinkToken();
    const client = getClient();
    try {
        // Attempt to fetch from My Products using the correct custom headers
        const res = await client.get('/api/my-products', {
            headers: {
                'ClientId': config.qikink.clientId,
                'Accesstoken': token
            },
            params,
        });
        return res.data;
    } catch (err: any) {
        // If it's a 404/Route error, try the hyphen-less version
        const isRouteError = err?.response?.status === 404 ||
            (err?.response?.data?.message && err.response.data.message.includes('Can\'t find a route'));

        if (isRouteError) {
            console.log('[QIKINK] /api/my-products failed, trying /api/myproducts fallback...');
            try {
                const res = await client.get('/api/myproducts', {
                    headers: {
                        'ClientId': config.qikink.clientId,
                        'Accesstoken': token
                    },
                    params,
                });
                return res.data;
            } catch (fallbackErr: any) {
                console.warn('[QIKINK] Both product endpoints failed.');

                // SANDBOX MODE FALLBACK: Return mock data so UI can be tested
                if (config.qikink.mode === 'sandbox') {
                    console.info('[QIKINK] Sandbox mode detected. Returning mock products for testing.');
                    return {
                        success: true,
                        data: MOCK_PRODUCTS,
                        total_pages: 1,
                        current_page: 1
                    };
                }

                console.error('[QIKINK] Fallback /api/myproducts also failed:', fallbackErr?.response?.data || fallbackErr.message);
                throw fallbackErr?.response?.data || fallbackErr;
            }
        }

        const errData = err?.response?.data || { message: err.message };
        console.error('[QIKINK] Get my-products error:', errData);
        throw errData;
    }
};

/**
 * Gets detailed info for a specific Qikink catalog product.
 * GET /api/products/:id
 */
export const getQikinkProductDetail = async (productId: string | number): Promise<any> => {
    const token = await getQikinkToken();
    const client = getClient();
    try {
        const res = await client.get(`/api/products/${productId}`, {
            headers: {
                'ClientId': config.qikink.clientId,
                'Accesstoken': token
            },
        });
        return res.data;
    } catch (err: any) {
        const errData = err?.response?.data || { message: err.message };
        console.error('[QIKINK] Get product detail error:', errData);
        throw errData;
    }
};
