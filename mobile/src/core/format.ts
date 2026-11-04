/*
 * Indonesian number style (dot thousands, comma decimals) and the web's date
 * shapes. Written by hand instead of toLocaleString('id-ID') so the output is
 * the same on Hermes, JSC and Node.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** 12500 → "12.500", 78.5 → "78,5" */
export function fmtNum(n: number, maxFractionDigits = 2) {
  const neg = n < 0
  const [int, frac] = Math.abs(n).toFixed(maxFractionDigits).split(".")
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  const decimals = frac?.replace(/0+$/, "")
  return `${neg ? "−" : ""}${grouped}${decimals ? `,${decimals}` : ""}`
}

/** "Rp1.443.680.000" (no space), as on the web. */
export const formatIDR = (n: number) => `Rp${fmtNum(Math.round(n), 0)}`

/** Shorthand for big totals: "Rp597 jt", "Rp1,4 M". */
export function shortIDR(n: number) {
  if (Math.abs(n) >= 1e9) return `Rp${fmtNum(n / 1e9, 1)} M`
  if (Math.abs(n) >= 1e6) return `Rp${fmtNum(n / 1e6, 1)} jt`
  return formatIDR(n)
}

function parse(iso: string) {
  // Business dates are plain YYYY-MM-DD: read them as local days, not UTC midnight.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(iso)
}

/** "09 Apr 2026" */
export function fmtDate(iso: string) {
  const d = parse(iso)
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** "09 Apr" */
export function fmtDay(iso: string) {
  const d = parse(iso)
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`
}

/** "09 Apr 2026, 10:05" (ledger / broken report stamp) */
export function stamp(iso: string) {
  const d = parse(iso)
  return `${fmtDate(iso)}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

/** "10:05" */
export function clock(iso: string) {
  const d = parse(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

/** "09–10 Apr 2026", "30 Mar – 02 Apr 2026" */
export function fmtRange(start: string, finish: string) {
  if (start === finish) return fmtDate(start)
  const a = parse(start)
  const b = parse(finish)
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth())
    return `${String(a.getDate()).padStart(2, "0")}–${fmtDate(finish)}`
  return `${fmtDay(start)} – ${fmtDate(finish)}`
}

/** Whole days from a to b (both YYYY-MM-DD). */
export function daysBetween(a: string, b: string) {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000)
}

export const plural = (n: number, one: string, many = `${one}s`) => `${fmtNum(n)} ${n === 1 ? one : many}`
