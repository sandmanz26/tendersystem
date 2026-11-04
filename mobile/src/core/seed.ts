/*
 * Mock data. Stages, items, rows, warehouses, areas, vendors and rentals come
 * from the EMI web seeds (src/data/*.js, main@f59524c). Event lines for events
 * without a hand seed are illustrative fixtures written with the web's field
 * names. Rooftop Sunset Mixer is placed at "Waiting scan out" (web seed: Ready
 * to Close) so the scan-out flow can be demoed.
 */
import type { Closing, EmiEvent, EventLine, Item, Opname, Package, Rental, Stage, User, Warehouse, WhRow } from "./types"

/** The web demo's fixed "today". A backend uses server date. */
export const TODAY = "2026-04-09"

export const USERS: User[] = [
  { id: 1, name: "Dewi Anjani", email: "dewi@emi.id", password: "Admin@123", role: "Admin", status: "active" },
  { id: 2, name: "Anto", email: "anto@emi.id", password: "Staff@123", role: "Staff", status: "active" },
  { id: 3, name: "Rian", email: "rian@emi.id", password: "Viewer@123", role: "Viewer", status: "active" },
  { id: 4, name: "Budi", email: "budi@emi.id", password: "Staff@123", role: "Staff", status: "inactive" },
]

const st = (
  order: number,
  code: string,
  status: string,
  f: Partial<Omit<Stage, "id" | "order" | "code" | "status">> = {}
): Stage => ({
  id: order,
  order,
  code,
  status,
  scan: "None",
  cuttingStock: false,
  stockReturn: false,
  productionItem: false,
  checkOwnership: false,
  allowDelete: true,
  loanItem: false,
  outsourceItem: false,
  ...f,
})

export const STAGES: Stage[] = [
  st(1, "CBA", "Created by admin up", { loanItem: true, outsourceItem: true }),
  st(2, "OPI", "On preparing items", { productionItem: true, loanItem: true, outsourceItem: true }),
  st(3, "FS", "Finish setup", { productionItem: true, checkOwnership: true, loanItem: true, outsourceItem: true }),
  st(4, "WSI", "Waiting scan in", { scan: "Scan", allowDelete: false }),
  st(5, "ER", "Event running", { allowDelete: false }),
  st(6, "WSO", "Waiting scan out", { scan: "Scan", allowDelete: false }),
  st(7, "FIN", "Finished", { allowDelete: false }),
  st(8, "PP", "Postphone", { hold: true }),
  st(9, "DIS", "Disable", { hold: true }),
]

export const WAREHOUSES: Warehouse[] = [
  { id: 1, name: "Buy", location: "None", pic: "Novi" },
  { id: 2, name: "Warehouse Bali 66", location: "Bali - Bali Cliff Street No. 66", pic: "Novi" },
  { id: 4, name: "Warehouse Bali 70", location: "Bali - Bali Cliff Street No. 70", pic: "Anto/Novi" },
  { id: 5, name: "Warehouse C9", location: "C9 Bali", pic: "" },
  { id: 9, name: "Warehouse Cililitan", location: "East Jakarta", pic: "Darmian" },
  { id: 10, name: "Warehouse Surabaya", location: "Surabaya", pic: "Anto" },
]

export const SUB_AREAS: Record<string, string[]> = {
  "BRIDAL BACKDROP": ["Backdrop Stand", "Flower Arch", "Lighting Rig"],
  "BRIDAL TABLE": ["Table Linen", "Centerpiece", "Chair Cover"],
  CEREMONY: ["Aisle Runner", "Altar Setup", "Pew Flowers", "Arch"],
  "CHAMPAGNE WALL": ["Glass Holder", "Champagne Stand", "Backdrop"],
  COCKTAIL: ["Cocktail Table", "Bar Decor", "High-Top Stools"],
  ENTRANCE: ["Welcome Board", "Flower Gate", "Balloon Arch", "Signage"],
  "GUEST TABLE": ["Centerpiece", "Name Card", "Table Number", "Linen"],
  LABOUR: [],
  LOUNGE: ["Sofa Set", "Coffee Table", "Side Lamp"],
  "Area Hall": ["Main Stage", "Side Wings"],
  UNASSIGNED: [],
}
export const AREAS = Object.keys(SUB_AREAS)

