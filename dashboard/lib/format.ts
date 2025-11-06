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


