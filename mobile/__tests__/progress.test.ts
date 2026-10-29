import { EVENTS } from "../src/core/mock"
import { PHASES } from "../src/core/phases"
import { getEventProgress, isClosed } from "../src/core/progress"
import type { Report } from "../src/core/types"
import { getWhereabouts } from "../src/core/whereabouts"
import { countPending, markAllSynced, seedState } from "../src/store"

const seed = seedState()
const nadia = { ...EVENTS[0], phaseIndex: 1 }

describe("phase progress", () => {
  it("counts scanned and pending items for the current phase", () => {
    const p = getEventProgress(nadia, seed)!
    expect(p.phase.key).toBe("arrive")
    expect(p.scanned).toBe(9)
    expect(p.pending).toHaveLength(nadia.assetCodes.length - 9)
    expect(p.complete).toBe(false)
  })

  it("lets a damage report stand in for a scan", () => {
    const code = getEventProgress(nadia, seed)!.pending[0]
    const report = { eventId: nadia.id, kind: "damage", phase: "arrive", assetCode: code } as Report
    const p = getEventProgress(nadia, { ...seed, reports: [report] })!
    expect(p.reported).toBe(1)
    expect(p.byAsset[code].state).toBe("reported")
    expect(p.pending).not.toContain(code)
  })

  it("gates a checklist phase on every task", () => {
    const setup = { ...nadia, phaseIndex: 2 }
    const tasks = PHASES[2].tasks!
    expect(getEventProgress(setup, seed)!.complete).toBe(false)
    expect(getEventProgress(setup, { ...seed, tasks: { [nadia.id]: { setup: tasks } } })!.complete).toBe(true)
  })

  it("returns null once the event is closed", () => {
    const closed = { ...nadia, phaseIndex: PHASES.length }
    expect(isClosed(closed)).toBe(true)
    expect(getEventProgress(closed, seed)).toBeNull()
  })
})

describe("whereabouts", () => {
  it("is at the event between load-out and return", () => {
    const w = getWhereabouts("KRS-TFG-01", EVENTS, seed.scans)
    expect(w.at === "event" && w.event.id).toBe("ev-nadia-raka")
  })

  it("is back in the warehouse after return", () => {
    expect(getWhereabouts("DKR-GBG-01", EVENTS, seed.scans).at).toBe("warehouse")
  })
})

describe("offline queue", () => {
  it("counts unsynced scans and reports, then clears them", () => {
    const s = seedState()
    s.scans = { ...s.scans, x: { load_out: { "A-1": { at: "", by: "p01", synced: false } } } }
    s.reports = [{ ...s.reports[0], synced: false }, ...s.reports.slice(1)]
    expect(countPending(s)).toBe(2)
    expect(countPending(markAllSynced(s))).toBe(0)
  })
})
