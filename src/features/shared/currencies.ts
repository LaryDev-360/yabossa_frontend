export const DEFAULT_CURRENCY_CODE = "XOF";

export const SUPPORTED_CURRENCY_CODES = [
  "XOF",
  "XAF",
  "EUR",
  "USD",
  "GBP",
  "NGN",
  "GHS",
  "MAD",
  "CHF",
  "CAD",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCY_CODES)[number];
