import * as React from "react"
import { toast } from "sonner"

import { ASSETS, CURRENT_USER_ID, EVENTS, PHASE_LOG, REPORTS, SCANS } from "@/data/mock"
import { PHASES, previousScanPhase } from "@/data/phases"
import type {
  Handover,
  PhaseKey,
  PhaseLogEntry,
  Report,
  ReportStatus,
  ScanBook,
  WeddingEvent,
} from "@/data/types"
import { getEventProgress, type TaskBook } from "@/lib/progress"
import { getWhereabouts } from "@/lib/whereabouts"

const STORAGE_KEY = "kru:state:v2"

interface PersistedState {
  phaseIndex: Record<string, number>
  scans: ScanBook
  phaseLog: Record<string, PhaseLogEntry[]>
  reports: Report[]
  tasks: TaskBook
  /** Demo switch to rehearse a venue with no signal. */
  forceOffline: boolean
  lastSyncAt: string
}

function seed(): PersistedState {
  return {
    phaseIndex: Object.fromEntries(EVENTS.map((e) => [e.id, e.phaseIndex])),
    scans: SCANS,
    phaseLog: PHASE_LOG,
    reports: REPORTS,
    tasks: {},
    forceOffline: false,
    lastSyncAt: new Date().toISOString(),
  }
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...seed(), ...(JSON.parse(raw) as Partial<PersistedState>) }
  } catch {
    /* storage unavailable or corrupt: fall back to seed */
  }
  return seed()
}

export type ScanResult =
  | { status: "ok"; code: string; skippedPrevious?: PhaseKey; conditionNote?: string }
  | { status: "still-out"; code: string; eventName: string }
  | { status: "duplicate"; code: string; at: string; by: string }
  | { status: "other-event"; code: string; eventName?: string }
  | { status: "unknown"; code: string }
  | { status: "invalid"; code: string }
  | { status: "not-scan-phase"; code: string }
  | { status: "not-assigned"; code: string }

export type NewReport = Omit<
  Report,
  "id" | "createdAt" | "by" | "updates" | "status" | "phase" | "synced"
>

const CODE_PATTERN = /^[A-Z]{3}-[A-Z]{3}-\d{2}$/

interface AppStore extends PersistedState {
  userId: string
  events: WeddingEvent[]
  online: boolean
  pendingSync: number
  scan: (eventId: string, rawCode: string) => ScanResult
  undoScan: (eventId: string, code: string) => void
  toggleTask: (eventId: string, task: string) => void
  advancePhase: (eventId: string, handover?: Handover) => boolean
  addReport: (report: NewReport) => Report
  addReportUpdate: (reportId: string, text: string, status?: ReportStatus) => void
  setForceOffline: (v: boolean) => void
  reset: () => void
}

const Ctx = React.createContext<AppStore | null>(null)

function useBrowserOnline() {
  const [online, setOnline] = React.useState(() => navigator.onLine)
  React.useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])
  return online
}

function countPending(s: PersistedState) {
  let n = s.reports.filter((r) => r.synced === false).length
  for (const byPhase of Object.values(s.scans))
    for (const byCode of Object.values(byPhase))
      for (const rec of Object.values(byCode ?? {})) if (rec.synced === false) n++
  return n
}

