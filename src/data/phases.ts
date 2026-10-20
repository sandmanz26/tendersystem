import type { Phase } from "./types"

export const PHASES: Phase[] = [
  {
    key: "load_out",
    label: "Muat di Gudang",
    short: "Muat",
    requiresScan: true,
    hint: "Scan setiap barang saat naik ke truk.",
    handover: { party: "Admin gudang", hint: "Admin gudang menandatangani barang yang keluar." },
  },
  {
    key: "arrive",
    label: "Tiba di Venue",
    short: "Tiba",
    requiresScan: true,
    hint: "Scan saat barang diturunkan di venue.",
  },
  {
    key: "setup",
    label: "Setup & Dekor",
    short: "Setup",
    requiresScan: false,
    hint: "Selesaikan checklist setup sebelum lanjut.",
    tasks: [
      "Layout meja & kursi sesuai denah",
      "Pelaminan dan backdrop terpasang kokoh",
      "Sound & lighting sudah dites",
      "Kabel dirapikan dan diberi lakban",
      "Area tamu bersih dari kardus & plastik",
      "Foto hasil setup dikirim ke koordinator",
    ],
  },
  {
    key: "show",
    label: "Acara Berlangsung",
    short: "Acara",
    requiresScan: false,
    hint: "Standby sesuai rundown.",
    tasks: [
      "Semua crew standby di pos masing-masing",
      "Barang fragile dicek ulang setelah acara",
      "Tamu terakhir sudah meninggalkan venue",
    ],
  },
  {
    key: "load_in",
    label: "Bongkar & Muat",
    short: "Bongkar",
    requiresScan: true,
    hint: "Scan setiap barang saat dimuat kembali ke truk.",
  },
  {
    key: "return",
    label: "Kembali di Gudang",
    short: "Gudang",
    requiresScan: true,
    hint: "Scan saat barang masuk gudang. Barang rusak langsung dilaporkan.",
    handover: { party: "Admin gudang", hint: "Admin gudang menandatangani barang yang diterima kembali." },
  },
]

/** The scan phase before `index`, used to spot items that skipped a checkpoint. */
export function previousScanPhase(index: number) {
  for (let i = index - 1; i >= 0; i--) if (PHASES[i].requiresScan) return PHASES[i]
  return undefined
}
