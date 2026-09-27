export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseCurrency(input: string): number {
  const normalized = input.replace(/[^\d]/g, '');
  return parseInt(normalized, 10) || 0;
}
