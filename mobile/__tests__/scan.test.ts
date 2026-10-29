import { CURRENT_USER_ID } from "../src/core/mock"
import { normaliseCode, validateScan, type ScanInput } from "../src/core/scan"
import { seedState } from "../src/store"

const seed = seedState()
const base = (over: Partial<ScanInput>): ScanInput => ({
  eventId: "ev-nadia-raka",
  rawCode: "LGT-PAR-01",
  userId: CURRENT_USER_ID,
  phaseIndex: seed.phaseIndex,
  scans: seed.scans,
  online: true,
  ...over,
})

describe("normaliseCode", () => {
  it("fixes case, spaces and underscores", () => {
    expect(normaliseCode("  lgt par_01 ")).toBe("LGT-PAR-01")
  })
})

describe("validateScan", () => {
  it("accepts a pending item on the manifest and returns the record", () => {
    const now = new Date("2026-10-29T10:00:00Z")
    const { result, phase, record } = validateScan(base({ rawCode: "lgt-par-01", now }))
    expect(result).toEqual({ status: "ok", code: "LGT-PAR-01", skippedPrevious: undefined, conditionNote: undefined })
    expect(phase).toBe("arrive")
    expect(record).toEqual({ at: now.toISOString(), by: CURRENT_USER_ID, synced: true, skippedPrevious: undefined })
  })

  it("queues the record when offline", () => {
    expect(validateScan(base({ online: false })).record?.synced).toBe(false)
  })

  it("rejects crew not assigned to the event", () => {
    expect(validateScan(base({ userId: "nobody" })).result.status).toBe("not-assigned")
  })

  it("rejects scans in a checklist phase", () => {
    const phaseIndex = { ...seed.phaseIndex, "ev-nadia-raka": 2 } // setup
    expect(validateScan(base({ phaseIndex })).result.status).toBe("not-scan-phase")
  })

  it("checks format before the manifest", () => {
    expect(validateScan(base({ rawCode: "hello" })).result.status).toBe("invalid")
    expect(validateScan(base({ rawCode: "ZZZ-ZZZ-99" })).result.status).toBe("unknown")
  })

  it("names the event a known asset belongs to", () => {
    const { result } = validateScan(base({ rawCode: "DKR-GBG-01" }))
    expect(result).toMatchObject({ status: "other-event", eventName: "Sekar & Bima" })
  })

  it("flags a duplicate with who scanned it", () => {
    const { result, record } = validateScan(base({ rawCode: "KRS-TFG-01" }))
    expect(result).toMatchObject({ status: "duplicate", by: "p03" })
    expect(record).toBeUndefined()
  })

  it("blocks loading out an item still out at another event", () => {
    const { result } = validateScan(base({ eventId: "ev-sekar-bima", rawCode: "SND-SPK-01" }))
    expect(result).toMatchObject({ status: "still-out", eventName: "Nadia & Raka" })
  })

  it("marks an item that skipped the previous checkpoint", () => {
    const scans = { ...seed.scans, "ev-nadia-raka": { ...seed.scans["ev-nadia-raka"], load_out: {} } }
    const { result, record } = validateScan(base({ scans }))
    expect(result).toMatchObject({ status: "ok", skippedPrevious: "load_out" })
    expect(record?.skippedPrevious).toBe(true)
  })
})
