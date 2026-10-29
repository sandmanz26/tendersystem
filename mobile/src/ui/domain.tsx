import {
  Armchair,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Flower2,
  Lamp,
  MessageCircle,
  PackageX,
  Phone,
  RefreshCw,
  Shirt,
  Sparkles,
  Speaker,
  TriangleAlert,
  Wine,
  type LucideIcon,
} from "lucide-react-native"
import * as React from "react"
import { Linking, Pressable, StyleSheet, Text as RNText, View, type StyleProp, type ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg"

import { initials, timeAgo, waLink } from "../core/format"
import { PHASES } from "../core/phases"
import type { PhaseProgress } from "../core/progress"
import type { AssetCategory, Person, Report, ReportStatus, Severity } from "../core/types"
import { useAppStore } from "../store"
import { color, font, radius, tabular } from "../theme"
import { Badge, Text, type BadgeVariant } from "./primitives"

/* ---------- Manifest grid: the product's own element ---------- */

type CellState = "scanned" | "flagged" | "reported" | "pending"

/**
 * One cell per manifest line (a pallet, a crate, a set). Filled when scanned,
 * hatched when reported, amber when it skipped a checkpoint, empty while pending.
 */
export function ManifestGrid({
  progress,
  codes,
  dark,
  legend = true,
  cellHeight = 24,
  style,
}: {
  progress: PhaseProgress
  codes: string[]
  dark?: boolean
  legend?: boolean
  cellHeight?: number
  style?: StyleProp<ViewStyle>
}) {
  const cells: CellState[] = codes.map((code) => {
    const st = progress.byAsset[code]
    if (st.state === "scanned") return progress.flagged.includes(code) ? "flagged" : "scanned"
    if (st.state === "reported") return "reported"
    return "pending"
  })
  const count = (s: CellState) => cells.filter((c) => c === s).length
  const done = count("scanned") + count("flagged")
  return (
    <View style={style}>
      <View
        style={{ flexDirection: "row", gap: 3 }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${done} scanned, ${count("reported")} reported, ${count("pending")} to scan`}
      >
        {cells.map((s, i) => (
          <Cell key={codes[i]} state={s} dark={dark} style={{ flex: 1, height: cellHeight }} />
        ))}
      </View>
      {legend && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 4, marginTop: 8 }}>
          <Key state="scanned" dark={dark} label={`${done} done`} />
          {count("reported") > 0 && <Key state="reported" dark={dark} label={`${count("reported")} reported`} />}
          {count("flagged") > 0 && <Key state="flagged" dark={dark} label={`${count("flagged")} flagged`} />}
          <Key state="pending" dark={dark} label={`${count("pending")} left`} />
        </View>
      )}
    </View>
  )
}

function Key({ state, dark, label }: { state: CellState; dark?: boolean; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Cell state={state} dark={dark} style={{ width: 12, height: 12 }} />
      <RNText style={{ fontSize: font.meta, color: dark ? "rgba(255,255,255,0.75)" : color.muted, ...tabular }}>{label}</RNText>
    </View>
  )
}

function Cell({ state, dark, style }: { state: CellState; dark?: boolean; style: ViewStyle }) {
  const hue = dark ? color.brandOnDark : color.brand
  const base: ViewStyle = { borderRadius: 2, overflow: "hidden" }
  if (state === "scanned") return <View style={[base, style, { backgroundColor: hue }]} />
  if (state === "flagged") return <View style={[base, style, { backgroundColor: color.amber }]} />
  if (state === "pending")
    return (
      <View
        style={[base, style, { borderWidth: 1, borderColor: dark ? "rgba(255,255,255,0.3)" : color.control, backgroundColor: dark ? "transparent" : color.surface }]}
      />
    )
  return (
    <View style={[base, style, { borderWidth: 1, borderColor: hue }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="hatch" width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Line x1={0} y1={0} x2={0} y2={4} stroke={hue} strokeWidth={1.5} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#hatch)" />
      </Svg>
    </View>
  )
}

/* ---------- Phase track ---------- */

export function PhaseTrack({ index, dark, labels = true, style }: { index: number; dark?: boolean; labels?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: "row", gap: 4 }, style]} accessibilityLabel={`Phase ${Math.min(index + 1, PHASES.length)} of ${PHASES.length}`}>
      {PHASES.map((p, i) => {
        const done = i < index
        const current = i === index
        return (
          <View key={p.key} style={{ flex: 1, gap: 6 }}>
            <View style={{ height: 6, borderRadius: 2, backgroundColor: dark ? "rgba(255,255,255,0.15)" : "#ebe4e7", overflow: "hidden" }}>
              <View
                style={{
                  height: "100%",
                  width: done ? "100%" : current ? "50%" : "0%",
                  backgroundColor: dark ? color.brandOnDark : color.brand,
                }}
              />
            </View>
            {labels && (
              <RNText
                numberOfLines={1}
                style={{
                  fontSize: font.tiny,
                  color: current ? (dark ? "#fff" : color.ink) : dark ? "rgba(255,255,255,0.7)" : color.muted,
                  fontWeight: current ? "600" : "400",
                }}
              >
                {p.short}
              </RNText>
            )}
          </View>
        )
      })}
    </View>
  )
}

/* ---------- Category icon: one grey outline set ---------- */

const CATEGORY_ICONS: Record<AssetCategory, LucideIcon> = {
  Furniture: Armchair,
  Decor: Sparkles,
  Lighting: Lamp,
  Sound: Speaker,
  Linen: Shirt,
  Tableware: Wine,
  "Flowers & Props": Flower2,
}

export function CategoryIcon({ category, size = 18 }: { category: AssetCategory; size?: number }) {
  const Icon = CATEGORY_ICONS[category]
  return <Icon size={size} color={color.muted} strokeWidth={1.6} />
}

/* ---------- People ---------- */

const TONES = [
  ["#e3f1e8", "#2f5e43"],
  ["#f6e8da", "#7a4a1f"],
  ["#e4ebf5", "#33496b"],
  ["#f3efd6", "#6b5c1d"],
  ["#f6e1e3", "#7a2e38"],
]

export function Avatar({ person, size = 40 }: { person: Person; size?: number }) {
  const [bg, fg] = TONES[Number(person.id.replace(/\D/g, "") || 0) % TONES.length]
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <RNText style={{ color: fg, fontWeight: "600", fontSize: size * 0.32 }}>{initials(person.name)}</RNText>
    </View>
  )
}

export function PersonRow({ person, detail, badge, isYou }: { person: Person; detail?: string; badge?: React.ReactNode; isYou?: boolean }) {
  return (
    <View style={styles.row}>
      <Avatar person={person} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text variant="strong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {person.name}
          </Text>
          {isYou && <Text variant="meta">(you)</Text>}
          {badge}
        </View>
        <Text variant="meta" numberOfLines={1}>
          {detail ?? person.role}
          {person.company ? ` · ${person.company}` : ""}
        </Text>
      </View>
      {!isYou && (
        <View style={{ flexDirection: "row", gap: 6 }}>
          <IconButton icon={MessageCircle} label={`WhatsApp ${person.name}`} onPress={() => Linking.openURL(waLink(person.phone)).catch(() => {})} />
          <IconButton icon={Phone} label={`Call ${person.name}`} onPress={() => Linking.openURL(`tel:${person.phone}`).catch(() => {})} />
        </View>
      )}
    </View>
  )
}

export function IconButton({ icon: Icon, label, onPress, tone = "light" }: { icon: LucideIcon; label: string; onPress?: () => void; tone?: "light" | "dark" }) {
  const dark = tone === "dark"
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        { width: 40, height: 40, borderRadius: radius.control, alignItems: "center", justifyContent: "center" },
        dark ? { borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" } : { backgroundColor: color.raised },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Icon size={18} color={dark ? "#fff" : color.ink} strokeWidth={1.75} />
    </Pressable>
  )
}

/* ---------- Reports ---------- */

/* Open needs someone's attention (the hue's tint); red is kept for failures. */
export const STATUS_VARIANT: Record<ReportStatus, BadgeVariant> = {
  Open: "accent",
  "In progress": "warning",
  Resolved: "neutral",
}

export const SEVERITY_DOT: Record<Severity, string> = {
  Low: color.faint,
  Medium: color.warning,
  High: color.negative,
}

export function ReportRow({ report, eventName, onPress }: { report: Report; eventName?: string; onPress: () => void }) {
  const Icon = report.kind === "damage" ? PackageX : TriangleAlert
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, { alignItems: "flex-start" }, pressed && { backgroundColor: color.raised }]}>
      <Icon size={18} color={report.kind === "damage" ? color.warning : color.muted} strokeWidth={1.6} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          <Text variant="strong" style={{ flex: 1, fontSize: 15 }} numberOfLines={2}>
            {report.title}
          </Text>
          <Badge label={report.status} variant={STATUS_VARIANT[report.status]} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: report.status === "Resolved" ? color.faint : SEVERITY_DOT[report.severity] }} />
          <Text variant="meta" numberOfLines={1} style={{ flexShrink: 1 }}>
            {report.category}
            {eventName ? ` · ${eventName}` : ""} · {timeAgo(report.createdAt)}
          </Text>
          {report.synced === false && <CloudOff size={12} color={color.warning} />}
        </View>
      </View>
      <ChevronRight size={16} color={color.muted} style={{ marginTop: 2 }} />
    </Pressable>
  )
}

/* ---------- Header and sync status ---------- */

export function SyncStatus({ dark }: { dark?: boolean }) {
  const { online, pendingSync } = useAppStore()
  if (online && pendingSync === 0) return null
  const fg = online ? (dark ? "#fff" : color.brandInk) : dark ? "#fcd34d" : color.pillWarningInk
  const bg = online ? (dark ? "rgba(255,255,255,0.1)" : color.brandSoft) : dark ? "#3a2a10" : color.pillWarningBg
  const Icon = online ? RefreshCw : CloudOff
  return (
    <View accessibilityRole="alert" style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: bg, paddingHorizontal: 16, paddingVertical: 8 }}>
      <Icon size={14} color={fg} />
      <RNText style={{ color: fg, fontSize: font.meta, fontWeight: "500" }}>
        {online ? `Syncing ${pendingSync}…` : pendingSync > 0 ? `Offline · ${pendingSync} queued on this phone` : "Offline · still works, saves on this phone"}
      </RNText>
    </View>
  )
}

/** Screen header: large title for tab roots, compact bar with back for pushed screens. */
export function Header({
  title,
  subtitle,
  onBack,
  right,
  large,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  right?: React.ReactNode
  large?: boolean
}) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ backgroundColor: color.ground, paddingTop: insets.top, borderBottomWidth: large ? 0 : 1, borderBottomColor: color.border }}>
      <SyncStatus />
      {large ? (
        <View style={{ flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, gap: 12 }}>
          <View style={{ flex: 1 }}>
            {subtitle && <Text variant="small" muted>{subtitle}</Text>}
            <Text variant="title" accessibilityRole="header">
              {title}
            </Text>
          </View>
          {right}
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", height: 56, paddingHorizontal: 8, gap: 4 }}>
          {onBack && (
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={24} color={color.ink} />
            </Pressable>
          )}
          <View style={{ flex: 1, minWidth: 0, paddingLeft: onBack ? 0 : 8 }}>
            <Text variant="strong" numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            {subtitle && <Text variant="meta" numberOfLines={1}>{subtitle}</Text>}
          </View>
          {right}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
})
