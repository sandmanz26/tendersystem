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
  { id: "p01", name: "Dimas Prasetyo", role: "Crew Logistik", phone: "081234560101" },
  { id: "p02", name: "Rina Kartika", role: "Koordinator Lapangan", phone: "081234560102" },
  { id: "p03", name: "Yusuf Hakim", role: "Crew Logistik", phone: "081234560103" },
  { id: "p04", name: "Melati Anggraini", role: "Crew Dekor", phone: "081234560104" },
  { id: "p05", name: "Bagas Saputra", role: "Crew Dekor", phone: "081234560105" },
  { id: "p06", name: "Andi Wijaya", role: "Sound & Lighting", phone: "081234560106" },
  { id: "p07", name: "Sari Puspita", role: "Florist", phone: "081234560107" },
  { id: "p08", name: "Joko Santoso", role: "Driver", phone: "081234560108" },
  { id: "p09", name: "Fajar Nugroho", role: "Driver", phone: "081234560109" },
  { id: "p10", name: "Intan Permata", role: "Runner", phone: "081234560110" },
  { id: "p11", name: "Hendra Gunawan", role: "Koordinator Lapangan", phone: "081234560111" },
  { id: "p12", name: "Tika Ramadhani", role: "Crew Dekor", phone: "081234560112" },
  { id: "p13", name: "Wahyu Pratama", role: "Sound & Lighting", phone: "081234560113" },
  { id: "p14", name: "Lestari Dewi", role: "Runner", phone: "081234560114" },
  { id: "v01", name: "Pak Harun", role: "Catering", phone: "081298760201", company: "Dapur Sekar Catering" },
  { id: "v02", name: "Kevin Lim", role: "Dokumentasi", phone: "081298760202", company: "Frame & Vow Studio" },
  { id: "v03", name: "Mbak Ayu", role: "MUA", phone: "081298760203", company: "Ayu Bridal" },
  { id: "v04", name: "Rizky", role: "Band / Entertainment", phone: "081298760204", company: "Akustik Senja" },
]

