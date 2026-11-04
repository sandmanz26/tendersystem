/*
 * EMI business rules as pure functions (PRD §4–§6). The store calls these; the
 * screens only read their results. A backend re-checks every one of them.
 */
import { daysBetween } from "./format"
import type {
  Closing,
  EmiEvent,
  EventLine,
  Item,
  MinStatus,
  OpnameLine,
  Ownership,
  Package,
  Rental,
  RentalKind,
  Role,
  Stage,
  WhRow,
} from "./types"

/* ---------- Stages ---------- */

/** The pipeline in stepper order. Hold statuses (Postphone, Disable) are not steps. */
export const pipeline = (stages: Stage[]) => [...stages].filter((s) => !s.hold).sort((a, b) => a.order - b.order)

export const findStage = (stages: Stage[], name: string) => stages.find((s) => s.status === name)

export const lastStage = (stages: Stage[]) => pipeline(stages).at(-1)!

/* ---------- Event status ---------- */

export type ClosingTab = "upcoming" | "on-going" | "ready-to-close" | Exclude<Closing, "on-going">

export const CLOSING_LABEL: Record<ClosingTab, string> = {
  upcoming: "Upcoming",
  "on-going": "On Going",
  "ready-to-close": "Ready to Close",
  "checking-inventory": "Checking Inventory",
  "returned-completed": "Returned & Completed",
  transferred: "Transferred",
}

export function closingTab(stored: Closing | undefined, stage: string, lineCount: number, stages: Stage[]): ClosingTab {
  if (stored && stored !== "on-going") return stored
  if (lineCount === 0) return "upcoming"
  if (stage === lastStage(stages).status) return "ready-to-close"
  return "on-going"
}

/** Last day = max(finish, start, date). After it the event can't be edited. */
export function isPast(e: EmiEvent, today: string) {
  const last = [e.finish, e.start, e.date].sort().at(-1)!
  return daysBetween(last, today) > 0
}

/** Lines can change only while on-going. From Checking Inventory on they are locked. */
export const linesLocked = (tab: ClosingTab) => tab !== "on-going" && tab !== "ready-to-close" && tab !== "upcoming"

export const canWrite = (role: Role) => role !== "Viewer"

/* ---------- Scan ---------- */

export type ScanMode = "in" | "out"

/**
 * The first scan stage of the pipeline scans in, later scan stages scan out.
 * (The web uses "first scan / second scan", which lets scan-out pass unscanned.)
 */
export function scanMode(stages: Stage[], stageName: string): ScanMode | null {
  const stage = findStage(stages, stageName)
  if (stage?.scan !== "Scan") return null
  const first = pipeline(stages).find((s) => s.scan === "Scan")
  return first?.status === stageName ? "in" : "out"
}

export const isWaiting = (line: EventLine, mode: ScanMode) => (mode === "in" ? !line.scanIn : !line.scanOut)

export type ScanPayload =
  | { kind: "line"; eventId: number; lineId: number }
  | { kind: "box"; eventId: number; packageId: number }
  | { kind: "item"; code: string }

/**
 * QR payloads proposed for EMI: `emi:line:<eventId>:<lineId>` on a line label,
 * `emi:box:<eventId>:<packageId>` on a box, `emi:item:<SKU>` on a catalog label.
 * Anything else is read as a typed SKU or item name.
 */
export function parsePayload(raw: string): ScanPayload {
  const text = raw.trim()
  const m = /^emi:(line|box|item):(.+)$/i.exec(text)
  if (m) {
    const [kind, rest] = [m[1].toLowerCase(), m[2]]
    if (kind === "item") return { kind: "item", code: rest.trim().toUpperCase() }
    const [a, b] = rest.split(":").map(Number)
    if (Number.isFinite(a) && Number.isFinite(b))
      return kind === "line" ? { kind: "line", eventId: a, lineId: b } : { kind: "box", eventId: a, packageId: b }
  }
  return { kind: "item", code: text.toUpperCase().replace(/\s+/g, " ") }
}

export type ScanResult =
  | { status: "ok"; lineIds: number[]; label: string }
  | { status: "choose"; lineIds: number[]; label: string }
  | { status: "already"; label: string }
  | { status: "not-on-event"; label: string }
  | { status: "other-event"; label: string; eventName: string }
  | { status: "unknown"; code: string }

export interface ScanContext {
  event: EmiEvent
  events: EmiEvent[]
  lines: EventLine[]
  packages: Package[]
  items: Item[]
  mode: ScanMode
}

