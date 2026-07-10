import type { GstRate } from '@/types';

// ─── GST Rates ────────────────────────────────────────────────────────────────

export const GST_RATES: { value: GstRate; label: string; description: string }[] = [
  { value: '0',  label: '0%',  description: 'No GST (exempt items)' },
  { value: '5',  label: '5%',  description: 'Silk, cotton, man-made fibers' },
  { value: '12', label: '12%', description: 'Embroidered / synthetic blends' },
  { value: '18', label: '18%', description: 'Designer / specialty fabrics' },
  { value: '28', label: '28%', description: 'Luxury / rare fabrics' },
];

export const GST_RATE_VALUES: GstRate[] = ['0', '5', '12', '18', '28'];

// ─── GST Calculation Utilities ────────────────────────────────────────────────

/**
 * Compute CGST and SGST amounts from a taxable amount.
 * Same-state transactions use CGST + SGST (each = gstRate / 2).
 * Inter-state uses IGST (= full gstRate).
 */
export function computeGst(
  taxableAmount: number,
  gstRate: GstRate,
  isInterState = false
): {
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
} {
  const rate = parseFloat(gstRate) / 100;
  const gstAmount = parseFloat((taxableAmount * rate).toFixed(2));

  if (isInterState) {
    return { gstAmount, cgstAmount: 0, sgstAmount: 0, igstAmount: gstAmount };
  }

  const half = parseFloat((gstAmount / 2).toFixed(2));
  return {
    gstAmount,
    cgstAmount: half,
    sgstAmount: gstAmount - half, // handles odd paise
    igstAmount: 0,
  };
}

/**
 * Extract the pre-tax amount from a tax-inclusive price.
 */
export function extractTaxable(inclusivePrice: number, gstRate: GstRate): number {
  const rate = parseFloat(gstRate) / 100;
  return parseFloat((inclusivePrice / (1 + rate)).toFixed(2));
}

/**
 * Compute the effective selling price after discount.
 */
export function effectivePrice(sellingPrice: number, discountPercent: number): number {
  return parseFloat((sellingPrice * (1 - discountPercent / 100)).toFixed(2));
}

// ─── Currency ──────────────────────────────────────────────────────────────────

export const CURRENCY = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN',
} as const;

export function formatCurrency(
  amount: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_00_00_000) {
    return `${CURRENCY.symbol}${(amount / 1_00_00_000).toFixed(1)}Cr`;
  }
  if (amount >= 1_00_000) {
    return `${CURRENCY.symbol}${(amount / 1_00_000).toFixed(1)}L`;
  }
  if (amount >= 1_000) {
    return `${CURRENCY.symbol}${(amount / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}
