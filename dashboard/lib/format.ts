export function formatNumberShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

export function truncateAddress(addr: string, left = 6, right = 4): string {
  if (!addr || addr.length <= left + right + 3) return addr;
  return addr.slice(0, left) + "…" + addr.slice(-right);
}

export function formatCurrencyShort(amount: number, currency = "fbUSD"): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  let formatted: string;
  if (abs >= 1_000_000_000) formatted = (abs / 1_000_000_000).toFixed(1) + "B";
  else if (abs >= 1_000_000) formatted = (abs / 1_000_000).toFixed(1) + "M";
  else if (abs >= 1_000) formatted = (abs / 1_000).toFixed(1) + "K";
  else formatted = abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sign}${formatted} ${currency}`;
}

// Intl-based helpers (compact and consistent across UI)
const integerFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const compactNumberFormatter = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const amountFormatter = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value);
}

export function formatAmount(value: number): string {
  return amountFormatter.format(value);
}

export function formatIsoTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatIsoDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
