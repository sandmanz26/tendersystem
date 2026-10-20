import type {
  Asset,
  Person,
  PhaseLogEntry,
  Report,
  ScanBook,
  WeddingEvent,
} from "./types"

/* Dates are built relative to "today" so the demo always has a live event. */
function day(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

function at(offset: number, time: string) {
  const [h, m] = time.split(":").map(Number)
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const CURRENT_USER_ID = "p01"

export const PEOPLE: Person[] = [
  { id: "p01", name: "Dimas Prasetyo", role: "Logistics Crew", phone: "081234560101" },
  { id: "p02", name: "Rina Kartika", role: "Field Coordinator", phone: "081234560102" },
  { id: "p03", name: "Yusuf Hakim", role: "Logistics Crew", phone: "081234560103" },
  { id: "p04", name: "Melati Anggraini", role: "Decor Crew", phone: "081234560104" },
  { id: "p05", name: "Bagas Saputra", role: "Decor Crew", phone: "081234560105" },
  { id: "p06", name: "Andi Wijaya", role: "Sound & Lighting", phone: "081234560106" },
  { id: "p07", name: "Sari Puspita", role: "Florist", phone: "081234560107" },
  { id: "p08", name: "Joko Santoso", role: "Driver", phone: "081234560108" },
  { id: "p09", name: "Fajar Nugroho", role: "Driver", phone: "081234560109" },
  { id: "p10", name: "Intan Permata", role: "Runner", phone: "081234560110" },
  { id: "p11", name: "Hendra Gunawan", role: "Field Coordinator", phone: "081234560111" },
  { id: "p12", name: "Tika Ramadhani", role: "Decor Crew", phone: "081234560112" },
  { id: "p13", name: "Wahyu Pratama", role: "Sound & Lighting", phone: "081234560113" },
  { id: "p14", name: "Lestari Dewi", role: "Runner", phone: "081234560114" },
  { id: "v01", name: "Pak Harun", role: "Catering", phone: "081298760201", company: "Dapur Sekar Catering" },
  { id: "v02", name: "Kevin Lim", role: "Photo & Video", phone: "081298760202", company: "Frame & Vow Studio" },
  { id: "v03", name: "Mbak Ayu", role: "MUA", phone: "081298760203", company: "Ayu Bridal" },
  { id: "v04", name: "Rizky", role: "Band / Entertainment", phone: "081298760204", company: "Akustik Senja" },
]

export const ASSETS: Asset[] = [
  // Furniture
  { code: "KRS-TFG-01", name: "Tiffany Chair, Gold", category: "Furniture", unit: "1 pallet · 40 chairs", location: "Warehouse A · Zone 1", condition: "Good", dimensions: "120 × 100 × 180 cm", lastChecked: day(-12) },
  { code: "KRS-TFG-02", name: "Tiffany Chair, Gold", category: "Furniture", unit: "1 pallet · 40 chairs", location: "Warehouse A · Zone 1", condition: "Good", dimensions: "120 × 100 × 180 cm", lastChecked: day(-12) },
  { code: "KRS-TFC-01", name: "Tiffany Chair, Clear", category: "Furniture", unit: "1 pallet · 30 chairs", location: "Warehouse A · Zone 1", condition: "Needs check", dimensions: "120 × 100 × 170 cm", lastChecked: day(-30), notes: "3 chairs have wobbly legs, marked with yellow stickers." },
  { code: "MJA-RND-01", name: "Round Table 180", category: "Furniture", unit: "6 tables + folding legs", location: "Warehouse A · Zone 2", condition: "Good", dimensions: "Ø180 cm", lastChecked: day(-8) },
  { code: "MJA-RND-02", name: "Round Table 180", category: "Furniture", unit: "6 tables + folding legs", location: "Warehouse A · Zone 2", condition: "Good", dimensions: "Ø180 cm", lastChecked: day(-8) },
  { code: "MJA-PJG-01", name: "Teak Long Table", category: "Furniture", unit: "2 tables", location: "Warehouse A · Zone 2", condition: "Good", dimensions: "240 × 90 cm", lastChecked: day(-20) },
  { code: "SFA-PLM-01", name: "Velvet Bridal Sofa", category: "Furniture", unit: "1 set · 3 seats", location: "Warehouse B · Zone 4", condition: "Good", dimensions: "220 × 85 × 95 cm", lastChecked: day(-15), notes: "Must be wrapped in plastic cover on the truck." },
  // Dekorasi
  { code: "DKR-GBG-01", name: "Carved Javanese Gebyok", category: "Decor", unit: "3 panels", location: "Warehouse B · Zone 3", condition: "Good", dimensions: "3 × (120 × 300 cm)", lastChecked: day(-10), notes: "Lift with at least 2 people per panel." },
  { code: "DKR-ARC-01", name: "Round Iron Arch", category: "Decor", unit: "1 set · 4 segments", location: "Warehouse B · Zone 3", condition: "Good", dimensions: "Ø250 cm", lastChecked: day(-6) },
  { code: "DKR-BKD-01", name: "White Backdrop Panels", category: "Decor", unit: "6 panels + 4 stands", location: "Warehouse B · Zone 3", condition: "Needs check", dimensions: "6 × (100 × 250 cm)", lastChecked: day(-25), notes: "Panel 4 has scratches on the back." },
  { code: "DKR-KRP-01", name: "White Aisle Carpet", category: "Decor", unit: "1 roll · 15 m", location: "Warehouse B · Rack 2", condition: "Good", lastChecked: day(-5) },
  { code: "DKR-STD-01", name: "Welcome Sign Frame", category: "Decor", unit: "2 frames + easel", location: "Warehouse B · Rack 1", condition: "Good", lastChecked: day(-9) },
  { code: "DKR-LTN-01", name: "Rattan Lanterns", category: "Decor", unit: "1 box · 12 pcs", location: "Warehouse B · Rack 1", condition: "Good", lastChecked: day(-14) },
  // Lighting
  { code: "LGT-PAR-01", name: "Par LED 54", category: "Lighting", unit: "1 case · 8 units", location: "Warehouse C · Rack 1", condition: "Good", lastChecked: day(-4) },
  { code: "LGT-FRY-01", name: "Fairy Light Warm White", category: "Lighting", unit: "1 box · 20 rolls", location: "Warehouse C · Rack 2", condition: "Good", lastChecked: day(-4) },
  { code: "LGT-CHD-01", name: "Crystal Chandelier", category: "Lighting", unit: "1 unit + rigging", location: "Warehouse C · Special zone", condition: "Good", dimensions: "Ø90 × 110 cm", lastChecked: day(-18), notes: "Fragile. Do not stack." },
  { code: "LGT-DMX-01", name: "DMX Controller", category: "Lighting", unit: "1 case", location: "Warehouse C · Rack 1", condition: "Good", lastChecked: day(-4) },
  // Sound
  { code: "SND-SPK-01", name: "Active Speaker 15\"", category: "Sound", unit: "1 pair + stands", location: "Warehouse C · Rack 3", condition: "Good", lastChecked: day(-3) },
  { code: "SND-MXR-01", name: "Mixer 16 Channel", category: "Sound", unit: "1 case", location: "Warehouse C · Rack 3", condition: "Good", lastChecked: day(-3) },
  { code: "SND-MIC-01", name: "Wireless Mic", category: "Sound", unit: "1 case · 4 mics", location: "Warehouse C · Rack 3", condition: "Needs check", lastChecked: day(-21), notes: "Mic #3 sometimes cuts out. Bring spare batteries." },
  { code: "SND-CBL-01", name: "Cables & Power Distro", category: "Sound", unit: "1 box", location: "Warehouse C · Rack 4", condition: "Good", lastChecked: day(-3) },
  // Linen
  { code: "LIN-TBC-01", name: "Ivory Round Tablecloth", category: "Linen", unit: "1 box · 12 pcs", location: "Warehouse A · Rack 5", condition: "Good", lastChecked: day(-2) },
  { code: "LIN-RNR-01", name: "Table Runner Sage", category: "Linen", unit: "1 box · 12 pcs", location: "Warehouse A · Rack 5", condition: "Good", lastChecked: day(-2) },
  { code: "LIN-NPK-01", name: "Cream Linen Napkins", category: "Linen", unit: "1 box · 100 pcs", location: "Warehouse A · Rack 5", condition: "Good", lastChecked: day(-2) },
  { code: "LIN-CHS-01", name: "Chair Sash Satin", category: "Linen", unit: "1 box · 80 pcs", location: "Warehouse A · Rack 6", condition: "Good", lastChecked: day(-11) },
  // Tableware
  { code: "TBW-GLS-01", name: "Crystal Goblets", category: "Tableware", unit: "1 crate · 36 pcs", location: "Warehouse A · Rack 7", condition: "Good", lastChecked: day(-7), notes: "Fragile. Recount at teardown." },
  { code: "TBW-GLS-02", name: "Crystal Goblets", category: "Tableware", unit: "1 crate · 36 pcs", location: "Warehouse A · Rack 7", condition: "Good", lastChecked: day(-7), notes: "Fragile. Recount at teardown." },
  { code: "TBW-CHG-01", name: "Charger Plate Gold", category: "Tableware", unit: "1 crate · 40 pcs", location: "Warehouse A · Rack 8", condition: "Good", lastChecked: day(-7) },
  { code: "TBW-CTL-01", name: "Cutlery Set Gold", category: "Tableware", unit: "1 box · 50 sets", location: "Warehouse A · Rack 8", condition: "Good", lastChecked: day(-7) },
  // Props
  { code: "PRP-VAS-01", name: "Tall Glass Vases", category: "Flowers & Props", unit: "1 crate · 10 pcs", location: "Warehouse B · Rack 4", condition: "Good", lastChecked: day(-6) },
  { code: "PRP-CND-01", name: "Candle Holder Brass", category: "Flowers & Props", unit: "1 box · 24 pcs", location: "Warehouse B · Rack 4", condition: "Good", lastChecked: day(-6) },
  { code: "PRP-BKT-01", name: "White Artificial Flowers", category: "Flowers & Props", unit: "2 boxes", location: "Warehouse B · Rack 5", condition: "Good", lastChecked: day(-16) },
  { code: "PRP-SGN-01", name: "Acrylic Signage", category: "Flowers & Props", unit: "1 box · 8 pcs", location: "Warehouse B · Rack 1", condition: "Good", lastChecked: day(-9) },
]

export const EVENTS: WeddingEvent[] = [
  {
    id: "ev-nadia-raka",
    couple: "Nadia & Raka",
    kind: "Reception",
    date: day(0),
    callTime: "06:00",
    startTime: "18:30",
    endTime: "21:30",
    guests: 450,
    theme: "Garden, sage & ivory",
    venue: {
      name: "Taman Arunika",
      address: "Jl. Raya Pajajaran No. 88, Bogor Tengah",
      area: "Bogor",
      loadingNote: "Trucks enter via the side gate (Jl. Salak). Loading dock open until 14:00.",
      pic: { name: "Pak Darto (Venue)", phone: "081311110001" },
    },
    client: { name: "Ibu Wulan", relation: "Mother of the bride", phone: "081377770001" },
    notes: [
      "Crew dress code: black shirt, black trousers, closed shoes.",
      "Keep off the stage area after 17:30 unless you are on the decor team.",
      "Crew meal at 16:00 in the room behind the kitchen.",
    ],
    assetCodes: [
      "KRS-TFG-01", "KRS-TFG-02", "MJA-RND-01", "MJA-RND-02", "SFA-PLM-01",
      "DKR-ARC-01", "DKR-KRP-01", "DKR-STD-01", "LGT-FRY-01", "LGT-PAR-01",
      "SND-SPK-01", "SND-MIC-01", "LIN-TBC-01", "LIN-RNR-01", "TBW-GLS-01",
      "PRP-VAS-01",
    ],
    crew: [
      { personId: "p02", duty: "Field coordinator", lead: true },
      { personId: "p01", duty: "Logistics & item scanning" },
      { personId: "p03", duty: "Logistics & item scanning" },
      { personId: "p04", duty: "Stage decor" },
      { personId: "p05", duty: "Guest area decor" },
      { personId: "p07", duty: "Fresh flowers & guest tables" },
      { personId: "p06", duty: "Sound & lighting" },
      { personId: "p08", duty: "Truck 1 (CDD)" },
      { personId: "p10", duty: "Family runner" },
      { personId: "v01", duty: "Catering" },
      { personId: "v02", duty: "Photo & video" },
      { personId: "v04", duty: "Acoustic set" },
    ],
    rundown: [
      { time: "06:00", label: "Crew meet at warehouse, briefing", crewNote: "All logistics crew" },
      { time: "07:00", label: "Trucks leave for venue" },
      { time: "09:00", label: "Unload & setup starts" },
      { time: "15:00", label: "Setup done, coordinator check" },
      { time: "16:00", label: "Crew meal" },
      { time: "17:30", label: "Sound check & final touch" },
      { time: "18:30", label: "Guests arrive, reception starts" },
      { time: "19:15", label: "Bridal procession" },
      { time: "21:30", label: "Event ends" },
      { time: "22:00", label: "Teardown", crewNote: "Recount glasses before loading" },
    ],
    phaseIndex: 1,
  },
  {
    id: "ev-sekar-bima",
    couple: "Sekar & Bima",
    kind: "Akad Ceremony",
    date: day(1),
    callTime: "04:30",
    startTime: "08:00",
    endTime: "11:00",
    guests: 150,
    theme: "Classic Javanese, gebyok",
    venue: {
      name: "Sekar Family Home",
      address: "Jl. Cempaka Putih Tengah III No. 12, Jakarta Pusat",
      area: "Jakarta Pusat",
      loadingNote: "Narrow alley, trucks park on the main road. Bring trolleys.",
      pic: { name: "Om Hadi (Family)", phone: "081311110002" },
    },
    client: { name: "Bapak Sutrisno", relation: "Father of the bride", phone: "081377770002" },
    notes: [
      "Akad is in the living room with limited space. Crew enter only when needed.",
      "Tent is set up by the tent vendor the afternoon before.",
    ],
    assetCodes: [
      "DKR-GBG-01", "MJA-PJG-01", "KRS-TFC-01", "DKR-LTN-01", "LIN-NPK-01",
      "PRP-BKT-01", "PRP-CND-01", "SND-SPK-01", "SND-MIC-01", "SND-CBL-01",
    ],
    crew: [
      { personId: "p11", duty: "Field coordinator", lead: true },
      { personId: "p01", duty: "Logistics & item scanning" },
      { personId: "p12", duty: "Gebyok decor" },
      { personId: "p07", duty: "Florist" },
      { personId: "p13", duty: "Sound" },
      { personId: "p09", duty: "Pick up" },
      { personId: "p14", duty: "Family runner" },
      { personId: "v03", duty: "MUA" },
      { personId: "v02", duty: "Photo & video" },
    ],
    rundown: [
      { time: "04:30", label: "Crew meet at warehouse" },
      { time: "05:15", label: "Leave for venue" },
      { time: "06:00", label: "Set up gebyok & chairs" },
      { time: "07:30", label: "Setup done" },
      { time: "08:00", label: "Akad ceremony starts" },
      { time: "09:30", label: "Sungkeman & family photos" },
      { time: "11:00", label: "Event ends, teardown" },
    ],
    phaseIndex: 0,
  },
  {
    id: "ev-laras-adit",
    couple: "Laras & Adit",
    kind: "Intimate Wedding",
    date: day(4),
    callTime: "10:00",
    startTime: "16:00",
    endTime: "20:00",
    guests: 80,
    theme: "Rustic, lanterns & wood",
    venue: {
      name: "Kebun Kopi Lembang",
      address: "Jl. Raya Lembang KM 7, Bandung Barat",
      area: "Lembang",
      loadingNote: "Steep road, small trucks only. Outdoor area, bring plastic covers.",
      pic: { name: "Teh Nisa (Venue)", phone: "081311110003" },
    },
    client: { name: "Laras", relation: "Bride", phone: "081377770003" },
    notes: ["Rain forecast in the afternoon. Plan B is the pendopo."],
    assetCodes: [
      "MJA-PJG-01", "KRS-TFC-01", "DKR-LTN-01", "LGT-FRY-01", "LIN-RNR-01",
      "LIN-NPK-01", "TBW-GLS-02", "TBW-CTL-01", "PRP-CND-01", "PRP-SGN-01",
    ],
    crew: [
      { personId: "p02", duty: "Field coordinator", lead: true },
      { personId: "p01", duty: "Logistics & item scanning" },
      { personId: "p05", duty: "Decor" },
      { personId: "p07", duty: "Florist" },
      { personId: "p13", duty: "Lighting" },
      { personId: "p08", duty: "Small truck" },
    ],
    rundown: [
      { time: "10:00", label: "Crew meet" },
      { time: "12:00", label: "Setup" },
      { time: "16:00", label: "Blessing" },
      { time: "17:30", label: "Dinner" },
      { time: "20:00", label: "Ends" },
    ],
    phaseIndex: 0,
  },
  {
    id: "ev-anisa-farhan",
    couple: "Anisa & Farhan",
    kind: "Akad & Reception",
    date: day(9),
    callTime: "05:00",
    startTime: "09:00",
    endTime: "14:00",
    guests: 800,
    theme: "Modern white & gold",
    venue: {
      name: "Grand Ballroom Kartika",
      address: "Jl. Jend. Gatot Subroto Kav. 21, Jakarta Selatan",
      area: "Jakarta Selatan",
      loadingNote: "Loading via basement 2, max truck height 3.2 m.",
      pic: { name: "Mas Reza (Banquet)", phone: "081311110004" },
    },
    client: { name: "Ibu Ratna", relation: "Mother of the groom", phone: "081377770004" },
    notes: ["Venue requires crew to wear ID cards throughout."],
    assetCodes: [
      "KRS-TFG-01", "KRS-TFG-02", "MJA-RND-01", "MJA-RND-02", "SFA-PLM-01",
      "DKR-BKD-01", "DKR-KRP-01", "LGT-CHD-01", "LGT-PAR-01", "LGT-DMX-01",
      "SND-MXR-01", "LIN-TBC-01", "LIN-CHS-01", "TBW-CHG-01", "TBW-GLS-01", "TBW-GLS-02",
    ],
    crew: [
      { personId: "p11", duty: "Field coordinator", lead: true },
      { personId: "p02", duty: "Family coordinator" },
      { personId: "p01", duty: "Logistics & item scanning" },
      { personId: "p03", duty: "Logistics" },
      { personId: "p04", duty: "Decor" },
      { personId: "p12", duty: "Decor" },
      { personId: "p06", duty: "Lighting" },
      { personId: "p13", duty: "Sound" },
      { personId: "p08", duty: "Truck 1" },
      { personId: "p09", duty: "Truck 2" },
    ],
    rundown: [
      { time: "05:00", label: "Crew meet" },
      { time: "09:00", label: "Akad ceremony" },
      { time: "11:00", label: "Reception" },
      { time: "14:00", label: "Ends" },
    ],
    phaseIndex: 0,
  },
  {
    id: "ev-putri-gilang",
    couple: "Putri & Gilang",
    kind: "Reception",
    date: day(-1),
    callTime: "08:00",
    startTime: "19:00",
    endTime: "22:00",
    guests: 300,
    theme: "Terracotta & dried flowers",
    venue: {
      name: "Aula Serbaguna Pelita",
      address: "Jl. Margonda Raya No. 410, Depok",
      area: "Depok",
      loadingNote: "Park trucks behind the hall.",
      pic: { name: "Pak Imam (Venue)", phone: "081311110005" },
    },
    client: { name: "Putri", relation: "Bride", phone: "081377770005" },
    notes: ["Items returned to the warehouse this morning; return scan not finished."],
    assetCodes: [
      "KRS-TFC-01", "MJA-RND-01", "DKR-BKD-01", "DKR-LTN-01", "LGT-PAR-01",
      "SND-MXR-01", "SND-CBL-01", "LIN-CHS-01", "TBW-CHG-01", "PRP-VAS-01",
    ],
    crew: [
      { personId: "p11", duty: "Field coordinator", lead: true },
      { personId: "p01", duty: "Logistics & item scanning" },
      { personId: "p03", duty: "Logistics" },
      { personId: "p12", duty: "Decor" },
      { personId: "p06", duty: "Sound & lighting" },
      { personId: "p09", duty: "Truck" },
    ],
    rundown: [
      { time: "08:00", label: "Crew meet" },
      { time: "19:00", label: "Reception" },
      { time: "22:00", label: "Ends, teardown" },
    ],
    phaseIndex: 5,
  },
  {
    id: "ev-dewi-yoga",
    couple: "Dewi & Yoga",
    kind: "Reception",
    date: day(-6),
    callTime: "07:00",
    startTime: "11:00",
    endTime: "14:00",
    guests: 500,
    theme: "Modern batik",
    venue: {
      name: "Gedung Wanita Melati",
      address: "Jl. Pemuda No. 5, Jakarta Timur",
      area: "Jakarta Timur",
      loadingNote: "—",
      pic: { name: "Bu Asih (Venue)", phone: "081311110006" },
    },
    client: { name: "Dewi", relation: "Bride", phone: "081377770006" },
    notes: [],
    assetCodes: ["KRS-TFG-01", "MJA-RND-02", "DKR-GBG-01", "SND-SPK-01", "LIN-TBC-01", "TBW-CTL-01"],
    crew: [
      { personId: "p02", duty: "Field coordinator", lead: true },
      { personId: "p01", duty: "Logistics & item scanning" },
      { personId: "p04", duty: "Decor" },
      { personId: "p08", duty: "Truck" },
    ],
    rundown: [
      { time: "07:00", label: "Crew meet" },
      { time: "11:00", label: "Reception" },
      { time: "14:00", label: "Ends" },
    ],
    phaseIndex: 6,
  },
]

const allScanned = (codes: string[], offset: number, start: string, by: string) => {
  const [h, m] = start.split(":").map(Number)
  return Object.fromEntries(
    codes.map((code, i) => {
      const mins = m + i * 2
      const t = `${String(h + Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`
      return [code, { at: at(offset, t), by, synced: true }]
    })
  )
}

const nadia = EVENTS[0].assetCodes
const putri = EVENTS[4].assetCodes
const dewi = EVENTS[5].assetCodes

export const SCANS: ScanBook = {
  "ev-nadia-raka": {
    load_out: allScanned(nadia, 0, "06:20", "p01"),
    arrive: allScanned(nadia.slice(0, 9), 0, "09:05", "p03"),
  },
  "ev-putri-gilang": {
    load_out: allScanned(putri, -1, "08:30", "p01"),
    arrive: allScanned(putri, -1, "10:10", "p01"),
    load_in: allScanned(putri, -1, "22:20", "p03"),
    return: allScanned(putri.slice(0, 6), 0, "07:40", "p01"),
  },
  "ev-dewi-yoga": {
    load_out: allScanned(dewi, -6, "07:15", "p01"),
    arrive: allScanned(dewi, -6, "08:30", "p01"),
    load_in: allScanned(dewi, -6, "14:30", "p01"),
    return: allScanned(dewi, -6, "16:10", "p01"),
  },
}

export const PHASE_LOG: Record<string, PhaseLogEntry[]> = {
  "ev-nadia-raka": [{ phase: "load_out", at: at(0, "06:52"), by: "p01" }],
  "ev-putri-gilang": [
    { phase: "load_out", at: at(-1, "09:00"), by: "p01" },
    { phase: "arrive", at: at(-1, "10:40"), by: "p01" },
    { phase: "setup", at: at(-1, "17:30"), by: "p11" },
    { phase: "show", at: at(-1, "22:05"), by: "p11" },
    { phase: "load_in", at: at(-1, "22:45"), by: "p03" },
  ],
  "ev-dewi-yoga": [
    { phase: "load_out", at: at(-6, "07:40"), by: "p01" },
    { phase: "arrive", at: at(-6, "08:50"), by: "p01" },
    { phase: "setup", at: at(-6, "10:30"), by: "p02" },
    { phase: "show", at: at(-6, "14:05"), by: "p02" },
    { phase: "load_in", at: at(-6, "15:00"), by: "p01" },
    { phase: "return", at: at(-6, "16:30"), by: "p01" },
  ],
}

export const REPORTS: Report[] = [
  {
    id: "RPT-0142",
    eventId: "ev-nadia-raka",
    kind: "issue",
    category: "Venue",
    phase: "arrive",
    severity: "Medium",
    title: "Venue power still off in the garden area",
    description:
      "The venue hasn't switched on the garden power panel, so sound & lighting can't be tested. Told Pak Darto; he says the technician arrives at 11.",
    photos: [],
    status: "In progress",
    createdAt: at(0, "09:20"),
    by: "p01",
    updates: [
      { at: at(0, "09:26"), by: "p02", text: "OK, I'll follow up with venue management. Use the small generator for testing meanwhile." },
    ],
  },
  {
    id: "RPT-0141",
    eventId: "ev-putri-gilang",
    kind: "damage",
    category: "Minor damage",
    assetCode: "DKR-BKD-01",
    phase: "load_in",
    severity: "Low",
    title: "Backdrop panel 2 torn at the corner",
    description: "About a 5 cm tear at the bottom right corner, hit by a trolley during teardown.",
    photos: [],
    status: "Open",
    createdAt: at(-1, "22:35"),
    by: "p03",
    updates: [],
  },
  {
    id: "RPT-0139",
    eventId: "ev-putri-gilang",
    kind: "damage",
    category: "Missing",
    assetCode: "PRP-VAS-01",
    phase: "load_in",
    severity: "Medium",
    title: "Glass vases short by 2",
    description: "Only 8 of 10 counted at teardown. Checked the catering area, not found yet.",
    photos: [],
    status: "In progress",
    createdAt: at(-1, "22:40"),
    by: "p01",
    updates: [
      { at: at(0, "08:10"), by: "p11", text: "Confirmed with the venue: 1 found in the hall storeroom. Picking it up this afternoon." },
    ],
  },
  {
    id: "RPT-0131",
    eventId: "ev-dewi-yoga",
    kind: "issue",
    category: "Transport",
    phase: "load_out",
    severity: "High",
    title: "Truck 1 flat tyre on the toll road",
    description: "Rear left tyre flat at KM 12. Waiting for a tow, about 45 minutes late.",
    photos: [],
    status: "Resolved",
    createdAt: at(-6, "07:50"),
    by: "p08",
    updates: [
      { at: at(-6, "07:55"), by: "p02", text: "Backup truck dispatched from the warehouse." },
      { at: at(-6, "08:40"), by: "p02", text: "Items moved to the backup truck, back on the road." },
    ],
  },
]
