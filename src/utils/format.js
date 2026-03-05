export function formatMoney(amount, currency = "USD") {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
}

export function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function hoursBetween(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const ms = e - s;
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return ms / (1000 * 60 * 60);
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