export const ASSETS: Asset[] = [
  // Furniture
  { code: "KRS-TFG-01", name: "Kursi Tiffany Gold", category: "Furniture", unit: "1 palet · 40 kursi", location: "Gudang A · Zona 1", condition: "Baik", dimensions: "120 × 100 × 180 cm", lastChecked: day(-12) },
  { code: "KRS-TFG-02", name: "Kursi Tiffany Gold", category: "Furniture", unit: "1 palet · 40 kursi", location: "Gudang A · Zona 1", condition: "Baik", dimensions: "120 × 100 × 180 cm", lastChecked: day(-12) },
  { code: "KRS-TFC-01", name: "Kursi Tiffany Clear", category: "Furniture", unit: "1 palet · 30 kursi", location: "Gudang A · Zona 1", condition: "Perlu cek", dimensions: "120 × 100 × 170 cm", lastChecked: day(-30), notes: "3 kursi kaki agak goyang, sudah ditandai stiker kuning." },
  { code: "MJA-RND-01", name: "Meja Bundar 180", category: "Furniture", unit: "6 meja + kaki lipat", location: "Gudang A · Zona 2", condition: "Baik", dimensions: "Ø180 cm", lastChecked: day(-8) },
  { code: "MJA-RND-02", name: "Meja Bundar 180", category: "Furniture", unit: "6 meja + kaki lipat", location: "Gudang A · Zona 2", condition: "Baik", dimensions: "Ø180 cm", lastChecked: day(-8) },
  { code: "MJA-PJG-01", name: "Meja Panjang Kayu Jati", category: "Furniture", unit: "2 meja", location: "Gudang A · Zona 2", condition: "Baik", dimensions: "240 × 90 cm", lastChecked: day(-20) },
  { code: "SFA-PLM-01", name: "Sofa Pelaminan Velvet", category: "Furniture", unit: "1 set · 3 dudukan", location: "Gudang B · Zona 4", condition: "Baik", dimensions: "220 × 85 × 95 cm", lastChecked: day(-15), notes: "Wajib pakai cover plastik saat di truk." },
  // Dekorasi
  { code: "DKR-GBG-01", name: "Gebyok Ukir Jawa", category: "Dekorasi", unit: "3 panel", location: "Gudang B · Zona 3", condition: "Baik", dimensions: "3 × (120 × 300 cm)", lastChecked: day(-10), notes: "Angkat minimal 2 orang per panel." },
  { code: "DKR-ARC-01", name: "Arch Besi Bulat", category: "Dekorasi", unit: "1 set · 4 segmen", location: "Gudang B · Zona 3", condition: "Baik", dimensions: "Ø250 cm", lastChecked: day(-6) },
  { code: "DKR-BKD-01", name: "Backdrop Panel Putih", category: "Dekorasi", unit: "6 panel + 4 kaki", location: "Gudang B · Zona 3", condition: "Perlu cek", dimensions: "6 × (100 × 250 cm)", lastChecked: day(-25), notes: "Panel 4 ada goresan di sisi belakang." },
  { code: "DKR-KRP-01", name: "Karpet Aisle Putih", category: "Dekorasi", unit: "1 roll · 15 m", location: "Gudang B · Rak 2", condition: "Baik", lastChecked: day(-5) },
  { code: "DKR-STD-01", name: "Standing Frame Welcome", category: "Dekorasi", unit: "2 frame + easel", location: "Gudang B · Rak 1", condition: "Baik", lastChecked: day(-9) },
  { code: "DKR-LTN-01", name: "Lentera Rotan", category: "Dekorasi", unit: "1 box · 12 pcs", location: "Gudang B · Rak 1", condition: "Baik", lastChecked: day(-14) },
  // Lighting
  { code: "LGT-PAR-01", name: "Par LED 54", category: "Lighting", unit: "1 case · 8 unit", location: "Gudang C · Rak 1", condition: "Baik", lastChecked: day(-4) },
  { code: "LGT-FRY-01", name: "Fairy Light Warm White", category: "Lighting", unit: "1 box · 20 roll", location: "Gudang C · Rak 2", condition: "Baik", lastChecked: day(-4) },
  { code: "LGT-CHD-01", name: "Chandelier Kristal", category: "Lighting", unit: "1 unit + rigging", location: "Gudang C · Zona khusus", condition: "Baik", dimensions: "Ø90 × 110 cm", lastChecked: day(-18), notes: "Barang fragile. Jangan ditumpuk." },
  { code: "LGT-DMX-01", name: "DMX Controller", category: "Lighting", unit: "1 case", location: "Gudang C · Rak 1", condition: "Baik", lastChecked: day(-4) },
  // Sound
  { code: "SND-SPK-01", name: "Speaker Aktif 15\"", category: "Sound", unit: "1 pasang + stand", location: "Gudang C · Rak 3", condition: "Baik", lastChecked: day(-3) },
  { code: "SND-MXR-01", name: "Mixer 16 Channel", category: "Sound", unit: "1 case", location: "Gudang C · Rak 3", condition: "Baik", lastChecked: day(-3) },
  { code: "SND-MIC-01", name: "Wireless Mic", category: "Sound", unit: "1 case · 4 mic", location: "Gudang C · Rak 3", condition: "Perlu cek", lastChecked: day(-21), notes: "Mic #3 kadang putus. Bawa baterai cadangan." },
  { code: "SND-CBL-01", name: "Kabel & Power Distribusi", category: "Sound", unit: "1 box", location: "Gudang C · Rak 4", condition: "Baik", lastChecked: day(-3) },
  // Linen
  { code: "LIN-TBC-01", name: "Taplak Bundar Ivory", category: "Linen", unit: "1 box · 12 pcs", location: "Gudang A · Rak 5", condition: "Baik", lastChecked: day(-2) },
  { code: "LIN-RNR-01", name: "Table Runner Sage", category: "Linen", unit: "1 box · 12 pcs", location: "Gudang A · Rak 5", condition: "Baik", lastChecked: day(-2) },
  { code: "LIN-NPK-01", name: "Serbet Linen Cream", category: "Linen", unit: "1 box · 100 pcs", location: "Gudang A · Rak 5", condition: "Baik", lastChecked: day(-2) },
  { code: "LIN-CHS-01", name: "Chair Sash Satin", category: "Linen", unit: "1 box · 80 pcs", location: "Gudang A · Rak 6", condition: "Baik", lastChecked: day(-11) },
  // Tableware
  { code: "TBW-GLS-01", name: "Gelas Goblet Kristal", category: "Tableware", unit: "1 krat · 36 pcs", location: "Gudang A · Rak 7", condition: "Baik", lastChecked: day(-7), notes: "Fragile. Hitung ulang saat bongkar." },
  { code: "TBW-GLS-02", name: "Gelas Goblet Kristal", category: "Tableware", unit: "1 krat · 36 pcs", location: "Gudang A · Rak 7", condition: "Baik", lastChecked: day(-7), notes: "Fragile. Hitung ulang saat bongkar." },
  { code: "TBW-CHG-01", name: "Charger Plate Gold", category: "Tableware", unit: "1 krat · 40 pcs", location: "Gudang A · Rak 8", condition: "Baik", lastChecked: day(-7) },
  { code: "TBW-CTL-01", name: "Cutlery Set Gold", category: "Tableware", unit: "1 box · 50 set", location: "Gudang A · Rak 8", condition: "Baik", lastChecked: day(-7) },
  // Props
  { code: "PRP-VAS-01", name: "Vas Kaca Tinggi", category: "Bunga & Props", unit: "1 krat · 10 pcs", location: "Gudang B · Rak 4", condition: "Baik", lastChecked: day(-6) },
  { code: "PRP-CND-01", name: "Candle Holder Brass", category: "Bunga & Props", unit: "1 box · 24 pcs", location: "Gudang B · Rak 4", condition: "Baik", lastChecked: day(-6) },
  { code: "PRP-BKT-01", name: "Bunga Artifisial Putih", category: "Bunga & Props", unit: "2 box", location: "Gudang B · Rak 5", condition: "Baik", lastChecked: day(-16) },
  { code: "PRP-SGN-01", name: "Signage Akrilik", category: "Bunga & Props", unit: "1 box · 8 pcs", location: "Gudang B · Rak 1", condition: "Baik", lastChecked: day(-9) },
]

