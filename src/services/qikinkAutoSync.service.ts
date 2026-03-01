import { bulkImportFromQikink } from './qikinkPushToStore.service';
import { Category } from '../modules/category/category.model';
import { Brand } from '../modules/brand/brand.model';
import { config } from '../config';

class QikinkAutoSyncService {
    private syncInterval: NodeJS.Timeout | null = null;
    private isSyncing = false;

    /**
     * Starts the background sync process.
     * Polls Qikink for new designs every X minutes.
     */
    async startAutoSync(intervalMinutes = 30) {
        if (this.syncInterval) return;

        console.log(`[QIKINK-AUTOSYNC] Starting background worker (every ${intervalMinutes}m)`);

        // Initial run
        this.runSyncTask();

        this.syncInterval = setInterval(() => {
            this.runSyncTask();
        }, intervalMinutes * 60 * 1000);
    }

    async stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    private async runSyncTask() {
        if (this.isSyncing) {
            console.log('[QIKINK-AUTOSYNC] Sync already in progress, skipping...');
            return;
        }

        if (config.qikink.mode === 'sandbox') {
            // console.log('[QIKINK-AUTOSYNC] Skipping auto-sync in sandbox mode.');
            // return;
        }

        this.isSyncing = true;
        console.log('[QIKINK-AUTOSYNC] Beginning scheduled sync...');

        try {
            // 1. Find or create default category/brand
            let category = await Category.findOne({ isActive: true });
            let brand = await Brand.findOne({ isActive: true });

            if (!category || !brand) {
                console.warn('[QIKINK-AUTOSYNC] Missing category/brand. Auto-sync aborted.');
                this.isSyncing = false;
                return;
            }

            // 2. Perform bulk import (respects rate limits)
            const result = await bulkImportFromQikink(
                category._id.toString(),
                brand._id.toString(),
                2.5, // Default markup
                true // Overwrite existing
            );

            console.log(`[QIKINK-AUTOSYNC] Completed: ${result.imported} new, ${result.updated} updated.`);
        } catch (err: any) {
            console.error('[QIKINK-AUTOSYNC] Critical error during background sync:', err.message);
        } finally {
            this.isSyncing = false;
        }
    }
}

export const qikinkAutoSyncService = new QikinkAutoSyncService();
