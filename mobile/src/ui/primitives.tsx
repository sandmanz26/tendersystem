import type { LucideIcon } from "lucide-react-native"
import { Minus, Plus } from "lucide-react-native"
import * as React from "react"
import {
  Pressable,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native"

import { color, font, radius, tabular } from "../theme"

/* ---------- Text ---------- */

type TextVariant = "title" | "heading" | "body" | "strong" | "small" | "meta" | "tiny" | "figure" | "label"

export function Text({ variant = "body", muted, style, ...props }: TextProps & { variant?: TextVariant; muted?: boolean }) {
  return <RNText {...props} style={[textStyles[variant], muted && { color: color.muted }, style]} />
}

const textStyles = StyleSheet.create({
  title: { fontSize: font.title, fontWeight: "700", color: color.ink, letterSpacing: -0.4 },
  heading: { fontSize: font.heading, fontWeight: "600", color: color.ink, letterSpacing: -0.2 },
  body: { fontSize: font.body, color: color.ink, lineHeight: 21 },
  strong: { fontSize: font.body, fontWeight: "600", color: color.ink },
  small: { fontSize: font.small, color: color.ink2, lineHeight: 20 },
  meta: { fontSize: font.meta, color: color.muted, lineHeight: 18 },
  tiny: { fontSize: font.tiny, color: color.muted },
  figure: { fontSize: font.figure, fontWeight: "600", color: color.ink, letterSpacing: -0.6, ...tabular },
  // Field labels and table heads: small, heavy, a little tracked.
  label: { fontSize: font.tiny, fontWeight: "600", color: color.muted, letterSpacing: 0.3 },
})

/* ---------- Button ---------- */

type ButtonVariant = "primary" | "positive" | "outline" | "secondary" | "ghost" | "destructive"

export function Button({
  title,
  icon: Icon,
  variant = "primary",
  size = "md",
  disabled,
  onPress,
  style,
  accessibilityLabel,
}: {
  title?: string
  icon?: LucideIcon
  variant?: ButtonVariant
  size?: "sm" | "md" | "lg" | "icon"
  disabled?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}) {
  const v = disabled ? buttonVariants.disabled : buttonVariants[variant]
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        size === "sm" && { height: 36, paddingHorizontal: 12 },
        size === "lg" && { height: 50 },
        size === "icon" && { width: 44, paddingHorizontal: 0 },
        v.box,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {Icon && <Icon size={size === "sm" ? 16 : 18} color={v.fg} strokeWidth={2} />}
      {title ? <RNText style={[styles.buttonText, { color: v.fg }, size === "sm" && { fontSize: 14 }, size === "lg" && { fontSize: 16 }]}>{title}</RNText> : null}
    </Pressable>
  )
}

const buttonVariants: Record<ButtonVariant | "disabled", { box: ViewStyle; fg: string }> = {
  primary: { box: { backgroundColor: color.brand }, fg: "#fff" },
  positive: { box: { backgroundColor: color.green }, fg: "#fff" },
  outline: { box: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.control }, fg: color.ink },
  secondary: { box: { backgroundColor: color.raised }, fg: color.ink },
  ghost: { box: { backgroundColor: "transparent" }, fg: color.ink2 },
  destructive: { box: { backgroundColor: color.surface, borderWidth: 1, borderColor: "#f3c4c4" }, fg: color.red },
  // Disabled stays legible: a grey fill, not a faded colour.
  disabled: { box: { backgroundColor: color.raised }, fg: color.faint },
}

/* ---------- Tag (status pill) ---------- */

export type Tone = "neutral" | "brand" | "green" | "orange" | "red" | "purple" | "outline"

const TONES: Record<Tone, { bg: string; fg: string; border?: string }> = {
  neutral: { bg: color.raised, fg: color.ink2 },
  brand: { bg: color.brandSoft, fg: color.brandInk },
  green: { bg: color.greenSoft, fg: color.greenInk },
  orange: { bg: color.orangeSoft, fg: color.orangeInk },
  red: { bg: color.redSoft, fg: color.redInk },
  purple: { bg: color.purpleSoft, fg: color.purpleInk },
  outline: { bg: color.surface, fg: color.ink2, border: color.border },
}

