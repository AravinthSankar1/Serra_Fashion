/**
 * Qikink Push-to-Store Service
 *
 * This service handles importing Qikink products (from their catalog or "My Products")
 * into Serra Fashion's product database.
 *
 * Flow:
 *   1. Admin fetches Qikink "My Products" list (products they configured with designs)
 *   2. Admin picks individual products OR bulk-selects all
 *   3. This service:
 *       a. Downloads & compresses product images from Qikink URLs
 *       b. Uploads compressed images to Cloudinary
 *       c. Creates/updates Product documents in MongoDB
 *       d. Sets qikinkSku so orders get auto-forwarded to Qikink
 */

import { getQikinkMyProducts, getQikinkCatalog, getQikinkProductDetail } from './qikink.service';
import { Product } from '../modules/product/product.model';
import { Category } from '../modules/category/category.model';
import { Brand } from '../modules/brand/brand.model';
import { uploadBufferToCloudinary } from '../utils/cloudinary';
import { downloadAndCompress } from '../utils/imageProcessor';

export interface ImportResult {
    imported: number;
    updated: number;
    failed: number;
    skipped: number;
    errors: { sku: string; reason: string }[];
    products: any[];
}

/**
 * Maps Qikink print_type_id to a readable category hint.
 */
const printTypeLabel = (id: number): string => {
    const map: Record<number, string> = {
        1: 'DTG',
        2: 'All-over Print',
        3: 'Embroidery',
        5: 'Accessories',
        6: 'Puff Print',
        7: 'Glow-in-Dark',
        12: 'Rainbow Vinyl',
        13: 'Gold Vinyl',
        14: 'Silver Vinyl',
        15: 'Reflective Grey Vinyl',
        17: 'DTF',
    };
    return map[id] || `Print Type ${id}`;
};

/**
 * Downloads + uploads a Qikink product image to Cloudinary.
 * Returns { imageUrl, imagePublicId } or null on failure.
 */
const importImage = async (
    imageUrl: string | undefined | null,
    folder = 'products/qikink'
): Promise<{ imageUrl: string; imagePublicId: string } | null> => {
    if (!imageUrl) return null;
    try {
        const compressed = await downloadAndCompress(imageUrl, { maxWidth: 1200, quality: 82 });
        return await uploadBufferToCloudinary(compressed, folder);
    } catch (err: any) {
        console.warn(`[QIKINK-IMPORT] Image import failed for ${imageUrl}:`, err?.message || err);
        return null;
    }
};

/**
 * Imports a SINGLE Qikink product into Serra.
 *
 * @param qikinkProduct  - A product object from Qikink "My Products" API response
 * @param categoryId     - Serra Category ID to assign the product to
 * @param brandId        - Serra Brand ID to assign the product to
 * @param basePrice      - Retail price to set in Serra (Qikink provides cost price only)
 * @param overwrite      - If true, update existing products matched by qikinkSku
 */
