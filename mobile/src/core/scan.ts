import { ASSETS, EVENTS } from "./mock"
import { PHASES, previousScanPhase } from "./phases"
import type { PhaseKey, ScanBook, ScanRecord } from "./types"
import { getWhereabouts } from "./whereabouts"

export type ScanResult =
  | { status: "ok"; code: string; skippedPrevious?: PhaseKey; conditionNote?: string }
  | { status: "still-out"; code: string; eventName: string }
  | { status: "duplicate"; code: string; at: string; by: string }
  | { status: "other-event"; code: string; eventName?: string }
  | { status: "unknown"; code: string }
  | { status: "invalid"; code: string }
  | { status: "not-scan-phase"; code: string }
  | { status: "not-assigned"; code: string }

const CODE_PATTERN = /^[A-Z]{3}-[A-Z]{3}-\d{2}$/

/** Labels get typed with spaces, lowercase, or underscores. */
export function normaliseCode(raw: string) {
  return raw.trim().toUpperCase().replace(/[\s_]+/g, "-")
}

export interface ScanInput {
  eventId: string
  rawCode: string
  userId: string
  phaseIndex: Record<string, number>
  scans: ScanBook
  online: boolean
  now?: Date
}

/**
 * Validates one scan and, when it is accepted, returns the record to store.
 * Pure: the store decides what to do with the result. The first failing
 * check wins, in this order: crew, phase, format, manifest, duplicate,
 * still out at another event (load-out only).
 */
export function validateScan(input: ScanInput): { result: ScanResult; phase?: PhaseKey; record?: ScanRecord } {
  const { eventId, userId, phaseIndex, scans } = input
  const code = normaliseCode(input.rawCode)
  const event = EVENTS.find((e) => e.id === eventId)
  const idx = phaseIndex[eventId]
  const phase = PHASES[idx]

  if (!event || !event.crew.some((c) => c.personId === userId)) return { result: { status: "not-assigned", code } }
  if (!phase?.requiresScan) return { result: { status: "not-scan-phase", code } }
  if (!CODE_PATTERN.test(code)) return { result: { status: "invalid", code } }
  if (!event.assetCodes.includes(code)) {
    if (!ASSETS.some((a) => a.code === code)) return { result: { status: "unknown", code } }
    // Known asset, wrong event: tell the crew where it belongs.
    const owner = EVENTS.find(
      (e) => e.id !== eventId && e.assetCodes.includes(code) && (phaseIndex[e.id] ?? 0) < PHASES.length
    )
    return { result: { status: "other-event", code, eventName: owner?.couple } }
  }
  const existing = scans[eventId]?.[phase.key]?.[code]
  if (existing) return { result: { status: "duplicate", code, at: existing.at, by: existing.by } }

  // Loading out an asset that never came back from another event means a
  // wrong label or a double booking. Block it and say where it is.
  if (phase.key === "load_out") {
    const where = getWhereabouts(code, EVENTS.filter((e) => e.id !== eventId), scans)
    if (where.at === "event") return { result: { status: "still-out", code, eventName: where.event.couple } }
  }

  const prev = previousScanPhase(idx)
  const skipped = !!prev && !scans[eventId]?.[prev.key]?.[code]
  const asset = ASSETS.find((a) => a.code === code)!
  return {
    phase: phase.key,
    record: {
      at: (input.now ?? new Date()).toISOString(),
      by: userId,
      synced: input.online,
      skippedPrevious: skipped || undefined,
    },
    result: {
      status: "ok",
      code,
      skippedPrevious: skipped ? prev!.key : undefined,
      conditionNote: asset.condition !== "Good" && phase.key === "load_out" ? asset.notes : undefined,
    },
  }
}