const it = (id: number, name: string, sku: string, category: string, unit: string, itemValue: number, homeWarehouse: string): Item => ({
  id,
  name,
  sku,
  category,
  unit,
  itemValue,
  homeWarehouse,
})

export const ITEMS: Item[] = [
  it(1, "Artificial Flower Chrysant Giant White", "AFG-001", "Floral", "pcs", 45000, "Warehouse Bali 66"),
  it(2, "Artificial Flower Lunaria White", "AFL-002", "Floral", "pcs", 35000, "Warehouse Bali 66"),
  it(3, "Artificial Rose Pink", "ARP-003", "Floral", "pcs", 25000, "Warehouse Bali 66"),
  it(4, "Backdrop Stand 2m", "BSD-004", "Equipment", "unit", 1250000, "Warehouse C9"),
  it(5, "White Latex Balloon", "BLP-005", "Decoration", "pcs", 1500, "Warehouse Surabaya"),
  it(6, "Large Round Candle Holder", "CHB-006", "Decoration", "pcs", 85000, "Warehouse Bali 70"),
  it(7, "Cylinder-Shaped Crystal", "CBT-007", "Decoration", "pcs", 60000, "Warehouse Bali 66"),
  it(8, "Plain White Fabric 3m", "FPP-008", "Fabric", "meter", 75000, "Warehouse Cililitan"),
  it(21, "Acrylic Ball Silver 20cm", "ABS-021", "Decoration", "pcs", 55000, "Warehouse Bali 70"),
  it(25, "Spotlight Stand", "SPS-025", "Lighting", "unit", 650000, "Warehouse C9"),
  it(31, "Faux Greenery Garland 2m", "FGG-031", "Decoration", "pcs", 95000, "Warehouse Bali 70"),
  it(32, "Wireless Handheld Microphone", "WHM-032", "Equipment", "unit", 1850000, "Warehouse C9"),
  it(35, "Peony Centerpiece Pink", "PCP-035", "Floral", "pcs", 210000, "Warehouse Bali 70"),
  it(41, "Rattan Peacock Chair", "RPC-041", "Furniture", "unit", 2750000, "Warehouse Bali 70"),
  it(44, "Velvet Lounge Sofa 2-Seater", "VLS-044", "Furniture", "unit", 6500000, "Warehouse Bali 66"),
  it(50, "Velvet Backdrop Curtain 4m", "VBC-050", "Fabric", "pcs", 950000, "Warehouse Bali 66"),
  it(51, "Iron Flower Arch 60cm", "IFA-051", "Decoration", "unit", 450000, "Warehouse Bali 70"),
  it(52, "Chiffon Drape Ivory 5m", "CDI-052", "Fabric", "pcs", 180000, "Warehouse Bali 66"),
  it(53, "White Tiffany Chair", "WTC-053", "Furniture", "unit", 350000, "Warehouse Bali 66"),
  it(54, "Organza Chair Sash", "OCS-054", "Fabric", "pcs", 15000, "Warehouse Surabaya"),
  it(55, "Acrylic Welcome Sign Board", "AWS-055", "Decoration", "pcs", 750000, "Warehouse Bali 70"),
  it(56, "Tealight Holder 15cm", "THC-056", "Decoration", "pcs", 20000, "Warehouse Bali 70"),
  it(57, "String Fairy Lights 10m", "SFL-057", "Lighting", "roll", 120000, "Warehouse Bali 70"),
  it(58, "Tiffany Chair", "TFC-058", "Furniture", "unit", 350000, "Warehouse Bali 66"),
  it(59, "Round Banquet Table", "RBT-059", "Furniture", "unit", 1100000, "Warehouse Surabaya"),
  it(60, "Glass Votive Candle Holder", "GVC-060", "Decoration", "pcs", 18000, "Warehouse C9"),
]

let rowId = 100
const row = (name: string, warehouseName: string, itemStock: number, stokMin: number, loc: [string | number, string | number, string | number] = ["", "", ""]): WhRow => {
  const item = ITEMS.find((i) => i.name === name)!
  return { id: ++rowId, name, warehouseName, itemStock, stokMin, valuation: item.itemValue, asile: loc[0], rack: loc[1], level: loc[2] }
}

