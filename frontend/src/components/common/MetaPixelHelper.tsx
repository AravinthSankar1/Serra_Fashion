import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ─── Global type declaration ───────────────────────────────────────────────
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

// ─── Core Pixel Events ─────────────────────────────────────────────────────
export const PixelEvents = {

  // Page navigation (auto-fired by MetaPixelHelper on every route change)
  pageView: () => {
    if (window.fbq) window.fbq('track', 'PageView');
  },

  // Product detail page opened
  viewContent: (contentName?: string, contentId?: string, price?: number, currency = 'INR') => {
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: contentName,
        content_ids: contentId ? [contentId] : [],
        content_type: 'product',
        value: price,
        currency,
      });
    }
  },

  // Search performed (collection search / filter)
  search: (searchString: string) => {
    if (window.fbq) {
      window.fbq('track', 'Search', { search_string: searchString });
    }
  },

  // User selected a size or colour on PDP
  customizeProduct: (contentName?: string, contentId?: string, customizations?: Record<string, string>) => {
    if (window.fbq) {
      window.fbq('track', 'CustomizeProduct', {
        content_name: contentName,
        content_ids: contentId ? [contentId] : [],
        content_type: 'product',
        ...customizations,
      });
    }
  },

  // Product added to cart
  addToCart: (contentName?: string, contentId?: string, price?: number, currency = 'INR', quantity = 1) => {
    if (window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: contentName,
        content_ids: contentId ? [contentId] : [],
        content_type: 'product',
        value: price,
        currency,
        num_items: quantity,
      });
    }
  },

  // Product hearted / favourited
  addToWishlist: (contentName?: string, contentId?: string, price?: number, currency = 'INR') => {
    if (window.fbq) {
      window.fbq('track', 'AddToWishlist', {
        content_name: contentName,
        content_ids: contentId ? [contentId] : [],
        content_type: 'product',
        value: price,
        currency,
      });
    }
  },

  // Checkout form submitted (before payment)
  initiateCheckout: (value: number, numItems: number, currency = 'INR') => {
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        value,
        num_items: numItems,
        currency,
      });
    }
  },

  // Payment method chosen / Razorpay opened
  addPaymentInfo: (value: number, currency = 'INR', paymentMethod?: string) => {
    if (window.fbq) {
      window.fbq('track', 'AddPaymentInfo', {
        value,
        currency,
        payment_method: paymentMethod,
      });
    }
  },

  // Order completed — either COD or Razorpay
  purchase: (
    value: number,
    currency = 'INR',
    transactionId?: string,
    numItems?: number,
    contentIds?: string[],
  ) => {
    if (window.fbq) {
      window.fbq('track', 'Purchase', {
        value,
        currency,
        transaction_id: transactionId,
        num_items: numItems,
        content_ids: contentIds || [],
        content_type: 'product',
      });
    }
  },

  // New account created
  completeRegistration: (method = 'email') => {
    if (window.fbq) {
      window.fbq('track', 'CompleteRegistration', {
        status: true,
        content_name: method,
      });
    }
  },

  // User visited the login page (warm audience signal for retargeting)
  lead: (contentName = 'Login Page') => {
    if (window.fbq) {
      window.fbq('track', 'Lead', { content_name: contentName });
    }
  },

  // User successfully signed in (custom event for lookalike / retargeting)
  login: (method = 'email') => {
    if (window.fbq) {
      window.fbq('trackCustom', 'UserLogin', { method });
    }
  },
};

// ─── Auto PageView on every route change ──────────────────────────────────
const MetaPixelHelper = () => {
  const location = useLocation();

  useEffect(() => {
    PixelEvents.pageView();
  }, [location.pathname]);

  return null;
};

export default MetaPixelHelper;
