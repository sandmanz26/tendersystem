import { fmtNum, formatIDR, fmtDate, fmtRange } from "../src/core/format"
import {
  applyAdvance,
  closingTab,
  minStatus,
  opnameLines,
  parsePayload,
  planAdvance,
  rentalDisplay,
  resolveScan,
  scanMode,
  type ScanContext,
} from "../src/core/rules"
import { EVENTS, ITEMS, LINES, PACKAGES, RENTALS, ROWS, STAGES, TODAY, keyOf } from "../src/core/seed"
import type { EventLine } from "../src/core/types"

const kilau = EVENTS.find((e) => e.code === "PPK")!
const K = keyOf(kilau)
const ctx = (lines: EventLine[] = LINES[K], mode: "in" | "out" = "in"): ScanContext => ({
  event: kilau,
  events: EVENTS,
  lines,
  packages: PACKAGES[K],
  items: ITEMS,
  mode,
})

describe("format (id-ID)", () => {
  it("uses dot thousands and comma decimals", () => {
    expect(fmtNum(12500)).toBe("12.500")
    expect(fmtNum(78.5)).toBe("78,5")
    expect(formatIDR(1443680000)).toBe("Rp1.443.680.000")
  })
  it("formats dates like the web", () => {
    expect(fmtDate("2026-04-09")).toBe("09 Apr 2026")
    expect(fmtRange("2026-04-04", "2026-04-06")).toBe("04–06 Apr 2026")
  })
})

describe("stages", () => {
  it("scans in at the first scan stage and out at the later one", () => {
    expect(scanMode(STAGES, "Waiting scan in")).toBe("in")
    expect(scanMode(STAGES, "Waiting scan out")).toBe("out")
    expect(scanMode(STAGES, "Event running")).toBeNull()
  })
  it("keeps Postphone/Disable out of the pipeline, so Finished is the last stage", () => {
    expect(closingTab(undefined, "Finished", 3, STAGES)).toBe("ready-to-close")
    expect(closingTab(undefined, "Event running", 3, STAGES)).toBe("on-going")
    expect(closingTab(undefined, "Event running", 0, STAGES)).toBe("upcoming")
    expect(closingTab("transferred", "Finished", 3, STAGES)).toBe("transferred")
  })
})

describe("scan", () => {
  it("parses line, box and item payloads", () => {
    expect(parsePayload("emi:line:98:2")).toEqual({ kind: "line", eventId: 98, lineId: 2 })
    expect(parsePayload("EMI:BOX:98:1")).toEqual({ kind: "box", eventId: 98, packageId: 1 })
    expect(parsePayload(" sps-025 ")).toEqual({ kind: "item", code: "SPS-025" })
  })
  it("accepts a waiting line and refuses an already scanned one", () => {
    expect(resolveScan("emi:line:98:2", ctx())).toMatchObject({ status: "ok", lineIds: [2] })
    expect(resolveScan("emi:line:98:1", ctx()).status).toBe("already")
  })
  it("checks in every line of a box with one scan", () => {
    expect(resolveScan("emi:box:98:1", ctx())).toMatchObject({ status: "ok", lineIds: [4, 5, 6] })
  })
  it("sends a boxed item back to its box", () => {
    expect(resolveScan("GVC-060", ctx())).toMatchObject({ status: "not-on-event", label: expect.stringContaining("Scan the box") })
  })
  it("names the event a label belongs to", () => {
    expect(resolveScan("emi:line:97:1", ctx())).toMatchObject({ status: "other-event", eventName: "Engagement Rina & Bayu" })
  })
  it("asks which line when the item is on several areas", () => {
    const lines = [...LINES[K], { ...LINES[K][1], id: 99, area: "ENTRANCE" }]
    expect(resolveScan("SPS-025", ctx(lines))).toMatchObject({ status: "choose", lineIds: [2, 99] })
  })
  it("rejects unknown codes and items not on the event", () => {
    expect(resolveScan("ZZZ-999", ctx()).status).toBe("unknown")
    expect(resolveScan("WTC-053", ctx()).status).toBe("not-on-event")
  })
})

describe("next stage", () => {
  it("is blocked while lines wait for a scan", () => {
    expect(planAdvance(STAGES, "Waiting scan in", LINES[K], false).block).toMatch(/still need to be scanned/)
  })
  it("asks ownership, then warns about broken items, then confirms", () => {
    const rina = LINES[keyOf(EVENTS.find((e) => e.code === "ERB")!)]
    expect(planAdvance(STAGES, "Finish setup", rina, false).steps).toEqual(["ownership", "broken", "confirm"])
    expect(planAdvance(STAGES, "Finish setup", rina, true).steps).toEqual(["broken", "confirm"])
  })
  it("writes off broken units on the move", () => {
    const line = { ...LINES[K][6] } // 3 rolls, 1 broken
    const [after] = applyAdvance([line], STAGES[4])
    expect(after).toMatchObject({ qty: 2, brokenQty: 0, brokenWrittenOff: 1 })
  })
  it("stops at the last stage", () => {
    expect(planAdvance(STAGES, "Finished", [], true).block).toMatch(/last stage/)
  })
})

describe("stock and rentals", () => {
  it("derives min status", () => {
    expect(minStatus(5, 0)).toBe("Not Set")
    expect(minStatus(2, 2)).toBe("Critical")
    expect(minStatus(3, 2)).toBe("Warning")
    expect(minStatus(10, 2)).toBe("Safe")
  })
  it("marks a borrowed rental past its due date as overdue", () => {
    const projector = RENTALS.find((r) => r.itemName.startsWith("Projector"))!
    expect(TODAY > projector.dueDate).toBe(true)
    expect(rentalDisplay(projector, TODAY)).toBe("Overdue")
  })
  it("reports only rows that differ or are Poor", () => {
    const rows = ROWS.slice(0, 3)
    const lines = opnameLines(rows, { [rows[0].id]: { actual: rows[0].itemStock - 2, condition: "Good", note: "" }, [rows[1].id]: { actual: rows[1].itemStock, condition: "Poor", note: "faded" } })
    expect(lines.map((l) => l.diff)).toEqual([-2, 0])
    expect(lines[1].note).toBe("faded")
  })
})
