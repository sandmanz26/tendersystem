import type { RundownItem, WeddingEvent } from "./types"
import { dayDiff } from "./format"

function minutes(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

/** Current and next rundown items, only meaningful on the event day. */
export function nowAndNext(event: WeddingEvent, now = new Date()) {
  if (dayDiff(event.date) !== 0) return { now: undefined, next: undefined }
  const cur = now.getHours() * 60 + now.getMinutes()
  let current: RundownItem | undefined
  let next: RundownItem | undefined
  for (const item of event.rundown) {
    if (minutes(item.time) <= cur) current = item
    else {
      next = item
      break
    }
  }
  return { now: current, next, minutesToNext: next ? minutes(next.time) - cur : undefined }
}

export function inMinutes(m: number) {
  if (m < 60) return `in ${m} min`
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `in ${h} h ${r} min` : `in ${h} h`
}
