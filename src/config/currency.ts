export interface CurrencyCode {
    code: string;
    symbol: string;
    name: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyCode> = {
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
    AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
};

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
    IN: 'INR',
    US: 'USD',
    GB: 'GBP',
    AU: 'AUD',
    CA: 'CAD',
    SG: 'SGD',
    AE: 'AED',
    DE: 'EUR',
    FR: 'EUR',
    ES: 'EUR',
    IT: 'EUR',
    NL: 'EUR',
    BE: 'EUR',
    AT: 'EUR',
    IE: 'EUR',
};

export const DEFAULT_CURRENCY = 'INR';
export const BASE_CURRENCY = 'INR';
