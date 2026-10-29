import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import * as React from "react"

import { CURRENT_USER_ID, EVENTS, PHASE_LOG, REPORTS, SCANS } from "./core/mock"
import { PHASES } from "./core/phases"
import { getEventProgress, type TaskBook } from "./core/progress"
import { validateScan, type ScanResult } from "./core/scan"
import type {
  Handover,
  PhaseKey,
  PhaseLogEntry,
  Report,
  ReportStatus,
  ScanBook,
  WeddingEvent,
} from "./core/types"
import { useToast } from "./ui/toast"

const STORAGE_KEY = "kru:state:v1"

export interface PersistedState {
  phaseIndex: Record<string, number>
  scans: ScanBook
  phaseLog: Record<string, PhaseLogEntry[]>
  reports: Report[]
  tasks: TaskBook
  /** Switch to rehearse a venue with no signal. */
  forceOffline: boolean
  lastSyncAt: string
}

export function seedState(): PersistedState {
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

export type NewReport = Omit<Report, "id" | "createdAt" | "by" | "updates" | "status" | "phase" | "synced">

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

export function countPending(s: PersistedState) {
  let n = s.reports.filter((r) => r.synced === false).length
  for (const byPhase of Object.values(s.scans))
    for (const byCode of Object.values(byPhase)) for (const rec of Object.values(byCode ?? {})) if (rec.synced === false) n++
  return n
}

export function markAllSynced(s: PersistedState): PersistedState {
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

function useNetworkOnline() {
  const [online, setOnline] = React.useState(true)
  React.useEffect(
    () =>
      NetInfo.addEventListener((s) => {
        // isInternetReachable is null while unknown: trust isConnected until it is known.
        setOnline(!!s.isConnected && s.isInternetReachable !== false)
      }),
    []
  )
  return online
}

export function AppStoreProvider({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const toast = useToast()
  const [state, setState] = React.useState<PersistedState | null>(null)
  // Mirror for synchronous reads inside callbacks (scan returns a result immediately).
  const ref = React.useRef<PersistedState>(seedState())

  // Load once; corrupt or missing data falls back to the seed.
  React.useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => (raw ? { ...seedState(), ...(JSON.parse(raw) as Partial<PersistedState>) } : seedState()))
      .catch(() => seedState())
      .then((loaded) => {
        if (cancelled) return
        ref.current = loaded
        setState(loaded)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const commit = React.useCallback((next: PersistedState) => {
    ref.current = next
    setState(next)
  }, [])

  React.useEffect(() => {
    if (!state) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() =>
      toast.show("Phone storage is full. Latest changes aren't saved.", "error")
    )
  }, [state, toast])

  const networkOnline = useNetworkOnline()
  const online = networkOnline && !state?.forceOffline
  const onlineRef = React.useRef(online)
  onlineRef.current = online
  const pendingSync = React.useMemo(() => (state ? countPending(state) : 0), [state])

  // Push the offline queue once a connection is back (simulated latency).
  React.useEffect(() => {
    if (!online || pendingSync === 0) return
    const t = setTimeout(() => {
      const n = countPending(ref.current)
      commit(markAllSynced(ref.current))
      toast.show(`${n} items synced`, "success")
    }, 1500)
    return () => clearTimeout(t)
  }, [online, pendingSync, commit, toast])

  const phaseIndex = state?.phaseIndex
  const events = React.useMemo(
    () => EVENTS.map((e) => ({ ...e, phaseIndex: phaseIndex?.[e.id] ?? e.phaseIndex })),
    [phaseIndex]
  )

  const scan = React.useCallback(
    (eventId: string, rawCode: string): ScanResult => {
      const s = ref.current
      const { result, phase, record } = validateScan({
        eventId,
        rawCode,
        userId: CURRENT_USER_ID,
        phaseIndex: s.phaseIndex,
        scans: s.scans,
        online: onlineRef.current,
      })
      if (phase && record) {
        commit({
          ...s,
          scans: {
            ...s.scans,
            [eventId]: { ...s.scans[eventId], [phase]: { ...s.scans[eventId]?.[phase], [result.code]: record } },
          },
        })
      }
      return result
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
      // Re-check the gate here too: the button may be stale (double tap).
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
        status: "Open",
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

  const setForceOffline = React.useCallback((v: boolean) => commit({ ...ref.current, forceOffline: v }), [commit])

  const reset = React.useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {})
    commit(seedState())
  }, [commit])

  const value = React.useMemo<AppStore | null>(
    () =>
      state && {
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
      },
    [state, events, online, pendingSync, scan, undoScan, toggleTask, advancePhase, addReport, addReportUpdate, setForceOffline, reset]
  )

  if (!value) return <>{fallback ?? null}</>
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppStore() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider")
  return ctx
}
