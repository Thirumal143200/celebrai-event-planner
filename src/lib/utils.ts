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

/**
 * Format currency with international standard symbol.
 */
export function formatCurrencyAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
  };
  return `${symbols[currency] || ''}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