/** What one scan means. The first failing check wins; nothing is stored here. */
export function resolveScan(raw: string, c: ScanContext): ScanResult {
  const p = parsePayload(raw)
  if (p.kind === "line" || p.kind === "box") {
    if (p.eventId !== c.event.id) {
      const other = c.events.find((e) => e.id === p.eventId)
      return other ? { status: "other-event", label: raw.trim(), eventName: other.name } : { status: "unknown", code: raw.trim() }
    }
    if (p.kind === "line") {
      const line = c.lines.find((l) => l.id === p.lineId)
      if (!line) return { status: "not-on-event", label: `Line ${p.lineId}` }
      return isWaiting(line, c.mode) ? { status: "ok", lineIds: [line.id], label: line.name } : { status: "already", label: line.name }
    }
    const box = c.packages.find((b) => b.id === p.packageId)
    if (!box) return { status: "not-on-event", label: `Box ${p.packageId}` }
    const inside = c.lines.filter((l) => box.itemIds.includes(l.id))
    const waiting = inside.filter((l) => isWaiting(l, c.mode))
    return waiting.length ? { status: "ok", lineIds: waiting.map((l) => l.id), label: box.name } : { status: "already", label: box.name }
  }
  const item = c.items.find((i) => i.sku === p.code || i.name.toUpperCase() === p.code)
  if (!item) return { status: "unknown", code: raw.trim() }
  // A line inside a box is checked in with the box, not on its own.
  const candidates = c.lines.filter((l) => l.name === item.name && l.groupId === null)
  if (!candidates.length) {
    const boxed = c.lines.some((l) => l.name === item.name)
    return { status: "not-on-event", label: boxed ? `${item.name} is in a box. Scan the box.` : item.name }
  }
  const waiting = candidates.filter((l) => isWaiting(l, c.mode))
  if (!waiting.length) return { status: "already", label: item.name }
  // Same item on several areas: the crew picks, never auto-pick.
  if (waiting.length > 1) return { status: "choose", lineIds: waiting.map((l) => l.id), label: item.name }
  return { status: "ok", lineIds: [waiting[0].id], label: item.name }
}

export function applyScan(lines: EventLine[], ids: number[], mode: ScanMode, at: string) {
  return lines.map((l) => (ids.includes(l.id) ? { ...l, [mode === "in" ? "scanIn" : "scanOut"]: at } : l))
}

export function undoScan(lines: EventLine[], ids: number[], mode: ScanMode) {
  return lines.map((l) => (ids.includes(l.id) ? { ...l, [mode === "in" ? "scanIn" : "scanOut"]: null } : l))
}

/* ---------- Next stage ---------- */

export type AdvanceStep = "ownership" | "broken" | "confirm"

export interface AdvancePlan {
  target?: Stage
  block?: string
  steps: AdvanceStep[]
  /** Lines whose stock goes back to the warehouse on this move. */
  returning: number
  broken: EventLine[]
  scanTarget: boolean
}

/** Next = exactly one step, through the same dialogs as the web, in the same order. */
export function planAdvance(stages: Stage[], current: string, lines: EventLine[], ownershipAsked: boolean): AdvancePlan {
  const steps = pipeline(stages)
  const i = steps.findIndex((s) => s.status === current)
  const empty: AdvancePlan = { steps: [], returning: 0, broken: [], scanTarget: false }
  const target = steps[i + 1]
  if (!target) return { ...empty, block: "This is the last stage. Close the event to start checking." }
  const mode = scanMode(stages, current)
  if (mode) {
    const n = lines.filter((l) => isWaiting(l, mode)).length
    if (n) return { ...empty, target, block: `${n} item${n === 1 ? "" : "s"} still need${n === 1 ? "s" : ""} to be scanned before moving to the next stage.` }
  }
  const broken = lines.filter((l) => (l.brokenQty ?? 0) > 0)
  const flow: AdvanceStep[] = []
  if (steps[i].checkOwnership && !ownershipAsked) flow.push("ownership")
  if (broken.length) flow.push("broken")
  flow.push("confirm")
  const returning = target.stockReturn ? lines.filter((l) => l.warehouseItem && !l.stockReturned).length : 0
  return { target, steps: flow, returning, broken, scanTarget: target.scan === "Scan" }
}

/** Write off broken units and return stock when a stock-return stage is crossed. */
export function applyAdvance(lines: EventLine[], target: Stage) {
  return lines.map((l) => {
    let next = l
    if ((l.brokenQty ?? 0) > 0) {
      const b = l.brokenQty!
      next = { ...next, qty: Math.max(0, l.qty - b), brokenWrittenOff: (l.brokenWrittenOff ?? 0) + b, brokenQty: 0 }
    }
    if (target.stockReturn && l.warehouseItem && !l.stockReturned) next = { ...next, stockReturned: true }
    return next
  })
}

