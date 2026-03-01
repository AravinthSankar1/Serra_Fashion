import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { UserRole } from '../user/user.interface';
import * as qikinkController from './qikink.controller';

const router = Router();

// ── Webhook (Unauthenticated) ────────────────────────────────────────────────
// POST /api/qikink/webhook/push-to-store
// This endpoint is called by Qikink dashboard when "Push to Store" is clicked.
router.post('/webhook/push-to-store', qikinkController.handleQikinkWebhook);

// All Qikink routes require authentication + admin/super-admin role
router.use(authenticate);
router.use(authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]));

// ── Auth & Health ─────────────────────────────────────────────────────────────
// GET /api/qikink/auth-test         → Test Qikink API connection
router.get('/auth-test', qikinkController.testAuth);

// ── Qikink Orders ─────────────────────────────────────────────────────────────
// GET  /api/qikink/orders                        → List all Qikink orders
//      Query: ?id=<qikink_order_id>&from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
router.get('/orders', qikinkController.listQikinkOrders);

// GET  /api/qikink/orders/:qikinkOrderId/status  → Check status of a Qikink order
router.get('/orders/:qikinkOrderId/status', qikinkController.checkQikinkOrderStatus);

// POST /api/qikink/orders/manual                 → Create a custom Qikink order (manual)
router.post('/orders/manual', qikinkController.manualCreateOrder);

// POST /api/qikink/orders/:orderId/submit        → (Re-)submit a Serra order to Qikink
router.post('/orders/:orderId/submit', qikinkController.submitOrder);

// GET  /api/qikink/orders/:orderId/sync          → Sync Qikink status back to Serra order
router.get('/orders/:orderId/sync', qikinkController.syncOrderStatus);

// ── Push-to-Store: Catalog Browsing ───────────────────────────────────────────
// GET /api/qikink/store/my-products   → Fetch "My Products" from Qikink (designed products)
//     Query: ?page=1&per_page=20&search=tshirt
router.get('/store/my-products', qikinkController.getMyProducts);

// GET /api/qikink/store/catalog       → Browse Qikink base product catalog
//     Query: ?page=1&per_page=20&search=polo&print_type_id=1
router.get('/store/catalog', qikinkController.getCatalog);

// ── Push-to-Store: Import ─────────────────────────────────────────────────────
// POST /api/qikink/store/push-one     → Push a SINGLE Qikink product into Serra
//      Body: { qikinkProduct, categoryId, brandId, basePrice?, overwrite? }
router.post('/store/push-one', qikinkController.pushOneProduct);

// POST /api/qikink/store/push-bulk    → Bulk import ALL Qikink "My Products" into Serra
//      Body: { categoryId, brandId, markup?, overwrite?, page?, perPage? }
//      NOTE: This endpoint can take 1-5 minutes depending on number of products
router.post('/store/push-bulk', qikinkController.pushBulkProducts);

// ── Product SKU Management ────────────────────────────────────────────────────
// GET   /api/qikink/products                     → List Serra products linked to Qikink
router.get('/products', qikinkController.listQikinkProducts);

// PATCH /api/qikink/products/:productId/sku      → Manually link a product to a Qikink SKU
//       Body: { qikinkSku, isFulfilledByQikink? }
router.patch('/products/:productId/sku', qikinkController.updateProductQikinkSku);

export default router;
