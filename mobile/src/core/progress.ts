import { PHASES } from "./phases"
import type { Phase, PhaseKey, Report, ScanBook, ScanRecord, WeddingEvent } from "./types"

export type AssetPhaseState =
  | { state: "scanned"; record: ScanRecord }
  | { state: "reported"; report: Report }
  | { state: "pending" }

/** tasks[eventId][phaseKey] = ticked task labels */
export type TaskBook = Record<string, Partial<Record<PhaseKey, string[]>>>

export interface ProgressSource {
  scans: ScanBook
  reports: Report[]
  tasks: TaskBook
}

export interface PhaseProgress {
  phase: Phase
  total: number
  scanned: number
  reported: number
  pending: string[]
  /** Scans that arrived without a scan at the previous checkpoint. */
  flagged: string[]
  tasksDone: string[]
  /** Gate for moving to the next phase (scan list or checklist). */
  complete: boolean
  byAsset: Record<string, AssetPhaseState>
}

/** Progress of the event's current phase, or null when the event is closed. */
export function getEventProgress(event: WeddingEvent, src: ProgressSource): PhaseProgress | null {
  const phase = PHASES[event.phaseIndex]
  if (!phase) return null
  return getPhaseProgress(event, phase, src)
}

export function getPhaseProgress(
  event: WeddingEvent,
  phase: Phase,
  { scans, reports, tasks }: ProgressSource
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
  const flagged: string[] = []
  for (const code of event.assetCodes) {
    const record = book[code]
    const report = damage.find((r) => r.assetCode === code)
    if (record) {
      byAsset[code] = { state: "scanned", record }
      scanned++
      if (record.skippedPrevious) flagged.push(code)
    } else if (report) {
      byAsset[code] = { state: "reported", report }
      reported++
    } else {
      byAsset[code] = { state: "pending" }
      pending.push(code)
    }
  }
  const tasksDone = (tasks[event.id]?.[phase.key] ?? []).filter((t) => phase.tasks?.includes(t))
  const complete = phase.requiresScan
    ? pending.length === 0
    : tasksDone.length === (phase.tasks?.length ?? 0)
  return {
    phase,
    total: event.assetCodes.length,
    scanned,
    reported,
    pending,
    flagged,
    tasksDone,
    complete,
    byAsset,
  }
}

export function isClosed(event: WeddingEvent) {
  return event.phaseIndex >= PHASES.length
}
