import { PHASES } from "@/data/phases"
import type { Phase, Report, ScanBook, ScanRecord, WeddingEvent } from "@/data/types"

export type AssetPhaseState =
  | { state: "scanned"; record: ScanRecord }
  | { state: "reported"; report: Report }
  | { state: "pending" }

export interface PhaseProgress {
  phase: Phase
  total: number
  scanned: number
  reported: number
  pending: string[]
  /** Gate for moving to the next phase. Non-scan phases are always passable. */
  complete: boolean
  byAsset: Record<string, AssetPhaseState>
}

/** Progress of the event's current phase, or null when the event is closed. */
export function getEventProgress(
  event: WeddingEvent,
  scans: ScanBook,
  reports: Report[]
): PhaseProgress | null {
  const phase = PHASES[event.phaseIndex]
  if (!phase) return null
  return getPhaseProgress(event, phase, scans, reports)
}

export function getPhaseProgress(
  event: WeddingEvent,
  phase: Phase,
  scans: ScanBook,
  reports: Report[]
): PhaseProgress {
  const book = scans[event.id]?.[phase.key] ?? {}
  // A damage/missing report filed during this phase stands in for a scan,
  // so one broken crate doesn't block the whole crew.
  const damage = reports.filter(
    (r) => r.eventId === event.id && r.kind === "damage" && r.phase === phase.key && r.assetCode
  )
  const byAsset: Record<string, AssetPhaseState> = {}
  let scanned = 0
  let reported = 0
  const pending: string[] = []
  for (const code of event.assetCodes) {
    const record = book[code]
    const report = damage.find((r) => r.assetCode === code)
    if (record) {
      byAsset[code] = { state: "scanned", record }
      scanned++
    } else if (report) {
      byAsset[code] = { state: "reported", report }
      reported++
    } else {
      byAsset[code] = { state: "pending" }
      pending.push(code)
    }
  }
  return {
    phase,
    total: event.assetCodes.length,
    scanned,
    reported,
    pending,
    complete: !phase.requiresScan || pending.length === 0,
    byAsset,
  }
}

export function isClosed(event: WeddingEvent) {
  return event.phaseIndex >= PHASES.length
}
