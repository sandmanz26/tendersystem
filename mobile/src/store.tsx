import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import * as React from "react"

import {
  applyAdvance,
  applyScan,
  canWrite,
  finalClosing,
  findStage,
  lineFromRental,
  pipeline,
  planAdvance,
  resolveScan,
  scanMode,
  undoScan as undoScanLines,
  type ScanResult,
} from "./core/rules"
import { CLOSING, EVENTS, ITEMS, LINES, OPNAMES, PACKAGES, PROGRESS, RENTALS, ROWS, STAGES, TODAY, USERS, keyOf } from "./core/seed"
import type { Closing, EmiEvent, EventLine, Movement, Opname, OpnameLine, OutboxEntry, Ownership, Package, Rental, Stage, User, WhRow } from "./core/types"
import { useToast } from "./ui/toast"

const STORAGE_KEY = "emi:mobile:v1"

export interface PersistedState {
  session: number | null
  progress: Record<string, string>
  closing: Record<string, Closing>
  lines: Record<string, EventLine[]>
  packages: Record<string, Package[]>
  /** Stages whose ownership question was answered, per event. */
  ownershipAsked: Record<string, string[]>
  /** Set once a stock-return stage is crossed: no more items can be added. */
  addLocked: Record<string, boolean>
  transferredOut: Record<string, number>
  rentals: Rental[]
  rows: WhRow[]
  movements: Movement[]
  opnames: Opname[]
  outbox: OutboxEntry[]
  forceOffline: boolean
  lastSyncAt: string
}

export function seedState(): PersistedState {
  return {
    session: null,
    progress: PROGRESS,
    closing: CLOSING,
    lines: LINES,
    packages: PACKAGES,
    ownershipAsked: {},
    addLocked: {},
    transferredOut: {},
    rentals: RENTALS,
    rows: ROWS,
    movements: [],
    opnames: OPNAMES,
    outbox: [],
    forceOffline: false,
    lastSyncAt: new Date().toISOString(),
  }
}

export interface BrokenInput {
  qty: number
  note: string
  photos: string[]
}

interface AppStore extends PersistedState {
  user: User | null
  stages: Stage[]
  events: EmiEvent[]
  today: string
  online: boolean
  writable: boolean
  stageOf: (key: string) => string
  login: (email: string, password: string) => string | null
  logout: () => void
  scan: (key: string, raw: string) => ScanResult
  scanLines: (key: string, ids: number[]) => void
  undoScan: (key: string, ids: number[]) => void
  setOwnership: (key: string, changes: Record<number, Ownership>) => void
  markOwnershipAsked: (key: string) => void
  advance: (key: string) => boolean
  reportBroken: (key: string, lineId: number, input: BrokenInput) => void
  clearBroken: (key: string, lineId: number) => void
  modifyLine: (key: string, lineId: number, patch: { area: string; subArea: string; qty?: number }) => void
  deleteLine: (key: string, lineId: number) => void
  receiveRental: (id: number) => void
  returnRental: (id: number) => void
  startChecking: (key: string) => void
  toggleChecked: (key: string, lineId: number) => void
  returnLine: (key: string, lineId: number) => void
  transferLine: (key: string, lineId: number, targetKey: string, stage: string) => void
  finalize: (key: string) => Closing | null
  submitOpname: (warehouse: string, lines: OpnameLine[], counted: number) => Opname | null
  resolveOpname: (id: number, approve: boolean) => void
  setForceOffline: (v: boolean) => void
  reset: () => void
}

const Ctx = React.createContext<AppStore | null>(null)