export const importSingleQikinkProduct = async (
    qikinkProduct: any,
    categoryId?: string,
    brandId?: string,
    basePrice?: number,
    overwrite = true
): Promise<{ success: boolean; message: string; product?: any }> => {

    // ─── ENSURE CATEGORY & BRAND EXIST ───
    let finalCategoryId = categoryId;
    let finalBrandId = brandId;

    if (!finalCategoryId) {
        let cat = await Category.findOne({ name: 'Qikink Products' });
        if (!cat) {
            cat = await Category.create({
                name: 'Qikink Products',
                slug: 'qikink-products',
                isActive: true,
                approvalStatus: 'APPROVED'
            });
        }
        finalCategoryId = (cat._id as any).toString();
    }

    if (!finalBrandId) {
        let brand = await Brand.findOne({ name: 'Qikink' });
        if (!brand) {
            brand = await Brand.create({
                name: 'Qikink',
                isActive: true,
                approvalStatus: 'APPROVED'
            });
        }
        finalBrandId = (brand._id as any).toString();
    }

    // Extract key fields from Qikink product data
    const sku = qikinkProduct.sku || qikinkProduct.SKU || qikinkProduct.product_sku || String(qikinkProduct.id);
    const title = qikinkProduct.title || qikinkProduct.product_name || qikinkProduct.name || `Qikink Product ${sku}`;
    const description = qikinkProduct.description || qikinkProduct.product_description || `${title} — Fulfilled by Qikink`;
    const costPrice = parseFloat(qikinkProduct.price || qikinkProduct.cost_price || '0');
    const retailPrice = basePrice || Math.ceil(costPrice * 2.5); // Default 2.5x markup if not specified
    const imageUrl = qikinkProduct.image || qikinkProduct.mockup_url || qikinkProduct.product_image;
    const printTypeId = qikinkProduct.print_type_id || 1;

    // Build variants from Qikink sizes/colors
    const rawVariants = qikinkProduct.variants || qikinkProduct.sizes || [];
    const variants = (Array.isArray(rawVariants) ? rawVariants : []).map((v: any) => ({
        size: v.size || v.name || '',
        color: v.color || '',
        sku: `${sku}-${(v.size || v.name || 'ONE').toUpperCase()}`,
        price: retailPrice,
        stock: 9999, // POD = unlimited stock
    }));

    // If no variants from API, create a single default variant
    if (variants.length === 0) {
        variants.push({ size: 'ONE SIZE', color: '', sku: sku, price: retailPrice, stock: 9999 });
    }

    // Check if product already exists (by qikinkSku)
    const existing = await Product.findOne({ qikinkSku: sku });
    if (existing && !overwrite) {
        return { success: false, message: `Product with SKU ${sku} already exists. Use overwrite=true to update.` };
    }

    // Import image to Cloudinary
    let images: { imageUrl: string; imagePublicId: string }[] = [];
    const imgResult = await importImage(imageUrl);
    if (imgResult) images.push(imgResult);

    // Also import additional images if available
    const additionalImages: string[] = qikinkProduct.images || qikinkProduct.gallery_images || [];
    for (const url of additionalImages.slice(0, 4)) { // Max 5 images total
        const r = await importImage(url);
        if (r) images.push(r);
    }

    const productData: any = {
        title,
        description: description + `\n\n**Print Type:** ${printTypeLabel(printTypeId)}`,
        brand: finalBrandId,
        category: finalCategoryId,
        basePrice: retailPrice,
        costPrice,
        variants,
        images,
        isPublished: true,
        approvalStatus: 'APPROVED',
        stock: 9999, // POD = unlimited
        // Qikink linking
        qikinkSku: sku,
        isFulfilledByQikink: true,
    };

    try {
        let product;
        if (existing) {
            // Update existing
            product = await Product.findByIdAndUpdate(existing._id, productData, { new: true });
            console.log(`[QIKINK-IMPORT] Updated product: ${title} (SKU: ${sku})`);
            return { success: true, message: 'Product updated', product };
        } else {
            product = await Product.create(productData);
            console.log(`[QIKINK-IMPORT] Created product: ${title} (SKU: ${sku})`);
            return { success: true, message: 'Product imported', product };
        }
    } catch (err: any) {
        console.error(`[QIKINK-IMPORT] DB error for SKU ${sku}:`, err.message);
        return { success: false, message: err.message };
    }
};

/**
 * Bulk imports ALL products from Qikink "My Products" into Serra.
 *
 * @param categoryId  - Serra Category ID
 * @param brandId     - Serra Brand ID
 * @param markup      - Price markup multiplier over Qikink cost (default 2.5x)
 * @param overwrite   - Update existing products (default true)
 * @param page        - Page number for pagination
 * @param perPage     - Items per page (max ~50 from Qikink)
 */
export const bulkImportFromQikink = async (
    categoryId: string,
    brandId: string,
    markup = 2.5,
    overwrite = true,
    page = 1,
    perPage = 20
): Promise<ImportResult> => {
    const result: ImportResult = {
        imported: 0, updated: 0, failed: 0, skipped: 0,
        errors: [], products: []
    };

    let qikinkData: any;
    try {
        qikinkData = await getQikinkMyProducts({ page, per_page: perPage });
    } catch (err: any) {
        throw new Error(`Failed to fetch Qikink products: ${err.message}`);
    }

    // Qikink may return products in various shapes
    const products: any[] = Array.isArray(qikinkData)
        ? qikinkData
        : qikinkData?.products || qikinkData?.data || qikinkData?.items || [];

    if (products.length === 0) {
        console.log('[QIKINK-IMPORT] No products returned from Qikink.');
        return result;
    }

    console.log(`[QIKINK-IMPORT] Bulk importing ${products.length} products...`);

    for (const qp of products) {
        const sku = qp.sku || qp.SKU || qp.product_sku || String(qp.id);
        const costPrice = parseFloat(qp.price || qp.cost_price || '0');
        const retailPrice = Math.ceil(costPrice * markup);

        const res = await importSingleQikinkProduct(qp, categoryId, brandId, retailPrice, overwrite);

        if (res.success) {
            if (res.message === 'Product updated') result.updated++;
            else result.imported++;
            result.products.push(res.product);
        } else {
            result.failed++;
            result.errors.push({ sku, reason: res.message });
        }

        // Respect Qikink Rate Limit: 30 req / minute (~1 req every 2 seconds)
        await new Promise(r => setTimeout(r, 2100));
    }

    console.log(`[QIKINK-IMPORT] Bulk import done: ${result.imported} new, ${result.updated} updated, ${result.failed} failed`);
    return result;
};

/**
 * Fetches the raw Qikink "My Products" list for the admin to preview
 * BEFORE deciding which ones to import. No DB writes.
 */
export const previewQikinkProducts = async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
}): Promise<any> => {
    return getQikinkMyProducts(params);
};

/**
 * Fetches the Qikink product catalog (base products, no designs).
 * Admin can browse these to understand what's available.
 */
export const previewQikinkCatalog = async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    print_type_id?: number;
}): Promise<any> => {
    return getQikinkCatalog(params);
};
