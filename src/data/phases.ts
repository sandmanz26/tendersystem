import type { Phase } from "./types"

export const PHASES: Phase[] = [
  {
    key: "load_out",
    label: "Muat di Gudang",
    short: "Muat",
    requiresScan: true,
    hint: "Scan setiap barang saat naik ke truk.",
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
    hint: "Pasang dekor sesuai layout. Tandai selesai setelah dicek koordinator.",
  },
  {
    key: "show",
    label: "Acara Berlangsung",
    short: "Acara",
    requiresScan: false,
    hint: "Standby sesuai rundown. Tandai selesai setelah tamu terakhir pulang.",
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
  },
]
