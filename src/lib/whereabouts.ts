import type { ScanBook, WeddingEvent } from "@/data/types"

export type Whereabouts =
  | { at: "warehouse" }
  | { at: "event"; event: WeddingEvent; since: string }

/**
 * Where an asset physically is, from the scan trail: it is "out" from the
 * moment it is scanned onto a truck until it is scanned back into the warehouse.
 */
export function getWhereabouts(code: string, events: WeddingEvent[], scans: ScanBook): Whereabouts {
  for (const event of events) {
    const out = scans[event.id]?.load_out?.[code]
    const back = scans[event.id]?.return?.[code]
    if (out && !back) return { at: "event", event, since: out.at }
  }
  return { at: "warehouse" }
}