export const ROWS: WhRow[] = [
  row("Spotlight Stand", "Warehouse C9", 6, 8, ["A", 3, 1]),
  row("Faux Greenery Garland 2m", "Warehouse Bali 70", 3, 5),
  row("Wireless Handheld Microphone", "Warehouse C9", 0, 4, ["A", 4, 1]),
  row("Peony Centerpiece Pink", "Warehouse Bali 70", 6, 8),
  row("Rattan Peacock Chair", "Warehouse Bali 70", 4, 6),
  row("Velvet Lounge Sofa 2-Seater", "Warehouse Bali 66", 8, 10),
  row("Artificial Flower Chrysant Giant White", "Warehouse Bali 66", 342, 10, [2, 1, 2]),
  row("Artificial Flower Lunaria White", "Warehouse Bali 66", 327, 20, [1, 2, 1]),
  row("Artificial Rose Pink", "Warehouse Bali 66", 182, 15, [1, 1, 3]),
  row("Backdrop Stand 2m", "Warehouse C9", 3, 2, ["A", 1, 1]),
  row("Backdrop Stand 2m", "Warehouse Surabaya", 5, 0),
  row("White Latex Balloon", "Warehouse Surabaya", 500, 50, ["B", 2, 1]),
  row("Large Round Candle Holder", "Warehouse Bali 70", 60, 5),
  row("Cylinder-Shaped Crystal", "Warehouse Bali 66", 100, 10, [1, 3, 1]),
  row("Plain White Fabric 3m", "Warehouse Cililitan", 20, 3, ["C", 1, 2]),
  row("Acrylic Ball Silver 20cm", "Warehouse Bali 70", 170, 0, ["TBC", "TBC", "TBC"]),
  row("Velvet Backdrop Curtain 4m", "Warehouse Bali 66", 6, 2, [3, 2, 1]),
  row("Iron Flower Arch 60cm", "Warehouse Bali 70", 4, 2),
  row("Chiffon Drape Ivory 5m", "Warehouse Bali 66", 24, 6, [3, 1, 2]),
  row("White Tiffany Chair", "Warehouse Bali 66", 180, 40, [4, 1, 1]),
  row("Organza Chair Sash", "Warehouse Surabaya", 300, 50),
  row("Acrylic Welcome Sign Board", "Warehouse Bali 70", 5, 1),
  row("Tealight Holder 15cm", "Warehouse Bali 70", 220, 30),
  row("String Fairy Lights 10m", "Warehouse Bali 70", 14, 10),
  row("Tiffany Chair", "Warehouse Bali 66", 120, 40, [4, 2, 1]),
  row("Round Banquet Table", "Warehouse Surabaya", 26, 8),
  row("Glass Votive Candle Holder", "Warehouse C9", 150, 24, ["B", 1, 1]),
]

export const EVENTS: EmiEvent[] = [
  { id: 90, name: "Autumn Garden Party", code: "AGP", start: "2026-10-05", finish: "2026-10-05", date: "2026-10-01", location: "Bandung", pic: "Dewi Anjani" },
  { id: 91, name: "Rooftop Sunset Mixer", code: "RSM", start: "2026-04-09", finish: "2026-04-09", date: "2026-04-08", location: "Jakarta", address: "Jl. MH Thamrin No. 1, Rooftop Lv. 46", pic: "Anto" },
  { id: 92, name: "Harvest Festival Bazaar", code: "HFB", start: "2026-04-04", finish: "2026-04-06", date: "2026-04-03", location: "Malang", pic: "Anto" },
  { id: 93, name: "Downtown Product Launch", code: "DPL", start: "2026-05-15", finish: "2026-05-15", date: "2026-05-12", location: "Surabaya", pic: "Dewi Anjani" },
  { id: 94, name: "Beachside Anniversary", code: "BSA", start: "2026-03-20", finish: "2026-03-21", date: "2026-03-18", location: "Bali", pic: "Novi" },
  { id: 95, name: "Intimate Dinner Ubud", code: "IDU", start: "2026-04-25", finish: "2026-04-25", date: "2026-04-22", location: "Ubud, Bali", address: "Jl. Raya Sanggingan, Ubud", pic: "Novi" },
  { id: 97, name: "Engagement Rina & Bayu", code: "ERB", start: "2026-05-17", finish: "2026-05-17", date: "2026-05-15", location: "Surabaya", address: "The Westin Surabaya, Ballroom 2", pic: "Dewi Anjani" },
  { id: 98, name: "Product Photoshoot Kilau", code: "PPK", start: "2026-04-10", finish: "2026-04-10", date: "2026-04-09", location: "Denpasar", address: "Studio Kilau, Jl. Teuku Umar 88", pic: "Rian" },
]