const nowISO = () => new Date().toISOString()

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
  // Mirror for synchronous reads inside callbacks (scan returns its result immediately).
  const ref = React.useRef<PersistedState>(seedState())

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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => toast.show("Phone storage is full. Latest changes aren't saved.", "error"))
  }, [state, toast])

  const networkOnline = useNetworkOnline()
  const online = networkOnline && !state?.forceOffline
  const onlineRef = React.useRef(online)
  onlineRef.current = online
  const outboxSize = state?.outbox.length ?? 0

  // Replay the outbox once a connection is back (simulated latency; the server re-validates).
  React.useEffect(() => {
    if (!online || outboxSize === 0) return
    const t = setTimeout(() => {
      const n = ref.current.outbox.length
      commit({ ...ref.current, outbox: [], lastSyncAt: nowISO() })
      toast.show(`${n} change${n === 1 ? "" : "s"} sent`, "success")
    }, 1500)
    return () => clearTimeout(t)
  }, [online, outboxSize, commit, toast])

  const user = USERS.find((u) => u.id === state?.session) ?? null
  const writable = !!user && canWrite(user.role)

  /** Every write goes through here: role check, then the offline queue. */
  const write = React.useCallback(
    (kind: OutboxEntry["kind"], label: string, fn: (s: PersistedState) => PersistedState | null) => {
      const s = ref.current
      const u = USERS.find((x) => x.id === s.session)
      if (!u || !canWrite(u.role)) {
        toast.show("View only. Ask an admin for access.", "error")
        return false
      }
      const next = fn(s)
      if (!next) return false
      const outbox = onlineRef.current ? next.outbox : [...next.outbox, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: nowISO(), kind, label }]
      commit({ ...next, outbox })
      return true
    },
    [commit, toast]
  )

  const stageOf = React.useCallback((key: string) => ref.current.progress[key] ?? pipeline(STAGES)[0].status, [])
  const userName = () => USERS.find((x) => x.id === ref.current.session)?.name ?? ""
  const eventByKey = (key: string) => EVENTS.find((e) => keyOf(e) === key)!

  const setLines = (s: PersistedState, key: string, fn: (l: EventLine[]) => EventLine[]): PersistedState => ({
    ...s,
    lines: { ...s.lines, [key]: fn(s.lines[key] ?? []) },
  })

  /** Applies a stock change to one row and writes the ledger entry. Never below 0. */
  const moveStock = (s: PersistedState, rowId: number, after: number, reason: string, note?: string): PersistedState => {
    const r = s.rows.find((x) => x.id === rowId)
    if (!r) return s
    const value = Math.max(0, after)
    const m: Movement = {
      id: (s.movements[0]?.id ?? 0) + 1,
      at: nowISO(),
      itemName: r.name,
      warehouse: r.warehouseName,
      change: value - r.itemStock,
      before: r.itemStock,
      after: value,
      reason,
      note,
      by: userName(),
    }
    return { ...s, rows: s.rows.map((x) => (x.id === rowId ? { ...x, itemStock: value } : x)), movements: [m, ...s.movements] }
  }

  const api = React.useMemo(() => {
    const login = (email: string, password: string) => {
      const u = USERS.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
      if (!u || u.password !== password) return "Wrong email or password."
      if (u.status !== "active") return "This account has been deactivated. Contact your admin."
      commit({ ...ref.current, session: u.id })
      return null
    }
    const logout = () => commit({ ...ref.current, session: null })

    const scan = (key: string, raw: string): ScanResult => {
      const s = ref.current
      const mode = scanMode(STAGES, s.progress[key] ?? "")
      const event = eventByKey(key)
      if (!mode) return { status: "not-on-event", label: "This stage doesn't need scanning" }
      const result = resolveScan(raw, { event, events: EVENTS, lines: s.lines[key] ?? [], packages: s.packages[key] ?? [], items: ITEMS, mode })
      if (result.status === "ok") write("scan", `${mode === "in" ? "Scan in" : "Scan out"} ${result.label}`, (x) => setLines(x, key, (l) => applyScan(l, result.lineIds, mode, nowISO())))
      return result
    }
    const scanLines = (key: string, ids: number[]) => {
      const mode = scanMode(STAGES, ref.current.progress[key] ?? "")
      if (mode) write("scan", "Scan", (x) => setLines(x, key, (l) => applyScan(l, ids, mode, nowISO())))
    }
    const undoScan = (key: string, ids: number[]) => {
      const mode = scanMode(STAGES, ref.current.progress[key] ?? "")
      if (mode) write("scan", "Undo scan", (x) => setLines(x, key, (l) => undoScanLines(l, ids, mode)))
    }

    const setOwnership = (key: string, changes: Record<number, Ownership>) =>
      write("line", "Change ownership", (x) => setLines(x, key, (l) => l.map((ln) => (changes[ln.id] ? { ...ln, ownership: changes[ln.id] } : ln))))
    const markOwnershipAsked = (key: string) => {
      const s = ref.current
      const stage = stageOf(key)
      commit({ ...s, ownershipAsked: { ...s.ownershipAsked, [key]: [...(s.ownershipAsked[key] ?? []), stage] } })
    }

    const advance = (key: string) =>
      write("stage", "Next stage", (s) => {
        const current = s.progress[key] ?? pipeline(STAGES)[0].status
        // Re-plan here too: the sheet may be stale (double tap, another change).
        const plan = planAdvance(STAGES, current, s.lines[key] ?? [], true)
        if (plan.block || !plan.target) return null
        const target = plan.target
        const next = setLines(s, key, (l) => applyAdvance(l, target))
        return {
          ...next,
          progress: { ...next.progress, [key]: target.status },
          addLocked: target.stockReturn ? { ...next.addLocked, [key]: true } : next.addLocked,
        }
      })

    const reportBroken = (key: string, lineId: number, input: BrokenInput) =>
      write("broken", "Broken report", (s) =>
        setLines(s, key, (l) =>
          l.map((ln) =>
            ln.id === lineId
              ? { ...ln, brokenQty: Math.min(input.qty, ln.qty), brokenNote: input.note, brokenPhotos: input.photos, brokenReportedBy: userName(), brokenReportedAt: nowISO() }
              : ln
          )
        )
      )
    const clearBroken = (key: string, lineId: number) =>
      write("broken", "Remove broken report", (s) =>
        setLines(s, key, (l) => l.map((ln) => (ln.id === lineId ? { ...ln, brokenQty: 0, brokenNote: "", brokenPhotos: [], brokenReportedBy: undefined, brokenReportedAt: undefined } : ln)))
      )
    const modifyLine = (key: string, lineId: number, patch: { area: string; subArea: string; qty?: number }) =>
      write("line", "Modify item", (s) => {
        const current = stageOf(key)
        return setLines(s, key, (l) =>
          l.map((ln) => (ln.id === lineId ? { ...ln, area: patch.area, subArea: patch.subArea, qty: patch.qty !== undefined && ln.stage === current ? Math.max(1, patch.qty) : ln.qty } : ln))
        )
      })
    const deleteLine = (key: string, lineId: number) =>
      write("line", "Delete item", (s) => {
        if (findStage(STAGES, stageOf(key))?.allowDelete === false) return null
        return setLines(s, key, (l) => l.filter((ln) => ln.id !== lineId))
      })

    const receiveRental = (id: number) =>
      write("rental", "Mark received", (s) => {
        const r = s.rentals.find((x) => x.id === id)
        if (!r || r.status !== "Requested") return null
        let next: PersistedState = { ...s, rentals: s.rentals.map((x) => (x.id === id ? { ...x, status: "Borrowed", borrowedAt: TODAY } : x)) }
        // An event record becomes a line on the event. No stock movement, ever.
        if (r.eventKey) {
          const k = r.eventKey
          next = setLines(next, k, (l) => [...l, lineFromRental(r, Math.max(0, ...l.map((x) => x.id)) + 1, s.progress[k] ?? pipeline(STAGES)[0].status)])
        }
        return next
      })
    const returnRental = (id: number) =>
      write("rental", "Mark returned", (s) => {
        const r = s.rentals.find((x) => x.id === id)
        if (!r || r.status !== "Borrowed") return null
        return { ...s, rentals: s.rentals.map((x) => (x.id === id ? { ...x, status: "Returned", returnedAt: TODAY } : x)) }
      })

    const startChecking = (key: string) => write("closing", "Close & start checking", (s) => ({ ...s, closing: { ...s.closing, [key]: "checking-inventory" } }))
    const toggleChecked = (key: string, lineId: number) =>
      write("closing", "Cross check", (s) => setLines(s, key, (l) => l.map((ln) => (ln.id === lineId ? { ...ln, checked: !ln.checked } : ln))))
    const returnLine = (key: string, lineId: number) =>
      write("closing", "Return item", (s) => setLines(s, key, (l) => l.map((ln) => (ln.id === lineId ? { ...ln, resolution: "returned" } : ln))))
    const transferLine = (key: string, lineId: number, targetKey: string, stage: string) =>
      write("closing", "Transfer item", (s) => {
        const line = (s.lines[key] ?? []).find((l) => l.id === lineId)
        if (!line) return null
        let next = setLines(s, key, (l) => l.filter((x) => x.id !== lineId))
        next = setLines(next, targetKey, (l) => [
          ...l,
          { ...line, id: Math.max(0, ...l.map((x) => x.id)) + 1, stage, checked: false, scanIn: null, scanOut: null, groupId: null, note: line.note || `Transferred from ${eventByKey(key).name}` },
        ])
        return { ...next, transferredOut: { ...next.transferredOut, [key]: (next.transferredOut[key] ?? 0) + 1 } }
      })
    const finalize = (key: string) => {
      const s = ref.current
      const lines = s.lines[key] ?? []
      if (lines.some((l) => l.resolution !== "returned")) return null
      const value = finalClosing(lines, s.transferredOut[key] ?? 0)
      return write("closing", "Finalize", (x) => ({ ...x, closing: { ...x.closing, [key]: value } })) ? value : null
    }

    const submitOpname = (warehouse: string, items: OpnameLine[], counted: number) => {
      const s = ref.current
      if (s.opnames.some((o) => o.status === "Pending")) return null
      const opname: Opname = { id: Math.max(0, ...s.opnames.map((o) => o.id)) + 1, appliedAt: nowISO(), appliedBy: userName(), warehouse, countedCount: counted, status: "Pending", items }
      return write("opname", `Stock opname ${warehouse}`, (x) => ({ ...x, opnames: [opname, ...x.opnames] })) ? opname : null
    }
    const resolveOpname = (id: number, approve: boolean) =>
      write("opname", approve ? "Approve opname" : "Reject opname", (s) => {
        if (USERS.find((u) => u.id === s.session)?.role !== "Admin") return null
        const o = s.opnames.find((x) => x.id === id)
        if (!o || o.status !== "Pending") return null
        let next: PersistedState = s
        // Approve writes each counted row; Poor alone changes nothing.
        if (approve) for (const line of o.items) next = moveStock(next, line.rowId, line.after, "Stock opname", `Opname #${o.id}`)
        return {
          ...next,
          opnames: next.opnames.map((x) => (x.id === id ? { ...x, status: approve ? "Approved" : "Rejected", resolvedAt: nowISO(), resolvedBy: userName() } : x)),
        }
      })

    const setForceOffline = (v: boolean) => commit({ ...ref.current, forceOffline: v })
    const reset = () => {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => {})
      commit({ ...seedState(), session: ref.current.session })
    }

    return {
      login,
      logout,
      scan,
      scanLines,
      undoScan,
      setOwnership,
      markOwnershipAsked,
      advance,
      reportBroken,
      clearBroken,
      modifyLine,
      deleteLine,
      receiveRental,
      returnRental,
      startChecking,
      toggleChecked,
      returnLine,
      transferLine,
      finalize,
      submitOpname,
      resolveOpname,
      setForceOffline,
      reset,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commit, write, stageOf])

  const value = React.useMemo<AppStore | null>(
    () => state && { ...state, ...api, user, stages: STAGES, events: EVENTS, today: TODAY, online, writable, stageOf },
    [state, api, user, online, writable, stageOf]
  )

  if (!value) return <>{fallback ?? null}</>
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppStore() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider")
  return ctx
}
