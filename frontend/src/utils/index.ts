import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Legacy formatPrice — kept for backward compatibility.
 * New code should use useCurrency().format() for dynamic currency.
 * This falls back to INR formatting.
 */
export function formatPrice(price: number): string {
    if (typeof price !== 'number' || isNaN(price)) return '₹0';

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(price);
}

/**
 * Sanitize numeric input — prevents "0100" format, strips leading zeros.
 * Use for admin price inputs.
 */
export function sanitizeNumericInput(value: string): string {
    // Remove non-numeric except decimal
    const cleaned = value.replace(/[^0-9.]/g, '');
    // Prevent leading zeros (allow "0." for decimals)
    const sanitized = cleaned.replace(/^0+(\d)/, '$1');
    // Prevent multiple decimals
    const parts = sanitized.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }
    return sanitized;
}

/**
 * Format date consistently across the app
 */
export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(new Date(date));
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '…';
}
