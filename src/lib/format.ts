const TZ_LOCALE = "id-ID"

export function parseDate(date: string) {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function dayDiff(date: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((parseDate(date).getTime() - today.getTime()) / 86_400_000)
}

export function relativeDay(date: string) {
  const diff = dayDiff(date)
  if (diff === 0) return "Hari ini"
  if (diff === 1) return "Besok"
  if (diff === -1) return "Kemarin"
  if (diff > 1 && diff < 7) return `${diff} hari lagi`
  if (diff < -1 && diff > -7) return `${-diff} hari lalu`
  return formatDate(date, { day: "numeric", month: "short" })
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions) {
  return parseDate(date).toLocaleDateString(TZ_LOCALE, opts)
}

export function longDate(date: string) {
  return formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

export function clock(iso: string) {
  return new Date(iso).toLocaleTimeString(TZ_LOCALE, { hour: "2-digit", minute: "2-digit" }).replace(".", ":")
}

export function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return "baru saja"
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} hari lalu`
  return new Date(iso).toLocaleDateString(TZ_LOCALE, { day: "numeric", month: "short" })
}

export function stamp(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const day = sameDay
    ? "Hari ini"
    : d.toLocaleDateString(TZ_LOCALE, { day: "numeric", month: "short" })
  return `${day}, ${clock(iso)}`
}

export function initials(name: string) {
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/^(Pak|Bu|Ibu|Bapak|Mbak|Mas|Om|Teh)\s+/i, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export function waLink(phone: string) {
  return `https://wa.me/62${phone.replace(/^0/, "")}`
}

export function mapsLink(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
