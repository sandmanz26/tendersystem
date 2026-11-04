import { Check, ChevronLeft, ChevronRight, CloudOff, Package as Box, RefreshCw, TriangleAlert } from "lucide-react-native"
import * as React from "react"
import { Pressable, Text as RNText, View, type StyleProp, type ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { fmtNum } from "../core/format"
import { CLOSING_LABEL, isWaiting, minStatus, pipeline, type ClosingTab, type ScanMode } from "../core/rules"
import type { EventLine, MinStatus, Ownership, Stage } from "../core/types"
import { useAppStore } from "../store"
import { color, font, mono, radius, tabular } from "../theme"
import { Tag, Text, type Tone } from "./primitives"

/* ---------- Stage track: the event's pipeline at a glance ---------- */

/**
 * One segment per pipeline stage, labelled with the stage code (CBA, OPI…).
 * Done = solid, current = indigo with a ring, ahead = empty. Scan stages get
 * a notch so the crew sees where scanning sits.
 */
export function StageTrack({ stages, current, style }: { stages: Stage[]; current: string; style?: StyleProp<ViewStyle> }) {
  const steps = pipeline(stages)
  const idx = steps.findIndex((s) => s.status === current)
  return (
    <View style={style} accessibilityLabel={`Stage ${idx + 1} of ${steps.length}: ${current}`}>
      <View style={{ flexDirection: "row", gap: 3 }}>
        {steps.map((s, i) => (
          <View key={s.id} style={{ flex: 1, gap: 5 }}>
            <View
              style={{
                height: 6,
                borderRadius: 2,
                backgroundColor: i < idx ? color.brand : i === idx ? color.brand : color.raised,
                opacity: i < idx ? 0.45 : 1,
              }}
            />
            <RNText
              style={[
                { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.4, color: i === idx ? color.brandInk : i < idx ? color.muted : color.faint, fontFamily: mono },
              ]}
            >
              {s.code}
              {s.scan === "Scan" ? "·" : ""}
            </RNText>
          </View>
        ))}
      </View>
    </View>
  )
}

/* ---------- Tags ---------- */

export const CLOSING_TONE: Record<ClosingTab, Tone> = {
  upcoming: "neutral",
  "on-going": "green",
  "ready-to-close": "orange",
  "checking-inventory": "brand",
  "returned-completed": "green",
  transferred: "purple",
}

export const ClosingTag = ({ tab }: { tab: ClosingTab }) => <Tag label={CLOSING_LABEL[tab]} tone={CLOSING_TONE[tab]} />

const OWNERSHIP_TONE: Record<Ownership, Tone> = { IHC: "outline", IHP: "purple", Outsource: "orange" }
export const OwnershipTag = ({ o }: { o: Ownership }) => <Tag label={o} tone={OWNERSHIP_TONE[o]} />

const MIN_TONE: Record<MinStatus, Tone> = { "Not Set": "neutral", Safe: "green", Warning: "orange", Critical: "red" }
export const MinTag = ({ stock, min }: { stock: number; min: number }) => {
  const s = minStatus(stock, min)
  return <Tag label={s} tone={MIN_TONE[s]} />
}

/** Where a line came from, when it isn't plain warehouse stock. */
export function originOf(l: EventLine): { label: string; tone: Tone } | null {
  if (l.fromLoan) return { label: "Rented", tone: "orange" }
  if (l.fromOutsource) return { label: "Outsourced", tone: "orange" }
  if (l.fromProduction) return { label: "Production", tone: "purple" }
  if (l.fromConvert) return { label: "Converted", tone: "purple" }
  return null
}

/* ---------- Scan mark: two small boxes, IN and OUT ---------- */

function Mark({ on, label, active }: { on: boolean; label: string; active: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        paddingHorizontal: 4,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: on ? color.green : active ? color.brand : color.border,
        backgroundColor: on ? color.greenSoft : color.surface,
        borderStyle: on || active ? "solid" : "dashed",
      }}
    >
      {on && <Check size={10} color={color.greenInk} strokeWidth={3} />}
      <RNText style={{ fontSize: 10, fontWeight: "700", color: on ? color.greenInk : active ? color.brandInk : color.faint, letterSpacing: 0.3 }}>{label}</RNText>
    </View>
  )
}

export function ScanMarks({ line, mode }: { line: EventLine; mode: ScanMode | null }) {
  return (
    <View style={{ flexDirection: "row", gap: 3 }} accessibilityLabel={`Scan in ${line.scanIn ? "done" : "pending"}, scan out ${line.scanOut ? "done" : "pending"}`}>
      <Mark on={!!line.scanIn} label="IN" active={mode === "in"} />
      <Mark on={!!line.scanOut} label="OUT" active={mode === "out"} />
    </View>
  )
}

/* ---------- Line row ---------- */

