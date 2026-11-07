export function money(value: number | null | undefined, options: { cents?: boolean } = {}): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "Unknown";
  const rounded = options.cents ? value : Math.round(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: options.cents ? 2 : 0,
    minimumFractionDigits: options.cents ? 2 : 0,
  }).format(rounded);
}

export function moneyShort(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "Unknown";
  if (Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000;
    return `$${millions.toFixed(millions >= 10 ? 1 : 2).replace(/\.?0+$/, "")}M`;
  }
  if (Math.abs(value) >= 1_000) {
    const thousands = value / 1_000;
    return `$${thousands.toFixed(thousands >= 100 ? 0 : 1).replace(/\.?0+$/, "")}k`;
  }
  return `$${Math.round(value)}`;
}

export function percent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "Unknown";
  return `${value.toFixed(digits)}%`;
}

export function number(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "Unknown";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