export const toneColor = (t: Tone) => TONES[t]

export function Tag({ label, tone = "neutral", icon: Icon, style }: { label: string; tone?: Tone; icon?: LucideIcon; style?: StyleProp<ViewStyle> }) {
  const t = TONES[tone]
  return (
    <View style={[styles.tag, { backgroundColor: t.bg, borderColor: t.border ?? t.bg }, style]}>
      {Icon && <Icon size={12} color={t.fg} strokeWidth={2.2} />}
      <RNText style={[styles.tagText, { color: t.fg }]} numberOfLines={1}>
        {label}
      </RNText>
    </View>
  )
}

/* ---------- Surfaces ---------- */

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>
}

/** Bordered card whose children are rows split by a hairline. */
export function ListCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const rows = React.Children.toArray(children).filter(Boolean)
  return (
    <View style={[styles.card, { marginHorizontal: 16, overflow: "hidden" }, style]}>
      {rows.map((child, i) => (
        <View key={i} style={i > 0 && styles.rule}>
          {child}
        </View>
      ))}
    </View>
  )
}

export function Row({ children, style, ...props }: PressableProps & { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.row, pressed && props.onPress && { backgroundColor: color.raised }, style]}>
      {children}
    </Pressable>
  )
}

export function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <RNText style={styles.sectionText} accessibilityRole="header">
        {children}
      </RNText>
      {right}
    </View>
  )
}

export function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body?: string }) {
  return (
    <View style={styles.empty}>
      <Icon size={22} color={color.faint} strokeWidth={1.75} />
      <Text variant="strong" style={{ marginTop: 10, textAlign: "center" }}>
        {title}
      </Text>
      {body && (
        <Text variant="meta" style={{ marginTop: 4, textAlign: "center" }}>
          {body}
        </Text>
      )}
    </View>
  )
}

export function Callout({
  icon: Icon,
  tone = "orange",
  children,
  style,
}: {
  icon: LucideIcon
  tone?: "orange" | "brand" | "red" | "neutral" | "green"
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const t = TONES[tone]
  return (
    <View style={[styles.callout, { backgroundColor: t.bg }, style]}>
      <Icon size={16} color={t.fg} strokeWidth={2} style={{ marginTop: 2 }} />
      <RNText style={{ flex: 1, color: t.fg, fontSize: font.small, lineHeight: 20 }}>{children}</RNText>
    </View>
  )
}

/* ---------- Filters ---------- */

export function Chip({ label, count, selected, onPress }: { label: string; count?: number; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: !!selected }} onPress={onPress} style={[styles.chip, selected && styles.chipOn]}>
      <RNText style={[styles.chipText, selected && { color: "#fff" }]}>{label}</RNText>
      {count !== undefined && <RNText style={[styles.chipCount, selected && { color: "rgba(255,255,255,0.75)" }]}>{count}</RNText>}
    </Pressable>
  )
}

/** Two to four mutually exclusive options in one track. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  style,
}: {
  value: T
  options: { value: T; label: string; tone?: string }[]
  onChange: (v: T) => void
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View accessibilityRole="radiogroup" style={[styles.segTrack, style]}>
      {options.map((o) => {
        const on = o.value === value
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.value)}
            style={[styles.seg, on && styles.segOn]}
          >
            {o.tone && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: o.tone }} />}
            <RNText style={[styles.segText, on && { color: color.ink }]}>{o.label}</RNText>
          </Pressable>
        )
      })}
    </View>
  )
}

/* ---------- Inputs ---------- */

export function Field({ label, error, hint, children }: { label: string; error?: string | false; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="label" style={!!error && { color: color.red }}>
          {label.toUpperCase()}
        </Text>
        {hint && <Text variant="tiny" style={tabular}>{hint}</Text>}
      </View>
      {children}
      {!!error && (
        <Text variant="tiny" accessibilityRole="alert" style={{ color: color.red, fontWeight: "500" }}>
          {error}
        </Text>
      )}
    </View>
  )
}

export function Input({ invalid, style, ...props }: TextInputProps & { invalid?: boolean }) {
  return (
    <TextInput
      placeholderTextColor={color.faint}
      {...props}
      style={[styles.input, props.multiline && { minHeight: 84, paddingTop: 10, textAlignVertical: "top" }, invalid && { borderColor: color.red, borderWidth: 2 }, style]}
    />
  )
}