export function LineRow({
  line,
  unit,
  mode,
  onPress,
  right,
  boxName,
}: {
  line: EventLine
  unit?: string
  mode: ScanMode | null
  onPress?: () => void
  right?: React.ReactNode
  boxName?: string
}) {
  const origin = originOf(line)
  const waiting = mode ? isWaiting(line, mode) : false
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 11 }, pressed && onPress && { backgroundColor: color.raised }]}
    >
      {/* Qty first: what the crew counts. */}
      <View style={{ width: 44, alignItems: "flex-end" }}>
        <Text style={[{ fontSize: 17, fontWeight: "700", color: waiting ? color.ink : color.ink2 }, tabular]}>{fmtNum(line.qty)}</Text>
        <Text variant="tiny" numberOfLines={1}>
          {unit ?? "pcs"}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text variant="strong" numberOfLines={1} style={{ fontSize: 15 }}>
          {line.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {/* A rented/outsourced line is Outsource by definition: show where it came from instead. */}
          {line.ownership !== "IHC" && !origin && <OwnershipTag o={line.ownership} />}
          {origin && <Tag label={origin.label} tone={origin.tone} />}
          {(line.brokenQty ?? 0) > 0 && <Tag label={`Broken item · ${line.brokenQty}`} tone="red" icon={TriangleAlert} />}
          {line.stockReturned && <Tag label="Stock returned" tone="green" />}
          {line.resolution === "returned" && <Tag label="Returned" tone="green" />}
          {boxName && <Tag label={boxName} tone="neutral" icon={Box} />}
          <Text variant="tiny" numberOfLines={1} style={{ flexShrink: 1 }}>
            {[line.subArea, line.pic].filter(Boolean).join(" · ")}
          </Text>
        </View>
      </View>
      {right ?? <ScanMarks line={line} mode={mode} />}
      {onPress && <ChevronRight size={16} color={color.faint} />}
    </Pressable>
  )
}

/** Thin bar: share of lines done for the current scan. */
export function ScanBar({ done, total, dark, style }: { done: number; total: number; dark?: boolean; style?: StyleProp<ViewStyle> }) {
  const pct = total ? done / total : 0
  return (
    <View style={[{ height: 4, borderRadius: 2, backgroundColor: dark ? "rgba(255,255,255,0.14)" : color.raised, overflow: "hidden" }, style]}>
      <View style={{ width: `${pct * 100}%`, height: "100%", backgroundColor: pct === 1 ? color.green : dark ? "#818cf8" : color.brand }} />
    </View>
  )
}

/* ---------- Header and sync status ---------- */

export function SyncStatus({ dark }: { dark?: boolean }) {
  const { online, outbox } = useAppStore()
  const n = outbox.length
  if (online && n === 0) return null
  const fg = online ? (dark ? "#c7d2fe" : color.brandInk) : dark ? "#fdba74" : color.orangeInk
  const bg = online ? (dark ? "rgba(255,255,255,0.08)" : color.brandSoft) : dark ? "#3a2410" : color.orangeSoft
  const Icon = online ? RefreshCw : CloudOff
  return (
    <View accessibilityRole="alert" style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: bg, paddingHorizontal: 16, paddingVertical: 7 }}>
      <Icon size={13} color={fg} />
      <RNText style={{ color: fg, fontSize: font.meta, fontWeight: "600" }}>
        {online ? `Sending ${n}…` : n > 0 ? `Offline · ${n} waiting to send` : "Offline · changes are kept on this phone"}
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
    <View style={{ backgroundColor: large ? color.ground : color.surface, paddingTop: insets.top, borderBottomWidth: large ? 0 : 1, borderBottomColor: color.border }}>
      <SyncStatus />
      {large ? (
        <View style={{ flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 12 }}>
          <View style={{ flex: 1 }}>
            {subtitle && (
              <Text variant="label" style={{ marginBottom: 2 }}>
                {subtitle.toUpperCase()}
              </Text>
            )}
            <Text variant="title" accessibilityRole="header">
              {title}
            </Text>
          </View>
          {right}
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", height: 54, paddingHorizontal: 6, gap: 4 }}>
          {onBack && (
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} hitSlop={8} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={24} color={color.ink} />
            </Pressable>
          )}
          <View style={{ flex: 1, minWidth: 0, paddingLeft: onBack ? 0 : 10 }}>
            <Text variant="strong" numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            {subtitle && (
              <Text variant="tiny" numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
          {right}
        </View>
      )}
    </View>
  )
}

export function IconButton({ icon: Icon, label, onPress, tone = "light" }: { icon: typeof Check; label: string; onPress?: () => void; tone?: "light" | "dark" }) {
  const dark = tone === "dark"
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        { width: 40, height: 40, borderRadius: radius.control, alignItems: "center", justifyContent: "center" },
        dark ? { borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" } : { backgroundColor: color.raised },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Icon size={18} color={dark ? "#fff" : color.ink} strokeWidth={2} />
    </Pressable>
  )
}

/** "SKU-001" in a quiet mono chip. */
export const Sku = ({ code }: { code: string }) => <RNText style={{ fontFamily: mono, fontSize: 12, color: color.muted }}>{code}</RNText>
