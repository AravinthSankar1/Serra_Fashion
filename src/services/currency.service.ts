import axios from 'axios';
import { BASE_CURRENCY, SUPPORTED_CURRENCIES } from '../config/currency';

interface ExchangeRates {
    [key: string]: number;
}

class CurrencyService {
    private rates: ExchangeRates = {};
    private lastUpdated: Date | null = null;
    private readonly CACHE_DURATION = 3600000; // 1 hour
    private readonly API_URL = 'https://api.exchangerate-api.com/v4/latest/';

    async getExchangeRates(): Promise<ExchangeRates> {
        const now = new Date();

        if (this.lastUpdated && (now.getTime() - this.lastUpdated.getTime()) < this.CACHE_DURATION && Object.keys(this.rates).length > 0) {
            return this.rates;
        }

        try {
            const response = await axios.get(`${this.API_URL}${BASE_CURRENCY}`, { timeout: 5000 });
            this.rates = response.data.rates;
            this.lastUpdated = now;
            return this.rates;
        } catch (error) {
            if (Object.keys(this.rates).length > 0) {
                return this.rates;
            }

            return this.getFallbackRates();
        }
    }

    private getFallbackRates(): ExchangeRates {
        return {
            USD: 0.012,
            EUR: 0.011,
            GBP: 0.0095,
            AUD: 0.018,
            CAD: 0.016,
            SGD: 0.016,
            AED: 0.044,
            INR: 1
        };
    }

    async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
        if (fromCurrency === toCurrency) return amount;

        const rates = await this.getExchangeRates();

        if (fromCurrency === BASE_CURRENCY) {
            return amount * (rates[toCurrency] || 1);
        }

        const inBaseCurrency = amount / (rates[fromCurrency] || 1);
        return inBaseCurrency * (rates[toCurrency] || 1);
    }

    async convertToUserCurrency(amount: number, userCurrency: string): Promise<number> {
        if (!SUPPORTED_CURRENCIES[userCurrency]) {
            userCurrency = BASE_CURRENCY;
        }

        return this.convert(amount, BASE_CURRENCY, userCurrency);
    }

    formatCurrency(amount: number, currency: string): string {
        const currencyInfo = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES[BASE_CURRENCY];

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyInfo.code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    }
}

export const currencyService = new CurrencyService();
