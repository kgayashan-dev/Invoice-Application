// utils/currency.ts
// Handles dynamic currency symbols, prefixes, and currency formatting across the application

export interface CurrencyDefinition {
  code: string;
  symbol: string;
  name: string;
  prefix: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyDefinition> = {
  LKR: { code: "LKR", symbol: "Rs.", name: "Sri Lankan Rupee (Rs.)", prefix: "Rs. " },
  USD: { code: "USD", symbol: "$", name: "US Dollar ($)", prefix: "$" },
  EUR: { code: "EUR", symbol: "€", name: "Euro (€)", prefix: "€" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound (£)", prefix: "£" },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee (₹)", prefix: "₹" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar (A$)", prefix: "A$ " },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar (C$)", prefix: "C$ " },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen (¥)", prefix: "¥" },
  SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar (S$)", prefix: "S$ " },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham (AED)", prefix: "AED " },
};

/**
 * Resolves the currency prefix for a given currency code.
 * E.g. 'LKR' -> 'Rs. ', 'USD' -> '$'
 */
export function getCurrencyPrefix(currencyCode?: string | null): string {
  if (!currencyCode) return "Rs. "; // default LKR
  const normalized = currencyCode.trim().toUpperCase();
  if (normalized === "RS" || normalized === "RS." || normalized === "LKR") return "Rs. ";
  if (normalized === "USD" || normalized === "$") return "$";
  if (SUPPORTED_CURRENCIES[normalized]) return SUPPORTED_CURRENCIES[normalized].prefix;
  return `${normalized} `;
}

/**
 * Formats a numeric value with the appropriate currency prefix and thousands separators.
 * E.g. formatCurrency(1200, "LKR") -> "Rs. 1,200.00"
 *      formatCurrency(1200, "USD") -> "$1,200.00"
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode?: string | null
): string {
  const numericAmount = typeof amount === "number" ? amount : Number(amount ?? 0);
  const safeNumber = isNaN(numericAmount) ? 0 : numericAmount;
  const prefix = getCurrencyPrefix(currencyCode);
  const formattedNumber = safeNumber.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${prefix}${formattedNumber}`;
}