function markAllSynced(s: PersistedState): PersistedState {
  const scans: ScanBook = {}
  for (const [eventId, byPhase] of Object.entries(s.scans)) {
    scans[eventId] = {}
    for (const [phase, byCode] of Object.entries(byPhase)) {
      scans[eventId][phase as PhaseKey] = Object.fromEntries(
        Object.entries(byCode ?? {}).map(([c, r]) => [c, { ...r, synced: true }])
      )
    }
  }
  return {
    ...s,
    scans,
    reports: s.reports.map((r) => (r.synced === false ? { ...r, synced: true } : r)),
    lastSyncAt: new Date().toISOString(),
  }
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<PersistedState>(load)
  // Mirror for synchronous reads inside callbacks (scan returns a result immediately).
  const ref = React.useRef(state)
  React.useLayoutEffect(() => {
    ref.current = state
  }, [state])

  const browserOnline = useBrowserOnline()
  const online = browserOnline && !state.forceOffline
  const onlineRef = React.useRef(online)
  React.useLayoutEffect(() => {
    onlineRef.current = online
  }, [online])
  const pendingSync = React.useMemo(() => countPending(state), [state])

  const commit = React.useCallback((next: PersistedState) => {
    ref.current = next
    setState(next)
  }, [])

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      toast.error("Memori browser penuh. Data terbaru belum tersimpan, hapus beberapa foto laporan.", {
        id: "storage-full",
      })
    }
  }, [state])

  // Push the offline queue once a connection is back (simulated latency).
  React.useEffect(() => {
    if (!online || pendingSync === 0) return
    const t = window.setTimeout(() => {
      const n = countPending(ref.current)
      commit(markAllSynced(ref.current))
      toast.success(`${n} data tersinkron ke server`, { id: "sync" })
    }, 1500)
    return () => window.clearTimeout(t)
  }, [online, pendingSync, commit])

  const events = React.useMemo(
    () => EVENTS.map((e) => ({ ...e, phaseIndex: state.phaseIndex[e.id] ?? e.phaseIndex })),
    [state.phaseIndex]
  )

  const scan = React.useCallback(
    (eventId: string, rawCode: string): ScanResult => {
      // Labels get typed with spaces, lowercase, or underscores; normalise first.
      const code = rawCode.trim().toUpperCase().replace(/[\s_]+/g, "-")
      const s = ref.current
      const event = EVENTS.find((e) => e.id === eventId)!
      const idx = s.phaseIndex[eventId]
      const phase = PHASES[idx]
      if (!event.crew.some((c) => c.personId === CURRENT_USER_ID))
        return { status: "not-assigned", code }
      if (!phase?.requiresScan) return { status: "not-scan-phase", code }
      if (!CODE_PATTERN.test(code)) return { status: "invalid", code }
      if (!event.assetCodes.includes(code)) {
        if (!ASSETS.some((a) => a.code === code)) return { status: "unknown", code }
        // Known asset, wrong event: tell the crew where it belongs.
        const owner = EVENTS.find(
          (e) => e.id !== eventId && e.assetCodes.includes(code) && (s.phaseIndex[e.id] ?? 0) < PHASES.length
        )
        return { status: "other-event", code, eventName: owner?.couple }
      }
      const existing = s.scans[eventId]?.[phase.key]?.[code]
      if (existing) return { status: "duplicate", code, at: existing.at, by: existing.by }

      // Loading out an asset that never came back from another event means
      // a wrong label or a double booking. Block it and say where it is.
      if (phase.key === "load_out") {
        const where = getWhereabouts(
          code,
          EVENTS.filter((e) => e.id !== eventId),
          s.scans
        )
        if (where.at === "event") return { status: "still-out", code, eventName: where.event.couple }
      }

      const prev = previousScanPhase(idx)
      const skipped = !!prev && !s.scans[eventId]?.[prev.key]?.[code]
      const record = {
        at: new Date().toISOString(),
        by: CURRENT_USER_ID,
        synced: onlineRef.current,
        skippedPrevious: skipped || undefined,
      }
      commit({
        ...s,
        scans: {
          ...s.scans,
          [eventId]: {
            ...s.scans[eventId],
            [phase.key]: { ...s.scans[eventId]?.[phase.key], [code]: record },
          },
        },
      })
      const asset = ASSETS.find((a) => a.code === code)!
      return {
        status: "ok",
        code,
        skippedPrevious: skipped ? prev!.key : undefined,
        conditionNote: asset.condition !== "Baik" && phase.key === "load_out" ? asset.notes : undefined,
      }
    },
    [commit]
  )

  const undoScan = React.useCallback(
    (eventId: string, code: string) => {
      const s = ref.current
      const phase = PHASES[s.phaseIndex[eventId]]
      if (!phase) return
      const rest = { ...s.scans[eventId]?.[phase.key] }
      delete rest[code]
      commit({ ...s, scans: { ...s.scans, [eventId]: { ...s.scans[eventId], [phase.key]: rest } } })
    },
    [commit]
  )

  const toggleTask = React.useCallback(
    (eventId: string, task: string) => {
      const s = ref.current
      const phase = PHASES[s.phaseIndex[eventId]]
      if (!phase) return
      const done = s.tasks[eventId]?.[phase.key] ?? []
      const next = done.includes(task) ? done.filter((t) => t !== task) : [...done, task]
      commit({ ...s, tasks: { ...s.tasks, [eventId]: { ...s.tasks[eventId], [phase.key]: next } } })
    },
    [commit]
  )

  const advancePhase = React.useCallback(
    (eventId: string, handover?: Handover) => {
      const s = ref.current
      const event = EVENTS.find((e) => e.id === eventId)!
      const idx = s.phaseIndex[eventId]
      const progress = getEventProgress({ ...event, phaseIndex: idx }, s)
      // Re-check the gate here too: the button may be stale (another tab, double tap).
      if (!progress?.complete) return false
      if (PHASES[idx].handover && !handover) return false
      commit({
        ...s,
        phaseIndex: { ...s.phaseIndex, [eventId]: idx + 1 },
        phaseLog: {
          ...s.phaseLog,
          [eventId]: [
            ...(s.phaseLog[eventId] ?? []),
            { phase: PHASES[idx].key, at: new Date().toISOString(), by: CURRENT_USER_ID, handover },
          ],
        },
      })
      return true
    },
    [commit]
  )

  const addReport = React.useCallback(
    (input: NewReport) => {
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
        synced: onlineRef.current,
      }
      commit({ ...s, reports: [report, ...s.reports] })
      return report
    },
    [commit]
  )

  const addReportUpdate = React.useCallback(
    (reportId: string, text: string, status?: ReportStatus) => {
      const s = ref.current
      commit({
        ...s,
        reports: s.reports.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: status ?? r.status,
                synced: onlineRef.current ? r.synced : false,
                updates: [...r.updates, { at: new Date().toISOString(), by: CURRENT_USER_ID, text }],
              }
            : r
        ),
      })
    },
    [commit]
  )

  const setForceOffline = React.useCallback(
    (v: boolean) => commit({ ...ref.current, forceOffline: v }),
    [commit]
  )

  const reset = React.useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    commit(seed())
  }, [commit])

  const value = React.useMemo<AppStore>(
    () => ({
      ...state,
      userId: CURRENT_USER_ID,
      events,
      online,
      pendingSync,
      scan,
      undoScan,
      toggleTask,
      advancePhase,
      addReport,
      addReportUpdate,
      setForceOffline,
      reset,
    }),
    [state, events, online, pendingSync, scan, undoScan, toggleTask, advancePhase, addReport, addReportUpdate, setForceOffline, reset]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppStore() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider")
  return ctx
}
