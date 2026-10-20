export type PhaseKey = "load_out" | "arrive" | "setup" | "show" | "load_in" | "return"

export interface Phase {
  key: PhaseKey
  label: string
  short: string
  requiresScan: boolean
  hint: string
  /** Checklist that must be ticked before a non-scan phase can close. */
  tasks?: string[]
  /** Phase closes only with a signed handover from this party. */
  handover?: { party: string; hint: string }
}

export type AssetCategory =
  | "Furniture"
  | "Dekorasi"
  | "Lighting"
  | "Sound"
  | "Linen"
  | "Tableware"
  | "Bunga & Props"

export type AssetCondition = "Baik" | "Perlu cek" | "Rusak"

export interface Asset {
  /** Printed on the QR label, e.g. KRS-TFG-01 */
  code: string
  name: string
  category: AssetCategory
  /** What one scan represents, e.g. "1 palet · 40 kursi" */
  unit: string
  location: string
  condition: AssetCondition
  dimensions?: string
  lastChecked: string
  notes?: string
}

export interface Person {
  id: string
  name: string
  role: string
  phone: string
  company?: string
}

export interface CrewAssignment {
  personId: string
  duty: string
  lead?: boolean
}

export interface RundownItem {
  time: string
  label: string
  crewNote?: string
}

export interface WeddingEvent {
  id: string
  couple: string
  kind: string
  date: string // yyyy-mm-dd
  callTime: string
  startTime: string
  endTime: string
  guests: number
  theme: string
  venue: {
    name: string
    address: string
    area: string
    loadingNote: string
    pic: { name: string; phone: string }
  }
  client: { name: string; relation: string; phone: string }
  notes: string[]
  assetCodes: string[]
  crew: CrewAssignment[]
  rundown: RundownItem[]
  /** Index into PHASES. PHASES.length means the event is fully closed. */
  phaseIndex: number
}

export interface ScanRecord {
  at: string // ISO
  by: string // personId
  /** false while the device is offline; flips once the queue is pushed. */
  synced?: boolean
  /** Scanned here although it never got a scan in the previous scan phase. */
  skippedPrevious?: boolean
}

/** scans[eventId][phaseKey][assetCode] */
export type ScanBook = Record<string, Partial<Record<PhaseKey, Record<string, ScanRecord>>>>

export type ReportKind = "issue" | "damage"
export type ReportStatus = "Terbuka" | "Diproses" | "Selesai"
export type Severity = "Rendah" | "Sedang" | "Tinggi"

export interface ReportUpdate {
  at: string
  by: string
  text: string
}

export interface Report {
  id: string
  eventId: string
  kind: ReportKind
  /** Issue category, or damage type (Rusak ringan / Rusak berat / Hilang) */
  category: string
  assetCode?: string
  /** Phase the report was filed in; a damage report clears that asset for the phase gate. */
  phase: PhaseKey
  severity: Severity
  title: string
  description: string
  photos: string[]
  status: ReportStatus
  createdAt: string
  by: string
  updates: ReportUpdate[]
  synced?: boolean
}

export interface Handover {
  name: string
  party: string
  /** PNG data URL of the drawn signature */
  signature: string
  note?: string
}

export interface PhaseLogEntry {
  phase: PhaseKey
  at: string
  by: string
  handover?: Handover
}
