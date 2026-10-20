import * as React from "react"

import { CURRENT_USER_ID, EVENTS, PHASE_LOG, REPORTS, SCANS } from "@/data/mock"
import { PHASES } from "@/data/phases"
import type {
  PhaseLogEntry,
  Report,
  ReportStatus,
  ScanBook,
  WeddingEvent,
} from "@/data/types"
import { getEventProgress } from "@/lib/progress"

const STORAGE_KEY = "kru:state:v1"

interface PersistedState {
  phaseIndex: Record<string, number>
  scans: ScanBook
  phaseLog: Record<string, PhaseLogEntry[]>
  reports: Report[]
}

function seed(): PersistedState {
  return {
    phaseIndex: Object.fromEntries(EVENTS.map((e) => [e.id, e.phaseIndex])),
    scans: SCANS,
    phaseLog: PHASE_LOG,
    reports: REPORTS,
  }
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PersistedState
  } catch {
    /* storage unavailable or corrupt: fall back to seed */
  }
  return seed()
}

export type ScanResult =
  | { status: "ok"; code: string }
  | { status: "duplicate"; code: string; at: string }
  | { status: "unknown"; code: string }
  | { status: "not-scan-phase"; code: string }

export type NewReport = Omit<Report, "id" | "createdAt" | "by" | "updates" | "status" | "phase">

interface AppStore extends PersistedState {
  userId: string
  events: WeddingEvent[]
  scan: (eventId: string, rawCode: string) => ScanResult
  advancePhase: (eventId: string) => void
  addReport: (report: NewReport) => Report
  addReportUpdate: (reportId: string, text: string, status?: ReportStatus) => void
  reset: () => void
}

const Ctx = React.createContext<AppStore | null>(null)

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<PersistedState>(load)
  // Mirror for synchronous reads inside callbacks (scan returns a result immediately).
  const ref = React.useRef(state)
  React.useLayoutEffect(() => {
    ref.current = state
  }, [state])

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* quota exceeded (photos) or private mode: keep working in memory */
    }
  }, [state])

  const events = React.useMemo(
    () => EVENTS.map((e) => ({ ...e, phaseIndex: state.phaseIndex[e.id] ?? e.phaseIndex })),
    [state.phaseIndex]
  )

  const scan = React.useCallback(
    (eventId: string, rawCode: string): ScanResult => {
      const code = rawCode.trim().toUpperCase()
      const s = ref.current
      const event = EVENTS.find((e) => e.id === eventId)!
      const phase = PHASES[s.phaseIndex[eventId]]
      if (!phase?.requiresScan) return { status: "not-scan-phase", code }
      if (!event.assetCodes.includes(code)) return { status: "unknown", code }
      const existing = s.scans[eventId]?.[phase.key]?.[code]
      if (existing) return { status: "duplicate", code, at: existing.at }

      const record = { at: new Date().toISOString(), by: CURRENT_USER_ID }
      const next: PersistedState = {
        ...s,
        scans: {
          ...s.scans,
          [eventId]: {
            ...s.scans[eventId],
            [phase.key]: { ...s.scans[eventId]?.[phase.key], [code]: record },
          },
        },
      }
      ref.current = next
      setState(next)
      return { status: "ok", code }
    },
    []
  )

  const advancePhase = React.useCallback((eventId: string) => {
    setState((s) => {
      const event = EVENTS.find((e) => e.id === eventId)!
      const idx = s.phaseIndex[eventId]
      const progress = getEventProgress({ ...event, phaseIndex: idx }, s.scans, s.reports)
      if (!progress || !progress.complete) return s
      return {
        ...s,
        phaseIndex: { ...s.phaseIndex, [eventId]: idx + 1 },
        phaseLog: {
          ...s.phaseLog,
          [eventId]: [
            ...(s.phaseLog[eventId] ?? []),
            { phase: PHASES[idx].key, at: new Date().toISOString(), by: CURRENT_USER_ID },
          ],
        },
      }
    })
  }, [])

  const addReport = React.useCallback((input: NewReport) => {
    const s = ref.current
    const maxId = Math.max(...s.reports.map((r) => Number(r.id.split("-")[1])), 140)
    const phase = PHASES[Math.min(s.phaseIndex[input.eventId], PHASES.length - 1)].key
    const report: Report = {
      ...input,
      id: `RPT-${String(maxId + 1).padStart(4, "0")}`,
      phase,
      status: "Terbuka",
      createdAt: new Date().toISOString(),
      by: CURRENT_USER_ID,
      updates: [],
    }
    const next = { ...s, reports: [report, ...s.reports] }
    ref.current = next
    setState(next)
    return report
  }, [])

  const addReportUpdate = React.useCallback(
    (reportId: string, text: string, status?: ReportStatus) => {
      setState((s) => ({
        ...s,
        reports: s.reports.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: status ?? r.status,
                updates: [
                  ...r.updates,
                  { at: new Date().toISOString(), by: CURRENT_USER_ID, text },
                ],
              }
            : r
        ),
      }))
    },
    []
  )

  const reset = React.useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    setState(seed())
  }, [])

  const value = React.useMemo<AppStore>(
    () => ({
      ...state,
      userId: CURRENT_USER_ID,
      events,
      scan,
      advancePhase,
      addReport,
      addReportUpdate,
      reset,
    }),
    [state, events, scan, advancePhase, addReport, addReportUpdate, reset]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppStore() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider")
  return ctx
}
