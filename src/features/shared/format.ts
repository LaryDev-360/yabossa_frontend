export function formatMoney(value: string | number | null | undefined, locale = "en"): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(num)) {
    return String(value);
  }
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(num);
}

export function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}
