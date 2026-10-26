import type { Currency } from './types';

/**
 * Utility functions for CelebrAI
 */

/**
 * Calculate the number of days until a target date.
 */
export function getDaysUntil(dateString: string): number {
  const target = new Date(dateString).getTime();
  if (isNaN(target)) return 0;
  const now = Date.now();
  return Math.ceil((target - now) / (24 * 60 * 60 * 1000));
}

/**
 * Generate a unique client-side identifier.
 */
export function generateClientSideId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
};

/**
 * Return the display symbol for a supported currency.
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || '$';
}

/**
 * Format currency with international standard symbol.
 */
export function formatCurrency(amount: number, currency: Currency | string): string {
  const symbol = (currency in CURRENCY_SYMBOLS)
    ? CURRENCY_SYMBOLS[currency as Currency]
    : (CURRENCY_SYMBOLS.USD);

  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Alias for backward compatibility with existing callers.
 */
export const formatCurrencyAmount = formatCurrency;

