// popup.js - Serra Qikink Sync Extension

document.addEventListener('DOMContentLoaded', () => {
    const serverInput = document.getElementById('serverUrl');
    const scrapeBtn = document.getElementById('scrapeBtn');
    const statusEl = document.getElementById('status');

    // Restore saved URL
    chrome.storage.local.get(['serraBackendUrl'], (res) => {
        if (res.serraBackendUrl) serverInput.value = res.serraBackendUrl;
    });

    serverInput.addEventListener('change', () => {
        chrome.storage.local.set({ serraBackendUrl: serverInput.value });
    });

    scrapeBtn.addEventListener('click', async () => {
        scrapeBtn.disabled = true;
        statusEl.textContent = '🔍 Reading Qikink page...';
        statusEl.className = 'info';

        const base = serverInput.value.replace(/\/$/, '');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab.url.includes('dashboard.qikink.com/products')) {
                throw new Error('❗ Please open Qikink → My Products first!');
            }

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: scrapeQikinkProducts,
            });

            const products = results[0].result;

            if (!products || products.length === 0) {
                throw new Error('No products found on this page. Make sure products are visible.');
            }

            statusEl.textContent = `Found ${products.length} products. Syncing...`;
            statusEl.className = 'info';

            let successCount = 0;
            let failCount = 0;

            for (const p of products) {
                try {
                    const res = await fetch(`${base}/qikink/webhook/push-to-store`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: p.name,
                            sku: p.sku,
                            description: p.description,
                            regular_price: p.regular_price,
                            images: p.images,
                            attributes: p.attributes,
                        })
                    });

                    if (res.ok || res.status === 201) {
                        successCount++;
                        statusEl.textContent = `Syncing ${successCount + failCount}/${products.length}...`;
                    } else {
                        failCount++;
                        const err = await res.json().catch(() => ({}));
                        console.warn('Failed:', p.name, err.message || res.status);
                    }
                } catch (err) {
                    failCount++;
                    console.error('Post error:', p.name, err);
                }
            }

            let lastError = '';
            if (failCount > 0 && successCount === 0) {
                // Get error message from last failed request
                const lastFail = products[products.length - 1]; // simplifying to last for UX
                lastError = ` (Last Error: Some products failed to import)`;
            }

            statusEl.textContent = successCount > 0
                ? `✅ ${successCount} product${successCount > 1 ? 's' : ''} added to Serra!${failCount ? ` (${failCount} skipped)` : ''}`
                : `❌ All ${products.length} sync attempts failed. Check categories/brands in Admin.`;
            statusEl.className = successCount > 0 ? 'success' : 'error';

        } catch (err) {
            statusEl.textContent = err.message || 'Something went wrong.';
            statusEl.className = 'error';
        } finally {
            scrapeBtn.disabled = false;
        }
    });
});

// ─────────────────────────────────────────────────────────────────
// This function runs INSIDE the Qikink tab to extract product data
// ─────────────────────────────────────────────────────────────────
function scrapeQikinkProducts() {

    const sizeOrder = ['2XS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
    const colorPool = ['Black', 'White', 'Navy', 'Red', 'Green', 'Blue', 'Grey', 'Maroon', 'Yellow', 'Orange'];

    function firstPrice(text) {
        const m = text.match(/(\d{2,}(?:\.\d{2})?)/);
        return m ? m[1] : '0';
    }

    function parseSizes(text) {
        const m = text.match(/Size\s*[:\-]\s*([A-Z0-9]+)\s*[-–]\s*([A-Z0-9]+)/i);
        if (m) {
            const s = sizeOrder.indexOf(m[1].toUpperCase());
            const e = sizeOrder.indexOf(m[2].toUpperCase());
            if (s !== -1 && e !== -1 && s <= e) return sizeOrder.slice(s, e + 1);
        }
        return ['S', 'M', 'L', 'XL'];
    }

    function parseColors(text) {
        const m = text.match(/(\d+)\s+Colou?rs?/i);
        const n = m ? Math.min(parseInt(m[1]) || 1, colorPool.length) : 1;
        return colorPool.slice(0, n);
    }

    const products = [];
    const seenSkus = new Set();

    // ── Primary: parse tbody rows ──────────────
    const tbody = document.querySelector('table tbody') || document.querySelector('tbody');
    const rows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];

    if (rows.length > 0) {
        rows.forEach(row => {
            try {
                const tds = Array.from(row.querySelectorAll('td'));
                if (tds.length < 3) return;

                const txt = row.innerText || '';

                // 7–9 digit Product ID as SKU
                const idM = txt.match(/\b(\d{7,9})\b/);
                const sku = idM ? idM[1] : `QK-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
                if (seenSkus.has(sku)) return;
                seenSkus.add(sku);

                // Image
                const img = row.querySelector('img');
                const imgSrc = img ? img.src : '';

                // Title: first meaningful anchor text
                let title = '';
                for (const a of row.querySelectorAll('a')) {
                    const t = a.textContent.trim().replace(/\s+/g, ' ');
                    if (t.length > 5 && !t.includes('Push') && !t.match(/^\d+$/) && t.split(' ').length >= 2) {
                        title = t;
                        break;
                    }
                }
                if (!title) {
                    title = txt.split('\n')
                        .map(l => l.trim())
                        .filter(l => l.length > 5 && !/^\d|Push|Apparel|Variant|Color|Size|Pattern/i.test(l))[0]
                        || 'Qikink Product';
                }

                // Cost price: first td with a price-like value
                let costPrice = '0';
                for (const td of tds) {
                    const t = (td.innerText || '').trim();
                    if (/^\d{2,}/.test(t) && /\./.test(t)) {
                        costPrice = firstPrice(t);
                        break;
                    }
                }
                if (costPrice === '0') costPrice = firstPrice(txt);

                if (!title || title.length < 2) return;

                products.push({
                    sku,
                    name: title,
                    description: `${title} — Fulfilled by Qikink`,
                    regular_price: costPrice,
                    images: imgSrc ? [{ src: imgSrc }] : [],
                    attributes: [
                        { name: 'Size', options: parseSizes(txt) },
                        { name: 'Color', options: parseColors(txt) },
                    ]
                });

            } catch (e) { }
        });
    }

    // ── Fallback: anchor off Push To Store buttons ──
    if (products.length === 0) {
        const btns = Array.from(document.querySelectorAll('button, a')).filter(
            el => el.textContent && el.textContent.trim() === 'Push To Store'
        );
        btns.forEach(btn => {
            try {
                const row = btn.closest('tr');
                if (!row) return;
                const txt = row.innerText || '';
                const idM = txt.match(/\b(\d{7,9})\b/);
                const sku = idM ? idM[1] : `QK-${Date.now()}`;
                if (seenSkus.has(sku)) return;
                seenSkus.add(sku);
                const img = row.querySelector('img');
                const link = Array.from(row.querySelectorAll('a')).find(a => {
                    const t = a.textContent.trim();
                    return t.length > 5 && !t.includes('Push') && t.split(' ').length >= 2;
                });
                products.push({
                    sku,
                    name: link ? link.textContent.trim() : 'Qikink Product',
                    description: 'Fulfilled by Qikink',
                    regular_price: firstPrice(txt),
                    images: img ? [{ src: img.src }] : [],
                    attributes: [
                        { name: 'Size', options: parseSizes(txt) },
                        { name: 'Color', options: parseColors(txt) },
                    ]
                });
            } catch (e) { }
        });
    }

    return products;
}