/** `${date} | ${NAME}`: every per-event store is keyed by it. */
export const keyOf = (e: Pick<EmiEvent, "date" | "name">) => `${e.date} | ${e.name.toUpperCase()}`
const K = (id: number) => keyOf(EVENTS.find((e) => e.id === id)!)

const ln = (id: number, name: string, qty: number, area: string, stage: string, extra: Partial<EventLine> = {}): EventLine => ({
  id,
  name,
  qty,
  area,
  subArea: "",
  stage,
  pic: "",
  ownership: "IHC",
  warehouseItem: true,
  warehouse: ITEMS.find((i) => i.name === name)?.homeWarehouse,
  groupId: null,
  checked: false,
  scanIn: null,
  scanOut: null,
  note: "",
  ...extra,
})

const IN = "2026-04-08T08:20:00+08:00"
const OUT = "2026-04-09T22:41:00+08:00"

export const LINES: Record<string, EventLine[]> = {
  [K(98)]: [
    ln(1, "Backdrop Stand 2m", 2, "Area Hall", "Created by admin up", { pic: "Rian", scanIn: IN, warehouse: "Warehouse C9" }),
    ln(2, "Spotlight Stand", 2, "Area Hall", "Created by admin up", { pic: "Rian", subArea: "Main Stage" }),
    ln(3, "Velvet Backdrop Curtain 4m", 1, "Area Hall", "On preparing items", { ownership: "IHP", subArea: "Main Stage" }),
    ln(4, "Glass Votive Candle Holder", 24, "DISPLAY TABLE", "Created by admin up", { pic: "Lina", groupId: 1 }),
    ln(5, "Cylinder-Shaped Crystal", 12, "DISPLAY TABLE", "Created by admin up", { pic: "Lina", groupId: 1 }),
    ln(6, "Artificial Rose Pink", 40, "DISPLAY TABLE", "On preparing items", { pic: "Lina", groupId: 1 }),
    ln(7, "String Fairy Lights 10m", 3, "Area Hall", "On preparing items", { subArea: "Side Wings", brokenQty: 1, brokenNote: "One roll has a dead section", brokenReportedBy: "Anto", brokenReportedAt: "2026-04-08T15:10:00+08:00" }),
    ln(8, "Wireless Handheld Microphone", 2, "Area Hall", "Finish setup", { ownership: "Outsource", warehouseItem: false, fromLoan: true, loanVendor: "Nusantara Sound & Light" }),
  ],
  [K(97)]: [
    ln(1, "Iron Flower Arch 60cm", 1, "CEREMONY", "Created by admin up", { subArea: "Arch", pic: "Anto" }),
    ln(2, "Artificial Rose Pink", 60, "CEREMONY", "Created by admin up", { subArea: "Arch", pic: "Dewi" }),
    ln(3, "Chiffon Drape Ivory 5m", 4, "CEREMONY", "Created by admin up", { subArea: "Altar Setup", pic: "Anto" }),
    ln(4, "White Tiffany Chair", 30, "GUEST TABLE", "On preparing items", { pic: "Darmian", brokenQty: 3, brokenNote: "3 legs cracked during loading", brokenReportedBy: "Anto", brokenReportedAt: "2026-04-09T10:05:00+08:00" }),
    ln(5, "Organza Chair Sash", 30, "GUEST TABLE", "On preparing items", { ownership: "Outsource" }),
    ln(6, "Acrylic Welcome Sign Board", 1, "ENTRANCE", "On preparing items", { note: "Names: Rina & Bayu, gold print." }),
    ln(7, "Tealight Holder 15cm", 24, "GUEST TABLE", "Finish setup", { pic: "Novi" }),
    ln(8, "String Fairy Lights 10m", 3, "ENTRANCE", "Finish setup", { pic: "Hendra" }),
    ln(9, "Floral Arch Installation", 1, "CEREMONY", "Finish setup", { ownership: "Outsource", warehouseItem: false, warehouse: undefined, fromOutsource: true, loanVendor: "Bali Florist Collective" }),
  ],
  [K(95)]: [
    ln(1, "Round Banquet Table", 6, "GUEST TABLE", "Created by admin up", { pic: "Agus" }),
    ln(2, "Tiffany Chair", 40, "GUEST TABLE", "On preparing items", { pic: "Anto" }),
    ln(3, "Peony Centerpiece Pink", 6, "GUEST TABLE", "On preparing items", { subArea: "Centerpiece" }),
    ln(4, "Large Round Candle Holder", 12, "GUEST TABLE", "On preparing items", { subArea: "Centerpiece" }),
    ln(5, "Plain White Fabric 3m", 8, "BRIDAL TABLE", "On preparing items", { subArea: "Table Linen" }),
  ],
  [K(91)]: [
    ln(1, "Velvet Lounge Sofa 2-Seater", 4, "LOUNGE", "Created by admin up", { subArea: "Sofa Set", scanIn: IN, scanOut: OUT }),
    ln(2, "Rattan Peacock Chair", 2, "LOUNGE", "Created by admin up", { scanIn: IN, scanOut: OUT }),
    ln(3, "Faux Greenery Garland 2m", 3, "COCKTAIL", "Created by admin up", { subArea: "Bar Decor", scanIn: IN, scanOut: OUT }),
    ln(4, "Large Round Candle Holder", 16, "COCKTAIL", "On preparing items", { subArea: "Cocktail Table", scanIn: IN }),
    ln(5, "Acrylic Ball Silver 20cm", 30, "COCKTAIL", "On preparing items", { subArea: "Bar Decor", scanIn: IN, groupId: 1 }),
    ln(6, "Tealight Holder 15cm", 40, "COCKTAIL", "On preparing items", { subArea: "Cocktail Table", scanIn: IN, groupId: 1 }),
    ln(7, "String Fairy Lights 10m", 4, "ENTRANCE", "Finish setup", { scanIn: IN }),
    ln(8, "White Latex Balloon", 120, "ENTRANCE", "Finish setup", { subArea: "Balloon Arch", scanIn: IN }),
  ],
  [K(92)]: [
    ln(1, "Round Banquet Table", 10, "GUEST TABLE", "Created by admin up", { scanIn: IN, scanOut: OUT, checked: true, resolution: "returned" }),
    ln(2, "Tiffany Chair", 60, "GUEST TABLE", "Created by admin up", { scanIn: IN, scanOut: OUT, checked: true }),
    ln(3, "White Latex Balloon", 200, "ENTRANCE", "On preparing items", { scanIn: IN, scanOut: OUT }),
    ln(4, "Spotlight Stand", 2, "Area Hall", "On preparing items", { scanIn: IN, scanOut: OUT, checked: true }),
    ln(5, "Chiffon Drape Ivory 5m", 6, "Area Hall", "Finish setup", { scanIn: IN, scanOut: OUT, brokenWrittenOff: 1 }),
  ],
  [K(94)]: [
    ln(1, "Velvet Lounge Sofa 2-Seater", 2, "LOUNGE", "Created by admin up", { scanIn: IN, scanOut: OUT, checked: true, resolution: "returned" }),
    ln(2, "Iron Flower Arch 60cm", 1, "CEREMONY", "Created by admin up", { scanIn: IN, scanOut: OUT, checked: true, resolution: "returned" }),
    ln(3, "Plain White Fabric 3m", 6, "CEREMONY", "On preparing items", { scanIn: IN, scanOut: OUT, checked: true, resolution: "returned" }),
  ],
}

