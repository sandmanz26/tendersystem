import { Platform } from "react-native"

/*
 * Design tokens, carried over from the web prototype (taste-skill
 * "accent-ladder"): one raspberry hue on small marks, its pale tints on
 * areas, 1px borders instead of shadows, 8px cards and 6px controls.
 */
export const color = {
  ground: "#fbf7f8",
  surface: "#ffffff",
  raised: "#f3f4f6",
  ink: "#111827",
  muted: "#5f6672",
  faint: "#9ca3af",
  border: "#e5e7eb",
  rule: "#f2f2f2",
  control: "#d1d5db",
  brand: "#b8336a",
  brandSoft: "#fdf2f7",
  brandTrack: "#f8dbe8",
  brandInk: "#6b1d3e",
  brandOnDark: "#f07aa8",
  positive: "#247b50",
  negative: "#c4242a",
  warning: "#92400e",
  amber: "#d97706",
  pillWarningBg: "#fffbeb",
  pillWarningInk: "#92400e",
  pillWarningBorder: "#fde68a",
  pillPositiveBg: "#dcfce7",
  pillPositiveInk: "#14532d",
  pillNegativeBg: "#ffedea",
  pillNegativeInk: "#831c1e",
  dark: "#111111",
  darkSurface: "#1c1c1e",
} as const

export const radius = { card: 8, control: 6, chip: 4 } as const

export const space = { gutter: 16, gap: 12 } as const

/** Sizes in points; nothing below 12. */
export const font = {
  title: 24,
  heading: 18,
  body: 15,
  small: 14,
  meta: 13,
  tiny: 12,
  figure: 36,
} as const

export const tabular = { fontVariant: ["tabular-nums" as const] }

/** Asset codes only. iOS has no generic "monospace" family. */
export const mono = Platform.select({ ios: "Menlo", default: "monospace" })
