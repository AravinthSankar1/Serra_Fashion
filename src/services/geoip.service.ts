import axios from 'axios';
import { COUNTRY_CURRENCY_MAP, DEFAULT_CURRENCY } from '../config/currency';

interface GeoLocationData {
    country: string;
    countryCode: string;
    currency: string;
}

class GeoIPService {
    private readonly cache: Map<string, GeoLocationData> = new Map();

    async getLocationByIP(ip: string): Promise<GeoLocationData> {
        if (this.cache.has(ip)) {
            return this.cache.get(ip)!;
        }

        try {
            const response = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 3000 });
            const data = response.data;

            const geoData: GeoLocationData = {
                country: data.country_name || 'India',
                countryCode: data.country_code || 'IN',
                currency: COUNTRY_CURRENCY_MAP[data.country_code] || DEFAULT_CURRENCY
            };

            this.cache.set(ip, geoData);
            return geoData;
        } catch (error) {
            const fallback: GeoLocationData = {
                country: 'India',
                countryCode: 'IN',
                currency: DEFAULT_CURRENCY
            };

            this.cache.set(ip, fallback);
            return fallback;
        }
    }

    extractIP(req: any): string {
        return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            '127.0.0.1';
    }
}

export const geoIPService = new GeoIPService();