/** −  12  +   with a typed value in the middle. */
export function Stepper({ value, onChange, min = 0, max = 99999, label }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string }) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  return (
    <View style={styles.stepper}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Less ${label}`} hitSlop={6} onPress={() => onChange(clamp(value - 1))} style={styles.stepBtn} disabled={value <= min}>
        <Minus size={16} color={value <= min ? color.faint : color.ink} />
      </Pressable>
      <TextInput
        accessibilityLabel={label}
        value={String(value)}
        keyboardType="number-pad"
        selectTextOnFocus
        onChangeText={(t) => onChange(clamp(Number(t.replace(/\D/g, "")) || 0))}
        style={styles.stepValue}
      />
      <Pressable accessibilityRole="button" accessibilityLabel={`More ${label}`} hitSlop={6} onPress={() => onChange(clamp(value + 1))} style={styles.stepBtn} disabled={value >= max}>
        <Plus size={16} color={value >= max ? color.faint : color.ink} />
      </Pressable>
    </View>
  )
}

/* ---------- Icon + value ---------- */

export function Meta({
  icon: Icon,
  children,
  style,
  textStyle,
}: {
  icon: LucideIcon
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}) {
  return (
    <View style={[styles.meta, style]}>
      <Icon size={14} color={color.faint} strokeWidth={2} />
      <RNText style={[styles.metaText, textStyle]} numberOfLines={1}>
        {children}
      </RNText>
    </View>
  )
}

export function MetaRow({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.metaRow, style]}>{children}</View>
}

/** A figure with its label under it, for summary strips. */
export function Stat({ value, label, tone }: { value: string; label: string; tone?: string }) {
  return (
    <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12 }}>
      <Text style={[{ fontSize: 20, fontWeight: "600", color: tone ?? color.ink, letterSpacing: -0.3 }, tabular]}>{value}</Text>
      <Text variant="tiny">{label}</Text>
    </View>
  )
}

export function StatStrip({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = React.Children.toArray(children).filter(Boolean)
  return (
    <View style={[styles.card, { flexDirection: "row" }, style]}>
      {items.map((c, i) => (
        <View key={i} style={[{ flex: 1 }, i > 0 && { borderLeftWidth: 1, borderLeftColor: color.rule }]}>
          {c}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  button: { height: 44, paddingHorizontal: 16, borderRadius: radius.control, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buttonText: { fontSize: 15, fontWeight: "600" },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", borderRadius: 5, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1 },
  tagText: { fontSize: font.tiny, fontWeight: "600" },
  card: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: radius.card },
  rule: { borderTopWidth: 1, borderTopColor: color.rule },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  section: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionText: { fontSize: font.tiny, fontWeight: "700", color: color.muted, letterSpacing: 0.6, textTransform: "uppercase" },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 32 },
  callout: { flexDirection: "row", gap: 10, borderRadius: radius.control, padding: 12 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  chipOn: { backgroundColor: color.ink, borderColor: color.ink },
  chipText: { fontSize: font.meta, fontWeight: "600", color: color.ink2 },
  chipCount: { fontSize: font.meta, color: color.faint, ...tabular },
  segTrack: { flexDirection: "row", gap: 3, padding: 3, borderRadius: radius.control + 2, backgroundColor: color.raised },
  seg: { flex: 1, height: 34, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderRadius: radius.control },
  segOn: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  segText: { fontSize: font.meta, fontWeight: "600", color: color.muted },
  input: { minHeight: 44, borderWidth: 1, borderColor: color.control, borderRadius: radius.control, backgroundColor: color.surface, paddingHorizontal: 12, fontSize: font.body, color: color.ink },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: color.control, borderRadius: radius.control, backgroundColor: color.surface, height: 40 },
  stepBtn: { width: 36, height: "100%", alignItems: "center", justifyContent: "center" },
  stepValue: { width: 56, textAlign: "center", fontSize: font.body, fontWeight: "600", color: color.ink, paddingVertical: 0, ...tabular },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  metaText: { fontSize: font.meta, color: color.muted, ...tabular, flexShrink: 1 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 12, rowGap: 4 },
})
