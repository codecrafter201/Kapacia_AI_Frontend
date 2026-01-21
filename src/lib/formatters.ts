/**
 * Format number with commas for better readability
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
export function formatNumberAdmin(num: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  }).format(num);
}

/**
 * Format number as currency
 */
export function formatCurrency(num: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(num);
}

export function formatVexTokens(num: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(num);
}

/**
 * Truncate address for display
 */
export function truncateAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Get payment status color
 */
export function getPaymentStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "finished":
    case "completed":
      return "text-green-400";
    case "waiting":
    case "pending":
      return "text-yellow-400";
    case "failed":
    case "cancelled":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

/**
 * Format payment status for display
 */
export function formatPaymentStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