export const OWNERSHIPS: Ownership[] = ["IHC", "IHP", "Outsource"]

/** Modify Item: location always; qty only for lines added at the current stage. */
export const canEditQty = (line: EventLine, current: string) => line.stage === current

/* ---------- Closing ---------- */

export const isResolved = (l: EventLine) => l.resolution === "returned"

/** Finalize once every line is returned (transferred lines have left the event). */
export const finalClosing = (lines: EventLine[], transferredCount: number): Closing =>
  lines.some(isResolved) ? "returned-completed" : transferredCount > 0 ? "transferred" : "returned-completed"

/* ---------- Rent / Outsource ---------- */

export const KIND_TEXT: Record<RentalKind, { name: string; tab: string; received: string; done: string; markReceived: string; markDone: string; from: string; until: string }> = {
  loan: { name: "Rent", tab: "Rented", received: "Rented", done: "Returned", markReceived: "Mark Received", markDone: "Mark Returned", from: "Rent from", until: "Return by" },
  outsource: { name: "Outsource", tab: "Outsourced", received: "Received", done: "Completed", markReceived: "Mark Received", markDone: "Mark Completed", from: "Needed from", until: "Until" },
}

export type RentalDisplay = "Requested" | "Received" | "Done" | "Overdue"

export function rentalDisplay(r: Rental, today: string): RentalDisplay {
  if (r.status === "Returned") return "Done"
  if (r.status === "Borrowed") return daysBetween(r.dueDate, today) > 0 ? "Overdue" : "Received"
  return "Requested"
}

export function rentalLabel(r: Rental, today: string) {
  const d = rentalDisplay(r, today)
  const t = KIND_TEXT[r.kind]
  return d === "Received" ? t.received : d === "Done" ? t.done : d
}

/** Received ⇒ a line on the event. Never a stock movement. */
export function lineFromRental(r: Rental, id: number, stage: string): EventLine {
  return {
    id,
    name: r.itemName,
    qty: r.qty,
    area: r.area || "UNASSIGNED",
    subArea: r.subArea ?? "",
    stage,
    pic: "",
    ownership: "Outsource",
    warehouseItem: false,
    groupId: null,
    checked: false,
    scanIn: null,
    scanOut: null,
    note: r.note,
    fromLoan: r.kind === "loan" || undefined,
    fromOutsource: r.kind === "outsource" || undefined,
    loanVendor: r.vendorName,
  }
}

/* ---------- Stock ---------- */

/** min 0 → Not Set; stock ≤ min → Critical; stock ≤ 1.5·min → Warning; else Safe. */
export function minStatus(stock: number, min: number): MinStatus {
  if (!min) return "Not Set"
  if (stock <= min) return "Critical"
  if (stock <= 1.5 * min) return "Warning"
  return "Safe"
}

export type StockStatus = "Out of Stock" | "Low Stock" | "Available"

export function itemStock(rows: WhRow[], name: string) {
  const mine = rows.filter((r) => r.name === name).sort((a, b) => b.itemStock - a.itemStock)
  const total = mine.reduce((n, r) => n + r.itemStock, 0)
  const min = mine.reduce((n, r) => n + r.stokMin, 0)
  const status: StockStatus = total === 0 ? "Out of Stock" : (min > 0 ? total <= min : total <= 10) ? "Low Stock" : "Available"
  return { rows: mine, total, status }
}

export const location = (r: WhRow) =>
  [r.asile && `Aisle ${r.asile}`, r.rack && `Rack ${r.rack}`, r.level && `Lv ${r.level}`].filter(Boolean).join(" · ")

/* ---------- Stock opname ---------- */

export interface OpnameCount {
  actual: number
  condition: "Good" | "Poor"
  note: string
}

/** Submitted lines = rows whose count differs, or that are marked Poor. */
export function opnameLines(rows: WhRow[], counts: Record<number, OpnameCount>): OpnameLine[] {
  return rows.flatMap((r) => {
    const c = counts[r.id] ?? { actual: r.itemStock, condition: "Good", note: "" }
    const diff = c.actual - r.itemStock
    if (diff === 0 && c.condition === "Good") return []
    return [{ rowId: r.id, name: r.name, before: r.itemStock, after: c.actual, diff, condition: c.condition, note: c.condition === "Poor" ? c.note : "", valuation: r.valuation }]
  })
}
