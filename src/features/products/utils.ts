/**
 * Generate a sequential SKU or Barcode based on a prefix and a unique number.
 * Defaults to 'PRD' if no prefix is provided.
 */
export function generateSKU(prefix = 'PRD', sequence = 1): string {
  const padSequence = sequence.toString().padStart(5, '0');
  return `${prefix.toUpperCase()}-${padSequence}`;
}

export function generateBarcode(): string {
  // Simple random 12-digit barcode generator for demo purposes.
  // In a real app, this might involve GS1 standards or DB sequences.
  const randomStr = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
  return randomStr;
}

export function calculateGST(price: number, rate: number): number {
  return price * (rate / 100);
}

export function calculatePriceWithGST(price: number, rate: number): number {
  return price + calculateGST(price, rate);
}
