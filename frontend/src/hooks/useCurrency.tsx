import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';

// ─── CURRENCY METADATA (NO HARDCODED SYMBOLS IN COMPONENTS) ───
const CURRENCY_META: Record<string, { symbol: string; locale: string }> = {
    INR: { symbol: '₹', locale: 'en-IN' },
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' },
    AUD: { symbol: 'A$', locale: 'en-AU' },
    CAD: { symbol: 'C$', locale: 'en-CA' },
    SGD: { symbol: 'S$', locale: 'en-SG' },
    AED: { symbol: 'د.إ', locale: 'ar-AE' },
    JPY: { symbol: '¥', locale: 'ja-JP' },
    CNY: { symbol: '¥', locale: 'zh-CN' },
    KRW: { symbol: '₩', locale: 'ko-KR' },
    BRL: { symbol: 'R$', locale: 'pt-BR' },
    MXN: { symbol: 'MX$', locale: 'es-MX' },
    ZAR: { symbol: 'R', locale: 'en-ZA' },
    SEK: { symbol: 'kr', locale: 'sv-SE' },
    CHF: { symbol: 'CHF', locale: 'de-CH' },
    NZD: { symbol: 'NZ$', locale: 'en-NZ' },
    THB: { symbol: '฿', locale: 'th-TH' },
    MYR: { symbol: 'RM', locale: 'ms-MY' },
    SAR: { symbol: 'ر.س', locale: 'ar-SA' },
};

interface CurrencyState {
    currency: string;
    symbol: string;
    rates: Record<string, number>;
    isLoading: boolean;
    isInitialized: boolean;
    setCurrency: (currency: string) => void;
    loadRates: () => Promise<void>;
    detectCurrency: () => Promise<void>;
    convert: (amount: number, from?: string) => number;
    format: (amount: number) => string;
    formatWithCode: (amount: number) => string;
}

export const useCurrency = create<CurrencyState>()(
    persist(
        (set, get) => ({
            currency: 'INR',
            symbol: '₹',
            rates: { INR: 1 },
            isLoading: false,
            isInitialized: false,

            setCurrency: async (currency: string) => {
                const meta = CURRENCY_META[currency] || CURRENCY_META.INR;
                set({ currency, symbol: meta.symbol });

                // Persist to backend
                try {
                    await api.put('/users/currency-preference', { currency });
                } catch {
                    // Silent — user might not be logged in
                }
            },

            loadRates: async () => {
                const { isLoading } = get();
                if (isLoading) return;

                set({ isLoading: true });
                try {
                    const res = await api.get('/currency/rates');
                    set({ rates: res.data.data, isLoading: false, isInitialized: true });
                } catch {
                    set({ isLoading: false, isInitialized: true });
                }
            },

            detectCurrency: async () => {
                try {
                    // Try to detect from user profile first
                    const token = localStorage.getItem('accessToken');
                    if (token) {
                        const res = await api.get('/users/profile');
                        const userCurrency = res.data?.data?.preferredCurrency;
                        if (userCurrency && CURRENCY_META[userCurrency]) {
                            const meta = CURRENCY_META[userCurrency];
                            set({ currency: userCurrency, symbol: meta.symbol });
                            return;
                        }
                    }
                } catch {
                    // Fallback: use stored value from persisted state
                }
            },

            convert: (amount: number, from: string = 'INR') => {
                if (typeof amount !== 'number' || isNaN(amount)) return 0;
                const { currency, rates } = get();
                if (from === currency) return amount;

                // Convert from source to INR first, then to target
                const inINR = from === 'INR' ? amount : amount / (rates[from] || 1);
                return Math.round(inINR * (rates[currency] || 1) * 100) / 100;
            },

            format: (amount: number) => {
                if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
                const { currency } = get();
                const meta = CURRENCY_META[currency] || CURRENCY_META.INR;

                try {
                    return new Intl.NumberFormat(meta.locale, {
                        style: 'currency',
                        currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
                    }).format(amount);
                } catch {
                    return `${meta.symbol}${Math.round(amount).toLocaleString()}`;
                }
            },

            formatWithCode: (amount: number) => {
                const { format, currency } = get();
                return `${format(amount)} ${currency}`;
            },
        }),
        {
            name: 'serra-currency',
            partialize: (state) => ({
                currency: state.currency,
                symbol: state.symbol,
                rates: state.rates,
            }),
        }
    )
);