export const PACKAGES: Record<string, Package[]> = {
  [K(98)]: [{ id: 1, name: "Box A – Display table", itemIds: [4, 5, 6] }],
  [K(91)]: [{ id: 1, name: "Box C – Bar decor", itemIds: [5, 6] }],
}

/** Saved stage per event key. Missing → first stage. */
export const PROGRESS: Record<string, string> = {
  [K(98)]: "Waiting scan in",
  [K(97)]: "Finish setup",
  [K(95)]: "On preparing items",
  [K(91)]: "Waiting scan out",
  [K(92)]: "Finished",
  [K(94)]: "Finished",
  [K(93)]: "Finished",
}

export const CLOSING: Record<string, Closing> = {
  [K(92)]: "checking-inventory",
  [K(94)]: "returned-completed",
  [K(93)]: "transferred",
}

const rent = (r: Omit<Rental, "kind" | "note"> & { note?: string }, kind: Rental["kind"] = "loan"): Rental => ({ note: "", ...r, kind })

export const RENTALS: Rental[] = [
  rent({ id: 1, eventKey: K(98), itemName: "Wireless Handheld Microphone", qty: 2, unit: "unit", area: "Area Hall", vendorName: "Nusantara Sound & Light", startDate: "2026-04-09", dueDate: "2026-04-11", rentalCost: 150000, status: "Borrowed", borrowedAt: "2026-04-08", returnedAt: null }),
  rent({ id: 2, eventKey: K(95), itemName: "Gold Charger Plate", qty: 120, unit: "pcs", area: "GUEST TABLE", vendorName: "Wedding Organizer Mitra", startDate: "2026-04-22", dueDate: "2026-04-26", rentalCost: 8000, status: "Requested", borrowedAt: null, returnedAt: null }),
  rent({ id: 3, eventKey: K(95), itemName: "Champagne Glass Coupe", qty: 80, unit: "pcs", area: "CHAMPAGNE WALL", vendorName: "Glassware Pro Rental", startDate: "2026-04-22", dueDate: "2026-04-26", rentalCost: 4000, status: "Requested", borrowedAt: null, returnedAt: null }),
  rent({ id: 4, eventKey: K(97), itemName: "Floral Arch Installation", qty: 1, unit: "set", area: "CEREMONY", vendorName: "Bali Florist Collective", startDate: "2026-05-16", dueDate: "2026-05-17", rentalCost: 12500000, status: "Borrowed", borrowedAt: "2026-04-08", returnedAt: null, note: "Fresh white roses and baby breath." }, "outsource"),
  rent({ id: 5, eventKey: K(95), itemName: "Fresh Flower Centerpiece", qty: 6, unit: "pcs", area: "GUEST TABLE", subArea: "Centerpiece", vendorName: "Bali Florist Collective", startDate: "2026-04-25", dueDate: "2026-04-25", rentalCost: 450000, status: "Requested", borrowedAt: null, returnedAt: null }, "outsource"),
  rent({ id: 6, eventKey: K(94), itemName: "Lounge Sofa Set", qty: 3, unit: "set", area: "LOUNGE", vendorName: "Bali Party Rental", startDate: "2026-03-19", dueDate: "2026-03-22", rentalCost: 850000, status: "Returned", borrowedAt: "2026-03-19", returnedAt: "2026-03-22" }),
  // Kept in a warehouse, not tied to an event (web: SEED_GENERAL_RENTALS).
  rent({ id: 7, itemName: "Champagne Glass Coupe", qty: 300, unit: "pcs", warehouse: "Warehouse C9", purpose: "Glass buffer for the May events", vendorName: "Glassware Pro Rental", startDate: "2026-04-01", dueDate: "2026-05-20", rentalCost: 3000, status: "Borrowed", borrowedAt: "2026-04-01", returnedAt: null }),
  rent({ id: 8, itemName: "Projector Screen 3x2m", qty: 2, unit: "unit", warehouse: "Warehouse Cililitan", purpose: "Client presentation week", vendorName: "Nusantara Sound & Light", startDate: "2026-03-30", dueDate: "2026-04-05", rentalCost: 250000, status: "Borrowed", borrowedAt: "2026-03-30", returnedAt: null, note: "Vendor asked to extend or return." }),
  rent({ id: 9, itemName: "Tiffany Chair", qty: 100, unit: "unit", warehouse: "Warehouse Bali 66", purpose: "Buffer stock for the July wedding season", vendorName: "Sewa Kursi Jaya Rental", startDate: "2026-06-28", dueDate: "2026-07-31", rentalCost: 15000, status: "Requested", borrowedAt: null, returnedAt: null, note: "Monthly rate." }),
]

export const OPNAMES: Opname[] = [
  {
    id: 1,
    appliedAt: "2026-03-28T16:20:00+08:00",
    appliedBy: "Anto",
    warehouse: "Warehouse Bali 70",
    countedCount: 9,
    status: "Approved",
    resolvedAt: "2026-03-29T09:02:00+08:00",
    resolvedBy: "Dewi Anjani",
    items: [
      { rowId: 0, name: "Tealight Holder 15cm", before: 228, after: 220, diff: -8, condition: "Good", note: "", valuation: 20000 },
      { rowId: 0, name: "Faux Greenery Garland 2m", before: 3, after: 3, diff: 0, condition: "Poor", note: "Faded leaves", valuation: 95000 },
    ],
  },
]
