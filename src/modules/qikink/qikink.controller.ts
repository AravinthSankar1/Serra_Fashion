import { Request, Response } from 'express';
import {
    getQikinkToken,
    createQikinkOrder,
    getQikinkOrders,
    getQikinkOrderStatus,
    submitOrderToQikink,
    QikinkCreateOrderPayload,
} from '../../services/qikink.service';
import {
    previewQikinkProducts,
    previewQikinkCatalog,
    importSingleQikinkProduct,
    bulkImportFromQikink,
} from '../../services/qikinkPushToStore.service';
import { Order } from '../order/order.model';
import { Product } from '../product/product.model';
import { Category } from '../category/category.model';
import { Brand } from '../brand/brand.model';

// ──────────────────────────────────────────────
//  Auth / Health
// ──────────────────────────────────────────────

/**
 * GET /api/qikink/auth-test
 * Tests Qikink API connection by fetching a fresh token.
 */
export const testAuth = async (req: Request, res: Response) => {
    try {
        const token = await getQikinkToken();
        return res.json({
            success: true,
            message: 'Qikink API authenticated successfully',
            tokenPreview: token.slice(0, 20) + '...',
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Auth failed' });
    }
};

// ──────────────────────────────────────────────
//  Orders
// ──────────────────────────────────────────────

/**
 * GET /api/qikink/orders
 * Lists orders from Qikink. Optional: ?id=&from_date=&to_date=
 */
export const listQikinkOrders = async (req: Request, res: Response) => {
    try {
        const { id, from_date, to_date } = req.query as Record<string, string>;
        const data = await getQikinkOrders({ id, from_date, to_date });
        return res.json({ success: true, data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Failed to fetch orders' });
    }
};

/**
 * GET /api/qikink/orders/:qikinkOrderId/status
 * Checks status of a specific Qikink order.
 */
export const checkQikinkOrderStatus = async (req: Request, res: Response) => {
    try {
        const { qikinkOrderId } = req.params;
        const data = await getQikinkOrderStatus(qikinkOrderId);
        return res.json({ success: true, data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Failed to fetch status' });
    }
};

/**
 * POST /api/qikink/orders/manual
 * Manually creates a Qikink order with a custom payload.
 * Body: QikinkCreateOrderPayload
 */
export const manualCreateOrder = async (req: Request, res: Response) => {
    try {
        const payload: QikinkCreateOrderPayload = req.body;
        if (!payload.order_number || !payload.line_items || payload.line_items.length === 0) {
            return res.status(400).json({ success: false, message: 'order_number and line_items are required' });
        }
        const result = await createQikinkOrder(payload);
        return res.json({ success: true, data: result });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Failed to create order' });
    }
};

/**
 * POST /api/qikink/orders/:orderId/submit
 * (Re-)submits a Serra order to Qikink.
 */
export const submitOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).populate('items.product');
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        const result = await submitOrderToQikink(order);
        if (!result) {
            return res.json({ success: false, message: 'No Qikink-fulfilled items in this order or Qikink not configured.' });
        }

        const qikinkOrderId = result?.order?.id || result?.order?.order_id || null;
        await Order.findByIdAndUpdate(orderId, {
            qikinkSubmitted: true,
            ...(qikinkOrderId ? { qikinkOrderId } : {}),
            qikinkStatus: 'SUBMITTED',
        });
        return res.json({ success: true, message: 'Order submitted to Qikink', data: result });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Submission failed' });
    }
};

/**
 * GET /api/qikink/orders/:orderId/sync
 * Syncs the Qikink status for a local order.
 */
export const syncOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (!order.qikinkOrderId) return res.status(400).json({ success: false, message: 'This order has no Qikink order ID' });

        const data = await getQikinkOrderStatus(order.qikinkOrderId);
        const qikinkStatus = data?.order?.status || data?.status || 'UNKNOWN';
        await Order.findByIdAndUpdate(orderId, { qikinkStatus });
        return res.json({ success: true, qikinkStatus, data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Sync failed' });
    }
};

// ──────────────────────────────────────────────
//  Push-to-Store: Product Catalog Browser
// ──────────────────────────────────────────────

/**
 * GET /api/qikink/store/my-products
 * Fetches "My Products" from Qikink — products admin has configured with designs.
 * These are the products ready to push into Serra.
 * Query: ?page=1&per_page=20&search=tshirt
 */
export const getMyProducts = async (req: Request, res: Response) => {
    try {
        const { page, per_page, search } = req.query;
        const data = await previewQikinkProducts({
            page: Number(page) || 1,
            per_page: Number(per_page) || 20,
            search: search as string,
        });
        return res.json({ success: true, data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Failed to fetch products' });
    }
};

/**
 * GET /api/qikink/store/catalog
 * Fetches Qikink's full product catalog (base products without designs).
 * Query: ?page=1&per_page=20&search=polo&print_type_id=1
 */
export const getCatalog = async (req: Request, res: Response) => {
    try {
        const { page, per_page, search, print_type_id } = req.query;
        const data = await previewQikinkCatalog({
            page: Number(page) || 1,
            per_page: Number(per_page) || 20,
            search: search as string,
            print_type_id: print_type_id ? Number(print_type_id) : undefined,
        });
        return res.json({ success: true, data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Failed to fetch catalog' });
    }
};

// ──────────────────────────────────────────────
//  Push-to-Store: Individual Import
// ──────────────────────────────────────────────

/**
 * POST /api/qikink/store/push-one
 * Pushes a SINGLE Qikink product into Serra Fashion.
 *
 * Body:
 * {
 *   qikinkProduct: <raw Qikink product object from /store/my-products>,
 *   categoryId: "mongo-category-id",
 *   brandId: "mongo-brand-id",
 *   basePrice: 999,       // Optional: retail price. Defaults to 2.5x Qikink cost
 *   overwrite: true       // Optional: update if sku already exists
 * }
 */
export const pushOneProduct = async (req: Request, res: Response) => {
    try {
        const { qikinkProduct, categoryId, brandId, basePrice, overwrite } = req.body;

        if (!qikinkProduct) {
            return res.status(400).json({
                success: false,
                message: 'qikinkProduct is required',
            });
        }

        const result = await importSingleQikinkProduct(
            qikinkProduct,
            categoryId,
            brandId,
            basePrice ? Number(basePrice) : undefined,
            overwrite !== false // default true
        );

        return res.status(result.success ? 200 : 400).json(result);
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Import failed' });
    }
};

// ──────────────────────────────────────────────
//  Push-to-Store: Bulk Import
// ──────────────────────────────────────────────

/**
 * POST /api/qikink/store/push-bulk
 * Bulk imports ALL products from Qikink "My Products" into Serra.
 *
 * Body:
 * {
 *   categoryId: "mongo-category-id",
 *   brandId: "mongo-brand-id",
 *   markup: 2.5,        // Price multiplier over Qikink cost (default 2.5)
 *   overwrite: true,    // Update existing products (default true)
 *   page: 1,
 *   perPage: 20
 * }
 *
 * NOTE: This can take a while. Each product image is downloaded, compressed, and uploaded.
 */
export const pushBulkProducts = async (req: Request, res: Response) => {
    try {
        const { categoryId, brandId, markup, overwrite, page, perPage } = req.body;

        const result = await bulkImportFromQikink(
            categoryId,
            brandId,
            markup ? Number(markup) : 2.5,
            overwrite !== false,
            Number(page) || 1,
            Number(perPage) || 20
        );

        return res.json({
            success: true,
            message: `Import complete: ${result.imported} created, ${result.updated} updated, ${result.failed} failed`,
            result,
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Bulk import failed' });
    }
};

// ──────────────────────────────────────────────
//  Product SKU Management
// ──────────────────────────────────────────────

/**
 * PATCH /api/qikink/products/:productId/sku
 * Sets the qikinkSku and isFulfilledByQikink flag for a product.
 * Body: { qikinkSku, isFulfilledByQikink }
 */
export const updateProductQikinkSku = async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        const { qikinkSku, isFulfilledByQikink } = req.body;

        const product = await Product.findByIdAndUpdate(
            productId,
            { qikinkSku, isFulfilledByQikink: isFulfilledByQikink ?? true },
            { new: true }
        );
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        return res.json({
            success: true,
            message: `Product ${product.title} linked to Qikink SKU: ${qikinkSku}`,
            product: { _id: product._id, title: product.title, qikinkSku: product.qikinkSku, isFulfilledByQikink: product.isFulfilledByQikink },
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Failed to update product' });
    }
};

/**
 * GET /api/qikink/products
 * Lists all Serra products that have a Qikink SKU configured.
 */
export const listQikinkProducts = async (_req: Request, res: Response) => {
    try {
        const products = await Product.find({
            qikinkSku: { $exists: true, $ne: '' }
        }).select('title qikinkSku isFulfilledByQikink basePrice stock brand category approvalStatus images');
        return res.json({ success: true, count: products.length, products });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Failed to fetch products' });
    }
};
// ──────────────────────────────────────────────
//  Webhook Handler (Push from Qikink)
// ──────────────────────────────────────────────

/**
 * POST /api/qikink/webhook/push-to-store
 * Receives product data directly from Qikink when "Push to Store" is clicked 
 * in the Qikink dashboard.
 * 
 * NOTE: This endpoint is unauthenticated to allow Qikink to call it.
 * Secure it with a secret query param if necessary.
 */
export const handleQikinkWebhook = async (req: Request, res: Response) => {
    try {
        const payload = req.body;

        if (!payload) {
            return res.status(400).json({ success: false, message: 'Empty payload' });
        }

        // Qikink sends a standard WooCommerce v3 API Product Payload.
        // We need to parse this WooCommerce-structured object and map it to our import function.
        let qikinkProduct: any = {};

        // Check if it looks like a WooCommerce format (has 'name', 'type', 'regular_price')
        if (payload.name && (payload.regular_price || payload.retail_price)) {
            // Extract color & size options from attributes array
            const sizeAttr = payload.attributes?.find((a: any) => a.name?.toLowerCase() === 'size');
            const colorAttr = payload.attributes?.find((a: any) => a.name?.toLowerCase() === 'color' || a.name?.toLowerCase() === 'colour');

            const sizes: string[] = sizeAttr?.options?.length ? sizeAttr.options : ['S', 'M', 'L', 'XL'];
            const colors: string[] = colorAttr?.options?.length ? colorAttr.options : ['Default'];

            // Flatten size × color into variants array
            const variants: any[] = [];
            for (const size of sizes) {
                for (const color of colors) {
                    variants.push({
                        size,
                        color: color === 'Default' ? '' : color,
                    });
                }
            }

            // Build image list from the 'images' array in the payload
            const imageList: string[] = payload.images
                ? payload.images.map((img: any) => (typeof img === 'string' ? img : img.src)).filter(Boolean)
                : [];

            // Retail price: use retail_price from extension if provided, else fall back to 2.5× regular_price
            const costPrice = parseFloat(payload.regular_price || '0');
            const retailPrice = payload.retail_price
                ? parseFloat(payload.retail_price)
                : Math.ceil(costPrice * 2.5);

            qikinkProduct = {
                sku: payload.sku || `QK-${Date.now()}`,
                name: payload.name,
                description: payload.description || `${payload.name} — Fulfilled by Qikink`,
                price: costPrice,
                image: imageList[0] || '',
                images: imageList,
                print_type_id: 1,
                variants,
                _retailPrice: retailPrice,
            };
        } else {
            // Fallback for direct Qikink native format
            qikinkProduct = payload;
        }

        if (!qikinkProduct.sku && !qikinkProduct.id && !qikinkProduct.name) {
            console.error('[QIKINK-WEBHOOK] Payload structured improperly:', payload);
            return res.status(400).json({ success: false, message: 'Invalid product data format' });
        }

        // We need a category and brand to assign this product to.
        let categoryId = req.query.categoryId as string;
        let brandId = req.query.brandId as string;

        if (!categoryId) {
            const defaultCat = await Category.findOne({ approvalStatus: 'APPROVED' }) || await Category.findOne({ isActive: true }) || await Category.findOne();
            categoryId = defaultCat?._id as unknown as string;
        }

        if (!brandId) {
            const defaultBrand = await Brand.findOne({ approvalStatus: 'APPROVED' }) || await Brand.findOne({ isActive: true }) || await Brand.findOne();
            brandId = defaultBrand?._id as unknown as string;
        }

        // If still no categoryId/brandId, the importSingleQikinkProduct service will 
        // automatically create "Qikink Products" category and "Qikink" brand.
        const result = await importSingleQikinkProduct(
            qikinkProduct,
            categoryId?.toString(),
            brandId?.toString(),
            qikinkProduct._retailPrice || undefined, // Use markup from extension if provided
            true       // Overwrite existing
        );

        // Return 201 Created to satisfy the WooCommerce integration
        return res.status(201).json({
            id: Date.now(), // Fake WooCommerce Product ID to satisfy Qikink
            name: qikinkProduct.name || qikinkProduct.title,
            status: "publish"
        });
    } catch (err: any) {
        console.error('[QIKINK-WEBHOOK] Error:', err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
};
