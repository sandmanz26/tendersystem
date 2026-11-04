import { Platform } from "react-native"

/*
 * Design tokens taken from the EMI web app (src/style.css :root) so the two
 * apps read as one product: indigo for navigation and stage moves, green for
 * "save / received" actions, hairline borders, no shadows at rest.
 */
export const color = {
  ground: "#f6f8fb",
  surface: "#ffffff",
  raised: "#f1f3f8",
  ink: "#111827",
  ink2: "#374151",
  muted: "#5b6472",
  faint: "#9ca3af",
  border: "#e4e7ef",
  rule: "#eff0f6",
  control: "#d5d9e3",
  brand: "#4f46e5",
  brandDark: "#4338ca",
  brandSoft: "#eef2ff",
  brandInk: "#3730a3",
  green: "#059669",
  greenSoft: "#ecfdf5",
  greenInk: "#065f46",
  red: "#dc2626",
  redSoft: "#fef2f2",
  redInk: "#991b1b",
  orange: "#ea580c",
  orangeSoft: "#fff7ed",
  orangeInk: "#9a3412",
  purple: "#7c3aed",
  purpleSoft: "#f5f3ff",
  purpleInk: "#5b21b6",
  dark: "#0f1115",
  darkSurface: "#1a1d24",
} as const

export const radius = { control: 7, card: 11, sheet: 14 } as const

/** Sizes in points; nothing below 12. */
export const font = {
  title: 24,
  heading: 18,
  body: 15,
  small: 14,
  meta: 13,
  tiny: 12,
  figure: 28,
} as const

export const tabular = { fontVariant: ["tabular-nums" as const] }

/** SKUs and codes only. iOS has no generic "monospace" family. */
export const mono = Platform.select({ ios: "Menlo", default: "monospace" })
