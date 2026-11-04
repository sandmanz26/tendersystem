/*
 * EMI domain model, field names as in the web app (PRD-TECHNICAL-SYSTEM-SCHEMA §3).
 * Items are joined by name, events by eventKey, exactly like the web today.
 */

export type Role = "Admin" | "Staff" | "Viewer"

export interface User {
  id: number
  name: string
  email: string
  password: string
  role: Role
  status: "active" | "inactive"
}

/** One step of the configurable event pipeline (Master Data → Event Status). */
export interface Stage {
  id: number
  order: number
  code: string
  status: string
  scan: "None" | "Scan"
  cuttingStock: boolean
  stockReturn: boolean
  productionItem: boolean
  checkOwnership: boolean
  allowDelete: boolean
  loanItem: boolean
  outsourceItem: boolean
  /** Postphone / Disable: a hold status, not a pipeline step (owner decision pending; see docs). */
  hold?: boolean
}

export interface Item {
  id: number
  name: string
  sku: string
  category: string
  unit: string
  itemValue: number
  homeWarehouse: string
}

export interface Warehouse {
  id: number
  name: string
  location: string
  pic: string
}

export type MinStatus = "Not Set" | "Safe" | "Warning" | "Critical"

/** Stock of one item in one warehouse. THE stock source. */
export interface WhRow {
  id: number
  name: string
  warehouseName: string
  itemStock: number
  stokMin: number
  valuation: number
  asile: string | number
  rack: string | number
  level: string | number
}

export interface Movement {
  id: number
  at: string // ISO
  itemName: string
  warehouse: string
  change: number
  before: number
  after: number
  reason: string
  note?: string
  by: string
}

export interface EmiEvent {
  id: number
  name: string
  code: string
  desc?: string
  start: string // ISO date
  finish: string
  /** Event date = load-in / preparation day. */
  date: string
  location: string
  address?: string
  pic: string
}

export type Ownership = "IHC" | "IHP" | "Outsource"

export interface EventLine {
  id: number
  name: string
  qty: number
  area: string
  subArea: string
  /** Stage at which the line was added. */
  stage: string
  pic: string
  ownership: Ownership
  warehouseItem: boolean
  warehouse?: string
  groupId: number | null
  checked: boolean
  scanIn: string | null // ISO
  scanOut: string | null
  note: string
  brokenQty?: number
  brokenNote?: string
  brokenReportedBy?: string
  brokenReportedAt?: string
  brokenPhotos?: string[]
  brokenWrittenOff?: number
  stockReturned?: boolean
  resolution?: "returned"
  fromLoan?: boolean
  fromOutsource?: boolean
  fromProduction?: boolean
  fromConvert?: boolean
  loanVendor?: string
}

/** A box: one QR on the box checks in every line inside. */
export interface Package {
  id: number
  name: string
  itemIds: number[]
}

/** Stored values; the label depends on the kind (Rent: Rented / Returned, Outsource: Received / Completed). */
export type RentalStatus = "Requested" | "Borrowed" | "Returned"
export type RentalKind = "loan" | "outsource"

export interface Rental {
  id: number
  kind: RentalKind
  /** Event record; absent for a rental kept in a warehouse. */
  eventKey?: string
  itemName: string
  qty: number
  unit: string
  area?: string
  subArea?: string
  warehouse?: string
  purpose?: string
  vendorName: string
  startDate: string
  dueDate: string
  /** Per unit, for the whole period. */
  rentalCost: number
  status: RentalStatus
  borrowedAt: string | null
  returnedAt: string | null
  note: string
}

export type Closing = "on-going" | "checking-inventory" | "returned-completed" | "transferred"

export interface OpnameLine {
  rowId: number
  name: string
  before: number
  after: number
  diff: number
  condition: "Good" | "Poor"
  note: string
  valuation: number
}

export interface Opname {
  id: number
  appliedAt: string
  appliedBy: string
  warehouse: string
  countedCount: number
  status: "Pending" | "Approved" | "Rejected"
  resolvedAt?: string
  resolvedBy?: string
  items: OpnameLine[]
}

/** Something done offline, waiting to be sent. */
export interface OutboxEntry {
  id: string
  at: string
  kind: "scan" | "broken" | "stage" | "rental" | "opname" | "line" | "closing"
  label: string
}
