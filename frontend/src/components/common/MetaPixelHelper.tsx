import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Declare fbq globally so TypeScript doesn't complain
declare global {
  interface Window {
    fbq: any;
  }
}

export const PixelEvents = {
  pageView: () => {
    if (window.fbq) window.fbq('track', 'PageView');
  },
  viewContent: (contentName?: string, contentId?: string, price?: number, currency = 'INR') => {
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: contentName,
        content_ids: contentId ? [contentId] : [],
        content_type: 'product',
        value: price,
        currency: currency,
      });
    }
  },
  addToCart: (contentName?: string, contentId?: string, price?: number, currency = 'INR') => {
    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: contentName,
        content_ids: contentId ? [contentId] : [],
        content_type: 'product',
        value: price,
        currency: currency,
      });
    }
  },
  addToWishlist: (contentName?: string, contentId?: string, price?: number, currency = 'INR') => {
    if (window.fbq) {
      window.fbq('track', 'AddToWishlist', {
        content_name: contentName,
        content_ids: contentId ? [contentId] : [],
        content_type: 'product',
        value: price,
        currency: currency,
      });
    }
  },
  initiateCheckout: (value: number, numItems: number, currency = 'INR') => {
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value: value,
        num_items: numItems,
        currency: currency,
      });
    }
  },
  purchase: (value: number, currency = 'INR', transactionId?: string, numItems?: number, contentIds?: string[]) => {
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value: value,
        currency: currency,
        transaction_id: transactionId,
        num_items: numItems,
        content_ids: contentIds || [],
        content_type: 'product',
      });
    }
  },
};

const MetaPixelHelper = () => {
  const location = useLocation();

  useEffect(() => {
    // The base code already fired the first PageView on load,
    // but we need to track future navigation events
    PixelEvents.pageView();
  }, [location.pathname]);

  return null;
};

export default MetaPixelHelper;