export const EVENTS: WeddingEvent[] = [
  {
    id: "ev-nadia-raka",
    couple: "Nadia & Raka",
    kind: "Resepsi",
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
      loadingNote: "Truk masuk lewat gerbang samping (Jl. Salak). Loading dock sampai 14:00.",
      pic: { name: "Pak Darto (Venue)", phone: "081311110001" },
    },
    client: { name: "Ibu Wulan", relation: "Ibu mempelai wanita", phone: "081377770001" },
    notes: [
      "Dress code crew: kemeja hitam, celana hitam, sepatu tertutup.",
      "Area pelaminan jangan dimasuki setelah 17:30 kecuali tim dekor.",
      "Makan crew jam 16:00 di ruang belakang dapur.",
    ],
    assetCodes: [
      "KRS-TFG-01", "KRS-TFG-02", "MJA-RND-01", "MJA-RND-02", "SFA-PLM-01",
      "DKR-ARC-01", "DKR-KRP-01", "DKR-STD-01", "LGT-FRY-01", "LGT-PAR-01",
      "SND-SPK-01", "SND-MIC-01", "LIN-TBC-01", "LIN-RNR-01", "TBW-GLS-01",
      "PRP-VAS-01",
    ],
    crew: [
      { personId: "p02", duty: "Koordinator lapangan", lead: true },
      { personId: "p01", duty: "Logistik & scan barang" },
      { personId: "p03", duty: "Logistik & scan barang" },
      { personId: "p04", duty: "Dekor pelaminan" },
      { personId: "p05", duty: "Dekor area tamu" },
      { personId: "p07", duty: "Bunga segar & meja tamu" },
      { personId: "p06", duty: "Sound & lighting" },
      { personId: "p08", duty: "Truk 1 (CDD)" },
      { personId: "p10", duty: "Runner keluarga" },
      { personId: "v01", duty: "Catering" },
      { personId: "v02", duty: "Foto & video" },
      { personId: "v04", duty: "Akustik" },
    ],
    rundown: [
      { time: "06:00", label: "Crew kumpul di gudang, briefing", crewNote: "Semua crew logistik" },
      { time: "07:00", label: "Truk berangkat ke venue" },
      { time: "09:00", label: "Bongkar & setup mulai" },
      { time: "15:00", label: "Setup selesai, cek koordinator" },
      { time: "16:00", label: "Makan crew" },
      { time: "17:30", label: "Sound check & final touch" },
      { time: "18:30", label: "Tamu datang, resepsi dimulai" },
      { time: "19:15", label: "Kirab pengantin masuk" },
      { time: "21:30", label: "Acara selesai" },
      { time: "22:00", label: "Bongkar barang", crewNote: "Gelas dihitung ulang sebelum dimuat" },
    ],
    phaseIndex: 1,
  },
  {
    id: "ev-sekar-bima",
    couple: "Sekar & Bima",
    kind: "Akad Nikah",
    date: day(1),
    callTime: "04:30",
    startTime: "08:00",
    endTime: "11:00",
    guests: 150,
    theme: "Jawa klasik, gebyok",
    venue: {
      name: "Rumah Keluarga Sekar",
      address: "Jl. Cempaka Putih Tengah III No. 12, Jakarta Pusat",
      area: "Jakarta Pusat",
      loadingNote: "Gang sempit, truk parkir di jalan utama. Siapkan troli.",
      pic: { name: "Om Hadi (Keluarga)", phone: "081311110002" },
    },
    client: { name: "Bapak Sutrisno", relation: "Ayah mempelai wanita", phone: "081377770002" },
    notes: [
      "Akad di ruang tamu, kapasitas terbatas. Crew masuk seperlunya.",
      "Tenda dipasang vendor tenda H-1 sore.",
    ],
    assetCodes: [
      "DKR-GBG-01", "MJA-PJG-01", "KRS-TFC-01", "DKR-LTN-01", "LIN-NPK-01",
      "PRP-BKT-01", "PRP-CND-01", "SND-SPK-01", "SND-MIC-01", "SND-CBL-01",
    ],
    crew: [
      { personId: "p11", duty: "Koordinator lapangan", lead: true },
      { personId: "p01", duty: "Logistik & scan barang" },
      { personId: "p12", duty: "Dekor gebyok" },
      { personId: "p07", duty: "Florist" },
      { personId: "p13", duty: "Sound" },
      { personId: "p09", duty: "Pick up" },
      { personId: "p14", duty: "Runner keluarga" },
      { personId: "v03", duty: "MUA" },
      { personId: "v02", duty: "Foto & video" },
    ],
    rundown: [
      { time: "04:30", label: "Crew kumpul di gudang" },
      { time: "05:15", label: "Berangkat ke lokasi" },
      { time: "06:00", label: "Setup gebyok & kursi" },
      { time: "07:30", label: "Setup selesai" },
      { time: "08:00", label: "Akad nikah dimulai" },
      { time: "09:30", label: "Sungkeman & foto keluarga" },
      { time: "11:00", label: "Acara selesai, bongkar" },
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
    theme: "Rustic, lentera & kayu",
    venue: {
      name: "Kebun Kopi Lembang",
      address: "Jl. Raya Lembang KM 7, Bandung Barat",
      area: "Lembang",
      loadingNote: "Jalan menanjak, truk kecil saja. Area outdoor, siapkan plastik cover.",
      pic: { name: "Teh Nisa (Venue)", phone: "081311110003" },
    },
    client: { name: "Laras", relation: "Mempelai wanita", phone: "081377770003" },
    notes: ["Prakiraan hujan sore. Siapkan plan B ke pendopo."],
    assetCodes: [
      "MJA-PJG-01", "KRS-TFC-01", "DKR-LTN-01", "LGT-FRY-01", "LIN-RNR-01",
      "LIN-NPK-01", "TBW-GLS-02", "TBW-CTL-01", "PRP-CND-01", "PRP-SGN-01",
    ],
    crew: [
      { personId: "p02", duty: "Koordinator lapangan", lead: true },
      { personId: "p01", duty: "Logistik & scan barang" },
      { personId: "p05", duty: "Dekor" },
      { personId: "p07", duty: "Florist" },
      { personId: "p13", duty: "Lighting" },
      { personId: "p08", duty: "Truk engkel" },
    ],
    rundown: [
      { time: "10:00", label: "Crew kumpul" },
      { time: "12:00", label: "Setup" },
      { time: "16:00", label: "Pemberkatan" },
      { time: "17:30", label: "Dinner" },
      { time: "20:00", label: "Selesai" },
    ],
    phaseIndex: 0,
  },
  {
    id: "ev-anisa-farhan",
    couple: "Anisa & Farhan",
    kind: "Akad & Resepsi",
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
      loadingNote: "Loading via basement 2, tinggi maks truk 3,2 m.",
      pic: { name: "Mas Reza (Banquet)", phone: "081311110004" },
    },
    client: { name: "Ibu Ratna", relation: "Ibu mempelai pria", phone: "081377770004" },
    notes: ["Venue minta crew pakai ID card sepanjang acara."],
    assetCodes: [
      "KRS-TFG-01", "KRS-TFG-02", "MJA-RND-01", "MJA-RND-02", "SFA-PLM-01",
      "DKR-BKD-01", "DKR-KRP-01", "LGT-CHD-01", "LGT-PAR-01", "LGT-DMX-01",
      "SND-MXR-01", "LIN-TBC-01", "LIN-CHS-01", "TBW-CHG-01", "TBW-GLS-01", "TBW-GLS-02",
    ],
    crew: [
      { personId: "p11", duty: "Koordinator lapangan", lead: true },
      { personId: "p02", duty: "Koordinator keluarga" },
      { personId: "p01", duty: "Logistik & scan barang" },
      { personId: "p03", duty: "Logistik" },
      { personId: "p04", duty: "Dekor" },
      { personId: "p12", duty: "Dekor" },
      { personId: "p06", duty: "Lighting" },
      { personId: "p13", duty: "Sound" },
      { personId: "p08", duty: "Truk 1" },
      { personId: "p09", duty: "Truk 2" },
    ],
    rundown: [
      { time: "05:00", label: "Crew kumpul" },
      { time: "09:00", label: "Akad nikah" },
      { time: "11:00", label: "Resepsi" },
      { time: "14:00", label: "Selesai" },
    ],
    phaseIndex: 0,
  },
  {
    id: "ev-putri-gilang",
    couple: "Putri & Gilang",
    kind: "Resepsi",
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
      loadingNote: "Parkir truk di belakang aula.",
      pic: { name: "Pak Imam (Venue)", phone: "081311110005" },
    },
    client: { name: "Putri", relation: "Mempelai wanita", phone: "081377770005" },
    notes: ["Barang kembali ke gudang pagi ini, scan masuk gudang belum selesai."],
    assetCodes: [
      "KRS-TFC-01", "MJA-RND-01", "DKR-BKD-01", "DKR-LTN-01", "LGT-PAR-01",
      "SND-MXR-01", "SND-CBL-01", "LIN-CHS-01", "TBW-CHG-01", "PRP-VAS-01",
    ],
    crew: [
      { personId: "p11", duty: "Koordinator lapangan", lead: true },
      { personId: "p01", duty: "Logistik & scan barang" },
      { personId: "p03", duty: "Logistik" },
      { personId: "p12", duty: "Dekor" },
      { personId: "p06", duty: "Sound & lighting" },
      { personId: "p09", duty: "Truk" },
    ],
    rundown: [
      { time: "08:00", label: "Crew kumpul" },
      { time: "19:00", label: "Resepsi" },
      { time: "22:00", label: "Selesai, bongkar" },
    ],
    phaseIndex: 5,
  },
  {
    id: "ev-dewi-yoga",
    couple: "Dewi & Yoga",
    kind: "Resepsi",
    date: day(-6),
    callTime: "07:00",
    startTime: "11:00",
    endTime: "14:00",
    guests: 500,
    theme: "Batik modern",
    venue: {
      name: "Gedung Wanita Melati",
      address: "Jl. Pemuda No. 5, Jakarta Timur",
      area: "Jakarta Timur",
      loadingNote: "—",
      pic: { name: "Bu Asih (Venue)", phone: "081311110006" },
    },
    client: { name: "Dewi", relation: "Mempelai wanita", phone: "081377770006" },
    notes: [],
    assetCodes: ["KRS-TFG-01", "MJA-RND-02", "DKR-GBG-01", "SND-SPK-01", "LIN-TBC-01", "TBW-CTL-01"],
    crew: [
      { personId: "p02", duty: "Koordinator lapangan", lead: true },
      { personId: "p01", duty: "Logistik & scan barang" },
      { personId: "p04", duty: "Dekor" },
      { personId: "p08", duty: "Truk" },
    ],
    rundown: [
      { time: "07:00", label: "Crew kumpul" },
      { time: "11:00", label: "Resepsi" },
      { time: "14:00", label: "Selesai" },
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
      return [code, { at: at(offset, t), by }]
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
    severity: "Sedang",
    title: "Listrik venue belum menyala di area taman",
    description:
      "Panel listrik area taman belum dinyalakan pihak venue. Sound & lighting belum bisa test. Sudah info ke Pak Darto, katanya teknisi datang jam 11.",
    photos: [],
    status: "Diproses",
    createdAt: at(0, "09:20"),
    by: "p01",
    updates: [
      { at: at(0, "09:26"), by: "p02", text: "Oke, saya follow up ke manajemen venue. Sementara pakai genset kecil untuk test." },
    ],
  },
  {
    id: "RPT-0141",
    eventId: "ev-putri-gilang",
    kind: "damage",
    category: "Rusak ringan",
    assetCode: "DKR-BKD-01",
    phase: "load_in",
    severity: "Rendah",
    title: "Panel backdrop 2 sobek di sudut",
    description: "Sobek kira-kira 5 cm di sudut kanan bawah, kena sudut troli saat bongkar.",
    photos: [],
    status: "Terbuka",
    createdAt: at(-1, "22:35"),
    by: "p03",
    updates: [],
  },
  {
    id: "RPT-0139",
    eventId: "ev-putri-gilang",
    kind: "damage",
    category: "Hilang",
    assetCode: "PRP-VAS-01",
    phase: "load_in",
    severity: "Sedang",
    title: "Vas kaca kurang 2 pcs",
    description: "Dihitung saat bongkar hanya 8 dari 10. Sudah cek ke area catering, belum ketemu.",
    photos: [],
    status: "Diproses",
    createdAt: at(-1, "22:40"),
    by: "p01",
    updates: [
      { at: at(0, "08:10"), by: "p11", text: "Sudah konfirmasi ke venue, 1 pcs ditemukan di gudang aula. Diambil siang ini." },
    ],
  },
  {
    id: "RPT-0131",
    eventId: "ev-dewi-yoga",
    kind: "issue",
    category: "Transport",
    phase: "load_out",
    severity: "Tinggi",
    title: "Truk 1 ban bocor di tol",
    description: "Ban belakang kiri bocor di KM 12. Menunggu derek, estimasi telat 45 menit.",
    photos: [],
    status: "Selesai",
    createdAt: at(-6, "07:50"),
    by: "p08",
    updates: [
      { at: at(-6, "07:55"), by: "p02", text: "Truk cadangan dikirim dari gudang." },
      { at: at(-6, "08:40"), by: "p02", text: "Barang sudah dipindah ke truk cadangan, lanjut jalan." },
    ],
  },
]
